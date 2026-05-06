const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const { protect, optionalProtect } = require("../middleware/auth");

const router = express.Router();

// Use optionalProtect for cart routes to support both guest and authenticated users
router.get("/", optionalProtect, getCart);
router.post("/", optionalProtect, addToCart);
router.put("/:itemId", optionalProtect, updateCartItem);
router.delete("/:itemId", optionalProtect, removeFromCart);
router.delete("/", optionalProtect, clearCart);

module.exports = router;
