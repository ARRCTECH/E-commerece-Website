import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import wishlistAPI from "../api/wishlistAPI";
// Async thunks
export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async (_, { rejectWithValue, getState }) => {
  try {
    const isAuthenticated = getState().auth.isAuthenticated;
    
    // For guest users, return localStorage items
    if (!isAuthenticated) {
      const items = getFromLocalStorage();
      return {
        wishlist: items,
        count: items.length
      };
    }

    // For authenticated users, fetch from server
    const response = await wishlistAPI.getWishlist();
    return response.data;
  } catch (error) {
    // If auth error, return localStorage items
    if (error.response?.status === 401) {
      const items = getFromLocalStorage();
      return {
        wishlist: items,
        count: items.length
      };
    }
    return rejectWithValue(error.response?.data?.message || "Failed to fetch wishlist");
  }
});
export const addToWishlist = createAsyncThunk("wishlist/addToWishlist", async (product, { rejectWithValue, getState }) => {
  try {
    const isAuthenticated = getState().auth.isAuthenticated;

    // For guest users, handle locally
    if (!isAuthenticated) {
      const currentItems = getFromLocalStorage();
      const productToAdd = typeof product === "string" 
        ? getState().wishlist.items.find(item => item._id === product)
        : product;

      if (!productToAdd) {
        return rejectWithValue("Product not found");
      }

      // Check if already exists
      const existingIndex = currentItems.findIndex(item => item._id === productToAdd._id);
      if (existingIndex === -1) {
        const updatedItems = [...currentItems, productToAdd];
        saveToLocalStorage(updatedItems);
        return {
          wishlist: updatedItems,
          count: updatedItems.length,
          productId: productToAdd._id,
          product: productToAdd
        };
      }
      return {
        wishlist: currentItems,
        count: currentItems.length,
        productId: productToAdd._id,
        product: productToAdd
      };
    }

    // For authenticated users
    const productId = typeof product === "string" ? product : product._id;
    const response = await wishlistAPI.addToWishlist(productId);
    return {
      ...response.data,
      productId,
      product: typeof product === "object" ? product : null,
    };
  } catch (error) {
    // If auth error for guest, handle locally
    if (error.response?.status === 401 && !getState().auth.isAuthenticated) {
      const items = getFromLocalStorage();
      return {
        wishlist: items,
        count: items.length,
        product: product
      };
    }
    return rejectWithValue(error.response?.data?.message || "Failed to add to wishlist");
  }
});
export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId, { rejectWithValue, getState }) => {
    try {
      const isAuthenticated = getState().auth.isAuthenticated;

      // For guest users, handle locally
      if (!isAuthenticated) {
        const currentItems = getFromLocalStorage();
        const updatedItems = currentItems.filter(item => item._id !== productId);
        saveToLocalStorage(updatedItems);
        return {
          wishlist: updatedItems,
          count: updatedItems.length,
          productId
        };
      }

      // For authenticated users
      const response = await wishlistAPI.removeFromWishlist(productId);
      return { ...response.data, productId };
    } catch (error) {
      // If auth error for guest, handle locally
      if (error.response?.status === 401 && !getState().auth.isAuthenticated) {
        const currentItems = getFromLocalStorage();
        const updatedItems = currentItems.filter(item => item._id !== productId);
        saveToLocalStorage(updatedItems);
        return {
          wishlist: updatedItems,
          count: updatedItems.length,
          productId
        };
      }
      return rejectWithValue(error.response?.data?.message || "Failed to remove from wishlist");
    }
  },
);
export const clearWishlist = createAsyncThunk("wishlist/clearWishlist", async (_, { rejectWithValue }) => {
  try {
    const response = await wishlistAPI.clearWishlist();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to clear wishlist");
  }
});
export const moveToCart = createAsyncThunk("wishlist/moveToCart", async ({ productId, data }, { rejectWithValue }) => {
  try {
    const response = await wishlistAPI.moveToCart(productId, data);
    return { ...response.data, productId };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to move to cart");
  }
});
// Helper function to save wishlist to localStorage
const saveToLocalStorage = (items) => {
  try {
    localStorage.setItem('guest_wishlist', JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save wishlist to localStorage:', err);
  }
};

// Helper function to get wishlist from localStorage
const getFromLocalStorage = () => {
  try {
    const items = localStorage.getItem('guest_wishlist');
    return items ? JSON.parse(items) : [];
  } catch (err) {
    console.error('Failed to get wishlist from localStorage:', err);
    return [];
  }
};

const initialState = {
  items: getFromLocalStorage(),
  count: getFromLocalStorage().length,
  isLoading: false,
  error: null,
  lastUpdated: null,
  isAddingToWishlist: false,
  isRemovingFromWishlist: false,
};
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearWishlistLocal: (state) => {
      state.items = [];
      state.count = 0;
    },
    // ✅ Optimistic add to wishlist
    optimisticAddToWishlist: (state, action) => {
      const product = action.payload;
      const existingIndex = state.items.findIndex((item) => item._id === product._id);
      if (existingIndex === -1) {
        // Add product to wishlist immediately
        state.items.push(product);
        state.count = state.items.length;
        state.lastUpdated = new Date().toISOString();
        // Save to localStorage
        saveToLocalStorage(state.items);
      }
    },
    // ✅ Optimistic remove from wishlist
    optimisticRemoveFromWishlist: (state, action) => {
      const productId = action.payload;
      const existingIndex = state.items.findIndex((item) => item._id === productId);
      if (existingIndex > -1) {
        state.items.splice(existingIndex, 1);
        state.count = state.items.length;
        state.lastUpdated = new Date().toISOString();
        // Save to localStorage
        saveToLocalStorage(state.items);
      }
    },
    // ✅ Toggle wishlist item (for immediate UI feedback)
    toggleWishlistItem: (state, action) => {
      const product = action.payload;
      const productId = typeof product === "string" ? product : product._id;
      const existingIndex = state.items.findIndex((item) => item._id === productId);
      if (existingIndex > -1) {
        // Remove from wishlist
        state.items.splice(existingIndex, 1);
      } else {
        // Add to wishlist (only if we have product data)
        if (typeof product === "object") {
          state.items.push(product);
        }
      }
      state.count = state.items.length;
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.wishlist || [];
        state.count = action.payload.count || state.items.length;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to Wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.isAddingToWishlist = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isAddingToWishlist = false;
        // ✅ Update count from server response
        if (action.payload.wishlistCount !== undefined) {
          state.count = action.payload.wishlistCount;
        }
        // ✅ If server returns updated wishlist, use it
        if (action.payload.wishlist) {
          state.items = action.payload.wishlist;
          state.count = state.items.length;
        } else if (action.payload.product) {
          // ✅ If we have product data, ensure it's in the items array
          const existingIndex = state.items.findIndex((item) => item._id === action.payload.productId);
          if (existingIndex === -1) {
            state.items.push(action.payload.product);
            state.count = state.items.length;
          }
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isAddingToWishlist = false;
        state.error = action.payload;
        // ✅ Revert optimistic update on error
        const productId = action.meta.arg._id || action.meta.arg;
        const existingIndex = state.items.findIndex((item) => item._id === productId);
        if (existingIndex > -1) {
          state.items.splice(existingIndex, 1);
          state.count = state.items.length;
        }
      })
      // Remove from Wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.isRemovingFromWishlist = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isRemovingFromWishlist = false;
        // ✅ Remove item from array
        state.items = state.items.filter((item) => item._id !== action.payload.productId);
        // ✅ Update count from server or calculate from items
        state.count = action.payload.wishlistCount !== undefined ? action.payload.wishlistCount : state.items.length;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isRemovingFromWishlist = false;
        state.error = action.payload;
        // ✅ Revert optimistic update on error - re-add the item
        // Note: This would require storing the removed item temporarily
        // For now, we'll just refetch the wishlist on error
      })
      // Clear Wishlist
      .addCase(clearWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.count = 0;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Move to Cart
      .addCase(moveToCart.pending, (state) => {
        state.error = null;
      })
      .addCase(moveToCart.fulfilled, (state, action) => {
        // ✅ Remove item from wishlist after moving to cart
        state.items = state.items.filter((item) => item._id !== action.payload.productId);
        state.count = action.payload.wishlistCount !== undefined ? action.payload.wishlistCount : state.items.length;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(moveToCart.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});
export const {
  clearError,
  toggleWishlistItem,
  clearWishlistLocal,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist,
} = wishlistSlice.actions;
export default wishlistSlice.reducer;
// ✅ Selectors for better performance
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistCount = (state) => state.wishlist.count;
export const selectWishlistIsLoading = (state) => state.wishlist.isLoading;
export const selectWishlistError = (state) => state.wishlist.error;
export const selectIsAddingToWishlist = (state) => state.wishlist.isAddingToWishlist;
export const selectIsRemovingFromWishlist = (state) => state.wishlist.isRemovingFromWishlist;
// ✅ Helper selector to check if product is in wishlist
export const selectIsInWishlist = (productId) => (state) => {
  return state.wishlist.items.some((item) => item._id === productId);
};