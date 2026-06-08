// src/pages/Login.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login, googleLogin } from '../services/authApi';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ui/theme-toggle';
import Loader from '../components/ui/loader';
import type { LoginRequest } from '../types';

const Login = () => {
  const navigate = useNavigate();

  const {
    setUser,
    setLoading,
    error,
    isLoading,
  } = useAuthStore();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  const [localError, setLocalError] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setLocalError(null);
  };

  // Handle email/password login
  const handleEmailLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setLocalError('Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      setLocalError(null);

      const { data, error: apiError } = await login(formData);

      if (apiError) {
        setLocalError(apiError);
        return;
      }

      if (data) {
        setUser(
          {
            id: data.userId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role:
              typeof data.role === 'string'
                ? parseInt(data.role)
                : data.role,
          },
          data.token
        );

        navigate('/dashboard');
      }
    } catch {
      setLocalError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async (
    credentialResponse: any
  ) => {
    try {
      setLoading(true);
      setLocalError(null);

      const { data, error: apiError } = await googleLogin(
        credentialResponse.credential
      );

      if (apiError) {
        setLocalError(apiError);
        return;
      }

      if (data) {
        setUser(
          {
            id: data.userId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role:
              typeof data.role === 'string'
                ? parseInt(data.role)
                : data.role,
          },
          data.token
        );

        navigate('/dashboard');
      }
    } catch {
      setLocalError('Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
          <Loader
            title="Logging you in..."
            subtitle="Please wait while we verify your account"
            size="md"
          />
        </div>
      )}

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className="card w-full max-w-md shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">
              T
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Login to manage your tickets
          </p>
        </div>

        {/* Error Message */}
        {(localError || error) && (
          <div className="mb-5 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>

              <p className="text-sm text-red-700 dark:text-red-300">
                {localError || error}
              </p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleEmailLogin}
          className="space-y-5"
        >
          {/* Email */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              disabled={isLoading}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              disabled={isLoading}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
          </div>

          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-slate-900 px-3 text-gray-500 dark:text-gray-400">
              OR
            </span>
          </div>
        </div>

        {/* Google Login */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() =>
              setLocalError(
                'Google login failed. Please try again.'
              )
            }
            text="signin_with"
          />
        </div>

        {/* Register */}
        <div className="pt-5 border-t border-gray-200 dark:border-slate-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;