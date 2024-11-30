/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/wallet/argentWallet.ts
import { ArgentTMA, SessionAccountInterface } from '@argent/tma-wallet';
import { Provider } from 'starknet';

export class ArgentWalletService {
  private argentTMA: ArgentTMA;

  constructor() {
    this.argentTMA = ArgentTMA.init({
      environment: "mainnet",
      appName: "StarkFinder Bot",
      appTelegramUrl: process.env.TELEGRAM_APP_URL!,
      sessionParams: {
        allowedMethods: [
          {
            contract: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
            selector: "transfer"
          },
          // Add other allowed methods based on your needs
        ],
        validityDays: 90
      },
      provider: new Provider({
        nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
      })
    });
  }

  async connect(userId: string): Promise<{account: SessionAccountInterface; address: string}> {
    try {
      // Check if user already has a session
      if (this.argentTMA.isConnected()) {
        const connection = await this.argentTMA.connect();
        if (connection && connection.account) {
          return {
            account: connection.account,
            address: connection.account.address
          };
        }
      }

      // Request new connection
      await this.argentTMA.requestConnection(userId);
      const connection = await this.argentTMA.connect();
      
      if (!connection || !connection.account) {
        throw new Error('Failed to connect wallet');
      }

      return {
        account: connection.account,
        address: connection.account.address
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  async executeTransaction(account: SessionAccountInterface, transactions: any[]) {
    try {
      // Execute transactions using the session account
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

  async checkSession(account: SessionAccountInterface): Promise<boolean> {
    return account.getSessionStatus() === "VALID";
  }
}
