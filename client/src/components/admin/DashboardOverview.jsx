"use client"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  FireIcon,
} from "@heroicons/react/24/outline"
import { fetchDashboardStats } from "../../store/slices/adminSlice"
import LoadingSpinner from "../LoadingSpinner"

const DashboardOverview = () => {
  const dispatch = useDispatch()
  const { dashboardStats, dashboardLoading } = useSelector((state) => state.admin)

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-red-50">
            <ChartBarIcon className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-700 font-semibold">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      name: "Total Sales",
      value: `₹${dashboardStats?.stats?.totalSales?.toLocaleString() ?? 0}`,
      icon: CurrencyRupeeIcon,
      change: `₹${dashboardStats?.stats?.dailySales?.amount?.toLocaleString() ?? 0}`,
      changeLabel: "today",
      gradient: "from-red-600 to-rose-500",
    },
    {
      name: "Total Orders",
      value: dashboardStats?.stats?.totalOrders?.toLocaleString() ?? 0,
      icon: ShoppingBagIcon,
      change: `${dashboardStats?.stats?.dailySales?.count ?? 0}`,
      changeLabel: "today",
      gradient: "from-rose-500 to-red-400",
    },
    {
      name: "Total Users",
      value: dashboardStats?.stats?.totalUsers?.toLocaleString() ?? 0,
      icon: UsersIcon,
      change: "Active users",
      gradient: "from-red-500 to-orange-500",
    },
    {
      name: "Pending Orders",
      value: dashboardStats?.stats?.pendingOrders?.toLocaleString() ?? 0,
      icon: ClipboardDocumentListIcon,
      change: "Need attention",
      gradient: "from-rose-600 to-red-700",
    },
  ]

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "₹0"
    return `₹${Number(amount).toLocaleString()}`
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      confirmed: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
      processing: "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
      shipped: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
      delivered: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      cancelled: "bg-red-100 text-red-700 ring-1 ring-red-200",
    }
    return colors[status] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
  }

  const maxSales = Math.max(...(dashboardStats.salesChart?.map((d) => d.sales) || [1]), 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-red-50/30 p-3 sm:p-5 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.name}
              className="group relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 hover:shadow-xl hover:shadow-red-100/50 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br ${item.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg shadow-red-200/40`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">{item.name}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 truncate">{item.value}</p>
              {item.change && (
                <div className="flex items-center gap-1.5 mt-3 text-xs sm:text-sm">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-600">{item.change}</span>
                  {item.changeLabel && <span className="text-gray-500">{item.changeLabel}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Recent Orders + Popular Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <ShoppingBagIcon className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Orders</h2>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            {!dashboardStats.recentOrders || dashboardStats.recentOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">No recent orders found</p>
            ) : (
              <div className="space-y-2">
                {dashboardStats.recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order._id || order.orderNumber}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl hover:bg-rose-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {order.user?.name || "Guest"} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <p className="font-bold text-gray-900 text-sm">{formatCurrency(order?.total ?? 0)}</p>
                      <span className={`px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Popular Products */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <FireIcon className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Popular Products</h2>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            {!dashboardStats.popularProducts || dashboardStats.popularProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">No popular products data available</p>
            ) : (
              <div className="space-y-2">
                {dashboardStats.popularProducts.slice(0, 5).map((item, index) => (
                  <div
                    key={item.product?._id || index}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-rose-50/50 transition-colors"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
                      index === 0 ? "bg-gradient-to-br from-red-600 to-rose-700 text-white" :
                      index === 1 ? "bg-gradient-to-br from-rose-400 to-red-500 text-white" :
                      index === 2 ? "bg-gradient-to-br from-rose-300 to-rose-400 text-white" :
                      "bg-rose-50 text-red-700"
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {item.product?.name || "Unknown Product"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.product?.price || 0)}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-red-600">{item.totalSold || 0}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Sales Overview</h2>
          </div>
          <span className="text-xs font-medium text-gray-500 px-3 py-1 bg-rose-50 rounded-full self-start sm:self-auto">
            Last 7 Days
          </span>
        </div>
        <div className="overflow-x-auto -mx-2 px-2">
          <div className="flex items-end justify-between gap-2 sm:gap-3 min-w-[400px] sm:min-w-0 h-48 sm:h-56 lg:h-64">
            {dashboardStats.salesChart?.map((day, index) => {
              const heightPct = Math.max((day.sales / maxSales) * 100, 4)
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-red-600 via-rose-500 to-red-400 rounded-t-lg shadow-md group-hover:shadow-red-300/60 group-hover:from-red-700 group-hover:to-rose-400 transition-all duration-300 relative"
                      style={{ height: `${heightPct}%`, minHeight: "100px" }}
                    >
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {formatCurrency(day.sales)}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600">
                    {new Date(day._id).toLocaleDateString("en-IN", { weekday: "short" })}
                  </p>
                  <p className="text-[10px] text-gray-800">{day.orders} ord</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="relative overflow-hidden bg-white rounded-2xl p-5 sm:p-6 shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-100 to-transparent rounded-bl-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-200/40">
              <CalendarDaysIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Weekly Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {dashboardStats.stats?.weeklySales?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-2xl p-5 sm:p-6 shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100 to-transparent rounded-bl-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200/40">
              <ArrowTrendingUpIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Monthly Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {dashboardStats.stats?.monthlySales?.count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview
