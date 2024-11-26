import { ProcessedTransaction } from "../transaction/types";

export class MessageFormatter {
    static formatTransactionSummary(tx: ProcessedTransaction): string {
      const details = [
        `💫 *Transaction Summary*\n`,
        `*Type:* ${tx.action}`,
        `*Description:* ${tx.description}`
      ];

      if (tx.fromToken) {
        details.push(`*From:* ${tx.fromAmount} ${tx.fromToken.symbol}`);
      }

      if (tx.toToken) {
        details.push(`*To:* ${tx.toAmount} ${tx.toToken.symbol}`);
      }

      if (tx.receiver) {
        details.push(`*Receiver:* \`${tx.receiver}\``);
      }
  
      if (tx.protocol) {
        details.push(`*Protocol:* ${tx.protocol.toUpperCase()}`);
      }
  
      if (tx.estimatedGas && tx.estimatedGas !== '0') {
        details.push(`*Estimated Gas:* ${tx.estimatedGas} USD`);
      }
  
      details.push(`\n*Reply with "confirm" to execute this transaction.*`);
  
      return details.join('\n');
    }
  
    static formatHelp(isGroupChat: boolean, botUsername: string): string {
      return `StarkFinder Bot Guide 📚
  
  🔍 *Information Mode:*
  • Just ask any question about Starknet
  • Example: "How do accounts work?"
  • Example: "What is Cairo?"
  
  💰 *Transaction Mode:*
  • First connect wallet: /connect <address>
  • Then describe your transaction
  • Example: "deposit 1 STRK to Nostra"
  • Example: "swap 0.1 ETH for USDC"
  
  ⚙️ *Commands:*
  • /start - Start the bot
  • /help - Show this help message
  • /connect - Connect your wallet
  • /balance - Check your wallet balance
  • /disconnect - Disconnect your wallet
  • /clear - Clear conversation history
  • /status - Check bot status
  
  ${isGroupChat ? `\n🏢 *Group Chat:*
  • Mention me (@${botUsername}) in your message
  • Example: "@${botUsername} what is starknet?"` : ''}
  
  Need more help? Join @starkfindergroup`;
    }
  }
  