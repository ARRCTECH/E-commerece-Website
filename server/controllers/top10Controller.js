const express = require("express")
const router = express.Router()
const {
  getTop10Products,
  getTop10Product,
  createTop10Product,
  updateTop10Product,
  deleteTop10Product
} = require("../controllers/top10Controller")

// ===============================
// Top10 Routes
// ===============================

// GET all top10 products
router.get("/", getTop10Products)

// GET single top10 product by ID
router.get("/:id", getTop10Product)

// POST create top10 product (Admin only)
// TODO: add auth and admin middleware when integrating
router.post("/", createTop10Product)

// PUT update top10 product (Admin only)
// TODO: add auth and admin middleware when integrating
router.put("/:id", updateTop10Product)

// DELETE top10 product (Admin only)
// TODO: add auth and admin middleware when integrating
router.delete("/:id", deleteTop10Product)

module.exports = router