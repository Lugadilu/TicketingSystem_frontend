// src/components/ProtectedRoute.tsx - FULLY FIXED

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    //Restore auth on mount
    console.log('🔐 ProtectedRoute mounted - restoring auth');
    
    try {
      const store = useAuthStore.getState();
      //Safely call restoreAuthFromStorage if it exists
      if (store.restoreAuthFromStorage && typeof store.restoreAuthFromStorage === 'function') {
        store.restoreAuthFromStorage();
      }
    } catch (error) {
      console.error('Error restoring auth:', error);
    }
    
    setIsHydrated(true);
  }, []); //Empty dependency array

  // Waiting for hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Restoring session...</p>
        </div>
      </div>
    );
  }

  //Not logged in
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Admin-only route
  if (requireAdmin && user.role !== 1) {
    console.log('ProtectedRoute: Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  //Access granted
  console.log('ProtectedRoute: Access granted');
  return <>{children}</>;
}



