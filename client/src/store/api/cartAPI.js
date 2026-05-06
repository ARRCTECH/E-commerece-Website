import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ✅ Create axios instance with interceptors
const cartAPI = axios.create({
  baseURL: `${API_URL}/cart`,
  timeout: 30000, // Increased timeout for slower connections
  withCredentials: true, // Enable cookies for session handling
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
// ➡️ Request interceptor to add auth token
cartAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fashionhub_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// ⛔ Response interceptor to handle unauthorized errors globally
cartAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Cart API error:", error.response?.status, error.response?.data || error.message);
    
    // Don't automatically redirect on cart API errors - guest users should still work
    if (error.response?.status === 401) {
      // Don't remove tokens or redirect for cart operations
    }
    
    return Promise.reject(error);
  }
);
const cartAPIService = {
  // 🛒 Get user's cart
  getCart: () => cartAPI.get("/"),
  // ➕ Add item to cart
  addToCart: (cartData) => {
    const token = localStorage.getItem("fashionhub_token");
    
    return cartAPI.post("/", cartData)
      .then(response => {
        return response;
      })
      .catch(error => {
        console.error("Add to cart failed:", error.response?.data || error.message);
        throw error;
      });
  },
  // 🔄 Update cart item
  updateCartItem: (itemId, data) => cartAPI.put(`/${itemId}`, data),
  // ❌ Remove item from cart
  removeFromCart: (itemId) => cartAPI.delete(`/${itemId}`),
  // 🗑️ Clear entire cart
  clearCart: () => cartAPI.delete("/"),
};
export default cartAPIService;