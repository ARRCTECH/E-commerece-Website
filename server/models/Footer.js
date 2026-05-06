const mongoose = require("mongoose")

const footerSchema = new mongoose.Schema(
  {
    companyInfo: {
      name: String,
      description: String,
      address: String,
      phone: String,
      email: String,
    },
    socialLinks: [
      {
        platform: {
          type: String,
          enum: ["facebook", "instagram", "twitter", "youtube", "linkedin"],
        },
        url: String,
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    quickLinks: [
      {
        title: String,
        url: String,
        category: {
          type: String,
          enum: ["shop", "customer-service", "company"],
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    newsletter: {
      title: String,
      description: String,
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    paymentMethods: [
      {
        name: String,
        icon: String,
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    policies: [
      {
        title: String,
        url: String,
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Footer", footerSchema)
