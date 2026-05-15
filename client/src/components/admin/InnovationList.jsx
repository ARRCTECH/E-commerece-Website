"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles, Zap, Compass, Infinity, TrendingUp } from "lucide-react";
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
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amt = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amt : amt, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.children[0]?.offsetWidth || 0;
      const newIndex = Math.round(scrollLeft / (cardWidth + 20));
      setActiveIndex(newIndex);
    }
  };

  const getImageUrl = (image) => {
    if (image?.url) return image.url;
    return "/placeholder.svg?height=600&width=450&text=Innovation";
  };

  return (
    <section className="relative w-full bg-white overflow-hidden py-16 sm:py-20">
      {/* Unique diagonal pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#f8f8f8_1px,transparent_1px),linear-gradient(-45deg,#f8f8f8_1px,transparent_1px)] bg-[size:30px_30px]" />
      
      {/* Floating accent shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-red-100 rounded-full animate-pulse" />
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-red-50 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-red-50/30 to-amber-50/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unique Header - Split Layout */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-red-500 uppercase">
                Innovation Lab
              </span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1]">
              Where ideas
              <br />
              <span className="text-red-500">come to life</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Active Counter */}
            <div className="text-right">
              <p className="text-2xl font-light text-neutral-400">
                {String(activeIndex + 1).padStart(2, "0")}
                <span className="text-sm">/{String(displayedInnovations.length).padStart(2, "0")}</span>
              </p>
              <p className="text-[9px] tracking-[0.2em] text-neutral-400 uppercase">Featured</p>
            </div>
            
            {/* Navigation Buttons - Unique Design */}
            <div className="flex gap-2">
              <button
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-300 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-300 group"
              >
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Unique Card Design - Masonry Style */}
        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-neutral-200 border-t-red-500 animate-spin" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-red-500/20 animate-pulse" />
            </div>
          </div>
        ) : displayedInnovations.length === 0 ? (
          <div className="text-center py-32">
            <Compass className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-400 text-sm">Innovations coming soon</p>
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-5 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {displayedInnovations.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={item._id}
                    className={`group relative flex-shrink-0 w-[75%] sm:w-[60%] md:w-[45%] lg:w-[38%] snap-start transition-all duration-500 hover:-translate-y-2 ${
                      isEven ? 'mt-0' : 'mt-8 lg:mt-12'
                    }`}
                  >
                    {/* Card Container */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-neutral-100">
                      
                      {/* Image Section */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        
                        {/* Category Tag - Unique Position */}
                        <div className="absolute top-4 left-4">
                          <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="text-[9px] font-semibold text-white tracking-wide">
                              {item.category || "INNOVATION"}
                            </span>
                          </div>
                        </div>
                        
                        {/* Index Badge - Unique Style */}
                        <div className="absolute bottom-4 right-4">
                          <div className="bg-white/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-xs font-bold text-red-500">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                        
                        {/* Unique Corner Accent */}
                        <div className="absolute top-0 right-0 w-16 h-16">
                          <div className="absolute top-0 right-0 w-0 h-0 border-t-[60px] border-r-[60px] border-t-transparent border-r-red-500/20" />
                        </div>
                      </div>
                      
                      {/* Content Section */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-800 leading-tight flex-1 line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center group-hover:bg-red-500 group-hover:border-red-500 transition-all duration-300 flex-shrink-0">
                            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                        
                        {item.location && (
                          <p className="text-xs text-neutral-400 flex items-center gap-1 mb-3">
                            <Compass className="w-3 h-3" />
                            {item.location}
                          </p>
                        )}
                        
                        {/* Unique Progress Indicator */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[9px] text-neutral-400 mb-1">
                            <span>Innovation score</span>
                            <span>{85 + idx * 2}%</span>
                          </div>
                          <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full transition-all duration-1000 group-hover:w-full"
                              style={{ width: `${65 + idx * 3}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Bottom Stats - Unique */}
            <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-neutral-500">
                    {displayedInnovations.length} breakthrough innovations
                  </span>
                </div>
                <div className="w-px h-4 bg-neutral-200" />
                <div className="flex items-center gap-2">
                  <Infinity className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-neutral-500">Endless possibilities</span>
                </div>
              </div>
              
              <button className="group flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-red-500 transition-colors">
                Explore all innovations
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default InnovationList;