

// src/pages/ProductListingPage.jsx
"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchProducts } from "../store/slices/productSlice";
import { Link } from "react-router-dom";
import ProductFilters from "../components/ProductFilters"; // adjust path

// -------------------- Product Card (unchanged) --------------------
const ProductCard = ({ product }) => {
  return (
    <Link to={`/product/${product.slug}`} className="group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-100 relative">
          <img
            src={product.images?.[0]?.url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.discount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {product.discount}% OFF
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-gray-800 text-sm line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-gray-900">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// -------------------- Pagination Component (unchanged) --------------------
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisible = 5;
  let visiblePages = pages;

  if (totalPages > maxVisible) {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    visiblePages = pages.slice(start - 1, end);
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft size={18} />
      </button>

      {visiblePages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-8 h-8 rounded-lg text-sm hover:bg-gray-100"
          >
            1
          </button>
          {visiblePages[0] > 2 && <span className="px-1">...</span>}
        </>
      )}

      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 rounded-lg text-sm font-medium ${
            page === currentPage
              ? "bg-red-600 text-white"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          {page}
        </button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-1">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-8 h-8 rounded-lg text-sm hover:bg-gray-100"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// -------------------- Main Product Listing Page --------------------
const ProductListingPage = () => {
  const dispatch = useDispatch();
  const {
    products = [],
    totalPages = 1,
    currentPage = 1,
    isLoading = false,
  } = useSelector((state) => state.products);

  // Filter state compatible with ProductFilters
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    // size and sort are handled separately
  });
  const [sort, setSort] = useState("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Categories data – replace with actual data from API or Redux
  const categories = [
    { _id: "1", slug: "men", name: "Men", productCount: 24 },
    { _id: "2", slug: "women", name: "Women", productCount: 18 },
    { _id: "3", slug: "kids", name: "Kids", productCount: 12 },
    { _id: "4", slug: "accessories", name: "Accessories", productCount: 8 },
  ];

  // Fetch products whenever filters, sort, or page change
  useEffect(() => {
    dispatch(fetchProducts({ page: currentPage, ...filters, sort }));
  }, [dispatch, currentPage, filters, sort]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // reset to page 1 when filters change
    dispatch(fetchProducts({ page: 1, ...newFilters, sort }));
  };

  const handleClearFilters = () => {
    setFilters({ category: "", minPrice: "", maxPrice: "" });
    dispatch(fetchProducts({ page: 1, category: "", minPrice: "", maxPrice: "", sort }));
  };

  const handlePageChange = (page) => {
    dispatch(fetchProducts({ page, ...filters, sort }));
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSort(newSort);
    dispatch(fetchProducts({ page: 1, ...filters, sort: newSort }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header with mobile filter button */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Shop</h1>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm font-medium transition"
          >
            <Filter size={18} /> Filters
          </button>
        </div>
      </div>

      {/* Main content: sidebar + product grid */}
      <div className="container mx-auto flex flex-col lg:flex-row gap-4 px-2 py-4">
        {/* Desktop filter sidebar – using ProductFilters (full height, not fullscreen) */}
        <aside className="hidden lg:block w-96 shrink-0">
          <ProductFilters
            filters={filters}
            categories={categories}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        {/* Right side: products + pagination */}
        <main className="flex-1">
          {/* Sort & result count */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <p className="text-sm text-gray-500">
              {!isLoading && products?.length} product{products?.length !== 1 && "s"}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sort}
                onChange={handleSortChange}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-red-500 focus:border-red-500"
              >
                <option value="newest">Newest</option>
                <option value="price_low_high">Price: Low to High</option>
                <option value="price_high_low">Price: High to Low</option>
                <option value="popular">Popularity</option>
              </select>
            </div>
          </div>

          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-64" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl">
              <p className="text-gray-500">No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile filter drawer – using ProductFilters in fullscreen mode */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* The ProductFilters component itself handles the fullscreen panel and close button */}
            <ProductFilters
              filters={filters}
              categories={categories}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onClose={() => setMobileFiltersOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductListingPage;