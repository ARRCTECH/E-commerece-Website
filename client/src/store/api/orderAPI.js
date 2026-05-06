import axios from "axios";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
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
        '/orders/shipping-rates'
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
  // Create Razorpay order
  createRazorpayOrder: (orderData) =>
    api.post("/orders/create-razorpay-order", orderData),
  // Verify payment
  verifyPayment: (paymentData) =>
    api.post("/orders/verify-payment", paymentData),
  // Get user orders
  getUserOrders: (page = 1, limit = 10) =>
    api.get(`/orders/my-orders?page=${page}&limit=${limit}`),
  // Get order details
  getOrderDetails: (orderId) => api.get(`/orders/${orderId}`),
  // Get shipping rates
  getShippingRates: (rateData) => api.post("/orders/shipping-rates", rateData),
  // Cancel order
  cancelOrder: (orderId, reason) =>
    api.put(`/orders/${orderId}/cancel`, { reason }),
  //COD order
  placeCodOrder: (orderData) => api.post("/orders/cod", orderData),
  trackOrder: (order) => api.post("orders/trackingOrder",order)
};