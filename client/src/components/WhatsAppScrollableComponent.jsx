import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { MessageCircle, Users, Gift, Clock, Zap, ChevronLeft, ChevronRight, ArrowRight, Star, ShoppingBag, Truck, Shield, Crown, Sparkles } from "lucide-react"

const WhatsAppScrollableComponent = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollContainerRef = useRef(null)
  const whatsappLink = "https://chat.whatsapp.com/Gk6xdrfvHj06xjcmi6dG4a"

  // Left Side Content
  const leftContent = {
    title: "Join Our WhatsApp Community",
    description: "Be the first to know about exclusive deals, new arrivals, and special offers!",
    members: "2,500+ Active Members",
    benefits: [
      { icon: <Gift className="w-5 h-5" />, text: "Exclusive Discounts" },
      { icon: <Clock className="w-5 h-5" />, text: "Early Access" },
      { icon: <Zap className="w-5 h-5" />, text: "Flash Sales" },
      { icon: <Star className="w-5 h-5" />, text: "VIP Treatment" },
    ]
  }

  // Right Side Scrollable Cards
  const scrollableCards = [
    {
      id: 1,
      icon: <Truck className="w-8 h-8" />,
      title: "Free Shipping",
      description: "On orders above ₹999",
      color: "from-blue-500 to-cyan-500",
      badge: "NEW"
    },
    {
      id: 2,
      icon: <Gift className="w-8 h-8" />,
      title: "Welcome Gift",
      description: "Get ₹500 off on first order",
      color: "from-purple-500 to-pink-500",
      badge: "WEEKEND"
    },
    {
      id: 3,
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Shopping",
      description: "100% payment protection",
      color: "from-green-500 to-emerald-500",
      badge: "SAFE"
    },
    {
      id: 4,
      icon: <Crown className="w-8 h-8" />,
      title: "Premium Support",
      description: "24/7 customer care",
      color: "from-yellow-500 to-orange-500",
      badge: "VIP"
    },
    {
      id: 5,
      icon: <Sparkles className="w-8 h-8" />,
      title: "Early Access",
      description: "Shop before everyone else",
      color: "from-red-500 to-rose-500",
      badge: "EXCLUSIVE"
    },
    {
      id: 6,
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Daily Deals",
      description: "New offers every day",
      color: "from-indigo-500 to-blue-500",
      badge: "HOT"
    }
  ]

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const nextIndex = (activeIndex + 1) % scrollableCards.length
        setActiveIndex(nextIndex)
        const cardWidth = scrollContainerRef.current.children[0]?.offsetWidth || 300
        scrollContainerRef.current.scrollTo({
          left: nextIndex * (cardWidth + 16),
          behavior: "smooth"
        })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [activeIndex, scrollableCards.length])

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft
      const cardWidth = scrollContainerRef.current.children[0]?.offsetWidth || 300
      const newIndex = Math.round(scrollLeft / (cardWidth + 16))
      setActiveIndex(newIndex)
      setScrollPosition(scrollLeft)
    }
  }

  const scrollTo = (direction) => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.children[0]?.offsetWidth || 300
      const newScrollPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - (cardWidth + 16))
        : scrollPosition + (cardWidth + 16)
      
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth"
      })
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 my-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-8 p-6 md:p-10">
          
          {/* LEFT SIDE - Fixed Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold text-white">WhatsApp Community</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {leftContent.title}
            </h2>

            <p className="text-gray-300 text-lg">
              {leftContent.description}
            </p>

            <div className="flex items-center gap-2 text-green-400">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{leftContent.members}</span>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-3">
              {leftContent.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2"
                >
                  <div className="text-green-400">{benefit.icon}</div>
                  <span className="text-white text-sm font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <MessageCircle className="w-6 h-6" />
              Join WhatsApp Group
              <ArrowRight className="w-5 h-5" />
            </motion.a>
          </div>

          {/* RIGHT SIDE - Scrollable Cards */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={() => scrollTo('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all md:-left-4"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => scrollTo('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all md:-right-4"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {scrollableCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className={`flex-shrink-0 w-72 bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-xl cursor-pointer relative overflow-hidden group`}
                >
                  {/* Badge */}
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold">
                    {card.badge}
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-4 p-3 bg-white/20 rounded-xl inline-block group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                  <p className="text-white/90 text-sm mb-4">{card.description}</p>
                  
                  {/* Join Button */}
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  >
                    Join Now
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </motion.div>
              ))}
            </div>

            {/* Scroll Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {scrollableCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveIndex(index)
                    if (scrollContainerRef.current) {
                      const cardWidth = scrollContainerRef.current.children[0]?.offsetWidth || 300
                      scrollContainerRef.current.scrollTo({
                        left: index * (cardWidth + 16),
                        behavior: "smooth"
                      })
                    }
                  }}
                  className={`h-2 rounded-full transition-all ${
                    activeIndex === index
                      ? 'w-8 bg-green-500'
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default WhatsAppScrollableComponent