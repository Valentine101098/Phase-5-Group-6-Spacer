import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import LogoutButton from './components/LogoutButton';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import HomePage from './components/HomePage';
import NoPage from './components/NoPage';
import AdminDashboard from './components/AdminDashboard';
import { BookingPage } from './components/BookingPage';
import { BookingsTable } from './components/BookingsTable';
import { PaymentForm } from './components/PaymentForm';
import { PaymentPage } from './components/PaymentPage';
import { InvoicesTable } from './components/InvoicesTable';
import ClientDashboard from './components/ClientDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import AuthCallback from './components/AuthCallback';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="text-center py-4 sm:py-8 text-base sm:text-lg text-primary">Loading authentication...</div>;
  }
  if (!isAuthenticated && !loading) {
    return <Login />;
  }
  return children;
};

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 bg-blue-300 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:py-4 gap-3 sm:gap-0">
            {/* Logo */}
            <Link
              to="/"
              className="text-3xl sm:text-2xl lg:text-3xl font-bold text-white no-underline font-nabla text-center sm:text-left"
            >
              SpaceHub
            </Link>

            {/* Navigation Links */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 lg:gap-6">
              <Link
                to="/"
                className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-xl sm:text-lg lg:text-2xl w-full sm:w-auto text-center"
              >
                Home
              </Link>

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-xl sm:text-lg lg:text-2xl w-full sm:w-auto text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-xl sm:text-lg lg:text-2xl w-full sm:w-auto text-center"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/profile"
                    className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-xl sm:text-lg lg:text-2xl w-full sm:w-auto text-center"
                  >
                    Profile
                  </Link>

                  {user && user.roles && (
                    <>
                      {user.roles.includes('admin') && (
                        <Link
                          to="/admin-dashboard"
                          className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-xl sm:text-lg lg:text-2xl w-full sm:w-auto text-center"
                        >
                          My Dashboard
                        </Link>
                      )}
                      {user.roles.includes('client') && (
                        <Link
                          to="/client-dashboard"
                          className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-xl sm:text-lg lg:text-2xl w-full sm:w-auto text-center"
                        >
                          My Dashboard
                        </Link>
                      )}
                      {user.roles.includes('owner') && (
                        <Link
                          to="/owner-dashboard"
                          className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-xl sm:text-lg lg:text-2xl w-full sm:w-auto text-center"
                        >
                          My Dashboard
                        </Link>
                      )}
                    </>
                  )}

                  <div className="w-full sm:w-auto">
                    <LogoutButton />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full bg-lightblue-lighter">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route path="/spaces/:id/booking" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
            <Route path="/invoices/:id" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
            <Route path="/dashboard/bookings" element={<PrivateRoute><BookingsTable /></PrivateRoute>} />
            <Route path="/dashboard/invoices" element={<PrivateRoute><InvoicesTable /></PrivateRoute>} />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/client-dashboard"
              element={
                <PrivateRoute>
                  <ClientDashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/owner-dashboard"
              element={
                <PrivateRoute>
                  <OwnerDashboard />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<NoPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
