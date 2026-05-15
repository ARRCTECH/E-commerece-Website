"use client";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { fetchOversizedProducts } from "../store/slices/productSlice";

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
            const discountPercentage =
              product.originalPrice && product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

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
                      src={product.images?.[0]?.url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Discount Badge */}
                    {discountPercentage > 0 && (
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-medium text-white bg-neutral-900 px-2 py-0.5">
                          -{discountPercentage}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info — Minimal */}
                  <div className="mt-3 space-y-1 text-center">
                    <h3 className="text-[13px] font-normal text-neutral-700 line-clamp-1 group-hover:text-neutral-900 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[14px] font-medium text-neutral-900">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {discountPercentage > 0 && (
                        <span className="text-[11px] text-neutral-400 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Link — Clean */}
        <div className="text-center mt-12">
          <Link
            to="/products?category=oversized"
            className="inline-flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-neutral-600 hover:text-neutral-900 transition-colors group"
          >
            View All Oversized
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  );
}