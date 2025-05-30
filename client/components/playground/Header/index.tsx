/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Compile from "../Modal/Compile";
import { useAccount, useConnect } from "@starknet-react/core";
import { DisconnectButton } from "@/lib/Connect";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import Argent from "@/public/img/Argent Wallet.png";
import Bravoos from "@/public/img/bravoos wallet.jpeg";
import { Home, Upload, MessageSquare, Book, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  showClearButton: boolean;
  showFinishButton: boolean;
  handleClear: () => void;
  nodes: any;
  edges: any;
  flowSummary: any;
  selectedNode: any;
  handleDelete: (node: any) => void;
}

export default function Header({
  showClearButton,
  showFinishButton,
  handleClear,
  nodes,
  edges,
  flowSummary,
  selectedNode,
  handleDelete,
}: HeaderProps) {
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const isConnected = !!address;

  const router = useRouter();

  // Format wallet address for display
  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const handleConnect = async (connectorId: string) => {
    try {
      await connect({
        connector: connectors.find((c) => c.id === connectorId),
      });
      setIsWalletModalOpen(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const isDeleteVisible = !!selectedNode;

  const centerItems = (
    <motion.div
      className="flex-1 flex justify-center pb-4 md:pb-0 text-black md:text-white"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.5, delay: 0.5 }}
    >
      <ul className="flex flex-col md:flex-row gap-6">
        <li>
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110  duration-300 "
          >
            <Home size={18} /> Home
          </Link>
        </li>
        <li>
          <Link
            href="/deploy"
            className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300 "
          >
            <Upload size={18} /> Deploy
          </Link>
        </li>
        <li>
          <button
            onClick={() => router.push(`/agent/c/${uuidv4()}`)}
            className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
          >
            <MessageSquare size={18} /> Agent
          </button>
        </li>
        <li>
          <Link
            href="/devx/resources"
            className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110  duration-300 "
          >
            <Book size={18} /> Resources
          </Link>
        </li>
      </ul>
    </motion.div>
  );

  return (
    <>
      <header className="bg-[radial-gradient(circle,_#797474,_#e6e1e1,_#979191)] animate-smoke text-white w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            className="flex-1 flex items-center "
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <Link href={"/devx"}>
              <h2 className="text-md md:text-2xl font-semibold text-black cursor-pointer">
                DevXStark
              </h2>
            </Link>
          </motion.div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex gap-8 text-sm">{centerItems}</nav>

          {/* Right: Wallet Connection & Action Buttons */}
          <motion.div
            className="flex-1 flex items-center justify-start md:justify-end gap-1 "
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 1 }}
          >
            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {formatAddress(address)}
                </span>
                <DisconnectButton className="flex items-center gap-2 text-grayscale-200 border-red-200 hover:bg-red-50 hover:text-green-dark" />
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-2 hover:scale-110  duration-300 text-xs md:text-l "
              >
                <Wallet size={18} /> Connect Wallet
              </Button>
            )}

            {isDeleteVisible && (
              <Button
                onClick={() => handleDelete(selectedNode)}
                className="px-6 bg-[#252525] hover:bg-[#323232] text-white"
              >
                Delete node
              </Button>
            )}
            {showClearButton && (
              <Button
                onClick={handleClear}
                className="px-6 bg-[#252525] hover:bg-[#323232] text-white"
              >
                Clear
              </Button>
            )}
            {showFinishButton && (
              <Compile
                nodes={nodes}
                edges={edges}
                isOpen={isCompileModalOpen}
                onOpenChange={setIsCompileModalOpen}
                flowSummary={flowSummary}
              />
            )}
          </motion.div>

          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && centerItems}
      </header>

      {/* Wallet Connection Modal */}
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <h2>Connect your Starknet wallet</h2>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={() => handleConnect("argentX")}
              className="flex items-center justify-center gap-2"
            >
              <Image src={Argent.src} alt="Argent" width={40} height={40} />
              Connect with Argent
            </Button>
            <Button
              onClick={() => handleConnect("braavos")}
              className="flex items-center justify-center gap-2"
            >
              <Image
                src={Bravoos.src}
                alt="Braavos"
                width={36} // Set the width in pixels
                height={36} // Set the height in pixels
                className="rounded-md"
              />
              Connect with Braavos
            </Button>
            <Button
              onClick={() => handleConnect("injected")}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              Other Starknet Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
