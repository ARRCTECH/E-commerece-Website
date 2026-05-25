const { findByIdAndUpdate } = require("../models/Coupon");
const Referral = require("../models/fetchReferralDetails");
const Order = require("../models/Order");
const User = require("../models/User");

exports.getReferralDetails = async (req, res) => {
    try {
        const { userId } = req.body;
        const referral = await Referral.findOne({ userId });
        if (!referral) {
            return res.status(404).json({
                success: false,
                message: "Referral details not found",
            });
        }
        res.status(200).json({
            success: true,
            data: referral,
        });
    } catch (error) {
        console.error("Get Referral Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
exports.updateReferralDetails = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found or has no referrals"
            });
        }
        let percentageValue = 0;
        let discountValue = 0;
        const keysArray = Array.from(user.referredTo.keys());
        let count = 0;
        for (const referrals of user.referredTo) {
            const referral=referrals[1]
            if (referral.creditStatus === true) {
                console.log(`Referral for order already credited`);
                count++;
                continue;
            }
            const orders = await Order.find({ user: `${keysArray[count++]}` });
            for (const order of orders) {
                if (order.status !== "DELIVERED") {
                    console.log(`Order not delivered, skipping`);
                    count++;
                    continue;
                }
                const lastSync = new Date(order.shipmozoDetails.lastSyncAt);
                const now = new Date();
                const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
                const diffMs = lastSync-now;
                if (diffMs < tenDaysInMs) {
                    console.log('Last sync was more than 10 days ago');
                    count++;
                    continue;
                }
                if (new Date() > referral.expiryDate) {
                    console.log(`Referral for order has expired`);
                    count++;
                    continue;
                }
                if (referral.type === "fixed") {
                    discountValue += referral.amount || 0;
                    console.log(discountValue);
                } else if (referral.type === "percentage") {
                    percentageValue += referral.amount || 0;
                    console.log(percentageValue);
                }
                referral.creditStatus = true;
                count++;
            }
        }
        if (count > 0) {
            await user.save();
        }

        let referralDoc = await Referral.findOne({ userId });
        const totalReferrals = keysArray.length;
        if (!referralDoc) {
            referralDoc = new Referral({
                userId,
                numberOfReferrals: totalReferrals,
                percentageValue: percentageValue,
                discountValue: discountValue,
            });
        } else {
            referralDoc.numberOfReferrals = totalReferrals;
            referralDoc.percentageValue += percentageValue;
            referralDoc.discountValue += discountValue;
        }
        await referralDoc.save();
        res.status(200).json({
            success: true,
            message: "Referral details updated successfully",
            data: referralDoc
        });
    } catch (error) {
        console.error("Update Referral Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};
exports.updateReferralDetails = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found or has no referrals"
            });
        }
        let percentageValue = 0;
        let discountValue = 0;
        const keysArray = Array.from(user.referredTo.keys());
        let count = 0;
        for (const referrals of user.referredTo) {
            const referral=referrals[1]
            if (referral.creditStatus === true) {
                console.log(`Referral for order already credited`);
                count++;
                continue;
            }
            const orders = await Order.find({ user: `${keysArray[count++]}` });
            for (const order of orders) {
                if (order.status !== "DELIVERED") {
                    console.log(`Order not delivered, skipping`);
                    count++;
                    continue;
                }
                const lastSync = new Date(order.shipmozoDetails.lastSyncAt);
                const now = new Date();
                const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
                const diffMs = lastSync-now;
                if (diffMs < tenDaysInMs) {
                    console.log('Last sync was more than 10 days ago');
                    count++;
                    continue;
                }
                if (new Date() > referral.expiryDate) {
                    console.log(`Referral for order has expired`);
                    count++;
                    continue;
                }
                if (referral.type === "fixed") {
                    discountValue += referral.amount || 0;
                    console.log(discountValue);
                } else if (referral.type === "percentage") {
                    percentageValue += referral.amount || 0;
                    console.log(percentageValue);
                }
                referral.creditStatus = true;
                count++;
            }
        }
        let referralDoc = await Referral.findOne({ userId });
        const totalReferrals = keysArray.length;
        if (!referralDoc) {
            referralDoc = new Referral({
                userId,
                numberOfReferrals: totalReferrals,
                percentageValue: percentageValue,
                discountValue: discountValue,
            });
        } else {
            referralDoc.numberOfReferrals = totalReferrals;
            referralDoc.percentageValue += percentageValue;
            referralDoc.discountValue += discountValue;
        }
        await referralDoc.save();
        res.status(200).json({
            success: true,
            message: "Referral details updated successfully",
            data: referralDoc
        });
    } catch (error) {
        console.error("Update Referral Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};