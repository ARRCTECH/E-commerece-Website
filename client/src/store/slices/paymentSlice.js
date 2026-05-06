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
// Async thunks
export const verifyPayment = createAsyncThunk(
  "payment/verifyPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post("/payments/verify", paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Payment verification failed");
    }
  },
);
export const createPaymentIntent = createAsyncThunk(
  "payment/createPaymentIntent",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post("/payments/create-intent", orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create payment intent");
    }
  },
);
export const processRefund = createAsyncThunk(
  "payment/processRefund",
  async ({ paymentId, amount, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post("/payments/refund", { paymentId, amount, reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Refund processing failed");
    }
  },
);
export const fetchPaymentHistory = createAsyncThunk(
  "payment/fetchPaymentHistory",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/payments/history", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch payment history");
    }
  },
);
export const updatePaymentStatus = createAsyncThunk(
  "payment/updatePaymentStatus",
  async ({ paymentId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/payments/${paymentId}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update payment status");
    }
  },
);
const initialState = {
  currentPayment: null,
  paymentHistory: [],
  paymentIntent: null,
  loading: {
    verifying: false,
    creating: false,
    refunding: false,
    fetching: false,
    updating: false,
  },
  error: null,
  success: {
    paymentVerified: false,
    paymentCreated: false,
    refundProcessed: false,
    statusUpdated: false,
  },
};
const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = {
        paymentVerified: false,
        paymentCreated: false,
        refundProcessed: false,
        statusUpdated: false,
      };
    },
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload;
    },
    clearPaymentIntent: (state) => {
      state.paymentIntent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Verify Payment
      .addCase(verifyPayment.pending, (state) => {
        state.loading.verifying = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading.verifying = false;
        state.currentPayment = action.payload.payment;
        state.success.paymentVerified = true;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading.verifying = false;
        state.error = action.payload;
      })
      // Create Payment Intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.paymentIntent = action.payload.paymentIntent;
        state.success.paymentCreated = true;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload;
      })
      // Process Refund
      .addCase(processRefund.pending, (state) => {
        state.loading.refunding = true;
        state.error = null;
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.loading.refunding = false;
        state.success.refundProcessed = true;
        // Update payment history if the refunded payment exists
        const index = state.paymentHistory.findIndex((payment) => payment._id === action.payload.payment._id);
        if (index !== -1) {
          state.paymentHistory[index] = action.payload.payment;
        }
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.loading.refunding = false;
        state.error = action.payload;
      })
      // Fetch Payment History
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.loading.fetching = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.paymentHistory = action.payload.payments;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error = action.payload;
      })
      // Update Payment Status
      .addCase(updatePaymentStatus.pending, (state) => {
        state.loading.updating = true;
        state.error = null;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.loading.updating = false;
        state.success.statusUpdated = true;
        // Update payment in history
        const index = state.paymentHistory.findIndex((payment) => payment._id === action.payload.payment._id);
        if (index !== -1) {
          state.paymentHistory[index] = action.payload.payment;
        }
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.loading.updating = false;
        state.error = action.payload;
      });
  },
});
export const { clearError, clearSuccess, setCurrentPayment, clearPaymentIntent } = paymentSlice.actions;
export default paymentSlice.reducer;