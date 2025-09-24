// src/components/NoPage.js
import React from 'react';
import { Link } from 'react-router-dom';

function NoPage() {
  return (
    <div className="text-center py-16 bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
      <h2 className="text-4xl font-bold text-red-600 mb-4">404 - Page Not Found</h2>
      <p className="text-lg text-gray-800 mb-6">
        Oops! The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded transition-colors duration-200"
      >
        Go to Home
      </Link>
    </div>
  );
}

export default NoPage;