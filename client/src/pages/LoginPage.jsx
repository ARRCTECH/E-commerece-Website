"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Loader2,
  Sparkles, X, Phone, CheckCircle,
} from "lucide-react"
import {
  registerWithEmail,
  loginWithEmail,
  sendPhoneOTP,
  verifyPhoneOTP,
  forgotPassword,
  clearError,
  clearSuccess,
  clearPhoneAuthState,
} from "../store/slices/authSlice"
import GoogleSignInButton from "../components/GoogleSignInButton"
import { cleanupRecaptcha } from "../config/firebase"

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { 
    isLoading, 
    error, 
    success, 
    user, 
    confirmationResult,
  } = useSelector((s) => s.auth)

  // Auth Mode State
  const [mode, setMode] = useState("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  
  // Tab State - Email or Phone
  const [activeTab, setActiveTab] = useState("email")
  
  // Email Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  })
  
  // Phone Form State
  const [phoneForm, setPhoneForm] = useState({
    phoneNumber: "",
    otp: "",
  })
  
  // OTP Timer
  const [otpTimer, setOtpTimer] = useState(0)
  const [localError, setLocalError] = useState("")
  const [lastAuthAttempt, setLastAuthAttempt] = useState({ method: null, mode: null })
  const [invalidCredentials, setInvalidCredentials] = useState(false)

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      cleanupRecaptcha()
    }
  }, [])

  // Redirect if authenticated
  useEffect(() => {
    if (user) {
      const redirect = location.state?.from?.pathname || "/"
      navigate(redirect, { replace: true })
    }
  }, [user, navigate, location])

  // Clear errors when switching mode/tab
  useEffect(() => {
    dispatch(clearError())
    dispatch(clearSuccess())
    dispatch(clearPhoneAuthState())
  }, [mode, activeTab, dispatch])

  // Handle auth errors
  useEffect(() => {
    if (error) {
      const isInvalidCred = isInvalidCredentialsError(error)
      if (isInvalidCred && lastAuthAttempt.method === "email" && lastAuthAttempt.mode === "login") {
        setInvalidCredentials(true)
        setLocalError("Invalid credentials. Please check your email and password.")
      } else {
        setLocalError(error)
      }
      dispatch(clearError())
    }
  }, [error, dispatch, lastAuthAttempt])

  // OTP Timer Effect
  useEffect(() => {
    let interval = null
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((timer) => timer - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [otpTimer])

  // Helper: Detect invalid credentials error
  const isInvalidCredentialsError = (err) => {
    if (!err) return false
    const e = String(err).toLowerCase()
    const patterns = [
      "auth/wrong-password", "wrong password", "auth/user-not-found", 
      "user not found", "invalid credentials", "invalid email or password",
    ]
    return patterns.some((p) => e.includes(p))
  }

  // Handle Email Form Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setLocalError("")
    if (invalidCredentials) setInvalidCredentials(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    // Frontend validations
    if (mode === "register") {
      if (!formData.fullName.trim()) return setLocalError("Please enter your full name");
      if (formData.password !== formData.confirmPassword)
        return setLocalError("Passwords do not match");
      if (formData.password.length < 6)
        return setLocalError("Password must be at least 6 characters");
    } else {
      if (!formData.email.trim()) return setLocalError("Email is required");
      if (!formData.password) return setLocalError("Password is required");
    }

    try {
      let result;
      if (mode === "register") {
        result = await dispatch(
          registerWithEmail({
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            referredBy: formData.referralCode || undefined, // send undefined if empty
          })
        ).unwrap(); // unwrap to get the actual response or throw on error
      } else {
        result = await dispatch(
          loginWithEmail({
            email: formData.email,
            password: formData.password,
          })
        ).unwrap();
      }
      // On success, Redux will have user, so useEffect will redirect
      // Optionally clear form
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        referralCode: "",
      });
    } catch (err) {
      // This catches both validation errors and API 400 errors
      console.error("Auth error:", err);
      const errorMessage = err?.message || err?.response?.data?.message || "Authentication failed";
      setLocalError(errorMessage);
    }
  };

  const currentPath = window.location.pathname;
  const endsWithRegister = currentPath.endsWith('/register') || currentPath.endsWith('register');

  useEffect(() => {
    if (endsWithRegister && mode !== 'register') {
      setMode('register');
    }
  }, [])

  // Resend OTP
  const handleResendOTP = () => {
    if (otpTimer > 0) return
    dispatch(sendPhoneOTP(phoneForm.phoneNumber))
    setOtpTimer(60)
  }

  // Reset phone auth state
  const resetPhoneAuth = () => {
    dispatch(clearPhoneAuthState())
    setPhoneForm({ phoneNumber: "", otp: "" })
    setOtpTimer(0)
  }

  // Switch tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    resetPhoneAuth()
    setLocalError("")
    cleanupRecaptcha()
  }

  const inputBase = "w-full h-12 pl-11 pr-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 outline-none transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/loginpageBackground.png')" }}
      />

      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 hover:scale-105 transition-all duration-300 group"
      >
        <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-4 lg:p-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="pt-4 px-7 text-center">
              <div className="flex justify-center">
                <img
                  src="/loginPage logo.png"
                  alt="Factory Sale Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>

            <div className="p-7 sm:p-8 pt-2">
              {/* Mode Toggle - Login / Register */}
              <div className="relative grid grid-cols-2 p-1 rounded-xl bg-white/10 backdrop-blur-sm mb-4">
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/50"
                  style={{ left: mode === "login" ? 4 : "calc(50% + 0px)" }}
                />
                {["login", "register"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`relative z-10 py-2.5 text-sm font-semibold capitalize transition-all duration-200 rounded-lg ${mode === m ? "text-white" : "text-white/60 hover:text-white"
                      }`}
                  >
                    {m === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Auth Method Tabs - Email / Phone */}
              <div className="flex p-1 mb-5 rounded-xl bg-white/5 backdrop-blur-sm">
                <button
                  onClick={() => handleTabChange("email")}
                  className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === "email" 
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </button>
                <button
                  onClick={() => handleTabChange("phone")}
                  className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === "phone" 
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </button>
              </div>

              {/* Error / Success Messages */}
              <AnimatePresence>
                {(localError || success) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`mb-4 flex items-start gap-2 rounded-xl backdrop-blur-sm border px-3 py-2.5 text-sm ${
                      localError 
                        ? "bg-red-500/20 border-red-500/30 text-red-200" 
                        : "bg-green-500/20 border-green-500/30 text-green-200"
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{localError || success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* EMAIL TAB FORM */}
              <AnimatePresence mode="wait">
                {activeTab === "email" && (
                  <motion.div
                    key="email-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      {mode === "register" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative"
                        >
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                          <input
                            name="fullName"
                            type="text"
                            placeholder="Full name"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={inputBase}
                          />
                        </motion.div>
                      )}

                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="Email address"
                          value={formData.email}
                          onChange={handleChange}
                          className={inputBase}
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleChange}
                          className={inputBase}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/50 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {mode === "register" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                            <input
                              name="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm password"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className={inputBase}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((s) => !s)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/50 hover:text-white transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <div className="relative">
                            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                            <input
                              name="referralCode"
                              type="text"
                              placeholder="Referral code (optional)"
                              value={formData.referralCode}
                              onChange={handleChange}
                              className={inputBase}
                            />
                          </div>
                        </motion.div>
                      )}

                      {mode === "login" && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-xs font-medium text-white/60 hover:text-white transition-all duration-200 hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 overflow-hidden"
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin relative z-10" />
                        ) : (
                          <>
                            <span className="relative z-10">{mode === "login" ? "Sign In" : "Create Account"}</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 relative z-10" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* PHONE TAB FORM */}
                {activeTab === "phone" && (
                  <motion.div
                    key="phone-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      {!confirmationResult ? (
                        <>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                            <input
                              name="phoneNumber"
                              type="tel"
                              value={phoneForm.phoneNumber}
                              onChange={handlePhoneChange}
                              className={inputBase}
                              placeholder="+91 XXXXXXXXXX"
                              required
                            />
                          </div>
                          <p className="text-xs text-white/40 -mt-2 pl-3">
                            Include country code (e.g., +91 for India)
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-center mb-2">
                            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-full bg-green-500/20 border border-green-500/30">
                              <CheckCircle className="w-7 h-7 text-green-400" />
                            </div>
                            <h3 className="text-base font-semibold text-white">Verification Code Sent</h3>
                            <p className="text-xs text-white/50 mt-1">
                              Sent to <span className="text-white font-medium">{phoneForm.phoneNumber}</span>
                            </p>
                          </div>
                          <div className="relative">
                            <input
                              name="otp"
                              type="text"
                              value={phoneForm.otp}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                                setPhoneForm({ ...phoneForm, otp: value })
                              }}
                              className="w-full h-12 text-center font-mono text-xl tracking-widest rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                              placeholder="000000"
                              maxLength={6}
                              required
                            />
                          </div>
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={handleResendOTP}
                              disabled={otpTimer > 0 || isLoading}
                              className="text-sm font-medium text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {otpTimer > 0 ? `Resend code in ${otpTimer}s` : "Resend code"}
                            </button>
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin relative z-10" />
                        ) : (
                          <>
                            <span className="relative z-10">
                              {!confirmationResult ? "Send Code" : "Verify & Continue"}
                            </span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 relative z-10" />
                          </>
                        )}
                      </button>

                      {confirmationResult && (
                        <button
                          type="button"
                          onClick={resetPhoneAuth}
                          className="w-full py-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
                        >
                          Change Phone Number
                        </button>
                      )}
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ✅ Divider and Google Button - ONLY SHOW IN EMAIL TAB */}
              {activeTab === "email" && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-transparent px-3 text-xs text-white/50 uppercase tracking-wider">
                        or continue with
                      </span>
                    </div>
                  </div>

              {/* Google Sign In Button */}
              <div className="transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                <GoogleSignInButton />
              </div>
                </>
              )}

              {/* Footer */}
              <p className="mt-6 text-center text-sm text-white/60">
                {mode === "login" ? "New to Factory Sale? " : "Already a member? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="font-semibold text-white hover:text-red-400 transition-colors hover:underline"
                >
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </p>
              <p className="text-center text-xs text-white/40 mt-4">
                By continuing, you agree to our{" "}
                <Link to="/terms" className="text-white/60 hover:text-white transition-colors">Terms</Link>
                {" & "}
                <Link to="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowForgot(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Reset password</h3>
                <button
                  onClick={() => setShowForgot(false)}
                  className="text-white/50 hover:text-white hover:rotate-90 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-white/60 mb-5">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 h-11 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 hover:border-white/40 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center transition-all duration-200"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Link"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* reCAPTCHA container for phone auth */}
      <div id="recaptcha-container"></div>
    </div>
  )
}

export default LoginPage