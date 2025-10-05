import React from 'react';
import { Link } from 'react-router-dom';

function NoPage() {
  return (
    <div className="text-center py-8 sm:py-16 bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm sm:max-w-lg mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-red-600 mb-4">404 - Page Not Found</h2>
      <p className="text-base sm:text-lg text-gray-800 mb-6">
        Oops! The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded transition-colors duration-200 text-sm sm:text-base"
      >
        Go to Home
      </Link>
    </div>
  );
}

export default NoPage;