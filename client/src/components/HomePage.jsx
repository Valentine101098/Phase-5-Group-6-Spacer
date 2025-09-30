import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Home, MapPin, Users, Shield, Search } from "lucide-react";
import Spaces from "./Spaces";
import { API_BASE_URL } from '../config/api';

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
      const response = await fetch(`${API_BASE_URL}/spaces?${queryParams.toString()}`);
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
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ml-12 mt-1"
                >
                  <option value="">All Types</option>
                  {spaceTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
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

const HomePage = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultsCount, setSearchResultsCount] = useState(null);

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

  const handleSearch = (results, searchParams) => {
    setSearchResults(results);
    setSearchResultsCount(results.length);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setIsSearching(false);
    setSearchResultsCount(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/60 to-purple-700/60 backdrop-blur-sm"></div>
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

      {/* Properties Section */}
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
            <Spaces
              searchResults={searchResults}
              isSearching={isSearching}
              onClearSearch={handleClearSearch}
            />
          </div>
        </div>
        <div className="flex items-center justify-center text-blue-600">
          <MapPin className="h-5 w-5 mr-2" />
          <div className="font-medium">Nairobi, Kenya</div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied tenants and landlords who trust SpaceHub
            for their space needs.
          </p>
          <div className="space-x-4">
            <Link
              to="/auth/register"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign Up Today
            </Link>
            <Link
              to="/auth/login"
              className="inline-block border border-gray-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Already a Member?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;