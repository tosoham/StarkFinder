/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrianToken, NostraTokenAddresses, BrianTransactionData, TransactionStep } from '../types';
import { NOSTRA_TOKENS } from '../config';

// Changed to not implement BaseTransactionHandler since it's a base class itself
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

  // Make this abstract to force implementation in child classes
  abstract processSteps(data: BrianTransactionData, params?: any): TransactionStep[];
}