"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
const BewkoofStylePreloader = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {

    // 4 seconds minimum duration
    const timer = setTimeout(() => {
      setIsVisible(false);

      setTimeout(() => onComplete?.(), 500);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-red-800"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand Name with Animation */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              className="text-9xl md:text-6xl font-bold tracking-wider text-center"
              animate={{
                color: [
                  "#ff6b35", // Orange
                  "#f7931e", // Yellow-orange
                  "#e55a2b", // Red-orange
                  "#ff4757", // Red
                  "#3742fa", // Blue
                  "#2ed573", // Green
                  "#ffa502", // Yellow
                  "#ff6348", // Coral
                  "#9c88ff", // Purple
                  "#ff6b35", // Back to start
                ],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
            KSAUNIBLISS
            </motion.h1>
          </motion.div>
          {/* Animated Circles */}
          <div className="flex items-center space-x-4 mb-6">
            <motion.div
              className="w-12 h-12 rounded-full"
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
                  "#9c88ff", // Purple
                ],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="w-12 h-12 rounded-full"
              animate={{
                backgroundColor: [
                  "#f7931e", // Start with different color
                  "#e55a2b",
                  "#ff4757",
                  "#3742fa",
                  "#2ed573",
                  "#ffa502",
                  "#ff6348",
                  "#9c88ff",
                  "#ff6b35",
                ],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.4,
              }}
            />
          </div>
          {/* Subtitle with typing effect */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <motion.p
              className="text-lg md:text-xl font-light tracking-wide"
              animate={{
                color: [
                  "#666666",
                  "#ff6b35",
                  "#3742fa",
                  "#2ed573",
                  "#666666",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              Fashion & Style
            </motion.p>
          </motion.div>
          {/* Loading dots */}
          <motion.div
            className="flex space-x-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                animate={{
                  backgroundColor: [
                    "#ff6b35",
                    "#f7931e",
                    "#e55a2b",
                    "#ff4757",
                    "#3742fa",
                    "#2ed573",
                    "#ffa502",
                    "#ff6348",
                    "#9c88ff",
                  ],
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.3,
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
export default BewkoofStylePreloader;