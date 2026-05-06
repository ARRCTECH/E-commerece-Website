const Coupon = require("../models/Coupon");
// Validate Coupon
const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || !cartTotal) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and order value are required",
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    // Check coupon validity period
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return res.status(400).json({
        success: false,
        message: "Coupon is not active yet",
      });
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    // Check coupon usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    // Check minimum order value
    if (cartTotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value for this coupon is ₹${coupon.minOrderValue}`,
      });
    }
    // Calculate discount
    const discountAmount = coupon.calculateDiscount(cartTotal);
    res.status(200).json({
      success: true,
      message: "Coupon is valid",
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        minOrderValue: coupon.minOrderValue,
        isFreeCoupon: coupon.isFreeCoupon,
        couponcategories: coupon.couponcategories,
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
    });
  }
};

// Get Available Coupons
const getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [{ maxUses: null }, { $expr: { $lt: ["$usedCount", "$maxUses"] } }],
    }).select(
      "code description discountType discountValue minOrderValue maxDiscountAmount validUntil isFreeCoupon couponcategories"
    );

    res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("Get available coupons error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available coupons",
    });
  }
};

module.exports = {
  validateCoupon,
  getAvailableCoupons,
};
