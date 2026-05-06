"use client";
import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Star, ArrowDown, ChevronRight } from "lucide-react";
import { fetchProducts } from "../store/slices/productSlice";
import {
  addToCart,
  optimisticAddToCart,
  selectIsAddingToCart,
} from "../store/slices/cartSlice";
import {
  addToWishlist,
  removeFromWishlist,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist,
  selectIsAddingToWishlist,
  selectIsRemovingFromWishlist,
} from "../store/slices/wishlistSlice";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

const RelatedProducts = ({ currentProduct }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { products, isLoading } = useSelector((state) => state.products);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const isAddingToCart = useSelector(selectIsAddingToCart);
  const isAddingToWishlist = useSelector(selectIsAddingToWishlist);
  const isRemovingFromWishlist = useSelector(selectIsRemovingFromWishlist);

  // Fetch related products by category
  useEffect(() => {
    if (currentProduct?.category?._id) {
      dispatch(
        fetchProducts({
          category: currentProduct.category._id,
          limit: 8,
          exclude: currentProduct._id,
        })
      );
    }
  }, [dispatch, currentProduct?.category?._id, currentProduct?._id]);

  // Filter related products (exclude current product)
  const relatedProducts = useMemo(() => {
    if (!products || !currentProduct) return [];
    return products.filter((p) => p._id !== currentProduct._id).slice(0, 8);
  }, [products, currentProduct]);

  // Handle add to cart
  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const payload = {
        productId: product._id,
        quantity: 1,
        size: product.sizes?.[0]?.size || "",
        color: product.colors?.[0]?.name || "",
      };

      dispatch(
        optimisticAddToCart({
          product,
          quantity: 1,
          size: product.sizes?.[0]?.size || "",
          color: product.colors?.[0]?.name || "",
        })
      );

      toast.success(`${product.name} added to cart!`);
      await dispatch(addToCart(payload)).unwrap();
    } catch (error) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  // Handle wishlist add/remove
  const handleWishlist = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const isInWishlist = wishlistItems.some((item) => item._id === product._id);
      if (isInWishlist) {
        dispatch(optimisticRemoveFromWishlist(product._id));
        toast.success(`${product.name} removed from wishlist!`);
        await dispatch(removeFromWishlist(product._id)).unwrap();
      } else {
        dispatch(optimisticAddToWishlist(product));
        toast.success(`${product.name} added to wishlist!`);
        await dispatch(addToWishlist(product)).unwrap();
      }
    } catch (error) {
      toast.error(error.message || "Failed to update wishlist");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner message="Loading related products..." />
      </div>
    );
  }

  // If no related products found
  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="px-2 py-8 rounded-xl mx-auto">
      {/* ===== Section Header ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-gray-800 sm:text-lg">
            You Might Also Like
          </h4>
          <Link
            to={`/products/${currentProduct.category?.slug || ""}`}
            className="flex items-center text-xs font-medium text-ksauni-red hover:text-ksauni-dark-red sm:text-sm"
          >
            View All <ChevronRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
        <p className="mt-1 text-center text-xs text-gray-600 sm:text-left sm:text-sm">
          Similar products in {currentProduct.category?.name}
        </p>
      </div>

      {/* ===== Products Grid ===== */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence>
          {relatedProducts.map((product) => {
            const inWishlist = wishlistItems.some((item) => item._id === product._id);
            const hasDiscount =
              product.originalPrice && product.originalPrice > product.price;
            const discountPercent = hasDiscount
              ? Math.round(
                  ((product.originalPrice - product.price) / product.originalPrice) *
                    100
                )
              : 0;

            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="overflow-hidden transition-all duration-300 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md pb-3"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/4] overflow-hidden">
                  {/* <Link to={`/product/${product._id}`}> */}
                  <Link to={`/product/${product.slug}`}>

                    <img
                      src={product.images?.[0]?.url || "/placeholder.svg"}
                      alt={product.name}
                      className="object-cover w-full h-full rounded-xl"
                    />
                  </Link>

                  {/* Rating Badge */}
                  {product.rating && product.rating.average > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center bg-red-100 px-2 py-1 rounded-full shadow-xs border border-gray-200">
                      <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                      <span className="text-xs font-medium text-gray-800">
                        {product.rating.average.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleWishlist(product, e)}
                    disabled={isAddingToWishlist || isRemovingFromWishlist}
                    className="absolute p-1.5 transition-colors bg-white border rounded-full shadow-sm top-2 right-2 border-gray-200 hover:bg-gray-100 hover:text-red-500 disabled:opacity-50"
                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        inWishlist
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Product Details */}
                <div className="px-3 pt-2">
                  {/* <Link to={`/product/${product._id}`}> */}
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="mb-1 text-sm font-medium text-gray-800 line-clamp-2 sm:text-base">
                      {product.brand}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-1 sm:text-sm">
                      {product.name}
                    </p>
                  </Link>

                  {/* Price Section */}
                  <div className="flex items-center mt-2 mb-2 space-x-1">
                    {hasDiscount && (
                      <>
                        <span className="flex items-center text-xs font-medium text-green-600">
                          <ArrowDown className="w-3 h-3 mr-0.5" />
                          {discountPercent}%
                        </span>
                        <span className="text-xs text-gray-500 line-through">
                          ₹{product.originalPrice}
                        </span>
                      </>
                    )}
                    <span className="text-sm font-bold text-gray-800">
                      ₹{product.price}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={product.stock === 0 || isAddingToCart}
                    className="w-full py-2 text-xs font-medium text-red-600 transition-colors rounded-lg bg-white border border-red-300 hover:bg-red-600 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed sm:text-sm"
                  >
                    {isAddingToCart ? (
                      <div className="w-3 h-3 mx-auto border-2 border-red-600 rounded-full border-t-transparent animate-spin" />
                    ) : (
                      "Add to Cart"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RelatedProducts;
