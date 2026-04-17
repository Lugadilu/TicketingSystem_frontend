// src/pages/ForgotPassword.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authApi';
import { ThemeToggle } from '../components/ui/theme-toggle';
import type { ForgotPasswordRequest } from '../types';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mask email for privacy (shows: j***@example.com)
  const maskedEmail = email && email.includes('@')
    ? (() => {
        const [name, domain] = email.split('@');
        if (name.length <= 2) {
          return name[0] + '*' + '@' + domain;
        }
        return name.slice(0, 2) + '*'.repeat(name.length - 2) + '@' + domain;
      })()
    : email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const { data, error: apiError } = await forgotPassword({ email } as ForgotPasswordRequest);

      if (apiError) {
        setError(apiError);
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Success state: Show confirmation message
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 relative">
        {/* Theme Toggle in top-right corner */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="card w-full max-w-md shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Check your email
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a password reset code to{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{maskedEmail}</span>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 Check your spam or junk folder if you don't see the email. The code will expire in 10 minutes.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center justify-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  // Default state: Email input form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 relative">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-md shadow-xl">
        

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Forgot password?
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          No worries! Enter your email and we'll send you a code to reset your password.
        </p>

        {/* Error Message */}
        {error && (
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
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="your.email@example.com"
              className="input-field"
              disabled={loading}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
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
                Sending...
              </>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-slate-700 mt-6">
          <Link
            to="/login"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
