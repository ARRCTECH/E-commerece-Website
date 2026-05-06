const Order = require("../models/Order")
const User = require("../models/User")
const crypto = require("crypto")
const nodemailer = require("nodemailer")

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send status update email
const sendStatusUpdateEmail = async (order, newStatus) => {
  try {
    const user = await User.findById(order.user)
    if (!user) return

    const statusMessages = {
      shipped: "Your order has been shipped!",
      out_for_delivery: "Your order is out for delivery!",
      delivered: "Your order has been delivered!",
      cancelled: "Your order has been cancelled.",
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ec4899;">Order Status Update - Ksaunibliss</h2>
        <p>Dear ${user.name || "Customer"},</p>
        <p>${statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}`}</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Status:</strong> ${newStatus.replace("_", " ").toUpperCase()}</p>
          ${
            order.trackingInfo?.trackingNumber
              ? `<p><strong>Tracking Number:</strong> ${order.trackingInfo.trackingNumber}</p>`
              : ""
          }
          ${
            order.trackingInfo?.trackingUrl
              ? `<p><a href="${order.trackingInfo.trackingUrl}" style="color: #ec4899;">Track your order</a></p>`
              : ""
          }
        </div>
        
        <p>Thank you for shopping with Ksaunibliss!</p>
      </div>
    `

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: `Order ${order.orderNumber} - Status Update`,
      html: emailHtml,
    })

  } catch (error) {
    console.error("❌ Failed to send status update email:", error)
  }
}

// Enhanced webhook handler
const handleWebhook = async (req, res) => {
  try {

    // Verify webhook signature if provided
    const signature = req.headers["x-shiprocket-signature"]
    if (signature && process.env.SHIPROCKET_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.SHIPROCKET_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex")

      if (signature !== expectedSignature) {
        console.error("❌ Invalid webhook signature")
        return res.status(401).json({ message: "Invalid signature" })
      }
    }

    const { awb, current_status, delivered_date, pickup_date, order_id, shipment_id, courier_name, etd } = req.body

    if (!awb && !order_id) {
      return res.status(400).json({ message: "AWB code or order ID is required" })
    }

    // Find order by tracking number or Shiprocket order ID
    let order
    if (awb) {
      order = await Order.findOne({ "trackingInfo.trackingNumber": awb })
    } else if (order_id) {
      order = await Order.findOne({ "trackingInfo.shiprocketOrderId": order_id })
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Map Shiprocket status to our order status
    let orderStatus = order.status
    const currentStatusLower = current_status?.toLowerCase() || ""

    switch (currentStatusLower) {
      case "shipped":
      case "in transit":
      case "in_transit":
        orderStatus = "shipped"
        break
      case "out for delivery":
      case "out_for_delivery":
        orderStatus = "out_for_delivery"
        break
      case "delivered":
        orderStatus = "delivered"
        if (delivered_date && !order.deliveredAt) {
          order.deliveredAt = new Date(delivered_date)
        }
        break
      case "cancelled":
      case "rto":
      case "lost":
        orderStatus = "cancelled"
        if (!order.cancelledAt) {
          order.cancelledAt = new Date()
        }
        break
      case "picked up":
      case "pickup_scheduled":
        orderStatus = "processing"
        break
      default:
        if (
          !["confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"].includes(orderStatus)
        ) {
          orderStatus = "processing"
        }
    }

    // Update order tracking info
    if (!order.trackingInfo) {
      order.trackingInfo = {}
    }

    const previousStatus = order.status
    order.status = orderStatus
    order.trackingInfo.currentStatus = current_status
    order.trackingInfo.lastUpdate = new Date()

    if (awb && !order.trackingInfo.trackingNumber) {
      order.trackingInfo.trackingNumber = awb
      order.trackingInfo.trackingUrl = `https://shiprocket.co/tracking/${awb}`
    }

    if (courier_name && !order.trackingInfo.carrier) {
      order.trackingInfo.carrier = courier_name
    }

    if (shipment_id && !order.trackingInfo.shipmentId) {
      order.trackingInfo.shipmentId = shipment_id
    }

    if (pickup_date && !order.trackingInfo.pickupDate) {
      order.trackingInfo.pickupDate = new Date(pickup_date)
    }

    if (etd && !order.trackingInfo.estimatedDelivery) {
      order.trackingInfo.estimatedDelivery = new Date(etd)
    }
    await order.save()
    // Send email notification if status changed significantly
    if (
      previousStatus !== orderStatus &&
      ["shipped", "out_for_delivery", "delivered", "cancelled"].includes(orderStatus)
    ) {
      await sendStatusUpdateEmail(order, orderStatus)
    }
    res.status(200).json({
      message: "Webhook processed successfully",
      order_number: order.orderNumber,
      previous_status: previousStatus,
      new_status: orderStatus,
    })
  } catch (error) {
    console.error("❌ Shiprocket webhook error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
// Get webhook logs (for debugging)
const getWebhookLogs = async (req, res) => {
  try {
    // You can implement a webhook log collection system here
    res.status(200).json({
      success: true,
      message: "Webhook logs endpoint - implement as needed",
    })
  } catch (error) {
    console.error("Get webhook logs error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get webhook logs",
    })
  }
}
module.exports = {
  handleWebhook,
  getWebhookLogs,
}
