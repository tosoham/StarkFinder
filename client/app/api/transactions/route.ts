import { NextRequest, NextResponse } from 'next/server';
import { transactionProcessor } from '@/lib/transaction';
import type { BrianResponse } from '@/lib/transaction/types';

const BRIAN_API_URL = 'https://api.brianknows.org/api/v0/agent/transaction';

async function getBrianTransactionData(prompt: string, address: string, chainId: string): Promise<BrianResponse> {
  try {
    const response = await fetch(BRIAN_API_URL, {
      method: 'POST',
      headers: {
        'X-Brian-Api-Key': process.env.BRIAN_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, address, chainId: chainId.toString() }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.result?.[0]) {
      throw new Error('Invalid response format from Brian API');
    }

    console.log('Brian API Response:', JSON.stringify(data.result[0], null, 2));
    return data.result[0];
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, address, messages, chainId = '4012' } = body;

    if (!prompt || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters (prompt or address)' },
        { status: 400 }
      );
    }

    try {
      const brianResponse = await getBrianTransactionData(prompt, address, chainId);
      const processedTx = await transactionProcessor.processTransaction(brianResponse);

      return NextResponse.json({
        result: [{
          data: {
            description: processedTx.description,
            transaction: {
              type: processedTx.action,
              data: {
                transactions: processedTx.transactions,
                fromToken: processedTx.fromToken,
                toToken: processedTx.toToken,
                fromAmount: processedTx.fromAmount,
                toAmount: processedTx.toAmount,
                receiver: processedTx.receiver,
                gasCostUSD: processedTx.estimatedGas,
                solver: processedTx.solver,
                protocol: processedTx.protocol
              }
            }
          },
          conversationHistory: messages
        }]
      });
    } catch (error) {
      console.error('Transaction processing error:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Transaction processing failed',
          details: error instanceof Error ? error.stack : undefined
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}