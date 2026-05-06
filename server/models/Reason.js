const mongoose = require("mongoose");
const reasonSchema = new mongoose.Schema(
  {
    reasons: {
      type: [String],   
      required: true
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Reason", reasonSchema);