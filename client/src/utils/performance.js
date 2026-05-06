/**
 * Performance optimization utilities for client application
 */
/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @param {boolean} immediate - Whether to call the function immediately
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};
/**
 * Throttle function to ensure a function is not called more often than specified
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};
/**
 * Optimizes images by resizing and compressing based on device
 * @param {string} src - Image source URL
 * @param {Object} options - Image optimization options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height
 * @param {string} options.format - Image format (webp, jpeg, etc.)
 * @param {number} options.quality - Image quality (1-100)
 * @returns {string} - Optimized image URL
 */
export const optimizeImage = (src, { width, height, format = "webp", quality = 80 } = {}) => {
  // If no src or it's a data URL, return as is
  if (!src || src.startsWith("data:")) return src;
  // If using a CDN with image optimization (imgix, Cloudinary, etc.)
  // This is a placeholder for actual CDN implementation
  if (src.includes("cloudinary.com")) {
    return src
      .replace("/upload/", `/upload/q_${quality},f_${format}/`)
      .concat(`?w=${width}&h=${height}`);
  }
  // For local images, we can add query params that our build process might handle
  if (src.startsWith("/") && (width || height)) {
    const params = new URLSearchParams();
    if (width) params.append("w", width);
    if (height) params.append("h", height);
    if (format) params.append("fm", format);
    if (quality) params.append("q", quality);
    return `${src}?${params.toString()}`;
  }
  return src;
};
/**
 * Preconnect to important domains to improve performance
 * @param {Array} domains - List of domains to preconnect to
 */
export const preconnect = (domains = []) => {
  if (typeof document === "undefined") return;
  domains.forEach(domain => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = domain;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
};
/**
 * Add preload hints for critical resources
 * @param {Array} resources - List of resources to preload
 */
export const preloadResources = (resources = []) => {
  if (typeof document === "undefined") return;
  resources.forEach(({ href, as, type, crossOrigin }) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    if (as) link.as = as;
    if (type) link.type = type;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    document.head.appendChild(link);
  });
};
/**
 * Enable performance monitoring in development
 */
export const enablePerformanceMonitoring = () => {
  if (typeof window === "undefined" || import.meta.env.MODE !== "development") return;
  // Monitor component render times
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === "string" && args[0].includes("component")) {
      // This captures React render timing warnings
      originalConsoleWarn.apply(console, ["[PERFORMANCE]", ...args]);
    } else {
      originalConsoleWarn.apply(console, args);
    }
  };
  // Monitor page load performance
  window.addEventListener("load", () => {
    if (performance && performance.getEntriesByType) {
      const perfEntries = performance.getEntriesByType("navigation");
      if (perfEntries.length > 0) {
        const timing = perfEntries[0];
      }
    }
  });
};