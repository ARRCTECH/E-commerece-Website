"use client";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import MarketerSidebar from "../../components/digitalMarketer/MarketerSidebar";
import MarketerHeader from "../../components/digitalMarketer/MarketerHeader";
import MarketingAnalytics from "../../components/digitalMarketer/MarketingAnalytics";
import PromoBannersManagement from "../../components/digitalMarketer/PromoBannersManagement";
import SEOManagement from "../../components/digitalMarketer/SEOManagement";
import CampaignManagement from "../../components/digitalMarketer/CampaignManagement";
import { clearError, clearSuccess } from "../../store/slices/digitalMarketerSlice";
const DigitalMarketerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { error, success } = useSelector((state) => state.digitalMarketer);
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
  // Check if user has digital marketer access
  if (!user || (user.role !== "admin" && user.role !== "digitalMarketer")) {
    return <Navigate to="/" replace />;
  }
  const getPageTitle = () => {
    const path = location.pathname.split("/").pop();
    switch (path) {
      case "marketer":
      case "analytics":
        return "Marketing Analytics";
      case "banners":
        return "Promo Banners";
      case "seo":
        return "SEO Management";
      case "campaigns":
        return "Campaign Management";
      default:
        return "Digital Marketing Dashboard";
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <MarketerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <MarketerHeader setSidebarOpen={setSidebarOpen} pageTitle={getPageTitle()} user={user} />
        {/* Page Content */}
        <main className="py-6">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <Routes>
              <Route index element={<MarketingAnalytics />} />
              <Route path="analytics" element={<MarketingAnalytics />} />
              <Route path="banners" element={<PromoBannersManagement />} />
               <Route path="seo" element={<SEOManagement />} />
              <Route path="campaigns" element={<CampaignManagement />} />
              <Route path="*" element={<Navigate to="/marketer/analytics" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};
export default DigitalMarketerDashboard;