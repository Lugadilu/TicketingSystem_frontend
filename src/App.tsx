// src/App.tsx - FIXED VERSION

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { ThemeProvider } from './components/ui/theme-provider';
import { useAuthStore } from './store/authStore';
import { getGoogleClientId } from './services/configApi';
import ProtectedRoute from './components/ProtectedRoute';

import DashboardLayout from './layouts/DashboardLayout';

import AcceptInvitation from './pages/AcceptInvitation';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateTicket from './pages/CreateTicket';
import DashboardRouter from './pages/DashboardRouter';

import AdminDashboard from './pages/admin/AdminDashboard';
import Analytics from './pages/admin/Analytics';
import UsersList from './pages/admin/UsersList';
import TicketsList from './pages/admin/TicketsList';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import TeamLeadDashboard from './pages/teamlead/TeamLeadDashboard';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import SupportDashboard from './pages/support/SupportDashboard';
import ViewTransactions from './pages/mpesa/transaction';
import PayWithMpesa from './pages/mpesa/lipanampesa';

export default function App() {
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restored = useAuthStore.getState().restoreAuthFromStorage?.();
    console.log('App mounted - auth restored:', restored);
  }, []);

  useEffect(() => {
    const fetchGoogleClientId = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: apiError } = await getGoogleClientId();

        if (apiError) {
          console.error('Failed to fetch Google Client ID:', apiError);
          setError(apiError);
          return;
        }

        if (data?.clientId) {
          console.log('Successfully fetched Google Client ID from backend');
          setGoogleClientId(data.clientId);
        } else {
          setError('No Google Client ID returned from backend');
        }
      } catch (err) {
        console.error('Failed to fetch Google Client ID:', err);
        setError('Failed to load Google authentication');
      } finally {
        setLoading(false);
      }
    };

    fetchGoogleClientId();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !googleClientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">!</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Configuration Error
          </h1>
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

  return (
    <ThemeProvider defaultTheme="light" storageKey="ticketing-theme">
      <GoogleOAuthProvider clientId={googleClientId}>
        <Router>
          <Routes>
            {/* Auth Routes - no sidebar */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />

            {/* Protected App Routes - persistent sidebar */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardRouter />} />

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
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Customer Routes */}
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/tickets" element={<CustomerDashboard />} />
              <Route path="/create-ticket" element={<CreateTicket />} />

             {/* Team Lead Routes */}
<Route path="/teamlead/dashboard" element={<TeamLeadDashboard view="overview" />} />
<Route path="/teamlead/tickets" element={<TeamLeadDashboard view="tickets" />} />
<Route path="/teamlead/team-members" element={<TeamLeadDashboard view="members" />} />


<Route path="/technician/dashboard" element={<TechnicianDashboard view="overview" />} />
<Route path="/technician/assigned-tickets" element={<TechnicianDashboard view="assigned" />} />

<Route path="/support/dashboard" element={<SupportDashboard view="overview" />} />
<Route path="/support/tickets" element={<SupportDashboard view="queue" />} />
<Route path="/support/analytics" element={<SupportDashboard view="analytics" />} />

<Route path="/mpesa/pay" element={<PayWithMpesa />} />
<Route path="/mpesa/transactions" element={<ViewTransactions />} />

</Route>
            {/* Catch All */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}





