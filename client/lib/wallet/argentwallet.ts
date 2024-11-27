/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArgentTMA, SessionAccountInterface } from '@argent/tma-wallet';

export class ArgentWalletService {
  private argentTMA: ArgentTMA;

  constructor() {
    this.argentTMA = ArgentTMA.init({
      environment: "mainnet",
      appName: "StarkFinder Bot",
      appTelegramUrl: process.env.TELEGRAM_APP_URL || "",
      sessionParams: {
          validityDays: 90,
          allowedMethods: []
      },
    });
  }

  async connect(callbackData?: string): Promise<{
    account: SessionAccountInterface;
    address: string;
  }> {
    try {
      if (!this.argentTMA.isConnected()) {
        await this.argentTMA.requestConnection(callbackData);
      }

      const connection = await this.argentTMA.connect();
      if (!connection) {
        throw new Error('Failed to connect to wallet');
      }

      const { account } = connection;
      if (account.getSessionStatus() !== "VALID") {
        throw new Error('Session invalid or expired');
      }

      return {
        account,
        address: account.address
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  async executeTransaction(account: SessionAccountInterface, transactions: any[]) {
    try {
      const multicallTx = await account.execute(transactions);
      await account.waitForTransaction(multicallTx.transaction_hash);
      return multicallTx.transaction_hash;
    } catch (error) {
      console.error('Transaction execution error:', error);
      throw error;
    }
  }

  async getBalance(account: SessionAccountInterface, tokenAddress: string): Promise<string> {
    try {
      const balance = await account.callContract({
        contractAddress: tokenAddress,
        entrypoint: "balanceOf",
        calldata: [account.address]
      });
      return balance.toString();
    } catch (error) {
      console.error('Balance check error:', error);
      throw error;
    }
  }
}