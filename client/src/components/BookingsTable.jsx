import React from 'react';
import { Search, ChevronUp, ChevronDown, Calendar, Users, DollarSign, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ReviewFormModal from './ReviewFormModal';
import { Link } from "react-router-dom";
import { API_BASE_URL } from '../config/api';
import { formatCurrency } from './currency';
import { calculateDuration } from './utils';
import { useBookings } from './useBookings';

export function BookingsTable() {
  const {
    bookings,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortConfig,
    setSortConfig,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalPages,
    total,
    stats,
    handleCancel
  } = useBookings();

  const { user } = useAuth(); 
  const [reviewModalBooking, setReviewModalBooking] = React.useState(null);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setPage(1); 
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); 
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

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ?
      <ChevronUp className="w-4 h-4 text-blue-600" /> :
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading && page === 1) {
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
              onChange={handleSearchChange}
              className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
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
              <p className="text-xs sm:text-sm font-medium text-blue-600">Confirmed Bookings</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-900">{stats.confirmedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mr-2 sm:mr-3" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-600">Total Guests</p>
              <p className="text-xs lg:text-2xl font-bold text-green-900">{stats.totalGuests}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mr-2 sm:mr-3" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-600">
    {user?.roles?.includes('owner') || user?.roles?.includes('admin') 
        ? 'Total Revenue' 
        : 'Total Spent'}
</p>
              <p className="text-base sm:text-2xl font-bold text-yellow-900">
                {formatCurrency(stats.totalRevenue)}
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
                {stats.avgDuration > 0 ? stats.avgDuration.toFixed(1) + 'h' : '0h'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {bookings.map((booking) => (
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
            {bookings.map((booking) => (
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

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No bookings found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing page {page} of {totalPages} ({total} total bookings)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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