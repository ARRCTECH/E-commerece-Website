const mongoose = require("mongoose")

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: String,
    description: String,
    image: {
      url: {
        type: String,
        required: true,
      },
      alt: String,
    },
    buttonText: String,
    buttonLink: String,
    bannerLink: String,
    type: {
      type: String,
      enum: ["hero", "promo", "category"],
      required: true,
    },
    category: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    startDate: Date,
    endDate: Date,
    targetAudience: {
      type: String,
      enum: ["all", "men", "women", "kids"],
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

module.exports = mongoose.model("Banner", bannerSchema)
