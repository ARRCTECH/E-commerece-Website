"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { Swiper, SwiperSlide } from "swiper/react"
import { FreeMode, Navigation, Thumbs, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/navigation"
import "swiper/css/thumbs"
import "swiper/css/pagination"
import { Heart, Minus, Plus, X, AlertCircle, Ruler, ShoppingCart } from "lucide-react"

import { fetchProductById } from "../store/slices/productSlice"
import { addToCart, optimisticAddToCart, selectIsAddingToCart } from "../store/slices/cartSlice"
import {
  addToWishlist,
  removeFromWishlist,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist,
  selectIsAddingToWishlist,
  selectIsRemovingFromWishlist,
} from "../store/slices/wishlistSlice"

import ProductReviews from "../components/ProductReviews"
import RelatedProducts from "../components/RelatedProducts"
import Preloader from "../components/Preloader"
import toast from "react-hot-toast"

const ProductDetailPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentProduct, isLoading, error } = useSelector((state) => state.products)
  const { items: wishlistItems } = useSelector((state) => state.wishlist)
  const isAddingToCart = useSelector(selectIsAddingToCart)
  const isAddingToWishlist = useSelector(selectIsAddingToWishlist)
  const isRemovingFromWishlist = useSelector(selectIsRemovingFromWishlist)

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [thumbsSwiper, setThumbsSwiper] = useState(null)

  const isInWishlist = wishlistItems.some((item) => item._id === currentProduct?._id)

  useEffect(() => {
    if (id) dispatch(fetchProductById(id))
  }, [dispatch, id])

  useEffect(() => {
    if (currentProduct) {
      // if (currentProduct.sizes?.length > 0) setSelectedSize(currentProduct.sizes[0].size)
      if (currentProduct.colors?.length > 0) setSelectedColor(currentProduct.colors[0].name)
    }
  }, [currentProduct])

  const getDiscountPercentage = () => {
    if (currentProduct?.originalPrice && currentProduct.originalPrice > currentProduct.price) {
      return Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100)
    }
    return 0
  }

  const getSelectedSizeStock = () => {
    if (!selectedSize || !currentProduct?.sizes) return currentProduct?.stock || 0
    const sizeData = currentProduct.sizes.find((s) => s.size === selectedSize)
    return sizeData?.stock || 0
  }
  const tagText =
    (Array.isArray(currentProduct?.tags) && currentProduct.tags[0]) ||
    (currentProduct?.isTrending && "TRENDING") ||
    (currentProduct?.isNewArrival && "NEW ARRIVAL") ||
    (currentProduct?.isFeatured && "FEATURED") ||
    "DESIGN OF THE WEEK"

  const fitText =
    typeof currentProduct?.fits === "string"
      ? `${currentProduct.fits} FIT`
      : currentProduct?.fits
        ? `${String(currentProduct.fits)} FIT`
        : "REGULAR FIT"

  const materialText =
    typeof currentProduct?.material === "string"
      ? currentProduct.material
      : currentProduct?.material
        ? String(currentProduct.material)
        : "COTTON"

  const handleAddToCart = async () => {
    if (currentProduct.sizes?.length && !selectedSize) return toast.error("Please select a size")
    if (currentProduct.colors?.length && !selectedColor) return toast.error("Please select a color")

    const payload = { productId: currentProduct._id, quantity, size: selectedSize, color: selectedColor }
    dispatch(optimisticAddToCart({ product: currentProduct, quantity, size: selectedSize, color: selectedColor }))
    toast.success(`${currentProduct.name} added to cart!`)

    const bag = document.querySelector("#bag")
    if (bag) {
      bag.style.transform = "scale(1.2)"
      setTimeout(() => (bag.style.transform = "scale(1)"), 200)
    }

    try {
      await dispatch(addToCart(payload)).unwrap()
    } catch (err) {
      console.error(err)
      toast.error(err?.message || "Failed to add to cart")
    }
  }

  const handleBuyNow = async () => {
    if (currentProduct.sizes?.length && !selectedSize) return toast.error("Please select a size")
    if (currentProduct.colors?.length && !selectedColor) return toast.error("Please select a color")

    await handleAddToCart()
    navigate("/checkout", {
      state: {
        product: currentProduct,
        quantity,
        size: selectedSize,
        color: selectedColor,
      },
    })
  }

  const handleWishlistToggle = async () => {
    try {
      if (isInWishlist) {
        dispatch(optimisticRemoveFromWishlist(currentProduct._id))
        toast.success(`${currentProduct.name} removed from wishlist!`)
        await dispatch(removeFromWishlist(currentProduct._id)).unwrap()
      } else {
        dispatch(optimisticAddToWishlist(currentProduct))
        toast.success(`${currentProduct.name} added to wishlist!`)
        await dispatch(addToWishlist(currentProduct)).unwrap()
      }
      const wish = document.querySelector("#wish")
      if (wish) {
        wish.style.transform = "scale(1.2)"
        setTimeout(() => (wish.style.transform = "scale(1)"), 200)
      }
    } catch (err) {
      console.error(err)
      toast.error(err?.message || "Failed to update wishlist")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentProduct.name,
          text: currentProduct.description,
          url: window.location.href,
        })
      } catch {
        // User cancelled sharing
        toast.error("Failed to share product")
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied")
      } catch {
        toast.error("Failed to copy")
      }
    }
  }

  const handleViewSimilar = () => {
    if (currentProduct?.category?.slug) {
      navigate(`/products?category=${currentProduct.category.slug}`)
    } else {
      navigate("/products")
    }
  }

  if (isLoading) return <Preloader message="Loading product…" />
  if (error || !currentProduct)
    return (
      <div className="text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="mb-8 text-gray-600">It may have been removed.</p>
        <Link
          to="/products"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )

  return (
    <div className=" bg-gray-50 sm:pb-0 pb-10">
      {/* Desktop Breadcrumb - Hidden on mobile */}
      <div className="hidden sm:block bg-white py-5 shadow-sm">
        <div className="mx-auto px-2 sm:px-6">
          <nav className="flex items-center text-sm text-gray-600 space-x-2 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary">
              Products
            </Link>
            <span>/</span>
            <Link to={`/products/${currentProduct.category?.slug}`} className="hover:text-primary">
              {currentProduct.category?.name}
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">{currentProduct.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-4 py-2">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 sm:p-4">
            {/* Images Section */}
            <div className=" relative">
              {/* Wishlist Button - Top right corner of image */}
              <button
                onClick={handleWishlistToggle}
                disabled={isAddingToWishlist || isRemovingFromWishlist}
                className={`absolute top-5 right-2 z-10 p-2 rounded-full transition-colors ${
                  isInWishlist
                    ? "text-primary bg-primary/10 hover:bg-primary/20"
                    : "text-gray-400 hover:text-primary hover:bg-primary/10"
                }`}
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart id="wish" className={`w-6 h-6 ${isInWishlist ? "fill-current" : ""}`} />
              </button>

              {/* Mobile Swiper - full bleed */}
              <div className="lg:hidden relative -mx-6 rounded-xl">
                <Swiper
                  spaceBetween={0}
                  thumbs={{ swiper: thumbsSwiper }}
                  pagination={{ clickable: true, dynamicBullets: true }}
                  modules={[FreeMode, Navigation, Thumbs, Pagination]}
                  className="rounded-none mobile-swiper"
                >
                  {currentProduct.images.map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <div className="relative bg-black rounded-xl overflow-hidden mb-2">
                        <img
                          src={img.url || "/placeholder.svg"}
                          alt={currentProduct.name}
                          className="w-full aspect-[3/4] object-cover cursor-zoom-in"
                          loading="lazy"
                          onClick={() => {
                            setSelectedImage(idx)
                            setShowImageModal(true)
                          }}
                        />
                        {/* Discount badge removed on mobile to match requested UI */}

                        <div className="absolute bottom-6 left-2 right-2 flex items-center justify-between gap-2">
                          <button
                            onClick={handleViewSimilar}
                            className="px-3 py-1 rounded-full bg-white/90 text-gray-900 text-xs font-semibold shadow"
                          >
                            VIEW SIMILAR
                          </button>

                          <div className="px-3 py-1 rounded-full bg-black/80 text-white text-xs font-semibold flex items-center gap-2">
                            <span className="uppercase">
                              {currentProduct?.category?.name ? String(currentProduct.category.name) : "REGULAR"}
                            </span>
                            {currentProduct?.ratingAvg ? (
                              <span className="inline-flex items-center gap-1">
                                {"⭐"} {Number(currentProduct.ratingAvg).toFixed(1)}
                                {currentProduct?.ratingCount ? (
                                  <span className="opacity-80">/{currentProduct.ratingCount}</span>
                                ) : null}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Thumbs */}
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={8}
                  slidesPerView={4}
                  freeMode={true}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="mt-2 px-2"
                >
                  {currentProduct.images.map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <div className="aspect-auto bg-gray-100 rounded-xl overflow-hidden border-transparent hover:border-primary cursor-pointer">
                        <img
                          src={img.url || "/placeholder.svg"}
                          alt={`${currentProduct.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Desktop Image Display */}
              <div className="hidden lg:block">
                <div className="relative bg-gray-50 rounded-xl overflow-hidden group">
                  <motion.img
                    src={currentProduct.images[selectedImage]?.url}
                    alt={currentProduct.name}
                    className="max-w-full max-h-full object-contain cursor-zoom-in"
                    onClick={() => setShowImageModal(true)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    loading="lazy"
                  />
                  {/*
                  {currentProduct.images.length > 1 && (
                    <>
                      <button 
                        onClick={() => setSelectedImage(prev => (prev - 1 + currentProduct.images.length) % currentProduct.images.length)} 
                        className="absolute left-4 top-1/2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setSelectedImage(prev => (prev + 1) % currentProduct.images.length)} 
                        className="absolute right-4 top-1/2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  */}

                  {getSelectedSizeStock() === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <span className="bg-white text-gray-800 px-4 py-2 rounded-full font-medium">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {currentProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition ${
                        selectedImage === idx ? "border-primary" : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img.url || "/placeholder.svg"}
                        alt={`${currentProduct.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Name Under Product Image */}
              <div className="mt-4 text-left lg:hidden">
                <p className="text-md font-semibold text-gray-900">
                  <span>{currentProduct.brand || "Ksauni Bliss"}</span>
                </p>
                {currentProduct.name && (
                  <p className="text-sm text-gray-600 mt-1">
                    {typeof currentProduct.name === "string"
                      ? currentProduct.name
                      : JSON.stringify(currentProduct.name)}
                  </p>
                )}
                {/* Price under description */}
                <div className="mt-3">
                  <span className="text-2xl font-bold text-gray-900">₹{currentProduct.price.toLocaleString()}</span>
                  {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                    <span className="text-lg text-gray-500 line-through ml-2">
                      ₹{currentProduct.originalPrice.toLocaleString()}
                    </span>
                  )}
                  {getDiscountPercentage() > 0 && (
                    <span className="ml-2 text-sm font-medium text-green-600">{getDiscountPercentage()}% OFF</span>
                  )}
                </div>
              </div>

              {/* Share Button */}
              {/* <button 
                onClick={handleShare}
                className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share this product</span>
              </button> */}
            </div>

            {/* Product Info */}
            <div className="space-y-1">
              <div className="flex items-start justify-between">
                <div className="hidden lg:block mb-2">
                  <p className="text-lg font-semibold text-gray-900">
                    <span>{currentProduct.brand || "Ksauni Bliss"}</span>
                  </p>
                  {currentProduct.description && (
                    <p className="text-base text-gray-600 mb-2">
                      {typeof currentProduct.description === "string"
                        ? currentProduct.description
                        : JSON.stringify(currentProduct.description)}
                    </p>
                  )}
                  {/* Price section */}
                  <span className="text-3xl font-bold text-gray-900">₹{currentProduct.price.toLocaleString()}</span>
                  {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                    <span className="text-xl text-gray-500 line-through ml-3">
                      ₹{currentProduct.originalPrice.toLocaleString()}
                    </span>
                  )}
                  {getDiscountPercentage() > 0 && (
                    <span className="ml-3 text-base font-medium text-green-600">{getDiscountPercentage()}% OFF</span>
                  )}
                </div>
              </div>
              <div className="lg:hidden -mt-2">
                <div className="grid grid-cols-3 gap-2">
                  {/* Tags */}
                  <div className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-2 rounded-xl bg-amber-50 text-gray-900 border border-amber-100">
                    {String(tagText).replace(/-/g, " ")}
                  </div>
                  {/* Fits */}
                  <div className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-2 rounded-xl bg-gray-100 text-gray-800">
                    {String(fitText).replace(/-/g, " ")}
                  </div>
                  {/* Material */}
                  <div className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-2 rounded-xl bg-white text-gray-800 border border-gray-400">
                    {String(materialText).replace(/-/g, " ")}
                  </div>
                </div>
              </div>

              {/* Colors */}
              {currentProduct.colors?.length > 0 && (
                <div className="pt-3">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Color: <span className="font-normal">{selectedColor}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors.map((color) => (
                      <motion.button
                        key={color.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedColor(color.name)}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          selectedColor === color.name
                            ? "border-primary shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        title={color.name}
                        aria-label={`Select color ${color.name}`}
                      >
                        <div
                          className="w-8 h-8 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.hex || color.name.toLowerCase() }}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {currentProduct.sizes?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3 pt-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Size: <span className="font-normal rounded-sm">{selectedSize || "Please select"}</span>
                    </h3>
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="text-sm font-medium text-primary hover:text-primary-dark flex items-center"
                    >
                      <Ruler className="w-4 h-4 mr-1" />
                      Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 border border-gray-200 rounded-xl">
                    {currentProduct.sizes.map((s) => (
                      <motion.button
                        key={s.size}
                        onClick={() => setSelectedSize(s.size)}
                        disabled={s.stock === 0}
                        className={`px-4 py-2 border border-gray-300 rounded-xl font-medium text-sm ${
                          selectedSize === s.size
                            ? "border-primary rounded bg-primary/10 text-primary"
                            : s.stock === 0
                              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "border-gray-300 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {s.size}
                      </motion.button>
                    ))}
                  </div>
                  <span className="text-sm py-3 mb-3 mx-2 font-semibold text-gray-600">
                    {selectedSize
                      ? `${getSelectedSizeStock()} available in ${selectedSize}`
                      : "Please select a size to see availability"}
                  </span>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <span className="px-4 py-2 font-medium border-x border-gray-300">{quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.min(getSelectedSizeStock(), quantity + 1))}
                      disabled={quantity >= getSelectedSizeStock()}
                      className="p-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
              {currentProduct.productDetails && (
                <div className="pt-1">
                  <h2 className="text-md font-bold text-gray-700 mb-1">Product Details</h2>
                  <p className="text-gray-600 whitespace-pre-line">
                    {typeof currentProduct.productDetails === "string"
                      ? currentProduct.productDetails
                      : JSON.stringify(currentProduct.productDetails)}
                  </p>
                </div>
              )}
              {/* Product Details Section */}
              <div className=" pt-1">
                {currentProduct.material && (
                  <div>
                    <h2 className="text-md font-bold text-gray-700 mb-1">Material & Care</h2>
                    <p className="text-gray-600 whitespace-pre-line">
                      {typeof currentProduct.material === "string"
                        ? currentProduct.material
                        : JSON.stringify(currentProduct.material)}
                    </p>
                  </div>
                )}

                {currentProduct.fits && (
                  <div>
                    <h2 className="text-md font-bold text-gray-700 mb-1">Model Size and Fits</h2>
                    <p className="text-gray-600 whitespace-pre-line">
                      {typeof currentProduct.fits === "string"
                        ? `${currentProduct.fits} Fit`
                        : `${JSON.stringify(currentProduct.fits)} Fit`}
                    </p>
                  </div>
                )}

                {currentProduct.care && (
                  <div>
                    <h2 className="text-md font-bold text-gray-700 mb-1">Care Instructions</h2>
                    <p className="text-gray-600">
                      {typeof currentProduct.care === "string"
                        ? currentProduct.care
                        : JSON.stringify(currentProduct.care)}
                    </p>
                  </div>
                )}
              </div>

              <div className="hidden lg:block pt-4 border-t border-gray-200">
                <div className="flex gap-3 max-w-md">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || getSelectedSizeStock() === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-2 bg-white border-2 border-gray-300 text-gray-800 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    ADD TO CART
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={isAddingToCart || getSelectedSizeStock() === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img src="/buynow1.svg" className="w-8 h-8" />
                    BUY NOW
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Static Design Section */}
          <StaticDesignSection />

          {/* Reviews Section */}
          <div
            id="reviews"
            className="border-t border-gray-200 rounded-xl sm:rounded-xl px-4 sm:px-6 py-6 sm:py-8 bg-white"
          >
            <div className="w-full sm:max-w-4xl mx-auto rounded-full">
              <ProductReviews productId={currentProduct._id} />
            </div>
          </div>

          {/* Related Products */}
          <div className="border-t rounded-xl border-gray-200 px-4 sm:px-6 py-6 sm:py-8 bg-white">
            <RelatedProducts currentProduct={currentProduct} />
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              className="relative max-w-4xl w-full max-h-[90vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="h-full flex items-center justify-center">
                <img
                  src={currentProduct.images[selectedImage]?.url || "/placeholder.svg"}
                  alt={currentProduct.name}
                  className="object-contain max-w-full max-h-full"
                  loading="lazy"
                />
              </div>
              {/*
              {currentProduct.images.length > 1 && (
                <>
                  <button 
                    onClick={() => setSelectedImage(prev => (prev - 1 + currentProduct.images.length) % currentProduct.images.length)} 
                    className="absolute left-0 top-1/2 p-3 text-white hover:text-gray-300"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button 
                    onClick={() => setSelectedImage(prev => (prev + 1) % currentProduct.images.length)} 
                    className="absolute right-0 top-1/2 p-3 text-white hover:text-gray-300"
                  >
                    <ChevronRight className="w-8 h-8 text-gray-500" />
                  </button>
                </>
              )}
              */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSizeGuide(false)}
          >
            <motion.div
              className="relative bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Size Guide</h3>
                  <button onClick={() => setShowSizeGuide(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600 mb-4">
                    Use this guide to help determine your correct size. Measurements are in inches.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                            Size
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                            Chest
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                            Waist
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                            Hip
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border-b border-gray-200">S</td>
                          <td className="px-4 py-2 border-b border-gray-200">34-36</td>
                          <td className="px-4 py-2 border-b border-gray-200">28-30</td>
                          <td className="px-4 py-2 border-b border-gray-200">36-38</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border-b border-gray-200">M</td>
                          <td className="px-4 py-2 border-b border-gray-200">38-40</td>
                          <td className="px-4 py-2 border-b border-gray-200">32-34</td>
                          <td className="px-4 py-2 border-b border-gray-200">40-42</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border-b border-gray-200">L</td>
                          <td className="px-4 py-2 border-b border-gray-200">42-44</td>
                          <td className="px-4 py-2 border-b border-gray-200">36-38</td>
                          <td className="px-4 py-2 border-b border-gray-200">44-46</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border-b border-gray-200">XL</td>
                          <td className="px-4 py-2 border-b border-gray-200">46-48</td>
                          <td className="px-4 py-2 border-b border-gray-200">40-42</td>
                          <td className="px-4 py-2 border-b border-gray-200">48-50</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">XXL</td>
                          <td className="px-4 py-2">50-52</td>
                          <td className="px-4 py-2">44-46</td>
                          <td className="px-4 py-2">52-54</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">How to measure</h4>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Chest: Measure around the fullest part of your chest</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Waist: Measure around your natural waistline</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Hip: Measure around the fullest part of your hips</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-lg">
        <div className="flex gap-3 max-w-md mx-auto">
          {/* View Similar */}

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || getSelectedSizeStock() === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-800 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            ADD TO CART
          </button>

          {/* Buy Now */}
          <button
            onClick={handleBuyNow}
            disabled={isAddingToCart || getSelectedSizeStock() === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <img src="/buynow1.svg" className="w-8 h-8 rounded-lg" />
            BUY NOW
          </button>
        </div>
      </div>
    </div>
  )
}

const StaticDesignSection = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-2 mb-2 py-4 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <img src="/badge.jpeg" className="rounded-xl" />
      </div>
    </div>
  )
}

export default ProductDetailPage
