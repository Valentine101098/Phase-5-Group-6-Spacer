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
        <Link to="/" className="text-2xl font-bold text-white no-underline">Spacer</Link>
        <div className="flex space-x-6">
          <Link to="/" className="text-white hover:text-secondary hover:underline transition-colors duration-200">Home</Link>
          {!isAuthenticated ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/profile">Profile</Link>
              {user && user.roles && (
                <>
                  {user.roles.includes('admin') && (
                    <Link to="/admin-dashboard">Admin Dashboard</Link>
                  )}
                  {user.roles.includes('client') && (
                    <Link to="/client-dashboard">Client Dashboard</Link>
                  )}
                  {user.roles.includes('owner') && (
                    <Link to="/owner-dashboard">Owner Dashboard</Link>
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
       
        <Route path="/spaces/:id/booking" element={<BookingPage />} />
       
       <Route path="/invoices/:id" element={<PaymentPage />} />
     
      <Route path="/dashboard/bookings" element={<BookingsTable />} />
       <Route path="/dashboard/invoices" element={<InvoicesTable />} />          

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