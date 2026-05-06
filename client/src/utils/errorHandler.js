import toast from 'react-hot-toast';

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN'
};

// Get user-friendly error message
export const getErrorMessage = (error) => {
  // Network/Connection errors
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
    return {
      type: ERROR_TYPES.NETWORK,
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      technical: error.message
    };
  }

  // Server errors (500+)
  if (error.response?.status >= 500) {
    return {
      type: ERROR_TYPES.SERVER,
      message: 'Server error occurred. Please try again later.',
      technical: error.response?.data?.message || error.message
    };
  }

  // Auth errors (401, 403)
  if (error.response?.status === 401 || error.response?.status === 403) {
    return {
      type: ERROR_TYPES.AUTH,
      message: 'Please log in to continue.',
      technical: error.response?.data?.message || error.message
    };
  }

  // Validation errors (400)
  if (error.response?.status === 400) {
    return {
      type: ERROR_TYPES.VALIDATION,
      message: error.response.data?.message || 'Please check your input and try again.',
      technical: error.response?.data?.details || error.message
    };
  }

  // Not found (404)
  if (error.response?.status === 404) {
    return {
      type: ERROR_TYPES.NOT_FOUND,
      message: 'The requested resource was not found.',
      technical: error.response?.data?.message || error.message
    };
  }

  // Unknown errors
  return {
    type: ERROR_TYPES.UNKNOWN,
    message: '', // Empty message to prevent showing generic error
    technical: error.message
  };
};

// Show error toast with appropriate styling
export const showErrorToast = (error) => {
  const errorInfo = getErrorMessage(error);
  
  toast.error(errorInfo.message, {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#FEE2E2', // Light red background
      color: '#DC2626', // Red text
      border: '1px solid #DC2626'
    }
  });

  // Log technical error details for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      type: errorInfo.type,
      message: errorInfo.message,
      technical: errorInfo.technical
    });
  }
};

// Create a centralized error handler
export const handleError = (error, options = {}) => {
  const { showToast = true, redirect = false } = options;
  const errorInfo = getErrorMessage(error);

  // Handle auth errors
  if (errorInfo.type === ERROR_TYPES.AUTH) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('fashionhub_token');
    
    if (redirect && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Show error toast if enabled
  if (showToast) {
    showErrorToast(error);
  }

  // Return error info for additional handling if needed
  return errorInfo;
};

// Create a wrapper for async operations
export const withErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw for additional handling if needed
    }
  };
};
