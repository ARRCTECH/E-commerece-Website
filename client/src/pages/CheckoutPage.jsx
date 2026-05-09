// "use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, MapPin, Tag, Truck, Shield, Plus } from "lucide-react";
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
import { validateCoupon, removeCoupon, clearError as clearCouponError, fetchAvailableCoupons } from "../store/slices/couponSlice";
import { fetchCart } from "../store/slices/cartSlice";
import { useCheckoutData } from "../components/checkout/useCheckoutData";
import { AddressPopup, AddressList } from "../components/checkout/AddressComponents";
import { PaymentModal, CongratulationsModal, ExitWarningModal } from "../components/checkout/CheckoutModals";

console.log("🔵 CheckoutPage.jsx loaded");

const CheckoutPage = () => {
  console.log("🔵 CheckoutPage component rendering");
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const rzpInstanceRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  console.log("🔵 API_URL:", API_URL);

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

  console.log("🔵 User:", user?.email || "Guest");
  console.log("🔵 Cart items count:", cartItems?.length || 0);
  console.log("🔵 Cart subtotal:", cartSummary?.subtotal || 0);

  const {
    isBuyNow, isBulkBuyNow, buyNowProduct, clearBuyNowData,
    addresses, selectedAddress, setSelectedAddress, showAddressPopup, editingAddress,
    deleteAddress, setDefaultAddress, startEditing, startAdding, cancelEditing, handleSaveAddress,
    showPaymentModal, setShowPaymentModal, showCongratulationsPopup, setShowCongratulationsPopup,
    congratulationsData, setCongratulationsData, showExitWarning, setShowExitWarning,
    showExitWarningS, setShowExitWarningS, couponCode, setCouponCode, coupons, setCoupons,
    filterYCoupon, filterNCoupon
  } = useCheckoutData(location, user);

  const [partialPercentage, setPartialPercentage] = useState(30);
  const [partialCodEnabled, setPartialCodEnabled] = useState(false);

  const token = localStorage.getItem('authToken');
  console.log("🔵 Token exists:", !!token);

  // Fetch Partial COD settings
  useEffect(() => {
    console.log("🔵 Fetching Partial COD settings...");
    const fetchPartialCodSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/partial-cod/settings`);
        const data = await response.json();
        console.log("🔵 Partial COD settings response:", data);
        if (data.success) {
          setPartialPercentage(data.percentage);
          setPartialCodEnabled(data.isEnabled);
          console.log("🔵 Partial COD enabled:", data.isEnabled, "Percentage:", data.percentage);
        }
      } catch (err) {
        console.error("🔴 Error fetching partial COD settings:", err);
      }
    };
    fetchPartialCodSettings();
  }, [API_URL]);

  useEffect(() => {
    console.log("🔵 Fetching coupons...");
    const fetchCoupons = async () => {
      try {
        const response = await fetch(`${API_URL}/coupons/available`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        setCoupons(data.coupons || data);
        console.log("🔵 Coupons fetched:", data.coupons?.length || 0);
      } catch (err) { console.error('🔴 Error fetching coupons:', err); }
    };
    fetchCoupons();
  }, [token, API_URL]);

  useEffect(() => {
    console.log("🔵 Removing coupon on mount");
    dispatch(removeCoupon());
    setCouponCode("");
    if (rzpInstanceRef.current) { 
      console.log("🔵 Closing existing Razorpay instance");
      rzpInstanceRef.current.close(); 
      rzpInstanceRef.current = null; 
    }
    return () => { 
      if (rzpInstanceRef.current) {
        console.log("🔵 Cleanup: closing Razorpay instance");
        rzpInstanceRef.current.close(); 
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (Object.keys(user).length !== 0) {
      console.log("🔵 User logged in, fetching available coupons");
      dispatch(fetchAvailableCoupons());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (appliedCoupon && appliedCoupon.discountAmount > 0) {
      console.log("🔵 Coupon applied:", appliedCoupon.code, "Discount:", appliedCoupon.discountAmount);
      setCongratulationsData({ couponCode: appliedCoupon.code, savingsAmount: appliedCoupon.discountAmount });
      setShowCongratulationsPopup(true);
      setTimeout(() => setShowCongratulationsPopup(false), 4000);
    }
  }, [appliedCoupon]);

  useEffect(() => {
    const couponCodeY = filterYCoupon[0]?.code;
    if (couponCodeY) {
      console.log("🔵 Free coupon available:", couponCodeY);
      setCongratulationsData({ couponCode: couponCodeY, savingsAmount: calculateFinalPricing.freediscount });
      setShowCongratulationsPopup(true);
      setTimeout(() => setShowCongratulationsPopup(false), 4000);
    }
  }, [filterYCoupon[0]?.code]);

  useEffect(() => {
    if (!isBuyNow && !cartItems.length) {
      console.log("🔵 Fetching cart...");
      dispatch(fetchCart());
    }
  }, [dispatch, cartItems.length, isBuyNow]);

  const calculateFinalPricing = useMemo(() => {
    console.log("🔵 Calculating final pricing...");
    let subtotal = isBuyNow && buyNowProduct ? buyNowProduct.product.price * buyNowProduct.quantity : cartSummary.subtotal || 0;
    const shippingCharges = subtotal >= 399 ? 0 : 99;
    const discount = appliedCoupon?.discountAmount || 0;
    const freediscount = filterYCoupon[0]?.discountType == "flat" ? filterYCoupon[0]?.discountValue : subtotal * (filterYCoupon[0]?.discountValue) / 100 || 0;
    const totalSaving = discount + freediscount;
    const totalValue = Math.round(subtotal + shippingCharges - discount - freediscount);
    const result = { subtotal, shippingCharges, discount, totalSaving, total: totalValue > 0 ? totalValue : 0, freediscount };
    console.log("🔵 Pricing calculated:", result);
    return result;
  }, [cartSummary.subtotal, appliedCoupon, isBuyNow, buyNowProduct, filterYCoupon]);

  const getDisplayItems = useCallback(() => {
    console.log("🔵 Getting display items...");
    if (isBuyNow && buyNowProduct) {
      console.log("🔵 Buy Now product:", buyNowProduct.product?.name);
      if (buyNowProduct.isBulkProduct) {
        console.log("🔵 Bulk product detected");
        return [{
          product: buyNowProduct.product,
          quantity: buyNowProduct.totalSets || 1,
          size: "BULK_PACK",
          color: buyNowProduct.selectedColors?.join(", "),
          isBulkProduct: true,
          selectedColors: buyNowProduct.selectedColors,
          totalPieces: buyNowProduct.totalPieces,
          pricePerSet: buyNowProduct.pricePerSet,
          piecesPerSet: buyNowProduct.piecesPerSet
        }];
      }
      return [{ product: buyNowProduct.product, quantity: buyNowProduct.quantity, size: buyNowProduct.size, color: buyNowProduct.color }];
    }
    console.log("🔵 Cart items count:", cartItems?.length);
    return cartItems;
  }, [isBuyNow, buyNowProduct, cartItems]);

  const validateOrder = () => {
    console.log("🔵 Validating order...");
    if (!selectedAddress) { 
      console.log("🔴 No shipping address selected");
      alert("Please select a shipping address"); 
      return false; 
    }
    if (!getDisplayItems().length) { 
      console.log("🔴 No items to order");
      alert("No items to order"); 
      return false; 
    }
    console.log("🔵 Order validation passed");
    return true;
  };

  const createOrderData = useCallback(() => {
    const data = {
      items: getDisplayItems().map(item => ({
        productId: item.product?._id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        isBulkProduct: item.isBulkProduct || false,
        selectedColors: item.selectedColors,
        totalSets: item.quantity,
        totalPieces: item.totalPieces,
        piecesPerSet: item.piecesPerSet,
        pricePerSet: item.pricePerSet
      })),
      shippingAddress: { ...selectedAddress, phoneNumber: `+91${selectedAddress.phoneNumber}` },
      couponCode: appliedCoupon?.code || "",
      isBuyNow: isBuyNow
    };
    console.log("🔵 Create order data:", data);
    return data;
  }, [getDisplayItems, selectedAddress, appliedCoupon, isBuyNow]);

  // ✅ FIXED: Handle Place Order with Razorpay modal
  const handlePlaceOrder = () => {
    console.log("🟢🟢🟢 HANDLE PLACE ORDER STARTED 🟢🟢🟢");
    if (rzpInstanceRef.current) { 
      console.log("🔵 Closing existing Razorpay instance");
      rzpInstanceRef.current.close(); 
      rzpInstanceRef.current = null; 
    }
    if (!validateOrder()) return;
    
    const orderPayload = { 
      amount: calculateFinalPricing.total, 
      freediscount: calculateFinalPricing.freediscount, 
      ...createOrderData() 
    };
    
    console.log("🟢 Dispatching createRazorpayOrder with:", orderPayload);
    
    // ✅ Wait for order creation and then open Razorpay
    dispatch(createRazorpayOrder(orderPayload)).then((result) => {
      console.log("🟢 createRazorpayOrder result:", result);
      
      if (result.type === "order/createRazorpayOrder/fulfilled") {
        const { razorpayOrder: razorpayOrderData, orderId, orderSummary } = result.payload;
        console.log("🟢 Razorpay Order received:", razorpayOrderData);
        
        // ✅ Open Razorpay modal here
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: razorpayOrderData.amount,
          currency: razorpayOrderData.currency,
          name: "KsauniBliss",
          description: "KsauniBliss Purchase",
          order_id: razorpayOrderData.id,
          handler: async (response) => {
            console.log("🟢 Razorpay payment success:", response);
            try {
              const verifyResult = await dispatch(verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })).unwrap();
              
              toast.success("Order placed successfully!");
              clearBuyNowData();
              navigate(`/order-confirmation/${verifyResult.order.id || orderId}`);
            } catch (err) {
              console.error("Verification failed:", err);
              toast.error("Payment successful but verification pending. Contact support.");
            }
          },
          prefill: {
            name: selectedAddress?.fullName,
            email: selectedAddress?.email || user?.email,
            contact: `+91${selectedAddress?.phoneNumber}`
          },
          theme: { color: "#ec4899" },
          modal: {
            ondismiss: () => {
              console.log("🔵 Razorpay modal dismissed");
              rzpInstanceRef.current = null;
            }
          }
        };
        
        if (window.Razorpay) {
          const razorpay = new window.Razorpay(options);
          rzpInstanceRef.current = razorpay;
          razorpay.open();
          console.log("🟢 Razorpay modal opened");
        } else {
          console.log("🔴 Razorpay SDK not loaded");
          alert("Payment gateway not available. Please try again.");
        }
      } else {
        console.log("🔴 createRazorpayOrder failed:", result.error);
        toast.error(result.payload || "Failed to create order");
      }
    });
    
    setShowPaymentModal(false);
  };

  const handlePlaceCodOrder = () => {
    console.log("🟢🟢🟢 HANDLE COD ORDER STARTED 🟢🟢🟢");
    if (rzpInstanceRef.current) { 
      console.log("🔵 Closing existing Razorpay instance");
      rzpInstanceRef.current.close(); 
      rzpInstanceRef.current = null; 
    }
    if (!validateOrder()) return;
    const orderPayload = { amount: Math.round(calculateFinalPricing.total || 0), freediscount: calculateFinalPricing.freediscount, ...createOrderData() };
    console.log("🟢 Dispatching placeCodOrder with:", orderPayload);
    dispatch(placeCodOrder(orderPayload)).then((result) => {
      console.log("🟢 COD order result:", result);
      if (result.type === "order/placeCodOrder/fulfilled") { 
        clearBuyNowData(); 
        navigate(`/order-confirmation/${result.payload.order.id}`); 
      } else {
        console.log("🔴 COD order failed:", result.error);
        alert("Failed to place COD order. Please try again.");
      }
    });
  };

  // ========== ✅ FIXED: PARTIAL COD ORDER ==========
  const handlePartialCodOrder = async () => {
    console.log("🟢🟢🟢 ========== HANDLE PARTIAL COD ORDER STARTED ========== 🟢🟢🟢");
    
    if (!validateOrder()) {
      console.log("🔴 Validation failed");
      toast.error("Please select a shipping address");
      return;
    }
    
    const onlineAmount = Math.round(calculateFinalPricing.total * partialPercentage / 100);
    const codAmount = calculateFinalPricing.total - onlineAmount;
    
    console.log("💰 Amounts:", { total: calculateFinalPricing.total, onlineAmount, codAmount, percentage: partialPercentage });
    
    const orderPayload = {
      items: getDisplayItems().map(item => ({
        productId: item.product?._id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        isBulkProduct: item.isBulkProduct || false,
        selectedColors: item.selectedColors,
        totalSets: item.quantity,
        totalPieces: item.totalPieces,
        piecesPerSet: item.piecesPerSet,
        pricePerSet: item.pricePerSet
      })),
      shippingAddress: { ...selectedAddress, phoneNumber: `+91${selectedAddress.phoneNumber}` },
      couponCode: appliedCoupon?.code || "",
      totalAmount: calculateFinalPricing.total,
      onlineAmount: onlineAmount,
      codAmount: codAmount,
      partialPercentage: partialPercentage,
      freediscount: calculateFinalPricing.freediscount
    };
    
    try {
      setShowPaymentModal(false);
      
      const result = await dispatch(createPartialCodOrder(orderPayload)).unwrap();
      
      console.log("✅ Partial COD order created:", result);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: result.razorpayOrder.amount,
        currency: "INR",
        name: "KsauniBliss",
        description: `Pay ${partialPercentage}% (₹${onlineAmount}) online, rest ₹${codAmount} on delivery`,
        order_id: result.razorpayOrder.id,
        handler: async (response) => {
          console.log("✅ Razorpay payment success:", response);
          try {
            await dispatch(verifyPartialCodPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })).unwrap();
            
            toast.success("Order placed successfully!");
            clearBuyNowData();
            navigate(`/order-confirmation/${result.orderId}`);
          } catch (err) {
            console.error("Verification failed:", err);
            toast.error("Payment successful but verification pending. Contact support.");
          }
        },
        prefill: {
          name: selectedAddress?.fullName,
          email: selectedAddress?.email || user?.email,
          contact: `+91${selectedAddress?.phoneNumber}`
        },
        theme: { color: "#ec4899" },
        modal: { 
          ondismiss: () => { 
            console.log("Modal closed");
            rzpInstanceRef.current = null; 
          } 
        }
      };
      
      const razorpay = new window.Razorpay(options);
      rzpInstanceRef.current = razorpay;
      razorpay.open();
      
    } catch (error) {
      console.error("🔴 Partial COD Error:", error);
      toast.error(error?.message || "Failed to process partial COD");
      setShowPaymentModal(true);
    }
  };

  const handleBackButton = () => {
    console.log("🔵 Back button clicked");
    setShowExitWarning(true);
  };
  
  const handleContinueCheckout = () => { 
    console.log("🔵 Continue checkout clicked");
    setShowExitWarning(false); 
    setShowExitWarningS(false); 
  };
  
  const handleExitButton = () => {
    console.log("🔵 Exit button clicked");
    setShowExitWarningS(true);
  };
  
  const handleSaveAndExit = async (reasons) => {
    console.log("🔵 Save and exit with reasons:", reasons);
    try { await axios.post(`${API_URL}/reason/cancellation`, { cancellationReasons: reasons }); } 
    catch (error) { console.error("Failed to save reasons:", error); }
    navigate('/cart');
  };

  useEffect(() => {
    console.log("🔵 Setting up back button handler");
    window.history.pushState({ page: 1 }, "", window.location.href);
    const onBackButtonEvent = (e) => { 
      console.log("🔵 Popstate event triggered");
      e.preventDefault(); 
      handleBackButton(); 
      window.history.pushState({ page: 1 }, "", window.location.href); 
    };
    window.addEventListener("popstate", onBackButtonEvent);
    return () => window.removeEventListener("popstate", onBackButtonEvent);
  }, []);

  const displayItems = getDisplayItems();
  const hasItems = displayItems.length > 0;
  const showPartialCodOption = partialCodEnabled && (isBulkBuyNow || displayItems.some(item => item.isBulkProduct));
  
  console.log("🔵 Show Partial COD option:", showPartialCodOption);
  console.log("🔵 Partial Percentage:", partialPercentage);
  console.log("🔵 Partial COD Enabled:", partialCodEnabled);
  console.log("🔵 Is Bulk Buy Now:", isBulkBuyNow);
  console.log("🔵 Display items count:", displayItems.length);

  if (!hasItems && !orderLoading.creating) {
    console.log("🔵 No items, showing empty cart");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">No items to checkout</h2>
          <button onClick={() => { clearBuyNowData(); navigate("/"); }} className="px-6 py-2 bg-red-600 text-white rounded-xl">Continue Shopping</button>
        </div>
      </div>
    );
  }

  console.log("🔵 Rendering checkout page with", displayItems.length, "items");

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={handleBackButton} className="mb-4 flex items-center gap-2 text-gray-600"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>

        {(orderError || couponError) && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-center">{orderError || couponError}</div>}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-red-600" /><h2 className="text-lg font-semibold">Shipping Address</h2></div>
                {addresses.length > 0 && <button onClick={startAdding} className="flex items-center text-red-600"><Plus className="w-4 h-4 mr-1" />Add New</button>}
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

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4"><Tag className="w-5 h-5 mr-2 text-red-600" /><h2 className="text-lg font-semibold">Apply Coupon</h2></div>
              {appliedCoupon ? (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-semibold">{appliedCoupon.code}</span>
                  <span>-₹{appliedCoupon.discountAmount}</span>
                  <button onClick={() => dispatch(removeCoupon())} className="text-red-500">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter promo code" className="flex-1 px-4 py-2 border rounded-lg" />
                  <button onClick={() => dispatch(validateCoupon({ code: couponCode, cartTotal: calculateFinalPricing.subtotal }))} disabled={!couponCode.trim() || couponLoading?.validating} className="px-6 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">Apply</button>
                </div>
              )}
              {filterNCoupon.length > 0 && (
                <div className="mt-4 space-y-2">
                  {displayItems.map(item => filterNCoupon.filter(c => item.product?.category?.name === c.couponcategories).map(coupon => (
                    <div key={coupon.code} className="p-3 border rounded-lg flex justify-between items-center">
                      <div><p className="font-medium">{coupon.code}</p><p className="text-xs text-gray-500">Min ₹{coupon.minOrderValue}</p></div>
                      <button onClick={() => dispatch(validateCoupon({ code: coupon.code, cartTotal: calculateFinalPricing.subtotal }))} className="px-3 py-1 bg-red-600 text-white text-sm rounded">Apply</button>
                    </div>
                  )))}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Order Summary</h2>
                <div className="flex items-center text-xs text-green-600"><Truck className="w-3 h-3 mr-1" />{calculateFinalPricing.shippingCharges === 0 ? "Free Shipping" : "Shipping: ₹99"}</div>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {displayItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                    <img src={item.product?.images?.[0]?.url} className="w-16 h-16 object-cover rounded" alt={item.product?.name} />
                    <div>
                      <h3 className="font-semibold">{item.product?.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity} | Size: {item.size || "M"} | Color: {item.color || "-"}</p>
                      <p className="font-bold">₹{item.product?.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{calculateFinalPricing.subtotal}</span></div>
                {calculateFinalPricing.discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-₹{calculateFinalPricing.discount}</span></div>}
                {calculateFinalPricing.freediscount > 0 && <div className="flex justify-between text-blue-600"><span>Free Discount</span><span>-₹{calculateFinalPricing.freediscount}</span></div>}
                <div className="flex justify-between"><span>Shipping</span><span>{calculateFinalPricing.shippingCharges === 0 ? "FREE" : `₹${calculateFinalPricing.shippingCharges}`}</span></div>
                <div className="flex justify-between pt-2 border-t"><span className="font-bold">Total</span><span className="text-xl font-bold text-red-600">₹{calculateFinalPricing.total}</span></div>
              </div>
              <button onClick={() => setShowPaymentModal(true)} className="w-full mt-6 py-3 bg-red-600 text-white rounded-xl font-semibold">Proceed to Payment</button>
              <div className="mt-4 flex justify-center text-xs text-gray-500"><Shield className="w-4 h-4 mr-1" />Secure Checkout</div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
          <button onClick={() => setShowPaymentModal(true)} className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold">Proceed to Payment</button>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddressPopup && <AddressPopup isOpen={showAddressPopup} onClose={cancelEditing} onSave={handleSaveAddress} editingAddress={editingAddress} user={user} />}
      </AnimatePresence>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onOnline={handlePlaceOrder}
        onCOD={handlePlaceCodOrder}
        onPartialCod={handlePartialCodOrder}
        amount={calculateFinalPricing.total}
        showPartialCod={showPartialCodOption}
        partialPercentage={partialPercentage}
        isBulkProduct={isBulkBuyNow || displayItems.some(item => item.isBulkProduct)}
      />

      <CongratulationsModal isOpen={showCongratulationsPopup} onClose={() => setShowCongratulationsPopup(false)} couponCode={congratulationsData.couponCode} savingsAmount={congratulationsData.savingsAmount} />
      <ExitWarningModal isOpen={showExitWarning} onContinue={handleContinueCheckout} onExit={handleExitButton} message={{ title: "Wait! Don't Go Yet!", description: "You're about to leave behind an exclusive FREE GIFT!" }} />
      <ExitWarningModal isOpen={showExitWarningS} onContinue={handleContinueCheckout} onExit={handleSaveAndExit} type="survey" />
    </div>
  );
};

export default CheckoutPage;

console.log("🔵 CheckoutPage.jsx exported successfully");