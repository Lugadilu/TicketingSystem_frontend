// src/pages/DashboardRouter.tsx - FIXED

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRoleCheck } from '../hooks/useRoleCheck';

export default function DashboardRouter() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isAdmin, isTeamLead, isTechnician, isSupport, isCustomer } = useRoleCheck();

  useEffect(() => {
    console.log('DashboardRouter: Checking user and role');
    
    // if (!user) {
    //   console.log('No user found, redirecting to login');
    //   navigate('/login');
    //   return;
    // }
    if (!user) {
  console.log('⏳ Waiting for user...');
  return; //  wait instead of redirecting
  }

    console.log('User found:', user);

    // Route to role-specific dashboard
    // Call the functions to get boolean values
    const adminCheck = isAdmin();
    const teamLeadCheck = isTeamLead();
    const technicianCheck = isTechnician();
    const supportCheck = isSupport();
    const customerCheck = isCustomer();

    console.log('Role checks:', { adminCheck, teamLeadCheck, technicianCheck, supportCheck, customerCheck });

    if (adminCheck) {
      console.log('User is admin, navigating to /admin/dashboard');
      navigate('/admin/dashboard', { replace: true });
    } else if (teamLeadCheck) {
      console.log('User is team lead, navigating to /teamlead/dashboard');
      navigate('/teamlead/dashboard', { replace: true });
    } else if (technicianCheck) {
      console.log('User is technician, navigating to /technician/dashboard');
      navigate('/technician/dashboard', { replace: true });
    } else if (supportCheck) {
      console.log('User is support, navigating to /support/dashboard');
      navigate('/support/dashboard', { replace: true });
    } else if (customerCheck) {
      console.log('User is customer, navigating to /customer/dashboard');
      navigate('/customer/dashboard', { replace: true });
    } else {
      console.log('Unknown role, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [user, navigate]); // ✅ ONLY user and navigate as dependencies

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    </div>
  );
}
