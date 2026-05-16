const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  numberOfReferrals: {
    type: Number,
    default: 0
  },
  percentageValue: {
    type: Number,
    default: 0   
  },
  discountValue: {
    type: Number,
    default: 0   
  },
}, { timestamps: true });

module.exports = mongoose.model("Referral", referralSchema);