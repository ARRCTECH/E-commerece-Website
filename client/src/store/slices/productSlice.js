// src/store/slices/productSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import productAPI from "../api/ProductAPI"

// Async thunks
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

// create function to fetch product by slug
export const fetchProductBySlug = createAsyncThunk("products/fetchProductBySlug", async (slug, { rejectWithValue }) => {
  try {
    const response = await productAPI.getProductBySlug(slug)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch product by slug")
  }
})



const initialState = {
  products: [],
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
  },
}

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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
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
      // Fetch Trending Products
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
      // Fetch New Arrivals
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

      // Fetch Oversized Products
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



      // Fetch Product By ID
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

      // Fetch Product By Slug
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

export const { setFilters, clearFilters, clearCurrentProduct, clearError } = productSlice.actions
export default productSlice.reducer
