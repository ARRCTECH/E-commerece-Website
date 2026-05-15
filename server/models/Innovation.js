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
    category: {
      type: String,
      required: true,
      enum: ["Technology", "Design", "Process", "Product", "Service", "Other"],
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