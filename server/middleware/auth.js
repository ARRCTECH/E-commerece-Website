const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =============================
// 🔒 Authentication Middleware
// =============================
const protect = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No valid token provided.",
      });
    }

    const token = authHeader.split(" ")[1].trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token is required.",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: Check token expiry manually if needed (jwt.verify already handles expiry)
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    // Find user by decoded userId
    const user = await User.findById(decoded.userId).select("-otp -otpExpiry");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Account not verified. Please complete verification.",
      });
    }

    // Attach user to request object
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
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

// =============================
// 🔒 Admin-only Middleware
// =============================
const adminAuth = (req, res, next) => {
    console.log("req.user:", req.user); // <- check this

  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

// =============================
// 🔒 Digital Marketer-only Middleware
// =============================

const digitalMarketerAuth = (req, res, next) => {
  if (!req.user || (req.user.role !== "digitalMarketer" && req.user.role !== "admin")) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Digital Marketer privileges required.",
    });
  }
  next();
};

// =============================
// 🔒 Optional Auth Middleware
// =============================
const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue as guest user
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1].trim();

    if (!token) {
      // No token provided, continue as guest user
      req.user = null;
      return next();
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by decoded userId
      const user = await User.findById(decoded.userId).select("-otp -otpExpiry");

      if (!user) {
        req.user = null;
        return next();
      }

      // Attach user to request object
      req.user = {
        userId: user._id,
        role: user.role,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
      };
    } catch (tokenError) {
      // Invalid token, continue as guest
      req.user = null;
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    req.user = null;
    next();
  }
};

module.exports = {
  protect,
  adminAuth,
  digitalMarketerAuth,
  optionalProtect,
};
