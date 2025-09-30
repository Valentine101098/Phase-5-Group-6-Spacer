// src/App.js
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

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="text-center py-8 text-lg text-primary">Loading authentication...</div>;
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
      <nav className="bg-primary text-white p-4 flex justify-between items-center shadow-md">
        <Link to="/" className="text-2xl font-bold text-white no-underline font-nabla">SpaceHub</Link>
        <div className="flex space-x-6">
          <Link to="/" className="text-white hover:text-secondary hover:underline transition-colors duration-200 font-dancing">Home</Link>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className='font-dancing'>Login</Link>
              <Link to="/signup" className='font-dancing'>Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/profile" className='font-dancing'>Profile</Link>
              {user && user.roles && (
                <>
                  {user.roles.includes('admin') && (
                    <Link to="/admin-dashboard" className='font-dancing'>My Dashboard</Link>
                  )}
                  {user.roles.includes('client') && (
                    <Link to="/client-dashboard" className='font-dancing'>My Dashboard</Link>
                  )}
                  {user.roles.includes('owner') && (
                    <Link to="/owner-dashboard" className='font-dancing'>My Dashboard</Link>
                  )}
                </>
              )}
              <LogoutButton />
            </>
          )}
        </div>
      </nav>
      <div className="flex-grow p-8 flex justify-center items-start min-h-screen bg-lightblue-lighter">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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