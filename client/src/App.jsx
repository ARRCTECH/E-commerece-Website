"use client"
import { useEffect, useState, lazy, Suspense } from "react"
import { useDispatch, useSelector } from "react-redux"
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./config/firebase"
import { initializeAuth, setFirebaseUser, logout } from "./store/slices/authSlice"
import { loadCartFromStorage, fetchCart } from "./store/slices/cartSlice"
import NetworkStatus from "./components/NetworkStatus"
import { validateEnvironment, debugEnvironment } from "./utils/envValidation"

import GTMTracker from "./components/GTMTracker"
// Pages (lazy-loaded)
const HomePage = lazy(() => import("./pages/HomePage"))
const LoginPage = lazy(() => import("./pages/LoginPage"))
const ProductsPage = lazy(() => import("./pages/ProductsPage"))
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"))
const CartPage = lazy(() => import("./pages/CartPage"))
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"))
const ProfilePage = lazy(() => import("./pages/ProfilePage"))
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"))
const WishlistPage = lazy(() => import("./pages/WishlistPage"))
const AboutUsPage = lazy(() => import("./pages/Aboutus"))
const ContactUsPage = lazy(() => import("./pages/ContactUsPage"))
const FAQPage = lazy(() => import("./pages/FAQPage"))
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"))
const TermsPage = lazy(() => import("./pages/TermsPage"))
const SearchResultsPage = lazy(() => import("./pages/SearchResultPage"))
const ProductListingPage = lazy(() => import("./pages/ProductListingPage"))
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"))
const CookiesPage = lazy(() => import("./pages/CookiesPage"))
const ReturnPage = lazy(() => import("./pages/ReturnPage"))
const ShippingPage = lazy(() => import("./pages/ShippingPage"))
const OrderDetailsPage = lazy(() => import("./pages/OrderDetailsPage"))

// Admin/Digital Marketer pages (lazy-loaded)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"))
const DigitalMarketerDashboard = lazy(() => import("./pages/digitalmarketer/DigitalMarketerDashboard"))

// Components (kept as direct imports so the shell renders instantly)
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import ProtectedRoute from "./components/ProtectedRoute"
import ToastProvider from "./components/ToastProvider"

// Styles
import "./App.css"
import ScrollToTop from "./components/ScrollToTop"

function AppContent() {
  const location = useLocation()
  const dispatch = useDispatch()
  const { initialized } = useSelector((state) => state.auth)
  const [appReady, setAppReady] = useState(false)

  const isCartPage = location.pathname === "/cart"
  const isCheckoutPage = location.pathname === "/checkout"

  useEffect(() => {
    const isValidEnvironment = validateEnvironment()
    if (!isValidEnvironment) {
      console.error("❌ Application cannot start due to missing environment variables")
      return
    }
    debugEnvironment()
    dispatch(initializeAuth())
    // Load cart from localStorage for guest users
    dispatch(loadCartFromStorage())
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in, update Firebase user in state
          dispatch(
            setFirebaseUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              phoneNumber: firebaseUser.phoneNumber,
              displayName: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified,
              photoURL: firebaseUser.photoURL,
            }),
          )
          // Fetch user's cart from server
          dispatch(fetchCart())
        } else {
          // User is signed out, load guest cart from localStorage
          dispatch(loadCartFromStorage())
        }
      } catch (error) {
        console.error("Auth state change error:", error)
        dispatch(logout())
        // Load guest cart even if auth fails
        dispatch(loadCartFromStorage())
      } finally {
        setAppReady(true)
      }
    })

    return () => unsubscribe()
  }, [dispatch])

  // // Show loading state while auth is initializing
  // if (!initialized || !appReady) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-white">
  //       <div className="text-center">
  //         <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="App">
      <ToastProvider />
      <NetworkStatus />
      <main className="pt-2 main-content">
        <div className={isCartPage ? "hidden md:block" : ""}>
          <div className={isCheckoutPage ? "hidden md:block" : ""}>
            <Navbar />
          </div>
        </div>
        <Suspense fallback={<div className="flex items-center justify-center py-10 text-gray-600">Loading…</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:category" element={<ProductsPage />} />
            {/* <Route path="/product/:id" element={<ProductDetailPage />} /> */}
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/returns" element={<ReturnPage />} />
            <Route path="/shipping" element={<ShippingPage />} />
            {/* Protected Routes */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />}  />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/order/:orderId" element={<OrderDetailsPage />} /> {/* New Route */}
            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* Digital Marketer Routes */}
            <Route
              path="/digitalMarketer/*"
              element={
                <ProtectedRoute digitalMarketerOnly={true}>
                  <DigitalMarketerDashboard />
                </ProtectedRoute>
              }
            />
            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                  <div className="p-8 text-center bg-white shadow-lg rounded-2xl">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full">
                      <span className="text-2xl font-bold text-white">404</span>
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-gray-800">Page Not Found</h1>
                    <p className="mb-4 text-gray-600">The page you're looking for doesn't exist.</p>
                    <a
                      href="/"
                      className="inline-block px-6 py-2 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
                    >
                      ← Back to Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <div className={isCartPage ? "hidden md:block" : ""}>
        <div className={isCheckoutPage ? "hidden md:block" : ""}>
          <Footer />
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <GTMTracker/>
      <ScrollToTop/>
      <AppContent />
    </Router>
  )
}

export default App