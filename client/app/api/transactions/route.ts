// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BRIAN_API_KEY = process.env.BRIAN_API_KEY || 'your_brian_api_key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, address, messages, chainId = '4012' } = body; // Default to Starknet mainnet

    // Validate required parameters
    if (!prompt || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters (prompt or address)' },
        { status: 400 }
      );
    }

    // Call Brian API
    const response = await fetch('https://api.brianknows.org/api/v0/agent/transaction', {
      method: 'POST',
      headers: {
        'X-Brian-Api-Key': BRIAN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        address,
        chainId: chainId.toString(), // Ensure chainId is sent as string
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      switch (response.status) {
        case 401:
          return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        case 429:
          return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        default:
          return NextResponse.json(
            { error: data.error || 'API request failed' },
            { status: response.status }
          );
      }
    }

    // Process successful response
    return NextResponse.json({
      result: [
        {
          data: {
            description: data.result?.data?.description || 'Transaction processed',
            transaction: data.result,
          },
          conversationHistory: messages,
        },
      ],
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}