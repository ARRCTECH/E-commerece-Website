
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
} from "lucide-react";
import { fetchOrderDetails } from "../store/slices/orderSlice";
import LoadingSpinner from "../components/LoadingSpinner";

const OrderConfirmationPage = () => {
  // NOTE: keep the param name as in your routes
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth || {});

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
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
  // same slice/shape as your file
  const { currentOrder, loading } = useSelector((state) => state.orders || {});
  useEffect(() => {
    if (orderId) dispatch(fetchOrderDetails(orderId));
  }, [orderId, dispatch]);
  // ----- Safety: normalize pricing regardless of where totals are stored -----
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
    const freediscount = p.freediscount;
    const shippingCharges = p.shippingCharges ?? o.shippingCharge ?? 0;
    const deliveryCharge = p.deliveryCharge ?? o.deliveryCharge ?? 0;
    const discount = p.discount ?? 0;
    const tax = p.tax ?? 0;
    const total = Math.round(subtotal + Number(shippingCharges || 0) + Number(deliveryCharge || 0) + Number(tax || 0) - Number(discount || 0) - Number(freediscount || 0));
    return {
      subtotal,
      shippingCharges,
      deliveryCharge,
      discount,
      tax,
      total,
      freediscount
    };
  }, [currentOrder]);
  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    const normalized = s === "placed" ? "confirmed" : s; // backend may send "PLACED"
    switch (normalized) {
      case "confirmed":
        return "text-green-600 bg-green-100";
      case "processing":
        return "text-blue-600 bg-blue-100";
      case "shipped":
        return "text-purple-600 bg-purple-100";
      case "delivered":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };
  const getStatusText = (status) => {
    const s = String(status || "").toLowerCase();
    const normalized = s === "placed" ? "confirmed" : s;
    switch (normalized) {
      case "confirmed":
        return "Order Confirmed";
      case "processing":
        return "Processing";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      default:
        return "Pending";
    }
  };
  // estimated delivery (fallback: order.createdAt + 7 days)
  const estimatedDeliveryDate = (() => {
    const base = currentOrder?.trackingInfo?.estimatedDelivery
      ? new Date(currentOrder.trackingInfo.estimatedDelivery)
      : currentOrder?.createdAt
        ? new Date(currentOrder.createdAt)
        : new Date();
    if (!currentOrder?.trackingInfo?.estimatedDelivery) {
      base.setDate(base.getDate() + 7);
    }
    return base;
  })();
  // AWB/banner
  const awbStatus = currentOrder?.trackingInfo?.awbStatus || "PENDING";
  const awbError =
    currentOrder?.trackingInfo?.awbError ||
    currentOrder?.trackingInfo?.error ||
    null;
  if (loading?.fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!currentOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Order not found</h2>
          <p className="mb-4 text-gray-600">
            The order you're looking for doesn't exist
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="container px-4 mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          {/* Success Header */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-green-100 rounded-full">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-800">Order Confirmed!</h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </motion.div>
          {/* AWB failure banner (non-blocking) */}
          {awbStatus === "FAILED" && (
            <div className="p-3 mb-6 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded">
              Shipping label pending: {awbError || "We’ll retry shortly."}
            </div>
          )}
          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 mb-6 bg-white rounded-lg shadow-md"
          >
            <div className="flex flex-col mb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="mb-1 text-xl font-semibold">
                  Order #{currentOrder.orderNumber}
                </h2>
                <p className="text-gray-600">
                  Placed on{" "}
                  {new Date(currentOrder.createdAt || Date.now()).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    currentOrder.status
                  )}`}
                >
                  {getStatusText(currentOrder.status)}
                </span>
              </div>
            </div>
            {/* Order Items */}
            <div className="pt-6 border-t">
              <h3 className="flex items-center mb-4 font-semibold">
                <Package className="w-5 h-5 mr-2 text-red-600" />
                Items Ordered ({currentOrder.items?.length || 0})
              </h3>
              <div className="space-y-4">
                {(currentOrder.items || []).map((item, index) => {
                  const img =
                    item.image ||
                    item?.product?.images?.[0]?.url ||
                    "/placeholder.svg";
                  return (
                    <div key={index} className="flex items-center p-4 space-x-4 rounded-lg bg-gray-50">
                      <img src={img} alt={item.name || item?.product?.name || "Item"} className="object-cover w-16 h-16 rounded-lg" />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name || item?.product?.name}</h4>
                        <p className="text-sm text-gray-600">
                          Size: {item.size || "—"} | Color: {item.color || "—"} | Quantity:{" "}
                          {item.quantity}
                        </p>
                        <p className="font-semibold">₹{Number(item.price || 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{(item.itemTotal != null ? item.itemTotal : Number(item.price || 0) * Number(item.quantity || 0))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Shipping Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 bg-white rounded-lg shadow-md"
            >
              <h3 className="flex items-center mb-4 font-semibold">
                <MapPin className="w-5 h-5 mr-2 text-red-600" />
                Shipping Address
              </h3>
              <div className="text-gray-700">
                <p className="font-medium">{currentOrder?.shippingAddress?.fullName}</p>
                <p>{currentOrder?.shippingAddress?.addressLine1}</p>
                {currentOrder?.shippingAddress?.addressLine2 && <p>{currentOrder.shippingAddress.addressLine2}</p>}
                <p>
                  {currentOrder?.shippingAddress?.city}, {currentOrder?.shippingAddress?.state} -{" "}
                  {currentOrder?.shippingAddress?.pinCode}
                </p>
                <p className="mt-2">Phone: {currentOrder?.shippingAddress?.phoneNumber}</p>
                <p>Email: {currentOrder?.shippingAddress?.email}</p>
              </div>
              <div className="p-3 mt-4 rounded-lg bg-blue-50">
                <div className="flex items-center text-blue-700">
                  <Truck className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Estimated Delivery</span>
                </div>
                <p className="font-semibold text-blue-800">
                  {estimatedDeliveryDate.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <p className="text-xs text-blue-600">5-7 business days</p>
              </div>
            </motion.div>
            {/* Payment & Pricing */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 bg-white rounded-lg shadow-md"
            >
              <h3 className="flex items-center mb-4 font-semibold">
                <CreditCard className="w-5 h-5 mr-2 text-red-600" />
                Payment Details
              </h3>
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{safePricing.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className={Number(safePricing.shippingCharges) === 0 ? "text-green-600" : ""}>
                    {Number(safePricing.shippingCharges) === 0 ? "FREE" : `₹${safePricing.shippingCharges}`}
                  </span>
                </div>
                {Number(safePricing.deliveryCharge) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Cash on Delivery charge</span>
                    <span>₹{Number(safePricing.deliveryCharge)}</span>
                  </div>
                )}
                {Number(safePricing.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{safePricing.discount}</span>
                  </div>
                )}
                {safePricing.freediscount > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Free Discount</span>
                    <span>-₹{Math.round(safePricing.freediscount)}</span>
                  </div>)}
                <div className="flex justify-between text-sm">
                  <span>Tax (GST)</span>
                  <span>₹{safePricing.tax}</span>
                </div>
                <div className="flex justify-between pt-2 font-semibold border-t">
                  <span>{String(currentOrder?.paymentInfo?.paymentMethod || currentOrder?.paymentInfo?.method).toUpperCase() === "COD" ? 'Final amount to be collected' : 'Total Paid'}</span>
                  <span>₹{safePricing.total}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                {String(currentOrder?.paymentInfo?.paymentMethod || currentOrder?.paymentInfo?.method).toUpperCase() === "COD" ? (
                  <p className="text-sm font-medium text-green-800">Payment Method: COD</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-green-800">Payment Successful</p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col justify-center gap-4 mt-8 sm:flex-row"
          >
            {user && (
              <button
                onClick={() => navigate("/orders")}
                className="flex items-center justify-center px-6 py-3 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
              >
                <Calendar className="w-5 h-5 mr-2" />
                View All Orders
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center px-6 py-3 text-red-600 transition-colors border border-red-600 rounded-xl hover:bg-red-50"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
          {/* Support Info */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="p-6 mt-8 text-center bg-white rounded-lg shadow-md">
            <h3 className="mb-2 font-semibold">Need Help?</h3>
            <p className="mb-4 text-sm text-gray-600">
              If you have any questions about your order, feel free to contact us.
            </p>
            <div className="flex flex-col justify-center gap-4 text-sm sm:flex-row">
              <a href="mailto:support@ksaunibliss.com" className="text-red-600 hover:text-red-700">
                Email: support@ksaunibliss.com
              </a>
              <a href="tel:+9211891719" className="text-red-600 hover:text-red-700">
                Phone: +91 9211891719
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
export default OrderConfirmationPage;