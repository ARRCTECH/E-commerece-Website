import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
});
// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const customJwt = localStorage.getItem("authToken");
    if (customJwt) {
      config.headers.Authorization = `Bearer ${customJwt}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// ============================
// Async Thunks
// ============================
export const fetchCategories = createAsyncThunk(
  "category/fetchCategories",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/categories", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch categories");
    }
  }
);
export const fetchCategoryBySlug = createAsyncThunk(
  "category/fetchCategoryBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await api.get(`/categories/${slug}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch category");
    }
  }
);
export const createCategory = createAsyncThunk(
  "category/createCategory",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create category");
    }
  }
);
export const updateCategory = createAsyncThunk(
  "category/updateCategory",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/categories/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update category");
    }
  }
);
export const deleteCategory = createAsyncThunk(
  "category/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/categories/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete category");
    }
  }
);
// ============================
// Initial State
// ============================
const initialState = {
  categories: [],
  currentCategory: null,
  featuredCategories: [],
  status: "idle",
  error: null,
  successAction: null,
};
// ============================
// Slice
// ============================
const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successAction = null;
    },
    setCurrentCategory: (state, action) => {
      state.currentCategory = action.payload;
    },
    setFeaturedCategories: (state, action) => {
      state.featuredCategories = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== FETCH ALL ==========
      .addCase(fetchCategories.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = action.payload.categories || [];
        state.featuredCategories = (action.payload.categories || []).filter(
          (c) => c.showOnHomepage
        ).slice(0, 6);
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // ========== FETCH BY SLUG ==========
      .addCase(fetchCategoryBySlug.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCategoryBySlug.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentCategory = action.payload.category;
      })
      .addCase(fetchCategoryBySlug.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // ========== CREATE ==========
      .addCase(createCategory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories.unshift(action.payload.category);
        state.successAction = "created";
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // ========== UPDATE ==========
      .addCase(updateCategory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        const index = state.categories.findIndex(
          (c) => c._id === action.payload.category._id
        );
        if (index !== -1) {
          state.categories[index] = action.payload.category;
        }
        state.successAction = "updated";
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // ========== DELETE ==========
      .addCase(deleteCategory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = state.categories.filter((cat) => cat._id !== action.payload);
        state.successAction = "deleted";
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});
export const {
  clearError,
  clearSuccess,
  setCurrentCategory,
  setFeaturedCategories,
} = categorySlice.actions;
export default categorySlice.reducer;