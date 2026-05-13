"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { setFilters } from "../store/slices/productSlice";

const PriceSelection = ({ selectedPrice }) => {
  const [selectedOption, setSelectedOption] = useState(selectedPrice || null);
  const [hoveredId, setHoveredId] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const priceOptions = [
    { id: "under649",  label: "Essentials", sublabel: "₹649",  value: 649,  tag: "Daily picks" },
    { id: "under799",  label: "Smart Buys", sublabel: "₹799",  value: 799,  tag: "Trending" },
    { id: "under999",  label: "Premium",    sublabel: "₹999",  value: 999,  tag: "Best value" },
    { id: "under1499", label: "Luxe",       sublabel: "₹1499", value: 1499, tag: "Top tier" },
  ];

  const handleOptionClick = (option) => {
    setSelectedOption(option.id);
    dispatch(setFilters({ minPrice: "", maxPrice: option.value }));
    navigate(`/products?maxPrice=${option.value}`);
  };

  return (
    <section className="relative w-full mt-6 px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="relative w-full mx-auto" style={{ maxWidth: "1600px" }}>
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-neutral-900/5 backdrop-blur border border-neutral-900/10">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-700 font-semibold">
              Shop by budget
            </span>
          </div>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900">
            Price{" "}
            <span className="bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
              Selection
            </span>
          </h3>
          <p className="mt-2 text-sm sm:text-base text-neutral-500 max-w-md">
            Curated styles tailored to every budget — no compromise on quality.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {priceOptions.map((option, idx) => {
            const isSelected = selectedOption === option.id;
            const isHovered = hoveredId === option.id;
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredId(option.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => handleOptionClick(option)}
                className={`group relative w-full text-left rounded-2xl overflow-hidden focus:outline-none transition-all duration-500 ${
                  isSelected ? "ring-2 ring-rose-500 ring-offset-2 ring-offset-white" : ""
                }`}
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black" />

                {/* Animated red glow */}
                <div
                  className={`absolute -inset-px bg-gradient-to-br from-rose-600/40 via-red-500/20 to-transparent transition-opacity duration-500 ${
                    isHovered || isSelected ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Grid pattern */}
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* Shimmer sweep */}
                <motion.div
                  initial={{ x: "-150%" }}
                  animate={isHovered ? { x: "150%" } : { x: "-150%" }}
                  transition={{ duration: 1.1, ease: "easeInOut" }}
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                />

                {/* Glow blob */}
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-rose-500/30 blur-3xl group-hover:bg-rose-500/50 transition-colors duration-500" />

                {/* Content */}
                <div className="relative aspect-[4/5] p-4 sm:p-5 flex flex-col justify-between">
                  {/* Top: tag */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[10px] sm:text-[11px] uppercase tracking-wider text-white/80 font-medium">
                      {option.tag}
                    </span>
                    <motion.div
                      animate={{ rotate: isHovered ? 45 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-lg"
                    >
                      <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                    </motion.div>
                  </div>

                  {/* Bottom: price */}
                  <div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/50 mb-1">
                      Under
                    </div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-none tracking-tight">
                      {option.sublabel}
                    </div>
                    <div className="mt-3 sm:mt-4 text-sm sm:text-base text-white/70 font-medium">
                      {option.label}
                    </div>

                    {/* Animated underline */}
                    <div className="mt-3 h-px w-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isHovered || isSelected ? 1 : 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-rose-500 to-orange-400 origin-left"
                      />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PriceSelection;
