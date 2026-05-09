import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const partialCodAPI = {
  // Get settings
  getSettings: () => axios.get(`${API_URL}/partial-cod/settings`),
  
  // Update settings (admin only)
  updateSettings: (data) => {
    const token = localStorage.getItem("fashionhub_token");
    return axios.put(`${API_URL}/partial-cod/settings`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

export default partialCodAPI;