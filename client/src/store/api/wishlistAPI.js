import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const wishlistAPI = axios.create({
  baseURL: `${API_URL}/wishlist`,
  timeout: 10000,
});

// Request interceptor
wishlistAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fashionhub_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
wishlistAPI.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
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
};

export default wishlistAPIService;