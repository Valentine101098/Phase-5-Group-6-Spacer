import React, { useState, useEffect } from "react";
import {
  Users,
  Building,
  Calendar,
  HandCoins,
  FileText,
  UserCheck,
  TrendingUp,
  X,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

const AdminDashboard = () => {
  const { makeAuthenticatedRequest } = useAuth();

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
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    role: 'client'
  });
  const [editFormData, setEditFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Helper to safely extract an array from the various possible response shapes
  const normalizeArray = (res, fallback = []) => {
    if (!res) return fallback;

    // If your makeAuthenticatedRequest returns { success: true, data: ... }
    if (typeof res === 'object' && 'success' in res) {
      if (!res.success) return fallback;
      res = res.data;
    }

    // If res is already an array
    if (Array.isArray(res)) return res;

    // If res is an object that wraps the array in common keys:
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

      const [
        usersRes,
        spacesRes,
        bookingsRes,
        invoicesRes
      ] = await Promise.all([
        makeAuthenticatedRequest('/api/users/', 'GET'),
        makeAuthenticatedRequest('/api/spaces/', 'GET'),
        makeAuthenticatedRequest('/api/bookings/', 'GET'),
        makeAuthenticatedRequest('/api/invoices/', 'GET')
      ]);

      const usersArr = normalizeArray(usersRes);
      const spacesArr = normalizeArray(spacesRes);
      const bookingsArr = normalizeArray(bookingsRes);
      const invoicesArr = normalizeArray(invoicesRes);

      setUsers(usersArr);
      setSpaces(spacesArr);
      setBookings(bookingsArr);
      setInvoices(invoicesArr);

      const possibleErrors = [usersRes, spacesRes, bookingsRes, invoicesRes]
        .filter(r => r && typeof r === 'object' && 'success' in r && !r.success)
        .map(r => r.error);
      if (possibleErrors.length) {
        setError(possibleErrors[0]);
        console.warn('API partial errors:', possibleErrors);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [makeAuthenticatedRequest]);

  // User Actions

  const handleAddUser = () => {
    setAddUserData({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      password: '',
      role: 'client'
    });
    setShowAddUserModal(true);
    setActionMessage({ type: '', text: '' });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      first_name: user.name.split(' ')[0] || '',
      last_name: user.name.split(' ').slice(1).join(' ') || '',
      phone_number: user.phone_number || ''
    });
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
 
    // Validate required fields
    if (!addUserData.first_name || !addUserData.last_name || !addUserData.email || !addUserData.password) {
      setActionMessage({ type: 'error', text: 'All fields except phone number are required' });
      return;
    }
 
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addUserData.email)) {
      setActionMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
 
    // Validate password length
    if (addUserData.password.length < 6) {
      setActionMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }
 
    try {
      setActionLoading(true);
 
      // First, create the user
      const signupData = {
        first_name: addUserData.first_name,
        last_name: addUserData.last_name,
        email: addUserData.email,
        phone_number: addUserData.phone_number,
        password: addUserData.password
      };
 
      const userResponse = await makeAuthenticatedRequest('/api/auth/signup', 'POST', signupData);
 
      if (!userResponse.success) {
        setActionMessage({ type: 'error', text: userResponse.error || 'Failed to add user' });
        return;
      }
 
      // If role is not client, assign the selected role
      if (addUserData.role !== 'client') {
        // First get the role ID
        const rolesResponse = await makeAuthenticatedRequest('/api/roles/', 'GET');
        if (rolesResponse.success) {
          const roles = normalizeArray(rolesResponse);
          const selectedRole = roles.find(r => r.role === addUserData.role);
 
          if (selectedRole) {
            // Assign the role
            const roleAssignData = {
              user_id: userResponse.data.user.id,
              role_id: selectedRole.id
            };
 
            await makeAuthenticatedRequest('/api/user_roles/', 'POST', roleAssignData);
          }
        }
      }
 
      setActionMessage({ type: 'success', text: 'User created successfully!' });
      // Refresh the users data
      await fetchData();
 
      setTimeout(() => {
        setShowAddUserModal(false);
        setActionMessage({ type: '', text: '' });
      }, 2000);
 
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Failed to add user: ' + error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const submitEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUser || !editFormData.first_name || !editFormData.last_name) {
      setActionMessage({ type: 'error', text: 'First name and last name are required' });
      return;
    }

    try {
      setActionLoading(true);
      const response = await makeAuthenticatedRequest(
        `/api/users/${selectedUser.id}`,
        'PATCH',
        editFormData
      );

      if (response.success) {
        setActionMessage({ type: 'success', text: 'User updated successfully!' });
        // Refresh the users data
        await fetchData();
        setTimeout(() => {
          setShowEditModal(false);
          setSelectedUser(null);
          setActionMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setActionMessage({ type: 'error', text: response.error || 'Failed to update user' });
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
      // Since there's no delete endpoint in your current backend, we'll use delete
      // You might want to add a delete/activate endpoint to your users API
      const response = await makeAuthenticatedRequest(
        `/api/users/${selectedUser.id}`,
        'DELETE'
      );

      if (response.success) {
        setActionMessage({ type: 'success', text: 'User deleted successfully!' });
        // Refresh the users data
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

  // Calculate stats from real data
  const stats = {
    totalUsers: Array.isArray(users) ? users.length : 0,
    totalSpaces: Array.isArray(spaces) ? spaces.length : 0,
    totalBookings: Array.isArray(bookings) ? bookings.length : 0,
    totalRevenue: Array.isArray(invoices)
      ? invoices.filter(i => i && i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0)
      : 0,
    pendingReviews: Array.isArray(bookings) ? bookings.filter(b => b && !b.has_review && b.status === 'confirmed').length : 0,
    activeAgreements: Array.isArray(bookings) ? bookings.filter(b => b && b.has_agreement_instance).length : 0
  };

  // Get users with role information
  const recentUsers = (Array.isArray(users) ? users : []).map((user) => {
    const role = user?.user_roles?.[0]?.role?.role || "client";
    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone_number: user.phone_number,
      role,
      joinDate: user.created_at
        ? new Date(user.created_at).toLocaleDateString()
        : "",
    };
  });

  // Get recent bookings with space and user info
  const recentBookings = (Array.isArray(bookings) ? bookings : [])
    .slice(-5)
    .map(booking => {
      const space = (Array.isArray(spaces) ? spaces : []).find(s => s.id === booking.space_id);
      const user = (Array.isArray(users) ? users : []).find(u => u.id === booking.user_id);
      return {
        id: booking.id,
        space: space?.title || booking.space_title || 'Unknown Space',
        client: user ? `${user.first_name} ${user.last_name}` : 'Unknown Client',
        amount: parseFloat(booking.total_amount || 0),
        status: booking.status,
        date: booking.start_time ? new Date(booking.start_time).toLocaleDateString() : ''
      };
    });

  const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm flex items-center mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <Icon className={`h-12 w-12 text-${color}-500`} />
      </div>
    </div>
  );

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {label}
    </button>
  );

  // Add User Modal
  const AddUserModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
          <button
            onClick={() => setShowAddUserModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
 
        {actionMessage.text && (
          <div className={`mb-4 p-3 rounded ${
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
 
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={addUserData.first_name}
              onChange={(e) => setAddUserData({...addUserData, first_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={addUserData.last_name}
              onChange={(e) => setAddUserData({...addUserData, last_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={addUserData.email}
              onChange={(e) => setAddUserData({...addUserData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={addUserData.phone_number}
              onChange={(e) => setAddUserData({...addUserData, phone_number: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={addUserData.password}
              onChange={(e) => setAddUserData({...addUserData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength="6"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={addUserData.role}
              onChange={(e) => setAddUserData({...addUserData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="client">Client</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
 
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => submitAddUser(e)}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Add User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Edit User Modal
  const EditUserModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
          <button
            onClick={() => setShowEditModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {actionMessage.text && (
          <div className={`mb-4 p-3 rounded ${
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

        <form onSubmit={submitEditUser}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={editFormData.first_name}
              onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={editFormData.last_name}
              onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={editFormData.phone_number}
              onChange={(e) => setEditFormData({...editFormData, phone_number: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Delete User Modal
  const DeleteUserModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {actionMessage.text && (
          <div className={`mb-4 p-3 rounded ${
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
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">Confirm Deletion</h4>
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>?
            This will remove the user from the system.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteUser}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {actionLoading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Monitor and manage your space rental platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8">
          <TabButton id="overview" label="Overview" isActive={activeTab === 'overview'} onClick={setActiveTab} />
          <TabButton id="users" label="Users" isActive={activeTab === 'users'} onClick={setActiveTab} />
          <TabButton id="spaces" label="Spaces" isActive={activeTab === 'spaces'} onClick={setActiveTab} />
          <TabButton id="bookings" label="Bookings" isActive={activeTab === 'bookings'} onClick={setActiveTab} />
          <TabButton id="reviews" label="Reviews" isActive={activeTab === 'financials'} onClick={setActiveTab} />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard icon={() => <Users className="h-10 w-10 text-blue-600" />} title="Total Users" value={stats.totalUsers.toLocaleString()} />
              <StatCard icon={() => <Building className="h-10 w-10 text-green-600" />} title="Active Spaces" value={stats.totalSpaces} />
              <StatCard icon={() => <Calendar className="h-10 w-10 text-purple-600" />} title="Total Bookings" value={stats.totalBookings} />
              <StatCard icon={() => <HandCoins className="h-10 w-10 text-yellow-600" />} title="Revenue (KSH)" value={`Kshs. ${stats.totalRevenue.toLocaleString()}`} />
              <StatCard icon={() => <FileText className="h-10 w-10 text-red-600" />} title="Pending Reviews" value={stats.pendingReviews} />
              <StatCard icon={() => <UserCheck className="h-10 w-10 text-teal-600" />} title="Active Agreements" value={stats.activeAgreements} />
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">Manage platform users and their roles</p>
              </div>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Add New User
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'owner' ? 'bg-green-100 text-green-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.joinDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
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

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Booking Management</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentBookings.map(booking => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.space}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${booking.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-green-600 hover:text-green-900">Approve</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddUserModal && <AddUserModal />}
      {showEditModal && <EditUserModal />}
      {showDeleteModal && <DeleteUserModal />}
    </div>
  );
};

export default AdminDashboard;