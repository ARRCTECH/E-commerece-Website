"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchPromoBanners } from "../store/slices/bannerSlice";

/**
 * Premium PromoBanners — full-width image hero.
 * - No black side panel; image spans full width.
 * - Title, subtitle, and CTA overlay the image.
 * - Reduced overall height for a tighter, modern feel.
 */
const PromoBanners = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { promoBanners, isLoading } = useSelector((s) => s.banners);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    dispatch(fetchPromoBanners());
  }, [dispatch]);

  const defaultBanner = {
    _id: "default",
    title: "The Signature Collection",
    subtitle: "Crafted for the Few",
    image: {
      url: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1200&fit=crop",
    },
  };

  const active = promoBanners?.filter((b) => b.isActive) || [];
  const banners = active.length > 0 ? active : [defaultBanner];
  const current = banners[index];

  useEffect(() => {
    if (banners.length > 1 && !paused) {
      const i = setInterval(() => setIndex((p) => (p + 1) % banners.length), 6000);
      return () => clearInterval(i);
    }
  }, [banners.length, paused]);

  const handleClick = () => {
    const link = current?.bannerLink || current?.buttonLink;
    if (!link) return;
    if (link.startsWith("http") || link.startsWith("www")) window.location.href = link;
    else navigate(link);
  };

  const goPrev = (e) => {
    e?.stopPropagation();
    setIndex((p) => (p - 1 + banners.length) % banners.length);
  };
  const goNext = (e) => {
    e?.stopPropagation();
    setIndex((p) => (p + 1) % banners.length);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[260px] bg-[#0b0b0c]">
        <div className="w-10 h-10 rounded-full border-2 border-amber-200/30 border-t-amber-200 animate-spin" />
      </div>
    );
  }

  return (
    <section className="w-full bg-red-100 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-[1600px] mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Full-width image stage */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[28/10] max-h-[520px] cursor-pointer group" onClick={handleClick}>
            <AnimatePresence mode="wait">
              <motion.img
                key={current?._id || index}
                src={current?.image?.url || defaultBanner.image.url}
                alt={current?.title || "Promo"}
                initial={{ scale: 1.08, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </AnimatePresence>

            {/* Soft left-side gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />

            {/* Overlay content */}
            <div className="absolute inset-0 flex items-center">
              <div className="px-5 sm:px-10 lg:px-16 max-w-2xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current?._id || index}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-amber-200/90 mb-3 sm:mb-4">
                      <Sparkles className="w-3 h-3" />
                      <span>Exclusive</span>
                    </div> */}
                    
                    

                    
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-amber-200 hover:text-black backdrop-blur-md border border-white/15 hover:border-amber-200 flex items-center justify-center text-white transition-all duration-300"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-amber-200 hover:text-black backdrop-blur-md border border-white/15 hover:border-amber-200 flex items-center justify-center text-white transition-all duration-300"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Indicators */}
            {banners.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIndex(i);
                    }}
                    className={`h-[2px] rounded-full transition-all duration-700 ${
                      i === index
                        ? "w-10 bg-gradient-to-r from-amber-300 to-amber-500"
                        : "w-5 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;