// lib/transaction/processor.ts
import { Provider } from 'starknet';
import { BrianResponse, ProcessedTransaction, BrianTransactionData } from './types';
import { STARKNET_RPC_URL } from './config';
import {
  SwapHandler,
  TransferHandler,
  NostraDepositHandler,
  NostraWithdrawHandler,
  BridgeHandler,
  BaseTransactionHandler
} from './handlers';

export class TransactionProcessor {
  private provider: Provider;
  private handlers: Record<string, BaseTransactionHandler>;

  constructor() {
    this.provider = new Provider({ nodeUrl: STARKNET_RPC_URL });
    
    this.handlers = {
      'swap': new SwapHandler(),
      'transfer': new TransferHandler(),
      'deposit': new NostraDepositHandler(),
      'withdraw': new NostraWithdrawHandler(),
      'bridge': new BridgeHandler(process.env.LAYERSWAP_API_KEY || '')
    };
  }

  validateBrianResponse(response: BrianResponse): void {
    if (!response) {
      throw new Error('Invalid response: Response is null or undefined');
    }

    if (!response.action) {
      throw new Error('Invalid response: Missing action');
    }

    // For deposit/withdraw, validate required parameters
    if (['deposit', 'withdraw'].includes(response.action)) {
      if (!response.extractedParams?.protocol) {
        throw new Error(`${response.action} requires a protocol parameter`);
      }

      if (!response.extractedParams.token1) {
        throw new Error(`${response.action} requires a token parameter`);
      }

      if (!response.extractedParams.amount) {
        throw new Error(`${response.action} requires an amount parameter`);
      }
    } else {
      // For other actions, validate data and steps
      if (!response.data?.steps) {
        throw new Error('Invalid response: Missing steps array');
      }
    }
  }

  generateDescription(response: BrianResponse): string {
    const params = response.extractedParams;
    switch (response.action) {
      case 'deposit':
        return `Deposit ${params?.amount} ${params?.token1?.toUpperCase()} to ${params?.protocol?.toUpperCase()}`;
      case 'withdraw':
        return `Withdraw ${params?.amount} ${params?.token1?.toUpperCase()} from ${params?.protocol?.toUpperCase()}`;
      case 'transfer':
        return `Transfer ${params?.amount} ${params?.token1?.toUpperCase()} to ${params?.address}`;
      case 'swap':
        return `Swap ${params?.amount} ${params?.token1?.toUpperCase()} for ${params?.token2?.toUpperCase()}`;
      default:
        return `${response.action.charAt(0).toUpperCase() + response.action.slice(1)} transaction`;
    }
  }

  generateBridgeDescription(response: BrianResponse): string {
    const amount = response.extractedParams?.amount || '0';
    const token = response.extractedParams?.token1?.toUpperCase() || 'tokens';
    const destChain = response.extractedParams?.destinationChain?.replace('_MAINNET', '') || 'destination chain';
    return `Bridge ${amount} ${token} to ${destChain}`;
  }


  createTransactionData(response: BrianResponse): BrianTransactionData {
    // For deposit/withdraw, create transaction data from extractedParams
    if (['deposit', 'withdraw'].includes(response.action) && response.extractedParams) {
      return {
        description: this.generateDescription(response),
        steps: [], // Will be filled by the specific handler
        fromAmount: response.extractedParams.amount,
        toAmount: response.extractedParams.amount,
        receiver: response.extractedParams.address,
        protocol: response.extractedParams.protocol
      };
    }

    // For other actions, use the provided data
    return response.data as BrianTransactionData;
  }

  async processTransaction(response: BrianResponse): Promise<ProcessedTransaction> {
    try {
      const handler = this.handlers[response.action];
      if (!handler) {
        throw new Error(`Unsupported action type: ${response.action}`);
      }

      const transactions = await handler.processSteps(response.data, response.extractedParams);

      // Generate description if not provided
      const description = response.data?.description || this.generateDescription(response);

      return {
        success: true,
        description,
        transactions,
        action: response.action,
        solver: response.solver,
        fromToken: response.data?.fromToken,
        toToken: response.data?.toToken,
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

export const transactionProcessor = new TransactionProcessor();
