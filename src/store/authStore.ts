// src/store/authStore.ts - SIMPLIFIED WITH MANUAL LOCALSTORAGE

import { create } from "zustand";
import type { AuthState } from "../types";

const STORAGE_KEY = "authToken";
const USER_STORAGE_KEY = "authUser";

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Action: Set user and token after login
  setUser: (user, token) => {
    console.log('setUser called:', { user, token });
    
    // Save to localStorage manually
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    
    set({
      user,
      token,
      isAuthenticated: true,
      error: null,
    });
  },

  // Action: Clear auth when logout
  clearAuth: () => {
    console.log('🚪 clearAuth called');
    
    // Clear localStorage manually
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Action: Set loading state
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  // Action: Set error message
  setError: (error) => {
    set({ error });
  },

  // Action: Restore from localStorage on app mount
  restoreAuthFromStorage: () => {
    console.log('Restoring auth from localStorage...');
    
    const token = localStorage.getItem(STORAGE_KEY);
    const userStr = localStorage.getItem(USER_STORAGE_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('Auth restored from localStorage:', { user, token: '***' });
        
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        return false;
      }
    }
    
    console.log('No stored auth found');
    return false;
  },
}));



