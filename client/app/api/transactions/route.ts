/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { transactionProcessor } from '@/lib/transaction';
import { LayerswapClient } from '@/lib/layerswap/client';
import type { BrianResponse, BrianTransactionData } from '@/lib/transaction/types';

const BRIAN_API_URL = 'https://api.brianknows.org/api/v0/agent';
const layerswapClient = new LayerswapClient(process.env.LAYERSWAP_API_KEY || '');

async function convertBrianResponseFormat(apiResponse: any): Promise<BrianResponse> {
  const response = apiResponse.result[0];
  
  // Construct base response
  const brianResponse: BrianResponse = {
    solver: response.solver,
    action: response.action,
    type: response.type,
    extractedParams: response.extractedParams,
    data: {} as BrianTransactionData
  };

  // Convert data based on action type
  switch (response.action) {
    case 'swap':
    case 'transfer':
      brianResponse.data = {
        description: response.data.description,
        steps: response.data.steps.map((step: any) => ({
          contractAddress: step.contractAddress,
          entrypoint: step.entrypoint,
          calldata: step.calldata
        })),
        fromToken: response.data.fromToken,
        toToken: response.data.toToken,
        fromAmount: response.data.fromAmount,
        toAmount: response.data.toAmount,
        receiver: response.data.receiver,
        amountToApprove: response.data.amountToApprove,
        gasCostUSD: response.data.gasCostUSD
      };
      break;

    case 'deposit':
    case 'withdraw':
      // For deposit/withdraw, we only need extractedParams as the transaction
      // will be constructed by the specific handlers
      brianResponse.data = {
        description: '',
        steps: [],
        protocol: response.extractedParams.protocol,
        fromAmount: response.extractedParams.amount,
        toAmount: response.extractedParams.amount,
        receiver: response.extractedParams.address || ''
      };
      break;

    default:
      throw new Error(`Unsupported action type: ${response.action}`);
  }

  return brianResponse;
}

async function getBrianTransactionData(prompt: string, address: string, chainId: string, messages: any[]): Promise<BrianResponse> {
  try {
    const response = await fetch(BRIAN_API_URL, {
      method: 'POST',
      headers: {
        'X-Brian-Api-Key': process.env.BRIAN_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt, 
        address, 
        chainId: chainId.toString(),
        messages
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.result?.[0]) {
      throw new Error('Invalid response format from Brian API');
    }

    // Convert the response to our expected format
    const convertedResponse = await convertBrianResponseFormat(data);
    return convertedResponse;
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
      const brianResponse = await getBrianTransactionData(prompt, address, chainId, messages);
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
      const errorMessage = error instanceof Error ? error.message : 'Transaction processing failed';
      
      return NextResponse.json(
        { error: errorMessage },
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