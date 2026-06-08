// src/services/api.ts

import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

//const API_BASE_URL = 'http://localhost:5103/api';
const API_BASE_URL = 'http://localhost:5072/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // If 401, user is not authenticated
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ============ HELPER FUNCTIONS ============

/**
 * Handle API responses with different response formats
 * Backend can return:
 * 1. { success: true, data: { ... } }
 * 2. { success: true, data: { items: [...], totalCount: ... } } (paginated)
 * 3. Direct data object
 */
export const handleApiResponse = <T>(
  response: any
): { data: T | null; error: string | null } => {
  try {
    // Format 1: Standard response with success wrapper
    if (response.data?.success === true && response.data?.data !== undefined) {
      return { data: response.data.data as T, error: null };
    }

    // Format 2: Direct data response (no wrapper)
    if (response.data && typeof response.data === 'object') {
      // Check if it's paginated response (has items and totalCount)
      if (response.data.items && typeof response.data.totalCount === 'number') {
        return { data: response.data as T, error: null };
      }

      // Check if it's a single item response (has id or ticketNumber)
      if (response.data.id || response.data.ticketNumber || response.data.userId) {
        return { data: response.data as T, error: null };
      }

      // Check if it's a ticket list array
      if (Array.isArray(response.data)) {
        return { data: response.data as T, error: null };
      }
    }

    // If we got here, try to return the data as-is
    if (response.data) {
      return { data: response.data as T, error: null };
    }

    return { data: null, error: 'No data in response' };
  } catch (err) {
    console.error('Error parsing response:', err);
    return { data: null, error: 'Failed to process response' };
  }
};

/**
 * Handle API errors consistently
 */
export const handleApiError = (error: any): string => {
  try {
    // Check if it's an axios error with response
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.response?.data?.errors?.[0]) {
      return error.response.data.errors[0];
    }

    // Check for error array
    if (
      error.response?.data?.errors &&
      Array.isArray(error.response.data.errors)
    ) {
      return error.response.data.errors[0] || 'An error occurred';
    }

    // Check for generic message
    if (error.response?.statusText) {
      return error.response.statusText;
    }

    if (error.message) {
      return error.message;
    }
  } catch (err) {
    // Silently handle parsing errors
  }

  return 'An error occurred. Please try again.';
};