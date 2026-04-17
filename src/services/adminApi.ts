// src/services/adminApi.ts - FINAL FIXED VERSION

import apiClient from './api';
import type { User } from '../types';

// Role mapping - convert string names to numbers
const ROLE_MAP: Record<string, number> = {
  'Technician': 4,
  'Team Lead': 2,
  'TeamLead': 2,
  'Support': 3,
  'SuperAdmin': 1,
};

// Convert role string to number
const getRoleId = (role: string | number): number => {
  if (typeof role === 'number') return role;
  
  const roleId = ROLE_MAP[role];
  if (roleId !== undefined) return roleId;
  
  throw new Error(`Invalid role: "${role}". Use: Technician, Team Lead, Support, SuperAdmin`);
};

// Invite user - convert role string to number before sending
export const inviteUser = async (payload: {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string | number;
}) => {
  try {
    console.log('👤 Inviting user:', payload.email, 'with role:', payload.role);

    // Convert role to number
    const roleId = getRoleId(payload.role);
    console.log(`Converted role "${payload.role}" → ID ${roleId}`);

    // Send with numeric role to /users/invite endpoint
    const response = await apiClient.post('/users/invite', {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber || '',
      role: roleId, //SEND AS NUMBER
    });

    console.log(' User invited:', response.data);
    return { data: response.data?.data, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to invite user';
    console.error(' Error inviting user:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

// Get all users - CORRECT ENDPOINT: /api/users (not /api/admin/users)
export const getAllUsers = async () => {
  try {
    console.log('Fetching all users');
    //  FIXED: Use /users endpoint (NOT /admin/users)
    const response = await apiClient.get('/users');
    return { data: response.data?.data || [], error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users';
    console.error('Error fetching users:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

//  Get all tickets - CORRECT ENDPOINT: /api/tickets (not /api/admin/tickets)
export const getAllTickets = async () => {
  try {
    console.log('Fetching all tickets');
    // Use /tickets endpoint (NOT /admin/tickets)
    const response = await apiClient.get('/tickets');
    return { data: response.data?.data || [], error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tickets';
    console.error('Error fetching tickets:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

//Get tickets by status - CORRECT ENDPOINT: /api/tickets/by-status/{status}
export const getTicketsByStatus = async (status: string) => {
  try {
    console.log(`Fetching tickets with status: ${status}`);
    // Use /tickets/by-status/{status} endpoint
    const response = await apiClient.get(`/tickets/by-status/${status}`);
    return { data: response.data?.data || [], error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tickets';
    console.error('Error fetching tickets:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

// Change ticket status - CORRECT ENDPOINT: /api/tickets/{ticketId}/status
export const changeTicketStatus = async (
  ticketId: string,
  payload: { status: 'Open' | 'InProgress' | 'Resolved' | 'Closed' }
) => {
  try {
    console.log(`🔄 Changing ticket ${ticketId} status to: ${payload.status}`);
    //Use /tickets/{ticketId}/status endpoint
    const response = await apiClient.patch(`/tickets/${ticketId}/status`, payload);
    return { data: response.data?.data, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to change status';
    console.error(' Error changing status:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

//Close ticket - CORRECT ENDPOINT: /api/tickets/{ticketId}
export const closeTicket = async (ticketId: string) => {
  try {
    console.log(`✋ Closing ticket: ${ticketId}`);
    //Use DELETE /tickets/{ticketId} endpoint
    const response = await apiClient.delete(`/tickets/${ticketId}`);
    return { success: true, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to close ticket';
    console.error('Error closing ticket:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Assign ticket to technician - CORRECT ENDPOINT: /api/tickets/{ticketId}/assign
export const assignTicket = async (ticketId: string, technicianId: string) => {
  try {
    console.log(`👨‍💼 Assigning ticket ${ticketId} to technician ${technicianId}`);
    // Use /tickets/{ticketId}/assign endpoint
    const response = await apiClient.patch(`/tickets/${ticketId}/assign`, {
      assignedToUserId: technicianId,
    });
    return { data: response.data?.data, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to assign ticket';
    console.error('Error assigning ticket:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

//Get admin stats - CORRECT ENDPOINT: /api/admin/stats
export const getAdminStats = async () => {
  try {
    console.log('Fetching admin stats');
    //Admin stats endpoint (this one DOES have /admin/ prefix)
    const response = await apiClient.get('/admin/stats');
    return { data: response.data?.data, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch stats';
    console.error('Error fetching stats:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

// Export types
export type { User } from '../types';



