"use client"
import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { 
  Plus, Search, Edit, Trash2, ImageIcon, Package, X, 
  ChevronLeft, ChevronRight, Filter, Layers, Tag, ChevronsLeft, ChevronsRight,
  Home, Eye, EyeOff, FolderTree
} from "lucide-react"
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  clearError,
} from "../../store/slices/categorySlice"

const inputCls = "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
const labelCls = "block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide"

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
      return count >= 0 ? count : 0
    }
    const backendCount = category.productCount || 0
    return backendCount >= 0 ? backendCount : 0
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1)
  const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1)

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value))
    setCurrentPage(1)
  }

  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i)
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    })

    return rangeWithDots
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-red-50/30 p-3 sm:p-5 lg:p-8 space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-5 sm:p-6 shadow-xl shadow-red-200/50">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">Catalog</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Categories Management</h1>
            <p className="text-rose-100/90 text-sm mt-1">Organize your store categories and subcategories</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-700 bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 focus:bg-white transition"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <FolderTree className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
              <select
                className="pl-10 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="main">Main Categories</option>
                <option value="sub">Subcategories</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Display */}
      <div className="overflow-hidden bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
        {/* Mobile Card View */}
        <div className="block md:hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
            </div>
          ) : paginatedCategories.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FolderTree className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No categories found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedCategories.map((category) => (
                <div key={category._id} className="p-4 hover:bg-rose-50/40 transition">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-16 h-16">
                      {category.image?.url ? (
                        <img
                          className="object-cover w-16 h-16 rounded-xl ring-1 ring-gray-200"
                          src={category.image.url || "/placeholder.svg"}
                          alt={category.name}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{category.slug}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-100">
                          {category.parentCategory?.name || "Main Category"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <Package className="w-3 h-3" /> {getProductCountForCategory(category)}
                          </span>
                          {category.showOnHomepage && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <Home className="w-3 h-3" /> Home
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          category.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
                        }`}>
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button onClick={() => openEditModal(category)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(category._id)} className="p-2 text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:shadow-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-rose-50 to-red-50 border-b border-rose-100">
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Parent Category</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Products</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Homepage</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Sort Order</th>
                <th className="px-6 py-4 text-xs font-bold text-right text-gray-700 uppercase tracking-wider">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="w-8 h-8 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div></div>
                  </td>
                </tr>
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <FolderTree className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    No categories found
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-rose-50/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 h-12">
                          {category.image?.url ? (
                            <img
                              className="object-cover w-12 h-12 rounded-xl ring-1 ring-gray-200"
                              src={category.image.url || "/placeholder.svg"}
                              alt={category.name}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{category.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-100">
                        {category.parentCategory?.name || "Main Category"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        <Package className="w-3 h-3" /> {getProductCountForCategory(category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                        category.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
                      }`}>
                        {category.isActive ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {category.showOnHomepage ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 ring-1 ring-green-200">
                          <Home className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{category.sortOrder || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(category)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 hover:scale-105 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(category._id)} className="p-2 text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:shadow-lg hover:scale-105 transition">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-gradient-to-r from-rose-50/50 to-white border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <p className="hidden sm:block text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredCategories.length)}</span> of{" "}
                <span className="font-semibold text-gray-900">{filteredCategories.length}</span> categories
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 py-1 text-sm text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[36px] h-9 px-3 text-sm font-semibold rounded-lg transition ${
                        page === currentPage
                          ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-200"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-red-300 hover:text-red-600"
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <div className="sm:hidden text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Premium Design */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
          <div className="min-h-screen flex items-start sm:items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 sm:px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5">Fill in the category details below</p>
                </div>
                <button
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="p-2 text-white/90 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelCls}>Category Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Parent Category</label>
                      <select
                        value={formData.parentCategory}
                        onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                        className={inputCls}
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
                      <label className={labelCls}>Sort Order</label>
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                        className={inputCls}
                      />
                    </div>
                    <div className="flex items-center pt-2">
                      <input
                        type="checkbox"
                        id="showOnHomepage"
                        checked={formData.showOnHomepage}
                        onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <label htmlFor="showOnHomepage" className="ml-2 text-sm font-medium text-gray-700">
                        Show on Homepage
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className={inputCls}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="p-4 bg-gray-50 rounded-xl ring-1 ring-gray-100">
                    <h4 className="mb-3 text-sm font-bold text-gray-800 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-red-600" /> Category Image
                    </h4>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-red-600 file:to-rose-600 file:text-white hover:file:shadow-md cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="object-cover w-24 h-24 rounded-xl ring-2 ring-red-200"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 sm:px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm() }}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl shadow-md shadow-red-200 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isLoading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesManagement