import React, { useEffect, useState } from "react";
import { Home, MapPin, Star, Users, Shield, Search, AlertTriangle } from "lucide-react";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error: error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-2">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="text-sm">{this.props.fallbackMessage || "Component failed to load"}</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Search Component
const SpaceSearch = ({ onSearch, onClear }) => {
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    minPrice: '',
    maxPrice: '',
    spaceType: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const spaceTypes = [
    'office',
    'meeting room',
    'coworking',
    'conference room',
    'studio',
    'workshop',
    'event space',
    'retail space'
  ];

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    setIsSearching(true);

    const queryParams = new URLSearchParams();

    if (searchParams.keyword.trim()) {
      queryParams.append('keyword', searchParams.keyword.trim());
    }

    if (searchParams.minPrice && !isNaN(parseInt(searchParams.minPrice))) {
      queryParams.append('min_price', parseInt(searchParams.minPrice));
    }

    if (searchParams.maxPrice && !isNaN(parseInt(searchParams.maxPrice))) {
      queryParams.append('max_price', parseInt(searchParams.maxPrice));
    }

    if (searchParams.spaceType) {
      queryParams.append('space_type', searchParams.spaceType);
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/spaces?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      onSearch(data.spaces || data, searchParams);
    } catch (error) {
      console.error('Search error:', error);
      onSearch([], searchParams);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchParams({
      keyword: '',
      minPrice: '',
      maxPrice: '',
      spaceType: '',
    });
    setShowAdvanced(false);
    onClear();
  };

  const hasActiveFilters = () => {
    return searchParams.keyword.trim() ||
           searchParams.minPrice ||
           searchParams.maxPrice ||
           searchParams.spaceType;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for spaces by title or description..."
              value={searchParams.keyword}
              onChange={(e) => handleInputChange('keyword', e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
              showAdvanced || hasActiveFilters()
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Filters
            {hasActiveFilters() && (
              <span className="bg-blue-500 text-white rounded-full text-xs px-2 py-1">
                {Object.values(searchParams).filter(v => v && v.toString().trim()).length}
              </span>
            )}
          </button>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </button>
        </div>

        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Price Range (per hour)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={searchParams.minPrice}
                    onChange={(e) => handleInputChange('minPrice', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={searchParams.maxPrice}
                    onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Space Type
                </label>
                <select
                  value={searchParams.spaceType}
                  onChange={(e) => handleInputChange('spaceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {spaceTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 opacity-0">
                  Actions
                </label>
                {hasActiveFilters() && (
                  <button
                    onClick={handleClear}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {hasActiveFilters() && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchParams.keyword && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                "{searchParams.keyword}"
              </span>
            )}
            {searchParams.minPrice && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Min: Ksh {searchParams.minPrice}/hr
              </span>
            )}
            {searchParams.maxPrice && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Max: Ksh {searchParams.maxPrice}/hr
              </span>
            )}
            {searchParams.spaceType && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                {searchParams.spaceType}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const HomePage = ({ Spaces, SpaceCreation }) => {
  const [spaces, setSpaces] = useState([]);
  const [allSpaces, setAllSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultsCount, setSearchResultsCount] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in by looking for JWT token (matching ClientDashboard pattern)
    const checkAuthStatus = () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      setIsLoggedIn(!!token);
    };

    const fetchSpaces = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("http://127.0.0.1:5000/api/spaces");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, Body: ${errorText}`);
        }
        const data = await response.json();
        const spacesData = data.spaces || data;
        setSpaces(spacesData);
        setAllSpaces(spacesData);
      } catch (err) {
        console.error("Error fetching spaces for Home page:", err);
        setError("Failed to load spaces. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
    fetchSpaces();
  }, []);

  const handleSearch = (searchResults, searchParams) => {
    setSpaces(searchResults);
    setSearchResultsCount(searchResults.length);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSpaces(allSpaces);
    setIsSearching(false);
    setSearchResultsCount(null);
  };

  const handleSpaceCreated = (newSpace) => {
    setSpaces((prev) => [newSpace, ...prev]);
    setAllSpaces((prev) => [newSpace, ...prev]);
  };

  const features = [
    {
      icon: <Home className="h-8 w-8 text-blue-600" />,
      title: "Quality Spaces",
      description: "Carefully vetted properties from trusted landlords across Nairobi"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Secure Platform",
      description: "Safe and secure transactions with verified property owners"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Community Focused",
      description: "Connect with a community of tenants and property managers"
    }
  ];

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop';
  };

  const getImageUrl = (pictures) => {
    let imageUrl = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop';

    if (pictures && pictures.length > 0) {
      const firstPicture = pictures[0];
      if (firstPicture.startsWith('http')) {
        imageUrl = firstPicture;
      } else {
        imageUrl = `http://localhost:5000${firstPicture}`;
      }
    }
    return imageUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Find Your Perfect Working Environment/Space in Nairobi
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Discover quality rental work spaces from verified owners.
            Your dream space is just a click away.
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <SpaceSearch onSearch={handleSearch} onClear={handleClearSearch} />
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose SpaceHub?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We make finding and managing rental spaces simple, secure, and stress-free
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spaces Section */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h2 className="text-3xl ml-4 font-bold text-gray-900">
              {isSearching ? 'Search Results' : 'Featured Spaces'}
              {searchResultsCount !== null && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({searchResultsCount} {searchResultsCount === 1 ? 'space' : 'spaces'} found)
                </span>
              )}
            </h2>

            {/* Safely render Spaces and SpaceCreation components with error boundaries */}
            {Spaces && (
              <ErrorBoundary fallbackMessage="Spaces component failed to load">
                <Spaces spaces={spaces} />
              </ErrorBoundary>
            )}

            {SpaceCreation && (
              <ErrorBoundary fallbackMessage="Space creation component failed to load">
                <SpaceCreation onSpaceCreated={handleSpaceCreated} />
              </ErrorBoundary>
            )}
          </div>

          <div className="flex items-center text-blue-600">
            <MapPin className="h-5 w-5 mr-2" />
            <span className="font-medium">Nairobi, Kenya</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading amazing spaces...</p>
          </div>
        ) : error ? (
          <div className="text-center bg-red-50 border border-red-200 rounded-lg p-8">
            <div className="text-red-600 mb-4">
              <Home className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center bg-gray-50 border border-gray-200 rounded-lg p-8">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-600 font-medium">
              {isSearching ? 'No spaces match your search criteria' : 'No spaces currently available'}
            </p>
            {isSearching && (
              <button
                onClick={handleClearSearch}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View All Spaces
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {spaces.map((space) => {
              let images = [];
              if (typeof space.images === "string") {
                try {
                  images = JSON.parse(space.images);
                } catch (e) {
                  console.error("Invalid images JSON:", space.images);
                  images = [];
                }
              } else if (Array.isArray(space.images)) {
                images = space.images;
              }

              const imageUrl = getImageUrl(images);

              return (
                <a
                  href={`/api/spaces/${space.id}`}
                  key={space.id}
                  className="block group hover:scale-105 transition-transform duration-200"
                >
                  <div className="bg-white rounded-xl shadow-md overflow-hidden group-hover:shadow-xl transition-shadow duration-200">
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt={space.title || 'Space image'}
                        className="w-full h-48 object-cover"
                        onError={handleImageError}
                      />
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                        {space.status === 'available' ? 'Available' : space.status || 'Available'}
                      </div>
                      <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        <Star className="inline h-3 w-3 mr-1" />
                        Featured
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {space.title || 'Untitled Space'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {space.description || 'No description available'}
                      </p>
                      <div className="flex items-center text-gray-600 text-sm mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{space.space_type || 'Workspace'}</span>
                        <span className="mx-2">•</span>
                        <Users className="h-4 w-4 mr-1" />
                        <span>Up to {space.max_guests || 0} guests</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-green-600">
                            Ksh {space.price_per_hour?.toLocaleString() || '0'}
                          </span>
                          <span className="text-gray-500 text-sm">/hour</span>
                        </div>
                        <div className="text-blue-600 font-medium text-sm group-hover:text-blue-800">
                          View Details →
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Call to Action - Only show if user is not logged in */}
      {!isLoggedIn && (
        <div className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied tenants and landlords who trust SpaceHub
              for their space needs.
            </p>
            <div className="space-x-4">
              <a
                href="/auth/register"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign Up Today
              </a>
              <a
                href="/auth/login"
                className="inline-block border border-gray-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Already a Member?
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;