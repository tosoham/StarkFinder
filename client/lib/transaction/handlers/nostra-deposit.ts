/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrianTransactionData, TransactionStep } from '../types';
import { NostraBaseHandler } from './nostra-base';
import { BaseTransactionHandler } from './base';

export class NostraDepositHandler extends NostraBaseHandler implements BaseTransactionHandler {
  async processSteps(data: BrianTransactionData, params?: any): Promise<TransactionStep[]> {
    if (!params?.amount || !params?.token1 || params?.protocol?.toLowerCase() !== 'nostra') {
      throw new Error('Missing required parameters for Nostra deposit');
    }

    const connectedAddress = params.connectedAddress || '0x0';

    const token = params.token1.toLowerCase();
    const addresses = this.TOKENS[token];

    if (!addresses) {
      throw new Error(`Unsupported token for Nostra deposit: ${params.token1}`);
    }

    const amountWithDecimals = (BigInt(params.amount) * BigInt(10 ** 18)).toString();

    return [
      {
        contractAddress: addresses.token,
        entrypoint: 'approve',
        calldata: [addresses.iToken, amountWithDecimals, '0']
      },
      {
        contractAddress: addresses.iToken,
        entrypoint: 'mint',
        calldata: [connectedAddress, amountWithDecimals, '0']
      }
    ];
  }
}
