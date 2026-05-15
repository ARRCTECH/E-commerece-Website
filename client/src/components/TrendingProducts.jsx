"use client";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { fetchTrendingProducts } from "../store/slices/productSlice";

export default function TopPicksShowcase() {
  const dispatch = useDispatch();
  const { trendingProducts = [], loading } = useSelector((state) => state.products) || {
    trendingProducts: [],
    loading: false,
  };
  const [productsToShow, setProductsToShow] = useState([]);

  useEffect(() => {
    dispatch(fetchTrendingProducts());
  }, [dispatch]);

  useEffect(() => {
    if (trendingProducts && trendingProducts.length > 0) {
      setProductsToShow(trendingProducts.slice(0, 7));
    }
  }, [trendingProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 sm:py-20">
        <div className="h-8 w-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  if (!productsToShow || productsToShow.length === 0) return null;

  return (
    <section className="relative bg-gradient-to-b from-neutral-100 via-white to-neutral-50 py-6 sm:py-8 md:py-10 overflow-hidden">
      <div className="relative w-full px-0">
        {/* Heading - No top padding, edge to edge */}
        <div className="flex items-end justify-between mb-4 sm:mb-6 md:mb-8 px-4 sm:px-6 md:px-8">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-semibold text-neutral-900 tracking-tight leading-none">
              Top <span className="italic font-light text-neutral-500">Picks</span>
            </h2>
            <div className="mt-2 sm:mt-3 h-px w-12 sm:w-16 bg-gradient-to-r from-neutral-900 to-transparent" />
          </div>

          <Link
            to="/products"
            className="group hidden sm:inline-flex items-center gap-2 text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            View All
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:rotate-45 transition-transform duration-300" />
            </span>
          </Link>
        </div>

        {/* Products Scroll - No side padding */}
        <div className="relative w-full">
          <div className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-5 pb-4 sm:pb-6 scrollbar-hide snap-x snap-mandatory">
            {productsToShow.map((product, idx) => {
              const discountPercentage =
                product.originalPrice && product.originalPrice > product.price
                  ? Math.round(
                      ((product.originalPrice - product.price) / product.originalPrice) * 100
                    )
                  : 0;

              return (
                <div
                  key={product._id}
                  className="
                    group relative flex-shrink-0 snap-start
                    w-[70%] xs:w-[48%] sm:w-[32%] md:w-[28%] lg:w-[23%] xl:w-[19%]
                    bg-white rounded-xl sm:rounded-2xl overflow-hidden
                    border border-neutral-200/80 hover:border-neutral-900/40
                    transition-all duration-500
                    first:ml-4 sm:first:ml-6 md:first:ml-8
                    last:mr-4 sm:last:mr-6 md:last:mr-8
                  "
                >
                  {/* Index badge */}
                  <span className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20 text-[8px] sm:text-[10px] font-mono tracking-widest text-neutral-900/70 bg-white/80 backdrop-blur px-1.5 sm:px-2 py-0.5 rounded-full">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {discountPercentage > 0 && (
                    <span className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 text-[8px] sm:text-[10px] font-semibold tracking-wide text-white bg-neutral-900 px-1.5 sm:px-2 py-0.5 rounded-full">
                      -{discountPercentage}%
                    </span>
                  )}

                  {/* Image */}
                  <Link to={`/product/${product.slug}`} className="block">
                    <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
                      <img
                        src={product.images?.[0]?.url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Hover veil */}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Quick CTA */}
                      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.18em] text-white font-medium">
                          Quick View
                        </span>
                        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white text-neutral-900">
                          <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-2.5 sm:p-3 md:p-4">
                    <p className="text-[7px] sm:text-[8px] md:text-[9px] font-semibold tracking-[0.18em] text-neutral-500 uppercase mb-1 truncate">
                      {product.brand || product.category?.name || "TOP PICK"}
                    </p>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="text-[10px] sm:text-[11px] md:text-[13px] font-medium text-neutral-900 leading-snug line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-neutral-700 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[13px] sm:text-[14px] md:text-[15px] font-semibold text-neutral-900">
                        ₹{product.price?.toLocaleString()}
                      </span>
                      {discountPercentage > 0 && (
                        <span className="text-[9px] sm:text-[10px] md:text-[11px] text-neutral-400 line-through">
                          ₹{product.originalPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile view all button */}
        <div className="mt-5 sm:mt-6 md:mt-8 sm:hidden flex justify-center px-4">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-900 border-b border-neutral-900 pb-1"
          >
            View All Picks
            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}