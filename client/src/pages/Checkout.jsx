"use client"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShoppingBag, MapPin, CreditCard, Tag, Truck, Shield, X } from "lucide-react"
import {
  createRazorpayOrder,
  clearError,
  clearSuccess,
  placeCodOrder,
  verifyPayment,
  selectRazorpayOrder,
  selectOrderSummary,
  selectOrderLoading,
  selectOrderError,
  selectOrderSuccess,
  selectShippingRates,
  selectCartItems,
  selectCartSummary,
  selectAppliedCoupon,
  selectCouponLoading,
  selectCouponError,
  selectUser,
} from "../store/slices/orderSlice"
import {
  validateCoupon,
  removeCoupon,
  clearError as clearCouponError,
  fetchAvailableCoupons,
} from "../store/slices/couponSlice"
import { fetchCart } from "../store/slices/cartSlice"
import LoadingSpinner from "../components/LoadingSpinner"
const CheckoutPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const rzpInstanceRef = useRef(null)

  // Use memoized selectors
  const razorpayOrder = useSelector(selectRazorpayOrder)
  const orderSummary = useSelector(selectOrderSummary)
  const orderLoading = useSelector(selectOrderLoading)
  const orderError = useSelector(selectOrderError)
  const orderSuccess = useSelector(selectOrderSuccess)
  const shippingRates = useSelector(selectShippingRates)
  const cartItems = useSelector(selectCartItems)
  const cartSummary = useSelector(selectCartSummary)
  const appliedCoupon = useSelector(selectAppliedCoupon)
  const availableCoupons = useSelector((state) => state.coupons.availableCoupons || [])
  const couponLoading = useSelector(selectCouponLoading)
  const couponError = useSelector(selectCouponError)
  const user = useSelector(selectUser)
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    phoneNumber: user?.phoneNumber?.replace("+91", "") || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    landmark: "",
  })

  const [couponCode, setCouponCode] = useState("")
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [addressErrors, setAddressErrors] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [selectedShippingRate, setSelectedShippingRate] = useState(null)
  const [showShippingCalculator, setShowShippingCalculator] = useState(false)

  useEffect(() => {
    // Close existing instance if any
    // Clear any existing order state when checkout page loads

    dispatch(removeCoupon())
    setCouponCode("")
    setShowCouponInput(false)

    if (rzpInstanceRef.current) {
      rzpInstanceRef.current.close()
      rzpInstanceRef.current = null
    }

    // Cleanup on unmount
    return () => {
      if (rzpInstanceRef.current) {
        rzpInstanceRef.current.close()
        rzpInstanceRef.current = null
      }
    }
  }, [])

  // Load available coupons for the logged-in user
  useEffect(() => {
    if (Object.keys(user).length != 0) {
      dispatch(fetchAvailableCoupons())
    }
  }, [dispatch, user])

  // Memoized functions and values
  const validateAddress = useCallback(() => {
    const errors = {}
    if (!shippingAddress.fullName.trim()) errors.fullName = "Full name is required"
    if (!shippingAddress.phoneNumber.trim()) errors.phoneNumber = "Phone number is required"
    else if (!/^[6789]\d{9}$/.test(shippingAddress.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid 10-digit mobile number"
    }
    if (!shippingAddress.addressLine1.trim()) errors.addressLine1 = "Address is required"
    if (!shippingAddress.city.trim()) errors.city = "City is required"
    if (!shippingAddress.state.trim()) errors.state = "State is required"
    if (!shippingAddress.pinCode.trim()) errors.pinCode = "PIN code is required"
    else if (!/^[1-9][0-9]{5}$/.test(shippingAddress.pinCode)) {
      errors.pinCode = "Please enter a valid 6-digit PIN code"
    }
    setAddressErrors(errors)
    return Object.keys(errors).length === 0
  }, [shippingAddress])

  const handleAddressChange = useCallback((field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }))
    setAddressErrors((prev) => ({ ...prev, [field]: "" }))
  }, [])

  const handleApplyCoupon = useCallback(() => {
    if (!couponCode.trim()) return
    const orderValue = cartSummary.subtotal || 0
    dispatch(validateCoupon({ code: couponCode, cartTotal: orderValue }))
  }, [couponCode, cartSummary.subtotal, dispatch])

  const handleRemoveCoupon = useCallback(() => {
    dispatch(removeCoupon())
    setCouponCode("")
    setShowCouponInput(false)
  }, [dispatch])

  const calculateFinalPricing = useMemo(() => {
    const subtotal = cartSummary.subtotal || 0
    // Updated free shipping threshold from 999 to 399
    const shippingCharges = selectedShippingRate ? selectedShippingRate.freight_charge : subtotal >= 399 ? 0 : 99
    const discount = appliedCoupon?.discountAmount || 0
    // Removed GST (Tax) calculation as per requirement
    const total = Math.round(subtotal + shippingCharges - discount)
    return {
      subtotal,
      shippingCharges,
      discount,
      total,
    }
  }, [cartSummary.subtotal, selectedShippingRate, appliedCoupon])

  const handlePlaceOrder = useCallback(() => {
   

    if (rzpInstanceRef.current) {
      rzpInstanceRef.current.close()
      rzpInstanceRef.current = null
    }

    if (!validateAddress()) {
      alert("Please fill all required address fields")
      return
    }

    if (!cartItems.length) {
      alert("Your cart is empty")
      return
    }

    const orderData = {
      amount: cartSummary.total,
      items: cartItems.map((item) => ({
        productId: item.product?._id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
      shippingAddress: {
        ...shippingAddress,
        phoneNumber: `+91${shippingAddress.phoneNumber}`,
      },
      couponCode: appliedCoupon?.code || "",
      selectedShippingRate: selectedShippingRate,
    }


    dispatch(createRazorpayOrder(orderData))
  }, [validateAddress, cartItems, shippingAddress, appliedCoupon, selectedShippingRate, dispatch])

  const handlePlaceCodOrder = useCallback(() => {
   

    if (rzpInstanceRef.current) {
      rzpInstanceRef.current.close()
      rzpInstanceRef.current = null
    }

    if (!validateAddress()) {
      alert("Please fill all required address fields")
      return
    }

    if (!cartItems.length) {
      alert("Your cart is empty")
      return
    }

    const orderData = {
      items: cartItems.map((item) => ({
        productId: item.product?._id,
        quantity: item.quantity || 1,
        size: item.size,
        color: item.color,
      })),
      shippingAddress: {
        ...shippingAddress,
        phoneNumber: `+91${shippingAddress.phoneNumber}`,
      },
      couponCode: appliedCoupon?.code || "",
      selectedShippingRate: selectedShippingRate,
    }

    dispatch(placeCodOrder(orderData)).then((result) => {
      if (result.type === "order/placeCodOrder/fulfilled") {
        navigate(`/order-confirmation/${result.payload.order.id}`)
      } else {
        console.error("COD Order failed:", result.error)
        alert("Failed to place COD order. Please try again.")
      }
    })
  }, [validateAddress, cartItems, shippingAddress, appliedCoupon, selectedShippingRate, dispatch, navigate])

  const handleRazorpayPayment = useCallback(() => {
    if (!razorpayOrder) return

    if (rzpInstanceRef.current) {
      rzpInstanceRef.current.close()
      rzpInstanceRef.current = null
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Ksaunibliss",
      description: "Fashion Purchase",
      order_id: razorpayOrder.id,
      handler: (response) => {
        dispatch(
          verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        ).then((result) => {
          if (result.type === "order/verifyPayment/fulfilled") {
            navigate(`/order-confirmation/${result.payload.order.id}`)
          }
        })
      },
      prefill: {
        name: shippingAddress.fullName,
        email: user?.email || "",
        contact: `+91${shippingAddress.phoneNumber}`,
      },
      theme: {
        color: "#ec4899",
      },
      modal: {
        ondismiss: () => {

          rzpInstanceRef.current = null
          window.location.reload()
        },
      },
    }

    if (window.Razorpay) {
      rzpInstanceRef.current = new window.Razorpay(options)
      rzpInstanceRef.current.open()
    } else {
      console.error("Razorpay SDK not loaded")
      alert("Payment gateway not available. Please try again.")
    }
  }, [razorpayOrder, shippingAddress, user, dispatch, navigate, clearSuccess])

  const handleShippingRateSelect = useCallback((rate) => {
    setSelectedShippingRate(rate)
    setShowShippingCalculator(false)
  }, [])

  // Effects
  useEffect(() => {
    if (user?.name && !shippingAddress.fullName) {
      setShippingAddress((prev) => ({
        ...prev,
        fullName: user.name,
        phoneNumber: user.phoneNumber?.replace("+91", "") || "",
      }))
    }
  }, [user, shippingAddress.fullName])

  useEffect(() => {
    if (!cartItems.length) {
      dispatch(fetchCart())
    }
  }, [dispatch, cartItems.length])

  useEffect(() => {
    if (orderSuccess.orderCreated && razorpayOrder) {
      handleRazorpayPayment()
    }
  }, [orderSuccess.orderCreated, razorpayOrder, handleRazorpayPayment])

  useEffect(() => {
    if (orderError) {
      const timer = setTimeout(() => dispatch(clearError()), 5000)
      return () => clearTimeout(timer)
    }
  }, [orderError, dispatch])

  useEffect(() => {
    if (couponError) {
      const timer = setTimeout(() => dispatch(clearCouponError()), 5000)
      return () => clearTimeout(timer)
    }
  }, [couponError, dispatch])

  if (!cartItems.length && !orderLoading.creating) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400 xs:w-16 xs:h-16" />
          <h2 className="mb-2 text-xl font-bold text-gray-800 xs:text-2xl">Your cart is empty</h2>
          <p className="mb-4 text-sm text-gray-600 xs:text-base">
            Add some items to your cart to proceed with checkout
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-sm text-white transition-colors bg-red-700 rounded-lg xs:px-6 xs:text-base hover:bg-red-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-4 xs:py-6 sm:py-8 bg-gray-50">
      <div className="container px-2 mx-auto xs:px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Header - Responsive */}
          <div className="mb-6 text-center xs:mb-8 sm:text-left">
            <h1 className="mb-2 text-2xl font-bold text-gray-800 xs:text-3xl">Checkout</h1>
            <p className="text-sm text-gray-600 xs:text-base">Review your order and complete your purchase</p>
          </div>

          {/* Error Display - Responsive */}
          {(orderError || couponError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg xs:px-4 xs:mb-6 xs:text-base bg-red-50"
            >
              {orderError || couponError}
            </motion.div>
          )}

          <div className="grid gap-4 xs:gap-6 lg:gap-8 lg:grid-cols-3">
            {/* Left Column - Forms - Responsive */}
            <div className="space-y-4 xs:space-y-6 lg:col-span-2">
              {/* Shipping Address - Responsive */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-white rounded-lg shadow-md xs:p-6"
              >
                <div className="flex items-center mb-4">
                  <MapPin className="w-4 h-4 mr-2 text-red-700 xs:w-5 xs:h-5" />
                  <h2 className="text-lg font-semibold xs:text-xl">Shipping Address</h2>
                </div>
                <div className="grid gap-3 xs:gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => handleAddressChange("fullName", e.target.value)}
                      className={`w-full px-3 py-2 text-sm xs:text-base border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        addressErrors.fullName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your full name"
                    />
                    {addressErrors.fullName && (
                      <p className="mt-1 text-xs text-red-500 xs:text-sm">{addressErrors.fullName}</p>
                    )}
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Phone Number *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-2 text-xs text-gray-500 border border-r-0 border-gray-300 rounded-l-lg xs:px-3 xs:text-sm bg-gray-50">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={shippingAddress.phoneNumber}
                        onChange={(e) =>
                          handleAddressChange("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        className={`w-full px-3 py-2 text-sm xs:text-base border rounded-r-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                          addressErrors.phoneNumber ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter 10-digit mobile number"
                      />
                    </div>
                    {addressErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-500 xs:text-sm">{addressErrors.phoneNumber}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Address Line 1 *</label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => handleAddressChange("addressLine1", e.target.value)}
                      className={`w-full px-3 py-2 text-sm xs:text-base border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        addressErrors.addressLine1 ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="House/Flat No., Building Name, Street"
                    />
                    {addressErrors.addressLine1 && (
                      <p className="mt-1 text-xs text-red-500 xs:text-sm">{addressErrors.addressLine1}</p>
                    )}
                  </div>
                  {/* <div className="sm:col-span-2">
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine2}
                      onChange={(e) =>
                        handleAddressChange("addressLine2", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg xs:text-base focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Area, Locality (Optional)"
                    />
                  </div> */}
                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-sm font-medium text-gray-700">City *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      className={`w-full px-3 py-2 text-sm xs:text-base border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        addressErrors.city ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your city"
                    />
                    {addressErrors.city && <p className="mt-1 text-xs text-red-500 xs:text-sm">{addressErrors.city}</p>}
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-sm font-medium text-gray-700">State *</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => handleAddressChange("state", e.target.value)}
                      className={`w-full px-3 py-2 text-sm xs:text-base border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        addressErrors.state ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your state"
                    />
                    {addressErrors.state && (
                      <p className="mt-1 text-xs text-red-500 xs:text-sm">{addressErrors.state}</p>
                    )}
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-sm font-medium text-gray-700">PIN Code *</label>
                    <input
                      type="text"
                      value={shippingAddress.pinCode}
                      onChange={(e) => handleAddressChange("pinCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className={`w-full px-3 py-2 text-sm xs:text-base border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        addressErrors.pinCode ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter 6-digit PIN code"
                    />
                    {addressErrors.pinCode && (
                      <p className="mt-1 text-xs text-red-500 xs:text-sm">{addressErrors.pinCode}</p>
                    )}
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Landmark</label>
                    <input
                      type="text"
                      value={shippingAddress.landmark}
                      onChange={(e) => handleAddressChange("landmark", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg xs:text-base focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Nearby landmark (Optional)"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Shipping Options - Responsive */}
              {/* {shippingAddress.pinCode.length === 6 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 bg-white rounded-lg shadow-md xs:p-6"
                >
                  <div className="flex flex-col justify-between mb-4 space-y-2 xs:flex-row xs:items-center xs:space-y-0">
                    <div className="flex items-center">
                      <Truck className="w-4 h-4 mr-2 text-pink-600 xs:w-5 xs:h-5" />
                      <h2 className="text-lg font-semibold xs:text-xl">
                        Shipping Options
                      </h2>
                    </div>
                    <button
                      onClick={() =>
                        setShowShippingCalculator(!showShippingCalculator)
                      }
                      className="flex items-center self-start px-3 py-1 text-xs text-pink-600 border border-pink-600 rounded-lg xs:text-sm hover:bg-pink-50 xs:self-auto"
                    >
                      <Calculator className="w-3 h-3 mr-1 xs:w-4 xs:h-4" />
                      {showShippingCalculator ? "Hide" : "Show"} Rates
                    </button>
                  </div>
                  {showShippingCalculator && (
                    <ShippingRateCalculator
                      onRateSelect={handleShippingRateSelect}
                      cartWeight={cartItems.reduce(
                        (weight, item) => weight + item.quantity * 0.5,
                        0.5
                      )}
                      cartValue={cartSummary.subtotal || 0}
                    />
                  )}
                  {selectedShippingRate && (
                    <div className="p-3 mt-4 border border-green-200 rounded-lg xs:p-4 bg-green-50">
                      <div className="flex flex-col justify-between space-y-2 xs:flex-row xs:items-center xs:space-y-0">
                        <div>
                          <p className="text-sm font-medium text-green-800 xs:text-base">
                            Selected: {selectedShippingRate.courier_name}
                          </p>
                          <p className="text-xs text-green-600 xs:text-sm">
                            Delivery: {selectedShippingRate.etd} | ₹
                            {selectedShippingRate.freight_charge}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedShippingRate(null)}
                          className="self-start p-1 text-red-500 hover:text-red-700 xs:self-auto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )} */}

              {/* Coupon Section - Responsive */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-white rounded-xl shadow-md xs:p-6"
              >
                <div className="flex items-center mb-4">
                  <Tag className="w-4 h-4 mr-2 text-red-600 xs:w-5 xs:h-5" />
                  <h2 className="text-lg font-semibold xs:text-xl">Promo Code</h2>
                </div>
                {Object.keys(user).length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Want to use a promo code?</p>
                        <p className="text-xs text-yellow-600 mt-1">Please log in to apply discount codes</p>
                      </div>
                      <button
                        onClick={() => navigate("/login")}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        Login
                      </button>
                    </div>
                  </div>
                ) : appliedCoupon ? (
                  <div className="flex flex-col justify-between p-3 space-y-2 border border-green-200 rounded-lg xs:flex-row xs:items-center xs:p-4 bg-green-50 xs:space-y-0">
                    <div>
                      <p className="text-sm font-medium text-green-800 xs:text-base">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600 xs:text-sm">You saved ₹{appliedCoupon.discountAmount}!</p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="self-start p-1 text-red-500 hover:text-red-700 xs:self-auto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-white border rounded-lg">
                    {/* Header / Toggle */}
                    {!showCouponInput ? (
                      <button
                        onClick={() => setShowCouponInput(true)}
                        className="text-sm font-medium text-red-600 xs:text-base hover:text-red-700"
                      >
                        Have a promo code? Click here to apply
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 xs:flex-row">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter promo code"
                          className="flex-1 px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleApplyCoupon}
                            disabled={!couponCode.trim() || couponLoading?.validating}
                            className="px-4 py-2 text-sm font-semibold text-white rounded-md bg-red-600 disabled:opacity-50"
                          >
                            {couponLoading?.validating ? "Applying..." : "Apply"}
                          </button>
                          {appliedCoupon && (
                            <button
                              onClick={handleRemoveCoupon}
                              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Available Coupons (ALWAYS under the input/toggle) */}
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-semibold text-gray-700">Available Coupons</div>

                      {availableCoupons.length === 0 ? (
                        <div className="text-xs text-gray-500">
                          No active coupons right now. (To View Coupons please login)
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {availableCoupons.map((c) => {
                            const subtotal = cartSummary?.subtotal || 0
                            const min = c.minOrderValue || 0
                            const eligible = subtotal >= min
                            const shortBy = Math.max(0, min - subtotal)

                            return (
                              <div key={c.code} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex flex-col">
                                  <span className="text-sm font-mono font-semibold">{c.code}</span>
                                  {c.description && <span className="text-xs text-gray-600">{c.description}</span>}
                                  {min > 0 && <span className="text-xs text-gray-500">Min order: ₹{min}</span>}
                                </div>

                                <button
                                  className="px-3 py-1 text-xs font-semibold text-white rounded bg-red-600 disabled:opacity-50"
                                  disabled={!eligible}
                                  onClick={() => {
                                    setShowCouponInput(true)
                                    setCouponCode(c.code)
                                    const orderValue = cartSummary?.subtotal || 0
                                    dispatch(
                                      validateCoupon({
                                        code: c.code,
                                        cartTotal: orderValue,
                                      }),
                                    )
                                  }}
                                >
                                  {eligible ? "Apply" : `Add ₹${shortBy} more`}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column - Order Summary - Responsive */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky p-4 bg-white rounded-lg shadow-md xs:p-6 top-4"
              >
                <h2 className="mb-4 text-lg font-semibold xs:text-xl">Order Summary</h2>

                {/* Cart Items - Responsive */}
                <div className="mb-4 space-y-3 xs:mb-6 xs:space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 xs:space-x-3">
                      <img
                        src={item.product?.images?.[0]?.url || "/placeholder.svg?height=64&width=64"}
                        alt={item.product?.name || "Product"}
                        className="object-cover w-12 h-12 rounded-lg xs:w-16 xs:h-16"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium truncate xs:text-sm">
                          {item.product?.name || "Product Name"}
                        </h3>
                        <p className="text-xs text-gray-600">
                          Size: {item.size || "M"} | Qty: {item.quantity || 1}
                        </p>
                        <p className="text-xs font-semibold xs:text-sm">₹{item.product?.price || 0}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown - Responsive */}
                <div className="pt-4 space-y-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cartSummary.totalItems || 0} items)</span>
                    <span>₹{calculateFinalPricing.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className={calculateFinalPricing.shippingCharges === 0 ? "text-green-600" : ""}>
                      {calculateFinalPricing.shippingCharges === 0
                        ? "FREE"
                        : `₹${calculateFinalPricing.shippingCharges}`}
                    </span>
                  </div>
                  {selectedShippingRate && (
                    <div className="text-xs text-gray-500">via {selectedShippingRate.courier_name}</div>
                  )}
                  {calculateFinalPricing.shippingCharges === 0 && !selectedShippingRate && (
                    <div className="flex items-center text-xs text-green-600">
                      <Truck className="w-3 h-3 mr-1" />
                      <span>Free shipping on orders above ₹399</span>
                    </div>
                  )}
                  {calculateFinalPricing.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{calculateFinalPricing.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 text-base font-semibold border-t xs:text-lg">
                    <span>Total</span>
                    <span>₹{calculateFinalPricing.total}</span>
                  </div>
                </div>

                {/* Security Badge - Responsive */}
                <div className="flex items-center justify-center mt-4 text-xs text-gray-600">
                  <Shield className="w-3 h-3 mr-1 xs:w-4 xs:h-4" />
                  <span>Secure checkout powered by Razorpay</span>
                </div>

                {/* Desktop Confirm Order Button - Responsive */}
                <div className="hidden md:block mt-6">
                  <button
                    onClick={() => setShowModal(true)}
                    disabled={orderLoading.creating || !cartItems.length}
                    className="flex items-center justify-center w-full py-3 xs:py-4 text-sm xs:text-base font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {orderLoading.creating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2 xs:w-5 xs:h-5" />
                        Confirm Order ₹{calculateFinalPricing.total}
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-xs text-center text-gray-500">
                    By placing your order, you agree to our Terms & Conditions
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced responsive styles */}
        <style>{`
          @media (min-width: 475px) {
            .xs\\:py-6 {
              padding-top: 1.5rem;
              padding-bottom: 1.5rem;
            }
            .xs\\:px-4 {
              padding-left: 1rem;
              padding-right: 1rem;
            }
            .xs\\:mb-8 {
              margin-bottom: 2rem;
            }
            .xs\\:text-3xl {
              font-size: 1.875rem;
              line-height: 2.25rem;
            }
            .xs\\:text-base {
              font-size: 1rem;
              line-height: 1.5rem;
            }
            .xs\\:mb-6 {
              margin-bottom: 1.5rem;
            }
            .xs\\:space-y-6 > :not([hidden]) ~ :not([hidden]) {
              --tw-space-y-reverse: 0;
              margin-top: calc(1.5rem * calc(1 - var(--tw-space-y-reverse)));
              margin-bottom: calc(1.5rem * var(--tw-space-y-reverse));
            }
            .xs\\:p-6 {
              padding: 1.5rem;
            }
            .xs\\:w-5 {
              width: 1.25rem;
            }
            .xs\\:h-5 {
              height: 1.25rem;
            }
            .xs\\:text-xl {
              font-size: 1.25rem;
              line-height: 1.75rem;
            }
            .xs\\:gap-4 {
              gap: 1rem;
            }
            .xs\\:text-sm {
              font-size: 0.875rem;
              line-height: 1.25rem;
            }
            .xs\\:px-3 {
              padding-left: 0.75rem;
              padding-right: 0.75rem;
            }
            .xs\\:flex-row {
              flex-direction: row;
            }
            .xs\\:items-center {
              align-items: center;
            }
            .xs\\:space-y-0 > :not([hidden]) ~ :not([hidden]) {
              --tw-space-y-reverse: 0;
              margin-top: calc(0px * calc(1 - var(--tw-space-y-reverse)));
              margin-bottom: calc(0px * var(--tw-space-y-reverse));
            }
            .xs\\:w-4 {
              width: 1rem;
            }
            .xs\\:h-4 {
              height: 1rem;
            }
            .xs\\:self-auto {
              align-self: auto;
            }
            .xs\\:space-x-3 > :not([hidden]) ~ :not([hidden]) {
              --tw-space-x-reverse: 0;
              margin-right: calc(0.75rem * var(--tw-space-x-reverse));
              margin-left: calc(0.75rem * calc(1 - var(--tw-space-x-reverse)));
            }
            .xs\\:w-16 {
              width: 4rem;
            }
            .xs\\:h-16 {
              height: 4rem;
            }
            .xs\\:text-lg {
              font-size: 1.125rem;
              line-height: 1.75rem;
            }
            .xs\\:py-3 {
              padding-top: 0.75rem;
              padding-bottom: 0.75rem;
            }
            .xs\\:mt-6 {
              margin-top: 1.5rem;
            }
          }

          /* Touch-friendly mobile optimizations */
          @media (max-width: 640px) {
            .sticky {
              position: relative;
            }

            input,
            button {
              min-height: 44px;
            }

            .grid {
              gap: 1rem;
            }
          }
        `}</style>
      </div>

      {/* Bottom padding to prevent content overlap with fixed button - Mobile Only */}
      <div className="pb-32 md:pb-0"></div>
    </div>
  )
}

export default CheckoutPage
