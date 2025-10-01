import { useState, useEffect } from 'react';
import { fetchInvoices, fetchInvoiceStats } from './invoiceApi';
import { useAuth } from '../contexts/AuthContext';

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
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
    totalCount: 0,
    totalPaid: 0,
    totalOutstanding: 0
  });
  const { accessToken } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!accessToken) return;

    const loadInvoices = async () => {
      try {
        setLoading(true);
        const data = await fetchInvoices({
          page,
          sortKey: sortConfig.key,
          sortDirection: sortConfig.direction,
          search: debouncedSearchTerm,
          status: statusFilter
        }, accessToken);

        setInvoices(data.data);
        setTotal(data.total);
        setTotalPages(data.pages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [accessToken, page, sortConfig, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    if (!accessToken) return;

    const loadStats = async () => {
      try {
        const statsData = await fetchInvoiceStats(accessToken);
        setStats({
          totalCount: statsData.totalCount,
          totalPaid: statsData.totalPaid,
          totalOutstanding: statsData.totalOutstanding
        });
      } catch (err) {
        console.error("Error fetching invoice stats:", err);
      }
    };

    loadStats();
  }, [accessToken]);

  return {
    invoices,
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
    stats
  };
}