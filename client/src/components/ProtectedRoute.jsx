import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = String(user.role || '').toUpperCase().replace(/[\s_-]+/g, '');
    const normalizedAllowed = allowedRoles.map(r => String(r).toUpperCase().replace(/[\s_-]+/g, ''));
    if (userRole !== 'ADMIN' && !normalizedAllowed.includes(userRole)) {
      if (userRole === 'CASHIER') return <Navigate to="/pos" replace />;
      if (userRole === 'WAREHOUSEMGR') return <Navigate to="/warehouse" replace />;
      return <Navigate to="/owner" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
