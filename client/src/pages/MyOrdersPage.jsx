
import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Package, Eye, X, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { fetchUserOrders, cancelOrder, clearError, trackOrderInfo } from "../store/slices/orderSlice"
import LoadingSpinner from "../components/LoadingSpinner"
// import Preloader from "../components/Preloader"
// Placeholder Modal component, replace with your actual component
const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-lg bg-white p-6"
      >
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
          <X size={24} />
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
    // Only fetch orders from server if user is authenticated
    // This prevents showing old guest orders from local storage
    if (isAuthenticated) {
      dispatch(fetchUserOrders({ page: currentPage, limit: 10 }))
    } else {
      // Redirect non-authenticated users to login
      navigate("/login")
    }
  }, [dispatch, currentPage, isAuthenticated, navigate])
  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000)
    }
  }, [error, dispatch])
  const getStatusIcon = (status) => {
    switch (status) {
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
    switch (status) {
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
    switch (status) {
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
    return order.status === "confirmed" || order.status === "processing"
  }
  const handleCancelOrder = () => {
    if (!selectedOrder || !cancelReason.trim()) return
    dispatch(
      cancelOrder({
        orderId: selectedOrder._id,
        reason: cancelReason,
      }),
    ).then((result) => {
      if (result.type === "order/cancelOrder/fulfilled") {
        setShowCancelModal(false)
        setSelectedOrder(null)
        setCancelReason("")
      }
    })
  }
  const handleFetchTracking = () => {
    if (selectedOrder && selectedOrder._id) {
      dispatch(trackOrderInfo(selectedOrder))
    }
  }
  const handleTrackOrder = (order) => {
    setSelectedOrder(order)
    setShowTrackingModal(true)
  }
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }
  if (loading?.fetching && !orders.length && currentPage === 1) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {/* <Preloader size="lg" /> */}
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
              {orders.map((order, index) => (
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
                      <div className="flex items-center space-x-4">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-lg font-semibold">₹{order?.pricing?.total || 0}</span>
                      </div>
                    </div>
                  </div>
                  {/* Order Items Preview */}
                  <div className="p-6">
                    {order?.items && order.items.length > 0 && (
                      <div className="mb-4 flex items-center space-x-4">
                        {order.items.slice(0, 3).map((item, itemIndex) => (
                          <div key={itemIndex} className="relative">
                            <img
                              src={
                                item?.product?.images?.[0]?.url ||
                                item?.product?.image ||
                                `https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=${encodeURIComponent(item?.product?.name?.charAt(0) || "P")}`
                              }
                              alt={item?.product?.name || "Product"}
                              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                e.target.src = `https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=${encodeURIComponent(item?.product?.name?.charAt(0) || "P")}`
                              }}
                              loading="lazy"
                            />
                            <div
                              className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center opacity-0 transition-opacity duration-200"
                              style={{ opacity: 0 }}
                            >
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                            <span className="text-sm text-gray-600">+{order.items.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-4 sm:mb-0">
                        <p className="text-sm text-gray-600">
                          {order?.items?.length || 0} item
                          {(order?.items?.length || 0) > 1 ? "s" : ""}
                        </p>
                        <p className="text-sm text-gray-600">
                          Delivered to {order?.shippingAddress?.city || "N/A"}, {order?.shippingAddress?.state || "N/A"}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        {/* View Order Button */}
                        <button
                          onClick={() => navigate(`/order/${order._id}`)}
                          className="flex items-center rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Order
                        </button>
                        {/* Track Order Button */}
                        <button
                          onClick={() => handleTrackOrder(order)}
                          className="flex items-center rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Track Order
                        </button>
                        {/* Cancel Button */}
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowCancelModal(true)
                            }}
                            className="flex items-center rounded-lg border border-red-300 px-4 py-2 text-red-600 transition-colors hover:bg-red-50"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="rounded-lg border border-gray-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`rounded-lg border px-4 py-2 ${
                      page === currentPage ? "border-red-600 bg-red-600 text-white" : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
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
      {showCancelModal && (
        <Modal onClose={() => setShowCancelModal(false)}>
          <div className="mb-4 flex items-center">
            <AlertCircle className="mr-2 h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold">Cancel Order</h3>
          </div>
          <p className="mb-4 text-gray-600">Are you sure you want to cancel order #{selectedOrder?.orderNumber}?</p>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Reason for cancellation *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              rows={3}
            />
          </div>
          <div className="flex space-x-3">
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
      {/* Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <Modal onClose={() => setShowTrackingModal(false)}>
          <div className="py-8 text-center">
            <h3 className="mb-4 text-2xl font-semibold text-gray-800">Order #{selectedOrder.orderNumber}</h3>
            {selectedOrder?.trackingInfo?.trackingUrl ? (
              // Case 1: Tracking URL exists → show "View Tracking"
              <div>
                <p className="mb-4 text-lg text-gray-600">Your order has been shipped!</p>
                <a
                  href={selectedOrder.trackingInfo.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors shadow-md hover:bg-blue-700"
                >
                  <Truck className="mr-3 h-5 w-5" /> View Tracking Details
                </a>
              </div>
            ) : loading?.tracking ? (
              // Case 2: Loading state → show "Fetching..."
              <div>
                <button
                  disabled
                  className="inline-flex items-center rounded-lg px-6 py-3 font-semibold text-white bg-gray-400 cursor-not-allowed shadow-md"
                >
                  <LoadingSpinner size="sm" className="mr-2" />
                  Fetching...
                </button>
              </div>
            ) : selectedOrder?.trackingInfo?.message ? (
              // Case 3: No tracking URL, but message available
              <div>
                <p className="mb-4 text-lg text-gray-600">{selectedOrder.trackingInfo.message}</p>
                <button
                  onClick={handleFetchTracking}
                  className="inline-flex items-center rounded-lg px-6 py-3 font-semibold text-white transition-colors shadow-md bg-blue-600 hover:bg-blue-700"
                >
                  <Truck className="mr-3 h-5 w-5" /> Refresh Tracking
                </button>
              </div>
            ) : (
              // Case 4: Nothing at all yet
              <div>
                <p className="mb-4 text-lg text-gray-600">Tracking information is not yet available.</p>
                <p className="text-sm text-gray-500">Tracking will be available once your order has been shipped.</p>
                <button
                  onClick={handleFetchTracking}
                  className="inline-flex items-center rounded-lg px-6 py-3 font-semibold text-white transition-colors shadow-md bg-blue-600 hover:bg-blue-700 mt-[1rem]"
                >
                  <Truck className="mr-3 h-5 w-5" /> Refresh Tracking
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
export default MyOrdersPage
