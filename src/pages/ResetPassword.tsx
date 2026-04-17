// src/pages/ResetPassword.tsx

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authApi';
import { ThemeToggle } from '../components/ui/theme-toggle';
import type { ResetPasswordRequest } from '../types';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get email from URL params when page loads
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email || !resetCode || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (resetCode.length !== 6) {
      setError('Reset code must be 6 digits');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data, error: apiError } = await resetPassword({
        email,
        resetCode,
        newPassword,
        confirmPassword,
      } as ResetPasswordRequest);

      if (apiError) {
        setError(apiError);
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 relative">
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
            Password reset successful!
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your password has been changed successfully. You can now log in with your new password.
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to login in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  // Default state: Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 relative">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-md shadow-xl">
        {/* Header Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reset your password
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter the reset code from your email and your new password.
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
          {/* Email (read-only) */}
          <div>
            <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              disabled
              className="input-field bg-gray-100 dark:bg-slate-700 cursor-not-allowed"
            />
          </div>

          {/* Reset Code */}
          <div>
            <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Reset Code (6 digits)</label>
            <input
              type="text"
              maxLength={6}
              value={resetCode}
              onChange={(e) => {
                setResetCode(e.target.value.replace(/\D/g, ''));
                setError(null);
              }}
              placeholder="000000"
              className="input-field text-center text-2xl tracking-widest font-mono"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code from your email
            </p>
          </div>

          {/* New Password */}
          <div>
            <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••"
              className="input-field"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              At least 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••"
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
                Resetting...
              </>
            ) : (
              'Reset Password'
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
