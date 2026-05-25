import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { orderAPI } from "../api/orderAPI";

// ===============================
// Async Thunks - Full Payment (Razorpay)
// ===============================
export const createRazorpayOrder = createAsyncThunk(
  "order/createRazorpayOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await orderAPI.createRazorpayOrder(orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create Razorpay order");
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "order/verifyPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await orderAPI.verifyPayment(paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Payment verification failed");
    }
  }
);

// ===============================
// Async Thunks - Partial COD Payment
// ===============================
export const getPaymentMethods = createAsyncThunk(
  "order/getPaymentMethods",
  async (items, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getPaymentMethods(items);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to get payment methods");
    }
  }
);

export const createPartialCodOrder = createAsyncThunk(
  "order/createPartialCodOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await orderAPI.createPartialCodOrder(orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create partial COD order");
    }
  }
);

export const verifyPartialCodPayment = createAsyncThunk(
  "order/verifyPartialCodPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await orderAPI.verifyPartialCodPayment(paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Partial COD payment verification failed");
    }
  }
);

// ===============================
// Async Thunks - COD Order
// ===============================
export const placeCodOrder = createAsyncThunk(
  "order/placeCodOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await orderAPI.placeCodOrder(orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to place COD order");
    }
  }
);

// ===============================
// Async Thunks - Order Management
// ===============================
export const fetchUserOrders = createAsyncThunk(
  "order/fetchUserOrders",
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getUserOrders(page, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
    }
  }
);

export const fetchOrderDetails = createAsyncThunk(
  "order/fetchOrderDetails",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getOrderDetails(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch order details");
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "order/cancelOrder",
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await orderAPI.cancelOrder(orderId, reason);
      console.log("cancel order res",response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to cancel order");
    }
  }
);

export const exportOrdersToExcel = createAsyncThunk(
  "order/exportOrdersToExcel",
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await orderAPI.exportOrders(startDate, endDate);
      // Return blob data for file download
      return { data: response.data, startDate, endDate };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to export orders");
    }
  }
);

// ===============================
// Initial State
// ===============================
const initialState = {
  orders: [],
  currentOrder: null,
  razorpayOrder: null,
  orderSummary: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNext: false,
    hasPrev: false,
  },
  loading: {
    creating: false,      // Razorpay/COD order creation
    verifying: false,     // Payment verification
    fetching: false,      // Fetch orders
    cancelling: false,    // Cancel order
    partialCod: false,    // Partial COD loading
    exporting: false,
  },
  error: null,
  success: {
    orderCreated: false,
    paymentVerified: false,
    orderCancelled: false,
    exportSuccess: false,
  },
  // Partial COD specific
  paymentMethods: {
    cod: true,
    online: true,
    partialCod: false,
    partialPercentage: 0,
  },
  isBulkOrder: false,
  partialCodDetails: null,
};

// ===============================
// Slice
// ===============================
const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = {
        orderCreated: false,
        paymentVerified: false,
        orderCancelled: false,
      };
    },
    clearRazorpayOrder: (state) => {
      state.razorpayOrder = null;
      state.orderSummary = null;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearPartialCodDetails: (state) => {
      state.partialCodDetails = null;
    },
    resetPaymentMethods: (state) => {
      state.paymentMethods = {
        cod: true,
        online: true,
        partialCod: false,
        partialPercentage: 0,
      };
      state.isBulkOrder = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== Get Payment Methods ==========
      .addCase(getPaymentMethods.pending, (state) => {
        state.loading.fetching = true;
        state.error = null;
      })
      .addCase(getPaymentMethods.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.paymentMethods = {
          cod: action.payload.cod,
          online: action.payload.online,
          partialCod: action.payload.partialCod,
          partialPercentage: action.payload.partialPercentage || 0,
        };
        state.isBulkOrder = action.payload.isBulkOrder || false;
      })
      .addCase(getPaymentMethods.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error = action.payload;
      })

      // ========== Create Razorpay Order (Full Payment) ==========
      .addCase(createRazorpayOrder.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.razorpayOrder = action.payload.razorpayOrder;
        state.orderSummary = action.payload.orderSummary;
        state.success.orderCreated = true;
        // Update payment methods from response
        if (action.payload.paymentMethods) {
          state.paymentMethods = action.payload.paymentMethods;
        }
        if (action.payload.isBulkOrder !== undefined) {
          state.isBulkOrder = action.payload.isBulkOrder;
        }
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload;
      })

      // ========== Verify Full Payment ==========
      .addCase(verifyPayment.pending, (state) => {
        state.loading.verifying = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading.verifying = false;
        state.currentOrder = action.payload.order;
        state.success.paymentVerified = true;
        state.razorpayOrder = null;
        state.orderSummary = null;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading.verifying = false;
        state.error = action.payload;
      })

      // ========== Create Partial COD Order ==========
      .addCase(createPartialCodOrder.pending, (state) => {
        state.loading.partialCod = true;
        state.error = null;
      })
      .addCase(createPartialCodOrder.fulfilled, (state, action) => {
        state.loading.partialCod = false;
        state.razorpayOrder = action.payload.razorpayOrder;
        state.partialCodDetails = action.payload.partialDetails;
        state.success.orderCreated = true;
      })
      .addCase(createPartialCodOrder.rejected, (state, action) => {
        state.loading.partialCod = false;
        state.error = action.payload;
      })

      // ========== Verify Partial COD Payment ==========
      .addCase(verifyPartialCodPayment.pending, (state) => {
        state.loading.verifying = true;
        state.error = null;
      })
      .addCase(verifyPartialCodPayment.fulfilled, (state, action) => {
        state.loading.verifying = false;
        state.currentOrder = action.payload.order;
        state.success.paymentVerified = true;
        state.razorpayOrder = null;
        state.partialCodDetails = null;
      })
      .addCase(verifyPartialCodPayment.rejected, (state, action) => {
        state.loading.verifying = false;
        state.error = action.payload;
      })

      // ========== Place COD Order ==========
      .addCase(placeCodOrder.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(placeCodOrder.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.currentOrder = action.payload.order;
        state.success.orderCreated = true;
      })
      .addCase(placeCodOrder.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload;
      })

      // ========== Fetch User Orders ==========
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading.fetching = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error = action.payload;
      })

      // ========== Fetch Order Details ==========
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading.fetching = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.currentOrder = action.payload.order;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error = action.payload;
      })

      // ========== Cancel Order ==========
      .addCase(cancelOrder.pending, (state) => {
        state.loading.cancelling = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading.cancelling = false;
        state.success.orderCancelled = true;
        const index = state.orders.findIndex((order) => order._id === action.payload.order._id);
        if (index !== -1) state.orders[index] = action.payload.order;
        if (state.currentOrder && state.currentOrder._id === action.payload.order._id) {
          state.currentOrder = action.payload.order;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading.cancelling = false;
        state.error = action.payload;
      })
      .addCase(exportOrdersToExcel.pending, (state) => {
        state.loading.exporting = true;
        state.error = null;
        state.success.exportSuccess = false;
      })
      .addCase(exportOrdersToExcel.fulfilled, (state, action) => {
        state.loading.exporting = false;
        state.success.exportSuccess = true;
        // Note: Blob data is handled in component for download
        // We just store success state here
      })
      .addCase(exportOrdersToExcel.rejected, (state, action) => {
        state.loading.exporting = false;
        state.error = action.payload;
        state.success.exportSuccess = false;
      });
      
  },
});

// ===============================
// Actions Export
// ===============================
export const { 
  clearError, 
  clearSuccess, 
  clearRazorpayOrder, 
  setCurrentOrder,
  clearPartialCodDetails,
  resetPaymentMethods,
  clearExportSucess
} = orderSlice.actions;

// ===============================
// Memoized Selectors
// ===============================
const selectOrderState = (state) => state.orders || {};

export const selectOrderLoading = createSelector(
  selectOrderState,
  (order) => order.loading || {}
);

export const selectOrderError = createSelector(
  selectOrderState,
  (order) => order.error || null
);

export const selectRazorpayOrder = createSelector(
  selectOrderState,
  (order) => order.razorpayOrder || null
);

export const selectOrderSummary = createSelector(
  selectOrderState,
  (order) => order.orderSummary || null
);

export const selectOrderSuccess = createSelector(
  selectOrderState,
  (order) => order.success || {}
);

export const selectCurrentOrder = createSelector(
  selectOrderState,
  (order) => order.currentOrder || null
);

export const selectUserOrders = createSelector(
  selectOrderState,
  (order) => order.orders || []
);

export const selectOrderPagination = createSelector(
  selectOrderState,
  (order) => order.pagination || {}
);

export const selectPaymentMethods = createSelector(
  selectOrderState,
  (order) => order.paymentMethods || { cod: true, online: true, partialCod: false, partialPercentage: 0 }
);

export const selectIsBulkOrder = createSelector(
  selectOrderState,
  (order) => order.isBulkOrder || false
);

export const selectPartialCodDetails = createSelector(
  selectOrderState,
  (order) => order.partialCodDetails || null
);
export const selectExportLoading = createSelector(
  selectOrderState,
  (order) => order.loading?.exporting || false
);

export const selectExportSuccess = createSelector(
  selectOrderState,
  (order) => order.success?.exportSuccess || false
);

// Cross-slice selectors
const selectCouponState = (state) => state.coupons || {};
const selectCartState = (state) => state.cart || {};
const selectAuthState = (state) => state.auth || {};

export const selectAppliedCoupon = createSelector(
  selectCouponState,
  (coupons) => coupons.appliedCoupon || null
);

export const selectCouponLoading = createSelector(
  selectCouponState,
  (coupons) => coupons.loading || {}
);

export const selectCouponError = createSelector(
  selectCouponState,
  (coupons) => coupons.error || null
);

export const selectCartItems = createSelector(
  selectCartState,
  (cart) => cart.items || []
);

export const selectCartSummary = createSelector(
  selectCartState,
  (cart) => cart.summary || {}
);

export const selectAuthUser = createSelector(
  selectAuthState,
  (auth) => auth.user || {}
);

export const selectUser = createSelector(
  selectAuthState,
  (auth) => auth.user || {}
);

export default orderSlice.reducer;