const mongoose = require("mongoose")

const top10Schema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    position: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

// Ensure unique position constraint
top10Schema.index({ position: 1, isActive: 1 }, { unique: true })

// Ensure unique product constraint
top10Schema.index({ product: 1, isActive: 1 }, { unique: true })

module.exports = mongoose.model("Top10", top10Schema)