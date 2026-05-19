const PartialCodSetting = require("../models/referraltotalamountmodels");
const validateAmount = (amount) => {
    const num = Number(amount);
    return Number.isFinite(num) && num > 0 ? num : null;
};
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
            referralEarning = new PartialCodSetting({ userId, totalEarning: 0 });
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
const updateReferralTotalEarning = async (req, res) => {
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
            // Create new with this amount
            referralEarning = new PartialCodSetting({ userId, totalEarning: validAmount });
        } else {
            referralEarning.totalEarning += validAmount;
        }
        await referralEarning.save();
        res.status(200).json({
            success: true,
            data: referralEarning
        });
    } catch (error) {
        console.error("Update Referral Total Earning Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};
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
            totalEarning: initialAmount
        });
        await referral.save();
        res.status(201).json({
            success: true,
            data: referral
        });
    } catch (error) {
        // Duplicate userId
        if (error.code === 11000) {
            return res.status(409).json({  // 409 Conflict instead of 400
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
    updateReferralTotalEarning,
    createReferralTotalEarning,
};