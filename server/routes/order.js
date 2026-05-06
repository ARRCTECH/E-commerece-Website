const express = require("express");
const {
  createRazorpayOrder,
  placeCodOrder,
  verifyPaymentAndCreateOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  trackOrder,
  getShippingRates,
  fetchAndSetTrackingInfo
} = require("../controllers/orderController");
const { protect, optionalProtect } = require("../middleware/auth");

const router = express.Router();

// Shipping rates route - supports guest checkout
router.post('/shipping-rates', optionalProtect, getShippingRates)
router.post('/trackingOrder', optionalProtect, fetchAndSetTrackingInfo)

// Order creation routes - support guest checkout
router.post("/create-razorpay-order", optionalProtect, createRazorpayOrder);
router.post("/cod", optionalProtect, placeCodOrder);
router.post("/verify-payment", optionalProtect, verifyPaymentAndCreateOrder);

// Order management routes - require authentication
router.get("/my-orders", protect, getUserOrders);
router.get("/:orderId", optionalProtect, getOrderDetails);
router.get("/:orderId/track", optionalProtect, trackOrder);
router.put("/:orderId/cancel", protect, cancelOrder);

module.exports = router;
