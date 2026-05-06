"use client"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { useSelector, useDispatch } from "react-redux"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { fetchKsauniTshirts } from "../../store/slices/ksauniTshirtSlice"
import LoadingSpinner from "../LoadingSpinner"
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

  // ✅ Redirect handler
  const handleRedirect = () => {
    navigate("/products?category=ksauni-tshirts-styles")
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
    <div>
   {/* <div className="relative w-full mt-4 px-2 sm:px-4 md:px-4 lg:px-6 xl:px-8 2xl:px-10 3xl:px-12"> */}
      {/* Main Container */}
      <div
        className="rounded-2xl w-full mx-auto mt-2"
        style={{
          maxWidth: "1400px", // keeps alignment on ultra-wide screens
        }}
      >
        {/* Carousel Wrapper */}
        <div className="relative">
          {/* Left Button */}
          <button
            onClick={() => scrollBy("left")}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full hover:bg-gray-100"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Scrollable Carousel */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
className="flex overflow-x-auto gap-3 scrollbar-hide -mx-3 px-3 scroll-smooth"
          >
            {tshirts.map((tshirt, index) => (
              <motion.div
                key={tshirt._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                onClick={handleRedirect}
                className="
                  flex-shrink-0
                  rounded-xl overflow-hidden
                  transition-all duration-200 cursor-pointer
                  w-1/2    /* Mobile: 2 items */
                  sm:w-1/2 /* Small tablets: 2 items */
                  md:w-1/3 /* Tablets: 3 items */
                  lg:w-1/4 /* Desktop: 4 items */
                  xl:w-1/5 /* Large desktop: 5 items */
                  2xl:w-1/6 /* Extra large: 6 items */
                  3xl:w-1/7 /* Ultra-wide: 7 items */
                "
              >
                {/* Image container */}
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden">
                  <img
                    src={tshirt.image?.url || "/placeholder.svg"}
                    alt={tshirt.image?.alt || tshirt.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Button */}
          <button
            onClick={() => scrollBy("right")}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default KsauniTshirtStyle
