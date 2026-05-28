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
import { Heart, Minus, Plus, X, AlertCircle, Ruler, ShoppingCart, Share2 } from "lucide-react"
import { fetchProductById, fetchProductBySlug } from "../store/slices/productSlice"
import { addToCart, optimisticAddToCart, selectIsAddingToCart } from "../store/slices/cartSlice"
import { addToWishlist, removeFromWishlist, optimisticAddToWishlist, optimisticRemoveFromWishlist, selectIsAddingToWishlist, selectIsRemovingFromWishlist, } from "../store/slices/wishlistSlice"
import ProductReviews from "../components/ProductReviews"
import RelatedProducts from "../components/RelatedProducts"
import toast from "react-hot-toast"
const ProductDetailPage = () => {
  const { slug } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentProduct, isLoading, error } = useSelector((state) => state.products)
  const { items: wishlistItems } = useSelector((state) => state.wishlist)
  const { user } = useSelector((state) => state.auth)
  const isAddingToCart = useSelector(selectIsAddingToCart)
  const isAddingToWishlist = useSelector(selectIsAddingToWishlist)
  const isRemovingFromWishlist = useSelector(selectIsRemovingFromWishlist)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0) // unified index for images+videos
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [thumbsSwiper, setThumbsSwiper] = useState(null)
  const [showBuyNowSizeModal, setShowBuyNowSizeModal] = useState(false)
  const [showAddToCartSizeModal, setShowAddToCartSizeModal] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedColors, setSelectedColors] = useState([])
  const [bulkQuantity, setBulkQuantity] = useState(1)
  const isInWishlist = wishlistItems.some((item) => item._id === currentProduct?._id)
  const isBulkProduct = currentProduct?.isBulkProduct === true
  const piecesPerSet = isBulkProduct
    ? (currentProduct?.sizes?.length || 0) * (currentProduct?.bulkConfig?.piecesPerSize || 1)
    : 0
  const totalColors = isBulkProduct ? currentProduct?.colors?.length || 0 : 0
  const minColors = isBulkProduct ? currentProduct?.bulkConfig?.minColorsToSelect || 1 : 1
  const maxColors = isBulkProduct ? currentProduct?.bulkConfig?.maxColorsToSelect || totalColors : totalColors

  const totalSets = selectedColors.length * bulkQuantity
  const totalPieces = piecesPerSet * totalSets
  const totalPrice = (currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price) * totalSets

  // Build unified media array (images first, then videos)
  const mediaItems = [
    ...(currentProduct?.images?.map(img => ({ type: 'image', url: img?.url, alt: currentProduct.name, id: img._id })) || []),
    ...(currentProduct?.videos?.map(vid => ({ type: 'video', url: vid?.url, alt: currentProduct.name, id: vid._id })) || [])
  ];

  const formatDescription = (description) => {
    if (!description) return "";
    return description
      .replace(/(•\s*)/g, '\n• ')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  // REFERRAL SHARE HANDLER
  const handleReferralShare = () => {
    if (!user) {
      toast.error("Please login to get your referral link")
      return
    }
    const referralLink = `${window.location.origin}/register?ref=${user.myreferralCode}`
    if (navigator.share) {
      navigator.share({
        title: "Check out this product!",
        text: `Buy ${currentProduct.name} using my referral link and get rewards!`,
        url: referralLink,
      }).catch(() => toast.error("Sharing failed"))
    } else {
      navigator.clipboard.writeText(referralLink)
      toast.success("Referral link copied!")
    }
  }

  useEffect(() => {
    if (slug) {
      dispatch(fetchProductBySlug(slug))
    }
  }, [dispatch, slug])

  useEffect(() => {
    setSelectedSize("")
  }, [currentProduct?._id])

  useEffect(() => {
    if (currentProduct && !isBulkProduct) {
      if (currentProduct.colors?.length > 0) setSelectedColor(currentProduct.colors[0].name)
    }
  }, [currentProduct, isBulkProduct])

  useEffect(() => {
    if (isBulkProduct && currentProduct?.colors?.length > 0) {
      const allColors = currentProduct.colors.map(color => color.name);
      setSelectedColors(allColors);
    }
  }, [isBulkProduct, currentProduct?._id]);

  const getDiscountPercentage = () => {
    if (isBulkProduct) {
      const original = currentProduct?.bulkConfig?.originalPricePerSet
      const current = currentProduct?.bulkConfig?.pricePerSet
      if (original && original > current) {
        return Math.round(((original - current) / original) * 100)
      }
      return 0
    }
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
  const handleColorToggle = (colorName) => {
    if (selectedColors.includes(colorName)) {
      setSelectedColors(selectedColors.filter(c => c !== colorName))
    } else {
      if (selectedColors.length >= maxColors) {
        toast.error(`Maximum ${maxColors} colors can be selected`)
        return
      }
      setSelectedColors([...selectedColors, colorName])
    }
  }
  const handleAddToCartClick = () => {
    if (isBulkProduct) {
      setShowBulkModal(true)
      return
    }
    if (currentProduct.sizes?.length > 0 && !selectedSize) {
      setShowAddToCartSizeModal(true)
      return false
    }
    if (currentProduct.colors?.length && !selectedColor) {
      toast.error("Please select a color")
      return false
    }

    const sizeStock = getSelectedSizeStock()
    if (quantity > sizeStock) {
      return toast.error(`Only ${sizeStock} items available in stock`)
    }

    handleAddToCart()
  }

  const handleAddToCart = async () => {
    if (isBulkProduct) {
      if (selectedColors.length < minColors) {
        toast.error(`Please select at least ${minColors} color(s)`)
        return
      }

      const bulkPayload = {
        productId: currentProduct._id,
        isBulkProduct: true,
        selectedColors: selectedColors,
        totalSets: totalSets,
        totalPieces: totalPieces,
        piecesPerSet: piecesPerSet,
        pricePerSet: currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price,
        quantity: totalSets
      }

      dispatch(optimisticAddToCart({
        product: currentProduct,
        isBulkProduct: true,
        selectedColors: selectedColors,
        totalSets: totalSets,
        totalPieces: totalPieces,
        piecesPerSet: piecesPerSet,
        pricePerSet: currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price,
        quantity: totalSets
      }))

      toast.success(`${totalPieces} pieces added to cart!`)

      const bag = document.querySelector("#bag")
      if (bag) bag.style.transform = "scale(1.2)"

      try {
        await dispatch(addToCart(bulkPayload)).unwrap()
        setTimeout(() => { if (bag) bag.style.transform = "scale(1)" }, 200)
        setSelectedColors([])
        setBulkQuantity(1)
        setShowBulkModal(false)
      } catch (err) {
        toast.error(err?.message || "Failed to add to cart")
        setTimeout(() => { if (bag) bag.style.transform = "scale(1)" }, 200)
      }
      return
    }

    const payload = { productId: currentProduct._id, quantity, size: selectedSize, color: selectedColor }
    dispatch(optimisticAddToCart({ product: currentProduct, quantity, size: selectedSize, color: selectedColor }))
    toast.success(`${currentProduct.name} added to cart!`)

    const bag = document.querySelector("#bag")
    if (bag) bag.style.transform = "scale(1.2)"

    try {
      const result = await dispatch(addToCart(payload))
      if (result.type.endsWith("/fulfilled")) {
        setTimeout(() => { if (bag) bag.style.transform = "scale(1)" }, 200)
      } else {
        toast.error(result.payload?.message || "Failed to add to cart")
        setTimeout(() => { if (bag) bag.style.transform = "scale(1)" }, 200)
      }
    } catch (err) {
      toast.error(err?.message || "Failed to add to cart")
      setTimeout(() => { if (bag) bag.style.transform = "scale(1)" }, 200)
    }
  }

  const handleBuyNowClick = () => {
    if (isBulkProduct) {
      if (selectedColors.length < minColors) {
        toast.error(`Please select at least ${minColors} color(s)`)
        return;
      }

      navigate("/checkout", {
        state: {
          buyNow: true,
          isBulkProduct: true,
          buyNowProduct: {
            product: currentProduct,
            quantity: bulkQuantity,
            selectedColors: selectedColors,
            totalSets: selectedColors.length * bulkQuantity,
            totalPieces: piecesPerSet * selectedColors.length * bulkQuantity,
            totalPrice: (currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price) * selectedColors.length * bulkQuantity,
            isBulkProduct: true,
            bulkConfig: currentProduct?.bulkConfig,
            availableSizes: currentProduct?.sizes,
            availableColors: currentProduct?.colors,
            pricePerSet: currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price
          }
        }
      });
      return;
    }

    if (currentProduct.sizes?.length > 0 && !selectedSize) {
      setShowBuyNowSizeModal(true);
      return;
    }

    if (currentProduct.colors?.length && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    const sizeStock = getSelectedSizeStock();
    if (quantity > sizeStock) {
      toast.error(`Only ${sizeStock} items available in stock`);
      return;
    }

    handleProceedToCheckout();
  };

  const handleProceedToCheckout = () => {
    navigate("/checkout", {
      state: {
        product: currentProduct,
        quantity,
        size: selectedSize,
        color: selectedColor,
        buyNow: true,
        buyNowProduct: {
          product: currentProduct,
          quantity,
          size: selectedSize,
          color: selectedColor,
          price: currentProduct.price,
          originalPrice: currentProduct.originalPrice,
          images: currentProduct.images,
          name: currentProduct.name,
          brand: currentProduct.brand
        }
      },
    })
    setShowBuyNowSizeModal(false)
  }

  const handleProceedToAddToCart = () => {
    handleAddToCart()
    setShowAddToCartSizeModal(false)
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
      if (wish) wish.style.transform = "scale(1.2)"
      setTimeout(() => { if (wish) wish.style.transform = "scale(1)" }, 200)
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error(err?.message || "Failed to update wishlist")
      }
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

  const tagText =
    (Array.isArray(currentProduct?.tags) && currentProduct.tags[0]) ||
    (currentProduct?.isTrending && "TRENDING") ||
    (currentProduct?.isNewArrival && "NEW ARRIVAL") ||
    (currentProduct?.isFeatured && "FEATURED") ||
    "DESIGN OF THE WEEK"

  const fitText = typeof currentProduct?.fits === "string"
    ? `${currentProduct.fits} FIT`
    : currentProduct?.fits ? `${String(currentProduct.fits)} FIT` : "REGULAR FIT"

  const materialText = typeof currentProduct?.material === "string"
    ? currentProduct.material
    : currentProduct?.material ? String(currentProduct.material) : "COTTON"

  if (error || !currentProduct) {
    return (
      <div className="text-center">
        {/* <Preloader/> */}
      </div>
    )
  }

  // Bulk product price display
  const displayPrice = isBulkProduct
    ? (currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price)
    : currentProduct?.price

  const displayOriginalPrice = isBulkProduct
    ? currentProduct?.bulkConfig?.originalPricePerSet
    : currentProduct?.originalPrice

  return (
    <div className="min-h-screen bg-gray-50 pb-24 sm:pb-0">
      {/* Desktop Breadcrumb - Hidden on mobile */}
      <div className="hidden sm:block bg-white py-5 shadow-sm">
        <div className="mx-auto px-2 sm:px-6">
          <nav className="flex items-center text-sm text-gray-600 space-x-2 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary">Products</Link>
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
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-4">

          {/* LEFT COLUMN - IMAGES+VIDEOS (MOBILE SWIPER) */}
          <div className="lg:hidden relative -mx-4 rounded-xl">
            <button
              onClick={handleWishlistToggle}
              disabled={isAddingToWishlist || isRemovingFromWishlist}
              className={`absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md ${isInWishlist ? "text-primary" : "text-gray-600"}`}
            >
              <Heart id="wish" className={`w-5 h-5 ${isInWishlist ? "fill-current" : ""}`} />
            </button>
            {user && (
              <button
                onClick={handleReferralShare}
                className="absolute top-3 right-12 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
            )}
            <Swiper spaceBetween={0} pagination={{ clickable: true, dynamicBullets: true }} modules={[Pagination]} className="rounded-xl">
              {mediaItems.map((item, idx) => (
                <SwiperSlide key={idx}>
                  <div className="relative">
                    {item.type === 'image' ? (
                      <img
                        src={item?.url}
                        alt={item.alt}
                        className="w-full h-auto aspect-square object-cover -mb-8"
                        loading="lazy"
                        onClick={() => { setSelectedMediaIndex(idx); setShowImageModal(true); }}
                      />
                    ) : (
                      <video
                        src={item?.url}
                        controls
                        className="w-full h-auto aspect-square object-cover -mb-8"
                        poster={currentProduct.images?.[0]?.url || ''}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="px-5">
              <p className="text-lg font-bold text-gray-900">{currentProduct.brand || "Factory Sale"}</p>
              <p className="text-sm text-gray-600 mt-1">{currentProduct.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-bold text-gray-900">₹{displayPrice?.toLocaleString()}</span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <span className="text-lg text-gray-500 line-through">₹{displayOriginalPrice?.toLocaleString()}</span>
                )}
                {getDiscountPercentage() > 0 && (
                  <span className="text-sm font-medium text-green-600">{getDiscountPercentage()}% OFF</span>
                )}
                {isBulkProduct && <span className="text-sm text-gray-500">/set</span>}
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="flex gap-4">
              {/* Vertical Thumbnails */}
              <div className="flex flex-col gap-2 w-20">
                {mediaItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedMediaIndex(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${selectedMediaIndex === idx ? "border-primary ring-2 ring-primary/30" : "border-gray-200 hover:border-gray-400"}`}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item?.url}
                        alt={`${item.alt} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                        <video
                          src={item?.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex-1">
                <div className="relative bg-gray-50 rounded-xl overflow-hidden group">
                  {user && (
                    <button
                      onClick={handleReferralShare}
                      className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition"
                    >
                      <Share2 className="w-5 h-5 text-gray-700" />
                    </button>
                  )}
                  {mediaItems[selectedMediaIndex]?.type === 'image' ? (
                    <motion.img
                      src={mediaItems[selectedMediaIndex]?.url}
                      alt={currentProduct.name}
                      className="w-full h-auto max-w-full object-contain cursor-zoom-in"
                      onClick={() => setShowImageModal(true)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={mediaItems[selectedMediaIndex]?.url}
                      controls
                      className="w-full h-auto max-w-full object-contain"
                      poster={currentProduct.images?.[0]?.url || ''}
                      autoPlay={false}
                    />
                  )}
                  {getSelectedSizeStock() === 0 && !isBulkProduct && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <span className="bg-white text-gray-800 px-4 py-2 rounded-full font-medium">Out of Stock</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:hidden space-y-4 px-2 mt-24">
            <div>
              <div className={`text-gray-600 text-sm leading-relaxed ${showFullDescription ? "" : "line-clamp-3"}`}>
                <pre className="font-sans whitespace-pre-wrap">{formatDescription(currentProduct?.description)}</pre>
              </div>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-primary text-sm font-medium mt-1"
              >
                {showFullDescription ? "Show Less" : "Read More"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-12">
              <div className="grid grid-cols-3 gap-2">
                <div className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-2 rounded-xl bg-amber-50 text-gray-900 border border-amber-100">
                  {String(tagText).replace(/-/g, " ")}
                </div>
                <div className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-2 rounded-xl bg-gray-100 text-gray-800">
                  {String(fitText).replace(/-/g, " ")}
                </div>
                <div className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-2 rounded-xl bg-white text-gray-800 border border-gray-400">
                  {String(materialText).replace(/-/g, " ")}
                </div>
              </div>
            </div>
            {!isBulkProduct ? (
              currentProduct.colors?.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Color: <span className="font-normal">{selectedColor}</span></h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border ${selectedColor === color.name ? "border-primary bg-primary/5" : "border-gray-200"}`}
                      >
                        <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: color.hex || color.name.toLowerCase() }} />
                        <span className="text-sm">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              totalColors > 0 && (
                <div className="pt-2">
                  <h3 className="text-base font-semibold text-gray-800 mb-3">
                    Select Colors <span className="text-sm text-gray-500 font-normal">(Min {minColors} | Max {maxColors})</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleColorToggle(color.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border ${selectedColors.includes(color.name) ? "border-primary bg-primary/5" : "border-gray-200"}`}
                      >
                        <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: color.hex || color.name.toLowerCase() }} />
                        <span className="text-sm">{color.name}</span>
                      </button>
                    ))}
                  </div>
                  {selectedColors.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Selected: {selectedColors.join(", ")}</p>
                  )}
                </div>
              )
            )}
            {!isBulkProduct ? (
              currentProduct.sizes?.length > 0 && (
                <div data-size-section>
                  <div className="flex items-center justify-between mb-3 pt-1">
                    <h3 className="text-base font-semibold text-gray-800">Size: <span className={`font-normal ${!selectedSize ? "text-red-500" : ""}`}>{selectedSize || "Please select"}</span></h3>
                    <button onClick={() => setShowSizeGuide(true)} className="text-sm rounded-xl font-medium text-primary flex items-center">
                      <Ruler className="w-4 h-4 mr-1" /> Size Guide
                    </button>
                  </div>
                  {!selectedSize && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-600 font-medium">⚠️ Please select a size to continue</p>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {currentProduct.sizes.map((s) => (
                      <button
                        key={s.size}
                        onClick={() => setSelectedSize(s.size)}
                        disabled={s.stock === 0}
                        className={`px-3 py-3 rounded-xl border font-medium text-sm ${selectedSize === s.size ? "border-primary bg-primary/10 text-primary" : s.stock === 0 ? "border-gray-200 bg-gray-100 text-gray-400" : "border-gray-300 hover:border-primary"}`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm py-3 mb-3 font-medium text-gray-600 block">
                    {selectedSize ? `${getSelectedSizeStock()} available in ${selectedSize}` : "Select a size to see availability"}
                  </span>
                </div>
              )
            ) : (
              currentProduct.sizes?.length > 0 && (
                <div data-size-section>
                  <div className="flex items-center justify-between mb-3 pt-1">
                    <h3 className="text-base font-semibold text-gray-800">Sizes Included:</h3>
                    <button onClick={() => setShowSizeGuide(true)} className="text-sm rounded-xl font-medium text-primary flex items-center">
                      <Ruler className="w-4 h-4 mr-1" /> Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {currentProduct.sizes.map((s) => (
                      <div key={s.size} className="px-3 py-3 rounded-xl border border-gray-300 bg-gray-50 text-center font-medium text-sm">
                        {s.size}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">✓ You will get {currentProduct.bulkConfig?.piecesPerSize || 1} piece(s) of each size per set</p>
                </div>
              )
            )}
            {!isBulkProduct ? (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="p-3 hover:bg-gray-50 text-gray-600">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-medium border-x border-gray-300 min-w-[60px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(getSelectedSizeStock(), quantity + 1))} disabled={quantity >= getSelectedSizeStock()} className="p-3 hover:bg-gray-50 text-gray-600">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">{getSelectedSizeStock()} in stock</span>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Quantity (Sets)</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <button onClick={() => setBulkQuantity(Math.max(1, bulkQuantity - 1))} disabled={bulkQuantity <= 1} className="p-3 hover:bg-gray-50 text-gray-600">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-medium border-x border-gray-300 min-w-[60px] text-center">{bulkQuantity}</span>
                    <button onClick={() => setBulkQuantity(Math.min(10, bulkQuantity + 1))} disabled={bulkQuantity >= 10} className="p-3 hover:bg-gray-50 text-gray-600">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">Max 10 sets</span>
                </div>
              </div>
            )}

            {/* Product Details - Mobile */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Product Details</h3>
              {currentProduct.material && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-700 mb-1">Material & Care</h4>
                  <p className="text-gray-600 text-sm">{currentProduct.material}</p>
                </div>
              )}
              {currentProduct.fits && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-700 mb-1">Fit</h4>
                  <p className="text-gray-600 text-sm">{currentProduct.fits} Fit</p>
                </div>
              )}
              {currentProduct.care && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Care Instructions</h4>
                  <p className="text-gray-600 text-sm">{currentProduct.care}</p>
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP RIGHT COLUMN */}
          <div className="hidden lg:block space-y-1">
            <div className="flex items-start justify-between">
              <div className="hidden lg:block mb-1">
                <p className="text-lg font-semibold text-gray-900"><span>{currentProduct.brand || "Factory Sale"}</span></p>
                {currentProduct.name && (
                  <p className="text-base text-gray-600 mb-5">{typeof currentProduct.name === "string" ? currentProduct.name : JSON.stringify(currentProduct.name)}</p>
                )}
                <span className="text-3xl font-bold text-gray-900">₹{displayPrice?.toLocaleString()}</span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <span className="text-xl text-gray-500 line-through ml-3">₹{displayOriginalPrice?.toLocaleString()}</span>
                )}
                {getDiscountPercentage() > 0 && (
                  <span className="ml-3 text-base font-medium text-green-600">{getDiscountPercentage()}% OFF</span>
                )}
                {isBulkProduct && <span className="ml-2 text-sm text-gray-500">/ set</span>}
              </div>
            </div>

            <div className="lg:hidden">
              <span className="font-semibold mt-5">Product Description</span>
              <div className={`text-sm text-gray-700 leading-relaxed ${showFullDescription ? "" : "line-clamp-6"}`}>
                <pre className="font-sans whitespace-pre-wrap">{formatDescription(currentProduct?.description)}</pre>
              </div>
              <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-red-500 text-xs font-semibold mt-5">
                {showFullDescription ? "Show Less" : "Read More"}
              </button>
            </div>

            <div className="lg:hidden -mt-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-2 rounded-xl bg-amber-50 text-gray-900 border border-amber-100">
                  {String(tagText).replace(/-/g, " ")}
                </div>
                <div className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-2 rounded-xl bg-gray-100 text-gray-800">
                  {String(fitText).replace(/-/g, " ")}
                </div>
                <div className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-2 rounded-xl bg-white text-gray-800 border border-gray-400">
                  {String(materialText).replace(/-/g, " ")}
                </div>
              </div>
            </div>

            {/* Colors - Desktop */}
            {!isBulkProduct ? (
              currentProduct.colors?.length > 0 && (
                <div className="pt-3">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Color: <span className="font-normal">{selectedColor}</span></h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors.map((color) => (
                      <motion.button
                        key={color.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedColor(color.name)}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${selectedColor === color.name ? "border-primary shadow-md" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: color.hex || color.name.toLowerCase() }} />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              totalColors > 0 && (
                <div className="pt-3">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Colors <span className="text-sm text-gray-500 font-normal">(Min {minColors} | Max {maxColors})</span></h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors.map((color) => (
                      <motion.button
                        key={color.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleColorToggle(color.name)}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${selectedColors.includes(color.name) ? "border-primary shadow-md" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: color.hex || color.name.toLowerCase() }} />
                      </motion.button>
                    ))}
                  </div>
                  {selectedColors.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">Selected: {selectedColors.join(", ")}</p>
                  )}
                </div>
              )
            )}

            {/* Sizes - Desktop */}
            {!isBulkProduct ? (
              currentProduct.sizes?.length > 0 && (
                <div data-size-section>
                  <div className="flex items-center justify-between mb-3 pt-1">
                    <h3 className="text-lg font-semibold text-gray-800">Size: <span className={`font-normal rounded-sm ${!selectedSize ? "text-red-500" : ""}`}>{selectedSize || "Please select a size"}</span></h3>
                    <button onClick={() => setShowSizeGuide(true)} className="text-sm font-medium text-primary hover:text-primary-dark flex items-center">
                      <Ruler className="w-4 h-4 mr-1" /> Size Guide
                    </button>
                  </div>
                  {!selectedSize && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">⚠️ Please select a size to continue</p>
                    </div>
                  )}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 border border-gray-200 rounded-xl">
                    {currentProduct.sizes.map((s) => (
                      <motion.button
                        key={s.size}
                        onClick={() => setSelectedSize(s.size)}
                        disabled={s.stock === 0}
                        className={`px-4 py-2 border border-gray-300 rounded-xl font-medium text-sm ${selectedSize === s.size ? "border-primary rounded bg-primary/10 text-primary" : s.stock === 0 ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 hover:border-primary hover:text-primary"}`}
                      >
                        {s.size}
                      </motion.button>
                    ))}
                  </div>
                  <span className="text-sm py-3 mb-3 mx-2 font-semibold text-gray-600">
                    {selectedSize ? `${getSelectedSizeStock()} available in ${selectedSize}` : "Please select a size to see availability"}
                  </span>
                </div>
              )
            ) : (
              currentProduct.sizes?.length > 0 && (
                <div data-size-section>
                  <div className="flex items-center justify-between mb-3 pt-1">
                    <h3 className="text-lg font-semibold text-gray-800">Sizes Included:</h3>
                    <button onClick={() => setShowSizeGuide(true)} className="text-sm font-medium text-primary hover:text-primary-dark flex items-center">
                      <Ruler className="w-4 h-4 mr-1" /> Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 border border-gray-200 rounded-xl">
                    {currentProduct.sizes.map((s) => (
                      <div key={s.size} className="px-4 py-2 border border-gray-300 rounded-xl font-medium text-sm bg-gray-50 text-center">
                        {s.size}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">✓ You will get {currentProduct.bulkConfig?.piecesPerSize || 1} piece(s) of each size per set</p>
                </div>
              )
            )}

            {/* Quantity - Desktop */}
            {!isBulkProduct ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-50 text-gray-600" disabled={quantity <= 1}>
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <span className="px-4 py-2 font-medium border-x border-gray-300">{quantity}</span>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setQuantity(Math.min(getSelectedSizeStock(), quantity + 1))} disabled={quantity >= getSelectedSizeStock()} className="p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quantity (Sets)</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setBulkQuantity(Math.max(1, bulkQuantity - 1))} className="p-2 hover:bg-gray-50 text-gray-600" disabled={bulkQuantity <= 1}>
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <span className="px-4 py-2 font-medium border-x border-gray-300">{bulkQuantity}</span>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setBulkQuantity(Math.min(10, bulkQuantity + 1))} disabled={bulkQuantity >= 10} className="p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 md:hidden">
              {currentProduct.productDetails && (
                <div className="pt-1">
                  <h2 className="text-md font-bold text-gray-700 mb-1">Product Details</h2>
                  <p className="text-gray-600 whitespace-pre-line">{typeof currentProduct.productDetails === "string" ? currentProduct.productDetails : JSON.stringify(currentProduct.productDetails)}</p>
                </div>
              )}
            </div>

            <div className="mt-4 hidden md:block">
              <span className="font-semibold">Product Description</span>
              <div className={`text-md text-gray-700 leading-relaxed ${showFullDescription ? "" : "line-clamp-6"}`}>
                <pre className="font-sans whitespace-pre-wrap">{formatDescription(currentProduct?.description)}</pre>
              </div>
              <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-red-500 text-xs font-semibold mt-1">
                {showFullDescription ? "Show Less" : "Read More"}
              </button>
            </div>

            {/* Product Details Section - Desktop */}
            <div className="pt-1">
              {currentProduct.material && (
                <div>
                  <h2 className="text-md font-bold text-gray-700 mb-1">Material & Care</h2>
                  <p className="text-gray-600 whitespace-pre-line">{typeof currentProduct.material === "string" ? currentProduct.material : JSON.stringify(currentProduct.material)}</p>
                </div>
              )}
              {currentProduct.fits && (
                <div>
                  <h2 className="text-md font-bold text-gray-700 mb-1">Model Size and Fits</h2>
                  <p className="text-gray-600 whitespace-pre-line">{typeof currentProduct.fits === "string" ? `${currentProduct.fits} Fit` : `${JSON.stringify(currentProduct.fits)} Fit`}</p>
                </div>
              )}
              {currentProduct.care && (
                <div>
                  <h2 className="text-md font-bold text-gray-700 mb-1">Care Instructions</h2>
                  <p className="text-gray-600">{typeof currentProduct.care === "string" ? currentProduct.care : JSON.stringify(currentProduct.care)}</p>
                </div>
              )}
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden lg:block pt-4 border-t border-gray-200">
              <div className="flex gap-3 max-w-md">
                <button
                  onClick={handleAddToCartClick}
                  disabled={isAddingToCart || (!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) || (isBulkProduct && selectedColors.length < minColors)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-1 border-2 font-semibold rounded-xl transition-colors disabled:cursor-not-allowed ${((!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) || (isBulkProduct && selectedColors.length < minColors))
                    ? "bg-gray-100 border-gray-300 text-gray-400"
                    : "bg-white border-gray-300 text-gray-800 hover:border-gray-400 hover:bg-gray-50"
                    } ${isAddingToCart ? "opacity-50" : ""}`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  ADD TO CART
                </button>
                <button
                  onClick={handleBuyNowClick}
                  disabled={isAddingToCart || (!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) || (isBulkProduct && selectedColors.length < minColors)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-1 font-semibold rounded-xl transition-colors disabled:cursor-not-allowed ${((!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) || (isBulkProduct && selectedColors.length < minColors))
                    ? "bg-gray-400 text-gray-200"
                    : "bg-red-600 text-white hover:bg-red-700"
                    } ${isAddingToCart ? "opacity-50" : ""}`}
                >
                  <img src="/buynow1.svg" className="w-8 h-8" />
                  BUY NOW
                </button>
              </div>
              <div className="mt-4">
                {currentProduct.productDetails && (
                  <div className="pt-1">
                    <h2 className="text-md font-bold text-gray-700 mb-1">Product Details</h2>
                    <p className="text-gray-600 whitespace-pre-line">{typeof currentProduct.productDetails === "string" ? currentProduct.productDetails : JSON.stringify(currentProduct.productDetails)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Static Design Section */}
        <div className="px-4 mt-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 px-4">
            <img src="/badge.jpeg" className="w-full h-auto rounded-xl" />
          </div>
        </div>

        {/* Reviews & Related Products */}
        <div id="reviews" className="border-t border-gray-200 rounded-xl px-4 py-6 mt-6 bg-white">
          <ProductReviews productId={currentProduct._id} />
        </div>
        <div className="border-t rounded-xl px-4 py-6 mt-6 bg-white">
          <RelatedProducts currentProduct={currentProduct} />
        </div>
      </div>

      {/* All Modals - unchanged except closures and function names updated */}

      {/* Bulk Modal */}
      {/* All Modals */}
      <AnimatePresence>
        {showBulkModal && isBulkProduct && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBulkModal(false)}
          >
            <motion.div
              className="relative bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Select Colors</h3>
                  <button onClick={() => setShowBulkModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex items-center space-x-3 mb-4">
                  <img src={currentProduct.images[0]?.url || "/placeholder.svg"} alt={currentProduct.name} className="w-14 h-14 object-cover rounded-lg" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{currentProduct.name}</h4>
                    <p className="text-lg font-bold text-gray-900">₹{displayPrice?.toLocaleString()}/set</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">Sizes: {currentProduct.sizes?.map(s => s.size).join(", ")}</p>
                  <p className="text-xs text-gray-500">You will get {currentProduct.bulkConfig?.piecesPerSize || 1} piece(s) of each size per set</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium mb-3">Select Colors (Min {minColors}, Max {maxColors})</p>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors?.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleColorToggle(color.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${selectedColors.includes(color.name) ? "border-red-500 bg-red-50 text-red-600" : "border-gray-200"}`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-sm font-medium mb-3">Quantity (Sets)</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setBulkQuantity(Math.max(1, bulkQuantity - 1))} className="p-1 border rounded-lg px-2">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-medium w-8 text-center">{bulkQuantity}</span>
                    <button onClick={() => setBulkQuantity(Math.min(10, bulkQuantity + 1))} className="p-1 border rounded-lg px-2">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Pieces:</span>
                    <span className="font-medium">{totalPieces} pcs</span></div>
                  <div className="flex justify-between mb-4">
                    <span className="text-sm text-gray-600">Total Price:</span>
                    <span className="text-xl font-bold text-red-600">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={selectedColors.length < minColors}
                    className={`w-full py-2 rounded-lg font-medium ${selectedColors.length < minColors ? "bg-gray-300 cursor-not-allowed" : "bg-red-600 text-white"}`}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
      {/* Buy Now Size Modal */}
      <AnimatePresence>
        {showBuyNowSizeModal && !isBulkProduct && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBuyNowSizeModal(false)}>
            <motion.div
              className="relative bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Select Size</h3>
                  <button onClick={() => setShowBuyNowSizeModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <img src={currentProduct.images[0]?.url || "/placeholder.svg"} alt={currentProduct.name} className="w-14 h-14 object-cover rounded-lg" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{currentProduct.name}</h4>
                    <p className="text-lg font-bold text-gray-900">₹{currentProduct.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-800">Select Size</h4>
                    <button onClick={() => { setShowBuyNowSizeModal(false); setShowSizeGuide(true) }} className="text-sm font-medium text-primary flex items-center">
                      <Ruler className="w-4 h-4 mr-1" /> Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {currentProduct.sizes.map((s) => (
                      <button
                        key={s.size}
                        onClick={() => setSelectedSize(s.size)}
                        disabled={s.stock === 0}
                        className={`px-3 py-3 border rounded-lg font-medium text-sm ${selectedSize === s.size ? "border-red-500 bg-red-50 text-red-600" : s.stock === 0 ? "border-gray-200 bg-gray-100 text-gray-400" : "border-gray-300 hover:border-red-400"}`}>
                        {s.size}
                      </button>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{selectedSize ? `Selected: ${selectedSize} - ${getSelectedSizeStock()} available` : "Please select a size"}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowBuyNowSizeModal(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg">Cancel</button>
                  <button onClick={handleProceedToCheckout} disabled={!selectedSize} className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white disabled:bg-gray-400">Buy Now</button>
                </div>
              </div>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
      <AnimatePresence>
        {showAddToCartSizeModal && !isBulkProduct && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddToCartSizeModal(false)}>
            <motion.div
              className="relative bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Select Size</h3>
                  <button onClick={() => setShowAddToCartSizeModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <img src={currentProduct.images[0]?.url || "/placeholder.svg"} alt={currentProduct.name} className="w-14 h-14 object-cover rounded-lg" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{currentProduct.name}</h4>
                    <p className="text-lg font-bold text-gray-900">₹{currentProduct.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-800">Select Size</h4>
                    <button onClick={() => { setShowAddToCartSizeModal(false); setShowSizeGuide(true) }} className="text-sm font-medium text-primary flex items-center">
                      <Ruler className="w-4 h-4 mr-1" /> Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {currentProduct.sizes.map((s) => (
                      <button
                        key={s.size}
                        onClick={() => setSelectedSize(s.size)}
                        disabled={s.stock === 0}
                        className={`px-3 py-3 border rounded-lg font-medium text-sm ${selectedSize === s.size ? "border-red-500 bg-red-50 text-red-600" : s.stock === 0 ? "border-gray-200 bg-gray-100 text-gray-400" : "border-gray-300 hover:border-red-400"}`}>
                        {s.size}
                      </button>))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{selectedSize ? `Selected: ${selectedSize} - ${getSelectedSizeStock()} available` : "Please select a size"}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddToCartSizeModal(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg">Cancel</button>
                  <button onClick={handleProceedToAddToCart} disabled={!selectedSize} className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white disabled:bg-gray-400">Add to Cart</button>
                </div>
              </div>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
      <AnimatePresence>
        {showImageModal && mediaItems[selectedMediaIndex]?.type === 'image' && (
          <motion.div
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}>
            <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 p-2 text-white bg-black/50 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <img src={mediaItems[selectedMediaIndex]?.url} alt={currentProduct.name} className="w-full h-auto max-h-screen object-contain" />
            </div>
          </motion.div>)}
      </AnimatePresence>
      <AnimatePresence>
<<<<<<< HEAD
        {showSizeGuide && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSizeGuide(false)}>
            <motion.div
              className="relative bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Size Guide</h3>
                  <button onClick={() => setShowSizeGuide(false)} className="p-2 rounded-full hover:bg-gray-100">
                    <X className="w-6 h-6 text-gray-700" />
                  </button>
                </div>
                <img src="/6.webp" alt="Size Guide" className="w-full h-auto rounded-lg" />
              </div>
            </motion.div>
          </motion.div>
        )}
=======
       {showSizeGuide && (
  <motion.div
    className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowSizeGuide(false)}
  >
    <motion.div
      className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Better Header with Zoom Hint */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10">
        <div>
          <h3 className="text-lg font-bold text-gray-900">📏 Size Measurement Guide</h3>
          <p className="text-xs text-gray-500 mt-0.5">Pinch to zoom | Click to enlarge</p>
        </div>
        <button 
          onClick={() => setShowSizeGuide(false)} 
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* Scrollable Image Container with Zoom */}
      <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
        <div className="relative group">
          <img 
            src="/6.webp" 
            alt="Size Guide - Measurement Chart" 
            className="w-full h-auto rounded-lg cursor-zoom-in transition-transform duration-200 hover:scale-[1.02]"
            onClick={(e) => {
              // Open fullscreen image on click
              const modal = document.createElement('div');
              modal.className = 'fixed inset-0 bg-black z-[60] flex items-center justify-center p-4 cursor-pointer';
              modal.onclick = () => modal.remove();
              const img = document.createElement('img');
              img.src = '/6.webp';
              img.className = 'max-w-full max-h-full object-contain';
              modal.appendChild(img);
              document.body.appendChild(modal);
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/800x1000/f8f9fa/6c757d?text=Size+Guide+Image+Not+Found";
            }}
          />
          
          {/* Zoom Hint Overlay */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span>Click to enlarge</span>
          </div>
        </div>
        
        {/* Additional Info Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">
            * Measurements are in inches. For best fit, please refer to this guide before ordering.
          </p>
        </div>
      </div>
    </motion.div>
  </motion.div>
)}
>>>>>>> a1f24f3011d30cc9043db051ea270d48fe834d02
      </AnimatePresence>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-lg">
        <div className="flex gap-3">
          <button onClick={handleAddToCartClick}
            disabled={isAddingToCart || (!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) || (isBulkProduct && selectedColors.length < minColors)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm ${((!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) || (isBulkProduct && selectedColors.length < minColors))
              ? "bg-gray-100 text-gray-400" : "bg-white border border-gray-300 text-gray-800"}`}>
            <ShoppingCart className="w-5 h-5" />
            ADD TO CART
          </button>
          <button
            onClick={handleBuyNowClick}
            disabled={isAddingToCart || (!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) || (isBulkProduct && selectedColors.length < minColors)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm ${((!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) || (isBulkProduct && selectedColors.length < minColors))
              ? "bg-gray-400 text-gray-200"
              : "bg-red-600 text-white"}`}>
            <img src="/buynow1.svg" className="w-6 h-6" />
            BUY NOW
          </button>
        </div>
      </div>
<<<<<<< HEAD
    </div>
  );
}
=======
    </div>)}
>>>>>>> a1f24f3011d30cc9043db051ea270d48fe834d02
export default ProductDetailPage