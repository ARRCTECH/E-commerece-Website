"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchPromoBanners } from "../store/slices/bannerSlice";

const PromoBanners = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { promoBanners, isLoading } = useSelector((state) => state.banners);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    dispatch(fetchPromoBanners());
  }, [dispatch]);

  // Active banners only
  const banners = promoBanners?.filter((banner) => banner.isActive) || [];
  const currentBanner = banners[currentIndex];

  // Auto slider
  useEffect(() => {
    if (banners.length > 1 && !paused) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [banners.length, paused]);

  const handleBannerClick = () => {
    const link = currentBanner?.bannerLink || currentBanner?.buttonLink;

    if (!link) return;

    if (link.startsWith("http") || link.startsWith("www")) {
      window.location.href = link;
    } else {
      navigate(link);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) =>
      prev === 0 ? banners.length - 1 : prev - 1
    );
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) =>
      prev === banners.length - 1 ? 0 : prev + 1
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-[26vh] sm:h-[40vh] md:h-[80vh] flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!banners.length) return null;

  return (
    <section className="w-full overflow-hidden relative mt-[150px] md:mt-0">
      <div
        className="relative w-full h-[29vh] sm:h-[40vh] md:h-[85vh] cursor-pointer"
        onClick={handleBannerClick}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Banner Image */}
        <img
          src={currentBanner?.image?.url}
          alt="Promo Banner"
          className="absolute inset-0 w-full h-full object-cover select-none"
          draggable={false}
        />

        {/* Left Arrow */}
        {banners.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Right Arrow */}
        {banners.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 md:w-10 bg-red-500"
                    : "w-4 bg-white/40"
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