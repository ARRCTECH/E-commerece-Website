"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { fetchHeroBanners } from "../store/slices/bannerSlice";

const HeroBanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isComponentVisible, setIsComponentVisible] = useState(true);

  const carouselRef = useRef(null);
  const sectionRef = useRef(null);
  const autoPlayTimerRef = useRef(null); // ✅ Store timer reference
  const { heroBanners, loadingHero, error } = useSelector((state) => state.banners);
  const combinedBanners = heroBanners || [];

  // ✅ Clear timer function
  const clearAutoPlayTimer = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  // ✅ Start timer function
  const startAutoPlayTimer = useCallback(() => {
    clearAutoPlayTimer();
    if (combinedBanners.length > 1 && isAutoPlaying && !isLoading && isComponentVisible) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          const next = (prev + 1) % combinedBanners.length;
          scrollToSlide(next);
          return next;
        });
      }, 7000);
    }
  }, [combinedBanners.length, isAutoPlaying, isLoading, isComponentVisible, clearAutoPlayTimer]);

  // ✅ Intersection Observer - Pause/Resume when component visibility changes
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        console.log("HeroBanner visibility changed:", isVisible);
        setIsComponentVisible(isVisible);
        
        if (isVisible) {
          // Component became visible - resume auto-play
          setIsAutoPlaying(true);
        } else {
          // Component became hidden - stop auto-play immediately
          setIsAutoPlaying(false);
          clearAutoPlayTimer();
        }
      },
      { threshold: 0.1 } // 10% of component visible is enough
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      observer.disconnect();
    };
  }, [clearAutoPlayTimer]);

  // ✅ Route change detection - stop auto-play when navigating away
  useEffect(() => {
    // Clear timer on route change
    clearAutoPlayTimer();
    setIsAutoPlaying(false);
    
    return () => {
      clearAutoPlayTimer();
    };
  }, [location.pathname, clearAutoPlayTimer]);

  // ✅ Fetch hero banners on component mount
  useEffect(() => {
    const loadBanners = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchHeroBanners()).unwrap();
      } catch (err) {
        console.error("Failed to fetch hero banners:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBanners();
  }, [dispatch]);

  // ✅ Update loading state
  useEffect(() => {
    if (!loadingHero && heroBanners.length >= 0) {
      setIsLoading(false);
    }
  }, [loadingHero, heroBanners]);

  // ✅ Auto-play effect - starts/stops based on conditions
  useEffect(() => {
    if (combinedBanners.length > 1 && isAutoPlaying && !isLoading && isComponentVisible) {
      startAutoPlayTimer();
    } else {
      clearAutoPlayTimer();
    }
    
    return () => {
      clearAutoPlayTimer();
    };
  }, [combinedBanners.length, isAutoPlaying, isLoading, isComponentVisible, startAutoPlayTimer, clearAutoPlayTimer]);

  const scrollToSlide = useCallback((index) => {
    if (carouselRef.current && carouselRef.current.children[index]) {
      carouselRef.current.children[index].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, []);

  const nextSlide = useCallback(() => {
    if (combinedBanners.length === 0) return;
    clearAutoPlayTimer();
    const next = (currentSlide + 1) % combinedBanners.length;
    setCurrentSlide(next);
    scrollToSlide(next);
    setIsAutoPlaying(true);
  }, [combinedBanners.length, currentSlide, scrollToSlide, clearAutoPlayTimer]);

  const prevSlide = useCallback(() => {
    if (combinedBanners.length === 0) return;
    clearAutoPlayTimer();
    const prev = (currentSlide - 1 + combinedBanners.length) % combinedBanners.length;
    setCurrentSlide(prev);
    scrollToSlide(prev);
    setIsAutoPlaying(true);
  }, [combinedBanners.length, currentSlide, scrollToSlide, clearAutoPlayTimer]);

  const handleBannerClick = (banner) => {
    if (!banner?.bannerLink) return;
    clearAutoPlayTimer(); // Stop auto-play when clicking

    if (
      banner.bannerLink.startsWith("http") ||
      banner.bannerLink.startsWith("www")
    ) {
      window.open(banner.bannerLink, "_self");
    } else {
      navigate(banner.bannerLink);
    }
  };

  // ✅ Show loading state
  if (isLoading || loadingHero) {
    return (
      <div className="min-h-[55vh] bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading exclusive collections...</p>
        </div>
      </div>
    );
  }

  // ✅ Show error state
  if (error) {
    return (
      <div className="min-h-[55vh] bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-amber-500 mb-2">⚠️</div>
          <p className="text-white/50 text-sm">Unable to load banners. Please try again later.</p>
          <button 
            onClick={() => dispatch(fetchHeroBanners())}
            className="mt-4 px-4 py-2 bg-amber-500 text-black rounded-full text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ Show nothing if no banners
  if (!combinedBanners.length) {
    return null;
  }

  return (
    <section 
      ref={sectionRef}
      className="relative bg-gradient-to-b from-[#0b0b0c] via-[#111112] to-black overflow-hidden py-8 md:py-14"
    >
      {/* top decoration */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        <span className="w-10 h-px bg-amber-500/30" />
        <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
        <span className="w-10 h-px bg-amber-500/30" />
      </div>

      <div className="max-w-[1500px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-10 items-center">

          {/* LEFT SECTION */}
          <div className="lg:ml-5 col-span-1 lg:col-span-5 text-left pr-2 lg:pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 text-[8px] uppercase tracking-[0.35em] text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              New Arrivals
            </div>

            <h2
              className="mt-5 text-white text-3xl sm:text-4xl lg:text-6xl xl:text-7xl leading-[1.05] font-light"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Featured
              <br />
              <span className="italic text-amber-300">Pieces.</span>
            </h2>

            <p className="mt-4 text-[10px] sm:text-xs lg:text-sm text-white/45 max-w-[280px] lg:max-w-sm leading-relaxed">
              Hand-picked premium edits curated for bold modern style.
            </p>

            <Link
              to="/products"
              onClick={() => clearAutoPlayTimer()}
              className="mt-6 inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-[8px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em]"
            >
              View All
              <span className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-white text-red-500 flex items-center justify-center">
                <ArrowUpRight size={10} className="sm:w-3 sm:h-3" />
              </span>
            </Link>

            <div className="mt-7 flex items-center gap-3">
              <span
                className="text-xl sm:text-2xl text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {String(currentSlide + 1).padStart(2, "0")}
              </span>

              <div className="w-12 sm:w-16 h-px bg-white/20 relative overflow-hidden">
                <motion.span
                  className="absolute top-0 left-0 h-full bg-amber-500"
                  animate={{
                    width: `${((currentSlide + 1) / combinedBanners.length) * 100}%`,
                  }}
                />
              </div>

              <span className="text-[10px] text-white/30">
                {String(combinedBanners.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* RIGHT SECTION - CAROUSEL */}
          <div className="col-span-1 lg:col-span-7 relative">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {combinedBanners.map((banner, index) => {
                const isActive = index === currentSlide;

                return (
                  <motion.div
                    key={banner._id || index}
                    className={`snap-center flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500
                    w-full lg:w-[65%]
                    ${isActive
                        ? "opacity-100 scale-100"
                        : "opacity-35 scale-95"
                      }`}
                    onClick={() => {
                      clearAutoPlayTimer();
                      setCurrentSlide(index);
                      scrollToSlide(index);
                      handleBannerClick(banner);
                    }}
                  >
                    <div className="relative bg-[#151515] rounded-3xl overflow-hidden">
                      {/* IMAGE */}
                      <div className="w-full h-[280px] sm:h-[340px] md:h-[380px] lg:h-[430px] bg-[#111] flex items-center justify-center p-3">
                        <img
                          src={banner.image?.url || banner.imageUrl || "/placeholder-image.jpg"}
                          alt={banner.title || "Banner"}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.jpg";
                          }}
                        />
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div>
                          <h3
                            className="text-white text-base sm:text-lg lg:text-2xl"
                            style={{
                              fontFamily: "'Playfair Display', serif",
                            }}
                          >
                            {banner.title || "Featured Collection"}
                          </h3>
                          {banner.subtitle && (
                            <p className="text-white/60 text-xs sm:text-sm mt-1">
                              {banner.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="hidden lg:flex w-9 h-9 rounded-full bg-amber-500 items-center justify-center text-black">
                          <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            {combinedBanners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {combinedBanners.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {combinedBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      clearAutoPlayTimer();
                      setCurrentSlide(i);
                      scrollToSlide(i);
                      setIsAutoPlaying(true);
                    }}
                    className={`h-1 rounded-full transition-all ${i === currentSlide
                        ? "w-8 bg-amber-400"
                        : "w-3 bg-white/25 hover:bg-white/40"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add custom CSS for scrollbar hide */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default HeroBanner;