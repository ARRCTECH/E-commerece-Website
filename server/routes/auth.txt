const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication middleware to protect routes
const protect = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No valid token provided.",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token is required.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    // Find user
    const user = await User.findById(decoded.userId).select("-otp -otpExpiry");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Account not verified. Please complete verification.",
      });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
};

// Admin-only middleware
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

// Digital Marketer-only middleware
const digitalMarketerAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "digital_marketer") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Digital Marketer privileges required.",
    });
  }
  next();
};

module.exports = {
  protect,
  adminAuth,
  digitalMarketerAuth,
};
