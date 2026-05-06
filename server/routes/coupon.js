const express = require("express");
const { validateCoupon, getAvailableCoupons } = require("../controllers/couponController");

const router = express.Router();

// Validate coupon
router.post("/validate", validateCoupon);

// Get available coupons
router.get("/available", getAvailableCoupons);

module.exports = router;
