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
    <>
      <nav className="bg-blue-200 text-white p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center shadow-md"> {/* Responsive padding and layout */}
        <Link to="/" className="text-4xl sm:text-2xl font-bold text-white no-underline font-nabla mb-2 sm:mb-0 ">SpaceHub</Link> {/* Responsive text size and margin */}
        <div className="flex flex-wrap justify-center sm:justify-end space-x-3 sm:space-x-6 text-sm sm:text-base"> {/* Responsive spacing and text size */}
          <Link to="/" className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-2xl">Home</Link>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-2xl">Login</Link>
              <Link to="/signup" className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-2xl">Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-2xl">Profile</Link>
              {user && user.roles && (
                <>
                  {user.roles.includes('admin') && (
                    <Link to="/admin-dashboard" className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-2xl">My Dashboard</Link>
                  )}
                  {user.roles.includes('client') && (
                    <Link to="/client-dashboard" className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-2xl">My Dashboard</Link>
                  )}
                  {user.roles.includes('owner') && (
                    <Link to="/owner-dashboard" className="text-blue-600 hover:text-secondary hover:underline transition-colors duration-200 font-dancing font-bold text-2xl">My Dashboard</Link>
                  )}
                </>
              )}
              <LogoutButton />
            </>
          )}
        </div>
      </nav>
      <div className="flex-grow p-4 sm:p-8 flex justify-center items-start min-h-screen bg-lightblue-lighter"> {/* Responsive padding */}
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
    </>
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