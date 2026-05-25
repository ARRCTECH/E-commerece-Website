const express = require("express");
const {
  createRazorpayOrder,
  placeCodOrder,
  verifyPaymentAndCreateOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  createPartialCodOrder,        
  verifyPartialCodPayment,    
  getPaymentMethodsHandler,
  returnOrder ,
  exportOrdersToExcel
} = require("../controllers/orderController");
const { protect, optionalProtect } = require("../middleware/auth");

const router = express.Router();

// ===============================
// Payment Methods
// ===============================
router.get("/payment-methods", optionalProtect, getPaymentMethodsHandler);

// ===============================
// Partial COD Routes
// ===============================
router.post("/create-partial-cod-order", optionalProtect, createPartialCodOrder);  // ✅ ADD THIS ROUTE
router.post("/verify-partial-cod-payment", optionalProtect, verifyPartialCodPayment);  // ✅ ADD THIS ROUTE

// ===============================
// Order Creation Routes
// ===============================
router.post("/create-razorpay-order", optionalProtect, createRazorpayOrder);
router.post("/cod", optionalProtect, placeCodOrder);
router.post("/verify-payment", optionalProtect, verifyPaymentAndCreateOrder);

// ===============================
// Order Management Routes
// ===============================
router.get("/my-orders", protect, getUserOrders);
router.get("/:orderId", optionalProtect, getOrderDetails);
router.put("/:orderId/cancel", protect, cancelOrder);
router.post("/return",returnOrder)
router.post("/export-orders", protect, exportOrdersToExcel);

module.exports = router;