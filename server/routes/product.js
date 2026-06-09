// routes/product.js

const express = require("express");
const router = express.Router();
const multer = require("multer");

// ✅ Create direct upload middleware for products
const productUploadMiddleware = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
}).fields([
  { name: 'commonImages', maxCount: 20 },
  { name: 'videos', maxCount: 10 },
  { name: 'colorImages', maxCount: 100 },
]);

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getTrendingProducts,
  getNewArrivals,
  getOversizedProducts,
  getSearchedProducts,
  getProductsByCategory,
  getProductsByCategorySlug,
  getProductBySlug,
  getBulkProducts,
  getRegularProducts,
} = require("../controllers/productController");

// ===============================
// Product Routes
// ===============================

// GET all products with filters (regular + bulk both)
router.get("/", getProducts);

// GET only bulk products
router.get("/bulk", getBulkProducts);

// GET only regular products
router.get("/regular", getRegularProducts);

// GET searched products
router.get("/search", getSearchedProducts);

// GET trending products
router.get("/trending", getTrendingProducts);

// GET new arrivals
router.get("/new", getNewArrivals);

// GET only oversized products
router.get("/oversized", getOversizedProducts);

// GET products by category
router.get("/category/:categoryId", getProductsByCategory);

// GET products by category slug
router.get("/category/slug/:slug", getProductsByCategorySlug);

// GET single product by ID
router.get("/:id", getProduct);

// GET single product by slug
router.get("/slug/:slug", getProductBySlug);

// POST create product (Admin only)
router.post("/", productUploadMiddleware, createProduct);

// PUT update product (Admin only)
router.put("/:id", productUploadMiddleware, updateProduct);

// DELETE product (Admin only)
router.delete("/:id", deleteProduct);

// POST add product review (Requires auth)
router.post("/:id/review", addReview);

module.exports = router;