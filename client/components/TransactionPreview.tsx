/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertCircle } from 'lucide-react';

interface TransactionPreviewProps {
  type: string;
  description: string;
  data: {
    transactions: Array<{ contractAddress: string; entrypoint: string; calldata: string[]; }>;
    fromToken?: any;
    toToken?: any;
    fromAmount?: string;
    toAmount?: string;
    receiver?: string;
    gasCostUSD?: string;
    solver?: string;
    protocol?: string;
    bridge?: any;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({
  type,
  description,
  data,
  onConfirm,
  onCancel
}) => {
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Review Transaction
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Transaction Details */}
          <div className="space-y-2">
            <div className="font-medium">Details:</div>
            <div className="text-sm">
              <div>Type: {type}</div>
              {data.fromToken && (
                <div>From: {data.fromAmount} {data.fromToken.symbol}</div>
              )}
              {data.toToken && (
                <div>To: {data.toAmount} {data.toToken.symbol}</div>
              )}
              {data.receiver && (
                <div>Receiver: {data.receiver.slice(0, 6)}...{data.receiver.slice(-4)}</div>
              )}
              {data.protocol && <div>Protocol: {data.protocol}</div>}
              {data.gasCostUSD && <div>Estimated Gas: ${data.gasCostUSD}</div>}
              {data.bridge && (
                <>
                  <div>Source: {data.bridge.sourceNetwork}</div>
                  <div>Destination: {data.bridge.destinationNetwork}</div>
                </>
              )}
            </div>
          </div>

          {/* Transaction Steps */}
          <div className="space-y-2">
            <div className="font-medium">Steps:</div>
            <div className="text-sm space-y-1">
              {data.transactions.map((tx, index) => (
                <div key={index} className="bg-secondary p-2 rounded">
                  {tx.entrypoint} @ {tx.contractAddress.slice(0, 6)}...{tx.contractAddress.slice(-4)}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end mt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
              <Check className="mr-2 h-4 w-4" /> Confirm Transaction
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};