// src/pages/technician/TechnicianDashboard.tsx

import { useEffect, useState } from 'react';
import {
  getAssignedTickets,
  updateTicketStatus,
  addCommentToTicket,
  submitTicketReport,
} from '../../services/technicianApi';
import { downloadTicketPdf } from '../../services/ticketApi';
import {
  Zap,
  AlertCircle,
  Clock,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  Download,
  FileText,
  ClipboardList,
  X,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';

type TechnicianDashboardView = 'overview' | 'assigned';

interface TechnicianDashboardProps {
  view?: TechnicianDashboardView;
}

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
  reopenedTickets: number;
}

interface PaginatedTicketsResponse {
  items: Ticket[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface ReportForm {
  workSummary: string;
  resolutionSteps: string;
  partsUsed: string;
  timeSpent: string;
  recommendations: string;
  isResolved: boolean;
  followUpNotes: string;
}

const emptyReport = (): ReportForm => ({
  workSummary: '',
  resolutionSteps: '',
  partsUsed: '',
  timeSpent: '',
  recommendations: '',
  isResolved: true,
  followUpNotes: '',
});

export default function TechnicianDashboard({ view = 'overview' }: TechnicianDashboardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalAssigned: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    reopenedTickets: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Status change
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Comment
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // PDF
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Report
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState<ReportForm>(emptyReport());
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const showStats = view === 'overview';
  const pageTitle = view === 'assigned' ? 'Assigned Tickets' : 'Work Dashboard';
  const pageSubtitle =
    view === 'assigned'
      ? 'Review and update tickets assigned to you'
      : 'Your assigned tickets and tasks';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAssignedTickets(1, 50);
      if (result.error) { setError(result.error); return; }
      const paginatedData = result.data as PaginatedTicketsResponse | null;
      if (paginatedData?.items && Array.isArray(paginatedData.items)) {
        setTickets(paginatedData.items);
        setStats({
          totalAssigned: paginatedData.items.length,
          openTickets: paginatedData.items.filter((t) => t.status === 1).length,
          inProgressTickets: paginatedData.items.filter((t) => t.status === 2).length,
          resolvedTickets: paginatedData.items.filter((t) => t.status === 3).length,
          reopenedTickets: paginatedData.items.filter((t) => t.status === 4).length,
        });
      }
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Reset all panel state when selecting a ticket
  const selectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowStatusChange(false);
    setShowCommentForm(false);
    setShowReportForm(false);
    setNewStatus('');
    setComment('');
    setReportForm(emptyReport());
    setReportSuccess(false);
    setReportError(null);
    setPdfError(null);
  };

  // PDF download
  const handleDownloadPdf = async () => {
    if (!selectedTicket) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      await downloadTicketPdf(selectedTicket.id);
    } catch (err: any) {
      setPdfError(err?.message ?? 'Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // Status change
  const handleStatusChange = async () => {
    if (!selectedTicket || !newStatus) return;
    try {
      setStatusLoading(true);
      const result = await updateTicketStatus(selectedTicket.id, newStatus);
      if (result.error) { alert('Failed to update status: ' + result.error); return; }
      const statusNumber = getStatusNumber(newStatus);
      setTickets((curr) =>
        curr.map((t) => (t.id === selectedTicket.id ? { ...t, status: statusNumber } : t))
      );
      setSelectedTicket({ ...selectedTicket, status: statusNumber });
      setShowStatusChange(false);
      setNewStatus('');
      await loadDashboardData();
    } catch {
      alert('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!selectedTicket || !comment.trim()) return;
    try {
      setCommentLoading(true);
      const result = await addCommentToTicket(selectedTicket.id, comment);
      if (result.error) { alert('Failed to add comment: ' + result.error); return; }
      const updated = { ...selectedTicket, commentCount: selectedTicket.commentCount + 1 };
      setSelectedTicket(updated);
      setTickets((curr) =>
        curr.map((t) =>
          t.id === selectedTicket.id ? { ...t, commentCount: t.commentCount + 1 } : t
        )
      );
      setComment('');
      setShowCommentForm(false);
    } catch {
      alert('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Submit resolution report
  const handleSubmitReport = async () => {
    if (!selectedTicket) return;
    if (!reportForm.workSummary.trim() || !reportForm.resolutionSteps.trim() || !reportForm.timeSpent.trim()) {
      setReportError('Work summary, resolution steps, and time spent are required.');
      return;
    }
    try {
      setReportLoading(true);
      setReportError(null);
      const result = await submitTicketReport(selectedTicket.id, {
        workSummary: reportForm.workSummary,
        resolutionSteps: reportForm.resolutionSteps,
        partsUsed: reportForm.partsUsed || undefined,
        timeSpent: reportForm.timeSpent,
        recommendations: reportForm.recommendations || undefined,
        isResolved: reportForm.isResolved,
        followUpNotes: reportForm.followUpNotes || undefined,
      });
      if (result.error) { setReportError(result.error); return; }
      setReportSuccess(true);
      setShowReportForm(false);
      setReportForm(emptyReport());
    } catch {
      setReportError('Failed to submit report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  // Helpers
  const getStatusColor = (status: number) => {
    const map: Record<number, string> = {
      1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      4: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      5: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return map[status] ?? map[5];
  };

  const getStatusLabel = (status: number) => {
    const map: Record<number, string> = {
      1: 'Open', 2: 'In Progress', 3: 'Resolved', 4: 'Reopened', 5: 'Closed',
    };
    return map[status] ?? 'Unknown';
  };

  const getStatusNumber = (label: string) => {
    const map: Record<string, number> = {
      'Open': 1, 'In Progress': 2, 'Resolved': 3, 'Reopened': 4, 'Closed': 5,
    };
    return map[label] ?? 1;
  };

  const getPriorityBadge = (priority: number) => {
    const map: Record<number, { label: string; color: string }> = {
      1: { label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      3: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
      4: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    return map[priority] ?? map[2];
  };

  const filteredTickets = activeFilter
    ? tickets.filter((t) => t.status === getStatusNumber(activeFilter))
    : tickets;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
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
                {pageTitle}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{pageSubtitle}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Assigned', value: stats.totalAssigned, icon: <Zap size={20} />, color: 'text-blue-600' },
              { label: 'Open', value: stats.openTickets, icon: <AlertCircle size={20} />, color: 'text-red-600' },
              { label: 'In Progress', value: stats.inProgressTickets, icon: <Clock size={20} />, color: 'text-amber-600' },
              { label: 'Resolved', value: stats.resolvedTickets, icon: <CheckCircle size={20} />, color: 'text-emerald-600' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                  <span className={color}>{icon}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Ticket list */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp size={24} />
                My Work Queue
              </h2>

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { label: 'All', value: null, count: stats.totalAssigned, activeClass: 'bg-blue-600' },
                  { label: 'Open', value: 'Open', count: stats.openTickets, activeClass: 'bg-red-600' },
                  { label: 'In Progress', value: 'In Progress', count: stats.inProgressTickets, activeClass: 'bg-amber-600' },
                  { label: 'Resolved', value: 'Resolved', count: stats.resolvedTickets, activeClass: 'bg-emerald-600' },
                  { label: 'Reopened', value: 'Reopened', count: stats.reopenedTickets, activeClass: 'bg-purple-600' },
                ].map((filter) => (
                  <button
                    key={filter.label}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      activeFilter === filter.value
                        ? `${filter.activeClass} text-white`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {activeFilter ? `No ${activeFilter.toLowerCase()} tickets` : 'No tickets assigned yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => selectTicket(ticket)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedTicket?.id === ticket.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 shadow-md'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {ticket.ticketNumber}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                              {getStatusLabel(ticket.status)}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityBadge(ticket.priority).color}`}>
                              {getPriorityBadge(ticket.priority).label}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {ticket.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Created by: {ticket.createdByUserName}
                          </p>
                        </div>
                        {ticket.commentCount > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium shrink-0">
                            <MessageSquare size={14} />
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

          {/* Detail panel */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl h-fit overflow-hidden">
            {selectedTicket ? (
              <>
                {/* Panel header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Details</h3>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    {pdfLoading ? (
                      <>
                        <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Download size={13} />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>

                <div className="px-8 pb-8 pt-5 space-y-5 max-h-[80vh] overflow-y-auto">

                  {/* PDF error */}
                  {pdfError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span className="flex-1">{pdfError}</span>
                      <button onClick={() => setPdfError(null)}><X size={13} /></button>
                    </div>
                  )}

                  {/* Ticket fields */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">Ticket ID</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedTicket.ticketNumber}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">Title</p>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedTicket.title}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(selectedTicket.status)}`}>
                        {getStatusLabel(selectedTicket.status)}
                      </span>
                      {selectedTicket.status !== 5 && (
                        <button
                          onClick={() => { setShowStatusChange(!showStatusChange); setNewStatus(''); }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Change
                        </button>
                      )}
                    </div>

                    {showStatusChange && (
                      <div className="mt-3 space-y-2">
                        {['In Progress', 'Resolved'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setNewStatus(s)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                              newStatus === s
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleStatusChange}
                            disabled={!newStatus || statusLoading}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
                          >
                            {statusLoading ? 'Saving...' : 'Update'}
                          </button>
                          <button
                            onClick={() => { setShowStatusChange(false); setNewStatus(''); }}
                            className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">Priority</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded inline-block ${getPriorityBadge(selectedTicket.priority).color}`}>
                      {getPriorityBadge(selectedTicket.priority).label}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">Created</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedTicket.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">Description</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Comment section */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                        Comments ({selectedTicket.commentCount})
                      </p>
                      <button
                        onClick={() => { setShowCommentForm(!showCommentForm); setShowReportForm(false); }}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        <MessageSquare size={12} />
                        {showCommentForm ? 'Cancel' : 'Add'}
                      </button>
                    </div>

                    {showCommentForm && (
                      <div className="space-y-2">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add your work update..."
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
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

                  {/* Resolution Report section */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <button
                      onClick={() => {
                        setShowReportForm(!showReportForm);
                        setShowCommentForm(false);
                        setReportError(null);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 transition-all font-medium text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <ClipboardList size={16} />
                        {reportSuccess ? 'Report Submitted ✓' : 'Submit Resolution Report'}
                      </div>
                      {showReportForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {reportSuccess && !showReportForm && (
                      <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 text-center">
                        Your report has been sent to the team lead.
                      </p>
                    )}

                    {showReportForm && (
                      <div className="mt-4 space-y-4">

                        {reportError && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <span className="flex-1">{reportError}</span>
                            <button onClick={() => setReportError(null)}><X size={13} /></button>
                          </div>
                        )}

                        {/* Work Summary */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Work Summary <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={reportForm.workSummary}
                            onChange={(e) => setReportForm({ ...reportForm, workSummary: e.target.value })}
                            placeholder="Describe the work performed..."
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm"
                            rows={3}
                          />
                        </div>

                        {/* Resolution Steps */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Resolution Steps <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={reportForm.resolutionSteps}
                            onChange={(e) => setReportForm({ ...reportForm, resolutionSteps: e.target.value })}
                            placeholder="Steps taken to resolve the issue..."
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm"
                            rows={3}
                          />
                        </div>

                        {/* Time Spent */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Time Spent <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={reportForm.timeSpent}
                            onChange={(e) => setReportForm({ ...reportForm, timeSpent: e.target.value })}
                            placeholder="e.g. 2h 30m"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                          />
                        </div>

                        {/* Parts Used */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Parts / Tools Used{' '}
                            <span className="text-gray-400 font-normal normal-case">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={reportForm.partsUsed}
                            onChange={(e) => setReportForm({ ...reportForm, partsUsed: e.target.value })}
                            placeholder="e.g. Replacement HDD, thermal paste..."
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                          />
                        </div>

                        {/* Recommendations */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Recommendations{' '}
                            <span className="text-gray-400 font-normal normal-case">(optional)</span>
                          </label>
                          <textarea
                            value={reportForm.recommendations}
                            onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })}
                            placeholder="Suggestions to prevent recurrence..."
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm"
                            rows={2}
                          />
                        </div>

                        {/* Resolution toggle */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <button
                            onClick={() => setReportForm({ ...reportForm, isResolved: !reportForm.isResolved })}
                            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                              reportForm.isResolved ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                reportForm.isResolved ? 'translate-x-5' : ''
                              }`}
                            />
                          </button>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {reportForm.isResolved ? 'Fully Resolved' : 'Requires Follow-up'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {reportForm.isResolved
                                ? 'Issue is completely resolved'
                                : 'Additional work is needed'}
                            </p>
                          </div>
                        </div>

                        {/* Follow-up notes (conditional) */}
                        {!reportForm.isResolved && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                              Follow-up Notes
                            </label>
                            <textarea
                              value={reportForm.followUpNotes}
                              onChange={(e) => setReportForm({ ...reportForm, followUpNotes: e.target.value })}
                              placeholder="Describe what still needs to be done..."
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm"
                              rows={2}
                            />
                          </div>
                        )}

                        {/* Submit buttons */}
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => {
                              setShowReportForm(false);
                              setReportError(null);
                              setReportForm(emptyReport());
                            }}
                            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSubmitReport}
                            disabled={reportLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors font-medium text-sm"
                          >
                            {reportLoading ? (
                              <>
                                <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                                Submitting…
                              </>
                            ) : (
                              <>
                                <Send size={14} />
                                Submit Report
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 px-8">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





// // src/pages/technician/TechnicianDashboard.tsx

// import { useEffect, useState } from 'react';
// import {
//   getAssignedTickets,
//   updateTicketStatus,
//   addCommentToTicket,
// } from '../../services/technicianApi';
// import { Zap, AlertCircle, Clock, CheckCircle, MessageSquare, TrendingUp } from 'lucide-react';

// type TechnicianDashboardView = 'overview' | 'assigned';

// interface TechnicianDashboardProps {
//   view?: TechnicianDashboardView;
// }

// interface Ticket {
//   id: string;
//   ticketNumber: string;
//   title: string;
//   description: string;
//   status: number;
//   priority: number;
//   createdAt: string;
//   createdByUserName: string;
//   assignedByUserName?: string;
//   commentCount: number;
// }

// interface DashboardStats {
//   totalAssigned: number;
//   openTickets: number;
//   inProgressTickets: number;
//   resolvedTickets: number;
//   reopenedTickets: number;
// }

// interface PaginatedTicketsResponse {
//   items: Ticket[];
//   totalCount: number;
//   pageNumber: number;
//   pageSize: number;
// }

// export default function TechnicianDashboard({ view = 'overview' }: TechnicianDashboardProps) {
//   const [tickets, setTickets] = useState<Ticket[]>([]);
//   const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
//   const [stats, setStats] = useState<DashboardStats>({
//     totalAssigned: 0,
//     openTickets: 0,
//     inProgressTickets: 0,
//     resolvedTickets: 0,
//     reopenedTickets: 0,
//   });

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showStatusChange, setShowStatusChange] = useState(false);
//   const [showCommentForm, setShowCommentForm] = useState(false);
//   const [comment, setComment] = useState('');
//   const [commentLoading, setCommentLoading] = useState(false);
//   const [statusLoading, setStatusLoading] = useState(false);
//   const [newStatus, setNewStatus] = useState('');
//   const [activeFilter, setActiveFilter] = useState<string | null>(null);

//   const showStats = view === 'overview';

//   const pageTitle = view === 'assigned' ? 'Assigned Tickets' : 'Work Dashboard';
//   const pageSubtitle =
//     view === 'assigned'
//       ? 'Review and update tickets assigned to you'
//       : 'Your assigned tickets and tasks';

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const result = await getAssignedTickets(1, 50);

//       if (result.error) {
//         setError(result.error);
//         return;
//       }

//       const paginatedData = result.data as PaginatedTicketsResponse | null;

//       if (paginatedData?.items && Array.isArray(paginatedData.items)) {
//         setTickets(paginatedData.items);

//         setStats({
//           totalAssigned: paginatedData.items.length,
//           openTickets: paginatedData.items.filter((t) => t.status === 1).length,
//           inProgressTickets: paginatedData.items.filter((t) => t.status === 2).length,
//           resolvedTickets: paginatedData.items.filter((t) => t.status === 3).length,
//           reopenedTickets: paginatedData.items.filter((t) => t.status === 4).length,
//         });
//       }
//     } catch (err) {
//       console.error('Error loading dashboard:', err);
//       setError('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusChange = async () => {
//     if (!selectedTicket || !newStatus) return;

//     try {
//       setStatusLoading(true);

//       const result = await updateTicketStatus(selectedTicket.id, newStatus);

//       if (result.error) {
//         alert('Failed to update status: ' + result.error);
//         return;
//       }

//       const statusNumber = getStatusNumber(newStatus);

//       setTickets((currentTickets) =>
//         currentTickets.map((ticket) =>
//           ticket.id === selectedTicket.id ? { ...ticket, status: statusNumber } : ticket
//         )
//       );

//       setSelectedTicket({
//         ...selectedTicket,
//         status: statusNumber,
//       });

//       setShowStatusChange(false);
//       setNewStatus('');

//       await loadDashboardData();
//     } catch (err) {
//       alert('Failed to update status');
//     } finally {
//       setStatusLoading(false);
//     }
//   };

//   const handleAddComment = async () => {
//     if (!selectedTicket || !comment.trim()) return;

//     try {
//       setCommentLoading(true);

//       const result = await addCommentToTicket(selectedTicket.id, comment);

//       if (result.error) {
//         alert('Failed to add comment: ' + result.error);
//         return;
//       }

//       setSelectedTicket({
//         ...selectedTicket,
//         commentCount: selectedTicket.commentCount + 1,
//       });

//       setTickets((currentTickets) =>
//         currentTickets.map((ticket) =>
//           ticket.id === selectedTicket.id
//             ? { ...ticket, commentCount: ticket.commentCount + 1 }
//             : ticket
//         )
//       );

//       setComment('');
//       setShowCommentForm(false);
//     } catch (err) {
//       alert('Failed to add comment');
//     } finally {
//       setCommentLoading(false);
//     }
//   };

//   const getStatusColor = (status: number) => {
//     switch (status) {
//       case 1:
//         return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
//       case 2:
//         return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
//       case 3:
//         return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
//       case 4:
//         return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
//       case 5:
//         return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
//       default:
//         return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
//     }
//   };

//   const getStatusLabel = (status: number) => {
//     switch (status) {
//       case 1:
//         return 'Open';
//       case 2:
//         return 'In Progress';
//       case 3:
//         return 'Resolved';
//       case 4:
//         return 'Reopened';
//       case 5:
//         return 'Closed';
//       default:
//         return 'Unknown';
//     }
//   };

//   const getStatusNumber = (label: string) => {
//     switch (label) {
//       case 'Open':
//         return 1;
//       case 'In Progress':
//         return 2;
//       case 'Resolved':
//         return 3;
//       case 'Reopened':
//         return 4;
//       case 'Closed':
//         return 5;
//       default:
//         return 1;
//     }
//   };

//   const getPriorityBadge = (priority: number) => {
//     const badges = {
//       1: { label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
//       2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
//       3: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
//       4: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
//     };

//     return badges[priority as keyof typeof badges] || badges[2];
//   };

//   const filteredTickets = activeFilter
//     ? tickets.filter((ticket) => ticket.status === getStatusNumber(activeFilter))
//     : tickets;

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
//           <p className="text-gray-600 dark:text-gray-400">Loading your work...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-8">
//       <div className="max-w-6xl mx-auto">
//         <div className="mb-12">
//           <div className="flex items-center gap-4 mb-4">
//             <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl text-white shadow-lg">
//               <Zap size={32} />
//             </div>
//             <div>
//               <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
//                 {pageTitle}
//               </h1>
//               <p className="text-gray-600 dark:text-gray-400 mt-1">{pageSubtitle}</p>
//             </div>
//           </div>
//         </div>

//         {error && (
//           <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2">
//             <AlertCircle size={20} />
//             {error}
//           </div>
//         )}

//         {showStats && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
//             <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
//               <div className="flex items-center justify-between mb-2">
//                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assigned</p>
//                 <Zap size={20} className="text-blue-600" />
//               </div>
//               <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAssigned}</p>
//             </div>

//             <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
//               <div className="flex items-center justify-between mb-2">
//                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
//                 <AlertCircle size={20} className="text-red-600" />
//               </div>
//               <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.openTickets}</p>
//             </div>

//             <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
//               <div className="flex items-center justify-between mb-2">
//                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
//                 <Clock size={20} className="text-amber-600" />
//               </div>
//               <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.inProgressTickets}</p>
//             </div>

//             <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
//               <div className="flex items-center justify-between mb-2">
//                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
//                 <CheckCircle size={20} className="text-emerald-600" />
//               </div>
//               <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.resolvedTickets}</p>
//             </div>
//           </div>
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2">
//             <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                 <TrendingUp size={24} />
//                 My Work Queue
//               </h2>

//               <div className="flex flex-wrap gap-2 mb-6">
//                 {[
//                   { label: 'All', value: null, count: stats.totalAssigned, activeClass: 'bg-blue-600' },
//                   { label: 'Open', value: 'Open', count: stats.openTickets, activeClass: 'bg-red-600' },
//                   { label: 'In Progress', value: 'In Progress', count: stats.inProgressTickets, activeClass: 'bg-amber-600' },
//                   { label: 'Resolved', value: 'Resolved', count: stats.resolvedTickets, activeClass: 'bg-emerald-600' },
//                   { label: 'Reopened', value: 'Reopened', count: stats.reopenedTickets, activeClass: 'bg-purple-600' },
//                 ].map((filter) => (
//                   <button
//                     key={filter.label}
//                     onClick={() => setActiveFilter(filter.value)}
//                     className={`px-4 py-2 rounded-lg font-medium transition-all ${
//                       activeFilter === filter.value
//                         ? `${filter.activeClass} text-white`
//                         : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
//                     }`}
//                   >
//                     {filter.label} ({filter.count})
//                   </button>
//                 ))}
//               </div>

//               {filteredTickets.length === 0 ? (
//                 <div className="text-center py-12">
//                   <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
//                   <p className="text-gray-600 dark:text-gray-400">
//                     {activeFilter ? `No ${activeFilter.toLowerCase()} tickets` : 'No tickets assigned yet'}
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-3 max-h-[600px] overflow-y-auto">
//                   {filteredTickets.map((ticket) => (
//                     <div
//                       key={ticket.id}
//                       onClick={() => {
//                         setSelectedTicket(ticket);
//                         setShowStatusChange(false);
//                         setShowCommentForm(false);
//                         setNewStatus('');
//                       }}
//                       className={`p-4 rounded-xl border transition-all cursor-pointer ${
//                         selectedTicket?.id === ticket.id
//                           ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 shadow-md'
//                           : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
//                       }`}
//                     >
//                       <div className="flex items-start justify-between gap-4">
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 mb-2">
//                             <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
//                               {ticket.ticketNumber}
//                             </span>
//                             <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
//                               {getStatusLabel(ticket.status)}
//                             </span>
//                             <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityBadge(ticket.priority).color}`}>
//                               {getPriorityBadge(ticket.priority).label}
//                             </span>
//                           </div>
//                           <h3 className="font-medium text-gray-900 dark:text-white truncate">
//                             {ticket.title}
//                           </h3>
//                           <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                             Created by: {ticket.createdByUserName}
//                           </p>
//                         </div>

//                         {ticket.commentCount > 0 && (
//                           <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
//                             <MessageSquare size={16} />
//                             {ticket.commentCount}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl h-fit">
//             {selectedTicket ? (
//               <>
//                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Details</h3>

//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Ticket ID</p>
//                     <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedTicket.ticketNumber}</p>
//                   </div>

//                   <div>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Status</p>
//                     <div className="flex items-center gap-2">
//                       <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(selectedTicket.status)}`}>
//                         {getStatusLabel(selectedTicket.status)}
//                       </span>
//                       {selectedTicket.status !== 5 && (
//                         <button
//                           onClick={() => setShowStatusChange(!showStatusChange)}
//                           className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
//                         >
//                           Change
//                         </button>
//                       )}
//                     </div>

//                     {showStatusChange && (
//                       <div className="mt-3 space-y-2">
//                         {['In Progress', 'Resolved'].map((status) => (
//                           <button
//                             key={status}
//                             onClick={() => setNewStatus(status)}
//                             className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
//                               newStatus === status
//                                 ? 'bg-blue-600 text-white'
//                                 : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
//                             }`}
//                           >
//                             {status}
//                           </button>
//                         ))}

//                         <div className="flex gap-2 pt-2">
//                           <button
//                             onClick={handleStatusChange}
//                             disabled={!newStatus || statusLoading}
//                             className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
//                           >
//                             {statusLoading ? 'Saving...' : 'Update'}
//                           </button>
//                           <button
//                             onClick={() => {
//                               setShowStatusChange(false);
//                               setNewStatus('');
//                             }}
//                             className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
//                           >
//                             Cancel
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   <div>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Priority</p>
//                     <span className={`text-xs font-semibold px-2 py-1 rounded inline-block ${getPriorityBadge(selectedTicket.priority).color}`}>
//                       {getPriorityBadge(selectedTicket.priority).label}
//                     </span>
//                   </div>

//                   <div>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Created</p>
//                     <p className="text-sm text-gray-900 dark:text-white">
//                       {new Date(selectedTicket.createdAt).toLocaleDateString('en-US', {
//                         month: 'short',
//                         day: 'numeric',
//                         year: 'numeric',
//                       })}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Comments</p>
//                     <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTicket.commentCount}</p>
//                     <button
//                       onClick={() => setShowCommentForm(!showCommentForm)}
//                       className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
//                     >
//                       {showCommentForm ? 'Cancel' : 'Add Comment'}
//                     </button>

//                     {showCommentForm && (
//                       <div className="mt-3 space-y-2">
//                         <textarea
//                           value={comment}
//                           onChange={(e) => setComment(e.target.value)}
//                           placeholder="Add your work update..."
//                           className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
//                           rows={3}
//                         />
//                         <button
//                           onClick={handleAddComment}
//                           disabled={!comment.trim() || commentLoading}
//                           className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium text-sm"
//                         >
//                           {commentLoading ? 'Posting...' : 'Post Comment'}
//                         </button>
//                       </div>
//                     )}
//                   </div>

//                   <div>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-2 uppercase">Description</p>
//                     <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
//                       {selectedTicket.description}
//                     </p>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div className="text-center py-12">
//                 <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
//                 <p className="text-gray-600 dark:text-gray-400">Select a ticket to view details</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// // // src/pages/technician/TechnicianDashboard.tsx - FIXED TypeScript

// // import { useEffect, useState } from 'react';
// // import { useAuthStore } from '../../store/authStore';
// // import {
// //   getAssignedTickets,
// //   getTicketsByStatus,
// //   updateTicketStatus,
// //   addCommentToTicket,
// // } from '../../services/technicianApi';
// // import { Zap, AlertCircle, Clock, CheckCircle, MessageSquare, TrendingUp } from 'lucide-react';

// // interface Ticket {
// //   id: string;
// //   ticketNumber: string;
// //   title: string;
// //   description: string;
// //   status: number;
// //   priority: number;
// //   createdAt: string;
// //   createdByUserName: string;
// //   assignedByUserName?: string;
// //   commentCount: number;
// // }

// // interface DashboardStats {
// //   totalAssigned: number;
// //   openTickets: number;
// //   inProgressTickets: number;
// //   resolvedTickets: number;
// // }

// // // Define the response type
// // interface PaginatedTicketsResponse {
// //   items: Ticket[];
// //   totalCount: number;
// //   pageNumber: number;
// //   pageSize: number;
// // }

// // export default function TechnicianDashboard() {
// //   const { user } = useAuthStore();

// //   // State
// //   const [tickets, setTickets] = useState<Ticket[]>([]);
// //   const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
// //   const [stats, setStats] = useState<DashboardStats>({
// //     totalAssigned: 0,
// //     openTickets: 0,
// //     inProgressTickets: 0,
// //     resolvedTickets: 0,
// //   });

// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [showStatusChange, setShowStatusChange] = useState(false);
// //   const [showCommentForm, setShowCommentForm] = useState(false);
// //   const [comment, setComment] = useState('');
// //   const [commentLoading, setCommentLoading] = useState(false);
// //   const [statusLoading, setStatusLoading] = useState(false);
// //   const [newStatus, setNewStatus] = useState('');
// //   const [activeFilter, setActiveFilter] = useState<string | null>(null);

// //   // Load initial data
// //   useEffect(() => {
// //     loadDashboardData();
// //   }, []);

// //   const loadDashboardData = async () => {
// //     try {
// //       setLoading(true);
// //       setError(null);

// //       // Type the result explicitly
// //       const result = await getAssignedTickets(1, 50);

// //       if (result.error) {
// //         setError(result.error);
// //         return;
// //       }

// //       //Cast the data to the correct type
// //       const paginatedData = result.data as PaginatedTicketsResponse | null;

// //       if (paginatedData?.items && Array.isArray(paginatedData.items)) {
// //         setTickets(paginatedData.items);

// //         // Calculate stats
// //         const open = paginatedData.items.filter((t: Ticket) => t.status === 1).length;
// //         const inProgress = paginatedData.items.filter((t: Ticket) => t.status === 2).length;
// //         const resolved = paginatedData.items.filter((t: Ticket) => t.status === 3).length;

// //         setStats({
// //           totalAssigned: paginatedData.items.length,
// //           openTickets: open,
// //           inProgressTickets: inProgress,
// //           resolvedTickets: resolved,
// //         });
// //       }
// //     } catch (err) {
// //       console.error('Error loading dashboard:', err);
// //       setError('Failed to load dashboard data');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleStatusChange = async () => {
// //     if (!selectedTicket || !newStatus) return;

// //     try {
// //       setStatusLoading(true);

// //       const result = await updateTicketStatus(selectedTicket.id, newStatus);

// //       if (result.error) {
// //         alert('Failed to update status: ' + result.error);
// //         return;
// //       }

// //       // Update ticket in list
// //       const updatedTickets = tickets.map((t) =>
// //         t.id === selectedTicket.id
// //           ? { ...t, status: getStatusNumber(newStatus) }
// //           : t
// //       );
// //       setTickets(updatedTickets);

// //       // Update selected ticket
// //       setSelectedTicket({
// //         ...selectedTicket,
// //         status: getStatusNumber(newStatus),
// //       });

// //       setShowStatusChange(false);
// //       setNewStatus('');
      
// //       // Reload stats
// //       await loadDashboardData();
// //     } catch (err) {
// //       alert('Failed to update status');
// //     } finally {
// //       setStatusLoading(false);
// //     }
// //   };

// //   const handleAddComment = async () => {
// //     if (!selectedTicket || !comment.trim()) return;

// //     try {
// //       setCommentLoading(true);

// //       const result = await addCommentToTicket(selectedTicket.id, comment);

// //       if (result.error) {
// //         alert('Failed to add comment: ' + result.error);
// //         return;
// //       }

// //       // Update comment count
// //       setSelectedTicket({
// //         ...selectedTicket,
// //         commentCount: selectedTicket.commentCount + 1,
// //       });

// //       setComment('');
// //       setShowCommentForm(false);
// //     } catch (err) {
// //       alert('Failed to add comment');
// //     } finally {
// //       setCommentLoading(false);
// //     }
// //   };

// //   const getStatusColor = (status: number) => {
// //     switch (status) {
// //       case 1:
// //         return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
// //       case 2:
// //         return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
// //       case 3:
// //         return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
// //       case 4:
// //         return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
// //       default:
// //         return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
// //     }
// //   };

// //   const getStatusLabel = (status: number) => {
// //     switch (status) {
// //       case 1:
// //         return 'Open';
// //       case 2:
// //         return 'In Progress';
// //       case 3:
// //         return 'Resolved';
// //       case 4:
// //         return 'Closed';
// //       default:
// //         return 'Unknown';
// //     }
// //   };

// //   const getStatusNumber = (label: string) => {
// //     switch (label) {
// //       case 'Open':
// //         return 1;
// //       case 'In Progress':
// //         return 2;
// //       case 'Resolved':
// //         return 3;
// //       case 'Closed':
// //         return 4;
// //       default:
// //         return 1;
// //     }
// //   };

// //   const getPriorityBadge = (priority: number) => {
// //     const badges = {
// //       1: { label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
// //       2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
// //       3: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
// //       4: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
// //     };
// //     return badges[priority as keyof typeof badges] || badges[2];
// //   };

// //   const filteredTickets = activeFilter
// //     ? tickets.filter((t) => t.status === getStatusNumber(activeFilter))
// //     : tickets;

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
// //           <p className="text-gray-600 dark:text-gray-400">Loading your work...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-8">
// //       <div className="max-w-6xl mx-auto">
// //         {/* Header */}
// //         <div className="mb-12">
// //           <div className="flex items-center gap-4 mb-4">
// //             <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl text-white shadow-lg">
// //               <Zap size={32} />
// //             </div>
// //             <div>
// //               <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
// //                 Work Dashboard
// //               </h1>
// //               <p className="text-gray-600 dark:text-gray-400 mt-1">Your assigned tickets and tasks</p>
// //             </div>
// //           </div>
// //         </div>

// //         {error && (
// //           <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2">
// //             <AlertCircle size={20} />
// //             {error}
// //           </div>
// //         )}

// //         {/* Stats Cards */}
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
// //           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
// //             <div className="flex items-center justify-between mb-2">
// //               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assigned</p>
// //               <Zap size={20} className="text-blue-600" />
// //             </div>
// //             <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAssigned}</p>
// //           </div>

// //           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
// //             <div className="flex items-center justify-between mb-2">
// //               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
// //               <AlertCircle size={20} className="text-red-600" />
// //             </div>
// //             <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.openTickets}</p>
// //           </div>

// //           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
// //             <div className="flex items-center justify-between mb-2">
// //               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
// //               <Clock size={20} className="text-amber-600" />
// //             </div>
// //             <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.inProgressTickets}</p>
// //           </div>

// //           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
// //             <div className="flex items-center justify-between mb-2">
// //               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
// //               <CheckCircle size={20} className="text-emerald-600" />
// //             </div>
// //             <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.resolvedTickets}</p>
// //           </div>
// //         </div>

// //         {/* Main Content */}
// //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// //           {/* Tickets List */}
// //           <div className="lg:col-span-2">
// //             <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
// //               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
// //                 <TrendingUp size={24} />
// //                 My Work Queue
// //               </h2>

// //               {/* Filter Buttons */}
// //               <div className="flex flex-wrap gap-2 mb-6">
// //                 <button
// //                   onClick={() => setActiveFilter(null)}
// //                   className={`px-4 py-2 rounded-lg font-medium transition-all ${
// //                     activeFilter === null
// //                       ? 'bg-blue-600 text-white'
// //                       : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
// //                   }`}
// //                 >
// //                   All ({stats.totalAssigned})
// //                 </button>
// //                 <button
// //                   onClick={() => setActiveFilter('Open')}
// //                   className={`px-4 py-2 rounded-lg font-medium transition-all ${
// //                     activeFilter === 'Open'
// //                       ? 'bg-red-600 text-white'
// //                       : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
// //                   }`}
// //                 >
// //                   Open ({stats.openTickets})
// //                 </button>
// //                 <button
// //                   onClick={() => setActiveFilter('In Progress')}
// //                   className={`px-4 py-2 rounded-lg font-medium transition-all ${
// //                     activeFilter === 'In Progress'
// //                       ? 'bg-amber-600 text-white'
// //                       : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
// //                   }`}
// //                 >
// //                   In Progress ({stats.inProgressTickets})
// //                 </button>
// //                 <button
// //                   onClick={() => setActiveFilter('Resolved')}
// //                   className={`px-4 py-2 rounded-lg font-medium transition-all ${
// //                     activeFilter === 'Resolved'
// //                       ? 'bg-emerald-600 text-white'
// //                       : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
// //                   }`}
// //                 >
// //                   Resolved ({stats.resolvedTickets})
// //                 </button>
// //               </div>

// //               {filteredTickets.length === 0 ? (
// //                 <div className="text-center py-12">
// //                   <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
// //                   <p className="text-gray-600 dark:text-gray-400">
// //                     {activeFilter
// //                       ? `No ${activeFilter.toLowerCase()} tickets`
// //                       : 'No tickets assigned yet'}
// //                   </p>
// //                 </div>
// //               ) : (
// //                 <div className="space-y-3 max-h-[600px] overflow-y-auto">
// //                   {filteredTickets.map((ticket) => (
// //                     <div
// //                       key={ticket.id}
// //                       onClick={() => setSelectedTicket(ticket)}
// //                       className={`p-4 rounded-xl border transition-all cursor-pointer ${
// //                         selectedTicket?.id === ticket.id
// //                           ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 shadow-md'
// //                           : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
// //                       }`}
// //                     >
// //                       <div className="flex items-start justify-between gap-4">
// //                         <div className="flex-1 min-w-0">
// //                           <div className="flex items-center gap-2 mb-2">
// //                             <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
// //                               {ticket.ticketNumber}
// //                             </span>
// //                             <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
// //                               {getStatusLabel(ticket.status)}
// //                             </span>
// //                             <span
// //                               className={`text-xs font-semibold px-2 py-1 rounded ${
// //                                 getPriorityBadge(ticket.priority).color
// //                               }`}
// //                             >
// //                               {getPriorityBadge(ticket.priority).label}
// //                             </span>
// //                           </div>
// //                           <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
// //                             {ticket.title}
// //                           </h3>
// //                           <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
// //                             Created by: {ticket.createdByUserName}
// //                           </p>
// //                         </div>
// //                         {ticket.commentCount > 0 && (
// //                           <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
// //                             <MessageSquare size={16} />
// //                             {ticket.commentCount}
// //                           </div>
// //                         )}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}
// //             </div>
// //           </div>

// //           {/* Ticket Details */}
// //           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl h-fit">
// //             {selectedTicket ? (
// //               <>
// //                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Details</h3>

// //                 <div className="space-y-4">
// //                   <div>
// //                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Ticket ID</p>
// //                     <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedTicket.ticketNumber}</p>
// //                   </div>

// //                   <div>
// //                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Status</p>
// //                     <div className="flex items-center gap-2">
// //                       <span
// //                         className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(
// //                           selectedTicket.status
// //                         )}`}
// //                       >
// //                         {getStatusLabel(selectedTicket.status)}
// //                       </span>
// //                       <button
// //                         onClick={() => setShowStatusChange(!showStatusChange)}
// //                         className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
// //                       >
// //                         Change
// //                       </button>
// //                     </div>

// //                     {showStatusChange && (
// //                       <div className="mt-3 space-y-2">
// //                         {['Open', 'In Progress', 'Resolved'].map((status) => (
// //                           <button
// //                             key={status}
// //                             onClick={() => setNewStatus(status)}
// //                             className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
// //                               newStatus === status
// //                                 ? 'bg-blue-600 text-white'
// //                                 : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
// //                             }`}
// //                           >
// //                             {status}
// //                           </button>
// //                         ))}
// //                         <div className="flex gap-2 pt-2">
// //                           <button
// //                             onClick={handleStatusChange}
// //                             disabled={!newStatus || statusLoading}
// //                             className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
// //                           >
// //                             {statusLoading ? 'Saving...' : 'Update'}
// //                           </button>
// //                           <button
// //                             onClick={() => {
// //                               setShowStatusChange(false);
// //                               setNewStatus('');
// //                             }}
// //                             className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
// //                           >
// //                             Cancel
// //                           </button>
// //                         </div>
// //                       </div>
// //                     )}
// //                   </div>

// //                   <div>
// //                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Priority</p>
// //                     <span
// //                       className={`text-xs font-semibold px-2 py-1 rounded inline-block ${
// //                         getPriorityBadge(selectedTicket.priority).color
// //                       }`}
// //                     >
// //                       {getPriorityBadge(selectedTicket.priority).label}
// //                     </span>
// //                   </div>

// //                   <div>
// //                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Created</p>
// //                     <p className="text-sm text-gray-900 dark:text-white">
// //                       {new Date(selectedTicket.createdAt).toLocaleDateString('en-US', {
// //                         month: 'short',
// //                         day: 'numeric',
// //                         year: 'numeric',
// //                       })}
// //                     </p>
// //                   </div>

// //                   <div>
// //                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase">Comments</p>
// //                     <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTicket.commentCount}</p>
// //                     <button
// //                       onClick={() => setShowCommentForm(!showCommentForm)}
// //                       className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
// //                     >
// //                       {showCommentForm ? 'Cancel' : 'Add Comment'}
// //                     </button>

// //                     {showCommentForm && (
// //                       <div className="mt-3 space-y-2">
// //                         <textarea
// //                           value={comment}
// //                           onChange={(e) => setComment(e.target.value)}
// //                           placeholder="Add your work update..."
// //                           className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
// //                           rows={3}
// //                         />
// //                         <button
// //                           onClick={handleAddComment}
// //                           disabled={!comment.trim() || commentLoading}
// //                           className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium text-sm"
// //                         >
// //                           {commentLoading ? 'Posting...' : 'Post Comment'}
// //                         </button>
// //                       </div>
// //                     )}
// //                   </div>

// //                   <div>
// //                     <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-2 uppercase">Description</p>
// //                     <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
// //                       {selectedTicket.description}
// //                     </p>
// //                   </div>
// //                 </div>
// //               </>
// //             ) : (
// //               <div className="text-center py-12">
// //                 <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
// //                 <p className="text-gray-600 dark:text-gray-400">Select a ticket to view details</p>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }





