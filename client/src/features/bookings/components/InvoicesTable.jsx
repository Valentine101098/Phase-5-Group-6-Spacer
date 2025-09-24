import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, DollarSign, Calendar } from 'lucide-react';
// import { bearerToken } from './tokens';
import { useAuth } from '../../../contexts/AuthContext';


export function InvoicesTable() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const { accessToken  } = useAuth()

  useEffect(() => {
    if (!accessToken) {
      return
    }    
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:5000/api/invoices/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setInvoices(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [accessToken]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
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
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueStatuses = useMemo(() => {
    return [...new Set(invoices.map(inv => inv.status))];
  }, [invoices]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(inv => {
      const matchesSearch =
        inv.id.toString().includes(searchTerm.toLowerCase()) ||
        inv.space_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.status.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'amount') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }
        if (sortConfig.key === 'paid_at') {
          aValue = aValue ? new Date(aValue) : 0;
          bValue = bValue ? new Date(bValue) : 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [invoices, searchTerm, statusFilter, sortConfig]);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoices Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search invoices..."
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
            Error: {error} (showing mock data for demo)
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Total Invoices</p>
              <p className="text-2xl font-bold text-blue-900">{filteredAndSortedInvoices.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-900">
                {formatAmount(
                  filteredAndSortedInvoices.reduce((sum, inv) => 
                    sum + (inv.status === 'paid' ? parseFloat(inv.amount) : 0), 0
                  )
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-600">Outstanding</p>
              <p className="text-2xl font-bold text-yellow-900">
                {formatAmount(
                  filteredAndSortedInvoices.reduce((sum, inv) => 
                    sum + (inv.status !== 'paid' ? parseFloat(inv.amount) : 0), 0
                  )
                )}
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
              <th onClick={() => handleSort('id')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                <div className="flex items-center space-x-1"><span>ID</span><SortIcon column="id" /></div>
              </th>
              <th onClick={() => handleSort('space_title')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                <div className="flex items-center space-x-1"><span>Space</span><SortIcon column="space_title" /></div>
              </th>
              <th onClick={() => handleSort('amount')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                <div className="flex items-center space-x-1"><span>Amount</span><SortIcon column="amount" /></div>
              </th>
              <th onClick={() => handleSort('payment_method')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                <div className="flex items-center space-x-1"><span>Method</span><SortIcon column="payment_method" /></div>
              </th>
              <th onClick={() => handleSort('paid_at')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                <div className="flex items-center space-x-1"><span>Paid At</span><SortIcon column="paid_at" /></div>
              </th>
              <th onClick={() => handleSort('status')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                <div className="flex items-center space-x-1"><span>Status</span><SortIcon column="status" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{inv.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.space_title || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatAmount(inv.amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.payment_method || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(inv.paid_at)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inv.status)}`}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedInvoices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No invoices found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};


