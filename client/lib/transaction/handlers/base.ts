/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrianTransactionData, TransactionStep } from '../types';

export abstract class BaseTransactionHandler {
  abstract processSteps(data: BrianTransactionData, params?: any): TransactionStep[];
}
