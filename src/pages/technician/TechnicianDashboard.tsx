// src/pages/technician/TechnicianDashboard.tsx - FIXED TypeScript

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  getAssignedTickets,
  getTicketsByStatus,
  updateTicketStatus,
  addCommentToTicket,
} from '../../services/technicianApi';
import { Zap, AlertCircle, Clock, CheckCircle, MessageSquare, TrendingUp } from 'lucide-react';

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: number;
  priority: number;
  createdAt: string;
  createdByUserName: string;
  assignedByUserName?: string;
  commentCount: number;
}

interface DashboardStats {
  totalAssigned: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}

// Define the response type
interface PaginatedTicketsResponse {
  items: Ticket[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export default function TechnicianDashboard() {
  const { user } = useAuthStore();

  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalAssigned: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Type the result explicitly
      const result = await getAssignedTickets(1, 50);

      if (result.error) {
        setError(result.error);
        return;
      }

      //Cast the data to the correct type
      const paginatedData = result.data as PaginatedTicketsResponse | null;

      if (paginatedData?.items && Array.isArray(paginatedData.items)) {
        setTickets(paginatedData.items);

        // Calculate stats
        const open = paginatedData.items.filter((t: Ticket) => t.status === 1).length;
        const inProgress = paginatedData.items.filter((t: Ticket) => t.status === 2).length;
        const resolved = paginatedData.items.filter((t: Ticket) => t.status === 3).length;

        setStats({
          totalAssigned: paginatedData.items.length,
          openTickets: open,
          inProgressTickets: inProgress,
          resolvedTickets: resolved,
        });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedTicket || !newStatus) return;

    try {
      setStatusLoading(true);

      const result = await updateTicketStatus(selectedTicket.id, newStatus);

      if (result.error) {
        alert('Failed to update status: ' + result.error);
        return;
      }

      // Update ticket in list
      const updatedTickets = tickets.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, status: getStatusNumber(newStatus) }
          : t
      );
      setTickets(updatedTickets);

      // Update selected ticket
      setSelectedTicket({
        ...selectedTicket,
        status: getStatusNumber(newStatus),
      });

      setShowStatusChange(false);
      setNewStatus('');
      
      // Reload stats
      await loadDashboardData();
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !comment.trim()) return;

    try {
      setCommentLoading(true);

      const result = await addCommentToTicket(selectedTicket.id, comment);

      if (result.error) {
        alert('Failed to add comment: ' + result.error);
        return;
      }

      // Update comment count
      setSelectedTicket({
        ...selectedTicket,
        commentCount: selectedTicket.commentCount + 1,
      });

      setComment('');
      setShowCommentForm(false);
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 2:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 3:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 4:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
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
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const getStatusNumber = (label: string) => {
    switch (label) {
      case 'Open':
        return 1;
      case 'In Progress':
        return 2;
      case 'Resolved':
        return 3;
      case 'Closed':
        return 4;
      default:
        return 1;
    }
  };

  const getPriorityBadge = (priority: number) => {
    const badges = {
      1: { label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      3: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
      4: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    return badges[priority as keyof typeof badges] || badges[2];
  };

  const filteredTickets = activeFilter
    ? tickets.filter((t) => t.status === getStatusNumber(activeFilter))
    : tickets;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your work...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl text-white shadow-lg">
              <Zap size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Work Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your assigned tickets and tasks</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assigned</p>
              <Zap size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAssigned}</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.openTickets}</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <Clock size={20} className="text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.inProgressTickets}</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.resolvedTickets}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tickets List */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp size={24} />
                My Work Queue
              </h2>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeFilter === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All ({stats.totalAssigned})
                </button>
                <button
                  onClick={() => setActiveFilter('Open')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeFilter === 'Open'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Open ({stats.openTickets})
                </button>
                <button
                  onClick={() => setActiveFilter('In Progress')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeFilter === 'In Progress'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  In Progress ({stats.inProgressTickets})
                </button>
                <button
                  onClick={() => setActiveFilter('Resolved')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeFilter === 'Resolved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Resolved ({stats.resolvedTickets})
                </button>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {activeFilter
                      ? `No ${activeFilter.toLowerCase()} tickets`
                      : 'No tickets assigned yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedTicket?.id === ticket.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 shadow-md'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {ticket.ticketNumber}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                              {getStatusLabel(ticket.status)}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                getPriorityBadge(ticket.priority).color
                              }`}
                            >
                              {getPriorityBadge(ticket.priority).label}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {ticket.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Created by: {ticket.createdByUserName}
                          </p>
                        </div>
                        {ticket.commentCount > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                            <MessageSquare size={16} />
                            {ticket.commentCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl h-fit">
            {selectedTicket ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Details</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Ticket ID</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedTicket.ticketNumber}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Status</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(
                          selectedTicket.status
                        )}`}
                      >
                        {getStatusLabel(selectedTicket.status)}
                      </span>
                      <button
                        onClick={() => setShowStatusChange(!showStatusChange)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    {showStatusChange && (
                      <div className="mt-3 space-y-2">
                        {['Open', 'In Progress', 'Resolved'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setNewStatus(status)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                              newStatus === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleStatusChange}
                            disabled={!newStatus || statusLoading}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
                          >
                            {statusLoading ? 'Saving...' : 'Update'}
                          </button>
                          <button
                            onClick={() => {
                              setShowStatusChange(false);
                              setNewStatus('');
                            }}
                            className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Priority</p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded inline-block ${
                        getPriorityBadge(selectedTicket.priority).color
                      }`}
                    >
                      {getPriorityBadge(selectedTicket.priority).label}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Created</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedTicket.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Comments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTicket.commentCount}</p>
                    <button
                      onClick={() => setShowCommentForm(!showCommentForm)}
                      className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      {showCommentForm ? 'Cancel' : 'Add Comment'}
                    </button>

                    {showCommentForm && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add your work update..."
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                          rows={3}
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={!comment.trim() || commentLoading}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium text-sm"
                        >
                          {commentLoading ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-2 uppercase">Description</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





