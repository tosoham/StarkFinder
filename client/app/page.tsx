'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Bot, Plus, Send, Power, Moon, CircleDot } from "lucide-react"
import { argent, useAccount } from "@starknet-react/core";
import {ConnectButton, DisconnectButton} from "@/lib/Connect"

export default function Component() {
  const [darkMode, setDarkMode] = React.useState(true)
  const [messages, setMessages] = React.useState([
    {
      role: 'agent',
      content: 'Hey brother, how can I help you today',
      timestamp: '13:57'
    }
  ])
  const [input, setInput] = React.useState('')
  const { address } = useAccount()  
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setMessages([...messages, {
        role: 'user',
        content: input,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      }])
      setInput('')
    }
  }
  const connectors = [
    argent()
  ];
  
  return (
    <div className={cn("flex h-screen bg-background")}>
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 space-y-4">
          <Button variant="ghost" className="w-full justify-start">
            <Bot className="mr-2 h-4 w-4" />
            Agent Chats
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Bot className="mr-2 h-4 w-4" />
            Agent Txns
          </Button>
          <Separator />
          <Button variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            New Txn
          </Button>
        </div>
        <div className="mt-auto p-4 space-y-4">

          <div className="flex items-center text-sm">
            <CircleDot className="mr-2 h-4 w-4 text-green-500" />
            Online
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-semibold">Home</h1>
          <div>
            {address ? (
          <div className="flex items-center gap-4">          
              <div className="px-3 py-1 bg-muted rounded-md">  {address.slice(0, 5) + '...' + address.slice(-3)}</div>
              <DisconnectButton />
              </div>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2 items-start",
                  message.role === 'user' && "justify-end"
                )}
              >
                {message.role === 'agent' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  "rounded-lg p-3 max-w-[80%]",
                  message.role === 'agent' ? "bg-muted" : "bg-primary text-primary-foreground"
                )}>
                  <p>{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}