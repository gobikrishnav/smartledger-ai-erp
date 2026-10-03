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
import WarehouseConsole from './pages/WarehouseConsole';
import OwnerDashboard from './pages/OwnerDashboard';

import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceCreate from './pages/InvoiceCreate';
import Clients from './pages/Clients';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import TaxEngine from './pages/TaxEngine';
import Suppliers from './pages/Suppliers';
import AuditLog from './pages/AuditLog';
import Ledger from './pages/Ledger';
import AIInsights from './pages/AIInsights';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ModelMonitoring from './pages/ModelMonitoring';

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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── 3 Primary SmartLedger AI Stakeholder Consoles ── */}
          <Route path="/pos" element={<ProtectedRoute allowedRoles={['CASHIER', 'BUSINESS_OWNER', 'ADMIN', 'Cashier', 'Business Owner', 'Admin']}><CashierPOS /></ProtectedRoute>} />
          <Route path="/warehouse" element={<ProtectedRoute allowedRoles={['WAREHOUSE_MGR', 'BUSINESS_OWNER', 'ADMIN', 'Warehouse Manager', 'Business Owner', 'Admin']}><WarehouseConsole /></ProtectedRoute>} />
          <Route path="/owner" element={<ProtectedRoute allowedRoles={['BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin']}><OwnerDashboard /></ProtectedRoute>} />

          {/* ── Additional Deep ERP Layout Modules ── */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'Corporate Auditor', 'BUSINESS_OWNER', 'ADMIN']}><Invoices /></ProtectedRoute>} />
            <Route path="/invoices/new" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'BUSINESS_OWNER', 'ADMIN']}><InvoiceCreate /></ProtectedRoute>} />
            <Route path="/ledger" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'BUSINESS_OWNER', 'ADMIN']}><Ledger /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'Warehouse Manager', 'BUSINESS_OWNER', 'ADMIN', 'WAREHOUSE_MGR']}><AIInsights /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'BUSINESS_OWNER', 'ADMIN']}><Reports /></ProtectedRoute>} />
            <Route path="/tax-engine" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'Corporate Auditor', 'BUSINESS_OWNER', 'ADMIN']}><TaxEngine /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'BUSINESS_OWNER', 'ADMIN']}><Clients /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'Warehouse Manager', 'BUSINESS_OWNER', 'WAREHOUSE_MGR', 'ADMIN']}><Suppliers /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['Admin', 'Warehouse Manager', 'WAREHOUSE_MGR', 'BUSINESS_OWNER', 'ADMIN']}><Inventory /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'Corporate Auditor', 'BUSINESS_OWNER', 'ADMIN']}><Analytics /></ProtectedRoute>} />
            <Route path="/models" element={<ProtectedRoute allowedRoles={['Admin', 'Business Owner', 'ADMIN', 'BUSINESS_OWNER']}><ModelMonitoring /></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['Admin', 'Corporate Auditor', 'BUSINESS_OWNER', 'ADMIN']}><AuditLog /></ProtectedRoute>} />
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

