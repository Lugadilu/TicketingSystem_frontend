// src/pages/Login.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login, googleLogin } from '../services/authApi';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ui/theme-toggle';
import type { LoginRequest } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setLoading, setError, error, isLoading } = useAuthStore();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
  };

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password) {
      setLocalError('Please enter email and password');
      return;
    }

    setLoading(true);
    const { data, error: apiError } = await login(formData);

    if (apiError) {
      setLocalError(apiError);
      setLoading(false);
      return;
    }

    if (data) {
      // Save user to store
      setUser(
        {
          id: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          //role: data.role,
          role: typeof data.role === 'string' ? parseInt(data.role) : data.role, 
        },
        data.token
      );
      setLoading(false);
      navigate('/dashboard');
    }
  };

  // Handle Google login
  const handleGoogleLogin = async (credentialResponse: any) => {
    setLoading(true);
    setLocalError(null);
    
    const { data, error: apiError } = await googleLogin(
      credentialResponse.credential
    );

    if (apiError) {
      setLocalError(apiError);
      setLoading(false);
      return;
    }

    if (data) {
      setUser(
        {
          id: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        },
        data.token
      );
      setLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 relative">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
         
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Login to manage your tickets</p>
        </div>

        {/* Error Message */}
        {(localError || error) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-700 text-sm">{localError || error}</p>
            </div>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          {/* Email Input */}
          <div>
            <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              className="input-field"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="input-field"
              disabled={isLoading}
              required
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 font-medium">OR</span>
          </div>
        </div>

        {/* Google Login */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setLocalError('Google login failed. Please try again.')}
            text="signin_with"
          />
        </div>

        {/* Sign Up Link */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-slate-700">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
