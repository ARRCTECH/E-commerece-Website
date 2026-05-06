"use client";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { fetchAllBanners, createBanner, updateBanner, deleteBanner, clearError } from "../../store/slices/bannerSlice";
import { updatePopupSetting } from "../../store/slices/popupSlice";
const BannersManagement = () => {
  const dispatch = useDispatch();
  const { banners: allBanners, loading: isLoading, error } = useSelector((state) => state.banners);
  const { showSalePopup, popupBanners } = useSelector((state) => state.popup);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    buttonText: "",
    buttonLink: "",
    bannerLink: "",
    type: "hero",
    sortOrder: 0,
    startDate: "",
    endDate: "",
    targetAudience: "all",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  // Memoized fetch function to prevent infinite loops
  const fetchBanners = useCallback(() => {
    dispatch(fetchAllBanners({ type: filterType }));
  }, [dispatch, filterType]);
  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);
  useEffect(() => {
    if (error) {
      alert(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });
    if (imageFile) {
      formDataToSend.append("image", imageFile);
    }
    try {
      if (editingBanner) {
        await dispatch(updateBanner({ bannerId: editingBanner._id, bannerData: formDataToSend })).unwrap();
      } else {
        if (!imageFile) {
          alert("Please select an image for the banner.");
          return;
        }
        await dispatch(createBanner(formDataToSend)).unwrap();
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving banner:", error);
    }
  };
  const handleDelete = async (bannerId) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      try {
        await dispatch(deleteBanner(bannerId)).unwrap();
      } catch (error) {
        console.error("Error deleting banner:", error);
      }
    }
  };
  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      buttonText: "",
      buttonLink: "",
      type: "hero",
      sortOrder: 0,
      startDate: "",
      endDate: "",
      targetAudience: "all",
    });
    setImageFile(null);
    setImagePreview("");
    setEditingBanner(null);
  };
  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      buttonText: banner.buttonText || "",
      buttonLink: banner.buttonLink || "",
      bannerLink: banner.bannerLink || "",
      type: banner.type || "hero",
      sortOrder: banner.sortOrder || 0,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split("T")[0] : "",
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split("T")[0] : "",
      targetAudience: banner.targetAudience || "all",
    });
    setImagePreview(banner.image?.url || "");
    setShowModal(true);
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const filteredBanners = (allBanners || []).filter((banner) =>
    banner?.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  return (
    <div className="p-2 space-y-3 sm:p-4 sm:space-y-4">
      {/* Filters with Add Button */}
      <div className="p-3 space-y-3 bg-white rounded-lg shadow">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col flex-1 space-y-2 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search banners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 sm:w-auto"
            >
              <option value="">All Types</option>
              <option value="hero">Hero Banners</option>
              <option value="promo">Promo Banners</option>
              <option value="category">Category Banners</option>
            </select>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center px-3 py-2 space-x-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Banner</span>
            </button>
            <label className="inline-flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSalePopup}
                onChange={(e) => dispatch(updatePopupSetting(e.target.checked))}
                className="w-4 h-4 text-blue-600 form-checkbox"
              />
              <span className="text-sm">Show Sale Popup</span>
            </label>
          </div>
        </div>
      </div>
      {/* Banners Grid - Responsive */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="flex justify-center py-8 col-span-full">
            <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="py-8 text-center text-gray-500 col-span-full">No banners found</div>
        ) : (
          filteredBanners.map((banner) => (
            <div key={banner._id} className="overflow-hidden bg-white rounded-lg shadow">
              <img
                src={banner.image?.url || "/placeholder.svg?height=200&width=400&text=Banner+Image"}
                alt={banner.title}
                className="object-cover w-full h-32 sm:h-48"
              />
              <div className="p-3 sm:p-4">
                <div className="flex flex-col mb-2 space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                      banner.type === "hero"
                        ? "bg-purple-100 text-purple-800"
                        : banner.type === "promo"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {banner.type?.charAt(0).toUpperCase() + banner.type?.slice(1)}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                      banner.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {banner.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <label className="inline-flex items-center mb-2 space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!popupBanners.find((pb) => pb.bannerId === banner._id && pb.isActive)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      const newPopupBanners = popupBanners.map((pb) => ({
                        ...pb,
                        isActive: pb.bannerId === banner._id ? isChecked : false,
                      }));
                      if (!newPopupBanners.find((pb) => pb.bannerId === banner._id)) {
                        newPopupBanners.push({ bannerId: banner._id, isActive: isChecked });
                      }
                      dispatch(updatePopupSetting({ popupBanners: newPopupBanners }));
                    }}
                    className="w-4 h-4 text-blue-600 form-checkbox"
                  />
                  <span className="text-xs sm:text-sm">Sudden Popup</span>
                </label>
                <h3 className="mb-1 text-sm font-medium text-gray-900 sm:text-lg line-clamp-2">{banner.title}</h3>
                {banner.subtitle && (
                  <p className="mb-2 text-xs text-gray-600 sm:text-sm line-clamp-1">{banner.subtitle}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 truncate">Created by: {banner.createdBy?.name || "Admin"}</div>
                  <div className="flex space-x-2">
                    <button onClick={() => openEditModal(banner)} className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(banner._id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal - Compact and Mobile Optimized */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2 overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative w-full max-w-2xl my-4 bg-white border rounded-lg shadow-lg">
            <div className="flex flex-col">
              {/* Modal Header - Compact */}
              <div className="flex items-center justify-between p-3 border-b">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
                <h3 className="text-base font-medium text-gray-900">{editingBanner ? "Edit Banner" : "Add Banner"}</h3>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  <span>Add Banner</span>
                </button>
              </div>
              {/* Modal Body - Compact Form */}
              <div className="p-3">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Subtitle</label>
                      <input
                        type="text"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="hero">Hero Banner</option>
                        <option value="promo">Promo Banner</option>
                        <option value="category">Category Banner</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Target Audience</label>
                      <select
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="kids">Kids</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Button Text</label>
                      <input
                        type="text"
                        value={formData.buttonText}
                        onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Button Link</label>
                      <input
                        type="url"
                        value={formData.buttonLink}
                        onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Banner Link</label>
                      <input
                        // type="url"
                        value={formData.bannerLink}
                        onChange={(e) => setFormData({ ...formData, bannerLink: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Sort Order</label>
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: Number.parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">Banner Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      required={!editingBanner}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="object-cover w-full h-20 rounded"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex pt-3 space-x-2 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? "Saving..." : editingBanner ? "Update" : "Create"}
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
export default BannersManagement;