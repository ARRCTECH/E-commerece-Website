// src/pages/MyOrdersPage.jsx - Compact version
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Eye, X, Truck, CheckCircle, Clock, AlertCircle,
  Layers, Palette, CreditCard, Wallet, Banknote, AlertTriangle, 
  ShoppingBag, MapPin, Calendar, ChevronLeft, ChevronRight
} from "lucide-react";
import { fetchUserOrders, cancelOrder, clearError } from "../store/slices/orderSlice";
import LoadingSpinner from "../components/LoadingSpinner";

// Modal Component - Compact
const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md rounded-lg bg-white shadow-xl"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-red-600 transition-colors"
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
  const [cancelReason, setCancelReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
        return <CheckCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-red-600" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-red-600" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <X className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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
        return { icon: <Banknote className="h-3 w-3" />, text: "COD", color: "text-green-700 bg-green-50 border-green-200" };
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
      <div className="flex h-screen items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-5xl"
        >
          {/* Header - Compact */}
          <div className="mb-5 text-center md:text-left">
            <h1 className="mb-1 text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500">Track and manage your orders</p>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Orders List */}
          {orders.length === 0 && !loading?.fetching ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-10 text-center rounded-lg border border-gray-100 bg-gray-50"
            >
              <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <h2 className="mb-1 text-lg font-semibold text-gray-800">No orders yet</h2>
              <p className="mb-4 text-sm text-gray-500">Start shopping to see your orders here</p>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                Start Shopping
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, index) => {
                const paymentMethod = getPaymentMethodDisplay(order);
                const pendingAmount = getPendingAmount(order);
                const isPartial = paymentMethod.text === "Partial COD";

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow"
                  >
                    {/* Order Header - Compact */}
                    <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              Order #{order?.orderNumber || "N/A"}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            ₹{order?.total || order?.pricing?.total || 0}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${paymentMethod.color}`}>
                            {paymentMethod.icon}
                            {paymentMethod.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Partial COD Pending Alert - Compact */}
                    {isPartial && pendingAmount > 0 && order.status?.toLowerCase() !== "delivered" && order.status?.toLowerCase() !== "cancelled" && (
                      <div className="border-b border-red-100 bg-red-50 px-4 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-xs font-medium text-red-800">
                              Pending Payment
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-red-800">
                              ₹{pendingAmount} remaining
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-red-700">
                          <span>Online: ₹{order?.partialCod?.onlineAmount || 0}</span>
                          <span className="mx-2">•</span>
                          <span>COD: ₹{pendingAmount}</span>
                          <span className="mx-2">•</span>
                          <span>{order?.partialCod?.percentage}% paid</span>
                        </div>
                      </div>
                    )}

                    {/* Order Items Preview - Compact */}
                    <div className="px-4 py-3">
                      {/* Items Images */}
                      <div className="mb-2 flex flex-wrap gap-2">
                        {order?.items?.slice(0, 3).map((item, itemIndex) => (
                          <div key={itemIndex} className="relative">
                            <img
                              src={
                                item?.product?.images?.[0]?.url ||
                                item?.image ||
                                `https://placehold.co/56x56/f3f4f6/9ca3af?text=${encodeURIComponent(item?.name?.charAt(0) || "P")}`
                              }
                              alt={item?.name || "Product"}
                              className="h-14 w-14 rounded-md border border-gray-200 object-cover bg-gray-50"
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = `https://placehold.co/56x56/f3f4f6/9ca3af?text=${encodeURIComponent(item?.name?.charAt(0) || "P")}`;
                              }}
                            />
                            {item.isBulkProduct && (
                              <div className="absolute -right-1 -top-1 rounded-full bg-red-600 p-0.5 shadow-sm">
                                <Layers className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                        {order?.items?.length > 3 && (
                          <div className="flex h-14 w-14 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-500">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Items Details - Compact */}
                      <div className="mb-2 space-y-1">
                        {order?.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex flex-wrap justify-between gap-1 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-gray-800 max-w-[200px] truncate">
                                {item?.name?.length > 30 ? item.name.substring(0, 30) + "..." : item.name}
                              </span>
                              {item.isBulkProduct && (
                                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                                  BULK
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              {item.isBulkProduct ? (
                                <>
                                  <span className="flex items-center gap-0.5">
                                    <Layers className="h-3 w-3" />
                                    {getBulkItemDisplay(item)}
                                  </span>
                                  {item.selectedColors && item.selectedColors.length > 0 && (
                                    <span className="truncate max-w-[120px]">
                                      {item.selectedColors.slice(0, 2).join(", ")}
                                      {item.selectedColors.length > 2 && ` +${item.selectedColors.length - 2}`}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span>Qty: {item.quantity}</span>
                                  {item.size && <span>Size: {item.size}</span>}
                                </>
                              )}
                              <span className="font-medium text-gray-800">{getItemPrice(item)}</span>
                            </div>
                          </div>
                        ))}
                        {order?.items?.length > 2 && (
                          <p className="text-xs text-gray-500">+{order.items.length - 2} more</p>
                        )}
                      </div>

                      {/* Shipping Info - Compact */}
                      <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                        <span className="truncate">
                          {order?.shippingAddress?.fullName}, {order?.shippingAddress?.city}, {order?.shippingAddress?.state}
                        </span>
                      </div>

                      {/* Action Buttons - Compact */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/order/${order._id}`)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowTrackingModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          Track
                        </button>
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowCancelModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination - Compact */}
          {pagination?.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-center"
            >
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-0.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
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
                      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        pageNum === currentPage
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:text-red-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-0.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Cancel Order Modal - Compact */}
      <AnimatePresence>
        {showCancelModal && selectedOrder && (
          <Modal onClose={() => setShowCancelModal(false)}>
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
              </div>
              <p className="mb-3 text-sm text-gray-600">
                Cancel order <span className="font-medium text-red-600">#{selectedOrder?.orderNumber}</span>?
              </p>
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-gray-700">Reason *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why are you cancelling?"
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Keep
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={!cancelReason.trim() || loading?.cancelling}
                  className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading?.cancelling ? "..." : "Confirm"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Tracking Modal - Compact */}
      <AnimatePresence>
        {showTrackingModal && selectedOrder && (
          <Modal onClose={() => setShowTrackingModal(false)}>
            <div className="p-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
                  <Truck className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{selectedOrder.orderNumber}
                </h3>

                {/* Status & Payment Badges */}
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-0.5">{getStatusText(selectedOrder.status)}</span>
                  </span>
                  <span className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium ${getPaymentMethodDisplay(selectedOrder).color}`}>
                    {getPaymentMethodDisplay(selectedOrder).icon}
                    {getPaymentMethodDisplay(selectedOrder).text}
                  </span>
                </div>

                {/* Partial COD Pending */}
                {selectedOrder?.partialCod?.enabled && selectedOrder.status?.toLowerCase() !== "delivered" && selectedOrder.status?.toLowerCase() !== "cancelled" && (
                  <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-red-800">Pending:</span>
                      <span className="text-base font-bold text-red-800">₹{selectedOrder.partialCod.codAmount}</span>
                    </div>
                    <div className="mt-0.5 flex justify-between text-[11px] text-red-700">
                      <span>Paid online: ₹{selectedOrder.partialCod.onlineAmount}</span>
                      <span>{selectedOrder.partialCod.percentage}% paid</span>
                    </div>
                  </div>
                )}

                {/* Tracking Message */}
                <div className="mt-3 rounded-md bg-gray-50 p-3 text-left">
                  {selectedOrder.status?.toLowerCase() === "delivered" ? (
                    <>
                      <CheckCircle className="mx-auto mb-1 h-6 w-6 text-green-600" />
                      <p className="text-center text-sm text-gray-800">Delivered!</p>
                      {selectedOrder.deliveredAt && (
                        <p className="mt-0.5 text-center text-xs text-gray-500">
                          {new Date(selectedOrder.deliveredAt).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  ) : selectedOrder.status?.toLowerCase() === "cancelled" ? (
                    <>
                      <X className="mx-auto mb-1 h-6 w-6 text-gray-400" />
                      <p className="text-center text-sm text-gray-800">Cancelled</p>
                      {selectedOrder.cancelReason && (
                        <p className="mt-0.5 text-center text-xs text-gray-500">{selectedOrder.cancelReason}</p>
                      )}
                    </>
                  ) : selectedOrder.status?.toLowerCase() === "shipped" ? (
                    <>
                      <Truck className="mx-auto mb-1 h-6 w-6 text-red-600" />
                      <p className="text-center text-sm text-gray-800">On the way!</p>
                      <p className="mt-1 text-center text-xs text-gray-500">Tracking soon</p>
                    </>
                  ) : (
                    <>
                      <Clock className="mx-auto mb-1 h-6 w-6 text-gray-500" />
                      <p className="text-center text-sm text-gray-800">Processing</p>
                      <p className="mt-1 text-center text-xs text-gray-500">Update when shipped</p>
                    </>
                  )}
                </div>

                {/* Items Summary */}
                <div className="mt-3 text-left">
                  <p className="text-xs font-medium text-gray-700 mb-1">Items:</p>
                  <div className="max-h-24 overflow-y-auto space-y-0.5 pr-1">
                    {selectedOrder.items?.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex justify-between">
                        <span className="truncate">
                          • {item.name} {item.isBulkProduct && <span className="text-red-600 text-[10px]">(Bulk)</span>}
                        </span>
                        <span className="text-gray-700 text-[11px]">
                          {item.isBulkProduct ? getBulkItemDisplay(item) : `Qty: ${item.quantity}`}
                        </span>
                      </div>
                    ))}
                    {selectedOrder.items?.length > 4 && (
                      <p className="text-xs text-gray-400">+{selectedOrder.items.length - 4} more</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="mt-4 w-full rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  Close
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