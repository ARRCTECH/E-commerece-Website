"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { fetchCategoryBanners } from "../store/slices/bannerSlice";

/**
 * Full Width CategoryBanner — Edge to Edge
 */
const CategoryBanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categoryBanners, loadingCategory, error } = useSelector(
    (state) => state.banners
  );
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    dispatch(fetchCategoryBanners());
  }, [dispatch]);

  useEffect(() => {
    if (categoryBanners.length > 1) {
      const t = setInterval(
        () => setCurrent((p) => (p + 1) % categoryBanners.length),
        6000
      );
      return () => clearInterval(t);
    }
  }, [categoryBanners.length]);

  const handleClick = () => {
    const c = categoryBanners[current];
    if (c?.bannerLink) {
      if (c.bannerLink.startsWith("http") || c.bannerLink.startsWith("www")) {
        window.open(c.bannerLink, "_self");
      } else {
        navigate(c.bannerLink);
      }
    }
  };

  if (loadingCategory || error || !categoryBanners?.length) {
    return (
      <div className="w-full bg-[#0a0a0a]">
        <div className="aspect-[21/9] w-full animate-pulse bg-white/5 sm:aspect-[24/9] md:aspect-[28/9]" />
      </div>
    );
  }

  const item = categoryBanners[current];
  
  const getImageUrl = (banner) => {
    if (banner?.image?.url) return banner.image.url;
    if (banner?.image) return banner.image;
    if (banner?.imageUrl) return banner.imageUrl;
    if (banner?.bannerImage) return banner.bannerImage;
    return "/fallback-banner.png";
  };

  return (
    <div className="relative w-full bg-[#0a0a0a]">
      {/* Background Glow Effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/3 h-[300px] w-[600px] rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      {/* Full Width Banner */}
      <div
        onClick={handleClick}
        className="group relative w-full cursor-pointer overflow-hidden"
      >
        <div className="relative w-full">
          {/* Images - Full Width */}
          <div className="relative aspect-[21/9] w-full sm:aspect-[24/9] md:aspect-[28/9]">
            {categoryBanners.map((b, i) => {
              const url = getImageUrl(b);
              return (
                <img
                  key={b._id || i}
                  src={url}
                  alt={b?.title || "Category banner"}
                  loading={i === 0 ? "eager" : "lazy"}
                  onError={(e) => {
                    e.currentTarget.src = "/fallback-banner.png";
                  }}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1600ms] ease-out ${
                    i === current ? "scale-100 opacity-100" : "scale-105 opacity-0"
                  } group-hover:scale-[1.04]`}
                />
              );
            })}

            {/* Gradient Overlay - For text readability */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0) 100%)",
              }}
            />
            
            {/* Secondary Gold Overlay */}
            <div
              className="absolute inset-0 hidden md:block"
              style={{
                background:
                  "radial-gradient(ellipse at 80% 50%, rgba(201,161,74,0.15), transparent 60%)",
              }}
            />

            {/* Corner Decorations */}
            <span className="absolute left-4 top-4 h-6 w-6 border-l border-t border-amber-300/60 sm:left-6 sm:top-6 sm:h-8 sm:w-8" />
            <span className="absolute right-4 top-4 h-6 w-6 border-r border-t border-amber-300/60 sm:right-6 sm:top-6 sm:h-8 sm:w-8" />
            <span className="absolute bottom-4 left-4 h-6 w-6 border-b border-l border-amber-300/60 sm:bottom-6 sm:left-6 sm:h-8 sm:w-8" />
            <span className="absolute bottom-4 right-4 h-6 w-6 border-b border-r border-amber-300/60 sm:bottom-6 sm:right-6 sm:h-8 sm:w-8" />

            {/* Content - Left Side Text */}
            <div className="absolute inset-0 flex items-center">
              <div
                key={item?._id || current}
                className="max-w-2xl px-6 sm:px-12 md:px-16 lg:px-20"
                style={{ animation: "cb-fade .9s cubic-bezier(.22,1,.36,1) both" }}
              >
                {/* Tag Badge */}
                <div className="mb-3 inline-flex items-center gap-2 border-b border-amber-300/40 pb-1.5 text-[10px] font-medium uppercase tracking-[0.3em] text-amber-200 sm:text-[11px]">
                  <Sparkles className="h-3 w-3" />
                  <span>{item?.tag || "Exclusive Collection"}</span>
                </div>

                {/* Title */}
                <h2
                  className="text-xl font-light leading-[1.05] text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  <span
                    className="italic"
                    style={{
                      background:
                        "linear-gradient(135deg, #f5d68a 0%, #c9a14a 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {item?.title || "Curated For You"}
                  </span>
                </h2>

                {/* Subtitle */}
                {item?.subtitle && (
                  <p className="mt-2 hidden max-w-md text-sm leading-relaxed text-white/70 sm:mt-4 sm:block md:text-base">
                    {item.subtitle}
                  </p>
                )}

                {/* CTA Button */}
                <div className="mt-4 hidden items-center gap-3 sm:mt-6 sm:inline-flex">
                  <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-white">
                    {item?.cta || "Explore Now"}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white transition-all duration-500 group-hover:border-amber-300 group-hover:bg-amber-300 group-hover:text-black">
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                  </span>
                </div>
              </div>
            </div>

            {/* Slide Counter - Right Side Desktop */}
            <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-1 text-[10px] uppercase tracking-[0.3em] text-white/60 md:flex lg:right-12">
              <span className="text-amber-300">
                {String(current + 1).padStart(2, "0")}
              </span>
              <span className="h-10 w-px bg-white/20" />
              <span>{String(categoryBanners.length).padStart(2, "0")}</span>
            </div>

            {/* Dots Indicator - Bottom Center */}
            {categoryBanners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:bottom-6">
                {categoryBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrent(i);
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-[2px] transition-all duration-500 ${
                      i === current
                        ? "w-10 bg-amber-300"
                        : "w-5 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cb-fade {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CategoryBanner;