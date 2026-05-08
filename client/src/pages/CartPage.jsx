"use client"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, Plus, Minus, Trash2, Heart, ArrowLeft, Truck, RotateCcw, ShoppingCart, Package } from "lucide-react"
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

  // Handle quantity change for regular products
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

  // Calculate shipping (use summary.subtotal which already includes proper calculation)
  const shippingCost = summary.subtotal >= 399 ? 0 : 99
  const totalAmount = summary.subtotal + shippingCost

  // Helper to get display price for bulk item
  const getDisplayPrice = (item) => {
    if (item.isBulkProduct) {
      return item.pricePerSet || item.product?.bulkConfig?.pricePerSet || item.product?.price
    }
    return item.product?.price || 0
  }

  // Helper to get original price
  const getOriginalPrice = (item) => {
    if (item.isBulkProduct) {
      return item.product?.bulkConfig?.originalPricePerSet
    }
    return item.product?.originalPrice
  }

  // Helper to get discount percentage
  const getDiscountPercent = (item) => {
    const price = getDisplayPrice(item)
    const originalPrice = getOriginalPrice(item)
    if (originalPrice && originalPrice > price) {
      return Math.round(((originalPrice - price) / originalPrice) * 100)
    }
    return 0
  }

  // Helper to get quantity display
  const getQuantityDisplay = (item) => {
    if (item.isBulkProduct) {
      return item.totalSets || item.quantity || 1
    }
    return item.quantity || 1
  }

  // Helper to get item total
  const getItemTotal = (item) => {
    if (item.isBulkProduct) {
      const pricePerSet = getDisplayPrice(item)
      const totalSets = getQuantityDisplay(item)
      return pricePerSet * totalSets
    }
    return (item.product?.price || 0) * (item.quantity || 1)
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="pt-28 md:pt-32 flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-b-2 border-red-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="bg-white pt-4 md:pt-8 pb-20 md:pb-8">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={() => navigate('/')}
              className="p-2 transition-colors rounded-full hover:bg-gray-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">Shopping Cart</h1>
              <p className="text-gray-600">
                {summary.totalItems} {summary.totalItems === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <motion.button
              onClick={handleClearCart}
              className="font-medium text-red-600 transition-colors hover:text-red-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Cart
            </motion.button>
          )}
        </div>

        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Your cart is empty</h2>
            <p className="max-w-md mx-auto mb-8 text-gray-600">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 space-x-2 text-white transition-colors bg-red-600 rounded-xl hover:bg-red-700"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Continue Shopping</span>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <AnimatePresence>
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white rounded-xl shadow-sm border"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24">
                          <img
                            src={item.product.images[0]?.url || "/placeholder.svg?height=96&width=96"}
                            alt={item.product.name}
                            className="object-cover w-full h-full rounded-xl"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <Link
                              to={`/product/${item.product.slug}`}
                              className="text-sm md:text-base font-semibold text-gray-800 transition-colors hover:text-red-600 line-clamp-2 pr-2"
                            >
                              {item.product.name}
                            </Link>
                            <motion.button
                              onClick={() => handleRemoveItem(item._id, item.product.name)}
                              className="p-1 text-gray-400 transition-colors hover:text-red-500 flex-shrink-0"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>

                          {/* Bulk Badge & Info */}
                          {isBulk && (
                            <div className="mb-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded-full">
                                <Package className="w-3 h-3" />
                                Bulk Pack
                              </span>
                              {item.selectedColors && item.selectedColors.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Colors: {item.selectedColors.join(", ")}
                                </p>
                              )}
                              {item.piecesPerSet > 0 && (
                                <p className="text-xs text-gray-500">
                                  {item.piecesPerSet} pieces per set
                                </p>
                              )}
                            </div>
                          )}

                          {/* Size & Color for Regular Products */}
                          {!isBulk && (
                            <div className="flex items-center space-x-3 text-xs md:text-sm text-gray-600 mb-2">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                            </div>
                          )}

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center border border-gray-300 rounded">
                              <motion.button
                                onClick={() => {
                                  if (isBulk) {
                                    handleQuantityChange(item._id, null, true, quantityDisplay - 1)
                                  } else {
                                    handleQuantityChange(item._id, quantityDisplay - 1, false)
                                  }
                                }}
                                disabled={quantityDisplay <= 1 || isUpdating}
                                className="p-1 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Minus className="w-3 h-3" />
                              </motion.button>
                              <span className="px-2 py-1 text-xs font-medium min-w-[2rem] text-center">
                                {isUpdating ? "..." : quantityDisplay}
                                {isBulk && <span className="text-[10px] ml-0.5">sets</span>}
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
                                className="p-1 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Plus className="w-3 h-3" />
                              </motion.button>
                            </div>
                            {!isBulk && !isInWishlist(item.product._id) && (
                              <motion.button
                                onClick={() => handleMoveToWishlist(item)}
                                className="p-1 text-gray-400 transition-colors hover:text-red-500"
                                title="Move to Wishlist"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Heart className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>

                          {/* Price Section */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-base md:text-lg font-bold text-gray-800">
                                ₹{displayPrice}
                                {isBulk && <span className="text-xs font-normal text-gray-500 ml-1">/set</span>}
                              </span>
                              {originalPrice && originalPrice > displayPrice && (
                                <span className="text-xs md:text-sm text-gray-500 line-through">
                                  ₹{originalPrice}
                                </span>
                              )}
                              {discountPercent > 0 && (
                                <span className="text-xs text-orange-600 font-medium">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Total for this item */}
                          <div className="mt-2 text-right">
                            <span className="text-sm font-semibold text-gray-800">
                              Total: ₹{itemTotal}
                            </span>
                            {isBulk && (
                              <p className="text-xs text-gray-500">
                                {quantityDisplay} set{quantityDisplay !== 1 ? 's' : ''} = {item.totalPieces || (item.piecesPerSet * quantityDisplay)} pieces
                              </p>
                            )}
                          </div>

                          {/* Return Policy */}
                          <div className="mt-2 text-xs text-gray-500 flex items-center">
                            <RotateCcw className="w-3 h-3 mr-1" />
                            <span>7 days return available</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Order Summary - Same as before */}
            <div className="lg:col-span-1">
              {summary.subtotal >= 399 ? (
                <div className="p-4 mb-4 border border-green-200 rounded-xl bg-green-50">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">🎉 You've qualified for FREE shipping!</span>
                  </div>
                  <div className="mt-2 text-xs text-green-600">Save ₹99 on shipping charges</div>
                </div>
              ) : (
                <div className="p-4 mb-4 border border-blue-200 rounded-xl bg-blue-50">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Add ₹{399 - summary.subtotal} more for FREE shipping!
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">Currently shipping charges: ₹99</div>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="sticky p-3 bg-white rounded-xl shadow-sm top-4 border-xl"
              >
                <h3 className="mb-4 text-xl font-semibold text-gray-800">Order Summary</h3>
                <div className="mb-4 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{summary.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {summary.subtotal >= 399 ? <span className="text-green-600 font-semibold">FREE</span> : `₹99`}
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => navigate("/checkout")}
                  className="hidden md:block w-full py-3 mb-4 font-medium text-white transition-colors bg-red-600 rounded-xl hover:bg-red-700 border-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Place Order
                </motion.button>
                <div className="pt-1 mt-1 border-t rounded-xl">
                  <img src="/badge.jpeg" className="rounded-xl" alt="badge" />
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden z-50">
          <motion.button
            onClick={() => navigate("/checkout")}
            className="w-full py-3 mb-4 font-medium text-white transition-colors bg-red-600 rounded-xl hover:bg-red-700 border-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Place Order - ₹{totalAmount}
          </motion.button>
        </div>
      )}
    </div>
  )
}

export default CartPage