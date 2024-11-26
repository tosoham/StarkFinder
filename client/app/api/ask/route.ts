/* eslint-disable @typescript-eslint/no-explicit-any */
// api/ask/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

const BRIAN_API_KEY = process.env.BRIAN_API_KEY || '';
const BRIAN_API_URL = 'https://api.brianknows.org/api/v0/agent';

export async function POST(request: Request) {
  try {
    const { prompt, address, messages } = await request.json();
    
    // Filter out duplicate messages and only keep user messages
    const uniqueMessages = messages
      .filter((msg: any) => msg.sender === "user")
      .reduce((acc: any[], curr: any) => {
        // Only add if message content isn't already present
        if (!acc.some(msg => msg.content === curr.content)) {
          acc.push({
            sender: "user",
            content: curr.content
          });
        }
        return acc;
      }, []);

    const payload = {
      prompt,
      address: address || "0x0",
      chainId: "4012",
      messages: uniqueMessages
    };

    console.log('Request payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      BRIAN_API_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-brian-api-key': BRIAN_API_KEY,
        },
      }
    );
    
    console.log('API Response:', response.data);

    // Extract the answer from the result array
    if (response.data.result && response.data.result[0] && response.data.result[0].answer) {
      return NextResponse.json({ answer: response.data.result[0].answer });
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error: any) {
    console.error('Detailed error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    return NextResponse.json(
      { 
        error: 'Unable to get response from Brian\'s API',
        details: error.response?.data || error.message 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}