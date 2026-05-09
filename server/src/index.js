const dotenv = require("dotenv")
const path = require("path")
// Load environment variables first - check for production env file first
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) })

// Fallback to regular .env if production file doesn't exist
if (process.env.NODE_ENV === 'production' && !process.env.PORT) {
  dotenv.config({ path: path.resolve(__dirname, "../.env") })
}

const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const compression = require("compression")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const app = express()
const referralRoutes = require('../routes/referralRoutes');



// Trust proxy only for specific IPs (Docker network)
app.set('trust proxy', ['127.0.0.1', '172.16.0.0/12', '192.168.0.0/16'])


// Apply global security headers
app.use(helmet())


// Compress all responses
app.use(compression({ level: 6 })) // Moderate compression level for balance



// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests, please try again later."
  },
  // Configure trusted proxies
  trustProxy: false // Disable automatic trust proxy
})



// Apply rate limiting to all requests
app.use("/api/", apiLimiter)



// More strict rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later."
  }
})

// Apply stricter rate limiting to auth routes
app.use("/api/auth/", authLimiter)

// Cache control middleware - can be customized per route
app.use((req, res, next) => {
  // Default no cache for dynamic content
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
  next()
})


// Debug environment variables
console.log("🔧 Environment Check:")
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("PORT:", process.env.PORT)
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Missing")
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing")


// Middleware
// Parse CORS_ORIGIN from environment variables
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").filter(Boolean)


app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if(!origin) return callback(null, true);
      
      // Check if the origin is allowed
      if(allowedOrigins.indexOf(origin) === -1) {
        console.log(`Allowing origin: ${origin} for development`);
      }
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Static files
app.use("/uploads", (req, res, next) => {
  // Set caching headers for static files - 1 day cache
  res.setHeader("Cache-Control", "public, max-age=86400");
  next();
}, express.static(path.join(__dirname, "uploads")))

// Health check endpoint (should be before other routes)
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Factory Sale API Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
})



app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
})



// Routes
app.use("/api/auth", require("../routes/auth"))
app.use("/api/products", require("../routes/product"))
app.use("/api/categories", require("../routes/categories")) // Corrected from categories to category based on previous block
app.use("/api/cart", require("../routes/cart"))
app.use("/api/reviews", require("../routes/review"))
app.use("/api/wishlist", require("../routes/wishlist"))
app.use("/api/coupons", require("../routes/coupon"))
app.use("/api/banners", require("../routes/banner"))
app.use("/api/innovations", require("../routes/innovation"))
// app.use("/api/returns", require("../routes/return"))
app.use("/api/admin", require("../routes/admin"))
app.use("/api/digital-marketer", require("../routes/digitalMarketer"))
// app.use("/api/shiprocket", require("../routes/shiprocket"))
app.use("/api/popup-setting", require("../routes/popupSetting"))
app.use("/api/ksauni-tshirts",require("../routes/ksaunitshirtstyle"))
app.use( "/api/reason" ,require("../routes/reasonRoutes"));
app.use('/api/catalog', require("../routes/productCatalog"));
app.use('/api/referral-config', referralRoutes);

app.use("/api/partial-cod", require("../routes/partialCodRoutes"));
// app.use("/api/orders", require("../routes/order"));
// app.use("/api/topten", require("../routes/topten"))
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
})

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/fashionhub"
    console.log("🔄 Connecting to MongoDB...")
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("✅ Connected to MongoDB")
    console.log("📊 Database:", mongoose.connection.name)
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}



// Connect to database
connectDB()


// Start server
const PORT = process.env.PORT || 5000 // Changed back to 5000 to match frontend
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`)
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("👋 SIGTERM received, shutting down gracefully")
  try {
    await mongoose.connection.close()
    console.log("📊 MongoDB connection closed")
    process.exit(0)
  } catch (err) {
    console.error("Error closing MongoDB connection:", err)
    process.exit(1)
  }
})



