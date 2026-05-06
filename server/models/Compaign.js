const mongoose = require("mongoose")

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "cancelled"],
      default: "draft",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    targetAudience: {
      ageRange: {
        min: { type: Number, default: 18 },
        max: { type: Number, default: 65 },
      },
      gender: {
        type: String,
        enum: ["all", "male", "female"],
        default: "all",
      },
      locations: [String],
      interests: [String],
    },
    banners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Banner",
      },
    ],
    coupons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
    ],
    goals: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    performance: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 }, // Click-through rate
      conversionRate: { type: Number, default: 0 },
      costPerClick: { type: Number, default: 0 },
      costPerConversion: { type: Number, default: 0 },
      roas: { type: Number, default: 0 }, // Return on ad spend
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Validate date range
campaignSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate) {
    next(new Error("End date must be after start date"))
  }
  next()
})

module.exports = mongoose.model("Campaign", campaignSchema)
