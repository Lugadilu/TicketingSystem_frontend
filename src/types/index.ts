// src/types/index.ts - COMPLETE WITH ALL TYPES AND EXPORTS

// ============ ROLE CONSTANTS ============
export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  TEAM_LEAD: 2,
  SUPPORT: 3,
  TECHNICIAN: 4,
  CUSTOMER: 6,
} as const;

export const ROLE_NAMES = {
  1: 'SuperAdmin',
  2: 'TeamLead',
  3: 'Support',
  4: 'Technician',
  6: 'Customer',
} as const;

export type UserRole = typeof ROLE_IDS[keyof typeof ROLE_IDS];

// Role conversion utilities
export const ROLE_STRING_TO_NUMBER = {
  'SuperAdmin': ROLE_IDS.SUPER_ADMIN,
  'TeamLead': ROLE_IDS.TEAM_LEAD,
  'Support': ROLE_IDS.SUPPORT,
  'Technician': ROLE_IDS.TECHNICIAN,
  'Customer': ROLE_IDS.CUSTOMER,
} as const;

export const ROLE_NUMBER_TO_STRING = {
  [ROLE_IDS.SUPER_ADMIN]: 'SuperAdmin',
  [ROLE_IDS.TEAM_LEAD]: 'TeamLead',
  [ROLE_IDS.SUPPORT]: 'Support',
  [ROLE_IDS.TECHNICIAN]: 'Technician',
  [ROLE_IDS.CUSTOMER]: 'Customer',
} as const;

export type RoleString = keyof typeof ROLE_STRING_TO_NUMBER;

// Helper function to convert any role to number
export const convertRoleToNumber = (role: string | number | undefined | null): number => {
  if (!role) return ROLE_IDS.CUSTOMER;
  if (typeof role === 'number') return role;
  return ROLE_STRING_TO_NUMBER[role as RoleString] ?? ROLE_IDS.CUSTOMER;
};

// Helper function to convert any role to string
export const convertRoleToString = (role: string | number): string => {
  if (typeof role === 'string') return role;
  return ROLE_NUMBER_TO_STRING[role as UserRole] ?? 'Customer';
};

// ============ ROLE PERMISSIONS ============
export const ROLE_PERMISSIONS = {
  [ROLE_IDS.SUPER_ADMIN]: {
    canViewAllTickets: true,
    canViewAllUsers: true,
    canManageUsers: true,
    canAssignTickets: true,
    canCloseTickets: true,
    canCreateTickets: true,
    canViewAnalytics: true,
    canInviteUsers: true,
    canViewReports: true,
    canAccessSettings: true,
    canEditOtherTickets: true,
  },
  [ROLE_IDS.TEAM_LEAD]: {
    canViewAllTickets: true,
    canViewAllUsers: false,
    canManageUsers: false,
    canAssignTickets: true,
    canCloseTickets: true,
    canCreateTickets: true,
    canViewAnalytics: false,
    canInviteUsers: true,
    canViewReports: false,
    canAccessSettings: false,
    canEditOtherTickets: true,
  },
  [ROLE_IDS.SUPPORT]: {
    canViewAllTickets: true,
    canViewAllUsers: false,
    canManageUsers: false,
    canAssignTickets: false,
    canCloseTickets: false,
    canCreateTickets: false,
    canViewAnalytics: true,
    canInviteUsers: false,
    canViewReports: true,
    canAccessSettings: false,
    canEditOtherTickets: false,
  },
  [ROLE_IDS.TECHNICIAN]: {
    canViewAllTickets: false,
    canViewAllUsers: false,
    canManageUsers: false,
    canAssignTickets: false,
    canCloseTickets: false,
    canCreateTickets: false,
    canViewAnalytics: false,
    canInviteUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canEditOtherTickets: false,
  },
  [ROLE_IDS.CUSTOMER]: {
    canViewAllTickets: false,
    canViewAllUsers: false,
    canManageUsers: false,
    canAssignTickets: false,
    canCloseTickets: false,
    canCreateTickets: true,
    canViewAnalytics: false,
    canInviteUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canEditOtherTickets: false,
  },
} as const;

// ============ AUTH TYPES ============
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: number;
  token: string;
  expiresAt: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  email: string;
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetCode: string;
  newPassword: string;
  confirmPassword: string;
}
export type TicketResponse = Ticket;

export interface ResetPasswordResponse {
  email: string;
  message: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}


// ============ USER TYPES ============
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: number;
  status: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  invitationExpiresAt?: string;
  invitationAcceptedAt?: string;
  invitedByUserName?: string;
  teamLeadUserName?: string;
}

export interface InviteUserDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'TeamLead' | 'Technician' | number;
}

// ============ AUTH STORE STATE ============
export interface AuthState {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: number;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: AuthState["user"], token: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  restoreAuthFromStorage?: () => void;
}

// ============ TICKET TYPES ============
export interface TicketRequest {
  title: string;
  description: string;
  category: string;
  priority: number;
}

export interface CreateTicketRequest extends TicketRequest {}

export interface CreateTicketResponse {
  id: string;
  ticketNumber: string;
  message: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  status: number;
  priority: number;
  createdByUserId: string;
  createdByUserName: string;
  assignedToUserId?: string;
  assignedToUserName: string;
  assignedByUserId?: string;
  assignedByUserName?: string;
  closedByUserId?: string;
  closedByUserName?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  commentCount: number;
  activityLogCount: number;
}

export interface TicketListItem {
  id: string;
  ticketNumber: string;
  title: string;
  status: number;
  priority: number;
  createdByUserName: string;
  assignedToUserName: string;
  createdAt: string;
}

export interface PaginatedTicketsResponse {
  items: TicketListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  comment: string;
  attachmentUrl: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  comment: string;
  attachmentUrl?: string;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  changedByUserId?: string;
  changedByUserName: string;
  action: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
}

// ============ ACTIVITY TYPES ============
export type ActivityType = 'ticket_created' | 'ticket_resolved' | 'user_invited' | 'status_changed';

export interface RecentActivity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
}

// ============ API RESPONSE WRAPPER ============
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

// ============ PRIORITY & STATUS ENUMS ============
export const PRIORITY_LEVELS = {
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical",
} as const;

export const STATUS_LABELS = {
  1: "Open",
  2: "In Progress",
  3: "Resolved",
  4: "Reopened",
  5: "Closed",
} as const;

export const PRIORITY_COLORS = {
  1: "green",
  2: "blue",
  3: "orange",
  4: "red",
} as const;

export const STATUS_COLORS = {
  1: "blue",
  2: "orange",
  3: "green",
  4: "red",
  5: "gray",
} as const;
// ... (rest of your ticket types, etc.)





