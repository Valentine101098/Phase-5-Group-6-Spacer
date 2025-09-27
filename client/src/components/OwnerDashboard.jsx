import React, { useState, useEffect } from 'react';
import { Building, Calendar, DollarSign, Users, Star, Plus, Eye, Edit, TrendingUp, Clock, FileText, MessageSquare, AlertTriangle, X } from 'lucide-react';
import SpaceCreation from './SpaceCreation';
import SpaceDetails from './SpaceDetails';
import { useAuth } from '../contexts/AuthContext';

const OwnerDashboard = () => {
  const { makeAuthenticatedRequest, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSpaceCreation, setShowSpaceCreation] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);

  // State for different data types
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [agreementTemplates, setAgreementTemplates] = useState([]);
  const [agreementInstances, setAgreementInstances] = useState([]);

  // Simplified API call using AuthContext
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    const result = await makeAuthenticatedRequest(endpoint, method, data);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'API call failed');
    }
  };

  // Fetch owner-specific data with better error handling
  const fetchData = async () => {
    if (!isAuthenticated) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Owner-specific endpoints
      const endpoints = [
        { key: 'spaces', url: '/api/spaces/' },
        { key: 'bookings', url: '/api/bookings/' },
        { key: 'invoices', url: '/api/invoices/' },
        { key: 'reviews', url: '/api/reviews/' },
        { key: 'agreementTemplates', url: '/api/agreements/templates' },
        { key: 'agreementInstances', url: '/api/agreements/instances' }
      ];

      const results = {
        spaces: [],
        bookings: [],
        invoices: [],
        reviews: [],
        agreementTemplates: [],
        agreementInstances: []
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
          results[endpoint.key] = [];
          // Continue with other endpoints even if one fails
        }
      }

      setSpaces(results.spaces);
      setBookings(results.bookings);
      setInvoices(results.invoices);
      setReviews(results.reviews);
      setAgreementTemplates(results.agreementTemplates);
      setAgreementInstances(results.agreementInstances);

    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle space creation
  const handleSpaceCreated = (newSpace) => {
    setSpaces(prev => [newSpace, ...prev]);
    setShowSpaceCreation(false);
    fetchData(); // Refresh data to get updated stats
  };

  // Handle space deletion using AuthContext
  const handleDeleteSpace = async (spaceId) => {
    if (!window.confirm('Are you sure you want to delete this space?')) return;
    
    try {
      const result = await makeAuthenticatedRequest(`/api/spaces/${spaceId}`, 'DELETE');
      
      if (result.success) {
        setSpaces(prev => prev.filter(space => space.id !== spaceId));
        alert('Space deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete space');
      }
    } catch (err) {
      console.error('Error deleting space:', err);
      alert('Error deleting space. Please try again.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]); // Re-fetch when authentication status changes

  // Calculate owner stats from real data with flexible field names
  const ownerStats = {
    totalSpaces: spaces.length,
    totalBookings: bookings.length,
    monthlyRevenue: invoices.filter(i => i.status === 'paid' || i.payment_status === 'paid').reduce((sum, invoice) => 
      sum + parseFloat(invoice.amount || invoice.total_amount || 0), 0
    ),
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'active').length,
    averageRating: reviews.length > 0 ? 
      (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : 0,
    totalReviews: reviews.length,
    activeAgreements: agreementInstances.filter(a => a.status === 'accepted' || a.status === 'active').length
  };

  // Filter recent bookings (last 30 days or upcoming)
  const recentBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.start_time || booking.date || booking.booking_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return bookingDate >= thirtyDaysAgo || bookingDate > new Date();
  }).slice(0, 10);

  // Owner SpaceCard Component
  const OwnerSpaceCard = ({ space }) => {
    const [showDetails, setShowDetails] = useState(false);
    
    // Calculate stats for this space
    const spaceBookings = bookings.filter(b => b.space_id === space.id);
    const spaceRevenue = invoices.filter(i => 
      spaceBookings.some(b => b.id === i.booking_id) && (i.status === 'paid' || i.payment_status === 'paid')
    ).reduce((sum, i) => sum + parseFloat(i.amount || i.total_amount || 0), 0);
    const spaceReviews = reviews.filter(r => 
      spaceBookings.some(b => b.id === r.booking_id)
    );
    const avgRating = spaceReviews.length > 0 ? 
      (spaceReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / spaceReviews.length).toFixed(1) : 0;

    return (
      <div className="border w-full h-full rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
        <div className="relative w-full h-60 overflow-hidden">
          <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory">
            {space.images && space.images.length > 0 ? (
              space.images.map((imgUrl, index) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`Space Image ${index + 1}`}
                  className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${index === 0 ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                <span>No Image Available</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-3 right-3 text-white text-xs px-3 py-1 rounded-full font-medium">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${
                space.status === 'available' ? 'bg-green-300 text-green-800' : 'bg-red-300 text-red-800'
              }`}
            >
              {space.status}
            </span>
          </div>
          <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center">
            <Star className="inline h-3 w-3 mr-1 fill-current" />
            Owner
          </div>
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold mb-2">{space.title || space.name}</h3>
          <p className="text-gray-600 mb-4 flex-grow line-clamp-2">{space.description}</p>
          <p className="text-sm text-black mb-2"><strong>Type:</strong> {space.space_type || space.type}</p>
          <p className="text-sm text-gray-600 mb-2"><strong>Max Guests:</strong> {space.max_guests || space.capacity}</p>
          
          {/* Owner-specific stats */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-blue-600 font-semibold">{spaceBookings.length}</div>
              <div className="text-blue-800 text-xs">Bookings</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="text-green-600 font-semibold">Kshs {spaceRevenue.toFixed(0)}</div>
              <div className="text-green-800 text-xs">Revenue</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <div className="text-yellow-600 font-semibold flex items-center">
                <Star className="h-3 w-3 mr-1 fill-current" />
                {avgRating || 'N/A'}
              </div>
              <div className="text-yellow-800 text-xs">Avg Rating</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-purple-600 font-semibold">{spaceReviews.length}</div>
              <div className="text-purple-800 text-xs">Reviews</div>
            </div>
          </div>
          
          <span className="font-bold mb-3 text-indigo-600">
            Kshs {parseFloat(space.price_per_hour || space.price || 0).toFixed(2)}/hr
          </span>
          
          <div className="mt-auto flex flex-col gap-2">
            <button 
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center"
              onClick={() => setShowDetails(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button 
                onClick={() => handleDeleteSpace(space.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
              >
                <X className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
        
        {showDetails && (
          <SpaceDetails space={space} onClose={() => setShowDetails(false)} />
        )}
      </div>
    );
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, change, color = 'blue' }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {change && (
            <p className={`text-sm flex items-center mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
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

 
  // Show authentication error if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Authentication Required</h3>
          <p className="text-red-600 mb-4 max-w-md">Please log in to access the owner dashboard.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Space Creation Modal */}
      {showSpaceCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Create New Space</h2>
              <button 
                onClick={() => setShowSpaceCreation(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <SpaceCreation onSpaceCreated={handleSpaceCreated} />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
              <p className="text-gray-600">Manage your spaces and track your business performance</p>
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
          <TabButton id="spaces" label="My Spaces" isActive={activeTab === 'spaces'} onClick={setActiveTab} />
          <TabButton id="bookings" label="Bookings" isActive={activeTab === 'bookings'} onClick={setActiveTab} />
          <TabButton id="reviews" label="Reviews" isActive={activeTab === 'reviews'} onClick={setActiveTab} />
          <TabButton id="agreements" label="Agreements" isActive={activeTab === 'agreements'} onClick={setActiveTab} />
          <TabButton id="analytics" label="Analytics" isActive={activeTab === 'analytics'} onClick={setActiveTab} />
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon={Building} 
                title="Total Spaces" 
                value={ownerStats.totalSpaces} 
                subtitle="Active listings"
                color="blue" 
              />
              <StatCard 
                icon={Calendar} 
                title="Total Bookings" 
                value={ownerStats.totalBookings} 
                color="green" 
              />
              <StatCard 
                icon={DollarSign} 
                title="Revenue (Kshs)" 
                value={`Kshs ${ownerStats.monthlyRevenue.toFixed(2)}`} 
                color="purple" 
              />
              <StatCard 
                icon={Star} 
                title="Average Rating" 
                value={ownerStats.averageRating || 'N/A'} 
                subtitle={`${ownerStats.totalReviews} reviews`}
                color="yellow" 
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                  <button 
                    onClick={() => setActiveTab('bookings')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="p-6">
                  {recentBookings.length > 0 ? (
                    <div className="space-y-4">
                      {recentBookings.slice(0, 5).map(booking => (
                        <div key={booking.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{booking.space_title || booking.space_name || `Space #${booking.space_id}`}</h4>
                              <p className="text-sm text-gray-600">Client: User #{booking.user_id}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              booking.status === 'confirmed' || booking.status === 'active'
                                ? 'bg-green-100 text-green-800' 
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>
                              {(booking.start_time || booking.date || booking.booking_date) ? 
                                new Date(booking.start_time || booking.date || booking.booking_date).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="font-semibold text-gray-900">
                              Kshs {parseFloat(booking.total_amount || booking.amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No recent bookings</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Bookings</span>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                        {ownerStats.pendingBookings}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Confirmed Bookings</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        {ownerStats.confirmedBookings}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Agreements</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                        {ownerStats.activeAgreements}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Reviews</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{ownerStats.totalReviews}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowSpaceCreation(true)}
                  className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-blue-900">Add New Space</span>
                </button>
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors"
                >
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-green-900">View Calendar</span>
                </button>
                <button 
                  onClick={() => setActiveTab('agreements')}
                  className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
                >
                  <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-purple-900">Manage Agreements</span>
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors"
                >
                  <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-orange-900">View Analytics</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Spaces Tab */}
        {activeTab === 'spaces' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">My Spaces ({spaces.length})</h3>
              <button 
                onClick={() => setShowSpaceCreation(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Space
              </button>
            </div>

            {spaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {spaces.map(space => (
                  <OwnerSpaceCard key={space.id} space={space} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">You haven't added any spaces yet</p>
                <button 
                  onClick={() => setShowSpaceCreation(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Space
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">All Bookings</h3>
                <p className="text-gray-600 text-sm mt-1">Manage bookings for all your spaces</p>
              </div>
              <div className="p-6">
                {bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map(booking => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {booking.space_title || booking.space_name || `Space #${booking.space_id}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              User #{booking.user_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div>{(booking.start_time || booking.date || booking.booking_date) ? new Date(booking.start_time || booking.date || booking.booking_date).toLocaleDateString() : 'N/A'}</div>
                                <div className="text-gray-500">
                                  {(booking.start_time && booking.end_time) ? 
                                    `${new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` :
                                    'N/A'
                                  }
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.estimated_guests || booking.guests || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                              Kshs {parseFloat(booking.total_amount || booking.amount || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                booking.status === 'confirmed' || booking.status === 'active'
                                  ? 'bg-green-100 text-green-800' 
                                  : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">View</button>
                                {booking.status === 'pending' && (
                                  <>
                                    <button className="text-green-600 hover:text-green-900">Approve</button>
                                    <button className="text-red-600 hover:text-red-900">Decline</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No bookings yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
                <p className="text-gray-600 text-sm mt-1">Reviews from your space bookings</p>
              </div>
              <div className="p-6">
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map(review => {
                      // Find the booking for this review to get space info
                      const reviewBooking = bookings.find(b => b.id === review.booking_id);
                      
                      return (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {reviewBooking?.space_title || reviewBooking?.space_name || `Space #${reviewBooking?.space_id || 'Unknown'}`}
                              </h4>
                              <p className="text-sm text-gray-600">
                                by User #{review.user_id} • {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-medium">{review.rating || 0}/5</span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{review.comment || review.review_text}</p>
                          <div className="flex justify-end">
                            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Respond
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-2">Reviews will appear here after customers complete bookings</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {ownerStats.totalSpaces > 0 ? (ownerStats.totalBookings / ownerStats.totalSpaces).toFixed(1) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Avg Bookings/Space</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    Kshs {ownerStats.totalSpaces > 0 ? (ownerStats.monthlyRevenue / ownerStats.totalSpaces).toFixed(0) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Revenue per Space</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{ownerStats.averageRating}</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {ownerStats.totalBookings > 0 ? ((ownerStats.confirmedBookings / ownerStats.totalBookings) * 100).toFixed(0) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Booking Approval Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Space Performance</h4>
              {spaces.length > 0 ? (
                <div className="space-y-4">
                  {spaces.map(space => {
                    const spaceBookings = bookings.filter(b => b.space_id === space.id);
                    const spaceRevenue = invoices.filter(i => 
                      spaceBookings.some(b => b.id === i.booking_id) && (i.status === 'paid' || i.payment_status === 'paid')
                    ).reduce((sum, i) => sum + parseFloat(i.amount || i.total_amount || 0), 0);
                    const spaceReviews = reviews.filter(r => 
                      spaceBookings.some(b => b.id === r.booking_id)
                    );
                    const avgRating = spaceReviews.length > 0 ? 
                      (spaceReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / spaceReviews.length).toFixed(1) : 0;

                    return (
                      <div key={space.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-900">{space.title || space.name}</h5>
                          <span className="text-sm font-semibold text-green-600">
                            Kshs {spaceRevenue.toFixed(2)} revenue
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Bookings</div>
                            <div className="font-medium">{spaceBookings.length}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Reviews</div>
                            <div className="font-medium">{spaceReviews.length}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Rating</div>
                            <div className="font-medium">{avgRating || 'N/A'} ⭐</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No analytics data available</p>
                  <p className="text-sm text-gray-400">Add spaces to see performance metrics</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;