// lib/transaction/processor.ts
import { Provider } from 'starknet';
import { BrianResponse, ProcessedTransaction, BrianTransactionData } from './types';
import { STARKNET_RPC_URL } from './config';
import {
  SwapHandler,
  TransferHandler,
  NostraDepositHandler,
  NostraWithdrawHandler,
  NostraBaseHandler,
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
      'withdraw': new NostraWithdrawHandler()
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
    const action = response.action.charAt(0).toUpperCase() + response.action.slice(1);
    
    if (['deposit', 'withdraw'].includes(response.action)) {
      const amount = response.extractedParams?.amount || '0';
      const token = response.extractedParams?.token1?.toUpperCase() || 'tokens';
      const protocol = response.extractedParams?.protocol?.toUpperCase() || 'protocol';
      
      if (response.action === 'deposit') {
        return `Deposit ${amount} ${token} to ${protocol}`;
      } else {
        return `Withdraw ${amount} ${token} from ${protocol}`;
      }
    }

    return response.data?.description || `${action} transaction`;
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
      console.log('Processing transaction response:', JSON.stringify(response, null, 2));
      
      // Validate the response
      this.validateBrianResponse(response);

      const handler = this.handlers[response.action];
      if (!handler) {
        throw new Error(`Unsupported action type: ${response.action}`);
      }

      // Create transaction data if not provided
      const transactionData = this.createTransactionData(response);
      const transactions = handler.processSteps(transactionData, response.extractedParams);

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

      return {
        success: true,
        description: this.generateDescription(response),
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
      console.error('Response that caused error:', JSON.stringify(response, null, 2));
      throw error;
    }
  }
}

export const transactionProcessor = new TransactionProcessor();