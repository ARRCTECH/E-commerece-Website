"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Trash2, Edit3, ImageIcon } from "lucide-react";
import {
  fetchKsauniTshirts,
  createKsauniTshirt,
  updateKsauniTshirt,
  deleteKsauniTshirt,
  clearError,
} from "../../store/slices/ksauniTshirtSlice";
const KsauniTshirtManagement = () => {
  const dispatch = useDispatch();
  const { tshirts = [], loading, error } = useSelector((state) => state.ksauniTshirt);
  const [showModal, setShowModal] = useState(false);
  const [editingTshirt, setEditingTshirt] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Form states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [altText, setAltText] = useState("Ksauni Tshirt Style");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    dispatch(fetchKsauniTshirts());
  }, [dispatch]);
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should not exceed 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile && !editingTshirt) {
      alert("Please select an image");
      return;
    }
    try {
      setUploading(true);
      dispatch(clearError());
      const formData = new FormData();
      // Only append image if it's a new upload
      if (imageFile) {
        formData.append("image", imageFile);
      }
      formData.append("order", order);
      formData.append("isActive", isActive);
      formData.append("alt", altText);
      if (editingTshirt) {
        await dispatch(updateKsauniTshirt({ id: editingTshirt._id, formData })).unwrap();
      } else {
        await dispatch(createKsauniTshirt(formData)).unwrap();
      }
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving Ksauni Tshirt:", error);
    } finally {
      setUploading(false);
    }
  };
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        dispatch(clearError());
        await dispatch(deleteKsauniTshirt(id)).unwrap();
      } catch (error) {
        console.error("Error deleting Ksauni Tshirt:", error);
      }
    }
  };
  const openEditModal = (tshirt) => {
    setEditingTshirt(tshirt);
    setImagePreview(tshirt.image.url);
    setAltText(tshirt.image.alt || "Ksauni Tshirt Style");
    setOrder(tshirt.order || 0);
    setIsActive(tshirt.isActive);
    setShowModal(true);
    dispatch(clearError());
  };
  const resetForm = () => {
    setImageFile(null);
    setImagePreview("");
    setAltText("Ksauni Tshirt Style");
    setOrder(0);
    setIsActive(true);
    setEditingTshirt(null);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ksauni Tshirt Style Management</h1>
        <button
          onClick={() => {
            setShowModal(true);
            dispatch(clearError());
          }}
          className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Image</span>
        </button>
      </div>
      {/* Error Display */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}
      {/* Images Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : tshirts.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No images found. Add your first Ksauni Tshirt image!</p>
          </div>
        ) : (
          tshirts.map((tshirt) => (
            <div key={tshirt._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square">
                <img
                  src={tshirt.image.url || "/placeholder.svg"}
                  alt={tshirt.image.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Order: {tshirt.order}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      tshirt.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tshirt.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3 truncate">{tshirt.image.alt}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(tshirt)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tshirt._id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative w-11/12 max-w-md p-5 mx-auto bg-white border rounded-md shadow-lg top-20">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {editingTshirt ? "Edit Image" : "Add New Image"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required={!editingTshirt}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                {/* Alt Text */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Alt Text</label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Image description"
                  />
                </div>
                {/* Order */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                {/* Status */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex justify-end pt-4 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : editingTshirt ? "Update" : "Create"}
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
export default KsauniTshirtManagement;