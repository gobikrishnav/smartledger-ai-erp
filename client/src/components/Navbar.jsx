import React, { useState, useEffect } from 'react';
import { FiBell, FiSearch, FiSettings, FiLogOut, FiCheck, FiX, FiBriefcase, FiPlusCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { business, openWizard, isOnboarded } = useBusiness();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Formatted date (e.g., "Sunday, June 25, 2024")
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await client.get('/notifications');
        const list = Array.isArray(res.data) ? res.data : [];
        const unread = list.filter(n => !n.isRead);
        setUnreadCount(unread.length);
        setNotifications(list.slice(0, 5));
      } catch (error) {
        // Soft fallback
      }
    };
    fetchNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/invoices?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const displayName = user?.full_name || user?.name || user?.username || 'Executive';

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.85rem 2rem',
      background: '#ffffff',
      borderBottom: '1px solid #eef2f6',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)'
    }}>
      <style>{`
        .ih-circle-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .ih-circle-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        .ih-search-input {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          padding: 0.5rem 1.25rem;
          width: 320px;
          transition: all 0.2s;
        }
        .ih-search-input:focus-within {
          background: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>

      {/* Left: User Greeting & Date (matching design image: Hey, Markus) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          color: '#ffffff',
          fontSize: '1rem',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
        }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Hey, {displayName}
            </div>
            {business?.business_name && (
              <span
                onClick={openWizard}
                title="Click to edit business profile and products"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: isOnboarded ? '#eff6ff' : '#fef3c7',
                  color: isOnboarded ? '#2563eb' : '#b45309',
                  border: isOnboarded ? '1px solid #bfdbfe' : '1px solid #fde68a',
                  padding: '0.15rem 0.6rem',
                  borderRadius: 9999,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <FiBriefcase size={12} />
                {business.business_name}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>{currentDate}</span>
            {!isOnboarded && (
              <button
                type="button"
                onClick={openWizard}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                ✨ Set up your business & products
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Center / Right: Pill Search & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Search Bar matching "Start searching here..." */}
        <form onSubmit={handleSearchSubmit}>
          <div className="ih-search-input">
            <FiSearch size={16} color="#94a3b8" style={{ marginRight: '0.65rem' }} />
            <input
              type="text"
              placeholder="Start searching here..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                color: '#0f172a',
                width: '100%',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </form>

        {/* Notifications Button */}
        <div style={{ position: 'relative' }}>
          <button
            className="ih-circle-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 6px #ef4444'
              }} />
            )}
          </button>

          {showNotifications && (
            <div className="card" style={{
              position: 'absolute',
              top: '125%',
              right: 0,
              width: '320px',
              padding: '1.25rem',
              borderRadius: '18px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.12)',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>System Alerts</strong>
                <span className="badge badge-primary">{unreadCount} New</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '240px', overflowY: 'auto' }}>
                {notifications.length > 0 ? notifications.map((n, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px', background: '#f8fafc', color: '#334155', border: '1px solid #eef2f6' }}>
                    {n.message}
                  </div>
                )) : (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>
                    No unread notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Icon */}
        <button
          className="ih-circle-btn"
          onClick={() => navigate('/settings')}
          title="System Settings"
        >
          <FiSettings size={18} />
        </button>

        {/* Logout Icon */}
        <button
          className="ih-circle-btn"
          onClick={handleLogout}
          title="Sign Out"
          style={{ color: '#ef4444' }}
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
