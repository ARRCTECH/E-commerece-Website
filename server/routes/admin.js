const express = require("express");
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

const { protect, adminAuth, digitalMarketerAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Apply authentication to all admin routes
router.use(protect);

// Dashboard Stats (Admin only)
router.get("/dashboard/stats", adminAuth, getDashboardStats);

// User Management (Admin only)
router.get("/users", adminAuth, getAllUsers);
router.put("/users/:userId/role", adminAuth, updateUserRole);
router.delete("/users/:userId", adminAuth, deleteUser);

// Order Management (Admin only)
router.get("/orders", adminAuth, getAllOrders);
router.put("/orders/:orderId/status", adminAuth, updateOrderStatus);

// Product Management (Admin only)
router.get("/products", adminAuth, getProducts);
router.get("/products/:id", adminAuth, getProduct);
router.post("/products", adminAuth, upload.array("images", 10), createProduct);
router.put("/products/:id", adminAuth, upload.array("images", 10), updateProduct);
router.delete("/products/:id", adminAuth, deleteProduct);

// Category Management (Admin only)
router.get("/categories", adminAuth, getCategories);
router.get("/categories/:slug", adminAuth, getCategoryBySlug);
router.post("/categories", adminAuth, upload.single("image"), createCategory);
router.put("/categories/:id", adminAuth, upload.single("image"), updateCategory);
router.delete("/categories/:id", adminAuth, deleteCategory);
     
// Banner Management (Admin & Digital Marketer)
router.get("/banners", adminAuth, getAllBanners);
router.post("/banners", adminAuth, upload.single("image"), createBanner);
router.put("/banners/:id", adminAuth, upload.single("image"), updateBanner);
router.delete("/banners/:id", adminAuth, deleteBanner);

// Coupon Management (Admin only)
router.get("/coupons", adminAuth, getAllCoupons);
router.post("/coupons", adminAuth, createCoupon);
router.put("/coupons/:couponId", adminAuth, updateCoupon);
router.delete("/coupons/:couponId", adminAuth, deleteCoupon);

module.exports = router;
