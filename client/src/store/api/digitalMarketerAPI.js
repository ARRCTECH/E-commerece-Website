import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Create axios instance with auth header
const createAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};
const createFormDataHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
};
const digitalMarketerAPI = {
  // Marketing Analytics
  getMarketingAnalytics: (period = "7d") =>
    axios.get(`${API_URL}/digitalmarketer/analytics`, {
      ...createAuthHeaders(),
      params: { period },
    }),
  // SEO Management
  getSEOData: () => axios.get(`${API_URL}/digitalmarketer/seo`, createAuthHeaders()),
  updateSEOData: (data) => axios.post(`${API_URL}/digitalmarketer/seo`, data, createAuthHeaders()),
  // Campaign Management
  getAllCampaigns: (params) =>
    axios.get(`${API_URL}/digitalmarketer/campaigns`, {
      ...createAuthHeaders(),
      params,
    }),
  createCampaign: (data) => axios.post(`${API_URL}/digitalmarketer/campaigns`, data, createAuthHeaders()),
  updateCampaign: (campaignId, data) =>
    axios.put(`${API_URL}/digitalmarketer/campaigns/${campaignId}`, data, createAuthHeaders()),
  deleteCampaign: (campaignId) =>
    axios.delete(`${API_URL}/digitalmarketer/campaigns/${campaignId}`, createAuthHeaders()),
  getCampaignAnalytics: (campaignId) =>
    axios.get(`${API_URL}/digitalmarketer/campaigns/${campaignId}/analytics`, createAuthHeaders()),
  // Banner Management
  getAllBanners: (params) =>
    axios.get(`${API_URL}/digitalmarketer/banners`, {
      ...createAuthHeaders(),
      params,
    }),
  createBanner: (formData) => axios.post(`${API_URL}/digitalmarketer/banners`, formData, createFormDataHeaders()),
  updateBanner: (bannerId, formData) =>
    axios.put(`${API_URL}/digitalmarketer/banners/${bannerId}`, formData, createFormDataHeaders()),
  deleteBanner: (bannerId) => axios.delete(`${API_URL}/digitalmarketer/banners/${bannerId}`, createAuthHeaders()),
};
export default digitalMarketerAPI;