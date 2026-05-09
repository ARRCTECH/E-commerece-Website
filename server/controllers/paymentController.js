const Razorpay = require("razorpay")
const crypto = require("crypto")
const Order = require("../models/Order")
const Product = require("../models/Product")
const { sendEmail } = require("../utils/emailService")

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ===============================
// Create Razorpay Order
// ===============================
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
      amount: Math.round(amount * 100),
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

// ===============================
// Verify Razorpay Payment
// ===============================
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data",
      })
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      })
    }

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

// ===============================
// Create Refund
// ===============================
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
      refundData.amount = Math.round(amount * 100)
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

// ===============================
// Get Payment Details
// ===============================
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

// ===============================
// Handle Payment Captured (Webhook)
// ===============================
const handlePaymentCaptured = async (payment) => {
  try {
    const order = await Order.findOne({
      "paymentInfo.razorpayOrderId": payment.order_id,
    })

    if (!order) return

    // Update order payment status
    order.paymentInfo.status = "PAID"
    order.paymentInfo.razorpayPaymentId = payment.id
    order.paymentInfo.paidAt = new Date()
    
    // Confirm order if not already confirmed
    if (order.status === "ABANDONED" || order.status === "PLACED") {
      order.status = "CONFIRMED"
    }
    
    await order.save()

    // Send email notification
    try {
      await sendOrderConfirmationEmail(order)
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
    }

    console.log(`✅ Payment captured for order: ${order.orderNumber}`)
  } catch (error) {
    console.error("Handle payment captured error:", error)
  }
}

// ===============================
// Handle Payment Failed (Webhook)
// ===============================
const handlePaymentFailed = async (payment) => {
  try {
    const order = await Order.findOne({
      "paymentInfo.razorpayOrderId": payment.order_id,
    })

    if (!order) return

    order.paymentInfo.status = "FAILED"
    order.status = "CANCELLED"
    await order.save()

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      })
    }

    console.log(`❌ Payment failed for order: ${order.orderNumber}`)
  } catch (error) {
    console.error("Handle payment failed error:", error)
  }
}

// ===============================
// Handle Refund Created (Webhook)
// ===============================
const handleRefundCreated = async (refund) => {
  try {
    const order = await Order.findOne({
      "paymentInfo.razorpayPaymentId": refund.payment_id,
    })

    if (!order) return

    order.paymentInfo.status = "REFUNDED"
    order.status = "CANCELLED"
    await order.save()

    console.log(`🔄 Refund created for order: ${order.orderNumber}`)
  } catch (error) {
    console.error("Handle refund created error:", error)
  }
}

// ===============================
// Razorpay Webhook Handler
// ===============================
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
      console.error("❌ Invalid webhook signature")
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      })
    }

    const { event, payload } = req.body

    console.log(`📢 Webhook received: ${event}`)

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload.payment.entity)
        break
      case "payment.failed":
        await handlePaymentFailed(payload.payment.entity)
        break
      case "refund.created":
        await handleRefundCreated(payload.refund.entity)
        break
      default:
        console.log(`⚠️ Unhandled event type: ${event}`)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("❌ Webhook handling error:", error)
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    })
  }
}

// Helper function to send order confirmation email
const sendOrderConfirmationEmail = async (order) => {
  try {
    const user = await User.findById(order.user)
    if (!user?.email && !order.shippingAddress?.email) return

    const toEmail = user?.email || order.shippingAddress?.email
    const totalNum = order.total || 0
    const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`

    const emailData = {
      customerName: user?.name || order.shippingAddress?.fullName || "Valued Customer",
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      total: fmt(totalNum),
      paymentMethod: order.paymentInfo?.method || "RAZORPAY",
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: fmt(item.price),
        totalPrice: fmt(item.price * item.quantity),
        size: item.size,
        color: item.color,
      })),
      shippingAddress: order.shippingAddress,
    }

    await sendEmail({
      to: toEmail,
      template: 'orderConfirmation',
      data: emailData
    })
  } catch (error) {
    console.error("Send order confirmation email error:", error)
  }
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  createRefund,
  getPaymentDetails,
}