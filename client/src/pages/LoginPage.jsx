"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Loader2,
  ShoppingBag, ShieldCheck, Truck, Sparkles, Star,
} from "lucide-react"
import {
  registerWithEmail,
  loginWithEmail,
  forgotPassword,
  clearError,
  clearSuccess,
  clearPhoneAuthState,
} from "../store/slices/authSlice"
import GoogleSignInButton from "../components/GoogleSignInButton"

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading, error, success, user } = useSelector((s) => s.auth)

  const [mode, setMode] = useState("login") // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  })
  const [localError, setLocalError] = useState("")

  useEffect(() => {
    dispatch(clearError())
    dispatch(clearSuccess())
    dispatch(clearPhoneAuthState())
  }, [mode, dispatch])

  useEffect(() => {
    if (user) {
      const redirect = location.state?.from?.pathname || "/"
      navigate(redirect, { replace: true })
    }
  }, [user, navigate, location])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setLocalError("")
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLocalError("")
    if (mode === "register") {
      if (!formData.fullName.trim()) return setLocalError("Please enter your full name")
      if (formData.password !== formData.confirmPassword)
        return setLocalError("Passwords do not match")
      if (formData.password.length < 6)
        return setLocalError("Password must be at least 6 characters")
      dispatch(
        registerWithEmail({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          referralCode: formData.referralCode,
        })
      )
    } else {
      dispatch(loginWithEmail({ email: formData.email, password: formData.password }))
    }
  }

  const handleForgot = (e) => {
    e.preventDefault()
    if (!forgotEmail) return
    dispatch(forgotPassword(forgotEmail))
  }

  // Shared input style — light, premium, red focus
  const inputBase =
    "w-full h-12 pl-11 pr-11 rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 shadow-sm"

  return (
    <div className="min-h-screen w-full bg-[#faf7f5] text-neutral-900 antialiased">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT — Men's Fashion Showcase */}
        <div className="relative hidden lg:flex overflow-hidden">
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=80"
            alt="Men's fashion"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Soft warm overlay (not dark) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/25 via-rose-200/20 to-white/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />

          {/* Top brand */}
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-red-600 grid place-items-center shadow-lg shadow-red-600/30">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-neutral-900">Factory Sale</p>
                <p className="text-xs text-neutral-700/80 -mt-0.5">Men's Premium Wear</p>
              </div>
            </div>

            {/* Bottom card */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-red-600 border border-red-100 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                New Season Drop · 2026
              </div>

              <h2 className="text-5xl xl:text-6xl font-bold leading-[1.05] text-neutral-900 max-w-md">
                Define your <span className="text-red-600">style</span>, own the moment.
              </h2>
              <p className="text-neutral-700 text-base max-w-sm">
                Curated menswear — tailored shirts, premium denim, and statement
                accessories crafted for the modern gentleman.
              </p>

              {/* Trust pills */}
              <div className="grid grid-cols-3 gap-3 max-w-md pt-2">
                {[
                  { icon: ShieldCheck, label: "Secure" },
                  { icon: Truck, label: "Free Shipping" },
                  { icon: Star, label: "4.9 Rated" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white/85 backdrop-blur border border-white/60 px-3 py-3 text-center shadow-sm"
                  >
                    <Icon className="h-4 w-4 text-red-600 mx-auto mb-1" />
                    <p className="text-[11px] font-semibold text-neutral-800">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="flex items-center justify-center p-5 sm:p-10 relative">
          {/* Subtle decorative blobs */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Mobile brand */}
            <div className="lg:hidden mb-8 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-xl bg-red-600 grid place-items-center shadow-lg shadow-red-600/30 mb-3">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold tracking-tight">Factory Sale</p>
              <p className="text-xs text-neutral-500">Men's Premium Wear</p>
            </div>

            <div className="rounded-3xl bg-white border border-neutral-200/80 shadow-xl shadow-red-900/5 p-7 sm:p-9">
              {/* Header */}
              <div className="mb-7">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h1>
                <p className="text-sm text-neutral-500 mt-1.5">
                  {mode === "login"
                    ? "Sign in to continue your style journey"
                    : "Join thousands of stylish gentlemen"}
                </p>
              </div>

              {/* Mode toggle */}
              <div className="relative grid grid-cols-2 p-1 rounded-xl bg-neutral-100 mb-6">
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm border border-neutral-200/70"
                  style={{ left: mode === "login" ? 4 : "calc(50% + 0px)" }}
                />
                {["login", "register"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`relative z-10 py-2 text-sm font-semibold capitalize transition-colors ${
                      mode === m ? "text-red-600" : "text-neutral-500"
                    }`}
                  >
                    {m === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {(error || localError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{localError || error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
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
                </AnimatePresence>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
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
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <AnimatePresence>
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
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
                </AnimatePresence>

                {mode === "login" && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full h-12 rounded-xl bg-red-600 text-white font-semibold shadow-lg shadow-red-600/25 hover:bg-red-700 hover:shadow-red-600/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Sign In" : "Create Account"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-neutral-400 uppercase tracking-wider">
                    or continue with
                  </span>
                </div>
              </div>

              <GoogleSignInButton />

              {/* Footer switch */}
              <p className="mt-6 text-center text-sm text-neutral-500">
                {mode === "login" ? "New to Factory Sale? " : "Already a member? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="font-semibold text-red-600 hover:text-red-700"
                >
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-neutral-400">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-neutral-600 hover:text-red-600">Terms</Link>
              {" "}&{" "}
              <Link to="/privacy" className="text-neutral-600 hover:text-red-600">Privacy</Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Forgot password modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4"
            onClick={() => setShowForgot(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl border border-neutral-200"
            >
              <h3 className="text-xl font-bold text-neutral-900">Reset password</h3>
              <p className="text-sm text-neutral-500 mt-1 mb-5">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={inputBase}
                  />
                </div>
                {success && (
                  <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    {success}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 h-11 rounded-xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Link"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LoginPage