const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
    helpful: {
      count: {
        type: Number,
        default: 0,
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    reported: {
      count: {
        type: Number,
        default: 0,
      },
      reasons: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          reason: {
            type: String,
            enum: ["spam", "inappropriate", "fake", "offensive", "other"],
          },
          description: String,
          reportedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    status: {
      type: String,
      enum: ["active", "hidden", "deleted"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
reviewSchema.index({ product: 1, createdAt: -1 })
reviewSchema.index({ user: 1, createdAt: -1 })
reviewSchema.index({ rating: 1 })
reviewSchema.index({ verified: 1 })
reviewSchema.index({ status: 1 })

// Compound index for product reviews with rating
reviewSchema.index({ product: 1, rating: -1, createdAt: -1 })

// Ensure one review per user per product
// reviewSchema.index({ user: 1, product: 1 }, { unique: true })

module.exports = mongoose.model("Review", reviewSchema)