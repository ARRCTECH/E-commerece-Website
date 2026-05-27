import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, MapPin, Tag, Truck, Shield, Plus, Gift, Info } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
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
  createPartialCodOrder,
  verifyPartialCodPayment,
} from "../store/slices/orderSlice";
import {
  validateCoupon,
  removeCoupon,
  clearError as clearCouponError,
  fetchAvailableCoupons,
} from "../store/slices/couponSlice";
import { fetchCart } from "../store/slices/cartSlice";
import { useCheckoutData } from "../components/checkout/useCheckoutData";
import {
  AddressPopup,
  AddressList,
} from "../components/checkout/AddressComponents";
import {
  PaymentModal,
  CongratulationsModal,
  ExitWarningModal,
} from "../components/checkout/CheckoutModals";

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const rzpInstanceRef = useRef(null);
  const congratTimeoutRef = useRef(null);
  const freeDiscountShownRef = useRef(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const user = useSelector(selectUser);
  const cartItems = useSelector(selectCartItems);
  const cartSummary = useSelector(selectCartSummary);
  const razorpayOrder = useSelector(selectRazorpayOrder);
  const orderLoading = useSelector(selectOrderLoading);
  const orderError = useSelector(selectOrderError);
  const orderSuccess = useSelector(selectOrderSuccess);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const couponError = useSelector((state) => state.coupons.error);
  const couponLoading = useSelector((state) => state.coupons.loading);

  const {
    isBuyNow,
    isBulkBuyNow,
    buyNowProduct,
    clearBuyNowData,
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
    handleSaveAddress,
    showPaymentModal,
    setShowPaymentModal,
    showCongratulationsPopup,
    setShowCongratulationsPopup,
    congratulationsData,
    setCongratulationsData,
    showExitWarning,
    setShowExitWarning,
    showExitWarningS,
    setShowExitWarningS,
    couponCode,
    setCouponCode,
    coupons,
    setCoupons,
    filterYCoupon,
    filterNCoupon,
  } = useCheckoutData(location, user);

  const [partialPercentage, setPartialPercentage] = useState(30);
  const [partialCodEnabled, setPartialCodEnabled] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(!!window.Razorpay);
  const [referralAmountGiven, setReferralAmountGiven] = useState(0);

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error("Failed to load payment gateway");
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchPartialCodSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/partial-cod/settings`);
        const data = await response.json();
        if (data.success) {
          setPartialPercentage(data.percentage);
          setPartialCodEnabled(data.isEnabled);
        }
      } catch (err) {
        console.error("🔴 Error fetching partial COD settings:", err);
      }
    };
    fetchPartialCodSettings();
  }, [API_URL]);

  useEffect(() => {
    const fetchCoupons = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/coupons/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setCoupons(data.coupons || data);
      } catch (err) {
        console.error("🔴 Error fetching coupons:", err);
      }
    };
    fetchCoupons();
  }, [token, API_URL, setCoupons]);

  useEffect(() => {
    if (!isBuyNow && !cartItems.length) {
      dispatch(fetchCart());
    }
  }, [dispatch, cartItems.length, isBuyNow]);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearCouponError());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (rzpInstanceRef.current) {
        rzpInstanceRef.current.close();
        rzpInstanceRef.current = null;
      }
      if (congratTimeoutRef.current) {
        clearTimeout(congratTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (appliedCoupon && appliedCoupon.discountAmount > 0) {
      setCongratulationsData({
        couponCode: appliedCoupon.code,
        savingsAmount: appliedCoupon.discountAmount,
      });
      setShowCongratulationsPopup(true);
      if (congratTimeoutRef.current) clearTimeout(congratTimeoutRef.current);
      congratTimeoutRef.current = setTimeout(() => {
        setShowCongratulationsPopup(false);
      }, 4000);
    }
  }, [appliedCoupon, setCongratulationsData, setShowCongratulationsPopup]);

  // ✅ Calculate final pricing – includes referralAmountGiven (from balance)
  const calculateFinalPricing = useMemo(() => {
    const subtotal = isBuyNow && buyNowProduct
      ? buyNowProduct.product.price * buyNowProduct.quantity
      : (cartSummary.subtotal || 0);

    // Calculate total quantity for online discount
    let totalQuantity = 0;
    const items = isBuyNow && buyNowProduct ? [buyNowProduct] : cartItems;
    items.forEach(item => {
      if (item.isBulkProduct) {
        totalQuantity += item.totalSets || item.quantity || 1;
      } else {
        totalQuantity += item.quantity || 1;
      }
    });

    const ONLINE_DISCOUNT_PER_QUANTITY = 30;
    const onlineDiscountAmount = totalQuantity * ONLINE_DISCOUNT_PER_QUANTITY;

    const shippingCharges = 0;
    const couponDiscount = appliedCoupon?.discountAmount || 0;
    const freediscount = filterYCoupon?.[0]?.discountType === "flat"
      ? filterYCoupon[0].discountValue
      : Math.round(subtotal * (filterYCoupon?.[0]?.discountValue || 0) / 100);

    const totalDiscount = couponDiscount + freediscount + onlineDiscountAmount + referralAmountGiven;
    const totalValue = Math.round(subtotal + shippingCharges - totalDiscount);
    return {
      subtotal,
      originalSubtotal: subtotal,
      shippingCharges,
      couponDiscount,
      freediscount,
      onlineDiscount: onlineDiscountAmount,
      totalDiscount,
      referralDiscount: referralAmountGiven,
      total: totalValue > 0 ? totalValue : 0,
      totalQuantity,
    };
  }, [
    cartSummary.subtotal,
    appliedCoupon,
    isBuyNow,
    buyNowProduct,
    cartItems,
    filterYCoupon,
    referralAmountGiven,
  ]);
  // ------------------------------
  // 2. Run ONCE when totalEarning is truthy, then fetch referral details
  // ------------------------------
  // Show free discount popup only once and with proper cleanup
  useEffect(() => {
    const code = filterYCoupon[0]?.code;
    if (code && calculateFinalPricing.freediscount > 0 && !freeDiscountShownRef.current && !appliedCoupon) {
      freeDiscountShownRef.current = true;
      setCongratulationsData({
        couponCode: code,
        savingsAmount: calculateFinalPricing.freediscount,
      });
      setShowCongratulationsPopup(true);
      if (congratTimeoutRef.current) clearTimeout(congratTimeoutRef.current);
      congratTimeoutRef.current = setTimeout(() => {
        setShowCongratulationsPopup(false);
      }, 4000);
    }
    if (!code || calculateFinalPricing.freediscount === 0) {
      freeDiscountShownRef.current = false;
    }
    return () => {
      if (congratTimeoutRef.current) clearTimeout(congratTimeoutRef.current);
    };
  }, [filterYCoupon, calculateFinalPricing.freediscount, appliedCoupon]);

  // Memoized display items
  const displayItems = useMemo(() => {
    if (isBuyNow && buyNowProduct) {
      if (buyNowProduct.isBulkProduct) {
        return [{
          product: buyNowProduct.product,
          quantity: buyNowProduct.totalSets || 1,
          size: "BULK_PACK",
          color: buyNowProduct.selectedColors?.join(", "),
          isBulkProduct: true,
          selectedColors: buyNowProduct.selectedColors,
          totalPieces: buyNowProduct.totalPieces,
          pricePerSet: buyNowProduct.pricePerSet,
          piecesPerSet: buyNowProduct.piecesPerSet,
        }];
      }
      return [{
        product: buyNowProduct.product,
        quantity: buyNowProduct.quantity,
        size: buyNowProduct.size,
        color: buyNowProduct.color,
      }];
    }
    return cartItems;
  }, [isBuyNow, buyNowProduct, cartItems]);

  const validateOrder = useCallback(() => {
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return false;
    }
    if (!displayItems.length) {
      toast.error("No items to order");
      return false;
    }
    return true;
  }, [selectedAddress, displayItems]);

  const createOrderData = useCallback(() => {
    if (!selectedAddress) throw new Error("No address selected");
    let phone = selectedAddress.phoneNumber || "";
    phone = phone.replace(/^\+91/, "");
    return {
      items: displayItems.map((item) => ({
        productId: item.product?._id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        isBulkProduct: item.isBulkProduct || false,
        selectedColors: item.selectedColors,
        totalSets: item.quantity,
        totalPieces: item.totalPieces,
        piecesPerSet: item.piecesPerSet,
        pricePerSet: item.pricePerSet,
      })),
      shippingAddress: {
        ...selectedAddress,
        phoneNumber: `+91${phone}`,
      },
      couponCode: appliedCoupon?.code || "",
      isBuyNow: isBuyNow,
    };
  }, [displayItems, selectedAddress, appliedCoupon, isBuyNow]);

  // ✅ Fetch available referral balance and set applicable discount
  const fetchAvailableBalance = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await axios.post(
        `${API_URL}/referral-total-earning/getReferralTotalEarning`,
        { userId: user._id }
      );
      const balance = res.data?.data?.balance ?? 0;
      const eligibleAmount = Math.max(
        0,
        calculateFinalPricing.subtotal
        - calculateFinalPricing.couponDiscount
        - calculateFinalPricing.freediscount
        + calculateFinalPricing.shippingCharges
      );
      let applicableDiscount=0
      if (eligibleAmount > balance) {
        applicableDiscount=balance
        setReferralAmountGiven(applicableDiscount);
      }
      else{
        applicableDiscount=eligibleAmount
        setReferralAmountGiven(applicableDiscount);
      }
      console.log(`Available balance: ₹${balance}, applying: ₹${applicableDiscount}`);
    } catch (error) {
      console.error("Failed to fetch referral balance:", error);
      setReferralAmountGiven(0);
    }
  })

  useEffect(() => {
    fetchAvailableBalance();
  }, [calculateFinalPricing?.totalEarning, fetchAvailableBalance]);

  // ✅ Deduct referral balance after successful order (only after payment confirmation)
  const deductReferralBalance = useCallback(async () => {
    if (!user?._id || referralAmountGiven === 0) return;
    try {

      const res=await axios.post(`${API_URL}/referral-total-earning/useReferralBalance`, {
        userId: user._id,
        amount: referralAmountGiven,
      });
      console.log(`✅ Deducted ₹${referralAmountGiven} from referral balance`);
    } catch (error) {
      console.error("Failed to deduct referral balance:", error);
    }
  }, [referralAmountGiven]);

  // ------ ORDER HANDLERS ------
  const handlePlaceOrder = async () => {
    if (!validateOrder()) return;
    if (!razorpayLoaded) {
      toast.error("Payment gateway is still loading. Please try again.");
      return;
    }

    dispatch(clearError());
    setShowPaymentModal(false);

    const orderPayload = {
      amount: calculateFinalPricing.total,
      freediscount: calculateFinalPricing.freediscount,
      referralDiscount: referralAmountGiven,
      ...createOrderData(),
    };

    try {
      const result = await dispatch(createRazorpayOrder(orderPayload)).unwrap();
      // ⚠️ DO NOT deduct here – wait for payment success
      const { razorpayOrder: razorpayOrderData, orderId, orderSummary } = result;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrderData.amount,
        currency: razorpayOrderData.currency,
        name: "Factory Sale",
        description: "Factory Sale Purchase",
        order_id: razorpayOrderData.id,
        handler: async (response) => {
          try {
            const verifyResult = await dispatch(
              verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            ).unwrap();

            // ✅ Deduct referral balance only after successful verification
            await deductReferralBalance();

            toast.success("Order placed successfully!");
            clearBuyNowData();
            navigate(`/order-confirmation/${verifyResult.order.id || orderId}`);
          } catch (err) {
            toast.error("Payment successful but verification pending. Contact support.");
          } finally {
            rzpInstanceRef.current = null;
          }
        },
        prefill: {
          name: selectedAddress?.fullName,
          email: selectedAddress?.email || user?.email,
          contact: `+91${selectedAddress?.phoneNumber?.replace(/^\+91/, "")}`,
        },
        theme: { color: "#ec4899" },
        modal: {
          ondismiss: () => {
            rzpInstanceRef.current = null;
            toast("Payment cancelled", { icon: "⚠️" });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      rzpInstanceRef.current = razorpay;
      razorpay.open();
    } catch (error) {
      toast.error(error?.message || "Failed to create order");
      setShowPaymentModal(true);
    }
  };

  const handlePlaceCodOrder = async () => {
    if (!validateOrder()) return;
    dispatch(clearError());
    setShowPaymentModal(false);
    await deductReferralBalance();

    const orderPayload = {
      amount: Math.round(calculateFinalPricing.subtotal || 0),
      freediscount: calculateFinalPricing.freediscount,
      referralDiscount: referralAmountGiven,
      ...createOrderData(),
    };

    try {
      const result = await dispatch(placeCodOrder(orderPayload)).unwrap();
      // For COD, we deduct immediately because no separate payment verification
      await deductReferralBalance();
      toast.success("COD order placed successfully!");
      clearBuyNowData();
      navigate(`/order-confirmation/${result.payload?.order?.id || result.order?.id}`);
    } catch (error) {
      toast.error(error?.message || "Failed to place COD order");
      setShowPaymentModal(true);
    }
  };

  const handlePartialCodOrder = async () => {
    if (!validateOrder()) return;
    if (!razorpayLoaded) {
      toast.error("Payment gateway is still loading. Please try again.");
      return;
    }

    dispatch(clearError());
    setShowPaymentModal(false);

    const baseAmount = calculateFinalPricing.total;
    const onlineAmount = Math.round(baseAmount * (partialPercentage / 100));
    const codAmount = baseAmount - onlineAmount;

    const orderPayload = {
      items: displayItems.map((item) => ({
        productId: item.product?._id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        isBulkProduct: item.isBulkProduct || false,
        selectedColors: item.selectedColors,
        totalSets: item.quantity,
        totalPieces: item.totalPieces,
        piecesPerSet: item.piecesPerSet,
        pricePerSet: item.pricePerSet,
      })),
      shippingAddress: {
        ...selectedAddress,
        phoneNumber: `+91${selectedAddress?.phoneNumber?.replace(/^\+91/, "")}`,
      },
      couponCode: appliedCoupon?.code || "",
      totalAmount: baseAmount,
      onlineAmount: onlineAmount,
      codAmount: codAmount,
      partialPercentage: partialPercentage,
      freediscount: calculateFinalPricing.freediscount,
      referralDiscount: referralAmountGiven,
    };

    try {
      const result = await dispatch(createPartialCodOrder(orderPayload)).unwrap();
      // ⚠️ DO NOT deduct here – wait for online payment success
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: result.razorpayOrder.amount,
        currency: "INR",
        name: "Factory Sale",
        description: `Pay ${partialPercentage}% (₹${onlineAmount}) online, rest ₹${codAmount} on delivery`,
        order_id: result.razorpayOrder.id,
        handler: async (response) => {
          try {
            await dispatch(
              verifyPartialCodPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            ).unwrap();

            // ✅ Deduct referral balance only after online payment success
            await deductReferralBalance();

            toast.success("Order placed successfully!");
            clearBuyNowData();
            navigate(`/order-confirmation/${result.orderId}`);
          } catch (err) {
            toast.error("Payment successful but verification pending. Contact support.");
          } finally {
            rzpInstanceRef.current = null;
          }
        },
        prefill: {
          name: selectedAddress?.fullName,
          email: selectedAddress?.email || user?.email,
          contact: `+91${selectedAddress?.phoneNumber?.replace(/^\+91/, "")}`,
        },
        theme: { color: "#ec4899" },
        modal: {
          ondismiss: () => {
            rzpInstanceRef.current = null;
            toast("Payment cancelled", { icon: "⚠️" });
          },
        },
      };
      const razorpay = new window.Razorpay(options);
      rzpInstanceRef.current = razorpay;
      razorpay.open();
    } catch (error) {
      toast.error(error?.message || "Failed to process partial COD");
      setShowPaymentModal(true);
    }
  };

  // ----- EXIT HANDLERS -----
  const handleBackButton = () => setShowExitWarning(true);
  const handleContinueCheckout = () => {
    setShowExitWarning(false);
    setShowExitWarningS(false);
  };
  const handleExitButton = () => setShowExitWarningS(true);
  const handleSaveAndExit = async (reasons) => {
    try {
      await axios.post(`${API_URL}/reason/cancellation`, { cancellationReasons: reasons });
    } catch (error) {
      console.error("Failed to save reasons:", error);
    }
    navigate("/cart");
  };

  // Block back navigation
  useEffect(() => {
    window.history.pushState({ page: 1 }, "", window.location.href);
    const onBackButtonEvent = (e) => {
      e.preventDefault();
      handleBackButton();
      window.history.pushState({ page: 1 }, "", window.location.href);
    };
    window.addEventListener("popstate", onBackButtonEvent);
    return () => window.removeEventListener("popstate", onBackButtonEvent);
  }, []);

  // ---------- HANDLE COUPON APPLY ----------
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    try {
      const result = await dispatch(
        validateCoupon({
          code: couponCode.trim().toUpperCase(),
          cartTotal: calculateFinalPricing.subtotal,
        })
      ).unwrap();
      toast.success(`Coupon "${result.code}" applied successfully!`);
      setCouponCode("");
    } catch (err) {
      toast.error(err?.message || "Invalid or expired coupon");
    }
  };

  const hasItems = displayItems.length > 0;
  const showPartialCodOption =
    partialCodEnabled &&
    (isBulkBuyNow || displayItems.some((item) => item.isBulkProduct));
  const isProcessingOrder = orderLoading?.creating === true;

  if (!hasItems && !isProcessingOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">No items to checkout</h2>
          <button
            onClick={() => {
              clearBuyNowData();
              navigate("/");
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-xl"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={handleBackButton}
          className="mb-4 flex items-center gap-2 text-gray-600"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>

        {(orderError || couponError) && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-center">
            {orderError || couponError}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-red-600" />
                  <h2 className="text-lg font-semibold">Shipping Address</h2>
                </div>
                {addresses.length > 0 && (
                  <button
                    onClick={startAdding}
                    className="flex items-center text-red-600"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add New
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
            </div>

            {/* Coupon Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <Tag className="w-5 h-5 mr-2 text-red-600" />
                <h2 className="text-lg font-semibold">Apply Coupon</h2>
              </div>
              {appliedCoupon ? (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-semibold">{appliedCoupon.code}</span>
                  <span>-₹{appliedCoupon.discountAmount}</span>
                  <button
                    onClick={() => dispatch(removeCoupon())}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={couponLoading?.validating}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || couponLoading?.validating}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition"
                  >
                    {couponLoading?.validating ? "Applying..." : "Apply"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Order Summary</h2>
                <div className="flex items-center text-xs text-green-600">
                  <Truck className="w-3 h-3 mr-1" />
                  {calculateFinalPricing.shippingCharges === 0
                    ? "Free Shipping"
                    : "Shipping: ₹99"}
                </div>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {displayItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                    <img
                      src={item.product?.images?.[0]?.url}
                      className="w-16 h-16 object-cover rounded"
                      alt={item.product?.name}
                    />
                    <div>
                      <h3 className="font-semibold">{item.product?.name}</h3>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} | Size: {item.size || "M"} | Color:{" "}
                        {item.color || "-"}
                      </p>
                      <p className="font-bold">
                        ₹{item.product?.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{calculateFinalPricing.subtotal}</span>
                </div>
                {calculateFinalPricing.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-₹{calculateFinalPricing.couponDiscount}</span>
                  </div>
                )}
                {calculateFinalPricing.freediscount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Free Discount</span>
                    <span>-₹{calculateFinalPricing.freediscount}</span>
                  </div>
                )}
                {calculateFinalPricing.onlineDiscount > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>Online Discount (₹30/quantity)</span>
                    <span>-₹{calculateFinalPricing.onlineDiscount}</span>
                  </div>
                )}
                {referralAmountGiven > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span className="flex items-center gap-1">
                      Referral Earnings <Info className="w-3 h-3" title="Automatically applied from your referral balance" />
                    </span>
                    <span>-₹{referralAmountGiven}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {calculateFinalPricing.shippingCharges === 0
                      ? "FREE"
                      : `₹${calculateFinalPricing.shippingCharges}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold text-red-600">
                    ₹{calculateFinalPricing.total}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={isProcessingOrder}
                className="w-full mt-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingOrder ? "Processing..." : "Proceed to Payment"}
              </button>
              <div className="mt-4 flex justify-center text-xs text-gray-500">
                <Shield className="w-4 h-4 mr-1" /> Secure Checkout
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sticky button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={isProcessingOrder}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {isProcessingOrder ? "Processing..." : "Proceed to Payment"}
          </button>
        </div>
      </div>

      {/* Modals */}
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

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onOnline={handlePlaceOrder}
        onCOD={handlePlaceCodOrder}
        onPartialCod={handlePartialCodOrder}
        amount={calculateFinalPricing.total}
        amountCOD={referralAmountGiven}
        originalAmount={calculateFinalPricing.originalSubtotal}
        showPartialCod={showPartialCodOption}
        partialPercentage={partialPercentage}
        isBulkProduct={isBulkBuyNow || displayItems.some((item) => item.isBulkProduct)}
      />

      <CongratulationsModal
        isOpen={showCongratulationsPopup}
        onClose={() => setShowCongratulationsPopup(false)}
        couponCode={congratulationsData.couponCode}
        savingsAmount={congratulationsData.savingsAmount}
      />

      <ExitWarningModal
        isOpen={showExitWarning}
        onContinue={handleContinueCheckout}
        onExit={handleExitButton}
        message={{
          title: "Wait! Don't Go Yet!",
          description: "You're about to leave behind an exclusive FREE GIFT!",
        }}
      />

      <ExitWarningModal
        isOpen={showExitWarningS}
        onContinue={handleContinueCheckout}
        onExit={handleSaveAndExit}
        type="survey"
      />
    </div>
  );
};

export default CheckoutPage;