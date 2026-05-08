const User = require("../models/User")
const Product = require("../models/Product")

// Get user's cart - Updated for Bulk Products
exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.userId
    
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
      select: "name price slug originalPrice images stock sizes colors isActive category isBulkProduct bulkConfig",
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

    const activeCartItems = user.cart.filter((item) => item.product && item.product.isActive)

    let subtotal = 0
    let totalItems = 0

    const cartItems = activeCartItems.map((item) => {
      let itemTotal = 0
      let displayPrice = 0
      let quantity = 0
      
      if (item.isBulkProduct) {
        const pricePerSet = item.pricePerSet || item.product.bulkConfig?.pricePerSet || item.product.price
        const totalSets = item.totalSets || item.quantity || 1
        itemTotal = pricePerSet * totalSets
        displayPrice = pricePerSet
        quantity = totalSets
      } else {
        itemTotal = item.product.price * item.quantity
        displayPrice = item.product.price
        quantity = item.quantity
      }
      
      subtotal += itemTotal
      totalItems += quantity

      return {
        _id: item._id,
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          displayPrice: displayPrice,
          originalPrice: item.product.originalPrice,
          images: item.product.images,
          slug: item.product.slug,
          stock: item.product.stock,
          sizes: item.product.sizes,
          colors: item.product.colors,
          isBulkProduct: item.isBulkProduct || item.product.isBulkProduct,
          bulkConfig: item.product.bulkConfig,
          category: {
            _id: item.product.category?._id,
            name: item.product.category?.name,
          },
        },
        quantity: quantity,
        size: item.size,
        color: item.color,
        isBulkProduct: item.isBulkProduct || false,
        selectedColors: item.selectedColors || [],
        totalSets: item.totalSets || quantity,
        totalPieces: item.totalPieces || 0,
        piecesPerSet: item.piecesPerSet || 0,
        pricePerSet: item.pricePerSet || item.product.bulkConfig?.pricePerSet,
        addedAt: item.addedAt,
        itemTotal,
      }
    })

    if (activeCartItems.length !== user.cart.length) {
      user.cart = activeCartItems
      await user.save()
    }

    const shipping = subtotal > 999 ? 0 : 99
    const total = subtotal + shipping

    res.status(200).json({
      success: true,
      cart: {
        items: cartItems,
        summary: {
          totalItems,
          subtotal,
          shipping,
          total,
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

exports.addToCart = async (req, res) => {
  try {
    console.log("========== ADD TO CART STARTED ==========");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const userId = req.user ? req.user.userId : null
    console.log("User ID:", userId);
    
    const { 
      productId, 
      quantity = 1, 
      size, 
      color,
      isBulkProduct,
      selectedColors = [],
      totalPieces = 0,
      totalSets = 1,
      piecesPerSet = 0,
      pricePerSet = 0
    } = req.body

    console.log("Parsed values:",
      "\n- productId:", productId,
      "\n- quantity:", quantity,
      "\n- size:", size,
      "\n- color:", color,
      "\n- isBulkProduct:", isBulkProduct,
      "\n- selectedColors:", selectedColors,
      "\n- totalPieces:", totalPieces,
      "\n- totalSets:", totalSets,
      "\n- piecesPerSet:", piecesPerSet,
      "\n- pricePerSet:", pricePerSet
    );

    if (!productId) {
      console.log("❌ ERROR: Product ID missing");
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      })
    }

    console.log("🔍 Fetching product from database...");
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      console.log("❌ ERROR: Product not found or inactive", productId);
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      })
    }
    console.log("✅ Product found:", product.name);
    console.log("Product isBulkProduct:", product.isBulkProduct);
    console.log("Product bulkConfig:", product.bulkConfig);

    const isBulk = isBulkProduct === true || product.isBulkProduct === true
    console.log("📦 Is Bulk Product:", isBulk);

    // Bulk Product Validation
    if (isBulk) {
      console.log("🔍 Validating bulk product...");
      const minColors = product.bulkConfig?.minColorsToSelect || 1
      console.log("Min colors required:", minColors);
      console.log("Selected colors count:", selectedColors.length);
      
      if (selectedColors.length < minColors) {
        console.log("❌ ERROR: Not enough colors selected");
        return res.status(400).json({
          success: false,
          message: `Please select at least ${minColors} color(s)`,
        })
      }
      
      const maxColors = product.bulkConfig?.maxColorsToSelect
      if (maxColors && selectedColors.length > maxColors) {
        console.log("❌ ERROR: Too many colors selected");
        return res.status(400).json({
          success: false,
          message: `Maximum ${maxColors} colors can be selected`,
        })
      }
      console.log("✅ Bulk validation passed");
    }

    // Regular Product Validation
    if (!isBulk) {
      console.log("🔍 Validating regular product...");
      if (quantity < 1 || quantity > 10) {
        console.log("❌ ERROR: Invalid quantity", quantity);
        return res.status(400).json({
          success: false,
          message: "Quantity must be between 1 and 10",
        })
      }
      
      if (product.stock < quantity) {
        console.log("❌ ERROR: Insufficient stock. Stock:", product.stock, "Requested:", quantity);
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`,
        })
      }
      
      if (size && product.sizes?.length > 0) {
        const availableSizes = product.sizes.map((s) => s.size)
        if (!availableSizes.includes(size)) {
          console.log("❌ ERROR: Size not available. Size:", size, "Available:", availableSizes);
          return res.status(400).json({
            success: false,
            message: "Selected size is not available",
          })
        }
      }
      console.log("✅ Regular validation passed");
    }

    // LOGGED-IN USER
    if (userId) {
      console.log("👤 Logged-in user flow");
      const user = await User.findById(userId)
      if (!user) {
        console.log("❌ ERROR: User not found");
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }
      console.log("✅ User found:", user.email);
      console.log("Current cart items count:", user.cart.length);

      let existingItemIndex = -1
      
      if (isBulk) {
        console.log("🔍 Searching for existing bulk item with same colors...");
        existingItemIndex = user.cart.findIndex(
          (item) =>
            item.product.toString() === productId &&
            item.isBulkProduct === true &&
            JSON.stringify(item.selectedColors?.sort()) === JSON.stringify([...selectedColors].sort())
        )
        console.log("Existing item index:", existingItemIndex);
      } else {
        console.log("🔍 Searching for existing regular item...");
        existingItemIndex = user.cart.findIndex(
          (item) =>
            item.product.toString() === productId &&
            item.size === size &&
            item.color === color &&
            item.isBulkProduct !== true
        )
        console.log("Existing item index:", existingItemIndex);
      }

      if (existingItemIndex > -1) {
        console.log("📝 Updating existing cart item");
        if (isBulk) {
          const newTotalSets = (user.cart[existingItemIndex].totalSets || 1) + (totalSets || 1)
          console.log("Current totalSets:", user.cart[existingItemIndex].totalSets);
          console.log("New totalSets:", newTotalSets);
          
          if (newTotalSets > 10) {
            console.log("❌ ERROR: Maximum 10 sets exceeded");
            return res.status(400).json({
              success: false,
              message: "Maximum 10 sets allowed in cart",
            })
          }
          
          user.cart[existingItemIndex].totalSets = newTotalSets
          user.cart[existingItemIndex].totalPieces = (piecesPerSet || 0) * newTotalSets
          user.cart[existingItemIndex].quantity = newTotalSets
          console.log("✅ Bulk cart item updated");
        } else {
          const newQuantity = user.cart[existingItemIndex].quantity + quantity
          console.log("Current quantity:", user.cart[existingItemIndex].quantity);
          console.log("New quantity:", newQuantity);
          
          if (newQuantity > 10) {
            console.log("❌ ERROR: Maximum 10 items exceeded");
            return res.status(400).json({
              success: false,
              message: "Maximum 10 items allowed per product",
            })
          }
          if (newQuantity > product.stock) {
            console.log("❌ ERROR: Insufficient stock");
            return res.status(400).json({
              success: false,
              message: `Only ${product.stock} items available in stock`,
            })
          }
          user.cart[existingItemIndex].quantity = newQuantity
          console.log("✅ Regular cart item updated");
        }
      } else {
        console.log("📝 Adding new item to cart");
        if (isBulk) {
          const newCartItem = {
            product: productId,
            isBulkProduct: true,
            selectedColors: selectedColors,
            totalPieces: totalPieces,
            totalSets: totalSets || 1,
            piecesPerSet: piecesPerSet,
            pricePerSet: pricePerSet || product.bulkConfig?.pricePerSet,
            quantity: totalSets || 1,
          }
          user.cart.push(newCartItem)
          console.log("✅ New bulk item added:", JSON.stringify(newCartItem, null, 2));
        } else {
          const newCartItem = {
            product: productId,
            quantity,
            size,
            color,
            isBulkProduct: false,
          }
          user.cart.push(newCartItem)
          console.log("✅ New regular item added:", JSON.stringify(newCartItem, null, 2));
        }
      }

      await user.save()
      console.log("💾 Cart saved to database");
      
      const cartCount = user.cart.reduce((total, item) => total + item.quantity, 0)
      console.log("📊 New cart count:", cartCount);

      console.log("========== ADD TO CART SUCCESS ==========");
      return res.status(200).json({
        success: true,
        message: "Item added to cart successfully",
        cartCount,
      })
    }

    // GUEST USER
    console.log("👤 Guest user flow");
    console.log("========== ADD TO CART SUCCESS (GUEST) ==========");
    return res.status(200).json({
      success: true,
      message: "Item added to guest cart successfully",
      cartItem: isBulk ? {
        product: {
          _id: product._id,
          name: product.name,
          price: product.bulkConfig?.pricePerSet,
          images: product.images,
        },
        isBulkProduct: true,
        selectedColors: selectedColors,
        totalSets: totalSets || 1,
        totalPieces: totalPieces,
        piecesPerSet: piecesPerSet,
        pricePerSet: product.bulkConfig?.pricePerSet,
        quantity: totalSets || 1,
      } : {
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
        isBulkProduct: false,
      },
      cartCount: isBulk ? (totalSets || 1) : quantity,
    })
    
  } catch (error) {
    console.error("❌ ADD TO CART ERROR ❌");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("========== ADD TO CART FAILED ==========");
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

// Update cart item - Updated for Bulk Products
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user?.userId
    const { itemId } = req.params
    const { quantity, size, color, totalSets } = req.body

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to update cart",
      })
    }

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

    if (cartItem.isBulkProduct) {
      const newTotalSets = totalSets !== undefined ? totalSets : (cartItem.totalSets || 1)
      
      if (newTotalSets < 1 || newTotalSets > 10) {
        return res.status(400).json({
          success: false,
          message: "Sets must be between 1 and 10",
        })
      }
      
      cartItem.totalSets = newTotalSets
      cartItem.totalPieces = (cartItem.piecesPerSet || 0) * newTotalSets
      cartItem.quantity = newTotalSets
    } else {
      if (quantity !== undefined) {
        if (quantity > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} items available in stock`,
          })
        }
        cartItem.quantity = quantity
      }
      
      if (size !== undefined) {
        const availableSizes = product.sizes.map((s) => s.size)
        if (!availableSizes.includes(size)) {
          return res.status(400).json({
            success: false,
            message: "Selected size is not available",
          })
        }
        cartItem.size = size
      }
      
      if (color !== undefined) cartItem.color = color
    }

    await user.save()

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
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

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully (guest)",
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