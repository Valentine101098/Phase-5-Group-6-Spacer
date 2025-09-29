import React, { useState, useEffect } from 'react';
import { Building, Calendar, Wallet, Users, Star, Plus, Eye, Edit, TrendingUp, Clock, FileText, MessageSquare, AlertTriangle, X, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SpaceCard from './SpaceCard';
import SpaceCreation from './SpaceCreation';
import SpaceDetails from './SpaceDetails';
import { BookingsTable } from './BookingsTable';
import { InvoicesTable } from './InvoicesTable';
import { formatCurrency } from './currency';

const OwnerDashboard = () => {
  const { user, isAuthenticated, makeAuthenticatedRequest } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSpaceCreation, setShowSpaceCreation] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State for different data types
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reviews, setReviews] = useState([]);

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

  // Fetch owner-specific data
  const fetchData = async () => {
    if (!isAuthenticated) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all data using existing API structure
      const [spacesRes, bookingsRes, invoicesRes, reviewsRes] = await Promise.all([
        makeAuthenticatedRequest('/api/spaces/', 'GET'),
        makeAuthenticatedRequest('/api/bookings/', 'GET'),
        makeAuthenticatedRequest('/api/invoices/', 'GET'),
        makeAuthenticatedRequest('/api/reviews/', 'GET')
      ]);

      // Normalize responses - owner should only see their spaces
      const allSpaces = normalizeArray(spacesRes);
      const allBookings = normalizeArray(bookingsRes);
      
      // Filter spaces and bookings for owner (assuming owner_id field exists)
      const ownerSpaces = allSpaces.filter(space => space.owner_id === user?.id);
      const ownerBookings = allBookings.filter(booking => 
        ownerSpaces.some(space => space.id === booking.space_id)
      );

      setSpaces(ownerSpaces);
      setBookings(ownerBookings);
      setInvoices(normalizeArray(invoicesRes));
      setReviews(normalizeArray(reviewsRes));

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle space creation using existing SpaceCreation component
  const handleSpaceCreated = (newSpace) => {
    setSpaces(prev => [newSpace, ...prev]);
    setShowSpaceCreation(false);
    fetchData(); // Refresh to get updated stats
  };

  // Handle space deletion using existing API pattern
  const handleDeleteSpace = async (spaceId) => {
    if (!window.confirm('Are you sure you want to delete this space? This action cannot be undone.')) return;
    
    try {
      const result = await makeAuthenticatedRequest(`/api/spaces/${spaceId}`, 'DELETE');
      
      if (result.success) {
        setSpaces(prev => prev.filter(space => space.id !== spaceId));
        setError({ type: 'success', message: 'Space deleted successfully!' });
      } else {
        throw new Error(result.error || 'Failed to delete space');
      }
    } catch (err) {
      console.error('Error deleting space:', err);
      setError({ type: 'error', message: 'Error deleting space. Please try again.' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  // Calculate owner stats from real data
  const ownerStats = {
    totalSpaces: spaces.length,
    totalBookings: bookings.length,
    monthlyRevenue: invoices
      .filter(i => i.status === 'paid' || i.payment_status === 'paid')
      .reduce((sum, invoice) => sum + parseFloat(invoice.amount || invoice.total_amount || 0), 0),
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'active').length,
    averageRating: reviews.length > 0 ? 
      (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : 0,
    totalReviews: reviews.length,
  };

  // Filter spaces based on search
  const filteredSpaces = spaces.filter(space =>
    space.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.space_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Recent bookings (last 30 days)
  const recentBookings = bookings
    .filter(booking => {
      const bookingDate = new Date(booking.start_time || booking.date || booking.booking_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return bookingDate >= thirtyDaysAgo;
    })
    .slice(0, 5);

  // Use existing SpaceCard component but wrap it for owner-specific actions
  const OwnerSpaceCardWrapper = ({ space }) => {
    const [showDetails, setShowDetails] = useState(false);
    
    return (
      <div className="relative">
        <SpaceCard space={space} />
        {/* Add owner-specific overlay/actions */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button 
            onClick={() => setShowDetails(true)}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleDeleteSpace(space.id)}
            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
            title="Delete Space"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {showDetails && (
          <SpaceDetails space={space} onClose={() => setShowDetails(false)} />
        )}
      </div>
    );
  };

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

  // Loading state
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

  // Authentication error
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Authentication Required</h3>
          <p className="text-red-600 mb-4">Please log in to access the owner dashboard.</p>
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
          <TabButton id="invoices" label="Invoices" isActive={activeTab === 'invoices'} onClick={setActiveTab} />
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
                subtitle="Your listings"
                color="blue" 
              />
              <StatCard 
                icon={Calendar} 
                title="Total Bookings" 
                value={ownerStats.totalBookings} 
                subtitle="All time"
                color="green" 
              />
              <StatCard 
                icon={Wallet} 
                title="Revenue" 
                value={formatCurrency(ownerStats.monthlyRevenue)} 
                subtitle="Total earned"
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
                      {recentBookings.map(booking => (
                        <div key={booking.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{booking.space_title || `Space #${booking.space_id}`}</h4>
                              <p className="text-sm text-gray-600">Client: User #{booking.user_id}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>{new Date(booking.start_time).toLocaleDateString()}</span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(booking.total_amount)}
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

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setShowSpaceCreation(true)}
                      className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-blue-900">Add Space</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors"
                    >
                      <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-green-900">View Bookings</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('invoices')}
                      className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
                    >
                      <Wallet className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-purple-900">View Invoices</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('reviews')}
                      className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors"
                    >
                      <Star className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-orange-900">View Reviews</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Spaces Tab */}
        {activeTab === 'spaces' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">My Spaces ({spaces.length})</h3>
              <div className="flex gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search spaces..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
                <button 
                  onClick={() => setShowSpaceCreation(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Space
                </button>
              </div>
            </div>

            {filteredSpaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSpaces.map(space => (
                  <OwnerSpaceCardWrapper key={space.id} space={space} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'No spaces found matching your search' : 'You haven\'t added any spaces yet'}
                </p>
                {!searchTerm && (
                  <button 
                    onClick={() => setShowSpaceCreation(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Space
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab - Use existing BookingsTable component */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <BookingsTable />
          </div>
        )}

        {/* Invoices Tab - Use existing InvoicesTable component */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <InvoicesTable />
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
                      const reviewBooking = bookings.find(b => b.id === review.booking_id);
                      const reviewSpace = spaces.find(s => s.id === reviewBooking?.space_id);
                      
                      return (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {reviewSpace?.title || reviewSpace?.name || `Space #${reviewBooking?.space_id || 'Unknown'}`}
                              </h4>
                              <p className="text-sm text-gray-600">
                                by User #{review.user_id} • {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-medium">{review.rating}/5</span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{review.comment}</p>
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
      </div>
    </div>
  );
};

export default OwnerDashboard;