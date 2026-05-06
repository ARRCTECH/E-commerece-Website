const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect, adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

// ===============================
// Public category routes
// ===============================

// GET all categories (optionally showOnHomepage)
router.get("/", getCategories);

// GET single category by slug
router.get("/:slug", getCategoryBySlug);

// ===============================
// Admin-only category routes
// ===============================

// POST create category
router.post("/", protect, adminAuth, upload.single("image"), createCategory);

// PUT update category
router.put("/:id", protect, adminAuth, upload.single("image"), updateCategory);

// DELETE category
router.delete("/:id", protect, adminAuth, deleteCategory);

module.exports = router;
