/**
 * Extract user-friendly error message from API error
 * Handles axios errors, network errors, and other error types
 */
export const getErrorMessage = (error: any, fallbackMessage: string = 'An error occurred'): string => {
  // Handle axios/API errors with response
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Handle network errors (no response received)
  if (error.request && !error.response) {
    return error.message || 'Network error. Please check your internet connection.';
  }
  
  // Handle other errors
  if (error.message) {
    return error.message;
  }
  
  // Fallback message
  return fallbackMessage;
};

/**
 * Get HTTP status code from error
 */
export const getErrorStatus = (error: any): number | null => {
  return error.response?.status || null;
};

/**
 * Check if error is a specific HTTP status
 */
export const isErrorStatus = (error: any, status: number): boolean => {
  return error.response?.status === status;
};

/**
 * Check if error is a network error (no response)
 */
export const isNetworkError = (error: any): boolean => {
  return Boolean(error.request && !error.response);
};

/**
 * Check if error is a server error (5xx)
 */
export const isServerError = (error: any): boolean => {
  const status = getErrorStatus(error);
  return status !== null && status >= 500 && status < 600;
};

/**
 * Check if error is a client error (4xx)
 */
export const isClientError = (error: any): boolean => {
  const status = getErrorStatus(error);
  return status !== null && status >= 400 && status < 500;
};

