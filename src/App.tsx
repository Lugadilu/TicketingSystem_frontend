// src/App.tsx - FIXED VERSION

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './components/ui/theme-provider';
import { useAuthStore } from './store/authStore';
import { getGoogleClientId } from './services/configApi';
import ProtectedRoute from './components/ProtectedRoute.tsx';

// Pages
import AcceptInvitation from './pages/AcceptInvitation';
import Analytics from './pages/admin/Analytics';
import TeamLeadDashboard from './pages/teamlead/TeamLeadDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateTicket from './pages/CreateTicket';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import DashboardRouter from './pages/DashboardRouter';
import UsersList from './pages/admin/UsersList';
import TicketsList from './pages/admin/TicketsList';
import TechnicianDashboard from './pages/technician/TechnicianDashboard.tsx';

export default function App() {
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore auth from localStorage on app mount
  useEffect(() => {
    const restored = useAuthStore.getState().restoreAuthFromStorage?.();
    console.log('App mounted - auth restored:', restored);
  }, []);

  //Fetch Google Client ID from backend on app mount
  useEffect(() => {
    const fetchGoogleClientId = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: apiError } = await getGoogleClientId();

        if (apiError) {
          console.error('Failed to fetch Google Client ID:', apiError);
          setError(apiError);
          setLoading(false);
          return;
        }

        if (data?.clientId) {
          console.log('Successfully fetched Google Client ID from backend');
          setGoogleClientId(data.clientId);
          setLoading(false);
        } else {
          setError('No Google Client ID returned from backend');
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch Google Client ID:', err);
        setError('Failed to load Google authentication');
        setLoading(false);
      }
    };

    fetchGoogleClientId();
  }, []);

  // Show loading state while fetching Google Client ID
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if Google Client ID couldn't be loaded
  if (error || !googleClientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configuration Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Google authentication is not properly configured'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please ensure the backend is running and Google Client ID is configured in appsettings.json
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render app with Google OAuth Provider
  return (
    <ThemeProvider defaultTheme="light" storageKey="ticketing-theme">
      <GoogleOAuthProvider clientId={googleClientId}>
        <Router>
          <Routes>
            {/* Dashboard Router (Protected) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <UsersList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/tickets"
              element={
                <ProtectedRoute requireAdmin>
                  <TicketsList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requireAdmin>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Customer Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            {/* TeamLead Routes */}
            <Route
              path="/teamlead/dashboard"
              element={
                <ProtectedRoute>
                  <TeamLeadDashboard />
                </ProtectedRoute>
              }
            />

            {/* Technician Routes */}
            <Route
              path="/technician/dashboard"
              element={
                <ProtectedRoute>
                  <TechnicianDashboard />
                </ProtectedRoute>
              }
            />

            {/* Auth Routes (NO protection) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/create-ticket" element={<CreateTicket />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />

            {/* Catch All */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

