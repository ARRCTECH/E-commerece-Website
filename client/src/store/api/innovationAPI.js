import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthToken = () => localStorage.getItem("fashionhub_token");

const api = axios.create({
  baseURL: `${API_URL}/innovations`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fashionhub_token");
      localStorage.removeItem("fashionhub_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const innovationAPI = {
  // ========== Public Routes ==========
  
  // Get active innovations (for customers)
  getActiveInnovations: () => api.get("/"),

  // ========== Admin Routes ==========
  
  // Get all innovations (admin)
  getAllInnovations: () => api.get("/admin"),
  
  // Create innovation
  createInnovation: (formData) =>
    api.post("/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  
  // Update innovation
  updateInnovation: (id, formData) =>
    api.put(`/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  
  // Delete innovation
  deleteInnovation: (id) => api.delete(`/${id}`),
};

export default innovationAPI;