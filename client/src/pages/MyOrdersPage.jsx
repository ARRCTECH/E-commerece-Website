import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Eye, X, Truck, CheckCircle, Clock, AlertCircle,
  Layers, Palette, CreditCard, Wallet, Banknote, AlertTriangle,
  ShoppingBag, MapPin, Calendar, ChevronLeft, ChevronRight,
  Sparkles, TrendingUp, Shield, Star, Gift, Award, RotateCcw
} from "lucide-react";
import { fetchUserOrders, cancelOrder, clearError } from "../store/slices/orderSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import axios from "axios";
import toast from "react-hot-toast";
import InvoiceDownloadButton from "../pages/InvoiceDownloadButton";

// Premium Modal Component
const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all z-10"
        >
          <X size={18} />
        </button>
        {children}
      </motion.div>
    </div>
  );
};

const MyOrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders = [], pagination = {}, loading = {}, error } = useSelector((state) => state.orders || {});
  const { isAuthenticated } = useSelector((state) => state.auth || {});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  
  // Return Modal States (updated)
  const [selectedPredefinedReason, setSelectedPredefinedReason] = useState(""); // One of 5 options
  const [isOtherReason, setIsOtherReason] = useState(false);
  const [otherReasonText, setOtherReasonText] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);

  // 5 predefined reasons
  const returnReasonOptions = [
    { value: "wrong_product", label: "Wrong product received" },
    { value: "damaged", label: "Product damaged / defective" },
    { value: "size_issue", label: "Size / fit issue" },
    { value: "changed_mind", label: "Changed my mind" },
    { value: "late_delivery", label: "Late delivery" }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserOrders({ page: currentPage, limit: 10 }));
    } else {
      navigate("/login");
    }
  }, [dispatch, currentPage, isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000);
    }
  }, [error, dispatch]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-red-500" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-red-500" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "cancelled":
        return <X className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "text-red-700 bg-gradient-to-r from-red-50 to-red-100 border-red-200";
      case "processing":
        return "text-red-700 bg-gradient-to-r from-red-50 to-red-100 border-red-200";
      case "shipped":
        return "text-red-700 bg-gradient-to-r from-red-50 to-red-100 border-red-200";
      case "delivered":
        return "text-emerald-700 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200";
      case "cancelled":
        return "text-gray-500 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
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

  const canCancelOrder = (order) => {
    const status = order?.status?.toLowerCase();
    return status === "confirmed" || status === "processing" || status === "placed";
  };

  const handleCancelOrder = () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    dispatch(
      cancelOrder({
        orderId: selectedOrder._id,
        reason: cancelReason,
      })
    ).then((result) => {
      if (result.type === "order/cancelOrder/fulfilled") {
        setShowCancelModal(false);
        setSelectedOrder(null);
        setCancelReason("");
      }
    });
  };

  // Updated return handler: combines predefined reason (if not other) or other text
  const handleReturnOrder = async () => {
    let finalReason = "";
    if (isOtherReason) {
      finalReason = otherReasonText.trim();
    } else {
      finalReason = selectedPredefinedReason ? 
        returnReasonOptions.find(opt => opt.value === selectedPredefinedReason)?.label || selectedPredefinedReason 
        : "";
    }
    // Reason is optional – empty string allowed
    
    setReturnLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication missing. Please login again.");
        return;
      }
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/return/returnvaluesave`,
        { orderId: selectedOrder._id, reason: finalReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Return request saved successfully!");
        setShowReturnModal(false);
        // Reset states
        setSelectedPredefinedReason("");
        setIsOtherReason(false);
        setOtherReasonText("");
        setSelectedOrder(null);
        // Refresh orders
        dispatch(fetchUserOrders({ page: currentPage, limit: 10 }));
      } else {
        toast.error(response.data.message || "Return request failed");
      }
    } catch (error) {
      console.error("Return error:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setReturnLoading(false);
    }
  };

  const getBulkItemDisplay = (item) => {
    if (item.isBulkProduct) {
      const pieces = item.totalPieces || (item.piecesPerSet * (item.totalSets || item.quantity));
      const sets = item.totalSets || item.quantity;
      return `${pieces} pc (${sets} set${sets > 1 ? 's' : ''})`;
    }
    return `Qty: ${item.quantity}`;
  };

  const getItemPrice = (item) => {
    if (item.isBulkProduct && item.pricePerSet) {
      return `₹${item.pricePerSet}/set`;
    }
    return `₹${item.price}`;
  };

  const getPaymentMethodDisplay = (order) => {
    const method = order?.paymentInfo?.method;
    switch (method) {
      case "RAZORPAY":
        return { icon: <CreditCard className="h-3 w-3" />, text: "Online", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "COD":
        return { icon: <Banknote className="h-3 w-3" />, text: "COD", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "PARTIAL_COD":
        return { icon: <Wallet className="h-3 w-3" />, text: "Partial COD", color: "text-purple-700 bg-purple-50 border-purple-200" };
      default:
        return { icon: <CreditCard className="h-3 w-3" />, text: method || "Unknown", color: "text-gray-600 bg-gray-100 border-gray-200" };
    }
  };

  const getPendingAmount = (order) => order?.partialCod?.enabled ? order.partialCod.codAmount : 0;

  const handlePageChange = (page) => setCurrentPage(page);

  if (loading?.fetching && !orders.length && currentPage === 1) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-6xl"
        >
          {/* Premium Header */}
          <div className="relative mb-8 overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full -mt-32 -mr-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 rounded-full -mb-32 -ml-32 blur-3xl" />

            <div className="relative px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex flex-col items-center text-center md:flex-row md:justify-between md:text-left">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <Sparkles className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] font-bold tracking-wider text-white uppercase">Order Management</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">My Orders</h1>
                  <p className="mt-2 text-sm text-gray-300">Track, manage, and review your purchase history</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <Package className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-white">{orders.length} Total Orders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 text-sm text-red-700 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Orders List */}
          {orders.length === 0 && !loading?.fetching ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 text-center rounded-2xl bg-white border border-gray-100 shadow-xl"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-red-100 to-red-50">
                <Package className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">No orders yet</h2>
              <p className="mb-6 text-sm text-gray-500">Start shopping to see your orders here</p>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <ShoppingBag className="w-4 h-4" />
                Start Shopping
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => {
                const paymentMethod = getPaymentMethodDisplay(order);
                const pendingAmount = getPendingAmount(order);
                const isPartial = paymentMethod.text === "Partial COD";
                const isDelivered = order.status?.toLowerCase() === "delivered";

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    whileHover={{ y: -2 }}
                    className="group overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    {/* Order Header */}
                    <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-red-100 to-red-50">
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900">
                              Order #{order?.orderNumber || "N/A"}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-500">
                                {order?.createdAt
                                  ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusText(order.status)}
                          </span>
                          <span className="text-xl font-bold text-gray-900">
                            ₹{order?.total || order?.pricing?.total || 0}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentMethod.color}`}>
                            {paymentMethod.icon}
                            {paymentMethod.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Partial COD Pending Alert */}
                    {isPartial && pendingAmount > 0 && order.status?.toLowerCase() !== "delivered" && order.status?.toLowerCase() !== "cancelled" && (
                      <div className="border-b border-red-100 bg-gradient-to-r from-red-50 to-red-100/50 px-5 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-semibold text-red-800">Pending Payment</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-red-800">₹{pendingAmount} remaining</span>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-red-700">
                          <span>Online: ₹{order?.partialCod?.onlineAmount || 0}</span>
                          <span className="w-1 h-1 rounded-full bg-red-400" />
                          <span>COD: ₹{pendingAmount}</span>
                          <span className="w-1 h-1 rounded-full bg-red-400" />
                          <span>{order?.partialCod?.percentage}% paid</span>
                        </div>
                      </div>
                    )}

                    {/* Order Items Preview */}
                    <div className="px-5 py-4">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {order?.items?.slice(0, 3).map((item, itemIndex) => (
                          <div key={itemIndex} className="relative group/image">
                            <img
                              src={
                                item?.product?.images?.[0]?.url ||
                                item?.image ||
                                `https://placehold.co/64x64/f3f4f6/9ca3af?text=${encodeURIComponent(item?.name?.charAt(0) || "P")}`
                              }
                              alt={item?.name || "Product"}
                              className="h-16 w-16 rounded-xl border-2 border-gray-100 object-cover bg-gray-50 shadow-md transition-all duration-300 group-hover/image:scale-105 group-hover/image:shadow-lg"
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = `https://placehold.co/64x64/f3f4f6/9ca3af?text=${encodeURIComponent(item?.name?.charAt(0) || "P")}`;
                              }}
                            />
                            {item.isBulkProduct && (
                              <div className="absolute -right-1 -top-1 rounded-full bg-gradient-to-r from-red-600 to-red-500 p-1 shadow-md">
                                <Layers className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                        {order?.items?.length > 3 && (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      <div className="mb-3 space-y-1.5">
                        {order?.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex flex-wrap justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-800 max-w-[240px] truncate">
                                {item?.name?.length > 35 ? item.name.substring(0, 35) + "..." : item.name}
                              </span>
                              {item.isBulkProduct && (
                                <span className="rounded-full bg-gradient-to-r from-red-100 to-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                  BULK
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                              {item.isBulkProduct ? (
                                <>
                                  <span className="flex items-center gap-1 text-xs">
                                    <Layers className="w-3 h-3 text-red-500" />
                                    {getBulkItemDisplay(item)}
                                  </span>
                                  {item.selectedColors && item.selectedColors.length > 0 && (
                                    <span className="text-xs truncate max-w-[150px] text-gray-500">
                                      🎨 {item.selectedColors.slice(0, 2).join(", ")}
                                      {item.selectedColors.length > 2 && ` +${item.selectedColors.length - 2}`}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span>Qty: {item.quantity}</span>
                                  {item.size && <span className="text-xs text-gray-400">| Size: {item.size}</span>}
                                </>
                              )}
                              <span className="font-bold text-gray-900">{getItemPrice(item)}</span>
                            </div>
                          </div>
                        ))}
                        {order?.items?.length > 2 && (
                          <p className="text-xs text-gray-400">+{order.items.length - 2} more items</p>
                        )}
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span className="truncate">
                          {order?.shippingAddress?.fullName}, {order?.shippingAddress?.city}, {order?.shippingAddress?.state} - {order?.shippingAddress?.pincode}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/order/${order._id}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                        <div className="w-full sm:w-auto">
    <InvoiceDownloadButton order={order} />
  </div>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowTrackingModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-red-200 bg-white text-red-600 font-semibold text-sm hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Track Order
                        </button>
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowCancelModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel Order
                          </button>
                        )}
                        {isDelivered && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowReturnModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-emerald-200 bg-white text-emerald-600 font-semibold text-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Return
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex justify-center"
            >
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[40px] px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${pageNum === currentPage
                          ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg scale-105"
                          : "border-2 border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {showCancelModal && selectedOrder && (
          <Modal onClose={() => setShowCancelModal(false)}>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-100 to-red-50">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Are you sure you want to cancel order <span className="font-bold text-red-600">#{selectedOrder?.orderNumber}</span>?
              </p>
              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wide">Reason *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please tell us why you're cancelling..."
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={!cancelReason.trim() || loading?.cancelling}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading?.cancelling ? "Processing..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Tracking Modal */}
      <AnimatePresence>
        {showTrackingModal && selectedOrder && (
          <Modal onClose={() => setShowTrackingModal(false)}>
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 shadow-inner">
                  <Truck className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {getStatusText(selectedOrder.status)}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentMethodDisplay(selectedOrder).color}`}>
                    {getPaymentMethodDisplay(selectedOrder).icon}
                    {getPaymentMethodDisplay(selectedOrder).text}
                  </span>
                </div>
                {selectedOrder?.partialCod?.enabled && selectedOrder.status?.toLowerCase() !== "delivered" && selectedOrder.status?.toLowerCase() !== "cancelled" && (
                  <div className="mt-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-red-800">Pending Payment:</span>
                      <span className="text-xl font-bold text-red-800">₹{selectedOrder.partialCod.codAmount}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-red-700">
                      <span>Paid online: ₹{selectedOrder.partialCod.onlineAmount}</span>
                      <span>{selectedOrder.partialCod.percentage}% paid</span>
                    </div>
                  </div>
                )}
                <div className="mt-4 rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 border border-gray-100">
                  {selectedOrder.status?.toLowerCase() === "delivered" ? (
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-emerald-100 mb-2">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <p className="text-base font-bold text-gray-800">Order Delivered!</p>
                      {selectedOrder.deliveredAt && (
                        <p className="mt-1 text-xs text-gray-500">{new Date(selectedOrder.deliveredAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  ) : selectedOrder.status?.toLowerCase() === "cancelled" ? (
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-gray-100 mb-2">
                        <X className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-base font-bold text-gray-800">Order Cancelled</p>
                      {selectedOrder.cancelReason && (
                        <p className="mt-1 text-xs text-gray-500 text-center">{selectedOrder.cancelReason}</p>
                      )}
                    </div>
                  ) : selectedOrder.status?.toLowerCase() === "shipped" ? (
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-red-100 mb-2 animate-pulse">
                        <Truck className="w-8 h-8 text-red-600" />
                      </div>
                      <p className="text-base font-bold text-gray-800">On The Way!</p>
                      <p className="mt-1 text-xs text-gray-500">Your order is out for delivery</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-amber-100 mb-2">
                        <Clock className="w-8 h-8 text-amber-600" />
                      </div>
                      <p className="text-base font-bold text-gray-800">Processing Your Order</p>
                      <p className="mt-1 text-xs text-gray-500">We'll update you once shipped</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-left">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Order Items</p>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {selectedOrder.items?.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          <span className="truncate max-w-[200px]">{item.name}</span>
                          {item.isBulkProduct && <span className="text-red-600 text-[9px] font-bold">(Bulk)</span>}
                        </span>
                        <span className="text-gray-700 text-[11px] font-medium">
                          {item.isBulkProduct ? getBulkItemDisplay(item) : `Qty: ${item.quantity}`}
                        </span>
                      </div>
                    ))}
                    {selectedOrder.items?.length > 4 && (
                      <p className="text-xs text-gray-400 italic">+{selectedOrder.items.length - 4} more items</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Return Order Modal - with 5 predefined options + Other */}
      <AnimatePresence>
        {showReturnModal && selectedOrder && (
          <Modal onClose={() => setShowReturnModal(false)}>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                  <RotateCcw className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Return Order</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Request a return for order <span className="font-bold text-emerald-600">#{selectedOrder?.orderNumber}</span>.
              </p>
              
              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Return Reason (Optional)
                </label>
                
                {/* Predefined reason dropdown */}
                <select
                  value={selectedPredefinedReason}
                  onChange={(e) => {
                    setSelectedPredefinedReason(e.target.value);
                    if (e.target.value) setIsOtherReason(false);
                  }}
                  disabled={isOtherReason}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all mb-3"
                >
                  <option value="">-- Select a reason (optional) --</option>
                  {returnReasonOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* "Other" reason checkbox */}
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOtherReason}
                      onChange={(e) => {
                        setIsOtherReason(e.target.checked);
                        if (e.target.checked) setSelectedPredefinedReason("");
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Other reason (specify below)</span>
                  </label>
                </div>
                
                {isOtherReason && (
                  <input
                    type="text"
                    value={otherReasonText}
                    onChange={(e) => setOtherReasonText(e.target.value)}
                    placeholder="Please specify your reason (optional)"
                    className="mt-2 w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                )}
                <p className="mt-1 text-xs text-gray-400">
                  * Reason is not required – you can submit without any reason.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedPredefinedReason("");
                    setIsOtherReason(false);
                    setOtherReasonText("");
                    setSelectedOrder(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnOrder}
                  disabled={returnLoading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {returnLoading ? "Processing..." : "Confirm Return"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyOrdersPage;
