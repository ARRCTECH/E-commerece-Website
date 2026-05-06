const express = require("express");
const {
  createReturnRequest,
  getUserReturns,
  getReturnDetails,
  getAllReturns,
  updateReturnStatus,
} = require("../controllers/returnController");
const { protect, adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// User routes (require authentication)
router.post("/", protect, upload.array("images", 5), createReturnRequest);
router.get("/my-returns", protect, getUserReturns);
router.get("/:returnId", protect, getReturnDetails);

// Admin routes (require admin authentication)
router.get("/admin/all", protect, adminAuth, getAllReturns);
router.put("/admin/:returnId/status", protect, adminAuth, updateReturnStatus);

module.exports = router;
