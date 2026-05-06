const User = require("../models/User")
const Product = require("../models/Product")

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId

    const user = await User.findById(userId).populate({
      path: "wishlist",
      select: "name slug price originalPrice images rating stock isActive category",
      populate: {
        path: "category",
        select: "name slug",
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Filter out inactive products
    const activeWishlistItems = user.wishlist.filter((product) => product && product.isActive)

    // Update user's wishlist if we removed inactive items
    if (activeWishlistItems.length !== user.wishlist.length) {
      user.wishlist = activeWishlistItems.map((product) => product._id)
      await user.save()
    }

    res.status(200).json({
      success: true,
      wishlist: activeWishlistItems,
      count: activeWishlistItems.length,
    })
  } catch (error) {
    console.error("Get wishlist error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
    })
  }
}

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId
    const { productId } = req.body

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      })
    }

    // Check if product exists and is active
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      })
    }

    // Add product to wishlist
    user.wishlist.push(productId)
    await user.save()

    res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
      wishlistCount: user.wishlist.length,
    })
  } catch (error) {
    console.error("Add to wishlist error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add product to wishlist",
    })
  }
}

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId
    const { productId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if product is in wishlist
    const productIndex = user.wishlist.indexOf(productId)
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      })
    }

    // Remove product from wishlist
    user.wishlist.splice(productIndex, 1)
    await user.save()

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
      wishlistCount: user.wishlist.length,
    })
  } catch (error) {
    console.error("Remove from wishlist error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist",
    })
  }
}

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.user.userId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    user.wishlist = []
    await user.save()

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
    })
  } catch (error) {
    console.error("Clear wishlist error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to clear wishlist",
    })
  }
}

// Move item from wishlist to cart
exports.moveToCart = async (req, res) => {
  try {
    const userId = req.user.userId
    const { productId } = req.params
    const { quantity = 1, size, color } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if product is in wishlist
    const productIndex = user.wishlist.indexOf(productId)
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      })
    }

    // Check if product exists and is active
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      })
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      })
    }

    // Check if same product with same size already exists in cart
    const existingCartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId && item.size === size && item.color === color,
    )

    if (existingCartItemIndex > -1) {
      // Update quantity of existing cart item
      const newQuantity = user.cart[existingCartItemIndex].quantity + quantity

      if (newQuantity > 10) {
        return res.status(400).json({
          success: false,
          message: "Maximum 10 items allowed per product",
        })
      }

      user.cart[existingCartItemIndex].quantity = newQuantity
    } else {
      // Add new item to cart
      user.cart.push({
        product: productId,
        quantity,
        size,
        color,
      })
    }

    // Remove from wishlist
    user.wishlist.splice(productIndex, 1)

    await user.save()

    res.status(200).json({
      success: true,
      message: "Product moved to cart successfully",
      wishlistCount: user.wishlist.length,
      cartCount: user.cart.reduce((total, item) => total + item.quantity, 0),
    })
  } catch (error) {
    console.error("Move to cart error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to move product to cart",
    })
  }
}
