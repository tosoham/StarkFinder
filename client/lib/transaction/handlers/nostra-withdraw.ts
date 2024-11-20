/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrianTransactionData, TransactionStep } from '../types';
import { NostraBaseHandler } from './nostra-base';
import { BaseTransactionHandler } from './base';

// Implement both NostraBaseHandler and BaseTransactionHandler
export class NostraWithdrawHandler extends NostraBaseHandler implements BaseTransactionHandler {
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
      {
        contractAddress: addresses.iToken,
        entrypoint: 'burn',
        calldata: [
          params.address || '0x0',
          params.address || '0x0',
          amountWithDecimals,
          '0'
        ]
      }
    ];
  }
}
