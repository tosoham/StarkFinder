/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Provider, constants } from 'starknet';

interface BrianStep {
  approve?: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
  transfer?: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
  swap?: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
  deposit?: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
  transactionData?: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
}

interface BrianToken {
  address: string;
  symbol: string;
  decimals: number;
}

interface BrianTransactionData {
  description: string;
  steps: BrianStep[];
  fromToken?: BrianToken;
  toToken?: BrianToken;
  fromAmount?: string;
  toAmount?: string;
  receiver?: string;
  amountToApprove?: string;
  gasCostUSD?: string;
}

interface BrianResponse {
  solver: string;
  action: 'swap' | 'transfer' | 'deposit';
  type: 'write';
  data: BrianTransactionData;
}
class StarknetTransactionHandler {
  private provider: Provider;

  constructor() {
    this.provider = new Provider({
      nodeUrl: "https://starknet-sepolia.infura.io/v3/14cfb382689f4e0890bbfb1501ce5166"
    });
  }

  async processTransaction(response: BrianResponse) {
    try {
      //process any approval steps if they exist
      const approvalTx = response.data.steps.find(step => step.approve);
      const mainTx = response.data.steps.find(step => step.transfer || step.swap || step.deposit || step.transactionData);

      if (!mainTx) {
        throw new Error('No valid transaction data found in response');
      }

      const transactions = [];

      //add approval transaction if needed
      if (approvalTx?.approve) {
        transactions.push({
          contractAddress: approvalTx.approve.contractAddress,
          entrypoint: approvalTx.approve.entrypoint,
          calldata: approvalTx.approve.calldata
        });
      }

      //main transaction
      const txData = mainTx.transfer || mainTx.transactionData;
      if (txData) {
        transactions.push({
          contractAddress: txData.contractAddress,
          entrypoint: txData.entrypoint,
          calldata: txData.calldata
        });
      }

      return {
        success: true,
        description: response.data.description,
        transactions,
        action: response.action,
        solver: response.solver,
        fromToken: response.data.fromToken,
        toToken: response.data.toToken,
        fromAmount: response.data.fromAmount,
        toAmount: response.data.toAmount,
        receiver: response.data.receiver,
        estimatedGas: response.data.gasCostUSD
      };
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
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

    const brianResponse = await fetch('https://api.brianknows.org/api/v0/agent/transaction', {
      method: 'POST',
      headers: {
        'X-Brian-Api-Key': process.env.BRIAN_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        address,
        chainId: chainId.toString(),
      }),
    });

    const data = await brianResponse.json();

    if (!brianResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'API request failed' },
        { status: brianResponse.status }
      );
    }

    // Process the Brian AI response
    const handler = new StarknetTransactionHandler();
    const processedTx = await handler.processTransaction(data.result[0]);

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
              solver: processedTx.solver
            }
          }
        },
        conversationHistory: messages
      }]
    });

  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}