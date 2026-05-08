import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import wishlistAPI from "../api/wishlistAPI";

// ===============================
// Async Thunks
// ===============================

export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async (_, { rejectWithValue, getState }) => {
  try {
    const isAuthenticated = getState().auth.isAuthenticated;
    
    if (!isAuthenticated) {
      const items = getFromLocalStorage();
      return {
        wishlist: items,
        count: items.length
      };
    }

    const response = await wishlistAPI.getWishlist();
    return response.data;
  } catch (error) {
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

    if (!isAuthenticated) {
      const currentItems = getFromLocalStorage();
      const productToAdd = typeof product === "string" 
        ? getState().wishlist.items.find(item => item._id === product)
        : product;

      if (!productToAdd) {
        return rejectWithValue("Product not found");
      }

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

    const productId = typeof product === "string" ? product : product._id;
    const response = await wishlistAPI.addToWishlist(productId);
    return {
      ...response.data,
      productId,
      product: typeof product === "object" ? product : null,
    };
  } catch (error) {
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

      const response = await wishlistAPI.removeFromWishlist(productId);
      return { ...response.data, productId };
    } catch (error) {
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
  }
);

export const clearWishlist = createAsyncThunk("wishlist/clearWishlist", async (_, { rejectWithValue }) => {
  try {
    const response = await wishlistAPI.clearWishlist();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to clear wishlist");
  }
});

// ===============================
// Local Storage Helpers
// ===============================

const saveToLocalStorage = (items) => {
  try {
    localStorage.setItem('guest_wishlist', JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save wishlist to localStorage:', err);
  }
};

const getFromLocalStorage = () => {
  try {
    const items = localStorage.getItem('guest_wishlist');
    return items ? JSON.parse(items) : [];
  } catch (err) {
    console.error('Failed to get wishlist from localStorage:', err);
    return [];
  }
};

// ===============================
// Initial State
// ===============================

const initialState = {
  items: getFromLocalStorage(),
  count: getFromLocalStorage().length,
  isLoading: false,
  error: null,
  lastUpdated: null,
  isAddingToWishlist: false,
  isRemovingFromWishlist: false,
};

// ===============================
// Slice
// ===============================

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
    optimisticAddToWishlist: (state, action) => {
      const product = action.payload;
      const existingIndex = state.items.findIndex((item) => item._id === product._id);
      if (existingIndex === -1) {
        state.items.push(product);
        state.count = state.items.length;
        state.lastUpdated = new Date().toISOString();
        saveToLocalStorage(state.items);
      }
    },
    optimisticRemoveFromWishlist: (state, action) => {
      const productId = action.payload;
      const existingIndex = state.items.findIndex((item) => item._id === productId);
      if (existingIndex > -1) {
        state.items.splice(existingIndex, 1);
        state.count = state.items.length;
        state.lastUpdated = new Date().toISOString();
        saveToLocalStorage(state.items);
      }
    },
    toggleWishlistItem: (state, action) => {
      const product = action.payload;
      const productId = typeof product === "string" ? product : product._id;
      const existingIndex = state.items.findIndex((item) => item._id === productId);
      if (existingIndex > -1) {
        state.items.splice(existingIndex, 1);
      } else {
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
        if (action.payload.wishlistCount !== undefined) {
          state.count = action.payload.wishlistCount;
        }
        if (action.payload.wishlist) {
          state.items = action.payload.wishlist;
          state.count = state.items.length;
        } else if (action.payload.product) {
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
        state.items = state.items.filter((item) => item._id !== action.payload.productId);
        state.count = action.payload.wishlistCount !== undefined ? action.payload.wishlistCount : state.items.length;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isRemovingFromWishlist = false;
        state.error = action.payload;
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
      });
  },
});

// ===============================
// Actions Export
// ===============================

export const {
  clearError,
  toggleWishlistItem,
  clearWishlistLocal,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist,
} = wishlistSlice.actions;

// ===============================
// Selectors
// ===============================

export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistCount = (state) => state.wishlist.count;
export const selectWishlistIsLoading = (state) => state.wishlist.isLoading;
export const selectWishlistError = (state) => state.wishlist.error;
export const selectIsAddingToWishlist = (state) => state.wishlist.isAddingToWishlist;
export const selectIsRemovingFromWishlist = (state) => state.wishlist.isRemovingFromWishlist;
export const selectIsInWishlist = (productId) => (state) => {
  return state.wishlist.items.some((item) => item._id === productId);
};

// ===============================
// Export Reducer
// ===============================

export default wishlistSlice.reducer;