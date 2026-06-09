"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingBag, Plus, Minus, Trash2, Heart, ArrowLeft,
  Truck, RotateCcw, ShoppingCart, Package, Gift, Sparkles, ShieldCheck,
} from "lucide-react"
import {
  fetchCart, updateCartItem, removeFromCart, clearCart,
  optimisticUpdateQuantity, optimisticRemoveFromCart,
} from "../store/slices/cartSlice"
import { addToWishlist, optimisticAddToWishlist } from "../store/slices/wishlistSlice"
import toast from "react-hot-toast"

// ✅ Helper function to get product image (supports new schema)
const getProductImage = (product, colorName = null) => {
  if (!product) return "/placeholder.svg"
  
  // If color is specified, try to get that color's image
  if (colorName && product.colors && product.colors.length > 0) {
    const colorObj = product.colors.find(c => c.name === colorName)
    if (colorObj && colorObj.images && colorObj.images.length > 0) {
      return colorObj.images[0].url || colorObj.images[0]
    }
  }
  
  // Check commonImages (new schema)
  if (product.commonImages && product.commonImages.length > 0) {
    return product.commonImages[0].url || product.commonImages[0]
  }
  
  // Check first color's images
  if (product.colors && product.colors.length > 0) {
    const firstColor = product.colors[0]
    if (firstColor.images && firstColor.images.length > 0) {
      return firstColor.images[0].url || firstColor.images[0]
    }
  }
  
  // Fallback to old images array (if exists)
  if (product.images && product.images.length > 0) {
    return product.images[0].url || product.images[0]
  }
  
  return "/placeholder.svg"
}

// ✅ Helper function to get color name from cart item
const getColorName = (item) => {
  if (item.color) {
    if (typeof item.color === 'object') return item.color.name || item.color
    return item.color
  }
  if (item.selectedColor) return item.selectedColor
  return null
}

// ✅ Helper function to get size from cart item
const getSizeName = (item) => {
  if (item.size) return item.size
  if (item.selectedSize) return item.selectedSize
  return null
}

const CartPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, summary, isLoading, error } = useSelector((state) => state.cart)
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { items: wishlistItems } = useSelector((state) => state.wishlist)
  const [updatingItems, setUpdatingItems] = useState(new Set())

  useEffect(() => {
    localStorage.removeItem('buyNowProduct')
    localStorage.removeItem('isBuyNow')
  }, [])

  useEffect(() => {
    if (user) dispatch(fetchCart())
  }, [user, dispatch])

  const handleQuantityChange = async (itemId, newQuantity, isBulk = false, totalSets = null) => {
    if (isBulk) {
      if (totalSets < 1 || totalSets > 10) return
      dispatch(optimisticUpdateQuantity({ itemId, totalSets }))
    } else {
      if (newQuantity < 1 || newQuantity > 10) return
      dispatch(optimisticUpdateQuantity({ itemId, quantity: newQuantity }))
    }
    setUpdatingItems((prev) => new Set(prev).add(itemId))
    try {
      const updateData = isBulk ? { totalSets } : { quantity: newQuantity }
      await dispatch(updateCartItem({ itemId, data: updateData })).unwrap()
    } catch (error) {
      toast.error(error?.message || "Failed to update quantity")
      dispatch(fetchCart())
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev); newSet.delete(itemId); return newSet
      })
    }
  }

  const handleRemoveItem = async (itemId, productName) => {
    try {
      dispatch(optimisticRemoveFromCart(itemId))
      toast.success(`${productName} removed from cart`)
      await dispatch(removeFromCart(itemId)).unwrap()
    } catch (error) {
      toast.error(error?.message || "Failed to remove from cart")
    }
  }

  const handleMoveToWishlist = async (item) => {
    try {
      dispatch(optimisticAddToWishlist(item.product))
      dispatch(optimisticRemoveFromCart(item._id))
      toast.success(`${item.product.name} moved to wishlist`)
      await dispatch(addToWishlist(item.product._id)).unwrap()
      await dispatch(removeFromCart(item._id)).unwrap()
    } catch (error) {
      toast.error(error?.message || "Failed to move to wishlist")
    }
  }

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        await dispatch(clearCart()).unwrap()
        toast.success("Cart cleared successfully")
      } catch (error) {
        toast.error(error?.message || "Failed to clear cart")
      }
    }
  }

  const isInWishlist = (productId) => wishlistItems.some((item) => item._id === productId)

  const shippingCost = summary.subtotal >= 399 ? 0 : 99
  const totalAmount = summary.subtotal + shippingCost

  const getDisplayPrice = (item) => item.isBulkProduct
    ? (item.pricePerSet || item.product?.bulkConfig?.pricePerSet || item.product?.price)
    : (item.product?.price || 0)
    
  const getOriginalPrice = (item) => item.isBulkProduct
    ? item.product?.bulkConfig?.originalPricePerSet
    : item.product?.originalPrice
    
  const getDiscountPercent = (item) => {
    const p = getDisplayPrice(item), o = getOriginalPrice(item)
    return o && o > p ? Math.round(((o - p) / o) * 100) : 0
  }
  
  const getQuantityDisplay = (item) => item.isBulkProduct
    ? (item.totalSets || item.quantity || 1) : (item.quantity || 1)
    
  const getItemTotal = (item) => item.isBulkProduct
    ? getDisplayPrice(item) * getQuantityDisplay(item)
    : (item.product?.price || 0) * (item.quantity || 1)

  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf7] pt-28 pb-20">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="h-10 w-56 bg-neutral-200 rounded-full animate-pulse mb-8" />
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-white rounded-3xl ring-1 ring-neutral-200/70 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#fafaf7] pt-6 md:pt-12 pb-28 md:pb-16 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-red-200/40 via-rose-100/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 w-[26rem] h-[26rem] rounded-full bg-gradient-to-tr from-amber-100/30 to-transparent blur-3xl" />

      <div className="relative container px-4 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="flex items-start gap-4">
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="mt-2 p-2.5 rounded-full bg-white ring-1 ring-neutral-200 shadow-sm hover:ring-red-200 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-700" />
            </motion.button>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-red-700/80 font-semibold mb-2">
                <Sparkles className="w-3 h-3" /> Your Selection
              </span>
              <h1 className="font-serif text-4xl md:text-5xl font-semibold text-neutral-900 leading-none">
                Shopping <span className="italic text-red-700">Bag</span>
              </h1>
              <p className="text-sm text-neutral-500 mt-2">
                {summary.totalItems} {summary.totalItems === 1 ? "piece" : "pieces"} curated for you
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <motion.button
              onClick={handleClearCart}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
              className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-sm font-medium text-red-700 ring-1 ring-red-100 hover:ring-red-300 hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" /> Clear bag
            </motion.button>
          )}
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative max-w-md mx-auto text-center bg-white rounded-3xl ring-1 ring-neutral-200/80 shadow-xl p-10 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-rose-100/60 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-100/60 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-700 to-rose-900 shadow-lg shadow-red-900/20">
                <ShoppingCart className="w-9 h-9 text-white" />
              </div>
              <h2 className="font-serif text-3xl text-neutral-900 mb-2">Your bag awaits</h2>
              <p className="text-neutral-500 mb-7">Discover pieces worth keeping. Start exploring the collection.</p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-red-700 text-white font-medium shadow-lg shadow-red-900/20 hover:bg-red-800 hover:shadow-xl active:scale-[0.98] transition-all"
              >
                <ShoppingBag className="w-4 h-4" /> Start Shopping
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  const isBulk = item.isBulkProduct === true
                  const displayPrice = getDisplayPrice(item)
                  const originalPrice = getOriginalPrice(item)
                  const discountPercent = getDiscountPercent(item)
                  const quantityDisplay = getQuantityDisplay(item)
                  const itemTotal = getItemTotal(item)
                  const isUpdating = updatingItems.has(item._id)
                  const colorName = getColorName(item)
                  const sizeName = getSizeName(item)
                  const productImage = getProductImage(item.product, colorName)

                  return (
                    <motion.div
                      key={item._id} layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      className="group relative bg-white rounded-3xl ring-1 ring-neutral-200/70 hover:ring-red-200/70 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                    >
                      <div className="p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Link
                            to={`/product/${item.product.slug}`}
                            className="relative flex-shrink-0 w-full sm:w-32 h-40 sm:h-32 rounded-2xl overflow-hidden bg-neutral-100"
                          >
                            <img
                              src={productImage}
                              alt={item.product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {discountPercent > 0 && (
                              <span className="absolute top-2 left-2 text-[10px] font-bold tracking-wide text-white bg-red-700 px-2 py-0.5 rounded-full shadow">
                                -{discountPercent}%
                              </span>
                            )}
                          </Link>

                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex justify-between gap-2">
                              <Link
                                to={`/product/${item.product.slug}`}
                                className="font-serif text-lg md:text-xl text-neutral-900 hover:text-red-700 transition line-clamp-2 leading-snug"
                              >
                                {item.product.name}
                              </Link>
                              <motion.button
                                onClick={() => handleRemoveItem(item._id, item.product.name)}
                                whileHover={{ scale: 1.1, rotate: -8 }} whileTap={{ scale: 0.9 }}
                                className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full text-neutral-400 hover:text-red-700 hover:bg-red-50 transition"
                                aria-label="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>

                            {isBulk ? (
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium text-red-700 bg-red-50 ring-1 ring-red-100 rounded-full">
                                  <Package className="w-3 h-3" /> Bulk Pack
                                </span>
                                {item.selectedColors?.length > 0 && (
                                  <span className="text-xs text-neutral-500">
                                    {item.selectedColors.join(" · ")}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 mt-1.5">
                                {sizeName && <span>Size <span className="text-neutral-800 font-medium">{sizeName}</span></span>}
                                {colorName && <span>Colour <span className="text-neutral-800 font-medium">{colorName}</span></span>}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 mt-auto pt-3">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-semibold text-neutral-900">₹{displayPrice}</span>
                                {isBulk && <span className="text-[11px] text-neutral-500">/set</span>}
                                {originalPrice && originalPrice > displayPrice && (
                                  <span className="text-sm text-neutral-400 line-through">₹{originalPrice}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center bg-neutral-50 ring-1 ring-neutral-200 rounded-full">
                                  <motion.button
                                    onClick={() => isBulk
                                      ? handleQuantityChange(item._id, null, true, quantityDisplay - 1)
                                      : handleQuantityChange(item._id, quantityDisplay - 1, false)}
                                    disabled={quantityDisplay <= 1 || isUpdating}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-8 h-8 inline-flex items-center justify-center rounded-full text-neutral-700 hover:bg-white hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </motion.button>
                                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                    {isUpdating ? "…" : quantityDisplay}
                                  </span>
                                  <motion.button
                                    onClick={() => isBulk
                                      ? handleQuantityChange(item._id, null, true, quantityDisplay + 1)
                                      : handleQuantityChange(item._id, quantityDisplay + 1, false)}
                                    disabled={quantityDisplay >= 10 || isUpdating}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-8 h-8 inline-flex items-center justify-center rounded-full text-neutral-700 hover:bg-white hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </motion.button>
                                </div>
                                {!isBulk && !isInWishlist(item.product._id) && (
                                  <motion.button
                                    onClick={() => handleMoveToWishlist(item)}
                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                                    title="Move to wishlist"
                                    className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-neutral-50 ring-1 ring-neutral-200 text-neutral-500 hover:text-red-700 hover:ring-red-200 transition"
                                  >
                                    <Heart className="w-3.5 h-3.5" />
                                  </motion.button>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-neutral-200">
                              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                <RotateCcw className="w-3 h-3" /> 7-day easy returns
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-neutral-900">₹{itemTotal}</span>
                                {isBulk && (
                                  <p className="text-[11px] text-neutral-500">
                                    {quantityDisplay} set{quantityDisplay !== 1 ? 's' : ''} · {item.totalPieces || (item.piecesPerSet * quantityDisplay)} pcs
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              {summary.subtotal >= 399 ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 mb-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 ring-1 ring-emerald-200/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 rounded-full shadow"><Truck className="w-4 h-4 text-white" /></div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Free delivery unlocked</p>
                      <p className="text-xs text-emerald-700">You saved ₹99 on shipping</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 mb-5 rounded-2xl bg-white ring-1 ring-neutral-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-700 rounded-full shadow"><Gift className="w-4 h-4 text-white" /></div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        Add ₹{399 - summary.subtotal} more for free delivery
                      </p>
                      <p className="text-xs text-neutral-500">Currently ₹99 shipping</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-700 to-rose-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((summary.subtotal / 399) * 100, 100)}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="sticky top-24 relative bg-white rounded-3xl ring-1 ring-neutral-200/80 shadow-xl overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-700 via-rose-600 to-red-700" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-serif text-2xl text-neutral-900">Order Summary</h3>
                    <ShieldCheck className="w-5 h-5 text-red-700" />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal</span>
                      <span className="font-medium text-neutral-900 tabular-nums">₹{summary.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Shipping</span>
                      <span className="font-medium tabular-nums">
                        {summary.subtotal >= 399
                          ? <span className="text-emerald-600 font-semibold">FREE</span>
                          : <span className="text-neutral-900">₹99</span>}
                      </span>
                    </div>
                    <div className="my-3 border-t border-dashed border-neutral-200" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-semibold text-neutral-900">Total</span>
                      <span className="font-serif text-2xl font-semibold text-red-700 tabular-nums">₹{totalAmount}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500">Inclusive of all taxes</p>
                  </div>

                  <motion.button
                    onClick={() => navigate("/checkout")}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    className="hidden md:flex items-center justify-center gap-2 w-full mt-6 py-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-2xl shadow-lg shadow-red-900/20 hover:shadow-xl transition-all"
                  >
                    Proceed to Checkout <ArrowLeft className="w-4 h-4 rotate-180" />
                  </motion.button>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] text-neutral-500">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-50">
                      <ShieldCheck className="w-4 h-4 text-neutral-700" /> Secure
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-50">
                      <Truck className="w-4 h-4 text-neutral-700" /> Fast ship
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-50">
                      <RotateCcw className="w-4 h-4 text-neutral-700" /> Returns
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Checkout */}
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100 }} animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-neutral-200 shadow-2xl md:hidden z-50"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Total</p>
              <p className="font-serif text-2xl font-semibold text-red-700">₹{totalAmount}</p>
            </div>
            <motion.button
              onClick={() => navigate("/checkout")}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-full shadow-lg shadow-red-900/20"
            >
              Place Order →
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default CartPage