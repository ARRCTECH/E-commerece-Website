"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
const SimplePreloader = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Simple Blinking Logo */}
          <motion.div
            className="flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {/* Logo with multiple color blinking */}
            <motion.div
              className="text-6xl font-black tracking-wider"
              animate={{
                color: [
                  "#ff6b35", // Orange
                  "#f7931e", // Yellow-orange
                  "#e55a2b", // Red-orange
                  "#ff4757", // Red
                  "#3742fa", // Blue
                  "#2ed573", // Green
                  "#ffa502", // Yellow
                  "#ff6b35", // Back to orange
                ],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              LUXE
            </motion.div>
          </motion.div>
          {/* Optional: Simple dots indicator */}
          <motion.div
            className="absolute bottom-20 flex space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                animate={{
                  backgroundColor: ["#ff6b35", "#f7931e", "#e55a2b", "#ff4757", "#3742fa", "#2ed573", "#ffa502"],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default SimplePreloader;