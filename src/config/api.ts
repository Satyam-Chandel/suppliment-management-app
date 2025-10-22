import axios from 'axios';

// API Base URL - change this based on your environment
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - can be used for future auth integration with Gym app
api.interceptors.request.use(
  (config) => {
    // Auth token can be added here if needed from Gym app
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error handling with user-friendly messages
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message;

      // Map specific status codes to user-friendly messages
      switch (status) {
        case 400:
          error.response.data.message = message || 'Invalid request. Please check your input.';
          break;
        case 401:
          error.response.data.message = message || 'Unauthorized. Please log in again.';
          break;
        case 403:
          error.response.data.message = message || 'Access denied. You don\'t have permission.';
          break;
        case 404:
          error.response.data.message = message || 'Resource not found.';
          break;
        case 409:
          error.response.data.message = message || 'Conflict. This resource already exists.';
          break;
        case 422:
          error.response.data.message = message || 'Validation failed. Please check your input.';
          break;
        case 429:
          error.response.data.message = message || 'Too many requests. Please try again later.';
          break;
        case 500:
          error.response.data.message = message || 'Server error. Please try again later.';
          break;
        case 502:
          error.response.data.message = message || 'Bad gateway. Server is temporarily unavailable.';
          break;
        case 503:
          error.response.data.message = message || 'Service unavailable. Please try again later.';
          break;
        case 504:
          error.response.data.message = message || 'Gateway timeout. Request took too long.';
          break;
        default:
          if (status >= 500) {
            error.response.data.message = message || 'Server error. Please try again later.';
          } else if (status >= 400) {
            error.response.data.message = message || 'Request failed. Please try again.';
          }
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      error.message = 'Network error. Please check your internet connection.';
    } else {
      // Something else happened
      error.message = error.message || 'An unexpected error occurred.';
    }

    return Promise.reject(error);
  }
);

export default api;

