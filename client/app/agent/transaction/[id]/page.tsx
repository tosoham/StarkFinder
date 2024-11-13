/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Send, Home, Mic } from "lucide-react";
import { useAccount } from "@starknet-react/core";
import { ConnectButton, DisconnectButton } from "@/lib/Connect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  interface Message {
    role: string;
    id: string;
    content: string;
    timestamp: string;
    user: string;
  }
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const { address } = useAccount();

  useEffect(() => {
    if (chatId) {
      console.log("Chat ID:", chatId);
      fetchChatHistory(chatId);
    } else {
      // Create a new chat ID and redirect to the new chat page
      createNewChat();
    }
  }, [chatId]);

  const createNewChat = async () => {
    const id = uuidv4();
    await router.push(`/agent/chat/${id}`);
  };

  const createNewTxn = async () => {
    const id = uuidv4();
    await router.push(`/agent/transaction/${id}`);
  };

  const fetchChatHistory = async (id: string) => {
    // Initialize with a greeting message
    setMessages([
      {
        id: uuidv4(),
        role: "agent",
        content: `GM Brother, how can I help you today?`,
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      },
    ]);
  };
  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: uuidv4(),
        role: 'user',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString(),
        user: 'User',
      };
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setInputValue('');
  
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: inputValue,
            address: address || '0x0',
            chainId: '4012', // Starknet mainnet
            messages: updatedMessages.map(msg => ({
              sender: msg.role === 'user' ? 'user' : 'brian',
              content: msg.content,
            })),
          }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          // First, log the response to debug
          console.log('API Response:', data);
  
          // Extract transaction data from the response
          const transactionData = data.result?.[0]?.data?.transaction;
          const description = data.result?.[0]?.data?.description;
  
          // Create a formatted message based on available data
          let formattedContent = description || 'Processing your request...';
  
          // Only add transaction details if they exist
          if (transactionData?.data) {
            formattedContent += '\n\nTransaction Details:';
            
            if (transactionData.type) {
              formattedContent += `\n- Type: ${transactionData.type}`;
            }
            
            if (transactionData.data.gasCostUSD) {
              formattedContent += `\n- Estimated Gas Cost: $${transactionData.data.gasCostUSD}`;
            }
  
            if (transactionData.data.fromToken) {
              formattedContent += `\n- From: ${transactionData.data.fromAmount} ${transactionData.data.fromToken.symbol}`;
            }
  
            if (transactionData.data.toToken) {
              formattedContent += `\n- To: ${transactionData.data.toAmount} ${transactionData.data.toToken.symbol}`;
            }
  
            if (transactionData.data.steps?.[0]?.chainId) {
              formattedContent += `\n- Network: ${getNetworkName(transactionData.data.steps[0].chainId)}`;
            }
          }
  
          const agentResponse = {
            id: uuidv4(),
            role: 'agent',
            content: formattedContent,
            timestamp: new Date().toLocaleTimeString(),
            user: 'Agent',
          };
  
          setMessages(prev => [...prev, agentResponse]);
        } else {
          throw new Error(data.error || 'Failed to process transaction');
        }
      } catch (error) {
        console.error('Error:', error);
        const errorResponse = {
          id: uuidv4(),
          role: 'agent',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to process your request'}`,
          timestamp: new Date().toLocaleTimeString(),
          user: 'Agent',
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    }
  };
  
// Updated helper function with correct Starknet chain ID
const getNetworkName = (chainId: number): string => {
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    137: 'Polygon',
    56: 'BSC',
    42161: 'Arbitrum',
    10: 'Optimism',
    4012: 'Starknet Mainnet',
    534352: 'Scroll',
    // Add more networks as needed
  };
  return networks[chainId] || `Chain ID ${chainId}`;
};


  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white font-mono relative overflow-hidden">
      {/* Dotted background */}
      <div
        className="absolute inset-0 bg-repeat opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Content wrapper */}
      <div className="flex w-full h-full relative z-10">
        {/* Sidebar */}
        <div className="w-48 border-r border-white/20 p-4 flex flex-col gap-2 bg-black/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            className="justify-start border border-white/20 hover:bg-white/10 transition-colors"
          >
            Agent Chat
          </Button>
          <Button
            variant="ghost"
            className="justify-start border border-white/20 hover:bg-white/10 transition-colors"
          >
            Agent Txn
          </Button>
          <Separator className="my-2 bg-white/20" />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="justify-start gap-2 border border-white/20 hover:bg-white/10 transition-colors"
              >
                <Plus className="h-4 w-4" /> New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Create New</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  variant="outline"
                  className="bg-slate-900 justify-start border border-white/20 hover:bg-white/10 transition-colors"
                  onClick={createNewChat}
                >
                  Chat
                </Button>
                <Button
                  variant="outline"
                  className="bg-slate-900 justify-start border border-white/20 hover:bg-white/10 transition-colors"
                  onClick={createNewTxn}
                >
                  Txn
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="mt-auto flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-500">Online</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-black/30 backdrop-blur-sm">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/20 bg-black/50">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <div className="flex items-center gap-4">
              {address ? (
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-muted rounded-md bg-slate-900">
                    {" "}
                    {address.slice(0, 5) + "..." + address.slice(-3)}
                  </div>
                  <DisconnectButton />
                </div>
              ) : (
                <ConnectButton />
              )}
            </div>
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-4">
            {messages.map((message, index) => (
              <div key={index} className="flex gap-2 mb-4 animate-fadeIn">
                <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center text-xs bg-white/5">
                  {message.role === "agent" ? "A" : "U"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">
                      {message.role === "agent" ? "Chat Agent" : "You"}
                    </span>
                    <span className="text-xs text-white/60">
                      ({message.timestamp})
                    </span>
                  </div>
                  <p className="text-white/80 bg-white/5 p-2 rounded-lg">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-white/20 bg-black/50">
            <div className="relative">
              <Input
                placeholder="Type Something..."
                className="bg-white/5 border border-white/20 text-white pl-4 pr-24 py-6 rounded-full focus:ring-2 focus:ring-white/50 transition-all"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/10 transition-colors rounded-full"
                onClick={handleSendMessage}
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-12 top-1/2 -translate-y-1/2 hover:bg-white/10 transition-colors rounded-full"
              >
                <Mic className="h-5 w-5" />
                <span className="sr-only">Voice input</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
