/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import {
  Plus, Search, Edit, Trash2, ArrowUp, ArrowDown, Star, Package, X,
  ChevronLeft, ChevronRight, Filter, ImageIcon, Layers, Palette, Tag,
} from "lucide-react"
import adminAPI from "../../store/api/adminApi"
import { fetchCategories as fetchCategoriesAction } from "../../store/slices/categorySlice"

const inputCls =
  "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
const labelCls = "block mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide"

const ProductsManagement = () => {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [productType, setProductType] = useState("regular")
  const [filters, setFilters] = useState({ category: "", minPrice: "", maxPrice: "", sort: "newest" })
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [bulkConfig, setBulkConfig] = useState({
    piecesPerSize: 1,
    minColorsToSelect: 1,
    maxColorsToSelect: null,
    pricePerSet: "",
    originalPricePerSet: "",
  })

  const [formData, setFormData] = useState({
    name: "", description: "", brand: "Factory Sale", productDetails: "", material: "",
    fits: "regular", price: "", originalPrice: "", category: "", subcategory: "",
    sizes: [], colors: [], tags: [], stock: "", weight: "",
    dimensions: { length: "", width: "", height: "" },
  })

  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [filters, searchTerm, pagination.current])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = { page: pagination.current, limit: 10, search: searchTerm, ...filters }
      const response = await adminAPI.getAllProducts(params)
      setProducts(response.data.products)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getAllCategories()
      setCategories(response.data.categories)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      setLoading(true)
      const formDataToSend = new FormData()
      Object.keys(formData).forEach((key) => {
        if (editingProduct && key === "category") return
        if (key === "sizes" || key === "colors" || key === "tags") {
          formDataToSend.append(key, JSON.stringify(formData[key]))
        } else if (key === "dimensions") {
          formDataToSend.append(key, JSON.stringify(formData[key]))
        } else if (key === "price") {
          let v = formData.price
          if (Array.isArray(v)) v = v[0]
          formDataToSend.append(key, v)
        } else if (key === "originalPrice") {
          let v = formData.originalPrice
          if (Array.isArray(v)) v = v[0]
          formDataToSend.append(key, v || "")
        } else {
          formDataToSend.append(key, formData[key])
        }
      })

      formDataToSend.append("isBulkProduct", productType === "bulk")
      if (productType === "bulk") {
        formDataToSend.append("bulkConfig", JSON.stringify(bulkConfig))
        formDataToSend.append("price", bulkConfig.pricePerSet)
        formDataToSend.append("originalPrice", bulkConfig.originalPricePerSet)
      }

      const newImages = images.filter((img) => !img.isExisting && img.file)
      const newVideos = videos.filter((vid) => !vid.isExisting && vid.file)
      const existingImageIds = images.filter((img) => img.isExisting).map((img) => img.imageId).filter(Boolean)
      const existingVideoIds = videos.filter((vid) => vid.isExisting).map((vid) => vid.videoId).filter(Boolean)

      newImages.forEach((img) => formDataToSend.append("images", img.file))
      newVideos.forEach((vid) => formDataToSend.append("videos", vid.file))
      if (existingImageIds.length > 0) formDataToSend.append("existingImages", JSON.stringify(existingImageIds))
      if (existingVideoIds.length > 0) formDataToSend.append("existingVideos", JSON.stringify(existingVideoIds))

      const videoOrder = videos.map((vid, index) => ({
        type: vid.isExisting ? "existing" : "new",
        id: vid.isExisting ? vid.videoId : vid.name,
        order: index,
      }))
      const imageOrder = images.map((img, index) => ({
        type: img.isExisting ? "existing" : "new",
        id: img.isExisting ? img.imageId : img.name,
        order: index,
      }))
      formDataToSend.append("imageOrder", JSON.stringify(imageOrder))
      formDataToSend.append("videoOrder", JSON.stringify(videoOrder))

      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct._id, formDataToSend)
      } else {
        await adminAPI.createProduct(formDataToSend)
      }

      setShowModal(false)
      resetForm()
      fetchProducts()
      fetchCategories()
      dispatch(fetchCategoriesAction())
    } catch (error) {
      console.error("Error saving product:", error)
      alert(error?.response?.data?.message || "Failed to save product")
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await adminAPI.deleteProduct(productId)
        fetchProducts()
        fetchCategories()
        dispatch(fetchCategoriesAction())
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "", description: "", brand: "Factory Sale", productDetails: "", material: "",
      fits: "regular", price: "", originalPrice: "", category: "", subcategory: "",
      sizes: [], colors: [], tags: [], stock: "", weight: "",
      dimensions: { length: "", width: "", height: "" },
    })
    setBulkConfig({ piecesPerSize: 1, minColorsToSelect: 1, maxColorsToSelect: null, pricePerSet: "", originalPricePerSet: "" })
    setProductType("regular")
    setImages([])
    setVideos([])
    setEditingProduct(null)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    const isBulk = product.isBulkProduct === true
    setProductType(isBulk ? "bulk" : "regular")

    let priceValue = product.price
    let originalPriceValue = product.originalPrice
    if (Array.isArray(priceValue)) priceValue = priceValue[0]
    if (Array.isArray(originalPriceValue)) originalPriceValue = originalPriceValue[0]

    setFormData({
      name: product.name || "",
      brand: product.brand || "Factory Sale",
      productDetails: product.productDetails || "",
      material: product.material || "",
      fits: product.fits || "regular",
      description: product.description || "",
      price: priceValue || "",
      originalPrice: originalPriceValue || "",
      category: product.category?._id || "",
      subcategory: product.subcategory || "",
      sizes: product.sizes || [],
      colors: product.colors || [],
      tags: product.tags || [],
      stock: product.stock || "",
      weight: product.weight || "",
      dimensions: product.dimensions || { length: "", width: "", height: "" },
    })

    if (isBulk && product.bulkConfig) {
      setBulkConfig({
        piecesPerSize: product.bulkConfig.piecesPerSize || 1,
        minColorsToSelect: product.bulkConfig.minColorsToSelect || 1,
        maxColorsToSelect: product.bulkConfig.maxColorsToSelect || null,
        pricePerSet: product.bulkConfig.pricePerSet || priceValue,
        originalPricePerSet: product.bulkConfig.originalPricePerSet || originalPriceValue,
      })
    }

    if (product.images && product.images.length > 0) {
      setImages(product.images.map((img, index) => ({
        file: null, name: `existing-image-${index}`, preview: img.url,
        sizeKB: 0, isExisting: true, imageId: img._id || img.id,
      })))
    } else {
      setImages([])
    }

    if (product.videos && product.videos.length > 0) {
      setVideos(product.videos.map((video, index) => ({
        file: null, name: `existing-video-${index}`, preview: video.url,
        sizeKB: 0, isExisting: true, videoId: video._id || video.id,
      })))
    } else {
      setVideos([])
    }

    setShowModal(true)
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    const wrapped = files.map((file) => ({
      file, name: file.name, preview: URL.createObjectURL(file), sizeKB: Math.round(file.size / 1024),
    }))
    setImages((prev) => [...prev, ...wrapped])
  }

  const handleVideoChange = async (e) => {
    const files = Array.from(e.target.files || [])
    const validVideos = []
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) { alert(`❌ "${file.name}" exceeds 50 MB limit.`); continue }
      const isValidDuration = await checkVideoDuration(file)
      if (!isValidDuration) { alert(`❌ "${file.name}" is longer than 30 seconds.`); continue }
      validVideos.push({ file, name: file.name, preview: URL.createObjectURL(file), sizeKB: Math.round(file.size / 1024) })
    }
    setVideos((prev) => [...prev, ...validVideos])
  }

  const checkVideoDuration = (file) => new Promise((resolve) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => { window.URL.revokeObjectURL(video.src); resolve(video.duration <= 31) }
    video.onerror = () => { window.URL.revokeObjectURL(video.src); resolve(false) }
    video.src = URL.createObjectURL(file)
  })

  const addSize = () => setFormData({ ...formData, sizes: [...formData.sizes, { size: "", stock: 0 }] })
  const updateSize = (index, field, value) => {
    const newSizes = [...formData.sizes]; newSizes[index][field] = value; setFormData({ ...formData, sizes: newSizes })
  }
  const removeSize = (index) => setFormData({ ...formData, sizes: formData.sizes.filter((_, i) => i !== index) })

  const addColor = () => setFormData({ ...formData, colors: [...formData.colors, { name: "", code: "", images: [] }] })
  const updateColor = (index, field, value) => {
    const newColors = [...formData.colors]; newColors[index][field] = value; setFormData({ ...formData, colors: newColors })
  }
  const removeColor = (index) => setFormData({ ...formData, colors: formData.colors.filter((_, i) => i !== index) })

  const moveImage = (index, direction) => {
    setImages((prev) => {
      const next = [...prev]; const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]; return next
    })
  }
  const removeImage = (index) => {
    setImages((prev) => {
      const next = [...prev]; const [removed] = next.splice(index, 1)
      try { if (removed?.preview) URL.revokeObjectURL(removed.preview) } catch (e) { console.log(e) }
      return next
    })
  }
  const moveVideo = (index, direction) => {
    setVideos((prev) => {
      const next = [...prev]; const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]; return next
    })
  }
  const removeVideo = (index) => {
    setVideos((prev) => {
      const next = [...prev]; const [removed] = next.splice(index, 1)
      try { if (removed?.preview) URL.revokeObjectURL(removed.preview) } catch (e) { console.log(e) }
      return next
    })
  }

  useEffect(() => {
    return () => {
      images.forEach((img) => { try { if (img?.preview) URL.revokeObjectURL(img.preview) } catch (e) { console.log(e) } })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-red-50/30 p-3 sm:p-5 lg:p-8 space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-5 sm:p-6 shadow-xl shadow-red-200/50">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">Catalog</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Products Management</h1>
            <p className="text-rose-100/90 text-sm mt-1">Add, edit and organize your store inventory</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-700 bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text" placeholder="Search products..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 focus:bg-white transition"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1 lg:flex-none">
              <Filter className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full lg:w-auto pl-10 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="flex-1 lg:flex-none px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="overflow-hidden bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
        {/* Mobile Card View */}
        <div className="block md:hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((product) => (
                <div key={product._id} className="p-4 hover:bg-rose-50/40 transition">
                  <div className="flex items-start gap-3">
                    <img className="object-cover w-16 h-16 rounded-xl ring-1 ring-gray-200 flex-shrink-0" src={product.images[0]?.url || "/placeholder.jpg"} alt={product.name} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{product.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {product.isBulkProduct ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 ring-1 ring-red-200">
                            <Package className="w-2.5 h-2.5 mr-1" /> BULK
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-600">Regular</span>
                        )}
                        <span className="inline-flex px-2 py-0.5 text-[10px] bg-rose-50 text-rose-700 rounded-full ring-1 ring-rose-100">{product.category?.name}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-gray-900">₹{product.price}</div>
                          {product.originalPrice && <div className="text-xs text-gray-400 line-through">₹{product.originalPrice}</div>}
                        </div>
                        <div className="text-xs text-gray-600">Stock: <span className="font-semibold">{product.stock}</span></div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button onClick={() => openEditModal(product)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition">
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

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-rose-50 to-red-50 border-b border-rose-100">
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-right text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="w-8 h-8 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div></div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-rose-50/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img className="object-cover w-12 h-12 rounded-xl ring-1 ring-gray-200" src={product.images[0]?.url || "/placeholder.jpg"} alt={product.name} />
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.isBulkProduct ? (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 ring-1 ring-red-200">
                          <Package className="w-3 h-3 mr-1" /> BULK
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Regular</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{product.category?.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">₹{product.price}</div>
                      {product.originalPrice && <div className="text-xs text-gray-400 line-through">₹{product.originalPrice}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 10 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                        product.stock > 0 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" :
                        "bg-red-50 text-red-700 ring-1 ring-red-200"
                      }`}>{product.stock}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(product)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 hover:scale-105 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:shadow-lg hover:scale-105 transition">
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
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-rose-50/50 to-white border-t border-gray-100">
            <div className="flex justify-between flex-1 md:hidden">
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                disabled={pagination.current === 1}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </button>
              <span className="text-xs font-medium text-gray-700 self-center">Page {pagination.current} of {pagination.pages}</span>
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                disabled={pagination.current === pagination.pages}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{(pagination.current - 1) * 10 + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">{Math.min(pagination.current * 10, pagination.total)}</span> of{" "}
                <span className="font-semibold text-gray-900">{pagination.total}</span> results
              </p>
              <nav className="inline-flex gap-1">
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  let pageNum = pagination.current
                  if (pagination.pages <= 5) pageNum = i + 1
                  else if (pagination.current <= 3) pageNum = i + 1
                  else if (pagination.current >= pagination.pages - 2) pageNum = pagination.pages - 4 + i
                  else pageNum = pagination.current - 2 + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination({ ...pagination, current: pageNum })}
                      className={`min-w-[36px] h-9 px-3 text-sm font-semibold rounded-lg transition ${
                        pageNum === pagination.current
                          ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-200"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-red-300 hover:text-red-600"
                      }`}
                    >{pageNum}</button>
                  )
                })}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
          <div className="min-h-screen flex items-start sm:items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 sm:px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5">Fill in the details below</p>
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
                  {/* Product Type */}
                  <div className="p-4 bg-gradient-to-br from-rose-50 to-red-50/50 rounded-xl ring-1 ring-rose-100">
                    <label className={labelCls}>Product Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "regular", label: "Regular Product", icon: Tag },
                        { value: "bulk", label: "Bulk Pack", icon: Package },
                      ].map((opt) => {
                        const Icon = opt.icon
                        const active = productType === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setProductType(opt.value)}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition ${
                              active
                                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-200"
                                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-red-300"
                            }`}
                          >
                            <Icon className="w-4 h-4" /> {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelCls}>Product Name</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={`${inputCls} ${editingProduct ? "bg-gray-50 cursor-not-allowed" : ""}`} required disabled={editingProduct}>
                        <option value="">Select Category</option>
                        {categories.map((category) => (<option key={category._id} value={category._id}>{category.name}</option>))}
                      </select>
                      {editingProduct && <p className="mt-1 text-xs text-gray-500">Category cannot be changed</p>}
                    </div>

                    {productType === "bulk" ? (
                      <>
                        <div>
                          <label className={labelCls}>Price per Set (₹)</label>
                          <input type="number" value={bulkConfig.pricePerSet} onChange={(e) => setBulkConfig({ ...bulkConfig, pricePerSet: e.target.value })} className={inputCls} required />
                        </div>
                        <div>
                          <label className={labelCls}>Original Price per Set (₹)</label>
                          <input type="number" value={bulkConfig.originalPricePerSet} onChange={(e) => setBulkConfig({ ...bulkConfig, originalPricePerSet: e.target.value })} className={inputCls} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className={labelCls}>Price (₹)</label>
                          <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={inputCls} required />
                        </div>
                        <div>
                          <label className={labelCls}>Original Price (₹)</label>
                          <input type="number" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} className={inputCls} />
                        </div>
                      </>
                    )}

                    <div>
                      <label className={labelCls}>Stock</label>
                      <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Weight (grams)</label>
                      <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={inputCls} required />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className={labelCls}>Brand</label>
                      <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className={inputCls} placeholder="e.g., Factory Sale" />
                    </div>
                    <div>
                      <label className={labelCls}>Fit</label>
                      <select value={formData.fits} onChange={(e) => setFormData({ ...formData, fits: e.target.value })} className={inputCls}>
                        <option value="regular">Regular</option>
                        <option value="loose">Loose</option>
                        <option value="oversized">Oversized</option>
                        <option value="crop">Crop</option>
                        <option value="slim">Slim</option>
                        <option value="fitted">Fitted</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Material</label>
                      <input type="text" value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Product Details</label>
                    <textarea value={formData.productDetails} onChange={(e) => setFormData({ ...formData, productDetails: e.target.value })} rows={2} className={inputCls} />
                  </div>

                  {/* Bulk Config */}
                  {productType === "bulk" && (
                    <div className="p-4 border border-red-200 rounded-xl bg-gradient-to-br from-red-50 to-rose-50">
                      <h4 className="mb-3 text-sm font-bold text-red-800 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Bulk Configuration
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className={labelCls}>Pieces per Size</label>
                          <input type="number" value={bulkConfig.piecesPerSize} onChange={(e) => setBulkConfig({ ...bulkConfig, piecesPerSize: parseInt(e.target.value) })} className={inputCls} min="1" />
                        </div>
                        <div>
                          <label className={labelCls}>Min Colors</label>
                          <input type="number" value={bulkConfig.minColorsToSelect} onChange={(e) => setBulkConfig({ ...bulkConfig, minColorsToSelect: parseInt(e.target.value) })} className={inputCls} min="1" />
                        </div>
                        <div>
                          <label className={labelCls}>Max Colors</label>
                          <input type="number" value={bulkConfig.maxColorsToSelect || ""} onChange={(e) => setBulkConfig({ ...bulkConfig, maxColorsToSelect: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Media */}
                  <div className="p-4 bg-gray-50 rounded-xl ring-1 ring-gray-100">
                    <h4 className="mb-3 text-sm font-bold text-gray-800 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-red-600" /> Media
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Product Images</label>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange}
                          className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-red-600 file:to-rose-600 file:text-white hover:file:shadow-md cursor-pointer" />
                      </div>
                      <div>
                        <label className={labelCls}>Product Videos</label>
                        <input type="file" multiple accept="video/*" onChange={handleVideoChange}
                          className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-red-600 file:to-rose-600 file:text-white hover:file:shadow-md cursor-pointer" />
                      </div>
                    </div>

                    {images.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-2 text-xs font-semibold text-gray-700">Arrange images (first will be cover)</div>
                        <div className="flex overflow-x-auto gap-2 pb-2">
                          {images.map((img, index) => (
                            <div key={img.name + index} className="flex-shrink-0 p-2 border border-gray-200 rounded-lg w-[110px] bg-white shadow-sm">
                              <div className="relative w-[92px] h-[92px] overflow-hidden rounded-md">
                                <img src={img.preview || "/placeholder.svg"} alt={`preview ${index + 1}`} className="object-cover w-full h-full" />
                                {index === 0 && (
                                  <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 text-[9px] font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white px-1.5 py-0.5 rounded">
                                    <Star className="w-2.5 h-2.5" /> Cover
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 justify-center mt-2">
                                <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="p-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"><ArrowUp className="w-3 h-3" /></button>
                                <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="p-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"><ArrowDown className="w-3 h-3" /></button>
                                <button type="button" onClick={() => removeImage(index)} className="p-1 border border-red-200 text-red-600 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {videos.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-2 text-xs font-semibold text-gray-700">Videos</div>
                        <div className="flex overflow-x-auto gap-2 pb-2">
                          {videos.map((vid, index) => (
                            <div key={vid.name + index} className="flex-shrink-0 p-2 border border-gray-200 rounded-lg w-[140px] bg-white shadow-sm">
                              <video src={vid.preview} className="w-full h-[80px] object-cover rounded-md bg-black" />
                              <div className="flex flex-wrap gap-1 justify-center mt-2">
                                <button type="button" onClick={() => moveVideo(index, -1)} disabled={index === 0} className="p-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"><ArrowUp className="w-3 h-3" /></button>
                                <button type="button" onClick={() => moveVideo(index, 1)} disabled={index === videos.length - 1} className="p-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"><ArrowDown className="w-3 h-3" /></button>
                                <button type="button" onClick={() => removeVideo(index)} className="p-1 border border-red-200 text-red-600 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sizes */}
                  <div className="p-4 bg-gray-50 rounded-xl ring-1 ring-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-red-600" /> Sizes
                      </h4>
                      <button type="button" onClick={addSize} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition">
                        <Plus className="w-3 h-3" /> Add Size
                      </button>
                    </div>
                    {formData.sizes.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-2">No sizes added</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.sizes.map((size, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input type="text" placeholder="Size (e.g., M)" value={size.size} onChange={(e) => updateSize(index, "size", e.target.value)} className={`flex-1 ${inputCls}`} />
                            <input type="number" placeholder="Stock" value={size.stock} onChange={(e) => updateSize(index, "stock", parseInt(e.target.value))} className={`w-24 ${inputCls}`} />
                            <button type="button" onClick={() => removeSize(index)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Colors */}
                  <div className="p-4 bg-gray-50 rounded-xl ring-1 ring-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-red-600" /> Colors
                      </h4>
                      <button type="button" onClick={addColor} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition">
                        <Plus className="w-3 h-3" /> Add Color
                      </button>
                    </div>
                    {formData.colors.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-2">No colors added</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.colors.map((color, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input type="text" placeholder="Color Name" value={color.name} onChange={(e) => updateColor(index, "name", e.target.value)} className={`flex-1 ${inputCls}`} />
                            <div className="relative">
                              <input type="text" placeholder="#hex" value={color.code} onChange={(e) => updateColor(index, "code", e.target.value)} className={`w-28 pl-9 ${inputCls}`} />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: color.code || "#fff" }} />
                            </div>
                            <button type="button" onClick={() => removeColor(index)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="p-4 bg-gray-50 rounded-xl ring-1 ring-gray-100">
                    <h4 className="mb-3 text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-red-600" /> Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["trending", "new-arrival", "sale", "featured", "bulk"].map((tag) => {
                        const active = formData.tags.includes(tag)
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (active) setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
                              else setFormData({ ...formData, tags: [...formData.tags, tag] })
                            }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition capitalize ${
                              active
                                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-200"
                                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-red-300 hover:text-red-600"
                            }`}
                          >
                            {tag.replace("-", " ")}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 sm:px-6 py-4 flex justify-end gap-3">
                  <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading || isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl shadow-md shadow-red-200 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {loading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
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

export default ProductsManagement
