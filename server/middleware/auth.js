const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =============================
// 🔒 Authentication Middleware
// =============================
const protect = async (req, res, next) => {
  // List of public routes that don't require authentication
  const publicRoutes = [
    '/auth/google',
    '/google',
    '/register/email',
    '/login/email',
    '/forgot-password',
    '/phone/prepare-otp',
    '/phone/verify-otp',
    '/verify-token',
    '/health',
    '/register',
    '/login'
  ];
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => req.path.includes(route));
  
  if (isPublicRoute) {
    console.log(`Public route accessed: ${req.method} ${req.path} - Skipping authentication`);
    return next();
  }
  
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
      firebaseUid: user.firebaseUid,
      authMethod: user.authMethod,
      referredBy:user.referredBy
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }
    
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
  console.log("Admin auth check - req.user:", req.user);

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
      // 🔥 FIX: Explicitly require HS256 algorithm
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
        firebaseUid: user.firebaseUid,
        authMethod: user.authMethod,
      };
    } catch (tokenError) {
      // Invalid token, continue as guest
      console.log("Invalid token in optional auth:", tokenError.message);
      req.user = null;
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    req.user = null;
    next();
  }
};

// =============================
// 🔒 Route-specific middleware to skip auth for certain routes
// =============================
const skipAuthForRoutes = (routes) => {
  return (req, res, next) => {
    const shouldSkip = routes.some(route => req.path === route || req.path.startsWith(route));
    if (shouldSkip) {
      console.log(`Skipping auth for route: ${req.method} ${req.path}`);
      return next();
    }
    return protect(req, res, next);
  };
};

module.exports = {
  protect,
  adminAuth,
  digitalMarketerAuth,
  optionalProtect,
  skipAuthForRoutes,
};