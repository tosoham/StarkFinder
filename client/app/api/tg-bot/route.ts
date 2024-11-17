/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Types
interface Message {
    chat: {
        id: number
    }
    text?: string
}

interface TelegramUpdate {
    message?: Message
}

// Axios instance setup
const MY_TOKEN = process.env.MY_TOKEN || ''
const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`

const axiosInstance = {
    get: async (method: string, params: any) => {
        return axios.get(`${BASE_URL}/${method}`, { params })
    },
    post: async (method: string, data: any) => {
        return axios.post(`${BASE_URL}/${method}`, data)
    }
}

// Brian AI setup
const BRIAN_API_KEY = process.env.BRIAN_API_KEY || ''
const BRIAN_API_URL = 'https://api.brianknows.org/api/v0/agent/knowledge'

async function queryBrianAI(prompt: string): Promise<string> {
    try {
        const response = await axios.post(
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
        console.error('Error querying Brian AI:', error)
        return 'Sorry, I am unable to process your request at the moment.'
    }
}

// Telegram message handling
async function sendMessage(messageObj: Message, messageText: string) {
    return axiosInstance.get('sendMessage', {
        chat_id: messageObj.chat.id,
        text: messageText,
    })
}

async function handleMessage(messageObj: Message) {
    const messageText = messageObj.text || ''
    
    if (messageText.charAt(0) === '/') {
        const command = messageText.split(' ')[0].substring(1)
        switch (command) {
            case 'start':
                return sendMessage(messageObj, 'Hello! Welcome to the StrkFInder bot. You can type /help for more info and know about more commands.')
            case 'help':
                return sendMessage(messageObj, 'This is a help message.')
            case 'ask':
                return sendMessage(messageObj, await queryBrianAI(messageText.split(' ').slice(1).join(' ')))
            default:
                return sendMessage(messageObj, 'Invalid command. Please try again.')
        }
    } else {
        return sendMessage(messageObj, `${messageText}\nHow can I help You today?`)
    }
}

// Main handler
export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as TelegramUpdate
        
        if (body?.message) {
            await handleMessage(body.message)
        }
        
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Error handling telegram webhook:', error)
        return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
    }
}

// Optional: Webhook setup endpoint
export async function GET(req: NextRequest) {
    const WEBHOOK_URL = `${process.env.VERCEL_URL}/api/telegram`
    
    try {
        const response = await axios.post(
            `${BASE_URL}/setWebhook`,
            {
                url: WEBHOOK_URL,
            }
        )
        return NextResponse.json(response.data)
    } catch (error) {
        console.error('Error setting webhook:', error)
        return NextResponse.json({ error: 'Error setting webhook' }, { status: 500 })
    }
}