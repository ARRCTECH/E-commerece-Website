const Return = require("../models/Return")
const Order = require("../models/Order")
const Product = require("../models/Product")
const User = require("../models/User")
const Razorpay = require("razorpay")
const { uploadToCloudinary } = require("../utils/cloudinary")
const nodemailer = require("nodemailer")

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Create return request
const createReturnRequest = async (req, res) => {
  try {
    const { orderId, type, items, reason, description } = req.body
    const userId = req.user.userId

    // Validate order
    const order = await Order.findOne({ _id: orderId, user: userId }).populate("items.product")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if order is eligible for return (within 7 days of delivery)
    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Order must be delivered to request return",
      })
    }

    const deliveryDate = order.deliveredAt || order.createdAt
    const daysSinceDelivery = Math.floor((new Date() - deliveryDate) / (1000 * 60 * 60 * 24))

    if (daysSinceDelivery > 7) {
      return res.status(400).json({
        success: false,
        message: "Return window has expired. Returns are only allowed within 7 days of delivery.",
      })
    }

    // Validate items
    const returnItems = []
    let totalRefundAmount = 0

    for (const item of items) {
      const orderItem = order.items.find((oi) => oi._id.toString() === item.orderItemId)
      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: "Invalid order item",
        })
      }

      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot return more than ordered quantity for ${orderItem.name}`,
        })
      }

      const refundAmount = orderItem.price * item.quantity
      totalRefundAmount += refundAmount

      returnItems.push({
        product: orderItem.product,
        name: orderItem.name,
        price: orderItem.price,
        quantity: item.quantity,
        size: orderItem.size,
        color: orderItem.color,
        image: orderItem.image,
        reason: item.reason || reason,
      })
    }

    // Handle image uploads
    const images = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "returns")
        images.push({
          url: result.secure_url,
          alt: "Return request image",
        })
      }
    }

    // Create return request
    const returnRequest = new Return({
      user: userId,
      order: orderId,
      type,
      items: returnItems,
      reason,
      description,
      images,
      refundAmount: totalRefundAmount,
    })

    await returnRequest.save()

    // Send notification email to admin
    await sendReturnNotificationEmail(returnRequest, order)

    res.status(201).json({
      success: true,
      message: "Return request created successfully",
      returnRequest: {
        id: returnRequest._id,
        returnNumber: returnRequest.returnNumber,
        type: returnRequest.type,
        status: returnRequest.status,
        refundAmount: returnRequest.refundAmount,
      },
    })
  } catch (error) {
    console.error("Create return request error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create return request",
    })
  }
}

// Get user return requests
const getUserReturns = async (req, res) => {
  try {
    const userId = req.user.userId
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const returns = await Return.find({ user: userId })
      .populate("order", "orderNumber createdAt")
      .populate("items.product", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalReturns = await Return.countDocuments({ user: userId })

    res.status(200).json({
      success: true,
      returns,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReturns / limit),
        totalReturns,
        hasNext: page < Math.ceil(totalReturns / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get user returns error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch return requests",
    })
  }
}

// Get return details
const getReturnDetails = async (req, res) => {
  try {
    const { returnId } = req.params
    const userId = req.user.userId

    const returnRequest = await Return.findOne({ _id: returnId, user: userId })
      .populate("order", "orderNumber createdAt shippingAddress")
      .populate("items.product", "name images")
      .populate("processedBy", "name email")

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      })
    }

    res.status(200).json({
      success: true,
      returnRequest,
    })
  } catch (error) {
    console.error("Get return details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch return details",
    })
  }
}

// Admin: Get all return requests
const getAllReturns = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status
    const skip = (page - 1) * limit

    const query = {}
    if (status) {
      query.status = status
    }

    const returns = await Return.find(query)
      .populate("user", "name email phoneNumber")
      .populate("order", "orderNumber createdAt")
      .populate("items.product", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalReturns = await Return.countDocuments(query)

    res.status(200).json({
      success: true,
      returns,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReturns / limit),
        totalReturns,
        hasNext: page < Math.ceil(totalReturns / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get all returns error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch return requests",
    })
  }
}

// Admin: Update return status
const updateReturnStatus = async (req, res) => {
  try {
    const { returnId } = req.params
    const { status, adminNotes } = req.body
    const adminId = req.user.userId

    const returnRequest = await Return.findById(returnId).populate("order").populate("user")

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      })
    }

    // Update return status
    returnRequest.status = status
    returnRequest.adminNotes = adminNotes
    returnRequest.processedBy = adminId
    returnRequest.processedAt = new Date()

    if (status === "completed") {
      returnRequest.completedAt = new Date()
    }

    await returnRequest.save()

    // If approved and type is refund, process refund
    if (status === "approved" && returnRequest.type === "refund") {
      try {
        await processRefund(returnRequest)
      } catch (refundError) {
        console.error("Refund processing error:", refundError)
      }
    }

    // Send status update email to user
    await sendReturnStatusUpdateEmail(returnRequest)

    res.status(200).json({
      success: true,
      message: "Return status updated successfully",
      returnRequest,
    })
  } catch (error) {
    console.error("Update return status error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update return status",
    })
  }
}

// Process refund
const processRefund = async (returnRequest) => {
  try {
    const order = returnRequest.order
    const refundAmount = Math.round(returnRequest.refundAmount * 100) // Convert to paise

    const refund = await razorpay.payments.refund(order.paymentInfo.razorpayPaymentId, {
      amount: refundAmount,
      notes: {
        return_id: returnRequest._id.toString(),
        return_number: returnRequest.returnNumber,
      },
    })

    // Update return with refund details
    returnRequest.refundStatus = "completed"
    returnRequest.refundTransactionId = refund.id
    await returnRequest.save()

    // Update order status if fully refunded
    const totalOrderAmount = order.pricing.total * 100
    if (refundAmount >= totalOrderAmount) {
      order.status = "refunded"
      await order.save()
    }

    return refund
  } catch (error) {
    console.error("Process refund error:", error)
    throw error
  }
}

// Send return notification email to admin
const sendReturnNotificationEmail = async (returnRequest, order) => {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ec4899;">New Return Request - Ksaunibliss</h2>
        <p>A new return request has been submitted.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Return Details</h3>
          <p><strong>Return Number:</strong> ${returnRequest.returnNumber}</p>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Type:</strong> ${returnRequest.type}</p>
          <p><strong>Reason:</strong> ${returnRequest.reason}</p>
          <p><strong>Refund Amount:</strong> ₹${returnRequest.refundAmount}</p>
        </div>
        
        <p>Please review and process this return request in the admin dashboard.</p>
      </div>
    `

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN,
      subject: `New Return Request - ${returnRequest.returnNumber}`,
      html: emailHtml,
    })
  } catch (error) {
    console.error("Return notification email error:", error)
  }
}

// Send return status update email to user
const sendReturnStatusUpdateEmail = async (returnRequest) => {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ec4899;">Return Request Update - Ksaunibliss</h2>
        <p>Dear ${returnRequest.user.name || "Customer"},</p>
        <p>Your return request status has been updated.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Return Details</h3>
          <p><strong>Return Number:</strong> ${returnRequest.returnNumber}</p>
          <p><strong>Status:</strong> ${returnRequest.status}</p>
          ${returnRequest.adminNotes ? `<p><strong>Notes:</strong> ${returnRequest.adminNotes}</p>` : ""}
          ${
            returnRequest.refundTransactionId
              ? `<p><strong>Refund Transaction ID:</strong> ${returnRequest.refundTransactionId}</p>`
              : ""
          }
        </div>
        
        <p>You can track your return request status in your account dashboard.</p>
        <p>For any queries, contact us at support@ksaunibliss.com</p>
      </div>
    `

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: returnRequest.user.email,
      subject: `Return Request Update - ${returnRequest.returnNumber}`,
      html: emailHtml,
    })
  } catch (error) {
    console.error("Return status update email error:", error)
  }
}

module.exports = {
  createReturnRequest,
  getUserReturns,
  getReturnDetails,
  getAllReturns,
  updateReturnStatus,
}
