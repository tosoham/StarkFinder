import { BrianTransactionData, TransactionStep } from '../types';
import { BaseTransactionHandler } from './base';

export class SwapHandler extends BaseTransactionHandler {
  processSteps(data: BrianTransactionData): TransactionStep[] {
    const transactions: TransactionStep[] = [];
    
    for (const step of data.steps) {
      if (step.approve) transactions.push(step.approve);
      if (step.transactionData) transactions.push(step.transactionData);
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
