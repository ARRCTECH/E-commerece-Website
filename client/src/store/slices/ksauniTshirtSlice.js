// client/src/redux/ksauniTshirtSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchKsauniTshirtsAPI,
  createKsauniTshirtAPI,
  updateKsauniTshirtAPI,
  deleteKsauniTshirtAPI,
} from "../api/ksauniTshirtApi";
// Thunks
export const fetchKsauniTshirts = createAsyncThunk("ksauniTshirt/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await fetchKsauniTshirtsAPI();
  } catch (error) {
    return rejectWithValue(error.message);
  }
});
export const createKsauniTshirt = createAsyncThunk("ksauniTshirt/create", async (formData, { rejectWithValue }) => {
  try {
    return await createKsauniTshirtAPI(formData);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});
export const updateKsauniTshirt = createAsyncThunk(
  "ksauniTshirt/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      return await updateKsauniTshirtAPI(id, formData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
export const deleteKsauniTshirt = createAsyncThunk("ksauniTshirt/delete", async (id, { rejectWithValue }) => {
  try {
    return await deleteKsauniTshirtAPI(id);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});
// Slice
const ksauniTshirtSlice = createSlice({
  name: "ksauniTshirt",
  initialState: {
    tshirts: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchKsauniTshirts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchKsauniTshirts.fulfilled, (state, action) => {
        state.loading = false;
        state.tshirts = action.payload.data || action.payload;
      })
      .addCase(fetchKsauniTshirts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createKsauniTshirt.fulfilled, (state, action) => {
        state.tshirts.push(action.payload.tshirt || action.payload);
      })
      // Update
      .addCase(updateKsauniTshirt.fulfilled, (state, action) => {
        const updatedTshirt = action.payload.tshirt || action.payload;
        const index = state.tshirts.findIndex((t) => t._id === updatedTshirt._id);
        if (index !== -1) state.tshirts[index] = updatedTshirt;
      })
      // Delete
      .addCase(deleteKsauniTshirt.fulfilled, (state, action) => {
        state.tshirts = state.tshirts.filter((t) => t._id !== action.payload);
      });
  },
});
export const { clearError } = ksauniTshirtSlice.actions;
export default ksauniTshirtSlice.reducer;