const express = require("express");
const router = express.Router();
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
  getBulkProducts,        // 🆕 Add this import
  getRegularProducts,     // 🆕 Add this import
} = require("../controllers/productController");

// ===============================
// Product Routes
// ===============================

// GET all products with filters (regular + bulk both)
router.get("/", getProducts);

// 🆕 GET only bulk products
router.get("/bulk", getBulkProducts);

// 🆕 GET only regular products
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

// GET single product by ID
router.get("/:id", getProduct);

// GET single product by slug
router.get("/slug/:slug", getProductBySlug);

// POST create product (Admin only)
// TODO: add auth and admin middleware when integrating
router.post("/", createProduct);

// PUT update product (Admin only)
// TODO: add auth and admin middleware when integrating
router.put("/:id", updateProduct);

// DELETE product (Admin only)
// TODO: add auth and admin middleware when integrating
router.delete("/:id", deleteProduct);

// POST add product review (Requires auth)
// TODO: add auth middleware when integrating
router.post("/:id/review", addReview);

// GET products by category slug
router.get("/category/slug/:slug", getProductsByCategorySlug);

module.exports = router;