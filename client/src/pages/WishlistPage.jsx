"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import {
  fetchWishlist,
  removeFromWishlist,
  clearWishlist,
  optimisticRemoveFromWishlist,
  selectWishlistItems,
  selectWishlistIsLoading,
  selectWishlistError,
} from "../store/slices/wishlistSlice";
import { addToCart, optimisticAddToCart } from "../store/slices/cartSlice";
import ProductCard from "../components/ProductCard";
import toast from "react-hot-toast";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectWishlistItems);
  const isLoading = useSelector(selectWishlistIsLoading);
  const error = useSelector(selectWishlistError);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const [removingItems, setRemovingItems] = useState(new Set());

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemoveFromWishlist = async (productId, productName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dispatch(optimisticRemoveFromWishlist(productId));
    setRemovingItems((prev) => new Set(prev).add(productId));
    const wish = document.getElementById("wish");
    if (wish) wish.click();
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.success(`${productName} removed from wishlist`);
    } catch (error) {
      dispatch(fetchWishlist());
      toast.error(error.message || "Failed to remove from wishlist");
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToCart = async (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isBulk = product.isBulkProduct === true;
    if (isBulk) return;

    const regularPayload = {
      productId: product._id,
      quantity: 1,
      size: product.sizes?.[0]?.size || "",
      color: product.colors?.[0]?.name || "",
      isBulkProduct: false,
    };

    dispatch(
      optimisticAddToCart({
        product: product,
        quantity: 1,
        size: regularPayload.size,
        color: regularPayload.color,
        isBulkProduct: false,
      })
    );

    const bag = document.getElementById("bag");
    if (bag) bag.click();

    try {
      await dispatch(addToCart(regularPayload)).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  const handleWishlist = async (product, e) => {
    await handleRemoveFromWishlist(product._id, product.name, e);
  };

  const handleClearWishlist = async () => {
    if (window.confirm("Are you sure you want to clear your wishlist?")) {
      try {
        await dispatch(clearWishlist()).unwrap();
        toast.success("Wishlist cleared successfully");
        const wish = document.getElementById("wish");
        if (wish) wish.click();
      } catch (error) {
        toast.error(error.message || "Failed to clear wishlist");
      }
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-rose-100 rounded-full"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-red-700 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-rose-50/40 px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-700" />
          </div>
          <p className="text-neutral-900 font-medium mb-1">Something went wrong</p>
          <p className="text-sm text-neutral-500 mb-6">{error}</p>
          <button
            onClick={() => dispatch(fetchWishlist())}
            className="px-6 py-2.5 text-sm font-medium text-white bg-red-700 rounded-xl hover:bg-red-800 active:scale-[0.98] transition-all shadow-lg shadow-red-700/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#fafaf7]">
      {/* Subtle texture & glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-rose-100/40 via-rose-50/20 to-transparent blur-2xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            aria-label="Go back"
          >
            <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-sm ring-1 ring-neutral-200/80 group-hover:shadow-md group-hover:-translate-x-0.5 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline">Back</span>
          </button>

          {items.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-700 bg-white ring-1 ring-red-100 rounded-full hover:bg-red-50 active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          )}
        </div>


        {/* <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 sm:mb-12 text-center"
        >
          

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-light text-neutral-900 tracking-tight">
            Your <span className="italic text-red-700">Wishlist</span>
          </h1>

          <p className="mt-3 text-xs sm:text-sm tracking-[0.2em] uppercase text-neutral-500">
            {items.length} {items.length === 1 ? "Item" : "Items"} · Saved with love
          </p>
        </motion.div> */}

        {/* Empty state */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto"
          >
            <div className="relative bg-white rounded-3xl ring-1 ring-neutral-200/80 shadow-xl shadow-neutral-200/40 p-8 sm:p-12 text-center overflow-hidden">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-100/60 rounded-full blur-2xl"></div>

              <div className="relative">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-rose-50 rounded-full"></div>
                  <Heart className="relative w-9 h-9 text-red-700" strokeWidth={1.5} />
                </div>

                <h2 className="mb-3 text-2xl font-serif font-medium text-neutral-900">
                  Nothing saved yet
                </h2>
                <p className="mb-8 text-sm leading-relaxed text-neutral-500">
                  Tap the heart on anything you love and we'll keep it safe right here for you.
                </p>

                <Link
                  to="/products"
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-medium tracking-wide text-white bg-red-700 rounded-full hover:bg-red-800 active:scale-[0.98] shadow-lg shadow-red-700/25 hover:shadow-xl hover:shadow-red-700/30 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Start Shopping</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Product grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              <AnimatePresence mode="popLayout">
                {items.map((product, index) => (
                  <motion.div
                    key={product._id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(index * 0.04, 0.4),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group"
                  >
                    <ProductCard
                      product={product}
                      wishlistItems={wishlistItems}
                      user={null}
                      onAddToCart={handleAddToCart}
                      onWishlist={handleWishlist}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Continue shopping CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-12 sm:mt-20"
            >
              {/* <div className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-rose-900 shadow-2xl shadow-red-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_50%)]"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

                <div className="relative px-6 py-10 sm:px-12 sm:py-14 text-center">
                  <h3 className="text-2xl sm:text-4xl font-serif font-light text-white mb-3">
                    Discover something new
                  </h3>
                  <p className="text-sm sm:text-base text-rose-100/90 mb-7 max-w-md mx-auto">
                    Fresh arrivals, timeless pieces. Find your next favorite today.
                  </p>
                  <Link
                    to="/products"
                    className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-medium text-red-700 bg-white rounded-full hover:bg-rose-50 active:scale-[0.98] shadow-xl transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Continue Shopping</span>
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </Link>
                </div>
              </div> */}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
