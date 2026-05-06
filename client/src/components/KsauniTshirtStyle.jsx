"use client"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { useSelector, useDispatch } from "react-redux"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { fetchKsauniTshirts } from "../store/slices/ksauniTshirtSlice"
import LoadingSpinner from "./LoadingSpinner"
import { useNavigate } from "react-router-dom"

const KsauniTshirtStyle = () => {
  const dispatch = useDispatch()
  const { tshirts, loading, error } = useSelector((state) => state.ksauniTshirt)
  const carouselRef = useRef(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()

  // Fetch T-shirts from Redux
  useEffect(() => {
    dispatch(fetchKsauniTshirts()).catch((error) => {
      console.error("[v1] KsauniTshirtStyle fetch error:", error)
    })
  }, [dispatch])

  // Handle scroll progress
  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft
      const itemWidth = carouselRef.current.firstChild?.offsetWidth + 24 || 0
      const index = Math.round(scrollLeft / itemWidth)
      setCurrentSlide(index)
    }
  }

  // Scroll function for buttons
  const scrollBy = (direction) => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.firstChild?.offsetWidth + 24 || 0
      carouselRef.current.scrollBy({
        left: direction === "left" ? -itemWidth : itemWidth,
        behavior: "smooth",
      })
    }
  }

  // ✅ Unified click handler (just redirect, no product details)
  const handleRedirect = () => {
    navigate("/products?category=ksauni-style")
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    console.error("[v1] KsauniTshirtStyle Redux error:", error)
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading t-shirts: {error}</p>
      </div>
    )
  }

  if (!tshirts.length) return null

  return (
    <section className="py-2 bg-white">
      <div className="px-1 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Carousel Wrapper */}
        <div className="relative">
          {/* Left Button */}
          <button
            onClick={() => scrollBy("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full hover:bg-gray-100"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Scrollable Carousel */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide -mx-3 px-3 scroll-smooth"
          >
            {tshirts.map((tshirt, index) => (
              <motion.div
                key={tshirt._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                onClick={handleRedirect} // ✅ same for all
                className="
                  flex-shrink-0
                  border border-gray-300 hover:border-gray-600
                  rounded-xl bg-white overflow-hidden shadow-md
                  transition-all duration-200 cursor-pointer
                  w-[45%]    /* Mobile: 2 items per screen with gap */
                  sm:w-[42%] /* Small tablets: ~2 items with gap */
                  md:w-[29%] /* Tablets: 3 items with gap */
                  lg:w-[20%] /* Desktop: 4 items with gap */
                "
              >
                {/* Image container */}
                <div className="w-full aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={tshirt.image?.url || "/placeholder.svg"}
                    alt={tshirt.image?.alt || tshirt.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product info */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{tshirt.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">${tshirt.price}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Button */}
          <button
            onClick={() => scrollBy("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full hover:bg-gray-100"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default KsauniTshirtStyle
