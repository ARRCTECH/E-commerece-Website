"use client";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
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
import PartialCodSetting from "../../components/admin/PartialCodSetting";
import { clearError, clearSuccess } from "../../store/slices/adminSlice";
import ToastProvider from "../../components/ToastProvider";
import ReferralDiscountManager from "../../components/admin/ReferralManagement";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
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
      case "referral":
        return "Referral Management";
      case "partial-cod":
        return "Partial COD Settings";
      case "cancellation":
        return "Cancellation Reasons";
      default:
        return "Admin Dashboard";
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastProvider />
      
      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userRole={user.role} />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Custom Header with Back Button Only */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </button>
                <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
              </div>
              
              {/* Optional: Add admin badge or user info */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-gray-800 to-gray-900 rounded-full">
                  {user?.role === "admin" ? "Admin" : "Digital Marketer"}
                </div>
              </div>
            </div>
          </div>
        </div>

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
              <Route path="referral" element={<ReferralDiscountManager />} />
              <Route path="partial-cod" element={<PartialCodSetting />} />
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