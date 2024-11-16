"use client";

import React from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

export function InfiniteMovingCardsDemo() {
    return (
      <InfiniteMovingCards
        items={testimonials}
        direction="right"
        speed="slow"
      />
    );
}

const testimonials = [
    {
      quote:
        "The AI-powered trading assistant is incredible! It analyzes market trends and suggests optimal swap timings automatically. I've seen a significant improvement in my trading outcomes since using this platform.",
      name: "Alex Chen",
      title: "DeFi Trader",
    },
    {
      quote:
        "What sets this platform apart is how the AI handles complex transactions in the background. I just chat with it naturally, and it executes my trades on Starknet with amazing efficiency.",
      name: "Sarah Miller",
      title: "Crypto Investor",
    },
    {
      quote:
        "Finally, a Web3 platform that doesn't feel like rocket science! The conversational AI makes interacting with DeFi protocols feel as simple as chatting with a friend. Game-changer for mass adoption.",
      name: "Marcus Johnson",
      title: "Retail Investor",
    },
    {
      quote:
        "The AI's ability to monitor market conditions and automatically suggest portfolio rebalancing has saved me countless hours. Plus, the gas optimization on Starknet is incredible!",
      name: "Emma Zhang",
      title: "Portfolio Manager",
    },
    {
      quote:
        "I love how the AI handles complex DeFi strategies in the background while keeping the interface conversational. It's like having a crypto expert in my pocket 24/7.",
      name: "David Wilson",
      title: "DeFi Enthusiast",
    },
    {
      quote:
        "The platform's AI doesn't just execute trades – it explains its reasoning and helps me understand the market better. It's both a trading tool and a learning experience.",
      name: "Lisa Wang",
      title: "Crypto Analyst",
    },
    {
      quote:
        "As someone new to Web3, the natural language interface is a blessing. I can simply tell the AI what I want to achieve, and it handles all the complex blockchain interactions.",
      name: "Ryan Cooper",
      title: "New Crypto User",
    },
    {
      quote:
        "The combination of Starknet's speed and the AI's intelligence is unbeatable. Multi-step DeFi transactions that used to take hours now happen in minutes with minimal input.",
      name: "Sophia Patel",
      title: "DeFi Protocol User",
    },
    {
      quote:
        "The AI's risk assessment features have saved me from several potentially bad trades. It's like having a protective guardian watching over your investments 24/7.",
      name: "James Anderson",
      title: "Long-term Investor",
    },
    {
      quote:
        "I'm amazed by how the AI adapts to my trading style and risk preferences. It's personalized assistance at its finest, all while leveraging Starknet's robust infrastructure.",
      name: "Michelle Lee",
      title: "Active Trader",
    },
];