import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { 
  Package, Eye, X, Truck, CheckCircle, Clock, AlertCircle, 
  Layers, Palette, Ruler, CreditCard, IndianRupee, 
  Wallet, Banknote, AlertTriangle 
} from "lucide-react"
import { fetchUserOrders, cancelOrder, clearError } from "../store/slices/orderSlice"
import LoadingSpinner from "../components/LoadingSpinner"

// Modal Component
const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md rounded-lg bg-white p-6"
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        {children}
      </motion.div>
    </div>
  )
}

const MyOrdersPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { orders = [], pagination = {}, loading = {}, error } = useSelector((state) => state.orders || {})
  const { isAuthenticated } = useSelector((state) => state.auth || {})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserOrders({ page: currentPage, limit: 10 }))
    } else {
      navigate("/login")
    }
  }, [dispatch, currentPage, isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000)
    }
  }, [error, dispatch])

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "processing":
        return <Clock className="h-5 w-5 text-blue-600" />
      case "shipped":
        return <Truck className="h-5 w-5 text-purple-600" />
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "cancelled":
        return <X className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "text-green-600 bg-green-100"
      case "processing":
        return "text-blue-600 bg-blue-100"
      case "shipped":
        return "text-purple-600 bg-purple-100"
      case "delivered":
        return "text-green-600 bg-green-100"
      case "cancelled":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "Order Confirmed"
      case "processing":
        return "Processing"
      case "shipped":
        return "Shipped"
      case "delivered":
        return "Delivered"
      case "cancelled":
        return "Cancelled"
      default:
        return "Pending"
    }
  }

  const canCancelOrder = (order) => {
    const status = order?.status?.toLowerCase()
    return status === "confirmed" || status === "processing" || status === "placed"
  }

  const handleCancelOrder = () => {
    if (!selectedOrder || !cancelReason.trim()) return
    dispatch(
      cancelOrder({
        orderId: selectedOrder._id,
        reason: cancelReason,
      })
    ).then((result) => {
      if (result.type === "order/cancelOrder/fulfilled") {
        setShowCancelModal(false)
        setSelectedOrder(null)
        setCancelReason("")
      }
    })
  }

  // ✅ Check if order contains bulk products
  const isBulkOrder = (order) => {
    return order?.items?.some(item => item.isBulkProduct === true)
  }

  // ✅ Format bulk item display text
  const getBulkItemDisplay = (item) => {
    if (item.isBulkProduct) {
      const pieces = item.totalPieces || (item.piecesPerSet * (item.totalSets || item.quantity))
      const sets = item.totalSets || item.quantity
      return `${pieces} pieces (${sets} set${sets > 1 ? 's' : ''})`
    }
    return `Qty: ${item.quantity}`
  }

  // ✅ Get item price display
  const getItemPrice = (item) => {
    if (item.isBulkProduct && item.pricePerSet) {
      return `₹${item.pricePerSet}/set`
    }
    return `₹${item.price}`
  }

  // ✅ Get payment method display
  const getPaymentMethodDisplay = (order) => {
    const method = order?.paymentInfo?.method
    switch (method) {
      case "RAZORPAY":
        return { 
          icon: <CreditCard className="h-4 w-4" />, 
          text: "Online Payment",
          color: "text-blue-600 bg-blue-100",
          isPartial: false
        }
      case "COD":
        return { 
          icon: <Banknote className="h-4 w-4" />, 
          text: "Cash on Delivery",
          color: "text-green-600 bg-green-100",
          isPartial: false
        }
      case "PARTIAL_COD":
        return { 
          icon: <Wallet className="h-4 w-4" />, 
          text: "Partial COD",
          color: "text-purple-600 bg-purple-100",
          isPartial: true
        }
      default:
        return { 
          icon: <CreditCard className="h-4 w-4" />, 
          text: method || "Unknown",
          color: "text-gray-600 bg-gray-100",
          isPartial: false
        }
    }
  }

  // ✅ Get pending amount for Partial COD
  const getPendingAmount = (order) => {
    if (order?.partialCod?.enabled && order?.partialCod?.codAmount) {
      return order.partialCod.codAmount
    }
    return 0
  }

  // ✅ Get paid amount for Partial COD
  const getPaidAmount = (order) => {
    if (order?.partialCod?.enabled && order?.partialCod?.onlineAmount) {
      return order.partialCod.onlineAmount
    }
    return order?.total || order?.pricing?.total || 0
  }

  // ✅ Check if order is Partial COD and pending payment
  const isPartialCodPending = (order) => {
    return order?.partialCod?.enabled && 
           order?.partialCod?.onlinePaymentStatus !== "PAID" &&
           order?.status?.toLowerCase() !== "cancelled" &&
           order?.status?.toLowerCase() !== "delivered"
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  if (loading?.fetching && !orders.length && currentPage === 1) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-800">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
            >
              {error}
            </motion.div>
          )}

          {/* Orders List */}
          {orders.length === 0 && !loading?.fetching ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h2 className="mb-2 text-2xl font-bold text-gray-800">No orders yet</h2>
              <p className="mb-6 text-gray-600">Start shopping to see your orders here</p>
              <button
                onClick={() => navigate("/")}
                className="rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700"
              >
                Start Shopping
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {orders.map((order, index) => {
                const paymentMethod = getPaymentMethodDisplay(order)
                const pendingAmount = getPendingAmount(order)
                const paidAmount = getPaidAmount(order)
                const isPartial = paymentMethod.isPartial
                const isPartialPending = isPartialCodPending(order)
                
                return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="overflow-hidden rounded-lg bg-white shadow-md"
                >
                  {/* Order Header */}
                  <div className="border-b p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="mb-4 flex items-center space-x-4 lg:mb-0">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="text-lg font-semibold">Order #{order?.orderNumber || "N/A"}</h3>
                          <p className="text-sm text-gray-600">
                            Placed on{" "}
                            {order?.createdAt
                              ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-3">
                          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          <span className="text-lg font-semibold">₹{order?.total || order?.pricing?.total || 0}</span>
                        </div>
                        
                        {/* ✅ Payment Method Badge */}
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${paymentMethod.color}`}>
                          {paymentMethod.icon}
                          <span>{paymentMethod.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Partial COD Pending Amount Alert */}
                  {isPartial && pendingAmount > 0 && order.status?.toLowerCase() !== "delivered" && order.status?.toLowerCase() !== "cancelled" && (
                    <div className="border-b border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Pending Payment on Delivery
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-yellow-800">
                            ₹{pendingAmount} remaining
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-yellow-700">
                        <span>Online paid: ₹{order?.partialCod?.onlineAmount || 0}</span>
                        <span className="mx-2">•</span>
                        <span>To pay on delivery: ₹{pendingAmount}</span>
                        <span className="mx-2">•</span>
                        <span>{order?.partialCod?.percentage}% paid online</span>
                      </div>
                    </div>
                  )}

                  {/* Order Items Preview */}
                  <div className="p-6">
                    {/* Items Images */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      {order?.items?.slice(0, 4).map((item, itemIndex) => (
                        <div key={itemIndex} className="relative group">
                          <img
                            src={
                              item?.product?.images?.[0]?.url ||
                              item?.image ||
                              `https://placehold.co/64x64/f3f4f6/9ca3af?text=${encodeURIComponent(item?.name?.charAt(0) || "P")}`
                            }
                            alt={item?.name || "Product"}
                            className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                            onError={(e) => {
                              e.target.src = `https://placehold.co/64x64/f3f4f6/9ca3af?text=${encodeURIComponent(item?.name?.charAt(0) || "P")}`
                            }}
                            loading="lazy"
                          />
                          {/* Bulk Badge */}
                          {item.isBulkProduct && (
                            <div className="absolute -top-1 -right-1">
                              <div className="rounded-full bg-red-500 p-0.5">
                                <Layers className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {order?.items?.length > 4 && (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                          <span className="text-sm text-gray-600">+{order.items.length - 4}</span>
                        </div>
                      )}
                    </div>

                    {/* Items Details */}
                    <div className="mb-4 space-y-1">
                      {order?.items?.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex flex-wrap items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {item?.name?.length > 30 ? item.name.substring(0, 30) + "..." : item.name}
                            </span>
                            {item.isBulkProduct && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                                BULK
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-gray-600">
                            {item.isBulkProduct ? (
                              <>
                                <span className="flex items-center gap-1">
                                  <Layers className="h-3 w-3" />
                                  {getBulkItemDisplay(item)}
                                </span>
                                {item.selectedColors && item.selectedColors.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Palette className="h-3 w-3" />
                                    {item.selectedColors.slice(0, 2).join(", ")}
                                    {item.selectedColors.length > 2 && ` +${item.selectedColors.length - 2}`}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span>Qty: {item.quantity}</span>
                                {item.size && <span>Size: {item.size}</span>}
                                {item.color && <span>Color: {item.color}</span>}
                              </>
                            )}
                            <span className="font-medium">{getItemPrice(item)}</span>
                          </div>
                        </div>
                      ))}
                      {order?.items?.length > 2 && (
                        <p className="text-sm text-gray-500">+{order.items.length - 2} more items</p>
                      )}
                    </div>

                    {/* Shipping Info */}
                    <div className="mb-4 text-sm text-gray-600">
                      <p>
                        Delivered to {order?.shippingAddress?.fullName || "Customer"},{" "}
                        {order?.shippingAddress?.city || "N/A"}, {order?.shippingAddress?.state || "N/A"} -{" "}
                        {order?.shippingAddress?.pinCode || "N/A"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => navigate(`/order/${order._id}`)}
                        className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </button>

                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowTrackingModal(true)
                        }}
                        className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Track Order
                      </button>

                      {canCancelOrder(order) && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowCancelModal(true)
                          }}
                          className="flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )})}
            </div>
          )}

          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex justify-center">
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="rounded-lg border border-gray-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`rounded-lg border px-4 py-2 ${
                        pageNum === currentPage
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="rounded-lg border border-gray-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <Modal onClose={() => setShowCancelModal(false)}>
          <div className="mb-4 flex items-center">
            <AlertCircle className="mr-2 h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold">Cancel Order</h3>
          </div>
          <p className="mb-4 text-gray-600">
            Are you sure you want to cancel order #{selectedOrder?.orderNumber}?
          </p>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Reason for cancellation *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCancelModal(false)
                setSelectedOrder(null)
                setCancelReason("")
              }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={!cancelReason.trim() || loading?.cancelling}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading?.cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        </Modal>
      )}

      {/* ✅ Tracking Modal with Partial COD details */}
      {showTrackingModal && selectedOrder && (
        <Modal onClose={() => setShowTrackingModal(false)}>
          <div className="py-6 text-center">
            <Truck className="mx-auto mb-4 h-12 w-12 text-blue-500" />
            <h3 className="mb-2 text-xl font-semibold text-gray-800">
              Order #{selectedOrder.orderNumber}
            </h3>
            
            {/* Payment Method & Status */}
            <div className="mb-4 flex flex-col items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                {getStatusIcon(selectedOrder.status)}
                <span className="ml-2">{getStatusText(selectedOrder.status)}</span>
              </span>
              
              {/* ✅ Payment Method Badge */}
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getPaymentMethodDisplay(selectedOrder).color}`}>
                {getPaymentMethodDisplay(selectedOrder).icon}
                <span>{getPaymentMethodDisplay(selectedOrder).text}</span>
              </div>
            </div>

            {/* ✅ Partial COD Pending Amount Display */}
            {selectedOrder?.partialCod?.enabled && selectedOrder.status?.toLowerCase() !== "delivered" && selectedOrder.status?.toLowerCase() !== "cancelled" && (
              <div className="mb-4 rounded-lg bg-yellow-50 p-3 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-800">Pending Payment:</span>
                  <span className="text-lg font-bold text-yellow-800">₹{selectedOrder.partialCod.codAmount}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-yellow-700">
                  <span>Online paid: ₹{selectedOrder.partialCod.onlineAmount}</span>
                  <span>{selectedOrder.partialCod.percentage}% paid online</span>
                </div>
                <p className="mt-2 text-xs text-yellow-700">
                  ⚠️ Pay the remaining amount at the time of delivery
                </p>
              </div>
            )}

            {/* Tracking Message */}
            <div className="rounded-lg bg-gray-50 p-4">
              {selectedOrder.status?.toLowerCase() === "delivered" ? (
                <>
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <p className="text-gray-700">Your order has been delivered successfully!</p>
                  {selectedOrder.deliveredAt && (
                    <p className="mt-1 text-sm text-gray-500">
                      Delivered on {new Date(selectedOrder.deliveredAt).toLocaleDateString()}
                    </p>
                  )}
                  {selectedOrder?.partialCod?.enabled && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ Full payment completed (Online: ₹{selectedOrder.partialCod.onlineAmount} + COD: ₹{selectedOrder.partialCod.codAmount})
                    </p>
                  )}
                </>
              ) : selectedOrder.status?.toLowerCase() === "cancelled" ? (
                <>
                  <X className="mx-auto mb-2 h-8 w-8 text-red-500" />
                  <p className="text-gray-700">This order has been cancelled.</p>
                  {selectedOrder.cancelReason && (
                    <p className="mt-1 text-sm text-gray-500">Reason: {selectedOrder.cancelReason}</p>
                  )}
                </>
              ) : selectedOrder.status?.toLowerCase() === "shipped" ? (
                <>
                  <Truck className="mx-auto mb-2 h-8 w-8 text-purple-500" />
                  <p className="text-gray-700">Your order is on the way!</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Tracking information will be available soon.
                  </p>
                </>
              ) : (
                <>
                  <Clock className="mx-auto mb-2 h-8 w-8 text-orange-500" />
                  <p className="text-gray-700">Your order is being processed.</p>
                  <p className="mt-2 text-sm text-gray-500">
                    You will receive tracking details once your order is shipped.
                  </p>
                </>
              )}
            </div>

            {/* Items Summary */}
            <div className="mt-4 text-left">
              <p className="text-sm font-medium text-gray-700">Items in this order:</p>
              <div className="mt-2 space-y-1">
                {selectedOrder.items?.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    • {item.name} {item.isBulkProduct && <span className="text-red-500">(Bulk)</span>}
                    {item.isBulkProduct 
                      ? ` - ${getBulkItemDisplay(item)}`
                      : ` - Qty: ${item.quantity}`}
                  </div>
                ))}
                {selectedOrder.items?.length > 3 && (
                  <p className="text-sm text-gray-500">+{selectedOrder.items.length - 3} more items</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowTrackingModal(false)}
              className="mt-6 w-full rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MyOrdersPage