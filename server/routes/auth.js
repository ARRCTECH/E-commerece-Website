const express = require("express")
const {
  registerWithEmail,
  loginWithEmail,
  verifyFirebaseToken,
  forgotPassword,
  updateProfile,
  getProfile,
  logout,
  deleteAccount,
  uploadAvatar,
  // Phone OTP functions using Firebase
  sendPhoneOTP,
  verifyPhoneOTP,
} = require("../controllers/authController")
const { firebaseAuth, authorize } = require("../middleware/firebaseAuth")
const { protect } = require("../middleware/auth")
const upload = require("../middleware/upload")
const { body, validationResult } = require("express-validator")
const rateLimit = require("express-rate-limit")

const router = express.Router()

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: "Too many password reset attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased for development/testing
  message: {
    success: false,
    message: "Too many OTP requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Validation middleware for email registration
const validateEmailRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address")
    .isLength({ max: 100 })
    .withMessage("Email must be less than 100 characters"),
  body("password").isLength({ min: 6, max: 128 }).withMessage("Password must be between 6 and 128 characters long"),
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),
]

// Validation middleware for email login
const validateEmailLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
]

// Validation middleware for phone OTP preparation
const validatePhoneOTP = [
  body("phoneNumber")
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage("Please enter a valid phone number with country code (e.g., +1234567890)"),
]

// Validation middleware for phone OTP verification
const validatePhoneOTPVerification = [
  body("phoneNumber")
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage("Please enter a valid phone number with country code"),
  body("firebaseIdToken").notEmpty().withMessage("Firebase ID token is required"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),
]

// Validation middleware for profile update
const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),
  body("dateOfBirth").optional().isISO8601().withMessage("Please enter a valid date"),
  body("gender").optional().isIn(["male", "female", "other"]).withMessage("Please select a valid gender option"),
]

// Validation middleware for forgot password
const validateForgotPassword = [
  body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email address"),
]

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    })
  }
  next()
}

// Public routes - Email Authentication
router.post("/register/email", authLimiter, validateEmailRegistration, handleValidationErrors, registerWithEmail)
router.post("/login/email", authLimiter, validateEmailLogin, handleValidationErrors, loginWithEmail)
router.post("/forgot-password", passwordResetLimiter, validateForgotPassword, handleValidationErrors, forgotPassword)

// Public routes - Phone OTP Authentication (Firebase-based)
router.post("/phone/prepare-otp", otpLimiter, validatePhoneOTP, handleValidationErrors, sendPhoneOTP)
router.post("/phone/verify-otp", authLimiter, validatePhoneOTPVerification, handleValidationErrors, verifyPhoneOTP)

// Public routes - Firebase Token Verification
router.post("/verify-token", verifyFirebaseToken)

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
    supportedMethods: ["email", "phone"],
    features: {
      emailAuth: true,
      phoneOTP: true,
      firebaseAuth: true,
      passwordReset: true,
      profileManagement: true,
    },
  })
})

// Protected routes
router.use(protect)
router.get("/profile", getProfile)
router.put("/profile", validateProfileUpdate, handleValidationErrors, updateProfile)
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar)
router.post("/logout", logout)
router.delete("/account", deleteAccount)

// Admin only routes
router.get("/admin/users", authorize("admin"), async (req, res) => {
  try {
    const User = require("../models/User")
    const page = Number.parseInt(req.query.page) || 1
    const limit = Math.min(Number.parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit
    const search = req.query.search || ""
    const role = req.query.role || ""
    const authMethod = req.query.authMethod || ""

    const query = { role: { $ne: "admin" } }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ]
    }

    if (role && role !== "all") query.role = role
    if (authMethod && authMethod !== "all") query.authMethod = authMethod

    const users = await User.find(query)
      .select("-firebaseUid -loginAttempts -lockUntil")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await User.countDocuments(query)

    const authStats = await User.aggregate([
      { $match: { role: { $ne: "admin" } } },
      { $group: { _id: "$authMethod", count: { $sum: 1 } } },
    ])

    res.json({
      success: true,
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      authStats: authStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count
        return acc
      }, {}),
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    })
  }
})

router.get("/admin/stats", authorize("admin"), async (req, res) => {
  try {
    const User = require("../models/User")
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } })
    const verifiedUsers = await User.countDocuments({ role: { $ne: "admin" }, isVerified: true })
    const emailUsers = await User.countDocuments({ role: { $ne: "admin" }, authMethod: "email" })
    const phoneUsers = await User.countDocuments({ role: { $ne: "admin" }, authMethod: "phone" })
    const newUsersThisMonth = await User.countDocuments({
      role: { $ne: "admin" },
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    })

    res.json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        emailUsers,
        phoneUsers,
        newUsersThisMonth,
        unverifiedUsers: totalUsers - verifiedUsers,
      },
    })
  } catch (error) {
    console.error("Get admin stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin stats",
    })
  }
})

// Legacy routes for backward compatibility
router.post("/register", authLimiter, validateEmailRegistration, handleValidationErrors, registerWithEmail)
router.post("/login", authLimiter, validateEmailLogin, handleValidationErrors, loginWithEmail)

module.exports = router
