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

  // Placeholder image fallback
  const getImageUrl = (image) => {
    if (image?.url) return image.url;
    return "/placeholder.svg?height=600&width=450&text=Innovation";
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#0a0a0a] py-20 md:py-28">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-amber-400/5 blur-[100px]" />

      <div className="relative mx-auto max-w-screen-2xl px-6 md:px-12">
        <div className="mb-12 flex flex-col gap-8 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 border-b border-amber-400/40 pb-2 text-[11px] font-medium uppercase tracking-[0.3em] text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Factory Sale</span>
            </div>
            <h2
              className="text-4xl font-light leading-[1.05] tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Where craft meets
              <br />
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
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60 md:text-base">
              An evolving collection of landmark addresses — engineered with quiet precision, composed for those who notice every detail.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              aria-label="Previous"
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-all hover:border-amber-300 hover:bg-amber-300 hover:text-black"
            >
              <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Next"
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-all hover:border-amber-300 hover:bg-amber-300 hover:text-black"
            >
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-amber-300" />
          </div>
        ) : displayedInnovations.length === 0 ? (
          <div className="py-16 text-center text-sm uppercase tracking-[0.25em] text-white/40">
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
              className="inn-scroll -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-4 md:-mx-12 md:gap-6 md:px-12"
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
                  className="group relative aspect-[3/4] w-[78%] flex-shrink-0 cursor-pointer snap-start overflow-hidden rounded-sm sm:w-[55%] md:w-[42%] lg:w-[30%] xl:w-[26%]"
                >
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out will-change-transform group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.95) 100%)",
                    }}
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 border transition-colors duration-500 ${
                      hovered === item._id ? "border-amber-300/60" : "border-transparent"
                    }`}
                  />
                  
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                    {item.category && (
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-amber-300">
                        {item.category}
                      </p>
                    )}
                    <h3
                      className="text-2xl font-light leading-tight text-white md:text-3xl"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {item.title}
                    </h3>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-xs tracking-wide text-white/60">{item.location || ""}</p>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-500 group-hover:border-amber-300 group-hover:bg-amber-300 group-hover:text-black">
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                      </div>
                    </div>
                    <div
                      className="mt-5 h-px w-0 transition-all duration-700 group-hover:w-full"
                      style={{ background: "linear-gradient(90deg, #f5d68a, #c9a14a)" }}
                    />
                  </div>
                </article>
              ))}
            </div>

            {/* <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.3em] text-white/50">
              <span>{displayedInnovations.length} Featured Developments</span>
              <button className="group flex items-center gap-2 text-white transition-colors hover:text-amber-300">
                Explore the Portfolio
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div> */}
          </>
        )}
      </div>
    </section>
  );
};

InnovationList.propTypes = {
  // No props required for this component
};

export default InnovationList;