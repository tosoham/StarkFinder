/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "@starknet-react/core";
import { ConnectButton } from "@/lib/Connect";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initWebApp } from "./WebApp";

interface Message {
  role: string;
  id: string;
  content: string;
  timestamp: string;
  user: string;
  transaction?: {
    data: {
      transactions: Array<{
        contractAddress: string;
        entrypoint: string;
        calldata: string[];
      }>;
      fromToken?: any;
      toToken?: any;
      fromAmount?: string;
      toAmount?: string;
      receiver?: string;
      gasCostUSD?: string;
      solver?: string;
    };
    type: string;
  };
}

interface MessageContentProps {
  message: Message;
  onTransactionSuccess: (hash: string) => void;
}

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  onTransactionSuccess,
}) => {
  const [txHash, setTxHash] = React.useState<string | null>(null);
  const { account } = useAccount();

  const executeTransaction = async () => {
    if (!account || !message.transaction?.data?.transactions) return;

    try {
      for (const tx of message.transaction.data.transactions) {
        const response = await account.execute({
          contractAddress: tx.contractAddress,
          entrypoint: tx.entrypoint,
          calldata: tx.calldata,
        });
        await account.waitForTransaction(response.transaction_hash);
        setTxHash(response.transaction_hash);
        onTransactionSuccess(response.transaction_hash);
      }
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  if (message.transaction?.data?.transactions) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--tg-theme-text-color)]">{message.content}</p>
        {txHash ? (
          <div className="p-2 bg-green-500/10 rounded">
            Transaction successful! Hash: {txHash}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm mb-4">
              Ready to execute {message.transaction.type} transaction
            </p>
            <button
              onClick={executeTransaction}
              className="w-full py-2 px-4 rounded-lg bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] hover:opacity-90 transition-opacity duration-200"
            >
              Execute Transaction
            </button>
          </div>
        )}
      </div>
    );
  }
  return <p className="text-[var(--tg-theme-text-color)]">{message.content}</p>;
};

export default function TelegramMiniAppPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Telegram WebApp
    if (typeof window !== "undefined") {
      initWebApp();
    }

    // Set initial message
    setMessages([
      {
        id: uuidv4(),
        role: "agent",
        content:
          "Hello! I can help you with:\n\n" +
          "• Swap tokens\n" +
          "• Transfer tokens\n" +
          "• Deposit to protocols\n" +
          "• Withdraw from protocols\n" +
          "• Bridge tokens\n\n" +
          "What would you like to do?",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      },
    ]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleTransactionSuccess = (hash: string) => {
    const successMessage: Message = {
      id: uuidv4(),
      role: "agent",
      content:
        "Transaction successful! Would you like to perform another transaction?",
      timestamp: new Date().toLocaleTimeString(),
      user: "Agent",
    };
    setMessages((prev) => [...prev, successMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!address) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content:
          "Please connect your wallet first to proceed with the transaction.",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      user: "User",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputValue,
          address: address,
          chainId: "4012",
          messages: messages.concat(userMessage).map((msg) => ({
            sender: msg.role === "user" ? "user" : "brian",
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();
      let agentMessage: Message;

      if (
        data.error &&
        typeof data.error === "string" &&
        !data.error.includes("not recognized")
      ) {
        agentMessage = {
          id: uuidv4(),
          role: "agent",
          content: data.error,
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
      } else if (response.ok && data.result?.[0]?.data) {
        const { description, transaction } = data.result[0].data;
        agentMessage = {
          id: uuidv4(),
          role: "agent",
          content: description,
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
          transaction: transaction,
        };
      } else {
        agentMessage = {
          id: uuidv4(),
          role: "agent",
          content:
            "I'm sorry, I couldn't understand that. Could you try rephrasing your request?",
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
      }

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-none p-4 border-b border-white/20">
        {address ? (
          <div className="px-3 py-1 bg-white/10 rounded inline-block">
            {address.slice(0, 5)}...{address.slice(-3)}
          </div>
        ) : (
          <ConnectButton />
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            <div className="font-bold text-[var(--tg-theme-text-color)]">
              {message.role === "user" ? "You" : "Assistant"}:
            </div>
            <div className="bg-white/5 p-2 rounded-lg mt-1">
              <MessageContent
                message={message}
                onTransactionSuccess={handleTransactionSuccess}
              />
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </ScrollArea>

      <div className="flex-none p-4 border-t border-white/20">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
