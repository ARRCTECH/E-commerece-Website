import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
});
// Request interceptor to add auth token
api.interceptors.request.use(
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
// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fashionhub_token");
      localStorage.removeItem("fashionhub_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
const returnAPI = {
  // Create return request
  createReturnRequest: (returnData) => {
    const formData = new FormData();
    // Append text fields
    formData.append("orderId", returnData.orderId);
    formData.append("type", returnData.type);
    formData.append("reason", returnData.reason);
    formData.append("description", returnData.description);
    formData.append("items", JSON.stringify(returnData.items));
    // Append images
    if (returnData.images) {
      returnData.images.forEach((image) => {
        formData.append("images", image);
      });
    }
    return api.post("/returns", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  // Get user returns
  getUserReturns: (page = 1, limit = 10) => api.get(`/returns/my-returns?page=${page}&limit=${limit}`),
  // Get return details
  getReturnDetails: (returnId) => api.get(`/returns/${returnId}`),
};
export default returnAPI;