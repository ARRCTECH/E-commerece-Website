"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles } from "lucide-react";
import { fetchPublicInnovations } from "../../store/slices/innovationSlice";

const InnovationList = () => {
  const dispatch = useDispatch();
  const {
    innovations: allInnovations,
    loading: isLoading,
    error,
  } = useSelector((state) => state.innovations || { innovations: [], loading: false, error: null });

  const fetchInnovations = useCallback(() => {
    dispatch(fetchPublicInnovations());
  }, [dispatch]);

  useEffect(() => {
    fetchInnovations();
  }, [fetchInnovations]);

  const innovations = allInnovations || [];
  const displayedInnovations = innovations.slice(0, 8);

  const scrollRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amt = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amt : amt, behavior: "smooth" });
  };

  const getImageUrl = (image) => {
    if (image?.url) return image.url;
    return "/placeholder.svg?height=600&width=450&text=Innovation";
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#0a0a0a] py-12 sm:py-16 md:py-20 lg:py-20">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[300px] w-[500px] sm:h-[400px] sm:w-[600px] md:h-[500px] md:w-[800px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] sm:h-[350px] sm:w-[350px] md:h-[400px] md:w-[400px] rounded-full bg-amber-400/5 blur-[100px]" />

      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 lg:px-12">
        
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-16 flex flex-col gap-6 sm:gap-8 md:flex-row md:items-end md:justify-between">
          
          {/* Left Content - Removed max-w-2xl to allow full width */}
          <div className="w-full">
            {/* Badge - Fixed: Removed extra visionary living span */}
            <div className="inline-flex items-center justify-center sm:justify-start gap-2 border-b border-amber-400/40 pb-2 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.3em] text-amber-300">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Factory Sale</span>
            </div>
            
            {/* Title - Now properly responsive */}
            <div className="mt-3 sm:mt-4">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight text-white"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Where craft meets
                <br className="block sm:hidden" />
                <span className="hidden sm:inline"> </span>
                <span
                  className="italic"
                  style={{
                    background: "linear-gradient(135deg, #f5d68a 0%, #c9a14a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  visionary living.
                </span>
              </h2>
            </div>
            
            <p className="mt-3 sm:mt-4 md:mt-5  text-xs sm:text-sm md:text-base leading-relaxed text-white/60 mx-auto sm:mx-0">
              An evolving collection of landmark addresses — engineered with quiet precision, composed for those who notice every detail.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden sm:flex items-center justify-center sm:justify-end gap-2 sm:gap-3">
            <button
              onClick={() => scroll("left")}
              aria-label="Previous"
              className="group flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 lg:h-12 lg:w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-all hover:border-amber-300 hover:bg-amber-300 hover:text-black"
            >
              <ChevronLeft className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Next"
              className="group flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 lg:h-12 lg:w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-all hover:border-amber-300 hover:bg-amber-300 hover:text-black"
            >
              <ChevronRight className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-2 border-white/10 border-t-amber-300" />
          </div>
        ) : displayedInnovations.length === 0 ? (
          <div className="py-16 text-center text-xs sm:text-sm uppercase tracking-[0.25em] text-white/40">
            No innovations found
          </div>
        ) : (
          <>
            <style>{`
              .inn-scroll::-webkit-scrollbar { display: none; }
              @keyframes inn-fade-up {
                from { opacity: 0; transform: translateY(24px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            
            <div
              ref={scrollRef}
              className="inn-scroll -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 flex snap-x snap-mandatory gap-3 sm:gap-4 md:gap-5 lg:gap-6 overflow-x-auto scroll-smooth px-4 sm:px-6 md:px-8 lg:px-12 pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {displayedInnovations.map((item, i) => (
                <article
                  key={item._id}
                  onMouseEnter={() => setHovered(item._id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    animation: "inn-fade-up 0.8s cubic-bezier(0.22,1,0.36,1) both",
                    animationDelay: `${i * 80}ms`,
                    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,161,74,0.08)",
                  }}
                  className="group relative aspect-[3/4] w-[75%] sm:w-[55%] md:w-[45%] lg:w-[32%] xl:w-[28%] 2xl:w-[24%] flex-shrink-0 cursor-pointer snap-start overflow-hidden rounded-xl sm:rounded-2xl"
                >
                  <div className="absolute inset-0 w-full h-full bg-[#111]">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-contain transition-transform duration-[1400ms] ease-out will-change-transform group-hover:scale-105"
                    />
                  </div>
                  
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0.85) 100%)",
                    }}
                  />
                  
                  <div
                    className={`pointer-events-none absolute inset-0 border rounded-xl sm:rounded-2xl transition-colors duration-500 ${
                      hovered === item._id ? "border-amber-300/60 border-2" : "border-transparent"
                    }`}
                  />
                  
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5 lg:p-6 z-10">
                    {item.category && (
                      <p className="mb-1 sm:mb-2 text-[8px] sm:text-[9px] md:text-[10px] font-medium uppercase tracking-[0.3em] text-amber-300">
                        {item.category}
                      </p>
                    )}
                    <h3
                      className="text-base sm:text-lg md:text-xl lg:text-2xl font-light leading-tight text-white"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {item.title}
                    </h3>
                    
                    <div className="mt-2 sm:mt-3 flex items-end justify-between">
                      <p className="text-[10px] sm:text-xs tracking-wide text-white/60">
                        {item.location || ""}
                      </p>
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-500 group-hover:border-amber-300 group-hover:bg-amber-300 group-hover:text-black">
                        <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 transition-transform group-hover:rotate-45" />
                      </div>
                    </div>
                    
                    <div
                      className="mt-3 sm:mt-4 md:mt-5 h-px w-0 transition-all duration-700 group-hover:w-full"
                      style={{ background: "linear-gradient(90deg, #f5d68a, #c9a14a)" }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

InnovationList.propTypes = {};

export default InnovationList;