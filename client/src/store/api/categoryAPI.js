import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getAuthToken = () => localStorage.getItem("fashionhub_token");
const categoryAPI = {
  // GET /api/categories
  getCategories: (params) =>
    axios.get(`${API_URL}/categories`, {
      params,
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),
  // GET /api/categories/:slug
  getCategoryBySlug: (slug) =>
    axios.get(`${API_URL}/categories/${slug}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),
  // POST /api/categories
  createCategory: (categoryData) =>
    axios.post(`${API_URL}/categories`, categoryData, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "multipart/form-data",
      },
    }),
  // PUT /api/categories/:id
  updateCategory: (id, categoryData) =>
    axios.put(`${API_URL}/categories/${id}`, categoryData, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "multipart/form-data",
      },
    }),
  // DELETE /api/categories/:id
  deleteCategory: (id) =>
    axios.delete(`${API_URL}/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),
};
export default categoryAPI;