import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import adminAPI from "../api/adminApi.js"
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

// ----------------- Public API -----------------
const publicAPI = {
  getAllInnovations: () => axios.get(`${API_URL}/innovations`), // no token
}

// ----------------- Thunks -----------------

// Public fetch
export const fetchPublicInnovations = createAsyncThunk(
  'innovations/fetchPublic',
  async (_, { rejectWithValue }) => {
    try {
      const response = await publicAPI.getAllInnovations()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch public innovations')
    }
  }
)

// Admin fetch
export const fetchAllInnovations = createAsyncThunk(
  'innovations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getAllInnovations()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin innovations')
    }
  }
)

// Create innovation
export const createInnovation = createAsyncThunk(
  'innovations/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await adminAPI.createInnovation(formData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create innovation')
    }
  }
)

// Update innovation
export const updateInnovation = createAsyncThunk(
  'innovations/update',
  async ({ innovationId, formData }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateInnovation(innovationId, formData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update innovation')
    }
  }
)

// Delete innovation
export const deleteInnovation = createAsyncThunk(
  'innovations/delete',
  async (innovationId, { rejectWithValue }) => {
    try {
      await adminAPI.deleteInnovation(innovationId)
      return innovationId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete innovation')
    }
  }
)

// ----------------- Slice -----------------
const innovationSlice = createSlice({
  name: 'innovations',
  initialState: {
    innovations: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Public fetch
      .addCase(fetchPublicInnovations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPublicInnovations.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        state.innovations = Array.isArray(payload.innovations)
          ? payload.innovations
          : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : []
      })
      .addCase(fetchPublicInnovations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Admin fetch
      .addCase(fetchAllInnovations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllInnovations.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        state.innovations = Array.isArray(payload.innovations)
          ? payload.innovations
          : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : []
      })
      .addCase(fetchAllInnovations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create
      .addCase(createInnovation.fulfilled, (state, action) => {
        const newInnovation = action.payload.innovation || action.payload
        state.innovations.unshift(newInnovation)
      })

      // Update
      .addCase(updateInnovation.fulfilled, (state, action) => {
        const updatedInnovation = action.payload.innovation || action.payload
        const index = state.innovations.findIndex(inv => inv._id === updatedInnovation._id)
        if (index !== -1) {
          state.innovations[index] = updatedInnovation
        }
      })

      // Delete
      .addCase(deleteInnovation.fulfilled, (state, action) => {
        state.innovations = state.innovations.filter(inv => inv._id !== action.payload)
      })
  },
})

export const { clearError } = innovationSlice.actions
export default innovationSlice.reducer
