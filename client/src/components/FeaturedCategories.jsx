"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { fetchCategories } from "../store/slices/categorySlice";

const FeaturedCategories = () => {
  const dispatch = useDispatch();
  const { categories, isLoading } = useSelector((s) => s.categories);

  useEffect(() => {
    dispatch(fetchCategories({ showOnHomepage: true }));
  }, [dispatch]);

  if (isLoading) return <LoadingSpinner />;

  const featured =
    categories?.filter((c) => c.showOnHomepage)?.slice(0, 6) || [];

  return (
    <section className="relative z-5 py-12 sm:py-20 bg-[#faf9f7]">
      <div className="relative w-full mx-auto" style={{ maxWidth: "1800px" }}>
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          {/* Header — refined */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 sm:mb-16 border-b border-neutral-300/50 pb-8">
            <div className="flex flex-col items-start text-left max-w-2xl">
              {/* Small accent badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-px bg-red-500/60" />
                <span className="text-[10px] tracking-[0.4em] uppercase text-red-500/80 font-medium">
                  Discover
                </span>
                <Sparkles className="w-3 h-3 text-red-500/60" />
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-neutral-900 leading-[1.08]">
                Shop by{" "}
                <span className="italic font-serif bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
                  Category
                </span>
              </h2>

              <p className="mt-4 text-sm text-neutral-500 font-light tracking-wide max-w-md">
                Style for every mood, every day — curated just for you.
              </p>
            </div>

            <Link
              to="/products"
              className="hidden md:inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-neutral-700 border-b border-neutral-700 pb-1 hover:gap-3 hover:text-red-600 hover:border-red-600 transition-all duration-300 group"
            >
              View all
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" strokeWidth={1.5} />
            </Link>
          </div>

          {/* Mobile scroll */}
          <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 snap-x snap-mandatory pb-4">
              {featured.map((c, i) => (
                <div key={c._id} className="snap-start flex-shrink-0 w-[70%]">
                  <CategoryCard category={c} index={i} />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop grid */}
          <div
            className="hidden sm:grid gap-5 lg:gap-6"
            style={{
              gridTemplateColumns: `repeat(${Math.min(
                featured.length || 1,
                6
              )}, minmax(0, 1fr))`,
            }}
          >
            {featured.map((c, i) => (
              <CategoryCard key={c._id} category={c} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------- Premium Category Card ---------- */
const CategoryCard = ({ category, index }) => (
  <Link
    to={`/products?category=${category.slug}`}
    className="group block"
  >
    <div className="relative overflow-hidden rounded-2xl bg-neutral-100 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-red-500/5">
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        {/* Image with zoom effect */}
        <img
          src={
            category.image?.url ||
            "/placeholder.svg?height=600&width=450&query=category image"
          }
          alt={category.image?.alt || category.name}
          className="object-cover object-center w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient overlay - refined */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-95" />
        
        {/* Subtle corner accent */}
        <div className="absolute top-5 left-5 w-6 h-6 border-t border-l border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-5 right-5 w-6 h-6 border-t border-r border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-5 left-5 w-6 h-6 border-b border-l border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-5 right-5 w-6 h-6 border-b border-r border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Index number - refined */}
        <div className="absolute top-5 left-5 flex items-center gap-2 z-10">
          <span className="text-white/40 text-xs font-light tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-6 bg-white/40" />
        </div>

        {/* Title section - refined */}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-10">
          <div className="transform transition-transform duration-500 group-hover:translate-y-[-4px]">
            <p className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase text-white/60 font-light mb-2 group-hover:text-red-400 transition-colors duration-300">
              Explore
            </p>
            <div className="flex items-end justify-between gap-3">
              <h3 className="text-base sm:text-lg lg:text-xl font-light text-white tracking-wide leading-tight group-hover:text-red-400 transition-colors duration-300">
                {category.name}
              </h3>
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/95 text-neutral-900 transition-all duration-500 group-hover:bg-red-500 group-hover:text-white group-hover:rotate-45 shadow-md">
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
              </span>
            </div>
          </div>
        </div>

        {/* Bottom accent line on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
      </div>
    </div>
  </Link>
);

export default FeaturedCategories;