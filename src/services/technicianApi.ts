// src/services/technicianApi.ts - Technician specific API endpoints

import apiClient, { handleApiResponse, handleApiError } from './api';
import type { User } from '../types';

// ============ TICKET MANAGEMENT ============

/**
 * GET /api/tickets/assigned-to-me
 * Get all tickets assigned to this technician
 */
export const getAssignedTickets = async (pageNumber = 1, pageSize = 10) => {
  try {
    console.log('Fetching assigned tickets');
    const response = await apiClient.get('/tickets/assigned-to-me', {
      params: { pageNumber, pageSize },
    });
    return handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error fetching assigned tickets:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * GET /api/tickets/my-tickets
 * Get tickets visible to this technician (including created by them)
 */
export const getMyTickets = async (pageNumber = 1, pageSize = 10) => {
  try {
    console.log('Fetching my tickets');
    const response = await apiClient.get('/tickets/my-tickets', {
      params: { pageNumber, pageSize },
    });
    return handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error fetching my tickets:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * GET /api/tickets/by-status/{status}
 * Get tickets filtered by status
 */
export const getTicketsByStatus = async (
  status: string,
  pageNumber = 1,
  pageSize = 10
) => {
  try {
    console.log(`Fetching ${status} tickets`);
    const response = await apiClient.get(`/tickets/by-status/${status}`, {
      params: { pageNumber, pageSize },
    });
    return handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error fetching tickets by status:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * GET /api/tickets/{ticketId}
 * Get single ticket details
 */
export const getTicketDetail = async (ticketId: string) => {
  try {
    console.log(`Fetching ticket ${ticketId}`);
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error fetching ticket:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * PATCH /api/tickets/{ticketId}/status
 * Change ticket status (start work, mark as in progress, resolve, etc)
 */
export const updateTicketStatus = async (ticketId: string, status: string) => {
  try {
    console.log(`Updating ticket ${ticketId} status to ${status}`);
    const response = await apiClient.patch(`/tickets/${ticketId}/status`, {
      status,
    });
    return handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error updating ticket status:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * POST /api/tickets/{ticketId}/comments
 * Add a comment/update to a ticket
 */
export const addCommentToTicket = async (ticketId: string, comment: string) => {
  try {
    console.log(`Adding comment to ticket ${ticketId}`);
    const response = await apiClient.post(`/tickets/${ticketId}/comments`, {
      content: comment,
    });
    return handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error adding comment:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * GET /api/tickets/{ticketId}/comments
 * Get all comments on a ticket
 */
export const getTicketComments = async (ticketId: string) => {
  try {
    console.log(`Fetching comments for ticket ${ticketId}`);
    const response = await apiClient.get(`/tickets/${ticketId}/comments`);
    return handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error fetching comments:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * GET /api/tickets/{ticketId}/activity
 * Get activity log for a ticket
 */
export const getTicketActivity = async (ticketId: string) => {
  try {
    console.log(`Fetching activity for ticket ${ticketId}`);
    const response = await apiClient.get(`/tickets/${ticketId}/activity`);
    return handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error fetching activity:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * PUT /api/tickets/{ticketId}
 * Update ticket details (description, priority, etc)
 */
export const updateTicket = async (
  ticketId: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    priority?: number;
  }
) => {
  try {
    console.log(`Updating ticket ${ticketId}`);
    const response = await apiClient.put(`/tickets/${ticketId}`, data);
    return handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error updating ticket:', errorMessage);
    return { data: null, error: errorMessage };
  }
};