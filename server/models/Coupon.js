const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["flat", "percentage"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    maxUses: {
      type: Number,
      default: null, // null means unlimited
      min: 1,
    },
    maxUsesPerUser: {
      type: Number,
      default: 1,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        usedCount: {
          type: Number,
          default: 1,
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isFreeCoupon: {
      type: String,
      default: "N",
      required: true,
    },
    couponcategories: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Indexes
couponSchema.index({ code: 1 })
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 })
couponSchema.index({ validUntil: 1 })

// Methods
couponSchema.methods.isValidForUser = function (userId) {
  const now = new Date()

  // Check if coupon is active and within date range
  if (!this.isActive || now < this.validFrom || now > this.validUntil) {
    return { valid: false, message: "Coupon is not valid or has expired" }
  }

  // Check max uses
  if (this.maxUses && this.usedCount >= this.maxUses) {
    return { valid: false, message: "Coupon usage limit exceeded" }
  }

  // Check user-specific usage
  const userUsage = this.usedBy.find((usage) => usage.user.toString() === userId.toString())
  if (userUsage && userUsage.usedCount >= this.maxUsesPerUser) {
    return { valid: false, message: "You have already used this coupon maximum times" }
  }

  return { valid: true }
}

couponSchema.methods.calculateDiscount = function (orderValue) {
  if (orderValue < this.minOrderValue) {
    return 0
  }

  let discount = 0
  if (this.discountType === "flat") {
    discount = this.discountValue
  } else if (this.discountType === "percentage") {
    discount = (orderValue * this.discountValue) / 100
  }

  // Apply max discount limit if set
  if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount
  }

  return Math.min(discount, orderValue) // Discount cannot exceed order value
}

module.exports = mongoose.model("Coupon", couponSchema)
