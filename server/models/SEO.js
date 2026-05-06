const mongoose = require("mongoose")

const seoSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
      unique: true,
      enum: ["home", "products", "categories", "about", "contact", "blog"],
    },
    title: {
      type: String,
      required: true,
      maxlength: 60,
    },
    description: {
      type: String,
      required: true,
      maxlength: 160,
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    ogTitle: {
      type: String,
      maxlength: 60,
    },
    ogDescription: {
      type: String,
      maxlength: 160,
    },
    ogImage: {
      type: String,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("SEO", seoSchema)
