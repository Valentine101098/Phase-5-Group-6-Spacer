import React, { useState, useEffect } from "react";
import { Users, Building, Calendar, HandCoins, FileText, UserCheck, TrendingUp, X, AlertTriangle, CheckCircle, Eye, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { BookingsTable } from './BookingsTable';
import { InvoicesTable } from './InvoicesTable';
import SpaceCard from './SpaceCard';
import SpaceDetails from './SpaceDetails';
import { API_BASE_URL } from '../config/api';
import { formatCurrency } from './currency';

const AdminDashboard = () => {
  const { makeAuthenticatedRequest, user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addUserData, setAddUserData] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', password: '', confirmPassword: '', role: 'client'
  });
  const [editFormData, setEditFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Helper to normalize API responses
  const normalizeArray = (res, fallback = []) => {
    if (!res) return fallback;
    if (typeof res === 'object' && 'success' in res) {
      if (!res.success) return fallback;
      res = res.data;
    }
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object') {
      if (Array.isArray(res.users)) return res.users;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.bookings)) return res.bookings;
      if (Array.isArray(res.invoices)) return res.invoices;
      if (Array.isArray(res.spaces)) return res.spaces;
    }
    return fallback;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Admin sees ALL data
      const [usersRes, spacesRes, bookingsRes, invoicesRes] = await Promise.all([
        makeAuthenticatedRequest('/api/users/', 'GET'),
        makeAuthenticatedRequest('/api/spaces/all', 'GET'),
        makeAuthenticatedRequest('/api/bookings/', 'GET'),
        makeAuthenticatedRequest('/api/invoices/', 'GET')
      ]);

      setUsers(normalizeArray(usersRes));
      setSpaces(normalizeArray(spacesRes));
      setBookings(normalizeArray(bookingsRes));
      setInvoices(normalizeArray(invoicesRes));

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // User management functions
  const handleAddUser = () => {
    setAddUserData({ first_name: '', last_name: '', email: '', phone_number: '', password: '', confirmPassword: '', role: 'client' });
    setShowAddUserModal(true);
    setActionMessage({ type: '', text: '' });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({ first_name: user.first_name, last_name: user.last_name, phone_number: user.phone_number, password: '' });
    setShowEditModal(true);
    setActionMessage({ type: '', text: '' });
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setActionMessage({ type: '', text: '' });
  };

  const submitAddUser = async (e) => {
    e.preventDefault();
    setActionMessage({ type: '', text: '' });

    if (!addUserData.first_name || !addUserData.last_name || !addUserData.email || !addUserData.password) {
      setActionMessage({ type: 'error', text: 'First name, last name, email, and password are required.' });
      return;
    }

    if (addUserData.password !== addUserData.confirmPassword) {
      setActionMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: addUserData.first_name,
          last_name: addUserData.last_name,
          email: addUserData.email,
          phone_number: addUserData.phone_number,
          password: addUserData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessage({ type: 'success', text: 'User created successfully!' });

        if (addUserData.role !== 'client' && data.user) {
          try {
            const rolesResponse = await makeAuthenticatedRequest('/api/roles/', 'GET');
            if (rolesResponse.success) {
              const roles = normalizeArray(rolesResponse);
              const selectedRole = roles.find(r => r.role === addUserData.role);

              if (selectedRole) {
                const roleAssignData = { user_id: data.user.id, role_id: selectedRole.id };
                await makeAuthenticatedRequest('/api/user_roles/', 'POST', roleAssignData);
              }
            }
          } catch (roleError) {
            console.warn('Failed to assign role, but user was created:', roleError);
          }
        }

        await fetchData();

        setTimeout(() => {
          setShowAddUserModal(false);
          setActionMessage({ type: '', text: '' });
        }, 2000);

      } else {
        setActionMessage({ type: 'error', text: data.message || 'Registration failed.' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Network error or server unavailable.' });
    } finally {
      setActionLoading(false);
    }
  };

  const submitEditUser = async (e) => {
    e.preventDefault();
    setActionMessage({ type: '', text: '' });

    if (!editFormData.first_name || !editFormData.last_name) {
      setActionMessage({ type: 'error', text: 'First name and last name are required.' });
      return;
    }

    try {
      setActionLoading(true);

      const payload = {};
      if (editFormData.first_name !== selectedUser.first_name) payload.first_name = editFormData.first_name;
      if (editFormData.last_name !== selectedUser.last_name) payload.last_name = editFormData.last_name;
      if (editFormData.phone_number !== selectedUser.phone_number) payload.phone_number = editFormData.phone_number;

      if (editFormData.password) {
        if (editFormData.password.length < 8) {
          setActionMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
          setActionLoading(false);
          return;
        }
        payload.password = editFormData.password;
      }

      if (Object.keys(payload).length === 0) {
        setActionMessage({ type: 'error', text: 'No changes to save.' });
        setActionLoading(false);
        setShowEditModal(false);
        return;
      }

      const result = await makeAuthenticatedRequest(`/api/users/${selectedUser.id}`, 'PATCH', payload);

      if (result.success) {
        setActionMessage({ type: 'success', text: 'User updated successfully!' });
        await fetchData();
        setTimeout(() => {
          setShowEditModal(false);
          setSelectedUser(null);
          setActionMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Failed to update user.' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to update user: ' + error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await makeAuthenticatedRequest(`/api/users/${selectedUser.id}`, 'DELETE');

      if (response.success) {
        setActionMessage({ type: 'success', text: 'User deleted successfully!' });
        await fetchData();
        setTimeout(() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
          setActionMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setActionMessage({ type: 'error', text: response.error || 'Failed to delete user' });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to delete user: ' + error.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Use existing SpaceCard for admin
  const AdminSpaceCardWrapper = ({ space }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
      <div className="relative">
        <SpaceCard space={space} />
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowDetails(true)}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        {showDetails && (
          <SpaceDetails space={space} onClose={() => setShowDetails(false)} />
        )}
      </div>
    );
  };

  const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }) => (
    <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs sm:text-sm font-medium">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm flex items-center mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 sm:h-12 sm:w-12 text-${color}-500`} />
      </div>
    </div>
  );

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {label}
    </button>
  );

  // Get users with role information
  const recentUsers = users.map((user) => {
    const role = user?.user_roles?.[0]?.role?.role || "client";
    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone_number: user.phone_number,
      first_name: user.first_name,
      last_name: user.last_name,
      role,
      joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
    };
  });

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    totalSpaces: spaces.length,
    totalBookings: bookings.length,
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0),
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">Monitor and manage your space rental platform</p>
            </div>
            <div className="flex items-center">
              <span className="text-xs sm:text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6 sm:mb-8 overflow-x-auto pb-2">
          <TabButton id="overview" label="Overview" isActive={activeTab === 'overview'} onClick={setActiveTab} />
          <TabButton id="users" label="Users" isActive={activeTab === 'users'} onClick={setActiveTab} />
          <TabButton id="spaces" label="Spaces" isActive={activeTab === 'spaces'} onClick={setActiveTab} />
          <TabButton id="bookings" label="Bookings" isActive={activeTab === 'bookings'} onClick={setActiveTab} />
          <TabButton id="invoices" label="Invoices" isActive={activeTab === 'invoices'} onClick={setActiveTab} />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard icon={Users} title="Total Users" value={stats.totalUsers} />
              <StatCard icon={Building} title="Active Spaces" value={stats.totalSpaces} />
              <StatCard icon={Calendar} title="Total Bookings" value={stats.totalBookings} />
              <StatCard icon={HandCoins} title="Total Revenue" value={formatCurrency(stats.totalRevenue)} />
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Recent Users */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 sm:p-6 border-b">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Users</h3>
                </div>
                <div className="p-4 sm:p-6">
                  {recentUsers.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{user.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 whitespace-nowrap ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'owner' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Stats */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 sm:p-6 border-b">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Platform Statistics</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">Active Bookings</span>
                      <span className="font-semibold text-sm sm:text-base">
                        {bookings.filter(b => b.status === 'confirmed' || b.status === 'active').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">Pending Bookings</span>
                      <span className="font-semibold text-sm sm:text-base">
                        {bookings.filter(b => b.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">Available Spaces</span>
                      <span className="font-semibold text-sm sm:text-base">
                        {spaces.filter(s => s.status === 'available').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">Total Revenue</span>
                      <span className="font-semibold text-green-600 text-sm sm:text-base">
                        {formatCurrency(stats.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">User Management</h3>
                <p className="text-xs sm:text-sm text-gray-600">Manage platform users and their roles</p>
              </div>
              <button
                onClick={handleAddUser}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Add New User
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-base mr-2 sm:mr-3">
                              {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.name}</div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'owner' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{user.joinDate}</td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-2 sm:mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Spaces Tab */}
        {activeTab === 'spaces' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">All Spaces ({spaces.length})</h3>
            </div>

            {spaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {spaces.map(space => (
                  <AdminSpaceCardWrapper key={space.id} space={space} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No spaces available</p>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab - Use existing BookingsTable */}
        {activeTab === 'bookings' && (
          <div className="space-y-4 sm:space-y-6">
            <BookingsTable />
          </div>
        )}

        {/* Invoices Tab - Use existing InvoicesTable */}
        {activeTab === 'invoices' && (
          <div className="space-y-4 sm:space-y-6">
            <InvoicesTable />
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
          <div className="relative top-10 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Add New User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {actionMessage.text && (
              <div className={`mb-4 p-3 rounded text-sm ${
                actionMessage.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className="flex items-center">
                  {actionMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  {actionMessage.text}
                </div>
              </div>
            )}

            <form onSubmit={submitAddUser} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="add-first-name" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">First Name:</label>
                <input
                  type="text"
                  id="add-first-name"
                  name="first_name"
                  value={addUserData.first_name}
                  onChange={(e) => setAddUserData({...addUserData, first_name: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="add-last-name" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">Last Name:</label>
                <input
                  type="text"
                  id="add-last-name"
                  name="last_name"
                  value={addUserData.last_name}
                  onChange={(e) => setAddUserData({...addUserData, last_name: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="add-email" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">Email:</label>
                <input
                  type="email"
                  id="add-email"
                  name="email"
                  value={addUserData.email}
                  onChange={(e) => setAddUserData({...addUserData, email: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="add-phone-number" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">Phone Number:</label>
                <input
                  type="tel"
                  id="add-phone-number"
                  name="phone_number"
                  value={addUserData.phone_number}
                  onChange={(e) => setAddUserData({...addUserData, phone_number: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="add-password" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">Password:</label>
                <input
                  type="password"
                  id="add-password"
                  name="password"
                  value={addUserData.password}
                  onChange={(e) => setAddUserData({...addUserData, password: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="add-confirm-password" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">Confirm Password:</label>
                <input
                  type="password"
                  id="add-confirm-password"
                  name="confirmPassword"
                  value={addUserData.confirmPassword}
                  onChange={(e) => setAddUserData({...addUserData, confirmPassword: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="add-role" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">Role:</label>
                <select
                  id="add-role"
                  name="role"
                  value={addUserData.role}
                  onChange={(e) => setAddUserData({...addUserData, role: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="client">Client</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 text-sm"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {actionLoading ? 'Creating...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
          <div className="relative top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {actionMessage.text && (
              <div className={`mb-4 p-3 rounded text-sm ${
                actionMessage.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className="flex items-center">
                  {actionMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  {actionMessage.text}
                </div>
              </div>
            )}

            <form onSubmit={submitEditUser} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="edit-first-name" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">First Name:</label>
                <input
                  type="text"
                  id="edit-first-name"
                  name="first_name"
                  value={editFormData.first_name || ''}
                  onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-last-name" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">Last Name:</label>
                <input
                  type="text"
                  id="edit-last-name"
                  name="last_name"
                  value={editFormData.last_name || ''}
                  onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-phone-number" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">Phone Number:</label>
                <input
                  type="tel"
                  id="edit-phone-number"
                  name="phone_number"
                  value={editFormData.phone_number || ''}
                  onChange={(e) => setEditFormData({...editFormData, phone_number: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-password" className="block text-left text-gray-700 text-xs sm:text-sm font-bold mb-2">New Password (optional):</label>
                <input
                  type="password"
                  id="edit-password"
                  name="password"
                  value={editFormData.password || ''}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditFormData({});
                    setActionMessage({ type: '', text: '' });
                  }}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 text-sm"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
          <div className="relative top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete User</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {actionMessage.text && (
              <div className={`mb-4 p-3 rounded text-sm ${
                actionMessage.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className="flex items-center">
                  {actionMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  {actionMessage.text}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Deletion</h4>
                  <p className="text-xs sm:text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">
                Are you sure you want to delete <strong>{selectedUser?.name}</strong>?
                This will remove the user from the system.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 text-sm"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;