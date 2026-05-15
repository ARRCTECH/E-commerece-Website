"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Clock3, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchPromoBanners } from "../store/slices/bannerSlice";
import LoadingSpinner from "./LoadingSpinner";

const calculateTimeLeft = (targetDate) => {
  const diff = +new Date(targetDate) - +new Date();
  if (diff <= 0) return {};
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const PromoBanners = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { promoBanners, isLoading } = useSelector((s) => s.banners);

  const targetDate = "2025-01-15T00:00:00";
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    dispatch(fetchPromoBanners());
  }, [dispatch]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000);
    return () => clearInterval(t);
  }, []);

  const defaultBanner = {
    _id: "default",
    title: "The Signature Collection",
    subtitle: "Crafted for the Few",
    description:
      "An exclusive edit of pieces — meticulously tailored, quietly luxurious. Reserved for those who appreciate the details only true connoisseurs notice.",
    image: {
      url: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1200&fit=crop",
    },
    buttonText: "Shop Now",
    buttonLink: "/products?deal=true",
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
      <div className="flex items-center justify-center min-h-[300px] bg-gradient-to-b from-[#0b0b0c] via-[#161617] to-black">
        <LoadingSpinner />
      </div>
    );
  }

  const units = [
    { key: "days", label: "Days" },
    { key: "hours", label: "Hours" },
    { key: "minutes", label: "Minutes" },
    { key: "seconds", label: "Seconds" },
  ];

  return (
    <div className="w-full">
      {/* Hero stage - full width */}
      <div
        className="relative overflow-hidden border-y border-white/10 bg-gradient-to-b from-[#161617] via-[#0d0d0e] to-black min-h-[380px] sm:min-h-[420px] lg:min-h-[460px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Gold gradient frame - subtle */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-200/10 via-transparent to-amber-200/5" />

        {/* Film grain - optional, keep minimal */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />

        {/* Corner ornaments - smaller */}
        {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map(
          (pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-5 h-5 border-amber-200/30 z-10 ${
                pos.includes("top") ? "border-t" : "border-b"
              } ${pos.includes("left") ? "border-l" : "border-r"}`}
            />
          )
        )}

        <div className="relative grid grid-cols-1 lg:grid-cols-12 min-h-[380px] sm:min-h-[420px] lg:min-h-[460px]">
          {/* LEFT — image */}
          <div
            className="relative lg:col-span-7 overflow-hidden cursor-pointer min-h-[200px] lg:min-h-full"
            onClick={handleClick}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={current?._id || index}
                src={current?.image?.url || defaultBanner.image.url}
                alt={current?.title || "Promo"}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Cinematic overlays - minimal */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent lg:hidden" />

            {/* Wax seal badge - smaller - show only if discount info exists */}
            {(current?.discount || current?.discountPercent) && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_4px_15px_rgba(0,0,0,0.4)] rotate-[-8deg]" />
                  <div className="absolute inset-[2px] rounded-full border border-amber-900/40 flex flex-col items-center justify-center text-black rotate-[-8deg]">
                    <span
                      className="text-[7px] tracking-[0.2em] uppercase"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Est.
                    </span>
                    <span className="text-lg sm:text-xl font-black leading-none">
                      {current?.discount || current?.discountPercent || 50}
                    </span>
                    <span className="text-[7px] tracking-[0.2em] uppercase mt-0.5">% Off</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — content with reduced padding */}
          <div className="relative lg:col-span-5 flex flex-col justify-center px-5 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10 z-10 border-t lg:border-t-0 lg:border-l border-white/5">
            {/* Eyebrow - dynamic */}
            <div className="inline-flex w-fit items-center gap-2 text-[8px] sm:text-[9px] tracking-[0.4em] uppercase text-amber-200/80">
              <span className="w-4 h-px bg-amber-200/60" />
              {current?.badge || current?.category || "Private Release"}
              <span className="w-0.5 h-0.5 rounded-full bg-amber-200/60" />
              {current?.edition || "N° 001"}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current?._id || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4"
              >
                {/* Dynamic Title */}
                <h2
                  className="text-white leading-[1.1] tracking-tight text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-light"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {current?.title || defaultBanner.title}
                </h2>

                {/* Dynamic Subtitle */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-6 h-px bg-gradient-to-r from-amber-300 to-transparent" />
                  <p
                    className="text-sm sm:text-base lg:text-lg text-amber-200/90 italic"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {current?.subtitle || defaultBanner.subtitle}
                  </p>
                </div>

                {/* Dynamic Description */}
                <p className="mt-3 text-xs sm:text-sm text-white/55 max-w-md leading-relaxed font-light line-clamp-2 sm:line-clamp-3">
                  {current?.description || defaultBanner.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* CTA - with dynamic button text */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={handleClick}
                className="group/btn relative inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 text-black text-[10px] tracking-[0.35em] uppercase font-semibold transition-all duration-500 hover:shadow-[0_10px_25px_-8px_rgba(251,191,36,0.5)] overflow-hidden"
              >
                <span className="relative z-10">{current?.buttonText || "Discover"}</span>
                <span className="relative z-10 w-6 h-6 rounded-full bg-black text-amber-200 flex items-center justify-center group-hover/btn:rotate-45 transition-transform duration-500">
                  <ArrowUpRight className="w-3 h-3" />
                </span>
                <span className="absolute inset-0 bg-white/30 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-800" />
              </button>
            </div>

            {/* Countdown - only show if date is set */}
            {current?.showCountdown !== false && Object.keys(timeLeft).length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2 text-[8px] tracking-[0.4em] uppercase text-white/40">
                  <Clock3 className="w-2.5 h-2.5 text-amber-200/70" />
                  {current?.countdownLabel || "Reservation Closes In"}
                  <span className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                </div>
                <div className="grid grid-cols-4 gap-2 max-w-md">
                  {units.map((u) => (
                    <div
                      key={u.key}
                      className="relative group/unit flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm border border-amber-200/10 hover:border-amber-200/30 rounded-lg py-2 overflow-hidden transition-colors"
                    >
                      <div className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent" />
                      <span
                        className="text-xl sm:text-2xl font-light tabular-nums text-white"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {String(timeLeft[u.key] ?? 0).padStart(2, "0")}
                      </span>
                      <span className="mt-0.5 text-[7px] tracking-[0.2em] uppercase text-white/40">
                        {u.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side arrows - smaller */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-amber-200 hover:text-black backdrop-blur border border-white/15 hover:border-amber-200 flex items-center justify-center transition-all duration-300"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-amber-200 hover:text-black backdrop-blur border border-white/15 hover:border-amber-200 flex items-center justify-center transition-all duration-300"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Indicators - minimal */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <div className="flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  className={`h-[2px] rounded-full transition-all duration-500 ${
                    i === index
                      ? "w-8 bg-gradient-to-r from-amber-200 to-amber-400"
                      : "w-4 bg-white/25 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoBanners;