"use client";

import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowUpRight, Sparkles, Eye, TrendingUp, Shield } from "lucide-react";
import { fetchKsauniTshirts } from "../../store/slices/ksauniTshirtSlice";

export default function KsauniTshirtStyle() {
  const dispatch = useDispatch();
  const { tshirts, loading, error } = useSelector((state) => state.ksauniTshirt) || {
    tshirts: [],
    loading: false,
    error: null,
  };
  const [productsToShow, setProductsToShow] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    dispatch(fetchKsauniTshirts());
  }, [dispatch]);

  useEffect(() => {
    if (tshirts && tshirts.length > 0) {
      setProductsToShow(tshirts.slice(0, 8));
    }
  }, [tshirts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-amber-500 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-light">Unable to load collection</p>
      </div>
    );
  }

  if (!productsToShow || productsToShow.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative bg-white py-16 sm:py-24 overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-white to-stone-50" />
      
      {/* Abstract geometric shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50/50 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-neutral-100 rounded-full blur-3xl" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Header Section */}
        <div className="mb-16 sm:mb-20">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              {/* Elegant subheading */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-gradient-to-r from-amber-500 to-transparent" />
                <span className="text-[11px] font-light tracking-[0.3em] text-neutral-500 uppercase">
                  The Edit
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-amber-500 to-transparent" />
              </div>
              
              {/* Main heading with premium typography */}
              <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-neutral-900 leading-[1.1]">
                Ksauni
                <span className="block text-3xl sm:text-4xl lg:text-5xl text-neutral-400 mt-2">
                  Silhouette Studies
                </span>
              </h2>
              
              {/* Decorative line */}
              <div className="mt-6 flex items-center gap-4">
                <div className="h-12 w-px bg-gradient-to-b from-amber-500 to-transparent" />
                <p className="text-neutral-500 font-light leading-relaxed max-w-md text-sm sm:text-base">
                  An exploration of form and fabric — where traditional craftsmanship meets contemporary architecture.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="text-right">
                <div className="text-2xl font-light text-neutral-900">{productsToShow.length}</div>
                <div className="text-[10px] tracking-wide text-neutral-400 uppercase mt-1">Pieces</div>
              </div>
              <div className="w-px h-12 bg-neutral-200" />
              <div className="text-right">
                <div className="text-2xl font-light text-neutral-900">100%</div>
                <div className="text-[10px] tracking-wide text-neutral-400 uppercase mt-1">Pima Cotton</div>
              </div>
              <div className="w-px h-12 bg-neutral-200" />
              <div className="text-right">
                <div className="text-2xl font-light text-neutral-900">Limited</div>
                <div className="text-[10px] tracking-wide text-neutral-400 uppercase mt-1">Edition</div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Grid Layout - Masonry style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {productsToShow.map((product, idx) => {
            const discountPercentage =
              product.originalPrice && product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
            
            const isLarge = idx === 0 || idx === 3;
            const isHovered = hoveredIndex === idx;

            return (
              <Link
                key={product._id}
                to={`/product/${product.slug || product._id}`}
                className={`group relative block ${isLarge ? 'sm:col-span-1 lg:row-span-1' : ''}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative overflow-hidden bg-neutral-100 rounded-2xl">
                  {/* Aspect ratio with premium sizing */}
                  <div className={`relative w-full ${isLarge ? 'aspect-[3/4]' : 'aspect-[4/5]'}`}>
                    {/* Image with cinematic zoom */}
                    <img
                      src={product.image?.url || product.images?.[0]?.url || "/placeholder.svg"}
                      alt={product.image?.alt || product.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110"
                    />
                    
                    {/* Gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    {/* Premium border effect on hover */}
                    <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 transition-all duration-500" />

                    {/* Index with elegant styling */}
                    <div className="absolute top-5 left-5 z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white/80 tracking-wider">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="h-px w-6 bg-white/40" />
                      </div>
                    </div>

                    {/* Premium badge for featured items */}
                    {idx === 0 && (
                      <div className="absolute top-5 right-5 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full">
                          <Shield className="w-3 h-3 text-amber-400" />
                          <span className="text-[9px] font-medium tracking-wider text-white uppercase">
                            Editor's Pick
                          </span>
                        </div>
                      </div>
                    )}

                    {discountPercentage > 0 && idx !== 0 && (
                      <div className="absolute top-5 right-5 z-10">
                        <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full">
                          <span className="text-[10px] font-semibold text-amber-400">
                            -{discountPercentage}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Hover CTA with premium animation */}
                    <div className="absolute inset-x-5 bottom-5 z-10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/20">
                        <span className="text-[10px] font-medium tracking-wider text-white uppercase">
                          Explore
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-white/80">
                            {typeof product.price === "number" ? `₹${product.price.toLocaleString()}` : product.price}
                          </span>
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <ArrowUpRight className="w-3 h-3 text-black" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product info with premium typography */}
                  <div className="p-5 bg-white">
                    <div className="mb-3">
                      <p className="text-[9px] font-light tracking-[0.2em] text-neutral-400 uppercase mb-1">
                        {product.collection || "KSAUNI STUDIO"}
                      </p>
                      <h3 className="font-serif text-base sm:text-lg font-medium text-neutral-900 leading-tight line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-light text-neutral-900">
                          {typeof product.price === "number" ? `₹${product.price.toLocaleString()}` : product.price}
                        </span>
                        {discountPercentage > 0 && product.originalPrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            ₹{product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Premium hover indicator */}
                      <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center group-hover:border-neutral-900 group-hover:bg-neutral-900 transition-all duration-300">
                        <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>

                    {/* Animated underline on hover */}
                    <div className="mt-3 h-px bg-neutral-100 overflow-hidden">
                      <div className="h-full w-0 bg-neutral-900 group-hover:w-full transition-all duration-700" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Premium CTA Section */}
        <div className="mt-20 text-center">
          <div className="inline-block">
            <Link
              to="/products?category=ksauni-tshirts-styles"
              className="group inline-flex items-center gap-4 px-8 py-4 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all duration-500 shadow-lg hover:shadow-xl"
            >
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase">
                Explore Full Collection
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-neutral-900 transition-all duration-300">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
          
          {/* Decorative elements */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-neutral-300" />
            <div className="flex items-center gap-2 text-neutral-400">
              <Eye className="w-3 h-3" />
              <span className="text-[10px] tracking-wider">Limited pieces available</span>
            </div>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-neutral-300" />
          </div>
        </div>
      </div>
    </section>
  );
}