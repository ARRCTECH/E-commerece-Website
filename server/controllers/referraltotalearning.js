const PartialCodSetting = require("../models/referraltotalamountmodels");

const validateAmount = (amount) => {
  const num = Number(amount);
  return Number.isFinite(num) && num > 0 ? num : null;
};

// Get referral data (creates if missing)
const getReferralTotalEarning = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }
    let referralEarning = await PartialCodSetting.findOne({ userId });
    if (!referralEarning) {
      referralEarning = new PartialCodSetting({ 
        userId, 
        totalEarning: 0,
        balance: 0,
        usedbalance: 0
      });
      await referralEarning.save();
    }
    res.status(200).json({
      success: true,
      data: referralEarning
    });
  } catch (error) {
    console.error("Get Referral Total Earning Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// Add referral earnings (only increases totalEarning and balance)
const addReferralEarnings = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }
    const validAmount = validateAmount(amount);
    if (validAmount === null) {
      return res.status(400).json({
        success: false,
        message: "amount must be a positive number"
      });
    }

    let referralEarning = await PartialCodSetting.findOne({ userId });
    if (!referralEarning) {
      referralEarning = new PartialCodSetting({ 
        userId, 
        totalEarning: validAmount,
        balance: validAmount,
        usedbalance: 0
      });
    } else {
      referralEarning.totalEarning += validAmount;
      referralEarning.balance += validAmount;
    }
    await referralEarning.save();

    res.status(200).json({
      success: true,
      data: referralEarning
    });
  } catch (error) {
    console.error("Add Referral Earnings Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// Use from balance (increases usedbalance, decreases balance) – with ₹100 per order cap
const useReferralBalance = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }
    let validAmount = validateAmount(amount);
    if (validAmount === null) {
      return res.status(400).json({
        success: false,
        message: "amount must be a positive number"
      });
    }
    const referralEarning = await PartialCodSetting.findOne({ userId });
    if (!referralEarning) {
      return res.status(404).json({
        success: false,
        message: "Referral record not found for this user"
      });
    }

    if (referralEarning.balance < validAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    referralEarning.balance -= validAmount;
    referralEarning.usedbalance += validAmount;
    await referralEarning.save();

    res.status(200).json({
      success: true,
      data: referralEarning
    });
  } catch (error) {
    console.error("Use Referral Balance Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// Create a new referral record (only if doesn't exist)
const createReferralTotalEarning = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }
    let initialAmount = 0;
    if (amount !== undefined) {
      const validAmount = validateAmount(amount);
      if (validAmount === null) {
        return res.status(400).json({
          success: false,
          message: "If amount is provided, it must be a positive number"
        });
      }
      initialAmount = validAmount;
    }
    const referral = new PartialCodSetting({
      userId,
      totalEarning: initialAmount,
      balance: initialAmount,
      usedbalance: 0
    });
    await referral.save();
    res.status(201).json({
      success: true,
      data: referral
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Referral already exists for this user"
      });
    }
    console.error("Create Referral Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
module.exports = {
  getReferralTotalEarning,
  addReferralEarnings,           
  useReferralBalance,           
  createReferralTotalEarning,
};