"use client";
import { useState, useEffect } from "react";
export const usePreloader = (minLoadTime = 2500) => {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Check if preloader has been shown in this session
    const preloaderShown = sessionStorage.getItem("luxe-preloader-shown");
    // Skip preloader if already shown in this session
    if (preloaderShown) {
      setIsLoading(false);
      return;
    }
    const startTime = Date.now();
    const handleLoad = () => {
      const loadTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadTime - loadTime);
      setTimeout(() => {
        setIsLoading(false);
        // Mark preloader as shown for this session
        sessionStorage.setItem("luxe-preloader-shown", "true");
      }, remainingTime);
    };
    // Check if page is already loaded
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, [minLoadTime]);
  return { isLoading };
};