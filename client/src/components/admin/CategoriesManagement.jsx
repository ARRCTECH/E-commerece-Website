"use client"
import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Plus, Search, Edit, Trash2, ImageIcon } from "lucide-react"
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  clearError,
} from "../../store/slices/categorySlice"
const CategoriesManagement = ({ products = [] }) => {
  const dispatch = useDispatch()
  const { categories, isLoading, error } = useSelector((state) => state.categories)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentCategory: "",
    showOnHomepage: true,
    sortOrder: 0,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])
  useEffect(() => {
    if (error) {
      alert(error)
      dispatch(clearError())
    }
  }, [error, dispatch])
  useEffect(() => {
    // Refetch categories when products array changes to get updated product counts
    if (products.length >= 0) {
      dispatch(fetchCategories())
    }
  }, [products.length, dispatch])
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || formData.name.trim() === "") {
      alert("Category name is required")
      return
    }
    const formDataToSend = new FormData()
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== undefined && formData[key] !== null) {
        formDataToSend.append(key, formData[key])
      }
    })
    if (imageFile) {
      formDataToSend.append("image", imageFile)
    }
    try {
      if (editingCategory) {
        await dispatch(updateCategory({ id: editingCategory._id, data: formDataToSend })).unwrap()
      } else {
        await dispatch(createCategory(formDataToSend)).unwrap()
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error("Error saving category:", error)
    }
  }
  const handleDelete = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await dispatch(deleteCategory(categoryId)).unwrap()
      } catch (error) {
        console.error("Error deleting category:", error)
      }
    }
  }
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parentCategory: "",
      showOnHomepage: true,
      sortOrder: 0,
    })
    setImageFile(null)
    setImagePreview("")
    setEditingCategory(null)
  }
  const openEditModal = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      parentCategory: category.parentCategory?._id || "",
      showOnHomepage: category.showOnHomepage,
      sortOrder: category.sortOrder,
    })
    setImagePreview(category.image?.url || "")
    setShowModal(true)
  }
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const parentCategories = categories.filter((category) => !category.parentCategory)

  const getProductCountForCategory = (category) => {
    if (products && products.length > 0) {
      const count = products.filter((product) => {
        const productCategoryId =
          product.category?._id || product.category?.id || product.categoryId || product.category
        return productCategoryId === category._id
      }).length
      return count >= 0 ? count : 0 // Ensure count is never negative
    }

    const backendCount = category.productCount || 0
    return backendCount >= 0 ? backendCount : 0
  }

  return (
    <div className="p-2 space-y-3 sm:p-4 sm:space-y-4">
      {/* Search with Add Button */}
      <div className="p-3 bg-white rounded-lg shadow">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center px-3 py-2 space-x-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 sm:ml-3 sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>
      {/* Categories Table - Mobile Responsive */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        {/* Mobile Cards View */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">No categories found</div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category._id} className="p-4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-12 h-12">
                      {category.image?.url ? (
                        <img
                          className="object-cover w-12 h-12 rounded-lg"
                          src={category.image.url || "/placeholder.svg"}
                          alt={category.name}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-lg">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{category.name}</div>
                      <div className="text-sm text-gray-500 truncate">{category.slug}</div>
                      <div className="text-sm text-gray-500">Parent: {category.parentCategory?.name || "None"}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => openEditModal(category)} className="text-blue-600 hover:text-blue-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(category._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Products:</span>
                      <div className="text-gray-900">{getProductCountForCategory(category)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Homepage:</span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.showOnHomepage ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {category.showOnHomepage ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Parent Category
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Products
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Homepage
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-12 h-12">
                            {category.image?.url ? (
                              <img
                                className="object-cover w-12 h-12 rounded-lg"
                                src={category.image.url || "/placeholder.svg"}
                                alt={category.name}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-lg">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                            <div className="text-sm text-gray-500">{category.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{category.parentCategory?.name || "None"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getProductCountForCategory(category)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            category.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            category.showOnHomepage ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {category.showOnHomepage ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button onClick={() => openEditModal(category)} className="text-blue-600 hover:text-blue-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Modal - Compact */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2 overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="w-full max-w-2xl my-4 bg-white border rounded-lg shadow-lg">
            <div className="flex flex-col">
              {/* Modal Header - Compact */}
              <div className="flex items-center justify-between p-3 border-b">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
                <h3 className="text-base font-medium text-gray-900">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h3>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  <span>Add Category</span>
                </button>
              </div>
              {/* Modal Body - Compact Form */}
              <div className="p-3">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Category Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Parent Category</label>
                      <select
                        value={formData.parentCategory}
                        onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">None (Main Category)</option>
                        {parentCategories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-700">Sort Order</label>
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: Number.parseInt(e.target.value) })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showOnHomepage"
                        checked={formData.showOnHomepage}
                        onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                        className="w-4 h-4 mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showOnHomepage" className="text-xs font-medium text-gray-700">
                        Show on Homepage
                      </label>
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
                    <label className="block mb-1 text-xs font-medium text-gray-700">Category Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="object-cover w-16 h-16 rounded"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex pt-3 space-x-2 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
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
                      {isLoading ? "Saving..." : editingCategory ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default CategoriesManagement
