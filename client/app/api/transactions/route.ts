/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from 'starknet';
import { NextRequest, NextResponse } from 'next/server';

interface TransactionStep {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

interface BrianStep {
  approve?: TransactionStep;
  transactionData?: TransactionStep;
  contractAddress?: string;
  entrypoint?: string;
  calldata?: string[];
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
  protocol?: string;
}

interface BrianResponse {
  solver: string;
  action: 'swap' | 'transfer' | 'deposit';
  type: 'write';
  data: BrianTransactionData;
  extractedParams?: {
    action: string;
    token1: string;
    token2: string;
    chain: string;
    amount: string;
    protocol: string;
    address: string;
  };
}

interface NostraTokenAddresses {
  [key: string]: {
    token: string;
    iToken: string;
  };
}
abstract class BaseTransactionHandler {
  abstract processSteps(data: BrianTransactionData, params?: any): TransactionStep[];
}

class SwapHandler extends BaseTransactionHandler {
  processSteps(data: BrianTransactionData): TransactionStep[] {
    const transactions: TransactionStep[] = [];
    
    for (const step of data.steps) {
      if (step.approve) {
        transactions.push(step.approve);
      }
      if (step.transactionData) {
        transactions.push(step.transactionData);
      }
      if (step.contractAddress && step.entrypoint && step.calldata) {
        transactions.push({
          contractAddress: step.contractAddress,
          entrypoint: step.entrypoint,
          calldata: step.calldata
        });
      }
    }
    
    return transactions;
  }
}

class TransferHandler extends BaseTransactionHandler {
  processSteps(data: BrianTransactionData): TransactionStep[] {
    const transactions: TransactionStep[] = [];
    
    for (const step of data.steps) {
      if (step.contractAddress && step.entrypoint && step.calldata) {
        transactions.push({
          contractAddress: step.contractAddress,
          entrypoint: step.entrypoint,
          calldata: step.calldata
        });
      }
    }
    
    return transactions;
  }
}

class NostraBaseHandler {
  protected readonly TOKENS: NostraTokenAddresses = {
    'strk': {
      token: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      iToken: '0x026c5994c2462770bbf940552c5824fb0e0920e2a8a5ce1180042da1b3e489db'
    },
    'eth': {
      token: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      iToken: '0x076bb5a142fa1e6b6a44d055b3cd6e31401ebbc76b6873b9f8a3f180f5b4870e'
    }
  };

  getTokenDetails(symbol: string, isInterestBearing: boolean = false): {
    address: string;
    symbol: string;
    decimals: number;
  } {
    const token = symbol.toLowerCase();
    const addresses = this.TOKENS[token];

    if (!addresses) {
      throw new Error(`Unsupported token: ${symbol}`);
    }

    return {
      address: isInterestBearing ? addresses.iToken : addresses.token,
      symbol: isInterestBearing ? `i${symbol.toUpperCase()}` : symbol.toUpperCase(),
      decimals: 18
    };
  }
}

class NostraDepositHandler extends NostraBaseHandler implements BaseTransactionHandler {
  processSteps(data: BrianTransactionData, params?: any): TransactionStep[] {
    if (!params?.amount || !params?.token1 || params?.protocol?.toLowerCase() !== 'nostra') {
      throw new Error('Missing required parameters for Nostra deposit');
    }

    const token = params.token1.toLowerCase();
    const addresses = this.TOKENS[token];

    if (!addresses) {
      throw new Error(`Unsupported token for Nostra deposit: ${params.token1}`);
    }

    const amountWithDecimals = (BigInt(params.amount) * BigInt(10 ** 18)).toString();

    return [
      // Approve token
      {
        contractAddress: addresses.token,
        entrypoint: 'approve',
        calldata: [
          addresses.iToken,     // spender (iToken address)
          amountWithDecimals,   // amount low
          '0'                   // amount high
        ]
      },
      // Mint iToken
      {
        contractAddress: addresses.iToken,
        entrypoint: 'mint',
        calldata: [
          params.address || '0x0', // recipient
          amountWithDecimals,      // amount low
          '0'                      // amount high
        ]
      }
    ];
  }
}

class NostraWithdrawHandler extends NostraBaseHandler implements BaseTransactionHandler {
  processSteps(data: BrianTransactionData, params?: any): TransactionStep[] {
    if (!params?.amount || !params?.token1 || params?.protocol?.toLowerCase() !== 'nostra') {
      throw new Error('Missing required parameters for Nostra withdraw');
    }

    const token = params.token1.toLowerCase();
    const addresses = this.TOKENS[token];

    if (!addresses) {
      throw new Error(`Unsupported token for Nostra withdraw: ${params.token1}`);
    }

    const amountWithDecimals = (BigInt(params.amount) * BigInt(10 ** 18)).toString();

    return [
      // Burn
      {
        contractAddress: addresses.iToken,
        entrypoint: 'burn',
        calldata: [
          params.address || '0x0',  // from
          params.address || '0x0',  // to
          amountWithDecimals,       // amount low
          '0'                       // amount high
        ]
      }
    ];
  }
}

class StarknetTransactionHandler {
  private provider: Provider;
  private handlers: Record<string, BaseTransactionHandler>;

  constructor() {
    this.provider = new Provider({
      nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
    });
    
    this.handlers = {
      'swap': new SwapHandler(),
      'transfer': new TransferHandler(),
      'deposit': new NostraDepositHandler(),
      'withdraw': new NostraWithdrawHandler()
    };
  }

  async processTransaction(response: BrianResponse) {
    try {
      console.log('Processing response:', JSON.stringify(response, null, 2));

      if (!response.extractedParams?.protocol && ['deposit', 'withdraw'].includes(response.action)) {
        throw new Error('Protocol must be specified for deposits and withdrawals');
      }

      const handler = this.handlers[response.action];
      if (!handler) {
        throw new Error(`Unsupported action type: ${response.action}`);
      }

      const transactions = handler.processSteps(response.data, response.extractedParams);

      // Get token details
      let fromToken, toToken;
      if (['deposit', 'withdraw'].includes(response.action) && response.extractedParams?.protocol === 'nostra') {
        const nostraHandler = handler as unknown as NostraBaseHandler;
        if (response.action === 'deposit') {
          fromToken = nostraHandler.getTokenDetails(response.extractedParams.token1);
          toToken = nostraHandler.getTokenDetails(response.extractedParams.token1, true);
        } else {
          fromToken = nostraHandler.getTokenDetails(response.extractedParams.token1, true);
          toToken = nostraHandler.getTokenDetails(response.extractedParams.token1);
        }
      }

      const description = response.action === 'deposit' 
        ? `Deposit ${response.extractedParams?.amount} ${fromToken?.symbol} to Nostra to receive ${toToken?.symbol}`
        : `Withdraw ${response.extractedParams?.amount} ${toToken?.symbol} by burning ${fromToken?.symbol}`;

      return {
        success: true,
        description,
        transactions,
        action: response.action,
        solver: response.solver,
        fromToken,
        toToken,
        fromAmount: response.extractedParams?.amount,
        toAmount: response.extractedParams?.amount,
        receiver: response.extractedParams?.address,
        estimatedGas: '0',
        protocol: response.extractedParams?.protocol
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
              solver: processedTx.solver,
              protocol: processedTx.protocol
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