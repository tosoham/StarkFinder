/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/tg-bot/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError, AxiosResponse } from 'axios'

// Types and Interfaces
interface UserState {
    mode: 'ask' | 'transaction' | 'none'
    lastActivity: number
    groupChat?: boolean
}

interface UserStates {
    [key: string]: UserState
}

interface Message {
    chat: {
        id: number
        type?: 'private' | 'group' | 'supergroup'
    }
    from?: {
        id: number
        username?: string
    }
    text?: string
}

interface ChatMemberUpdate {
    chat: {
        id: number
    }
    from: {
        id: number
        username?: string
    }
    new_chat_member: {
        status: 'member' | 'kicked' | 'left' | 'banned'
        user: {
            id: number
            username?: string
        }
    }
}

interface TelegramUpdate {
    message?: Message
    my_chat_member?: ChatMemberUpdate
}

interface BrianAIResponse {
    result: {
        answer: string
        completion?: string
    }
}

interface TelegramError {
    description?: string
    error_code?: number
}

interface WebhookResponse {
    ok: boolean
    error?: string
}

interface WebhookSetupResponse {
    ok: boolean
    result?: unknown
    error?: string
}

type CommandHandler = {
    execute: (messageObj: Message, input?: string) => Promise<AxiosResponse>
    requiresInput: boolean
    prompt?: string
}

// Global state
const userStates: UserStates = {}
const TIMEOUT = 30 * 60 * 1000 // 30 minutes

// Configuration
const MY_TOKEN = process.env.MY_TOKEN || ''
const BOT_USERNAME = process.env.BOT_USERNAME || ''
const BRIAN_API_KEY = process.env.BRIAN_API_KEY || ''
const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`
const BRIAN_API_URL = {
    knowledge: 'https://api.brianknows.org/api/v0/agent/knowledge',
    parameters: 'https://api.brianknows.org/api/v0/agent/parameters-extraction'
}

// Axios instance
const axiosInstance = {
    get: async (method: string, params: Record<string, unknown>): Promise<AxiosResponse> => {
        try {
            const response = await axios.get(`${BASE_URL}/${method}`, { params })
            return response
        } catch (error) {
            const axiosError = error as AxiosError<TelegramError>
            console.error(`Axios GET error for method ${method}:`, axiosError.response?.data || axiosError.message)
            throw error
        }
    },
    post: async (method: string, data: Record<string, unknown>): Promise<AxiosResponse> => {
        try {
            return await axios.post(`${BASE_URL}/${method}`, data)
        } catch (error) {
            const axiosError = error as AxiosError<TelegramError>
            console.error(`Axios POST error for method ${method}:`, axiosError.response?.data || axiosError.message)
            throw error
        }
    }
}

// Utility Functions
function convertMarkdownToTelegramMarkdown(text: string): string {
    return text.split("\n").map(line => {
        line = line.trim()
        if (line.startsWith("# ")) return `*${line.slice(2)}*`
        if (line.startsWith("## ")) return `*${line.slice(3)}*`
        if (line.startsWith("### ")) return `\`${line.slice(4)}\``
        if (line.startsWith("#### ")) return `\`${line.slice(4)}\``
        return line.replace(/([^]+)/g, "$1")
    }).join("\n")
}

function getUserKey(messageObj: Message): string {
    return `${messageObj.chat.id}_${messageObj.from?.id}`
}

function isGroupChat(messageObj: Message): boolean {
    return messageObj.chat.type === 'group' || messageObj.chat.type === 'supergroup'
}

function cleanupInactiveUsers(): void {
    const now = Date.now()
    Object.entries(userStates).forEach(([key, state]) => {
        if (now - state.lastActivity > TIMEOUT) {
            delete userStates[key]
        }
    })
}

// Brian AI Functions
async function queryBrianAI(prompt: string): Promise<string> {
    try {
        const response = await axios.post<BrianAIResponse>(
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
        )
        return response.data.result.answer
    } catch (error) {
        const axiosError = error as AxiosError
        console.error('Brian AI Error:', axiosError.response?.data || axiosError.message)
        return 'Sorry, I am unable to process your request at the moment.'
    }
}

async function parameterExtractionBrianAI(prompt: string): Promise<string> {
    try {
        const response = await axios.post<BrianAIResponse>(
            BRIAN_API_URL.parameters,
            {
                prompt,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-brian-api-key': BRIAN_API_KEY,
                }
            }
        )
        return response.data.result.completion || 'No parameters extracted.'
    } catch (error) {
        const axiosError = error as AxiosError
        console.error('Parameter Extraction Error:', axiosError.response?.data || axiosError.message)
        return 'Sorry, I am unable to process your request at the moment.'
    }
}

// Message Handling
async function sendMessage(messageObj: Message, messageText: string): Promise<AxiosResponse> {
    try {
        const result = await axiosInstance.get('sendMessage', {
            chat_id: messageObj.chat.id,
            text: messageText,
            parse_mode: 'Markdown',
        })
        console.log('Message sent successfully:', messageText)
        return result
    } catch (error) {
        const axiosError = error as AxiosError<TelegramError>
        console.error('Send Message Error:', axiosError.response?.data || axiosError.message)
        throw error
    }
}

// Command Handlers
const commandHandlers: Record<string, CommandHandler> = {
    start: {
        execute: async (messageObj) => 
            sendMessage(messageObj, 'Hello! Welcome to the StarkFinder bot. To initiate transaction connect to wallet by typing /connect <your_wallet_address>. You can ask the bot any query regarding starknet by just using /ask command. Type /help for more info.'),
        requiresInput: false
    },
    help: {
        execute: async (messageObj) =>
            sendMessage(messageObj, 'Available commands:\n/start - Start the bot\n/ask - Enter Q&A mode\n/connect - Connect wallet\n/transactions - Enter transaction mode\n/stop - Exit current mode\n\nIn group chats, mention me (@' + BOT_USERNAME + ') with your message.'),
        requiresInput: false
    },
    ask: {
        execute: async (messageObj, input) => {
            const userKey = getUserKey(messageObj)
            userStates[userKey] = {
                mode: 'ask',
                lastActivity: Date.now(),
                groupChat: isGroupChat(messageObj)
            }
            
            if (!input) {
                return sendMessage(messageObj, 'Mode set to Q&A. You can now ask questions directly without using /ask. Use /stop to exit this mode.')
            }
            
            const response = await queryBrianAI(input)
            return sendMessage(messageObj, convertMarkdownToTelegramMarkdown(response))
        },
        requiresInput: false
    },
    connect: {
        execute: async (messageObj, input) => {
            if (!input) return sendMessage(messageObj, 'Please provide your wallet address.')
            return sendMessage(messageObj, `Connected to wallet address: ${input}`)
        },
        requiresInput: true,
        prompt: 'Please provide your wallet address.'
    },
    transactions: {
        execute: async (messageObj, input) => {
            const userKey = getUserKey(messageObj)
            userStates[userKey] = {
                mode: 'transaction',
                lastActivity: Date.now(),
                groupChat: isGroupChat(messageObj)
            }
            
            if (!input) {
                return sendMessage(messageObj, 'Mode set to Transactions. You can now process transactions directly. Use /stop to exit this mode.')
            }
            
            const response = await parameterExtractionBrianAI(input)
            return sendMessage(messageObj, response)
        },
        requiresInput: false
    },
    stop: {
        execute: async (messageObj) => {
            const userKey = getUserKey(messageObj)
            if (userStates[userKey]) {
                delete userStates[userKey]
                return sendMessage(messageObj, 'Mode reset. Use /help to see available commands.')
            }
            return sendMessage(messageObj, 'No active mode to stop.')
        },
        requiresInput: false
    }
}

// Message Handler
async function handleMessage(messageObj: Message): Promise<AxiosResponse> {
    try {
        if (!messageObj?.from?.id) throw new Error('Invalid message object')
        
        const userKey = getUserKey(messageObj)
        const messageText = messageObj.text?.trim() || ''
        const userState = userStates[userKey]
        
        cleanupInactiveUsers()

        if (messageText.startsWith('/')) {
            const [command, ...args] = messageText.substring(1).split(' ')
            const input = args.join(' ')
            const handler = commandHandlers[command.toLowerCase()]

            if (!handler) {
                return await sendMessage(messageObj, 'Invalid command. Type /help for available commands.')
            }

            return await handler.execute(messageObj, input)
        }

        if (userState) {
            userState.lastActivity = Date.now()

            if (userState.groupChat) {
                if (!messageText.includes(`@${BOT_USERNAME}`)) {
                    return Promise.resolve({} as AxiosResponse)
                }
                // Remove bot mention from message
                const cleanText = messageText.replace(`@${BOT_USERNAME}`, '').trim()
                
                switch (userState.mode) {
                    case 'ask':
                        const response = await queryBrianAI(cleanText)
                        return sendMessage(messageObj, convertMarkdownToTelegramMarkdown(response))
                    case 'transaction':
                        const txResponse = await parameterExtractionBrianAI(cleanText)
                        return sendMessage(messageObj, txResponse)
                }
            } else {
                switch (userState.mode) {
                    case 'ask':
                        const response = await queryBrianAI(messageText)
                        return sendMessage(messageObj, convertMarkdownToTelegramMarkdown(response))
                    case 'transaction':
                        const txResponse = await parameterExtractionBrianAI(messageText)
                        return sendMessage(messageObj, txResponse)
                }
            }
        }

        return sendMessage(messageObj, 'Use /help for available commands.')
    } catch (error) {
        console.error('Handle Message Error:', (error as AxiosError).message)
        return sendMessage(messageObj, 'An error occurred. Please try again.')
    }
}

// Chat Member Update Handler
async function handleChatMemberUpdate(update: ChatMemberUpdate): Promise<void> {
    const { status } = update.new_chat_member
    const { id: chatId } = update.chat
    const { id: userId, username = 'Unknown' } = update.from

    console.log(`Chat member update - Status: ${status}, Chat ID: ${chatId}, User: ${username}`)

    if (['kicked', 'left', 'banned'].includes(status)) {
        console.log(`User ${username} (${userId}) has stopped/blocked/deleted the bot in chat ${chatId}`)
        const userKey = `${chatId}_${userId}`
        delete userStates[userKey]
    }
}

// API Routes
export async function POST(req: NextRequest): Promise<NextResponse<WebhookResponse>> {
    try {
        console.log('Received webhook POST request')
        const body = await req.json() as TelegramUpdate
        
        if (!body) {
            console.error('No body received')
            return NextResponse.json({ ok: false, error: 'No body received' }, { status: 200 })
        }
        
        console.log('Received update:', JSON.stringify(body, null, 2))
        
        if (body.message) {
            await handleMessage(body.message)
            return NextResponse.json({ ok: true })
        } 
        
        if (body.my_chat_member) {
            await handleChatMemberUpdate(body.my_chat_member)
            return NextResponse.json({ ok: true })
        }
        
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Webhook Error:', (error as Error).message)
        return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 200 })
    }
}

export async function GET(req: NextRequest): Promise<NextResponse<WebhookSetupResponse>> {
    try {
        console.log('Received webhook GET request')
        const WEBHOOK_URL = `${process.env.VERCEL_URL}/api/tg-bot`
        
        const response = await axiosInstance.post('setWebhook', { url: WEBHOOK_URL })
        console.log('Webhook setup response:', response.data)
        return NextResponse.json(response.data)
    } catch (error) {
        const axiosError = error as AxiosError
        console.error('Webhook Setup Error:', axiosError.response?.data || axiosError.message)
        return NextResponse.json({ ok: false, error: axiosError.message }, { status: 200 })
    }
}