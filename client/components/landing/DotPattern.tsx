"use client";

import { cn } from "@/lib/utils";
import DotPattern from "@/components/magicui/dot-pattern";
import { InfiniteMovingCardsDemo } from "./Testimonials";
import { ShimmerButtonDemo } from "./HeaderButton";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Background() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center mb-12"
      >
        <h1 className="text-5xl font-bold font-mono tracking-tighter text-white mb-4">
          StarkFinder{" "}
        </h1>
        <p className="text-xl font-light text-gray-300 max-w-2xl mx-auto">
          The only platform you need for all things Starknet
        </p>
      </motion.div>

      <DotPattern
        className={cn(
          "absolute inset-0 text-white/[0.2] transition-opacity duration-500",
          scrollY > 100 ? "opacity-0" : "opacity-100"
        )}
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={0.5}
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-7xl px-4 relative"
      >
        <ShimmerButtonDemo />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <InfiniteMovingCardsDemo />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      />
    </div>
  );
}
