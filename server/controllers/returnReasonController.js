const Return = require("../models/returnReason"); // fix path if needed

const saveReturnReason = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Order ID and reason are required",
      });
    }

    // ✅ Create new return record every time – no duplicate check
    const newReturn = new Return({
      orderId,
      reason,
    });

    const saved = await newReturn.save();

    res.status(201).json({
      success: true,
      message: "Return reason saved successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Error saving return reason:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const getReturnReasons = async (req, res) => {
  try {
    const { orderId } = req.query;

    let query = {};
    if (orderId) {
      query.orderId = orderId;
    }

    const reasons = await Return.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reasons.length,
      data: reasons,
    });
  } catch (error) {
    console.error("Error fetching return reasons:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

module.exports = { saveReturnReason, getReturnReasons };