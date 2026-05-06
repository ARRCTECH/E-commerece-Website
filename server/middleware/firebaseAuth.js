const { auth } = require("../config/firebase")
const User = require("../models/User")

const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
        code: "MISSING_TOKEN",
      })
    }

    const idToken = authHeader.split(" ")[1]

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
        code: "INVALID_TOKEN_FORMAT",
      })
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken)

      // Find user in MongoDB
      const user = await User.findOne({ firebaseUid: decodedToken.uid })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        })
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account has been deactivated. Please contact support.",
          code: "ACCOUNT_DEACTIVATED",
        })
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: "Account is temporarily locked due to multiple failed login attempts",
          code: "ACCOUNT_LOCKED",
        })
      }

      // Add user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        mongoUser: user,
      }

      next()
    } catch (firebaseError) {
      console.error("Firebase token verification error:", firebaseError)

      let errorMessage = "Invalid or expired token"
      let errorCode = "INVALID_TOKEN"

      switch (firebaseError.code) {
        case "auth/id-token-expired":
          errorMessage = "Token expired. Please login again."
          errorCode = "TOKEN_EXPIRED"
          break
        case "auth/id-token-revoked":
          errorMessage = "Token has been revoked. Please login again."
          errorCode = "TOKEN_REVOKED"
          break
        case "auth/invalid-id-token":
          errorMessage = "Invalid token. Please login again."
          errorCode = "INVALID_TOKEN"
          break
        case "auth/user-disabled":
          errorMessage = "User account has been disabled."
          errorCode = "USER_DISABLED"
          break
        default:
          errorMessage = "Authentication failed. Please login again."
          errorCode = "AUTH_FAILED"
      }

      return res.status(401).json({
        success: false,
        message: errorMessage,
        code: errorCode,
      })
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      message: "Authentication error",
      code: "AUTH_ERROR",
    })
  }
}

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.mongoUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      })
    }

    if (!roles.includes(req.user.mongoUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
        code: "INSUFFICIENT_PERMISSIONS",
        requiredRoles: roles,
        userRole: req.user.mongoUser.role,
      })
    }

    next()
  }
}

// Email verification middleware
const requireEmailVerification = (req, res, next) => {
  if (!req.user || !req.user.mongoUser) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      code: "AUTH_REQUIRED",
    })
  }

  if (!req.user.mongoUser.isVerified && process.env.ENABLE_EMAIL_VERIFICATION === "true") {
    return res.status(403).json({
      success: false,
      message: "Please verify your email address to continue",
      code: "EMAIL_NOT_VERIFIED",
    })
  }

  next()
}

// Admin or owner middleware (user can access their own data)
const authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user || !req.user.mongoUser) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      code: "AUTH_REQUIRED",
    })
  }

  const isAdmin = req.user.mongoUser.role === "admin"
  const isOwner = req.params.userId === req.user.mongoUser._id.toString()

  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own data.",
      code: "ACCESS_DENIED",
    })
  }

  next()
}

module.exports = {
  firebaseAuth,
  authorize,
  requireEmailVerification,
  authorizeOwnerOrAdmin,
}
