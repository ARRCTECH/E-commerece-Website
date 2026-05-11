const mongoose = require("mongoose");

const partialCodSettingSchema = new mongoose.Schema({
  percentage: {
    type: Number,
    required: true,
    default: 30,
    min: 0,
    max: 100,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

module.exports = mongoose.model("PartialCodSetting", partialCodSettingSchema);