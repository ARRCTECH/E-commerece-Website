"use client";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Plus, Search, Edit, Trash2, Star, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import adminAPI from "../../store/api/adminApi";
const TopTenManagement = () => {
  const dispatch = useDispatch();
  const [top10Products, setTop10Products] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    minPrice: "",
    maxPrice: "",
    sort: "position"
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    position: 1,
    isActive: true
  });
  // State for category search within the modal
  const [modalCategorySearch, setModalCategorySearch] = useState("");
  // State to manage which category sections are expanded
  const [expandedCategories, setExpandedCategories] = useState({});
  useEffect(() => {
    fetchTop10Products();
    fetchAllProducts();
    fetchCategories();
  }, [filters, searchTerm, pagination.current]);
  const fetchTop10Products = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllTop10Products();
      let filteredProducts = response.data.top10;
      if (searchTerm) {
        filteredProducts = filteredProducts.filter(item =>
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (filters.category) {
        filteredProducts = filteredProducts.filter(item =>
          item.product.category?._id === filters.category
        );
      }
      if (filters.status) {
        const isActive = filters.status === "active";
        filteredProducts = filteredProducts.filter(item => item.isActive === isActive);
      }
      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(item => item.product.price >= Number(filters.minPrice));
      }
      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(item => item.product.price <= Number(filters.maxPrice));
      }
      if (filters.sort === "position") {
        filteredProducts.sort((a, b) => a.position - b.position);
      } else if (filters.sort === "price-low") {
        filteredProducts.sort((a, b) => a.product.price - b.product.price);
      } else if (filters.sort === "price-high") {
        filteredProducts.sort((a, b) => b.product.price - a.product.price);
      } else if (filters.sort === "name") {
        filteredProducts.sort((a, b) => a.product.name.localeCompare(b.product.name));
      }
      const total = filteredProducts.length;
      const pages = Math.ceil(total / pagination.limit);
      const startIndex = (pagination.current - 1) * pagination.limit;
      const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pagination.limit);
      setTop10Products(paginatedProducts);
      setPagination(prev => ({
        ...prev,
        pages,
        total
      }));
    } catch (error) {
      console.error("Error fetching top10 products:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchAllProducts = async () => {
    try {
      const response = await adminAPI.getAllProducts({
        limit: 200,
        isActive: true,
        fields: "name price category images stockQuantity"
      });
      setAllProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching all products:", error);
    }
  };
  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getAllCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingItem) {
        await adminAPI.updateTop10Product(editingItem._id, formData);
      } else {
        await adminAPI.createTop10Product(formData);
      }
      setShowModal(false);
      resetForm();
      fetchTop10Products();
    } catch (error) {
      console.error("Error saving top10 product:", error);
      alert(error.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this product from Top10?")) {
      try {
        await adminAPI.deleteTop10Product(id);
        fetchTop10Products();
      } catch (error) {
        console.error("Error deleting top10 product:", error);
        alert("Failed to delete product");
      }
    }
  };
  const resetForm = () => {
    setFormData({
      product: "",
      position: 1,
      isActive: true
    });
    setEditingItem(null);
    setModalCategorySearch("");
    setExpandedCategories({});
  };
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      product: item.product._id,
      position: item.position,
      isActive: item.isActive
    });
    setShowModal(true);
  };
  const resetFilters = () => {
    setFilters({
      category: "",
      status: "",
      minPrice: "",
      maxPrice: "",
      sort: "position"
    });
    setSearchTerm("");
    setPagination(prev => ({ ...prev, current: 1 }));
  };
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  // Group products by category
  const productsByCategory = allProducts.reduce((acc, product) => {
    const categoryName = product.category?.name || "Uncategorized";
    const categoryId = product.category?._id || "uncategorized";
    if (!acc[categoryId]) {
      acc[categoryId] = {
        name: categoryName,
        products: []
      };
    }
    acc[categoryId].products.push(product);
    return acc;
  }, {});
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(modalCategorySearch.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Top 10 Products Management</h1>
          <p className="text-sm text-gray-600">Manage featured products in the Top 10 section</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 space-x-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Top10</span>
        </button>
      </div>
      <div className="p-4 space-y-4 bg-white rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          {(searchTerm || Object.values(filters).some(val => val)) && (
            <button
              onClick={resetFilters}
              className="flex items-center px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </button>
          )}
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-200 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
              <select
                value={filters.category}
                onChange={(e) => {
                  setFilters({ ...filters, category: e.target.value });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Min Price</label>
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => {
                  setFilters({ ...filters, minPrice: e.target.value });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Max Price</label>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => {
                  setFilters({ ...filters, maxPrice: e.target.value });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => {
                  setFilters({ ...filters, sort: e.target.value });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="position">Position</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        )}
      </div>
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Position
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-b-2 border-purple-600 rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : top10Products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || Object.values(filters).some(val => val)
                      ? "No products match your search criteria"
                      : "No top 10 products configured"
                    }
                  </td>
                </tr>
              ) : (
                top10Products.map((item) => {
                  const product = item.product;
                  return (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{item.position}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-12 h-12">
                            <img
                              className="object-cover w-12 h-12 rounded-lg"
                              src={product.images?.[0]?.url || "/placeholder.jpg"}
                              alt={product.name}
                              onError={(e) => {
                                e.target.src = "/placeholder.jpg";
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                                <span className="text-purple-600 font-semibold">{product.stockQuantity}</span> in stock
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {product.category?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {product.stockQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                            item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-left whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current === pagination.pages}
                className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.current - 1) * pagination.limit + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(pagination.current * pagination.limit, pagination.total)}</span> of{" "}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPagination(prev => ({ ...prev, current: i + 1 }))}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                        pagination.current === i + 1
                          ? "z-10 bg-purple-50 border-purple-500 text-purple-600"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                    disabled={pagination.current === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
          <div className="w-full max-w-4xl h-full max-h-[80vh] p-6 bg-white rounded-lg shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{editingItem ? "Edit Top 10 Item" : "Add a Product to Top 10"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              {editingItem ? (
                <div className="p-4 mb-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <img
                      src={editingItem.product.images?.[0]?.url || "/placeholder.jpg"}
                      alt={editingItem.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{editingItem.product.name}</h4>
                      <p className="text-sm text-gray-500">${editingItem.product.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col mb-4 overflow-hidden">
                  <div className="relative mb-4">
                    <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      type="text"
                      placeholder="Search for a category..."
                      value={modalCategorySearch}
                      onChange={(e) => setModalCategorySearch(e.target.value)}
                      className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {filteredCategories.length === 0 && modalCategorySearch ? (
                      <div className="text-center text-gray-500">
                        No categories found.
                      </div>
                    ) : (
                      filteredCategories.map(category => (
                        <div key={category._id} className="border border-gray-200 rounded-lg shadow-sm">
                          <button
                            type="button"
                            onClick={() => toggleCategory(category._id)}
                            className="flex items-center justify-between w-full px-4 py-3 text-left font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
                          >
                            <span>{category.name}</span>
                            {expandedCategories[category._id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          {expandedCategories[category._id] && (
                            <div className="p-4 border-t border-gray-200">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {(productsByCategory[category._id]?.products || []).length > 0 ? (
                                  (productsByCategory[category._id].products).map(p => (
                                    <div
                                      key={p._id}
                                      onClick={() => {
                                        if (formData.product === p._id) {
                                          setFormData({ ...formData, product: "" });
                                        } else {
                                          setFormData({ ...formData, product: p._id });
                                        }
                                      }}
                                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                        formData.product === p._id ? "border-purple-600 ring-2 ring-purple-500 bg-purple-50" : "border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      <div className="flex items-center space-x-4">
                                        <img
                                          src={p.images?.[0]?.url || "/placeholder.jpg"}
                                          alt={p.name}
                                          className="w-16 h-16 object-cover rounded-md"
                                        />
                                        <div>
                                          <h4 className="font-semibold text-gray-900">{p.name}</h4>
                                          <p className="text-sm text-gray-500">${p.price.toFixed(2)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center text-gray-500 col-span-2">
                                    No products in this category.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              <div className="mt-auto space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <input
                    type="number"
                    id="position"
                    name="position"
                    required
                    min="1"
                    max="10"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: Number(e.target.value) })}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                    Is Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    !editingItem && !formData.product
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                  disabled={loading || (!editingItem && !formData.product)}
                >
                  {loading ? "Saving..." : editingItem ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TopTenManagement;