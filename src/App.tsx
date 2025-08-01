import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth Components
import Login from './components/Login';
import Register from './components/Register';

// Layout
import Layout from './components/Layout';

// Customer Components
import Dashboard from './components/Dashboard';
import Packages from './components/Packages';
import Tasks from './components/Tasks';
import Wallet from './components/Wallet';
import Referrals from './components/Referrals';
import CustomerBankInfo from './components/CustomerBankInfo';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminDeposits from './components/admin/AdminDeposits';
import AdminWithdrawals from './components/admin/AdminWithdrawals';
import AdminUsers from './components/admin/AdminUsers';
import AdminPackages from './components/admin/AdminPackages';
import AdminBankAccounts from './components/admin/AdminBankAccounts';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.is_admin ? "/admin" : "/dashboard"} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.is_admin ? "/admin" : "/dashboard"} replace /> : <Register />} />
      
      {/* Customer Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {user?.is_admin ? <Navigate to="/admin" replace /> : <Dashboard />}
        </ProtectedRoute>
      } />
      <Route path="/packages" element={
        <ProtectedRoute>
          {user?.is_admin ? <Navigate to="/admin" replace /> : <Packages />}
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute>
          {user?.is_admin ? <Navigate to="/admin" replace /> : <Tasks />}
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute>
          {user?.is_admin ? <Navigate to="/admin" replace /> : <Wallet />}
        </ProtectedRoute>
      } />
      <Route path="/referrals" element={
        <ProtectedRoute>
          {user?.is_admin ? <Navigate to="/admin" replace /> : <Referrals />}
        </ProtectedRoute>
      } />
<Route path="/bank-info" element={<CustomerBankInfo />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
<Route path="/admin/deposits" element={
  <AdminRoute>
    <AdminDeposits />
  </AdminRoute>
} />
<Route path="/admin/withdrawals" element={
  <AdminRoute>
    <AdminWithdrawals />
  </AdminRoute>
} />
<Route path="/admin/users" element={
  <AdminRoute>
    <AdminUsers />
  </AdminRoute>
} />
<Route path="/admin/packages" element={
  <AdminRoute>
    <AdminPackages />
  </AdminRoute>
} />
<Route path="/admin/banks" element={<AdminBankAccounts />} />
<Route path="/admin/bank-accounts" element={<AdminBankAccounts />} />
<Route path="/wallet/bank-info" element={<CustomerBankInfo />} />
<Route path="/wallet" element={<Wallet />} />
      {/* Default redirect */}
      <Route path="/" element={
        user ? (
          <Navigate to={user.is_admin ? "/admin" : "/dashboard"} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;