import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import partialCodAPI from "../api/partialCodAPI";

// ===============================
// Async Thunks
// ===============================

// Fetch settings
export const fetchPartialCodSettings = createAsyncThunk(
  "partialCod/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await partialCodAPI.getSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch settings");
    }
  }
);

// Update settings
export const updatePartialCodSettings = createAsyncThunk(
  "partialCod/updateSettings",
  async ({ percentage, isEnabled }, { rejectWithValue }) => {
    try {
      const response = await partialCodAPI.updateSettings({ percentage, isEnabled });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update settings");
    }
  }
);

// ===============================
// Initial State
// ===============================

const initialState = {
  percentage: 30,
  isEnabled: true,
  loading: false,
  error: null,
  success: null,
};

// ===============================
// Slice
// ===============================

const partialCodSlice = createSlice({
  name: "partialCod",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    setPercentage: (state, action) => {
      state.percentage = action.payload;
    },
    setIsEnabled: (state, action) => {
      state.isEnabled = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchPartialCodSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartialCodSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.percentage = action.payload.percentage;
        state.isEnabled = action.payload.isEnabled;
      })
      .addCase(fetchPartialCodSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Settings
      .addCase(updatePartialCodSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updatePartialCodSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.percentage = action.payload.percentage;
        state.isEnabled = action.payload.isEnabled;
        state.success = action.payload.message;
      })
      .addCase(updatePartialCodSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ===============================
// Actions Export
// ===============================

export const { clearError, clearSuccess, setPercentage, setIsEnabled } = partialCodSlice.actions;

// ===============================
// Selectors
// ===============================

export const selectPartialCodPercentage = (state) => state.partialCod?.percentage || 30;
export const selectPartialCodEnabled = (state) => state.partialCod?.isEnabled || true;
export const selectPartialCodLoading = (state) => state.partialCod?.loading || false;
export const selectPartialCodError = (state) => state.partialCod?.error || null;

// ===============================
// Export Reducer
// ===============================

export default partialCodSlice.reducer;