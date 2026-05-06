import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});
// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fashionhub_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Validate coupon
export const validateCoupon = createAsyncThunk(
  "coupons/validateCoupon",
  async ({ code, cartTotal }, { rejectWithValue }) => {
    try {
      const response = await api.post("/coupons/validate", { code, cartTotal });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Invalid coupon code");
    }
  },
);
// Apply coupon
export const applyCoupon = createAsyncThunk("coupons/applyCoupon", async ({ code, cartTotal }, { rejectWithValue }) => {
  try {
    const response = await api.post("/coupons/apply", { code, cartTotal });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to apply coupon");
  }
});
// Remove coupon
export const removeCoupon = createAsyncThunk("coupons/removeCoupon", async (_, { rejectWithValue }) => {
  try {
    // This is typically handled on the frontend
    return { success: true, message: "Coupon removed successfully" };
  } catch (error) {
    return rejectWithValue("Failed to remove coupon");
  }
});
// Fetch available coupons for the current user (active & valid date)
export const fetchAvailableCoupons = createAsyncThunk(
  "coupons/fetchAvailableCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/coupons/available");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch available coupons");
    }
  }
);
// Fetch all coupons (admin)
export const fetchAllCoupons = createAsyncThunk("coupons/fetchAllCoupons", async (params, { rejectWithValue }) => {
  try {
    const response = await api.get("/coupons", { params });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch coupons");
  }
});
// Create coupon (admin)
export const createCoupon = createAsyncThunk("coupons/createCoupon", async (couponData, { rejectWithValue }) => {
  try {
    const response = await api.post("/coupons", couponData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create coupon");
  }
});
// Update coupon (admin)
export const updateCoupon = createAsyncThunk(
  "coupons/updateCoupon",
  async ({ couponId, couponData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/coupons/${couponId}`, couponData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update coupon");
    }
  },
);
// Delete coupon (admin)
export const deleteCoupon = createAsyncThunk("coupons/deleteCoupon", async (couponId, { rejectWithValue }) => {
  try {
    await api.delete(`/coupons/${couponId}`);
    return couponId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete coupon");
  }
});
const initialState = {
  coupons: [],
  availableCoupons: [],
  appliedCoupon: null,
  discount: 0,
  loading: false,
  validating: false,
  error: null,
  success: null,
};
const couponSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearAppliedCoupon: (state) => {
      state.appliedCoupon = null;
      state.discount = 0;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Validate coupon
      .addCase(validateCoupon.pending, (state) => {
        state.validating = true;
        state.error = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.validating = false;
        state.success = "Coupon is valid";
        state.appliedCoupon = action.payload.coupon;
        state.discount = action.payload.coupon.discountAmount || 0;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.validating = false;
        state.error = action.payload;
      })
      // Apply coupon
      .addCase(applyCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.appliedCoupon = action.payload.coupon;
        state.discount = action.payload.discount;
        state.success = action.payload.message;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch available coupons
      .addCase(fetchAvailableCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.availableCoupons = action.payload.coupons || [];
      })
      .addCase(fetchAvailableCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove coupon
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.appliedCoupon = null;
        state.discount = 0;
        state.success = action.payload.message;
      })
      // Fetch all coupons
      .addCase(fetchAllCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.coupons;
      })
      .addCase(fetchAllCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create coupon
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.coupons.unshift(action.payload.coupon);
        state.success = action.payload.message;
      })
      // Update coupon
      .addCase(updateCoupon.fulfilled, (state, action) => {
        const updatedCoupon = action.payload.coupon;
        const index = state.coupons.findIndex((coupon) => coupon._id === updatedCoupon._id);
        if (index !== -1) {
          state.coupons[index] = updatedCoupon;
        }
        state.success = action.payload.message;
      })
      // Delete coupon
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter((coupon) => coupon._id !== action.payload);
        state.success = "Coupon deleted successfully";
      });
  },
});
export const { clearError, clearSuccess, clearAppliedCoupon, setLoading } = couponSlice.actions;
export default couponSlice.reducer;