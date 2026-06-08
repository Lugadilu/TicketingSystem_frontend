// src/services/ticketApi.ts

import apiClient, { handleApiResponse, handleApiError } from './api';
import type { TicketRequest, TicketResponse, PaginatedTicketsResponse } from '../types';

const TICKET_BASE = '/tickets';

// Create ticket
export const createTicket = async (data: TicketRequest) => {
  try {
    const response = await apiClient.post(`${TICKET_BASE}`, data);
    return handleApiResponse<TicketResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// Get user's tickets (paginated)
export const getMyTickets = async (pageNumber: number = 1, pageSize: number = 10) => {
  try {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await apiClient.get(`${TICKET_BASE}/my-tickets?${params}`);
    return handleApiResponse<PaginatedTicketsResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// Get tickets by status
export const getTicketsByStatus = async (
  status: number,
  pageNumber: number = 1,
  pageSize: number = 10
) => {
  try {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await apiClient.get(
      `${TICKET_BASE}/by-status/${status}?${params}`
    );
    return handleApiResponse<PaginatedTicketsResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// Get single ticket
export const getTicket = async (ticketId: string) => {
  try {
    const response = await apiClient.get(`${TICKET_BASE}/${ticketId}`);
    return handleApiResponse<TicketResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// Update ticket
export const updateTicket = async (ticketId: string, data: Partial<TicketRequest>) => {
  try {
    const response = await apiClient.put(`${TICKET_BASE}/${ticketId}`, data);
    return handleApiResponse<TicketResponse>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// Close ticket
export const closeTicket = async (ticketId: string) => {
  try {
    const response = await apiClient.delete(`${TICKET_BASE}/${ticketId}`);
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

export const downloadTicketPdf = async (ticketId: string) => {
  const response = await apiClient.get(`/tickets/${ticketId}/download`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ticket-${ticketId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadReportPdf = async (ticketId: string) => {
  const response = await apiClient.get(`/tickets/${ticketId}/report/download`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ticket-report-${ticketId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadTicketWithReportPdf = async (ticketId: string) => {
  const response = await apiClient.get(`/tickets/${ticketId}/download-with-report`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ticket-full-report-${ticketId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};