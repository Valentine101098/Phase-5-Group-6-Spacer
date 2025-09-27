import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Star, Clock, CreditCard, FileText, Search, Filter, Heart, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for different data types
  const [bookings, setBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Get auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found');
      // Don't redirect automatically - let the API handle auth errors
    }
    return token;
  };

  // API call helper with better error handling
  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        credentials: 'include' // Include cookies for session-based auth
      });

      // Check if response is HTML instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`Non-JSON response from ${endpoint}:`, text.substring(0, 200));
        
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 404) {
          throw new Error(`API endpoint not found: ${endpoint}`);
        } else if (text.includes('<!doctype')) {
          throw new Error(`Server returned HTML page instead of JSON. Check if endpoint exists: ${endpoint}`);
        } else {
          throw new Error(`Unexpected response format. Status: ${response.status}`);
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `API call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call error for ${endpoint}:`, error);
      throw error;
    }
  };

  // Fetch client-specific data with better error handling
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data individually to handle partial failures
      const endpoints = [
        { key: 'bookings', url: '/bookings/' },
        { key: 'spaces', url: '/spaces/' },
        { key: 'reviews', url: '/reviews/' },
        { key: 'invoices', url: '/invoices/' }
      ];

      const results = {
        bookings: [],
        spaces: [],
        reviews: [],
        invoices: []
      };
      
      for (const endpoint of endpoints) {
        try {
          const data = await apiCall(endpoint.url);
          // Handle different response structures
          if (Array.isArray(data)) {
            results[endpoint.key] = data;
          } else if (data && data.data) {
            results[endpoint.key] = data.data;
          } else if (data) {
            results[endpoint.key] = data;
          } else {
            results[endpoint.key] = [];
          }
          console.log(`Successfully fetched ${endpoint.key}:`, results[endpoint.key].length, 'items');
        } catch (err) {
          console.warn(`Failed to fetch ${endpoint.key}:`, err.message);
          // Continue with other endpoints even if one fails
        }
      }

      setBookings(results.bookings);
      setSpaces(results.spaces);
      setReviews(results.reviews);
      setInvoices(results.invoices);

    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test API endpoints (for debugging)
  const testEndpoints = async () => {
    const endpoints = ['/bookings/', '/spaces/', '/reviews/', '/invoices/'];
    
    console.log('Testing API endpoints:');
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api${endpoint}`);
        const contentType = response.headers.get('content-type');
        console.log(`${endpoint}: Status ${response.status}, Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`${endpoint} data sample:`, data);
        }
      } catch (err) {
        console.error(`${endpoint}: Error -`, err.message);
      }
    }
  };

  useEffect(() => {
    fetchData();
    // Uncomment next line to debug endpoints
    // testEndpoints();
  }, []);

  // Calculate stats from real data
  const clientStats = {
    totalBookings: bookings.length,
    upcomingBookings: bookings.filter(b => {
      const startTime = b.start_time || b.date || b.booking_date;
      return startTime && new Date(startTime) > new Date() && (b.status === 'confirmed' || b.status === 'active');
    }).length,
    completedBookings: bookings.filter(b => {
      const endTime = b.end_time || b.completed_date;
      return endTime && new Date(endTime) < new Date() && (b.status === 'completed' || b.status === 'confirmed');
    }).length,
    totalSpent: invoices.filter(i => i.status === 'paid' || i.payment_status === 'paid').reduce((sum, invoice) => 
      sum + parseFloat(invoice.amount || invoice.total_amount || 0), 0
    ),
    pendingReviews: bookings.filter(b => {
      const endTime = b.end_time || b.completed_date;
      return endTime && new Date(endTime) < new Date() && 
        (b.status === 'completed' || b.status === 'confirmed') && 
        !b.has_review
    }).length
  };

  const upcomingBookings = bookings.filter(b => {
    const startTime = b.start_time || b.date || b.booking_date;
    return startTime && new Date(startTime) > new Date() && 
      ['confirmed', 'pending', 'active', 'upcoming'].includes(b.status);
  }).slice(0, 5);

  const bookingHistory = bookings.filter(b => {
    const endTime = b.end_time || b.completed_date;
    return (endTime && new Date(endTime) < new Date()) || 
      b.status === 'completed' || 
      b.status === 'cancelled';
  }).slice(0, 10);

  const filteredSpaces = spaces.filter(space =>
    space.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.space_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className={`h-10 w-10 text-${color}-500`} />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error loading dashboard</h3>
          <p className="text-red-600 mb-4 max-w-md">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button 
              onClick={testEndpoints}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Debug Endpoints
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your bookings.</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 overflow-x-auto">
          <TabButton id="dashboard" label="Dashboard" isActive={activeTab === 'dashboard'} onClick={setActiveTab} />
          <TabButton id="bookings" label="My Bookings" isActive={activeTab === 'bookings'} onClick={setActiveTab} />
          <TabButton id="browse" label="Browse Spaces" isActive={activeTab === 'browse'} onClick={setActiveTab} />
          <TabButton id="invoices" label="Payments" isActive={activeTab === 'invoices'} onClick={setActiveTab} />
          <TabButton id="reviews" label="Reviews" isActive={activeTab === 'reviews'} onClick={setActiveTab} />
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon={Calendar} 
                title="Total Bookings" 
                value={clientStats.totalBookings} 
                subtitle="All time" 
                color="blue" 
              />
              <StatCard 
                icon={Clock} 
                title="Upcoming Bookings" 
                value={clientStats.upcomingBookings} 
                subtitle="Next 30 days" 
                color="green" 
              />
              <StatCard 
                icon={CheckCircle} 
                title="Completed Bookings" 
                value={clientStats.completedBookings} 
                subtitle="All time" 
                color="purple" 
              />
              <StatCard 
                icon={CreditCard} 
                title="Total Spent (Ksh)" 
                value={`${clientStats.totalSpent.toFixed(2)}`} 
                subtitle="All time" 
                color="orange" 
              />
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h3>
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="p-6">
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map(booking => (
                      <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{booking.space_title || booking.space_name || `Space #${booking.space_id}`}</h4>
                            <p className="text-sm text-gray-600">Booking #{booking.id}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'confirmed' || booking.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending' || booking.status === 'upcoming'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="font-medium">Start Date</p>
                            <p>{(booking.start_time || booking.date || booking.booking_date) ? new Date(booking.start_time || booking.date || booking.booking_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Time</p>
                            <p>{(booking.start_time || booking.date) ? new Date(booking.start_time || booking.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Guests</p>
                            <p>{booking.estimated_guests || booking.guests || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Amount</p>
                            <p className="font-semibold text-gray-900">${parseFloat(booking.total_amount || booking.amount || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                          <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                            View Details
                          </button>
                          {(booking.status === 'pending' || booking.status === 'upcoming') && (
                            <button className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming bookings</p>
                    <button 
                      onClick={() => setActiveTab('browse')}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Browse Spaces
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setActiveTab('browse')}
                  className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
                >
                  <Search className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-blue-900">Browse Spaces</span>
                </button>
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors"
                >
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-green-900">My Bookings</span>
                </button>
                <button 
                  onClick={() => setActiveTab('invoices')}
                  className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
                >
                  <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-purple-900">Payments</span>
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors"
                >
                  <Star className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-orange-900">Write Reviews</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Booking History */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">My Bookings</h3>
                <p className="text-gray-600 text-sm mt-1">View all your past and upcoming bookings</p>
              </div>
              <div className="p-6">
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map(booking => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{booking.space_title || booking.space_name || `Space #${booking.space_id}`}</h4>
                            <p className="text-sm text-gray-600">Booking #{booking.id}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              booking.status === 'confirmed' || booking.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'pending' || booking.status === 'upcoming'
                                ? 'bg-yellow-100 text-yellow-800'
                                : booking.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                            <p className="text-sm font-semibold text-gray-900 mt-1">${parseFloat(booking.total_amount || booking.amount || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <p className="font-medium">Start Time</p>
                            <p>{(booking.start_time || booking.date || booking.booking_date) ? new Date(booking.start_time || booking.date || booking.booking_date).toLocaleString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">End Time</p>
                            <p>{(booking.end_time || booking.end_date) ? new Date(booking.end_time || booking.end_date).toLocaleString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Guests</p>
                            <p>{booking.estimated_guests || booking.guests || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Created</p>
                            <p>{booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                            View Details
                          </button>
                          {((booking.end_time && new Date(booking.end_time) < new Date()) || booking.status === 'completed') && !booking.has_review && (
                            <button 
                              onClick={() => setActiveTab('reviews')}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Write Review
                            </button>
                          )}
                          {(booking.status === 'pending' || booking.status === 'upcoming') && (
                            <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No bookings found</p>
                    <button 
                      onClick={() => setActiveTab('browse')}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Make Your First Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Browse Spaces Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search spaces by name or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>

            {/* Available Spaces */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpaces.map(space => (
                <div key={space.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      {space.images && space.images.length > 0 ? (
                        <img 
                          src={space.images[0]} 
                          alt={space.title || space.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span>Space Image</span>
                      </div>
                    </div>
                    <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded ${
                      space.status === 'available' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {space.status}
                    </span>
                    <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                      <Heart className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{space.title || space.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{space.space_type || space.type}</p>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{space.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-600">Max {space.max_guests || space.capacity} guests</span>
                      <span className="font-semibold text-gray-900">${parseFloat(space.price_per_hour || space.price || 0).toFixed(2)}/hr</span>
                    </div>
{space.status === 'available' ? (
  <Link to={`/spaces/${space.id}/booking`}>
    <button
      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Book Now
    </button>
  </Link>
) : (
  <button
    className="w-full bg-gray-400 text-white py-2 rounded-lg cursor-not-allowed"
    disabled
  >
    Unavailable
  </button>
)}

                  </div>
                </div>
              ))}
            </div>

            {filteredSpaces.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No spaces found matching your search</p>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
              <p className="text-gray-600 text-sm mt-1">Track all your payments and pending invoices</p>
            </div>
            <div className="p-6">
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map(invoice => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{invoice.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Booking #{invoice.booking_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${parseFloat(invoice.amount || invoice.total_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              invoice.status === 'paid' || invoice.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800' 
                                : invoice.status === 'unpaid' || invoice.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {invoice.status || invoice.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.payment_method || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {(invoice.status === 'unpaid' || invoice.payment_status === 'pending') ? (
                              <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                                Pay Now
                              </button>
                            ) : (
                              <button className="text-blue-600 hover:text-blue-900">
                                View Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payment history available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Review Management</h3>
              <p className="text-gray-600 text-sm mt-1">Write reviews for completed bookings</p>
            </div>
            <div className="p-6">
              {clientStats.pendingReviews > 0 ? (
                <div className="space-y-4 mb-8">
                  <h4 className="font-medium text-gray-900">Pending Reviews</h4>
                  {bookings.filter(b => {
                    const endTime = b.end_time || b.completed_date;
                    return endTime && new Date(endTime) < new Date() && 
                      (b.status === 'completed' || b.status === 'confirmed') && 
                      !b.has_review;
                  }).map(booking => (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{booking.space_title || booking.space_name || `Space #${booking.space_id}`}</h4>
                          <p className="text-sm text-gray-600">
                            Booked on {(booking.start_time || booking.date) ? new Date(booking.start_time || booking.date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <span className="text-sm text-orange-600 font-medium">Review Pending</span>
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Write Review
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {reviews.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">My Reviews</h4>
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">Booking #{review.booking_id}</h5>
                            <div className="flex items-center mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < (review.rating || 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                              <span className="ml-2 text-sm text-gray-600">{review.rating || 5}/5</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment || review.review_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {clientStats.pendingReviews === 0 && reviews.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews to show yet</p>
                  <p className="text-sm text-gray-400 mt-2">Complete a booking to leave a review</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add missing Refresh icon component
const Refresh = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default ClientDashboard;