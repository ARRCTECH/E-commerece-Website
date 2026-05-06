import axios from "axios";
// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});
// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
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
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED") {
      console.error("❌ Backend server is not running!");
      console.error("Please start the backend server: cd backend && npm start");
      // Show user-friendly error
      if (typeof window !== "undefined") {
        const event = new CustomEvent("networkError", {
          detail: {
            message: "Backend server is not running. Please contact support.",
            type: "connection",
          },
        });
        window.dispatchEvent(event);
      }
    }
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
export default api;