import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/baseApi";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Async thunk to fetch popup visibility setting
export const fetchPopupSetting = createAsyncThunk(
  "popup/fetchPopupSetting",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/popup-setting");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch popup setting");
    }
  }
);
// Async thunk to update popup visibility setting
export const updatePopupSetting = createAsyncThunk(
  "popup/updatePopupSetting",
  async (popupData, { rejectWithValue }) => {
    try {
      const response = await api.put("/popup-setting", popupData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update popup setting");
    }
  }
);
const popupSlice = createSlice({
  name: "popup",
  initialState: {
    showSalePopup: false,
    popupBanners: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPopupSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPopupSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.showSalePopup = action.payload.showSalePopup;
        state.popupBanners = action.payload.popupBanners || [];
      })
      .addCase(fetchPopupSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePopupSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePopupSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.showSalePopup = action.payload.showSalePopup;
        state.popupBanners = action.payload.popupBanners || [];
      })
      .addCase(updatePopupSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export default popupSlice.reducer;