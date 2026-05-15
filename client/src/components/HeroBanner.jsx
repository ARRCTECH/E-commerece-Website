"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const HeroBanner = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);
  const carouselRef = useRef(null);
  const { heroBanners } = useSelector((state) => state.banners);
  const combinedBanners = heroBanners;

  useEffect(() => {
    if (heroBanners.length > 0) {
      setIsLoading(false);
    }
  }, [heroBanners]);

  useEffect(() => {
    if (heroBanners.length > 0 && isAutoPlaying) {
      const timer = setInterval(() => {
        const nextIndex = (currentSlide + 1) % heroBanners.length;
        setCurrentSlide(nextIndex);
        scrollToSlide(nextIndex);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [heroBanners.length, isAutoPlaying, currentSlide]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    const nextIndex = (currentSlide + 1) % heroBanners.length;
    setCurrentSlide(nextIndex);
    scrollToSlide(nextIndex);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    const prevIndex = (currentSlide - 1 + heroBanners.length) % heroBanners.length;
    setCurrentSlide(prevIndex);
    scrollToSlide(prevIndex);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const scrollToSlide = (index) => {
    if (carouselRef.current) {
      const carousel = carouselRef.current;
      let slideWidth = 0;
      if (carousel.firstChild) {
        slideWidth = carousel.firstChild.offsetWidth + 24;
      }
      carousel.scrollTo({ left: slideWidth * index, behavior: "smooth" });
    }
  };

  const handleBannerClick = (banner) => {
    if (banner.bannerLink) {
      if (banner.bannerLink.startsWith("http") || banner.bannerLink.startsWith("www")) {
        window.open(banner.bannerLink, "_self");
      } else {
        navigate(banner.bannerLink);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.9, staggerChildren: 0.12 } },
  };

  const textVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: (delay) => ({
      y: 0,
      opacity: 1,
      transition: { delay: delay * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  if (isLoading) {
    return (
      <div className="relative min-h-[70vh] bg-gradient-to-b from-[#0b0b0c] via-[#161617] to-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent animate-pulse" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-6">
          <div className="w-20 h-20 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
          <p className="mt-6 text-white/30 text-xs tracking-wider uppercase">Loading experience</p>
        </div>
      </div>
    );
  }

  if (!heroBanners.length) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative min-h-[70vh] bg-gradient-to-b from-[#0b0b0c] via-[#161617] to-black overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.15),transparent_60%)]" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <motion.div variants={textVariants} custom={0} className="flex items-center gap-3 text-[10px] tracking-[0.6em] uppercase text-amber-400/80 mb-8">
            <span className="w-12 h-px bg-amber-500/60" /> Maison Exclusive <span className="w-12 h-px bg-amber-500/60" />
          </motion.div>
          <motion.h3
            variants={textVariants}
            custom={1}
            className="text-white text-5xl sm:text-7xl lg:text-8xl font-light leading-[0.9] tracking-tight max-w-4xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            The Art of <span className="italic text-amber-500">Refined</span> Style
          </motion.h3>
          <motion.div variants={textVariants} custom={3} className="mt-12">
            <Link
              to="/products"
              className="group inline-flex items-center gap-4 px-8 py-4 text-[11px] tracking-[0.4em] font-semibold text-black bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 hover:from-amber-300 hover:to-amber-400 uppercase rounded-full transition-all duration-500 shadow-[0_20px_50px_-12px_rgba(245,158,11,0.4)]"
            >
              Explore Collection
              <span className="w-7 h-7 rounded-full bg-black text-amber-200 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative bg-gradient-to-b from-[#0b0b0c] via-[#161617] to-black overflow-hidden py-14 sm:py-20 lg:py-28">
      {/* Premium gradient overlays - subtle */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_15%,rgba(245,158,11,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_10%_85%,rgba(180,83,9,0.1),transparent_60%)] pointer-events-none" />
      
      {/* Decorative top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-4 pt-6 text-white/30 z-10">
        <span className="w-20 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
        <span className="w-20 h-px bg-gradient-to-l from-transparent via-amber-500/40 to-transparent" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 px-5 sm:px-8 lg:px-14 mx-auto max-w-[1600px]">
        {/* LEFT — Editorial section */}
        <motion.div
          className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={textVariants}
            custom={0}
            className="inline-flex self-center lg:self-start items-center gap-3 px-4 py-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-transparent backdrop-blur-sm text-[9px] sm:text-[10px] tracking-[0.45em] uppercase text-amber-300/90"
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
            New Arrivals
          </motion.div>

          <motion.h4
            variants={textVariants}
            custom={1}
            className="mt-8 text-white text-5xl sm:text-6xl lg:text-[5rem] xl:text-[6rem] font-light leading-[0.88] tracking-[-0.02em]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Featured
            <br />
            <span className="italic font-extralight bg-gradient-to-r from-white via-white/90 to-amber-200/80 bg-clip-text text-transparent">
              Pieces.
            </span>
          </motion.h4>

          <motion.div
            variants={textVariants}
            custom={2}
            className="mt-6 flex items-center justify-center lg:justify-start gap-4"
          >
            <span className="w-16 h-px bg-gradient-to-r from-amber-500 via-amber-500/50 to-transparent" />
            <p className="text-[10px] sm:text-[11px] text-white/40 tracking-[0.4em] uppercase">Hand-picked Edit</p>
          </motion.div>

          <motion.p
            variants={textVariants}
            custom={3}
            className="mt-6 max-w-md mx-auto lg:mx-0 text-sm sm:text-[15px] text-white/50 leading-[1.85] font-light"
          >
            A curated selection from this season's collection — each piece chosen for its
            craftsmanship, character, and quiet confidence.
          </motion.p>

          <motion.div
            variants={textVariants}
            custom={4}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <Link
  to="/products"
  className="group relative inline-flex items-center gap-4 px-7 sm:px-8 py-3.5 sm:py-4 text-[10px] sm:text-[11px] tracking-[0.4em] font-semibold text-white uppercase rounded-full overflow-hidden transition-all duration-500"
>
  <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 transition-transform duration-700 group-hover:scale-110" />
  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-red-400 to-red-500" />
  <span className="absolute -inset-1 rounded-full bg-red-400/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  <span className="relative z-10">View All</span>
  <span className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 text-red-500 flex items-center justify-center group-hover:rotate-45 group-hover:bg-white transition-all duration-500">
    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
  </span>
</Link>

            {/* <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase text-white/40 hover:text-amber-400 transition-colors"
            >
              {isAutoPlaying ? "❚❚ Pause" : "▶ Play"}
            </button> */}
          </motion.div>

          {/* Slide counter */}
          {combinedBanners.length > 0 && (
            <motion.div
              variants={textVariants}
              custom={5}
              className="mt-10 flex items-center justify-center lg:justify-start gap-5"
            >
              <span
                className="text-3xl sm:text-4xl text-white font-extralight tabular-nums leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {String(currentSlide + 1).padStart(2, "0")}
              </span>
              <div className="relative w-20 h-px bg-white/15 overflow-hidden">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400"
                  animate={{ width: `${((currentSlide + 1) / combinedBanners.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </div>
              <span className="text-xs text-white/30 tabular-nums tracking-[0.3em]">
                {String(combinedBanners.length).padStart(2, "0")}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT — Premium carousel with CLEAR images */}
        <div className="lg:col-span-7 relative flex items-center justify-center w-full">
          <div className="relative w-full">
            {/* Subtle glow behind active card */}
            <motion.div
              className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.1),transparent_70%)] pointer-events-none blur-2xl"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <div
              ref={carouselRef}
              className="flex px-2 py-6 space-x-6 overflow-x-scroll scrollbar-hide scroll-smooth"
              style={{ scrollSnapType: "x mandatory" }}
              onScroll={() => {
                if (carouselRef.current) {
                  const scrollLeft = carouselRef.current.scrollLeft;
                  const slideWidth = carouselRef.current.firstChild
                    ? carouselRef.current.firstChild.offsetWidth + 24
                    : 0;
                  const index = Math.round(scrollLeft / slideWidth);
                  if (index !== currentSlide) setCurrentSlide(index);
                }
              }}
            >
              {combinedBanners.map((banner, index) => {
                const isActive = index === currentSlide;
                return (
                  <motion.div
                    key={banner._id || index}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className={`group relative flex-shrink-0 w-[85%] sm:w-3/4 md:w-[60%] lg:w-[55%] xl:w-[50%] rounded-[28px] overflow-hidden cursor-pointer transition-all duration-700 ${
                      isActive
                        ? "shadow-[0_40px_100px_-20px_rgba(245,158,11,0.3)] scale-100 ring-1 ring-amber-500/30"
                        : "opacity-50 scale-[0.92] hover:opacity-80 hover:scale-[0.94]"
                    }`}
                    onClick={() => {
                      setCurrentSlide(index);
                      scrollToSlide(index);
                      handleBannerClick(banner);
                    }}
                    style={{ scrollSnapAlign: "center" }}
                  >
                    {/* Card background - clean dark */}
                    <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-b from-[#1a1a1c] to-[#0d0d0e]">
                      {/* IMAGE - CLEAR & BRIGHT, no dark overlay */}
                      <img
                        src={banner.image?.url || "/placeholder.svg?height=600&width=500"}
                        alt={banner.title || "Fashion Banner"}
                        className="w-full h-80 sm:h-96 md:h-[28rem] lg:h-[32rem] xl:h-[36rem] object-cover transition-transform duration-[8000ms] ease-out group-hover:scale-105 brightness-100 contrast-100"
                        style={{ filter: "brightness(1) contrast(1.05)" }}
                      />

                      {/* MINIMAL overlay - only bottom gradient for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      
                      {/* Very subtle top gradient for depth */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

                      {/* Refined corner ornaments - more visible */}
                      <div className="absolute top-5 left-5 w-8 h-8 border-t-[1.5px] border-l-[1.5px] border-amber-400/50" />
                      <div className="absolute top-5 right-5 w-8 h-8 border-t-[1.5px] border-r-[1.5px] border-amber-400/50" />
                      <div className="absolute bottom-5 left-5 w-8 h-8 border-b-[1.5px] border-l-[1.5px] border-amber-400/50" />
                      <div className="absolute bottom-5 right-5 w-8 h-8 border-b-[1.5px] border-r-[1.5px] border-amber-400/50" />

                      {/* Active badge */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-6 left-6 flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[8px] sm:text-[9px] tracking-[0.35em] uppercase font-bold shadow-lg z-20"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Featured
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Index ribbon top-right */}
                      <div className="absolute top-6 right-6 flex flex-col items-end gap-1 z-20">
                        <span
                          className="text-white/90 text-2xl sm:text-3xl font-extralight leading-none tabular-nums drop-shadow-lg"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[7px] sm:text-[8px] tracking-[0.4em] uppercase text-amber-400/80">
                          Edit
                        </span>
                      </div>

                      {/* Bottom caption - cleaner */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20">
                        <div className="flex items-end justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-8 h-px bg-amber-400" />
                              <span className="text-[8px] sm:text-[9px] tracking-[0.45em] uppercase text-amber-300/90">
                                Maison
                              </span>
                            </div>
                            {banner.title && (
                              <h5
                                className="text-white text-xl sm:text-2xl lg:text-3xl leading-[1.1] font-light truncate tracking-tight drop-shadow-lg"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                              >
                                {banner.title}
                              </h5>
                            )}
                          </div>
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                            <div className="absolute inset-0 rounded-full bg-amber-500/40 blur-md group-hover:bg-amber-500/60 transition-colors duration-500" />
                            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-black flex items-center justify-center shadow-lg group-hover:rotate-45 transition-transform duration-700 border border-white/20">
                              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            <motion.button
              onClick={prevSlide}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(245,158,11,0.9)" }}
              whileTap={{ scale: 0.92 }}
              className="absolute z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white transform -translate-y-1/2 rounded-full left-2 sm:left-4 top-1/2 backdrop-blur-md bg-black/50 hover:bg-amber-500 border border-white/20 transition-all duration-500 shadow-xl"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>

            <motion.button
              onClick={nextSlide}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(245,158,11,0.9)" }}
              whileTap={{ scale: 0.92 }}
              className="absolute z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white transform -translate-y-1/2 rounded-full right-2 sm:right-4 top-1/2 backdrop-blur-md bg-black/50 hover:bg-amber-500 border border-white/20 transition-all duration-500 shadow-xl"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>

          {/* Dot indicators */}
          {combinedBanners.length > 1 && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-amber-500/20">
              {combinedBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentSlide(i);
                    scrollToSlide(i);
                    setTimeout(() => setIsAutoPlaying(true), 5000);
                  }}
                  className={`h-[3px] rounded-full transition-all duration-500 ${
                    i === currentSlide
                      ? "w-10 sm:w-12 bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                      : "w-4 sm:w-5 bg-white/30 hover:bg-amber-500/50"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;