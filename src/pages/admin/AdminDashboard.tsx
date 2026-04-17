

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRoleCheck } from '../../hooks/useRoleCheck';
import Sidebar from '../../components/sidebar';
import { ThemeToggle } from '../../components/ui/theme-toggle';
import apiClient from '../../services/api';
import type { RecentActivity } from '../../types';


// Types for Charts
interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
}

interface AdminStatsFromBackend {
  totalUsers: number;
  totalAdmins: number;
  totalTeamLeads: number;
  totalTechnicians: number;
  totalCustomers: number;
  totalSupport: number;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTimeHours: number;
  lastUpdated: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { isAdmin } = useRoleCheck();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data state
  const [stats, setStats] = useState<AdminStatsFromBackend | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Protect route
//   useEffect(() => {
//     console.log('AdminDashboard: Route protection check');
//     if (!user) {
//       navigate('/login');
//       return;
//     }

//     if (!isAdmin()) {
//       navigate('/dashboard');
//       return;
//     }

//     fetchAdminData();
//   }, [user, isAdmin, navigate]);


useEffect(() => {
  console.log(' AdminDashboard: checking auth state');

  if (!user) {
    console.log(' No user yet, waiting...');
    return; // don't redirect immediately
  }

  if (!isAdmin()) {
    console.log(' Not admin, redirecting');
    navigate('/dashboard');
    return;
  }

  console.log('Auth OK, fetching data');
  fetchAdminData();
}, [user, isAdmin, navigate]);
    // useEffect(() => {
    //     console.log(' AdminDashboard mounted - checking auth');
    //     if (!user) {
    //         console.log(' No user, redirecting to login');
    //         navigate('/login');
    //         return;
    //     }

    //     if (!isAdmin()) {
    //         console.log(' Not admin, redirecting to dashboard');
    //         navigate('/dashboard');
    //         return;
    //     }

    //     console.log(' Auth passed, loading data');
    //     fetchAdminData();
    //     }, []);
    
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching admin stats from backend...');

      // Call /api/admin/stats endpoint
      const response = await apiClient.get('/admin/stats');
      console.log('Admin stats response:', response.data);

      // Extract stats from response wrapper
      const statsData: AdminStatsFromBackend = response.data?.data;

      if (statsData) {
        console.log('Stats loaded:', statsData);
        setStats(statsData);
      }

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'ticket_created',
          description: 'New support ticket created',
          timestamp: new Date().toISOString(),
          userId: '1',
          userName: 'John Customer',
        },
        {
          id: '3',
          type: 'ticket_resolved',
          description: 'Ticket #123 resolved successfully',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          userId: '2',
          userName: 'Jane Technician',
        },
      ]);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    clearAuth();
    navigate('/login');
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'ticket_created':
        return (
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'ticket_resolved':
        return (
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 24) return date.toLocaleDateString();
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // ===== PIE CHART DATA =====
  const userRoleData: ChartDataItem[] = stats ? [
    { name: 'Admin', value: stats.totalAdmins, fill: '#ef4444' },
    { name: 'Team Lead', value: stats.totalTeamLeads, fill: '#3b82f6' },
    { name: 'Technician', value: stats.totalTechnicians, fill: '#10b981' },
    { name: 'Support', value: stats.totalSupport, fill: '#a855f7' },
    { name: 'Customer', value: stats.totalCustomers, fill: '#6b7280' },
  ].filter((item: ChartDataItem) => item.value > 0) : [];

  const ticketStatusData: ChartDataItem[] = stats ? [
    { name: 'Open', value: stats.openTickets, fill: '#f97316' },
    { name: 'In Progress', value: stats.inProgressTickets, fill: '#eab308' },
    { name: 'Resolved', value: stats.resolvedTickets, fill: '#06b6d4' },
    { name: 'Closed', value: stats.closedTickets, fill: '#10b981' },
  ].filter((item: ChartDataItem) => item.value > 0) : [];

  // Dynamic Pie Chart Component (no external chart library needed)
  const PieChartComponent = ({ data, title }: { data: ChartDataItem[], title: string }) => {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{title}</h3>
        
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item: ChartDataItem, idx: number) => {
              const total = data.reduce((sum: number, d: ChartDataItem) => sum + d.value, 0);
              const percentage = ((item.value / total) * 100).toFixed(1);
              
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.fill 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No data available
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Total: {data.reduce((sum: number, d: ChartDataItem) => sum + d.value, 0)} items
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-800/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${!sidebarOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">System overview & analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {loading ? (
            // ===== LOADING STATE =====
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="inline-flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-spin opacity-75"></div>
                    <div className="absolute inset-2 bg-white dark:bg-slate-950 rounded-full"></div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">Loading admin data...</p>
              </div>
            </div>
          ) : error ? (
            // ===== ERROR STATE =====
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-red-900 dark:text-red-100 font-semibold mb-1">Failed to load data</h3>
                  <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
                  <button 
                    onClick={fetchAdminData}
                    className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : stats ? (
            // ===== SUCCESS STATE =====
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {/* Total Users - Blue */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/90 text-sm font-medium">Total Users</span>
                      <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-6-6 6 6 0 00-6 6z" />
                      </svg>
                    </div>
                    <p className="text-4xl font-bold">{stats.totalUsers}</p>
                    <p className="text-blue-100 text-xs mt-2">All roles combined</p>
                  </div>
                </div>

                {/* Total Tickets - Purple */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/90 text-sm font-medium">Total Tickets</span>
                      <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <p className="text-4xl font-bold">{stats.totalTickets}</p>
                    <p className="text-purple-100 text-xs mt-2">All time created</p>
                  </div>
                </div>

                {/* Open Tickets - Orange */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/90 text-sm font-medium">Open</span>
                      <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-4xl font-bold">{stats.openTickets}</p>
                    <p className="text-orange-100 text-xs mt-2">Awaiting action</p>
                  </div>
                </div>

                {/* Resolved Tickets - Green */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/90 text-sm font-medium">Resolved</span>
                      <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-4xl font-bold">{stats.resolvedTickets}</p>
                    <p className="text-green-100 text-xs mt-2">Completed</p>
                  </div>
                </div>

                {/* Avg Resolution Time - Indigo */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/90 text-sm font-medium">Avg Time</span>
                      <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-4xl font-bold">{Math.round(stats.averageResolutionTimeHours)}h</p>
                    <p className="text-indigo-100 text-xs mt-2">To resolution</p>
                  </div>
                </div>
              </div>

              {/* CHART SECTION - Custom Pie Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <PieChartComponent 
                  data={userRoleData} 
                  title="Users Distribution" 
                />
                <PieChartComponent 
                  data={ticketStatusData} 
                  title="Tickets Distribution" 
                />
              </div>

              {/* Recent Activity */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-lg p-8 mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Recent Activity</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {activity.userName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {formatTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </div>
            </>
          ) : null}
        </main>
      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700 transform transition-all">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Confirm Logout</h3>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to log out?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
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








