/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { Plus, Search, Edit, Trash2, ArrowUp, ArrowDown, Star, Package } from "lucide-react"
import adminAPI from "../../store/api/adminApi"
import { fetchCategories as fetchCategoriesAction } from "../../store/slices/categorySlice"

const ProductsManagement = () => {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [productType, setProductType] = useState("regular")
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  })

  // 🆕 Prevent double submit
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 🆕 Bulk Config State
  const [bulkConfig, setBulkConfig] = useState({
    piecesPerSize: 1,
    minColorsToSelect: 1,
    maxColorsToSelect: null,
    pricePerSet: "",
    originalPricePerSet: "",
  })

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brand: "Factory Sale",
    productDetails: "",
    material: "",
    fits: "regular",
    price: "",
    originalPrice: "",
    category: "",
    subcategory: "",
    sizes: [],
    colors: [],
    tags: [],
    stock: "",
    weight: "",
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
      const params = {
        page: pagination.current,
        limit: 10,
        search: searchTerm,
        ...filters,
      }
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

    // ✅ Prevent double submit
    if (isSubmitting) {
      console.log("Already submitting, please wait...")
      return
    }

    setIsSubmitting(true)

    try {
      setLoading(true)
      const formDataToSend = new FormData()

      // Append common fields with proper handling
      Object.keys(formData).forEach((key) => {
        if (editingProduct && key === "category") {
          return
        }
        if (key === "sizes" || key === "colors" || key === "tags") {
          formDataToSend.append(key, JSON.stringify(formData[key]))
        } else if (key === "dimensions") {
          formDataToSend.append(key, JSON.stringify(formData[key]))
        } else if (key === "price") {
          // ✅ Ensure price is single value
          let priceValue = formData.price
          if (Array.isArray(priceValue)) {
            priceValue = priceValue[0]
          }
          formDataToSend.append(key, priceValue)
        } else if (key === "originalPrice") {
          // ✅ Ensure originalPrice is single value
          let originalPriceValue = formData.originalPrice
          if (Array.isArray(originalPriceValue)) {
            originalPriceValue = originalPriceValue[0]
          }
          formDataToSend.append(key, originalPriceValue || "")
        } else {
          formDataToSend.append(key, formData[key])
        }
      })

      // 🆕 Append bulk fields
      formDataToSend.append("isBulkProduct", productType === "bulk")
      if (productType === "bulk") {
        formDataToSend.append("bulkConfig", JSON.stringify(bulkConfig))
        // For bulk products, use pricePerSet
        formDataToSend.append("price", bulkConfig.pricePerSet)
        formDataToSend.append("originalPrice", bulkConfig.originalPricePerSet)
      }

      const newImages = images.filter((img) => !img.isExisting && img.file)
      const newVideos = videos.filter((vid) => !vid.isExisting && vid.file)

      const existingImageIds = images
        .filter((img) => img.isExisting)
        .map((img) => img.imageId)
        .filter(Boolean)

      const existingVideoIds = videos
        .filter((vid) => vid.isExisting)
        .map((vid) => vid.videoId)
        .filter(Boolean)

      newImages.forEach((img) => {
        formDataToSend.append("images", img.file)
      })

      newVideos.forEach((vid) => {
        formDataToSend.append("videos", vid.file)
      })

      if (existingImageIds.length > 0) {
        formDataToSend.append("existingImages", JSON.stringify(existingImageIds))
      }

      if (existingVideoIds.length > 0) {
        formDataToSend.append("existingVideos", JSON.stringify(existingVideoIds))
      }

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
      name: "",
      description: "",
      brand: "Factory Sale",
      productDetails: "",
      material: "",
      fits: "regular",
      price: "",
      originalPrice: "",
      category: "",
      subcategory: "",
      sizes: [],
      colors: [],
      tags: [],
      stock: "",
      weight: "",
      dimensions: { length: "", width: "", height: "" },
    })
    setBulkConfig({
      piecesPerSize: 1,
      minColorsToSelect: 1,
      maxColorsToSelect: null,
      pricePerSet: "",
      originalPricePerSet: "",
    })
    setProductType("regular")
    setImages([])
    setVideos([])
    setEditingProduct(null)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    const isBulk = product.isBulkProduct === true

    setProductType(isBulk ? "bulk" : "regular")

    // ✅ Ensure price and originalPrice are single values
    let priceValue = product.price
    let originalPriceValue = product.originalPrice

    if (Array.isArray(priceValue)) {
      priceValue = priceValue[0]
    }
    if (Array.isArray(originalPriceValue)) {
      originalPriceValue = originalPriceValue[0]
    }

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
      const existingImages = product.images.map((img, index) => ({
        file: null,
        name: `existing-image-${index}`,
        preview: img.url,
        sizeKB: 0,
        isExisting: true,
        imageId: img._id || img.id,
      }))
      setImages(existingImages)
    } else {
      setImages([])
    }

    if (product.videos && product.videos.length > 0) {
      const existingVideos = product.videos.map((video, index) => ({
        file: null,
        name: `existing-video-${index}`,
        preview: video.url,
        sizeKB: 0,
        isExisting: true,
        videoId: video._id || video.id,
      }))
      setVideos(existingVideos)
    } else {
      setVideos([])
    }

    setShowModal(true)
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    const wrapped = files.map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      sizeKB: Math.round(file.size / 1024),
    }))
    setImages((prev) => [...prev, ...wrapped])
  }

  const handleVideoChange = async (e) => {
    const files = Array.from(e.target.files || []);
    const validVideos = [];
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        alert(`❌ "${file.name}" exceeds 50 MB limit.`);
        continue;
      }
      const isValidDuration = await checkVideoDuration(file);
      if (!isValidDuration) {
        alert(`❌ "${file.name}" is longer than 30 seconds. Only the first 30 sec will be used, but please upload a shorter video.`);
        continue;
      }
      validVideos.push({
        file,
        name: file.name,
        preview: URL.createObjectURL(file),
        sizeKB: Math.round(file.size / 1024),
      });
    }
    setVideos((prev) => [...prev, ...validVideos]);
  };

  const checkVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration <= 31);
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(false);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { size: "", stock: 0 }],
    })
  }

  const updateSize = (index, field, value) => {
    const newSizes = [...formData.sizes]
    newSizes[index][field] = value
    setFormData({ ...formData, sizes: newSizes })
  }

  const removeSize = (index) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index)
    setFormData({ ...formData, sizes: newSizes })
  }

  const addColor = () => {
    setFormData({
      ...formData,
      colors: [...formData.colors, { name: "", code: "", images: [] }],
    })
  }

  const updateColor = (index, field, value) => {
    const newColors = [...formData.colors]
    newColors[index][field] = value
    setFormData({ ...formData, colors: newColors })
  }

  const removeColor = (index) => {
    const newColors = formData.colors.filter((_, i) => i !== index)
    setFormData({ ...formData, colors: newColors })
  }

  const moveImage = (index, direction) => {
    setImages((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return next
    })
  }

  const setAsFirst = (index) => {
    setImages((prev) => {
      if (index <= 0) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      return next
    })
  }

  const removeImage = (index) => {
    setImages((prev) => {
      const next = [...prev]
      const [removed] = next.splice(index, 1)
      try {
        if (removed?.preview) URL.revokeObjectURL(removed.preview)
      } catch (e) {
        return `Error occurred while revoking object URL: ${e.message}`
      }
      return next
    })
  }

  const moveVideo = (index, direction) => {
    setVideos((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return next
    })
  }

  const setAsFirstVideo = (index) => {
    setVideos((prev) => {
      if (index <= 0) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      return next
    })
  }

  const removeVideo = (index) => {
    setVideos((prev) => {
      const next = [...prev]
      const [removed] = next.splice(index, 1)
      try {
        if (removed?.preview) URL.revokeObjectURL(removed.preview)
      } catch (e) {
        return `Error occurred while revoking object URL: ${e.message}`
      }
      return next
    })
  }

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        try {
          if (img?.preview) URL.revokeObjectURL(img.preview)
        } catch (e) {
          console.log(e)
        }
      })
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-4 bg-white rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div></div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No products found</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 h-12">
                          <img className="object-cover w-12 h-12 rounded-lg" src={product.images[0]?.url || "/placeholder.jpg"} alt={product.name} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.isBulkProduct ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          <Package className="w-3 h-3 mr-1" /> BULK
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Regular</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.category?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{product.price}</div>
                      {product.originalPrice && (
                        <div className="text-sm text-gray-500 line-through">₹{product.originalPrice}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.stock}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="text-red-600 hover:text-red-900">
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
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <div className="flex justify-between flex-1 sm:hidden">
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                disabled={pagination.current === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                disabled={pagination.current === pagination.pages}
                className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.current - 1) * 10 + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(pagination.current * 10, pagination.total)}</span> of{" "}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setPagination({ ...pagination, current: page })}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.current
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative w-11/12 max-w-4xl p-5 mx-auto bg-white border rounded-md shadow-lg top-20">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Type Selection */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Product Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="regular"
                        checked={productType === "regular"}
                        onChange={() => setProductType("regular")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Regular Product</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="bulk"
                        checked={productType === "bulk"}
                        onChange={() => setProductType("bulk")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Package className="w-4 h-4" /> Bulk Pack Product
                      </span>
                    </label>
                  </div>
                </div>

                {/* Regular Fields */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Product Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-md" required disabled={editingProduct}>
                      <option value="">Select Category</option>
                      {categories.map((category) => (<option key={category._id} value={category._id}>{category.name}</option>))}
                    </select>
                    {editingProduct && <p className="mt-1 text-sm text-gray-500">Category cannot be changed when updating</p>}
                  </div>

                  {/* Price fields - Different for bulk */}
                  {productType === "bulk" ? (
                    <>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Price per Set (₹)</label>
                        <input type="number" value={bulkConfig.pricePerSet} onChange={(e) => setBulkConfig({ ...bulkConfig, pricePerSet: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Original Price per Set (₹)</label>
                        <input type="number" value={bulkConfig.originalPricePerSet} onChange={(e) => setBulkConfig({ ...bulkConfig, originalPricePerSet: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Price (₹)</label>
                        <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Original Price (₹)</label>
                        <input type="number" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Stock</label>
                    <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Weight (grams)</label>
                    <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-md" required />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Brand</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Factory Sale"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Fit</label>
                    <select value={formData.fits} onChange={(e) => setFormData({ ...formData, fits: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                      <option value="regular">Regular</option>
                      <option value="loose">Loose</option>
                      <option value="oversized">Oversized</option>
                      <option value="crop">Crop</option>
                      <option value="slim">Slim</option>
                      <option value="fitted">Fitted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Material</label>
                    <input type="text" value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Product Details</label>
                  <textarea value={formData.productDetails} onChange={(e) => setFormData({ ...formData, productDetails: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-md" />
                </div>

                {/* Bulk Configuration */}
                {productType === "bulk" && (
                  <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                    <h4 className="mb-3 text-sm font-semibold text-purple-800 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Bulk Configuration
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">Pieces per Size</label>
                        <input type="number" value={bulkConfig.piecesPerSize} onChange={(e) => setBulkConfig({ ...bulkConfig, piecesPerSize: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm border rounded-md" min="1" />
                        <p className="mt-1 text-xs text-gray-500">How many pieces of each size per set</p>
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">Min Colors to Select</label>
                        <input type="number" value={bulkConfig.minColorsToSelect} onChange={(e) => setBulkConfig({ ...bulkConfig, minColorsToSelect: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm border rounded-md" min="1" />
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">Max Colors to Select</label>
                        <input type="number" value={bulkConfig.maxColorsToSelect || ""} onChange={(e) => setBulkConfig({ ...bulkConfig, maxColorsToSelect: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-3 py-2 text-sm border rounded-md" />
                        <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-purple-600 italic">
                      💡 Customer will get {bulkConfig.piecesPerSize} piece(s) of each size per set, and can select {bulkConfig.minColorsToSelect}-{bulkConfig.maxColorsToSelect || "all"} colors.
                    </p>
                  </div>
                )}

                {/* Images Section */}
                <div>
                  <div className="flex flex-row justify-around">
                    <div className="w-full">
                      <label className="block mb-1 text-sm font-medium text-gray-700">Product Images</label>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div className="w-full">
                      <label className="block mb-1 text-sm font-medium text-gray-700">Product Videos</label>
                      <input
                        type="file"
                        multiple
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Select multiple images and video for the product</p>
                  {images.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-sm font-medium text-gray-700">Arrange images (first will be the cover)</div>
                      <div className="flex items-stretch overflow-x-auto gap-3 p-2 -m-2">
                        {images.map((img, index) => (
                          <div key={img.name + index} className="flex flex-col items-center justify-between p-2 border rounded-md min-w-[110px] max-w-[110px] bg-white">
                            <div className="relative w-[96px] h-[96px] overflow-hidden rounded">
                              <img src={img.preview || "/placeholder.svg"} alt={`preview ${index + 1}`} className="object-cover w-full h-full" draggable={false} />
                              {index === 0 && <span className="absolute top-1 left-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-600 text-white"><Star className="w-3 h-3" /> Cover</span>}
                              {img.isExisting && <span className="absolute top-1 right-1 inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-600 text-white">Current</span>}
                            </div>
                            <div className="mt-1 text-xs text-gray-600 font-medium">{img.isExisting ? "Current" : `${img.sizeKB} KB`}</div>
                            <div className="flex items-center gap-1 mt-2">
                              <button type="button" onClick={() => moveImage(index, -1)} className="inline-flex items-center justify-center w-7 h-7 rounded border text-gray-700 hover:bg-gray-50 disabled:opacity-40" disabled={index === 0}><ArrowUp className="w-4 h-4" /></button>
                              <button type="button" onClick={() => moveImage(index, 1)} className="inline-flex items-center justify-center w-7 h-7 rounded border text-gray-700 hover:bg-gray-50 disabled:opacity-40" disabled={index === images.length - 1}><ArrowDown className="w-4 h-4" /></button>
                              <button type="button" onClick={() => setAsFirst(index)} className="inline-flex items-center justify-center px-2 h-7 rounded border text-gray-700 hover:bg-gray-50">First</button>
                              <button type="button" onClick={() => removeImage(index)} className="inline-flex items-center justify-center px-2 h-7 rounded border text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">#{index + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {videos.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-sm font-medium text-gray-700">Arrange videos</div>
                      <div className="flex items-stretch overflow-x-auto gap-3 p-2 -m-2">
                        {videos.map((video, index) => (
                          <div key={video.name + index} className="flex flex-col items-center justify-between p-2 border rounded-md min-w-[110px] max-w-[110px] bg-white">
                            <div className="relative w-[96px] h-[96px] overflow-hidden rounded">
                              <img src={video.preview || "/placeholder.svg"} alt={`preview ${index + 1}`} className="object-cover w-full h-full" draggable={false} />
                              {index === 0 && <span className="absolute top-1 left-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-600 text-white"><Star className="w-3 h-3" /> Cover</span>}
                              {video.isExisting && <span className="absolute top-1 right-1 inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-600 text-white">Current</span>}
                            </div>
                            <div className="mt-1 text-xs text-gray-600 font-medium">{video.isExisting ? "Current" : `${video.sizeKB} KB`}</div>
                            <div className="flex items-center gap-1 mt-2">
                              <button type="button" onClick={() => moveVideo(index, -1)} className="inline-flex items-center justify-center w-7 h-7 rounded border text-gray-700 hover:bg-gray-50 disabled:opacity-40" disabled={index === 0}><ArrowUp className="w-4 h-4" /></button>
                              <button type="button" onClick={() => moveVideo(index, 1)} className="inline-flex items-center justify-center w-7 h-7 rounded border text-gray-700 hover:bg-gray-50 disabled:opacity-40" disabled={index === videos.length - 1}><ArrowDown className="w-4 h-4" /></button>
                              <button type="button" onClick={() => setAsFirstVideo(index)} className="inline-flex items-center justify-center px-2 h-7 rounded border text-gray-700 hover:bg-gray-50">First</button>
                              <button type="button" onClick={() => removeVideo(index)} className="inline-flex items-center justify-center px-2 h-7 rounded border text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">#{index + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Sizes Section */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Sizes</label>
                  {formData.sizes.map((size, index) => (
                    <div key={index} className="flex items-center mb-2 space-x-2">
                      <input type="text" placeholder="Size (e.g., S, M, L)" value={size.size} onChange={(e) => updateSize(index, "size", e.target.value)} className="flex-1 px-3 py-2 border rounded-md" />
                      <input type="number" placeholder="Stock" value={size.stock} onChange={(e) => updateSize(index, "stock", Number.parseInt(e.target.value))} className="w-24 px-3 py-2 border rounded-md" />
                      <button type="button" onClick={() => removeSize(index)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addSize} className="text-sm text-blue-600 hover:text-blue-800">+ Add Size</button>
                </div>

                {/* Colors Section */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Colors</label>
                  {formData.colors.map((color, index) => (
                    <div key={index} className="flex items-center mb-2 space-x-2">
                      <input type="text" placeholder="Color Name" value={color.name} onChange={(e) => updateColor(index, "name", e.target.value)} className="flex-1 px-3 py-2 border rounded-md" />
                      <input type="text" placeholder="Color Code (#hex)" value={color.code} onChange={(e) => updateColor(index, "code", e.target.value)} className="w-32 px-3 py-2 border rounded-md" />
                      <button type="button" onClick={() => removeColor(index)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addColor} className="text-sm text-blue-600 hover:text-blue-800">+ Add Color</button>
                </div>

                {/* Tags Section */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {["trending", "new-arrival", "sale", "featured", "bulk"].map((tag) => (
                      <label key={tag} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.tags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, tags: [...formData.tags, tag] })
                            } else {
                              setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{tag.replace("-", " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 space-x-3">
                  <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="px-4 py-2 text-gray-700 border rounded-md">Cancel</button>
                  <button type="submit" disabled={loading || isSubmitting} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
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