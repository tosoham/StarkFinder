/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest,NextResponse } from 'next/server';
import { Provider } from 'starknet';

interface BrianStep {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

interface BrianToken {
  address: string;
  symbol: string;
  decimals: number;
}

interface BrianTransactionData {
  description?: string;
  steps?: BrianStep[];
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
  extractedParams: {
    action: string;
    token1?: string;
    token2?: string;
    chain?: string;
    amount?: string;
    protocol?: string;
    address?: string;
  };
}

class StarknetTransactionHandler {
  private provider: Provider;
  // Current Avnu router contract address
  private readonly AVNU_ROUTER = "0x04270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f";
  // Previous Avnu router contract address (for reference)
  private readonly OLD_AVNU_ROUTER = "0x4270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f";

  constructor() {
    this.provider = new Provider({
      nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
    });
  }

  async processTransaction(response: BrianResponse) {
    try {
      if (!response.data.steps || response.data.steps.length === 0) {
        throw new Error('No transaction steps found in response');
      }

      const transactions = response.data.steps.map(step => {
        if (step.contractAddress.toLowerCase() === this.OLD_AVNU_ROUTER.toLowerCase() && 
            step.entrypoint === 'multi_route_swap') {
          return {
            ...step,
            contractAddress: this.AVNU_ROUTER
          };
        }
        return step;
      });

      const approvalStep = transactions.find(tx => tx.entrypoint === 'approve');
      if (approvalStep) {
        const currentSpender = approvalStep.calldata[0];
        if (BigInt(currentSpender).toString(16) === this.OLD_AVNU_ROUTER.replace('0x', '')) {
          approvalStep.calldata[0] = this.AVNU_ROUTER;
        }
      }

      for (const tx of transactions) {
        const isDeployed = await this.provider.getClassAt(tx.contractAddress);
        if (!isDeployed) {
          throw new Error(`Contract ${tx.contractAddress} is not deployed`);
        }
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

  private async isContractDeployed(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getClassAt(address);
      return code !== null && code !== undefined;
    } catch (error) {
      return false;
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
    console.log('Brian API Response:', JSON.stringify(data, null, 2));

    if (!brianResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'API request failed' },
        { status: brianResponse.status }
      );
    }

    try {
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
      console.error('Transaction processing error:', error);
      return NextResponse.json({
        error: `Failed to process transaction: ${(error as Error).message}`,
        details: error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}