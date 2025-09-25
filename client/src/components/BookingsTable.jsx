import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Calendar, Users, DollarSign, Clock, X } from 'lucide-react';
import { bearerToken } from '../features/bookings/components/tokens';
import { useAuth } from '../contexts/AuthContext';


export function BookingsTable() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const { accessToken  } = useAuth()
  // Fetch bookings from API
  useEffect(() => {
    if (!accessToken) {
      return
    }
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:5000/api/bookings/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setBookings(data.data);
        console.log(data.data);
      } catch (err) {
        setError(err.message);
        console.log("failed_accesstoken: ", accessToken)
        
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [accessToken]);

  // Calculate duration in hours
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMs = end - start;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return Math.round(diffInHours * 10) / 10; // Round to 1 decimal place
  };

  // Cancel booking function
  const handleCancel = async (bookingId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
          )
        );
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(bookings.map(booking => booking.status))];
    return statuses;
  }, [bookings]);

  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const matchesSearch = 
        booking.id.toString().includes(searchTerm.toLowerCase()) ||
        booking.space_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.status.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'created':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          case 'checkin':
            aValue = new Date(a.start_time);
            bValue = new Date(b.start_time);
            break;
          case 'checkout':
            aValue = new Date(a.end_time);
            bValue = new Date(b.end_time);
            break;
          case 'duration':
            aValue = calculateDuration(a.start_time, a.end_time);
            bValue = calculateDuration(b.start_time, b.end_time);
            break;
          case 'guests':
            aValue = a.estimated_guests;
            bValue = b.estimated_guests;
            break;
          case 'amount':
            aValue = a.total_amount;
            bValue = b.total_amount;
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [bookings, searchTerm, statusFilter, sortConfig]);

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Bookings Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error} ()
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-900">{filteredAndSortedBookings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Total Guests</p>
              <p className="text-2xl font-bold text-green-900">
                {filteredAndSortedBookings.reduce((sum, booking) => sum + booking.estimated_guests, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-600">Total Revenue</p>
              <p className="text-2xl font-bold text-yellow-900">
                {formatAmount(filteredAndSortedBookings.reduce((sum, booking) => sum + booking.total_amount, 0))}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-600">Avg Duration</p>
              <p className="text-2xl font-bold text-purple-900">
                {filteredAndSortedBookings.length > 0 
                  ? (filteredAndSortedBookings.reduce((sum, booking) => 
                      sum + calculateDuration(booking.start_time, booking.end_time), 0
                    ) / filteredAndSortedBookings.length).toFixed(1) + 'h'
                  : '0h'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <SortIcon column="id" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  <SortIcon column="created" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('checkin')}
              >
                <div className="flex items-center space-x-1">
                  <span>Check In</span>
                  <SortIcon column="checkin" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('checkout')}
              >
                <div className="flex items-center space-x-1">
                  <span>Check Out</span>
                  <SortIcon column="checkout" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('duration')}
              >
                <div className="flex items-center space-x-1">
                  <span>Duration</span>
                  <SortIcon column="duration" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('guests')}
              >
                <div className="flex items-center space-x-1">
                  <span>Guests</span>
                  <SortIcon column="guests" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Amount</span>
                  <SortIcon column="amount" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <SortIcon column="status" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{booking.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(booking.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(booking.start_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(booking.end_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {calculateDuration(booking.start_time, booking.end_time)}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.estimated_guests}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatAmount(booking.total_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {booking.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredAndSortedBookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No bookings found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

