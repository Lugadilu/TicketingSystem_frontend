// src/pages/teamlead/TeamLeadDashboard.tsx

import { useEffect, useState, type SyntheticEvent } from 'react';
import {
  getTeamMembers,
  getMyTickets,
  inviteTechnician,
  assignTicketToTechnician,
} from '../../services/teamLeadApi';
import {
  downloadTicketPdf,
  downloadTicketWithReportPdf,
} from '../../services/ticketApi';
import type { User } from '../../types';
import {
  Users,
  Ticket,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Download,
  FileText,
  FileDown,
  ChevronDown,
  X,
} from 'lucide-react';

type TeamLeadDashboardView = 'overview' | 'tickets' | 'members';

interface TeamLeadDashboardProps {
  view?: TeamLeadDashboardView;
}

interface TeamTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: number;
  priority: number;
  createdAt: string;
  assignedToUserName?: string;
}

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}

interface PaginatedTicketsResponse {
  items: TeamTicket[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export default function TeamLeadDashboard({ view = 'overview' }: TeamLeadDashboardProps) {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<TeamTicket[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TeamTicket | null>(null);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [assignForm, setAssignForm] = useState({ technicianId: '' });
  const [assignLoading, setAssignLoading] = useState(false);

  // PDF state
  const [pdfLoading, setPdfLoading] = useState<'ticket' | 'full' | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showPdfMenu, setShowPdfMenu] = useState(false);

  const showStats = view === 'overview';
  const showTickets = view === 'overview' || view === 'tickets';
  const showMembers = view === 'overview' || view === 'members';

  const pageTitle =
    view === 'tickets' ? 'Team Tickets' : view === 'members' ? 'Team Members' : 'Team Dashboard';

  const pageSubtitle =
    view === 'tickets'
      ? 'Review and assign tickets handled by your team'
      : view === 'members'
        ? 'Manage technicians assigned to your team'
        : 'Manage your team and tickets';

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Close PDF menu on outside click
  useEffect(() => {
    const close = () => setShowPdfMenu(false);
    if (showPdfMenu) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [showPdfMenu]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [teamRes, ticketsRes] = await Promise.all([
        getTeamMembers(),
        getMyTickets(1, 20),
      ]);

      if (teamRes.error) {
        setError(teamRes.error);
        return;
      }

      if (teamRes.data) setTeamMembers(teamRes.data);

      const paginatedData = ticketsRes.data as PaginatedTicketsResponse | null;

      if (paginatedData?.items && Array.isArray(paginatedData.items)) {
        setTickets(paginatedData.items);
        setStats({
          totalTickets: paginatedData.items.length,
          openTickets: paginatedData.items.filter((t) => t.status === 1).length,
          inProgressTickets: paginatedData.items.filter((t) => t.status === 2).length,
          resolvedTickets: paginatedData.items.filter((t) => t.status === 3).length,
        });
      }
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ── PDF handlers ───────────────────────────────────────────────────────────

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

  // ── Invite & assign handlers ───────────────────────────────────────────────

  const handleInviteTechnician = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      setInviteError('Please fill in all required fields');
      return;
    }
    try {
      setInviteLoading(true);
      setInviteError(null);
      const result = await inviteTechnician(inviteForm);
      if (result.error) { setInviteError(result.error); return; }
      setInviteForm({ email: '', firstName: '', lastName: '', phoneNumber: '' });
      setShowInviteModal(false);
      await loadDashboardData();
    } catch {
      setInviteError('Failed to invite technician');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!assignForm.technicianId || !selectedTicket) return;
    try {
      setAssignLoading(true);
      const result = await assignTicketToTechnician(selectedTicket.id, assignForm.technicianId);
      if (result.error) { alert('Failed to assign ticket: ' + result.error); return; }
      const assignedMember = teamMembers.find((m) => m.id === assignForm.technicianId);
      const assignedName = assignedMember
        ? `${assignedMember.firstName} ${assignedMember.lastName}`
        : 'Assigned';
      setTickets((curr) =>
        curr.map((t) =>
          t.id === selectedTicket.id ? { ...t, assignedToUserName: assignedName } : t
        )
      );
      setShowAssignModal(null);
      setSelectedTicket(null);
      setAssignForm({ technicianId: '' });
    } catch {
      alert('Failed to assign ticket');
    } finally {
      setAssignLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

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

  const getPriorityBadge = (priority: number) => {
    const map: Record<number, { label: string; color: string }> = {
      1: { label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      3: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
      4: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    return map[priority] ?? map[2];
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg">
                <Users size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {pageTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{pageSubtitle}</p>
              </div>
            </div>

            {showMembers && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                <Plus size={20} />
                Invite Technician
              </button>
            )}
          </div>
        </div>

        {/* Global error */}
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
              { label: 'Total Tickets', value: stats.totalTickets, icon: <Ticket size={20} />, color: 'text-blue-600' },
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

        {/* Main content grid */}
        <div className={showTickets && showMembers ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : 'grid grid-cols-1 gap-8'}>

          {/* Tickets panel */}
          {showTickets && (
            <div className={showMembers ? 'lg:col-span-2' : ''}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Zap size={24} />
                  Team Tickets
                </h2>

                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No tickets yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setPdfError(null);
                          setShowPdfMenu(false);
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer group ${
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
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityBadge(ticket.priority).color}`}>
                                {getPriorityBadge(ticket.priority).label}
                              </span>
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {ticket.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {ticket.assignedToUserName
                                ? `Assigned to: ${ticket.assignedToUserName}`
                                : 'Unassigned'}
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(ticket);
                              setAssignForm({ technicianId: '' });
                              setShowAssignModal(ticket.id);
                            }}
                            disabled={teamMembers.length === 0}
                            className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            {ticket.assignedToUserName ? 'Reassign' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ticket detail / PDF section — shown below the list when a ticket is selected */}
                {selectedTicket && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs font-mono text-gray-400">{selectedTicket.ticketNumber}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 truncate max-w-xs">
                          {selectedTicket.title}
                        </p>
                      </div>

                      {/* PDF dropdown */}
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
                          <div className="absolute right-0 bottom-full mb-1.5 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-30 overflow-hidden">
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

                    {/* PDF error */}
                    {pdfError && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <span className="flex-1">{pdfError}</span>
                        <button onClick={() => setPdfError(null)}>
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team members panel */}
          {showMembers && (
            <div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl h-fit">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Users size={24} />
                  Team Members
                </h2>

                {teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No team members yet</p>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Add Team Member
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {member.firstName?.[0]}
                            {member.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Invite Modal ──────────────────────────────────────────────────────── */}
      {showInviteModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowInviteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Invite Technician</h3>

              {inviteError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {inviteError}
                </div>
              )}

              <form onSubmit={handleInviteTechnician} className="space-y-4">
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="technician@example.com"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="First name"
                  />
                  <input
                    type="text"
                    required
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Last name"
                  />
                </div>
                <input
                  type="tel"
                  value={inviteForm.phoneNumber}
                  onChange={(e) => setInviteForm({ ...inviteForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Phone number (optional)"
                />
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
                  >
                    {inviteLoading ? 'Inviting...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── Assign Modal ──────────────────────────────────────────────────────── */}
      {showAssignModal && selectedTicket && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowAssignModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Assign Ticket</h3>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                <span className="font-semibold">{selectedTicket.ticketNumber}:</span> {selectedTicket.title}
              </p>

              <select
                value={assignForm.technicianId}
                onChange={(e) => setAssignForm({ technicianId: e.target.value })}
                className="w-full px-4 py-2 mb-6 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Choose a technician...</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(null)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTicket}
                  disabled={!assignForm.technicianId || assignLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
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



// // src/pages/teamlead/TeamLeadDashboard.tsx

// import { useEffect, useState, type SyntheticEvent } from 'react';
// import {
//   getTeamMembers,
//   getMyTickets,
//   inviteTechnician,
//   assignTicketToTechnician,
// } from '../../services/teamLeadApi';
// import type { User } from '../../types';
// import { Users, Ticket, Plus, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

// type TeamLeadDashboardView = 'overview' | 'tickets' | 'members';

// interface TeamLeadDashboardProps {
//   view?: TeamLeadDashboardView;
// }

// interface TeamTicket {
//   id: string;
//   ticketNumber: string;
//   title: string;
//   status: number;
//   priority: number;
//   createdAt: string;
//   assignedToUserName?: string;
// }

// interface DashboardStats {
//   totalTickets: number;
//   openTickets: number;
//   inProgressTickets: number;
//   resolvedTickets: number;
// }

// interface PaginatedTicketsResponse {
//   items: TeamTicket[];
//   totalCount: number;
//   pageNumber: number;
//   pageSize: number;
// }

// export default function TeamLeadDashboard({ view = 'overview' }: TeamLeadDashboardProps) {
//   const [teamMembers, setTeamMembers] = useState<User[]>([]);
//   const [tickets, setTickets] = useState<TeamTicket[]>([]);
//   const [stats, setStats] = useState<DashboardStats>({
//     totalTickets: 0,
//     openTickets: 0,
//     inProgressTickets: 0,
//     resolvedTickets: 0,
//   });

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showInviteModal, setShowInviteModal] = useState(false);
//   const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
//   const [selectedTicket, setSelectedTicket] = useState<TeamTicket | null>(null);

//   const [inviteForm, setInviteForm] = useState({
//     email: '',
//     firstName: '',
//     lastName: '',
//     phoneNumber: '',
//   });
//   const [inviteLoading, setInviteLoading] = useState(false);
//   const [inviteError, setInviteError] = useState<string | null>(null);

//   const [assignForm, setAssignForm] = useState({
//     technicianId: '',
//   });
//   const [assignLoading, setAssignLoading] = useState(false);

//   const showStats = view === 'overview';
//   const showTickets = view === 'overview' || view === 'tickets';
//   const showMembers = view === 'overview' || view === 'members';

//   const pageTitle =
//     view === 'tickets' ? 'Team Tickets' : view === 'members' ? 'Team Members' : 'Team Dashboard';

//   const pageSubtitle =
//     view === 'tickets'
//       ? 'Review and assign tickets handled by your team'
//       : view === 'members'
//         ? 'Manage technicians assigned to your team'
//         : 'Manage your team and tickets';

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const [teamRes, ticketsRes] = await Promise.all([
//         getTeamMembers(),
//         getMyTickets(1, 20),
//       ]);

//       if (teamRes.error) {
//         setError(teamRes.error);
//         return;
//       }

//       if (teamRes.data) {
//         setTeamMembers(teamRes.data);
//       }

//       const paginatedData = ticketsRes.data as PaginatedTicketsResponse | null;

//       if (paginatedData?.items && Array.isArray(paginatedData.items)) {
//         setTickets(paginatedData.items);

//         setStats({
//           totalTickets: paginatedData.items.length,
//           openTickets: paginatedData.items.filter((t) => t.status === 1).length,
//           inProgressTickets: paginatedData.items.filter((t) => t.status === 2).length,
//           resolvedTickets: paginatedData.items.filter((t) => t.status === 3).length,
//         });
//       }
//     } catch (err) {
//       console.error('Error loading dashboard:', err);
//       setError('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInviteTechnician = async (e: SyntheticEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
//       setInviteError('Please fill in all required fields');
//       return;
//     }

//     try {
//       setInviteLoading(true);
//       setInviteError(null);

//       const result = await inviteTechnician(inviteForm);

//       if (result.error) {
//         setInviteError(result.error);
//         return;
//       }

//       setInviteForm({ email: '', firstName: '', lastName: '', phoneNumber: '' });
//       setShowInviteModal(false);
//       await loadDashboardData();
//     } catch (err) {
//       setInviteError('Failed to invite technician');
//     } finally {
//       setInviteLoading(false);
//     }
//   };

//   const handleAssignTicket = async () => {
//     if (!assignForm.technicianId || !selectedTicket) return;

//     try {
//       setAssignLoading(true);

//       const result = await assignTicketToTechnician(selectedTicket.id, assignForm.technicianId);

//       if (result.error) {
//         alert('Failed to assign ticket: ' + result.error);
//         return;
//       }

//       const assignedMember = teamMembers.find((m) => m.id === assignForm.technicianId);
//       const assignedName = assignedMember
//         ? `${assignedMember.firstName} ${assignedMember.lastName}`
//         : 'Assigned';

//       setTickets((currentTickets) =>
//         currentTickets.map((ticket) =>
//           ticket.id === selectedTicket.id
//             ? { ...ticket, assignedToUserName: assignedName }
//             : ticket
//         )
//       );

//       setShowAssignModal(null);
//       setSelectedTicket(null);
//       setAssignForm({ technicianId: '' });
//     } catch (err) {
//       alert('Failed to assign ticket');
//     } finally {
//       setAssignLoading(false);
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

//   const getPriorityBadge = (priority: number) => {
//     const badges = {
//       1: { label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
//       2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
//       3: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
//       4: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
//     };

//     return badges[priority as keyof typeof badges] || badges[2];
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
//           <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-8">
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-12">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg">
//                 <Users size={32} />
//               </div>
//               <div>
//                 <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
//                   {pageTitle}
//                 </h1>
//                 <p className="text-gray-600 dark:text-gray-400 mt-1">{pageSubtitle}</p>
//               </div>
//             </div>

//             {showMembers && (
//               <button
//                 onClick={() => setShowInviteModal(true)}
//                 className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
//               >
//                 <Plus size={20} />
//                 Invite Technician
//               </button>
//             )}
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
//                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
//                 <Ticket size={20} className="text-blue-600" />
//               </div>
//               <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTickets}</p>
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

//         <div className={showTickets && showMembers ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : 'grid grid-cols-1 gap-8'}>
//           {showTickets && (
//             <div className={showMembers ? 'lg:col-span-2' : ''}>
//               <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
//                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                   <Zap size={24} />
//                   Team Tickets
//                 </h2>

//                 {tickets.length === 0 ? (
//                   <div className="text-center py-12">
//                     <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
//                     <p className="text-gray-600 dark:text-gray-400">No tickets yet</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3 max-h-[600px] overflow-y-auto">
//                     {tickets.map((ticket) => (
//                       <div
//                         key={ticket.id}
//                         className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all group cursor-pointer"
//                         onClick={() => setSelectedTicket(ticket)}
//                       >
//                         <div className="flex items-start justify-between gap-4">
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center gap-2 mb-2">
//                               <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
//                                 {ticket.ticketNumber}
//                               </span>
//                               <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
//                                 {getStatusLabel(ticket.status)}
//                               </span>
//                               <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityBadge(ticket.priority).color}`}>
//                                 {getPriorityBadge(ticket.priority).label}
//                               </span>
//                             </div>
//                             <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
//                               {ticket.title}
//                             </h3>
//                             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                               {ticket.assignedToUserName ? `Assigned to: ${ticket.assignedToUserName}` : 'Unassigned'}
//                             </p>
//                           </div>

//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setSelectedTicket(ticket);
//                               setAssignForm({ technicianId: '' });
//                               setShowAssignModal(ticket.id);
//                             }}
//                             disabled={teamMembers.length === 0}
//                             className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                           >
//                             {ticket.assignedToUserName ? 'Reassign' : 'Assign'}
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {showMembers && (
//             <div>
//               <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl h-fit">
//                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                   <Users size={24} />
//                   Team Members
//                 </h2>

//                 {teamMembers.length === 0 ? (
//                   <div className="text-center py-8">
//                     <Users size={40} className="mx-auto text-gray-300 mb-3" />
//                     <p className="text-gray-600 dark:text-gray-400 text-sm">No team members yet</p>
//                     <button
//                       onClick={() => setShowInviteModal(true)}
//                       className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
//                     >
//                       Add Team Member
//                     </button>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {teamMembers.map((member) => (
//                       <div
//                         key={member.id}
//                         className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
//                       >
//                         <div className="flex items-center gap-3">
//                           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
//                             {member.firstName?.[0]}
//                             {member.lastName?.[0]}
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
//                               {member.firstName} {member.lastName}
//                             </p>
//                             <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
//                               {member.email}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {showInviteModal && (
//         <>
//           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowInviteModal(false)} />
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
//               <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Invite Technician</h3>

//               {inviteError && (
//                 <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
//                   {inviteError}
//                 </div>
//               )}

//               <form onSubmit={handleInviteTechnician} className="space-y-4">
//                 <input
//                   type="email"
//                   required
//                   value={inviteForm.email}
//                   onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
//                   className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
//                   placeholder="technician@example.com"
//                 />

//                 <div className="grid grid-cols-2 gap-4">
//                   <input
//                     type="text"
//                     required
//                     value={inviteForm.firstName}
//                     onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
//                     className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
//                     placeholder="First name"
//                   />
//                   <input
//                     type="text"
//                     required
//                     value={inviteForm.lastName}
//                     onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
//                     className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
//                     placeholder="Last name"
//                   />
//                 </div>

//                 <input
//                   type="tel"
//                   value={inviteForm.phoneNumber}
//                   onChange={(e) => setInviteForm({ ...inviteForm, phoneNumber: e.target.value })}
//                   className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
//                   placeholder="Phone number optional"
//                 />

//                 <div className="flex gap-3 pt-6">
//                   <button
//                     type="button"
//                     onClick={() => setShowInviteModal(false)}
//                     className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={inviteLoading}
//                     className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
//                   >
//                     {inviteLoading ? 'Inviting...' : 'Send Invite'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </>
//       )}

//       {showAssignModal && selectedTicket && (
//         <>
//           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowAssignModal(null)} />
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
//               <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Assign Ticket</h3>

//               <p className="text-gray-600 dark:text-gray-400 mb-4">
//                 <span className="font-semibold">{selectedTicket.ticketNumber}:</span> {selectedTicket.title}
//               </p>

//               <select
//                 value={assignForm.technicianId}
//                 onChange={(e) => setAssignForm({ technicianId: e.target.value })}
//                 className="w-full px-4 py-2 mb-6 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
//               >
//                 <option value="">Choose a technician...</option>
//                 {teamMembers.map((member) => (
//                   <option key={member.id} value={member.id}>
//                     {member.firstName} {member.lastName}
//                   </option>
//                 ))}
//               </select>

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setShowAssignModal(null)}
//                   className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleAssignTicket}
//                   disabled={!assignForm.technicianId || assignLoading}
//                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
//                 >
//                   {assignLoading ? 'Assigning...' : 'Assign'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }









// // // src/pages/teamlead/TeamLeadDashboard.tsx - FIXED TypeScript

// // import { useEffect, useState } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { useAuthStore } from '../../store/authStore';
// // import { 
// //   getTeamMembers, 
// //   getMyTickets, 
// //   inviteTechnician,
// //   assignTicketToTechnician,
// //   changeTicketStatus,
// //   closeTicket,
// // } from '../../services/teamLeadApi';
// // import type { User } from '../../types';
// // import { Users, Ticket, TrendingUp, Plus, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

// // interface TeamTicket {
// //   id: string;
// //   ticketNumber: string;
// //   title: string;
// //   status: number;
// //   priority: number;
// //   createdAt: string;
// //   assignedToUserName?: string;
// // }

// // interface DashboardStats {
// //   totalTickets: number;
// //   openTickets: number;
// //   inProgressTickets: number;
// //   resolvedTickets: number;
// // }

// // // Define the response type
// // interface PaginatedTicketsResponse {
// //   items: TeamTicket[];
// //   totalCount: number;
// //   pageNumber: number;
// //   pageSize: number;
// // }

// // export default function TeamLeadDashboard() {
// //   const navigate = useNavigate();
// //   const { user } = useAuthStore();
  
// //   // State
// //   const [teamMembers, setTeamMembers] = useState<User[]>([]);
// //   const [tickets, setTickets] = useState<TeamTicket[]>([]);
// //   const [stats, setStats] = useState<DashboardStats>({
// //     totalTickets: 0,
// //     openTickets: 0,
// //     inProgressTickets: 0,
// //     resolvedTickets: 0,
// //   });
  
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [showInviteModal, setShowInviteModal] = useState(false);
// //   const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
// //   const [selectedTicket, setSelectedTicket] = useState<TeamTicket | null>(null);

// //   // Invite form state
// //   const [inviteForm, setInviteForm] = useState({
// //     email: '',
// //     firstName: '',
// //     lastName: '',
// //     phoneNumber: '',
// //   });
// //   const [inviteLoading, setInviteLoading] = useState(false);
// //   const [inviteError, setInviteError] = useState<string | null>(null);

// //   // Assign form state
// //   const [assignForm, setAssignForm] = useState({
// //     technicianId: '',
// //   });
// //   const [assignLoading, setAssignLoading] = useState(false);

// //   // Load initial data
// //   useEffect(() => {
// //     loadDashboardData();
// //   }, []);

// //   const loadDashboardData = async () => {
// //     try {
// //       setLoading(true);
// //       setError(null);

// //       // Fetch team members and tickets in parallel
// //       const [teamRes, ticketsRes] = await Promise.all([
// //         getTeamMembers(),
// //         getMyTickets(1, 20),
// //       ]);

// //       if (teamRes.error) {
// //         setError(teamRes.error);
// //         return;
// //       }

// //       if (teamRes.data) {
// //         setTeamMembers(teamRes.data);
// //       }

// //       // Cast the data to the correct type
// //       const paginatedData = ticketsRes.data as PaginatedTicketsResponse | null;

// //       if (paginatedData?.items && Array.isArray(paginatedData.items)) {
// //         setTickets(paginatedData.items);
        
// //         // Calculate stats
// //         const open = paginatedData.items.filter((t: TeamTicket) => t.status === 1).length;
// //         const inProgress = paginatedData.items.filter((t: TeamTicket) => t.status === 2).length;
// //         const resolved = paginatedData.items.filter((t: TeamTicket) => t.status === 3).length;

// //         setStats({
// //           totalTickets: paginatedData.items.length,
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

// //   // Handle invite technician
// //   const handleInviteTechnician = async (e: React.FormEvent) => {
// //     e.preventDefault();

// //     if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
// //       setInviteError('Please fill in all required fields');
// //       return;
// //     }

// //     try {
// //       setInviteLoading(true);
// //       setInviteError(null);

// //       const result = await inviteTechnician({
// //         email: inviteForm.email,
// //         firstName: inviteForm.firstName,
// //         lastName: inviteForm.lastName,
// //         phoneNumber: inviteForm.phoneNumber,
// //       });

// //       if (result.error) {
// //         setInviteError(result.error);
// //         return;
// //       }

// //       // Reset form and close modal
// //       setInviteForm({ email: '', firstName: '', lastName: '', phoneNumber: '' });
// //       setShowInviteModal(false);
      
// //       // Reload team members
// //       await loadDashboardData();
// //     } catch (err) {
// //       setInviteError('Failed to invite technician');
// //     } finally {
// //       setInviteLoading(false);
// //     }
// //   };

// //   // Handle assign ticket
// //   const handleAssignTicket = async () => {
// //     if (!assignForm.technicianId || !selectedTicket) {
// //       return;
// //     }

// //     try {
// //       setAssignLoading(true);

// //       const result = await assignTicketToTechnician(
// //         selectedTicket.id,
// //         assignForm.technicianId
// //       );

// //       if (result.error) {
// //         alert('Failed to assign ticket: ' + result.error);
// //         return;
// //       }

// //       // Update ticket in list
// //       setTickets(tickets.map(t => 
// //         t.id === selectedTicket.id 
// //           ? { ...t, assignedToUserName: teamMembers.find(m => m.id === assignForm.technicianId)?.firstName }
// //           : t
// //       ));

// //       setShowAssignModal(null);
// //       setAssignForm({ technicianId: '' });
// //     } catch (err) {
// //       alert('Failed to assign ticket');
// //     } finally {
// //       setAssignLoading(false);
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

// //   const getPriorityBadge = (priority: number) => {
// //     const badges = {
// //       1: { label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
// //       2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
// //       3: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
// //       4: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
// //     };
// //     return badges[priority as keyof typeof badges] || badges[2];
// //   };

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
// //           <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-8">
// //       <div className="max-w-7xl mx-auto">
// //         {/* Header */}
// //         <div className="mb-12">
// //           <div className="flex items-center justify-between mb-4">
// //             <div className="flex items-center gap-4">
// //               <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg">
// //                 <Users size={32} />
// //               </div>
// //               <div>
// //                 <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
// //                   Team Dashboard
// //                 </h1>
// //                 <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your team and tickets</p>
// //               </div>
// //             </div>
// //             <button
// //               onClick={() => setShowInviteModal(true)}
// //               className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
// //             >
// //               <Plus size={20} />
// //               Invite Technician
// //             </button>
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
// //               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
// //               <Ticket size={20} className="text-blue-600" />
// //             </div>
// //             <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTickets}</p>
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
// //           {/* Tickets Section */}
// //           <div className="lg:col-span-2">
// //             <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
// //               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
// //                 <Zap size={24} />
// //                 Team Tickets
// //               </h2>

// //               {tickets.length === 0 ? (
// //                 <div className="text-center py-12">
// //                   <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
// //                   <p className="text-gray-600 dark:text-gray-400">No tickets yet</p>
// //                 </div>
// //               ) : (
// //                 <div className="space-y-3 max-h-[600px] overflow-y-auto">
// //                   {tickets.map((ticket) => (
// //                     <div
// //                       key={ticket.id}
// //                       className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all group cursor-pointer"
// //                       onClick={() => setSelectedTicket(ticket)}
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
// //                             <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityBadge(ticket.priority).color}`}>
// //                               {getPriorityBadge(ticket.priority).label}
// //                             </span>
// //                           </div>
// //                           <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
// //                             {ticket.title}
// //                           </h3>
// //                           <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
// //                             {ticket.assignedToUserName ? `Assigned to: ${ticket.assignedToUserName}` : 'Unassigned'}
// //                           </p>
// //                         </div>
// //                         <button
// //                           onClick={(e) => {
// //                             e.stopPropagation();
// //                             setSelectedTicket(ticket);
// //                             setShowAssignModal(ticket.id);
// //                           }}
// //                           disabled={!ticket.assignedToUserName && teamMembers.length === 0}
// //                           className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
// //                         >
// //                           {ticket.assignedToUserName ? 'Reassign' : 'Assign'}
// //                         </button>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}
// //             </div>
// //           </div>

// //           {/* Team Section */}
// //           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl h-fit">
// //             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
// //               <Users size={24} />
// //               Team Members
// //             </h2>

// //             {teamMembers.length === 0 ? (
// //               <div className="text-center py-8">
// //                 <Users size={40} className="mx-auto text-gray-300 mb-3" />
// //                 <p className="text-gray-600 dark:text-gray-400 text-sm">No team members yet</p>
// //                 <button
// //                   onClick={() => setShowInviteModal(true)}
// //                   className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
// //                 >
// //                   Add Team Member
// //                 </button>
// //               </div>
// //             ) : (
// //               <div className="space-y-3">
// //                 {teamMembers.map((member) => (
// //                   <div
// //                     key={member.id}
// //                     className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
// //                   >
// //                     <div className="flex items-center gap-3">
// //                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
// //                         {member.firstName?.[0]}{member.lastName?.[0]}
// //                       </div>
// //                       <div className="flex-1 min-w-0">
// //                         <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
// //                           {member.firstName} {member.lastName}
// //                         </p>
// //                         <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
// //                           {member.email}
// //                         </p>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Invite Modal */}
// //       {showInviteModal && (
// //         <>
// //           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowInviteModal(false)} />
// //           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// //             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
// //               <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Invite Technician</h3>

// //               {inviteError && (
// //                 <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
// //                   {inviteError}
// //                 </div>
// //               )}

// //               <form onSubmit={handleInviteTechnician} className="space-y-4">
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
// //                     Email
// //                   </label>
// //                   <input
// //                     type="email"
// //                     required
// //                     value={inviteForm.email}
// //                     onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
// //                     className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
// //                     placeholder="technician@example.com"
// //                   />
// //                 </div>

// //                 <div className="grid grid-cols-2 gap-4">
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
// //                       First Name
// //                     </label>
// //                     <input
// //                       type="text"
// //                       required
// //                       value={inviteForm.firstName}
// //                       onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
// //                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
// //                       placeholder="John"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
// //                       Last Name
// //                     </label>
// //                     <input
// //                       type="text"
// //                       required
// //                       value={inviteForm.lastName}
// //                       onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
// //                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
// //                       placeholder="Doe"
// //                     />
// //                   </div>
// //                 </div>

// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
// //                     Phone Number (Optional)
// //                   </label>
// //                   <input
// //                     type="tel"
// //                     value={inviteForm.phoneNumber}
// //                     onChange={(e) => setInviteForm({ ...inviteForm, phoneNumber: e.target.value })}
// //                     className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
// //                     placeholder="+1 (555) 000-0000"
// //                   />
// //                 </div>

// //                 <div className="flex gap-3 pt-6">
// //                   <button
// //                     type="button"
// //                     onClick={() => setShowInviteModal(false)}
// //                     className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
// //                   >
// //                     Cancel
// //                   </button>
// //                   <button
// //                     type="submit"
// //                     disabled={inviteLoading}
// //                     className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
// //                   >
// //                     {inviteLoading ? 'Inviting...' : 'Send Invite'}
// //                   </button>
// //                 </div>
// //               </form>
// //             </div>
// //           </div>
// //         </>
// //       )}

// //       {/* Assign Ticket Modal */}
// //       {showAssignModal && selectedTicket && (
// //         <>
// //           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowAssignModal(null)} />
// //           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// //             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
// //               <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
// //                 Assign Ticket
// //               </h3>

// //               <p className="text-gray-600 dark:text-gray-400 mb-4">
// //                 <span className="font-semibold">{selectedTicket.ticketNumber}:</span> {selectedTicket.title}
// //               </p>

// //               <div className="mb-6">
// //                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
// //                   Select Technician
// //                 </label>
// //                 <select
// //                   value={assignForm.technicianId}
// //                   onChange={(e) => setAssignForm({ technicianId: e.target.value })}
// //                   className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
// //                 >
// //                   <option value="">Choose a technician...</option>
// //                   {teamMembers.map((member) => (
// //                     <option key={member.id} value={member.id}>
// //                       {member.firstName} {member.lastName}
// //                     </option>
// //                   ))}
// //                 </select>
// //               </div>

// //               <div className="flex gap-3">
// //                 <button
// //                   onClick={() => setShowAssignModal(null)}
// //                   className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button
// //                   onClick={handleAssignTicket}
// //                   disabled={!assignForm.technicianId || assignLoading}
// //                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
// //                 >
// //                   {assignLoading ? 'Assigning...' : 'Assign'}
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // }



