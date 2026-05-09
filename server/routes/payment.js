const express = require("express")
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  createRefund,
  getPaymentDetails,
} = require("../controllers/paymentController")
const { protect, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Public Routes
// Webhook - Razorpay calls this (no auth required)
router.post("/webhook", handleRazorpayWebhook)

// Protected Routes (Auth Required)
router.use(protect)

// Create Razorpay order
router.post("/create-order", createRazorpayOrder)

// Verify payment
router.post("/verify", verifyRazorpayPayment)

// Get payment details
router.get("/:paymentId", getPaymentDetails)

// Admin only - Create refund
router.post("/refund", adminAuth, createRefund)

module.exports = router