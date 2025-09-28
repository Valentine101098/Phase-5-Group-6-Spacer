import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Star, Clock, CreditCard, FileText, Search, Filter, Heart, CheckCircle, AlertTriangle, Eye, ClockIcon, CalendarOff, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SpaceCard from './SpaceCard';
import SpaceDetails from './SpaceDetails';
import { BookingsTable } from './BookingsTable';
import { InvoicesTable } from './InvoicesTable';

import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const { user, isAuthenticated, makeAuthenticatedRequest } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'booked'

  // State for different data types
  const [bookings, setBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [invoices, setInvoices] = useState([]);

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

  // Fetch client-specific data
  const fetchData = async () => {
    if (!isAuthenticated) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all data - client sees ALL spaces but only their bookings/invoices
      const [spacesRes, bookingsRes, invoicesRes, reviewsRes] = await Promise.all([
        makeAuthenticatedRequest('/api/spaces/', 'GET'),
        makeAuthenticatedRequest('/api/bookings/', 'GET'),
        makeAuthenticatedRequest('/api/invoices/', 'GET'),
        makeAuthenticatedRequest('/api/reviews/', 'GET')
      ]);

      // Client sees ALL spaces (not just available ones)
      setSpaces(normalizeArray(spacesRes));
      
      // Client sees only their bookings and invoices
      setBookings(normalizeArray(bookingsRes).filter(booking => booking.user_id === user?.id));
      setInvoices(normalizeArray(invoicesRes).filter(invoice => invoice.user_id === user?.id));
      setReviews(normalizeArray(reviewsRes).filter(review => review.user_id === user?.id));

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  // Calculate client stats from real data
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

  // Filter spaces based on search and availability
  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = 
      space.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.space_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAvailability = 
      availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && space.status === 'available') ||
      (availabilityFilter === 'booked' && space.status !== 'available');
    
    return matchesSearch && matchesAvailability;
  });

  // Upcoming bookings for dashboard
  const upcomingBookings = bookings.filter(b => {
    const startTime = b.start_time || b.date || b.booking_date;
    return startTime && new Date(startTime) > new Date() && 
      ['confirmed', 'pending', 'active', 'upcoming'].includes(b.status);
  }).slice(0, 5);

  // Enhanced SpaceCard component with fixed image handling
  const EnhancedSpaceCard = ({ space }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Check if space has valid images
    const hasValidImages = space.images && Array.isArray(space.images) && space.images.length > 0;
    const imageUrl = hasValidImages ? space.images[0] : null;
    
    // Reset image states when space changes
    useEffect(() => {
      setImageError(false);
      setImageLoaded(false);
    }, [space.id, imageUrl]);
    
    return (
      <div className="border w-full h-full rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
        <div className="relative w-full h-60 overflow-hidden bg-gray-200">
          {imageUrl && !imageError ? (
            <>
              <img
                src={imageUrl}
                alt={space.title || space.name || 'Space image'}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
                style={{ display: imageLoaded && !imageError ? 'block' : 'none' }}
              />
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center animate-pulse">
                  <div className="text-gray-400">Loading...</div>
                </div>
              )}
            </>
          ) : null}
          
          {/* Fallback - show when no image URL or image failed to load */}
          {(!imageUrl || imageError) && (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Building className="h-12 w-12 mx-auto mb-2" />
                <span className="text-sm">No Image</span>
              </div>
            </div>
          )}
          
          {/* Availability Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${
              space.status === 'available' 
                ? 'bg-green-300 text-green-800' 
                : 'bg-orange-300 text-orange-800'
            }`}>
              {space.status === 'available' ? 'Available' : 'Booked'}
            </span>
          </div>

          {/* Price Badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-black bg-opacity-70 text-white px-2 py-1 text-xs font-semibold rounded">
              Ksh {space.price_per_hour || 0}/hr
            </span>
          </div>
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold mb-2 line-clamp-1">{space.title || space.name || 'Untitled Space'}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">{space.description || 'No description available'}</p>
          
          <div className="mt-auto space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 capitalize">{space.space_type || 'General'}</span>
              {space.location && (
                <span className="text-xs text-gray-500 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {space.location}
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setShowDetails(true)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm transition-colors"
              >
                View Details
              </button>
              
              {space.status === "available" ? (
                <Link to={`/spaces/${space.id}/booking`}>
                  <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm transition-colors">
                    Book Now
                  </button>
                </Link>
              ) : (
                <button 
                  disabled
                  className="w-full bg-gray-400 text-gray-200 px-4 py-2 rounded-lg cursor-not-allowed text-sm flex items-center justify-center"
                >
                  <CalendarOff className="h-4 w-4 mr-1" />
                  Currently Booked
                </button>
              )}
            </div>
          </div>
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
          <p className="text-red-600 mb-4">Please log in to access your dashboard.</p>
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600">Welcome back! Browse all spaces and manage your bookings.</p>
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
                            <h4 className="font-semibold text-gray-900">{booking.space_title || `Space #${booking.space_id}`}</h4>
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
                            <p>{booking.start_time ? new Date(booking.start_time).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Time</p>
                            <p>{booking.start_time ? new Date(booking.start_time).toLocaleTimeString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Guests</p>
                            <p>{booking.estimated_guests || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Amount</p>
                            <p className="font-semibold text-gray-900">Ksh {parseFloat(booking.total_amount || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                          <Link 
                            to={`/bookings/${booking.id}`}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            View Details
                          </Link>
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

        {/* My Bookings Tab - Use existing BookingsTable */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <BookingsTable />
          </div>
        )}

        {/* Browse Spaces Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Enhanced Search and Filter */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search spaces by name, type, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Spaces</option>
                    <option value="available">Available Only</option>
                    <option value="booked">Booked Spaces</option>
                  </select>
                  <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </button>
                </div>
              </div>
              
              {/* Results summary */}
              <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                <span>
                  Showing {filteredSpaces.length} of {spaces.length} spaces
                </span>
                <span>
                  {spaces.filter(s => s.status === 'available').length} available now
                </span>
              </div>
            </div>

            {/* Available Spaces using enhanced SpaceCard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpaces.map(space => (
                <EnhancedSpaceCard key={space.id} space={space} />
              ))}
            </div>

            {filteredSpaces.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || availabilityFilter !== 'all' 
                    ? 'No spaces found matching your criteria' 
                    : 'No spaces available yet'
                  }
                </p>
                {(searchTerm || availabilityFilter !== 'all') && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setAvailabilityFilter('all');
                    }}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Show All Spaces
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Payments Tab - Use existing InvoicesTable */}
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
                            <h4 className="font-semibold text-gray-900">{booking.space_title || `Space #${booking.space_id}`}</h4>
                            <p className="text-sm text-gray-600">
                              Booked on {booking.start_time ? new Date(booking.start_time).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className="text-sm text-orange-600 font-medium">Review Pending</span>
                        </div>
                        <Link 
                          to={`/spaces/${booking.space_id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block"
                        >
                          Write Review
                        </Link>
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
                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                                <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;