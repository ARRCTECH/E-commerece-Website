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
  Layers,
  Palette,
  Ruler,
} from "lucide-react";
import { fetchOrderDetails, clearError } from "../store/slices/orderSlice";
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

  // ✅ Check if order contains bulk products
  const isBulkOrder = () => {
    return order?.items?.some(item => item.isBulkProduct === true);
  };

  // ✅ Format bulk item display text
  const getBulkItemDisplay = (item) => {
    if (item.isBulkProduct) {
      const pieces = item.totalPieces || (item.piecesPerSet * (item.totalSets || item.quantity));
      const sets = item.totalSets || item.quantity;
      return `${pieces} pieces (${sets} set${sets > 1 ? 's' : ''})`;
    }
    return `Qty: ${item.quantity}`;
  };

  // ✅ Get item price display
  const getItemPrice = (item) => {
    if (item.isBulkProduct && item.pricePerSet) {
      return `₹${item.pricePerSet}/set`;
    }
    return `₹${item.price}`;
  };

  // ✅ Get item total price
  const getItemTotal = (item) => {
    if (item.isBulkProduct) {
      const sets = item.totalSets || item.quantity || 1;
      const pricePerSet = item.pricePerSet || item.price || 0;
      return pricePerSet * sets;
    }
    return (item.price || 0) * (item.quantity || 1);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
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
    switch (status?.toLowerCase()) {
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
    switch (status?.toLowerCase()) {
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

  const isBulk = isBulkOrder();

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
              {isBulk && (
                <span className="ml-3 inline-block rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white">
                  BULK ORDER
                </span>
              )}
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
                    className={`rounded-full px-4 py-1 text-sm font-semibold ${getStatusColor(order.status)}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                  <span className="text-4xl font-extrabold text-red-700">
                    ₹{order.pricing?.total || order.total || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Partial COD Info */}
            {order.partialCod?.enabled && (
              <div className="border-t border-blue-200 bg-blue-50 p-6 text-blue-700">
                <p className="flex items-center text-base font-medium">
                  <Info className="mr-3 h-5 w-5" />
                  Partial COD Order - 
                  <span className="ml-1 font-semibold">
                    {order.partialCod.percentage}% (₹{order.partialCod.onlineAmount}) paid online, 
                    ₹{order.partialCod.codAmount} to be paid on delivery
                  </span>
                </p>
              </div>
            )}

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
                className={`flex-1 min-w-[150px] rounded-xl px-6 py-3 text-center text-base font-semibold transition-all duration-200 ${
                  activeSection === "items"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Order Items
              </button>
              <button
                onClick={() => setActiveSection("address")}
                className={`flex-1 min-w-[150px] rounded-xl px-6 py-3 text-center text-base font-semibold transition-all duration-200 ${
                  activeSection === "address"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Shipping & Payment
              </button>
              <button
                onClick={() => setActiveSection("tracking")}
                className={`flex-1 min-w-[150px] rounded-xl px-6 py-3 text-center text-base font-semibold transition-all duration-200 ${
                  activeSection === "tracking"
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
                    {isBulk && (
                      <span className="ml-3 text-sm font-normal text-gray-500">
                        (Includes bulk items with multiple pieces)
                      </span>
                    )}
                  </h2>
                  {order.items && order.items.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {order.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="relative flex items-center space-x-4 rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm transition-transform hover:scale-[1.01]"
                        >
                          {/* Bulk Badge */}
                          {item.isBulkProduct && (
                            <div className="absolute -top-2 -right-2">
                              <div className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                                BULK
                              </div>
                            </div>
                          )}
                          <img
                            src={
                              item?.product?.images?.[0]?.url ||
                              "https://placehold.co/80x80/E0E7FF/6366F1?text=No+Image"
                            }
                            alt={item?.name || "Product"}
                            className="h-20 w-20 flex-shrink-0 rounded-xl object-cover shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://placehold.co/80x80/E0E7FF/6366F1?text=No+Image";
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-800">
                              {item?.name || "N/A"}
                              {item.isBulkProduct && (
                                <span className="ml-2 text-xs text-red-500">(Bulk)</span>
                              )}
                            </h4>
                            
                            {/* Bulk specific details */}
                            {item.isBulkProduct ? (
                              <>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Layers className="h-3 w-3" />
                                  {getBulkItemDisplay(item)}
                                </p>
                                {item.selectedColors && item.selectedColors.length > 0 && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Palette className="h-3 w-3" />
                                    Colors: {item.selectedColors.join(", ")}
                                  </p>
                                )}
                                {item.piecesPerSet && (
                                  <p className="text-xs text-gray-500">
                                    {item.piecesPerSet} pieces per set
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600">
                                  Qty: {item?.quantity || 0}
                                </p>
                                {item?.size && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Ruler className="h-3 w-3" />
                                    Size: {item.size}
                                  </p>
                                )}
                                {item?.color && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Palette className="h-3 w-3" />
                                    Color: {item.color}
                                  </p>
                                )}
                              </>
                            )}
                            <p className="text-sm text-gray-500">
                              {getItemPrice(item)}
                            </p>
                          </div>
                          <span className="text-xl font-bold text-red-600">
                            ₹{getItemTotal(item)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-lg text-gray-600">
                      No items found for this order.
                    </p>
                  )}

                  {/* Pricing Summary */}
                  <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-8 shadow-inner">
                    <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
                      <DollarSign className="mr-3 h-6 w-6 text-gray-600" />
                      Pricing Summary
                    </h2>
                    <div className="space-y-3 text-lg text-gray-700">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span>Subtotal:</span>
                        <span className="font-semibold">
                          ₹{order.pricing?.subtotal || order.subtotal || 0}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span>Shipping:</span>
                        <span className="font-semibold">
                          ₹{order.pricing?.shipping || order.shippingCharge || 0}
                        </span>
                      </div>
                      {(order.pricing?.freediscount || order.freediscount) > 0 && (
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span>Free Discount:</span>
                          <span className="font-semibold text-blue-600">
                            - ₹{order.pricing?.freediscount || order.freediscount || 0}
                          </span>
                        </div>
                      )}
                      {order.discount > 0 && (
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span>Coupon Discount:</span>
                          <span className="font-semibold text-green-600">
                            - ₹{order.discount || 0}
                          </span>
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
                        <span>₹{order.pricing?.total || order.total || 0}</span>
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
                        <span className="font-semibold text-gray-900">Full Name:</span>{" "}
                        {order.shippingAddress?.fullName || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">Phone Number:</span>{" "}
                        {order.shippingAddress?.phoneNumber || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">Email:</span>{" "}
                        {order.shippingAddress?.email || order.user?.email || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">Address:</span>{" "}
                        {order.shippingAddress?.addressLine1 || "N/A"}
                        {order.shippingAddress?.addressLine2
                          ? `, ${order.shippingAddress.addressLine2}`
                          : ""}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">City:</span>{" "}
                        {order.shippingAddress?.city || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">State:</span>{" "}
                        {order.shippingAddress?.state || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">Pincode:</span>{" "}
                        {order.shippingAddress?.pinCode || "N/A"}
                      </p>
                      {order.shippingAddress?.landmark && (
                        <p>
                          <span className="font-semibold text-gray-900">Landmark:</span>{" "}
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
                        <span className="font-semibold text-gray-900">Payment Method:</span>{" "}
                        {order.paymentInfo?.method || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">Payment Status:</span>{" "}
                        <span
                          className={`font-extrabold ${
                            order.paymentInfo?.status === "PAID" || order.paymentInfo?.status === "PARTIALLY_PAID"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {order.paymentInfo?.status || "N/A"}
                        </span>
                      </p>
                      {order.paymentInfo?.razorpayOrderId && (
                        <p>
                          <span className="font-semibold text-gray-900">Razorpay Order ID:</span>{" "}
                          <span className="font-mono text-sm break-all">
                            {order.paymentInfo?.razorpayOrderId}
                          </span>
                        </p>
                      )}
                      {order.paymentInfo?.razorpayPaymentId && (
                        <p>
                          <span className="font-semibold text-gray-900">Razorpay Payment ID:</span>{" "}
                          <span className="font-mono text-sm break-all">
                            {order.paymentInfo?.razorpayPaymentId}
                          </span>
                        </p>
                      )}
                      {/* Partial COD Details */}
                      {order.partialCod?.enabled && (
                        <div className="mt-4 rounded-lg bg-blue-50 p-3">
                          <p className="font-semibold text-blue-800">Partial COD Details:</p>
                          <p className="text-sm text-blue-700">
                            {order.partialCod.percentage}% paid online: ₹{order.partialCod.onlineAmount}
                          </p>
                          <p className="text-sm text-blue-700">
                            Balance to pay on delivery: ₹{order.partialCod.codAmount}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "tracking" && (
                <div className="rounded-xl border border-gray-200 p-8 shadow-sm">
                  <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
                    <Truck className="mr-3 h-6 w-6 text-gray-600" />
                    Order Status & Tracking
                  </h2>
                  
                  {/* Order Timeline */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center text-center">
                        <div className={`rounded-full p-2 ${
                          order.status !== "cancelled" ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          <CheckCircle className={`h-6 w-6 ${
                            order.status !== "cancelled" ? "text-green-600" : "text-gray-400"
                          }`} />
                        </div>
                        <p className="mt-2 text-sm font-medium">Order Placed</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`flex-1 h-1 ${
                        order.status === "confirmed" || order.status === "processing" || 
                        order.status === "shipped" || order.status === "delivered"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`} />
                      <div className="flex flex-col items-center text-center">
                        <div className={`rounded-full p-2 ${
                          order.status === "confirmed" || order.status === "processing" ||
                          order.status === "shipped" || order.status === "delivered"
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}>
                          <Package className={`h-6 w-6 ${
                            order.status === "confirmed" || order.status === "processing" ||
                            order.status === "shipped" || order.status === "delivered"
                              ? "text-green-600"
                              : "text-gray-400"
                          }`} />
                        </div>
                        <p className="mt-2 text-sm font-medium">Processed</p>
                      </div>
                      <div className={`flex-1 h-1 ${
                        order.status === "shipped" || order.status === "delivered"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`} />
                      <div className="flex flex-col items-center text-center">
                        <div className={`rounded-full p-2 ${
                          order.status === "shipped" || order.status === "delivered"
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}>
                          <Truck className={`h-6 w-6 ${
                            order.status === "shipped" || order.status === "delivered"
                              ? "text-green-600"
                              : "text-gray-400"
                          }`} />
                        </div>
                        <p className="mt-2 text-sm font-medium">Shipped</p>
                      </div>
                      <div className={`flex-1 h-1 ${
                        order.status === "delivered" ? "bg-green-500" : "bg-gray-300"
                      }`} />
                      <div className="flex flex-col items-center text-center">
                        <div className={`rounded-full p-2 ${
                          order.status === "delivered" ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          <CheckCircle className={`h-6 w-6 ${
                            order.status === "delivered" ? "text-green-600" : "text-gray-400"
                          }`} />
                        </div>
                        <p className="mt-2 text-sm font-medium">Delivered</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="rounded-lg bg-gray-50 p-6 text-center">
                    {order.status === "delivered" ? (
                      <>
                        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
                        <h3 className="text-xl font-bold text-green-700">Order Delivered!</h3>
                        <p className="mt-2 text-gray-600">
                          Your order has been delivered successfully. Thank you for shopping with us!
                        </p>
                        {order.deliveredAt && (
                          <p className="mt-1 text-sm text-gray-500">
                            Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    ) : order.status === "shipped" ? (
                      <>
                        <Truck className="mx-auto mb-3 h-12 w-12 text-purple-500" />
                        <h3 className="text-xl font-bold text-purple-700">Order Shipped!</h3>
                        <p className="mt-2 text-gray-600">
                          Your order is on the way! You will receive tracking updates soon.
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {order.shippedAt 
                            ? `Shipped on ${new Date(order.shippedAt).toLocaleDateString()}`
                            : "Tracking info will be updated once available"}
                        </p>
                      </>
                    ) : order.status === "cancelled" ? (
                      <>
                        <X className="mx-auto mb-3 h-12 w-12 text-red-500" />
                        <h3 className="text-xl font-bold text-red-700">Order Cancelled</h3>
                        <p className="mt-2 text-gray-600">
                          This order has been cancelled as per your request.
                        </p>
                        {order.cancelReason && (
                          <p className="mt-1 text-sm text-gray-500">Reason: {order.cancelReason}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <Clock className="mx-auto mb-3 h-12 w-12 text-orange-500" />
                        <h3 className="text-xl font-bold text-orange-700">Order Processing</h3>
                        <p className="mt-2 text-gray-600">
                          Your order has been confirmed and is being processed.
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          You will receive tracking details once your order is shipped.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Estimated Delivery (for non-delivered orders) */}
                  {order.status !== "delivered" && order.status !== "cancelled" && (
                    <div className="mt-6 rounded-lg bg-blue-50 p-4 text-center">
                      <p className="text-sm text-blue-700">
                        <strong>Estimated Delivery:</strong>{" "}
                        {new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
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