import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  User, Camera, Package, UserPlus, Mail, MessageCircle,
  Facebook, Twitter, Linkedin, Send, Copy, Shield, Edit2,
  ChevronRight, Sparkles, X, Menu
} from "lucide-react";
import { changePassword, uploadAvatar } from "../store/slices/authSlice";
import { fetchUserOrders } from "../store/slices/orderSlice";
import { fetchWishlist } from "../store/slices/wishlistSlice";
import toast from "react-hot-toast";
import { format } from "date-fns";
import Preloader from "../components/Preloader";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, isLoading: authLoading } = useSelector((state) => state.auth);
  const { orders = [] } = useSelector((state) => state.orders);
  const { items: wishlistItems = [] } = useSelector((state) => state.wishlist);

  // UI State
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [referralData, setReferralData] = useState(null);
  const [totalEarning, setTotalEarning] = useState(0);

  // Modal state for save confirmation
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedDetails, setSavedDetails] = useState({
    name: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({
    gender: "",
  });

  // Profile data from API
  const [profileData, setProfileData] = useState({
    name: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
  });

  const [addresses, setAddresses] = useState([]);
  const hasFetchedProfile = useRef(false);

  // Load saved tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("activeButton");
    if (savedTab && ["profile", "orders", "security", "referral"].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Close mobile menu when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Fetch profile details from API
  const fetchProfileDetails = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      if (user) {
        setProfileData({
          name: user.name || "",
          phoneNumber: user.phoneNumber || user.phone || "",
          dateOfBirth: user.dateOfBirth ? format(new Date(user.dateOfBirth), "yyyy-MM-dd") : "",
          gender: user.gender || "",
        });
        if (user.addresses) setAddresses(user.addresses);
      }
      setIsLoadingProfile(false);
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/getprofiledetails`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let userData = response.data;
      if (response.data.user) userData = response.data.user;
      if (response.data.data) userData = response.data.data;

      setProfileData({
        name: userData.name || "",
        phoneNumber: userData.phoneNumber || userData.phone || "",
        dateOfBirth: userData.dateOfBirth
          ? format(new Date(userData.dateOfBirth), "yyyy-MM-dd")
          : "",
        gender: userData.gender || "",
      });

      if (userData.addresses) setAddresses(userData.addresses);
    } catch (error) {
      console.error("Error fetching profile details:", error);
      toast.error(error.response?.data?.message || "Failed to load profile details");
      if (user) {
        setProfileData({
          name: user.name || "",
          phoneNumber: user.phoneNumber || user.phone || "",
          dateOfBirth: user.dateOfBirth ? format(new Date(user.dateOfBirth), "yyyy-MM-dd") : "",
          gender: user.gender || "",
        });
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    if (!hasFetchedProfile.current) {
      hasFetchedProfile.current = true;
      fetchProfileDetails();
    }
  }, [fetchProfileDetails]);

  // Fetch orders, wishlist, referral
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserOrders({ limit: 5 }));
      dispatch(fetchWishlist());
      fetchReferralData();
      fetchTotalEarning();
    }
  }, [user?._id, dispatch]);

  const fetchReferralData = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/referral/fetchReferral`, {
        userId: user._id,
      });
      setReferralData(res.data.data);
    } catch (error) {
      console.error("Error fetching referral details:", error);
    }
  }, [user?._id]);

  const fetchTotalEarning = useCallback(async () => {
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

  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString();
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem("activeButton", tabId);
  };

  const startEditing = () => {
    setOriginalProfile({ ...profileData });
    setIsEditing(true);
    setValidationErrors({ gender: "" });
  };

  const cancelEditing = () => {
    if (originalProfile) {
      setProfileData(originalProfile);
    }
    setIsEditing(false);
    setOriginalProfile(null);
    setValidationErrors({ gender: "" });
  };

  const validateGender = (gender) => {
    if (!gender) return "Please select your gender";
    return "";
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (field === 'gender') setValidationErrors(prev => ({ ...prev, gender: "" }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    const genderError = validateGender(profileData.gender);
    if (genderError) {
      setValidationErrors({ gender: genderError });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication token missing. Please login again.");
        return;
      }

      const payload = {
        name: profileData.name,
        dateOfBirth: formatDateForAPI(profileData.dateOfBirth),
        gender: profileData.gender,
        phoneNumber: profileData.phoneNumber,
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/updateprofiledetails`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let updatedData = response.data;
      if (response.data.user) updatedData = response.data.user;
      if (response.data.data) updatedData = response.data.data;

      setProfileData({
        name: updatedData.name || profileData.name,
        phoneNumber: updatedData.phoneNumber || profileData.phoneNumber,
        dateOfBirth: updatedData.dateOfBirth
          ? format(new Date(updatedData.dateOfBirth), "yyyy-MM-dd")
          : profileData.dateOfBirth,
        gender: updatedData.gender || profileData.gender,
      });

      setSavedDetails({
        name: updatedData.name || profileData.name,
        phoneNumber: updatedData.phoneNumber || profileData.phoneNumber,
        dateOfBirth: updatedData.dateOfBirth
          ? format(new Date(updatedData.dateOfBirth), "yyyy-MM-dd")
          : profileData.dateOfBirth,
        gender: updatedData.gender || profileData.gender,
      });

      await fetchProfileDetails();
      setShowSaveModal(true);
      setIsEditing(false);
      setOriginalProfile(null);
      setValidationErrors({ gender: "" });
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setIsUpdatingProfile(false);
    }
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
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })).unwrap();
      toast.success("Password changed successfully!");
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message);
    }
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
    email: `mailto:?subject=${encodeURIComponent("Join with my referral link")}&body=${encodeURIComponent(`${shareText}\n\n${referralLink}`)}`,
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

  if (authLoading || isLoadingProfile) {
    return <Preloader message="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/80">
      <div className="container px-4 py-4 mx-auto sm:px-6 sm:py-8 lg:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header - Responsive */}
          <div className="relative mb-6 overflow-hidden bg-white rounded-2xl shadow-xl sm:mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/10 to-rose-500/5 rounded-full -mt-32 -mr-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-500/5 to-red-500/5 rounded-full -mb-32 -ml-32 blur-3xl" />
            
            <div className="relative p-5 sm:p-6 md:p-8">
              <div className="flex flex-col items-center gap-5 md:flex-row md:items-start">
                {/* Avatar - Mobile optimized */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-rose-600 blur-md opacity-60" />
                  <div className="relative flex items-center justify-center w-24 h-24 overflow-hidden rounded-full ring-4 ring-white shadow-xl bg-gradient-to-br from-red-100 to-red-200 sm:w-28 sm:h-28 md:w-32 md:h-32">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="object-cover w-full h-full" />
                    ) : (
                      <User className="w-12 h-12 text-gray-400 sm:w-14 sm:h-14" />
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 p-1.5 text-white transition-all rounded-full cursor-pointer shadow-lg bg-gradient-to-br from-red-500 to-rose-600 hover:scale-110 ring-2 ring-white sm:p-2">
                    <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>

                {/* User Info - Mobile center alignment */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-2 text-xs font-bold tracking-wider text-gray-700 uppercase bg-red-50 rounded-full border border-gray-100 sm:mb-3">
                    <Sparkles className="w-3 h-3" />
                    <span>Premium Member</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl">{user?.name}</h1>
                  <p className="mt-1 text-sm text-gray-500 break-all">{user?.email}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Member since {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "recently"}
                  </p>
                </div>

                {/* Stats - Mobile responsive */}
                <div className="px-4 py-2 text-center bg-white rounded-xl shadow-md border border-gray-100 sm:px-5 sm:py-3">
                  <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600 sm:text-2xl">
                    {orders.length}
                  </div>
                  <div className="text-xs font-medium text-gray-500">Orders</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-4 lg:gap-8">
            {/* Sidebar - Mobile: Hamburger menu + drawer */}
            <div className="lg:col-span-1">
              {/* Mobile menu button */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-white rounded-xl shadow-md border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    {tabs.find(t => t.id === activeTab)?.icon && (
                      <div className="p-1.5 rounded-lg bg-red-50">
                        {(() => {
                          const Icon = tabs.find(t => t.id === activeTab)?.icon;
                          return Icon ? <Icon className="w-5 h-5 text-red-600" /> : null;
                        })()}
                      </div>
                    )}
                    <span className="font-semibold text-gray-800">
                      {tabs.find(t => t.id === activeTab)?.label}
                    </span>
                  </div>
                  <Menu className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Desktop sidebar - always visible */}
              <div className="hidden lg:block sticky top-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-2">
                  <nav className="flex flex-col space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-300 ${
                            isActive
                              ? "bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg"
                              : "text-gray-600 hover:bg-red-50 hover:text-gray-700"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                          <span>{tab.label}</span>
                          {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Mobile drawer overlay */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                      onClick={() => setMobileMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -300, opacity: 0 }}
                      transition={{ type: "spring", damping: 25 }}
                      className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl lg:hidden rounded-r-2xl"
                    >
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold text-gray-800">Menu</h2>
                          <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-2 rounded-full hover:bg-gray-100"
                          >
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <nav className="p-3 space-y-1">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => handleTabChange(tab.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                                isActive
                                  ? "bg-gradient-to-r from-red-900 to-red-800 text-white"
                                  : "text-gray-600 hover:bg-red-50"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Main Content - Responsive padding */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Personal Information</h2>
                            <p className="mt-1 text-sm text-gray-500">Manage your personal details</p>
                          </div>
                          {!isEditing && (
                            <button
                              onClick={startEditing}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-900 to-red-800 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Profile
                            </button>
                          )}
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-5">
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Full Name</label>
                              <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => handleProfileChange("name", e.target.value)}
                                disabled={!isEditing || isUpdatingProfile}
                                className="w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900 disabled:bg-red-50 disabled:text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Email Address</label>
                              <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full px-4 py-2.5 text-gray-500 bg-red-50 border border-gray-200 rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Phone Number</label>
                              <input
                                type="tel"
                                value={profileData.phoneNumber}
                                onChange={(e) => handleProfileChange("phoneNumber", e.target.value)}
                                disabled={!isEditing || isUpdatingProfile}
                                className="w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900 disabled:bg-red-50 disabled:text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Date of Birth</label>
                              <input
                                type="date"
                                value={profileData.dateOfBirth}
                                onChange={(e) => handleProfileChange("dateOfBirth", e.target.value)}
                                disabled={!isEditing || isUpdatingProfile}
                                className="w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900 disabled:bg-red-50 disabled:text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Gender</label>
                              <select
                                value={profileData.gender}
                                onChange={(e) => handleProfileChange("gender", e.target.value)}
                                disabled={!isEditing || isUpdatingProfile}
                                className={`w-full px-4 py-2.5 text-gray-700 bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900 disabled:bg-red-50 disabled:text-gray-500 ${
                                  validationErrors.gender ? "border-red-500" : "border-gray-200"
                                }`}
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                              {validationErrors.gender && (
                                <p className="mt-1 text-xs text-red-500">{validationErrors.gender}</p>
                              )}
                            </div>
                          </div>

                          {isEditing && (
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={cancelEditing}
                                disabled={isUpdatingProfile}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isUpdatingProfile}
                                className="px-5 py-2.5 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-900 to-red-800 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                              >
                                {isUpdatingProfile ? "Saving..." : "Save Changes"}
                              </button>
                            </div>
                          )}
                        </form>

                        {/* Addresses Section - Mobile friendly */}
                        {addresses.length > 0 && (
                          <div className="pt-8 mt-8 border-t border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Saved Addresses</h3>
                            <div className="space-y-3">
                              {addresses.map((addr) => (
                                <div key={addr._id} className="p-4 transition-all bg-white border border-gray-200 rounded-xl">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                      <p className="font-semibold text-gray-800">
                                        {addr.fullName}
                                        <span className="mx-2 text-gray-300">•</span>
                                        <span className="text-xs font-medium text-gray-500 uppercase">
                                          {addr.type === "home" && "🏠 Home"}
                                          {addr.type === "work" && "💼 Work"}
                                          {addr.type === "other" && "📍 Other"}
                                        </span>
                                      </p>
                                      {addr.isDefault && (
                                        <span className="inline-block px-2 py-0.5 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-red-900 to-red-800 shadow-sm">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 break-words">
                                      {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                                      {addr.city}, {addr.state} - {addr.pincode}
                                    </p>
                                    <p className="text-sm text-gray-600">📞 {addr.phone}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === "orders" && (
                      <motion.div
                        key="orders"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">Recent Orders</h2>
                        {orders.length > 0 ? (
                          <div className="space-y-4">
                            {orders.map((order) => (
                              <div key={order._id} className="p-4 sm:p-5 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                  <span className="font-bold text-gray-800 text-sm sm:text-base">Order #{order.orderNumber}</span>
                                  <span className="text-xs sm:text-sm text-gray-500">
                                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <span className="text-sm text-gray-600">{order.items?.length || 0} items</span>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-lg font-bold text-gray-800">₹{order.pricing?.total || 0}</span>
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                        order.status === "delivered"
                                          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                          : order.status === "shipped"
                                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                      }`}
                                    >
                                      {order.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100 sm:w-20 sm:h-20">
                              <Package className="w-8 h-8 text-gray-400 sm:w-10 sm:h-10" />
                            </div>
                            <p className="text-gray-500">No orders yet</p>
                            <p className="mt-1 text-sm text-gray-400">Start shopping to see your orders here</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === "security" && (
                      <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">Security Settings</h2>
                        <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <div>
                              <h3 className="font-bold text-gray-800">Password</h3>
                              <p className="mt-0.5 text-sm text-gray-500">Update your password to keep your account secure</p>
                            </div>
                            <button
                              onClick={() => setShowPasswordForm(!showPasswordForm)}
                              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
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
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Current Password</label>
                                <input
                                  type="password"
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                  className="w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">New Password</label>
                                <input
                                  type="password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                  className="w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Confirm New Password</label>
                                <input
                                  type="password"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                  className="w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:border-gray-900"
                                  required
                                />
                              </div>
                              <button
                                type="submit"
                                className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-900 to-red-800 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                              >
                                Update Password
                              </button>
                            </form>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* REFERRAL TAB - Mobile responsive */}
                    {activeTab === "referral" && (
                      <motion.div
                        key="referral"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-red-900 to-red-800 shadow-lg">
                            <UserPlus className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Referral</h2>
                            <p className="text-sm text-gray-500">Invite friends and earn rewards</p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="relative p-5 overflow-hidden bg-gradient-to-br from-red-700 to-red-800 rounded-2xl shadow-xl">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mt-16 -mr-16 blur-2xl" />
                              <p className="relative text-sm font-medium text-gray-200">Total Referrals</p>
                              <p className="relative mt-2 text-3xl font-bold text-white">{referralData?.numberOfReferrals || 0}</p>
                            </div>
                            <div className="relative p-5 overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-lg">
                              <p className="text-sm font-medium text-gray-500">Referral Earnings</p>
                              <p className="mt-2 text-3xl font-bold text-gray-900">₹{Math.round(totalEarning)}</p>
                            </div>
                          </div>
                          
                          <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-lg">
                            <h3 className="mb-3 text-base sm:text-lg font-bold text-gray-800">Share Referral Link</h3>
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={referralLink}
                                  className="flex-1 px-3 py-2.5 text-sm text-gray-700 bg-red-50 border border-gray-200 rounded-xl focus:outline-none"
                                />
                                <button
                                  onClick={copyToClipboard}
                                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-red-700 to-red-800 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy Link
                                </button>
                              </div>
                              <p className="text-sm text-gray-600">
                                Referral Code:
                                <span className="ml-2 px-2 py-0.5 text-xs font-bold tracking-wider text-gray-700 uppercase bg-red-100 rounded-lg">{user?.myreferralCode || "N/A"}</span>
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-5 sm:grid-cols-3 lg:grid-cols-6">
                              <a href={shareUrls.whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm"><MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>WhatsApp</span></a>
                              <a href={shareUrls.email} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm"><Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Email</span></a>
                              <a href={shareUrls.facebook} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm"><Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Facebook</span></a>
                              <a href={shareUrls.twitter} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm"><Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Twitter</span></a>
                              <a href={shareUrls.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm"><Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>LinkedIn</span></a>
                              <a href={shareUrls.telegram} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-red-50 hover:shadow-md sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm"><Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Telegram</span></a>
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

      {/* Save Confirmation Modal - Mobile responsive */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden mx-4"
            >
              <div className="absolute top-0 right-0 pt-3 pr-3 sm:pt-4 sm:pr-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 pt-8 sm:p-6 sm:pt-8">
                <h3 className="text-lg sm:text-xl font-bold text-center text-gray-800">Profile Updated!</h3>
                <p className="mt-2 text-sm text-center text-gray-500">Your details have been saved successfully.</p>

                <div className="mt-5 space-y-2.5 bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="text-gray-800 break-all">{savedDetails.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
                    <span className="font-medium text-gray-600">Phone:</span>
                    <span className="text-gray-800">{savedDetails.phoneNumber || "—"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
                    <span className="font-medium text-gray-600">Date of Birth:</span>
                    <span className="text-gray-800">{savedDetails.dateOfBirth || "—"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
                    <span className="font-medium text-gray-600">Gender:</span>
                    <span className="text-gray-800 capitalize">{savedDetails.gender || "—"}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowSaveModal(false)}
                  className="w-full mt-5 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-900 to-red-800 rounded-xl hover:shadow-lg transition"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;