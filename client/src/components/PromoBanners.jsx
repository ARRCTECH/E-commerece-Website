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
      <div className="flex items-center justify-center min-h-[400px]">
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
    <section className="w-full bg-[#0b0b0c] text-white py-10 sm:py-16 px-3 sm:px-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Editorial header */}
        <div className="flex items-end justify-between mb-6 sm:mb-10 px-1">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.5em] uppercase text-amber-200/70">
              <span className="w-8 h-px bg-amber-200/40" />
              Factory Sale 
            </div>
            <h3
              className="mt-3 text-2xl sm:text-3xl text-white/90 italic font-light"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              The Curated Drop
            </h3>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-white/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-200/70" /> Exclusive
          </div>
        </div>

        {/* Hero stage */}
        <div
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#161617] via-[#0d0d0e] to-black min-h-[520px] sm:min-h-[600px] lg:min-h-[680px] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Gold gradient frame */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] p-[1px] bg-gradient-to-br from-amber-200/30 via-transparent to-amber-200/10">
            <div className="w-full h-full rounded-[27px] bg-transparent" />
          </div>

          {/* Ambient glows */}
          {/* <div className="pointer-events-none absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-amber-500/10 blur-3xl" /> */}
          {/* <div className="pointer-events-none absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full bg-rose-900/20 blur-3xl" /> */}

          {/* Film grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
            }}
          />

          {/* Corner ornaments */}
          {["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"].map(
            (pos, i) => (
              <div
                key={i}
                className={`absolute ${pos} w-8 h-8 border-amber-200/40 z-10 ${
                  pos.includes("top") ? "border-t" : "border-b"
                } ${pos.includes("left") ? "border-l" : "border-r"}`}
              />
            )
          )}

          <div className="relative grid grid-cols-1 lg:grid-cols-12 min-h-[520px] sm:min-h-[600px] lg:min-h-[680px]">
            {/* LEFT — image */}
            <div
              className="relative lg:col-span-7 overflow-hidden cursor-pointer min-h-[320px] lg:min-h-full"
              onClick={handleClick}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={current?._id || index}
                  src={current?.image?.url || defaultBanner.image.url}
                  alt={current?.title || "Promo"}
                  initial={{ scale: 1.15, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Cinematic overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/70" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent lg:hidden" />

              {/* Wax seal badge */}
              <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-10">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_8px_30px_rgba(0,0,0,0.5)] rotate-[-8deg]" />
                  <div className="absolute inset-[3px] rounded-full border border-amber-900/40 flex flex-col items-center justify-center text-black rotate-[-8deg]">
                    <span
                      className="text-[9px] tracking-[0.3em] uppercase"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Est.
                    </span>
                    <span className="text-2xl sm:text-3xl font-black leading-none">50</span>
                    <span className="text-[9px] tracking-[0.3em] uppercase mt-0.5">% Off</span>
                  </div>
                </div>
              </div>

              {/* Vertical caption */}
              <div className="hidden lg:flex absolute bottom-8 left-8 items-center gap-3 -rotate-90 origin-bottom-left translate-y-[-100%] text-[10px] tracking-[0.5em] uppercase text-white/40">
                <span className="w-10 h-px bg-white/30" />
                factory sale brand of india
              </div>
            </div>

            {/* RIGHT — content */}
            <div className="relative lg:col-span-5 flex flex-col justify-center px-7 sm:px-12 lg:px-14 py-10 lg:py-14 z-10 border-t lg:border-t-0 lg:border-l border-white/5">
              {/* Eyebrow */}
              <div className="inline-flex w-fit items-center gap-3 text-[10px] tracking-[0.5em] uppercase text-amber-200/80">
                <span className="w-6 h-px bg-amber-200/60" />
                Private Release
                <span className="w-1 h-1 rounded-full bg-amber-200/60" />
                N° 001
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current?._id || index}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6"
                >
                  <h2
                    className="text-white leading-[1.02] tracking-tight text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {current?.title || defaultBanner.title}
                  </h2>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="w-10 h-px bg-gradient-to-r from-amber-300 to-transparent" />
                    <p
                      className="text-base sm:text-lg text-amber-200/90 italic"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      {current?.subtitle || defaultBanner.subtitle}
                    </p>
                  </div>

                  <p className="mt-6 text-sm sm:text-[15px] text-white/55 max-w-md leading-[1.8] font-light">
                    {current?.description || defaultBanner.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* CTA */}
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <button
                  onClick={handleClick}
                  className="group/btn relative inline-flex items-center gap-4 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 text-black text-[11px] tracking-[0.35em] uppercase font-semibold transition-all duration-500 hover:shadow-[0_15px_40px_-10px_rgba(251,191,36,0.6)] overflow-hidden"
                >
                  <span className="relative z-10">{current?.buttonText || "Discover"}</span>
                  <span className="relative z-10 w-7 h-7 rounded-full bg-black text-amber-200 flex items-center justify-center group-hover/btn:rotate-45 transition-transform duration-500">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="absolute inset-0 bg-white/30 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                </button>

                
              </div>

              {/* Countdown */}
              {Object.keys(timeLeft).length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center gap-3 mb-4 text-[10px] tracking-[0.5em] uppercase text-white/40">
                    <Clock3 className="w-3 h-3 text-amber-200/70" />
                    Reservation Closes In
                    <span className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                  </div>
                  <div className="grid grid-cols-4 gap-2.5 max-w-md">
                    {units.map((u) => (
                      <div
                        key={u.key}
                        className="relative group/unit flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm border border-amber-200/10 hover:border-amber-200/30 rounded-xl py-3 overflow-hidden transition-colors"
                      >
                        <div className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
                        <span
                          className="text-2xl sm:text-3xl font-light tabular-nums text-white"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {String(timeLeft[u.key] ?? 0).padStart(2, "0")}
                        </span>
                        <span className="mt-1 text-[8px] tracking-[0.3em] uppercase text-white/40">
                          {u.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-amber-200 hover:text-black backdrop-blur border border-white/15 hover:border-amber-200 flex items-center justify-center transition-all duration-300"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-amber-200 hover:text-black backdrop-blur border border-white/15 hover:border-amber-200 flex items-center justify-center transition-all duration-300"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
              <div className="flex gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIndex(i);
                    }}
                    className={`h-[2px] rounded-full transition-all duration-700 ${
                      i === index
                        ? "w-12 bg-gradient-to-r from-amber-200 to-amber-400"
                        : "w-6 bg-white/25 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
              <span
                className="text-[10px] tracking-[0.3em] text-white/50 tabular-nums"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {String(index + 1).padStart(2, "0")} — {String(banners.length).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
