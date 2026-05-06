import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import cartAPI from "../api/cartAPI"

// Async thunks
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { rejectWithValue }) => {
  try {
    const response = await cartAPI.getCart()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch cart")
  }
})

export const addToCart = createAsyncThunk("cart/addToCart", async (cartData, { rejectWithValue }) => {
  try {
    const response = await cartAPI.addToCart(cartData)
    return response.data // Assuming this returns { cart: { items, summary } }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to add item to cart")
  }
})

export const updateCartItem = createAsyncThunk("cart/updateCartItem", async ({ itemId, data }, { rejectWithValue }) => {
  try {
    const response = await cartAPI.updateCartItem(itemId, data)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to update cart item")
  }
})

export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (itemId, { rejectWithValue }) => {
  try {
    const response = await cartAPI.removeFromCart(itemId)
    return { ...response.data, itemId }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to remove item from cart")
  }
})

export const clearCart = createAsyncThunk("cart/clearCart", async (_, { rejectWithValue }) => {
  try {
    const response = await cartAPI.clearCart()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to clear cart")
  }
})

const initialState = {
  items: [],
  summary: {
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    total: 0,
  },
  totalQuantity: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
  isAddingToCart: false,
  isUpdatingCart: false,
}

// Helper function to calculate totals
const calculateTotals = (items) => {
  const totalItems = items.length
  const totalQuantity = items.reduce((total, item) => total + (item.quantity || 0), 0)
  const subtotal = items.reduce(
    (total, item) => total + (item.itemTotal || item.product?.price * item.quantity || 0),
    0,
  )
  const shipping = subtotal > 999 ? 0 : 99
  const total = subtotal + shipping

  return {
    totalItems,
    totalQuantity,
    subtotal,
    shipping,
    total,
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCartLocal: (state) => {
      state.items = []
      state.summary = initialState.summary
      state.totalQuantity = 0
    },
    updateLocalQuantity: (state, action) => {
      const { itemId, quantity } = action.payload
      const item = state.items.find((item) => item._id === itemId)
      if (item && quantity > 0) {
        item.quantity = quantity
        item.itemTotal = (item.product?.price || 0) * quantity

        const totals = calculateTotals(state.items)
        state.summary.totalItems = totals.totalItems
        state.summary.subtotal = totals.subtotal
        state.summary.shipping = totals.shipping
        state.summary.total = totals.total
        state.totalQuantity = totals.totalQuantity
      }
    },
    // Add missing optimistic actions
    optimisticAddToCart: (state, action) => {
      const { product, quantity = 1, size, color } = action.payload

      const existingItemIndex = state.items.findIndex(
        (item) => item.product._id === product._id && item.size === size && item.color === color,
      )

      if (existingItemIndex > -1) {
        state.items[existingItemIndex].quantity += quantity
        state.items[existingItemIndex].itemTotal =
          state.items[existingItemIndex].product.price * state.items[existingItemIndex].quantity
      } else {
        const newItem = {
          _id: `temp_${Date.now()}`,
          product,
          quantity,
          size,
          color,
          itemTotal: product.price * quantity,
        }
        state.items.push(newItem)
      }

      const totals = calculateTotals(state.items)
      state.summary = {
        totalItems: totals.totalItems,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
      }
      state.totalQuantity = totals.totalQuantity
    },
    // Add missing optimistic update quantity
    optimisticUpdateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload
      const item = state.items.find((item) => item._id === itemId)
      if (item && quantity > 0) {
        item.quantity = quantity
        item.itemTotal = (item.product?.price || 0) * quantity

        const totals = calculateTotals(state.items)
        state.summary = {
          totalItems: totals.totalItems,
          subtotal: totals.subtotal,
          shipping: totals.shipping,
          total: totals.total,
        }
        state.totalQuantity = totals.totalQuantity
      }
    },
    // Add missing optimistic remove from cart
    optimisticRemoveFromCart: (state, action) => {
      const itemId = action.payload
      state.items = state.items.filter((item) => item._id !== itemId)

      const totals = calculateTotals(state.items)
      state.summary = {
        totalItems: totals.totalItems,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
      }
      state.totalQuantity = totals.totalQuantity
    },
    // Keep existing localStorage functionality
    loadCartFromStorage: (state) => {
      const savedCart = localStorage.getItem("guestCart")
      if (savedCart) {
        const cart = JSON.parse(savedCart)
        state.items = cart.items || []
        state.summary = cart.summary || initialState.summary
        state.totalQuantity = cart.totalQuantity || 0
      }
    },
    saveCartToStorage: (state) => {
      localStorage.setItem(
        "guestCart",
        JSON.stringify({
          items: state.items,
          summary: state.summary,
          totalQuantity: state.totalQuantity,
        }),
      )
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload.cart?.items || []
        state.summary = action.payload.cart?.summary || initialState.summary

        // Calculate totalQuantity
        state.totalQuantity = state.items.reduce((total, item) => total + (item.quantity || 0), 0)
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isAddingToCart = true
        state.error = null
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isAddingToCart = false
        state.isLoading = false

        // Update the cart with returned data
        if (action.payload.cart) {
          state.items = action.payload.cart.items || []
          state.summary = action.payload.cart.summary || initialState.summary

          // Calculate totalQuantity for badge
          state.totalQuantity = state.items.reduce((total, item) => total + (item.quantity || 0), 0)
        }

        state.lastUpdated = new Date().toISOString()
        cartSlice.caseReducers.saveCartToStorage(state)
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isAddingToCart = false
        state.isLoading = false
        state.error = action.payload
      })

      // Update Cart Item
      .addCase(updateCartItem.pending, (state) => {
        state.isUpdatingCart = true
        state.error = null
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isUpdatingCart = false

        if (action.payload.cart) {
          // Update entire cart if server returns full cart
          state.items = action.payload.cart.items || []
          state.summary = action.payload.cart.summary || initialState.summary
          state.totalQuantity = state.items.reduce((total, item) => total + (item.quantity || 0), 0)
        } else if (action.payload.cartItem) {
          // Update specific item if server returns just the updated item
          const updatedItem = action.payload.cartItem
          const itemIndex = state.items.findIndex((item) => item._id === updatedItem._id)

          if (itemIndex > -1) {
            state.items[itemIndex] = { ...state.items[itemIndex], ...updatedItem }

            // Recalculate totals
            const totals = calculateTotals(state.items)
            state.summary = {
              totalItems: totals.totalItems,
              subtotal: totals.subtotal,
              shipping: totals.shipping,
              total: totals.total,
            }
            state.totalQuantity = totals.totalQuantity
          }
        }

        state.lastUpdated = new Date().toISOString()
        cartSlice.caseReducers.saveCartToStorage(state)
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isUpdatingCart = false
        state.error = action.payload
      })

      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.error = null
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        // Remove item and recalculate
        state.items = state.items.filter((item) => item._id !== action.payload.itemId)

        const totals = calculateTotals(state.items)
        state.summary = {
          totalItems: totals.totalItems,
          subtotal: totals.subtotal,
          shipping: totals.shipping,
          total: totals.total,
        }
        state.totalQuantity = totals.totalQuantity
        state.lastUpdated = new Date().toISOString()
        cartSlice.caseReducers.saveCartToStorage(state)
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload
      })

      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isLoading = false
        state.items = []
        state.summary = initialState.summary
        state.totalQuantity = 0
        state.lastUpdated = new Date().toISOString()
        cartSlice.caseReducers.saveCartToStorage(state)
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const {
  clearError,
  updateLocalQuantity,
  clearCartLocal,
  optimisticAddToCart,
  optimisticUpdateQuantity,
  optimisticRemoveFromCart,
  loadCartFromStorage,
  saveCartToStorage,
} = cartSlice.actions

export default cartSlice.reducer

// Selectors for easy access
export const selectCartItems = (state) => state.cart.items
export const selectCartSummary = (state) => state.cart.summary
export const selectCartTotalQuantity = (state) => state.cart.totalQuantity
export const selectCartIsLoading = (state) => state.cart.isLoading
export const selectCartError = (state) => state.cart.error
export const selectIsAddingToCart = (state) => state.cart.isAddingToCart
