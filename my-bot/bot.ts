import { Bot, Context, session, SessionFlavor } from "grammy";
import { ASK_OPENAI_AGENT_PROMPT } from "./prompts/prompts";
import { Account, Contract, RpcProvider, stark, ec, hash, CallData } from "starknet";
import axios from "axios";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";

const BOT_TOKEN = process.env.MY_TOKEN || "";
const OPENAI_API_KEY = process.env.OPENAI || "";
const BRIAN_API_KEY = process.env.BRIAN_API_KEY || "";
const BRIAN_DEFAULT_RESPONSE = "🤖 Sorry, I don’t know how to answer. The AskBrian feature allows you to ask for information on a custom-built knowledge base of resources. Contact the Brian team if you want to add new resources!";
const BRIAN_API_URL = {
  knowledge: "https://api.brianknows.org/api/v0/agent/knowledge",
  parameters: "https://api.brianknows.org/api/v0/agent/parameters-extraction",
  transaction: "https://api.brianknows.org/api/v0/agent",
};

const askAgentPromptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system", ASK_OPENAI_AGENT_PROMPT
  ],
  [
    "user", "{user_query}"
  ]
]);

const agent = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.5,
  openAIApiKey: OPENAI_API_KEY
});

interface SessionData {
  pendingTransaction: any;
  mode: "ask" | "transaction" | "none";
  lastActivity: number;
  groupChat?: boolean;
  connectedWallet?: string;
  privateKey?: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

class StarknetWallet {
  private provider: RpcProvider;

  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
    });
  }

  async createWallet(): Promise<{
    account: Account,
    privateKey: string,
    publicKey: string,
    contractAddress: string
  }> {
    const argentXaccountClassHash = "0x01b62931d27ba0fd2a370eccd1b4e0ffe304531097dd884d857554662befefef";
    const privateKeyAX = stark.randomAddress();
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    
    const AXConstructorCallData = CallData.compile({
      owner: starkKeyPubAX,
      guardian: "0",
    });
    
    const AXcontractAddress = hash.calculateContractAddressFromHash(
      starkKeyPubAX,
      argentXaccountClassHash,
      AXConstructorCallData,
      0
    );

    const accountAX = new Account(this.provider, AXcontractAddress, privateKeyAX);
    
    const deployAccountPayload = {
      classHash: argentXaccountClassHash,
      constructorCalldata: AXConstructorCallData,
      contractAddress: AXcontractAddress,
      addressSalt: starkKeyPubAX,
    };
    
    const { transaction_hash: AXdAth, contract_address: AXcontractFinalAddress } =
      await accountAX.deployAccount(deployAccountPayload);
    
    console.log("✅ ArgentX wallet deployed at:", AXcontractFinalAddress);
    
    return {
      account: accountAX,
      privateKey: privateKeyAX,
      publicKey: starkKeyPubAX,
      contractAddress: AXcontractFinalAddress
    };
  }

  async executeTransaction(account: Account, transactions: any[]) {
    try {
      const multicallTx = await account.execute(transactions);
      await account.waitForTransaction(multicallTx.transaction_hash);
      return multicallTx.transaction_hash;
    } catch (error) {
      console.error("Transaction execution error:", error);
      throw error;
    }
  }
}

class StarknetTransactionHandler {
  private provider: RpcProvider;
  private wallet: StarknetWallet;

  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
    });
    this.wallet = new StarknetWallet();
  }

  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
      const erc20Abi = [
        {
          name: "balanceOf",
          type: "function",
          inputs: [{ name: "account", type: "felt" }],
          outputs: [{ name: "balance", type: "Uint256" }],
          stateMutability: "view"
        }
      ];

      const contract = new Contract(erc20Abi, tokenAddress, this.provider);
      const balance = await contract.balanceOf(userAddress);
      return balance.toString();
    } catch (error) {
      console.error("Error getting token balance:", error);
      throw error;
    }
  }

  async processTransaction(brianResponse: any, privateKey: string) {
    try {
      const account = await this.wallet.createWallet();
      const transactions = brianResponse.data.steps.map((step: any) => ({
        contractAddress: step.contractAddress,
        entrypoint: step.entrypoint,
        calldata: step.calldata
      }));

      const txHash = await this.wallet.executeTransaction(account.account, transactions);

      return {
        success: true,
        description: brianResponse.data.description,
        transactions,
        action: brianResponse.action,
        solver: brianResponse.solver,
        fromToken: brianResponse.data.fromToken,
        toToken: brianResponse.data.toToken,
        fromAmount: brianResponse.data.fromAmount,
        toAmount: brianResponse.data.toAmount,
        receiver: brianResponse.data.receiver,
        estimatedGas: brianResponse.data.gasCostUSD,
        transactionHash: txHash
      };
    } catch (error) {
      console.error("Error processing transaction:", error);
      throw error;
    }
  }
}

async function formatBrianResponse(response: string): Promise<string> {
  let formattedText = response.replace(/^"|"$/g, "").trim();
  formattedText = formattedText.replace(/(\n*)###\s*/g, "\n\n### ");
  formattedText = formattedText.replace(/### ([\w\s&()-]+)/g, "### **$1**");
  formattedText = formattedText.replace(/\n{3,}/g, "\n\n");
  
  const keyTerms = [
    "Layer 2",
    "zk-rollups",
    "Cairo",
    "DeFi",
    "Web3",
    "dApps"
  ];
  
  keyTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b(?![^<]*>)`, "g");
    formattedText = formattedText.replace(regex, `_${term}_`);
  });
  
  return formattedText;
}

async function queryOpenAI(userQuery: string): Promise<string> {
  try {
    const prompt = askAgentPromptTemplate;
    const chain = prompt.pipe(agent)
    const response = await chain.invoke({user_query: userQuery});
    return response.content as string;
  } catch (error) {
    console.error('OpenAI Error:', error);
    return 'Sorry, I am unable to process your request at the moment.';
  }
}

async function queryBrianAI(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      BRIAN_API_URL.knowledge,
      {
        prompt,
        kb: "starknet_kb"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-brian-api-key": BRIAN_API_KEY,
        }
      }
    );
    const answer = response.data.result.answer;
    if (answer === BRIAN_DEFAULT_RESPONSE) {
      return await queryOpenAI(prompt);
    }
    return answer;
  } catch (error) {
    console.error("Brian AI Error:", error);
    return "Sorry, I am unable to process your request at the moment.";
  }
}

async function processTransactionRequest(ctx: MyContext, prompt: string) {
  try {
    if (!ctx.session.connectedWallet || !ctx.session.privateKey) {
      const wallet = new StarknetWallet();
      const { account, privateKey, publicKey, contractAddress } = await wallet.createWallet();
      
      ctx.session.connectedWallet = account.address;
      ctx.session.privateKey = privateKey;
      
      await ctx.reply(`🔑 Wallet Automatically Created for Transaction
Address: \`${contractAddress}\``);
    }

    const response = await fetch(BRIAN_API_URL.transaction, {
      method: "POST",
      headers: {
        "X-Brian-Api-Key": BRIAN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        address: ctx.session.connectedWallet,
        chainId: "4012",
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      return ctx.reply(data.error || "Failed to process transaction request");
    }

    const txPreview = `Transaction Preview:
Type: ${data.result[0].action}
${data.result[0].data.fromToken ? `From: ${data.result[0].data.fromAmount} ${data.result[0].data.fromToken.symbol}` : ""}
${data.result[0].data.toToken ? `To: ${data.result[0].data.toAmount} ${data.result[0].data.toToken.symbol}` : ""}
${data.result[0].data.receiver ? `Receiver: ${data.result[0].data.receiver}` : ""}
Estimated Gas: ${data.result[0].data.gasCostUSD || "Unknown"} USD

Reply with "confirm" to execute this transaction.`;

    ctx.session.pendingTransaction = data.result[0];
    return ctx.reply(txPreview);
  } catch (error) {
    console.error("Transaction processing error:", error);
    return ctx.reply("Error processing transaction. Please try again.");
  }
}

// Initialize bot
const bot = new Bot<MyContext>(BOT_TOKEN);

// Initialize session
bot.use(session({
  initial: (): SessionData => ({
    pendingTransaction: null,
    mode: "none",
    lastActivity: Date.now(),
    groupChat: false
  })
}));

// Command handlers
bot.command("start", async (ctx) => {
  await ctx.reply(`Welcome to StarkFinder! 🚀

I can help you with:
1️⃣ Starknet Information - Just ask any question!
2️⃣ Transaction Processing - Connect wallet and describe what you want to do
3️⃣ Token Balances - Check your token balances

Commands:
/wallet - Create a new wallet
/balance [token_address] - Check token balance
/txn <description> - Create a transaction
/help - Show detailed help

Just type naturally - no need to use commands for every interaction!`);
});

bot.command("wallet", async (ctx) => {
  try {
    const wallet = new StarknetWallet();
    const { account, privateKey, publicKey, contractAddress } = await wallet.createWallet();
    
    ctx.session.connectedWallet = account.address;
    ctx.session.privateKey = privateKey;
    
    return ctx.reply(`🚀 New Wallet Created!

*Wallet Details:*
• Address: \`${contractAddress}\`
• Public Key: \`${publicKey}\`

⚠️ *IMPORTANT*:
1. Save your private key securely
2. Do not share your private key with anyone
3. This is a one-time display of your keys

Your wallet is now ready for transactions!`, {
      parse_mode: "Markdown"
    });
  } catch (error) {
    console.error("Wallet creation error:", error);
    return ctx.reply("Error creating wallet. Please try again.");
  }
});

bot.command("txn", (ctx) => {
    return ctx.reply(`🚀 Transaction Processing via Mini App 📱
  
  To create and execute transactions, please use our Telegram Mini App: [AppLink](https://t.me/strkfinder1511_bot/strk_1511)
  
  🔗 Open StarkFinder Mini App
  - Tap the button in the chat or visit @starkfinderbot
  - Navigate to the Transactions section
  - Follow the guided transaction flow
  
  Benefits of Mini App:
  ✅ Secure transaction preview
  ✅ Real-time gas estimation
  ✅ Multi-step transaction support
  ✅ User-friendly interface
  
  Need help? Contact our support team!`);
  });
  
// Message handler
bot.on("message:text", async (ctx) => {
  const messageText = ctx.message.text.trim();
  ctx.session.lastActivity = Date.now();

  if (messageText.toLowerCase() === "confirm" && ctx.session.pendingTransaction) {
    const handler = new StarknetTransactionHandler();
    try {
      const result = await handler.processTransaction(
        ctx.session.pendingTransaction,
        ctx.session.privateKey!
      );
      ctx.session.pendingTransaction = null;
      
      return ctx.reply(`Transaction Executed! 🎉
Hash: ${result.transactionHash}
View on Starkscan: https://starkscan.co/tx/${result.transactionHash}`);
    } catch (error) {
      return ctx.reply("Transaction failed. Please try again.");
    }
  }

  if (messageText.toLowerCase().includes("swap") || 
      messageText.toLowerCase().includes("transfer") ||
      messageText.toLowerCase().includes("send")) {
    return await processTransactionRequest(ctx, messageText);
  } else {
    const response = await queryBrianAI(messageText);
    const formattedResponse = await formatBrianResponse(response);
    return ctx.reply(formattedResponse, { parse_mode: "Markdown" });
  }
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start();