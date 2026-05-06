const Reason = require("../models/Reason");
const User = require("../models/User")

const createReasonApi = async (req, res) => {
  try {
    const { cancellationReasons } = req.body;
    // Validate
    if (!cancellationReasons || !Array.isArray(cancellationReasons)) {
      return res.status(400).json({
        success: false,
        message: "cancellationReasons must be an array"
      });
    }
    // Save to DB
    const savedReason = await Reason.create({
      reasons: cancellationReasons
    });
    return res.status(200).json({
      success: true,
      message: "Cancellation reasons saved successfully",
      data: savedReason
    });
  } catch (error) {
    console.error("Error saving cancellation reasons:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};
const getAllReasons = async (req, res) => {
  try {
    const all= await Reason.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: all
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createReasonApi,
  getAllReasons
};

