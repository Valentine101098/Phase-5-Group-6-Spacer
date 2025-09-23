// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Layout
import Navbar from "./pages/navbar";

// Pages
import HomePage from "./pages/HomePage";
import LoginForm from "./pages/LoginForm";
import SignupForm from "./pages/SignupForm";
import OwnerDashboard from "./pages/OwnerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import NoPage from "./pages/NoPage";

// ✅ check auth status via localStorage
const isAuthenticated = () => {
  return localStorage.getItem("user") !== null && localStorage.getItem("accessToken") !== null;
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// ✅ Layouts
const AuthenticatedLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-100">
    <Navbar />
    <main className="p-6">{children}</main>
  </div>
);

const PublicLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Navbar isPublic={true} />
    <main className="p-6">{children}</main>
  </div>
);

// ✅ Route Wrappers
const PrivateRoute = ({ element }) => {
  return isAuthenticated() ? (
    <AuthenticatedLayout>{element}</AuthenticatedLayout>
  ) : (
    <Navigate to="/auth/login" />
  );
};

const PublicOnlyRoute = ({ element }) => {
  return isAuthenticated() ? (
    <Navigate to="/dashboard" />
  ) : (
    <PublicLayout>{element}</PublicLayout>
  );
};

// ✅ Role-based dashboard resolver
const RoleBasedDashboardResolver = () => {
  const user = getUser();

  if (!user) return <Navigate to="/auth/login" />;

  switch (user.role) {
    case "landlord":
      return <OwnerDashboard />;
    case "tenant":
      return <ClientDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <Navigate to="/auth/login" />;
  }
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/auth/register" element={<PublicOnlyRoute element={<SignupForm />} />} />
        <Route path="/auth/login" element={<PublicOnlyRoute element={<LoginForm />} />} />

        {/* Protected - Main dashboard that routes based on role */}
        <Route path="/dashboard" element={<PrivateRoute element={<RoleBasedDashboardResolver />} />} />

        {/* Catch-all */}
        <Route path="*" element={<NoPage />} />
      </Routes>
    </Router>
  );
}