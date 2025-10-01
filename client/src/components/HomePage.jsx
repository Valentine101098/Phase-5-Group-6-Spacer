import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Home, MapPin, Users, Shield, Search, Sparkles } from "lucide-react";
import Spaces from "./Spaces";
import { API_BASE_URL } from '../config/api';

// Enhanced Button Component
const Button = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyles = "px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95";

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60",
    hero: "bg-white text-blue-600 shadow-2xl shadow-white/20 hover:shadow-white/30 backdrop-blur-sm",
    cta: "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-2xl",
    outline: "border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm",
    filter: "border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

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
      const response = await fetch(`${API_BASE_URL}/api/spaces?${queryParams.toString()}`);
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
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 p-6 sm:p-8 mb-8 border border-white/20 transition-all duration-500 hover:shadow-blue-500/20">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5 transition-colors group-focus-within:text-blue-600" />
            <input
              type="text"
              placeholder="Search for your perfect workspace..."
              value={searchParams.keyword}
              onChange={(e) => handleInputChange('keyword', e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
            />
          </div>

          <Button
            variant="filter"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`${
              showAdvanced || hasActiveFilters()
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 text-blue-700 shadow-md'
                : ''
            }`}
          >
            Filters
            {hasActiveFilters() && (
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs px-2.5 py-1 font-bold shadow-lg animate-bounce">
                {Object.values(searchParams).filter(v => v && v.toString().trim()).length}
              </span>
            )}
          </Button>

          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={isSearching}
            className="disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Search
              </>
            )}
          </Button>
        </div>

        {showAdvanced && (
          <div className="border-t-2 border-gradient-to-r from-blue-200 to-purple-200 pt-6 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Price Range (per hour)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={searchParams.minPrice}
                    onChange={(e) => handleInputChange('minPrice', e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <span className="flex items-center text-gray-400 font-semibold">→</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={searchParams.maxPrice}
                    onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Space Type
                </label>
                <select
                  value={searchParams.spaceType}
                  onChange={(e) => handleInputChange('spaceType', e.target.value)}
                  className=" w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
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
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-300 font-semibold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {hasActiveFilters() && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <span className="text-sm font-semibold text-gray-500 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> Active filters:
            </span>
            {searchParams.keyword && (
              <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                "{searchParams.keyword}"
              </span>
            )}
            {searchParams.minPrice && (
              <span className="bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                Min: Ksh {searchParams.minPrice}/hr
              </span>
            )}
            {searchParams.maxPrice && (
              <span className="bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                Max: Ksh {searchParams.maxPrice}/hr
              </span>
            )}
            {searchParams.spaceType && (
              <span className="bg-gradient-to-r from-purple-100 to-pink-200 text-purple-800 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all">
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
      description: "Carefully vetted properties from trusted landlords across Nairobi",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Secure Platform",
      description: "Safe and secure transactions with verified property owners",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Community Focused",
      description: "Connect with a community of tenants and property managers",
      gradient: "from-purple-500 to-pink-500"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-purple-700 to-blue-400">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32 text-center">
          <div className="inline-block mb-6 animate-float">
            <span className="bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-full text-sm font-semibold shadow-2xl border border-white/30">
              🚀 Premium Workspace Solutions
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 text-white drop-shadow-2xl leading-tight">
            Find Your Perfect<br />
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Working Environment
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto text-white/95 font-medium drop-shadow-lg">
            Discover quality rental workspaces from verified owners.<br />
            Your dream space is just a click away.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" className="text-lg px-8 py-4">
              <Sparkles className="h-5 w-5" />
              Explore Spaces
            </Button>
            <Button variant="outline" className="text-lg px-8 py-4">
              Learn More
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-50 to-transparent"></div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-10">
        <SpaceSearch onSearch={handleSearch} onClear={handleClearSearch} />
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Why Choose SpaceHub?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            We make finding and managing rental spaces simple, secure, and stress-free
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group text-center p-8 rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <div className="relative">
                <div className="flex justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Properties Section */}
      <div className="max-w-7xl mx-auto px-4 pb-16 sm:pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isSearching ? 'Search Results' : 'Featured Spaces'}
              {searchResultsCount !== null && (
                <span className="text-lg font-semibold text-gray-500 ml-3">
                  ({searchResultsCount} {searchResultsCount === 1 ? 'space' : 'spaces'} found)
                </span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-lg font-semibold">
            <MapPin className="h-5 w-5" />
            <span>Nairobi, Kenya</span>
          </div>
        </div>

        <Spaces
          searchResults={searchResults}
          isSearching={isSearching}
          onClearSearch={handleClearSearch}
        />
      </div>

      {/* Call to Action */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="inline-block mb-6">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl">
              ✨ Join Our Community
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Ready to Get Started?
          </h2>

          <p className="text-base sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Join thousands of satisfied customers and owners who trust SpaceHub
            for their workspace needs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;