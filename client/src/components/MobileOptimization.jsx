"use client";
import React ,{ useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Menu, Search, ShoppingBag, Heart, User } from "lucide-react";
// Mobile-optimized carousel component with touch gestures
export const MobileCarousel = ({ items, renderItem, autoPlay = true, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length]);
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };
  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      if (newDirection === 1) {
        return (prev + 1) % items.length;
      } else {
        return prev === 0 ? items.length - 1 : prev - 1;
      }
    });
  };
  const handleDragEnd = (e, { offset, velocity }) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
  };
  return (
    <div className="relative overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
          className="absolute inset-0"
        >
          {renderItem(items[currentIndex], currentIndex)}
        </motion.div>
      </AnimatePresence>
      {/* Navigation Dots */}
      <div className="absolute flex space-x-2 transform -translate-x-1/2 bottom-4 left-1/2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
      {/* Navigation Arrows (hidden on mobile) */}
      <button
        onClick={() => paginate(-1)}
        className="absolute hidden p-2 text-white transition-colors transform -translate-y-1/2 rounded-full left-4 top-1/2 bg-black/20 hover:bg-black/40 sm:block"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute hidden p-2 text-white transition-colors transform -translate-y-1/2 rounded-full right-4 top-1/2 bg-black/20 hover:bg-black/40 sm:block"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
// Mobile-optimized bottom navigation
export const MobileBottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "home", label: "Home", icon: Menu },
    { id: "search", label: "Search", icon: Search },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "cart", label: "Cart", icon: ShoppingBag },
    { id: "profile", label: "Profile", icon: User },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 sm:hidden">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                activeTab === tab.id ? "text-pink-600" : "text-gray-600"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
// Mobile-optimized drawer component
export const MobileDrawer = ({ isOpen, onClose, title, children, position = "bottom" }) => {
  const variants = {
    closed: {
      y: position === "bottom" ? "100%" : position === "top" ? "-100%" : 0,
      x: position === "left" ? "-100%" : position === "right" ? "100%" : 0,
    },
    open: {
      y: 0,
      x: 0,
    },
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50"
          />
          {/* Drawer */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={variants}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed z-50 bg-white ${
              position === "bottom"
                ? "bottom-0 left-0 right-0 rounded-t-2xl max-h-[80vh]"
                : position === "top"
                  ? "top-0 left-0 right-0 rounded-b-2xl max-h-[80vh]"
                  : position === "left"
                    ? "left-0 top-0 bottom-0 w-80 max-w-[80vw]"
                    : "right-0 top-0 bottom-0 w-80 max-w-[80vw]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
              <button onClick={onClose} className="p-2 transition-colors rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
// Mobile-optimized product grid with infinite scroll
export const MobileProductGrid = ({ products, onLoadMore, hasMore, loading }) => {
  const [page, setPage] = useState(1);
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        if (hasMore && !loading) {
          onLoadMore(page + 1);
          setPage((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, page, onLoadMore]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product, index) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="overflow-hidden bg-white rounded-lg shadow-sm"
          >
            <div className="bg-gray-100 aspect-square">
              <img
                src={product.images?.[0]?.url || "/placeholder.svg"}
                alt={product.name}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            </div>
            <div className="p-3">
              <h3 className="mb-1 text-sm font-medium text-gray-800 line-clamp-2">{product.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-pink-600">₹{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-gray-500 line-through">₹{product.originalPrice}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-pink-500 rounded-full border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
};
// Touch-optimized image gallery
export const TouchImageGallery = ({ images, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const handleSwipe = (direction) => {
    if (direction === "left" && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === "right" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  return (
    <>
      {/* Thumbnail Gallery */}
      <div className="space-y-4">
        <div className="overflow-hidden bg-gray-100 rounded-lg aspect-square">
          <img
            src={images[currentIndex]?.url || "/placeholder.svg"}
            alt={`Product ${currentIndex + 1}`}
            className="object-cover w-full h-full cursor-pointer"
            onClick={() => setIsFullscreen(true)}
          />
        </div>
        {images.length > 1 && (
          <div className="flex pb-2 space-x-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                  currentIndex === index ? "border-pink-500" : "border-transparent"
                }`}
              >
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={`Thumbnail ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Fullscreen Gallery */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute z-10 p-2 text-white transition-colors rounded-full top-4 right-4 bg-white/20 hover:bg-white/30"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative flex items-center justify-center w-full h-full">
              <motion.img
                key={currentIndex}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={images[currentIndex]?.url || "/placeholder.svg"}
                alt={`Product ${currentIndex + 1}`}
                className="object-contain max-w-full max-h-full"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, { offset }) => {
                  if (offset.x > 100) handleSwipe("right");
                  else if (offset.x < -100) handleSwipe("left");
                }}
              />
              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => handleSwipe("right")}
                    disabled={currentIndex === 0}
                    className="absolute p-3 text-white transition-colors transform -translate-y-1/2 rounded-full left-4 top-1/2 bg-white/20 hover:bg-white/30 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleSwipe("left")}
                    disabled={currentIndex === images.length - 1}
                    className="absolute p-3 text-white transition-colors transform -translate-y-1/2 rounded-full right-4 top-1/2 bg-white/20 hover:bg-white/30 disabled:opacity-50"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              {/* Dots Indicator */}
              <div className="absolute flex space-x-2 transform -translate-x-1/2 bottom-4 left-1/2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
export default {
  MobileCarousel,
  MobileBottomNav,
  MobileDrawer,
  MobileProductGrid,
  TouchImageGallery,
};