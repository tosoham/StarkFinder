/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError, AxiosResponse } from 'axios'

// Types
interface TelegramError {
    ok: boolean
    error_code: number
    description: string
}

interface Message {
    chat: { id: number }
    text?: string
    from?: { id: number }
}

interface ChatMemberUpdate {
    chat: { id: number }
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

interface PendingCommand {
    command: string
    timestamp: number
}

type CommandHandler = {
    execute: (messageObj: Message, input?: string) => Promise<AxiosResponse>
    requiresInput: boolean
    prompt?: string
}

// Pending commands storage
const pendingCommands: Record<string, PendingCommand> = {}

// Utility functions
function convertMarkdownToTelegramMarkdown(text: string): string {
    const lines = text.split("\n").map(line => {
        line = line.trim()
        if (line.startsWith("# ")) return `*${line.slice(2)}*`
        if (line.startsWith("## ")) return `*${line.slice(3)}*`
        if (line.startsWith("### ")) return `\`${line.slice(4)}\``
        if (line.startsWith("#### ")) return `\`${line.slice(4)}\``
        return line.replace(/([^]+)/g, "$1")
    })
    return lines.join("\n")
}

// API configuration
const MY_TOKEN = process.env.MY_TOKEN || ''
const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`
const BRIAN_API_KEY = process.env.BRIAN_API_KEY || ''
const BRIAN_API_URL = {
    knowledge: 'https://api.brianknows.org/api/v0/agent/knowledge',
    parameters: 'https://api.brianknows.org/api/v0/agent/parameters-extraction'
}

// Axios instance
const axiosInstance = {
    get: async (method: string, params: Record<string, unknown>): Promise<AxiosResponse> => {
        try {
            return await axios.get(`${BASE_URL}/${method}`, { params })
        } catch (error) {
            const axiosError = error as AxiosError<TelegramError>
            console.error(`Axios GET error for method ${method}:`, axiosError.response?.data || axiosError.message)
            throw error
        }
    }
}

// Brian AI functions
async function queryBrianAI(prompt: string): Promise<string> {
    try {
        const response = await axios.post(BRIAN_API_URL.knowledge, {
            prompt,
            kb: 'starknet_kb'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-brian-api-key': BRIAN_API_KEY,
            }
        })
        return response.data.result.answer
    } catch (error) {
        const axiosError = error as AxiosError
        console.error('Brian AI Error:', axiosError.response?.data || axiosError.message)
        return 'Sorry, I am unable to process your request at the moment.'
    }
}

async function parameterExtractionBrianAI(prompt: string): Promise<string> {
    try {
        const response = await axios.post(BRIAN_API_URL.parameters, {
            prompt,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-brian-api-key': BRIAN_API_KEY,
            }
        })
        return response.data.result.completion
    } catch (error) {
        const axiosError = error as AxiosError
        console.error('Parameter Extraction Error:', axiosError.response?.data || axiosError.message)
        return 'Sorry, I am unable to process your request at the moment.'
    }
}

// Message handling
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

// Command handlers
const commandHandlers: Record<string, CommandHandler> = {
    start: {
        execute: async (messageObj) => 
            sendMessage(messageObj, 'Hello! Welcome to the StarkFinder bot. To initiate transaction connect to wallet by typing /connect <your_wallet_address>. You can ask the bot any query regarding starknet by just using the /ask command. You can type /help for more info and know about more commands.'),
        requiresInput: false
    },
    help: {
        execute: async (messageObj) =>
            sendMessage(messageObj, 'Available commands:\n/start - Start the bot\n/ask - Query about Starknet\n/connect - Connect your wallet\n/transactions - Process transactions\n/stop - Stop the bot'),
        requiresInput: false
    },
    ask: {
        execute: async (messageObj, input) => {
            if (!input) return sendMessage(messageObj, 'What do you want to ask? Please type your question.')
            const response = await queryBrianAI(input)
            return sendMessage(messageObj, convertMarkdownToTelegramMarkdown(response))
        },
        requiresInput: true,
        prompt: 'What do you want to ask? Please type your question.'
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
            if (!input) return sendMessage(messageObj, 'Please provide transaction details.')
            const response = await parameterExtractionBrianAI(input)
            return sendMessage(messageObj, response)
        },
        requiresInput: true,
        prompt: 'Please provide transaction details.'
    },
    stop: {
        execute: async (messageObj) =>
            sendMessage(messageObj, 'Goodbye! If you want to use the bot again, just send /start.'),
        requiresInput: false
    }
}

async function handleMessage(messageObj: Message): Promise<AxiosResponse> {
    try {
        if (!messageObj?.from?.id) throw new Error('Invalid message object')
        
        const chatId = messageObj.chat.id
        const userId = messageObj.from.id
        const messageText = messageObj.text?.trim() || ''
        
        console.log('Received message:', messageText)

        // Handle pending command
        const pendingKey = `${chatId}_${userId}`
        if (pendingCommands[pendingKey]) {
            const { command } = pendingCommands[pendingKey]
            delete pendingCommands[pendingKey]
            return await commandHandlers[command].execute(messageObj, messageText)
        }

        // Handle new command
        if (messageText.startsWith('/')) {
            const [command, ...args] = messageText.substring(1).split(' ')
            const input = args.join(' ')

            const handler = commandHandlers[command]
            if (!handler) {
                return await sendMessage(messageObj, 'Invalid command. Type /help for available commands.')
            }

            if (handler.requiresInput && !input) {
                pendingCommands[pendingKey] = {
                    command,
                    timestamp: Date.now()
                }
                return await sendMessage(messageObj, handler.prompt || 'Please provide input.')
            }

            return await handler.execute(messageObj, input)
        }

        return await sendMessage(messageObj, 'Use /help for available commands.')
    } catch (error) {
        const axiosError = error as AxiosError<TelegramError>
        console.error('Handle Message Error:', axiosError.response?.data || axiosError.message)
        throw error
    }
}

// Handler for chat member updates
async function handleChatMemberUpdate(update: ChatMemberUpdate): Promise<void> {
    const { status } = update.new_chat_member
    const { id: chatId } = update.chat
    const { id: userId, username = 'Unknown' } = update.from

    console.log(`Chat member update - Status: ${status}, Chat ID: ${chatId}, User: ${username}`)

    if (['kicked', 'left', 'banned'].includes(status)) {
        console.log(`User ${username} (${userId}) has stopped/blocked/deleted the bot in chat ${chatId}`)
        // Add any cleanup logic here
    }
}

// API Routes
type WebhookResponse = {
    ok: boolean
    error?: string
}

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
        
        console.log('No message or chat member update in update')
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Webhook Error:', (error as Error).message)
        return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 200 })
    }
}

export async function GET(req: NextRequest): Promise<NextResponse<WebhookResponse>> {
    try {
        console.log('Received webhook GET request')
        const WEBHOOK_URL = `${process.env.VERCEL_URL}/api/tg-bot`
        
        const response = await axios.post(`${BASE_URL}/setWebhook`, { url: WEBHOOK_URL })
        console.log('Webhook setup response:', response.data)
        return NextResponse.json(response.data)
    } catch (error) {
        const axiosError = error as AxiosError
        console.error('Webhook Setup Error:', axiosError.response?.data || axiosError.message)
        return NextResponse.json({ ok: false, error: axiosError.message }, { status: 200 })
    }
}