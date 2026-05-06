import { lazy } from "react";
/**
 * Enhanced lazy loading utility that supports preloading
 *
 * @param {Function} importFn - The import function (e.g., () => import('./Component'))
 * @param {Object} options - Optional configuration
 * @param {boolean} options.preload - Whether to preload the component
 * @returns {React.LazyExoticComponent} - Lazy component with additional methods
 */
export const lazyLoad = (importFn, { preload = false } = {}) => {
  const LazyComponent = lazy(importFn);
  // Add preload method to the lazy component
  LazyComponent.preload = importFn;
  // If preload is enabled, trigger the import immediately
  if (preload) {
    importFn();
  }
  return LazyComponent;
};
/**
 * Preload a component or multiple components
 * @param {Array|Function} components - Component(s) to preload
 */
export const preloadComponents = (components) => {
  if (Array.isArray(components)) {
    components.forEach(component => {
      if (component.preload) {
        component.preload();
      }
    });
  } else if (components && components.preload) {
    components.preload();
  }
};
/**
 * Preload components based on viewport visibility using Intersection Observer
 * @param {Array} components - Array of components to preload when visible
 * @param {Element} root - Root element to observe (default: viewport)
 */
export const preloadOnVisible = (components, root = null) => {
  if (typeof IntersectionObserver === "undefined") {
    // Fallback for browsers without IntersectionObserver
    setTimeout(() => preloadComponents(components), 2000);
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        preloadComponents(components);
        observer.disconnect();
      }
    },
    { root, rootMargin: "200px", threshold: 0.1 }
  );
  // Observe the document body
  observer.observe(document.body);
  return () => observer.disconnect();
};