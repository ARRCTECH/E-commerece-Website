const Review = require("../models/Review");
const Product = require("../models/Product");
const express = require("express");
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  reportReview,
  getUserReviews,
} = require("../controllers/reviewController");
const { protect,adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();


router.delete("/:reviewId",protect, adminAuth, deleteReview);
// Public routes
router.get("/product/:productId", getProductReviews);

// Protected routes
router.use(protect);

router.post("/", upload.array("images", 5), createReview);

router.get("/user", getUserReviews);
router.put("/:reviewId", upload.array("images", 5), updateReview);

router.post("/:reviewId/helpful", toggleHelpful);
router.post("/:reviewId/report", reportReview);

module.exports = router;