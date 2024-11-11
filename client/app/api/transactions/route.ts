// app/api/agent/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Ensure you have your Brian API Key in your environment variables
const BRIAN_API_KEY = 'brian_0J9AL4mdqbbwHMx7H';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, address, messages, chainId } = body;

    // Validate required parameters
    if (!prompt || !address || !messages) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const brianResponse = await fetch('https://api.brianknows.org/api/v0/agent/transaction', {
      method: 'POST',
      headers: {
        'X-Brian-Api-Key': BRIAN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        address,
        messages,
        chainId,
      }),
    });

    const data = await brianResponse.json();

    if (brianResponse.ok) {
      // Brian API returned a 200 OK
      return NextResponse.json(data);
    } else {
      // Brian API returned an error (e.g., 400)
      return NextResponse.json(data, { status: brianResponse.status });
    }
  } catch (error) {
    console.error('Error calling Brian API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}