// src/pages/support/SupportDashboard.tsx
// Support role: Reviews and prioritizes tickets (no implementation)
// Can see ALL tickets, triage them, change priority/status, assign to technicians

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  getAllTickets,
  updateTicketStatus,
  assignTicket,
  getAllUsers,
} from '../../services/supportApi';
import {
  HeadphonesIcon,
  AlertCircle,
  Clock,
  CheckCircle,
  Filter,
  UserCheck,
  TrendingUp,
  ArrowUpDown,
} from 'lucide-react';

// ============ INTERFACES ============

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
  unassigned: number;
}

// ============ COMPONENT ============

export default function SupportDashboard() {
  const { user } = useAuthStore();

  // Data state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, open: 0, inProgress: 0, resolved: 0, unassigned: 0,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // ============ LOAD DATA ============

  useEffect(() => {
    loadData();
  }, []);

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

      // Cast tickets response
      const paginatedData = ticketsRes.data as PaginatedResponse | null;
      if (paginatedData?.items && Array.isArray(paginatedData.items)) {
        setTickets(paginatedData.items);
        calculateStats(paginatedData.items);
      }

      // Extract technicians from users list
      if (usersRes.data) {
        const users = Array.isArray(usersRes.data)
          ? usersRes.data
          : (usersRes.data as any)?.items ?? [];
        // role 4 = Technician
        setTechnicians(users.filter((u: User) => u.role === 4));
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (items: Ticket[]) => {
    setStats({
      total: items.length,
      open: items.filter(t => t.status === 1).length,
      inProgress: items.filter(t => t.status === 2).length,
      resolved: items.filter(t => t.status === 3).length,
      unassigned: items.filter(t => !t.assignedToUserId).length,
    });
  };

  // ============ ACTIONS ============

  const handleStatusUpdate = async () => {
    if (!selectedTicket || !selectedStatus) return;
    try {
      setStatusLoading(true);
      const result = await updateTicketStatus(selectedTicket.id, selectedStatus);
      if (result.error) { alert('Failed: ' + result.error); return; }

      // Update ticket in list
      const updated = tickets.map(t =>
        t.id === selectedTicket.id
          ? { ...t, status: getStatusNumber(selectedStatus) }
          : t
      );
      setTickets(updated);
      calculateStats(updated);
      setSelectedTicket({ ...selectedTicket, status: getStatusNumber(selectedStatus) });
      setShowStatusModal(false);
      setSelectedStatus('');
    } catch {
      alert('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTicket || !selectedTechnicianId) return;
    try {
      setAssignLoading(true);
      const result = await assignTicket(selectedTicket.id, selectedTechnicianId);
      if (result.error) { alert('Failed: ' + result.error); return; }

      const tech = technicians.find(t => t.id === selectedTechnicianId);
      const techName = tech ? `${tech.firstName} ${tech.lastName}` : '';

      const updated = tickets.map(t =>
        t.id === selectedTicket.id
          ? { ...t, assignedToUserId: selectedTechnicianId, assignedToUserName: techName }
          : t
      );
      setTickets(updated);
      calculateStats(updated);
      setSelectedTicket({ ...selectedTicket, assignedToUserId: selectedTechnicianId, assignedToUserName: techName });
      setShowAssignModal(false);
      setSelectedTechnicianId('');
    } catch {
      alert('Failed to assign ticket');
    } finally {
      setAssignLoading(false);
    }
  };

  // ============ HELPERS ============

  const getStatusNumber = (label: string) => {
    const map: Record<string, number> = { 'Open': 1, 'InProgress': 2, 'Resolved': 3, 'Closed': 4 };
    return map[label] ?? 1;
  };

  const getStatusLabel = (status: number) => {
    const map: Record<number, string> = { 1: 'Open', 2: 'In Progress', 3: 'Resolved', 4: 'Closed' };
    return map[status] ?? 'Unknown';
  };

  const getStatusColor = (status: number) => {
    const map: Record<number, string> = {
      1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      4: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return map[status] ?? map[4];
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

  const filteredTickets = activeFilter === 'All'
    ? tickets
    : activeFilter === 'Unassigned'
    ? tickets.filter(t => !t.assignedToUserId)
    : tickets.filter(t => getStatusLabel(t.status) === activeFilter);

  // ============ RENDER ============

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading support queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg">
              <HeadphonesIcon size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Support Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review, prioritize and route tickets to technicians
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Total', value: stats.total, icon: <TrendingUp size={18} />, color: 'text-purple-600' },
            { label: 'Open', value: stats.open, icon: <AlertCircle size={18} />, color: 'text-red-600' },
            { label: 'In Progress', value: stats.inProgress, icon: <Clock size={18} />, color: 'text-amber-600' },
            { label: 'Resolved', value: stats.resolved, icon: <CheckCircle size={18} />, color: 'text-emerald-600' },
            { label: 'Unassigned', value: stats.unassigned, icon: <UserCheck size={18} />, color: 'text-orange-600' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <span className={color}>{icon}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Ticket List ── */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Filter size={20} /> Ticket Queue
              </h2>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['All', 'Open', 'In Progress', 'Resolved', 'Unassigned'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeFilter === filter
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter}
                    {filter === 'All' && ` (${stats.total})`}
                    {filter === 'Open' && ` (${stats.open})`}
                    {filter === 'In Progress' && ` (${stats.inProgress})`}
                    {filter === 'Resolved' && ` (${stats.resolved})`}
                    {filter === 'Unassigned' && ` (${stats.unassigned})`}
                  </button>
                ))}
              </div>

              {/* Ticket Items */}
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No tickets in this category</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {filteredTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
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
                            By: {ticket.createdByUserName} &nbsp;·&nbsp;
                            {ticket.assignedToUserName
                              ? `→ ${ticket.assignedToUserName}`
                              : <span className="text-orange-500">Unassigned</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Ticket Details Panel ── */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl h-fit">
            {selectedTicket ? (
              <>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Ticket Details</h3>

                <div className="space-y-4">

                  {/* Ticket Number */}
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Ticket ID</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedTicket.ticketNumber}</p>
                  </div>

                  {/* Title */}
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Title</p>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedTicket.title}</p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(selectedTicket.status)}`}>
                        {getStatusLabel(selectedTicket.status)}
                      </span>
                      <button
                        onClick={() => setShowStatusModal(true)}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        <ArrowUpDown size={12} /> Change
                      </button>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Priority</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded inline-block ${getPriorityBadge(selectedTicket.priority).color}`}>
                      {getPriorityBadge(selectedTicket.priority).label}
                    </span>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Assigned To</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedTicket.assignedToUserName ?? (
                          <span className="text-orange-500 italic">Unassigned</span>
                        )}
                      </p>
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        <UserCheck size={12} />
                        {selectedTicket.assignedToUserName ? 'Reassign' : 'Assign'}
                      </button>
                    </div>
                  </div>

                  {/* Created By */}
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Raised By</p>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedTicket.createdByUserName}</p>
                  </div>

                  {/* Created At */}
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Date</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedTicket.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Description */}
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
      </div>

      {/* ── Status Change Modal ── */}
      {showStatusModal && selectedTicket && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowStatusModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-7 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Change Status</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                {selectedTicket.ticketNumber}: {selectedTicket.title}
              </p>

              <div className="space-y-2 mb-5">
                {['Open', 'InProgress', 'Resolved', 'Closed'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedStatus === s
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {s === 'InProgress' ? 'In Progress' : s}
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

      {/* ── Assign Technician Modal ── */}
      {showAssignModal && selectedTicket && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowAssignModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-7 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Assign Technician</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                {selectedTicket.ticketNumber}: {selectedTicket.title}
              </p>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Technician
                </label>
                {technicians.length === 0 ? (
                  <p className="text-sm text-orange-500 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    No technicians available. Ask a TeamLead to invite technicians first.
                  </p>
                ) : (
                  <select
                    value={selectedTechnicianId}
                    onChange={e => setSelectedTechnicianId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Choose a technician...</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.firstName} {tech.lastName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAssignModal(false); setSelectedTechnicianId(''); }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedTechnicianId || assignLoading || technicians.length === 0}
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
