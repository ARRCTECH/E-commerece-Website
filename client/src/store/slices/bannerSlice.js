import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Axios instance (❌ no global interceptor)
const api = axios.create({ baseURL: API_BASE_URL });
// =========================
// 📝 Async Thunks
// =========================
// Fetch all banners (admin view or general)
export const fetchAllBanners = createAsyncThunk(
  "banners/fetchAllBanners",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/banners", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch banners");
    }
  }
);
// Public banner fetches (no token required)
export const fetchHeroBanners = createAsyncThunk(
  "banners/fetchHeroBanners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/banners", { params: { type: "hero", isActive: true } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch hero banners");
    }
  }
);
export const fetchPromoBanners = createAsyncThunk(
  "banners/fetchPromoBanners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/banners", { params: { type: "promo", isActive: true } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch promo banners");
    }
  }
);
export const fetchCategoryBanners = createAsyncThunk(
  "banners/fetchCategoryBanners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/banners", { params: { type: "category", isActive: true } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch category banners");
    }
  }
);
// Admin-only actions (token required)
export const createBanner = createAsyncThunk(
  "banners/createBanner",
  async (bannerData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("fashionhub_token");
      const response = await api.post("/banners", bannerData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create banner");
    }
  }
);
export const updateBanner = createAsyncThunk(
  "banners/updateBanner",
  async ({ bannerId, bannerData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("fashionhub_token");
      const response = await api.put(`/banners/${bannerId}`, bannerData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update banner");
    }
  }
);
export const deleteBanner = createAsyncThunk(
  "banners/deleteBanner",
  async (bannerId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("fashionhub_token");
      await api.delete(`/banners/${bannerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return bannerId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete banner");
    }
  }
);
export const toggleBannerStatus = createAsyncThunk(
  "banners/toggleBannerStatus",
  async (bannerId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("fashionhub_token");
      const response = await api.patch(`/banners/${bannerId}/toggle`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to toggle banner status");
    }
  }
);
// =========================
// 📝 Initial State
// =========================
const initialState = {
  banners: [],
  heroBanners: [],
  promoBanners: [],
  categoryBanners: [],
  loadingAll: false,
  loadingHero: false,
  loadingPromo: false,
  loadingCategory: false,
  loadingCreate: false,
  loadingUpdate: false,
  loadingDelete: false,
  loadingToggle: false,
  error: null,
  success: null,
};
// =========================
// 📝 Banner Slice
// =========================
const bannerSlice = createSlice({
  name: "banners",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAllBanners.pending, (state) => {
        state.loadingAll = true;
        state.error = null;
      })
      .addCase(fetchAllBanners.fulfilled, (state, action) => {
        state.loadingAll = false;
        state.banners = action.payload.banners;
      })
      .addCase(fetchAllBanners.rejected, (state, action) => {
        state.loadingAll = false;
        state.error = action.payload;
      })
      // Hero
      .addCase(fetchHeroBanners.pending, (state) => {
        state.loadingHero = true;
        state.error = null;
      })
      .addCase(fetchHeroBanners.fulfilled, (state, action) => {
        state.loadingHero = false;
        state.heroBanners = action.payload.banners;
      })
      .addCase(fetchHeroBanners.rejected, (state, action) => {
        state.loadingHero = false;
        state.error = action.payload;
      })
      // Promo
      .addCase(fetchPromoBanners.pending, (state) => {
        state.loadingPromo = true;
        state.error = null;
      })
      .addCase(fetchPromoBanners.fulfilled, (state, action) => {
        state.loadingPromo = false;
        state.promoBanners = action.payload.banners;
      })
      .addCase(fetchPromoBanners.rejected, (state, action) => {
        state.loadingPromo = false;
        state.error = action.payload;
      })
      // Category
      .addCase(fetchCategoryBanners.pending, (state) => {
        state.loadingCategory = true;
        state.error = null;
      })
      .addCase(fetchCategoryBanners.fulfilled, (state, action) => {
        state.loadingCategory = false;
        state.categoryBanners = action.payload.banners;
      })
      .addCase(fetchCategoryBanners.rejected, (state, action) => {
        state.loadingCategory = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createBanner.pending, (state) => {
        state.loadingCreate = true;
        state.error = null;
      })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.loadingCreate = false;
        state.banners.unshift(action.payload.banner);
        state.success = action.payload.message;
      })
      .addCase(createBanner.rejected, (state, action) => {
        state.loadingCreate = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateBanner.pending, (state) => {
        state.loadingUpdate = true;
        state.error = null;
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.loadingUpdate = false;
        const updatedBanner = action.payload.banner;
        const index = state.banners.findIndex((b) => b._id === updatedBanner._id);
        if (index !== -1) state.banners[index] = updatedBanner;
        state.success = action.payload.message;
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.loadingUpdate = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteBanner.pending, (state) => {
        state.loadingDelete = true;
        state.error = null;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.loadingDelete = false;
        state.banners = state.banners.filter((b) => b._id !== action.payload);
        state.heroBanners = state.heroBanners.filter((b) => b._id !== action.payload);
        state.promoBanners = state.promoBanners.filter((b) => b._id !== action.payload);
        state.categoryBanners = state.categoryBanners.filter((b) => b._id !== action.payload);
        state.success = "Banner deleted successfully";
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.loadingDelete = false;
        state.error = action.payload;
      })
      // Toggle
      .addCase(toggleBannerStatus.pending, (state) => {
        state.loadingToggle = true;
        state.error = null;
      })
      .addCase(toggleBannerStatus.fulfilled, (state, action) => {
        state.loadingToggle = false;
        const updatedBanner = action.payload.banner;
        const updateInArray = (arr) => {
          const index = arr.findIndex((b) => b._id === updatedBanner._id);
          if (index !== -1) arr[index] = updatedBanner;
        };
        updateInArray(state.banners);
        updateInArray(state.heroBanners);
        updateInArray(state.promoBanners);
        updateInArray(state.categoryBanners);
        state.success = action.payload.message;
      })
      .addCase(toggleBannerStatus.rejected, (state, action) => {
        state.loadingToggle = false;
        state.error = action.payload;
      });
  },
});
export const { clearError, clearSuccess } = bannerSlice.actions;
export default bannerSlice.reducer;