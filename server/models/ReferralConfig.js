const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
  active: { type: Boolean, default: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  expiry: { type: Date, required: true }
});

const referralConfigSchema = new mongoose.Schema({
  referredBy: discountSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

referralConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ReferralConfig', referralConfigSchema);