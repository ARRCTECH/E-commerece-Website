"use client";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
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
              <h3 className="mt-2 mb-5  pb-8 text-4xl font-bold tracking-wider text-transparent sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text">
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
      <div className="relative z-10 flex flex-row items-center justify-center h-full px-2 mx-auto sm:px-4 lg:px-6 max-w-7xl">
        {/* Left Text */}
        <motion.div
          className="flex-1 order-1 mb-8 text-center lg:text-left lg:mb-0 lg:pr-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={textVariants} custom={0}>
            <h4 className="mb-4 pb-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-wider text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text">
  EXCLUSIVE
</h4>
          </motion.div>
          <Link
  to="/products"
  className="inline-flex mb-5 items-center px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base font-medium tracking-wider text-yellow-200 uppercase transition-all duration-300 border-0 sm:border sm:rounded-none hover:bg-yellow-400 hover:text-black"
>
  Shop Now
  <ArrowRight className="w-3 h-3 ml-1" />
</Link>
        </motion.div>
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
                  <img
                    src={banner.image?.url || "/placeholder.svg?height=500&width=400"}
                    alt={banner.title || "Fashion Banner"}
                    className="w-full h-64 sm:h-72 md:h-80 lg:h-96 xl:h-[28rem] 2xl:h-[32rem] object-cover"
                  />
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