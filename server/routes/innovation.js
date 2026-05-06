const express = require("express");
const {
  getAllInnovations,
  createInnovation,
  updateInnovation,
  deleteInnovation,
  getActiveInnovations,
} = require("../controllers/innovationController");
const { protect, digitalMarketerAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Public routes
router.get("/", getActiveInnovations);

// Admin only routes
router.get("/admin", protect, (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin privileges required.",
  });
}, getAllInnovations);

router.post("/", protect, (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin privileges required.",
  });
}, upload.single("image"), createInnovation);

router.put("/:id", protect, (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin privileges required.",
  });
}, upload.single("image"), updateInnovation);

router.delete("/:id", protect, (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin privileges required.",
  });
}, deleteInnovation);

module.exports = router;