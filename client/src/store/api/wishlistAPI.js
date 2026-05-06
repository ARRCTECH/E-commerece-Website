import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Create axios instance with interceptors
const wishlistAPI = axios.create({
  baseURL: `${API_URL}/wishlist`,
  timeout: 10000,
});
// Request interceptor to add auth token
wishlistAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fashionhub_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
// Response interceptor to handle errors
wishlistAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to login for 401 errors, just pass them through
    return Promise.reject(error);
  },
);
const wishlistAPIService = {
  // Get user's wishlist
  getWishlist: () => wishlistAPI.get("/"),
  // Add product to wishlist
  addToWishlist: (productId) => wishlistAPI.post("/", { productId }),
  // Remove product from wishlist
  removeFromWishlist: (productId) => wishlistAPI.delete(`/${productId}`),
  // Clear entire wishlist
  clearWishlist: () => wishlistAPI.delete("/"),
  // Move item from wishlist to cart
  moveToCart: (productId, data) => wishlistAPI.post(`/${productId}/move-to-cart`, data),
};
export default wishlistAPIService;