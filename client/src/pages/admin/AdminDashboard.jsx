"use client";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import AdminSidebar from "../../components/admin/AdminSidebar";
// import AdminHeader from "../../components/admin/AdminHeader"
import DashboardOverview from "../../components/admin/DashboardOverview";
import ProductsManagement from "../../components/admin/ProductsManagement";
import CategoriesManagement from "../../components/admin/CategoriesManagement";
import OrdersManagement from "../../components/admin/OrderMangement";
import BannersManagement from "../../components/admin/BannersManagement";
import UsersManagement from "../../components/admin/UserMangement";
import InnovationManagement from "../../components/admin/InnovationManagement";
import CouponsManagement from "../../components/admin/CouponsManagement";
import KsauniTshirtManagement from "../../components/admin/KsauniTshirtMangement";
import CancellationReasonsChart from "../../components/admin/CancellationReasons";
import { clearError, clearSuccess } from "../../store/slices/adminSlice";
// ✅ Import your ToastProvider
import ToastProvider from "../../components/ToastProvider";
const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { error, success } = useSelector((state) => state.admin);
  // Handle notifications
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (success) {
      toast.success(success);
      dispatch(clearSuccess());
    }
  }, [error, success, dispatch]);
  // Check if user has admin access
  if (!user || (user.role !== "admin" && user.role !== "digitalMarketer")) {
    return <Navigate to="/" replace />;
  }
  const getPageTitle = () => {
    const path = location.pathname.split("/").pop();
    switch (path) {
      case "admin":
      case "dashboard":
        return "Dashboard Overview";
      case "products":
        return "Products Management";
      case "categories":
        return "Categories Management";
      case "orders":
        return "Orders Management";
      case "banners":
        return "Banners Management";
      case "users":
        return "Users Management";
      case "innovations":
        return "Innovation Management";
      case "ksaunitshirtstyle":
        return "Kasuni T-Shirt Style Management";
      case "coupons":
        return "Coupons Management";
      default:
        return "Admin Dashboard";
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Add ToastProvider at top-level */}
      <ToastProvider />
      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userRole={user.role} />
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        {/* <AdminHeader setSidebarOpen={setSidebarOpen} pageTitle={getPageTitle()} user={user} /> */}
        {/* Page Content */}
        <main className="py-6">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="dashboard" element={<DashboardOverview />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="banners" element={<BannersManagement />} />
              <Route path="innovations" element={<InnovationManagement />} />
              <Route path="ksaunitshirtstyle" element={<KsauniTshirtManagement />} />
              {user.role === "admin" && (
                <>
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="coupons" element={<CouponsManagement />} />
                </>
              )}
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/cancellation" element={<CancellationReasonsChart />} />
            </Routes>
          </div>
        </main>
      </div>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-white bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
export default AdminDashboard;