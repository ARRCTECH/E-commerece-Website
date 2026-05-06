const mongoose = require("mongoose");

// 🛒 Cart Item Sub-Schema
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  size: String,
  color: String,
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// 📍 Address Sub-Schema
const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["home", "work", "other"],
    default: "home",
  },
  fullName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: String,
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

// 📦 Temp Order Data Schema
const tempOrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: false },
  price: { type: Number, required: false },
  image: { type: String, required: false },
  quantity: Number,
  size: String,
  color: String,
});

const pricingSchema = new mongoose.Schema({
  subtotal: Number,
  shippingCharges: Number,
  tax: Number,
  discount: Number,
  total: Number,
});

const paymentInfoSchema = new mongoose.Schema({
  razorpayOrderId: String,
  paymentMethod: { type: String, default: "Online" },
  paymentStatus: { type: String, default: "pending" },
});

const tempOrderDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  orderNumber: { type: String, required: true },
  items: [tempOrderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pinCode: { type: String, required: false },
    phoneNumber: { type: String, required: false },
  },
  pricing: pricingSchema,
  coupon: { type: Object }, // Can be detailed if needed
  paymentInfo: paymentInfoSchema,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
  trackingUrl:{ type: String},
  temp_order_id:{ type: String},
  trackingInfo: { type:  {
    awbCode: { type: String, default: null },
    courierName: { type: String, default: null },
    awbStatus: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "FAILED", "N/A"],
      default: "PENDING",
    },
    awbAssignedAt: { type: Date, default: null },
    awbError: { type: String, default: null },
    trackingUrl:{type: String, default: null},
    message:{type: String, default: null}
    }, default: () => ({ awbStatus: "PENDING" }) },
});

// 👤 Main User Schema
const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      validate: {
        validator: (email) => {
          if (email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          }
          return true;
        },
        message: "Invalid email format",
      },
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: (phone) => {
          if (phone) {
            return /^\+[1-9]\d{1,14}$/.test(phone);
          }
          return true;
        },
        message: "Invalid phone number format",
      },
    },
    authMethod: {
      type: String,
      enum: ["email", "phone", "google", "facebook"],
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "digitalMarketer"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    // 🏠 Addresses
    addresses: [addressSchema],

    // 🛒 Cart
    cart: [cartItemSchema],

    // 🔒 Account Security
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // ⏱️ Timestamps
    lastLogin: Date,

    // ⚙️ Preferences
    preferences: {
      newsletter: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
    },

    // 🔗 Social Media
    socialMedia: {
      instagram: String,
      facebook: String,
      twitter: String,
    },

    // 🚀 Temp Order Data
    tempOrderData: tempOrderDataSchema,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  }
);

// 🗂️ Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ authMethod: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ firebaseUid: 1 });

// 🔒 Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// 📝 Pre-save middleware: ensure one default address
userSchema.pre("save", function (next) {
  if (this.addresses && this.addresses.length > 0) {
    let hasDefault = false;
    this.addresses.forEach((address) => {
      if (address.isDefault) {
        if (hasDefault) {
          address.isDefault = false;
        } else {
          hasDefault = true;
        }
      }
    });
    if (!hasDefault && this.addresses.length > 0) {
      this.addresses[0].isDefault = true;
    }
  }
  next();
});

// 🔧 Methods for login attempts
userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours lock
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1,
    },
  });
};

// 👤 Public Profile method
userSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    avatar: this.avatar,
    role: this.role,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
