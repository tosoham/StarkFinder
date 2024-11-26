/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrianToken, NostraTokenAddresses, BrianTransactionData, TransactionStep } from '../types';
import { NOSTRA_TOKENS } from '../config';

export abstract class NostraBaseHandler {
  protected readonly TOKENS: NostraTokenAddresses = NOSTRA_TOKENS;

  getTokenDetails(symbol: string, isInterestBearing: boolean = false): BrianToken {
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

  abstract processSteps(data: BrianTransactionData, params?: any): Promise<TransactionStep[]>;
}
