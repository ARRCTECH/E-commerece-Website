import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Users,
  Gift,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Star,
  ShoppingBag,
  Truck,
  Shield,
  Crown,
  Sparkles,
} from "lucide-react";

const WhatsAppScrollableComponent = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  const whatsappLink = "https://chat.whatsapp.com/Gk6xdrfvHj06xjcmi6dG4a";

  const benefits = [
    { icon: Gift, text: "Exclusive Discounts" },
    { icon: Clock, text: "Early Access" },
    { icon: Zap, text: "Flash Sales" },
    { icon: Star, text: "VIP Treatment" },
  ];

  const scrollableCards = [
    { id: 1, icon: Truck, title: "Free Shipping", description: "On orders above ₹999", badge: "NEW" },
    { id: 2, icon: Gift, title: "Welcome Gift", description: "₹500 off on first order", badge: "WEEKEND" },
    { id: 3, icon: Shield, title: "Secure Shopping", description: "100% payment protection", badge: "SAFE" },
    { id: 4, icon: Crown, title: "Premium Support", description: "24/7 customer care", badge: "VIP" },
    { id: 5, icon: Sparkles, title: "Early Access", description: "Shop before everyone else", badge: "EXCLUSIVE" },
    { id: 6, icon: ShoppingBag, title: "Daily Deals", description: "New offers every day", badge: "HOT" },
  ];

  const scrollToIndex = (index) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const card = container.children[0];
    const cardWidth = card?.offsetWidth ?? 280;
    const gap = window.innerWidth < 640 ? 12 : 16;
    container.scrollTo({ left: index * (cardWidth + gap), behavior: "smooth" });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % scrollableCards.length;
      setActiveIndex(next);
      scrollToIndex(next);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, scrollableCards.length]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const card = container.children[0];
    const cardWidth = card?.offsetWidth ?? 280;
    const gap = window.innerWidth < 640 ? 12 : 16;
    const newIndex = Math.round(container.scrollLeft / (cardWidth + gap));
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < scrollableCards.length) {
      setActiveIndex(newIndex);
    }
  };

  const nudge = (dir) => {
    const next = Math.max(0, Math.min(scrollableCards.length - 1, activeIndex + (dir === "left" ? -1 : 1)));
    setActiveIndex(next);
    scrollToIndex(next);
  };

  return (
    <section className="relative w-full bg-gradient-to-br from-[#0b0b0c] via-[#111112] to-black font-sans py-12 sm:py-16 md:py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#b8902c]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#c9a14a]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8a6a1f]/5 rounded-full blur-3xl" />
      </div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 right-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(184,144,44,0.1),transparent_70%)] blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 sm:gap-8 p-5 sm:p-8 lg:p-10">
            
            {/* LEFT SECTION */}
            <div className="flex flex-col justify-center space-y-4 sm:space-y-5">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#b8902c]/30 bg-black/30 px-3 py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-[#b8902c] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8902c] animate-pulse" />
                WhatsApp Community
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light leading-[1.2] tracking-tight text-white">
                Join our{" "}
                <em className="bg-gradient-to-r from-[#c9a14a] via-[#b8902c] to-[#ffd700] bg-clip-text not-italic text-transparent">
                  inner circle.
                </em>
              </h2>

              <p className="text-sm sm:text-base text-white/60 max-w-md leading-relaxed">
                First to exclusive drops, private deals, and members-only access.
              </p>

              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/50">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#b8902c]" strokeWidth={1.5} />
                <span>2,500+ active members</span>
              </div>

              {/* Benefits Grid - Responsive */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.text}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 sm:px-3 sm:py-2.5 backdrop-blur hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <b.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#b8902c]" strokeWidth={1.5} />
                    <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-white/80">
                      {b.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
className="group inline-flex w-full sm:w-fit items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#075E54] to-[#25D366] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#25D366]/30"              >
                <MessageCircle className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={1.8} />
                Join WhatsApp Community
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </motion.a>
            </div>

            {/* RIGHT SECTION - Scrollable Cards */}
            <div className="relative mt-6 lg:mt-0">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-white/40">
                  Member perks
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => nudge("left")}
                    aria-label="Previous"
                    className="rounded-full border border-white/20 bg-white/10 p-1.5 sm:p-2 text-white/70 backdrop-blur transition-all hover:border-[#b8902c]/60 hover:text-[#b8902c] hover:bg-white/20"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => nudge("right")}
                    aria-label="Next"
                    className="rounded-full border border-white/20 bg-white/10 p-1.5 sm:p-2 text-white/70 backdrop-blur transition-all hover:border-[#b8902c]/60 hover:text-[#b8902c] hover:bg-white/20"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {scrollableCards.map((card, index) => {
                  // Responsive width calculations
                  let cardWidth = "";
                  if (typeof window !== "undefined") {
                    if (window.innerWidth < 640) cardWidth = "w-[75%]";
                    else if (window.innerWidth < 768) cardWidth = "w-[60%]";
                    else if (window.innerWidth < 1024) cardWidth = "w-[48%]";
                    else cardWidth = "w-[45%]";
                  } else {
                    cardWidth = "w-[75%] sm:w-[60%] md:w-[48%] lg:w-[45%]";
                  }

                  return (
                    <motion.a
                      key={card.id}
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      className={`group relative w-[75%] sm:w-[60%] md:w-[48%] lg:w-[45%] flex-shrink-0 snap-start overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 sm:p-5 backdrop-blur transition-all hover:border-[#b8902c]/50 hover:bg-white/15`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="rounded-xl border border-[#b8902c]/30 bg-[#b8902c]/10 p-2 sm:p-2.5">
                          <card.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#b8902c]" strokeWidth={1.5} />
                        </div>
                        <span className="rounded-full border border-white/20 bg-black/30 px-2 py-0.5 sm:px-2.5 sm:py-1 font-serif text-[7px] sm:text-[8px] italic tracking-wider text-[#b8902c]">
                          {card.badge}
                        </span>
                      </div>

                      <h3 className="mt-3 sm:mt-4 font-serif text-sm sm:text-base md:text-lg font-light text-white">
                        {card.title}
                      </h3>
                      <p className="mt-0.5 text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-white/50">
                        {card.description}
                      </p>

                      <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/60 transition-all group-hover:text-[#b8902c] group-hover:gap-2">
                        Join Now
                        <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={1.5} />
                      </div>
                    </motion.a>
                  );
                })}
              </div>

              {/* Dot Indicators */}
              <div className="mt-4 sm:mt-5 flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                {scrollableCards.map((_, index) => (
                  <button
                    key={index}
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => {
                      setActiveIndex(index);
                      scrollToIndex(index);
                    }}
                    className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                      activeIndex === index 
                        ? "w-6 sm:w-8 bg-[#b8902c]" 
                        : "w-1.5 sm:w-2 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatsAppScrollableComponent;