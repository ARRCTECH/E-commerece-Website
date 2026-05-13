"use client";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { fetchNewArrivals } from "../store/slices/productSlice";

export default function NewArrivals() {
  const dispatch = useDispatch();
  const { newArrivals, loading } = useSelector((state) => state.products) || {
    newArrivals: [],
    loading: false,
  };
  const [productsToShow, setProductsToShow] = useState([]);

  useEffect(() => {
    dispatch(fetchNewArrivals());
  }, [dispatch]);

  useEffect(() => {
    if (newArrivals && newArrivals.length > 0) {
      setProductsToShow(newArrivals);
    }
  }, [newArrivals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  if (!productsToShow || productsToShow.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-neutral-50 via-white to-neutral-50 sm:py-5 overflow-hidden">
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />

      <div className="relative px-4 sm:px-6 lg:px-10">
        {/* Heading */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-medium tracking-[0.18em] uppercase mb-3">
              <Sparkles className="w-3 h-3" />
              Factory Sale
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-semibold text-neutral-900 tracking-tight leading-none">
              New <span className="italic font-light text-neutral-500">Arrivals</span>
            </h2>
            <div className="mt-3 h-px w-16 bg-gradient-to-r from-neutral-900 to-transparent" />
          </div>

          <Link
            to="/products"
            className="group hidden sm:inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            View All
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
            </span>
          </Link>
        </div>

        {/* Products Scroll */}
        <div className="relative -mx-4 sm:mx-0">
          <div className="flex overflow-x-auto gap-3 sm:gap-5 pb-3 px-4 sm:px-0 scrollbar-hide snap-x snap-mandatory">
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
                    w-[46%] sm:w-[31%] md:w-[23%] lg:w-[19%]
                    bg-white rounded-2xl overflow-hidden
                    border border-neutral-200/80 hover:border-neutral-900/40
                    transition-all duration-500
                  "
                >
                  {/* Index badge */}
                  <span className="absolute top-3 left-3 z-20 text-[10px] font-mono tracking-widest text-neutral-900/70 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {discountPercentage > 0 && (
                    <span className="absolute top-3 right-3 z-20 text-[10px] font-semibold tracking-wide text-white bg-neutral-900 px-2 py-0.5 rounded-full">
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
                      />
                      {/* Hover veil */}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Quick CTA */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-white font-medium">
                          View
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-neutral-900">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3 sm:p-4">
                    <p className="text-[9px] font-semibold tracking-[0.18em] text-neutral-500 uppercase mb-1">
                      {product.brand || "EXAMPLE BRAND"}
                    </p>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="text-[12px] sm:text-[13px] font-medium text-neutral-900 leading-snug line-clamp-2 mb-2 group-hover:text-neutral-700 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[15px] font-semibold text-neutral-900">
                        ₹{product.price}
                      </span>
                      {discountPercentage > 0 && (
                        <span className="text-[11px] text-neutral-400 line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile view all */}
        <div className="mt-6 sm:hidden flex justify-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-900 border-b border-neutral-900 pb-1"
          >
            View All Arrivals
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
