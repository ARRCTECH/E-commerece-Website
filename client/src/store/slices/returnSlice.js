import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import returnAPI from "../api/returnAPI";
// Async thunks
export const createReturnRequest = createAsyncThunk(
  "returns/createReturnRequest",
  async (returnData, { rejectWithValue }) => {
    try {
      const response = await returnAPI.createReturnRequest(returnData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create return request");
    }
  },
);
export const getUserReturns = createAsyncThunk(
  "returns/getUserReturns",
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await returnAPI.getUserReturns(page, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch returns");
    }
  },
);
export const getReturnDetails = createAsyncThunk("returns/getReturnDetails", async (returnId, { rejectWithValue }) => {
  try {
    const response = await returnAPI.getReturnDetails(returnId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch return details");
  }
});
const initialState = {
  returns: [],
  currentReturn: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalReturns: 0,
    hasNext: false,
    hasPrev: false,
  },
  loading: {
    creating: false,
    fetching: false,
  },
  error: null,
  success: {
    returnCreated: false,
  },
};
const returnSlice = createSlice({
  name: "returns",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = {
        returnCreated: false,
      };
    },
    setCurrentReturn: (state, action) => {
      state.currentReturn = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Return Request
      .addCase(createReturnRequest.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(createReturnRequest.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.returns.unshift(action.payload.return);
        state.success.returnCreated = true;
      })
      .addCase(createReturnRequest.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload;
      })
      // Get User Returns
      .addCase(getUserReturns.pending, (state) => {
        state.loading.fetching = true;
        state.error = null;
      })
      .addCase(getUserReturns.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.returns = action.payload.returns;
        state.pagination = action.payload.pagination;
      })
      .addCase(getUserReturns.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error = action.payload;
      })
      // Get Return Details
      .addCase(getReturnDetails.pending, (state) => {
        state.loading.fetching = true;
        state.error = null;
      })
      .addCase(getReturnDetails.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.currentReturn = action.payload.return;
      })
      .addCase(getReturnDetails.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error = action.payload;
      });
  },
});
export const { clearError, clearSuccess, setCurrentReturn } = returnSlice.actions;
export default returnSlice.reducer;