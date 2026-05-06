"use client"

import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Navigate, useLocation } from "react-router-dom"
import { initializeAuth } from "../store/slices/authSlice"
import LoadingSpinner from "./LoadingSpinner"

const ProtectedRoute = ({ children, adminOnly = false, digitalMarketerOnly = false }) => {
  const dispatch = useDispatch()
  const location = useLocation()

  const { isAuthenticated, user, isLoading, initialized, token } = useSelector((state) => state.auth)

  useEffect(() => {
    if (!initialized) {
      dispatch(initializeAuth())
    }
  }, [dispatch, initialized])

  // 🚀 Prevent flicker → wait until auth is checked
  if (isLoading || !initialized) {
    return <LoadingSpinner />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check admin access
  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" replace />
  }

  // Check digital marketer access
  if (digitalMarketerOnly && user?.role !== "admin" && user?.role !== "digitalMarketer") {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
