const User = require("../models/User")
const Product = require("../models/Product")

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.userId
    // If no userId, return empty cart for guest
    if (!userId) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          summary: {
            totalItems: 0,
            subtotal: 0,
            shipping: 0,
            total: 0,
          },
        },
      });
    }

    const user = await User.findById(userId).populate({
      path: "cart.product",
      select: "name price slug originalPrice images stock sizes colors isActive category",
      populate: {
        path: "category",
        select: "name"
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Filter out inactive products and calculate totals
    const activeCartItems = user.cart.filter((item) => item.product && item.product.isActive)

    // Calculate cart summary
    let subtotal = 0
    let totalItems = 0

    const cartItems = activeCartItems.map((item) => {
      const itemTotal = item.product.price * item.quantity
      subtotal += itemTotal
      totalItems += item.quantity

      return {
        _id: item._id,
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          originalPrice: item.product.originalPrice,
          images: item.product.images,
          slug: item.product.slug,
          stock: item.product.stock,
          sizes: item.product.sizes,
          colors: item.product.colors,
          category: {
            _id: item.product.category?._id,
            name: item.product.category?.name,
          },
        },
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        addedAt: item.addedAt,
        itemTotal,
      }
    })



    // Update user's cart if we removed inactive items
    if (activeCartItems.length !== user.cart.length) {
      user.cart = activeCartItems
      await user.save()
    }

    res.status(200).json({
      success: true,
      cart: {
        items: cartItems,
        summary: {
          totalItems,
          subtotal,
          shipping: subtotal > 999 ? 0 : 99, // Free shipping above ₹999
          total: subtotal + (subtotal > 999 ? 0 : 99),
        },
      },
    })
  } catch (error) {
    console.error("Get cart error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    })
  }
}

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null
    const { productId, quantity = 1, size, color } = req.body

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      })
    }

    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 10",
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

    // Validate size if provided
    if (size && product.sizes.length > 0) {
      const availableSizes = product.sizes.map((s) => s.size)
      if (!availableSizes.includes(size)) {
        return res.status(400).json({
          success: false,
          message: "Selected size is not available",
        })
      }
    }

    // CASE 1: Logged-in user → save in DB
    if (userId) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Check if same product with same size/color already exists in cart
      const existingItemIndex = user.cart.findIndex(
        (item) =>
          item.product.toString() === productId &&
          item.size === size &&
          item.color === color,
      )

      if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = user.cart[existingItemIndex].quantity + quantity

        if (newQuantity > 10) {
          return res.status(400).json({
            success: false,
            message: "Maximum 10 items allowed per product",
          })
        }

        if (newQuantity > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} items available in stock`,
          })
        }

        user.cart[existingItemIndex].quantity = newQuantity
      } else {
        // Add new item
        user.cart.push({
          product: productId,
          quantity,
          size,
          color,
        })
      }

      await user.save()

      // Populate and return updated cart
      await user.populate({
        path: "cart.product",
        select: "name price originalPrice images stock sizes colors category",
      })

      const addedItem = user.cart.find(
        (item) =>
          item.product._id.toString() === productId &&
          item.size === size &&
          item.color === color,
      )

      return res.status(200).json({
        success: true,
        message: "Item added to cart successfully",
        cartItem: {
          _id: addedItem._id,
          product: addedItem.product,
          quantity: addedItem.quantity,
          size: addedItem.size,
          color: addedItem.color,
          addedAt: addedItem.addedAt,
        },
        cartCount: user.cart.reduce((total, item) => total + item.quantity, 0),
      })
    }

    // CASE 2: Guest user → don’t store in DB, just return item
    return res.status(200).json({
      success: true,
      message: "Item added to guest cart successfully",
      cartItem: {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images,
          stock: product.stock,
          sizes: product.sizes,
          colors: product.colors,
        },
        quantity,
        size,
        color,
        addedAt: new Date(),
      },
      cartCount: quantity, // frontend should manage total for guest
    })
  } catch (error) {
    console.error("Add to cart error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
    })
  }
}


// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user?.userId
    const { itemId } = req.params
    const { quantity, size, color } = req.body

    // For logged-in users
    if (userId) {
      if (quantity && (quantity < 1 || quantity > 10)) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be between 1 and 10",
        })
      }

      const user = await User.findById(userId).populate("cart.product")
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      const cartItemIndex = user.cart.findIndex(
        (item) => item._id.toString() === itemId
      )
      if (cartItemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
        })
      }

      const cartItem = user.cart[cartItemIndex]
      const product = cartItem.product

      // Stock check
      if (quantity && quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`,
        })
      }

      // Size validation
      if (size && product.sizes.length > 0) {
        const availableSizes = product.sizes.map((s) => s.size)
        if (!availableSizes.includes(size)) {
          return res.status(400).json({
            success: false,
            message: "Selected size is not available",
          })
        }
      }

      // Update values
      if (quantity !== undefined) cartItem.quantity = quantity
      if (size !== undefined) cartItem.size = size
      if (color !== undefined) cartItem.color = color

      await user.save()

      return res.status(200).json({
        success: true,
        message: "Cart item updated successfully",
        cartItem,
      })
    }

    // --------------------
    // Guest user handling
    // --------------------
    let cart = req.session.cart || []

    const cartItemIndex = cart.findIndex((item) => item._id === itemId)
    if (cartItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      })
    }

    const cartItem = cart[cartItemIndex]

    if (quantity !== undefined) cartItem.quantity = quantity
    if (size !== undefined) cartItem.size = size
    if (color !== undefined) cartItem.color = color

    cart[cartItemIndex] = cartItem
    req.session.cart = cart

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully (guest)",
      cartItem,
    })
  } catch (error) {
    console.error("Update cart item error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update cart item",
    })
  }
}

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.userId
    const { itemId } = req.params

    if (userId) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      const cartItemIndex = user.cart.findIndex(
        (item) => item._id.toString() === itemId
      )
      if (cartItemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
        })
      }

      user.cart.splice(cartItemIndex, 1)
      await user.save()

      return res.status(200).json({
        success: true,
        message: "Item removed from cart successfully",
        cartCount: user.cart.reduce((total, item) => total + item.quantity, 0),
      })
    }

    // Guest user
    // let cart = req.session.cart || []
    // const cartItemIndex = cart.findIndex((item) => item._id === itemId)
    // if (cartItemIndex === -1) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Cart item not found",
    //   })
    // }

    // cart.splice(cartItemIndex, 1)
    // req.session.cart = cart

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully (guest)",
      // cartCount: cart.reduce((total, item) => total + item.quantity, 0),
    })
  } catch (error) {
    console.error("Remove from cart error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
    })
  }
}

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user?.userId

    if (userId) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      user.cart = []
      await user.save()

      return res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
      })
    }

    // Guest user
    // req.session.cart = []

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully (guest)",
    })
  } catch (error) {
    console.error("Clear cart error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    })
  }
}
