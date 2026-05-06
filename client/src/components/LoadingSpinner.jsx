"use client";
import { motion } from "framer-motion";
import React from "react";
const LoadingSpinner = ({ size = "large", message = "Loading..." }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };
  if (size === "large") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-12 h-12 mx-auto mb-4 border-4 border-pink-500 rounded-full border-t-transparent"
          />
          <p className="font-medium text-gray-600">{message}</p>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center p-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className={`${sizeClasses[size]} border-2 border-pink-500 border-t-transparent rounded-full`}
      />
    </div>
  );
};
export default LoadingSpinner;