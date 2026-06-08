// src/pages/admin/AdminDashboard.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRoleCheck } from '../../hooks/useRoleCheck';
import apiClient from '../../services/api';
import type { RecentActivity } from '../../types';

// Role view imports
import CustomerDashboard from '../customer/CustomerDashboard';
import TeamLeadDashboard from '../teamlead/TeamLeadDashboard';
import TechnicianDashboard from '../technician/TechnicianDashboard';
import SupportDashboard from '../support/SupportDashboard';

// ── Types ─────────────────────────────────────────────────────────────────────

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

type RoleView = 'admin' | 'customer' | 'teamlead' | 'technician' | 'support';

interface RoleOption {
  value: RoleView;
  label: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
}

// ── Role options config ────────────────────────────────────────────────────────

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'admin',
    label: 'Admin Dashboard',
    icon: '',
    color: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    description: 'System overview & analytics',
  },
  {
    value: 'support',
    label: 'Support View',
    icon: '',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    description: 'Ticket queue & routing',
  },
  {
    value: 'teamlead',
    label: 'Team Lead View',
    icon: '',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    description: 'Team & ticket management',
  },
  {
    value: 'technician',
    label: 'Technician View',
    icon: '',
    color: 'text-cyan-700 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/30',
    description: 'Assigned work queue',
  },
  {
    value: 'customer',
    label: 'Customer View',
    icon: '',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/30',
    description: 'My tickets & requests',
  },
];

// ── Role Switcher Dropdown ────────────────────────────────────────────────────

function RoleSwitcher({
  current,
  onChange,
}: {
  current: RoleView;
  onChange: (role: RoleView) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentOption = ROLE_OPTIONS.find((r) => r.value === current)!;

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-semibold text-gray-800 dark:text-gray-200"
      >
        <span className="text-base">{currentOption.icon}</span>
        <span>{currentOption.label}</span>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Preview as role
            </p>
          </div>

          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                current === option.value
                  ? `${option.bg} ${option.color}`
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-xl mt-0.5">{option.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{option.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">
                  {option.description}
                </p>
              </div>
              {current === option.value && (
                <svg
                  className="w-4 h-4 ml-auto shrink-0 mt-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}

          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              🛡️ Previewing as admin. Your role is unchanged.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pie Chart ─────────────────────────────────────────────────────────────────

function PieChartComponent({
  data,
  title,
}: {
  data: ChartDataItem[];
  title: string;
}) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-lg p-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{title}</h3>

      {data.length > 0 ? (
        <div className="space-y-4">
          {data.map((item, idx) => {
            const total = data.reduce((sum, d) => sum + d.value, 0);
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.value} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: item.fill }}
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

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Total: {data.reduce((sum, d) => sum + d.value, 0)} items
        </p>
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isAdmin } = useRoleCheck();

  const [stats, setStats] = useState<AdminStatsFromBackend | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role preview state
  const [activeRole, setActiveRole] = useState<RoleView>('admin');

  useEffect(() => {
    if (!user) return;
    if (!isAdmin()) { navigate('/dashboard'); return; }
    fetchAdminData();
  }, [user, isAdmin, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/admin/stats');
      const statsData: AdminStatsFromBackend = response.data?.data;
      if (statsData) setStats(statsData);

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
          id: '2',
          type: 'ticket_resolved',
          description: 'Ticket #123 resolved successfully',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          userId: '2',
          userName: 'Jane Technician',
        },
      ]);
    } catch {
      setError('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return date.toLocaleDateString();
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    if (type === 'ticket_created')
      return (
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      );
    if (type === 'ticket_resolved')
      return (
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    return null;
  };

  const userRoleData: ChartDataItem[] = stats
    ? [
        { name: 'Admin', value: stats.totalAdmins, fill: '#ef4444' },
        { name: 'Team Lead', value: stats.totalTeamLeads, fill: '#3b82f6' },
        { name: 'Technician', value: stats.totalTechnicians, fill: '#10b981' },
        { name: 'Support', value: stats.totalSupport, fill: '#a855f7' },
        { name: 'Customer', value: stats.totalCustomers, fill: '#6b7280' },
      ].filter((d) => d.value > 0)
    : [];

  const ticketStatusData: ChartDataItem[] = stats
    ? [
        { name: 'Open', value: stats.openTickets, fill: '#f97316' },
        { name: 'In Progress', value: stats.inProgressTickets, fill: '#eab308' },
        { name: 'Resolved', value: stats.resolvedTickets, fill: '#06b6d4' },
        { name: 'Closed', value: stats.closedTickets, fill: '#10b981' },
      ].filter((d) => d.value > 0)
    : [];

  // ── Render non-admin role previews ──────────────────────────────────────────

  if (activeRole !== 'admin') {
    const currentOption = ROLE_OPTIONS.find((r) => r.value === activeRole)!;

    return (
      <div className="relative">
        {/* Sticky preview banner */}
        <div className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-3 bg-indigo-600 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg">{currentOption.icon}</span>
            <div>
              <p className="text-sm font-semibold">
                Previewing: {currentOption.label}
              </p>
              <p className="text-xs text-indigo-200">
                You are still logged in as Admin — this is a preview only
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RoleSwitcher current={activeRole} onChange={setActiveRole} />
            <button
              onClick={() => setActiveRole('admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              ← Back to Admin
            </button>
          </div>
        </div>

        {/* Render role dashboard */}
        {activeRole === 'support' && <SupportDashboard view="overview" />}
        {activeRole === 'teamlead' && <TeamLeadDashboard view="overview" />}
        {activeRole === 'technician' && <TechnicianDashboard view="overview" />}
        {activeRole === 'customer' && <CustomerDashboard />}
      </div>
    );
  }

  // ── Render admin dashboard ───────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            System overview &amp; analytics
          </p>
        </div>

        {/* Role switcher in the admin header */}
        <RoleSwitcher current={activeRole} onChange={setActiveRole} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="inline-flex items-center justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-spin opacity-75" />
                <div className="absolute inset-2 bg-white dark:bg-slate-950 rounded-full" />
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">
              Loading admin data...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <p className="text-red-900 dark:text-red-100 font-semibold mb-1">Failed to load data</p>
          <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
          <button
            onClick={fetchAdminData}
            className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      ) : stats ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers, sub: 'All roles combined', from: 'from-blue-500', to: 'to-blue-600', sub2: 'text-blue-100' },
              { label: 'Total Tickets', value: stats.totalTickets, sub: 'All time created', from: 'from-purple-500', to: 'to-purple-600', sub2: 'text-purple-100' },
              { label: 'Open', value: stats.openTickets, sub: 'Awaiting action', from: 'from-orange-500', to: 'to-orange-600', sub2: 'text-orange-100' },
              { label: 'Resolved', value: stats.resolvedTickets, sub: 'Completed', from: 'from-green-500', to: 'to-green-600', sub2: 'text-green-100' },
              { label: 'Avg Time', value: `${Math.round(stats.averageResolutionTimeHours)}h`, sub: 'To resolution', from: 'from-indigo-500', to: 'to-indigo-600', sub2: 'text-indigo-100' },
            ].map(({ label, value, sub, from, to, sub2 }) => (
              <div
                key={label}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${from} ${to} p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <p className="text-white/90 text-sm font-medium mb-4">{label}</p>
                  <p className="text-4xl font-bold">{value}</p>
                  <p className={`${sub2} text-xs mt-2`}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Role Quick-Access Cards */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Preview Role Dashboards
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ROLE_OPTIONS.filter((r) => r.value !== 'admin').map((role) => (
                <button
                  key={role.value}
                  onClick={() => setActiveRole(role.value)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-transparent ${role.bg} hover:border-current ${role.color} transition-all hover:shadow-md group`}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {role.icon}
                  </span>
                  <p className={`text-sm font-semibold ${role.color}`}>{role.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">
                    {role.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PieChartComponent data={userRoleData} title="Users Distribution" />
            <PieChartComponent data={ticketStatusData} title="Tickets Distribution" />
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
              Recent Activity
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
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
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No recent activity
                </p>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date(stats.lastUpdated).toLocaleString()}
          </div>
        </>
      ) : null}
    </div>
  );
}


