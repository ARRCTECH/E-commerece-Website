// models/Return.js
const mongoose = require("mongoose");

const returnReasonSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("Return", returnReasonSchema);