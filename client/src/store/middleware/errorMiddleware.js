import { isRejectedWithValue } from '@reduxjs/toolkit';
import { handleError } from '../../utils/errorHandler';

/**
 * Redux middleware to handle async thunk errors globally
 */
export const errorMiddleware = () => (next) => (action) => {
  // Check if this is a rejected action from a thunk
  if (isRejectedWithValue(action)) {
    handleError(action.payload, {
      showToast: true,
      redirect: action.payload?.response?.status === 401,
    });
  }

  return next(action);
};

