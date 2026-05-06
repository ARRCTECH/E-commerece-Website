"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPromoBanners } from "../store/slices/bannerSlice";
import LoadingSpinner from "./LoadingSpinner";
import { useNavigate } from "react-router-dom";

// ---------------------
// Utility: Countdown Timer
// ---------------------
const calculateTimeLeft = (targetDate) => {
  const difference = +new Date(targetDate) - +new Date();
  let timeLeft = {};
  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
};

const PromoBanners = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { promoBanners, isLoading } = useSelector((state) => state.banners);

  // Fetch promo banners on mount
  useEffect(() => {
    dispatch(fetchPromoBanners());
  }, [dispatch]);

  // Countdown logic
  const targetDate = "2024-12-13T00:00:00";
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearTimeout(timer);
  });

  // Auto-rotate banners every 5s
  useEffect(() => {
    if (promoBanners && promoBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % promoBanners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [promoBanners]);

  // Handle banner click navigation
  const handleBannerClick = () => {
    const currentBanner = bannersToShow[currentBannerIndex];
    const link = currentBanner?.bannerLink || currentBanner?.buttonLink;
    
    if (link) {
      // Check if it's an external URL or internal route
      if (link.startsWith('http') || link.startsWith('www')) {
        // Open external links in the same tab
        window.location.href = link;
      } else {
        // Internal routes use React Router navigation
        navigate(link);
      }
    }
  };

  // Countdown UI
  const timerComponents = [];
  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval] && timeLeft[interval] !== 0) return;
    timerComponents.push(
      <div
        key={interval}
        className="flex flex-col items-center justify-center
                   w-7 h-7 border rounded bg-white/20 backdrop-blur-sm border-white/30
                   sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
      >
        <span className="text-xs font-bold text-white sm:text-sm md:text-base lg:text-lg">
          {String(timeLeft[interval]).padStart(2, "0")}
        </span>
        <span className="text-[10px] uppercase text-white/80 md:text-xs lg:text-sm">
          {interval.slice(0, 1)}
        </span>
      </div>
    );
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Active banners or fallback
  const activeBanners = promoBanners?.filter((banner) => banner.isActive) || [];
  const defaultBanner = {
    _id: "default-deal",
    title: "SHOPPERS STOP",
    subtitle: "MIN. 30% OFF",
    description: "Discover amazing deals on premium fashion brands",
    image: { url: "/placeholder.svg?height=600&width=1920&text=Fashion+Sale" },
    buttonText: "SHOP NOW",
    buttonLink: "/products?deal=true",
    brandLogo: "/placeholder.svg?height=40&width=80&text=BRAND",
  };
  const bannersToShow = activeBanners.length > 0 ? activeBanners : [defaultBanner];
  const currentBanner = bannersToShow[currentBannerIndex];

  // Check if current banner has a link
  const hasLink = currentBanner?.bannerLink || currentBanner?.buttonLink;

  // ---------------------
  // UI - Fully Responsive for Big Screens
  // ---------------------
  return (
    <section className="w-full mt-4 px-4">
      {/* Main Container - Fully Responsive */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg w-full mx-auto"
        style={{ 
          border: "3px solid #be7a21",
          maxWidth: "1800px" // Increased for very large screens
        }}
      >
        {/* Banner Image Container - Fully Fluid */}
        <div 
          className="relative w-full aspect-[25/9] lg:aspect-[25/8] xl:aspect-[25/7] 2xl:aspect-[25/6]"
          onClick={handleBannerClick}
          style={{
            cursor: hasLink ? "pointer" : "default",
          }}
        >
          <img
            src={
              currentBanner?.image?.url ||
              "/placeholder.svg?height=600&width=1920&text=Fashion+Sale"
            }
            alt={currentBanner?.title || "Promotional banner"}
            className="w-full h-full object-cover rounded-2xl"
          />
          
          {/* Overlay Content (if your banner has text like in the image) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Add your promotional text content here if needed */}
            {/* Example: FLAT ₹100 OFF text overlay */}
          </div>
        </div>

        {/* Countdown Timer - Responsive Positioning */}
        {timerComponents.length > 0 && (
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 lg:bottom-8 lg:right-8 xl:bottom-10 xl:right-10">
            <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-5">
              {timerComponents}
            </div>
          </div>
        )}

        {/* Banner Indicators/Dots for Multiple Banners */}
        {bannersToShow.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 md:bottom-6 lg:bottom-8">
            {bannersToShow.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBannerIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 md:w-3 md:h-3 ${
                  index === currentBannerIndex 
                    ? "bg-white scale-125" 
                    : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PromoBanners;