export class IntentDetector {
    private transactionKeywords = [
      'swap', 'transfer', 'send', 'deposit', 'withdraw',
      'bridge', 'exchange', 'convert', 'move', 'pay'
    ];
  
    private amountPattern = /\d+(\.\d+)?/;
    private tokenPattern = /(?:eth|strk|usdc|usdt|dai)\b/i;
    private addressPattern = /0x[a-fA-F0-9]{40,}/i;
  
    detectIntent(text: string): 'transaction' | 'question' {
      // Clean and normalize text
      const normalizedText = text.toLowerCase();
      
      // Check for transaction indicators
      const hasTransactionKeyword = this.transactionKeywords.some(keyword => 
        normalizedText.includes(keyword)
      );
      const hasAmount = this.amountPattern.test(normalizedText);
      const hasToken = this.tokenPattern.test(normalizedText);
      const hasAddress = this.addressPattern.test(normalizedText);
  
      // If it has transaction-like characteristics, classify as transaction
      if ((hasTransactionKeyword && (hasAmount || hasToken)) || hasAddress) {
        return 'transaction';
      }
  
      return 'question';
    }
  }
  