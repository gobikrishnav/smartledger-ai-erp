import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { BusinessProvider } from './context/BusinessContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import BusinessOnboardingWizard from './components/BusinessOnboardingWizard';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CashierPOS from './pages/CashierPOS';

import Dashboard from './pages/Dashboard';
import GeminiChat from './pages/GeminiChat';
import AIInsights from './pages/AIInsights';
import Analytics from './pages/Analytics';
import Invoices from './pages/Invoices';
import InvoiceCreate from './pages/InvoiceCreate';
import Clients from './pages/Clients';
import Inventory from './pages/Inventory';
import Ledger from './pages/Ledger';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Suppliers from './pages/Suppliers';
import Admin from './pages/Admin';

const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f6f8fb' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <BusinessProvider>
        <BusinessOnboardingWizard />
        <Routes>
          {/* Public Authentication & Welcome */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Dedicated Fast POS Terminal */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={['CASHIER', 'BUSINESS_OWNER', 'ADMIN', 'Cashier', 'Business Owner', 'Admin']}>
                <CashierPOS />
              </ProtectedRoute>
            }
          />

          {/* Shortcuts for Warehouse and Owner redirecting to their primary hubs */}
          <Route path="/warehouse" element={<Navigate to="/inventory" replace />} />
          <Route path="/owner" element={<Navigate to="/dashboard" replace />} />

          {/* Primary Enterprise ERP & AI Suite Layout */}
          <Route element={<AppLayout />}>
            {/* Core AI Intelligence Hubs */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/gemini" element={<ProtectedRoute><GeminiChat /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'Warehouse Manager', 'BUSINESS_OWNER', 'ADMIN', 'WAREHOUSE_MGR']}><AIInsights /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'Corporate Auditor', 'BUSINESS_OWNER', 'ADMIN']}><Analytics /></ProtectedRoute>} />

            {/* Core Financial & Operational Modules */}
            <Route path="/invoices" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'Corporate Auditor', 'BUSINESS_OWNER', 'ADMIN']}><Invoices /></ProtectedRoute>} />
            <Route path="/invoices/new" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'BUSINESS_OWNER', 'ADMIN']}><InvoiceCreate /></ProtectedRoute>} />
            <Route path="/ledger" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'BUSINESS_OWNER', 'ADMIN']}><Ledger /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'BUSINESS_OWNER', 'ADMIN']}><Clients /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['Admin', 'Warehouse Manager', 'WAREHOUSE_MGR', 'BUSINESS_OWNER', 'ADMIN']}><Inventory /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'Warehouse Manager', 'BUSINESS_OWNER', 'WAREHOUSE_MGR', 'ADMIN']}><Suppliers /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'BUSINESS_OWNER', 'ADMIN']}><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'ADMIN', 'BUSINESS_OWNER']}><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin', 'ADMIN', 'BUSINESS_OWNER']}><Admin /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BusinessProvider>
    </SocketProvider>
  );
};

export default App;
