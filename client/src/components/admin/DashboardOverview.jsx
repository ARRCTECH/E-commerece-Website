"use client"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { CurrencyRupeeIcon, ShoppingBagIcon, UsersIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline"
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
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }
  if (!dashboardStats) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    )
  }
  const stats = [
    {
      name: "Total Sales",
      value: `₹${dashboardStats?.stats?.totalSales?.toLocaleString() ?? 0}`,
      icon: CurrencyRupeeIcon,
      change: `₹${dashboardStats?.stats?.dailySales?.amount?.toLocaleString() ?? 0}`,
      changeType: "increase",
      changeLabel: "today",
    },
    {
      name: "Total Orders",
      value: dashboardStats?.stats?.totalOrders?.toLocaleString() ?? 0,
      icon: ShoppingBagIcon,
      change: `${dashboardStats?.stats?.dailySales?.count ?? 0}`,
      changeType: "increase",
      changeLabel: "today",
    },
    {
      name: "Total Users",
      value: dashboardStats?.stats?.totalUsers?.toLocaleString() ?? 0,
      icon: UsersIcon,
      change: "Active users",
      changeType: "neutral",
    },
    {
      name: "Pending Orders",
      value: dashboardStats?.stats?.pendingOrders?.toLocaleString() ?? 0,
      icon: ClipboardDocumentListIcon,
      change: "Need attention",
      changeType: (dashboardStats?.stats?.pendingOrders ?? 0) > 0 ? "decrease" : "neutral",
    },
  ]
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "₹0"
    }
    return `₹${Number(amount).toLocaleString()}`
  }
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative px-4 py-5 overflow-hidden bg-white rounded-lg shadow sm:px-6 sm:py-6"
          >
            <dt>
              <div className="absolute p-3 bg-red-500 rounded-md">
                <item.icon className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
            </dt>
            <dd className="flex items-baseline ml-16">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              {item.change && (
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.changeType === "increase"
                      ? "text-green-600"
                      : item.changeType === "decrease"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {item.change}
                  {item.changeLabel && <span className="ml-1 font-normal text-gray-500">{item.changeLabel}</span>}
                </p>
              )}
            </dd>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">Recent Orders</h3>
            <div className="flow-root">
              {!dashboardStats.recentOrders || dashboardStats.recentOrders.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No recent orders found</p>
                </div>
              ) : (
                <ul className="-my-5 divide-y divide-gray-200">
                  {dashboardStats.recentOrders.slice(0, 5).map((order) => (
                    <li key={order._id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">
                            {order.user?.name || "Guest"} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(order?.total ?? 0)}</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}
                          >
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        {/* Popular Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">Popular Products</h3>
            <div className="flow-root">
              {!dashboardStats.popularProducts || dashboardStats.popularProducts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No popular products data available</p>
                </div>
              ) : (
                <ul className="-my-5 divide-y divide-gray-200">
                  {dashboardStats.popularProducts.slice(0, 5).map((item, index) => (
                    <li key={item._id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                            <span className="text-sm font-medium text-red-600">#{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product?.name || "Unknown Product"}
                          </p>
                          <p className="text-sm text-gray-500">{formatCurrency(item.product?.price || 0)}</p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{item.totalSold || 0} sold</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Sales Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">Sales Overview (Last 7 Days)</h3>
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-2">
              {dashboardStats.salesChart.map((day, index) => (
                <div key={day._id} className="text-center">
                  <div className="mb-2 text-xs text-gray-500">
                    {new Date(day._id).toLocaleDateString("en-IN", { weekday: "short" })}
                  </div>
                  <div
                    className="bg-red-500 rounded-t"
                    style={{
                      height: `${Math.max((day.sales / Math.max(...dashboardStats.salesChart.map((d) => d.sales))) * 100, 5)}px`,
                      minHeight: "5px",
                    }}
                  />
                  <div className="text-xs text-gray-500">{day.orders} orders</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBagIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Weekly Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{dashboardStats.stats?.weeklySales?.count || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBagIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardStats.stats?.monthlySales?.count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default DashboardOverview
