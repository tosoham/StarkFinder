/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrianTransactionData, TransactionStep } from '../types';
import { NostraBaseHandler } from './nostra-base';
import { BaseTransactionHandler } from './base';

export class NostraWithdrawHandler extends NostraBaseHandler implements BaseTransactionHandler {
  async processSteps(data: BrianTransactionData, params?: any): Promise<TransactionStep[]> {
    if (!params?.amount || !params?.token1 || params?.protocol?.toLowerCase() !== 'nostra') {
      throw new Error('Missing required parameters for Nostra withdraw');
    }

    // Always use connected wallet address from request
    const connectedAddress = params.connectedAddress || '0x0';

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
          connectedAddress,
          connectedAddress,
          amountWithDecimals,
          '0'
        ]
      }
    ];
  }
}
