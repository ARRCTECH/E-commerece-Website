"use client";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { fetchAllInnovations, createInnovation, updateInnovation, deleteInnovation } from "../../store/slices/innovationSlice";
const InnovationManagementEnhanced = () => {
  const dispatch = useDispatch();
  const { innovations: allInnovations, loading: isLoading } = useSelector((state) => state.innovations || { innovations: [], loading: false });
  const [showModal, setShowModal] = useState(false);
  const [editingInnovation, setEditingInnovation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Technology",
    tags: "",
    priority: "Medium",
    status: "Draft",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = (innovation) => {
    setEditingInnovation(innovation);
    setFormData({
      title: innovation.title || "",
      description: innovation.description || "",
      category: innovation.category || "Technology",
      tags: innovation.tags?.join(", ") || "",
      priority: innovation.priority || "Medium",
      status: innovation.status || "Draft",
    });
    if (innovation.image?.url) {
      setImagePreview(innovation.image.url);
    }
    setShowModal(true);
  };

  // Fetch innovations
  const fetchInnovations = useCallback(() => {
    dispatch(fetchAllInnovations());
  }, [dispatch]);
  useEffect(() => {
    fetchInnovations();
  }, [fetchInnovations]);
  // Filter innovations
  const filteredInnovations = (allInnovations || []).filter((innovation) => {
    const matchesSearch = innovation?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         innovation?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || innovation.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
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
      if (editingInnovation) {
        await dispatch(updateInnovation({ innovationId: editingInnovation._id, formData: formDataToSend })).unwrap();
      } else {
        await dispatch(createInnovation(formDataToSend)).unwrap();
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving innovation:", error);
    }
  };
  const handleDelete = async (innovationId) => {
    if (window.confirm("Are you sure you want to delete this innovation?")) {
      try {
        await dispatch(deleteInnovation(innovationId)).unwrap();
      } catch (error) {
        console.error("Error deleting innovation:", error);
      }
    }
  };
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Technology",
      tags: "",
      priority: "Medium",
      status: "Draft",
    });
    setImageFile(null);
    setImagePreview("");
    setEditingInnovation(null);
  };
  const categories = ["Technology", "Design", "Process", "Product", "Service", "Other"];
  const priorities = ["Low", "Medium", "High", "Critical"];
  const statuses = ["Draft", "In Progress", "Review", "Approved", "Implemented"];
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Innovation Lab</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Innovation</span>
          </button>
        </div>
      </div>
      {/* Filters */}
      <div className="p-4 space-y-4 bg-white rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search innovations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Innovations Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="flex justify-center py-8 col-span-full">
            <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredInnovations.length === 0 ? (
          <div className="py-8 text-center text-gray-500 col-span-full">No innovations found</div>
        ) : (
          filteredInnovations.map((innovation) => (
            <div key={innovation._id} className="overflow-hidden bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <img
                src={innovation.image?.url || "/placeholder.svg?height=200&width=400&text=Innovation+Image"}
                alt={innovation.title}
                className="object-cover w-full h-48"
              />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      innovation.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {innovation.isActive ? "Active" : "Inactive"}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      innovation.status === "Implemented" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {innovation.status}
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-medium text-gray-900">{innovation.title}</h3>
                <p className="mb-2 text-sm text-gray-600 line-clamp-2">{innovation.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">Category: {innovation.category}</div>
                  <div className="flex space-x-2">
                    <button onClick={() => openEditModal(innovation)} className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(innovation._id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative w-11/12 max-w-3xl p-5 mx-auto bg-white border rounded-md shadow-lg top-20">
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="mb-4 text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                aria-label="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {editingInnovation ? "Edit Innovation" : "Add New Innovation"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                    maxLength={1000}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {priorities.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Enter tags separated by commas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Innovation Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required={!editingInnovation}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="object-cover w-full h-32 rounded-lg"
                      />
                    </div>
                  )}
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
                    disabled={isLoading}
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : editingInnovation ? "Update Innovation" : "Create Innovation"}
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
export default InnovationManagementEnhanced;