const express = require("express");
const { getSettings, updateSettings } = require("../controllers/partialCodController");
const { protect, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Public - Get settings
router.get("/settings", getSettings);

// Admin only - Update settings
router.put("/settings", protect, adminAuth, updateSettings);

module.exports = router;