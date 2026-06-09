/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { Plus, Search, Edit, Trash2, ArrowUp, ArrowDown, Star, Package, Image as ImageIcon, X, ChevronDown, ChevronUp } from "lucide-react"
import adminAPI from "../../store/api/adminApi"
import { fetchCategories as fetchCategoriesAction } from "../../store/slices/categorySlice"
import toast from "react-hot-toast"  // ✅ YEH LINE ADD KARO

const ProductsManagement = () => {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [productType, setProductType] = useState("regular")
  const [expandedColors, setExpandedColors] = useState({})
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
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    colors: [],
    tags: [],
    weight: "",
    dimensions: { length: "", width: "", height: "" },
  })

  const [commonImages, setCommonImages] = useState([])
  const [videos, setVideos] = useState([])

  const mainCategories = categories.filter(cat => !cat.parentCategory)

  const getSubcategories = (parentId) => {
    if (!parentId) return []
    return categories.filter(cat =>
      cat.parentCategory && (
        cat.parentCategory === parentId ||
        cat.parentCategory?._id === parentId ||
        cat.parentCategory?.toString() === parentId.toString()
      )
    )
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [filters, searchTerm, pagination.current])

  useEffect(() => {
    if (formData.category) {
      setSubcategories(getSubcategories(formData.category))
    } else {
      setSubcategories([])
    }
  }, [formData.category, categories])

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

  // ==================== COLOR MANAGEMENT ====================
  
  const addColor = () => {
    setFormData({
      ...formData,
      colors: [
        ...formData.colors,
        {
          _id: null,
          name: "",
          code: "#000000",
          images: [],
          sizes: [],
          newImages: [],
          imagesToDelete: []
        }
      ],
    })
    // Auto expand the new color
    const newIndex = formData.colors.length
    setExpandedColors({ ...expandedColors, [newIndex]: true })
  }

  const updateColor = (colorIndex, field, value) => {
    const newColors = [...formData.colors]
    newColors[colorIndex][field] = value
    setFormData({ ...formData, colors: newColors })
  }

  const removeColor = (colorIndex) => {
    const newColors = formData.colors.filter((_, i) => i !== colorIndex)
    setFormData({ ...formData, colors: newColors })
    
    // Clean up expanded state
    const newExpanded = { ...expandedColors }
    delete newExpanded[colorIndex]
    setExpandedColors(newExpanded)
  }

  const toggleColorExpand = (colorIndex) => {
    setExpandedColors({
      ...expandedColors,
      [colorIndex]: !expandedColors[colorIndex]
    })
  }

  // ==================== SIZE MANAGEMENT PER COLOR ====================
  
  const addSizeToColor = (colorIndex, sizeName = "") => {
    const newColors = [...formData.colors]
    newColors[colorIndex].sizes.push({
      size: sizeName,
      stock: 0,
      variantId: null
    })
    setFormData({ ...formData, colors: newColors })
  }

  const updateColorSize = (colorIndex, sizeIndex, field, value) => {
    const newColors = [...formData.colors]
    newColors[colorIndex].sizes[sizeIndex][field] = field === 'stock' ? parseInt(value) || 0 : value
    setFormData({ ...formData, colors: newColors })
  }

  const removeColorSize = (colorIndex, sizeIndex) => {
    const newColors = [...formData.colors]
    newColors[colorIndex].sizes = newColors[colorIndex].sizes.filter((_, i) => i !== sizeIndex)
    setFormData({ ...formData, colors: newColors })
  }

  // ==================== COLOR IMAGE MANAGEMENT ====================
  
  const handleColorImageChange = (colorIndex, e) => {
    const files = Array.from(e.target.files)
    const newColors = [...formData.colors]
    
    files.forEach(file => {
      newColors[colorIndex].newImages.push({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        sizeKB: Math.round(file.size / 1024)
      })
    })
    
    setFormData({ ...formData, colors: newColors })
  }

  const removeColorImage = (colorIndex, imageIndex, isExisting = false, imageId = null) => {
    const newColors = [...formData.colors]
    
    if (isExisting && imageId) {
      // Mark existing image for deletion
      const imageToDelete = newColors[colorIndex].images.find(img => 
        img._id === imageId || img.publicId === imageId
      )
      if (imageToDelete) {
        newColors[colorIndex].imagesToDelete.push(imageToDelete)
        newColors[colorIndex].images = newColors[colorIndex].images.filter(img => 
          img._id !== imageId && img.publicId !== imageId
        )
      }
    } else {
      // Remove new image
      const removed = newColors[colorIndex].newImages.splice(imageIndex, 1)[0]
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
    }
    
    setFormData({ ...formData, colors: newColors })
  }

  const reorderColorImages = (colorIndex, fromIndex, toIndex) => {
    const newColors = [...formData.colors]
    const allImages = [...newColors[colorIndex].images, ...newColors[colorIndex].newImages]
    
    if (fromIndex >= 0 && toIndex >= 0 && fromIndex < allImages.length && toIndex < allImages.length) {
      const [moved] = allImages.splice(fromIndex, 1)
      allImages.splice(toIndex, 0, moved)
      
      // Separate back into existing and new
      const newExisting = allImages.filter(img => img.url && !img.file)
      const newNewImages = allImages.filter(img => img.file)
      
      newColors[colorIndex].images = newExisting
      newColors[colorIndex].newImages = newNewImages
      
      setFormData({ ...formData, colors: newColors })
    }
  }

  // ==================== COMMON FUNCTIONS ====================
  
  const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40"]

  const handleCommonImageChange = (e) => {
    const files = Array.from(e.target.files)
    const wrapped = files.map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      sizeKB: Math.round(file.size / 1024),
    }))
    setCommonImages((prev) => [...prev, ...wrapped])
  }

  const removeCommonImage = (index) => {
    const removed = commonImages[index]
    if (removed?.preview) URL.revokeObjectURL(removed.preview)
    setCommonImages(commonImages.filter((_, i) => i !== index))
  }

  const handleVideoChange = async (e) => {
    const files = Array.from(e.target.files)
    const validVideos = []
    
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        alert(`❌ "${file.name}" exceeds 50 MB limit.`)
        continue
      }
      validVideos.push({
        file,
        name: file.name,
        preview: URL.createObjectURL(file),
        sizeKB: Math.round(file.size / 1024),
      })
    }
    setVideos((prev) => [...prev, ...validVideos])
  }

  const removeVideo = (index) => {
    const removed = videos[index]
    if (removed?.preview) URL.revokeObjectURL(removed.preview)
    setVideos(videos.filter((_, i) => i !== index))
  }

 const handleSubmit = async (e) => {
  e.preventDefault()
  if (isSubmitting) return
  setIsSubmitting(true)
  setLoading(true)

  try {
    const formDataToSend = new FormData()

    // ========== BASIC FIELDS ==========
    formDataToSend.append("name", formData.name)
    formDataToSend.append("description", formData.description)
    formDataToSend.append("brand", formData.brand || "Factory Sale")
    formDataToSend.append("productDetails", formData.productDetails || "")
    formDataToSend.append("material", formData.material || "")
    formDataToSend.append("fits", formData.fits || "regular")
    formDataToSend.append("category", formData.category)
    if (formData.subcategory) formDataToSend.append("subcategory", formData.subcategory)
    formDataToSend.append("price", formData.price)
    if (formData.originalPrice) formDataToSend.append("originalPrice", formData.originalPrice)
    formDataToSend.append("tags", JSON.stringify(formData.tags))
    if (formData.weight) formDataToSend.append("weight", formData.weight)
    formDataToSend.append("dimensions", JSON.stringify(formData.dimensions))
    formDataToSend.append("isBulkProduct", productType === "bulk")
    
    if (productType === "bulk") {
      formDataToSend.append("bulkConfig", JSON.stringify(bulkConfig))
    }

    // ========== COLORS DATA (JSON) ==========
    const colorsToSend = formData.colors.map((color, idx) => ({
      _id: color._id,
      name: color.name,
      code: color.code,
      sizes: color.sizes.map(size => ({
        size: size.size,
        stock: Number(size.stock) || 0,
        variantId: size.variantId
      })),
      existingImages: color.images.map(img => ({ 
        url: img.url, 
        publicId: img.publicId,
        _id: img._id 
      })),
      imagesToDelete: color.imagesToDelete.map(img => img.publicId || img._id)
    }))
    formDataToSend.append("colors", JSON.stringify(colorsToSend))
    
    // ========== COLOR IMAGES (Sab ek field mein) ==========
    formData.colors.forEach((color, colorIndex) => {
      color.newImages.forEach((img, imgIndex) => {
        // Filename mein colorIndex store kar rahe hain taaki backend ko pata chale
        const newFileName = `${colorIndex}_${imgIndex}_${img.file.name}`
        const fileWithMeta = new File([img.file], newFileName, { type: img.file.type })
        formDataToSend.append('colorImages', fileWithMeta)
      })
    })
    
    // ========== COMMON IMAGES ==========
    commonImages.forEach((img) => {
      if (img.file) formDataToSend.append("commonImages", img.file)
    })
    
    // ========== VIDEOS ==========
    videos.forEach((video) => {
      if (video.file) formDataToSend.append("videos", video.file)
    })

    // ========== SUBMIT TO API ==========
    if (editingProduct) {
      await adminAPI.updateProduct(editingProduct._id, formDataToSend)
      toast.success("Product updated successfully!")
    } else {
      await adminAPI.createProduct(formDataToSend)
      toast.success("Product created successfully!")
    }

    // ========== RESET FORM AND REFRESH ==========
    setShowModal(false)
    resetForm()
    fetchProducts()
    dispatch(fetchCategoriesAction())
    
  } catch (error) {
    console.error("Error saving product:", error)
    toast.error(error?.response?.data?.message || "Failed to save product")
  } finally {
    setLoading(false)
    setIsSubmitting(false)
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
    colors: [],
    tags: [],
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
  setCommonImages([])
  setVideos([])
  setEditingProduct(null)
  setSubcategories([])
  setExpandedColors({})
}

  const openEditModal = (product) => {
  setEditingProduct(product)
  const isBulk = product.isBulkProduct === true
  setProductType(isBulk ? "bulk" : "regular")

  // Transform product colors to form format
  const transformedColors = (product.colors || []).map(color => ({
    _id: color._id,
    name: color.name || "",
    code: color.code || "#000000",
    images: (color.images || []).map(img => ({
      ...img,
      url: img.url,
      publicId: img.publicId,
      _id: img._id
    })),
    sizes: (color.sizes || []).map(size => ({
      size: size.size,
      stock: size.stock || 0,
      variantId: size.variantId
    })),
    newImages: [],
    imagesToDelete: []
  }))

  setFormData({
    name: product.name || "",
    brand: product.brand || "Factory Sale",
    productDetails: product.productDetails || "",
    material: product.material || "",
    fits: product.fits || "regular",
    description: product.description || "",
    price: product.price || "",
    originalPrice: product.originalPrice || "",
    category: product.category?._id || product.category || "",
    subcategory: product.subcategory || "",
    colors: transformedColors,
    tags: product.tags || [],
    weight: product.weight || "",
    dimensions: product.dimensions || { length: "", width: "", height: "" },
  })

  if (product.category?._id || product.category) {
    const parentId = product.category?._id || product.category
    setSubcategories(getSubcategories(parentId))
  }

  if (isBulk && product.bulkConfig) {
    setBulkConfig({
      piecesPerSize: product.bulkConfig.piecesPerSize || 1,
      minColorsToSelect: product.bulkConfig.minColorsToSelect || 1,
      maxColorsToSelect: product.bulkConfig.maxColorsToSelect || null,
      pricePerSet: product.bulkConfig.pricePerSet || product.price,
      originalPricePerSet: product.bulkConfig.originalPricePerSet || product.originalPrice,
    })
  }

  // Set common images
  if (product.commonImages) {
    setCommonImages(product.commonImages.map((img, idx) => ({
      file: null,
      preview: img.url,
      isExisting: true,
      imageId: img._id,
      publicId: img.publicId
    })))
  }

  // Set videos
  if (product.videos) {
    setVideos(product.videos.map((video, idx) => ({
      file: null,
      preview: video.url,
      isExisting: true,
      videoId: video._id
    })))
  }

  setShowModal(true)
}

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await adminAPI.deleteProduct(productId)
        fetchProducts()
        dispatch(fetchCategoriesAction())
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }
  }

  // Helper to get total stock across all colors and sizes
  const getTotalStock = (product) => {
    if (!product.colors) return product.stock || 0
    return product.colors.reduce((total, color) => {
      return total + (color.sizes?.reduce((sum, size) => sum + (size.stock || 0), 0) || 0)
    }, 0)
  }

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

      {/* Filters Section */}
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
            {mainCategories.map((category) => (
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
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Colors</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div></div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No products found</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 h-12">
                          <img 
                            className="object-cover w-12 h-12 rounded-lg" 
                            src={product.commonImages?.[0]?.url || product.colors?.[0]?.images?.[0]?.url || "/placeholder.jpg"} 
                            alt={product.name} 
                          />
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
                      <div className="flex flex-wrap gap-1">
                        {product.colors?.slice(0, 3).map((color, idx) => (
                          <div 
                            key={idx}
                            className="w-5 h-5 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.code || "#000" }}
                            title={color.name}
                          />
                        ))}
                        {product.colors?.length > 3 && (
                          <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
                        )}
                      </div>
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
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.current
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

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative w-11/12 max-w-6xl p-5 mx-auto bg-white border rounded-md shadow-lg top-10">
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

                {/* Basic Information Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Product Name *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full px-3 py-2 border rounded-md" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value, subcategory: "" })
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                      disabled={editingProduct}
                    >
                      <option value="">Select Category</option>
                      {mainCategories.map((category) => (
                        <option key={category._id} value={category._id}>{category.name}</option>
                      ))}
                    </select>
                    {editingProduct && <p className="mt-1 text-xs text-gray-500">Category cannot be changed</p>}
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Subcategory</label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={!formData.category || editingProduct}
                    >
                      <option value="">Select Subcategory (Optional)</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>
                      ))}
                    </select>
                  </div>

                  {productType === "bulk" ? (
                    <>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Price per Set (₹) *</label>
                        <input 
                          type="number" 
                          value={bulkConfig.pricePerSet} 
                          onChange={(e) => setBulkConfig({ ...bulkConfig, pricePerSet: e.target.value })} 
                          className="w-full px-3 py-2 border rounded-md" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Original Price per Set</label>
                        <input 
                          type="number" 
                          value={bulkConfig.originalPricePerSet} 
                          onChange={(e) => setBulkConfig({ ...bulkConfig, originalPricePerSet: e.target.value })} 
                          className="w-full px-3 py-2 border rounded-md" 
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Price (₹) *</label>
                        <input 
                          type="number" 
                          value={formData.price} 
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                          className="w-full px-3 py-2 border rounded-md" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Original Price</label>
                        <input 
                          type="number" 
                          value={formData.originalPrice} 
                          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} 
                          className="w-full px-3 py-2 border rounded-md" 
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Weight (grams)</label>
                    <input 
                      type="number" 
                      value={formData.weight} 
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                      className="w-full px-3 py-2 border rounded-md" 
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Brand</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="e.g., Factory Sale"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Fit</label>
                    <select 
                      value={formData.fits} 
                      onChange={(e) => setFormData({ ...formData, fits: e.target.value })} 
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="regular">Regular</option>
                      <option value="loose">Loose</option>
                      <option value="oversized">Oversized</option>
                      <option value="crop">Crop</option>
                      <option value="slim">Slim</option>
                      <option value="fitted">Fitted</option>
                      <option value="Mom">Mom</option>
                      <option value="Baggy">Baggy</option>
                      <option value="Straight">Straight</option>
                      <option value="Wide leg">Wide leg</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Material</label>
                    <input 
                      type="text" 
                      value={formData.material} 
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })} 
                      className="w-full px-3 py-2 border rounded-md" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Description *</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    rows={3} 
                    className="w-full px-3 py-2 border rounded-md" 
                    required 
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Product Details</label>
                  <textarea 
                    value={formData.productDetails} 
                    onChange={(e) => setFormData({ ...formData, productDetails: e.target.value })} 
                    rows={3} 
                    className="w-full px-3 py-2 border rounded-md" 
                  />
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
                        <input 
                          type="number" 
                          value={bulkConfig.piecesPerSize} 
                          onChange={(e) => setBulkConfig({ ...bulkConfig, piecesPerSize: parseInt(e.target.value) })} 
                          className="w-full px-3 py-2 text-sm border rounded-md" 
                          min="1" 
                        />
                        <p className="mt-1 text-xs text-gray-500">How many pieces of each size per set</p>
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">Min Colors to Select</label>
                        <input 
                          type="number" 
                          value={bulkConfig.minColorsToSelect} 
                          onChange={(e) => setBulkConfig({ ...bulkConfig, minColorsToSelect: parseInt(e.target.value) })} 
                          className="w-full px-3 py-2 text-sm border rounded-md" 
                          min="1" 
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">Max Colors to Select</label>
                        <input 
                          type="number" 
                          value={bulkConfig.maxColorsToSelect || ""} 
                          onChange={(e) => setBulkConfig({ ...bulkConfig, maxColorsToSelect: e.target.value ? parseInt(e.target.value) : null })} 
                          className="w-full px-3 py-2 text-sm border rounded-md" 
                        />
                        <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== COLORS SECTION (ENHANCED) ==================== */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">Colors & Variants</label>
                    <button
                      type="button"
                      onClick={addColor}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                    >
                      + Add Color
                    </button>
                  </div>

                  {formData.colors.length === 0 && (
                    <div className="py-8 text-center text-gray-400 border-2 border-dashed rounded-lg">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No colors added yet. Click "Add Color" to get started.</p>
                    </div>
                  )}

                  {formData.colors.map((color, colorIndex) => (
                    <div key={colorIndex} className="mb-4 border rounded-lg overflow-hidden">
                      {/* Color Header */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                        onClick={() => toggleColorExpand(colorIndex)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full border border-gray-300 shadow-sm"
                            style={{ backgroundColor: color.code || "#000000" }}
                          />
                          <div>
                            <span className="font-medium">
                              {color.name || `Color ${colorIndex + 1}`}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              ({color.sizes.length} sizes, {color.images.length + color.newImages.length} images)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeColor(colorIndex) }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {expandedColors[colorIndex] ? 
                            <ChevronUp className="w-5 h-5 text-gray-500" /> : 
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          }
                        </div>
                      </div>

                      {/* Color Details (Expandable) */}
                      {expandedColors[colorIndex] && (
                        <div className="p-4 space-y-4">
                          {/* Color Basic Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Color Name</label>
                              <input
                                type="text"
                                value={color.name}
                                onChange={(e) => updateColor(colorIndex, "name", e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded-md"
                                placeholder="e.g., Red, Blue, Black"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Color Code</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={color.code}
                                  onChange={(e) => updateColor(colorIndex, "code", e.target.value)}
                                  className="w-12 h-10 p-1 border rounded-md"
                                />
                                <input
                                  type="text"
                                  value={color.code}
                                  onChange={(e) => updateColor(colorIndex, "code", e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border rounded-md"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Color Images */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Images for {color.name || "this color"}
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleColorImageChange(colorIndex, e)}
                              className="w-full px-3 py-2 text-sm border rounded-md"
                            />
                            
                            {/* Image Gallery */}
                            {([...color.images, ...color.newImages]).length > 0 && (
                              <div className="flex flex-wrap gap-3 mt-3">
                                {[...color.images, ...color.newImages].map((img, imgIndex) => {
                                  const isExisting = img.url && !img.file
                                  const imgId = img._id || img.publicId
                                  return (
                                    <div key={imgIndex} className="relative group">
                                      <img
                                        src={img.preview || img.url}
                                        alt={`${color.name} ${imgIndex + 1}`}
                                        className="object-cover w-20 h-20 rounded-lg border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeColorImage(colorIndex, imgIndex, isExisting, imgId)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                      {imgIndex === 0 && (
                                        <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/50 text-white rounded-b-lg">
                                          Main
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              First image will be the main image for this color
                            </p>
                          </div>

                          {/* Size & Stock Matrix for this Color */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Size & Stock for {color.name || "this color"}
                            </label>
                            
                            <div className="space-y-2">
                              {color.sizes.map((sizeItem, sizeIndex) => (
                                <div key={sizeIndex} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={sizeItem.size}
                                    onChange={(e) => updateColorSize(colorIndex, sizeIndex, "size", e.target.value)}
                                    className="w-24 px-3 py-2 text-sm border rounded-md"
                                    placeholder="Size"
                                    list="common-sizes-list"
                                  />
                                  <input
                                    type="number"
                                    value={sizeItem.stock}
                                    onChange={(e) => updateColorSize(colorIndex, sizeIndex, "stock", e.target.value)}
                                    className="w-32 px-3 py-2 text-sm border rounded-md"
                                    placeholder="Stock"
                                    min="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeColorSize(colorIndex, sizeIndex)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add Size Button */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <input
                                type="text"
                                id={`new-size-${colorIndex}`}
                                placeholder="New size..."
                                className="px-3 py-1 text-sm border rounded-md w-24"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const input = e.target
                                    if (input.value.trim()) {
                                      addSizeToColor(colorIndex, input.value.trim())
                                      input.value = ''
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(`new-size-${colorIndex}`)
                                  if (input && input.value.trim()) {
                                    addSizeToColor(colorIndex, input.value.trim())
                                    input.value = ''
                                  }
                                }}
                                className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                              >
                                Add Size
                              </button>
                            </div>

                            {/* Quick Size Buttons */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {commonSizes.map((sizeName) => (
                                <button
                                  key={sizeName}
                                  type="button"
                                  onClick={() => {
                                    if (!color.sizes.some(s => s.size === sizeName)) {
                                      addSizeToColor(colorIndex, sizeName)
                                    }
                                  }}
                                  className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                                >
                                  + {sizeName}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Common Images Section */}
                <div className="p-4 border rounded-lg">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Common Product Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleCommonImageChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  {commonImages.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {commonImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img.preview}
                            alt={`Common ${idx + 1}`}
                            className="object-cover w-20 h-20 rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeCommonImage(idx)}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    These images will appear in product gallery along with color images
                  </p>
                </div>

                {/* Videos Section */}
                <div className="p-4 border rounded-lg">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Product Videos (Max 30 sec each)</label>
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  {videos.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {videos.map((video, idx) => (
                        <div key={idx} className="relative group">
                          <video src={video.preview} className="object-cover w-24 h-24 rounded-lg border" />
                          <button
                            type="button"
                            onClick={() => removeVideo(idx)}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {["trending", "new-arrival", "sale", "featured"].map((tag) => (
                      <label key={tag} className="flex items-center gap-1">
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
                          className="mr-1"
                        />
                        <span className="text-sm capitalize">{tag.replace("-", " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end pt-4 space-x-3">
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); resetForm() }} 
                    className="px-4 py-2 text-gray-700 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading || isSubmitting} 
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Datalist for common sizes */}
      <datalist id="common-sizes-list">
        {commonSizes.map(size => <option key={size} value={size} />)}
      </datalist>
    </div>
  )
}

export default ProductsManagement