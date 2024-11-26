/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Account, Contract, Provider, constants } from "starknet";
import { CallData } from "starknet";

export class StarknetWallet {
  private provider: Provider;

  constructor() {
    this.provider = new Provider({
      nodeUrl: "https://starknet-mainnet.public.blastapi.io",
    });
  }

  async createAccount(privateKey: string): Promise<Account> {
    return new Account(this.provider, privateKey, privateKey);
  }

  async executeTransaction(account: Account, transactions: any[]) {
    try {
      const multicallTx = await account.execute(transactions);
      await account.waitForTransaction(multicallTx.transaction_hash);
      return multicallTx.transaction_hash;
    } catch (error) {
      console.error("Transaction execution error:", error);
      throw error;
    }
  }
}
