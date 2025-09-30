import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Calendar, Users, DollarSign, Clock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ReviewFormModal from './ReviewFormModal';
import { Link } from "react-router-dom";
import { API_BASE_URL } from '../config/api';
import { formatCurrency } from './currency';

export function BookingsTable() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const { accessToken, user  } = useAuth()

  const [reviewModalBooking, setReviewModalBooking] = useState(null);

  // Fetch bookings from API
  useEffect(() => {
    if (!accessToken) {
      return
    }
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/bookings/`, {
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
        console.table(data.data);
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
    return Math.round(diffInHours * 10) / 10;
  };

  // Cancel booking function
  const handleCancel = async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

  const { filteredAndSortedBookings, confirmedBookings } = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const matchesSearch =
        booking.id.toString().includes(searchTerm.toLowerCase()) ||
        booking.space_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.status.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case 'space_title':
            aValue = a.space_title;
            bValue = b.space_title;
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

    return {
      filteredAndSortedBookings: filtered,
      confirmedBookings: filtered.filter(b => b.status === "confirmed"),
    };
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
      <div className="flex items-center justify-center h-64 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-white">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Bookings Management</h1>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-3 sm:mb-4 text-sm">
            Error: {error}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-600">Confirmed</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-900">{confirmedBookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mr-2 sm:mr-3" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-600">Total Guests</p>
              <p className="text-lg sm:text-2xl font-bold text-green-900">
                {confirmedBookings.reduce((sum, booking) => sum + booking.estimated_guests, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mr-2 sm:mr-3" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-600">Revenue</p>
              <p className="text-base sm:text-2xl font-bold text-yellow-900">
                {formatCurrency(confirmedBookings.reduce((sum, booking) => sum + booking.total_amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mr-2 sm:mr-3" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-purple-600">Avg Duration</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-900">
                {confirmedBookings.length > 0
                  ? (confirmedBookings.reduce((sum, booking) =>
                      sum + calculateDuration(booking.start_time, booking.end_time), 0
                    ) / confirmedBookings.length).toFixed(1) + 'h'
                  : '0h'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {filteredAndSortedBookings.map((booking) => (
          <div key={booking.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-900">#{booking.id}</p>
                <p className="text-sm text-gray-600">{booking.space_title}</p>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Check In:</span>
                <span className="font-medium">{formatDate(booking.start_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check Out:</span>
                <span className="font-medium">{formatDate(booking.end_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{calculateDuration(booking.start_time, booking.end_time)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guests:</span>
                <span className="font-medium">{booking.estimated_guests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {user.roles.includes("client") && booking.status === "confirmed" ? (
                <Link
                  to={`/spaces/${booking.space_id}/booking`}
                  className="flex-1 text-center text-blue-600 hover:text-blue-900 text-sm py-2 border border-blue-600 rounded"
                >
                  Book Again
                </Link>
              ) : user.roles.includes("client") && booking.status === "pending" ? (
                <Link
                  to={`/invoices/${booking.invoice_id}`}
                  className="flex-1 text-center text-green-600 hover:text-green-900 text-sm py-2 border border-green-600 rounded"
                >
                  Pay Now
                </Link>
              ) : (user.roles.includes("admin") || user.roles.includes("owner")) &&
                new Date(booking.end_time) > new Date() &&
                booking.status !== "cancelled" ? (
                <button
                  onClick={() => handleCancel(booking.id)}
                  className="flex-1 text-red-600 hover:text-red-900 text-sm py-2 border border-red-600 rounded flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto shadow-lg rounded-lg">
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
                onClick={() => handleSort('space_title')}
              >
                <div className="flex items-center space-x-1">
                  <span>Space</span>
                  <SortIcon column="space_title" />
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
                  {booking.space_title}
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
                  {formatCurrency(booking.total_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user.roles.includes("client") && booking.status === "confirmed" ? (
                    <Link
                      to={`/spaces/${booking.space_id}/booking`}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      <span>Book Again</span>
                    </Link>
                  ) : user.roles.includes("client") && booking.status === "pending" ? (
                    <Link
                      to={`/invoices/${booking.invoice_id}`}
                      className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                    >
                      <span>Pay Now</span>
                    </Link>
                  ) : (user.roles.includes("admin") || user.roles.includes("owner")) &&
                    new Date(booking.end_time) > new Date() &&
                    booking.status !== "cancelled" ? (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  ) : (
                    <span>—</span>
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

      {reviewModalBooking && (
        <ReviewFormModal
          spaceId={reviewModalBooking.space_id}
          bookingId={reviewModalBooking.id}
          onClose={() => setReviewModalBooking(null)}
          onReviewAdded={(review) => {
            console.log("New review saved:", review);
          }}
        />
      )}
    </div>
  );
}