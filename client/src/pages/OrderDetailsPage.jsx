
"use client";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  Truck,
  X,
  CreditCard,
  MapPin,
  Info,
  AlertCircle,
  Tag,
  DollarSign,
} from "lucide-react";
import { fetchOrderDetails, clearError, trackOrderInfo } from "../store/slices/orderSlice";
import LoadingSpinner from "../components/LoadingSpinner";
const OrderDetailsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const {
    currentOrder: order,
    loading,
    error,
  } = useSelector((state) => state.orders || {});
  const [activeSection, setActiveSection] = useState("items");
  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderDetails(orderId));
    }
  }, [dispatch, orderId]);
  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000);
    }
  }, [error, dispatch]);
  const handleFetchTracking = () => {
    if (order && order._id) {
      dispatch(trackOrderInfo(order));
    }
  };
  // const orderState = useSelector((state) => state.order);
  // const tracking = order.trackingInfo; // from Redux
  // const trackLoading = order.trackLoading;
  const tracking = order?.trackingInfo || {};
  const trackLoading = order?.trackLoading || false;
  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "processing":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-purple-600" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "cancelled":
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "text-green-800 bg-green-100";
      case "processing":
        return "text-blue-800 bg-blue-100";
      case "shipped":
        return "text-purple-800 bg-purple-100";
      case "delivered":
        return "text-green-800 bg-green-100";
      case "cancelled":
        return "text-red-800 bg-red-100";
      default:
        return "text-gray-800 bg-gray-100";
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Order Confirmed";
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
  if (loading?.fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-xl bg-white p-8 text-center shadow-2xl"
        >
          <AlertCircle className="mx-auto mb-6 h-20 w-20 text-red-500" />
          <h2 className="mb-3 text-2xl font-extrabold text-gray-800">
            Oops! Order Not Found
          </h2>
          <p className="mb-8 text-gray-600">
            {error ||
              "The order details could not be retrieved. It might not exist or an error occurred. Please try again later."}
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-red-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <ArrowLeft className="mr-3 h-5 w-5" />
            Back to All Orders
          </button>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 py-12 font-sans">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-7xl"
        >
          {/* Header */}
          <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row md:mb-12">
            <button
              onClick={() => navigate("/orders")}
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Orders
            </button>
            <h1 className="text-4xl font-extrabold text-gray-900 drop-shadow-sm sm:text-5xl">
              Order <span className="text-red-600">#{order.orderNumber || "N/A"}</span>
            </h1>
            <div className="md:w-auto w-full"></div>
          </div>
          {/* Order Summary Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100"
          >
            <div className="border-b border-gray-100 p-8">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center space-x-5">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${getStatusColor(order.status).replace("text-", "bg-").replace("-800", "-600")} bg-opacity-20`}
                  >
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {getStatusText(order.status)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`rounded-full px-4 py-1 text-sm font-semibold ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                  <span className="text-4xl font-extrabold text-red-700">
                    ₹{order.pricing?.total || 0}
                  </span>
                </div>
              </div>
            </div>
            {order.status === "cancelled" && order.cancelReason && (
              <div className="border-t border-red-200 bg-red-50 p-6 text-red-700">
                <p className="flex items-center text-base font-medium">
                  <Info className="mr-3 h-5 w-5" />
                  Order Cancelled:{" "}
                  <span className="ml-1 font-semibold italic">
                    "{order.cancelReason}"
                  </span>{" "}
                  on{" "}
                  {order.cancelledAt
                    ? new Date(order.cancelledAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "N/A"}
                </p>
              </div>
            )}
          </motion.div>
          {/* Interactive Sections */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100"
          >
            <div className="mb-8 flex flex-wrap justify-center gap-4 border-b border-gray-100 pb-6">
              <button
                onClick={() => setActiveSection("items")}
                className={`flex-1 min-w-[150px] rounded-xl px-6 py-3 text-center text-base font-semibold transition-all duration-200 ${activeSection === "items"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Order Items
              </button>
              <button
                onClick={() => setActiveSection("address")}
                className={`flex-1 min-w-[150px] rounded-xl px-6 py-3 text-center text-base font-semibold transition-all duration-200 ${activeSection === "address"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Shipping & Payment
              </button>
              <button
                onClick={() => setActiveSection("tracking")}
                className={`flex-1 min-w-[150px] rounded-xl px-6 py-3 text-center text-base font-semibold transition-all duration-200 ${activeSection === "tracking"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Tracking Info
              </button>
            </div>
            {/* Render Section Content */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={activeSection}
              transition={{ duration: 0.3 }}
            >
              {activeSection === "items" && (
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-gray-800">
                    Your Order Items
                  </h2>
                  {order.items && order.items.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {order.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-center space-x-4 rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm transition-transform hover:scale-[1.01]"
                        >
                          <img
                            src={
                              item?.product?.images?.[0]?.url ||
                              "https://placehold.co/80x80/E0E7FF/6366F1?text=No+Image"
                            }
                            alt={item?.product?.name || "Product"}
                            className="h-20 w-20 flex-shrink-0 rounded-xl object-cover shadow-sm"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/80x80/E0E7FF/6366F1?text=No+Image"; }}
                          />
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-800">
                              {item?.name || "N/A"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Qty: {item?.quantity || 0}
                            </p>
                            <p className="text-sm text-gray-600">
                              Size: {item?.size || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Color: {item?.color || "N/A"}
                            </p>
                          </div>
                          <span className="text-xl font-bold text-red-600">
                            ₹{(item?.price || 0) * (item?.quantity || 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-lg text-gray-600">
                      No items found for this order.
                    </p>
                  )}
                  <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-8 shadow-inner">
                    <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
                      <DollarSign className="mr-3 h-6 w-6 text-gray-600" />
                      Pricing Summary
                    </h2>
                    <div className="space-y-3 text-lg text-gray-700">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span>Subtotal:</span>
                        <span className="font-semibold">
                          ₹{order.pricing?.subtotal || 0}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span>Shipping:</span>
                        <span className="font-semibold">
                          ₹{order.pricing?.shipping || 0}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span>Free Discount:</span>
                        <span className="font-semibold text-blue-600">
                          - ₹{order.pricing?.freediscount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span>Discount:</span>
                        <span className="font-semibold text-green-600">
                          - ₹{order.pricing?.discount || 0}
                        </span>
                      </div>
                      {Number(order.pricing?.deliveryCharge) > 0 && (
                        <div className="flex justify-between">
                          <span>Cash on Delivery charge</span>
                          <span>₹{Number(order.pricing?.deliveryCharge)}</span>
                        </div>
                      )}
                      {order.couponCode && (
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="flex items-center">
                            <Tag className="h-5 w-5 mr-2 text-gray-500" />Coupon Applied:
                          </span>
                          <span className="font-semibold text-green-700">
                            {order.couponCode}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-4 text-2xl font-extrabold text-gray-900">
                        <span>Total Paid:</span>
                        <span>₹{order.pricing?.total || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeSection === "address" && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Shipping Address */}
                  <div className="rounded-xl border border-gray-200 p-8 shadow-sm">
                    <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
                      <MapPin className="mr-3 h-6 w-6 text-gray-600" />
                      Shipping Address
                    </h2>
                    <div className="space-y-4 text-base text-gray-700">
                      <p>
                        <span className="font-semibold text-gray-900">
                          Full Name:
                        </span>{" "}
                        {order.shippingAddress?.fullName || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">
                          Phone Number:
                        </span>{" "}
                        {order.shippingAddress?.phoneNumber || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">
                          Address:
                        </span>{" "}
                        {order.shippingAddress?.addressLine1 || "N/A"}
                        {order.shippingAddress?.addressLine2
                          ? `, ${order.shippingAddress.addressLine2}`
                          : ""}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">
                          City:
                        </span>{" "}
                        {order.shippingAddress?.city || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">
                          State:
                        </span>{" "}
                        {order.shippingAddress?.state || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">
                          Pincode:
                        </span>{" "}
                        {order.shippingAddress?.pinCode || "N/A"}
                      </p>
                      {order.shippingAddress?.landmark && (
                        <p>
                          <span className="font-semibold text-gray-900">
                            Landmark:
                          </span>{" "}
                          {order.shippingAddress?.landmark}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Payment Information */}
                  <div className="rounded-xl border border-gray-200 p-8 shadow-sm">
                    <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
                      <CreditCard className="mr-3 h-6 w-6 text-gray-600" />
                      Payment Information
                    </h2>
                    <div className="space-y-4 text-base text-gray-700">
                      <p>
                        <span className="font-semibold text-gray-900">
                          Payment Method:
                        </span>{" "}
                        {order.paymentInfo?.method || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">
                          Payment Status:
                        </span>{" "}
                        <span
                          className={`font-extrabold ${order.paymentInfo?.paymentStatus === "paid" || order.paymentInfo?.status === "PAID"
                            ? "text-green-700"
                            : "text-red-700"
                            }`}
                        >
                          {order.paymentInfo?.paymentStatus || order.paymentInfo?.status || "N/A"}
                        </span>
                      </p>
                      {order.paymentInfo?.razorpayOrderId && (
                        <p>
                          <span className="font-semibold text-gray-900">
                            Razorpay Order ID:
                          </span>{" "}
                          <span className="font-mono text-sm">
                            {order.paymentInfo?.razorpayOrderId}
                          </span>
                        </p>
                      )}
                      {order.paymentInfo?.razorpayPaymentId && (
                        <p>
                          <span className="font-semibold text-gray-900">
                            Razorpay Payment ID:
                          </span>{" "}
                          <span className="font-mono text-sm">
                            {order.paymentInfo?.razorpayPaymentId}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeSection === "tracking" && (
                <div className="rounded-xl border border-gray-200 p-8 shadow-sm">
                  <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
                    <Truck className="mr-3 h-6 w-6 text-gray-600" />
                    Tracking Information
                  </h2>
                  {/*
                    The existing logic correctly handles the request.
                    1. It checks if `order.trackingInfo?.trackingUrl` exists.
                    2. If it does, it shows the "View Live Tracking" button.
                    3. If it doesn't, it checks if the order status is "shipped" AND there's no tracking URL.
                    4. If both are true, it shows the "Refresh Tracking" button, which calls `handleFetchTracking`.
                    5. The `handleFetchTracking` function dispatches a Redux thunk (`trackOrderInfo`) to get the URL.
                    6. Once the URL is successfully fetched and the Redux state is updated, `order.trackingInfo?.trackingUrl` will no longer be null, and the component will re-render, displaying the "View Live Tracking" button.
                  */}
                  {/* {order.trackingUrl ? (
                    <div>
                      <p className="py-2 text-lg text-gray-800">
                        Your order is on its way! Click the button below to see the latest tracking status.
                      </p>
                      <button
                        onClick={() => window.open(order.trackingUrl, "_blank")}
                        className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <Package className="mr-3 h-5 w-5" /> View Live Tracking
                      </button>
                    </div>
                  ) : !order?.trackingUrl ? (
                    <div className="py-8 text-center">
                      <p className="text-lg text-gray-600 mb-4">
                        We're currently fetching the latest tracking information for you.
                      </p>
                      <button
                        onClick={handleFetchTracking}
                        disabled={loading.tracking}
                        className={`inline-flex items-center rounded-xl px-6 py-3 font-semibold text-white transition-colors shadow-md ${
                          loading.tracking ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {loading.tracking ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <Truck className="mr-3 h-5 w-5" /> Refresh Tracking
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-lg text-gray-600">
                      Tracking information will be available once your order has been shipped.
                    </p>
                  )} */}
                  {tracking.trackingUrl ? (
                    <div>
                      <p className="py-2 text-lg text-gray-800">
                        Your order is on its way! Click the button below to see the latest tracking status.
                      </p>
                      <button
                        onClick={() => window.open(tracking, "_blank")}
                        className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-blue-700"
                      >
                        <Package className="mr-3 h-5 w-5" /> View Live Tracking
                      </button>
                    </div>
                  ) : tracking?.message === "No tracking info yet" ? (
                    // <p className="py-8 text-center text-lg text-gray-600">
                    //   Tracking information will be available once your order has been shipped.
                    // </p>
                    <div className="py-8 text-center">
                      <p className="text-lg text-gray-600 mb-4">
                        Tracking information will be available once your order has been shipped.
                      </p>
                      <button
                        onClick={handleFetchTracking}
                        disabled={trackLoading}
                        className={`inline-flex items-center rounded-xl px-6 py-3 font-semibold text-white shadow-md ${trackLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                          }`}
                      >
                        {trackLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" /> Fetching...
                          </>
                        ) : (
                          <>
                            <Truck className="mr-3 h-5 w-5" /> Refresh Tracking
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-lg text-gray-600 mb-4">
                        We're currently fetching the latest tracking information for you.
                      </p>
                      <button
                        onClick={handleFetchTracking}
                        disabled={trackLoading}
                        className={`inline-flex items-center rounded-xl px-6 py-3 font-semibold text-white shadow-md ${trackLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                          }`}
                      >
                        {trackLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" /> Fetching...
                          </>
                        ) : (
                          <>
                            <Truck className="mr-3 h-5 w-5" /> Refresh Tracking
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
export default OrderDetailsPage;