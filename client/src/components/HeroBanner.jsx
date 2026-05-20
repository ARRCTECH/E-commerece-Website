"use client";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const HeroBanner = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const containerRef = useRef(null);
  const carouselRef = useRef(null);
  const { heroBanners } = useSelector((state) => state.banners);
  const combinedBanners = heroBanners;

  // Mouse tracking for parallax effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 700 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  // Scroll-based animations (disabled for spacing issues)
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 0]);
  const opacity = useTransform(scrollY, [0, 300], [1, 1]);

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

  // Scroll carousel to the slide at index
  const scrollToSlide = (index) => {
    if (carouselRef.current) {
      const carousel = carouselRef.current;
      let slideWidth = 0;
      if (carousel.firstChild) {
        const firstChildWidth = carousel.firstChild.offsetWidth;
        slideWidth = firstChildWidth + 16; // including margin
      }
      carousel.scrollTo({
        left: slideWidth * index,
        behavior: "smooth",
      });
    }
  };

  // Handle banner click navigation
  const handleBannerClick = (banner) => {
    if (banner.bannerLink) {
      // Check if it's an external URL or internal route
      if (banner.bannerLink.startsWith('http') || banner.bannerLink.startsWith('www')) {
        window.open(banner.bannerLink, "_self");
      } else {
        // Internal routes use React Router navigation
        navigate(banner.bannerLink);
      }
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const textVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: (delay) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: delay * 0.1,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
  };

  const buttonVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.8,
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
    tap: { scale: 0.95 },
  };

  // Fallback UI if no banners are available
  if (!heroBanners.length) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh] lg:min-h-[70vh] bg-gray-900 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        }}
      >
        {/* Background */}
        <div
          className="absolute inset-0 bg-center bg-cover opacity-10"
          style={{ backgroundImage: "url('/public/images/hero-background-pattern.png')" }}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 via-transparent to-white/5"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
        </div>
        {/* Content */}
        <div className="relative z-10 flex flex-row items-center justify-center h-full px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex-1 order-1 mb-8 text-center lg:text-left lg:mb-0 lg:pr-8">
            <motion.div variants={textVariants} custom={0}>
              <h3 className="mt-2 mb-5 pb-8 text-4xl font-bold tracking-wider text-transparent sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text">
                EXCLUSIVE
              </h3>
            </motion.div>
            <motion.div
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                to="/products"
                className="inline-flex items-center px-10 mb-5 py-3 text-sm sm:px-6 sm:py-3 sm:text-base font-medium tracking-wider text-yellow-400 uppercase transition-all duration-300 rounded-none hover:text-black"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </motion.div>
          </div>
          <div className="flex items-center justify-center flex-1 order-2">
            <div className="text-center text-white/60">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-400 sm:w-16 sm:h-16" />
              <p className="text-sm sm:text-base lg:text-lg">Discover Premium Fashion</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-row items-center justify-center h-full px-2 mx-auto sm:px-4 lg:px-6 max-w-7xl py-4">
        {/* Left Text */}
        <div className="lg:w-[45%] text-center lg:text-left relative">
          {/* Animated Background Particle Effect */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-2xl animate-pulse delay-700" />

         

          {/* Interactive 3D Title - "Featured Pieces" on single line */}
          <div className="relative group/title cursor-pointer ">
            <h2
              className="text-white text-3xl xs:text-3xl  mt-5 sm:text-4xl lg:text-5xl xl:text-7xl leading-[1.1] font-light transition-all duration-500 group-hover/title:scale-[1.02] origin-left"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <span className="inline-block">Featured</span>{" "}
              <span className="relative inline-block">
                <span className="italic bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-semibold">
                  Pieces.
                </span>

                {/* Animated Underline - only under "Pieces" */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-2"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q25 0 50 5 T100 5"
                    stroke="url(#gradient)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="3 3"
                    className="animate-dash"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f5d68a" />
                      <stop offset="100%" stopColor="#c9a14a" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h2>
          </div>

          {/* Floating Elements on Mobile */}
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-amber-500/30 to-transparent hidden xs:block lg:hidden" />

          {/* Smart Description - Expand on mobile click */}
          <div className="mt-4 flex items-center justify-center lg:justify-start gap-2 flex-wrap">
            <div className="w-4 sm:w-6 h-px bg-gradient-to-r from-amber-500/80 to-transparent" />
            <p className="text-[10px] xs:text-[18px] sm:text-md text-white max-w-[280px] mx-auto lg:mx-0 leading-relaxed tracking-wide font-light mt-5 ">
              Premium picks. luxury style.
            </p>
            <div className="w-4 sm:w-6 h-px bg-gradient-to-l from-amber-500/80 to-transparent hidden sm:block" />
          </div>

          {/* Smart CTA - Touch friendly */}
          <Link
            to="/products"
            className="group relative mt-7 inline-flex items-center gap-2 px-5 xs:px-6 py-2 xs:py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] xs:text-[10px] font-semibold uppercase tracking-[0.25em] overflow-hidden shadow-lg shadow-red-500/20 active:scale-95 transition-all duration-300"
          >
            <span className="relative z-10">View All</span>
            <span className="relative z-10 w-5 h-5 rounded-full bg-white text-red-500 flex items-center justify-center transition-all duration-300 group-hover:rotate-45 group-hover:scale-110">
              <ArrowUpRight size={10} />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

            {/* Ripple effect on touch */}
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 scale-0 transition-transform duration-500 group-active:scale-100 group-active:opacity-100" />
          </Link>

          {/* Smart Progress - Responsive */}
          <div className="mt-6 flex items-center justify-center lg:justify-start gap-2 sm:gap-3 md:gap-4">
            {/* Current counter with glow */}
            <div className="relative">
              <span
                className="text-xl xs:text-2xl sm:text-3xl font-light text-white tracking-tighter relative z-10"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {String(currentSlide + 1).padStart(2, "0")}
              </span>
              <div className="absolute -inset-1 bg-amber-500/20 rounded-full blur-md -z-0" />
            </div>

            {/* Smart animated progress bar */}
            <div className="relative flex-1 max-w-[60px] xs:max-w-[70px] sm:max-w-[80px] md:max-w-[100px]">
              <div className="w-full h-px bg-white/20">
                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-amber-400/50 to-transparent" />
                <motion.span
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 shadow-md shadow-amber-500/50 rounded-full"
                  animate={{
                    width: `${((currentSlide + 1) / combinedBanners.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              {/* Moving dot on progress */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400"
                animate={{
                  left: `${((currentSlide + 1) / combinedBanners.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Total counter */}
            <span className="text-[9px] xs:text-[10px] sm:text-[11px] text-white/40 font-mono tracking-wider">
              {String(combinedBanners.length).padStart(2, "0")}
            </span>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="lg:hidden flex items-center justify-center gap-1 mt-4 text-white/20">
            <div className="w-4 h-px bg-white/20" />
            <span className="text-[6px] tracking-[0.3em] uppercase">Swipe to explore</span>
            <div className="w-4 h-px bg-white/20" />
          </div>
        </div>

        {/* Right Carousel */}
        <div className="relative flex items-center justify-center flex-3 order-2 w-full h-auto sm:h-full py-1 sm:py-2">
          <div className="relative w-full max-w-full overflow-hidden">
            <div
              ref={carouselRef}
              className="flex px-2 py-4 space-x-2 overflow-x-scroll scrollbar-hide scroll-smooth"
              style={{ scrollSnapType: "x mandatory" }}
              onScroll={() => {
                if (carouselRef.current) {
                  const scrollLeft = carouselRef.current.scrollLeft;
                  const slideWidth = carouselRef.current.firstChild
                    ? carouselRef.current.firstChild.offsetWidth + 16
                    : 0;
                  const index = Math.round(scrollLeft / slideWidth);
                  setCurrentSlide(index);
                }
              }}
            >
              {combinedBanners.map((banner, index) => (
                <div
                  key={banner._id || index}
                  className={`flex-shrink-0 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                    index === currentSlide
                      ? "border-yellow-200"
                      : "border-transparent hover:border-yellow-300"
                  }`}
                  onClick={() => {
                    setCurrentSlide(index);
                    scrollToSlide(index);
                    handleBannerClick(banner);
                  }}
                  style={{ scrollSnapAlign: "center" }}
                >
                  {/* Image Container with Title Overlay */}
                  <div className="relative group/image">
                    <img
                      src={banner.image?.url}
                      alt={banner.title || "Fashion Banner"}
                      className="w-full h-64 sm:h-72 md:h-80 lg:h-96 xl:h-[28rem] 2xl:h-[32rem] object-cover transition-transform duration-500 group-hover/image:scale-110"
                    />
                    {/* Title Overlay - Bottom */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 translate-y-0 transition-all duration-300">
                      <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold text-center tracking-wide">
                        {banner.title || "Premium Collection"}
                      </h3>
                      <div className="w-12 h-0.5 bg-amber-400 mx-auto mt-2 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Left Arrow */}
            <button
              onClick={prevSlide}
              className="absolute z-10 p-2 text-black transition-colors duration-300 transform -translate-y-1/2 bg-yellow-400 rounded-full shadow-lg left-2 top-1/2 hover:bg-yellow-500"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Right Arrow */}
            <button
              onClick={nextSlide}
              className="absolute z-10 p-2 text-black transition-colors duration-300 transform -translate-y-1/2 bg-yellow-400 rounded-full shadow-lg right-2 top-1/2 hover:bg-yellow-500"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;