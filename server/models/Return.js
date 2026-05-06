const mongoose = require("mongoose")

const returnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  size: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "Default",
  },
  image: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
})

const returnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    returnNumber: {
      type: String,
      unique: true,
      required: true,
    },
    type: {
      type: String,
      enum: ["return", "exchange", "refund"],
      required: true,
    },
    items: [returnItemSchema],
    reason: {
      type: String,
      required: true,
      enum: [
        "defective_product",
        "wrong_item",
        "size_issue",
        "quality_issue",
        "not_as_described",
        "damaged_packaging",
        "changed_mind",
        "other",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing", "completed", "cancelled"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    refundTransactionId: {
      type: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Generate return number before saving
returnSchema.pre("save", async function (next) {
  if (!this.returnNumber) {
    const count = await mongoose.model("Return").countDocuments()
    this.returnNumber = `RET${Date.now()}${(count + 1).toString().padStart(4, "0")}`
  }
  next()
})

// Indexes for better query performance
returnSchema.index({ user: 1, createdAt: -1 })
returnSchema.index({ order: 1 })
returnSchema.index({ returnNumber: 1 })
returnSchema.index({ status: 1 })

module.exports = mongoose.model("Return", returnSchema)
