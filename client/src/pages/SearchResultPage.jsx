"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchProducts, setFilters, addRecentSearch } from "../store/slices/searchSlice";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilter";
import LoadingSpinner from "../components/LoadingSpinner";
const SearchResultsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { query, results, filters, totalProducts, totalPages, currentPage, loading, error } = useSelector(
    (state) => state.search,
  );
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  useEffect(() => {
    const searchQuery = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const page = Number.parseInt(searchParams.get("page")) || 1;
    const sort = searchParams.get("sort") || "relevance";
    if (searchQuery) {
      const searchFilters = {
        category,
        minPrice,
        maxPrice,
        page,
        sortBy: sort === "relevance" ? "createdAt" : sort,
        sortOrder: sort === "price-low" ? "asc" : "desc",
      };
      dispatch(setFilters(searchFilters));
      dispatch(searchProducts({ query: searchQuery, filters: searchFilters }));
      dispatch(addRecentSearch(searchQuery));
      setSortBy(sort);
    }
  }, [searchParams, dispatch]);
  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    dispatch(setFilters(updatedFilters));
    // Update URL params
    const params = new URLSearchParams(searchParams);
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
    dispatch(searchProducts({ query: searchParams.get("q"), filters: updatedFilters }));
  };
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const sortFilters = {
      sortBy:
        newSort === "relevance" ? "createdAt" : newSort === "price-low" || newSort === "price-high" ? "price" : newSort,
      sortOrder: newSort === "price-low" ? "asc" : "desc",
    };
    const params = new URLSearchParams(searchParams);
    params.set("sort", newSort);
    setSearchParams(params);
    handleFilterChange(sortFilters);
  };
  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    setSearchParams(params);
    handleFilterChange({ page });
  };
  const clearAllFilters = () => {
    const params = new URLSearchParams();
    params.set("q", searchParams.get("q"));
    setSearchParams(params);
    dispatch(
      setFilters({
        category: "",
        minPrice: "",
        maxPrice: "",
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
      }),
    );
    dispatch(
      searchProducts({
        query: searchParams.get("q"),
        filters: { page: 1 },
      }),
    );
  };
  if (loading && results.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
              {query && (
                <p className="mt-1 text-gray-600">
                  {totalProducts} results for "{query}"
                </p>
              )}
            </div>
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 space-x-2 bg-gray-100 rounded-lg lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button onClick={clearAllFilters} className="text-sm text-blue-600 hover:text-blue-800">
                  Clear All
                </button>
              </div>
              <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
            </div>
          </div>
          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Options */}
            <div className="p-4 mb-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="rating">Customer Rating</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * filters.limit + 1}-{Math.min(currentPage * filters.limit, totalProducts)}{" "}
                  of {totalProducts} results
                </div>
              </div>
            </div>
            {/* Error State */}
            {error && (
              <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}
            {/* No Results */}
            {!loading && results.length === 0 && !error && (
              <div className="p-12 text-center bg-white rounded-lg shadow-sm">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No products found</h3>
                <p className="mb-4 text-gray-600">We couldn't find any products matching your search criteria.</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
            {/* Products Grid */}
            {results.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
            {/* Loading State */}
            {loading && results.length > 0 && (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SearchResultsPage;