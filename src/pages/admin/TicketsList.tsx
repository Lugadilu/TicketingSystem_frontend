// src/pages/admin/TicketsList.tsx - FULLY FIXED

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Sidebar from '../../components/sidebar';
import { ThemeToggle } from '../../components/ui/theme-toggle';
import { getAllTickets, changeTicketStatus, closeTicket } from '../../services/adminApi';
import type { Ticket as TicketType } from '../../types';

type TicketStatusType = 'Open' | 'InProgress' | 'Resolved' | 'Closed';

export default function TicketsList() {
  const { clearAuth } = useAuthStore();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Form state - use string for status (API returns string)
  const [statusForm, setStatusForm] = useState<{ status: TicketStatusType }>({ status: 'Open' });

  //  Load data on mount only
  useEffect(() => {
    console.log('TicketsList mounted - loading tickets');
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllTickets();
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        console.log('Tickets loaded:', response.data);
        // Handle both array and paginated response
        const ticketData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).items || [];
        
        // Cast to our types if needed
        setTickets(ticketData as TicketType[]);
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (ticketId: string, newStatus: TicketStatusType) => {
    try {
      // Pass object with status field (properly typed)
      const response = await changeTicketStatus(ticketId, { status: newStatus });
      
      if (response.error) {
        setError(response.error);
        return;
      }

      console.log('✅ Ticket status changed');
      fetchTickets();
      setIsStatusModalOpen(false);
    } catch (err) {
      console.error('Error changing status:', err);
      setError('Failed to change status');
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to close this ticket?')) return;

    try {
      const response = await closeTicket(ticketId);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      console.log('Ticket closed');
      fetchTickets();
      setIsDetailModalOpen(false);
    } catch (err) {
      console.error('Error closing ticket:', err);
      setError('Failed to close ticket');
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    clearAuth();
    window.location.href = '/login';
  };

  // Handle both string and number priority values
  const getPriorityColor = (priority: string | number) => {
    const priorityStr = String(priority).toLowerCase();
    switch (priorityStr) {
      case 'critical': case '4': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'high': case '3': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
      case 'medium': case '2': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'low': case '1': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  // Handle both string and number status values
  const getStatusColor = (status: string | number) => {
    const statusStr = String(status).toLowerCase();
    switch (statusStr) {
      case 'open': case '1': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'inprogress': case 'in progress': case '2': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'resolved': case '3': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200';
      case 'closed': case '4': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusDisplay = (status: string | number) => {
    const statusStr = String(status);
    if (statusStr === 'InProgress' || statusStr === 'in progress') return 'In Progress';
    return statusStr;
  };

  const getPriorityDisplay = (priority: string | number) => {
    return String(priority);
  };

  // Validate and convert status to correct type
  const isValidStatus = (status: any): status is TicketStatusType => {
    return ['Open', 'InProgress', 'Resolved', 'Closed'].includes(status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-800/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <svg className={`w-5 h-5 transition-transform duration-200 ${!sidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Tickets Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Manage support tickets</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="relative w-16 h-16 inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-spin opacity-75"></div>
                  <div className="absolute inset-2 bg-white dark:bg-slate-950 rounded-full"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">Loading tickets...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-6">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-red-900 dark:text-red-100 font-semibold mb-1">Failed to load tickets</h3>
                  <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
                  <button onClick={fetchTickets} className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 underline">
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Ticket #</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Priority</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Assigned To</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {tickets.length > 0 ? (
                      tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900 dark:text-white">{(ticket as any).ticketNumber || ticket.id.slice(0, 8)}</td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{ticket.title}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {getStatusDisplay(ticket.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor((ticket as any).priority || 'Low')}`}>
                              {getPriorityDisplay((ticket as any).priority || 'Low')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {(ticket as any).assignedToUserName === 'Unassigned' 
                              ? <span className="text-orange-600 dark:text-orange-400 font-medium">Unassigned</span>
                              : (ticket as any).assignedToUserName || 'N/A'
                            }
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => {
                                setSelectedTicket(ticket);
                                setIsDetailModalOpen(true);
                              }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium text-sm">
                                Details
                              </button>
                              <button onClick={() => {
                                setSelectedTicket(ticket);
                                const currentStatus = String(ticket.status) as TicketStatusType;
                                if (isValidStatus(currentStatus)) {
                                  setStatusForm({ status: currentStatus });
                                } else {
                                  setStatusForm({ status: 'Open' });
                                }
                                setIsStatusModalOpen(true);
                              }} className="text-purple-600 dark:text-purple-400 hover:text-purple-800 font-medium text-sm">
                                Status
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No tickets found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Ticket Details Modal */}
      {isDetailModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-slate-700 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTicket.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{(selectedTicket as any).ticketNumber || selectedTicket.id.slice(0, 8)}</p>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusDisplay(selectedTicket.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Priority</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getPriorityColor((selectedTicket as any).priority || 'Low')}`}>
                    {getPriorityDisplay((selectedTicket as any).priority || 'Low')}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</p>
                <p className="text-gray-900 dark:text-white">{selectedTicket.description}</p>
              </div>

              <button onClick={() => handleCloseTicket(selectedTicket.id)} className="w-full mt-6 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {isStatusModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Change Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{(selectedTicket as any).ticketNumber || selectedTicket.id.slice(0, 8)}</p>

              <form onSubmit={(e) => { e.preventDefault(); handleChangeStatus(selectedTicket.id, statusForm.status); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Status</label>
                  <select 
                    value={statusForm.status} 
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isValidStatus(value)) {
                        setStatusForm({ status: value });
                      }
                    }} 
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsStatusModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Confirm Logout</h3>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to log out?</p>
              <div className="flex gap-3">
                <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={confirmLogout} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


