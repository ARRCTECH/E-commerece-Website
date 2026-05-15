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
    <section className="relative z-5 py-8 sm:py-16 bg-[#f6f5f1]">
      <div className="relative w-full mx-auto" style={{ maxWidth: "1800px" }}>
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          {/* Header — left aligned */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-1 sm:mb-16 border-b border-neutral-300/70 pb-8">
            <div className="flex flex-col items-start text-left max-w-2xl">
              {/* <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-neutral-300 bg-white mb-5">
                <Sparkles className="h-3 w-3 text-neutral-700" strokeWidth={1.5} />
                <span className="text-[10px] tracking-[0.4em] uppercase text-neutral-700 font-medium">
                  Factory Sale
                </span>
              </div> */}

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extralight tracking-tight text-neutral-900 leading-[1.05]">
                Shop by{" "}
                <span className="italic font-serif text-neutral-900">
                  Category
                </span>
              </h2>

              <p className="mt-4 text-sm text-neutral-500 font-light tracking-wide">
                Style for every mood, every day.
              </p>
            </div>

            <Link
              to="/products"
              className="hidden md:inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-neutral-900 border-b border-neutral-900 pb-1 hover:gap-3 transition-all duration-300"
            >
              View all
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>

          {/* Mobile scroll */}
          <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 snap-x snap-mandatory pb-2">
              {featured.map((c, i) => (
                <div key={c._id} className="snap-start flex-shrink-0 w-[70%]">
                  <CategoryCard category={c} index={i} />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop grid */}
          <div
            className="hidden sm:grid gap-4 lg:gap-5"
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

/* ---------- Card — flat modern, no shadow ---------- */
const CategoryCard = ({ category, index }) => (
  <Link
    to={`/products?category=${category.slug}`}
    className="group block"
  >
    <div className="relative overflow-hidden rounded-xl bg-neutral-200">
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        <img
          src={
            category.image?.url ||
            "/placeholder.svg?height=600&width=450&query=category image"
          }
          alt={category.image?.alt || category.name}
          className="object-cover object-center w-full h-full"
        />

        {/* Soft bottom veil for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Index */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          
          <span className="h-px w-5 bg-white/60" />
        </div>

        {/* Title */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase text-white/70 font-light mb-1.5">
            Explore
          </p>
          <div className="flex items-end justify-between gap-3">
            <h3 className="text-base sm:text-lg lg:text-xl font-light text-white tracking-wide leading-tight">
              {category.name}
            </h3>
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/95 text-neutral-900">
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

export default FeaturedCategories;
