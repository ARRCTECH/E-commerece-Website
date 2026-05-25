"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, ShoppingBag } from "lucide-react"
import {
  registerWithEmail,
  loginWithEmail,
  forgotPassword,
  clearError,
  clearSuccess,
  clearPhoneAuthState,
} from "../store/slices/authSlice"
import toast from "react-hot-toast"
import { cleanupRecaptcha } from "../config/firebase"
import GoogleSignInButton from "../components/GoogleSignInButton"

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isLoading,
    error,
    message,
    isAuthenticated,
  } = useSelector((state) => state.auth)

  const getModeFromPath = () => {
    const path = location.pathname
    if (path === '/register' || path === '/signup') {
      return 'register'
    }
    return 'login'
  }

  const referredCode = () => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
     return ref ? String(ref) : null;
  };

  const [mode, setMode] = useState(getModeFromPath())
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
    referredBy: referredCode(),
  })

  const [forgotEmail, setForgotEmail] = useState("")
  const [lastAuthAttempt, setLastAuthAttempt] = useState({ method: null, mode: null })
  const [invalidCredentials, setInvalidCredentials] = useState(false)
  const [invalidCredentialsMessage, setInvalidCredentialsMessage] = useState("")

  const from = location.state?.from?.pathname || "/"
  
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo, { replace: true });
    }
    return () => {
      cleanupRecaptcha()
    }
  }, [isAuthenticated, navigate, from, location, location.state?.from])

  useEffect(() => {
    const pathMode = getModeFromPath()
    if (pathMode !== mode) {
      setMode(pathMode)
      setEmailForm({ email: "", password: "", name: "", confirmPassword: "", referredBy: referredCode() })
      setInvalidCredentials(false)
      setInvalidCredentialsMessage("")
      dispatch(clearPhoneAuthState())
    }
  }, [dispatch, getModeFromPath, location.pathname, mode])

  const isInvalidCredentialsError = (err) => {
    if (!err) return false
    const e = String(err).toLowerCase()
    const patterns = [
      "auth/wrong-password", "wrong password", "auth/user-not-found",
      "user not found", "no user record", "invalid email or password",
      "invalid credentials", "invalid password", "account not found",
    ]
    return patterns.some((p) => e.includes(p))
  }

  // Helper to safely convert any value to a readable string
  const safeToString = (value) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      // If it has a message property, use that
      if (value.message && typeof value.message === 'string') return value.message;
      // Otherwise stringify the whole object
      return JSON.stringify(value);
    }
    return String(value);
  };

  useEffect(() => {
    if (message) {
      const msg = safeToString(message);
      toast.success(msg);
      dispatch(clearSuccess());
    }

    if (error) {
      const errorMsg = safeToString(error);
      
      if (isInvalidCredentialsError(errorMsg) && lastAuthAttempt.method === "email" && lastAuthAttempt.mode === "login") {
        const friendlyMsg = "Invalid credentials. Please check your email and password.";
        toast.error(friendlyMsg);
        setInvalidCredentials(true);
        setInvalidCredentialsMessage(friendlyMsg);
      } else {
        toast.error(errorMsg);
      }
      dispatch(clearError());
    }
  }, [message, error, dispatch, lastAuthAttempt]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setLastAuthAttempt({ method: "email", mode })

    if (mode === "register") {
      if (!emailForm.name.trim()) {
        toast.error("Name is required")
        return
      }
      if (emailForm.password !== emailForm.confirmPassword) {
        toast.error("Passwords don't match")
        return
      }
      if (emailForm.password.length < 6) {
        toast.error("Password must be at least 6 characters long")
        return
      }
      dispatch(registerWithEmail({
        email: emailForm.email,
        password: emailForm.password,
        name: emailForm.name,
        referredBy: emailForm.referredBy,
      }))
    } else {
      setInvalidCredentials(false)
      setInvalidCredentialsMessage("")
      dispatch(loginWithEmail({
        email: emailForm.email,
        password: emailForm.password,
      }))
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      toast.error("Email is required")
      return
    }
    dispatch(forgotPassword(forgotEmail))
    setShowForgotPassword(false)
    setForgotEmail("")
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    dispatch(clearPhoneAuthState())
    setEmailForm({ email: "", password: "", name: "", confirmPassword: "", referredBy: referredCode() })
    setInvalidCredentials(false)
    setInvalidCredentialsMessage("")
    
    if (newMode === 'login') {
      navigate('/login', { replace: true })
    } else {
      navigate('/register', { replace: true })
    }
  }

  const onEmailChange = (value) => {
    setEmailForm((s) => ({ ...s, email: value }))
    if (invalidCredentials) {
      setInvalidCredentials(false)
      setInvalidCredentialsMessage("")
    }
  }
  
  const onPasswordChange = (value) => {
    setEmailForm((s) => ({ ...s, password: value }))
    if (invalidCredentials) {
      setInvalidCredentials(false)
      setInvalidCredentialsMessage("")
    }
  }

  // Styling helpers
  const inputBase = "w-full h-12 pl-11 pr-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 outline-none transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Dark background with image overlay (matching first component) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/loginpageBackground.png')" }}
      />

      {/* Back to Home button (optional but matches the first component's styling) */}
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
            {/* Logo area */}
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
              {/* Mode Toggle - Login / Register (styled like first component) */}
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
                    onClick={() => handleModeChange(m)}
                    className={`relative z-10 py-2.5 text-sm font-semibold capitalize transition-all duration-200 rounded-lg ${mode === m ? "text-white" : "text-white/60 hover:text-white"
                      }`}
                  >
                    {m === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Error / Success Messages (toast is used, but we also show inline for consistency) */}
              <AnimatePresence>
                {(invalidCredentials && mode === "login") && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-3 py-2.5 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{invalidCredentialsMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Form (glassmorphic inputs, gradient button) */}
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
                      type="text"
                      placeholder="Full name"
                      value={emailForm.name}
                      onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </motion.div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={emailForm.email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    className={inputBase}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={emailForm.password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    className={inputBase}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={emailForm.confirmPassword}
                        onChange={(e) => setEmailForm({ ...emailForm, confirmPassword: e.target.value })}
                        className={inputBase}
                        required
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                      <input
                        type="text"
                        placeholder="Referral code (optional)"
                        value={emailForm.referredBy}
                        onChange={(e) => setEmailForm({ ...emailForm, referredBy: e.target.value })}
                        className={inputBase}
                      />
                    </div>
                  </motion.div>
                )}

                {mode === "login" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
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

              {/* Divider */}
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

              {/* Google Sign-In Button (kept as is, but wrapped with slight scaling) */}
              <div className="transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                <GoogleSignInButton />
              </div>

              {/* Footer */}
              <p className="mt-6 text-center text-sm text-white/60">
                {mode === "login" ? "New to Factory Sale? " : "Already a member? "}
                <button
                  type="button"
                  onClick={() => handleModeChange(mode === "login" ? "register" : "login")}
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

      {/* Forgot Password Modal – restyled to match dark glassmorphic theme */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowForgotPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 p-6 shadow-2xl"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Reset password</h3>
                <p className="text-sm text-white/60 mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/50" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
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

      {/* Optional container for any external recaptcha (kept for compatibility) */}
      <div id="recaptcha-container"></div>
    </div>
  )
}

export default LoginPage