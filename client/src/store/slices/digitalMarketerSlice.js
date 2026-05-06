import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fashionhub_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
const DM_PREFIX = "/digital-marketer";
// === ANALYTICS ===
export const fetchMarketingAnalytics = createAsyncThunk(
  "digitalMarketer/fetchMarketingAnalytics",
  async (period = "7d", { rejectWithValue }) => {
    try {
      const response = await api.get(`${DM_PREFIX}/analytics?period=${period}`);
      return response.data;
    } catch {
      return {};
    }
  }
);
// === SEO ===
export const fetchSEOData = createAsyncThunk("digitalMarketer/fetchSEOData", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(`${DM_PREFIX}/seo`);
    return response.data;
  } catch {
    return { seoData: [] };
  }
});
export const updateSEOData = createAsyncThunk("digitalMarketer/updateSEOData", async (seoData, { rejectWithValue }) => {
  try {
    const response = await api.post(`${DM_PREFIX}/seo`, seoData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to update SEO data");
  }
});
// === CAMPAIGNS ===
export const fetchAllCampaigns = createAsyncThunk("digitalMarketer/fetchAllCampaigns", async (params, { rejectWithValue }) => {
  try {
    const response = await api.get(`${DM_PREFIX}/campaigns`, { params });
    return response.data;
  } catch {
    return {};
  }
});
export const createCampaign = createAsyncThunk("digitalMarketer/createCampaign", async (campaignData, { rejectWithValue }) => {
  try {
    const response = await api.post(`${DM_PREFIX}/campaigns`, campaignData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create campaign");
  }
});
export const updateCampaign = createAsyncThunk(
  "digitalMarketer/updateCampaign",
  async ({ campaignId, campaignData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${DM_PREFIX}/campaigns/${campaignId}`, campaignData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update campaign");
    }
  }
);
export const deleteCampaign = createAsyncThunk("digitalMarketer/deleteCampaign", async (campaignId, { rejectWithValue }) => {
  try {
    await api.delete(`${DM_PREFIX}/campaigns/${campaignId}`);
    return campaignId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete campaign");
  }
});
export const fetchCampaignAnalytics = createAsyncThunk(
  "digitalMarketer/fetchCampaignAnalytics",
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${DM_PREFIX}/campaigns/${campaignId}/analytics`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch campaign analytics");
    }
  }
);
// === BANNERS ===
export const fetchAllBanners = createAsyncThunk("digitalMarketer/fetchAllBanners", async (params, { rejectWithValue }) => {
  try {
    const response = await api.get("/banners", { params });
    return response.data;
  } catch {
    return {};
  }
});
export const createBanner = createAsyncThunk("digitalMarketer/createBanner", async (bannerData, { rejectWithValue }) => {
  try {
    const response = await api.post("/banners", bannerData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create banner");
  }
});
export const updateBanner = createAsyncThunk(
  "digitalMarketer/updateBanner",
  async ({ bannerId, bannerData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/banners/${bannerId}`,
        bannerData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Banner update failed");
    }
  }
);
export const deleteBanner = createAsyncThunk("digitalMarketer/deleteBanner", async (bannerId, { rejectWithValue }) => {
  try {
    await api.delete(`/banners/${bannerId}`);
    return bannerId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete banner");
  }
});
// === SLICE ===
const initialState = {
  marketingAnalytics: null,
  analyticsLoading: false,
  seoData: [],
  seoLoading: false,
  campaigns: [],
  campaignsPagination: null,
  campaignsLoading: false,
  selectedCampaign: null,
  campaignAnalytics: null,
  banners: [],
  bannersLoading: false,
  loading: false,
  error: null,
  success: null,
};
const digitalMarketerSlice = createSlice({
  name: "digitalMarketer",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSelectedCampaign: (state, action) => {
      state.selectedCampaign = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Analytics
      .addCase(fetchMarketingAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketingAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.marketingAnalytics = action.payload;
      })
      .addCase(fetchMarketingAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.error = action.payload;
      })
      // SEO
      .addCase(fetchSEOData.pending, (state) => {
        state.seoLoading = true;
        state.error = null;
      })
      .addCase(fetchSEOData.fulfilled, (state, action) => {
        state.seoLoading = false;
        state.seoData = action.payload.seoData;
      })
      .addCase(fetchSEOData.rejected, (state, action) => {
        state.seoLoading = false;
        state.error = action.payload;
      })
      .addCase(updateSEOData.fulfilled, (state, action) => {
        const updatedSEO = action.payload.seoData;
        const index = state.seoData.findIndex((seo) => seo.page === updatedSEO.page);
        if (index !== -1) {
          state.seoData[index] = updatedSEO;
        } else {
          state.seoData.push(updatedSEO);
        }
        state.success = action.payload.message;
      })
      // Campaigns
      .addCase(fetchAllCampaigns.pending, (state) => {
        state.campaignsLoading = true;
        state.error = null;
      })
      .addCase(fetchAllCampaigns.fulfilled, (state, action) => {
        state.campaignsLoading = false;
        state.campaigns = action.payload.campaigns;
        state.campaignsPagination = action.payload.pagination;
      })
      .addCase(fetchAllCampaigns.rejected, (state, action) => {
        state.campaignsLoading = false;
        state.error = action.payload;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.campaigns.unshift(action.payload.campaign);
        state.success = action.payload.message;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        const updated = action.payload.campaign;
        const idx = state.campaigns.findIndex((c) => c._id === updated._id);
        if (idx !== -1) state.campaigns[idx] = updated;
        state.success = action.payload.message;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter((c) => c._id !== action.payload);
        state.success = "Campaign deleted successfully";
      })
      .addCase(fetchCampaignAnalytics.fulfilled, (state, action) => {
        state.campaignAnalytics = action.payload.analytics;
        state.selectedCampaign = action.payload.campaign;
      })
      // Banners
      .addCase(fetchAllBanners.pending, (state) => {
        state.bannersLoading = true;
        state.error = null;
      })
      .addCase(fetchAllBanners.fulfilled, (state, action) => {
        state.bannersLoading = false;
        state.banners = action.payload.banners;
      })
      .addCase(fetchAllBanners.rejected, (state, action) => {
        state.bannersLoading = false;
        state.error = action.payload;
      })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.banners.unshift(action.payload.banner);
        state.success = action.payload.message;
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        const updated = action.payload.banner;
        const idx = state.banners.findIndex((b) => b._id === updated._id);
        if (idx !== -1) state.banners[idx] = updated;
        state.success = action.payload.message;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.banners = state.banners.filter((b) => b._id !== action.payload);
        state.success = "Banner deleted successfully";
      });
  },
});
export const { clearError, clearSuccess, setLoading, setSelectedCampaign } = digitalMarketerSlice.actions;
export default digitalMarketerSlice.reducer;