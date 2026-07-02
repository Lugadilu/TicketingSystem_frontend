// src/pages/support/SupportDashboard.tsx

import { useEffect, useState } from 'react';
import {
  getAllTickets,
  updateTicketStatus,
  assignTicket,
  getAllUsers,
} from '../../services/supportApi';
import {
  downloadTicketPdf,
  downloadTicketWithReportPdf,
} from '../../services/ticketApi';
import {
  HeadphonesIcon,
  AlertCircle,
  Clock,
  CheckCircle,
  Filter,
  UserCheck,
  TrendingUp,
  ArrowUpDown,
  Download,
  FileText,
  FileDown,
  X,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';
import SmoothTab from '@/components/ui/smoothTab'; // adjust path if you named the file smoothTab.tsx
import WhatsAppLiveChatDashboard from '../../components/WhatsAppLiveChatDashboard';

type SupportDashboardView = 'overview' | 'queue' | 'analytics';

interface SupportDashboardProps {
  view?: SupportDashboardView;
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
  assignedToUserName?: string;
  assignedToUserId?: string;
  commentCount: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: number;
  teamLeadUserId?: string;
}

interface PaginatedResponse {
  items: Ticket[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  reopened: number;
  closed: number;
  unassigned: number;
}

const SUPPORT_TABS = [
  {
    id: 'overview',
    title: 'Overview',
    description: 'Review, prioritize and route tickets to technicians',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'queue',
    title: 'Queue',
    description: 'Review, triage and route incoming support tickets',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track queue health and ticket routing performance',
    color: 'bg-emerald-500 hover:bg-emerald-600',
  },
];

export default function SupportDashboard({ view = 'overview' }: SupportDashboardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [teamLeads, setTeamLeads] = useState<User[]>([]);
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    reopened: 0,
    closed: 0,
    unassigned: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // PDF download state
  const [pdfLoading, setPdfLoading] = useState<'ticket' | 'full' | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showPdfMenu, setShowPdfMenu] = useState(false);

  // WhatsApp Live Chat modal state
  const [showWhatsAppChat, setShowWhatsAppChat] = useState(false);

  // SmoothTab drives the active view
  const [currentView, setCurrentView] = useState<SupportDashboardView>(view);

  // Keep internal view in sync if the parent prop changes
  useEffect(() => {
    setCurrentView(view);
  }, [view]);

  const showStats = currentView === 'overview' || currentView === 'analytics';
  const showQueue = currentView === 'overview' || currentView === 'queue';
  const showAnalytics = currentView === 'analytics';

  const pageTitle =
    currentView === 'queue' ? 'Support Queue' : currentView === 'analytics' ? 'Support Analytics' : 'Support Dashboard';

  const pageSubtitle =
    currentView === 'queue'
      ? 'Review, triage and route incoming support tickets'
      : currentView === 'analytics'
        ? 'Track queue health and ticket routing performance'
        : 'Review, prioritize and route tickets to technicians';

  useEffect(() => {
    loadData();
  }, []);

  // Close PDF menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowPdfMenu(false);
    if (showPdfMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showPdfMenu]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ticketsRes, usersRes] = await Promise.all([
        getAllTickets(1, 100),
        getAllUsers(),
      ]);

      if (ticketsRes.error) {
        setError(ticketsRes.error);
        return;
      }

      const ticketItems = Array.isArray(ticketsRes.data)
        ? (ticketsRes.data as Ticket[])
        : ((ticketsRes.data as PaginatedResponse | null)?.items ?? []);

      setTickets(ticketItems);
      calculateStats(ticketItems);

      if (usersRes.data) {
        const users = Array.isArray(usersRes.data)
          ? usersRes.data
          : (usersRes.data as any)?.items ?? [];

        setTechnicians(users.filter((user: User) => user.role === 4));
        setTeamLeads(users.filter((user: User) => user.role === 2));
      }
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (items: Ticket[]) => {
    setStats({
      total: items.length,
      open: items.filter((t) => t.status === 1).length,
      inProgress: items.filter((t) => t.status === 2).length,
      resolved: items.filter((t) => t.status === 3).length,
      reopened: items.filter((t) => t.status === 4).length,
      closed: items.filter((t) => t.status === 5).length,
      unassigned: items.filter((t) => !t.assignedToUserId).length,
    });
  };

  // ── PDF handlers ──────────────────────────────────────────────────────────

  const handleDownloadTicketPdf = async () => {
    if (!selectedTicket) return;
    setPdfLoading('ticket');
    setPdfError(null);
    setShowPdfMenu(false);
    try {
      await downloadTicketPdf(selectedTicket.id);
    } catch (err: any) {
      setPdfError(err?.message ?? 'Failed to download ticket PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  const handleDownloadFullReportPdf = async () => {
    if (!selectedTicket) return;
    setPdfLoading('full');
    setPdfError(null);
    setShowPdfMenu(false);
    try {
      await downloadTicketWithReportPdf(selectedTicket.id);
    } catch (err: any) {
      setPdfError(err?.message ?? 'Failed to download full report PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  // ── Status & assign handlers ───────────────────────────────────────────────

  const handleStatusUpdate = async () => {
    if (!selectedTicket || !selectedStatus) return;
    try {
      setStatusLoading(true);
      const result = await updateTicketStatus(selectedTicket.id, selectedStatus);
      if (result.error) { alert('Failed: ' + result.error); return; }
      const statusNumber = getStatusNumber(selectedStatus);
      const updated = tickets.map((t) =>
        t.id === selectedTicket.id ? { ...t, status: statusNumber } : t
      );
      setTickets(updated);
      calculateStats(updated);
      setSelectedTicket({ ...selectedTicket, status: statusNumber });
      setShowStatusModal(false);
      setSelectedStatus('');
    } catch {
      alert('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTicket || !selectedTeamLeadId || !selectedTechnicianId) return;
    try {
      setAssignLoading(true);
      const result = await assignTicket(selectedTicket.id, selectedTeamLeadId, selectedTechnicianId);
      if (result.error) { alert('Failed: ' + result.error); return; }
      const technician = technicians.find((t) => t.id === selectedTechnicianId);
      const technicianName = technician ? `${technician.firstName} ${technician.lastName}` : '';
      const updated = tickets.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, assignedToUserId: selectedTechnicianId, assignedToUserName: technicianName }
          : t
      );
      setTickets(updated);
      calculateStats(updated);
      setSelectedTicket({ ...selectedTicket, assignedToUserId: selectedTechnicianId, assignedToUserName: technicianName });
      setShowAssignModal(false);
      setSelectedTeamLeadId('');
      setSelectedTechnicianId('');
    } catch {
      alert('Failed to assign ticket');
    } finally {
      setAssignLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getStatusNumber = (label: string) => {
    const map: Record<string, number> = { Open: 1, InProgress: 2, 'In Progress': 2, Resolved: 3, Reopened: 4, Closed: 5 };
    return map[label] ?? 1;
  };

  const getStatusLabel = (status: number) => {
    const map: Record<number, string> = { 1: 'Open', 2: 'In Progress', 3: 'Resolved', 4: 'Reopened', 5: 'Closed' };
    return map[status] ?? 'Unknown';
  };

  const getStatusColor = (status: number) => {
    const map: Record<number, string> = {
      1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      4: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      5: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return map[status] ?? map[5];
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

  const filteredTickets =
    activeFilter === 'All'
      ? tickets
      : activeFilter === 'Unassigned'
        ? tickets.filter((t) => !t.assignedToUserId)
        : tickets.filter((t) => getStatusLabel(t.status) === activeFilter);

  const resolutionRate =
    stats.total > 0 ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100) : 0;
  const assignmentRate =
    stats.total > 0 ? Math.round(((stats.total - stats.unassigned) / stats.total) * 100) : 0;
  const activeTickets = stats.open + stats.inProgress + stats.reopened;

  const filteredTechnicians = technicians.filter((t) => t.teamLeadUserId === selectedTeamLeadId);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading support queue...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg">
                <HeadphonesIcon size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {pageTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{pageSubtitle}</p>
              </div>
            </div>

            {/* WhatsApp Live Chat Button */}
            <button
              onClick={() => setShowWhatsAppChat(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
            >
              <MessageCircle size={18} />
              WhatsApp Live Chat
            </button>
          </div>
        </div>

        {/* WhatsApp Live Chat Modal */}
        <WhatsAppLiveChatDashboard
          isOpen={showWhatsAppChat}
          onClose={() => setShowWhatsAppChat(false)}
        />

        {/* SmoothTab Navigation */}
        <div className="mb-10 h-[260px]">
          <SmoothTab
            items={SUPPORT_TABS}
            defaultTabId={view}
            onChange={(tabId) => setCurrentView(tabId as SupportDashboardView)}
          />
        </div>

        {/* Global error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Stats Row */}
        {showStats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {[
              { label: 'Total', value: stats.total, icon: <TrendingUp size={18} />, color: 'text-purple-600' },
              { label: 'Open', value: stats.open, icon: <AlertCircle size={18} />, color: 'text-red-600' },
              { label: 'In Progress', value: stats.inProgress, icon: <Clock size={18} />, color: 'text-amber-600' },
              { label: 'Resolved', value: stats.resolved, icon: <CheckCircle size={18} />, color: 'text-emerald-600' },
              { label: 'Unassigned', value: stats.unassigned, icon: <UserCheck size={18} />, color: 'text-orange-600' },
            ].map(({ label, value, icon, color }) => (
              <div
                key={label}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                  <span className={color}>{icon}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Row */}
        {showAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Resolution Rate</p>
              <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{resolutionRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                {stats.resolved + stats.closed} of {stats.total} tickets resolved or closed
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Assignment Rate</p>
              <p className="text-5xl font-bold text-purple-600 dark:text-purple-400">{assignmentRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                {stats.total - stats.unassigned} tickets currently assigned
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Active Workload</p>
              <p className="text-5xl font-bold text-amber-600 dark:text-amber-400">{activeTickets}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Open, in progress and reopened tickets
              </p>
            </div>
          </div>
        )}

        {/* Queue + Detail Panel */}
        {showQueue && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Ticket List */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <Filter size={20} />
                  Ticket Queue
                </h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(
                    [
                      ['All', stats.total],
                      ['Open', stats.open],
                      ['In Progress', stats.inProgress],
                      ['Resolved', stats.resolved],
                      ['Reopened', stats.reopened],
                      ['Closed', stats.closed],
                      ['Unassigned', stats.unassigned],
                    ] as [string, number][]
                  ).map(([filter, count]) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeFilter === filter
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {filter} ({count})
                    </button>
                  ))}
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No tickets in this category</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setSelectedStatus('');
                          setSelectedTechnicianId('');
                          setPdfError(null);
                          setShowPdfMenu(false);
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedTicket?.id === ticket.id
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600 shadow-md'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getStatusColor(ticket.status)}`}>
                                {getStatusLabel(ticket.status)}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getPriorityBadge(ticket.priority).color}`}>
                                {getPriorityBadge(ticket.priority).label}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{ticket.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              By: {ticket.createdByUserName} ·{' '}
                              {ticket.assignedToUserName ? (
                                `Assigned to ${ticket.assignedToUserName}`
                              ) : (
                                <span className="text-orange-500">Unassigned</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl h-fit">
              {selectedTicket ? (
                <>
                  <div className="flex items-start justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ticket Details</h3>

                    {/* PDF Download Dropdown */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setShowPdfMenu((prev) => !prev)}
                        disabled={!!pdfLoading}
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
                            PDF
                            <ChevronDown size={11} className={`transition-transform ${showPdfMenu ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </button>

                      {showPdfMenu && (
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-30 overflow-hidden">
                          <button
                            onClick={handleDownloadTicketPdf}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
                          >
                            <FileText size={15} className="shrink-0 text-indigo-500" />
                            <div className="text-left">
                              <p className="font-medium">Ticket Details</p>
                              <p className="text-xs text-gray-400">Comments &amp; activity log</p>
                            </div>
                          </button>
                          <div className="border-t border-gray-100 dark:border-gray-700" />
                          <button
                            onClick={handleDownloadFullReportPdf}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                          >
                            <FileDown size={15} className="shrink-0 text-emerald-500" />
                            <div className="text-left">
                              <p className="font-medium">Full Report</p>
                              <p className="text-xs text-gray-400">Ticket + technician report</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PDF Error */}
                  {pdfError && (
                    <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span className="flex-1">{pdfError}</span>
                      <button onClick={() => setPdfError(null)}>
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Ticket ID</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedTicket.ticketNumber}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Title</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTicket.title}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(selectedTicket.status)}`}>
                          {getStatusLabel(selectedTicket.status)}
                        </span>
                        {selectedTicket.status !== 5 && (
                          <button
                            onClick={() => setShowStatusModal(true)}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            <ArrowUpDown size={12} />
                            Change
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Priority</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded inline-block ${getPriorityBadge(selectedTicket.priority).color}`}>
                        {getPriorityBadge(selectedTicket.priority).label}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Assigned To</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedTicket.assignedToUserName ?? (
                            <span className="text-orange-500 italic">Unassigned</span>
                          )}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedTechnicianId(selectedTicket.assignedToUserId ?? '');
                            setSelectedTeamLeadId('');
                            setShowAssignModal(true);
                          }}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                        >
                          <UserCheck size={12} />
                          {selectedTicket.assignedToUserName ? 'Reassign' : 'Assign'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Raised By</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTicket.createdByUserName}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Date</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedTicket.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Description</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4">
                        {selectedTicket.description}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <HeadphonesIcon size={44} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Select a ticket to review</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Change Status Modal ───────────────────────────────────────────────── */}
      {showStatusModal && selectedTicket && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowStatusModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-7 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Change Status</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                {selectedTicket.ticketNumber}: {selectedTicket.title}
              </p>

              <div className="space-y-2 mb-5">
                {[
                  { label: 'Open', value: 'Open' },
                  { label: 'In Progress', value: 'InProgress' },
                  { label: 'Resolved', value: 'Resolved' },
                  { label: 'Reopened', value: 'Reopened' },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedStatus === status.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowStatusModal(false); setSelectedStatus(''); }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || statusLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors font-medium"
                >
                  {statusLoading ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Assign Technician Modal ───────────────────────────────────────────── */}
      {showAssignModal && selectedTicket && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowAssignModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-7 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Assign Technician</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                {selectedTicket.ticketNumber}: {selectedTicket.title}
              </p>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Team Lead
                  </label>
                  <select
                    value={selectedTeamLeadId}
                    onChange={(e) => { setSelectedTeamLeadId(e.target.value); setSelectedTechnicianId(''); }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Choose Team Lead...</option>
                    {teamLeads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.firstName} {lead.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Technician
                  </label>
                  <select
                    value={selectedTechnicianId}
                    onChange={(e) => setSelectedTechnicianId(e.target.value)}
                    disabled={!selectedTeamLeadId}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
                  >
                    <option value="">Choose Technician...</option>
                    {filteredTechnicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.firstName} {tech.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAssignModal(false); setSelectedTeamLeadId(''); setSelectedTechnicianId(''); }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedTeamLeadId || !selectedTechnicianId || assignLoading || teamLeads.length === 0}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors font-medium"
                >
                  {assignLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


