import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fashionhub_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for authenticated routes, not guest checkout
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      
      // Don't redirect for guest checkout routes
      const guestRoutes = [
        '/orders/create-razorpay-order',
        '/orders/cod',
        '/orders/verify-payment',
        '/orders/create-partial-cod-order',
        '/orders/verify-partial-cod-payment',
        '/orders/payment-methods'
      ];
      
      const isGuestRoute = guestRoutes.some(route => requestUrl.includes(route));
      
      if (!isGuestRoute) {
        localStorage.removeItem("fashionhub_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const orderAPI = {
  // ===============================
  // Payment Methods
  // ===============================
  getPaymentMethods: (items) =>
    api.post("/orders/payment-methods", { items }),

  // ===============================
  // Full Payment (Razorpay)
  // ===============================
  createRazorpayOrder: (orderData) =>
    api.post("/orders/create-razorpay-order", orderData),
  
  verifyPayment: (paymentData) =>
    api.post("/orders/verify-payment", paymentData),

  // ===============================
  // Partial COD Payment
  // ===============================
 // ===============================
// Partial COD Payment (UPDATED)
// ===============================
createPartialCodOrder: (orderData) =>
  api.post("/orders/create-partial-cod-order", {
    items: orderData.items,
    shippingAddress: orderData.shippingAddress,
    couponCode: orderData.couponCode,
    totalAmount: orderData.totalAmount,
    onlineAmount: orderData.onlineAmount,
    codAmount: orderData.codAmount,
    percentage: orderData.partialPercentage,
    freediscount: orderData.freediscount,
    referralDiscount: orderData.referralDiscount,
  }),
  
  verifyPartialCodPayment: (paymentData) =>
    api.post("/orders/verify-partial-cod-payment", paymentData),

  // ===============================
  // COD Order
  // ===============================
  placeCodOrder: (orderData) => 
    api.post("/orders/cod", orderData),

  // ===============================
  // Order Management
  // ===============================
  getUserOrders: (page = 1, limit = 10) =>
    api.get(`/orders/my-orders?page=${page}&limit=${limit}`),
  
  getOrderDetails: (orderId) => 
    api.get(`/orders/${orderId}`),
  
  cancelOrder: (orderId, reason) =>
    api.put(`/orders/${orderId}/cancel`, { reason }),
  
   exportOrders: (startDate, endDate) =>
    api.post("/orders/export-orders", { startDate, endDate }, {
      responseType: "blob"  // Important for file download
    }),
  placeFreeOrder: (orderData) =>
    api.post("/orders/free-order", orderData),
};