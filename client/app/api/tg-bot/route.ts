/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError, AxiosResponse } from 'axios'
interface Message {
    chat: {
        id: number
    }
    text?: string
}

interface TelegramUpdate {
    message?: Message
}

interface BrianAIResponse {
    result: {
        answer: string
    }
}

interface TelegramError {
    description?: string
    error_code?: number
}

const MY_TOKEN = process.env.MY_TOKEN || ''
const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`

const axiosInstance = {
    get: async (method: string, params: Record<string, unknown>): Promise<AxiosResponse> => {
        try {
            const response = await axios.get(`${BASE_URL}/${method}`, { params })
            return response
        } catch (error) {
            const axiosError = error as AxiosError<TelegramError>
            console.error(`Axios GET error for method ${method}:`, 
                axiosError.response?.data || axiosError.message)
            throw error
        }
    }
}

const BRIAN_API_KEY = process.env.BRIAN_API_KEY || ''
const BRIAN_API_URL = 'https://api.brianknows.org/api/v0/agent/knowledge'

async function queryBrianAI(prompt: string): Promise<string> {
    try {
        const response = await axios.post<BrianAIResponse>(
            BRIAN_API_URL,
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

// tg message handling
async function sendMessage(messageObj: Message, messageText: string): Promise<AxiosResponse> {
    try {
        const result = await axiosInstance.get('sendMessage', {
            chat_id: messageObj.chat.id,
            text: messageText,
        })
        console.log('Message sent successfully:', messageText)
        return result
    } catch (error) {
        const axiosError = error as AxiosError<TelegramError>
        console.error('Send Message Error:', axiosError.response?.data || axiosError.message)
        throw error
    }
}

async function handleMessage(messageObj: Message): Promise<AxiosResponse> {
    try {
        const messageText = messageObj.text || ''
        console.log('Received message:', messageText)
        
        if (messageText.charAt(0) === '/') {
            const command = messageText.split(' ')[0].substring(1)
            console.log('Processing command:', command)
            
            switch (command) {
                case 'start':
                    return await sendMessage(messageObj, 'Hello! Welcome to the StrkFInder bot. You can type /help for more info and know about more commands.')
                case 'help':
                    return await sendMessage(messageObj, 'This is a help message.')
                case 'ask':
                    const query = messageText.split(' ').slice(1).join(' ')
                    console.log('Processing ask command with query:', query)
                    const response = await queryBrianAI(query)
                    return await sendMessage(messageObj, response)
                default:
                    return await sendMessage(messageObj, 'Invalid command. Please try again.')
            }
        } else {
            return await sendMessage(messageObj, `${messageText}\nHow can I help You today?`)
        }
    } catch (error) {
        const axiosError = error as AxiosError<TelegramError>
        console.error('Handle Message Error:', axiosError.response?.data || axiosError.message)
        throw error
    }
}

interface WebhookResponse {
    ok: boolean
    error?: string
}

// Main handler
export async function POST(req: NextRequest): Promise<NextResponse<WebhookResponse>> {
    try {
        console.log('Received webhook POST request')
        const body = await req.json() as TelegramUpdate
        
        if (!body) {
            console.error('No body received')
            return NextResponse.json({ ok: false, error: 'No body received' }, { status: 200 })
        }
        
        console.log('Received update:', JSON.stringify(body, null, 2))
        
        if (body?.message) {
            await handleMessage(body.message)
            return NextResponse.json({ ok: true })
        } else {
            console.log('No message in update')
            return NextResponse.json({ ok: true })
        }
    } catch (error) {
        const typedError = error as Error
        console.error('Webhook Error:', typedError.message)
        return NextResponse.json({ 
            ok: false, 
            error: typedError.message 
        }, { status: 200 })
    }
}

interface WebhookSetupResponse {
    ok: boolean
    result?: unknown
    error?: string
}

//Webhook setup endpoint
export async function GET(req: NextRequest): Promise<NextResponse<WebhookSetupResponse>> {
    try {
        console.log('Received webhook GET request')
        const WEBHOOK_URL = `${process.env.VERCEL_URL}/api/tg-bot`
        
        const response = await axios.post(
            `${BASE_URL}/setWebhook`,
            {
                url: WEBHOOK_URL,
            }
        )
        console.log('Webhook setup response:', response.data)
        return NextResponse.json(response.data)
    } catch (error) {
        const axiosError = error as AxiosError
        console.error('Webhook Setup Error:', axiosError.response?.data || axiosError.message)
        return NextResponse.json({ 
            ok: false,
            error: axiosError.message 
        }, { status: 200 })
    }
}