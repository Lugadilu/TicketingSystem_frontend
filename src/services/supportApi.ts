// src/services/supportApi.ts - Support specific API endpoints
// Support role: Reviews and prioritizes tickets (no implementation)
// Can see ALL tickets, change status/priority, assign to technicians

import apiClient, { handleApiResponse, handleApiError } from './api';

// ============ TICKET MANAGEMENT ============

/**
 * GET /api/tickets/my-tickets
 * Support sees ALL tickets (handled by backend role-based filtering)
 */
export const getAllTickets = async (pageNumber = 1, pageSize = 20) => {
  try {
    const response = await apiClient.get('/tickets/my-tickets', {
      params: { pageNumber, pageSize },
    });
    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

/**
 * GET /api/tickets/by-status/{status}
 * Filter tickets by status
 */
export const getTicketsByStatus = async (status: string, pageNumber = 1, pageSize = 20) => {
  try {
    const response = await apiClient.get(`/tickets/by-status/${status}`, {
      params: { pageNumber, pageSize },
    });
    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

/**
 * GET /api/tickets/{id}
 * Get single ticket details
 */
export const getTicketDetail = async (ticketId: string) => {
  try {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

/**
 * PATCH /api/tickets/{id}/status
 * Change ticket status - Support can prioritize/triage
 */

const ticketStatusMap: Record<string, number> = {
  Open: 1,
  InProgress: 2,
  "In Progress": 2,
  Resolved: 3,
  Reopened: 4,
  Closed: 5,
};

export const updateTicketStatus = async (ticketId: string, status: string) => {
  try {
    const statusValue = ticketStatusMap[status];

    if (!statusValue) {
      throw new Error(`Invalid ticket status: ${status}`);
    }

    const response = await apiClient.patch(`/tickets/${ticketId}/status`, {
      status: statusValue,
    });

    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};


/**
 * PATCH /api/tickets/{id}/assign
 * Assign ticket to technician - Support routes work to technicians
 */
export const assignTicket = async (
  ticketId: string,
  teamLeadUserId: string,
  technicianId: string
) => {
  try {
    const response = await apiClient.patch(`/tickets/${ticketId}/assign`, {
      teamLeadUserId,
      assignedToUserId: technicianId,
    });
    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

/**
 * GET /api/users
 * Get all users (to find technicians for assignment)
 */
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/users');
    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

/**
 * GET /api/admin/stats
 * Get system stats for overview
 */
export const getStats = async () => {
  try {
    const response = await apiClient.get('/admin/stats');
    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};