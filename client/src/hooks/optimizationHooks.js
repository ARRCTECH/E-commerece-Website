import { useState, useEffect, useCallback, useRef } from "react";
/**
 * Custom hook for handling intersection observer functionality with options
 * @param {Object} options - IntersectionObserver options
 * @param {Function} callback - Function to call when element enters viewport
 * @returns {Object} ref to be attached to the observed element
 */
export const useIntersectionObserver = (options = {}, callback = () => {}) => {
  const {
    root = null,
    rootMargin = "0px",
    threshold = 0,
    triggerOnce = false
  } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);
  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    setIsIntersecting(entry.isIntersecting);
    if (entry.isIntersecting) {
      callback(entry);
      if (triggerOnce) {
        setHasTriggered(true);
        if (observerRef.current && elementRef.current) {
          observerRef.current.unobserve(elementRef.current);
        }
      }
    }
  }, [callback, triggerOnce]);
  useEffect(() => {
    if (hasTriggered) return;
    const observer = new IntersectionObserver(handleIntersection, {
      root,
      rootMargin,
      threshold
    });
    observerRef.current = observer;
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => {
      if (observer && elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [handleIntersection, root, rootMargin, threshold, hasTriggered]);
  return { ref: elementRef, isIntersecting, hasTriggered };
};
/**
 * Custom hook for detecting and using window resize events
 * @param {number} debounceTime - Debounce time in ms
 * @returns {Object} width and height of the window
 */
export const useWindowSize = (debounceTime = 250) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceTime);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [debounceTime]);
  return windowSize;
};
/**
 * Custom hook for lazy loading components or data
 * @param {Function} factory - Factory function that returns a Promise
 * @param {Array} deps - Dependencies array for the useEffect
 * @returns {Object} Loading state and data
 */
export const useLazyLoad = (factory, deps = []) => {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null
  });
  useEffect(() => {
    let mounted = true;
    setState(prev => ({ ...prev, loading: true }));
    factory()
      .then(data => {
        if (mounted) {
          setState({
            loading: false,
            error: null,
            data
          });
        }
      })
      .catch(error => {
        if (mounted) {
          setState({
            loading: false,
            error,
            data: null
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, deps);
  return state;
};
/**
 * Custom hook for checking if component is mounted
 * Useful for preventing state updates on unmounted components
 * @returns {Object} isMounted reference
 */
export const useIsMounted = () => {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
};
/**
 * Custom hook for handling scroll position
 * @param {number} throttleTime - Throttle time in ms
 * @returns {Object} scrollX, scrollY, and scrollDirection
 */
export const useScrollPosition = (throttleTime = 100) => {
  const [scrollPosition, setScrollPosition] = useState({
    scrollX: typeof window !== "undefined" ? window.scrollX : 0,
    scrollY: typeof window !== "undefined" ? window.scrollY : 0,
    scrollDirection: null
  });
  const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const ticking = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const direction = currentScrollY > lastScrollY.current ? "down" : "up";
          setScrollPosition({
            scrollX: window.scrollX,
            scrollY: currentScrollY,
            scrollDirection: direction
          });
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    let timeoutId;
    const throttledHandleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null;
      }, throttleTime);
    };
    window.addEventListener("scroll", throttledHandleScroll);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", throttledHandleScroll);
    };
  }, [throttleTime]);
  return scrollPosition;
};