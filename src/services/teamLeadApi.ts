// src/services/teamLeadApi.ts - TeamLead specific API endpoints

import apiClient, { handleApiResponse, handleApiError } from './api';
import type { User } from '../types';

const ticketStatusMap: Record<string, number> = {
  Open: 1,
  InProgress: 2,
  'In Progress': 2,
  Resolved: 3,
  Reopened: 4,
  Closed: 5,
};

// ============ TEAM MANAGEMENT ============

export const getTeamMembers = async () => {
  try {
    const response = await apiClient.get('/users/team-members');
    return handleApiResponse<User[]>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

export const inviteTechnician = async (payload: {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}) => {
  try {
    const response = await apiClient.post('/users/invite', {
      ...payload,
      role: 4,
    });

    return handleApiResponse<User>(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// ============ TICKET MANAGEMENT ============

export const getMyTickets = async (pageNumber = 1, pageSize = 10) => {
  try {
    const response = await apiClient.get('/tickets/my-tickets', {
      params: { pageNumber, pageSize },
    });

    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

export const getTicketsByStatus = async (
  status: string,
  pageNumber = 1,
  pageSize = 10
) => {
  try {
    const statusValue = ticketStatusMap[status];

    if (!statusValue) {
      throw new Error(`Invalid ticket status: ${status}`);
    }

    const response = await apiClient.get(`/tickets/by-status/${statusValue}`, {
      params: { pageNumber, pageSize },
    });

    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

export const assignTicketToTechnician = async (
  ticketId: string,
  technicianId: string
) => {
  try {
    const response = await apiClient.patch(`/tickets/${ticketId}/assign`, {
      assignedToUserId: technicianId,
    });

    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

export const changeTicketStatus = async (
  ticketId: string,
  status: string
) => {
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

export const closeTicket = async (ticketId: string) => {
  try {
    const response = await apiClient.delete(`/tickets/${ticketId}`);
    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

export const getTicketDetail = async (ticketId: string) => {
  try {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

export const uploadTicketAttachment = async (ticketId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return handleApiResponse(response);
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
};

// // src/services/teamLeadApi.ts - TeamLead specific API endpoints

// import apiClient, { handleApiResponse, handleApiError } from './api';
// import type { User } from '../types';

// // ============ TEAM MANAGEMENT ============

// /**
//  * GET /api/users/team-members
//  * Get all technicians assigned to this TeamLead
//  */
// export const getTeamMembers = async () => {
//   try {
//     console.log('Fetching team members');
//     const response = await apiClient.get('/users/team-members');
//     return handleApiResponse<User[]>(response);
//   } catch (error) {
//     const errorMessage = handleApiError(error);
//     console.error('Error fetching team members:', errorMessage);
//     return { data: null, error: errorMessage };
//   }
// };

// /**
//  * POST /api/users/invite
//  * Invite a new technician to the team
//  */
// export const inviteTechnician = async (payload: {
//   email: string;
//   firstName: string;
//   lastName: string;
//   phoneNumber?: string;
// }) => {
//   try {
//     console.log('Inviting technician:', payload.email);
//     const response = await apiClient.post('/users/invite', {
//       ...payload,
//       role: 4, // Technician role ID
//     });
//     return handleApiResponse<User>(response);
//   } catch (error) {
//     const errorMessage = handleApiError(error);
//     console.error('Error inviting technician:', errorMessage);
//     return { data: null, error: errorMessage };
//   }
// };

// // ============ TICKET MANAGEMENT ============

// /**
//  * GET /api/tickets/my-tickets
//  * Get all tickets managed by this TeamLead (created by them or assigned to their team)
//  */
// export const getMyTickets = async (pageNumber = 1, pageSize = 10) => {
//   try {
//     console.log('Fetching team tickets');
//     const response = await apiClient.get('/tickets/my-tickets', {
//       params: { pageNumber, pageSize },
//     });
//     return handleApiResponse(response);
//   } catch (error) {
//     const errorMessage = handleApiError(error);
//     console.error('Error fetching tickets:', errorMessage);
//     return { data: null, error: errorMessage };
//   }
// };

// /**
//  * GET /api/tickets/by-status/{status}
//  * Get tickets filtered by status
//  */
// export const getTicketsByStatus = async (
//   status: string,
//   pageNumber = 1,
//   pageSize = 10
// ) => {
//   try {
//     console.log(`Fetching ${status} tickets`);
//     const response = await apiClient.get(`/tickets/by-status/${status}`, {
//       params: { pageNumber, pageSize },
//     });
//     return handleApiResponse(response);
//   } catch (error) {
//     const errorMessage = handleApiError(error);
//     console.error('Error fetching tickets by status:', errorMessage);
//     return { data: null, error: errorMessage };
//   }
// };

// /**
//  * PATCH /api/tickets/{ticketId}/assign
//  * Assign a ticket to a technician on the team
//  */
// export const assignTicketToTechnician = async (
//   ticketId: string,
//   technicianId: string
// ) => {
//   try {
//     console.log(`Assigning ticket ${ticketId} to technician ${technicianId}`);
//     const response = await apiClient.patch(`/tickets/${ticketId}/assign`, {
//       assignedToUserId: technicianId,
//     });
//     return handleApiResponse(response);
//   } catch (error) {
//     const errorMessage = handleApiError(error);
//     console.error('Error assigning ticket:', errorMessage);
//     return { data: null, error: errorMessage };
//   }
// };

// /**
//  * PATCH /api/tickets/{ticketId}/status
//  * Change ticket status
//  */
// export const changeTicketStatus = async (
//   ticketId: string,
//   status: string
// ) => {
//   try {
//     console.log(`Changing ticket ${ticketId} status to ${status}`);
//     const response = await apiClient.patch(`/tickets/${ticketId}/status`, {
//       status,
//     });
//     return handleApiResponse(response);
//   } catch (error) {
//     const errorMessage = handleApiError(error);
//     console.error('Error changing ticket status:', errorMessage);
//     return { data: null, error: errorMessage };
//   }
// };

// /**
//  * DELETE /api/tickets/{ticketId}
//  * Close a ticket
//  */
// export const closeTicket = async (ticketId: string) => {
//   try {
//     console.log(`Closing ticket ${ticketId}`);
//     const response = await apiClient.delete(`/tickets/${ticketId}`);
//     return handleApiResponse(response);
//   } catch (error) {
//     const errorMessage = handleApiError(error);
//     console.error('Error closing ticket:', errorMessage);
//     return { data: null, error: errorMessage };
//   }
// };

// /**
//  * GET /api/tickets/{ticketId}
//  * Get single ticket details
//  */
// export const getTicketDetail = async (ticketId: string) => {
//   try {
//     console.log(`Fetching ticket ${ticketId}`);
//     const response = await apiClient.get(`/tickets/${ticketId}`);
//     return handleApiResponse(response);
//   } catch (error) {
//     const errorMessage = handleApiError(error);
//     console.error('Error fetching ticket:', errorMessage);
//     return { data: null, error: errorMessage };
//   }

// //   export const uploadTicketAttachment = async (ticketId: string, file: File) => {
// //   try {
// //     const formData = new FormData();
// //     formData.append('file', file);

// //     const response = await apiClient.post(`/tickets/${ticketId}/attachments`, formData, {
// //       headers: { 'Content-Type': 'multipart/form-data' },
// //     });

// //     return handleApiResponse(response);
// //   } catch (error) {
// //     const errorMessage = handleApiError(error);
// //     return { data: null, error: errorMessage };
// //   }
// // };

// };