// src/services/configApi.ts - Fetch configuration from backend

import apiClient, { handleApiResponse, handleApiError } from './api';

interface GoogleAuthConfig {
  clientId: string;
  isConfigured: boolean;
}

interface AuthConfig {
  googleAuth: GoogleAuthConfig;
  apiUrl: string;
  version: string;
}

/**
 * Fetch Google Client ID from backend
 * GET /api/config/google-client-id
 * 
 * This allows frontend to get the Google Client ID dynamically
 * from backend appsettings instead of hardcoding it
 */
export const getGoogleClientId = async (): Promise<{
  data: GoogleAuthConfig | null;
  error: string | null;
}> => {
  try {
    console.log('Fetching Google Client ID from backend...');
    const response = await apiClient.get('/config/google-client-id');
    const result = handleApiResponse<GoogleAuthConfig>(response);
    
    if (result.data) {
      console.log('Got Google Client ID:', result.data.clientId.substring(0, 20) + '...');
    }
    
    return result;
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Failed to fetch Google Client ID:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * Fetch all authentication configuration from backend
 * GET /api/config/auth-config
 * 
 * Returns Google OAuth config and other auth settings
 */
export const getAuthConfig = async (): Promise<{
  data: AuthConfig | null;
  error: string | null;
}> => {
  try {
    console.log('Fetching auth config from backend...');
    const response = await apiClient.get('/config/auth-config');
    const result = handleApiResponse<AuthConfig>(response);
    
    if (result.data) {
      console.log('Got auth config:', result.data);
    }
    
    return result;
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Failed to fetch auth config:', errorMessage);
    return { data: null, error: errorMessage };
  }
};