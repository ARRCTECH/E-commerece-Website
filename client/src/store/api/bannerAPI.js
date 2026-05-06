import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Base axios instance (no interceptor)
const api = axios.create({
  baseURL: API_URL,
});
// Public banner API
const bannerAPI = {
  // Public - No token required
  getAllBanners: (params) => api.get("/banners", { params }),
  getHeroBanners: () => api.get("/banners/hero"),
  getPromoBanners: () => api.get("/banners/promo"),
  // Protected - Token required
  createBanner: (bannerData) =>
    api.post("/banners", bannerData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("fashionhub_token")}`,
      },
    }),
  updateBanner: (id, bannerData) =>
    api.put(`/banners/${id}`, bannerData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("fashionhub_token")}`,
      },
    }),
  deleteBanner: (id) =>
    api.delete(`/banners/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("fashionhub_token")}`,
      },
    }),
};
export { bannerAPI };