"use client"
import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"
import { Heart, Minus, Plus, X, Ruler, ShoppingCart, PlayCircle } from "lucide-react"
import { fetchProductById, fetchProductBySlug } from "../store/slices/productSlice"
import { addToCart, optimisticAddToCart } from "../store/slices/cartSlice"
import {
  addToWishlist,
  removeFromWishlist,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist,
} from "../store/slices/wishlistSlice"
import ProductReviews from "../components/ProductReviews"
import RelatedProducts from "../components/RelatedProducts"
import toast from "react-hot-toast"

const ProductDetailPage = () => {
  const { id, slug } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { currentProduct, isLoading, error } = useSelector((state) => state.products)
  const { items: wishlistItems } = useSelector((state) => state.wishlist)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)

  const isInWishlist = wishlistItems.some((item) => item._id === currentProduct?._id)

  // Combined Media List for the Gallery
  const combinedMedia = [
    ...(currentProduct?.images || []).map(img => ({ ...img, type: 'image' })),
    ...(currentProduct?.videos || []).map(vid => ({ ...vid, type: 'video' }))
  ];

  useEffect(() => {
    if (slug) dispatch(fetchProductBySlug(slug))
    else if (id) dispatch(fetchProductById(id))
  }, [dispatch, id, slug])

  useEffect(() => {
    if (currentProduct?.colors?.length > 0) setSelectedColor(currentProduct.colors[0].name)
  }, [currentProduct])

  if (error || !currentProduct) return <div className="min-h-screen bg-gray-50" />

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Breadcrumb */}
      <nav className="hidden sm:block px-6 py-4 text-sm text-gray-500 border-b">
        <div className="max-w-7xl mx-auto flex gap-2">
          <Link to="/" className="hover:text-black">Home</Link> / 
          <Link to="/products" className="hover:text-black">Products</Link> / 
          <span className="text-black font-medium">{currentProduct.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT COLUMN: Image Gallery */}
          <div className="lg:w-[60%] space-y-4">
            {/* Main Media Preview */}
            <div className="relative aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden shadow-inner">
               <AnimatePresence mode="wait">
                <motion.div key={selectedMediaIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">
                  {combinedMedia[selectedMediaIndex]?.type === 'video' ? (
                    <video src={combinedMedia[selectedMediaIndex].url} className="w-full h-full object-cover" controls autoPlay muted />
                  ) : (
                    <img 
                      src={combinedMedia[selectedMediaIndex]?.url} 
                      alt="Product" 
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => setShowImageModal(true)}
                    />
                  )}
                </motion.div>
               </AnimatePresence>
            </div>

            {/* Thumbnails Grid */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {combinedMedia.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMediaIndex(idx)}
                  className={`relative flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition ${selectedMediaIndex === idx ? "border-black shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                       <PlayCircle className="w-8 h-8 text-gray-600" />
                    </div>
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover" alt="thumbnail" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Product Info (Sticky) */}
          <div className="lg:w-[40%]">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Header */}
              <div className="space-y-1">
                <h3 className="text-primary font-bold tracking-widest text-xs uppercase">{currentProduct.brand || "Ksauni Bliss"}</h3>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{currentProduct.name}</h1>
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-3xl font-bold text-gray-900">₹{currentProduct.price.toLocaleString()}</span>
                  {currentProduct.originalPrice > currentProduct.price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">₹{currentProduct.originalPrice.toLocaleString()}</span>
                      <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-sm">
                        {Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Attributes Chips */}
              <div className="flex flex-wrap gap-2 py-2 border-y border-gray-100">
                {['Trending', currentProduct.fits, currentProduct.material].map((tag, i) => tag && (
                  <span key={i} className="px-3 py-1 bg-gray-50 border text-[11px] font-bold uppercase text-gray-600 rounded-full">{tag}</span>
                ))}
              </div>

              {/* Selection Sections */}
              <div className="space-y-6">
                {/* Size Selector */}
                {currentProduct.sizes?.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-gray-900 uppercase">Select Size</span>
                      <button onClick={() => setShowSizeGuide(true)} className="text-xs font-bold text-primary flex items-center gap-1"><Ruler className="w-3 h-3"/> Size Guide</button>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {currentProduct.sizes.map((s) => (
                        <button
                          key={s.size}
                          disabled={s.stock === 0}
                          onClick={() => setSelectedSize(s.size)}
                          className={`py-3 text-sm font-bold rounded-xl border-2 transition ${selectedSize === s.size ? "border-black bg-black text-white" : s.stock === 0 ? "bg-gray-50 text-gray-300 border-gray-100" : "border-gray-200 hover:border-black"}`}
                        >
                          {s.size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <span className="text-sm font-bold text-gray-900 uppercase block mb-3">Quantity</span>
                  <div className="flex items-center w-fit border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 hover:bg-gray-50"><Minus className="w-4 h-4"/></button>
                    <span className="px-6 font-bold">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="p-3 hover:bg-gray-50"><Plus className="w-4 h-4"/></button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => {/* handleAddToCart */}}
                    className="flex-1 flex items-center justify-center gap-2 h-14 font-bold border-2 border-black rounded-2xl hover:bg-gray-50 transition"
                  >
                    <ShoppingCart className="w-5 h-5"/> ADD TO BAG
                  </button>
                  <button 
                    onClick={() => {/* handleBuyNow */}}
                    className="flex-1 flex items-center justify-center gap-2 h-14 font-bold bg-red-600 text-white rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-200"
                  >
                    BUY NOW
                  </button>
                  <button 
                    onClick={() => {/* handleWishlist */}}
                    className={`p-4 rounded-2xl border-2 transition ${isInWishlist ? "bg-red-50 border-red-200 text-red-500" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                  >
                    <Heart className={`w-6 h-6 ${isInWishlist ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Collapsible Info Sections */}
              <div className="pt-6 space-y-4 text-sm">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">Product Details</h4>
                  <pre className={`font-sans whitespace-pre-wrap text-gray-600 leading-relaxed ${showFullDescription ? "" : "line-clamp-4"}`}>
                    {currentProduct.description}
                  </pre>
                  <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-primary font-bold mt-2">
                    {showFullDescription ? "View Less" : "Read Full Details"}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-2xl">
                    <h4 className="font-bold text-gray-900 mb-1">Material & Care</h4>
                    <p className="text-gray-500">{currentProduct.material || "Cotton"}</p>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-2xl">
                    <h4 className="font-bold text-gray-900 mb-1">Fit & Size</h4>
                    <p className="text-gray-500">{currentProduct.fits || "Regular"} Fit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Content */}
        <div className="mt-16 space-y-16">
          <img src="/badge.jpeg" className="w-full rounded-3xl shadow-sm border border-gray-100" />
          <ProductReviews productId={currentProduct._id} />
          <RelatedProducts currentProduct={currentProduct} />
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage