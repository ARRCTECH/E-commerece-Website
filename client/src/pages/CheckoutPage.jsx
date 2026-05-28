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
  placeFreeOrder,
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
  console.log("🔷🔷🔷 CheckoutPage RENDERED 🔷🔷🔷");

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

  console.log("📦 Redux State:", {
    user: user?._id,
    cartItemsCount: cartItems.length,
    cartSubtotal: cartSummary.subtotal,
    appliedCoupon: appliedCoupon?.code,
  });

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
  const [referralBalance, setReferralBalance] = useState(0);

  console.log("💰 Initial referral state:", { referralBalance, referralAmountGiven });

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    console.log("🟢 useEffect: Loading Razorpay script");
    if (window.Razorpay) {
      console.log("✅ Razorpay already loaded");
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ Razorpay script loaded successfully");
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error("❌ Failed to load Razorpay");
      toast.error("Failed to load payment gateway");
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  useEffect(() => {
    console.log("🟢 useEffect: Fetching Partial COD settings");
    const fetchPartialCodSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/partial-cod/settings`);
        const data = await response.json();
        console.log("📡 Partial COD settings response:", data);
        if (data.success) {
          setPartialPercentage(data.percentage);
          setPartialCodEnabled(data.isEnabled);
          console.log(`✅ Partial COD: ${data.isEnabled ? 'Enabled' : 'Disabled'}, Percentage: ${data.percentage}%`);
        }
      } catch (err) {
        console.error("❌ Error fetching partial COD settings:", err);
      }
    };
    fetchPartialCodSettings();
  }, [API_URL]);

  useEffect(() => {
    console.log("🟢 useEffect: Fetching available coupons");
    const fetchCoupons = async () => {
      if (!token) {
        console.log("⚠️ No token found, skipping coupon fetch");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/coupons/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        console.log("📡 Available coupons response:", data);
        setCoupons(data.coupons || data);
      } catch (err) {
        console.error("❌ Error fetching coupons:", err);
      }
    };
    fetchCoupons();
  }, [token, API_URL, setCoupons]);

  useEffect(() => {
    console.log("🟢 useEffect: Fetching cart if needed");
    if (!isBuyNow && !cartItems.length) {
      console.log("🛒 Fetching cart...");
      dispatch(fetchCart());
    }
  }, [dispatch, cartItems.length, isBuyNow]);

  useEffect(() => {
    console.log("🟢 useEffect: Clearing errors");
    dispatch(clearError());
    dispatch(clearCouponError());
  }, [dispatch]);

  useEffect(() => {
    console.log("🟢 useEffect: Cleanup on unmount");
    return () => {
      if (rzpInstanceRef.current) {
        console.log("🧹 Closing Razorpay instance");
        rzpInstanceRef.current.close();
        rzpInstanceRef.current = null;
      }
      if (congratTimeoutRef.current) {
        console.log("🧹 Clearing congrat timeout");
        clearTimeout(congratTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (appliedCoupon && appliedCoupon.discountAmount > 0) {
      console.log("🎉 Applied coupon detected:", appliedCoupon);
      setCongratulationsData({
        couponCode: appliedCoupon.code,
        savingsAmount: appliedCoupon.discountAmount,
      });
      setShowCongratulationsPopup(true);
      if (congratTimeoutRef.current) clearTimeout(congratTimeoutRef.current);
      congratTimeoutRef.current = setTimeout(() => {
        console.log("⏰ Closing congratulations popup");
        setShowCongratulationsPopup(false);
      }, 4000);
    }
  }, [appliedCoupon, setCongratulationsData, setShowCongratulationsPopup]);

  // ✅ Calculate total quantity for online discount
  const totalQuantity = useMemo(() => {
    console.log("🔄 Calculating total quantity...");
    let qty = 0;
    const items = isBuyNow && buyNowProduct ? [buyNowProduct] : cartItems;
    items.forEach(item => {
      if (item?.isBulkProduct) {
        qty += item.totalSets || item.quantity || 1;
      } else {
        qty += item.quantity || 1;
      }
    });
    console.log("📊 Total quantity:", qty);
    return qty;
  }, [isBuyNow, buyNowProduct, cartItems]);

  const ONLINE_DISCOUNT_PER_QUANTITY = 30;
  const onlineDiscountAmount = totalQuantity * ONLINE_DISCOUNT_PER_QUANTITY;
  console.log("💸 Online discount amount:", onlineDiscountAmount);

  // ✅ Calculate pricing without referral
  const pricingWithoutReferral = useMemo(() => {
    console.log("🔄 Calculating pricing without referral...");
    const subtotal = isBuyNow && buyNowProduct
      ? (buyNowProduct.product?.price || 0) * (buyNowProduct.quantity || 0)
      : (cartSummary.subtotal || 0);

    console.log("📊 Subtotal:", subtotal);

    const shippingCharges = 0;
    const couponDiscount = appliedCoupon?.discountAmount || 0;
    const freediscount = filterYCoupon?.[0]?.discountType === "flat"
      ? (filterYCoupon[0].discountValue || 0)
      : Math.round(subtotal * ((filterYCoupon?.[0]?.discountValue || 0) / 100));

    console.log("📊 Coupon discount:", couponDiscount);
    console.log("📊 Free discount:", freediscount);

    // Amount for ONLINE payment (includes online discount)
    const amountForOnline = Math.max(0, subtotal - couponDiscount - freediscount - onlineDiscountAmount + shippingCharges);

    // Amount for COD payment (NO online discount)
    const amountForCOD = Math.max(0, subtotal - couponDiscount - freediscount + shippingCharges);

    console.log("📊 Amount for ONLINE (with online discount):", amountForOnline);
    console.log("📊 Amount for COD (without online discount):", amountForCOD);

    return {
      subtotal,
      couponDiscount,
      freediscount,
      onlineDiscount: onlineDiscountAmount,
      shippingCharges,
      amountForOnline,
      amountForCOD,
    };
  }, [cartSummary.subtotal, appliedCoupon, isBuyNow, buyNowProduct, filterYCoupon, onlineDiscountAmount]);

  // ✅ Fetch referral balance once
  useEffect(() => {
    console.log("🟢 useEffect: Fetching referral balance");
    const fetchBalance = async () => {
      if (!user?._id) {
        console.log("⚠️ No user ID, skipping referral balance fetch");
        return;
      }
      try {
        console.log("📡 Calling API: getReferralTotalEarning for user:", user._id);
        const res = await axios.post(
          `${API_URL}/referral-total-earning/getReferralTotalEarning`,
          { userId: user._id }
        );
        const balance = res.data?.data?.balance ?? 0;
        console.log("💰 Referral Balance fetched:", balance);
        setReferralBalance(balance);
      } catch (error) {
        console.error("❌ Failed to fetch referral balance:", error);
        setReferralBalance(0);
      }
    };
    fetchBalance();
  }, [user]);

  // ✅ Calculate final total based on payment method
  const calculateFinalTotal = useCallback((paymentType) => {
    console.log(`🔄 calculateFinalTotal called with paymentType: ${paymentType}`);
    let amountBeforeReferral;

    if (paymentType === 'ONLINE') {
      amountBeforeReferral = pricingWithoutReferral.amountForOnline;
      console.log("   Using ONLINE amount before referral:", amountBeforeReferral);

      const applicableReferral = Math.min(referralBalance, amountBeforeReferral);
      const finalTotal = Math.max(0, amountBeforeReferral - applicableReferral);

      console.log(`   Referral balance: ${referralBalance}, Applicable: ${applicableReferral}`);
      console.log(`   Final total after referral: ${finalTotal}`);

      return {
        amountBeforeReferral,
        applicableReferral,
        finalTotal,
      };
    }
    else if (paymentType === 'COD') {
      amountBeforeReferral = pricingWithoutReferral.amountForCOD;
      console.log("   Using COD amount before referral:", amountBeforeReferral);

      // ✅ FIX: COD madhe expected final total = 30 (as per your requirement)
      // Expected pay amount for COD (customer needs to pay on delivery)
      const EXPECTED_COD_FINAL_TOTAL = 30;

      // Calculate how much referral discount to apply to reach EXPECTED_COD_FINAL_TOTAL
      let applicableReferral = Math.max(0, amountBeforeReferral - EXPECTED_COD_FINAL_TOTAL);

      // But cannot apply more than available referral balance
      applicableReferral = Math.min(applicableReferral, referralBalance);

      const finalTotal = Math.max(0, amountBeforeReferral - applicableReferral);

      console.log(`   Referral balance: ${referralBalance}, Applicable: ${applicableReferral}`);
      console.log(`   Final total after referral: ${finalTotal}`);

      return {
        amountBeforeReferral,
        applicableReferral,
        finalTotal,
      };
    }
    else {
      // Default to ONLINE
      amountBeforeReferral = pricingWithoutReferral.amountForOnline;
      console.log("   Using default ONLINE amount before referral:", amountBeforeReferral);

      const applicableReferral = Math.min(referralBalance, amountBeforeReferral);
      const finalTotal = Math.max(0, amountBeforeReferral - applicableReferral);

      console.log(`   Referral balance: ${referralBalance}, Applicable: ${applicableReferral}`);
      console.log(`   Final total after referral: ${finalTotal}`);

      return {
        amountBeforeReferral,
        applicableReferral,
        finalTotal,
      };
    }
  }, [pricingWithoutReferral, referralBalance]);

  // Update referral amount when payment method changes or balance changes
  useEffect(() => {
    console.log("🟢 useEffect: Updating referral amount (default ONLINE)");
    const { applicableReferral } = calculateFinalTotal('ONLINE');
    console.log(`   Setting referralAmountGiven to: ${applicableReferral}`);
    setReferralAmountGiven(applicableReferral);
  }, [calculateFinalTotal]);

  // Memoized display items
  const displayItems = useMemo(() => {
    console.log("🔄 Calculating display items...");
    if (isBuyNow && buyNowProduct) {
      console.log("   Buy Now mode, product:", buyNowProduct.product?.name);
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
    console.log("   Cart mode, items count:", cartItems.length);
    return cartItems;
  }, [isBuyNow, buyNowProduct, cartItems]);

  const validateOrder = useCallback(() => {
    console.log("🔍 Validating order...");
    if (!selectedAddress) {
      console.log("❌ Validation failed: No address selected");
      toast.error("Please select a shipping address");
      return false;
    }
    if (!displayItems.length) {
      console.log("❌ Validation failed: No items in order");
      toast.error("No items to order");
      return false;
    }
    console.log("✅ Validation passed");
    return true;
  }, [selectedAddress, displayItems]);

  const createOrderData = useCallback(() => {
    console.log("📝 Creating order data...");
    if (!selectedAddress) throw new Error("No address selected");
    let phone = selectedAddress.phoneNumber || "";
    phone = phone.replace(/^\+91/, "");
    const orderData = {
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
    console.log("✅ Order data created:", orderData);
    return orderData;
  }, [displayItems, selectedAddress, appliedCoupon, isBuyNow]);

  // ✅ Deduct referral balance after successful order
  const deductReferralBalance = useCallback(async () => {
    console.log("💰 deductReferralBalance called");
    if (!user?._id) {
      console.log("⚠️ No user ID, skipping deduction");
      return;
    }
    if (referralAmountGiven === 0) {
      console.log("⚠️ referralAmountGiven is 0, skipping deduction");
      return;
    }
    console.log(`💰 Attempting to deduct ₹${referralAmountGiven} from referral balance for user: ${user._id}`);
    try {
      const response = await axios.post(`${API_URL}/referral-total-earning/useReferralBalance`, {
        userId: user._id,
        amount: referralAmountGiven,
      });
      console.log("✅ Deduction response:", response.data);
      console.log(`✅ Successfully deducted ₹${referralAmountGiven} from referral balance`);
    } catch (error) {
      console.error("❌ Failed to deduct referral balance:", error);
    }
  }, [user, referralAmountGiven]);

  // ------ ORDER HANDLERS ------
  const handlePlaceOrder = async () => {
    console.log("🔴🔴🔴 handlePlaceOrder (ONLINE) TRIGGERED 🔴🔴🔴");

    if (!validateOrder()) {
      console.log("❌ Order validation failed, returning");
      return;
    }

    // Calculate for ONLINE payment
    console.log("📊 Calculating for ONLINE payment...");
    const { amountBeforeReferral, applicableReferral, finalTotal } = calculateFinalTotal('ONLINE');
    console.log("📊 ONLINE Calculation Results:");
    console.log("   - Amount before referral:", amountBeforeReferral);
    console.log("   - Referral balance:", referralBalance);
    console.log("   - Referral applied:", applicableReferral);
    console.log("   - Final total:", finalTotal);

    setReferralAmountGiven(applicableReferral);
    console.log("✅ Updated referralAmountGiven to:", applicableReferral);

// Handle ₹0 payment - Use FREE order API
if (finalTotal === 0) {
  console.log("🎉 Final total is ₹0 - Handling FREE ORDER");
  dispatch(clearError());
  setShowPaymentModal(false);

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
    isBuyNow: isBuyNow,
    amount: 0,  // ✅ CRITICAL: Pass amount 0
    freediscount: pricingWithoutReferral.freediscount,
    referralDiscount: applicableReferral,
  };

  console.log("📦 FREE order payload:", orderPayload);

  try {
    console.log("🚀 Dispatching placeFreeOrder...");
    const result = await dispatch(placeFreeOrder(orderPayload)).unwrap();
    console.log("✅ Free order result:", result);
    await deductReferralBalance();
    toast.success("Free order placed successfully! 🎉");
    clearBuyNowData();
    navigate(`/order-confirmation/${result.order.id}`);
  } catch (error) {
    console.error("❌ Failed to place free order:", error);
    toast.error(error?.message || "Failed to place order");
    setShowPaymentModal(true);
  }
  return;
}

    // Normal online payment
    if (!razorpayLoaded) {
      console.log("❌ Razorpay not loaded yet");
      toast.error("Payment gateway is still loading. Please try again.");
      return;
    }

    dispatch(clearError());
    setShowPaymentModal(false);

    const orderPayload = {
      amount: finalTotal,
      freediscount: pricingWithoutReferral.freediscount,
      referralDiscount: applicableReferral,
      onlineDiscount: pricingWithoutReferral.onlineDiscount,
      couponDiscount: pricingWithoutReferral.couponDiscount,
      ...createOrderData(),
    };

    console.log("📦 Order payload for Razorpay:", orderPayload);

    try {
      console.log("🚀 Dispatching createRazorpayOrder...");
      const result = await dispatch(createRazorpayOrder(orderPayload)).unwrap();
      console.log("✅ Razorpay order created:", result);
      const { razorpayOrder: razorpayOrderData, orderId } = result;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrderData.amount,
        currency: razorpayOrderData.currency,
        name: "Factory Sale",
        description: "Factory Sale Purchase",
        order_id: razorpayOrderData.id,
        handler: async (response) => {
          console.log("🔵 Razorpay payment handler triggered");
          console.log("   Response:", response);
          try {
            console.log("🚀 Dispatching verifyPayment...");
            const verifyResult = await dispatch(
              verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            ).unwrap();
            console.log("✅ Payment verified:", verifyResult);

            await deductReferralBalance();
            toast.success("Order placed successfully!");
            clearBuyNowData();
            navigate(`/order-confirmation/${verifyResult.order.id || orderId}`);
          } catch (err) {
            console.error("❌ Payment verification failed:", err);
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
            console.log("🔴 Razorpay modal dismissed by user");
            rzpInstanceRef.current = null;
            toast("Payment cancelled", { icon: "⚠️" });
          },
        },
      };

      console.log("🟢 Opening Razorpay with options:", options);
      const razorpay = new window.Razorpay(options);
      rzpInstanceRef.current = razorpay;
      razorpay.open();
    } catch (error) {
      console.error("❌ Failed to create Razorpay order:", error);
      toast.error(error?.message || "Failed to create order");
      setShowPaymentModal(true);
    }
  };

  const handlePlaceCodOrder = async () => {
    console.log("🔴🔴🔴 handlePlaceCodOrder (COD) TRIGGERED 🔴🔴🔴");

    if (!validateOrder()) return;

    // Calculate for COD payment (NO online discount)
    console.log("📊 Calculating for COD payment...");
    const { amountBeforeReferral, applicableReferral, finalTotal } = calculateFinalTotal('COD');
    console.log("📊 COD Calculation Results:");
    console.log("   - Amount before referral:", amountBeforeReferral);
    console.log("   - Referral balance:", referralBalance);
    console.log("   - Referral applied:", applicableReferral);
    console.log("   - Final total:", finalTotal);

    setReferralAmountGiven(applicableReferral);
    console.log("✅ Updated referralAmountGiven to:", applicableReferral);

    dispatch(clearError());
    setShowPaymentModal(false);

    console.log("💰 Deducting referral balance before COD order...");
    await deductReferralBalance();

    const orderPayload = {
      amount: finalTotal,
      freediscount: pricingWithoutReferral.freediscount,
      referralDiscount: applicableReferral,
      couponDiscount: pricingWithoutReferral.couponDiscount,
      paymentMethod: 'COD',
      ...createOrderData(),
    };

    console.log("📦 COD order payload:", orderPayload);

    try {
      console.log("🚀 Dispatching placeCodOrder...");
      const result = await dispatch(placeCodOrder(orderPayload)).unwrap();
      console.log("✅ COD order placed:", result);
      toast.success("COD order placed successfully!");
      clearBuyNowData();
      navigate(`/order-confirmation/${result.payload?.order?.id || result.order?.id}`);
    } catch (error) {
      console.error("❌ Failed to place COD order:", error);
      toast.error(error?.message || "Failed to place COD order");
      setShowPaymentModal(true);
    }
  };

  const handlePartialCodOrder = async () => {
    console.log("🔴🔴🔴 handlePartialCodOrder TRIGGERED 🔴🔴🔴");

    if (!validateOrder()) return;
    if (!razorpayLoaded) {
      console.log("❌ Razorpay not loaded");
      toast.error("Payment gateway is still loading. Please try again.");
      return;
    }

    dispatch(clearError());
    setShowPaymentModal(false);

    const { finalTotal } = calculateFinalTotal('ONLINE');
    console.log("📊 Partial COD - Base total:", finalTotal);

    const baseAmount = finalTotal;
    const onlineAmount = Math.round(baseAmount * (partialPercentage / 100));
    const codAmount = baseAmount - onlineAmount;

    console.log(`📊 Partial COD split: ${partialPercentage}% online = ₹${onlineAmount}, ${100 - partialPercentage}% COD = ₹${codAmount}`);

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
      freediscount: pricingWithoutReferral.freediscount,
      referralDiscount: referralAmountGiven,
      onlineDiscount: pricingWithoutReferral.onlineDiscount,
      couponDiscount: pricingWithoutReferral.couponDiscount,
    };

    console.log("📦 Partial COD order payload:", orderPayload);

    try {
      console.log("🚀 Dispatching createPartialCodOrder...");
      const result = await dispatch(createPartialCodOrder(orderPayload)).unwrap();
      console.log("✅ Partial COD order created:", result);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: result.razorpayOrder.amount,
        currency: "INR",
        name: "Factory Sale",
        description: `Pay ${partialPercentage}% (₹${onlineAmount}) online, rest ₹${codAmount} on delivery`,
        order_id: result.razorpayOrder.id,
        handler: async (response) => {
          console.log("🔵 Partial COD payment handler triggered");
          console.log("   Response:", response);
          try {
            console.log("🚀 Dispatching verifyPartialCodPayment...");
            await dispatch(
              verifyPartialCodPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            ).unwrap();

            console.log("✅ Partial COD payment verified");
            await deductReferralBalance();
            toast.success("Order placed successfully!");
            clearBuyNowData();
            navigate(`/order-confirmation/${result.orderId}`);
          } catch (err) {
            console.error("❌ Partial COD verification failed:", err);
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
            console.log("🔴 Partial COD modal dismissed");
            rzpInstanceRef.current = null;
            toast("Payment cancelled", { icon: "⚠️" });
          },
        },
      };
      const razorpay = new window.Razorpay(options);
      rzpInstanceRef.current = razorpay;
      razorpay.open();
    } catch (error) {
      console.error("❌ Failed to process partial COD:", error);
      toast.error(error?.message || "Failed to process partial COD");
      setShowPaymentModal(true);
    }
  };

  // Show free discount popup
  useEffect(() => {
    const code = filterYCoupon[0]?.code;
    console.log("🟢 useEffect: Checking free discount popup", { code, freediscount: pricingWithoutReferral.freediscount, shown: freeDiscountShownRef.current });
    if (code && pricingWithoutReferral.freediscount > 0 && !freeDiscountShownRef.current && !appliedCoupon) {
      console.log("🎉 Showing free discount popup for code:", code);
      freeDiscountShownRef.current = true;
      setCongratulationsData({
        couponCode: code,
        savingsAmount: pricingWithoutReferral.freediscount,
      });
      setShowCongratulationsPopup(true);
      if (congratTimeoutRef.current) clearTimeout(congratTimeoutRef.current);
      congratTimeoutRef.current = setTimeout(() => {
        console.log("⏰ Closing free discount popup");
        setShowCongratulationsPopup(false);
      }, 4000);
    }
    if (!code || pricingWithoutReferral.freediscount === 0) {
      freeDiscountShownRef.current = false;
    }
    return () => {
      if (congratTimeoutRef.current) clearTimeout(congratTimeoutRef.current);
    };
  }, [filterYCoupon, pricingWithoutReferral.freediscount, appliedCoupon]);

  // ----- EXIT HANDLERS -----
  const handleBackButton = () => {
    console.log("🔙 Back button clicked");
    setShowExitWarning(true);
  };

  const handleContinueCheckout = () => {
    console.log("▶️ Continue checkout clicked");
    setShowExitWarning(false);
    setShowExitWarningS(false);
  };

  const handleExitButton = () => {
    console.log("🚪 Exit button clicked");
    setShowExitWarningS(true);
  };

  const handleSaveAndExit = async (reasons) => {
    console.log("💾 Save and exit with reasons:", reasons);
    try {
      await axios.post(`${API_URL}/reason/cancellation`, { cancellationReasons: reasons });
      console.log("✅ Reasons saved successfully");
    } catch (error) {
      console.error("❌ Failed to save reasons:", error);
    }
    navigate("/cart");
  };

  // Block back navigation
  useEffect(() => {
    console.log("🟢 Setting up back navigation blocker");
    window.history.pushState({ page: 1 }, "", window.location.href);
    const onBackButtonEvent = (e) => {
      console.log("🔙 Popstate event triggered (back button pressed)");
      e.preventDefault();
      handleBackButton();
      window.history.pushState({ page: 1 }, "", window.location.href);
    };
    window.addEventListener("popstate", onBackButtonEvent);
    return () => {
      console.log("🧹 Removing popstate listener");
      window.removeEventListener("popstate", onBackButtonEvent);
    };
  }, []);

  // ---------- HANDLE COUPON APPLY ----------
  const handleApplyCoupon = async () => {
    console.log("🎫 Apply coupon clicked, code:", couponCode);
    if (!couponCode.trim()) {
      console.log("❌ Empty coupon code");
      toast.error("Please enter a coupon code");
      return;
    }
    try {
      console.log("🚀 Dispatching validateCoupon...");
      const result = await dispatch(
        validateCoupon({
          code: couponCode.trim().toUpperCase(),
          cartTotal: pricingWithoutReferral.subtotal,
        })
      ).unwrap();
      console.log("✅ Coupon validated:", result);
      toast.success(`Coupon "${result.code}" applied successfully!`);
      setCouponCode("");
    } catch (err) {
      console.error("❌ Coupon validation failed:", err);
      toast.error(err?.message || "Invalid or expired coupon");
    }
  };

  const hasItems = displayItems.length > 0;
  const showPartialCodOption =
    partialCodEnabled &&
    (isBulkBuyNow || displayItems.some((item) => item.isBulkProduct));
  const isProcessingOrder = orderLoading?.creating === true;

  // Get final total for display (default to ONLINE)
  const { finalTotal: displayTotal, applicableReferral: displayReferral, amountBeforeReferral } = calculateFinalTotal('ONLINE');

  console.log("📊 DISPLAY VALUES:");
  console.log("   - displayTotal:", displayTotal);
  console.log("   - displayReferral:", displayReferral);
  console.log("   - amountBeforeReferral:", amountBeforeReferral);
  console.log("   - referralBalance:", referralBalance);

  if (!hasItems && !isProcessingOrder) {
    console.log("⚠️ No items to display, showing empty state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">No items to checkout</h2>
          <button
            onClick={() => {
              console.log("🛒 Continue shopping clicked");
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
                    onClick={() => {
                      console.log("🗑️ Removing coupon");
                      dispatch(removeCoupon());
                    }}
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
                    onChange={(e) => {
                      console.log("✏️ Coupon code input changed:", e.target.value);
                      setCouponCode(e.target.value.toUpperCase());
                    }}
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
                  {pricingWithoutReferral.shippingCharges === 0
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
                  <span>₹{pricingWithoutReferral.subtotal}</span>
                </div>
                {pricingWithoutReferral.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-₹{pricingWithoutReferral.couponDiscount}</span>
                  </div>
                )}
                {pricingWithoutReferral.freediscount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Free Discount</span>
                    <span>-₹{pricingWithoutReferral.freediscount}</span>
                  </div>
                )}
                {pricingWithoutReferral.onlineDiscount > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>Online Discount (₹30/quantity)</span>
                    <span>-₹{pricingWithoutReferral.onlineDiscount}</span>
                  </div>
                )}
                {displayReferral > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span className="flex items-center gap-1">
                      Referral Earnings <Info className="w-3 h-3" title={`Balance: ₹${referralBalance}`} />
                    </span>
                    <span>-₹{displayReferral}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {pricingWithoutReferral.shippingCharges === 0
                      ? "FREE"
                      : `₹${pricingWithoutReferral.shippingCharges}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold text-red-600">
                    ₹{displayTotal}
                  </span>
                </div>
                {displayTotal === 0 && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg text-center">
                    <p className="text-sm text-green-700">🎉 Free Order! No payment needed.</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  console.log("🟢 Proceed to Payment button clicked");
                  setShowPaymentModal(true);
                }}
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
            onClick={() => {
              console.log("🟢 Mobile Proceed to Payment button clicked");
              setShowPaymentModal(true);
            }}
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
        onClose={() => {
          console.log("🔴 PaymentModal closed");
          setShowPaymentModal(false);
        }}
        onOnline={() => {
          console.log("🔴 PaymentModal - onOnline callback triggered");
          handlePlaceOrder();
        }}
        onCOD={() => {
          console.log("🔴 PaymentModal - onCOD callback triggered");
          handlePlaceCodOrder();
        }}
        onPartialCod={() => {
          console.log("🔴 PaymentModal - onPartialCod callback triggered");
          handlePartialCodOrder();
        }}
        amount={displayTotal}
        amountCOD={displayReferral}
        originalAmount={pricingWithoutReferral.subtotal}
        showPartialCod={showPartialCodOption}
        partialPercentage={partialPercentage}
        isBulkProduct={isBulkBuyNow || displayItems.some((item) => item.isBulkProduct)}
        discountAmount={pricingWithoutReferral.couponDiscount + pricingWithoutReferral.freediscount + pricingWithoutReferral.onlineDiscount}
        couponCode={appliedCoupon?.code || filterYCoupon?.[0]?.code}
        onlineDiscount={pricingWithoutReferral.onlineDiscount}      // ✅ NEW - Online discount amount (₹30)
        couponDiscount={pricingWithoutReferral.couponDiscount}      // ✅ NEW - Coupon discount amount
        freeDiscount={pricingWithoutReferral.freediscount}          // ✅ NEW - Free discount amount
      />

      <CongratulationsModal
        isOpen={showCongratulationsPopup}
        onClose={() => {
          console.log("🔴 CongratulationsModal closed");
          setShowCongratulationsPopup(false);
        }}
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