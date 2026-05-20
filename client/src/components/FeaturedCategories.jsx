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
    categories?.filter((c) => c.showOnHomepage)?.slice(0, 8) || [];

  // mobile 2 cards per page (changed from 4 to 2 for bigger cards)
  const chunkedCategories = [];
  for (let i = 0; i < featured.length; i += 2) {
    chunkedCategories.push(featured.slice(i, i + 2));
  }

  return (
    <section className="z-5 py-8 sm:py-12 bg-[#faf9f7]">
      <div className="relative w-full mx-auto" style={{ maxWidth: "1800px" }}>
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 sm:mb-12 border-b border-neutral-300/50 pb-8">
            <div className="flex flex-col items-start text-left max-w-2xl">
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
                Curated styles for every vibe.
              </p>
            </div>

            <Link
              to="/products"
              className="hidden md:inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-neutral-700 border-b border-neutral-700 pb-1 hover:gap-3 hover:text-red-600 hover:border-red-600 transition-all duration-300 group"
            >
              View all
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45"
                strokeWidth={1.5}
              />
            </Link>
          </div>

          {/* Mobile horizontal slider - 2 cards per page with increased height */}
          <div className="sm:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
            <div className="flex gap-4 px-1">
              {chunkedCategories.map((group, pageIndex) => (
                <div
                  key={pageIndex}
                  className="min-w-full snap-center grid grid-cols-2 gap-3"
                >
                  {group.map((c, i) => (
                    <CategoryCard
                      key={c._id}
                      category={c}
                      index={pageIndex * 2 + i}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Grid - Responsive columns */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 lg:gap-6">
            {featured.map((c, i) => (
              <CategoryCard key={c._id} category={c} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const CategoryCard = ({ category, index }) => (
  <Link to={`/products?category=${category.slug}`} className="group block">
    <div className="relative overflow-hidden rounded-2xl bg-neutral-100 transition-all duration-500 hover:shadow-xl group-hover:-translate-y-1">
      <div className="relative w-full aspect-[2/3] sm:aspect-[3/4] md:aspect-[2/3] overflow-hidden">
        {/* Increased height: aspect-[2/3] is taller than [3/4] */}

        <img
          src={
            category.image?.url ||
            "/placeholder.svg?height=600&width=450&query=category image"
          }
          alt={category.image?.alt || category.name}
          className="object-cover object-center w-full h-full transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradient Overlay - darker for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Top left number */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <span className="text-white/50 text-xs font-light tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-5 bg-white/40" />
        </div>

        {/* Bottom content - improved spacing */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10">
          <p className="text-[9px] sm:text-[10px] tracking-[0.35em] uppercase text-white/70 font-light mb-2 sm:mb-3">
            Explore
          </p>

          <div className="flex items-end justify-between gap-3">
            <h3 className="text-sm sm:text-base md:text-lg font-light text-white tracking-wide leading-tight">
              {category.name}
            </h3>

            <span className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white">
              <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
            </span>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

export default FeaturedCategories;