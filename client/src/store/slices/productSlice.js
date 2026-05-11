// // src/store/slices/productSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import productAPI from "../api/ProductAPI"

// ===============================
// Existing Async Thunks
// ===============================

export const fetchProducts = createAsyncThunk("products/fetchProducts", async (params, { rejectWithValue }) => {
  try {
    const response = await productAPI.getProducts(params)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch products")
  }
})

export const fetchTrendingProducts = createAsyncThunk(
  "products/fetchTrendingProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await productAPI.getTrendingProducts()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch trending products")
    }
  },
)

export const fetchNewArrivals = createAsyncThunk("products/fetchNewArrivals", async (_, { rejectWithValue }) => {
  try {
    const response = await productAPI.getNewArrivals()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch new arrivals")
  }
})

export const fetchOversizedProducts = createAsyncThunk("products/fetchOversizedProducts", async (_, { rejectWithValue }) => {
  try {
    const response = await productAPI.getOversizedProducts()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch oversized products")
  }
})

export const fetchProductById = createAsyncThunk("products/fetchProductById", async (id, { rejectWithValue }) => {
  try {
    const response = await productAPI.getProductById(id)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch product")
  }
})

export const fetchProductBySlug = createAsyncThunk("products/fetchProductBySlug", async (slug, { rejectWithValue }) => {
  try {
    const response = await productAPI.getProductBySlug(slug)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch product by slug")
  }
})

// ===============================
// 🆕 Bulk Product Async Thunks
// ===============================

// Get only bulk products
export const fetchBulkProducts = createAsyncThunk("products/fetchBulkProducts", async (params, { rejectWithValue }) => {
  try {
    const response = await productAPI.getBulkProducts(params)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch bulk products")
  }
})

// Get only regular products
export const fetchRegularProducts = createAsyncThunk("products/fetchRegularProducts", async (params, { rejectWithValue }) => {
  try {
    const response = await productAPI.getRegularProducts(params)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch regular products")
  }
})

// Get products with type filter
export const fetchProductsByType = createAsyncThunk("products/fetchProductsByType", async ({ type, params }, { rejectWithValue }) => {
  try {
    const response = await productAPI.getProductsByType(type, params)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || `Failed to fetch ${type} products`)
  }
})

// Get bulk products by category
export const fetchBulkProductsByCategory = createAsyncThunk("products/fetchBulkProductsByCategory", async ({ categoryId, params }, { rejectWithValue }) => {
  try {
    const response = await productAPI.getBulkProductsByCategory(categoryId, params)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch bulk products by category")
  }
})

// ===============================
// Initial State
// ===============================

const initialState = {
  // All products (regular + bulk)
  products: [],
  bulkProducts: [],      // 🆕 Only bulk products
  regularProducts: [],   // 🆕 Only regular products
  trendingProducts: [],
  newArrivals: [],
  oversizedProducts: [],
  currentProduct: null,
  pagination: {
    total: 0,
    totalPages: 0,
    currentPage: 1,
  },
  isLoadingProducts: false,
  isLoadingBulk: false,       // 🆕
  isLoadingRegular: false,    // 🆕
  isLoadingTrending: false,
  isLoadingNewArrivals: false,
  isLoadingProductById: false,
  isLoadingProductBySlug: false,
  error: null,
  filters: {
    category: "",
    priceRange: [0, 10000],
    sizes: [],
    colors: [],
    rating: 0,
    sortBy: "newest",
    search: "",
    type: "all",  // 🆕 'all', 'bulk', 'regular'
  },
}

// ===============================
// Slice
// ===============================

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null
    },
    clearError: (state) => {
      state.error = null
    },
    // 🆕 Set product type filter
    setProductType: (state, action) => {
      state.filters.type = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== Fetch Products (Regular + Bulk) ==========
      .addCase(fetchProducts.pending, (state) => {
        state.isLoadingProducts = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoadingProducts = false
        state.products = action.payload.products || []
        state.pagination = action.payload.pagination || {
          total: 0,
          totalPages: 0,
          currentPage: 1,
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoadingProducts = false
        state.error = action.payload
      })

      // ========== 🆕 Fetch Bulk Products ==========
      .addCase(fetchBulkProducts.pending, (state) => {
        state.isLoadingBulk = true
        state.error = null
      })
      .addCase(fetchBulkProducts.fulfilled, (state, action) => {
        state.isLoadingBulk = false
        state.bulkProducts = action.payload.products || []
        state.pagination = action.payload.pagination || {
          total: 0,
          totalPages: 0,
          currentPage: 1,
        }
      })
      .addCase(fetchBulkProducts.rejected, (state, action) => {
        state.isLoadingBulk = false
        state.error = action.payload
      })

      // ========== 🆕 Fetch Regular Products ==========
      .addCase(fetchRegularProducts.pending, (state) => {
        state.isLoadingRegular = true
        state.error = null
      })
      .addCase(fetchRegularProducts.fulfilled, (state, action) => {
        state.isLoadingRegular = false
        state.regularProducts = action.payload.products || []
        state.pagination = action.payload.pagination || {
          total: 0,
          totalPages: 0,
          currentPage: 1,
        }
      })
      .addCase(fetchRegularProducts.rejected, (state, action) => {
        state.isLoadingRegular = false
        state.error = action.payload
      })

      // ========== 🆕 Fetch Products By Type ==========
      .addCase(fetchProductsByType.pending, (state) => {
        if (state.filters.type === 'bulk') {
          state.isLoadingBulk = true
        } else if (state.filters.type === 'regular') {
          state.isLoadingRegular = true
        } else {
          state.isLoadingProducts = true
        }
        state.error = null
      })
      .addCase(fetchProductsByType.fulfilled, (state, action) => {
        state.isLoadingProducts = false
        state.isLoadingBulk = false
        state.isLoadingRegular = false
        
        if (state.filters.type === 'bulk') {
          state.bulkProducts = action.payload.products || []
        } else if (state.filters.type === 'regular') {
          state.regularProducts = action.payload.products || []
        } else {
          state.products = action.payload.products || []
        }
        
        state.pagination = action.payload.pagination || {
          total: 0,
          totalPages: 0,
          currentPage: 1,
        }
      })
      .addCase(fetchProductsByType.rejected, (state, action) => {
        state.isLoadingProducts = false
        state.isLoadingBulk = false
        state.isLoadingRegular = false
        state.error = action.payload
      })

      // ========== Fetch Trending Products ==========
      .addCase(fetchTrendingProducts.pending, (state) => {
        state.isLoadingTrending = true
        state.error = null
      })
      .addCase(fetchTrendingProducts.fulfilled, (state, action) => {
        state.isLoadingTrending = false
        state.trendingProducts = action.payload.products || []
      })
      .addCase(fetchTrendingProducts.rejected, (state, action) => {
        state.isLoadingTrending = false
        state.error = action.payload
      })

      // ========== Fetch New Arrivals ==========
      .addCase(fetchNewArrivals.pending, (state) => {
        state.isLoadingNewArrivals = true
        state.error = null
      })
      .addCase(fetchNewArrivals.fulfilled, (state, action) => {
        state.isLoadingNewArrivals = false
        state.newArrivals = action.payload.products || []
      })
      .addCase(fetchNewArrivals.rejected, (state, action) => {
        state.isLoadingNewArrivals = false
        state.error = action.payload
      })

      // ========== Fetch Oversized Products ==========
      .addCase(fetchOversizedProducts.pending, (state) => {
        state.isLoadingOversized = true
        state.error = null
      })
      .addCase(fetchOversizedProducts.fulfilled, (state, action) => {
        state.isLoadingOversized = false
        state.oversizedProducts = action.payload.products || []
      })
      .addCase(fetchOversizedProducts.rejected, (state, action) => {
        state.isLoadingOversized = false
        state.error = action.payload
      })

      // ========== Fetch Product By ID ==========
      .addCase(fetchProductById.pending, (state) => {
        state.isLoadingProductById = true
        state.error = null
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoadingProductById = false
        state.currentProduct = action.payload.product || null
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoadingProductById = false
        state.error = action.payload
      })

      // ========== Fetch Product By Slug ==========
      .addCase(fetchProductBySlug.pending, (state) => {
        state.isLoadingProductBySlug = true
        state.error = null
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.isLoadingProductBySlug = false
        state.currentProduct = action.payload.product || null
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.isLoadingProductBySlug = false
        state.error = action.payload
      })
  },
})

// ===============================
// Actions Export
// ===============================
export const { 
  setFilters, 
  clearFilters, 
  clearCurrentProduct, 
  clearError,
  setProductType,  // 🆕
} = productSlice.actions

// ===============================
// Selectors
// ===============================
export const selectProducts = (state) => state.products
export const selectAllProducts = (state) => state.products.products
export const selectBulkProducts = (state) => state.products.bulkProducts
export const selectRegularProducts = (state) => state.products.regularProducts
export const selectCurrentProduct = (state) => state.products.currentProduct
export const selectProductsLoading = (state) => state.products.isLoadingProducts
export const selectBulkProductsLoading = (state) => state.products.isLoadingBulk
export const selectProductsError = (state) => state.products.error
export const selectProductsPagination = (state) => state.products.pagination
export const selectFilters = (state) => state.products.filters
export const selectProductTypeFilter = (state) => state.products.filters.type

export default productSlice.reducer