import axios from 'axios';
import { handleError } from './errorHandler';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fashionhub_token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor with improved error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle the error using our centralized error handler
    handleError(error, {
      showToast: true,
      redirect: error.response?.status === 401, // Only redirect on auth errors
    });

    // Check if we should retry the request
    const shouldRetry = error.config && !error.config.__isRetry && (
      error.code === 'ERR_NETWORK' || 
      error.response?.status === 503 || 
      error.response?.status === 429
    );

    if (shouldRetry) {
      error.config.__isRetry = true;
      return new Promise(resolve => {
        // Retry after a delay
        setTimeout(() => {
          resolve(api(error.config));
        }, 2000); // 2 second delay
      });
    }

    return Promise.reject(error);
  },
);

// Export both the instance and a wrapper for making requests with error handling
export const withErrorHandling = (requestFn) => {
  return async (...args) => {
    try {
      const response = await requestFn(...args);
      return response.data;
    } catch (error) {
      // The error will be handled by the interceptor
      throw error;
    }
  };
};

// Create request methods with error handling
const apiWithErrorHandling = {
  get: withErrorHandling((url, config) => api.get(url, config)),
  post: withErrorHandling((url, data, config) => api.post(url, data, config)),
  put: withErrorHandling((url, data, config) => api.put(url, data, config)),
  delete: withErrorHandling((url, config) => api.delete(url, config)),
  patch: withErrorHandling((url, data, config) => api.patch(url, data, config)),
};

export default apiWithErrorHandling;
