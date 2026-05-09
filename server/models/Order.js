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
      enum: ["COD", "RAZORPAY", "PARTIAL_COD"],
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
// Order schema
// ===============================

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    shiprocketShipmentId: { type: Number },
    shiprocketOrderId: { type: Number },
    trackingUrl: { type: String, default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },

    shippingAddress: { type: shippingAddressSchema, required: true },

    paymentInfo: { type: paymentInfoSchema, required: true },

    trackingInfo: { type: trackingInfoSchema, default: () => ({ awbStatus: "PENDING" }) },

    partialCod: { type: partialCodSchema, default: () => ({}) },

    subtotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    freediscount: { type: Number },

    pricing: {
      subtotal: Number,
      shippingCharges: Number,
      tax: Number,
      discount: Number,
      total: Number,
      freediscount: Number,
      selectedShippingRate: Number,
    },

    couponCode: { type: String, default: null },

    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "ABANDONED","PENDING"],
      default: "PLACED",
      index: true,
    },
  },
  { timestamps: true },
)

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })

orderSchema.pre("save", function nextOrderNumber(next) {
  if (!this.orderNumber) {
    this.orderNumber = `FH-${Date.now()}`
  }
  next()
})

module.exports = mongoose.model("Order", orderSchema)