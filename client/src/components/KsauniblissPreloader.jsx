"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Alternative version with letter-by-letter animation
const KasuniBlissPreloader = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 500);
    }, 4500); // Slightly longer for letter animation
    return () => clearTimeout(timer);
  }, [onComplete]);
  const brandName = "kasunibliss";
  const letters = brandName.split("");
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-white via-gray-50 to-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Letter by letter animation */}
          <div className="flex items-center justify-center mb-8">
            {letters.map((letter, index) => (
              <motion.span
                key={index}
                className="text-5xl md:text-7xl font-bold tracking-wider"
                initial={{ opacity: 0, y: 50, rotateX: -90 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  color: [
                    "#ff6b35",
                    "#f7931e",
                    "#e55a2b",
                    "#ff4757",
                    "#3742fa",
                    "#2ed573",
                    "#ffa502",
                    "#ff6348",
                    "#9c88ff",
                    "#ff6b35",
                  ],
                }}
                transition={{
                  opacity: { delay: index * 0.1, duration: 0.6 },
                  y: { delay: index * 0.1, duration: 0.6 },
                  rotateX: { delay: index * 0.1, duration: 0.6 },
                  color: {
                    delay: 1 + index * 0.05,
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  },
                }}
                whileHover={{ scale: 1.1 }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
          {/* Animated circles */}
          <div className="flex items-center space-x-4 mb-6">
            <motion.div
              className="w-10 h-10 rounded-full"
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
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="w-6 h-6 rounded-full"
              animate={{
                backgroundColor: [
                  "#3742fa",
                  "#2ed573",
                  "#ffa502",
                  "#ff6348",
                  "#9c88ff",
                  "#ff6b35",
                  "#f7931e",
                  "#e55a2b",
                  "#ff4757",
                ],
                scale: [1, 1.5, 1],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
            <motion.div
              className="w-10 h-10 rounded-full"
              animate={{
                backgroundColor: [
                  "#2ed573",
                  "#ffa502",
                  "#ff6348",
                  "#9c88ff",
                  "#ff6b35",
                  "#f7931e",
                  "#e55a2b",
                  "#ff4757",
                  "#3742fa",
                ],
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.6,
              }}
            />
          </div>
          {/* Tagline */}
          <motion.p
            className="text-lg md:text-xl font-light tracking-widest text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              color: ["#666666", "#ff6b35", "#3742fa", "#2ed573", "#ff4757", "#666666"],
            }}
            transition={{
              opacity: { delay: 2, duration: 0.8 },
              scale: { delay: 2, duration: 0.8 },
              color: {
                delay: 2.5,
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              },
            }}
          >
            FASHION & LIFESTYLE
          </motion.p>
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <motion.div
              className="w-96 h-96 border-2 rounded-full"
              animate={{
                borderColor: ["#ff6b35", "#f7931e", "#e55a2b", "#ff4757", "#3742fa", "#2ed573", "#ffa502"],
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default KasuniBlissPreloader;