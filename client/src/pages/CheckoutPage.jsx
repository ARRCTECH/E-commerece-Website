 
"use client"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, MapPin, CreditCard, Tag, Truck, Shield, X, Plus, Edit, Trash2, Check, Delete, Mail } from "lucide-react"
import axios from "axios";
import {
  createRazorpayOrder,
  clearError,
  placeCodOrder,
  verifyPayment,
  selectRazorpayOrder,
  selectOrderLoading,
  selectOrderError,
  selectOrderSuccess,
  selectCartItems,
  selectCartSummary,
  selectAppliedCoupon,
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
import { PaymentModal } from "./PaymentModal"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const useBuyNowFlow = (location) => {
  const [isBuyNow, setIsBuyNow] = useState(false)
  const [buyNowProduct, setBuyNowProduct] = useState(null)

  useEffect(() => {
    const savedBuyNowData = localStorage.getItem('buyNowProduct')
    if (location.state?.buyNow) {
      setIsBuyNow(true)
      setBuyNowProduct(location.state.buyNowProduct)
      localStorage.setItem('buyNowProduct', JSON.stringify(location.state.buyNowProduct))
      localStorage.setItem('isBuyNow', 'true')
    } else if (savedBuyNowData) {
      setIsBuyNow(true)
      setBuyNowProduct(JSON.parse(savedBuyNowData))
    } else {
      setIsBuyNow(false)
      setBuyNowProduct(null)
    }
  }, [location.state])

  const clearBuyNowData = useCallback(() => {
    localStorage.removeItem('buyNowProduct')
    localStorage.removeItem('isBuyNow')
  }, [])

  return { isBuyNow, buyNowProduct, clearBuyNowData }
}

const useAddressManagement = (user) => {
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showAddressPopup, setShowAddressPopup] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)

  useEffect(() => {
    const savedAddresses = localStorage.getItem('userAddresses')
    if (savedAddresses) {
      try {
        const parsedAddresses = JSON.parse(savedAddresses)
        setAddresses(parsedAddresses)
        const defaultAddress = parsedAddresses.find(addr => addr.isDefault) || parsedAddresses[0]
        if (defaultAddress) {
          setSelectedAddress(defaultAddress)
        }
      } catch (error) {
        console.error('Error loading addresses:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (addresses.length > 0) {
      localStorage.setItem('userAddresses', JSON.stringify(addresses))
    }
  }, [addresses])

  const addAddress = useCallback((addressData) => {
    const newAddress = {
      id: `addr_${Date.now()}`,
      ...addressData,
      isDefault: addresses.length === 0,
      createdAt: new Date().toISOString()
    }
    setAddresses(prev => {
      const updatedAddresses = [...prev, newAddress]
      return updatedAddresses
    })
    if (addresses.length === 0 || addressData.isDefault) {
      setSelectedAddress(newAddress)
    }
  }, [addresses.length])

  const updateAddress = useCallback((addressId, addressData) => {
    setAddresses(prev =>
      prev.map(addr =>
        addr.id === addressId
          ? { ...addr, ...addressData, updatedAt: new Date().toISOString() }
          : addr
      )
    )
    if (selectedAddress?.id === addressId) {
      setSelectedAddress(prev => ({ ...prev, ...addressData }))
    }
  }, [selectedAddress])

  const deleteAddress = useCallback((addressId) => {
    setAddresses(prev => {
      const filteredAddresses = prev.filter(addr => addr.id !== addressId)
      if (selectedAddress?.id === addressId && filteredAddresses.length > 0) {
        const newSelected = filteredAddresses.find(addr => addr.isDefault) || filteredAddresses[0]
        setSelectedAddress(newSelected)
      }
      return filteredAddresses
    })
  }, [selectedAddress])

  const setDefaultAddress = useCallback((addressId) => {
    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }))
    )
    const newDefault = addresses.find(addr => addr.id === addressId)
    if (newDefault) {
      setSelectedAddress(newDefault)
    }
  }, [addresses])

  const startEditing = useCallback((address) => {
    setEditingAddress(address)
    setShowAddressPopup(true)
  }, [])

  const startAdding = useCallback(() => {
    setEditingAddress(null)
    setShowAddressPopup(true)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingAddress(null)
    setShowAddressPopup(false)
  }, [])

  const handleSaveAddress = useCallback((addressData) => {
    if (editingAddress) {
      updateAddress(editingAddress.id, addressData)
    } else {
      addAddress(addressData)
    }
    cancelEditing()
  }, [editingAddress, updateAddress, addAddress, cancelEditing])

  return {
    addresses,
    selectedAddress,
    setSelectedAddress,
    showAddressPopup,
    editingAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    startEditing,
    startAdding,
    cancelEditing,
    handleSaveAddress,
    setShowAddressPopup
  }
}

const AddressPopup = ({ isOpen, onClose, onSave, editingAddress, user }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    landmark: "",
    addressType: "home",
    isDefault: false
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editingAddress) {
      setFormData({
        fullName: editingAddress.fullName || "",
        email: editingAddress.email || "",
        phoneNumber: editingAddress.phoneNumber || "",
        addressLine1: editingAddress.addressLine1 || "",
        addressLine2: editingAddress.addressLine2 || "",
        city: editingAddress.city || "",
        state: editingAddress.state || "",
        pinCode: editingAddress.pinCode || "",
        landmark: editingAddress.landmark || "",
        addressType: editingAddress.addressType || "home",
        isDefault: editingAddress.isDefault || false
      })
    } else {
      setFormData(prev => ({
        ...prev,
        fullName: user?.name || "",
        email: user?.email || "",
        phoneNumber: user?.phoneNumber?.replace("+91", "") || "",
      }))
    }
  }, [editingAddress, user, isOpen])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required"
    else if (!/^[6789]\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid 10-digit mobile number"
    }
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.state.trim()) newErrors.state = "State is required"
    if (!formData.pinCode.trim()) newErrors.pinCode = "PIN code is required"
    else if (!/^[1-9][0-9]{5}$/.test(formData.pinCode)) {
      newErrors.pinCode = "Please enter a valid 6-digit PIN code"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  const addressTypeOptions = [
    { value: "home", label: "🏠 Home", icon: "🏠" },
    { value: "work", label: "💼 Work", icon: "💼" },
    { value: "other", label: "📦 Other", icon: "📦" }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm rounded-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md max-h-[75vh] bg-white rounded-md shadow-xl border border-gray-300 flex flex-col"
      >
        {/* Compact Header with Red Theme */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-white">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 bg-red-50 rounded-md border border-red-200">
              <MapPin className="w-3 h-3 text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">
              {editingAddress ? "Edit Address" : "Add Address"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Form Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Details - Added Email Field */}
            <div className="grid gap-3">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors ${errors.fullName ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  placeholder="Enter full name"
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
              </div>

              {/* Added Email Field */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Email Address *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 text-sm border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-r-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors ${errors.email ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Phone Number *</label>
                <div className={`flex rounded-lg overflow-hidden border transition-colors ${errors.phoneNumber ? "border-red-500" : "border-gray-300 hover:border-gray-400"
                  } focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500`}>
                  <span className="inline-flex items-center px-3 py-2 text-sm border-r border-gray-300 bg-gray-50 text-gray-600">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={`flex-1 px-3 py-2 text-sm outline-none ${errors.phoneNumber ? "bg-red-50" : "bg-white"
                      }`}
                    placeholder="10-digit mobile number"
                  />
                </div>
                {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* Address Type */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Address Type</label>
              <div className="grid grid-cols-3 gap-2">
                {addressTypeOptions.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleChange("addressType", type.value)}
                    className={`flex items-center justify-center p-2 border rounded-lg text-xs font-medium transition-all ${formData.addressType === type.value
                      ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                      : "border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-25"
                      }`}
                  >
                    <span className="mr-1">{type.icon}</span>
                    {type.label.split(" ")[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-3">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors ${errors.addressLine1 ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  placeholder="House/Flat No., Building, Street"
                />
                {errors.addressLine1 && <p className="mt-1 text-xs text-red-500">{errors.addressLine1}</p>}
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  Address Line 2 <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => handleChange("addressLine2", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors hover:border-gray-400"
                  placeholder="Area, Colony, Locality"
                />
              </div>
            </div>

            {/* Location Details */}
            <div className="grid gap-3 grid-cols-2">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors ${errors.city ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  placeholder="City"
                />
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">State *</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors ${errors.state ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  placeholder="State"
                />
                {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
              </div>

              <div className="col-span-2">
                <label className="block mb-1.5 text-sm font-medium text-gray-700">PIN Code *</label>
                <input
                  type="text"
                  value={formData.pinCode}
                  onChange={(e) => handleChange("pinCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors ${errors.pinCode ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  placeholder="6-digit PIN code"
                />
                {errors.pinCode && <p className="mt-1 text-xs text-red-500">{errors.pinCode}</p>}
              </div>
            </div>

            {/* Landmark */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">
                Landmark <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => handleChange("landmark", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors hover:border-gray-400"
                placeholder="Nearby landmark"
              />
            </div>

            {/* Default Address Toggle */}
            <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">Set as default address</p>
                <p className="text-xs text-gray-500">Selected by default for future orders</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange("isDefault", !formData.isDefault)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full border border-transparent transition-colors ${formData.isDefault ? "bg-red-600" : "bg-gray-300 hover:bg-gray-400"
                  }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white border border-gray-300 transition-transform ${formData.isDefault ? "translate-x-5" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
          </form>
        </div>

        {/* Compact Footer Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-300 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 transition-all"
          >
            {editingAddress ? "Update" : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const AddressList = ({
  addresses,
  selectedAddress,
  onSelectAddress,
  onEditAddress,
  onDeleteAddress,
  onSetDefault,
  onAddNew
}) => {
  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'home': return '🏠'
      case 'work': return '💼'
      case 'other': return '📦'
      default: return '📍'
    }
  }

  const getAddressTypeLabel = (type) => {
    switch (type) {
      case 'home': return 'Home'
      case 'work': return 'Work'
      case 'other': return 'Other'
      default: return 'Address'
    }
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">No addresses saved</h3>
        <p className="mb-4 text-sm text-gray-600">Add your first address to continue with checkout</p>
        <button
          onClick={onAddNew}
          className="px-6 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
        >
          Add Your First Address
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <div
          key={address.id}
          className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedAddress?.id === address.id
            ? "border-red-500 bg-red-50 ring-2 ring-red-500 ring-opacity-20"
            : "border-gray-200 hover:border-gray-300"
            }`}
          onClick={() => onSelectAddress(address)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="mr-2 text-lg">{getAddressTypeIcon(address.addressType)}</span>
                <span className="text-sm font-medium text-gray-900">
                  {getAddressTypeLabel(address.addressType)}
                  {address.isDefault && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Default</span>
                  )}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="font-medium">{address.fullName}</p>
                <p>{address.email}</p>
                <p>+91 {address.phoneNumber}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}, {address.state} - {address.pinCode}
                </p>
                {address.landmark && <p className="text-xs text-gray-500">Landmark: {address.landmark}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-1 ml-3">
              {!address.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSetDefault(address.id)
                  }}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Set as default"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditAddress(address)
                }}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit address"
              >
                <Edit className="w-4 h-4" />
              </button>
              {addresses.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm("Are you sure you want to delete this address?")) {
                      onDeleteAddress(address.id)
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={onAddNew}
        className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-colors group"
      >
        <Plus className="w-5 h-5 mr-2 text-gray-400 group-hover:text-red-500" />
        <span className="text-sm font-medium text-gray-600 group-hover:text-red-600">Add New Address</span>
      </button>
    </div>
  )
}

const CheckoutPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const rzpInstanceRef = useRef(null)

  const { isBuyNow, buyNowProduct, clearBuyNowData } = useBuyNowFlow(location)
  const user = useSelector(selectUser)
  const cartItems = useSelector(selectCartItems)
  const cartSummary = useSelector(selectCartSummary)
  const razorpayOrder = useSelector(selectRazorpayOrder)
  const orderLoading = useSelector(selectOrderLoading)
  const orderError = useSelector(selectOrderError)
  const orderSuccess = useSelector(selectOrderSuccess)
  const appliedCoupon = useSelector(selectAppliedCoupon)
  const couponLoading = useSelector((state) => state.coupons.loading)
  const couponError = useSelector((state) => state.coupons.error)

  const {
    addresses,
    selectedAddress,
    setSelectedAddress,
    showAddressPopup,
    editingAddress,
    deleteAddress,
    setDefaultAddress,
    startEditing,
    startAdding,
    cancelEditing,
    handleSaveAddress
  } = useAddressManagement(user)

  const [couponCode, setCouponCode] = useState("")
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [congratulationsData, setCongratulationsData] = useState({
    couponCode: "",
    savingsAmount: 0,
  })
  const [showExitWarning, setshowExitWarning] = useState(false);
  const [showExitWarningS, setshowExitWarningS] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  const token = localStorage.getItem('authToken')

  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch(`${API_URL}/coupons/available`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch coupons: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setCoupons(data.coupons || data);
      } catch (err) {
        console.error('Error fetching coupons:', err);
      }
    };
    fetchCoupons();
  }, [token]);

  const filterYCoupon = coupons.filter((coupon) => coupon.isFreeCoupon !== "N")
  const filterNCoupon = coupons.filter((coupon) => coupon.isFreeCoupon !== "Y")

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes')
    }
    const checkFontSize = () => {
      const inputs = document.querySelectorAll('input, select, textarea')
      inputs.forEach(input => {
        const computedStyle = window.getComputedStyle(input)
        const fontSize = parseFloat(computedStyle.fontSize)
        if (fontSize < 16) {
          input.style.fontSize = '16px'
        }
      })
    }
    setTimeout(checkFontSize, 100)
    return () => {
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1')
      }
    }
  }, [])

  useEffect(() => {
    dispatch(removeCoupon())
    setCouponCode("")
    setShowCouponInput(false)
    if (rzpInstanceRef.current) {
      rzpInstanceRef.current.close()
      rzpInstanceRef.current = null
    }
    return () => {
      if (rzpInstanceRef.current) {
        rzpInstanceRef.current.close()
        rzpInstanceRef.current = null
      }
    }
  }, [dispatch])

  useEffect(() => {
    if (Object.keys(user).length !== 0) {
      dispatch(fetchAvailableCoupons())
    }
  }, [dispatch, user])

  useEffect(() => {
    if (appliedCoupon && appliedCoupon.discountAmount > 0) {
      setCongratulationsData({
        couponCode: appliedCoupon.code,
        savingsAmount: appliedCoupon.discountAmount,
      })
      setShowCongratulationsPopup(true)
      const timer = setTimeout(() => {
        setShowCongratulationsPopup(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [appliedCoupon])

  const handleApplyCoupon = useCallback(() => {
    if (!couponCode.trim()) return
    const orderValue = isBuyNow && buyNowProduct ? buyNowProduct.product.price * buyNowProduct.quantity : cartSummary.subtotal || 0
    dispatch(validateCoupon({ code: couponCode, cartTotal: orderValue }))
  }, [couponCode, cartSummary.subtotal, dispatch, isBuyNow, buyNowProduct])

  const handleRemoveCoupon = useCallback(() => {
    dispatch(removeCoupon())
    setCouponCode("")
    setShowCouponInput(false)
  }, [dispatch])

  const calculateFinalPricing = useMemo(() => {
    let subtotal = 0
    if (isBuyNow && buyNowProduct) {
      subtotal = buyNowProduct.product.price * buyNowProduct.quantity
    } else {
      subtotal = cartSummary.subtotal || 0
    }
    const shippingCharges = subtotal >= 399 ? 0 : 99
    const discount = appliedCoupon?.discountAmount || 0
    const freediscount = filterYCoupon[0]?.discountType == "flat" ? filterYCoupon[0]?.discountValue : subtotal * (filterYCoupon[0]?.discountValue) / 100 || 0
    const totalSaving = discount + freediscount
    const totalValue = Math.round(subtotal + shippingCharges - discount - freediscount)
    let total = 0
    if (totalValue > 0) {
      total = totalValue
    }
    return {
      subtotal,
      shippingCharges,
      discount,
      totalSaving,
      total,
      freediscount
    }
  }, [cartSummary.subtotal, appliedCoupon, isBuyNow, buyNowProduct, filterYCoupon])

  const getDisplayItems = useCallback(() => {
    if (isBuyNow && buyNowProduct) {
      return [{
        product: buyNowProduct.product,
        quantity: buyNowProduct.quantity,
        size: buyNowProduct.size,
        color: buyNowProduct.color
      }]
    } else {
      return cartItems
    }
  }, [isBuyNow, buyNowProduct, cartItems])

  const validateOrder = useCallback(() => {
    if (!selectedAddress) {
      alert("Please select a shipping address")
      return false
    }
    const displayItems = getDisplayItems()
    if (!displayItems.length) {
      alert("No items to order")
      return false
    }
    return true
  }, [selectedAddress, getDisplayItems])

  const createOrderData = useCallback(() => ({
    items: getDisplayItems().map((item) => ({
      productId: item.product?._id,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
    shippingAddress: {
      ...selectedAddress,
      phoneNumber: `+91${selectedAddress.phoneNumber}`,
    },
    couponCode: appliedCoupon?.code || "",
    isBuyNow: isBuyNow
  }), [getDisplayItems, selectedAddress, appliedCoupon, isBuyNow])

  const handlePlaceOrder = useCallback(() => {
    if (rzpInstanceRef.current) {
      rzpInstanceRef.current.close()
      rzpInstanceRef.current = null
    }
    if (!validateOrder()) return
    const orderData = {
      amount: calculateFinalPricing.total,
      freediscount: calculateFinalPricing.freediscount,
      ...createOrderData()
    }
    dispatch(createRazorpayOrder(orderData))
    setShowPaymentModal(false)
  }, [validateOrder, calculateFinalPricing.total, createOrderData, dispatch, calculateFinalPricing.freediscount])

  const handlePlaceCodOrder = useCallback((opts = {}) => {
    if (rzpInstanceRef.current) {
      rzpInstanceRef.current.close()
      rzpInstanceRef.current = null
    }
    const orderData = {
      amount: Math.round((calculateFinalPricing.total || 0)),
      freediscount: calculateFinalPricing.freediscount,
      ...createOrderData(),
    }
    if (!validateOrder()) return
    dispatch(placeCodOrder(orderData)).then((result) => {
      if (result.type === "order/placeCodOrder/fulfilled") {
        clearBuyNowData()
        navigate(`/order-confirmation/${result.payload.order.id}`)
      } else {
        console.error("COD Order failed:", result.error)
        alert("Failed to place COD order. Please try again.")
      }
    })
  }, [validateOrder, createOrderData, dispatch, navigate, clearBuyNowData, calculateFinalPricing.total, calculateFinalPricing.freediscount])

  const handleRazorpayPayment = useCallback(() => {
    if (!razorpayOrder || !selectedAddress) return
    if (rzpInstanceRef.current) {
      rzpInstanceRef.current.close()
      rzpInstanceRef.current = null
    }
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "KsauniBliss",
      description: "KsauniBliss Purchase",
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
            clearBuyNowData()
            navigate(`/order-confirmation/${result.payload.order.id}`)
          }
        })
      },
      prefill: {
        name: selectedAddress.fullName,
        email: selectedAddress.email || user?.email || "", // Use address email first
        contact: `+91${selectedAddress.phoneNumber}`,
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
  }, [razorpayOrder, selectedAddress, user, dispatch, navigate, clearBuyNowData])

  useEffect(() => {
    if (!isBuyNow && !cartItems.length) {
      dispatch(fetchCart())
    }
  }, [dispatch, cartItems.length, isBuyNow])

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

  const displayItems = getDisplayItems()
  const hasItems = displayItems.length > 0

  const [selectedReasons, setSelectedReasons] = useState([]);
  const [othersText, setOthersText] = useState('');
  const [isOthersSelected, setIsOthersSelected] = useState(false);

  const handlereasondata = (event) => {
    const { value, checked } = event.target;
    if (value === "Others") {
      setIsOthersSelected(checked);
    }
    if (checked) {
      setSelectedReasons([...selectedReasons, value]);
    } else {
      setSelectedReasons(selectedReasons.filter(reason => reason !== value));
    }
  };
  const handleOthersTextChange = (event) => {
    setOthersText(event.target.value);
  };

  const handleBackButton = () => {
    setshowExitWarning(true)
    setShowPaymentModal(false)
  }

  useEffect(() => {
    window.history.pushState({ page: 1 }, "", window.location.href);
    const onBackButtonEvent = (e) => {
      e.preventDefault();
      handleBackButton();
      window.history.pushState({ page: 1 }, "", window.location.href);
    };
    window.addEventListener("popstate", onBackButtonEvent);
    return () => {
      window.removeEventListener("popstate", onBackButtonEvent);
    };
  }, []);

  const handleContinueCheckout = () => {
    setshowExitWarning(false)
    setshowExitWarningS(false)
  }
  const handleExitButton = () => {
    setshowExitWarningS(true)
    setshowExitWarning(false)
  }
  const handleSaveAndExit = async (e) => {
    e.preventDefault();
    setshowExitWarningS(false);
    navigate('/cart');
    let finalReasons = [...selectedReasons];
    if (isOthersSelected) {
      finalReasons = finalReasons.filter(r => r !== "Others");
      finalReasons.push(othersText || "Others");
    }
    const payload = {
      cancellationReasons: finalReasons
    };
    try {
      const response = await axios.post(
        `${API_URL}/reason/cancellation`,
        payload
      );
      console.log("Saved successfully:", response.data);
    } catch (error) {
      console.error("Failed to save reasons:", error);
    }
  };

  const handlePaymentMethod = () => {
    setshowExitWarning(false)
    setShowPaymentModal(true)
  }

  useEffect(() => {
    const couponCode = filterYCoupon[0]?.code;
    setCongratulationsData({
      couponCode: couponCode || "",
      savingsAmount: couponCode ? calculateFinalPricing.freediscount : 0,
    });
    if (!couponCode) return;
    setShowCongratulationsPopup(true);
    const timer = setTimeout(() => {
      setShowCongratulationsPopup(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [filterYCoupon[0]?.code]);

  const getRandomHighDemandMessage = () => {
    const messages = [
      "High Demand! 92% claimed their free gift today!",
      "Limited Stock! Only 12 free gifts remaining!",
      "Popular Choice! 500+ claimed in last hour!",
      "Almost Gone! Free gifts running out fast!",
      "Hot Item! 95% of customers grab this gift!",
      "Last Chance! Free gift offer ends soon!",
      "Going Fast! 87% conversion rate today!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (!hasItems && !orderLoading.creating) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 safe-area-bottom">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400 xs:w-16 xs:h-16" />
          <h2 className="mb-2 text-xl font-bold text-gray-800 xs:text-2xl">No items to checkout</h2>
          <p className="mb-4 text-sm text-gray-600 xs:text-base">
            {isBuyNow ? "Buy Now product not found" : "Add some items to your cart to proceed with checkout"}
          </p>
          <button
            onClick={() => {
              clearBuyNowData()
              navigate("/")
            }}
            className="px-4 py-2 text-sm text-white transition-colors bg-red-600 rounded-xl xs:px-6 xs:text-base hover:bg-red-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 md:pb-12 safe-area-bottom prevent-zoom">
      <style>{`
        .prevent-zoom {
          font-size: 16px;
        }
        .prevent-zoom input, 
        .prevent-zoom select, 
        .prevent-zoom textarea {
          font-size: 16px !important;
          min-height: 44px;
        }
        @media (max-width: 620px) {
          .prevent-zoom {
            touch-action: pan-y pinch-zoom;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 xs:py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Centered Header Section */}
          <div className="mb-4 xs:mb-6 sm:mb-8 text-left">
            <button className="flex items-left justify-left mx-auto mb-4 font-bold text-xl min-w-full">
              <FontAwesomeIcon icon={faArrowLeft} onClick={handleBackButton} />
            </button>

            <div className="flex justify-center items-center">
              <h1 className="text-2xl xs:text-3xl font-bold text-gray-800">
                Checkout
              </h1>
            </div>
          </div>

          {/* Centered Error Messages */}
          {(orderError || couponError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 xs:py-3 mb-3 xs:mb-4 text-xs xs:text-sm border border-red-200 rounded-xl bg-red-50 text-red-700 text-center mx-auto max-w-2xl"
            >
              {orderError || couponError}
            </motion.div>
          )}

          {/* Centered Main Content */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl lg:max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
                {/* Left Column - Centered on mobile */}
                <div className="flex flex-col items-center lg:col-span-2 space-y-3 xs:space-y-4 sm:space-y-6">
                  {/* Shipping Address Card */}
                  <div className="w-full max-w-2xl lg:max-w-none">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-3 xs:p-4 sm:p-6 bg-white rounded-xl shadow-sm xs:shadow-md mx-auto w-full"
                    >
                      <div className="flex items-center justify-between mb-3 xs:mb-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-red-600 xs:w-5 xs:h-5" />
                          <h2 className="text-base xs:text-lg font-semibold">Shipping Address</h2>
                        </div>

                        {addresses.length > 0 && (
                          <button
                            onClick={startAdding}
                            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add New
                          </button>
                        )}
                      </div>
                      <AddressList
                        addresses={addresses}
                        selectedAddress={selectedAddress}
                        onSelectAddress={setSelectedAddress}
                        onEditAddress={startEditing}
                        onDeleteAddress={deleteAddress}
                        onSetDefault={setDefaultAddress}
                        onAddNew={startAdding}
                      />
                      {selectedAddress && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 md:hidden">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">Selected Address:</span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {selectedAddress.addressLine1}, {selectedAddress.city} - {selectedAddress.pinCode}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Promo Codes Card */}
                  <div className="w-full max-w-2xl lg:max-w-none">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                      className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 mx-auto w-full"
                    >
                      {/* Compact Professional Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-5 h-5 bg-red-50 rounded-md mr-2">
                            <Tag className="w-3 h-3 text-red-600" />
                          </div>
                          <h2 className="text-sm font-semibold text-gray-800">Promo Codes</h2>
                        </div>

                        {/* Apply Button in Corner */}
                        {!appliedCoupon && (
                          <button
                            onClick={handleApplyCoupon}
                            disabled={!couponCode.trim() || couponLoading?.validating}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[60px] flex items-center justify-center"
                          >
                            {couponLoading?.validating ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </button>
                        )}
                      </div>

                      {appliedCoupon ? (
                        /* Applied Coupon - Professional Compact */
                        <motion.div
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className="flex items-center justify-between p-2 bg-green-50 rounded-md border border-green-200"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-4 h-4 bg-green-100 rounded-full">
                              <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-green-800">{appliedCoupon.code}</p>
                              <p className="text-[10px] text-green-600">-₹{appliedCoupon.discountAmount}</p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveCoupon}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ) : (
                        /* Compact Input Section */
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="Enter promo code"
                              className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                            />
                            {couponCode && (
                              <button
                                onClick={() => setCouponCode('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          {/* Available Coupons - Professional Compact */}
                          {displayItems.map((item) => {
                            const matchedCoupons = filterNCoupon.filter(
                              (coupon) => item.product?.category?.name === coupon.couponcategories
                            )
                            if (matchedCoupons.length === 0) return null;
                            return (
                              <div key={item._id} className="border-t pt-2">
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                  {matchedCoupons.map((coupon, index) => {
                                    const subtotal = calculateFinalPricing?.subtotal || 0;
                                    const min = coupon.minOrderValue || 0;
                                    const eligible = subtotal >= min;
                                    const shortBy = Math.max(0, min - subtotal);

                                    return (
                                      <motion.div
                                        key={coupon.code}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`p-2 rounded-md border transition-all ${eligible
                                          ? 'border-red-200 bg-red-50 hover:border-red-300'
                                          : 'border-gray-200 bg-gray-50'
                                          }`}
                                      >
                                        {/* Description */}
                                        <h3
                                          className={`text-sm font-semibold leading-tight ${eligible ? 'text-gray-900' : 'text-gray-600'
                                            }`}
                                        >
                                          {coupon.description || 'Special Discount'}
                                        </h3>

                                        {/* Details */}
                                        <div className="flex items-center justify-between mt-1">
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className={`text-xs font-mono font-medium ${eligible ? 'text-red-700' : 'text-gray-500'
                                                }`}
                                            >
                                              {coupon.code}
                                            </span>

                                            {min > 0 && (
                                              <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border">
                                                Min ₹{min}
                                              </span>
                                            )}
                                          </div>

                                          {eligible ? (
                                            <button
                                              onClick={() => {
                                                setCouponCode(coupon.code);
                                                dispatch(
                                                  validateCoupon({
                                                    code: coupon.code,
                                                    cartTotal: subtotal,
                                                  })
                                                );
                                              }}
                                              className="px-2 py-1 text-[10px] font-bold text-white bg-red-600 rounded hover:bg-red-700"
                                            >
                                              APPLY NOW
                                            </button>
                                          ) : (
                                            <span className="text-[10px] text-orange-600 font-medium">
                                              +₹{shortBy}
                                            </span>
                                          )}
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Right Column - Centered on mobile */}
                <div className="flex justify-center lg:col-span-1">
                  <div className="w-full max-w-md lg:max-w-none">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="sticky p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-200 top-4"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">
                          Order Summary
                        </h2>
                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Truck className="w-3 h-3 mr-1" />
                          {calculateFinalPricing.shippingCharges === 0 ? "Free Shipping" : "Shipping: ₹99"}
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="mb-4 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {displayItems.map((item, index) => (
                          <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <img
                              src={item.product?.images?.[0]?.url || "/placeholder.svg?height=64&width=64"}
                              alt={item.product?.name || "Product"}
                              className="object-cover w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex-shrink-0 border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {item.product?.name || "Product Name"}
                              </h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                                  Size: {item.size || "M"}
                                </span>
                                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                                  Qty: {item.quantity || 1}
                                </span>
                                {item.color && (
                                  <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                                    Color: {item.color}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-gray-900 mt-1">
                                ₹{(item.product?.price || 0) * (item.quantity || 1)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pricing Breakdown */}
                      <div className="pt-4 space-y-3 border-t border-gray-200">
                        {/* Subtotal */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Subtotal ({displayItems.length} {displayItems.length === 1 ? 'item' : 'items'})
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            ₹{calculateFinalPricing.subtotal}
                          </span>
                        </div>

                        {/* Applied Coupon Discount */}
                        {calculateFinalPricing.discount > 0 && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="text-sm text-green-600 font-medium">
                                Coupon Discount
                              </span>
                              {appliedCoupon && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  {appliedCoupon.code}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-green-600">
                              -₹{calculateFinalPricing.discount}
                            </span>
                          </div>
                        )}

                        {/* Free Coupon Discount */}
                        {calculateFinalPricing.freediscount > 0 && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="text-sm text-blue-600 font-medium">
                                Free Coupon Discount
                              </span>
                              {filterYCoupon.length > 0 && filterYCoupon[0]?.discountType == "percentage" && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {filterYCoupon[0]?.discountValue} % OFF
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-blue-600">
                              -₹{calculateFinalPricing.freediscount}
                            </span>
                          </div>
                        )}

                        {/* Shipping Charges */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Shipping</span>
                          <span className={`text-sm font-medium ${calculateFinalPricing.shippingCharges === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {calculateFinalPricing.shippingCharges === 0 ? 'FREE' : `₹${calculateFinalPricing.shippingCharges}`}
                          </span>
                        </div>

                        {/* Total Savings */}
                        {calculateFinalPricing.totalSaving > 0 && (
                          <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
                            <span className="text-sm font-medium text-green-800">Total Savings</span>
                            <span className="text-sm font-bold text-green-800">
                              ₹{calculateFinalPricing.totalSaving}
                            </span>
                          </div>
                        )}

                        {/* Grand Total */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                          <span className="text-lg font-bold text-gray-900">Grand Total</span>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{calculateFinalPricing.total}
                            </span>
                            {calculateFinalPricing.total < calculateFinalPricing.subtotal && (
                              <div className="text-xs text-gray-500 line-through">
                                ₹{calculateFinalPricing.subtotal + calculateFinalPricing.shippingCharges}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Security Badge */}
                      <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                          <Shield className="w-4 h-4 mr-2 text-green-500" />
                          <span>Secure checkout • 100% Safe • SSL Encrypted</span>
                        </div>
                      </div>

                      {/* Continue Button */}
                      <div className="mt-6 hidden md:block">
                        {selectedAddress ? (
                          <button
                            onClick={handlePaymentMethod}
                            disabled={orderLoading.creating || !displayItems.length}
                            className="flex items-center justify-center w-full py-4 text-base font-bold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {orderLoading.creating ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Processing Order...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Proceed to Payment
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={startAdding}
                            disabled={orderLoading.creating || !displayItems.length}
                            className="flex items-center justify-center w-full py-4 text-base font-bold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {orderLoading.creating ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Processing Order...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Proceed to Payment
                              </>
                            )}
                          </button>
                        )}
                        {/* Helper Text */}
                        {(!displayItems.length || !selectedAddress) && (
                          <p className="text-xs text-red-500 text-center mt-2">
                            {!displayItems.length && "Add items to cart to continue"}
                            {!selectedAddress && displayItems.length > 0 && "Please select a shipping address"}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Centered Mobile Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 xs:p-4 z-40 safe-area-bottom md:hidden">
          <div className="max-w-md mx-auto">
            {selectedAddress ? (
              <button
                onClick={handlePaymentMethod}
                disabled={orderLoading.creating || !displayItems.length}
                className="flex items-center justify-center w-full py-2 text-sm xs:text-base font-semibold text-white bg-red-600 rounded-[10px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-colors"
              >
                {orderLoading.creating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 xs:w-5 xs:h-5 mr-2" />
                    Continue
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={startAdding}
                disabled={orderLoading.creating || !displayItems.length}
                className="flex items-center justify-center w-full py-2 text-sm xs:text-base font-semibold text-white bg-red-600 rounded-[10px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-colors"
              >
                {orderLoading.creating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 xs:w-5 xs:h-5 mr-2" />
                    Continue
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showAddressPopup && (
            <AddressPopup
              isOpen={showAddressPopup}
              onClose={cancelEditing}
              onSave={handleSaveAddress}
              editingAddress={editingAddress}
              user={user}
            />
          )}
        </AnimatePresence>

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onOnline={handlePlaceOrder}
                onCOD={(opts) => {
                  handlePlaceCodOrder(opts);
                  setShowPaymentModal(false);
                  setshowExitWarning(false);
                }}
                amount={calculateFinalPricing.total}
              />
            </div>
          </div>
        )}

        {showCongratulationsPopup && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-gradient-to-br from-black/70 via-emerald-900/40 to-green-900/30 backdrop-blur-sm safe-area-top safe-area-bottom md:items-center">
            {/* Auto-close progress bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-300/30 z-30">
              <div
                className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 transition-all duration-5000 ease-linear shadow-lg"
                style={{ width: '100%' }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              transition={{
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1],
                type: "spring",
                stiffness: 120,
                damping: 15
              }}
              className="relative w-full max-w-md p-6 xs:p-8 bg-gradient-to-br from-white via-green-50/90 to-emerald-50/90 rounded-2xl rounded-b-none md:rounded-2xl shadow-2xl border border-white/70 overflow-hidden"
            >
              {/* Animated background elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg"></div>
              <div className="absolute top-4 -right-4 w-24 h-24 bg-green-300/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-300/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>

              {/* Enhanced confetti animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-xl font-bold"
                    initial={{
                      y: -50,
                      x: Math.random() * 100 - 50,
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{
                      y: 600,
                      x: Math.random() * 200 - 100,
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1, 1, 0],
                      rotate: Math.random() * 360
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 0.5,
                      ease: "easeOut"
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                    }}
                  >
                    {['🎉', '🎊', '🥳', '✨', '🌟', '⭐', '💫', '🌠', '💎', '🔥'][Math.floor(Math.random() * 10)]}
                  </motion.div>
                ))}
              </div>
              <div className="text-center relative z-10">
                {/* Enhanced Animated Icon */}
                <div className="mb-5 xs:mb-6">
                  <motion.div
                    className="relative inline-flex items-center justify-center"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.2
                    }}
                  >
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-30"></div>
                    {/* Middle pulse */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse opacity-40 scale-110"></div>
                    {/* Main icon */}
                    <div className="relative inline-flex items-center justify-center w-20 h-20 xs:w-24 xs:h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl shadow-2xl border-2 border-white/50">
                      <motion.span
                        className="text-3xl xs:text-4xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        🎉
                      </motion.span>
                    </div>
                  </motion.div>
                </div>

                {/* Enhanced Title */}
                <motion.h2
                  className="mb-3 xs:mb-4 text-2xl xs:text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Congratulations!
                </motion.h2>

                {/* Enhanced Subtitle */}
                <motion.p
                  className="mb-5 xs:mb-6 text-base xs:text-lg text-gray-700 font-medium"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Your promo code has been applied successfully!
                </motion.p>

                {/* Enhanced Discount Card */}
                <motion.div
                  className="relative p-5 xs:p-6 mb-6 xs:mb-8 bg-gradient-to-br from-white to-green-50 rounded-2xl border-2 border-green-200 shadow-xl transform hover:scale-[1.02] transition-transform duration-300 group"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  whileHover={{ y: -5 }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shine pointer-events-none"></div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3 xs:mb-4">
                      <span className="text-sm xs:text-base font-bold text-green-900 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full border border-green-200/50 shadow-sm">
                        {congratulationsData.couponCode}
                      </span>
                      <span className="text-xl xs:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm">
                        ₹{congratulationsData.savingsAmount} OFF
                      </span>
                    </div>
                    <p className="text-sm xs:text-base text-green-700 font-semibold flex items-center justify-center gap-2">
                      <span className="text-lg">💰</span>
                      You saved ₹{congratulationsData.savingsAmount} on your order!
                    </p>
                  </div>
                </motion.div>

                {/* Enhanced Action Button */}
                <motion.button
                  onClick={() => setShowCongratulationsPopup(false)}
                  className="w-full px-8 xs:px-10 py-4 xs:py-5 text-lg xs:text-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] font-black shadow-2xl hover:shadow-3xl focus:outline-none focus:ring-4 focus:ring-green-400/50 border-2 border-green-500/30 group overflow-hidden relative"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine-fast"></div>

                  <span className="flex items-center justify-center gap-3 relative z-10">
                    Continue Shopping
                    <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </motion.button>

                {/* Enhanced Auto-close timer */}
                <motion.p
                  className="mt-4 text-xs font-medium text-gray-600 bg-white/50 px-3 py-1 rounded-full inline-flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                  Auto-closing in 5 seconds...
                </motion.p>
              </div>
            </motion.div>
          </div>
        )}

        {showExitWarning && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-purple-900/50 to-red-900/40 flex items-end justify-center z-50 md:items-center md:justify-center backdrop-blur-sm">
            {/* Backdrop with enhanced animation */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-black/80 to-purple-900/30 transition-all duration-500 animate-fadeIn"
              onClick={handleContinueCheckout}
            />

            {/* Modal container with enhanced slide-up animation */}
            <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-t-3xl rounded-b-none md:rounded-3xl max-w-md w-full p-6 md:p-8 mx-auto transform transition-all duration-500 ease-out animate-slideUpFromBottom shadow-2xl border border-white/60">
              {/* Decorative elements - Mobile handle */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-gray-400/60 rounded-full md:hidden"></div>

              {/* Desktop decorative line */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-300/80 rounded-full hidden md:block"></div>

              <div className="text-center relative">
                {/* Animated Warning Icon */}
                <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg animate-pulse-slow">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-sm"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Title with gradient text */}
                <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                  Wait! Don't Go Yet!
                </h3>

                {/* Enhanced Message */}
                <div className="mb-6">
                  <p className="text-gray-600 text-base md:text-lg mb-3">
                    You're about to leave behind an exclusive
                  </p>
                  <div className="inline-flex items-center bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-bounce-gentle mb-4">
                    🎁 FREE GIFT 🎁
                  </div>

                  {/* Hourglass High Demand Section */}
                  <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-3 mb-3 animate-pulse-slow">
                    <div className="flex items-center justify-center w-6 h-6">
                      <svg className="w-5 h-5 text-red-500 animate-hourglass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-red-700 text-sm font-semibold">
                      Products in huge demand might run Out of Stock
                    </span>
                  </div>

                  <p className="text-gray-500 text-sm">
                    Complete your purchase to claim this special offer
                  </p>
                </div>

                {/* Enhanced Buttons */}
                <div className="space-y-3 md:space-y-4">
                  <button
                    className="w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white py-3 md:py-4 px-6 rounded-xl font-semibold hover:from-gray-800 hover:to-gray-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-400/30 focus:ring-offset-2 border border-gray-700/20"
                    onClick={handleExitButton}
                  >
                    <span className="flex items-center justify-center gap-2 text-sm md:text-base">
                      Exit Anyway
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  </button>

                  <button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 md:py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-400/30 focus:ring-offset-2 border border-green-600/20 group"
                    onClick={handleContinueCheckout}
                  >
                    <span className="flex items-center justify-center gap-2 text-sm md:text-base">
                      Continue & Claim Gift
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                </div>

                {/* Security badge */}
                <div className="mt-4 md:mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secure Checkout • 100% Safe
                </div>
              </div>
            </div>
          </div>
        )}

        {showExitWarningS && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/40 to-blue-900/30 flex items-end justify-center z-50 md:items-center md:justify-center backdrop-blur-sm">
            {/* Backdrop */}
            <div
              className="absolute inset-0 transition-all duration-300 animate-fadeIn"
              onClick={handleContinueCheckout}
            />

            {/* Survey Modal - Slides from bottom on mobile */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-t-2xl rounded-b-none md:rounded-2xl max-w-sm max-w-md w-full p-6 transform transition-all duration-400 ease-out animate-slideUpFromBottom shadow-xl border border-white/60">
              {/* Mobile handle */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gray-400/50 rounded-full md:hidden"></div>

              {/* Compact Header */}
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md animate-bounce-gentle">
                  <span className="text-xl">😢</span>
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Wait! Don't Go
                </h1>

                {/* Dynamic High-Demand Message */}
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-2 inline-flex items-center gap-1 shadow-sm animate-pulse-slow">
                  ⚡ {getRandomHighDemandMessage()}
                </div>
              </div>

              {/* Compact Survey Section */}
              <div className="bg-white/80 rounded-xl p-4 border border-gray-200/50 backdrop-blur-sm">
                <p className="text-gray-800 font-medium mb-3 text-center text-sm">
                  Quick feedback before you go:
                </p>
                {/* Compact Reasons List */}
                <form onSubmit={handleSaveAndExit} className="space-y-4">
                  <div className="max-h-48 overflow-y-auto pr-1 custom-scrollbar text-sm">
                    {[
                      "Don't want to share mobile number",
                      "Need to modify cart",
                      "Found better deal",
                      "Changed my mind",
                      "Technical issues",
                      "Shipping costs",
                      "Just browsing",
                      "Others"
                    ].map((reason, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 group cursor-pointer rounded-lg hover:bg-gray-100/50 transition-colors duration-200"
                      >
                        <input
                          type="checkbox"
                          id={`reason-${index}`}
                          name="cancellationReasons"
                          value={reason}
                          onChange={handlereasondata}
                          checked={selectedReasons.includes(reason)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                        />
                        <label
                          htmlFor={`reason-${index}`}
                          className="text-gray-600 text-xs leading-tight cursor-pointer select-none group-hover:text-gray-800 transition-colors flex-1"
                        >
                          {reason}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Submit Button */}
                  {selectedReasons.length > 0 ?
                    <button
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold text-sm hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400/30 border border-green-600/20"
                    >
                      Save & Continue
                    </button> : <button
                      className="w-full bg-gradient-to-r cursor-pointer from-gray-500  text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400/30 border border-green-600/20"
                      disabled
                    >
                      Save & Continue
                    </button>
                  }
                </form>

                {/* Compact Others Input */}
                {isOthersSelected && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 animate-fadeIn shadow-sm">
                    <input
                      value={othersText}
                      onChange={handleOthersTextChange}
                      placeholder="Your reason..."
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                )}

                {/* Compact Action Buttons */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleContinueCheckout}
                    className="w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white py-3 px-4 rounded-lg font-medium text-sm hover:from-gray-800 hover:to-gray-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400/30 border border-gray-700/20"
                  >
                    Keep Shopping
                  </button>
                </div>

                {/* Mini Trust Badges */}
                <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-500">
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Limited Stock
                  </div>
                  <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Free Shipping
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckoutPage