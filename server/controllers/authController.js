const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ReferralConfig = require("../models/ReferralConfig");
const { sendEmail } = require("../utils/emailService");

// ==================== RATE LIMITING ====================
// Use Redis in production for shared rate limiting across multiple servers
let redisClient = null;
try {
  // Optional: if you have redis installed and configured
  // redisClient = require("redis").createClient(process.env.REDIS_URL);
  // await redisClient.connect();
} catch (err) {
  console.warn("Redis not available, falling back to in-memory rate limiting (not for production clusters)");
}

const rateLimitStore = new Map(); // fallback

const checkRateLimit = async (identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const key = `${identifier}_${windowKey}`;

  if (redisClient) {
    const attempts = await redisClient.incr(key);
    if (attempts === 1) await redisClient.expire(key, windowMs / 1000);
    if (attempts > maxAttempts) {
      throw new Error(`Too many attempts. Please try again later.`);
    }
  } else {
    // In-memory fallback (single instance only)
    const attempts = (rateLimitStore.get(key) || 0) + 1;
    if (attempts > maxAttempts) {
      throw new Error(`Too many attempts. Please try again later.`);
    }
    rateLimitStore.set(key, attempts);
    // Clean up old windows
    for (const [k, v] of rateLimitStore.entries()) {
      const [, keyWindow] = k.split("_");
      if (parseInt(keyWindow) < windowKey - 1) {
        rateLimitStore.delete(k);
      }
    }
  }
};

// ==================== UNIQUE REFERRAL CODE GENERATOR ====================
const generateUniqueReferralCode = async (retries = 5) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"; // removed I, O, 0, 1 to avoid confusion
  let code;
  for (let i = 0; i < retries; i++) {
    code = "";
    for (let j = 0; j < 6; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await User.findOne({ myreferralCode: code });
    if (!existing) return code;
  }
  throw new Error("Unable to generate unique referral code");
};

// ==================== HELPER: CREATE USER WITH REFERRAL (TRANSACTION) ====================
const createUserWithReferral = async (userData, referredByCode = null) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    // 1. Generate unique referral code for new user
    const myreferralCode = await generateUniqueReferralCode();

    let referrerDoc = null;
    let referralDetails = null;

    // 2. If referredBy code provided, fetch referrer and prepare referral details
    if (referredByCode) {
      const referralConfig = await ReferralConfig.findOne();
      if (referralConfig && referralConfig.daysUntilExpiry && referralConfig.value) {
        const now = new Date();
        referralDetails = {
          name: userData.name,
          expiryDate: new Date(now.getTime() + referralConfig.daysUntilExpiry * 24 * 60 * 60 * 1000),
          amount: referralConfig.value,
          type: referralConfig.type || "percentage",
          firstOrderStatus: false,
          creditStatus: false,
          referredAt: now,
        };
        referrerDoc = await User.findOne({ myreferralCode: referredByCode }).session(session);
        // Prevent self-referral
        if (referrerDoc && referrerDoc.email === userData.email) {
          referrerDoc = null;
          referralDetails = null;
        }
      }
    }

    // 3. Create new user
    const newUser = new User({
      ...userData,
      myreferralCode,
      referredBy: referrerDoc ? referredByCode : null,
    });
    await newUser.save({ session });

    // 4. Update referrer's referredTo map if applicable
    if (referrerDoc && referralDetails) {
      if (!referrerDoc.referredTo) referrerDoc.referredTo = new Map();
      referrerDoc.referredTo.set(newUser._id.toString(), referralDetails);
      await referrerDoc.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Send welcome email (non-blocking, don't rollback transaction if fails)
    if (newUser.email) {
      sendEmail({
        to: newUser.email,
        template: "welcome",
        data: { name: newUser.name, email: newUser.email },
      }).catch(err => console.error("Welcome email failed:", err));
    }

    // Send referrer congratulation email (non-blocking)
    if (referrerDoc && referralDetails && referrerDoc.email) {
      sendEmail({
        to: referrerDoc.email,
        template: "getReferrerCongratulationEmail",
        data: {
          referredUserName: newUser.name,
          discountValue: referralDetails.amount,
          discountType: referralDetails.type,
          expiryDate: referralDetails.expiryDate,
        },
      }).catch(err => console.error("Referrer email failed:", err));
    }

    return newUser;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ==================== REGISTER WITH EMAIL & PASSWORD ====================
const registerWithEmail = async (req, res) => {
  try {
    const { name, email, password, referredBy } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Email, password, and name are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: "Invalid email format" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    await checkRateLimit(`register_${email}`);

    // Check if user already exists in our DB
    const existingDbUser = await User.findOne({ email: email.toLowerCase() });
    if (existingDbUser) {
      return res.status(400).json({ success: false, message: "Email already registered. Please log in." });
    }

    // Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email.toLowerCase(),
        password,
        displayName: name.trim(),
        emailVerified: true, // Set to false if you want email verification flow
      });
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        // Firebase already has this email but our DB doesn't → try to get the existing Firebase user
        firebaseUser = await admin.auth().getUserByEmail(email.toLowerCase());
        // Optionally delete and recreate? Better to handle gracefully.
        // For consistency, we will use the existing Firebase UID but ensure our DB has a record.
      } else {
        throw err;
      }
    }

    // Prepare user data
    const userData = {
      firebaseUid: firebaseUser.uid,
      name: name.trim(),
      email: email.toLowerCase(),
      authMethod: "email",
      isVerified: true,
      role: "user",
      createdAt: new Date(),
    };

    // Create user in MongoDB with referral handling
    const user = await createUserWithReferral(userData, referredBy);

    // Generate tokens
    const customToken = await admin.auth().createCustomToken(user.firebaseUid);
    const jwtToken = jwt.sign(
      {
        userId: user._id, role: user.role, phoneNumber: user.phoneNumber,
        name: user.name, email: user.email, firebaseUid: user.firebaseUid,
        authMethod: user.authMethod, referredBy: user.referredBy,
        myreferralCode: user.myreferralCode
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d', algorithm: 'HS256' }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: user.role,
        authMethod: user.authMethod,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        myreferralCode: user.myreferralCode,
        referredBy: user.referredBy,
      },
      customToken,
      jwtToken,
    });
  } catch (error) {
    console.error("Email registration error:", error);
    if (error.message?.includes("Too many attempts")) return res.status(429).json({ success: false, message: error.message });
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Email already exists." });
    if (error.code === "auth/email-already-exists") return res.status(400).json({ success: false, message: "Email already registered in Firebase." });
    if (error.code === "auth/invalid-email") return res.status(400).json({ success: false, message: "Invalid email format." });
    if (error.code === "auth/weak-password") return res.status(400).json({ success: false, message: "Password too weak." });
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};

// ==================== LOGIN WITH EMAIL & PASSWORD (USING ID TOKEN) ====================
// Client must first call Firebase Client SDK signInWithEmailAndPassword, then send the ID token.
const loginWithEmail = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "ID token required" });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);

    // Find user in our DB
    let user = await User.findOne({ firebaseUid: firebaseUser.uid });
    if (!user) {
      // If user exists by email but different UID (e.g., social login first, then email) → handle linking
      user = await User.findOne({ email: firebaseUser.email?.toLowerCase() });
      if (user) {
        // Link accounts: update user's firebaseUid to match the one used for login
        user.firebaseUid = firebaseUser.uid;
        user.authMethod = "email"; // or keep existing? decide
        await user.save();
      } else {
        return res.status(404).json({ success: false, message: "No account found. Please register." });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const customToken = await admin.auth().createCustomToken(user.firebaseUid);
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
    if (error.message?.includes("Too many attempts")) return res.status(429).json({ success: false, message: error.message });
    if (error.code === "auth/user-not-found") return res.status(404).json({ success: false, message: "No account found. Please register." });
    if (error.code === "auth/invalid-id-token") return res.status(401).json({ success: false, message: "Invalid credentials" });
    return res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

// ==================== GOOGLE SIGN-IN ====================
const googleSignIn = async (req, res) => {
  try {
    const { idToken, referredBy } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "ID token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);

    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // Check if email already exists with another auth method
      const existingUserByEmail = await User.findOne({ email: firebaseUser.email?.toLowerCase() });
      if (existingUserByEmail) {
        // Account linking: update existing user with Google provider data
        existingUserByEmail.firebaseUid = decodedToken.uid;
        existingUserByEmail.name = firebaseUser.displayName || existingUserByEmail.name;
        existingUserByEmail.avatar = firebaseUser.photoURL || existingUserByEmail.avatar;
        existingUserByEmail.authMethod = "google";
        existingUserByEmail.isVerified = firebaseUser.emailVerified || true;
        existingUserByEmail.lastLogin = new Date();
        await existingUserByEmail.save();
        user = existingUserByEmail;
      } else {
        // Create new user with referral
        const userData = {
          firebaseUid: decodedToken.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email?.toLowerCase(),
          authMethod: "google",
          isVerified: firebaseUser.emailVerified || true,
          role: "user",
          avatar: firebaseUser.photoURL,
          createdAt: new Date(),
        };
        user = await createUserWithReferral(userData, referredBy);
      }
    } else {
      // Update existing user
      user.name = firebaseUser.displayName || user.name;
      user.avatar = firebaseUser.photoURL || user.avatar;
      user.isVerified = firebaseUser.emailVerified || true;
      user.lastLogin = new Date();
      await user.save();
    }

    const customToken = await admin.auth().createCustomToken(user.firebaseUid);
    const jwtToken = jwt.sign(
      { userId: user._id, firebaseUid: user.firebaseUid, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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
    if (error.message?.includes("Too many attempts")) return res.status(429).json({ success: false, message: error.message });
    if (error.code === "auth/id-token-expired") return res.status(401).json({ success: false, message: "Token expired. Please try again." });
    if (error.code === "auth/invalid-id-token") return res.status(401).json({ success: false, message: "Invalid token." });
    return res.status(500).json({ success: false, message: "Google sign-in failed." });
  }
};

// ==================== PHONE OTP (SEND & VERIFY) ====================
const sendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Phone number required" });

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber))
      return res.status(400).json({ success: false, message: "Invalid phone format (include country code, e.g., +1)" });

    await checkRateLimit(`phone_otp_${phoneNumber}`, 3, 15 * 60 * 1000);

    // Do NOT create a user record here. OTP must be verified first.
    // Just return success – the Firebase client SDK will send the SMS.
    return res.status(200).json({
      success: true,
      message: "OTP sent via Firebase. Use Firebase client SDK to verify.",
      phoneNumber,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    if (error.message?.includes("Too many attempts")) return res.status(429).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

const verifyPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber, name, firebaseIdToken, referredBy } = req.body;
    if (!phoneNumber || !firebaseIdToken) {
      return res.status(400).json({ success: false, message: "Phone number and Firebase ID token required" });
    }

    await checkRateLimit(`verify_otp_${phoneNumber}`, 5, 15 * 60 * 1000);

    const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
    if (decodedToken.phone_number !== phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number mismatch" });
    }
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);

    // Check if user already exists in our DB
    let user = await User.findOne({ phoneNumber });
    if (user && user.firebaseUid && user.firebaseUid !== firebaseUser.uid) {
      // Potential account linking scenario – handle gracefully
      user.firebaseUid = firebaseUser.uid;
    }

    if (!user) {
      // Create new user with referral
      const userData = {
        firebaseUid: firebaseUser.uid,
        phoneNumber,
        authMethod: "phone",
        role: "user",
        isVerified: true,
        name: name?.trim() || firebaseUser.displayName || `User ${phoneNumber.slice(-4)}`,
        createdAt: new Date(),
      };
      user = await createUserWithReferral(userData, referredBy);
    } else {
      user.lastLogin = new Date();
      if (name && name.trim()) user.name = name.trim();
      await user.save();
    }
    const jwtToken = jwt.sign(
      { userId: user._id, firebaseUid: user.firebaseUid, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const customToken = await admin.auth().createCustomToken(user.firebaseUid);

    const isNewUser = user.createdAt.getTime() === user.lastLogin?.getTime() || !user.lastLogin;
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
    console.error("Verify OTP error:", error);
    if (error.message?.includes("Too many attempts")) return res.status(429).json({ success: false, message: error.message });
    if (error.code === "auth/id-token-expired") return res.status(401).json({ success: false, message: "Verification expired" });
    if (error.code === "auth/invalid-id-token") return res.status(400).json({ success: false, message: "Invalid verification code" });
    return res.status(500).json({ success: false, message: "Phone verification failed" });
  }
};

// ==================== GENERIC FIREBASE TOKEN VERIFICATION ====================
const verifyFirebaseToken = async (req, res) => {
  try {
    const { idToken, referredBy } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: "ID token required" });

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const firebaseUser = await admin.auth().getUser(firebaseUid);

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      // Try to find by email or phone if they exist but different UID (account linking)
      let existingUser = null;
      if (firebaseUser.email) existingUser = await User.findOne({ email: firebaseUser.email.toLowerCase() });
      if (!existingUser && firebaseUser.phoneNumber) existingUser = await User.findOne({ phoneNumber: firebaseUser.phoneNumber });

      if (existingUser) {
        // Link accounts
        existingUser.firebaseUid = firebaseUser.uid;
        existingUser.name = firebaseUser.displayName || existingUser.name;
        existingUser.avatar = firebaseUser.photoURL || existingUser.avatar;
        existingUser.authMethod = firebaseUser.phoneNumber ? "phone" : "email";
        existingUser.isVerified = firebaseUser.emailVerified || !!firebaseUser.phoneNumber;
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new user with referral
        const authMethod = firebaseUser.phoneNumber ? "phone" : "email";
        const name = firebaseUser.displayName || `User ${firebaseUser.phoneNumber?.slice(-4) || firebaseUser.email?.split("@")[0]}`;
        const userData = {
          firebaseUid: firebaseUser.uid,
          name,
          email: firebaseUser.email || null,
          phoneNumber: firebaseUser.phoneNumber || null,
          authMethod,
          isVerified: firebaseUser.emailVerified || !!firebaseUser.phoneNumber,
          role: "user",
          avatar: firebaseUser.photoURL,
          createdAt: new Date(),
        };
        user = await createUserWithReferral(userData, referredBy);
      }
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

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
    console.error("Token verification error:", error);
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: "Invalid email format" });

    await checkRateLimit(`forgot_${email}`, 3, 60 * 60 * 1000);

    // Check if user exists in Firebase
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
    if (error.message?.includes("Too many attempts")) return res.status(429).json({ success: false, message: error.message });
    if (error.code === "auth/user-not-found") return res.status(404).json({ success: false, message: "No account found with this email" });
    return res.status(500).json({ success: false, message: "Failed to send reset email" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req?.user?.userId);
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
    const user = await User.findById(req?.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name) user.name = name.trim();
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (gender) user.gender = gender;
    if (addresses) user.addresses = addresses;
    await user.save();

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

const getProfileDetails = async (req, res) => {
  try {
    const userId = req?.user?.userId
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        phoneNumber: user?.phoneNumber || null,
        dateOfBirth: user?.dateOfBirth || null,
        gender: user?.gender || null,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to get profile" });
  }
}
const updateProfileDetails = async (req, res) => {
  try {
    const { name, dateOfBirth, gender, phoneNumber } = req.body;
    const user = await User.findById(req?.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name) user.name = name.trim();
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (gender) user.gender = gender;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    await user.save();

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
}


const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const user = await User.findById(req?.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.avatar = req.file.path;
    await user.save();

    try {
      await admin.auth().updateUser(user.firebaseUid, { photoURL: req.file.path });
    } catch (err) {
      console.error("Firebase photo update error:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Avatar uploaded",
      user: { ...user.toObject(), avatar: user.avatar }
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return res.status(500).json({ success: false, message: "Failed to upload avatar" });
  }
};

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
    const userId = req?.user?.userId;
    const firebaseUid = req?.user?.firebaseUid;

    await User.findByIdAndDelete(userId);
    await admin.auth().deleteUser(firebaseUid);

    return res.status(200).json({ success: true, message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete account" });
  }
};

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
  updateProfileDetails,
  getProfileDetails
};