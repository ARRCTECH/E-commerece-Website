const express = require("express");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
} = require("../controllers/wishlistController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:productId", removeFromWishlist);
router.delete("/", clearWishlist);
router.post("/:productId/move-to-cart", moveToCart);

module.exports = router;
