// src/pages/CreateTicket.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ui/theme-toggle';
import type { TicketRequest } from '../types';
import apiClient, { handleApiError } from '../services/api';

const CATEGORIES = [
  'Technical Support',
  'Feature Request',
  'Bug Report',
  'Account Issue',
  'General Inquiry',
];

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Critical' },
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState<TicketRequest>({
    title: '',
    category: 'Technical Support',
    priority: 2,
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  // Use number type (returned by browser's setTimeout)
  const [successTimeoutRef, setSuccessTimeoutRef] = useState<number | null>(null);

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'priority') {
      setFormData((prev: TicketRequest) => ({
        ...prev,
        [name]: parseInt(value, 10),
      }));
    } else {
      setFormData((prev: TicketRequest) => ({
        ...prev,
        [name]: value,
      }));
    }

    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.title.length > 100) {
      setError('Title must be 100 characters or less');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.description.length > 2000) {
      setError('Description must be 2000 characters or less');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (!formData.priority) {
      setError('Priority is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/tickets', formData);

      if (response.data) {
        const createdTicket = response.data;
        setTicketNumber(createdTicket.ticketNumber || createdTicket.id);
        setSuccess(true);

        // Auto-redirect after 3 seconds
        //  setTimeout returns a number in browser, not NodeJS.Timeout
        const timeout = setTimeout(() => {
          navigate('/dashboard');
        }, 3000);

        setSuccessTimeoutRef(timeout);
      }
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage || 'Failed to create ticket. Please try again.');
      setLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef !== null) {
        clearTimeout(successTimeoutRef);
      }
    };
  }, [successTimeoutRef]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 transition-colors">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Ticket</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Success State */}
        {success && (
          <div className="mb-8 p-8 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
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
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
              Ticket Created Successfully!
            </h2>
            <p className="text-green-700 dark:text-green-200 mb-4">
              Ticket Number: <span className="font-mono font-bold">{ticketNumber}</span>
            </p>
            <p className="text-green-600 dark:text-green-300 text-sm mb-6">
              Confirmation email has been sent to <span className="font-semibold">{user?.email}</span>
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                View Dashboard
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    title: '',
                    category: 'Technical Support',
                    priority: 2,
                    description: '',
                  });
                  setTicketNumber(null);
                }}
                className="btn-secondary"
              >
                Create Another
              </button>
            </div>

            <p className="text-green-600 dark:text-green-300 text-xs mt-4">
              Redirecting to dashboard in 3 seconds...
            </p>
          </div>
        )}

        {/* Form (hidden when success) */}
        {!success && (
          <div className="card shadow-lg">
            {/* User Info */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Logged in as: <span className="font-semibold">{user?.firstName} {user?.lastName}</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{user?.email}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-red-600 mr-2 flex-shrink-0"
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief summary of the issue"
                    maxLength={100}
                    className="input-field"
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/100 characters
                  </p>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                  disabled={loading}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 flex-wrap mt-2">
                  {PRIORITY_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="priority"
                        value={option.value}
                        checked={formData.priority === option.value}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="w-4 h-4 cursor-pointer"
                        required
                      />
                      <span className="ml-2 text-sm cursor-pointer">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label text-gray-700 dark:text-gray-300 block mb-1 font-medium">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide detailed information about your issue"
                    maxLength={2000}
                    rows={8}
                    className="input-field resize-none"
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/2000 characters
                  </p>
                </div>
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
                    Creating Ticket...
                  </>
                ) : (
                  'Create Ticket'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
