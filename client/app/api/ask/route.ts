import { NextResponse } from 'next/server';
import axios from 'axios';

const BRIAN_API_KEY = process.env.BRIAN_API_KEY || '';
const BRIAN_API_URL = 'https://api.brianknows.org/api/v0/agent/knowledge';

export async function POST(request: Request) {
    try {
      const { prompt } = await request.json();
      const response = await axios.post(
        BRIAN_API_URL,
        { prompt },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-brian-api-key': BRIAN_API_KEY,
          },
        }
      );
      const { answer } = response.data.result;
      return NextResponse.json({ prompt, answer });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Unable to get response from Brian\'s API' }, { status: 500 });
    }
  }
  