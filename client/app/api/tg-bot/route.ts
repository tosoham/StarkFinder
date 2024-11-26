/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// import { NextRequest, NextResponse } from 'next/server'
// import axios, { AxiosError, AxiosResponse } from 'axios'
// import { Provider } from 'starknet'

// /* eslint-disable @typescript-eslint/no-unused-vars */

// interface Message {
//   chat: {
//     id: number
//     type?: 'private' | 'group' | 'supergroup'
//   }
//   from?: {
//     id: number
//     username?: string
//   }
//   text?: string
// }

// interface ChatMemberUpdate {
//   chat: {
//     id: number
//   }
//   from: {
//     id: number
//     username?: string
//   }
//   new_chat_member: {
//     status: 'member' | 'kicked' | 'left' | 'banned'
//     user: {
//       id: number
//       username?: string
//     }
//   }
// }

// interface TelegramUpdate {
//   message?: Message
//   my_chat_member?: ChatMemberUpdate
// }

// interface TelegramError {
//   description?: string
//   error_code?: number
// }

// interface BrianAIResponse {
//   result: {
//     answer: string
//     completion?: string
//   }
// }

// interface BrianStep {
//   approve?: {
//     contractAddress: string
//     entrypoint: string
//     calldata: string[]
//   }
//   transactionData?: {
//     contractAddress: string
//     entrypoint: string
//     calldata: string[]
//   }
//   contractAddress?: string
//   entrypoint?: string
//   calldata?: string[]
// }

// interface BrianToken {
//   address: string
//   symbol: string
//   decimals: number
// }

// interface BrianTransactionData {
//   description: string
//   steps: BrianStep[]
//   fromToken?: BrianToken
//   toToken?: BrianToken
//   fromAmount?: string
//   toAmount?: string
//   receiver?: string
//   amountToApprove?: string
//   gasCostUSD?: string
// }

// interface BrianResponse {
//   solver: string
//   action: 'swap' | 'transfer' | 'deposit'
//   type: 'write'
//   data: BrianTransactionData
// }

// interface UserState {
//   mode: 'ask' | 'transaction' | 'none'
//   lastActivity: number
//   groupChat?: boolean
//   connectedWallet?: string
// }

// interface UserStates {
//   [key: string]: UserState
// }

// type CommandHandler = {
//   execute: (messageObj: Message, input?: string) => Promise<AxiosResponse>
//   requiresInput: boolean
//   prompt?: string
// }

// interface WebhookResponse {
//   ok: boolean
//   error?: string
// }

// interface WebhookSetupResponse {
//   ok: boolean
//   result?: unknown
//   error?: string
// }

// const userStates: UserStates = {}
// const TIMEOUT = 30 * 60 * 1000

// const MY_TOKEN = process.env.MY_TOKEN || ''
// const BOT_USERNAME = process.env.BOT_USERNAME || ''
// const BRIAN_API_KEY = process.env.BRIAN_API_KEY || ''
// const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`
// const BRIAN_API_URL = {
//   knowledge: 'https://api.brianknows.org/api/v0/agent/knowledge',
//   parameters: 'https://api.brianknows.org/api/v0/agent/parameters-extraction',
//   transaction: 'https://api.brianknows.org/api/v0/agent/transaction'
// }

// const axiosInstance = {
//   get: async (method: string, params: Record<string, unknown>): Promise<AxiosResponse> => {
//     try {
//       const response = await axios.get(`${BASE_URL}/${method}`, { params })
//       return response
//     } catch (error) {
//       const axiosError = error as AxiosError<TelegramError>
//       console.error(`Axios GET error for method ${method}:`, axiosError.response?.data || axiosError.message)
//       throw error
//     }
//   }
// }

// function convertMarkdownToTelegramMarkdown(text: string): string {
//   return text.split("\n").map(line => {
//     line = line.trim()
//     if (line.startsWith("# ")) return `*${line.slice(2)}*`
//     if (line.startsWith("## ")) return `*${line.slice(3)}*`
//     if (line.startsWith("### ")) return `\`${line.slice(4)}\``
//     if (line.startsWith("#### ")) return `\`${line.slice(4)}\``
//     return line.replace(/([^]+)/g, "$1")
//   }).join("\n")
// }

// function getUserKey(messageObj: Message): string {
//   return `${messageObj.chat.id}_${messageObj.from?.id}`
// }

// function isGroupChat(messageObj: Message): boolean {
//   return messageObj.chat.type === 'group' || messageObj.chat.type === 'supergroup'
// }

// function cleanupInactiveUsers(): void {
//   const now = Date.now()
//   Object.entries(userStates).forEach(([key, state]) => {
//     if (now - state.lastActivity > TIMEOUT) {
//       delete userStates[key]
//     }
//   })
// }

// async function sendMessage(messageObj: Message, messageText: string): Promise<AxiosResponse> {
//   try {
//     const result = await axiosInstance.get('sendMessage', {
//       chat_id: messageObj.chat.id,
//       text: messageText,
//       parse_mode: 'Markdown',
//     })
//     console.log('Message sent successfully:', messageText)
//     return result
//   } catch (error) {
//     const axiosError = error as AxiosError<TelegramError>
//     console.error('Send Message Error:', axiosError.response?.data || axiosError.message)
//     throw error
//   }
// }

// async function queryBrianAI(prompt: string): Promise<string> {
//   try {
//     const response = await axios.post<BrianAIResponse>(
//       BRIAN_API_URL.knowledge,
//       {
//         prompt,
//         kb: 'starknet_kb'
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'x-brian-api-key': BRIAN_API_KEY,
//         }
//       }
//     )
//     return response.data.result.answer
//   } catch (error) {
//     const axiosError = error as AxiosError
//     console.error('Brian AI Error:', axiosError.response?.data || axiosError.message)
//     return 'Sorry, I am unable to process your request at the moment.'
//   }
// }

// class StarknetTransactionHandler {
//   private provider: Provider;

  // constructor() {
  //   this.provider = new Provider({
  //     nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
  //   });
  // }

//   async processTransaction(response: BrianResponse) {
//     try {
//       if (!response.data.steps || response.data.steps.length === 0) {
//         throw new Error('No transaction steps found in response')
//       }

//       const transactions = []

//       for (const step of response.data.steps) {
//         if (step.approve) {
//           transactions.push({
//             contractAddress: step.approve.contractAddress,
//             entrypoint: step.approve.entrypoint,
//             calldata: step.approve.calldata
//           })
//         }

//         if (step.transactionData) {
//           transactions.push({
//             contractAddress: step.transactionData.contractAddress,
//             entrypoint: step.transactionData.entrypoint,
//             calldata: step.transactionData.calldata
//           })
//         }

//         if (step.contractAddress && step.entrypoint && step.calldata) {
//           transactions.push({
//             contractAddress: step.contractAddress,
//             entrypoint: step.entrypoint,
//             calldata: step.calldata
//           })
//         }
//       }

//       return {
//         success: true,
//         description: response.data.description,
//         transactions,
//         action: response.action,
//         solver: response.solver,
//         fromToken: response.data.fromToken,
//         toToken: response.data.toToken,
//         fromAmount: response.data.fromAmount,
//         toAmount: response.data.toAmount,
//         receiver: response.data.receiver,
//         estimatedGas: response.data.gasCostUSD
//       }
//     } catch (error) {
//       console.error('Error processing transaction:', error)
//       throw error
//     }
//   }
// }

// async function processTransactionRequest(messageObj: Message, prompt: string): Promise<AxiosResponse> {
//   try {
//     const userKey = getUserKey(messageObj)
//     const address = userStates[userKey]?.connectedWallet

//     if (!address) {
//       return sendMessage(messageObj, 'Please connect your wallet first using /connect <wallet_address>')
//     }

//     const brianResponse = await fetch(BRIAN_API_URL.transaction, {
//       method: 'POST',
//       headers: {
//         'X-Brian-Api-Key': BRIAN_API_KEY,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         prompt,
//         address,
//         chainId: '4012',
//       }),
//     })

//     const data = await brianResponse.json()
    
//     if (!brianResponse.ok) {
//       return sendMessage(messageObj, `Transaction Error: ${data.error || 'Unknown error'}`)
//     }

//     const handler = new StarknetTransactionHandler()
//     const processedTx = await handler.processTransaction(data.result[0])

//     const txDetails = `Transaction Summary:
// Description: ${processedTx.description}
// Type: ${processedTx.action}
// ${processedTx.fromToken ? `From: ${processedTx.fromAmount} ${processedTx.fromToken.symbol}` : ''}
// ${processedTx.toToken ? `To: ${processedTx.toAmount} ${processedTx.toToken.symbol}` : ''}
// ${processedTx.receiver ? `Receiver: ${processedTx.receiver}` : ''}
// Estimated Gas: ${processedTx.estimatedGas || 'Unknown'} USD

// Reply with "confirm" to execute this transaction.`

//     return sendMessage(messageObj, txDetails)
//   } catch (error) {
//     console.error('Transaction processing error:', error)
//     return sendMessage(messageObj, 'Error processing transaction. Please try again.')
//   }
// }

// const commandHandlers: Record<string, CommandHandler> = {
//   start: {
//     execute: async (messageObj) => 
//       sendMessage(messageObj, `Welcome to StarkFinder! 🚀

// I can help you with:
// 1️⃣ Starknet Information - Just ask any question!
// 2️⃣ Transaction Processing - Describe what you want to do
// 3️⃣ Wallet Connection - Use /connect to get started

// No need to use commands repeatedly - just type naturally!

// Type /help for detailed information.`),
//     requiresInput: false
//   },
//   help: {
//     execute: async (messageObj) =>
//       sendMessage(messageObj, `StarkFinder Bot Guide 📚

// 🔍 Information Mode:
// • Just ask any question about Starknet
// • Example: "How do accounts work?"
// • Example: "What is Cairo?"

// 💰 Transaction Mode:
// • First connect wallet: /connect <address>
// • Then describe your transaction
// • Example: "Swap 100 ETH for USDC"
// • Example: "Send 50 USDC to 0x..."

// ⚙️ Features:
// • Smart mode detection - no commands needed
// • Natural language processing
// • Automatic gas estimation
// • Transaction preview before execution

// ${isGroupChat(messageObj) ? `\n🏢 Group Chat:
// • Mention me (@${BOT_USERNAME}) in your message
// • Example: "@${BOT_USERNAME} what is starknet?"` : ''}

// Need more help? Join @starkfindergroup`),
//     requiresInput: false
//   },
//   connect: {
//     execute: async (messageObj, input) => {
//       if (!input) return sendMessage(messageObj, 'Please provide your wallet address.')
//       const userKey = getUserKey(messageObj)
//       userStates[userKey] = {
//         ...userStates[userKey] || {},
//         connectedWallet: input,
//         mode: 'none',
//         lastActivity: Date.now(),
//         groupChat: isGroupChat(messageObj)
//       }
//       return sendMessage(messageObj, `✅ Connected to wallet: \`${input}\`\n\nYou can now use transaction features! Just describe what you want to do.`)
//     },
//     requiresInput: true,
//     prompt: 'Please provide your wallet address.'
//   },
//   ask: {
//     execute: async (messageObj, input) => {
//       const userKey = getUserKey(messageObj)
//       userStates[userKey] = {
//         ...userStates[userKey] || {},
//         mode: 'ask',
//         lastActivity: Date.now(),
//         groupChat: isGroupChat(messageObj)
//       }
      
//       if (!input) {
//         return sendMessage(messageObj, 'Ask me anything about Starknet! No need to use /ask again.')
//       }
      
//       const response = await queryBrianAI(input)
//       return sendMessage(messageObj, convertMarkdownToTelegramMarkdown(response))
//     },
//     requiresInput: false
//   },
//   tx: {
//     execute: async (messageObj, input) => {
//       const userKey = getUserKey(messageObj)
//       if (!userStates[userKey]?.connectedWallet) {
//         return sendMessage(messageObj, 'Please connect your wallet first using /connect <wallet_address>')
//       }

//       userStates[userKey] = {
//         ...userStates[userKey],
//         mode: 'transaction',
//         lastActivity: Date.now(),
//         groupChat: isGroupChat(messageObj)
//       }

//       if (!input) {
//         return sendMessage(messageObj, 'Describe your transaction (e.g., "Swap 100 ETH for USDC" or "Send 50 USDC to 0x...")')
//       }

//       return await processTransactionRequest(messageObj, input)
//     },
//     requiresInput: false
//   },
//   stop: {
//     execute: async (messageObj) => {
//       const userKey = getUserKey(messageObj)
//       if (userStates[userKey]) {
//         const prevMode = userStates[userKey].mode
//         userStates[userKey].mode = 'none'
//         return sendMessage(messageObj, `Mode reset. You can still ask questions or request transactions naturally!`)
//       }
//       return sendMessage(messageObj, 'No active mode to stop.')
//     },
//     requiresInput: false
//   }
// }

// async function handleMessage(messageObj: Message): Promise<AxiosResponse> {
//   try {
//     if (!messageObj?.from?.id) throw new Error('Invalid message object')
    
//     const userKey = getUserKey(messageObj)
//     const messageText = messageObj.text?.trim() || ''
//     const userState = userStates[userKey]
    
//     cleanupInactiveUsers()

//     if (messageText.startsWith('/')) {
//       const [command, ...args] = messageText.substring(1).split(' ')
//       const input = args.join(' ')
//       const handler = commandHandlers[command.toLowerCase()]

//       if (!handler) {
//         return await sendMessage(messageObj, 'Invalid command. Type /help for available commands.')
//       }

//       return await handler.execute(messageObj, input)
//     }

//     if (userState) {
//       userState.lastActivity = Date.now()

//       if (userState.groupChat && !messageText.includes(`@${BOT_USERNAME}`)) {
//         return Promise.resolve({} as AxiosResponse)
//       }

//       const cleanText = userState.groupChat ? 
//         messageText.replace(`@${BOT_USERNAME}`, '').trim() : messageText

//       if (cleanText.toLowerCase() === 'confirm' && userState.mode === 'transaction') {
//         return sendMessage(messageObj, 'Transaction execution is not yet implemented. This would execute the transaction.')
//       }

//       switch (userState.mode) {
//         case 'ask':
//           const response = await queryBrianAI(cleanText)
//           return sendMessage(messageObj, convertMarkdownToTelegramMarkdown(response))
//         case 'transaction':
//           return await processTransactionRequest(messageObj, cleanText)
//         default:
//           if (userState.connectedWallet && (
//             cleanText.toLowerCase().includes('swap') || 
//             cleanText.toLowerCase().includes('transfer') ||
//             cleanText.toLowerCase().includes('send'))) {
//             return await processTransactionRequest(messageObj, cleanText)
//           } else {
//             const response = await queryBrianAI(cleanText)
//             return sendMessage(messageObj, convertMarkdownToTelegramMarkdown(response))
//           }
//       }
//     } else {
//       if (messageText.toLowerCase().includes('swap') || 
//         messageText.toLowerCase().includes('transfer') ||
//         messageText.toLowerCase().includes('send')) {
//         return sendMessage(messageObj, 'Please connect your wallet first using /connect <wallet_address>')
//       } else {
//         const response = await queryBrianAI(messageText)
//         return sendMessage(messageObj, convertMarkdownToTelegramMarkdown(response))
//       }
//     }
//   } catch (error) {
//     console.error('Handle Message Error:', error)
//     return sendMessage(messageObj, 'An error occurred. Please try again.')
//   }
// }

// async function handleChatMemberUpdate(update: ChatMemberUpdate): Promise<void> {
//   const { status } = update.new_chat_member
//   const { id: chatId } = update.chat
//   const { id: userId, username = 'Unknown' } = update.from

//   console.log(`Chat member update - Status: ${status}, Chat ID: ${chatId}, User: ${username}`)

//   if (['kicked', 'left', 'banned'].includes(status)) {
//     console.log(`User ${username} (${userId}) has stopped/blocked/deleted the bot in chat ${chatId}`)
//     const userKey = `${chatId}_${userId}`
//     delete userStates[userKey]
//   }
// }

// export async function POST(req: NextRequest): Promise<NextResponse<WebhookResponse>> {
//   try {
//     console.log('Received webhook POST request')
    
//     const body = await req.json() as TelegramUpdate
    
//     if (!body) {
//       console.error('No body received')
//       return NextResponse.json({ ok: false, error: 'No body received' }, { status: 200 })
//     }
    
//     console.log('Received update:', JSON.stringify(body, null, 2))
    
//     if (body.message) {
//       await handleMessage(body.message)
//       return NextResponse.json({ ok: true }, { status: 200 })
//     } 
    
//     if (body.my_chat_member) {
//       await handleChatMemberUpdate(body.my_chat_member)
//       return NextResponse.json({ ok: true }, { status: 200 })
//     }
    
//     return NextResponse.json({ ok: true }, { status: 200 })
//   } catch (error) {
//     console.error('Webhook Error:', (error as Error).message)
//     return NextResponse.json({ 
//       ok: false, 
//       error: (error as Error).message 
//     }, { status: 200 })
//   }
// }

// export async function GET(req: NextRequest): Promise<NextResponse<WebhookSetupResponse>> {
//   try {
//     console.log('Received webhook GET request')
//     const WEBHOOK_URL = 'https://stark-finder-6bfzwbu15-poulavbhowmick03s-projects.vercel.app/api/tg-bot'
    
//     const response = await axios.post(
//       `${BASE_URL}/setWebhook`,
//       { 
//         url: WEBHOOK_URL,
//         allowed_updates: ["message", "callback_query", "my_chat_member"]
//       }
//     )
    
//     console.log('Webhook setup response:', response.data)
//     return NextResponse.json(response.data)
//   } catch (error) {
//     const axiosError = error as AxiosError
//     console.error('Webhook Setup Error:', axiosError.response?.data || axiosError.message)
//     return NextResponse.json({ 
//       ok: false,
//       error: axiosError.message 
//     }, { status: 200 })
//   }
// }


// app/api/tg-bot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Account, Contract, Provider, constants } from "starknet";
import axios, { AxiosError, AxiosResponse } from 'axios';

class StarknetWallet {
  private provider: Provider;

  constructor() {
    this.provider = new Provider({
      nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
    });
  }

  async createAccount(privateKey: string): Promise<Account> {
    return new Account(this.provider, privateKey, privateKey);
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

interface Message {
  chat: {
    id: number;
    type?: 'private' | 'group' | 'supergroup';
  };
  from?: {
    id: number;
    username?: string;
  };
  text?: string;
}

interface ChatMemberUpdate {
  chat: {
    id: number;
  };
  from: {
    id: number;
    username?: string;
  };
  new_chat_member: {
    status: 'member' | 'kicked' | 'left' | 'banned';
    user: {
      id: number;
      username?: string;
    };
  };
}

interface TelegramUpdate {
  message?: Message;
  my_chat_member?: ChatMemberUpdate;
}

interface UserState {
  pendingTransaction: any;
  mode: 'ask' | 'transaction' | 'none';
  lastActivity: number;
  groupChat?: boolean;
  connectedWallet?: string;
  privateKey?: string;
}

interface UserStates {
  [key: string]: UserState;
}

type CommandHandler = {
  execute: (messageObj: Message, input?: string) => Promise<AxiosResponse>;
  requiresInput: boolean;
  prompt?: string;
}

const userStates: UserStates = {};
const TIMEOUT = 30 * 60 * 1000;

const MY_TOKEN = process.env.MY_TOKEN || '';
const BOT_USERNAME = process.env.BOT_USERNAME || '';
const BRIAN_API_KEY = process.env.BRIAN_API_KEY || '';
const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`;
const BRIAN_API_URL = {
  knowledge: 'https://api.brianknows.org/api/v0/agent/knowledge',
  parameters: 'https://api.brianknows.org/api/v0/agent/parameters-extraction',
  transaction: 'https://api.brianknows.org/api/v0/agent'
};

class StarknetTransactionHandler {
  private provider: Provider;
  private wallet: StarknetWallet;

  constructor() {
    this.provider = new Provider({
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
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  async processTransaction(brianResponse: any, privateKey: string) {
    try {
      const account = await this.wallet.createAccount(privateKey);
      const transactions = brianResponse.data.steps.map((step: any) => ({
        contractAddress: step.contractAddress,
        entrypoint: step.entrypoint,
        calldata: step.calldata
      }));

      const txHash = await this.wallet.executeTransaction(account, transactions);

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
      console.error('Error processing transaction:', error);
      throw error;
    }
  }
}

const axiosInstance = {
  get: async (method: string, params: Record<string, unknown>): Promise<AxiosResponse> => {
    try {
      const response = await axios.get(`${BASE_URL}/${method}`, { params });
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Axios GET error for method ${method}:`, axiosError.response?.data || axiosError.message);
      throw error;
    }
  }
};

function getUserKey(messageObj: Message): string {
  return `${messageObj.chat.id}_${messageObj.from?.id}`;
}

function isGroupChat(messageObj: Message): boolean {
  return messageObj.chat.type === 'group' || messageObj.chat.type === 'supergroup';
}

async function sendMessage(messageObj: Message, messageText: string): Promise<AxiosResponse> {
  try {
    const result = await axiosInstance.get('sendMessage', {
      chat_id: messageObj.chat.id,
      text: messageText,
      parse_mode: 'Markdown',
    });
    return result;
  } catch (error) {
    console.error('Send Message Error:', error);
    throw error;
  }
}

async function queryBrianAI(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      BRIAN_API_URL.knowledge,
      {
        prompt,
        kb: 'starknet_kb'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-brian-api-key': BRIAN_API_KEY,
        }
      }
    );
    return response.data.result.answer;
  } catch (error) {
    console.error('Brian AI Error:', error);
    return 'Sorry, I am unable to process your request at the moment.';
  }
}

async function processTransactionRequest(messageObj: Message, prompt: string): Promise<AxiosResponse> {
  try {
    const userKey = getUserKey(messageObj);
    const userState = userStates[userKey];

    if (!userState?.connectedWallet || !userState?.privateKey) {
      return sendMessage(messageObj, 'Please connect your wallet first using /wallet <private_key>');
    }

    const response = await fetch(BRIAN_API_URL.transaction, {
      method: 'POST',
      headers: {
        'X-Brian-Api-Key': BRIAN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        address: userState.connectedWallet,
        chainId: '4012',
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      return sendMessage(messageObj, data.error || 'Failed to process transaction request');
    }

    // Preview transaction first
    const txPreview = `Transaction Preview:
Type: ${data.result[0].action}
${data.result[0].data.fromToken ? `From: ${data.result[0].data.fromAmount} ${data.result[0].data.fromToken.symbol}` : ''}
${data.result[0].data.toToken ? `To: ${data.result[0].data.toAmount} ${data.result[0].data.toToken.symbol}` : ''}
${data.result[0].data.receiver ? `Receiver: ${data.result[0].data.receiver}` : ''}
Estimated Gas: ${data.result[0].data.gasCostUSD || 'Unknown'} USD

Reply with "confirm" to execute this transaction.`;

    userStates[userKey].pendingTransaction = data.result[0];
    return sendMessage(messageObj, txPreview);

  } catch (error) {
    console.error('Transaction processing error:', error);
    return sendMessage(messageObj, 'Error processing transaction. Please try again.');
  }
}

const commandHandlers: Record<string, CommandHandler> = {
  start: {
    execute: async (messageObj) => 
      sendMessage(messageObj, `Welcome to StarkFinder! 🚀

I can help you with:
1️⃣ Starknet Information - Just ask any question!
2️⃣ Transaction Processing - Connect wallet and describe what you want to do
3️⃣ Token Balances - Check your token balances

Commands:
/wallet <private_key> - Connect your wallet
/balance [token_address] - Check token balance
/tx <description> - Create a transaction
/help - Show detailed help

Just type naturally - no need to use commands for every interaction!`),
    requiresInput: false
  },

  wallet: {
    execute: async (messageObj, input) => {
      if (!input) {
        return sendMessage(messageObj, 'Please provide your private key to connect wallet.');
      }

      try {
        const wallet = new StarknetWallet();
        const account = await wallet.createAccount(input);
        
        const userKey = getUserKey(messageObj);
        userStates[userKey] = {
          ...userStates[userKey] || {},
          connectedWallet: account.address,
          privateKey: input,
          mode: 'none',
          lastActivity: Date.now(),
          groupChat: isGroupChat(messageObj)
        };

        return sendMessage(messageObj, `✅ Wallet connected!\nAddress: ${account.address}\n\nYou can now execute transactions and check balances.`);
      } catch (error) {
        return sendMessage(messageObj, 'Invalid private key or connection error. Please try again.');
      }
    },
    requiresInput: true,
    prompt: 'Please provide your private key.'
  },

  balance: {
    execute: async (messageObj, input) => {
      const userKey = getUserKey(messageObj);
      const userState = userStates[userKey];

      if (!userState?.connectedWallet) {
        return sendMessage(messageObj, 'Please connect your wallet first using /wallet <private_key>');
      }

      try {
        const handler = new StarknetTransactionHandler();
        // Use the ETH contract address if no token address is provided
        const ETH_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
        const balance = await handler.getTokenBalance(
          input || ETH_ADDRESS,
          userState.connectedWallet
        );

        const tokenSymbol = input ? 'tokens' : 'ETH';
        return sendMessage(messageObj, `Balance: ${balance} ${tokenSymbol}`);
      } catch (error) {
        return sendMessage(messageObj, 'Error getting token balance. Please try again.');
      }
    },
    requiresInput: false
  },
  
  help: {
    execute: async (messageObj) =>
      sendMessage(messageObj, `StarkFinder Bot Guide 📚

🔍 Information Mode:
• Ask any question about Starknet
• Example: "How do accounts work?"
• Example: "What is Cairo?"

💰 Transaction Mode:
• First connect wallet: /wallet <private_key>
• Then describe your transaction
• Example: "Swap 100 ETH for USDC"
• Example: "Send 50 USDC to 0x..."

💳 Wallet Commands:
• /wallet <private_key> - Connect wallet
• /balance [token_address] - Check balance
• /tx <description> - Create transaction

⚙️ Features:
• Natural language processing
• Transaction preview
• Gas estimation
• Balance checking

Need more help? Join our support group!`),
    requiresInput: false
  },
};

async function handleMessage(messageObj: Message): Promise<AxiosResponse> {
  try {
    if (!messageObj?.from?.id) throw new Error('Invalid message object');
    
    const userKey = getUserKey(messageObj);
    const messageText = messageObj.text?.trim() || '';
    const userState = userStates[userKey];

    if (messageText.startsWith('/')) {
      const [command, ...args] = messageText.substring(1).split(' ');
      const input = args.join(' ');
      const handler = commandHandlers[command.toLowerCase()];

      if (!handler) {
        return await sendMessage(messageObj, 'Invalid command. Type /help for available commands.');
      }

      return await handler.execute(messageObj, input);
    }

    if (userState) {
      userState.lastActivity = Date.now();

      if (messageText.toLowerCase() === 'confirm' && userState.pendingTransaction) {
        const handler = new StarknetTransactionHandler();
        try {
          const result = await handler.processTransaction(userState.pendingTransaction, userState.privateKey!);
          delete userState.pendingTransaction;
          
          return sendMessage(messageObj, `Transaction Executed! 🎉
Hash: ${result.transactionHash}
View on Starkscan: https://starkscan.co/tx/${result.transactionHash}`);
        } catch (error) {
          return sendMessage(messageObj, 'Transaction failed. Please try again.');
        }
      }

      if (messageText.toLowerCase().includes('swap') || 
          messageText.toLowerCase().includes('transfer') ||
          messageText.toLowerCase().includes('send')) {
        return await processTransactionRequest(messageObj, messageText);
      } else {
        const response = await queryBrianAI(messageText);
        return sendMessage(messageObj, response);
      }
    } else {
      // New user, create state and handle message
      userStates[userKey] = {
        pendingTransaction: null,
        mode: 'none',
        lastActivity: Date.now(),
        groupChat: isGroupChat(messageObj)
      };
      
      const response = await queryBrianAI(messageText);
      return sendMessage(messageObj, response);
    }
  } catch (error) {
    console.error('Handle Message Error:', error);
    return sendMessage(messageObj, 'An error occurred. Please try again.');
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as TelegramUpdate;
    
    if (!body) {
      return NextResponse.json({ ok: false, error: 'No body received' });
    }
    
    if (body.message) {
      await handleMessage(body.message);
    } 
    
    if (body.my_chat_member) {
      // Handle member updates if needed
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: (error as Error).message 
    });
  }
}