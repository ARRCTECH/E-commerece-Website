"use client"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, Plus, Minus, Trash2, Heart, ArrowLeft, Truck, RotateCcw, ShoppingCart, Package, Gift } from "lucide-react"
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  optimisticUpdateQuantity,
  optimisticRemoveFromCart,
} from "../store/slices/cartSlice"
import { addToWishlist, optimisticAddToWishlist } from "../store/slices/wishlistSlice"
import toast from "react-hot-toast"

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
    if (user) {
      dispatch(fetchCart())
    }
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
      console.error("Update quantity error:", error)
      toast.error(error?.message || "Failed to update quantity")
      dispatch(fetchCart())
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (itemId, productName) => {
    try {
      dispatch(optimisticRemoveFromCart(itemId))
      toast.success(`${productName} removed from cart`)
      const bagElement = document.querySelector("#bag")
      if (bagElement) {
        bagElement.style.transform = "scale(1.2)"
        setTimeout(() => {
          bagElement.style.transform = "scale(1)"
        }, 200)
      }
      await dispatch(removeFromCart(itemId)).unwrap()
    } catch (error) {
      console.error("Remove from cart error:", error)
      toast.error(error?.message || "Failed to remove from cart")
    }
  }

  const handleMoveToWishlist = async (item) => {
    try {
      dispatch(optimisticAddToWishlist(item.product))
      dispatch(optimisticRemoveFromCart(item._id))
      toast.success(`${item.product.name} moved to wishlist`)
      const bagElement = document.querySelector("#bag")
      const wishElement = document.querySelector("#wish")
      if (bagElement) {
        bagElement.style.transform = "scale(1.2)"
        setTimeout(() => {
          bagElement.style.transform = "scale(1)"
        }, 200)
      }
      if (wishElement) {
        wishElement.style.transform = "scale(1.2)"
        setTimeout(() => {
          wishElement.style.transform = "scale(1)"
        }, 200)
      }
      await dispatch(addToWishlist(item.product._id)).unwrap()
      await dispatch(removeFromCart(item._id)).unwrap()
    } catch (error) {
      console.error("Move to wishlist error:", error)
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

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item._id === productId)
  }

  const shippingCost = summary.subtotal >= 399 ? 0 : 99
  const totalAmount = summary.subtotal + shippingCost

  const getDisplayPrice = (item) => {
    if (item.isBulkProduct) {
      return item.pricePerSet || item.product?.bulkConfig?.pricePerSet || item.product?.price
    }
    return item.product?.price || 0
  }

  const getOriginalPrice = (item) => {
    if (item.isBulkProduct) {
      return item.product?.bulkConfig?.originalPricePerSet
    }
    return item.product?.originalPrice
  }

  const getDiscountPercent = (item) => {
    const price = getDisplayPrice(item)
    const originalPrice = getOriginalPrice(item)
    if (originalPrice && originalPrice > price) {
      return Math.round(((originalPrice - price) / originalPrice) * 100)
    }
    return 0
  }

  const getQuantityDisplay = (item) => {
    if (item.isBulkProduct) {
      return item.totalSets || item.quantity || 1
    }
    return item.quantity || 1
  }

  const getItemTotal = (item) => {
    if (item.isBulkProduct) {
      const pricePerSet = getDisplayPrice(item)
      const totalSets = getQuantityDisplay(item)
      return pricePerSet * totalSets
    }
    return (item.product?.price || 0) * (item.quantity || 1)
  }

  // Skeleton loading component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 bg-white rounded-xl shadow-sm border animate-pulse">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-xl md:w-24 md:h-24"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex justify-between">
                <div className="h-8 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-28 md:pt-32 pb-20">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-6 md:pt-10 pb-24 md:pb-12">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => navigate('/')}
              className="p-2 transition-all duration-200 rounded-full hover:bg-gray-100 active:scale-95"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Shopping Cart</h1>
              <p className="text-sm text-gray-500 mt-1">
                {summary.totalItems} {summary.totalItems === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <motion.button
              onClick={handleClearCart}
              className="self-start md:self-auto text-sm font-medium text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </motion.button>
          )}
        </div>

        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="py-20 text-center max-w-md mx-auto"
          >
            <div className="flex items-center justify-center w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shadow-inner">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="mb-3 text-2xl font-semibold text-gray-800">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">
              Looks like you haven't added any items yet. Start shopping to fill it up!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Continue Shopping</span>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
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

                  return (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden"
                    >
                      <div className="p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Product Image */}
                          <Link
                            to={`/product/${item.product.slug}`}
                            className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-gray-100"
                          >
                            <img
                              src={item.product.images[0]?.url || "/placeholder.svg?height=112&width=112"}
                              alt={item.product.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap justify-between gap-2 mb-1">
                              <Link
                                to={`/product/${item.product.slug}`}
                                className="text-base md:text-lg font-semibold text-gray-800 hover:text-red-600 transition-colors line-clamp-2 flex-1"
                              >
                                {item.product.name}
                              </Link>
                              <motion.button
                                onClick={() => handleRemoveItem(item._id, item.product.name)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>

                            {/* Bulk Badge & Info */}
                            {isBulk && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 rounded-full">
                                  <Package className="w-3 h-3" />
                                  Bulk Pack
                                </span>
                                {item.selectedColors && item.selectedColors.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    Colors: {item.selectedColors.join(", ")}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Size & Color */}
                            {!isBulk && (
                              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                                {item.size && <span>Size: {item.size}</span>}
                                {item.color && <span>Color: {item.color}</span>}
                              </div>
                            )}

                            {/* Price & Quantity Row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-gray-800">
                                  ₹{displayPrice}
                                  {isBulk && <span className="text-xs font-normal text-gray-500 ml-1">/set</span>}
                                </span>
                                {originalPrice && originalPrice > displayPrice && (
                                  <span className="text-sm text-gray-400 line-through">
                                    ₹{originalPrice}
                                  </span>
                                )}
                                {discountPercent > 0 && (
                                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                    {discountPercent}% off
                                  </span>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                                  <motion.button
                                    onClick={() => {
                                      if (isBulk) {
                                        handleQuantityChange(item._id, null, true, quantityDisplay - 1)
                                      } else {
                                        handleQuantityChange(item._id, quantityDisplay - 1, false)
                                      }
                                    }}
                                    disabled={quantityDisplay <= 1 || isUpdating}
                                    className="p-1.5 px-2.5 text-gray-600 hover:bg-gray-100 rounded-l-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </motion.button>
                                  <span className="w-10 text-center text-sm font-medium">
                                    {isUpdating ? "..." : quantityDisplay}
                                  </span>
                                  <motion.button
                                    onClick={() => {
                                      if (isBulk) {
                                        handleQuantityChange(item._id, null, true, quantityDisplay + 1)
                                      } else {
                                        handleQuantityChange(item._id, quantityDisplay + 1, false)
                                      }
                                    }}
                                    disabled={quantityDisplay >= 10 || isUpdating}
                                    className="p-1.5 px-2.5 text-gray-600 hover:bg-gray-100 rounded-r-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </motion.button>
                                </div>
                                {!isBulk && !isInWishlist(item.product._id) && (
                                  <motion.button
                                    onClick={() => handleMoveToWishlist(item)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                                    title="Move to Wishlist"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Heart className="w-4 h-4" />
                                  </motion.button>
                                )}
                              </div>
                            </div>

                            {/* Item Total & Pieces info */}
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" />
                                <span>7 days return</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-gray-800">
                                  Total: ₹{itemTotal}
                                </span>
                                {isBulk && (
                                  <p className="text-xs text-gray-500">
                                    {quantityDisplay} set{quantityDisplay !== 1 ? 's' : ''} = {item.totalPieces || (item.piecesPerSet * quantityDisplay)} pieces
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

            {/* Order Summary */}
            <div className="lg:col-span-1">
              {/* Free Shipping Banner */}
              {summary.subtotal >= 399 ? (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 mb-5 border border-green-200 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Truck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">🎉 Free Shipping Unlocked!</p>
                      <p className="text-xs text-green-600">You've saved ₹99 on delivery</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 mb-5 border border-blue-200 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Gift className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Add ₹{399 - summary.subtotal} more for FREE Shipping
                      </p>
                      <p className="text-xs text-blue-600">Current shipping: ₹99</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      className="bg-blue-600 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((summary.subtotal / 399) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-5 md:p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium">₹{summary.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="font-medium">
                        {summary.subtotal >= 399 ? 
                          <span className="text-green-600 font-semibold">FREE</span> : 
                          <span>₹99</span>
                        }
                      </span>
                    </div>
                    <div className="border-t border-gray-100 my-3"></div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-red-600">₹{totalAmount}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                  </div>

                  <motion.button
                    onClick={() => navigate("/checkout")}
                    className="hidden md:block w-full mt-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Proceed to Checkout
                  </motion.button>

                  <div className="mt-5 pt-3 border-t border-gray-100">
                    <img 
                      src="/badge.jpeg" 
                      className="w-full rounded-xl shadow-sm" 
                      alt="Secure checkout badge" 
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Checkout Button */}
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg md:hidden z-50"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-xl font-bold text-red-600">₹{totalAmount}</span>
          </div>
          <motion.button
            onClick={() => navigate("/checkout")}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
            whileTap={{ scale: 0.98 }}
          >
            Place Order
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}

export default CartPage