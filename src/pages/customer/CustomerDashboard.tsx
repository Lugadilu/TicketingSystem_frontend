// src/pages/customer/CustomerDashboard.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRoleCheck } from '../../hooks/useRoleCheck';
import TicketDetailModal from '../../components/TicketDetailModal';
import type { TicketListItem, PaginatedTicketsResponse } from '../../types';
import { PRIORITY_LEVELS } from '../../types';
import apiClient from '../../services/api';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isCustomer } = useRoleCheck();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isCustomer()) {
      navigate('/dashboard');
      return;
    }

    fetchTickets();
  }, [statusFilter, pageNumber, user, navigate, isCustomer]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/tickets/my-tickets';
      const params = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
      });

      if (statusFilter !== 'all') {
        url = `/tickets/by-status/${statusFilter}`;
      }

      const response = await apiClient.get(`${url}?${params.toString()}`);

      let ticketsData: TicketListItem[] = [];
      let count = 0;

      if (response.data?.data) {
        const paginatedData = response.data.data as PaginatedTicketsResponse;
        ticketsData = paginatedData.items || [];
        count = paginatedData.totalCount || 0;
      } else if (response.data?.items) {
        ticketsData = response.data.items || [];
        count = response.data.totalCount || 0;
      } else if (Array.isArray(response.data)) {
        ticketsData = response.data;
        count = ticketsData.length;
      }

      setTickets(ticketsData);
      setTotalCount(count);

      setStats({
        total: count,
        open: ticketsData.filter((ticket) => ticket.status === 1).length,
        inProgress: ticketsData.filter((ticket) => ticket.status === 2).length,
        resolved: ticketsData.filter((ticket) => ticket.status === 3).length,
      });
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return 'Open';
      case 2:
        return 'In Progress';
      case 3:
        return 'Resolved';
      case 4:
        return 'Reopened';
      case 5:
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: number): string => {
    switch (status) {
      case 1:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 2:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 3:
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800';
      case 4:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 5:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1:
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 2:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 3:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
      case 4:
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityBgColor = (priority: number): string => {
    switch (priority) {
      case 1:
        return 'bg-green-50/50 dark:bg-green-950/20';
      case 2:
        return 'bg-blue-50/50 dark:bg-blue-950/20';
      case 3:
        return 'bg-orange-50/50 dark:bg-orange-950/20';
      case 4:
        return 'bg-red-50/50 dark:bg-red-950/20';
      default:
        return 'bg-gray-50/50 dark:bg-slate-800/50';
    }
  };

  const getStatusIcon = (status: number) => {
    if (status === 1) {
      return (
        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      );
    }

    if (status === 2 || status === 3) {
      return (
        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your support requests
          </p>
        </div>

        <button
          onClick={() => navigate('/create-ticket')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tickets', value: stats.total, hint: 'All time requests' },
          { label: 'Open', value: stats.open, hint: 'Awaiting response' },
          { label: 'In Progress', value: stats.inProgress, hint: 'Being handled' },
          { label: 'Resolved', value: stats.resolved, hint: 'Completed' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{item.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter:</span>

            <button
              onClick={() => {
                setStatusFilter('all');
                setPageNumber(1);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>

            {[1, 2, 3, 4, 5].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPageNumber(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{tickets.length}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your tickets...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-red-900 dark:text-red-100 font-semibold mb-1">Failed to load tickets</h3>
          <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
          <button
            onClick={fetchTickets}
            className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${getPriorityBgColor(ticket.priority)}`}
                    onClick={() => handleViewTicket(ticket.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        #{ticket.ticketNumber}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                        {ticket.title}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {PRIORITY_LEVELS[ticket.priority as keyof typeof PRIORITY_LEVELS]}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTicket(ticket.id);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium text-sm inline-flex items-center gap-1 group"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalCount > pageSize && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page <span className="font-medium text-gray-900 dark:text-white">{pageNumber}</span> of{' '}
                <span className="font-medium text-gray-900 dark:text-white">{Math.ceil(totalCount / pageSize)}</span>
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber === 1}
                  className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <button
                  onClick={() => setPageNumber(Math.min(Math.ceil(totalCount / pageSize), pageNumber + 1))}
                  disabled={pageNumber >= Math.ceil(totalCount / pageSize)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && tickets.length === 0 && !error && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {statusFilter === 'all' ? 'No tickets yet' : 'No tickets found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {statusFilter === 'all'
              ? "You haven't created any support tickets yet."
              : `No tickets with status "${getStatusLabel(statusFilter as number)}" found.`}
          </p>
          <button
            onClick={() => navigate('/create-ticket')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            Create Your First Ticket
          </button>
        </div>
      )}

      <TicketDetailModal
        ticketId={selectedTicketId || ''}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicketId(null);
        }}
      />
    </div>
  );
}





// // src/pages/customer/CustomerDashboard.tsx - IMPROVED VERSION

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuthStore } from '../../store/authStore';
// import { useRoleCheck } from '../../hooks/useRoleCheck';
// import Sidebar from '../../components/sidebar';
// import TicketDetailModal from '../../components/TicketDetailModal';
// import { ThemeToggle } from '../../components/ui/theme-toggle';
// import type { TicketListItem, PaginatedTicketsResponse } from '../../types';
// import { PRIORITY_LEVELS, STATUS_LABELS } from '../../types';
// import apiClient from '../../services/api';

// export default function CustomerDashboard() {
//   const navigate = useNavigate();
//   const { user, clearAuth } = useAuthStore();
//   const { isCustomer } = useRoleCheck();

//   // Sidebar state
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   // Data state
//   const [tickets, setTickets] = useState<TicketListItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
//   const [pageNumber, setPageNumber] = useState(1);
//   const [totalCount, setTotalCount] = useState(0);
//   const [stats, setStats] = useState({
//     total: 0,
//     open: 0,
//     inProgress: 0,
//     resolved: 0,
//   });

//   // Modal state
//   const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

//   const pageSize = 10;

//   // Protect route
//   useEffect(() => {
//     if (!user) {
//       navigate('/login');
//       return;
//     }

//     if (!isCustomer()) {
//       navigate('/dashboard');
//       return;
//     }

//     fetchTickets();
//   }, [statusFilter, pageNumber, user, navigate, isCustomer]);

//   const fetchTickets = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       let url = '/tickets/my-tickets';
//       const params = new URLSearchParams({
//         pageNumber: pageNumber.toString(),
//         pageSize: pageSize.toString(),
//       });

//       if (statusFilter !== 'all') {
//         url = `/tickets/by-status/${statusFilter}`;
//       }

//       const fullUrl = `${url}?${params.toString()}`;
//       const response = await apiClient.get(fullUrl);

//       let ticketsData: TicketListItem[] = [];
//       let count = 0;

//       if (response.data?.data) {
//         const paginatedData = response.data.data as PaginatedTicketsResponse;
//         ticketsData = paginatedData.items || [];
//         count = paginatedData.totalCount || 0;
//       } else if (response.data?.items) {
//         ticketsData = response.data.items || [];
//         count = response.data.totalCount || 0;
//       } else if (Array.isArray(response.data)) {
//         ticketsData = response.data;
//         count = ticketsData.length;
//       }

//       setTickets(ticketsData);
//       setTotalCount(count);

//       // Calculate stats
//       setStats({
//         total: count,
//         open: ticketsData.filter((t) => t.status === 1).length,
//         inProgress: ticketsData.filter((t) => t.status === 2).length,
//         resolved: ticketsData.filter((t) => t.status === 3).length,
//       });
//     } catch (err: any) {
//       console.error('Error fetching tickets:', err);
//       const errorMsg =
//         err.response?.data?.message ||
//         err.message ||
//         'Failed to load tickets';
//       setError(errorMsg);
//       setTickets([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     setIsLogoutModalOpen(true);
//   };

//   const confirmLogout = () => {
//     setIsLogoutModalOpen(false);
//     clearAuth();
//     navigate('/login');
//   };

//   const handleViewTicket = (ticketId: string) => {
//     setSelectedTicketId(ticketId);
//     setIsModalOpen(true);
//   };

//   const getPriorityColor = (priority: number): string => {
//     switch (priority) {
//       case 1:
//         return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
//       case 2:
//         return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
//       case 3:
//         return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
//       case 4:
//         return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
//       default:
//         return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
//     }
//   };

//   const getStatusColor = (status: number): string => {
//     switch (status) {
//       case 1:
//         return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800';
//       case 2:
//         return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200 dark:border-orange-800';
//       case 3:
//         return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800';
//       case 4:
//         return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800';
//       case 5:
//         return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
//       default:
//         return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
//     }
//   };

//   const getPriorityBgColor = (priority: number): string => {
//     switch (priority) {
//       case 1:
//         return 'bg-green-50/50 dark:bg-green-950/20';
//       case 2:
//         return 'bg-blue-50/50 dark:bg-blue-950/20';
//       case 3:
//         return 'bg-orange-50/50 dark:bg-orange-950/20';
//       case 4:
//         return 'bg-red-50/50 dark:bg-red-950/20';
//       default:
//         return 'bg-gray-50/50 dark:bg-slate-800/50';
//     }
//   };

//   const getStatusIcon = (status: number) => {
//     switch (status) {
//       case 1:
//         return (
//           <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
//             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
//           </svg>
//         );
//       case 2:
//         return (
//           <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
//             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//           </svg>
//         );
//       case 3:
//         return (
//           <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
//             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//           </svg>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
//       {/* Sidebar Component */}
//       <Sidebar
//         sidebarOpen={sidebarOpen}
//         setSidebarOpen={setSidebarOpen}
//         mobileMenuOpen={mobileMenuOpen}
//         setMobileMenuOpen={setMobileMenuOpen}
//         onLogout={handleLogout}
//       />

//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         {/* Top Header */}
//         <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
//           <div className="flex items-center gap-4">
//             {/* Mobile Menu Button */}
//             <button 
//               onClick={() => setMobileMenuOpen(true)}
//               className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
//             >
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//               </svg>
//             </button>

//             {/* Sidebar Toggle (Desktop) */}
//             <button 
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="hidden lg:flex p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
//               title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
//             >
//               <svg 
//                 className={`w-5 h-5 transition-transform duration-200 ${!sidebarOpen ? 'rotate-180' : ''}`} 
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
//               </svg>
//             </button>

//             <div>
//               <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Support Tickets</h1>
//               <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Track and manage your support requests</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <ThemeToggle />
            
//             {/* Quick Action */}
//             <button
//               onClick={() => navigate('/create-ticket')}
//               className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//               New Ticket
//             </button>
//           </div>
//         </header>

//         {/* Dashboard Content */}
//         <main className="flex-1 overflow-y-auto p-4 lg:p-8">
//           {/* Stats Grid */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//             <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</span>
//                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
//                   <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                   </svg>
//                 </div>
//               </div>
//               <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time requests</p>
//             </div>

//             <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</span>
//                 <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
//                   <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//               </div>
//               <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.open}</p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting response</p>
//             </div>

//             <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</span>
//                 <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
//                   <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                   </svg>
//                 </div>
//               </div>
//               <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Being handled</p>
//             </div>

//             <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</span>
//                 <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
//                   <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//               </div>
//               <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolved}</p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</p>
//             </div>
//           </div>

//           {/* Filters & Actions Bar */}
//           <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 mb-6 shadow-sm">
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//               <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
//                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter:</span>
//                 <button
//                   onClick={() => {
//                     setStatusFilter('all');
//                     setPageNumber(1);
//                   }}
//                   className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
//                     statusFilter === 'all'
//                       ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md'
//                       : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
//                   }`}
//                 >
//                   All
//                 </button>
//                 {[1, 2, 3, 4, 5].map((status) => (
//                   <button
//                     key={status}
//                     onClick={() => {
//                       setStatusFilter(status);
//                       setPageNumber(1);
//                     }}
//                     className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
//                       statusFilter === status
//                         ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md'
//                         : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
//                     }`}
//                   >
//                     {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
//                   </button>
//                 ))}
//               </div>

//               <div className="flex items-center gap-3">
//                 <span className="text-sm text-gray-500 dark:text-gray-400">
//                   Showing <span className="font-semibold text-gray-900 dark:text-white">{tickets.length}</span> of{' '}
//                   <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Loading State */}
//           {loading && (
//             <div className="flex justify-center items-center h-64">
//               <div className="text-center">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//                 <p className="text-gray-600 dark:text-gray-400">Loading your tickets...</p>
//               </div>
//             </div>
//           )}

//           {/* Error State */}
//           {error && !loading && (
//             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
//               <div className="flex items-start">
//                 <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//                 <div>
//                   <h3 className="text-red-900 dark:text-red-100 font-semibold mb-1">Failed to load tickets</h3>
//                   <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
//                   <button 
//                     onClick={fetchTickets}
//                     className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
//                   >
//                     Try again
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Tickets Table */}
//           {!loading && tickets.length > 0 && (
//             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
//                     <tr>
//                       <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                         Ticket
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                         Title
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                         Status
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                         Priority
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                         Created
//                       </th>
//                       <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                         Action
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
//                     {tickets.map((ticket) => (
//                       <tr
//                         key={ticket.id}
//                         className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${getPriorityBgColor(ticket.priority)}`}
//                         onClick={() => handleViewTicket(ticket.id)}
//                       >
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
//                             #{ticket.ticketNumber}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
//                             {ticket.title}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
//                             {getStatusIcon(ticket.status)}
//                             {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
//                             {PRIORITY_LEVELS[ticket.priority as keyof typeof PRIORITY_LEVELS]}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
//                           {new Date(ticket.createdAt).toLocaleDateString('en-US', {
//                             month: 'short',
//                             day: 'numeric',
//                             year: 'numeric',
//                           })}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-right">
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleViewTicket(ticket.id);
//                             }}
//                             className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium text-sm inline-flex items-center gap-1 group"
//                           >
//                             View
//                             <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                             </svg>
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Pagination */}
//               {totalCount > pageSize && (
//                 <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
//                   <p className="text-sm text-gray-600 dark:text-gray-400">
//                     Page <span className="font-medium text-gray-900 dark:text-white">{pageNumber}</span> of{' '}
//                     <span className="font-medium text-gray-900 dark:text-white">{Math.ceil(totalCount / pageSize)}</span>
//                   </p>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
//                       disabled={pageNumber === 1}
//                       className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                       Previous
//                     </button>
//                     <button
//                       onClick={() => setPageNumber(Math.min(Math.ceil(totalCount / pageSize), pageNumber + 1))}
//                       disabled={pageNumber >= Math.ceil(totalCount / pageSize)}
//                       className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                       Next
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Empty State */}
//           {!loading && tickets.length === 0 && !error && (
//             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-12 text-center">
//               <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
//                 {statusFilter === 'all' ? 'No tickets yet' : 'No tickets found'}
//               </h3>
//               <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
//                 {statusFilter === 'all' 
//                   ? "You haven't created any support tickets yet. Create your first ticket to get help from our support team."
//                   : `No tickets with status "${STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS]}" found.`}
//               </p>
//               <button
//                 onClick={() => navigate('/create-ticket')}
//                 className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                 </svg>
//                 Create Your First Ticket
//               </button>
//             </div>
//           )}
//         </main>
//       </div>

//       {/* Ticket Detail Modal */}
//       <TicketDetailModal
//         ticketId={selectedTicketId || ''}
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setSelectedTicketId(null);
//         }}
//       />

//       {/* Logout Confirmation Modal */}
//       {isLogoutModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
//           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700 transform transition-all">
//             <div className="p-6">
//               <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Confirm Logout</h3>
//               <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
//                 Are you sure you want to log out? You'll need to sign in again to access your tickets.
//               </p>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setIsLogoutModalOpen(false)}
//                   className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={confirmLogout}
//                   className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-colors shadow-sm"
//                 >
//                   Logout
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
