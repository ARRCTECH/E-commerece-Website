"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
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

  // Tab state
  const [activeTab, setActiveTab] = useState("profile");

  // Profile edit mode
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

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Address management
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

  // Prefill profile data when user loads
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

  // Fetch orders & wishlist on mount
  useEffect(() => {
    dispatch(fetchUserOrders({ limit: 5 }));
    dispatch(fetchWishlist());
    dispatch(getProfile());
  }, [dispatch]);

  // ----- Profile Update -----
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

  // ----- Avatar Upload -----
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
      e.target.value = ""; // allow re-upload of same file
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----- Password Change -----
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

  // ----- Address Helpers -----
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

  // ----- Referral ----
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

  // ----- Tabs -----
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
    <div className="min-h-screen bg-gray-50">
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="p-6 mb-8 bg-white rounded-lg shadow-sm">
            <div className="flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="flex items-center justify-center w-24 h-24 overflow-hidden bg-red-100 rounded-full">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="object-cover w-full h-full" />
                  ) : (
                    <User className="w-12 h-12 text-red-600" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 text-white transition-colors bg-red-600 rounded-full cursor-pointer hover:bg-red-700">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              {/* User Info */}
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-800">{user?.name}</h1>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500">
                  Member since{" "}
                  {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "recently"}
                </p>
              </div>
              {/* Stats */}
              <div className="flex ml-auto space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{orders.length}</div>
                  <div className="text-sm text-gray-600">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{wishlistItems.length}</div>
                  <div className="text-sm text-gray-600">Wishlist</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? "bg-red-50 text-red-600 border-r-2 border-red-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <AnimatePresence mode="wait">
                  {/* PROFILE TAB */}
                  {activeTab === "profile" && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                        {!isEditing && (
                          <button
                            onClick={startEditing}
                            className="px-4 py-2 text-red-600 transition-colors border border-red-600 rounded-lg hover:bg-red-50"
                          >
                            Edit Profile
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
                            <input
                              type="text"
                              value={profileData.name}
                              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
                            <input
                              type="email"
                              value={profileData.email}
                              disabled
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Phone</label>
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Date of Birth</label>
                            <input
                              type="date"
                              value={profileData.dateOfBirth}
                              onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Gender</label>
                            <select
                              value={profileData.gender}
                              onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
                            >
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-4 py-2 text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                            >
                              Save Changes
                            </button>
                          </div>
                        )}
                      </form>

                      {/* Addresses Section */}
                      <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Saved Addresses</h3>
                          {!showAddressForm && (
                            <button
                              onClick={() => setShowAddressForm(true)}
                              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                            >
                              <Plus className="w-4 h-4" /> Add Address
                            </button>
                          )}
                        </div>

                        {showAddressForm && (
                          <div className="p-4 mb-4 border border-gray-200 rounded-lg">
                            <h4 className="mb-3 font-medium">{editingAddress ? "Edit Address" : "New Address"}</h4>
                            <form onSubmit={handleAddOrUpdateAddress} className="space-y-3">
                              <div className="grid gap-3 md:grid-cols-2">
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  value={newAddress.fullName}
                                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                                  className="px-3 py-2 border rounded-lg"
                                  required
                                />
                                <input
                                  type="tel"
                                  placeholder="Phone"
                                  value={newAddress.phone}
                                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                  className="px-3 py-2 border rounded-lg"
                                  required
                                />
                                <input
                                  type="text"
                                  placeholder="Address Line 1"
                                  value={newAddress.addressLine1}
                                  onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                  className="px-3 py-2 border rounded-lg"
                                  required
                                />
                                <input
                                  type="text"
                                  placeholder="Address Line 2"
                                  value={newAddress.addressLine2}
                                  onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                                  className="px-3 py-2 border rounded-lg"
                                />
                                <input
                                  type="text"
                                  placeholder="City"
                                  value={newAddress.city}
                                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                  className="px-3 py-2 border rounded-lg"
                                  required
                                />
                                <input
                                  type="text"
                                  placeholder="State"
                                  value={newAddress.state}
                                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                  className="px-3 py-2 border rounded-lg"
                                  required
                                />
                                <input
                                  type="text"
                                  placeholder="Pincode"
                                  value={newAddress.pincode}
                                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                  className="px-3 py-2 border rounded-lg"
                                  required
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="isDefault"
                                  checked={newAddress.isDefault}
                                  onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                />
                                <label htmlFor="isDefault" className="text-sm">
                                  Set as default address
                                </label>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={resetAddressForm}
                                  className="px-3 py-1 text-sm text-gray-600 border rounded-lg"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={isAddressSaving}
                                  className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg disabled:opacity-50"
                                >
                                  {isAddressSaving ? "Saving..." : editingAddress ? "Update" : "Save"} Address
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        <div className="space-y-3">
                          {profileData.addresses.map((addr) => (
                            <div key={addr._id} className="p-3 border rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">
                                    {addr.fullName} • {addr.type}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                                    {addr.city}, {addr.state} - {addr.pincode}
                                  </p>
                                  <p className="text-sm text-gray-600">Phone: {addr.phone}</p>
                                  {addr.isDefault && (
                                    <span className="inline-block px-2 py-0.5 mt-1 text-xs text-green-700 bg-green-100 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => startEditAddress(addr)} className="text-blue-600">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteAddress(addr._id)} className="text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {profileData.addresses.length === 0 && (
                            <p className="text-sm text-gray-500">No addresses saved.</p>
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
                    >
                      <h2 className="mb-6 text-xl font-semibold text-gray-800">Recent Orders</h2>
                      {orders.length > 0 ? (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <div key={order._id} className="p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Order #{order.orderNumber}</span>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(order.createdAt), "MMM dd, yyyy")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">{order.items?.length || 0} items</span>
                                <div className="flex items-center space-x-4">
                                  <span className="font-semibold">₹{order.pricing?.total || 0}</span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      order.status === "delivered"
                                        ? "bg-green-100 text-green-800"
                                        : order.status === "shipped"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
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
                        <div className="py-8 text-center">
                          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-600">No orders yet</p>
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
                    >
                      <h2 className="mb-6 text-xl font-semibold text-gray-800">My Wishlist</h2>
                      {wishlistItems.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {wishlistItems.map((item) => (
                            <div key={item._id} className="p-4 border border-gray-200 rounded-lg">
                              <div className="mb-3">
                                <img
                                  src={item.product?.images?.[0] || "/placeholder.svg"}
                                  alt={item.product?.name}
                                  className="object-cover w-full h-48 rounded-lg"
                                />
                              </div>
                              <div className="space-y-2">
                                <h3 className="font-medium text-gray-800">{item.product?.name}</h3>
                                <p className="text-sm text-gray-600">{item.product?.category?.name}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-red-600">₹{item.product?.price}</span>
                                  <span className="text-xs text-gray-500">
                                    Added {format(new Date(item.createdAt), "MMM dd, yyyy")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-600">Your wishlist is empty</p>
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
                    >
                      <h2 className="mb-6 text-xl font-semibold text-gray-800">Security Settings</h2>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-gray-800">Password</h3>
                            <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                          </div>
                          <button
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="font-medium text-red-600 hover:text-red-700"
                          >
                            {showPasswordForm ? "Cancel" : "Change"}
                          </button>
                        </div>
                        {showPasswordForm && (
                          <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-700">Current Password</label>
                              <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                required
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-700">New Password</label>
                              <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                required
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-700">Confirm New Password</label>
                              <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                required
                              />
                            </div>
                            <button
                              type="submit"
                              className="px-6 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                            >
                              Update Password
                            </button>
                          </form>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* REFERRAL TAB - Styled in Red */}
                  {activeTab === "referral" && (
                    <motion.div
                      key="referral"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <UserPlus className="w-6 h-6 text-red-600" />
                        <h2 className="text-xl font-semibold text-gray-800">My Referral</h2>
                      </div>

                      <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="p-5 border border-red-200 rounded-xl bg-white shadow-sm">
                            <p className="text-sm text-gray-500">Total Referrals</p>
                            <h3 className="mt-2 text-3xl font-bold text-red-700">{user?.totalReferrals || 0}</h3>
                          </div>
                          <div className="p-5 border border-red-200 rounded-xl bg-white shadow-sm">
                            <p className="text-sm text-gray-500">Referral Earnings</p>
                            <h3 className="mt-2 text-3xl font-bold text-red-600">₹{user?.referralEarnings || 0}</h3>
                          </div>
                        </div>

                        {/* Referral Link */}
                        <div className="p-5 border border-red-200 rounded-xl bg-white shadow-sm">
                          <h3 className="mb-3 text-lg font-semibold text-gray-800">Share Referral Link</h3>
                          <div className="flex flex-col gap-3 md:flex-row">
                            <input
                              type="text"
                              readOnly
                              value={referralLink}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                            />
                            <button
                              onClick={copyToClipboard}
                              className="flex items-center justify-center gap-2 px-5 py-3 text-white transition bg-red-600 rounded-lg hover:bg-red-700"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                          </div>

                          <p className="mt-3 text-sm text-gray-500">
                            Referral Code:
                            <span className="ml-2 font-semibold text-red-600">{user?.myreferralCode || "N/A"}</span>
                          </p>

                          {/* Social Share Buttons */}
                          <div className="grid grid-cols-2 gap-3 mt-6 md:grid-cols-3 lg:grid-cols-6">
                            <a
                              href={shareUrls.whatsapp}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 px-4 py-3 transition border border-red-200 rounded-lg hover:bg-red-50"
                            >
                              <MessageCircle className="w-5 h-5 text-red-600" />
                              <span className="text-red-700">WhatsApp</span>
                            </a>
                            <a
                              href={shareUrls.email}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 px-4 py-3 transition border border-red-200 rounded-lg hover:bg-red-50"
                            >
                              <Mail className="w-5 h-5 text-red-600" />
                              <span className="text-red-700">Email</span>
                            </a>
                            <a
                              href={shareUrls.facebook}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 px-4 py-3 transition border border-red-200 rounded-lg hover:bg-red-50"
                            >
                              <Facebook className="w-5 h-5 text-red-600" />
                              <span className="text-red-700">Facebook</span>
                            </a>
                            <a
                              href={shareUrls.twitter}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 px-4 py-3 transition border border-red-200 rounded-lg hover:bg-red-50"
                            >
                              <Twitter className="w-5 h-5 text-red-600" />
                              <span className="text-red-700">Twitter</span>
                            </a>
                            <a
                              href={shareUrls.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 px-4 py-3 transition border border-red-200 rounded-lg hover:bg-red-50"
                            >
                              <Linkedin className="w-5 h-5 text-red-600" />
                              <span className="text-red-700">LinkedIn</span>
                            </a>
                            <a
                              href={shareUrls.telegram}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 px-4 py-3 transition border border-red-200 rounded-lg hover:bg-red-50"
                            >
                              <Send className="w-5 h-5 text-red-600" />
                              <span className="text-red-700">Telegram</span>
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
  );
};

export default ProfilePage;