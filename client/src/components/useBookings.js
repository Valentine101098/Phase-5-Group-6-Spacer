import { useState, useEffect } from 'react';
import { fetchBookings, fetchBookingStats, cancelBooking } from './bookingApi';
import { useAuth } from '../contexts/AuthContext';

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    confirmedCount: 0,
    totalGuests: 0,
    totalRevenue: 0,
    avgDuration: 0
  });
  const { accessToken } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch bookings
  useEffect(() => {
    if (!accessToken) return;

    const loadBookings = async () => {
      try {
        setLoading(true);
        const data = await fetchBookings({
          page,
          sortKey: sortConfig.key,
          sortDirection: sortConfig.direction,
          search: debouncedSearchTerm,
          status: statusFilter
        }, accessToken);

        setBookings(data.data);
        setTotal(data.total);
        setTotalPages(data.pages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [accessToken, page, sortConfig, debouncedSearchTerm, statusFilter]);

  // Fetch stats
  useEffect(() => {
    if (!accessToken) return;

    const loadStats = async () => {
      try {
        const statsData = await fetchBookingStats(accessToken);
        setStats({
          confirmedCount: statsData.confirmedCount,
          totalGuests: statsData.totalGuests,
          totalRevenue: statsData.totalRevenue,
          avgDuration: statsData.avgDuration
        });
      } catch (err) {
        console.error("Error fetching booking stats:", err);
      }
    };

    loadStats();
  }, [accessToken]);

  // Cancel booking handler
  const handleCancel = async (bookingId) => {
    try {
      await cancelBooking(bookingId, accessToken);
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      );
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  return {
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
  };
}