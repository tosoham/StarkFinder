// /* eslint-disable @typescript-eslint/no-unused-vars */

// import { NextRequest,NextResponse } from 'next/server';
// import { Provider } from 'starknet';

// interface BrianStep {
//   contractAddress: string;
//   entrypoint: string;
//   calldata: string[];
//   approve?: {
//     contractAddress: string;
//     entrypoint: string;
//     calldata: string[];
//   };
// }

// interface BrianToken {
//   address: string;
//   symbol: string;
//   decimals: number;
// }

// interface BrianTransactionData {
//   description: string;
//   steps: BrianStep[];
//   fromToken?: BrianToken;
//   toToken?: BrianToken;
//   fromAmount?: string;
//   toAmount?: string;
//   receiver?: string;
//   amountToApprove?: string;
//   gasCostUSD?: string;
// }

// interface BrianResponse {
//   solver: string;
//   action: 'swap' | 'transfer' | 'deposit';
//   type: 'write';
//   data: BrianTransactionData;
// }

// class StarknetTransactionHandler {
//   private provider: Provider;

//   constructor() {
//     this.provider = new Provider({
//       nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
//     });
//   }

//   async processTransaction(response: BrianResponse) {
//     try {
//       if (!response.data.steps || response.data.steps.length === 0) {
//         throw new Error('No transaction steps found in response');
//       }

//       // Convert steps into transactions format
//       const transactions = response.data.steps.map(step => ({
//         contractAddress: step.contractAddress,
//         entrypoint: step.entrypoint,
//         calldata: step.calldata
//       }));

//       return {
//         success: true,
//         description: response.data.description,
//         transactions,
//         action: response.action,
//         solver: response.solver,
//         fromToken: response.data.fromToken,
//         toToken: response.data.toToken,
//         fromAmount: response.data.fromAmount,
//         toAmount: response.data.toAmount,
//         receiver: response.data.receiver,
//         estimatedGas: response.data.gasCostUSD
//       };
//     } catch (error) {
//       console.error('Error processing transaction:', error);
//       throw error;
//     }
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { prompt, address, messages, chainId = '4012' } = body;

//     if (!prompt || !address) {
//       return NextResponse.json(
//         { error: 'Missing required parameters (prompt or address)' },
//         { status: 400 }
//       );
//     }

//     // Call Brian API
//     const brianResponse = await fetch('https://api.brianknows.org/api/v0/agent/transaction', {
//       method: 'POST',
//       headers: {
//         'X-Brian-Api-Key': process.env.BRIAN_API_KEY || '',
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         prompt,
//         address,
//         chainId: chainId.toString(),
//       }),
//     });

//     const data = await brianResponse.json();

//     if (!brianResponse.ok) {
//       return NextResponse.json(
//         { error: data.error || 'API request failed' },
//         { status: brianResponse.status }
//       );
//     }

//     // Process the Brian AI response
//     const handler = new StarknetTransactionHandler();
//     const processedTx = await handler.processTransaction(data.result[0]);

//     return NextResponse.json({
//       result: [{
//         data: {
//           description: processedTx.description,
//           transaction: {
//             type: processedTx.action,
//             data: {
//               transactions: processedTx.transactions,
//               fromToken: processedTx.fromToken,
//               toToken: processedTx.toToken,
//               fromAmount: processedTx.fromAmount,
//               toAmount: processedTx.toAmount,
//               receiver: processedTx.receiver,
//               gasCostUSD: processedTx.estimatedGas,
//               solver: processedTx.solver
//             }
//           }
//         },
//         conversationHistory: messages
//       }]
//     });

//   } catch (error) {
//     console.error('Error processing transaction:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }


import { Provider } from 'starknet';
import { NextRequest, NextResponse } from 'next/server';
interface BrianStep {
  approve?: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
  transactionData?: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
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
      nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
    });
  }

  async processTransaction(response: BrianResponse) {
    try {
      console.log('Processing response:', JSON.stringify(response, null, 2));

      if (!response.data.steps || response.data.steps.length === 0) {
        throw new Error('No transaction steps found in response');
      }

      const transactions = [];

      for (const step of response.data.steps) {
        console.log('Processing step:', JSON.stringify(step, null, 2));

        if (step.approve) {
          transactions.push({
            contractAddress: step.approve.contractAddress,
            entrypoint: step.approve.entrypoint,
            calldata: step.approve.calldata
          });
        }

        if (step.transactionData) {
          transactions.push({
            contractAddress: step.transactionData.contractAddress,
            entrypoint: step.transactionData.entrypoint,
            calldata: step.transactionData.calldata
          });
        }

        if (step.contractAddress && step.entrypoint && step.calldata) {
          transactions.push({
            contractAddress: step.contractAddress,
            entrypoint: step.entrypoint,
            calldata: step.calldata
          });
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

    console.log('Brian API Response:', JSON.stringify(data, null, 2));

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