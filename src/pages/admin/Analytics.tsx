// src/pages/admin/Analytics.tsx - Premium Analytics Dashboard

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getAdminStats } from '../../services/adminApi';
import { BarChart3, TrendingUp, Users, Ticket, Clock, Activity } from 'lucide-react';

interface AdminStats {
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
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color = 'blue' 
}: { 
  icon: any; 
  label: string; 
  value: number | string; 
  trend?: number;
  color?: string;
}) => {
  const colorClass = {
    blue: 'from-blue-600 to-blue-700',
    purple: 'from-purple-600 to-purple-700',
    emerald: 'from-emerald-600 to-emerald-700',
    orange: 'from-orange-600 to-orange-700',
    rose: 'from-rose-600 to-rose-700',
    indigo: 'from-indigo-600 to-indigo-700',
  }[color];

  const bgColor = {
    blue: 'bg-blue-50 dark:bg-blue-950',
    purple: 'bg-purple-50 dark:bg-purple-950',
    emerald: 'bg-emerald-50 dark:bg-emerald-950',
    orange: 'bg-orange-50 dark:bg-orange-950',
    rose: 'bg-rose-50 dark:bg-rose-950',
    indigo: 'bg-indigo-50 dark:bg-indigo-950',
  }[color];

  return (
    <div className={`${bgColor} backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group cursor-default overflow-hidden relative`}>
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend !== undefined && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const TicketStatusBar = ({ 
  label, 
  value, 
  total, 
  color = 'blue' 
}: { 
  label: string; 
  value: number; 
  total: number;
  color?: string;
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  const colorClass = {
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-500 to-amber-600',
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
  }[color];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default function Analytics() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Analytics page mounted - loading stats');
        const response = await getAdminStats();
        
        if (response.error) {
          setError(response.error);
          return;
        }
        
        if (response.data) {
          setStats(response.data);
          console.log('Stats loaded:', response.data);
        }
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (!user?.role || user.role !== 1) {
    return (
      <div className="p-8">
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-8">
          <h2 className="text-lg font-bold text-rose-900 dark:text-rose-400 mb-2">
            🔒 Access Denied
          </h2>
          <p className="text-rose-700 dark:text-rose-300">
            Only SuperAdmins can access the analytics dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin">
            <BarChart3 size={48} className="text-blue-600 mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-8">
          <h2 className="text-lg font-bold text-red-900 dark:text-red-400 mb-2">
             Error Loading Analytics
          </h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const resolutionRate = stats.totalTickets > 0 
    ? Math.round(((stats.resolvedTickets + stats.closedTickets) / stats.totalTickets) * 100)
    : 0;

  const activeTickets = stats.openTickets + stats.inProgressTickets;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg">
              <BarChart3 size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time system insights and metrics</p>
            </div>
          </div>
        </div>

        {/* KPI Cards - User Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} />
            User Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
            <StatCard icon={Activity} label="SuperAdmins" value={stats.totalAdmins} color="purple" />
            <StatCard icon={Users} label="Team Leads" value={stats.totalTeamLeads} color="indigo" />
            <StatCard icon={Users} label="Technicians" value={stats.totalTechnicians} color="emerald" />
            <StatCard icon={Users} label="Support Staff" value={stats.totalSupport} color="orange" />
            <StatCard icon={Users} label="Customers" value={stats.totalCustomers} color="rose" />
          </div>
        </div>

        {/* Ticket Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ticket Status */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Ticket size={20} />
              Ticket Status Distribution
            </h3>
            
            <div className="space-y-6">
              <TicketStatusBar label="Open" value={stats.openTickets} total={stats.totalTickets} color="red" />
              <TicketStatusBar label="In Progress" value={stats.inProgressTickets} total={stats.totalTickets} color="amber" />
              <TicketStatusBar label="Resolved" value={stats.resolvedTickets} total={stats.totalTickets} color="blue" />
              <TicketStatusBar label="Closed" value={stats.closedTickets} total={stats.totalTickets} color="emerald" />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTickets}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{activeTickets}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-6">
            {/* Resolution Rate Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-3xl p-8 border border-emerald-200 dark:border-emerald-800 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">Resolution Rate</p>
                  <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{resolutionRate}%</div>
                </div>
                <TrendingUp size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${resolutionRate}%` }} />
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-4">
                {stats.resolvedTickets + stats.closedTickets} of {stats.totalTickets} tickets resolved
              </p>
            </div>

            {/* Average Resolution Time */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-3xl p-8 border border-blue-200 dark:border-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">Avg Resolution Time</p>
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.averageResolutionTimeHours.toFixed(1)}
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">hours</p>
                </div>
                <Clock size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-4">
                Average time from creation to resolution
              </p>
            </div>
          </div>
        </div>

        {/* System Health Summary */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity size={20} />
            System Health Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/10 rounded-2xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-2">Backlog Status</p>
              <p className={`text-2xl font-bold ${activeTickets === 0 ? 'text-emerald-600' : activeTickets <= 5 ? 'text-blue-600' : 'text-orange-600'}`}>
                {activeTickets === 0 ? '✓ Clear' : activeTickets <= 5 ? 'Good' : 'Review'}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/10 rounded-2xl border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-2">Efficiency</p>
              <p className={`text-2xl font-bold ${resolutionRate >= 80 ? 'text-emerald-600' : resolutionRate >= 60 ? 'text-blue-600' : 'text-orange-600'}`}>
                {resolutionRate >= 80 ? 'Excellent' : resolutionRate >= 60 ? 'Good' : 'Fair'}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/10 rounded-2xl border border-indigo-200 dark:border-indigo-800">
              <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium mb-2">Team Capacity</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalTechnicians + stats.totalTeamLeads}</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">staff</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/10 rounded-2xl border border-rose-200 dark:border-rose-800">
              <p className="text-xs text-rose-700 dark:text-rose-400 font-medium mb-2">User Base</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.totalCustomers}</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">customers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

