const express = require("express");
const router = express.Router();
const popupSettingController = require("../controllers/popupSettingController");
const { protect, adminAuth } = require("../middleware/auth");

// Get popup setting (public)
router.get("/", popupSettingController.getPopupSetting);

// Update popup setting (admin only)
router.put("/", protect, adminAuth, popupSettingController.updatePopupSetting);

module.exports = router;
