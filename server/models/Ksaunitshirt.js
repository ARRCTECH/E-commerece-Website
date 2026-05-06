const mongoose = require("mongoose")

const ksauniTshirtSchema = new mongoose.Schema(
  {
    image: {
      url: {
        type: String,
        required: true,
      },
      alt: {
        type: String,
        default: "Ksauni Tshirt Style",
      },
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("KsauniTshirt", ksauniTshirtSchema)
