const mongoose = require("mongoose");

const finalReferralSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  totalEarning: {
    type: Number,
    default: 0  
  },
  balance:{
    type:Number,
    default:0
  },
  usedbalance:{
    type:Number,
    default:0
  }
}, { timestamps: true });

module.exports = mongoose.model("FinalReferral", finalReferralSchema);