const mongoose = require("mongoose")

// ===============================
// Sub-schemas
// ===============================

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    itemTotal: { type: Number, required: true, min: 0 },
    // 🆕 Bulk Product Fields
    isBulkProduct: { type: Boolean, default: false },
    selectedColors: [{ type: String }],
    totalSets: { type: Number, default: 1 },
    totalPieces: { type: Number, default: 0 },
    piecesPerSet: { type: Number, default: 0 },
    pricePerSet: { type: Number, default: 0 }
  },
  { _id: false },
)

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    landmark: { type: String, default: "" },
    addressType: { type: String, default: "" },
    isDefault: { type: Boolean },
    email: { type: String, default: "" }
  },
  { _id: false },
)

const paymentInfoSchema = new mongoose.Schema(
  {
    method: { 
      type: String, 
      enum: ["COD", "RAZORPAY", "PARTIAL_COD","FREE"],
      required: true 
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "PARTIALLY_PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
  },
  { _id: false },
)

const trackingInfoSchema = new mongoose.Schema(
  {
    awbCode: { type: String, default: null },
    courierName: { type: String, default: null },
    awbStatus: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "FAILED", "N/A"],
      default: "PENDING",
    },
    awbAssignedAt: { type: Date, default: null },
    awbError: { type: String, default: null },
    trackingUrl: { type: String, default: null },
    message: { type: String, default: null }
  },
  { _id: false },
)

// ===============================
// Partial COD Schema
// ===============================

const partialCodSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    onlineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    codAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    onlinePaymentId: {
      type: String,
      default: null,
    },
    onlinePaymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    onlinePaymentPaidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// ===============================
// 🆕 SHIPMOZO DETAILS SCHEMA (New)
// ===============================

const shipmozoDetailsSchema = new mongoose.Schema(
  {
    orderId: { type: String, default: null },           // Shipmozo order_id
    referenceId: { type: String, default: null },       // Reference ID
    awbNumber: { type: String, default: null },         // AWB Number (tracking number)
    courierCompany: { type: String, default: null },    // Courier name
    courierService: { type: String, default: null },    // Courier service type
    labelUrl: { type: String, default: null },          // Label PDF URL
    status: {
      type: String,
      enum: ["PENDING", "ORDER_PUSHED", "COURIER_ASSIGNED", "AWB_GENERATED", "SHIPPED", "DELIVERED", "CANCELLED",'FAILED'],
      default: "PENDING"
    },
    errorMessage: { type: String, default: null },      // Error message if any
    lastSyncAt: { type: Date, default: null }           // Last sync time
  },
  { _id: false }
);

// ===============================
// 🆕 TRACKING HISTORY SCHEMA (for storing all scan updates)
// ===============================

const trackingHistorySchema = new mongoose.Schema(
  {
    status: { type: String },        // Pickup Scheduled, In-Transit, Out for Delivery, Delivered
    location: { type: String },      // City/Location name
    timestamp: { type: Date },       // When this status happened
    remark: { type: String }         // Additional details
  },
  { _id: false }
);

// ===============================
// Order schema
// ===============================

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    
    // ⚠️ Legacy fields (keep for backward compatibility)
    shiprocketShipmentId: { type: Number },
    shiprocketOrderId: { type: Number },
    trackingUrl: { type: String, default: null },
    
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },

    shippingAddress: { type: shippingAddressSchema, required: true },

    paymentInfo: { type: paymentInfoSchema, required: true },

    trackingInfo: { type: trackingInfoSchema, default: () => ({ awbStatus: "PENDING" }) },

    partialCod: { type: partialCodSchema, default: () => ({}) },

    // 🆕 Shipmozo Fields
    shipmozoDetails: { type: shipmozoDetailsSchema, default: () => ({ status: "PENDING" }) },
    
    // 🆕 Tracking History (for storing all scan updates)
    trackingHistory: { type: [trackingHistorySchema], default: [] },
    
    // 🆕 Shipping Status (separate from order status)
    shippingStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RTO"],
      default: "PENDING"
    },

    subtotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    freediscount: { type: Number },
    referralDiscount: { type: Number },

    pricing: {
      subtotal: Number,
      shippingCharges: Number,
      tax: Number,
      discount: Number,
      total: Number,
      freediscount: Number,
      referralDiscount:Number,
      selectedShippingRate: Number,
    },

    couponCode: { type: String, default: null },

    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "ABANDONED", "PENDING"],
      default: "PLACED",
      index: true,
    },
  },
  { timestamps: true },
)

// ===============================
// Indexes
// ===============================

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ shippingStatus: 1 })
orderSchema.index({ "shipmozoDetails.awbNumber": 1 })
orderSchema.index({ "shipmozoDetails.orderId": 1 })

// ===============================
// Hooks
// ===============================

orderSchema.pre("save", function nextOrderNumber(next) {
  if (!this.orderNumber) {
    this.orderNumber = `FH-${Date.now()}`
  }
  next()
})

// ===============================
// Virtual Fields
// ===============================

// Check if order has AWB
orderSchema.virtual("hasAWB").get(function() {
  return !!(this.shipmozoDetails && this.shipmozoDetails.awbNumber)
})

// Get AWB number
orderSchema.virtual("awbNumber").get(function() {
  return this.shipmozoDetails?.awbNumber || null
})

// Get courier name
orderSchema.virtual("courierName").get(function() {
  return this.shipmozoDetails?.courierCompany || null
})

// Check if order is Partial COD
orderSchema.virtual("isPartialCOD").get(function() {
  return this.partialCod?.enabled === true
})

// Get pending COD amount for Partial COD
orderSchema.virtual("pendingCodAmount").get(function() {
  if (this.partialCod?.enabled) {
    return this.partialCod.codAmount || 0
  }
  return 0
})

module.exports = mongoose.model("Order", orderSchema)