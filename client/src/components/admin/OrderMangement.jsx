"use client"
import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { 
  Eye, Edit, Search, Filter, X, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Package, User, Calendar, 
  CreditCard, Truck, MapPin, Phone, Mail, Clock, Download
} from "lucide-react"
import { fetchAllOrders, updateOrderStatus } from "../../store/slices/adminSlice"
import { orderAPI } from "../../store/api/orderAPI"
import LoadingSpinner from "../LoadingSpinner"

const inputCls = "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
const labelCls = "block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide"

const OrdersManagement = () => {
  const dispatch = useDispatch()
  const { orders, ordersPagination, ordersLoading } = useSelector((state) => state.admin)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    status: "",
    startDate: "",
    endDate: "",
  })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    trackingNumber: "",
    carrier: "",
    notes: "",
  })
  
  // 🆕 Export Modal State
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportDateRange, setExportDateRange] = useState({
    startDate: "",
    endDate: ""
  })
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchAllOrders(filters))
  }, [dispatch, filters])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const handleViewOrder = async (order) => {
    try {
      const resp = await orderAPI.getOrderDetails(order._id)
      const fetched = resp.data?.order || resp.data
      setSelectedOrder(fetched)
    } catch (err) {
      setSelectedOrder(order)
    } finally {
      setShowOrderModal(true)
    }
  }

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order)
    setStatusUpdate({
      status: order.status,
      trackingNumber: order.trackingInfo?.trackingNumber || "",
      carrier: order.trackingInfo?.carrier || "",
      notes: order.notes || "",
    })
    setShowStatusModal(true)
  }

  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (selectedOrder) {
      await dispatch(
        updateOrderStatus({
          orderId: selectedOrder._id,
          ...statusUpdate,
        })
      )
      setShowStatusModal(false)
      setSelectedOrder(null)
      setStatusUpdate({ status: "", trackingNumber: "", carrier: "", notes: "" })
    }
  }

  // 🆕 Export Handler
  const handleExportClick = () => {
    setExportDateRange({ startDate: "", endDate: "" })
    setShowExportModal(true)
  }

  const handleExportSubmit = async (e) => {
    e.preventDefault()
    
    if (!exportDateRange.startDate || !exportDateRange.endDate) {
      alert("Please select both start date and end date")
      return
    }

    setExportLoading(true)
    
    try {
      const response = await orderAPI.exportOrders(exportDateRange.startDate, exportDateRange.endDate)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `orders_${exportDateRange.startDate}_to_${exportDateRange.endDate}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      // Close modal
      setShowExportModal(false)
      setExportDateRange({ startDate: "", endDate: "" })
      
      // Optional: Show success message
      alert("Orders exported successfully!")
    } catch (error) {
      console.error("Export error:", error)
      alert(error.response?.data?.message || "Failed to export orders")
    } finally {
      setExportLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString() || 0}`
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      confirmed: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
      processing: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
      shipped: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
      out_for_delivery: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
      delivered: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      cancelled: "bg-red-50 text-red-700 ring-1 ring-red-200",
      refunded: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
      abandoned: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800 ring-1 ring-gray-200"
  }

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "abandoned", label: "Abandoned" },
  ]

  if (ordersLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-red-50/30 p-3 sm:p-5 lg:p-8 space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-5 sm:p-6 shadow-xl shadow-red-200/50">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">Transactions</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Orders Management</h1>
            <p className="text-rose-100/90 text-sm mt-1">Track and manage all customer orders</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 🆕 Export Button */}
            <button
              onClick={handleExportClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gray-500 rounded-xl  shadow-lg  transition-all duration-200"
            >
              <Download className="w-4 h-4 text-black" />
              Export to Excel
            </button>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Package className="w-4 h-4" />
              <span>Total Orders: {ordersPagination?.totalOrders || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search by order number, customer name, or phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 focus:bg-white transition"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="pl-10 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() =>
                setFilters({
                  page: 1,
                  limit: 20,
                  search: "",
                  status: "",
                  startDate: "",
                  endDate: "",
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Orders Display */}
      <div className="overflow-hidden bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
        {/* Mobile Card View */}
        <div className="block md:hidden">
          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No orders found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <div key={order._id} className="p-4 hover:bg-rose-50/40 transition">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{order.items.length} items</div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3 h-3" />
                      <span>{order.user?.name || "Guest"}</span>
                      <span className="text-gray-300">|</span>
                      <Phone className="w-3 h-3" />
                      <span>{order.user?.phoneNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(order.pricing?.total)}</div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => handleViewOrder(order)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleUpdateStatus(order)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-rose-50 to-red-50 border-b border-rose-100">
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-right text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ordersLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="w-8 h-8 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div></div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-rose-50/40 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500">{order.items.length} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.user?.name || "Guest"}</div>
                        <div className="text-xs text-gray-500">{order.user?.phoneNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(order.pricing?.total)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleViewOrder(order)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 hover:scale-105 transition">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleUpdateStatus(order)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:scale-105 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {ordersPagination && ordersPagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-gradient-to-r from-rose-50/50 to-white border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange("limit", parseInt(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <p className="hidden sm:block text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{(ordersPagination.currentPage - 1) * filters.limit + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(ordersPagination.currentPage * filters.limit, ordersPagination.totalOrders)}
                </span> of{" "}
                <span className="font-semibold text-gray-900">{ordersPagination.totalOrders}</span> orders
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!ordersPagination.hasPrev}
                className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(ordersPagination.currentPage - 1)}
                disabled={!ordersPagination.hasPrev}
                className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="hidden sm:flex items-center gap-1">
                <span className="px-3 py-1 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg shadow-md">
                  {ordersPagination.currentPage}
                </span>
                <span className="text-sm text-gray-500">of {ordersPagination.totalPages}</span>
              </div>

              <div className="sm:hidden text-sm font-medium text-gray-700">
                Page {ordersPagination.currentPage} of {ordersPagination.totalPages}
              </div>

              <button
                onClick={() => handlePageChange(ordersPagination.currentPage + 1)}
                disabled={!ordersPagination.hasNext}
                className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(ordersPagination.totalPages)}
                disabled={!ordersPagination.hasNext}
                className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🆕 Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
          <div className="min-h-screen flex items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 px-5 sm:px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export Orders to Excel
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">Select date range to export orders</p>
                </div>
                <button 
                  onClick={() => setShowExportModal(false)} 
                  className="p-2 text-white/90 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExportSubmit} className="p-5 sm:p-6 space-y-5">
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input
                    type="date"
                    value={exportDateRange.startDate}
                    onChange={(e) => setExportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                    className={inputCls}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className={labelCls}>End Date</label>
                  <input
                    type="date"
                    value={exportDateRange.endDate}
                    onChange={(e) => setExportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                    className={inputCls}
                    min={exportDateRange.startDate}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>


                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exportLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {exportLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal (Unchanged - Same as before) */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
          <div className="min-h-screen flex items-start sm:items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 sm:px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Order Details</h3>
                  <p className="text-xs text-rose-100 mt-0.5">{selectedOrder.orderNumber}</p>
                </div>
                <button onClick={() => setShowOrderModal(false)} className="p-2 text-white/90 hover:bg-white/20 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Order Info */}
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl ring-1 ring-gray-100">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-red-600" /> Order Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Order Number:</span>
                          <span className="font-semibold text-gray-900">{selectedOrder.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date:</span>
                          <span>{formatDate(selectedOrder.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total:</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedOrder.pricing?.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl ring-1 ring-gray-100">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-red-600" /> Customer Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{selectedOrder.user?.name || "Guest"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedOrder.user?.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{selectedOrder.user?.email || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {selectedOrder.shippingAddress && (
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl ring-1 ring-gray-100">
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-red-600" /> Shipping Address
                        </h4>
                        <div className="text-sm space-y-1">
                          <p className="font-semibold">{selectedOrder.shippingAddress.fullName}</p>
                          <p>{selectedOrder.shippingAddress.addressLine1}</p>
                          {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pinCode}</p>
                          <p>📞 {selectedOrder.shippingAddress.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Order Items */}
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl ring-1 ring-gray-100">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-red-600" /> Order Items
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
                            <img
                              src={item.product?.images?.[0]?.url || `/placeholder.svg?height=60&width=60&text=${item.name?.charAt(0) || "P"}`}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg ring-1 ring-gray-200"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">Size: {item.size} | Color: {item.color}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    {selectedOrder.pricing && (
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl ring-1 ring-gray-100">
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4 text-red-600" /> Pricing Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal:</span>
                            <span>{formatCurrency(selectedOrder.pricing.subtotal || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Shipping:</span>
                            <span>{formatCurrency(selectedOrder.pricing.shippingCharges || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tax:</span>
                            <span>{formatCurrency(selectedOrder.pricing.tax || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Referal:</span>
                            <span>{formatCurrency(selectedOrder.referralDiscount)}</span>
                          </div>
                          {(selectedOrder.pricing.discount || 0) > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount:</span>
                              <span>-{formatCurrency(selectedOrder.pricing.discount)}</span>
                            </div>
                          )}
                          {(selectedOrder.pricing.freediscount || 0) > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Free Discount:</span>
                              <span>-{formatCurrency(selectedOrder.pricing.freediscount)}</span>
                            </div>
                          )}
                          {selectedOrder.pricing?.referralDiscount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Referral Discount:</span>
                              <span className="text-green-600">-{formatCurrency(selectedOrder.pricing.referralDiscount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 text-base font-bold border-t">
                            <span>Total:</span>
                            <span>{formatCurrency(selectedOrder.pricing.total || 0)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Info */}
                    {selectedOrder.paymentInfo && (
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl ring-1 ring-gray-100">
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4 text-red-600" /> Payment Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Method:</span>
                            <span className="font-semibold">{selectedOrder.paymentInfo?.method || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span className={`font-semibold ${selectedOrder.paymentInfo?.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}`}>
                              {selectedOrder.paymentInfo?.paymentStatus || selectedOrder.paymentInfo?.status || "N/A"}
                            </span>
                          </div>
                          {selectedOrder.paymentInfo?.razorpayOrderId && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Razorpay ID:</span>
                              <span className="text-xs font-mono">{selectedOrder.paymentInfo?.razorpayOrderId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal (Unchanged - Same as before) */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
          <div className="min-h-screen flex items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 sm:px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Update Order Status</h3>
                  <p className="text-xs text-rose-100 mt-0.5">{selectedOrder.orderNumber}</p>
                </div>
                <button onClick={() => setShowStatusModal(false)} className="p-2 text-white/90 hover:bg-white/20 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStatusSubmit} className="p-5 sm:p-6 space-y-4">
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate((prev) => ({ ...prev, status: e.target.value }))}
                    required
                    className={inputCls}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(statusUpdate.status === "shipped" || statusUpdate.status === "out_for_delivery") && (
                  <>
                    <div>
                      <label className={labelCls}>Tracking Number</label>
                      <input
                        type="text"
                        value={statusUpdate.trackingNumber}
                        onChange={(e) => setStatusUpdate((prev) => ({ ...prev, trackingNumber: e.target.value }))}
                        className={inputCls}
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Carrier</label>
                      <select
                        value={statusUpdate.carrier}
                        onChange={(e) => setStatusUpdate((prev) => ({ ...prev, carrier: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="">Select Carrier</option>
                        <option value="shiprocket">Shiprocket</option>
                        <option value="delhivery">Delhivery</option>
                        <option value="bluedart">Blue Dart</option>
                        <option value="dtdc">DTDC</option>
                        <option value="fedex">FedEx</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea
                    value={statusUpdate.notes}
                    onChange={(e) => setStatusUpdate((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className={inputCls}
                    placeholder="Add any notes about this status update..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl shadow-md hover:shadow-lg transition"
                  >
                    Update Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersManagement