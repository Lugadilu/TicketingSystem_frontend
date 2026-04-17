// src/hooks/useRoleCheck.ts - OPTIMIZED

import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
//import { ROLE_IDS, ROLE_PERMISSIONS } from '../types/roles';
import { ROLE_IDS, ROLE_PERMISSIONS } from '../types';

export const useRoleCheck = () => {
  const { user } = useAuthStore();

  // Memoize all functions so they don't create new references on every render
  const checks = useMemo(() => {
    // Get current user's role
    const getUserRole = () => user?.role;

    // Check if user has specific role
    const hasRole = (roleId: number) => user?.role === roleId;

    // Check if user has any of the specified roles
    const hasAnyRole = (roleIds: number[]) => {
      return user ? roleIds.includes(user.role) : false;
    };

    // Role-specific checks
    const isAdmin = () => user?.role === ROLE_IDS.SUPER_ADMIN;

    const isTeamLead = () => user?.role === ROLE_IDS.TEAM_LEAD;

    const isTechnician = () => user?.role === ROLE_IDS.TECHNICIAN;

    const isSupport = () => user?.role === ROLE_IDS.SUPPORT;

    const isCustomer = () => user?.role === ROLE_IDS.CUSTOMER;

    // Check if user can perform specific action
    const canDoAction = (action: keyof typeof ROLE_PERMISSIONS[1]) => {
      if (!user) return false;
      const permissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS];
      return permissions ? permissions[action] : false;
    };

    // Get all permissions for current user
    const getAllPermissions = () => {
      if (!user) return null;
      return ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS];
    };

    // Check multiple permissions (all must be true)
    const canDoAllActions = (actions: (keyof typeof ROLE_PERMISSIONS[1])[]) => {
      return actions.every(action => canDoAction(action));
    };

    // Check multiple permissions (any can be true)
    const canDoAnyAction = (actions: (keyof typeof ROLE_PERMISSIONS[1])[]) => {
      return actions.some(action => canDoAction(action));
    };

    return {
      getUserRole,
      hasRole,
      hasAnyRole,
      isAdmin,
      isTeamLead,
      isTechnician,
      isSupport,
      isCustomer,
      canDoAction,
      canDoAllActions,
      canDoAnyAction,
      getAllPermissions,
      userRole: user?.role,
      isAuthenticated: !!user,
    };
  }, [user]); 

  return checks;
};