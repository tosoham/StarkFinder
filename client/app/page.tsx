"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Brain,
  Code,
  Lock,
  MessageCircle,
  ChevronRight,
  Menu,
  Plus,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const createNewChat = async () => {
    const id = uuidv4();
    await router.push(`/agent/chat/${id}`);
  };

  const createNewTxn = async () => {
    const id = uuidv4();
    await router.push(`/agent/transaction/${id}`);
  };
  useEffect(() => {
    const parallaxEffect = (e: { pageX: number; pageY: number }) => {
      const layers = document.querySelectorAll(".parallax");
      layers.forEach((layer) => {
        const speed = layer.getAttribute("data-speed");
        const x = (window.innerWidth - e.pageX * (Number(speed) || 0)) / 100;
        const y = (window.innerHeight - e.pageY * (Number(speed) || 0)) / 100;
        const layerElement = layer as HTMLElement;
        layerElement.style.transform = `translateX(${x}px) translateY(${y}px)`;
      });
    };

    document.addEventListener("mousemove", parallaxEffect);
    return () => document.removeEventListener("mousemove", parallaxEffect);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-purple-400" />
          <span className="text-2xl font-bold">NexusAI</span>
        </div>
        <div className="hidden md:flex space-x-6">
          <a
            href="#features"
            className="hover:text-purple-400 transition-colors"
          >
            Features
          </a>
          <a href="#demo" className="hover:text-purple-400 transition-colors">
            Demo
          </a>
          <a
            href="#pricing"
            className="hover:text-purple-400 transition-colors"
          >
            Pricing
          </a>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="justify-start gap-2 border border-white/20 hover:bg-white/10 transition-colors"
              >
                Launch App
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
        </div>
        <Button
          variant="ghost"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-gray-800 py-4"
        >
          <div className="container mx-auto px-6 flex flex-col space-y-4">
            <a
              href="#features"
              className="hover:text-purple-400 transition-colors"
            >
              Features
            </a>
            <a href="#demo" className="hover:text-purple-400 transition-colors">
              Demo
            </a>
            <a
              href="#pricing"
              className="hover:text-purple-400 transition-colors"
            >
              Pricing
            </a>
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
            </Dialog>{" "}
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            The Future of AI Chatbots is Here
          </h1>
          <p className="text-xl mb-8">
            Experience the power of Web3 and AI combined in one revolutionary
            platform.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full text-lg">
            Get Started <ChevronRight className="ml-2" />
          </Button>
        </motion.div>

        {/* Parallax Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="parallax absolute top-20 left-20" data-speed="2">
            <Brain className="h-16 w-16 text-purple-400 opacity-20" />
          </div>
          <div className="parallax absolute bottom-20 right-20" data-speed="-2">
            <Code className="h-16 w-16 text-blue-400 opacity-20" />
          </div>
          <div className="parallax absolute top-1/2 left-1/3" data-speed="1">
            <Lock className="h-12 w-12 text-green-400 opacity-20" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Why Choose NexusAI?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="h-12 w-12 mb-4 text-purple-400" />,
                title: "Advanced AI",
                description:
                  "Powered by cutting-edge machine learning algorithms.",
              },
              {
                icon: <Lock className="h-12 w-12 mb-4 text-purple-400" />,
                title: "Web3 Security",
                description:
                  "Decentralized architecture ensures your data stays private.",
              },
              {
                icon: (
                  <MessageCircle className="h-12 w-12 mb-4 text-purple-400" />
                ),
                title: "Natural Conversations",
                description: "Engage in fluid, context-aware dialogues.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-700 p-6 rounded-lg text-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {feature.icon}
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-12 text-center">
            See NexusAI in Action
          </h2>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <div className="mb-4 h-80 bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">AI Chat Interface Demo</p>
            </div>
            <div className="flex">
              <Input
                type="text"
                placeholder="Ask NexusAI anything..."
                className="flex-grow mr-2 bg-gray-700 border-gray-600 text-white"
              />
              <Button className="bg-purple-600 hover:bg-purple-700">
                Send
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-700 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of users already revolutionizing their AI
            interactions.
          </p>
          <Button className="bg-white text-purple-700 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-semibold">
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto px-6 flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Brain className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-bold">NexusAI</span>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-purple-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-purple-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-purple-400 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
