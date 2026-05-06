"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSearchParams, useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
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
// import Preloader from "../components/Preloader"

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

  // Selectors
  const { products, isLoading, error, filters } = useSelector(selectProducts)
  const { categories } = useSelector(selectCategories)
  const { user } = useSelector(selectAuth)
  const { items: wishlistItems } = useSelector(selectWishlist)

  // ✅ Count active filters
  const activeFiltersCount = useMemo(
    () =>
      Object.entries(filters).reduce((count, [key, value]) => {
        if (Array.isArray(value) ? value.length > 0 : Boolean(value)) {
          return count + 1
        }
        return count
      }, 0),
    [filters],
  )

  // ✅ Extract filters from URL params
  const getFiltersFromURL = useCallback(() => {
    const urlFilters = {
      category: searchParams.get("category") || "",
      search: searchParams.get("search") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      minRating: searchParams.get("minRating") || "",
    }
    return urlFilters
  }, [searchParams])

  // ✅ Fetch categories once
  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  // ✅ Sync categorySlug → Redux filters
  useEffect(() => {
    if (categorySlug) {
      dispatch(setFilters((prev) => ({ ...prev, category: categorySlug })))
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.set("category", categorySlug)
        return newParams
      })
    } else {
      dispatch(setFilters((prev) => ({ ...prev, category: "" })))
    }
  }, [categorySlug, dispatch, setSearchParams])

  // ✅ Sync URL → Redux filters
  useEffect(() => {
    const urlFilters = getFiltersFromURL()
    dispatch(setFilters(urlFilters))
  }, [searchParams, getFiltersFromURL, dispatch])

  // ✅ Fetch products when filters change
  useEffect(() => {
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) acc[key] = value
      } else if (value !== "" && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {})
    dispatch(fetchProducts({ ...cleanFilters, limit: 100 }))
  }, [dispatch, filters])

  // ✅ Add to cart
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

  // ✅ Wishlist handler
  const handleWishlist = useCallback(
    async (product, e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const isInWishlist = wishlistItems.some((item) => item._id === product._id)
      if (isInWishlist) {
        // Optimistically remove from wishlist
        dispatch(optimisticRemoveFromWishlist(product._id))
        toast.success(`${product.name} removed from wishlist!`)
        await dispatch(removeFromWishlist(product._id)).unwrap()
      } else {
        // Optimistically add to wishlist
        dispatch(optimisticAddToWishlist(product))
        toast.success(`${product.name} added to wishlist!`)
        await dispatch(addToWishlist(product)).unwrap()
      }
    },
    [dispatch, wishlistItems],
  )

  // ✅ Handle filter change → Update Redux + URL
  const handleFilterChange = useCallback(
    (newFilters) => {
      const mergedFilters = { ...filters, ...newFilters }
      dispatch(setFilters(mergedFilters))

      const newParams = new URLSearchParams()
      Object.entries(mergedFilters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach((v) => newParams.append(key, v))
        } else if (value) {
          newParams.set(key, value)
        }
      })
      setSearchParams(newParams)
    },
    [dispatch, filters, setSearchParams],
  )

  // ✅ Clear all filters
  const clearAllFilters = useCallback(() => {
    dispatch(clearFilters())
    setSearchParams({})
  }, [dispatch, setSearchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-2 pt-2 mx-auto md:pt-8">
        {/* Category Banner */}
        <div className="w-full mb-4 rounded-lg">
          <CategoryBanner />
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden md:block md:w-56 lg:w-64 sticky top-[180px] h-[calc(100vh-180px)] overflow-y-auto">
            <ProductFilters
              key={categorySlug || "all"}
              filters={filters}
              categories={categories}
              onFilterChange={handleFilterChange}
              onClearFilters={clearAllFilters}
            />
          </aside>

          {/* Products Grid */}
          <main className="flex-1 rounded-xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                {/* <Preloader /> */}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-6 rounded-lg bg-red-50">
                  <h3 className="mb-2 text-lg font-semibold text-red-800">Error Loading Products</h3>
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 mt-3 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-6 bg-gray-100 rounded-lg">
                  <h3 className="mb-2 text-lg font-semibold text-gray-800">No Products Found</h3>
                  <p className="text-sm text-gray-600">Try adjusting your filters or search criteria.</p>
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1.5 mt-3 text-sm text-white bg-ksauni-red rounded-lg hover:bg-ksauni-dark-red"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 rounded-xl">
                <AnimatePresence>
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      wishlistItems={wishlistItems}
                      user={user}
                      onAddToCart={handleAddToCart}
                      onWishlist={handleWishlist}
                      className="rounded-xl"
                    />
                  ))}
                </AnimatePresence>
              </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 md:hidden"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md max-h-[90vh] mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
                <ProductFilters
                  key={categorySlug || "all"}
                  filters={filters}
                  categories={categories}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearAllFilters}
                />
              </div>
              <div className="sticky bottom-0 z-10 flex justify-between p-4 bg-white border-t border-gray-200">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm font-medium text-ksauni-red hover:text-ksauni-dark-red"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-ksauni-red hover:bg-ksauni-dark-red"
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
