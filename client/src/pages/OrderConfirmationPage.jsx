// src/pages/OrderConfirmationPage.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Calendar,
  ArrowRight,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Home,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import { fetchOrderDetails } from "../store/slices/orderSlice";
import LoadingSpinner from "../components/LoadingSpinner";

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth || {});

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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
  }, [token, API_URL]);

  const filterYCoupon = coupons.filter((coupon) => coupon.isFreeCoupon !== "N");
  const { currentOrder, loading } = useSelector((state) => state.orders || {});

  useEffect(() => {
    if (orderId) dispatch(fetchOrderDetails(orderId));
  }, [orderId, dispatch]);

  // Safe pricing calculation
  const safePricing = useMemo(() => {
    const o = currentOrder || {};
    const p = o.pricing || {};
    const items = Array.isArray(o.items) ? o.items : [];
    const calcItemsSubtotal = items.reduce((sum, it) => {
      const q = Number(it?.quantity || 0);
      const price = Number(it?.price || 0);
      const itemTotal = it?.itemTotal != null ? Number(it.itemTotal) : price * q;
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
    const subtotal = p.subtotal ?? o.subtotal ?? calcItemsSubtotal;
    const freediscount = p.freediscount ?? o.freediscount ?? 0;
    const referralDiscount = p.referralDiscount ?? o.referralDiscount ?? 0;
    const shippingCharges = p.shippingCharges ?? o.shippingCharge ?? 0;
    const discount = p.discount ?? 0;
    const total = Math.round(subtotal + Number(shippingCharges || 0) - Number(discount || 0) - Number(freediscount || 0) - Number(referralDiscount || 0));
    return {
      subtotal,
      shippingCharges,
      discount,
      total,
      freediscount,
      referralDiscount
    };
  }, [currentOrder]);

  // Get partial COD info
  const partialCodInfo = useMemo(() => {
    const o = currentOrder || {};
    const partial = o.partialCod || {};
    const paymentMethod = o.paymentInfo?.method || "";
    
    if (paymentMethod === "PARTIAL_COD" && partial.enabled) {
      return {
        isPartialCod: true,
        onlineAmount: partial.onlineAmount || 0,
        codAmount: partial.codAmount || 0,
        percentage: partial.percentage || 0,
        onlinePaymentStatus: partial.onlinePaymentStatus || "PENDING"
      };
    }
    return { isPartialCod: false };
  }, [currentOrder]);

  // Order timeline steps
  const getOrderSteps = () => {
    const status = String(currentOrder?.status || "").toLowerCase();
    const normalized = status === "placed" ? "confirmed" : status;
    const steps = [
      { key: "confirmed", label: "Confirmed", icon: CheckCircle },
      { key: "processing", label: "Processing", icon: Package },
      { key: "shipped", label: "Shipped", icon: Truck },
      { key: "delivered", label: "Delivered", icon: Home },
    ];
    let currentIndex = steps.findIndex(s => s.key === normalized);
    if (currentIndex === -1 && normalized === "cancelled") currentIndex = -2;
    return steps.map((step, idx) => ({
      ...step,
      completed: idx <= currentIndex && currentIndex !== -2,
      active: idx === currentIndex && currentIndex !== -2,
    }));
  };

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    const normalized = s === "placed" ? "confirmed" : s;
    switch (normalized) {
      case "confirmed":
        return "text-red-700 bg-red-50 border-red-200";
      case "processing":
        return "text-red-700 bg-red-50 border-red-200";
      case "shipped":
        return "text-red-700 bg-red-50 border-red-200";
      case "delivered":
        return "text-green-700 bg-green-50 border-green-200";
      case "cancelled":
        return "text-gray-500 bg-gray-100 border-gray-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    const s = String(status || "").toLowerCase();
    const normalized = s === "placed" ? "confirmed" : s;
    switch (normalized) {
      case "confirmed":
        return "Confirmed";
      case "processing":
        return "Processing";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return "Pending";
    }
  };

  // Estimated delivery date
  const estimatedDeliveryDate = useMemo(() => {
    const base = currentOrder?.trackingInfo?.estimatedDelivery
      ? new Date(currentOrder.trackingInfo.estimatedDelivery)
      : currentOrder?.createdAt
        ? new Date(currentOrder.createdAt)
        : new Date();
    if (!currentOrder?.trackingInfo?.estimatedDelivery) {
      base.setDate(base.getDate() + 7);
    }
    return base;
  }, [currentOrder]);

  if (loading?.fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800">Order not found</h2>
          <p className="mb-4 text-sm text-gray-500">
            The order you're looking for doesn't exist
          </p>
          <button
            onClick={() => navigate("/")}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const paymentMethod = String(currentOrder?.paymentInfo?.method || currentOrder?.paymentInfo?.paymentMethod || "").toUpperCase();
  const isCOD = paymentMethod === "COD";
  const isPartialCOD = paymentMethod === "PARTIAL_COD";
  const isOnline = paymentMethod === "RAZORPAY";
  const orderSteps = getOrderSteps();

  return (
    <div className="min-h-screen bg-white py-6">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
          {/* Success Header - White/Red */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="relative mb-6 text-center"
          >
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <CheckCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Order Confirmed!</h1>
            <p className="text-sm text-gray-500">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </motion.div>

          {/* Order Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">
                    Order #{currentOrder.orderNumber}
                  </h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(
                      currentOrder.status
                    )}`}
                  >
                    {getStatusText(currentOrder.status)}
                  </span>
                </div>
                <p className="mt-1 flex items-center text-xs text-gray-500">
                  <Calendar className="mr-1 h-3 w-3" />
                  Placed on{" "}
                  {new Date(currentOrder.createdAt || Date.now()).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => navigate("/orders")}
                className="text-xs font-medium text-red-600 hover:text-red-700 inline-flex items-center"
              >
                View All Orders
                <ArrowRight className="ml-1 h-3 w-3" />
              </button>
            </div>
          </motion.div>

          {/* Order Timeline - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <Clock className="mr-1.5 h-4 w-4 text-red-600" />
              Order Progress
            </h3>
            <div className="relative">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200"></div>
              <div className="relative flex justify-between">
                {orderSteps.map((step, idx) => (
                  <div key={step.key} className="flex flex-col items-center flex-1 text-center">
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                        step.completed
                          ? "bg-red-600 text-white shadow-sm"
                          : step.active
                          ? "bg-red-100 text-red-600 border-2 border-red-600"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                    </div>
                    <p
                      className={`mt-1 text-[11px] font-medium ${
                        step.completed || step.active ? "text-red-700" : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <ShoppingBag className="mr-1.5 h-4 w-4 text-red-600" />
              Items Ordered ({currentOrder.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {(currentOrder.items || []).map((item, index) => {
                const img =
                  item.image ||
                  item?.product?.images?.[0]?.url ||
                  "/placeholder.svg";
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-2 rounded-md border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center"
                  >
                    <img
                      src={img}
                      alt={item.name || item?.product?.name || "Item"}
                      className="h-14 w-14 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-800">
                        {item.name || item?.product?.name}
                      </h4>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-red-600">
                        ₹
                        {item.itemTotal != null
                          ? item.itemTotal
                          : Number(item.price || 0) * Number(item.quantity || 0)}
                      </p>
                      <p className="text-xs text-gray-500">₹{Number(item.price || 0)} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Two Column Layout for Shipping & Payment - Compact */}
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            {/* Shipping Information */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <h3 className="mb-3 flex items-center border-b border-gray-100 pb-2 text-sm font-semibold text-gray-800">
                <MapPin className="mr-1.5 h-4 w-4 text-red-600" />
                Shipping Address
              </h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p className="font-medium">{currentOrder?.shippingAddress?.fullName}</p>
                <p>{currentOrder?.shippingAddress?.addressLine1}</p>
                {currentOrder?.shippingAddress?.addressLine2 && <p>{currentOrder.shippingAddress.addressLine2}</p>}
                <p>
                  {currentOrder?.shippingAddress?.city}, {currentOrder?.shippingAddress?.state} -{" "}
                  {currentOrder?.shippingAddress?.pinCode}
                </p>
                <p className="flex items-center gap-1 text-xs">
                  <Phone className="h-3 w-3 text-gray-400" />
                  {currentOrder?.shippingAddress?.phoneNumber}
                </p>
                <p className="flex items-center gap-1 text-xs">
                  <Mail className="h-3 w-3 text-gray-400" />
                  {currentOrder?.shippingAddress?.email}
                </p>
              </div>
              <div className="mt-3 rounded-md bg-red-50 p-3">
                <div className="flex items-center text-red-700">
                  <Truck className="mr-1.5 h-4 w-4" />
                  <span className="text-xs font-medium">Estimated Delivery</span>
                </div>
                <p className="mt-0.5 text-sm font-bold text-red-800">
                  {estimatedDeliveryDate.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                </p>
                <p className="text-[11px] text-red-600">5-7 business days</p>
              </div>
            </motion.div>

            {/* Payment & Pricing */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <h3 className="mb-3 flex items-center border-b border-gray-100 pb-2 text-sm font-semibold text-gray-800">
                <CreditCard className="mr-1.5 h-4 w-4 text-red-600" />
                Payment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">₹{safePricing.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className={Number(safePricing.shippingCharges) === 0 ? "text-green-600 font-medium" : "text-gray-800"}>
                    {Number(safePricing.shippingCharges) === 0 ? "FREE" : `₹${safePricing.shippingCharges}`}
                  </span>
                </div>
                {Number(safePricing.discount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-₹{safePricing.discount}</span>
                  </div>
                )}
                {Number(safePricing.freediscount) > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Special Discount</span>
                    <span>-₹{Math.round(safePricing.freediscount)}</span>
                  </div>
                )}
                {Number(safePricing.referralDiscount) > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>Referral Discount</span>
                    <span>-₹{Math.round(safePricing.referralDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="text-red-600">₹{safePricing.total}</span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-3 rounded-md bg-gray-50 p-3">
                {isCOD && (
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Cash on Delivery</p>
                      <p className="text-xs text-gray-600">Pay ₹{safePricing.total} when you receive the order</p>
                    </div>
                  </div>
                )}
                {isOnline && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Payment Successful</p>
                      <p className="text-xs text-gray-600">Amount ₹{safePricing.total} paid via Razorpay</p>
                    </div>
                  </div>
                )}
                {isPartialCOD && partialCodInfo.isPartialCod && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 rounded-full bg-orange-100 p-0.5">
                        <AlertCircle className="h-3 w-3 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Partial COD</p>
                        <p className="text-xs text-gray-600">
                          {partialCodInfo.percentage}% paid online, remaining on delivery
                        </p>
                      </div>
                    </div>
                    <div className="pl-6 text-xs space-y-1">
                      <p className="flex justify-between">
                        <span className="text-gray-500">Online Payment:</span>
                        <span className="font-medium text-emerald-600">₹{partialCodInfo.onlineAmount}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">Cash on Delivery:</span>
                        <span className="font-medium text-orange-600">₹{partialCodInfo.codAmount}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {user && (
              <button
                onClick={() => navigate("/orders")}
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                <Calendar className="mr-1.5 h-4 w-4" />
                View All Orders
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Continue Shopping
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          </motion.div>

          {/* Support Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center"
          >
            <h3 className="mb-1 text-sm font-semibold text-gray-800">Need Help?</h3>
            <p className="mb-2 text-xs text-gray-500">
              If you have any questions about your order, feel free to contact us.
            </p>
            <div className="flex flex-col justify-center gap-2 text-xs sm:flex-row">
              <a href="mailto:info@factorysaleusa.com" className="text-red-600 hover:text-red-700 inline-flex items-center">
                <Mail className="mr-1 h-3 w-3" />
                info@factorysaleusa.com
              </a>
              <a href="tel:+9211891719" className="text-red-600 hover:text-red-700 inline-flex items-center">
                <Phone className="mr-1 h-3 w-3" />
                +91 8830155383
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;