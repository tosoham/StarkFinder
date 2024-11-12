/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { cn } from "@/lib/utils";
import GridPattern from "@/components/magicui/grid-pattern";
import { motion } from "framer-motion";
import { InfiniteMovingCardsDemo } from "./Testimonials";
export function GridPatternDemo() {
  const features = [
    "AI-Powered Matching",
    "Secure Blockchain Payments",
    "Real-Time Collaboration Tools"
  ];

  return (
    <div className="relative flex h-[500px] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      {/* Left side with text */}
      <div className="flex-1 flex flex-col justify-center p-10 z-10">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
        >
          Defiverrr Features
        </motion.h2>
        <ul className="space-y-6">
          {features.map((feature, index) => (
            <motion.li 
              key={index}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="p-6 rounded-lg bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-[5px_5px_10px_#d1d1d1,_-5px_-5px_10px_#ffffff] dark:shadow-[5px_5px_10px_#1e1e1e,_-5px_-5px_10px_#3a3a3a]"
            >
              <div className="flex items-center space-x-4">
                <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg">
                  {index + 1}
                </span>
                <span className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {feature}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
      {/* Right side with grid pattern */}
      <div className="flex-1 relative">
        <GridPattern
          squares={[
            [1, 1], [2, 2], [4, 3], [6, 4], [5, 6], [7, 7],
            [8, 8], [9, 9], [10, 10], [12, 11], [11, 12], [13, 13]
          ]}
          className={cn(
            "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
            "absolute inset-0 h-full w-full skew-y-12"
          )}
        />
      </div>
    </div>
  );
}