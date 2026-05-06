"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
// Define spin animation once to avoid recalculating
const spinAnimation = {
  animate: { rotate: 360 },
  transition: {
    duration: 1,
    repeat: Number.POSITIVE_INFINITY,
    ease: "linear"
  }
};
// Define the size classes object outside the component to avoid recreating on every render
const sizeClasses = {
  small: "w-6 h-6",
  medium: "w-8 h-8",
  large: "w-12 h-12"
};
const LoadingSpinner = ({ size = "large", message = "Loading...", color = "pink", fullScreen = false }) => {
  // Determine border color based on prop
  const borderColorClass = `border-${color}-500`;
  // If full screen, show a nicer loading experience
  if (size === "large" || fullScreen) {
    return (
      <div className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[200px]"} bg-gradient-to-br from-${color}-50 to-purple-50`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            {...spinAnimation}
            className={`w-12 h-12 mx-auto mb-4 border-4 ${borderColorClass} rounded-full border-t-transparent`}
          />
          {message && <p className="font-medium text-gray-600">{message}</p>}
        </motion.div>
      </div>
    );
  }
  // For smaller, inline loading indicators
  return (
    <div className="flex items-center justify-center p-4">
      <motion.div
        {...spinAnimation}
        className={`${sizeClasses[size]} border-2 ${borderColorClass} border-t-transparent rounded-full`}
      />
    </div>
  );
};
LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  message: PropTypes.string,
  color: PropTypes.oneOf(["pink", "blue", "red", "green", "purple", "indigo"]),
  fullScreen: PropTypes.bool
};
export default memo(LoadingSpinner);