"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSearchParams, useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Filter, ChevronDown, SlidersHorizontal } from "lucide-react"
import toast from "react-hot-toast"

// Redux actions
import { fetchProducts, setFilters, clearFilters } from "../store/slices/productSlice"
import { fetchCategories } from "../store/slices/categorySlice"
import { addToCart, optimisticAddToCart } from "../store/slices/cartSlice"
import { 
  optimisticAddToWishlist, 
  optimisticRemoveFromWishlist,
  addToWishlist,
  removeFromWishlist
} from "../store/slices/wishlistSlice"

// Components
import ProductFilters from "../components/ProductFilter"
import CategoryBanner from "../components/CategoryBanner"
import ProductCard from "../components/ProductCard"

// Selectors
const selectProducts = (state) => state.products
const selectCategories = (state) => state.categories
const selectAuth = (state) => state.auth
const selectWishlist = (state) => state.wishlist

const ProductsPage = () => {
  const { category: categorySlug } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [isFilterInitialized, setIsFilterInitialized] = useState(false)
  const [sortBy, setSortBy] = useState("newest")
  const [showSortMenu, setShowSortMenu] = useState(false)

  // Selectors
  const { products, isLoading, error, filters } = useSelector(selectProducts)
  const { categories } = useSelector(selectCategories)
  const { user } = useSelector(selectAuth)
  const { items: wishlistItems } = useSelector(selectWishlist)

  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
  ]

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.category && filters.category !== "") count++
    if (filters.subcategory && filters.subcategory !== "") count++
    if (filters.search && filters.search !== "") count++
    if (filters.minPrice && filters.minPrice !== "") count++
    if (filters.maxPrice && filters.maxPrice !== "") count++
    if (filters.minRating && filters.minRating !== "") count++
    if (filters.sizes && filters.sizes.length > 0) count++
    if (filters.colors && filters.colors.length > 0) count++
    if (filters.gender && filters.gender !== "") count++
    if (filters.brands && filters.brands.length > 0) count++
    return count
  }, [filters])

  // Fetch categories once
  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters = {
      category: searchParams.get("category") || categorySlug || "",
      subcategory: searchParams.get("subcategory") || "",
      search: searchParams.get("search") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      minRating: searchParams.get("minRating") || "",
      sizes: searchParams.getAll("size") || [],
      colors: searchParams.getAll("color") || [],
      gender: searchParams.get("gender") || "",
      brands: searchParams.getAll("brand") || [],
    }
    
    let hasChanges = false
    for (const key in urlFilters) {
      const currentValue = filters[key]
      const newValue = urlFilters[key]
      
      if (Array.isArray(currentValue) && Array.isArray(newValue)) {
        if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
          hasChanges = true
          break
        }
      } else if (currentValue !== newValue) {
        hasChanges = true
        break
      }
    }
    
    if (hasChanges) {
      dispatch(setFilters(urlFilters))
    }
    setIsFilterInitialized(true)
  }, [dispatch, categorySlug, searchParams])

  // Sync categorySlug → URL and Redux
  useEffect(() => {
    if (categorySlug && isFilterInitialized) {
      const newParams = new URLSearchParams(searchParams)
      if (categorySlug) {
        newParams.set("category", categorySlug)
      } else {
        newParams.delete("category")
      }
      setSearchParams(newParams, { replace: true })
      
      if (filters.category !== categorySlug) {
        dispatch(setFilters({ ...filters, category: categorySlug }))
      }
    }
  }, [categorySlug, dispatch, filters, isFilterInitialized, searchParams, setSearchParams])

  // Fetch products when filters change
  useEffect(() => {
    if (isFilterInitialized) {
      const queryParams = {}
      
      if (filters.category && filters.category !== "") queryParams.category = filters.category
      if (filters.subcategory && filters.subcategory !== "") queryParams.subcategory = filters.subcategory
      if (filters.search && filters.search !== "") queryParams.search = filters.search
      if (filters.minPrice && filters.minPrice !== "") queryParams.minPrice = filters.minPrice
      if (filters.maxPrice && filters.maxPrice !== "") queryParams.maxPrice = filters.maxPrice
      if (filters.minRating && filters.minRating !== "") queryParams.minRating = filters.minRating
      if (filters.sizes && filters.sizes.length > 0) queryParams.sizes = filters.sizes
      if (filters.colors && filters.colors.length > 0) queryParams.colors = filters.colors
      if (filters.gender && filters.gender !== "") queryParams.gender = filters.gender
      if (filters.brands && filters.brands.length > 0) queryParams.brands = filters.brands
      if (sortBy) queryParams.sort = sortBy
      
      dispatch(fetchProducts(queryParams))
    }
  }, [dispatch, filters, isFilterInitialized, sortBy])

  // Add to cart
  const handleAddToCart = useCallback(
    async (product, e) => {
      e.preventDefault()
      e.stopPropagation()
      const cartItem = {
        productId: product._id,
        quantity: 1,
        size: product.sizes?.[0]?.size || "",
        color: product.colors?.[0]?.name || "",
      }
      dispatch(
        optimisticAddToCart({
          product,
          quantity: 1,
          size: cartItem.size,
          color: cartItem.color,
        }),
      )
      try {
        await dispatch(addToCart(cartItem)).unwrap()
        toast.success(`${product.name} added to cart!`)
      } catch (error) {
        toast.error("Failed to add item to cart. Please try again.")
      }
    },
    [dispatch],
  )

  // Wishlist handler
  const handleWishlist = useCallback(
    async (product, e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const isInWishlist = wishlistItems.some((item) => item._id === product._id)
      if (isInWishlist) {
        dispatch(optimisticRemoveFromWishlist(product._id))
        toast.success(`${product.name} removed from wishlist!`)
        await dispatch(removeFromWishlist(product._id)).unwrap()
      } else {
        dispatch(optimisticAddToWishlist(product))
        toast.success(`${product.name} added to wishlist!`)
        await dispatch(addToWishlist(product)).unwrap()
      }
    },
    [dispatch, wishlistItems],
  )

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilters) => {
      const mergedFilters = { ...filters, ...newFilters }
      dispatch(setFilters(mergedFilters))

      const newParams = new URLSearchParams()
      
      if (mergedFilters.category && mergedFilters.category !== "") 
        newParams.set("category", mergedFilters.category)
      if (mergedFilters.subcategory && mergedFilters.subcategory !== "") 
        newParams.set("subcategory", mergedFilters.subcategory)
      if (mergedFilters.search && mergedFilters.search !== "") 
        newParams.set("search", mergedFilters.search)
      if (mergedFilters.minPrice && mergedFilters.minPrice !== "") 
        newParams.set("minPrice", mergedFilters.minPrice)
      if (mergedFilters.maxPrice && mergedFilters.maxPrice !== "") 
        newParams.set("maxPrice", mergedFilters.maxPrice)
      if (mergedFilters.minRating && mergedFilters.minRating !== "") 
        newParams.set("minRating", mergedFilters.minRating)
      if (mergedFilters.gender && mergedFilters.gender !== "") 
        newParams.set("gender", mergedFilters.gender)
      
      if (mergedFilters.sizes && mergedFilters.sizes.length > 0) {
        mergedFilters.sizes.forEach(size => newParams.append("size", size))
      }
      if (mergedFilters.colors && mergedFilters.colors.length > 0) {
        mergedFilters.colors.forEach(color => newParams.append("color", color))
      }
      if (mergedFilters.brands && mergedFilters.brands.length > 0) {
        mergedFilters.brands.forEach(brand => newParams.append("brand", brand))
      }
      
      setSearchParams(newParams)
    },
    [dispatch, filters, setSearchParams],
  )

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const emptyFilters = {
      category: "",
      subcategory: "",
      search: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      sizes: [],
      colors: [],
      gender: "",
      brands: [],
    }
    dispatch(setFilters(emptyFilters))
    setSearchParams({})
    toast.success("All filters cleared")
  }, [dispatch, setSearchParams])

  // Get current sort label
  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || "Sort by"

  return (
    <div className="min-h-screen bg-gray-50 mt-10 ">
      {/* Mobile Header - Filter and Sort Bar (only visible on mobile) */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm md:hidden">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg active:bg-gray-200 transition-colors flex-1"
              style={{ height: '40px' }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs text-white bg-red-500 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
           
            
            {/* Clear Filters Button (only if filters active) */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-sm text-red-500 whitespace-nowrap active:text-red-600"
                style={{ height: '40px' }}
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Active Filters Chips - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pb-1 overflow-x-auto">
              {filters.category && filters.category !== "" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full whitespace-nowrap">
                  {categories.find(c => c.slug === filters.category)?.name || filters.category}
                  <button onClick={() => handleFilterChange({ category: "" })} className="hover:text-red-800">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.subcategory && filters.subcategory !== "" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full whitespace-nowrap">
                  Sub: {categories.find(c => c.slug === filters.subcategory)?.name || filters.subcategory}
                  <button onClick={() => handleFilterChange({ subcategory: "" })} className="hover:text-red-800">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full whitespace-nowrap">
                  ₹{filters.minPrice || "0"} - ₹{filters.maxPrice || "∞"}
                  <button onClick={() => handleFilterChange({ minPrice: "", maxPrice: "" })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.minRating && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-50 text-yellow-600 rounded-full whitespace-nowrap">
                  {filters.minRating}+ Stars
                  <button onClick={() => handleFilterChange({ minRating: "" })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="">
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          
          {/* Desktop Sidebar - Always visible on desktop */}
          <aside className="hidden md:block md:w-64 lg:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilters
                filters={filters}
                categories={categories}
                onFilterChange={handleFilterChange}
                onClearFilters={clearAllFilters}
                onClose={() => {}}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Results Count - Desktop */}
            <div className="hidden md:flex mb-1 items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{products.length}</span> products
                {activeFiltersCount > 0 && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({activeFiltersCount} filters applied)
                  </span>
                )}
              </p>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12 sm:py-20">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                <div className="p-4 sm:p-6 rounded-lg bg-red-50">
                  <h3 className="mb-2 text-base sm:text-lg font-semibold text-red-800">Error Loading Products</h3>
                  <p className="text-xs sm:text-sm text-red-600">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 mt-3 text-xs sm:text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                <div className="p-4 sm:p-6 bg-gray-100 rounded-lg">
                  <h3 className="mb-2 text-base sm:text-lg font-semibold text-gray-800">No Products Found</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Try adjusting your filters or search criteria.</p>
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1.5 mt-3 text-xs sm:text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Results Count - Mobile */}
                <div className="md:hidden mb-3">
                  <p className="text-xs text-gray-500">
                    Found <span className="font-semibold text-gray-700">{products.length}</span> products
                  </p>
                </div>
                
                {/* Product Grid - Responsive */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                  <AnimatePresence>
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        wishlistItems={wishlistItems}
                        user={user}
                        onAddToCart={handleAddToCart}
                        onWishlist={handleWishlist}
                        className="rounded-lg sm:rounded-xl"
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 left-0 w-[85%] max-w-sm h-full bg-white shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 120px)' }}>
                <ProductFilters
                  filters={filters}
                  categories={categories}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearAllFilters}
                  onClose={() => setShowFilters(false)}
                />
              </div>
              <div className="sticky bottom-0 z-10 flex justify-between gap-3 p-4 bg-white border-t border-gray-200">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-red-500 border border-red-500 rounded-lg hover:bg-red-50"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg bg-red-500 hover:bg-red-600"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProductsPage