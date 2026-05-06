import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ================================
// 🔐 REQUEST INTERCEPTOR (Token)
// ================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fashionhub_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================================
// ❗ RESPONSE INTERCEPTOR (401 handler)
// ================================
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fashionhub_token"); // ✅ correct key
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ================================
// 📦 Review API Functions
// ================================
const reviewAPI = {
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),

  createReview: (data) => api.post("/reviews", data),

  updateReview: (id, data) => api.put(`/reviews/${id}`, data),

  deleteReview: (id) => api.delete(`/reviews/${id}`),

  getUserReviews: () => api.get("/reviews/user"),

  toggleReviewLike: (id) => api.post(`/reviews/${id}/like`),

  reportReview: (id, reason) => api.post(`/reviews/${id}/report`, { reason }),

  getReviewById: (id) => api.get(`/reviews/${id}`),
};

export default reviewAPI;
