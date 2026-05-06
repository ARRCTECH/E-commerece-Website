"use client";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { fetchAllBanners, createBanner, updateBanner, deleteBanner } from "../../store/slices/digitalMarketerSlice";
import LoadingSpinner from "../LoadingSpinner";
const PromoBannersManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    linkUrl: "",
    isActive: true,
    type: "hero", // <-- Changed from "position"
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const dispatch = useDispatch();
  const { banners = [], bannersLoading } = useSelector((state) => state.digitalMarketer);
  useEffect(() => {
    dispatch(fetchAllBanners());
  }, [dispatch]);
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append("title", formData.title);
    submitData.append("description", formData.description);
    submitData.append("linkUrl", formData.linkUrl);
    submitData.append("isActive", formData.isActive);
    submitData.append("type", formData.type); // <-- Changed from "position"
    if (selectedFile) {
      submitData.append("image", selectedFile);
    }
    try {
      if (editingBanner) {
        await dispatch(updateBanner({ bannerId: editingBanner._id, bannerData: submitData })).unwrap();
      } else {
        await dispatch(createBanner(submitData)).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving banner:", error);
    }
  };
  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || "",
      linkUrl: banner.linkUrl || "",
      isActive: banner.isActive,
      type: banner.type || "hero", // <-- Changed from "position"
    });
    setPreviewUrl(banner.imageUrl);
    setShowModal(true);
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
  const handleToggleActive = async (banner) => {
    const updateData = new FormData();
    updateData.append("isActive", !banner.isActive);
    try {
      await dispatch(updateBanner({ bannerId: banner._id, bannerData: updateData })).unwrap();
    } catch (error) {
      console.error("Error updating banner status:", error);
    }
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setFormData({
      title: "",
      description: "",
      linkUrl: "",
      isActive: true,
      type: "hero",
    });
    setSelectedFile(null);
    setPreviewUrl("");
  };
  if (bannersLoading) {
    return <LoadingSpinner />;
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Promo Banners Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Banner
        </button>
      </div>
      {/* Banners Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <div key={banner._id} className="overflow-hidden bg-white rounded-lg shadow">
            <div className="bg-gray-200 aspect-w-16 aspect-h-9">
              <img
                src={banner.image.url || "/placeholder.svg?height=200&width=400"}
                alt={banner.title}
                className="object-cover w-full h-48"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">{banner.title}</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    banner.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {banner.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {banner.description && <p className="mb-3 text-sm text-gray-600 line-clamp-2">{banner.description}</p>}
              {banner.linkUrl && <p className="mb-3 text-xs text-blue-600 truncate">Link: {banner.linkUrl}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 capitalize">Type: {banner.type}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`p-1 rounded-full ${
                      banner.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                    }`}
                    title={banner.isActive ? "Deactivate" : "Activate"}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-1 text-blue-600 rounded-full hover:bg-blue-50"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="p-1 text-red-600 rounded-full hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseModal} />
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">
                        {editingBanner ? "Edit Banner" : "Add New Banner"}
                      </h3>
                      <div className="space-y-4">
                        {/* Title */}
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        {/* Description */}
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        {/* Link URL */}
                        <div>
                          <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700">
                            Link URL
                          </label>
                          <input
                            type="url"
                            id="linkUrl"
                            name="linkUrl"
                            value={formData.linkUrl}
                            onChange={handleInputChange}
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            placeholder="https://example.com"
                          />
                        </div>
                        {/* Type Selector */}
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                            Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            required
                          >
                            <option value="hero">Hero</option>
                            <option value="promo">Promo</option>
                            <option value="category">Category</option>
                          </select>
                        </div>
                        {/* Image Upload */}
                        <div>
                          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                            Banner Image {!editingBanner && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="file"
                            id="image"
                            accept="image/*"
                            onChange={handleFileChange}
                            required={!editingBanner}
                            className="block w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                        </div>
                        {/* Image Preview */}
                        {previewUrl && (
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Preview</label>
                            <img
                              src={previewUrl || "/placeholder.svg"}
                              alt="Preview"
                              className="object-cover w-full h-32 border rounded-md"
                            />
                          </div>
                        )}
                        {/* Active Status */}
                        <div className="flex items-center">
                          <input
                            id="isActive"
                            name="isActive"
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="isActive" className="block ml-2 text-sm text-gray-900">
                            Active (visible on website)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingBanner ? "Update" : "Create"} Banner
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PromoBannersManagement;