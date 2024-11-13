"use client"
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Send, Home, Mic, Ban, Menu } from "lucide-react";
import { useAccount } from "@starknet-react/core";
import { ConnectButton, DisconnectButton } from "@/lib/Connect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  interface Message {
    role: string;
    id: string;
    content: string;
    timestamp: string;
    user: string;
  }
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const { address } = useAccount();

  // Check if viewport is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamedResponse]);

  React.useEffect(() => {
    if (chatId) {
      console.log("Chat ID:", chatId);
      fetchChatHistory(chatId);
    } else {
      createNewChat();
    }
  }, [chatId]);

  const createNewChat = async () => {
    const id = uuidv4();
    await router.push(`/agent/chat/${id}`);
    setIsMobileMenuOpen(false);
  };

  const createNewTxn = async () => {
    const id = uuidv4();
    await router.push(`/agent/transaction/${id}`);
    setIsMobileMenuOpen(false);
  };

  const fetchChatHistory = async (id: string) => {
    console.log("Fetching chat history for ID:", id);
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
        role: "user",
        content: inputValue,
        timestamp: new Date().toLocaleTimeString(),
        user: "User",
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputValue("");
      setIsLoading(true);
      setStreamedResponse("");

      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: inputValue }),
        });
        const { answer } = await response.json();
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: uuidv4(),
            role: "agent",
            content: answer,
            timestamp: new Date().toLocaleTimeString(),
            user: "Agent",
          },
        ]);
        setAnswer(answer);
        setError("");
      } catch (err) {
        setError("Unable to get response from Brian's API");
        setAnswer("");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const Sidebar = () => (
    <div className="flex flex-col gap-2 p-4">
      <Button
        variant="ghost"
        className="justify-start border border-white/20 hover:bg-white/10 transition-colors"
      >
        Agent Chats
      </Button>
      <Button
        variant="ghost"
        className="justify-start border border-white/20 hover:bg-white/10 transition-colors"
      >
        Agent Txns
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
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 bg-repeat opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="flex w-full h-full relative z-10">
        {/* Sidebar for desktop */}
        {!isMobile && (
          <div className="w-48 border-r border-white/20 bg-black/50 backdrop-blur-sm">
            <Sidebar />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-black/30 backdrop-blur-sm">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/20 bg-black/50">
            <div className="flex items-center gap-2">
              {isMobile && (
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="mr-2">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 bg-gray-900 p-0">
                    <Sidebar />
                  </SheetContent>
                </Sheet>
              )}
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className={isMobile ? "sr-only" : ""}>Home</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {address ? (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-muted rounded-md bg-slate-900 text-sm truncate max-w-[120px]">
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
            <div className="max-w-3xl mx-auto">
              {messages.map((message, index) => (
                <div key={index} className={`mb-4 ${message.role === 'user' ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[85%]'}`}>
                  <div className="font-bold text-sm">
                    {message.role === "user" ? "You" : "Assistant"}:
                  </div>
                  <div className={`p-3 rounded-lg mt-1 ${
                    message.role === 'user' 
                      ? 'bg-blue-500/20 rounded-tr-none' 
                      : 'bg-white/5 rounded-tl-none'
                  }`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm">
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              )}
              {streamedResponse && (
                <div className="mb-4 mr-auto max-w-[85%]">
                  <div className="font-bold text-sm">Assistant:</div>
                  <div className="bg-white/5 p-3 rounded-lg rounded-tl-none mt-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm">
                      {streamedResponse}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-white/20 bg-black/50">
            <div className="relative max-w-3xl mx-auto">
              <Input
                placeholder="Type Something..."
                className="bg-white/5 border border-white/20 text-white pl-4 pr-24 py-6 rounded-full focus:ring-2 focus:ring-white/50 transition-all"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/10 transition-colors rounded-full"
                  disabled={isLoading}
                >
                  <Mic className="h-5 w-5" />
                  <span className="sr-only">Voice input</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/10 transition-colors rounded-full"
                  onClick={handleSendMessage}
                >
                  {isLoading ? <Ban className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}