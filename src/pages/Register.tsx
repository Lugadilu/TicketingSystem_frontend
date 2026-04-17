// src/pages/Register.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, verifyOtp, resendOtp } from '../services/authApi';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ui/theme-toggle';
import type { RegisterRequest } from '../types';

type Step = 'register' | 'verify' | 'success';

export default function Register() {
  const navigate = useNavigate();
  const { setLoading, setError, isLoading } = useAuthStore();

  const [step, setStep] = useState<Step>('register');
  const [error, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Register form state
  const [registerForm, setRegisterForm] = useState<RegisterRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  // OTP form state
  const [otp, setOtp] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle register form input
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
  };

  // Submit register form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !registerForm.email ||
      !registerForm.password ||
      !registerForm.firstName ||
      !registerForm.lastName
    ) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (registerForm.password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { data, error: apiError } = await register(registerForm);

    if (apiError) {
      setLocalError(apiError);
      setLoading(false);
      return;
    }

    if (data) {
      setSuccessMessage('OTP sent to your email. Please verify to continue.');
      setStep('verify');
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    const { data, error: apiError } = await verifyOtp({
      email: registerForm.email,
      otp,
    });

    if (apiError) {
      setLocalError(apiError);
      setLoading(false);
      return;
    }

    if (data) {
      setSuccessMessage(
        'Email verified successfully! You can now login with your credentials.'
      );
      setStep('success');
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setLocalError(null);
    setLoading(true);
    const { data, error: apiError } = await resendOtp(registerForm.email);

    if (apiError) {
      setLocalError(apiError);
      setLoading(false);
      return;
    }

    if (data) {
      setSuccessMessage('OTP resent to your email');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 relative">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {step === 'register' && 'Sign up to start filing tickets'}
            {step === 'verify' && 'Verify your email address'}
            {step === 'success' && 'Registration complete!'}
          </p>
        </div>

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

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Registration Form */}
        {step === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={registerForm.firstName}
                onChange={handleRegisterChange}
                placeholder="John"
                className="input-field"
                disabled={isLoading}
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={registerForm.lastName}
                onChange={handleRegisterChange}
                placeholder="Doe"
                className="input-field"
                disabled={isLoading}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Email Address *</label>
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                placeholder="john@example.com"
                className="input-field"
                disabled={isLoading}
                required
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Phone Number (Optional)</label>
              <input
                type="tel"
                name="phoneNumber"
                value={registerForm.phoneNumber}
                onChange={handleRegisterChange}
                placeholder="+1 (555) 000-0000"
                className="input-field"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Password *</label>
              <input
                type="password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                placeholder="••••••••"
                className="input-field"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setLocalError(null);
                }}
                placeholder="••••••••"
                className="input-field"
                disabled={isLoading}
                required
              />
            </div>

            {/* Submit Button */}
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
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-700 dark:text-gray-300">
                We sent a 6-digit OTP to
                <br />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {registerForm.email}
                </span>
              </p>
            </div>

            {/* OTP Input */}
            <div>
              <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">Enter OTP Code *</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setLocalError(null);
                }}
                placeholder="000000"
                className="input-field text-center text-2xl tracking-widest font-mono"
                disabled={isLoading}
                required
              />
            </div>

            {/* Verify Button */}
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
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          </form>
        )}

        {/* STEP 3: Success */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your account has been created successfully.
                <br />
                You can now log in with your credentials.
              </p>
            </div>

            <Link
              to="/login"
              className="btn-primary w-full block text-center"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Bottom Links (not shown on success) */}
        {step !== 'success' && (
          <div className="text-center pt-4 border-t border-gray-200 dark:border-slate-700 mt-6">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
              >
                Login here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
