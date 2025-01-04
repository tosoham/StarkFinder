"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const starknet_1 = require("starknet");
const axios_1 = __importDefault(require("axios"));
const BOT_TOKEN = process.env.MY_TOKEN || "";
const BRIAN_API_KEY = process.env.BRIAN_API_KEY || "";
const BRIAN_DEFAULT_RESPONSE = "🤖 Sorry, I don't know how to answer. The AskBrian feature allows you to ask for information on a custom-built knowledge base of resources. Contact the Brian team if you want to add new resources!";
const BRIAN_API_URL = {
    knowledge: "https://api.brianknows.org/api/v0/agent/knowledge",
    parameters: "https://api.brianknows.org/api/v0/agent/parameters-extraction",
    transaction: "https://api.brianknows.org/api/v0/agent",
};
class StarknetWallet {
    constructor() {
        this.provider = new starknet_1.RpcProvider({
            nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
        });
    }
    createWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            const argentXaccountClassHash = "0x01b62931d27ba0fd2a370eccd1b4e0ffe304531097dd884d857554662befefef";
            const privateKeyAX = starknet_1.stark.randomAddress();
            const starkKeyPubAX = starknet_1.ec.starkCurve.getStarkKey(privateKeyAX);
            const AXConstructorCallData = starknet_1.CallData.compile({
                owner: starkKeyPubAX,
                guardian: "0",
            });
            const AXcontractAddress = starknet_1.hash.calculateContractAddressFromHash(starkKeyPubAX, argentXaccountClassHash, AXConstructorCallData, 0);
            const accountAX = new starknet_1.Account(this.provider, AXcontractAddress, privateKeyAX);
            const deployAccountPayload = {
                classHash: argentXaccountClassHash,
                constructorCalldata: AXConstructorCallData,
                contractAddress: AXcontractAddress,
                addressSalt: starkKeyPubAX,
            };
            const { transaction_hash: AXdAth, contract_address: AXcontractFinalAddress } = yield accountAX.deployAccount(deployAccountPayload);
            console.log("✅ ArgentX wallet deployed at:", AXcontractFinalAddress);
            return {
                account: accountAX,
                privateKey: privateKeyAX,
                publicKey: starkKeyPubAX,
                contractAddress: AXcontractFinalAddress
            };
        });
    }
    executeTransaction(account, transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const multicallTx = yield account.execute(transactions);
                yield account.waitForTransaction(multicallTx.transaction_hash);
                return multicallTx.transaction_hash;
            }
            catch (error) {
                console.error("Transaction execution error:", error);
                throw error;
            }
        });
    }
}
class StarknetTransactionHandler {
    constructor() {
        this.provider = new starknet_1.RpcProvider({
            nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
        });
        this.wallet = new StarknetWallet();
    }
    getTokenBalance(tokenAddress, userAddress) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const contract = new starknet_1.Contract(erc20Abi, tokenAddress, this.provider);
                const balance = yield contract.balanceOf(userAddress);
                return balance.toString();
            }
            catch (error) {
                console.error("Error getting token balance:", error);
                throw error;
            }
        });
    }
    processTransaction(brianResponse, privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = yield this.wallet.createWallet();
                const transactions = brianResponse.data.steps.map((step) => ({
                    contractAddress: step.contractAddress,
                    entrypoint: step.entrypoint,
                    calldata: step.calldata
                }));
                const txHash = yield this.wallet.executeTransaction(account.account, transactions);
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
            }
            catch (error) {
                console.error("Error processing transaction:", error);
                throw error;
            }
        });
    }
}
function formatBrianResponse(response) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function queryBrianAI(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(BRIAN_API_URL.knowledge, {
                prompt,
                kb: "starknet_kb"
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "x-brian-api-key": BRIAN_API_KEY,
                }
            });
            const answer = response.data.result.answer;
            if (answer === BRIAN_DEFAULT_RESPONSE) {
                return "I apologize, but I couldn't find specific information about that in my knowledge base.";
            }
            return answer;
        }
        catch (error) {
            console.error("Brian AI Error:", error);
            return "Sorry, I am unable to process your request at the moment.";
        }
    });
}
function processTransactionRequest(ctx, prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!ctx.session.connectedWallet || !ctx.session.privateKey) {
                const wallet = new StarknetWallet();
                const { account, privateKey, publicKey, contractAddress } = yield wallet.createWallet();
                ctx.session.connectedWallet = account.address;
                ctx.session.privateKey = privateKey;
                yield ctx.reply(`🔑 Wallet Automatically Created for Transaction
Address: \`${contractAddress}\``);
            }
            const response = yield fetch(BRIAN_API_URL.transaction, {
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
            const data = yield response.json();
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
        }
        catch (error) {
            console.error("Transaction processing error:", error);
            return ctx.reply("Error processing transaction. Please try again.");
        }
    });
}
// Initialize bot
const bot = new grammy_1.Bot(BOT_TOKEN);
// Initialize session
bot.use((0, grammy_1.session)({
    initial: () => ({
        pendingTransaction: null,
        mode: "none",
        lastActivity: Date.now(),
        groupChat: false
    })
}));
// Command handlers
bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply(`Welcome to StarkFinder! 🚀

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
}));
bot.command("wallet", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wallet = new StarknetWallet();
        const { account, privateKey, publicKey, contractAddress } = yield wallet.createWallet();
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
    }
    catch (error) {
        console.error("Wallet creation error:", error);
        return ctx.reply("Error creating wallet. Please try again.");
    }
}));
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
bot.on("message:text", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const messageText = ctx.message.text.trim();
    ctx.session.lastActivity = Date.now();
    if (messageText.toLowerCase() === "confirm" && ctx.session.pendingTransaction) {
        const handler = new StarknetTransactionHandler();
        try {
            const result = yield handler.processTransaction(ctx.session.pendingTransaction, ctx.session.privateKey);
            ctx.session.pendingTransaction = null;
            return ctx.reply(`Transaction Executed! 🎉
Hash: ${result.transactionHash}
View on Starkscan: https://starkscan.co/tx/${result.transactionHash}`);
        }
        catch (error) {
            return ctx.reply("Transaction failed. Please try again.");
        }
    }
    if (messageText.toLowerCase().includes("swap") ||
        messageText.toLowerCase().includes("transfer") ||
        messageText.toLowerCase().includes("send")) {
        return yield processTransactionRequest(ctx, messageText);
    }
    else {
        const response = yield queryBrianAI(messageText);
        const formattedResponse = yield formatBrianResponse(response);
        return ctx.reply(formattedResponse, { parse_mode: "Markdown" });
    }
}));
bot.catch((err) => {
    console.error("Bot error:", err);
});
bot.start();
