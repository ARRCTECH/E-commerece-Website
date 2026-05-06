const express = require("express")
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  createRefund,
  getPaymentDetails,
} = require("../controllers/paymentController")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Public routes
router.post("/webhook", handleRazorpayWebhook)

// Protected routes
router.use(auth)

router.post("/create-order", createRazorpayOrder)
router.post("/verify", verifyRazorpayPayment)
router.get("/:paymentId", getPaymentDetails)

// Admin only routes
router.post("/refund", adminAuth, createRefund)

module.exports = router
