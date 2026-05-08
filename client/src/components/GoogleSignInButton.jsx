import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { signInWithGoogle } from '../store/slices/authSlice'
import { FcGoogle } from 'react-icons/fc'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const GoogleSignInButton = ({ text = "Continue with Google", className = "" }) => {
  const dispatch = useDispatch()
  const { isLoading } = useSelector((state) => state.auth)

  const handleGoogleSignIn = async () => {
    try {
      const result = await dispatch(signInWithGoogle()).unwrap()
      toast.success(`Welcome ${result.displayName || 'User'}!`)
    } catch (error) {
      toast.error("Google sign-in failed. Please try again.")
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ksauni-red disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <FcGoogle className="w-5 h-5" />
          <span>{text}</span>
        </>
      )}
    </button>
  )
}

export default GoogleSignInButton