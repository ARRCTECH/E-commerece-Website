import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import innovationAPI from '../api/innovationAPI';

// ----------------- Thunks -----------------

// Public fetch (active innovations only)
export const fetchPublicInnovations = createAsyncThunk(
  'innovations/fetchPublic',
  async (_, { rejectWithValue }) => {
    try {
      const response = await innovationAPI.getActiveInnovations();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch public innovations');
    }
  }
);

// Admin fetch (all innovations)
export const fetchAllInnovations = createAsyncThunk(
  'innovations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await innovationAPI.getAllInnovations();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin innovations');
    }
  }
);

// Create innovation
export const createInnovation = createAsyncThunk(
  'innovations/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await innovationAPI.createInnovation(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create innovation');
    }
  }
);

// Update innovation
export const updateInnovation = createAsyncThunk(
  'innovations/update',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await innovationAPI.updateInnovation(id, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update innovation');
    }
  }
);

// Delete innovation
export const deleteInnovation = createAsyncThunk(
  'innovations/delete',
  async (id, { rejectWithValue }) => {
    try {
      await innovationAPI.deleteInnovation(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete innovation');
    }
  }
);

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
      state.error = null;
    },
    clearInnovations: (state) => {
      state.innovations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Public fetch
      .addCase(fetchPublicInnovations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicInnovations.fulfilled, (state, action) => {
        state.loading = false;
        state.innovations = action.payload?.innovations || [];
      })
      .addCase(fetchPublicInnovations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin fetch
      .addCase(fetchAllInnovations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllInnovations.fulfilled, (state, action) => {
        state.loading = false;
        state.innovations = action.payload?.innovations || [];
      })
      .addCase(fetchAllInnovations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createInnovation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInnovation.fulfilled, (state, action) => {
        state.loading = false;
        const newInnovation = action.payload?.innovation;
        if (newInnovation) {
          state.innovations.unshift(newInnovation);
        }
      })
      .addCase(createInnovation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateInnovation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInnovation.fulfilled, (state, action) => {
        state.loading = false;
        const updatedInnovation = action.payload?.innovation;
        if (updatedInnovation) {
          const index = state.innovations.findIndex((inv) => inv._id === updatedInnovation._id);
          if (index !== -1) {
            state.innovations[index] = updatedInnovation;
          }
        }
      })
      .addCase(updateInnovation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteInnovation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInnovation.fulfilled, (state, action) => {
        state.loading = false;
        state.innovations = state.innovations.filter((inv) => inv._id !== action.payload);
      })
      .addCase(deleteInnovation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearInnovations } = innovationSlice.actions;
export default innovationSlice.reducer;