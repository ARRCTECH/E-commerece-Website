// routes/admin.js - COMPLETE WORKING VERSION

const express = require("express");
const multer = require("multer");

// ✅ Product upload middleware
const productUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
}).fields([
  { name: 'commonImages', maxCount: 20 },
  { name: 'videos', maxCount: 10 },
  { name: 'colorImages', maxCount: 100 },
]);

// Category image upload (single)
const categoryUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');

// Banner image upload (single)
const bannerUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');

const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  deleteSingleReferralDetails,
  updateReferralDetails
} = require("../controllers/adminController");

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");

const { protect, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all admin routes
router.use(protect);

// Dashboard Stats
router.get("/dashboard/stats", adminAuth, getDashboardStats);

// User Management
router.get("/users", adminAuth, getAllUsers);
router.put("/users/:userId/role", adminAuth, updateUserRole);
router.delete("/users/:userId", adminAuth, deleteUser);
router.post("/users/referral/delete", adminAuth, deleteSingleReferralDetails);
router.put("/users/referral/update", adminAuth, updateReferralDetails);

// Order Management
router.get("/orders", adminAuth, getAllOrders);
router.put("/orders/:orderId/status", adminAuth, updateOrderStatus);

// Product Management - ✅ USING productUpload
router.get("/products", adminAuth, getProducts);
router.get("/products/:id", adminAuth, getProduct);
router.post("/products", adminAuth, productUpload, createProduct);
router.put("/products/:id", adminAuth, productUpload, updateProduct);
router.delete("/products/:id", adminAuth, deleteProduct);

// Category Management - ✅ USING categoryUpload
router.get("/categories", adminAuth, getCategories);
router.get("/categories/:slug", adminAuth, getCategoryBySlug);
router.post("/categories", adminAuth, categoryUpload, createCategory);
router.put("/categories/:id", adminAuth, categoryUpload, updateCategory);
router.delete("/categories/:id", adminAuth, deleteCategory);

// Banner Management - ✅ USING bannerUpload
router.get("/banners", adminAuth, getAllBanners);
router.post("/banners", adminAuth, bannerUpload, createBanner);
router.put("/banners/:id", adminAuth, bannerUpload, updateBanner);
router.delete("/banners/:id", adminAuth, deleteBanner);

// Coupon Management
router.get("/coupons", adminAuth, getAllCoupons);
router.post("/coupons", adminAuth, createCoupon);
router.put("/coupons/:couponId", adminAuth, updateCoupon);
router.delete("/coupons/:couponId", adminAuth, deleteCoupon);

module.exports = router;