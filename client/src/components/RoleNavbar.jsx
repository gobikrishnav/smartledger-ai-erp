import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap, ShoppingCart, Box, TrendingUp, Bell, Shield,
  LogOut, MapPin, User, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ScreenshotGuideModal from './ScreenshotGuideModal';

const RoleNavbar = ({ onOpenNotifications }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { stockAlerts, riskAlerts } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [switching, setSwitching] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const totalAlerts = stockAlerts.length + riskAlerts.length;

  const handleRoleChange = async (targetRole, path) => {
    setSwitching(true);
    await switchDemoRole(targetRole);
    setSwitching(false);
    navigate(path);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #eef2f6',
      padding: '0.85rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)'
    }}>
      <style>{`
        .role-switch-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.95rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .role-switch-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .role-switch-btn.active {
          background: #2563eb !important;
          color: #ffffff !important;
          border-color: #2563eb !important;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
        }
        .nav-circle-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.18s;
          position: relative;
        }
        .nav-circle-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
      `}</style>

      {/* ── Left: Brand & Live Gateway Indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 12a5 5 0 0 1 5-5" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              SmartLedger <span style={{ color: '#2563eb', fontWeight: 900 }}>AI</span>
            </div>
            <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Retail ERP Platform
            </div>
          </div>
        </div>

        {/* Branch Geo-Fenced Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 9999,
          padding: '0.3rem 0.75rem',
          fontSize: '0.74rem',
          color: '#334155',
          fontWeight: 600
        }}>
          <MapPin size={12} color="#2563eb" />
          <span>Branch: <strong>{user?.branch_id || 'BR-CENTRAL-01'}</strong></span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginLeft: 4 }} title="Geo-fence Verified" />
        </div>
      </div>

      {/* ── Center: Removed Demo Switcher ── */}
      <div style={{ flex: 1 }}></div>

      {/* ── Right: User Profile, Notifications & Exit ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
            {user?.name || user?.full_name || 'Markus Wright'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {currentDate}
          </div>
        </div>

        {/* Notifications Icon with Socket Alert Count */}
        <button
          className="nav-circle-btn"
          onClick={onOpenNotifications}
          title="Live Alerts & Stock Feed"
        >
          <Bell size={17} />
          {totalAlerts > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              borderRadius: '50%',
              width: 17,
              height: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
            }}>
              {totalAlerts}
            </span>
          )}
        </button>

        {/* 18 Screenshot Pages Guide Hub */}
        <button
          onClick={() => setShowGuide(true)}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 9999,
            padding: '0.45rem 0.95rem',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
            whiteSpace: 'nowrap'
          }}
          title="Open Guide with direct links to all 18 screenshot pages"
        >
          <span>📸 18 Screenshot Pages</span>
        </button>

        {/* User Role Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 9999,
          padding: '0.35rem 0.85rem 0.35rem 0.5rem'
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800
          }}>
            {(user?.role || 'M').charAt(0)}
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
            {user?.role || 'Manager'}
          </div>
        </div>

        {/* Logout */}
        <button
          className="nav-circle-btn"
          onClick={() => { logout(); navigate('/login'); }}
          title="Sign Out"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* 18 Screenshot Pages Modal */}
      <ScreenshotGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </header>
  );
};

export default RoleNavbar;
