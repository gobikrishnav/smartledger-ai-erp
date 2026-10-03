import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

const Login = React.lazy(() => import('./pages/Login').catch(() => ({ default: () => <div>Login</div> })));
const Register = React.lazy(() => import('./pages/Register').catch(() => ({ default: () => <div>Register</div> })));
const CashierPOS = React.lazy(() => import('./pages/CashierPOS').catch(() => ({ default: () => <div>CashierPOS</div> })));
const OwnerDashboard = React.lazy(() => import('./pages/OwnerDashboard').catch(() => ({ default: () => <div>OwnerDashboard</div> })));
const WarehouseConsole = React.lazy(() => import('./pages/WarehouseConsole').catch(() => ({ default: () => <div>WarehouseConsole</div> })));
const Invoices = React.lazy(() => import('./pages/Invoices').catch(() => ({ default: () => <div>Invoices</div> })));
const Inventory = React.lazy(() => import('./pages/Inventory').catch(() => ({ default: () => <div>Inventory</div> })));
const Analytics = React.lazy(() => import('./pages/Analytics').catch(() => ({ default: () => <div>Analytics</div> })));
const AuditLog = React.lazy(() => import('./pages/AuditLog').catch(() => ({ default: () => <div>AuditLog</div> })));

export default function App() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/owner" replace />} />
            <Route path="pos" element={<ProtectedRoute allowedRoles={['Cashier', 'Business_Owner']}><CashierPOS /></ProtectedRoute>} />
            <Route path="invoices" element={<ProtectedRoute allowedRoles={['Cashier', 'Business_Owner']}><Invoices /></ProtectedRoute>} />
            <Route path="warehouse" element={<ProtectedRoute allowedRoles={['Warehouse_Manager', 'Business_Owner']}><WarehouseConsole /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute allowedRoles={['Warehouse_Manager', 'Business_Owner']}><Inventory /></ProtectedRoute>} />
            <Route path="owner" element={<ProtectedRoute allowedRoles={['Business_Owner']}><OwnerDashboard /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute allowedRoles={['Business_Owner']}><Analytics /></ProtectedRoute>} />
            <Route path="audit-log" element={<ProtectedRoute allowedRoles={['Business_Owner']}><AuditLog /></ProtectedRoute>} />
          </Route>
        </Routes>
      </React.Suspense>
    </ErrorBoundary>
  );
}
