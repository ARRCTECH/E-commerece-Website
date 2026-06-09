"use client";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { fetchOversizedProducts } from "../store/slices/productSlice";

// ✅ Helper function to get product image (supports new schema)
const getProductImage = (product) => {
  if (!product) return "/placeholder.svg";
  
  // Check commonImages (new schema)
  if (product.commonImages && product.commonImages.length > 0) {
    return product.commonImages[0].url || product.commonImages[0];
  }
  
  // Check first color's images (new schema)
  if (product.colors && product.colors.length > 0) {
    const firstColor = product.colors[0];
    if (firstColor.images && firstColor.images.length > 0) {
      return firstColor.images[0].url || firstColor.images[0];
    }
  }
  
  // Fallback to old images array (if exists)
  if (product.images && product.images.length > 0) {
    return product.images[0].url || product.images[0];
  }
  
  return "/placeholder.svg";
};

// ✅ Helper function to get product price (supports bulk products)
const getProductPrice = (product) => {
  if (!product) return 0;
  if (product.isBulkProduct) {
    return product.bulkConfig?.pricePerSet || product.price || 0;
  }
  return product.price || 0;
};

// ✅ Helper function to get original price
const getOriginalPrice = (product) => {
  if (!product) return null;
  if (product.isBulkProduct) {
    return product.bulkConfig?.originalPricePerSet || product.originalPrice || null;
  }
  return product.originalPrice || null;
};

export default function Oversized() {
  const dispatch = useDispatch();
  const { oversizedProducts, loading } = useSelector((state) => state.products) || {
    oversizedProducts: [],
    loading: false,
  };
  const [productsToShow, setProductsToShow] = useState([]);

  useEffect(() => {
    dispatch(fetchOversizedProducts());
  }, [dispatch]);

  useEffect(() => {
    if (oversizedProducts && oversizedProducts.length > 0) {
      setProductsToShow(oversizedProducts.slice(0, 8));
    }
  }, [oversizedProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  if (!productsToShow || productsToShow.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header — Clean, minimal */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-6 h-px bg-neutral-300" />
            <span className="text-[11px] tracking-[0.3em] uppercase text-red-700">
              Oversized
            </span>
            <span className="w-6 h-px bg-neutral-300" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-900 tracking-tight">
            Oversized{" "}
            <span className="font-medium text-neutral-900">
              Essentials
            </span>
          </h2>
          
          <p className="mt-3 text-sm text-neutral-400 max-w-md mx-auto">
            Relaxed fit, premium comfort
          </p>
        </div>

        {/* Product Grid — Clean cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {productsToShow.map((product, idx) => {
            const productPrice = getProductPrice(product);
            const originalPrice = getOriginalPrice(product);
            const discountPercentage = originalPrice && originalPrice > productPrice
              ? Math.round(((originalPrice - productPrice) / originalPrice) * 100)
              : 0;
            const productImage = getProductImage(product);
            const isBulkProduct = product.isBulkProduct === true;

            return (
              <Link
                key={product._id}
                to={`/product/${product.slug}`}
                className="group block"
              >
                <div className="relative">
                  
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                    <img
                      src={productImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg";
                      }}
                    />

                    {/* Discount Badge */}
                    {discountPercentage > 0 && !isBulkProduct && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="text-[10px] font-medium text-white bg-neutral-900 px-2 py-0.5">
                          -{discountPercentage}%
                        </span>
                      </div>
                    )}

                    {/* Bulk Badge */}
                    {isBulkProduct && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="text-[9px] font-medium text-white bg-red-600 px-2 py-0.5 rounded">
                          BULK
                        </span>
                      </div>
                    )}

                    {/* HOVER OVERLAY - Product Info shows on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out flex flex-col justify-end p-5">
                      {/* Product Name */}
                      <h3 className="text-white text-sm sm:text-base md:text-lg font-semibold line-clamp-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100">
                        {product.name}
                      </h3>
                      
                      {/* Price Section */}
                      <div className="flex items-center gap-2 mt-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-150">
                        <span className="text-amber-400 text-lg sm:text-xl md:text-2xl font-bold">
                          ₹{productPrice.toLocaleString()}
                        </span>
                        {isBulkProduct && (
                          <span className="text-white/50 text-xs">/set</span>
                        )}
                        {discountPercentage > 0 && !isBulkProduct && (
                          <span className="text-white/50 text-sm line-through">
                            ₹{originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Bulk Info in Overlay */}
                      {isBulkProduct && (
                        <div className="mt-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-200">
                          <span className="inline-block text-[9px] font-semibold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded">
                            📦 Bulk Pack
                          </span>
                        </div>
                      )}

                      {/* Discount Badge in Overlay (if any) */}
                      {discountPercentage > 0 && !isBulkProduct && (
                        <div className="mt-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-200">
                          <span className="inline-block text-[10px] font-semibold text-green-400 bg-green-400/20 px-2 py-0.5 rounded">
                            Save {discountPercentage}%
                          </span>
                        </div>
                      )}

                      {/* Shop Now Indicator */}
                      <div className="mt-3 flex items-center gap-1 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-250">
                        <span className="text-[10px] tracking-wider uppercase text-white/60 group-hover:text-amber-400 transition-colors">
                          Shop Now
                        </span>
                        <ArrowUpRight className="w-3 h-3 text-white/60 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Original Info - Hidden on hover */}
                  <div className="mt-3 space-y-1 text-center group-hover:opacity-0 transition-opacity duration-300">
                    <h3 className="text-[13px] font-normal text-neutral-700 line-clamp-1">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[14px] font-medium text-neutral-900">
                        ₹{productPrice.toLocaleString()}
                      </span>
                      {isBulkProduct && (
                        <span className="text-[9px] text-neutral-400">/set</span>
                      )}
                      {discountPercentage > 0 && !isBulkProduct && (
                        <span className="text-[11px] text-neutral-400 line-through">
                          ₹{originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Link — Red Gradient Button with Hover Effect */}
        <div className="text-center mt-12">
          <Link
            to="/products?fits=oversized"
            className="group relative inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-semibold uppercase tracking-[0.25em] overflow-hidden shadow-lg shadow-red-500/20 active:scale-95 transition-all duration-300"
          >
            <span className="relative z-10">View All Oversized</span>
            <span className="relative z-10 w-5 h-5 rounded-full bg-white text-red-500 flex items-center justify-center transition-all duration-300 group-hover:rotate-45 group-hover:scale-110">
              <ArrowUpRight size={10} />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 scale-0 transition-transform duration-500 group-active:scale-100 group-active:opacity-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}