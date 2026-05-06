import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { orderAPI } from "../api/orderAPI";
// Async thunks
export const createRazorpayOrder = createAsyncThunk(
  "order/createRazorpayOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await orderAPI.createRazorpayOrder(orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create Razorpay order");
    }
  },
);
export const verifyPayment = createAsyncThunk("order/verifyPayment", async (paymentData, { rejectWithValue }) => {
  try {
    const response = await orderAPI.verifyPayment(paymentData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Payment verification failed");
  }
});
export const placeCodOrder = createAsyncThunk("order/placeCodOrder", async (orderData, { rejectWithValue }) => {
  try {
    const response = await orderAPI.placeCodOrder(orderData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to place COD order");
  }
});
export const fetchUserOrders = createAsyncThunk(
  "order/fetchUserOrders",
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getUserOrders(page, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
    }
  },
);
export const fetchOrderDetails = createAsyncThunk("order/fetchOrderDetails", async (orderId, { rejectWithValue }) => {
  try {
    const response = await orderAPI.getOrderDetails(orderId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch order details");
  }
});
export const trackOrder = createAsyncThunk("order/trackOrder", async (orderId, { rejectWithValue }) => {
  try {
    const response = await orderAPI.trackOrder(orderId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to track order");
  }
});
export const trackOrderInfo = createAsyncThunk("order/fetchAndSetTrackingInfo", async (order, { rejectWithValue }) => {
  try {
    const response = await orderAPI.trackOrder(order);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to track order");
  }
});
export const getShippingRates = createAsyncThunk("order/getShippingRates", async (rateData, { rejectWithValue }) => {
  try {
    const response = await orderAPI.getShippingRates(rateData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to get shipping rates");
  }
});
export const cancelOrder = createAsyncThunk("order/cancelOrder", async ({ orderId, reason }, { rejectWithValue }) => {
  try {
    const response = await orderAPI.cancelOrder(orderId, reason);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to cancel order");
  }
});
const initialState = {
  orders: [],
  currentOrder: null,
  razorpayOrder: null,
  orderSummary: null,
  trackingData: null,
  shippingRates: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNext: false,
    hasPrev: false,
  },
  loading: {
    creating: false,
    verifying: false,
    fetching: false,
    cancelling: false,
    tracking: false,
    shippingRates: false,
  },
  error: null,
  success: {
    orderCreated: false,
    paymentVerified: false,
    orderCancelled: false,
  },
  tracking: null,
  trackLoading: false,
  error: null,
};
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
    clearTrackingData: (state) => {
      state.trackingData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Razorpay order creation
      .addCase(createRazorpayOrder.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.razorpayOrder = action.payload.razorpayOrder;
        state.orderSummary = action.payload.orderSummary;
        state.success.orderCreated = true;
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload;
      })
      // Payment verification
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
      // COD order
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
      // Fetch user orders
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
      // Fetch order details
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
      // Track order
      .addCase(trackOrder.pending, (state) => {
        state.loading.tracking = true;
        state.error = null;
      })
      .addCase(trackOrder.fulfilled, (state, action) => {
        state.loading.tracking = false;
        state.currentOrder = action.payload.order;
        state.trackingData = action.payload.trackingData;
      })
      .addCase(trackOrder.rejected, (state, action) => {
        state.loading.tracking = false;
        state.error = action.payload;
      })
      // Shipping rates
      .addCase(getShippingRates.pending, (state) => {
        state.loading.shippingRates = true;
        state.error = null;
      })
      .addCase(getShippingRates.fulfilled, (state, action) => {
        state.loading.shippingRates = false;
        state.shippingRates = action.payload.rates || [];
      })
      .addCase(getShippingRates.rejected, (state, action) => {
        state.loading.shippingRates = false;
        state.error = action.payload;
      })
      // Cancel order
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
       .addCase(trackOrderInfo.pending, (state) => {
        state.trackLoading = true;
        state.error = null;
      })
      .addCase(trackOrderInfo.fulfilled, (state, action) => {
        state.trackLoading = false;
        state.tracking = action.payload; // full API response
      })
      .addCase(trackOrderInfo.rejected, (state, action) => {
        state.trackLoading = false;
        state.error = action.payload;
      });
  },
});
export const { clearError, clearSuccess, clearRazorpayOrder, setCurrentOrder, clearTrackingData } = orderSlice.actions;
// Memoized Selectors
const selectOrderState = (state) => state.orders || {};
const selectCouponState = (state) => state.coupons || {};
const selectCartState = (state) => state.cart || {};
const selectAuthState = (state) => state.auth || {};
export const selectShippingRates = createSelector(
  selectOrderState,
  (order) => order.shippingRates || []
);
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
export const selectTrackingData = createSelector(
  selectOrderState,
  (order) => order.trackingData || null
);
// Cross-slice selectors
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