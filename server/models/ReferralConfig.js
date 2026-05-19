const mongoose = require('mongoose');

const referralConfigSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  value: {
    type: Number,
    required: true,
    min: 0.01,    
  },
  daysUntilExpiry: {
    type: Number,
    default: 7,
    min: 1,
    max: 366,         
  },
}, { timestamps: true });

module.exports = mongoose.models.ReferralConfig || mongoose.model('ReferralConfig', referralConfigSchema);