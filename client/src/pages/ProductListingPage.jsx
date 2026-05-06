"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Grid, List, Filter, Search, X, Star } from "lucide-react";
import { fetchProducts, setFilters, clearFilters } from "../store/slices/productSlice";
import { fetchCategories } from "../store/slices/categorySlice";
import {
  addToWishlist,
  removeFromWishlist,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist,
} from "../store/slices/wishlistSlice";
import { addToCart, optimisticAddToCart } from "../store/slices/cartSlice";
import { useDebounce } from "use-debounce";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import toast from "react-hot-toast";
import FreeShippingNotice from "../components/FreeShippingNotice";
import CategoryBanner from "../components/CategoryBanner";
// import Preloader from "../components/Preloader";
const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [localFilters, setLocalFilters] = useState({
    category: searchParams.get("category") || "",
    priceRange: [0, 10000],
    sizes: [],
    colors: [],
    rating: 0,
    sortBy: "newest",
    search: searchParams.get("search") || "",
  });
  const [debouncedFilters] = useDebounce(localFilters, 500);
  const { products, filters, pagination, isLoading } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { user } = useSelector((state) => state.auth);
  const [viewMode, setViewMode] = useState(() => {
    if (window.innerWidth < 768) {
      return "grid";
    }
    return "grid";
  });
  const [showFilters, setShowFilters] = useState(false);
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "popular", label: "Most Popular" },
  ];
  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
  const colorOptions = [
    { name: "Red", value: "#FF6B35" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#FFFFFF" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Pink", value: "#EC4899" },
    { name: "Yellow", value: "#F59E0B" },
    { name: "Purple", value: "#8B5CF6" },
  ];
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  useEffect(() => {
    const params = {
      page: 1,
      limit: 20,
      ...debouncedFilters,
    };
    dispatch(fetchProducts(params));
    dispatch(setFilters(debouncedFilters));
  }, [dispatch, debouncedFilters]);
  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const handleSizeToggle = (size) => {
    setLocalFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
    }));
  };
  const handleColorToggle = (color) => {
    setLocalFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color) ? prev.colors.filter((c) => c !== color) : [...prev.colors, color],
    }));
  };
  const handleClearFilters = () => {
    setLocalFilters({
      category: "",
      priceRange: [0, 10000],
      sizes: [],
      colors: [],
      rating: 0,
      sortBy: "newest",
      search: "",
    });
    dispatch(clearFilters());
    setSearchParams({});
  };
  const handleWishlistToggle = async (product) => {
    try {
      const isInWishlist = wishlistItems.some((item) => item._id === product._id);
      if (isInWishlist) {
        dispatch(optimisticRemoveFromWishlist(product._id));
        toast.success(`${product.name} removed from wishlist!`);
        await dispatch(removeFromWishlist(product._id)).unwrap();
      } else {
        dispatch(optimisticAddToWishlist(product));
        toast.success(`${product.name} added to wishlist!`);
        await dispatch(addToWishlist(product)).unwrap();
      }
      const wishElement = document.querySelector("#wish");
      if (wishElement) {
        wishElement.style.transform = "scale(1.2)";
        setTimeout(() => {
          wishElement.style.transform = "scale(1)";
        }, 200);
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
      toast.error(error?.message || "Failed to update wishlist");
    }
  };
  const handleAddToCart = async (product) => {
    try {
      if (!product.sizes || product.sizes.length === 0) {
        toast.error(`${product.name} has no available sizes.`);
        return;
      }
      if (!product.colors || product.colors.length === 0) {
        toast.error(`${product.name} has no available colors.`);
        return;
      }
      const defaultSize = product.sizes[0].size;
      const defaultColor = product.colors[0].name;
      const payload = {
        productId: product._id,
        quantity: 1,
        size: defaultSize,
        color: defaultColor,
      };
      dispatch(
        optimisticAddToCart({
          product,
          quantity: 1,
          size: defaultSize,
          color: defaultColor,
        }),
      );
      toast.success(`${product.name} added to cart!`);
      const bagElement = document.querySelector("#bag");
      if (bagElement) {
        bagElement.style.transform = "scale(1.2)";
        setTimeout(() => {
          bagElement.style.transform = "scale(1)";
        }, 200);
      }
      await dispatch(addToCart(payload)).unwrap();
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error?.message || "Failed to add to cart");
    }
  };
  const handleQuickView = (product) => {
    navigate(`/product/${product._id}`);
  };
  if (isLoading && products.length === 0) {
    return (
      <div>
        {/* <Preloader message="Loading products..." /> */}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-full px-2 py-8 mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <FreeShippingNotice />
        <CategoryBanner />
        <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mt-4 space-x-4 md:mt-0">
            <div className="flex bg-white border rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === "grid" ? "bg-ksauni-red text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === "list" ? "bg-ksauni-red text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <select
              value={localFilters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-ksauni-red focus:border-ksauni-red"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 space-x-2 text-white rounded-lg bg-ksauni-red md:hidden"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>
        <div className="flex gap-8">
          <AnimatePresence>
            {(showFilters || window.innerWidth >= 768) && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="sticky w-full p-6 bg-white rounded-lg shadow-md md:w-80 h-fit top-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <div className="flex items-center space-x-2">
                    <button onClick={handleClearFilters} className="text-sm text-ksauni-red hover:text-ksauni-dark-red">
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-500 md:hidden hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="mb-3 font-medium">Category</h4>
                  <select
                    value={localFilters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ksauni-red focus:border-ksauni-red"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-6">
                  <h4 className="mb-3 font-medium">Price Range</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      value={localFilters.priceRange[1]}
                      onChange={(e) => handleFilterChange("priceRange", [0, Number.parseInt(e.target.value)])}
                      className="w-full accent-ksauni-red"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₹0</span>
                      <span>₹{localFilters.priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="mb-3 font-medium">Size</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        className={`py-2 px-3 border rounded-lg text-sm transition-colors ${
                          localFilters.sizes.includes(size)
                            ? "border-ksauni-red bg-ksauni-red/10 text-ksauni-red"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="mb-3 font-medium">Color</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorToggle(color.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          localFilters.colors.includes(color.value)
                            ? "border-ksauni-red scale-110"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="mb-3 font-medium">Minimum Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleFilterChange("rating", rating)}
                        className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-colors ${
                          localFilters.rating === rating ? "bg-ksauni-red/10 text-ksauni-red" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm">& Up</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="py-16 text-center">
                <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="mb-4 text-2xl font-semibold text-gray-800">No products found</h2>
                <p className="mb-8 text-gray-600">Try adjusting your filters or search terms</p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 text-white transition-colors rounded-lg bg-ksauni-red hover:bg-ksauni-dark-red"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  viewMode === "grid" ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
              <div>
                hellooodsgjdhglhash
              </div>
                <AnimatePresence>
                  {products.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ProductCard
                        product={product}
                        viewMode={viewMode}
                        isInWishlist={wishlistItems.some((item) => item._id === product._id)}
                        onWishlistToggle={() => handleWishlistToggle(product)}
                        onQuickView={() => handleQuickView(product)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const params = { ...localFilters, page: index + 1 };
                        dispatch(fetchProducts(params));
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pagination.currentPage === index + 1
                          ? "bg-ksauni-red text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50 border"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductListingPage;