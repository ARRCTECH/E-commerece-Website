import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const productAPI = {
  getProducts: (params) => axios.get(`${API_URL}/products`, { params }),

  getTrendingProducts: () => axios.get(`${API_URL}/products/trending`),

getNewArrivals: () => axios.get(`${API_URL}/products/new`),

  getOversizedProducts: () => axios.get(`${API_URL}/products/oversized`),

  getProductById: (id) => axios.get(`${API_URL}/products/${id}`),

  getProductBySlug: (slug) => axios.get(`${API_URL}/products/slug/${slug}`),

  createProduct: (productData) =>
    axios.post(`${API_URL}/products`, productData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("fashionhub_token")}`,
        "Content-Type": "multipart/form-data",
      },
    }),

  updateProduct: (id, productData) =>
    axios.put(`${API_URL}/products/${id}`, productData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("fashionhub_token")}`,
        "Content-Type": "multipart/form-data",
      },
    }),

  deleteProduct: (id) =>
    axios.delete(`${API_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("fashionhub_token")}` },
    }),

  searchProducts: (query) => axios.get(`${API_URL}/products/search?q=${query}`),

  getProductsByCategory: (categoryId, params) => axios.get(`${API_URL}/products/category/${categoryId}`, { params }),
}

export default productAPI
