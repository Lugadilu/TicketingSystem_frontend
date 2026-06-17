// src/pages/customer/CustomerDashboard.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRoleCheck } from '../../hooks/useRoleCheck';
import TicketDetailModal from '../../components/TicketDetailModal';
import type { TicketListItem, PaginatedTicketsResponse } from '../../types';
import { PRIORITY_LEVELS } from '../../types';
import apiClient from '../../services/api';
import { Smartphone } from 'lucide-react';

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
      case 1: return 'Open';
      case 2: return 'In Progress';
      case 3: return 'Resolved';
      case 4: return 'Reopened';
      case 5: return 'Closed';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number): string => {
    switch (status) {
      case 1: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 2: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 3: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800';
      case 4: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 5: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 3: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityBgColor = (priority: number): string => {
    switch (priority) {
      case 1: return 'bg-green-50/50 dark:bg-green-950/20';
      case 2: return 'bg-blue-50/50 dark:bg-blue-950/20';
      case 3: return 'bg-orange-50/50 dark:bg-orange-950/20';
      case 4: return 'bg-red-50/50 dark:bg-red-950/20';
      default: return 'bg-gray-50/50 dark:bg-slate-800/50';
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

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your support requests
          </p>
        </div>

        {/* Button group — New Ticket + Pay with M-Pesa */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/create-ticket')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </button>

          <button
            onClick={() => navigate('/mpesa/pay')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <Smartphone className="w-4 h-4" />
            Pay with M-Pesa
          </button>
        </div>
      </div>

      {/* ── Stats cards ────────────────────────────────────────────────────── */}
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

      {/* ── Filters bar ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter:</span>

            <button
              onClick={() => { setStatusFilter('all'); setPageNumber(1); }}
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
                onClick={() => { setStatusFilter(status); setPageNumber(1); }}
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

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your tickets...</p>
          </div>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────────── */}
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

      {/* ── Tickets table ──────────────────────────────────────────────────── */}
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
                        onClick={(e) => { e.stopPropagation(); handleViewTicket(ticket.id); }}
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

      {/* ── Empty state ────────────────────────────────────────────────────── */}
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




