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

  const [mode, setMode] = useState(getModeFromPath())
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
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
      setEmailForm({ email: "", password: "", name: "", confirmPassword: "" })
      setInvalidCredentials(false)
      setInvalidCredentialsMessage("")
      dispatch(clearPhoneAuthState())
    }
  }, [location.pathname])

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

  useEffect(() => {
    if (message) {
      toast.success(message)
      dispatch(clearSuccess())
    }

    if (error) {
      if (isInvalidCredentialsError(error) && lastAuthAttempt.method === "email" && lastAuthAttempt.mode === "login") {
        const msg = "Invalid credentials. Please check your email and password."
        toast.error(msg)
        setInvalidCredentials(true)
        setInvalidCredentialsMessage(msg)
      } else {
        toast.error(error)
      }
      dispatch(clearError())
    }
  }, [message, error, dispatch, lastAuthAttempt])

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
    setEmailForm({ email: "", password: "", name: "", confirmPassword: "" })
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

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="h-full flex items-center justify-center px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-5xl">
          
          {/* Left Section - Brand Showcase */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-red-700 to-red-800 rounded-l-2xl p-8 h-[600px]"
          >
            {/* Logo */}
            <div>
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-6 h-6 text-white" />
                <span className="text-lg font-bold text-white tracking-wide">FACTORY SALE</span>
              </div>
              <p className="text-red-200 text-xs mt-2">Premium Menswear</p>
            </div>

            {/* Main Message */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white leading-tight">
                Style That<br />Makes Statement
              </h1>
              <p className="text-red-100 text-sm leading-relaxed">
                Discover premium menswear at factory prices. Quality meets affordability.
              </p>
              
              {/* Features */}
              {/* <div className="space-y-2 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
                  <span className="text-red-100 text-xs">Premium Quality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
                  <span className="text-red-100 text-xs">Factory Direct Prices</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
                  <span className="text-red-100 text-xs">Free Shipping $50+</span>
                </div>
              </div> */}
            </div>

            {/* Trust Badges */}
            <div className="flex justify-between text-red-200 text-[10px] tracking-wide">
              <span>✓ SECURE</span>
              <span>✓ TRUSTED</span>
              <span>✓ SUPPORT</span>
            </div>
          </motion.div>

          {/* Right Section - Login/Register Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-r-2xl shadow-xl p-6 lg:p-8 h-[600px] flex flex-col"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-4">
              <div className="flex items-center justify-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-red-600" />
                <span className="text-lg font-bold text-gray-900">FACTORY SALE</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">Premium Menswear</p>
            </div>

            {/* Mode Toggle */}
            <div className="bg-gray-100 p-1 rounded-full mb-5 flex">
              <button
                onClick={() => handleModeChange("login")}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  mode === "login" 
                    ? "bg-red-600 text-white shadow-md" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => handleModeChange("register")}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  mode === "register" 
                    ? "bg-red-600 text-white shadow-md" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Title */}
            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === "login" ? "Welcome Back" : "Join Factory Sale"}
              </h2>
              <p className="text-gray-500 text-xs mt-1">
                {mode === "login" 
                  ? "Sign in to your account" 
                  : "Create account to get started"}
              </p>
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {mode === "register" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block mb-1 text-xs font-medium text-gray-700">Full Name</label>
                    <div className="relative">
                      <User className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        type="text"
                        value={emailForm.name}
                        onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                        className="w-full py-2.5 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </motion.div>
                )}
                
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={emailForm.password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-9 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {invalidCredentials && mode === "login" && (
                    <p className="mt-1.5 text-xs text-red-500">{invalidCredentialsMessage}</p>
                  )}
                </div>
                
                {mode === "register" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block mb-1 text-xs font-medium text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={emailForm.confirmPassword}
                        onChange={(e) => setEmailForm({ ...emailForm, confirmPassword: e.target.value })}
                        className="w-full py-2.5 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </motion.div>
                )}
                
                {mode === "login" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all duration-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 py-0.5 bg-white text-gray-400">OR</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <GoogleSignInButton />

              {/* Footer */}
              <div className="mt-4 text-center">
                <p className="text-[10px] text-gray-400">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" className="text-red-600 hover:text-red-700">
                    Terms
                  </Link>{" "}
                  &{" "}
                  <Link to="/privacy" className="text-red-600 hover:text-red-700">
                    Privacy
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForgotPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm p-6 bg-white rounded-xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your email to receive reset link
                </p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Link"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dc2626;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b91c1c;
        }
      `}</style>
    </div>
  )
}

export default LoginPage