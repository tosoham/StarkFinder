import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransactionSuccessProps {
  type: string;
  hash: string;
  onNewTransaction: () => void;
}

export const TransactionSuccess: React.FC<TransactionSuccessProps> = ({
  type,
  hash,
  onNewTransaction
}) => {
  const starkscanUrl = `https://starkscan.co/tx/${hash}`;
  
  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900/50 border-white/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <CardTitle className="text-white">Transaction Successful</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-white/80">
          Your {type.toLowerCase()} transaction has been confirmed.
        </p>
        
        <div className="flex gap-2">
          <a 
            href={starkscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button 
              variant="outline" 
              className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              View on Starkscan
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <Button 
            onClick={onNewTransaction}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            New Transaction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};