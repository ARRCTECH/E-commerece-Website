"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { fetchCategories } from "../store/slices/categorySlice";

const FeaturedCategories = () => {
  const dispatch = useDispatch();
  const { categories, isLoading } = useSelector((state) => state.categories);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories({ showOnHomepage: true }));
  }, [dispatch]);

  if (isLoading) return <LoadingSpinner />;

  const featuredCategories =
    categories?.filter((cat) => cat.showOnHomepage)?.slice(0, 6) || [];

  return (
    <section className="relative z-20 py-14 sm:py-20 bg-gradient-to-b from-[#fafaf7] via-white to-[#fafaf7] overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-rose-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />

      <div className="relative w-full mx-auto" style={{ maxWidth: "1800px" }}>
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neutral-200 bg-white/70 backdrop-blur-sm shadow-sm mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-medium">
                Curated Edit
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extralight tracking-tight text-neutral-900">
              Top{" "}
              <span className="italic font-serif bg-gradient-to-r from-rose-600 via-neutral-900 to-neutral-900 bg-clip-text text-transparent">
                Category
              </span>
            </h2>

            <div className="mt-4 flex items-center gap-3">
              <span className="h-px w-10 bg-neutral-300" />
              <p className="text-xs sm:text-sm text-neutral-500 font-light tracking-wide">
                Style for every mood, every day
              </p>
              <span className="h-px w-10 bg-neutral-300" />
            </div>
          </div>

          {/* MOBILE: horizontal scroll */}
          <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 snap-x snap-mandatory pb-2">
              {featuredCategories.map((category, idx) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  className="snap-center flex-shrink-0 w-[46%]"
                >
                  <CategoryCard category={category} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* TABLET & DESKTOP */}
          <div
            className="hidden sm:grid gap-5 lg:gap-6"
            style={{
              gridTemplateColumns: `repeat(${Math.min(
                featuredCategories.length || 1,
                6
              )}, minmax(0, 1fr))`,
            }}
          >
            {featuredCategories.map((category, idx) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setHoveredId(category._id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <CategoryCard
                  category={category}
                  isHovered={hoveredId === category._id}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------- Card ---------- */
const CategoryCard = ({ category, isHovered }) => (
  <Link to={`/products?category=${category.slug}`} className="group block">
    <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] transition-all duration-700">
      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden bg-neutral-100">
        <img
          src={
            category.image?.url ||
            "/placeholder.svg?height=500&width=400&query=category image"
          }
          alt={category.image?.alt || category.name}
          className="object-cover object-center w-full h-full transition-transform duration-[1200ms] ease-out group-hover:scale-110"
        />

        {/* Bottom gradient veil */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />

        {/* Top-right CTA chip */}
        <div className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <ArrowUpRight className="h-4 w-4 text-neutral-900" strokeWidth={1.6} />
        </div>

        {/* Title — overlaid on image bottom */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-white/70 font-light mb-1">
            Shop
          </p>
          <h3 className="text-sm sm:text-lg lg:text-xl font-medium text-white uppercase tracking-wide leading-tight">
            {category.name}
          </h3>
          <div className="mt-2 h-px w-8 bg-white/70 group-hover:w-full transition-all duration-700" />
        </div>
      </div>
    </div>
  </Link>
);

export default FeaturedCategories;
