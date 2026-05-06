import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

// ----------------- Helpers -----------------
const createAuthHeaders = () => {
  const token = localStorage.getItem("fashionhub_token")
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
}

const createFormDataHeaders = () => {
  const token = localStorage.getItem("fashionhub_token")
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  }
}

// ----------------- Admin API -----------------
const adminAPI = {
  // Dashboard Stats
  getDashboardStats: () =>
    axios.get(`${API_URL}/admin/dashboard/stats`, createAuthHeaders()),

  // User Management
  getAllUsers: (params) =>
    axios.get(`${API_URL}/admin/users`, {
      ...createAuthHeaders(),
      params,
    }),
  updateUserRole: (userId, data) =>
    axios.put(`${API_URL}/admin/users/${userId}/role`, data, createAuthHeaders()),
  deleteUser: (userId) =>
    axios.delete(`${API_URL}/admin/users/${userId}`, createAuthHeaders()),

  // Order Management
  getAllOrders: (params) =>
    axios.get(`${API_URL}/admin/orders`, {
      ...createAuthHeaders(),
      params,
    }),
  updateOrderStatus: (orderId, data) =>
    axios.put(`${API_URL}/admin/orders/${orderId}/status`, data, createAuthHeaders()),

  // Product Management
  getAllProducts: (params) =>
    axios.get(`${API_URL}/admin/products`, {
      ...createAuthHeaders(),
      params,
    }),
  createProduct: (formData) =>
    axios.post(`${API_URL}/admin/products`, formData, createFormDataHeaders()),
  updateProduct: (productId, formData) =>
    axios.put(`${API_URL}/admin/products/${productId}`, formData, createFormDataHeaders()),
  deleteProduct: (productId) =>
    axios.delete(`${API_URL}/admin/products/${productId}`, createAuthHeaders()),

  // Top10 Management
  getAllTop10Products: () => axios.get(`${API_URL}/top10`, createAuthHeaders()),
  getTop10Product: (id) => axios.get(`${API_URL}/top10/${id}`, createAuthHeaders()),
  createTop10Product: (data) =>
    axios.post(`${API_URL}/top10`, data, createAuthHeaders()),
  updateTop10Product: (id, data) =>
    axios.put(`${API_URL}/top10/${id}`, data, createAuthHeaders()),
  deleteTop10Product: (id) =>
    axios.delete(`${API_URL}/top10/${id}`, createAuthHeaders()),

  // Category Management
  getAllCategories: (params) =>
    axios.get(`${API_URL}/admin/categories`, {
      ...createAuthHeaders(),
      params,
    }),
  createCategory: (formData) =>
    axios.post(`${API_URL}/admin/categories`, formData, createFormDataHeaders()),
  updateCategory: (categoryId, formData) =>
    axios.put(`${API_URL}/admin/categories/${categoryId}`, formData, createFormDataHeaders()),
  deleteCategory: (categoryId) =>
    axios.delete(`${API_URL}/admin/categories/${categoryId}`, createAuthHeaders()),

  // Banner Management
  getAllBanners: (params) =>
    axios.get(`${API_URL}/admin/banners`, {
      ...createAuthHeaders(),
      params,
    }),
  createBanner: (formData) =>
    axios.post(`${API_URL}/admin/banners`, formData, createFormDataHeaders()),
  updateBanner: (bannerId, formData) =>
    axios.put(`${API_URL}/admin/banners/${bannerId}`, formData, createFormDataHeaders()),
  deleteBanner: (bannerId) =>
    axios.delete(`${API_URL}/admin/banners/${bannerId}`, createAuthHeaders()),

  // Coupon Management
  getAllCoupons: (params) =>
    axios.get(`${API_URL}/admin/coupons`, {
      ...createAuthHeaders(),
      params,
    }),
  createCoupon: (data) =>
    axios.post(`${API_URL}/admin/coupons`, data, createAuthHeaders()),
  updateCoupon: (couponId, data) =>
    axios.put(`${API_URL}/admin/coupons/${couponId}`, data, createAuthHeaders()),
  deleteCoupon: (couponId) =>
    axios.delete(`${API_URL}/admin/coupons/${couponId}`, createAuthHeaders()),

  // Innovation Management (ADMIN ONLY)
  getAllInnovations: (params) =>
    axios.get(`${API_URL}/innovations/admin`, {
      ...createAuthHeaders(),
      params,
    }),
  createInnovation: (formData) =>
    axios.post(`${API_URL}/innovations`, formData, createFormDataHeaders()),
  updateInnovation: (innovationId, formData) =>
    axios.put(`${API_URL}/innovations/${innovationId}`, formData, createFormDataHeaders()),
  deleteInnovation: (innovationId) =>
    axios.delete(`${API_URL}/innovations/${innovationId}`, createAuthHeaders()),
}

export default adminAPI;
