import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// Async thunk for searching products
export const searchProducts = createAsyncThunk(
  "search/searchProducts",
  async ({ query, filters = {} }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        search: query,
        page: filters.page || 1,
        limit: filters.limit || 12,
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products?${params}`);
      if (!response.ok) {
        throw new Error("Failed to search products");
      }
      const data = await response.json();
      return {
        products: data.products,
        totalProducts: data.totalProducts,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        query,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
// Async thunk for getting search suggestions
export const getSearchSuggestions = createAsyncThunk(
  "search/getSearchSuggestions",
  async (query, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products/suggestions?q=${query}`);
      if (!response.ok) {
        throw new Error("Failed to get suggestions");
      }
      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
const searchSlice = createSlice({
  name: "search",
  initialState: {
    query: "",
    results: [],
    suggestions: [],
    filters: {
      category: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 12,
    },
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
    loading: false,
    suggestionsLoading: false,
    error: null,
    recentSearches: JSON.parse(localStorage.getItem("recentSearches") || "[]"),
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearResults: (state) => {
      state.results = [];
      state.totalProducts = 0;
      state.totalPages = 0;
      state.currentPage = 1;
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
    addRecentSearch: (state, action) => {
      const query = action.payload;
      if (query && !state.recentSearches.includes(query)) {
        state.recentSearches = [query, ...state.recentSearches.slice(0, 4)];
        localStorage.setItem("recentSearches", JSON.stringify(state.recentSearches));
      }
    },
    removeRecentSearch: (state, action) => {
      state.recentSearches = state.recentSearches.filter((search) => search !== action.payload);
      localStorage.setItem("recentSearches", JSON.stringify(state.recentSearches));
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem("recentSearches");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.products;
        state.totalProducts = action.payload.totalProducts;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.query = action.payload.query;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Search suggestions
      .addCase(getSearchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
      })
      .addCase(getSearchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload;
      })
      .addCase(getSearchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.error = action.payload;
      });
  },
});
export const {
  setQuery,
  setFilters,
  clearResults,
  clearSuggestions,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  clearError,
} = searchSlice.actions;
export default searchSlice.reducer;