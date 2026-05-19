const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Order = require("../models/Order"); // kept for potential future use
const ReferralConfig = require("../models/ReferralConfig");
const { sendEmail } = require("../utils/emailService");
const rateLimitStore = new Map();
const randomReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};
const checkRateLimit = (identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const key = `${identifier}_${windowKey}`;
  const attempts = rateLimitStore.get(key) || 0;
  if (attempts >= maxAttempts) {
    throw new Error(`Too many attempts. Please try again later.`);
  }
  rateLimitStore.set(key, attempts + 1);
  for (const [k, v] of rateLimitStore.entries()) {
    const [, keyWindow] = k.split("_");
    if (parseInt(keyWindow) < windowKey - 1) {
      rateLimitStore.delete(k);
    }
  }
};
const googleSignIn = async (req, res) => {
  try {
    const { idToken, email, name, photoURL } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "ID token is required" });
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);
    let user = await User.findOne({
      $or: [{ firebaseUid: decodedToken.uid }, { email: firebaseUser.email?.toLowerCase() || email?.toLowerCase() }],
    });
    if (!user) {
      user = new User({
        firebaseUid: decodedToken.uid,
        name: firebaseUser.displayName || name || firebaseUser.email?.split("@")[0] || "User",
        email: firebaseUser.email?.toLowerCase() || email?.toLowerCase(),
        authMethod: "google",
        isVerified: firebaseUser.emailVerified || true,
        role: "user",
        avatar: firebaseUser.photoURL || photoURL,
        createdAt: new Date(),
        myreferralCode: randomReferralCode(),
      });
      await user.save();
      if (user.email) {
        try {
          await sendEmail({ to: user.email, template: "welcome", data: { name: user.name, email: user.email } });
        } catch (err) {
          console.error("Welcome email error:", err);
        }
      }
    } else {
      user.firebaseUid = decodedToken.uid;
      user.name = firebaseUser.displayName || name || user.name;
      user.avatar = firebaseUser.photoURL || photoURL || user.avatar;
      user.isVerified = firebaseUser.emailVerified || true;
      if (user.authMethod === "email") user.authMethod = "google";
      user.lastLogin = new Date();
      await user.save();
    }
    user.lastLogin = new Date();
    await user.save();
    const jwtToken = jwt.sign(
      { userId: user._id, firebaseUid: user.firebaseUid, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const customToken = await admin.auth().createCustomToken(decodedToken.uid);
    return res.status(200).json({
      success: true,
      message: "Google sign-in successful!",
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        authMethod: user.authMethod,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        myreferralCode: user.myreferralCode,
        referredBy: user.referredBy,
      },
      customToken,
      jwtToken,
    });
  } catch (error) {
    console.error("Google sign-in error:", error);
    if (error.message?.includes("Too many attempts"))
      return res.status(429).json({ success: false, message: error.message });
    if (error.code === "auth/id-token-expired")
      return res.status(401).json({ success: false, message: "Token expired. Please try again." });
    if (error.code === "auth/invalid-id-token")
      return res.status(401).json({ success: false, message: "Invalid token." });
    return res.status(500).json({ success: false, message: "Google sign-in failed." });
  }
};
const registerWithEmail = async (req, res) => {
  try {
    const { email, password, name, referredBy } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Email, password, and name are required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: "Invalid email format" });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    checkRateLimit(`register_${email}`);

    const existingDbUser = await User.findOne({ email: email.toLowerCase() });
    if (existingDbUser) {
      return res.status(400).json({ success: false, message: "Email already registered. Please log in." });
    }
    try {
      const existingFirebase = await admin.auth().getUserByEmail(email.toLowerCase());
      if (existingFirebase) await admin.auth().deleteUser(existingFirebase.uid);
    } catch (err) {
      if (err.code !== "auth/user-not-found") console.error("Firebase lookup error:", err);
    }
    const firebaseUser = await admin.auth().createUser({
      email: email.toLowerCase(),
      password,
      displayName: name.trim(),
      emailVerified: true,
    });
    const userData = {
      firebaseUid: firebaseUser.uid,
      name: name.trim(),
      email: email.toLowerCase(),
      authMethod: "email",
      isVerified: true,
      role: "user",
      createdAt: new Date(),
      myreferralCode: randomReferralCode(),
      referredBy: null,
    };
    let referrerDoc = null;
    let referralDetails = null;
    if (referredBy) {
      const referralConfig = await ReferralConfig.findOne();
      if (referralConfig) {
        const now = new Date();
        referralDetails = {
          expiryDate: new Date(now.getTime() + referralConfig.daysUntilExpiry * 24 * 60 * 60 * 1000),
          amount: referralConfig.value || 0,
          type: referralConfig.type || "percentage",
          firstOrderStatus: false,
          creditStatus: false,
          referredAt: now,
        };
        referrerDoc = await User.findOne({ myreferralCode: referredBy });
        if (referrerDoc && referralDetails) {
          userData.referredBy = referredBy; 
        } else {
          referrerDoc = null;
          referralDetails = null;
        }
      }
    }
    const user = new User(userData);
    await user.save();
    if (referrerDoc && referralDetails) {
      if (!referrerDoc.referredTo) referrerDoc.referredTo = new Map();
      referrerDoc.referredTo.set(user._id.toString(), referralDetails);
      await referrerDoc.save();
      try {
        await sendEmail({
          to: referrerDoc.email,
          template: "getReferrerCongratulationEmail",
          data: {
            referredUserName: user.name,
            discountValue: referralDetails.amount,
            discountType: referralDetails.type,
            expiryDate: referralDetails.expiryDate,
          },
        })
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
        // Don't fail registration if email fails
      }

      res.status(201).json({
        success: true,
        message: "User registered successfully! Please check your email for verification.",
        user: {
          _id: user._id,
          firebaseUid: user.firebaseUid,
          name: user.name,
          email: user.email,
          role: user.role,
          authMethod: user.authMethod,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          expireReferralDate: user.expireReferralDate,
          referredBy: user.referredBy,
          myrteferralCode: user.myreferralCode,
        },
        customToken,
        jwtToken,
      })
    } catch (firebaseError) {
      console.error("Firebase registration error:", firebaseError)

      // Handle specific Firebase errors
      if (firebaseError.code === "auth/email-already-exists") {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists. Please try logging in instead.",
        })
      }

      if (firebaseError.code === "auth/invalid-email") {
        return res.status(400).json({
          success: false,
          message: "Invalid email address format.",
        })
      }

      if (firebaseError.code === "auth/weak-password") {
        return res.status(400).json({
          success: false,
          message: "Password is too weak. Please choose a stronger password.",
        })
      }

      return res.status(500).json({
        success: false,
        message: "Registration failed. Please try again.",
      })
    }
  } catch (error) {
    console.error("Email registration error:", error);
    if (error.message?.includes("Too many attempts"))
      return res.status(429).json({ success: false, message: error.message });
    if (error.code === 11000)
      return res.status(400).json({ success: false, message: "Email already exists." });
    if (error.code === "auth/email-already-exists")
      return res.status(400).json({ success: false, message: "Email already registered." });
    if (error.code === "auth/invalid-email")
      return res.status(400).json({ success: false, message: "Invalid email format." });
    if (error.code === "auth/weak-password")
      return res.status(400).json({ success: false, message: "Password too weak." });
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};

const loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: "Invalid email format" });
    checkRateLimit(`login_${email}`);
    const firebaseUser = await admin.auth().getUserByEmail(email.toLowerCase());
    let user = await User.findOne({
      $or: [{ firebaseUid: firebaseUser.uid }, { email: email.toLowerCase() }],
    });
    if (!user) {
      user = new User({
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName || email.split("@")[0],
        email: email.toLowerCase(),
        authMethod: "email",
        isVerified: firebaseUser.emailVerified,
        role: "user",
        createdAt: new Date(),
        myreferralCode: randomReferralCode(),
      });
      await user.save();
    }
    user.lastLogin = new Date();
    await user.save();
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);
    const jwtToken = jwt.sign(
      { userId: user._id, firebaseUid: user.firebaseUid, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.status(200).json({
      success: true,
      message: "Login successful",
      customToken,
      jwtToken,
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        authMethod: user.authMethod,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        myreferralCode: user.myreferralCode,
        referredBy: user.referredBy,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error.message?.includes("Too many attempts"))
      return res.status(429).json({ success: false, message: error.message });
    if (error.code === "auth/user-not-found")
      return res.status(404).json({ success: false, message: "No account found. Please register." });
    if (error.code === "auth/invalid-email")
      return res.status(400).json({ success: false, message: "Invalid email format." });
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }
};
const sendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Phone number required" });
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber))
      return res.status(400).json({ success: false, message: "Invalid phone format (include country code, e.g., +1)" });
    checkRateLimit(`phone_otp_${phoneNumber}`, 3, 15 * 60 * 1000);
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByPhoneNumber(phoneNumber);
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
    }
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        phoneNumber,
        authMethod: "phone",
        role: "user",
        isVerified: false,
        name: `User ${phoneNumber.slice(-4)}`,
        myreferralCode: randomReferralCode(),
      });
      await user.save();
    }
    return res.status(200).json({
      success: true,
      message: "Ready to send OTP. Use Firebase client SDK to send verification code.",
      phoneNumber,
      userId: user._id,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    if (error.message?.includes("Too many attempts"))
      return res.status(429).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};
const verifyPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber, name, firebaseIdToken } = req.body;
    if (!phoneNumber || !firebaseIdToken) {
      return res.status(400).json({ success: false, message: "Phone number and Firebase ID token required" });
    }
    checkRateLimit(`verify_otp_${phoneNumber}`, 5, 15 * 60 * 1000);
    const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
    if (decodedToken.phone_number !== phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number mismatch" });
    }
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        firebaseUid: firebaseUser.uid,
        phoneNumber,
        authMethod: "phone",
        role: "user",
        isVerified: true,
        name: name?.trim() || firebaseUser.displayName || `User ${phoneNumber.slice(-4)}`,
        myreferralCode: randomReferralCode(),
      });
    } else {
      user.firebaseUid = firebaseUser.uid;
      user.isVerified = true;
      user.lastLogin = new Date();
      if (name && name.trim()) user.name = name.trim();
    }
    await user.save();
    const jwtToken = jwt.sign(
      { userId: user._id, firebaseUid: user.firebaseUid, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);
    const isNewUser = !user.lastLogin || user.createdAt.getTime() === user.lastLogin.getTime();
    return res.status(200).json({
      success: true,
      message: isNewUser ? "Registration successful!" : "Login successful!",
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        phoneNumber: user.phoneNumber,
        authMethod: user.authMethod,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        myreferralCode: user.myreferralCode,
        referredBy: user.referredBy,
      },
      customToken,
      jwtToken,
    });
  } catch (error) {
    console.error("Verify OTP error:", error)
    if (error.message.includes("Too many attempts")) {
      return res.status(429).json({
        success: false,
        message: error.message,
      })
    }
    res.status(500).json({
      success: false,
      message: "OTP verification failed. Please try again.",
    })
  }
}

// Verify Firebase ID Token
const verifyFirebaseToken = async (req, res) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "ID token is required",
      })
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const firebaseUid = decodedToken.uid

    // Get Firebase user details
    const firebaseUser = await admin.auth().getUser(firebaseUid)

    // Find or create user in database
    let user = await User.findOne({ firebaseUid })

    if (!user) {
      // Create new user for phone authentication
      const authMethod = firebaseUser.phoneNumber ? "phone" : "email"
      const name =
        firebaseUser.displayName || `User ${firebaseUser.phoneNumber?.slice(-4) || firebaseUser.email?.split("@")[0]}`

      user = new User({
        firebaseUid: firebaseUser.uid,
        name: name,
        email: firebaseUser.email || null,
        phoneNumber: firebaseUser.phoneNumber || null,
        authMethod: authMethod,
        isVerified: firebaseUser.emailVerified || !!firebaseUser.phoneNumber,
        role: "user",
        createdAt: new Date(),
        expireReferralDate: user.expireReferralDate,
        referredBy: user.referredBy,
        myreferralCode: user.myreferralCode,
      })

      await user.save()

      // Send welcome email for email users
      if (authMethod === "email" && firebaseUser.email) {
        try {
          await sendEmail({
            to: firebaseUser.email,
            template: "welcome",
            data: {
              name: user.name,
              email: firebaseUser.email,
            },
          })
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError)
        }
      }
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, firebaseUid: user.firebaseUid, email: user.email, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Token verified",
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        authMethod: user.authMethod,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        myreferralCode: user.myreferralCode,
        referredBy: user.referredBy,
      },
      jwtToken,
    });
  } catch (error) {
    console.error("Token verification error:", error)
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      })
    }
    res.status(401).json({
      success: false,
      message: "Invalid token",
    })
  }
};

// ==================== FORGOT PASSWORD ====================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: "Invalid email format" });

    checkRateLimit(`forgot_${email}`, 3, 60 * 60 * 1000);

    await admin.auth().getUserByEmail(email.toLowerCase());
    const resetLink = await admin.auth().generatePasswordResetLink(email.toLowerCase());

    await sendEmail({
      to: email,
      template: "passwordReset",
      data: { name: "User", resetLink },
    });

    return res.status(200).json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    if (error.message?.includes("Too many attempts"))
      return res.status(429).json({ success: false, message: error.message });
    if (error.code === "auth/user-not-found")
      return res.status(404).json({ success: false, message: "No account found with this email" });
    return res.status(500).json({ success: false, message: "Failed to send reset email" });
  }
};

// ==================== PROFILE MANAGEMENT ====================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        authMethod: user.authMethod,
        isVerified: user.isVerified,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        addresses: user.addresses,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        myreferralCode: user.myreferralCode,
        referredBy: user.referredBy,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to get profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, dateOfBirth, gender, addresses } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name) user.name = name.trim();
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (gender) user.gender = gender;
    if (addresses) user.addresses = addresses;
    await user.save();

    // Sync with Firebase if name changed
    if (name && name !== user.name) {
      try {
        await admin.auth().updateUser(user.firebaseUid, { displayName: name.trim() });
      } catch (err) {
        console.error("Firebase update error:", err);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated",
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        authMethod: user.authMethod,
        isVerified: user.isVerified,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        addresses: user.addresses,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        myreferralCode: user.myreferralCode,
        referredBy: user.referredBy,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.avatar = req.file.path; // assumes Cloudinary or similar provides URL
    await user.save();

    try {
      await admin.auth().updateUser(user.firebaseUid, { photoURL: req.file.path });
    } catch (err) {
      console.error("Firebase photo update error:", err);
    }

    return res.status(200).json({ success: true, message: "Avatar uploaded", user: { ...user.toObject(), avatar: user.avatar } });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return res.status(500).json({ success: false, message: "Failed to upload avatar" });
  }
};

// ==================== LOGOUT & DELETE ACCOUNT ====================
const logout = async (req, res) => {
  try {
    await admin.auth().revokeRefreshTokens(req.user.firebaseUid);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const firebaseUid = req.user.firebaseUid;

    await User.findByIdAndDelete(userId);
    await admin.auth().deleteUser(firebaseUid);

    return res.status(200).json({ success: true, message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete account" });
  }
};

// ==================== EXPORTS ====================
module.exports = {
  registerWithEmail,
  loginWithEmail,
  googleSignIn,
  verifyFirebaseToken,
  forgotPassword,
  getProfile,
  updateProfile,
  uploadAvatar,
  logout,
  deleteAccount,
  sendPhoneOTP,
  verifyPhoneOTP,
};