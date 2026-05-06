"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Even simpler version - just like bewkoof.com
const MinimalPreloader = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 200);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Simple blinking icon/logo */}
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            animate={{
              backgroundColor: [
                "#ff6b35", // Orange
                "#f7931e", // Yellow-orange
                "#e55a2b", // Red-orange
                "#ff4757", // Red
                "#3742fa", // Blue
                "#2ed573", // Green
                "#ffa502", // Yellow
                "#ff6348", // Coral
                "#ff6b35", // Back to start
              ],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <motion.span
              className="text-white"
              animate={{
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              L
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default MinimalPreloader;