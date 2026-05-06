"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { fetchAllCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../store/slices/adminSlice";
import LoadingSpinner from "../LoadingSpinner";
import adminAPI from "../../store/api/adminApi"

const CouponsManagement = () => {
  const dispatch = useDispatch();
  const { coupons, couponsPagination, couponsLoading } = useSelector((state) => state.admin);
  const [showFreeCouponModal, setShowFreeCouponModal] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    isActive: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [categoriesdetails, setCategoriesdetails] = useState("");
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Regular coupon form data
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    maxDiscountAmount: "",
    maxUses: "",
    maxUsesPerUser: "1",
    validUntil: "",
    isActive: true,
    isFreeCoupon: "N",
    couponcategories: "",
  });
  // Free coupon form data - now editable but with constraints
  const [freeCouponFormData, setFreeCouponFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "100",
    minOrderValue: "0",
    maxDiscountAmount: "",
    maxUses: "1",
    maxUsesPerUser: "1",
    validUntil: "",
    isActive: true,
    isFreeCoupon: "Y",
  });
  // Check if free coupon already exists
  const freeCouponExists = coupons.some(coupon => coupon.isFreeCoupon === "Y");
  useEffect(() => {
    dispatch(fetchAllCoupons(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };
  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minOrderValue: "",
      maxDiscountAmount: "",
      maxUses: "",
      maxUsesPerUser: "1",
      validUntil: "",
      isActive: true,
      isFreeCoupon: "N",
      couponcategories: "",
    });
    setShowModal(true);
  };
  const handleEditCoupon = (coupon) => {
    console.log("Editing coupon:", coupon);
    setEditingCoupon(coupon);
    if (coupon.isFreeCoupon === "Y") {
      // For free coupons, use the free coupon form
      setFreeCouponFormData({
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue?.toString() || "100",
        minOrderValue: coupon.minOrderValue?.toString() || "0",
        maxDiscountAmount: coupon.maxDiscountAmount?.toString() || "",
        maxUses: coupon.maxUses?.toString() || "1",
        maxUsesPerUser: coupon.maxUsesPerUser?.toString() || "1",
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split("T")[0] : "",
        isActive: coupon.isActive,
        isFreeCoupon: "Y",
      });
      setShowFreeCouponModal(true);
    } else {
      // For regular coupons, use the regular form
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue?.toString() || "",
        minOrderValue: coupon.minOrderValue?.toString() || "0",
        maxDiscountAmount: coupon.maxDiscountAmount?.toString() || "",
        maxUses: coupon.maxUses?.toString() || "",
        maxUsesPerUser: coupon.maxUsesPerUser?.toString() || "1",
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split("T")[0] : "",
        isActive: coupon.isActive,
        isFreeCoupon: coupon.isFreeCoupon || "N",
        couponcategories: coupon.couponcategories,
      });
      setShowModal(true);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await dispatch(deleteCoupon(couponId));
        dispatch(fetchAllCoupons(filters)); // Refresh list
      } catch (error) {
        console.error("Error deleting coupon:", error);
      }
    }
  };
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await adminAPI.getAllCategories();
        setCategoriesdetails(response.data.categories)
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const couponData = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
        maxUsesPerUser: Number(formData.maxUsesPerUser),
        isFreeCoupon: formData.isFreeCoupon,
        couponcategories: formData.couponcategories,
      };

      if (editingCoupon) {
        await dispatch(updateCoupon({ couponId: editingCoupon._id, couponData }));
      } else {
        await dispatch(createCoupon(couponData));
      }
      setShowModal(false);
      dispatch(fetchAllCoupons(filters)); // Refresh list
    } catch (error) {
      console.error("Error submitting coupon:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreeCoupon = () => {
    if (freeCouponExists) {
      alert("A free coupon already exists. You can only have one free coupon at a time.");
      return;
    }
    // Set default validity to 30 days from now
    const defaultValidUntil = new Date();
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
    // Generate random free coupon code
    const randomCode = "FREE" + Math.floor(1000 + Math.random() * 9000);
    setFreeCouponFormData(prev => ({
      ...prev,
      code: randomCode,
      description: "Free Order Coupon",
      discountType: "percentage",
      discountValue: "100",
      minOrderValue: "0",
      maxUses: "1",
      maxUsesPerUser: "1",
      validUntil: defaultValidUntil.toISOString().split("T")[0],
    }));
    setShowFreeCouponModal(true);
  };

  const handleFreeCouponSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const freeCouponData = {
        ...freeCouponFormData,
        discountValue: Number(freeCouponFormData.discountValue),
        minOrderValue: Number(freeCouponFormData.minOrderValue) || 0,
        maxDiscountAmount: freeCouponFormData.maxDiscountAmount ? Number(freeCouponFormData.maxDiscountAmount) : undefined,
        maxUses: Number(freeCouponFormData.maxUses),
        maxUsesPerUser: Number(freeCouponFormData.maxUsesPerUser),
        isFreeCoupon: "Y",
      };

      if (editingCoupon) {
        await dispatch(updateCoupon({ couponId: editingCoupon._id, couponData: freeCouponData }));
      } else {
        await dispatch(createCoupon(freeCouponData));
      }

      setShowFreeCouponModal(false);

      // Reset form
      setFreeCouponFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: "100",
        minOrderValue: "0",
        maxDiscountAmount: "",
        maxUses: "1",
        maxUsesPerUser: "1",
        validUntil: "",
        isActive: true,
        isFreeCoupon: "Y",
      });

      dispatch(fetchAllCoupons(filters)); // Refresh list
      alert(editingCoupon ? "Free coupon updated successfully!" : "Free coupon created successfully!");
    } catch (error) {
      console.error("Failed to create free coupon:", error);
      alert(`Failed to ${editingCoupon ? 'update' : 'create'} free coupon. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle free coupon form changes
  const handleFreeCouponChange = (field, value) => {
    setFreeCouponFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹0";
    return `₹${amount.toLocaleString()}`;
  };

  if (couponsLoading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="p-2 space-y-3 sm:p-4 sm:space-y-4">
      {/* Header Section */}
      <div className="p-3 bg-white rounded-lg shadow">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Coupons Management</h1>
            <p className="text-sm text-gray-600">Create and manage discount coupons</p>
          </div>
          <div className="w-full sm:w-auto">
            <label className="block mb-1 text-xs font-medium text-gray-700">Status Filter</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange("isActive", e.target.value)}
              className="block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:w-40"
            >
              <option value="">All Coupons</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 bg-white rounded-lg shadow">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleFreeCoupon}
            disabled={freeCouponExists && !editingCoupon}
            className={`inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none ${freeCouponExists && !editingCoupon
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
              }`}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {freeCouponExists && !editingCoupon ? 'Free Coupon Exists' : 'Create Free Coupon'}
          </button>
          <button
            onClick={handleAddCoupon}
            className="inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex-1 sm:flex-none"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Regular Coupon
          </button>
        </div>
        {freeCouponExists && !editingCoupon && (
          <p className="mt-2 text-xs text-green-600">
            A free coupon already exists. You can only have one free coupon at a time.
          </p>
        )}
      </div>

      {/* Coupons Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        {coupons.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">No coupons found</div>
            <button
              onClick={handleAddCoupon}
              className="mt-2 inline-flex items-center px-4 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Create Your First Coupon
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden">
              <div className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <div key={coupon._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="text-base font-semibold text-gray-900 truncate">{coupon.code}</div>
                          {coupon.isFreeCoupon === "Y" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shrink-0">
                              Free
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 line-clamp-2">{coupon.description}</div>
                      </div>
                      <div className="flex space-x-1 ml-2 shrink-0">
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="p-2 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                          title="Edit coupon"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon._id)}
                          className="p-2 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete coupon"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Discount:</span>
                        <div className="font-semibold text-gray-900">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : formatCurrency(coupon.discountValue)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Min Order:</span>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(coupon.minOrderValue)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Usage:</span>
                        <div className="font-semibold text-gray-900">
                          {coupon.usedCount || 0} / {coupon.maxUses || "∞"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Per User:</span>
                        <div className="font-semibold text-gray-900">
                          {coupon.maxUsesPerUser || 1}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Valid until</span>
                        <span className="text-sm font-medium">{formatDate(coupon.validUntil)}</span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${coupon.isActive && new Date(coupon.validUntil) > new Date()
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {coupon.isActive && new Date(coupon.validUntil) > new Date() ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">
                        Coupon Details
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">
                        Discount
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">
                        Usage Limits
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">
                        Validity
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 sm:px-6">
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-semibold text-gray-900">{coupon.code}</div>
                              {coupon.isFreeCoupon === "Y" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Free
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">{coupon.description}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="text-sm font-semibold text-gray-900">
                            {coupon.discountType === "percentage"
                              ? `${coupon.discountValue}%`
                              : formatCurrency(coupon.discountValue)}
                          </div>
                          <div className="text-sm text-gray-500">Min: {formatCurrency(coupon.minOrderValue)}</div>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="text-sm text-gray-900">
                            Total: {coupon.usedCount || 0} / {coupon.maxUses || "∞"}
                          </div>
                          <div className="text-sm text-gray-500">Per user: {coupon.maxUsesPerUser || 1}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 sm:px-6">
                          {formatDate(coupon.validUntil)}
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.isActive && new Date(coupon.validUntil) > new Date()
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {coupon.isActive && new Date(coupon.validUntil) > new Date() ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditCoupon(coupon)}
                              className="p-2 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                              title="Edit coupon"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon._id)}
                              className="p-2 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete coupon"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {couponsPagination && couponsPagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div className="flex justify-between flex-1 sm:hidden">
              <button
                onClick={() => handlePageChange(couponsPagination.currentPage - 1)}
                disabled={!couponsPagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(couponsPagination.currentPage + 1)}
                disabled={!couponsPagination.hasNext}
                className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(couponsPagination.currentPage - 1) * filters.limit + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(couponsPagination.currentPage * filters.limit, couponsPagination.totalCoupons)}
                  </span>{" "}
                  of <span className="font-medium">{couponsPagination.totalCoupons}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                  <button
                    onClick={() => handlePageChange(couponsPagination.currentPage - 1)}
                    disabled={!couponsPagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(couponsPagination.currentPage + 1)}
                    disabled={!couponsPagination.hasNext}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Regular Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-gray-500 bg-opacity-75 sm:p-4">
          <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900 sm:text-xl">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 text-gray-400 rounded-md hover:text-gray-600 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="SUMMER20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Summer Sale - 20% off"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                        <select
                          value={formData.discountType}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountType: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="flat">Flat Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                        <input
                          type="number"
                          value={formData.discountValue}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: e.target.value }))}
                          required
                          min="0"
                          step={formData.discountType === "percentage" ? "1" : "0.01"}
                          max={formData.discountType === "percentage" ? "100" : undefined}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder={formData.discountType === "percentage" ? "20" : "100"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
                        <input
                          type="number"
                          value={formData.minOrderValue}
                          onChange={(e) => setFormData((prev) => ({ ...prev, minOrderValue: e.target.value }))}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount (₹)</label>
                        <input
                          type="number"
                          value={formData.maxDiscountAmount}
                          onChange={(e) => setFormData((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="No limit"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Uses</label>
                        <input
                          type="number"
                          value={formData.maxUses}
                          onChange={(e) => setFormData((prev) => ({ ...prev, maxUses: e.target.value }))}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Unlimited"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses Per User *</label>
                        <input
                          type="number"
                          value={formData.maxUsesPerUser}
                          onChange={(e) => setFormData((prev) => ({ ...prev, maxUsesPerUser: e.target.value }))}
                          required
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                      <input
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData((prev) => ({ ...prev, validUntil: e.target.value }))}
                        required
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor="isActive" className="ml-2 text-sm text-gray-900">
                          Active Coupon
                        </label>
                      </div>
                      <div>
                        <select
                          name="couponcategories"
                          value={formData.couponcategories || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              couponcategories: e.target.value,
                            }))
                          }
                        >
                          <option value="" disabled>
                            Select Categories
                          </option>
                          {categoriesdetails.map((category) => (
                            <option key={category._id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-end pt-4 mt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 order-2 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                    >
                      {isSubmitting ? "Saving..." : (editingCoupon ? "Update Coupon" : "Create Coupon")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Free Coupon Modal */}
      {showFreeCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-gray-500 bg-opacity-75 sm:p-4">
          <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900 sm:text-xl">
                  {editingCoupon ? "Edit Free Coupon" : "Create Free Coupon"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFreeCouponModal(false)}
                  className="p-1 text-gray-400 rounded-md hover:text-gray-600 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Free Coupon Information:</strong> Free coupons provide special discounts for customers.
                    You can set either percentage or flat discount. Only one free coupon can exist at a time.
                  </p>
                </div>

                <form onSubmit={handleFreeCouponSubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                        <input
                          type="text"
                          value={freeCouponFormData.code}
                          onChange={(e) => handleFreeCouponChange("code", e.target.value.toUpperCase())}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="FREE100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <input
                          type="text"
                          value={freeCouponFormData.description}
                          onChange={(e) => handleFreeCouponChange("description", e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Free Order Coupon"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                        <select
                          value={freeCouponFormData.discountType}
                          onChange={(e) => handleFreeCouponChange("discountType", e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="flat">Flat Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                        <input
                          type="number"
                          value={freeCouponFormData.discountValue}
                          onChange={(e) => handleFreeCouponChange("discountValue", e.target.value)}
                          required
                          min="0"
                          step={freeCouponFormData.discountType === "percentage" ? "1" : "0.01"}
                          max={freeCouponFormData.discountType === "percentage" ? "100" : undefined}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder={freeCouponFormData.discountType === "percentage" ? "100" : "0"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
                        <input
                          type="number"
                          value={freeCouponFormData.minOrderValue}
                          onChange={(e) => handleFreeCouponChange("minOrderValue", e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount (₹)</label>
                        <input
                          type="number"
                          value={freeCouponFormData.maxDiscountAmount}
                          onChange={(e) => handleFreeCouponChange("maxDiscountAmount", e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="No limit"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Uses</label>
                        <input
                          type="number"
                          value={freeCouponFormData.maxUses}
                          onChange={(e) => handleFreeCouponChange("maxUses", e.target.value)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typically 1 for one-time use free coupons</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses Per User *</label>
                        <input
                          type="number"
                          value={freeCouponFormData.maxUsesPerUser}
                          onChange={(e) => handleFreeCouponChange("maxUsesPerUser", e.target.value)}
                          required
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typically 1 for free coupons</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                      <input
                        type="date"
                        value={freeCouponFormData.validUntil}
                        onChange={(e) => handleFreeCouponChange("validUntil", e.target.value)}
                        required
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActiveFree"
                        checked={freeCouponFormData.isActive}
                        onChange={(e) => handleFreeCouponChange("isActive", e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="isActiveFree" className="ml-2 text-sm text-gray-900">
                        Activate Free Coupon
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-end pt-4 mt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowFreeCouponModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 order-2 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                    >
                      {isSubmitting ? "Saving..." : (editingCoupon ? "Update Free Coupon" : "Create Free Coupon")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CouponsManagement;