const mongoose = require("mongoose");

const innovationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    image: {
      url: {
        type: String,
        required: true,
      },
      alt: {
        type: String,
        default: "Innovation Image",
      },
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      required: true,
      enum: ["Technology", "Design", "Process", "Product", "Service", "Other"],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 30,
    }],
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Draft", "In Progress", "Review", "Approved", "Implemented"],
      default: "Draft",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Innovation", innovationSchema);