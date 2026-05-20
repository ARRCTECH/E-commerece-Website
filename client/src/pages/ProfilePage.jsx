import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  User,
  Camera,
  Package,
  Heart,
  UserPlus,
  Mail,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  Copy,
  Shield,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Calendar,
  Award,
  TrendingUp,
  Sparkles,
  ChevronRight,
  CheckCircle,
  Clock,
  Menu,
  X,
  Download,
} from "lucide-react";
import { updateProfile, changePassword, uploadAvatar, getProfile } from "../store/slices/authSlice";
import { fetchUserOrders } from "../store/slices/orderSlice";
import { fetchWishlist } from "../store/slices/wishlistSlice";
import toast from "react-hot-toast";
import { format } from "date-fns";
import Preloader from "../components/Preloader";
import InvoiceDownloadButton from "../pages/InvoiceDownloadButton"; // ✅ Import Invoice Button

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  const { orders = [] } = useSelector((state) => state.orders);
  const { items: wishlistItems = [] } = useSelector((state) => state.wishlist);

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    addresses: [],
    myreferralCode: "",
    referredBy: "",
    expireReferralDate: "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: "home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const [dataforreferral, setDataforreferral] = useState(null);
  const [totalEarning, setTotalEarning] = useState(0);

  // ✅ Check if invoice can be downloaded
  const canDownloadInvoice = (order) => {
    const status = order?.status?.toLowerCase();
    return status === "delivered" || status === "shipped" || status === "confirmed";
  };

  // --- Helper functions (memoized) ---
  const getTotalEarning = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/referral-total-earning`, {
        userId: user._id,
      });
      setTotalEarning(res.data.data.totalEarning);
    } catch (error) {
      console.error("Error calculating total earning:", error);
    }
  }, [user?._id]);

  const getReferralDetails = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/referral/fetchReferral`, {
        userId: user._id,
      });
      setDataforreferral(res.data.data);
    } catch (error) {
      console.error("Error fetching referral details:", error.response?.data || error.message);
    }
  }, [user?._id]);

  // --- Effects ---
  useEffect(() => {
    const savedTab = localStorage.getItem("activeButton");
    if (savedTab && ["profile", "orders", "security", "referral"].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth ? format(new Date(user.dateOfBirth), "yyyy-MM-dd") : "",
        gender: user.gender || "",
        addresses: user.addresses || [],
        myreferralCode: user.myreferralCode || "",
        referredBy: user.referredBy || null,
        expireReferralDate: user.expireReferralDate || null,
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) {
      getReferralDetails();
      getTotalEarning();
    }
  }, [user?._id, getReferralDetails, getTotalEarning]);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserOrders({ limit: 5 }));
      dispatch(fetchWishlist());
      dispatch(getProfile());
    }
  }, [dispatch, user]);

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // --- Handlers ---
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem("activeButton", tabId);
    setMobileMenuOpen(false);
  };

 const handleProfileUpdate = async (e) => {
  e.preventDefault();
  
  // ✅ Debug: Check what data is being sent
  console.log("📤 Sending profile data:", {
    name: profileData.name,
    phone: profileData.phone,
    dateOfBirth: profileData.dateOfBirth,
    gender: profileData.gender,
    addresses: profileData.addresses
  });
  
  try {
    const result = await dispatch(updateProfile(profileData)).unwrap();
    console.log("✅ Update response:", result);
    toast.success("Profile updated successfully!");
    setIsEditing(false);
    setOriginalProfile(null);
  } catch (error) {
    console.error("❌ Update error:", error);
    toast.error(error.message || "Update failed");
  }
};

  const startEditing = () => {
    setOriginalProfile({ ...profileData });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (originalProfile) {
      setProfileData(originalProfile);
    }
    setIsEditing(false);
    setOriginalProfile(null);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      await dispatch(uploadAvatar(formData)).unwrap();
      toast.success("Profile picture updated!");
      e.target.value = "";
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    try {
      await dispatch(
        changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      ).unwrap();
      toast.success("Password changed successfully!");
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetAddressForm = () => {
    setNewAddress({
      type: "home",
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleAddOrUpdateAddress = async (e) => {
    e.preventDefault();
    setIsAddressSaving(true);
    try {
      let updatedAddresses = [...profileData.addresses];
      let newAddr;
      if (editingAddress) {
        updatedAddresses = updatedAddresses.map((addr) =>
          addr._id === editingAddress._id ? { ...newAddress, _id: addr._id } : addr
        );
        toast.success("Address updated successfully!");
      } else {
        newAddr = { ...newAddress, _id: Date.now().toString() };
        updatedAddresses.push(newAddr);
        toast.success("Address added successfully!");
      }
      if (newAddress.isDefault) {
        updatedAddresses = updatedAddresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === (editingAddress?._id || newAddr._id),
        }));
      }
      await dispatch(updateProfile({ ...profileData, addresses: updatedAddresses })).unwrap();
      setProfileData((prev) => ({ ...prev, addresses: updatedAddresses }));
      resetAddressForm();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const updatedAddresses = profileData.addresses.filter((addr) => addr._id !== addressId);
      await dispatch(updateProfile({ ...profileData, addresses: updatedAddresses })).unwrap();
      setProfileData((prev) => ({ ...prev, addresses: updatedAddresses }));
      toast.success("Address deleted");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const startEditAddress = (address) => {
    setEditingAddress(address);
    setNewAddress({ ...address });
    setShowAddressForm(true);
  };

  const copyToClipboard = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.myreferralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copied to clipboard!");
  };

  const referralLink = `${window.location.origin}/register?ref=${user?.myreferralCode}`;
  const shareText = "Join now using my referral link and get exciting rewards! 🚀";
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`,
    email: `mailto:?subject=${encodeURIComponent("Join with my referral link")}&body=${encodeURIComponent(
      `${shareText}\n\n${referralLink}`
    )}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "orders", label: "Orders", icon: Package },
    { id: "security", label: "Security", icon: Shield },
    { id: "referral", label: "Referral", icon: UserPlus },
  ];

  if (isLoading) {
    return <Preloader message="Loading profile..." />;
  }

  // Get active icon for mobile menu
  const ActiveIcon = tabs.find(tab => tab.id === activeTab)?.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/80">
      <div className="container px-3 sm:px-4 py-4 sm:py-6 md:py-8 lg:py-12 mx-auto">
        <div className="max-w-6xl mx-auto">
          {/* Premium Profile Header - Responsive */}
          <div className="relative mb-4 sm:mb-6 md:mb-8 overflow-hidden bg-white rounded-xl sm:rounded-2xl shadow-lg">
            <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-gradient-to-br from-red-500/10 to-rose-500/5 rounded-full -mt-20 -mr-20 sm:-mt-40 sm:-mr-40 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-gradient-to-tr from-amber-500/5 to-red-500/5 rounded-full -mb-20 -ml-20 sm:-mb-40 sm:-ml-40 blur-3xl" />

            <div className="relative p-4 sm:p-6 md:p-8">
              <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:items-start">
                {/* Avatar - Responsive sizes */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-rose-600 blur-md opacity-60" />
                  <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 overflow-hidden rounded-full ring-4 ring-white shadow-xl bg-gradient-to-br from-red-100 to-red-200">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="object-cover w-full h-full" />
                    ) : (
                      <User className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 sm:p-2 text-white transition-all rounded-full cursor-pointer shadow-lg bg-gradient-to-br from-red-500 to-rose-600 hover:scale-110 ring-2 ring-white">
                    <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>

                {/* User Info - Responsive text sizes */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 mb-2 sm:mb-3 text-[10px] sm:text-xs font-bold tracking-wider text-gray-700 uppercase bg-red-50 rounded-full border border-gray-100">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    Premium Member
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 break-words">{user?.name}</h1>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500 break-all">{user?.email}</p>
                  <p className="mt-1 text-[10px] sm:text-xs text-gray-400">
                    Member since {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "recently"}
                  </p>
                </div>

                {/* Stats - Responsive */}
                <div className="flex gap-2 sm:gap-3">
                  <div className="px-3 sm:px-5 py-2 sm:py-3 text-center bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100">
                    <div className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">{orders.length}</div>
                    <div className="text-[10px] sm:text-xs font-medium text-gray-500">Orders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {/* Mobile Menu Button */}
            <div className="lg:hidden sticky top-0 z-20 mb-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-md border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  {ActiveIcon && (
                    <div className="p-1.5 rounded-lg bg-red-50">
                      <ActiveIcon className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <span className="font-semibold text-gray-700">
                    {tabs.find(tab => tab.id === activeTab)?.label || "Profile"}
                  </span>
                </div>
                {mobileMenuOpen ? <X className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
              </button>
            </div>

            {/* Sidebar - Desktop always visible, Mobile as drawer */}
            <div className={`
              lg:col-span-1
              ${mobileMenuOpen ? 'fixed inset-0 z-50 bg-black/50 lg:relative lg:bg-transparent' : 'hidden lg:block'}
            `}>
              <div className={`
                fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0 lg:w-auto lg:shadow-none lg:bg-transparent
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center lg:hidden">
                  <h2 className="text-lg font-bold text-gray-800">Menu</h2>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-2 lg:p-0">
                  <div className="sticky top-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-2">
                      <nav className="flex flex-col gap-1">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => handleTabChange(tab.id)}
                              className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-left text-sm font-medium transition-all duration-300 ${
                                isActive
                                  ? "bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg"
                                  : "text-gray-600 hover:bg-red-50 hover:text-gray-700"
                              }`}
                            >
                              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                              <span className="text-xs sm:text-sm">{tab.label}</span>
                              {isActive && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto" />}
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
              {/* Backdrop for mobile */}
              {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
              )}
            </div>

            {/* Main Content - Responsive */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 md:p-8">
                  <AnimatePresence mode="wait">
                    {/* PROFILE TAB */}
                    {activeTab === "profile" && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Profile content - same as before */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-700">Personal Information</h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Manage your personal details</p>
                          </div>
                          {!isEditing && (
                            <button
                              onClick={startEditing}
                              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-900 to-red-800 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Edit Profile
                            </button>
                          )}
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-6">
                          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                            <div>
                              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-700">Full Name</label>
                              <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900 disabled:bg-red-50 disabled:text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-700">Email Address</label>
                              <input
                                type="email"
                                value={profileData.email}
                                disabled
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-500 bg-red-50 border border-gray-200 rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-700">Phone Number</label>
                              <input
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900 disabled:bg-red-50 disabled:text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-700">Date of Birth</label>
                              <input
                                type="date"
                                value={profileData.dateOfBirth}
                                onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900 disabled:bg-red-50 disabled:text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-700">Gender</label>
                              <select
                                value={profileData.gender}
                                onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900 disabled:bg-red-50 disabled:text-gray-500"
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>

                          {isEditing && (
                            <div className="flex flex-col-reverse justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-gray-100 sm:flex-row">
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-red-50 transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-900 to-red-800 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                              >
                                Save Changes
                              </button>
                            </div>
                          )}
                        </form>

                        {/* Addresses Section - Responsive */}
                        <div className="pt-6 sm:pt-8 mt-6 sm:mt-10 border-t border-gray-100">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-700">Saved Addresses</h3>
                              <p className="text-xs sm:text-sm text-gray-500">Manage your shipping locations</p>
                            </div>
                            {!showAddressForm && (
                              <button
                                onClick={() => setShowAddressForm(true)}
                                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-900 to-red-800 shadow-md hover:shadow-lg hover:scale-[1.02]"
                              >
                                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Address
                              </button>
                            )}
                          </div>

                          {showAddressForm && (
                            <div className="p-4 sm:p-5 mb-5 border border-gray-100 rounded-xl sm:rounded-2xl bg-red-50/50">
                              <h4 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-700">{editingAddress ? "Edit Address" : "New Address"}</h4>
                              <form onSubmit={handleAddOrUpdateAddress} className="space-y-3 sm:space-y-4">
                                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                                  <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={newAddress.fullName}
                                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={newAddress.phone}
                                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="Address Line 1"
                                    value={newAddress.addressLine1}
                                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="Address Line 2 (Optional)"
                                    value={newAddress.addressLine2}
                                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                  />
                                  <input
                                    type="text"
                                    placeholder="City"
                                    value={newAddress.city}
                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="State"
                                    value={newAddress.state}
                                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="Pincode"
                                    value={newAddress.pincode}
                                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                    required
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={newAddress.isDefault}
                                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 border-gray-300 rounded focus:ring-red-900"
                                  />
                                  <label htmlFor="isDefault" className="text-xs sm:text-sm text-gray-700">
                                    Set as default address
                                  </label>
                                </div>
                                <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                                  <button
                                    type="button"
                                    onClick={resetAddressForm}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-red-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isAddressSaving}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-900 to-red-800 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isAddressSaving ? "Saving..." : editingAddress ? "Update" : "Save"} Address
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}

                          <div className="space-y-2 sm:space-y-3">
                            {profileData.addresses.map((addr) => (
                              <div key={addr._id} className="p-3 sm:p-4 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-700 text-sm sm:text-base">
                                      {addr.fullName}
                                      <span className="mx-1 sm:mx-2 text-gray-300">•</span>
                                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">{addr.type}</span>
                                    </p>
                                    <p className="mt-1 text-xs sm:text-sm text-gray-600 break-words">
                                      {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                                      {addr.city}, {addr.state} - {addr.pincode}
                                    </p>
                                    <p className="mt-0.5 text-xs sm:text-sm text-gray-600">📞 {addr.phone}</p>
                                    {addr.isDefault && (
                                      <span className="inline-block px-2 py-0.5 mt-2 text-[10px] sm:text-xs font-semibold text-white rounded-full bg-gradient-to-r from-red-900 to-red-800 shadow-sm">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1 shrink-0 self-end sm:self-auto">
                                    <button onClick={() => startEditAddress(addr)} className="p-1.5 sm:p-2 text-gray-500 transition-colors rounded-lg hover:bg-red-100 hover:text-gray-700">
                                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteAddress(addr._id)} className="p-1.5 sm:p-2 text-gray-500 transition-colors rounded-lg hover:bg-red-50 hover:text-gray-600">
                                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {profileData.addresses.length === 0 && (
                              <p className="py-6 text-xs sm:text-sm text-center text-gray-500">No addresses saved yet.</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ORDERS TAB - With Download Invoice Button */}
                    {activeTab === "orders" && (
                      <motion.div
                        key="orders"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 sm:mb-6">Recent Orders</h2>
                        {orders.length > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {orders.map((order) => (
                              <div key={order._id} className="p-4 sm:p-5 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-3">
                                  <span className="font-bold text-gray-700 text-sm sm:text-base">Order #{order.orderNumber}</span>
                                  <span className="text-xs sm:text-sm text-gray-500">
                                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <span className="text-xs sm:text-sm text-gray-600">{order.items?.length || 0} items</span>
                                  <div className="flex items-center gap-3 sm:gap-4">
                                    <span className="text-base sm:text-lg font-bold text-gray-700">₹{order.pricing?.total || 0}</span>
                                    <span
                                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold capitalize ${
                                        order.status === "delivered"
                                          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                          : order.status === "shipped"
                                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                      }`}
                                    >
                                      {order.status}
                                    </span>
                                    {/* ✅ Download Invoice Button in Orders Tab */}
                                    {canDownloadInvoice(order) && (
                                      <InvoiceDownloadButton 
                                        order={order} 
                                        variant="icon" 
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white text-emerald-600 font-semibold text-xs hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 sm:py-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 rounded-full bg-red-100">
                              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                            </div>
                            <p className="text-sm sm:text-base text-gray-500">No orders yet</p>
                            <p className="mt-1 text-xs sm:text-sm text-gray-400">Start shopping to see your orders here</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* SECURITY TAB - Responsive */}
                    {activeTab === "security" && (
                      <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 sm:mb-6">Security Settings</h2>
                        <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-xl">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                              <h3 className="font-bold text-gray-700 text-sm sm:text-base">Password</h3>
                              <p className="mt-0.5 text-xs sm:text-sm text-gray-500">Update your password to keep your account secure</p>
                            </div>
                            <button
                              onClick={() => setShowPasswordForm(!showPasswordForm)}
                              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                                showPasswordForm
                                  ? "text-gray-700 bg-white border border-gray-200 hover:bg-red-50"
                                  : "text-white bg-gradient-to-r from-red-900 to-red-800 shadow-md hover:shadow-lg hover:scale-[1.02]"
                              }`}
                            >
                              {showPasswordForm ? "Cancel" : "Change Password"}
                            </button>
                          </div>
                          {showPasswordForm && (
                            <form onSubmit={handlePasswordChange} className="pt-4 space-y-4 border-t border-gray-100">
                              <div>
                                <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-700">Current Password</label>
                                <input
                                  type="password"
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-700">New Password</label>
                                <input
                                  type="password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-700">Confirm New Password</label>
                                <input
                                  type="password"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                  required
                                />
                              </div>
                              <button
                                type="submit"
                                className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-900 to-red-800 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                              >
                                Update Password
                              </button>
                            </form>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* REFERRAL TAB - Responsive */}
                    {activeTab === "referral" && (
                      <motion.div
                        key="referral"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-red-900 to-red-800 shadow-lg">
                            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-700">My Referral</h2>
                            <p className="text-xs sm:text-sm text-gray-500">Invite friends and earn rewards</p>
                          </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                            <div className="relative p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-red-700 to-red-800 rounded-xl sm:rounded-2xl shadow-xl">
                              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full -mt-12 -mr-12 sm:-mt-16 sm:-mr-16 blur-2xl" />
                              <p className="relative text-xs sm:text-sm font-medium text-gray-300">Total Referrals</p>
                              <p className="relative mt-1 sm:mt-2 text-3xl sm:text-4xl font-bold text-white">{dataforreferral?.numberOfReferrals || 0}</p>
                            </div>
                            <div className="relative p-4 sm:p-6 overflow-hidden bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-lg">
                              <p className="text-xs sm:text-sm font-medium text-gray-500">Referral Earnings</p>
                              <p className="mt-1 sm:mt-2 text-3xl sm:text-4xl font-bold text-gray-900">₹{Math.round(totalEarning)}</p>
                            </div>
                          </div>
                          <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-lg">
                            <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-bold text-gray-700">Share Referral Link</h3>
                            <div className="flex flex-col gap-2 sm:gap-3 md:flex-row">
                              <input
                                type="text"
                                readOnly
                                value={referralLink}
                                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 bg-red-50 border border-gray-200 rounded-xl focus:outline-none"
                              />
                              <button
                                onClick={copyToClipboard}
                                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-700 to-red-800 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                Copy Link
                              </button>
                            </div>
                            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-2">
                              Referral Code:
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold tracking-wider text-gray-700 uppercase bg-red-100 rounded-lg">{user?.myreferralCode || "N/A"}</span>
                            </p>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
                              <a
                                href={shareUrls.whatsapp}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md"
                              >
                                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">WhatsApp</span>
                              </a>
                              <a
                                href={shareUrls.email}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md"
                              >
                                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Email</span>
                              </a>
                              <a
                                href={shareUrls.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md"
                              >
                                <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Facebook</span>
                              </a>
                              <a
                                href={shareUrls.twitter}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md"
                              >
                                <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Twitter</span>
                              </a>
                              <a
                                href={shareUrls.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md"
                              >
                                <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">LinkedIn</span>
                              </a>
                              <a
                                href={shareUrls.telegram}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md"
                              >
                                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Telegram</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;