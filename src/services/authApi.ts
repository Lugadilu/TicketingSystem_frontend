// src/services/authApi.ts

import apiClient, { handleApiResponse, handleApiError } from './api';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../types';

const AUTH_BASE = '/auth';

// ============ REGISTER ============
/**
 * Register a new user
 * Sends email, password, firstName, lastName, phoneNumber
 * Backend sends back OTP to email
 */
export const register = async (data: RegisterRequest) => {
  try {
    const response = await apiClient.post<any>(
      `${AUTH_BASE}/register`,
      data
    );
    return handleApiResponse<RegisterResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// ============ VERIFY OTP ============
/**
 * Verify OTP sent to email
 * Backend activates email verification
 */
export const verifyOtp = async (data: VerifyOtpRequest) => {
  try {
    const response = await apiClient.post<any>(
      `${AUTH_BASE}/verify-otp`,
      data
    );
    return handleApiResponse<{ isVerified: boolean; message: string }>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// ============ RESEND OTP ============
/**
 * Resend OTP if user didn't receive it
 * Backend sends new OTP to email
 */
export const resendOtp = async (email: string) => {
  try {
    const response = await apiClient.post<any>(
      `${AUTH_BASE}/resend-otp`,
      { email }
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// ============ LOGIN ============
/**
 * Login with email and password
 * Backend validates credentials and returns JWT token
 */
export const login = async (data: LoginRequest) => {
  try {
    const response = await apiClient.post<any>(
      `${AUTH_BASE}/login`,
      data
    );
    return handleApiResponse<LoginResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// ============ GOOGLE LOGIN ============
/**
 * Login with Google OAuth token
 * Backend validates Google token and returns JWT token
 */
export const googleLogin = async (idToken: string) => {
  try {
    const response = await apiClient.post<any>(
      `${AUTH_BASE}/google-login`,
      { idToken }
    );
    return handleApiResponse<LoginResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// ============ FORGOT PASSWORD ============
/**
 * Request password reset
 * Backend sends 6-digit reset code to email
 */
export const forgotPassword = async (data: ForgotPasswordRequest) => {
  try {
    const response = await apiClient.post<any>(
      `${AUTH_BASE}/forgot-password`,
      data
    );
    return handleApiResponse<ForgotPasswordResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// ============ RESET PASSWORD ============
/**
 * Reset password with reset code
 * User provides email, reset code, and new password
 * Backend validates and updates password
 */
export const resetPassword = async (data: ResetPasswordRequest) => {
  try {
    const response = await apiClient.post<any>(
      `${AUTH_BASE}/reset-password`,
      data
    );
    return handleApiResponse<ResetPasswordResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// ============ RESEND PASSWORD RESET CODE ============
/**
 * Resend reset code if user didn't receive it
 * Backend sends new code to email
 */
export const resendPasswordResetCode = async (email: string) => {
  try {
    const response = await apiClient.post<any>(
      `${AUTH_BASE}/resend-password-reset-code`,
      { email }
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};