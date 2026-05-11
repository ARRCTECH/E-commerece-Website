"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowUpRight } from "lucide-react";
import { setFilters } from "../store/slices/productSlice";

const PriceSelection = ({ selectedPrice }) => {
  const [selectedOption, setSelectedOption] = useState(selectedPrice || null);
  const [hoveredId, setHoveredId] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const priceOptions = [
    { id: "under649",  label: "Essentials", sublabel: "₹649",  value: 649,  tag: "01 / Daily",    desc: "Everyday icons" },
    { id: "under799",  label: "Smart Buys", sublabel: "₹799",  value: 799,  tag: "02 / Trend",    desc: "Of-the-moment" },
    { id: "under999",  label: "Premium",    sublabel: "₹999",  value: 999,  tag: "03 / Signature",desc: "Refined edits" },
    { id: "under1499", label: "Luxe",       sublabel: "₹1499", value: 1499, tag: "04 / Atelier",  desc: "The finale" },
  ];

  const handleOptionClick = (option) => {
    setSelectedOption(option.id);
    dispatch(setFilters({ minPrice: "", maxPrice: option.value }));
    navigate(`/products?maxPrice=${option.value}`);
  };

  return (
    <section
      className="relative w-full mt-10 px-3 sm:px-6 md:px-10 lg:px-16 py-12 sm:py-16"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Ambient backdrop */}
      <div className="absolute inset-0 -z-10 bg-[#0a0a0a]" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-1/3 left-1/4 -z-10 w-[500px] h-[500px] rounded-full bg-rose-600/10 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 -z-10 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[120px]" />

      <div className="relative w-full mx-auto" style={{ maxWidth: "1600px" }}>
        {/* Editorial Header */}
        <div className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-rose-500" />
              <span className="text-[10px] tracking-[0.4em] uppercase text-rose-400 font-medium">
                The Edit · Vol. 04
              </span>
            </div>
            <h3
              className="text-5xl sm:text-6xl md:text-7xl text-white leading-[0.95] tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400 }}
            >
              Shop by <em className="italic text-rose-400/90 font-light">price</em>.
              <br />
              <span className="text-white/60">Curated for you.</span>
            </h3>
          </div>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed sm:text-right">
            Four tiers. Endless possibilities. Every price point handpicked
            to deliver an unmistakably premium experience.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-3xl overflow-hidden border border-white/[0.08]">
          {priceOptions.map((option, idx) => {
            const isSelected = selectedOption === option.id;
            const isHovered = hoveredId === option.id;
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                onHoverStart={() => setHoveredId(option.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => handleOptionClick(option)}
                className="group relative text-left focus:outline-none bg-[#0d0d0d] overflow-hidden"
              >
                {/* Hover fill */}
                <motion.div
                  initial={false}
                  animate={{ scaleY: isHovered || isSelected ? 1 : 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 origin-bottom bg-gradient-to-t from-rose-950 via-rose-900/40 to-transparent"
                />

                {/* Selected accent line */}
                {isSelected && (
                  <motion.div
                    layoutId="selected-line"
                    className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300 z-20"
                  />
                )}

                {/* Content */}
                <div className="relative aspect-[3/4] sm:aspect-[4/5] p-5 sm:p-7 flex flex-col justify-between z-10">
                  {/* Top */}
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-medium">
                      {option.tag}
                    </span>
                    <motion.div
                      animate={{
                        rotate: isHovered ? 45 : 0,
                        backgroundColor: isHovered ? "#fff" : "rgba(255,255,255,0.06)",
                        color: isHovered ? "#0a0a0a" : "#fff",
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10"
                    >
                      <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
                    </motion.div>
                  </div>

                  {/* Center decorative */}
                  <div className="flex-1 flex items-center justify-center my-4">
                    <motion.div
                      animate={{
                        scale: isHovered ? 1.05 : 1,
                        opacity: isHovered ? 1 : 0.85,
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-center"
                    >
                      <div className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-2">
                        Under
                      </div>
                      <div
                        className="text-5xl sm:text-6xl md:text-7xl text-white leading-none tracking-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 300 }}
                      >
                        {option.sublabel}
                      </div>
                    </motion.div>
                  </div>

                  {/* Bottom */}
                  <div>
                    <div className="overflow-hidden mb-1">
                      <motion.div
                        animate={{ y: isHovered ? -2 : 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="text-base sm:text-lg text-white font-medium tracking-tight">
                          {option.label}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {option.desc}
                        </div>
                      </motion.div>
                    </div>

                    <div className="mt-4 h-px w-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isHovered || isSelected ? 1 : 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-gradient-to-r from-rose-400 to-amber-300 origin-left"
                      />
                    </div>

                    <motion.div
                      initial={false}
                      animate={{
                        opacity: isHovered ? 1 : 0,
                        y: isHovered ? 0 : 6,
                      }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 text-[11px] tracking-[0.2em] uppercase text-rose-300 font-medium"
                    >
                      Explore →
                    </motion.div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer caption */}
        <div className="mt-8 flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-white/30">
          <span>Made with intent</span>
          <span>Free shipping · Easy returns</span>
        </div>
      </div>
    </section>
  );
};

export default PriceSelection;
