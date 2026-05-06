const Razorpay = require("razorpay")
const crypto = require("crypto")
const Order = require("../models/Order")
const User = require("../models/User")
const Product = require("../models/Product")

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Create Razorpay order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      })
    }

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    }



    const razorpayOrder = await razorpay.orders.create(options)
    res.status(200).json({
      success: true,
      order: razorpayOrder,
    })
  } catch (error) {
    console.error("Create Razorpay order error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    })
  }
}

// Verify Razorpay payment
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data",
      })
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      })
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id)

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        created_at: payment.created_at,
      },
    })
  } catch (error) {
    console.error("Verify Razorpay payment error:", error)
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    })
  }
}

// Handle Razorpay webhooks
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"]
    const webhookBody = JSON.stringify(req.body)

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest("hex")

    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      })
    }

    const { event, payload } = req.body

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload.payment.entity)
        break
      case "payment.failed":
        await handlePaymentFailed(payload.payment.entity)
        break
      case "order.paid":
        await handleOrderPaid(payload.order.entity)
        break
      case "refund.created":
        await handleRefundCreated(payload.refund.entity)
        break
      default:
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Webhook handling error:", error)
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    })
  }
}

// Handle payment captured
const handlePaymentCaptured = async (payment) => {
  try {

    // Find order by Razorpay order ID
    const order = await Order.findOne({
      "paymentInfo.razorpayOrderId": payment.order_id,
    })

    if (order) {
      order.paymentInfo.paymentStatus = "completed"
      order.paymentInfo.razorpayPaymentId = payment.id
      order.paymentInfo.paidAt = new Date()
      order.status = "confirmed"
      await order.save()

    }
  } catch (error) {
    console.error("Handle payment captured error:", error)
  }
}

// Handle payment failed
const handlePaymentFailed = async (payment) => {
  try {

    const order = await Order.findOne({
      "paymentInfo.razorpayOrderId": payment.order_id,
    })

    if (order) {
      order.paymentInfo.paymentStatus = "failed"
      order.status = "cancelled"
      await order.save()

      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        })
      }

    }
  } catch (error) {
    console.error("Handle payment failed error:", error)
  }
}

// Handle order paid
const handleOrderPaid = async (order) => {
  try {
    // Additional logic for order paid event
  } catch (error) {
    console.error("Handle order paid error:", error)
  }
}

// Handle refund created
const handleRefundCreated = async (refund) => {
  try {

    const order = await Order.findOne({
      "paymentInfo.razorpayPaymentId": refund.payment_id,
    })

    if (order) {
      order.paymentInfo.paymentStatus = "refunded"
      order.status = "refunded"
      await order.save()

    }
  } catch (error) {
    console.error("Handle refund created error:", error)
  }
}

// Create refund
const createRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      })
    }

    const refundData = {
      payment_id: paymentId,
      notes: {
        reason: reason || "Customer request",
      },
    }

    if (amount) {
      refundData.amount = Math.round(amount * 100) // Amount in paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundData)

    res.status(200).json({
      success: true,
      message: "Refund initiated successfully",
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        created_at: refund.created_at,
      },
    })
  } catch (error) {
    console.error("Create refund error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create refund",
    })
  }
}

// Get payment details
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params

    const payment = await razorpay.payments.fetch(paymentId)

    res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        created_at: payment.created_at,
        captured: payment.captured,
      },
    })
  } catch (error) {
    console.error("Get payment details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
    })
  }
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  createRefund,
  getPaymentDetails,
}
