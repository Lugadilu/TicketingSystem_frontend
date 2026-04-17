// src/pages/admin/UsersList.tsx - UPDATED TO MATCH adminApi ROLE CONVERSION

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Sidebar from '../../components/sidebar';
import { ThemeToggle } from '../../components/ui/theme-toggle';
import { getAllUsers, inviteUser } from '../../services/adminApi';
import type { User } from '../../types';

export default function UsersList() {
  const { clearAuth } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Form state - role as STRING (will be converted to number in adminApi)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'Technician', // STRING, not union type
  });

  // Load data on mount only
  useEffect(() => {
    console.log('👥 UsersList mounted - loading users');
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllUsers();

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data && Array.isArray(response.data)) {
        console.log('Users loaded:', response.data);
        setUsers(response.data);
      } else {
        setError('Unexpected response format');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
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
    window.location.href = '/login';
  };

  const handleViewDetails = (userData: User) => {
    setSelectedUser(userData);
  };

  const handleCloseDetailsModal = () => {
    setSelectedUser(null);
  };

  const handleInviteClick = () => {
    setIsInviteModalOpen(true);
    setInviteError(null);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteForm({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'Technician',
    });
    setInviteError(null);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      setInviteError('Please fill in all required fields');
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError(null);

      console.log('📨 Submitting invite:', inviteForm);

      // Pass as STRING - adminApi converts to number
      const response = await inviteUser({
        email: inviteForm.email,
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        phoneNumber: inviteForm.phoneNumber,
        role: inviteForm.role, // STRING: 'Technician' or 'Team Lead'
      });

      if (response.error) {
        setInviteError(response.error);
        return;
      }

      if (response.data) {
        console.log('User invited successfully:', response.data);
        setUsers([...users, response.data]);
        handleCloseInviteModal();
        // Show success message
      } else {
        setInviteError('Failed to invite user: No data returned');
      }
    } catch (err: any) {
      console.error('Error inviting user:', err);
      setInviteError(err.message || 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  };

  const getRoleColor = (role: number) => {
    switch (role) {
      case 1:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 2:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 3:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 4:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 6:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 1:
        return 'Admin';
      case 2:
        return 'Team Lead';
      case 3:
        return 'Support';
      case 4:
        return 'Technician';
      case 6:
        return 'Customer';
      default:
        return 'Unknown';
    }
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Users Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Manage system users</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleInviteClick}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              + Invite User
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="inline-flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-spin opacity-75"></div>
                    <div className="absolute inset-2 bg-white dark:bg-slate-950 rounded-full"></div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-red-900 dark:text-red-100 font-semibold mb-1">Failed to load users</h3>
                  <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
                  <button
                    onClick={fetchUsers}
                    className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                      <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        Name
                      </th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        Email
                      </th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        Role
                      </th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        Joined
                      </th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {users.length > 0 ? (
                      users.map((userData) => (
                        <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                            {userData.firstName} {userData.lastName}
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{userData.email}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(userData.role)}`}
                            >
                              {getRoleName(userData.role)}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                userData.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                              }`}
                            >
                              {userData.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                            {new Date(userData.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => handleViewDetails(userData)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No users found
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

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Confirm Logout
              </h3>
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <p className="text-gray-900 dark:text-white">{getRoleName(selectedUser.role)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedUser.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetailsModal}
                className="w-full mt-6 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Invite User</h3>

              {inviteError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{inviteError}</p>
                </div>
              )}

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={inviteForm.phoneNumber}
                    onChange={(e) => setInviteForm({ ...inviteForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="Technician">Technician</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Support">Support</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                  >
                    {inviteLoading ? 'Inviting...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



