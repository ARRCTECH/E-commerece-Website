"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { updateProfile, changePassword, uploadAvatar, getProfile } from "../store/slices/authSlice";
import { fetchUserOrders } from "../store/slices/orderSlice";
import { fetchWishlist } from "../store/slices/wishlistSlice";
import toast from "react-hot-toast";
import { format } from "date-fns";
import Preloader from "../components/Preloader";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  const { orders = [] } = useSelector((state) => state.orders);
  const { items: wishlistItems = [] } = useSelector((state) => state.wishlist);

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);
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
const [dataforreferral,setDataforreferral] = useState(null);
const [totalEarning,setTotalEarning] = useState(0);

const getTotalEarning= async ()=>{
  try{
    const res=await axios.post(`${import.meta.env.VITE_API_URL}/referral-total-earning`,{userId:user._id}); 
    setTotalEarning(res.data.data.totalEarning); 
  }catch(error){
    console.error("Error calculating total earning:", error);
  }
}
console.log(totalEarning)

  const getReferralDetails = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/referral/fetchReferral`,
         { userId : user._id },   
      );
      setDataforreferral(res.data.data);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
    }
  };
  useEffect(() => {
    getReferralDetails();
    getTotalEarning();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id]);
  useEffect(() => {
    dispatch(fetchUserOrders({ limit: 5 }));
    dispatch(fetchWishlist());
    dispatch(getProfile());
  }, [dispatch]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setOriginalProfile(null);
    } catch (error) {
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copied to clipboard!");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "orders", label: "Orders", icon: Package },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "security", label: "Security", icon: Shield },
    { id: "referral", label: "Referral", icon: UserPlus },
  ];

  if (isLoading) {
    return <Preloader message="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="container px-4 py-6 mx-auto sm:px-6 sm:py-10 lg:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Premium Profile Header */}
          <div className="relative mb-8 overflow-hidden bg-white rounded-2xl shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-red-500/10 to-rose-500/5 rounded-full -mt-40 -mr-40 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-500/5 to-red-500/5 rounded-full -mb-40 -ml-40 blur-3xl" />

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                {/* Avatar */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-rose-600 blur-md opacity-60" />
                  <div className="relative flex items-center justify-center w-28 h-28 overflow-hidden rounded-full ring-4 ring-white shadow-xl bg-gradient-to-br from-gray-100 to-gray-200 sm:w-32 sm:h-32">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="object-cover w-full h-full" />
                    ) : (
                      <User className="w-14 h-14 text-gray-400 sm:w-16 sm:h-16" />
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 p-2 text-white transition-all rounded-full cursor-pointer shadow-lg bg-gradient-to-br from-red-500 to-rose-600 hover:scale-110 ring-2 ring-white">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-bold tracking-wider text-red-700 uppercase bg-red-50 rounded-full border border-red-100">
                    <Sparkles className="w-3 h-3" />
                    Premium Member
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{user?.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Member since {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "recently"}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-3">
                  <div className="px-5 py-3 text-center bg-white rounded-xl shadow-md border border-gray-100">
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">{orders.length}</div>
                    <div className="text-xs font-medium text-gray-500">Orders</div>
                  </div>
                  <div className="px-5 py-3 text-center bg-white rounded-xl shadow-md border border-gray-100">
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">{wishlistItems.length}</div>
                    <div className="text-xs font-medium text-gray-500">Wishlist</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-4 lg:gap-8">
            {/* Premium Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-2">
                  <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:space-y-1 lg:overflow-visible scrollbar-hide">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-300 ${isActive
                            ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 sm:p-8">
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
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                            <p className="mt-1 text-sm text-gray-500">Manage your personal details</p>
                          </div>
                          {!isEditing && (
                            <button
                              onClick={startEditing}
                              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Profile
                            </button>
                          )}
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                          <div className="grid gap-5 md:grid-cols-2">
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Full Name</label>
                              <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Email Address</label>
                              <input
                                type="email"
                                value={profileData.email}
                                disabled
                                className="w-full px-4 py-2.5 text-gray-500 bg-gray-50 border border-gray-200 rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Phone Number</label>
                              <input
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Date of Birth</label>
                              <input
                                type="date"
                                value={profileData.dateOfBirth}
                                onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-gray-700">Gender</label>
                              <select
                                value={profileData.gender}
                                onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>

                          {isEditing && (
                            <div className="flex flex-col-reverse justify-end gap-3 pt-5 border-t border-gray-100 sm:flex-row">
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2.5 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                              >
                                Save Changes
                              </button>
                            </div>
                          )}
                        </form>

                        {/* Addresses Section */}
                        <div className="pt-8 mt-10 border-t border-gray-100">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">Saved Addresses</h3>
                              <p className="text-sm text-gray-500">Manage your shipping locations</p>
                            </div>
                            {!showAddressForm && (
                              <button
                                onClick={() => setShowAddressForm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 shadow-md hover:shadow-lg hover:scale-[1.02]"
                              >
                                <Plus className="w-4 h-4" /> Add Address
                              </button>
                            )}
                          </div>

                          {showAddressForm && (
                            <div className="p-5 mb-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                              <h4 className="mb-4 font-semibold text-gray-900">{editingAddress ? "Edit Address" : "New Address"}</h4>
                              <form onSubmit={handleAddOrUpdateAddress} className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={newAddress.fullName}
                                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                                    className="px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={newAddress.phone}
                                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                    className="px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="Address Line 1"
                                    value={newAddress.addressLine1}
                                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                    className="px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="Address Line 2 (Optional)"
                                    value={newAddress.addressLine2}
                                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                                    className="px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                  />
                                  <input
                                    type="text"
                                    placeholder="City"
                                    value={newAddress.city}
                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                    className="px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="State"
                                    value={newAddress.state}
                                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                    className="px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="Pincode"
                                    value={newAddress.pincode}
                                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                    className="px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                    required
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={newAddress.isDefault}
                                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                  />
                                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                                    Set as default address
                                  </label>
                                </div>
                                <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                                  <button
                                    type="button"
                                    onClick={resetAddressForm}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isAddressSaving}
                                    className="px-4 py-2 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isAddressSaving ? "Saving..." : editingAddress ? "Update" : "Save"} Address
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}

                          <div className="space-y-3">
                            {profileData.addresses.map((addr) => (
                              <div key={addr._id} className="p-4 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900">
                                      {addr.fullName}
                                      <span className="mx-2 text-gray-300">•</span>
                                      <span className="text-xs font-medium text-gray-500 uppercase">{addr.type}</span>
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">
                                      {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                                      {addr.city}, {addr.state} - {addr.pincode}
                                    </p>
                                    <p className="mt-0.5 text-sm text-gray-600">📞 {addr.phone}</p>
                                    {addr.isDefault && (
                                      <span className="inline-block px-2.5 py-0.5 mt-2 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-sm">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                    <button onClick={() => startEditAddress(addr)} className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-900">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteAddress(addr._id)} className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-red-50 hover:text-red-600">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {profileData.addresses.length === 0 && (
                              <p className="py-6 text-sm text-center text-gray-500">No addresses saved yet.</p>
                            )}
                          </div>
                        </div>
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Orders</h2>
                        {orders.length > 0 ? (
                          <div className="space-y-4">
                            {orders.map((order) => (
                              <div key={order._id} className="p-5 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                  <span className="font-bold text-gray-900">Order #{order.orderNumber}</span>
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <span className="text-sm text-gray-600">{order.items?.length || 0} items</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-gray-900">₹{order.pricing?.total || 0}</span>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${order.status === "delivered"
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
                          <div className="py-16 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gray-100">
                              <Package className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-500">No orders yet</p>
                            <p className="mt-1 text-sm text-gray-400">Start shopping to see your orders here</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* WISHLIST TAB */}
                    {activeTab === "wishlist" && (
                      <motion.div
                        key="wishlist"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>
                        {wishlistItems.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {wishlistItems.map((item) => (
                              <div key={item._id} className="overflow-hidden transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md group">
                                <div className="overflow-hidden h-44">
                                  <img
                                    src={item.product?.images?.[0] || "/placeholder.svg"}
                                    alt={item.product?.name}
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                  />
                                </div>
                                <div className="p-4 space-y-2">
                                  <h3 className="font-semibold text-gray-900 line-clamp-1">{item.product?.name}</h3>
                                  <p className="text-xs font-medium text-gray-500 uppercase">{item.product?.category?.name}</p>
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-lg font-bold text-gray-900">₹{item.product?.price}</span>
                                    <span className="text-xs text-gray-400">
                                      {format(new Date(item.createdAt), "MMM dd")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-16 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gray-100">
                              <Heart className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-500">Your wishlist is empty</p>
                            <p className="mt-1 text-sm text-gray-400">Save your favorite items here</p>
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
                        <div className="p-6 bg-white border border-gray-200 rounded-xl">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                              <h3 className="font-bold text-gray-900">Password</h3>
                              <p className="mt-0.5 text-sm text-gray-500">Update your password to keep your account secure</p>
                            </div>
                            <button
                              onClick={() => setShowPasswordForm(!showPasswordForm)}
                              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${showPasswordForm
                                ? "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                                : "text-white bg-gradient-to-r from-gray-900 to-gray-800 shadow-md hover:shadow-lg hover:scale-[1.02]"
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
                                  className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">New Password</label>
                                <input
                                  type="password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                  className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Confirm New Password</label>
                                <input
                                  type="password"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                  className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                                  required
                                />
                              </div>
                              <button
                                type="submit"
                                className="px-6 py-2.5 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                              >
                                Update Password
                              </button>
                            </form>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* REFERRAL TAB */}
                    {activeTab === "referral" && (
                      <motion.div
                        key="referral"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg">
                            <UserPlus className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">My Referral</h2>
                            <p className="text-sm text-gray-500">Invite friends and earn rewards</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {/* Stats Cards */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="relative p-6 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mt-16 -mr-16 blur-2xl" />
                              <p className="relative text-sm font-medium text-gray-300">Total Referrals</p>
                              <p className="relative mt-2 text-4xl font-bold text-white">{dataforreferral?.numberOfReferrals || 0}</p>
                            </div>
                            <div className="relative p-6 overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-lg">
                              <p className="text-sm font-medium text-gray-500">Referral Earnings</p>
                              <p className="mt-2 text-4xl font-bold text-gray-900">₹{totalEarning}</p>
                            </div>
                          </div>

                          {/* Referral Link Card */}
                          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-lg">
                            <h3 className="mb-4 text-lg font-bold text-gray-900">Share Referral Link</h3>
                            <div className="flex flex-col gap-3 md:flex-row">
                              <input
                                type="text"
                                readOnly
                                value={referralLink}
                                className="flex-1 px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                              />
                              <button
                                onClick={copyToClipboard}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <Copy className="w-4 h-4" />
                                Copy Link
                              </button>
                            </div>
                            <p className="mt-4 text-sm text-gray-600">
                              Referral Code:
                              <span className="ml-2 px-3 py-1 text-xs font-bold tracking-wider text-gray-700 uppercase bg-gray-100 rounded-lg">{user?.myreferralCode || "N/A"}</span>
                            </p>

                            {/* Social Share Grid */}
                            <div className="grid grid-cols-2 gap-3 mt-6 sm:grid-cols-3 lg:grid-cols-6">
                              <a
                                href={shareUrls.whatsapp}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>WhatsApp</span>
                              </a>
                              <a
                                href={shareUrls.email}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                              >
                                <Mail className="w-4 h-4" />
                                <span>Email</span>
                              </a>
                              <a
                                href={shareUrls.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                              >
                                <Facebook className="w-4 h-4" />
                                <span>Facebook</span>
                              </a>
                              <a
                                href={shareUrls.twitter}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                              >
                                <Twitter className="w-4 h-4" />
                                <span>Twitter</span>
                              </a>
                              <a
                                href={shareUrls.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                              >
                                <Linkedin className="w-4 h-4" />
                                <span>LinkedIn</span>
                              </a>
                              <a
                                href={shareUrls.telegram}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                              >
                                <Send className="w-4 h-4" />
                                <span>Telegram</span>
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