"use client";
import { useState, useEffect, memo } from "react";
import { AlertTriangle, WifiOff } from "lucide-react";
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    // Initialize with current online status - provides SSR safety
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [serverError, setServerError] = useState(null);
  useEffect(() => {
    // Network event handlers
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleNetworkError = (event) => setServerError(event.detail);
    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("networkError", handleNetworkError);
    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("networkError", handleNetworkError);
    };
  }, []);
  // If everything is fine, don't render anything
  if (isOnline && !serverError) return null;
  // Offline notification
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 p-2 text-center text-white bg-red-500">
        <div className="flex items-center justify-center space-x-2">
          <WifiOff className="w-4 h-4" />
          <span>You are offline. Please check your internet connection.</span>
        </div>
      </div>
    );
  }
  // Server error notification
  if (serverError) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 p-2 text-center text-white bg-orange-500">
        <div className="flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Server connection failed. Please try again later.</span>
          <button
            onClick={() => setServerError(null)}
            className="px-2 py-1 ml-4 text-xs bg-white rounded bg-opacity-20 hover:bg-opacity-30"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }
};
export default memo(NetworkStatus);