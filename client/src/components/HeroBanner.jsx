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
  const containerRef = useRef(null);
  const carouselRef = useRef(null);
  const { heroBanners } = useSelector((state) => state.banners);
  const combinedBanners = heroBanners;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 700 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (heroBanners.length > 0 && isAutoPlaying) {
      const timer = setInterval(() => {
        const nextIndex = (currentSlide + 1) % heroBanners.length;
        setCurrentSlide(nextIndex);
        scrollToSlide(nextIndex);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [heroBanners.length, isAutoPlaying, currentSlide]);

  const nextSlide = () => {
    const nextIndex = (currentSlide + 1) % heroBanners.length;
    setCurrentSlide(nextIndex);
    scrollToSlide(nextIndex);
  };

  const prevSlide = () => {
    const prevIndex = (currentSlide - 1 + heroBanners.length) % heroBanners.length;
    setCurrentSlide(prevIndex);
    scrollToSlide(prevIndex);
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

  // Fallback
  if (!heroBanners.length) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative min-h-[70vh] bg-[#08080a] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(220,38,38,0.2),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:28px_28px]" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <motion.div variants={textVariants} custom={0} className="flex items-center gap-3 text-[10px] tracking-[0.6em] uppercase text-red-400/80 mb-8">
            <span className="w-12 h-px bg-red-500/60" /> Maison Exclusive <span className="w-12 h-px bg-red-500/60" />
          </motion.div>
          <motion.h3
            variants={textVariants}
            custom={1}
            className="text-white text-6xl sm:text-7xl lg:text-8xl font-light leading-[0.9] tracking-tight max-w-4xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            The Art of <span className="italic text-red-500">Refined</span> Style
          </motion.h3>
          <motion.div variants={textVariants} custom={3} className="mt-12">
            <Link
              to="/products"
              className="group inline-flex items-center gap-4 px-9 py-4 text-[11px] tracking-[0.4em] font-semibold text-white bg-red-600 hover:bg-red-700 uppercase rounded-full transition-all duration-500 shadow-[0_20px_50px_-12px_rgba(220,38,38,0.7)]"
            >
              Explore Collection
              <span className="w-7 h-7 rounded-full bg-white text-red-600 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-[#08080a] overflow-hidden py-14 sm:py-20 lg:py-28"
    >
      {/* Ambient atmospheric layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_15%,rgba(220,38,38,0.22),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_10%_85%,rgba(120,20,20,0.25),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:28px_28px] pointer-events-none" />

      {/* Floating noise grain */}
      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vertical caption */}
      <div className="hidden xl:flex absolute left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-left items-center gap-3 text-[10px] tracking-[0.6em] uppercase text-white/30">
        <span className="w-12 h-px bg-white/30" />
        Volume 01 — MMXXV
        <span className="w-12 h-px bg-white/30" />
      </div>

      {/* Decorative top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-4 pt-6 text-white/30">
        <span className="w-16 h-px bg-gradient-to-r from-transparent to-white/40" />
        <Sparkles className="w-3 h-3 text-red-500" />
        <span className="w-16 h-px bg-gradient-to-l from-transparent to-white/40" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 px-5 sm:px-8 lg:px-14 mx-auto max-w-[1600px]">
        {/* LEFT — Editorial */}
        <motion.div
          className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={textVariants}
            custom={0}
            className="inline-flex self-center lg:self-start items-center gap-3 px-4 py-2 rounded-full border border-red-500/25 bg-gradient-to-r from-red-950/40 to-transparent backdrop-blur-md text-[10px] tracking-[0.45em] uppercase text-red-300/90"
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            New Arrivals · S/S 25
          </motion.div>

          <motion.h4
            variants={textVariants}
            custom={1}
            className="mt-8 text-white text-6xl sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-light leading-[0.88] tracking-[-0.02em]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Featured
            <br />
            <span className="italic font-extralight bg-gradient-to-r from-white via-white/90 to-red-200/80 bg-clip-text text-transparent">
              Pieces.
            </span>
          </motion.h4>

          <motion.div
            variants={textVariants}
            custom={2}
            className="mt-7 flex items-center justify-center lg:justify-start gap-4"
          >
            <span className="w-16 h-px bg-gradient-to-r from-red-500 via-red-500/50 to-transparent" />
            <p className="text-[11px] text-white/50 tracking-[0.4em] uppercase">Hand-picked Edit</p>
          </motion.div>

          <motion.p
            variants={textVariants}
            custom={3}
            className="mt-7 max-w-md mx-auto lg:mx-0 text-[15px] text-white/55 leading-[1.85] font-light"
          >
            A curated selection from this season's collection — each piece chosen for its
            craftsmanship, character, and quiet confidence.
          </motion.p>

          <motion.div
            variants={textVariants}
            custom={4}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <Link
              to="/products"
              className="group relative inline-flex items-center gap-4 px-8 py-4 text-[11px] tracking-[0.4em] font-semibold text-white uppercase rounded-full overflow-hidden transition-all duration-500"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-600 to-red-700 transition-transform duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-red-700 to-red-500" />
              <span className="absolute -inset-1 rounded-full bg-red-500/40 blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative">View All</span>
              <span className="relative w-7 h-7 rounded-full bg-white text-red-600 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>

            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="text-[10px] tracking-[0.4em] uppercase text-white/40 hover:text-white/80 transition-colors"
            >
              {isAutoPlaying ? "❚❚ Pause" : "▶ Play"}
            </button>
          </motion.div>

          {/* Slide counter */}
          {combinedBanners.length > 0 && (
            <motion.div
              variants={textVariants}
              custom={5}
              className="mt-12 flex items-center justify-center lg:justify-start gap-5"
            >
              <span
                className="text-4xl text-white font-extralight tabular-nums leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {String(currentSlide + 1).padStart(2, "0")}
              </span>
              <div className="relative w-24 h-px bg-white/15 overflow-hidden">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-400"
                  animate={{ width: `${((currentSlide + 1) / combinedBanners.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </div>
              <span className="text-xs text-white/35 tabular-nums tracking-[0.3em]">
                {String(combinedBanners.length).padStart(2, "0")}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT — Premium carousel */}
        <div className="lg:col-span-7 relative flex items-center justify-center w-full">
          <div className="relative w-full">
            {/* Glow halo behind active card */}
            <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15),transparent_60%)] pointer-events-none blur-2xl" />

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
                  setCurrentSlide(index);
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
                    className={`group relative flex-shrink-0 w-[82%] sm:w-3/4 md:w-[58%] lg:w-[52%] xl:w-[48%] rounded-[28px] overflow-hidden cursor-pointer transition-all duration-700 ${
                      isActive
                        ? "shadow-[0_40px_100px_-20px_rgba(220,38,38,0.5),0_0_0_1px_rgba(255,255,255,0.05)] scale-100"
                        : "opacity-50 scale-[0.92] hover:opacity-80"
                    }`}
                    onClick={() => {
                      setCurrentSlide(index);
                      scrollToSlide(index);
                      handleBannerClick(banner);
                    }}
                    style={{ scrollSnapAlign: "center" }}
                  >
                    {/* Animated gradient border on active */}
                    <div
                      className={`absolute inset-0 rounded-[28px] p-[1.5px] z-10 pointer-events-none transition-opacity duration-700 ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                      style={{
                        background:
                          "conic-gradient(from 180deg at 50% 50%, rgba(239,68,68,0.9), rgba(255,255,255,0.2) 25%, rgba(239,68,68,0.6) 50%, rgba(255,255,255,0.1) 75%, rgba(239,68,68,0.9))",
                      }}
                    >
                      <div className="w-full h-full rounded-[26px] bg-[#08080a]" />
                    </div>

                    <div className="relative rounded-[28px] overflow-hidden bg-neutral-900">
                      <img
                        src={banner.image?.url || "/placeholder.svg?height=600&width=500"}
                        alt={banner.title || "Fashion Banner"}
                        className="w-full h-80 sm:h-96 md:h-[28rem] lg:h-[32rem] xl:h-[36rem] object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110"
                      />

                      {/* Cinematic overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-red-950/40" />
                      <div className="absolute inset-0 bg-gradient-to-tl from-black/40 via-transparent to-transparent" />

                      {/* Refined corner ornaments */}
                      <div className="absolute top-5 left-5 w-7 h-7 border-t-[1.5px] border-l-[1.5px] border-white/50" />
                      <div className="absolute top-5 right-5 w-7 h-7 border-t-[1.5px] border-r-[1.5px] border-white/50" />
                      <div className="absolute bottom-5 left-5 w-7 h-7 border-b-[1.5px] border-l-[1.5px] border-white/50" />
                      <div className="absolute bottom-5 right-5 w-7 h-7 border-b-[1.5px] border-r-[1.5px] border-white/50" />

                      {/* Active badge */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-7 left-7 flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 backdrop-blur-md text-white text-[9px] tracking-[0.35em] uppercase font-bold shadow-[0_10px_30px_-5px_rgba(220,38,38,0.6)]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Featured
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Index ribbon top-right */}
                      <div className="absolute top-7 right-7 flex flex-col items-end gap-1">
                        <span
                          className="text-white/90 text-3xl font-extralight leading-none tabular-nums"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[8px] tracking-[0.4em] uppercase text-white/50">
                          Edit
                        </span>
                      </div>

                      {/* Bottom caption */}
                      <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-8">
                        <div className="flex items-end justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="w-8 h-px bg-red-400" />
                              <span className="text-[9px] tracking-[0.45em] uppercase text-red-300/90">
                                Maison
                              </span>
                            </div>
                            {banner.title && (
                              <h5
                                className="text-white text-2xl sm:text-3xl leading-[1.1] font-light truncate tracking-tight"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                              >
                                {banner.title}
                              </h5>
                            )}
                          </div>
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                            <div className="absolute inset-0 rounded-full bg-red-600/30 blur-md group-hover:bg-red-500/50 transition-colors duration-500" />
                            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center shadow-lg group-hover:rotate-45 transition-transform duration-700 border border-white/10">
                              <ArrowUpRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Left Arrow */}
            <motion.button
              onClick={prevSlide}
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.92 }}
              className="absolute z-20 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-white transform -translate-y-1/2 rounded-full left-2 sm:left-4 top-1/2 backdrop-blur-md bg-white/5 hover:bg-red-600 border border-white/15 transition-colors duration-500 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            {/* Right Arrow */}
            <motion.button
              onClick={nextSlide}
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.92 }}
              className="absolute z-20 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-white transform -translate-y-1/2 rounded-full right-2 sm:right-4 top-1/2 backdrop-blur-md bg-white/5 hover:bg-red-600 border border-white/15 transition-colors duration-500 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Dot indicators */}
          {combinedBanners.length > 1 && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
              {combinedBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentSlide(i);
                    scrollToSlide(i);
                  }}
                  className={`h-[3px] rounded-full transition-all duration-500 ${
                    i === currentSlide
                      ? "w-12 bg-gradient-to-r from-red-500 to-red-400"
                      : "w-5 bg-white/25 hover:bg-white/50"
                  }`}
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
