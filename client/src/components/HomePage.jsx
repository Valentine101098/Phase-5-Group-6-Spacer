
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, MapPin, Star, Users, Shield } from "lucide-react";
import Spaces from "./Spaces";
import SpaceCreation from "./SpaceCreation";

const HomePage = () => {

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
          <div>
            <h2 className="text-3xl ml-4 font-bold text-gray-900">
              Featured Spaces
            </h2>
            <Spaces />
            <SpaceCreation onSpaceCreated={(newspace) => {setSpaces((prev) => [newspace, ...prev])}}/>
          </div>
        </div>
          <div className="flex items-center text-blue-600">
            <MapPin className="h-5 w-5 mr-2" />
            <span className="font-medium">Nairobi, Kenya</span>
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