import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiTrendingUp, FiFileText, FiShoppingBag,
  FiPieChart, FiUsers, FiTruck, FiBox, FiShield,
  FiSettings, FiChevronRight, FiChevronDown, FiBookOpen,
  FiCpu, FiBarChart2, FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [erpOpen, setErpOpen] = useState(true);

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  const userRole = (user?.role || '').toUpperCase();
  const isCashier = userRole === 'CASHIER';
  const isWarehouse = userRole === 'WAREHOUSE_MGR' || userRole === 'WAREHOUSE MANAGER';
  const isOwner = userRole === 'BUSINESS_OWNER' || userRole === 'BUSINESS OWNER';
  const isAdmin = userRole === 'ADMIN';

  // Role-Specific Navigation Definitions
  const cashierNav = [
    { path: '/pos', label: 'POS Terminal', icon: FiShoppingBag },
    { path: '/invoices', label: 'Invoices', icon: FiFileText },
  ];

  const warehouseNav = [
    { path: '/inventory', label: 'Inventory (GRN & Stock)', icon: FiBox },
    { path: '/suppliers', label: 'Suppliers', icon: FiTruck },
  ];

  const aiIntelligenceNav = [
    { path: '/gemini', label: 'Gemini AI Copilot', icon: FiCpu, badge: 'Smart' },
    { path: '/insights', label: 'AI Insights & Pricing', icon: FiTrendingUp, badge: 'PED' },
    { path: '/analytics', label: 'Predictive Analytics', icon: FiPieChart },
  ];

  const erpCoreNav = [
    { path: '/dashboard', label: 'Executive Dashboard', icon: FiGrid },
    { path: '/invoices', label: 'Invoice Ledger', icon: FiFileText },
    { path: '/ledger', label: 'General Ledger', icon: FiBookOpen },
    { path: '/clients', label: 'B2B Customers & Risk', icon: FiUsers },
    { path: '/inventory', label: 'Inventory & Stock', icon: FiBox },
    { path: '/pos', label: 'POS Terminal', icon: FiShoppingBag },
    { path: '/reports', label: 'Financial Reports', icon: FiBarChart2 },
  ];

  const adminNav = [
    { path: '/admin', label: 'User Management', icon: FiShield },
    { path: '/settings', label: 'System Settings', icon: FiSettings },
  ];

  const renderNavGroup = (items, title) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.25rem' }}>
        {title && (
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, paddingLeft: '0.75rem', marginBottom: '0.65rem', letterSpacing: '0.06em' }}>
            {title}
          </div>
        )}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {items.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <NavLink key={item.path} to={item.path} className={`sl-nav-item ${active ? 'active' : ''}`}>
                <Icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && !active && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.45rem',
                    borderRadius: 9999,
                    background: '#eff6ff',
                    color: '#2563eb'
                  }}>
                    {item.badge}
                  </span>
                )}
                {active && <FiChevronRight size={14} style={{ opacity: 0.8 }} />}
              </NavLink>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <aside style={{
      width: '260px', background: '#ffffff', borderRight: '1px solid #eef2f6', display: 'flex', flexDirection: 'column',
      padding: '1.5rem 1.15rem', position: 'relative', flexShrink: 0, zIndex: 20, boxShadow: '2px 0 12px rgba(15, 23, 42, 0.02)',
      height: '100vh', overflowY: 'auto'
    }}>
      <style>{`
        .sl-nav-item {
          display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 1rem; border-radius: 9999px;
          text-decoration: none; font-size: 0.86rem; font-weight: 600; color: #64748b; transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .sl-nav-item:not(.active):hover { background: #f8fafc; color: #0f172a; transform: translateX(2px); }
        .sl-nav-item.active { background: #2563eb !important; color: #ffffff !important; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.28); }
        .sl-nav-item.active svg { color: #ffffff !important; }
      `}</style>

      {/* Logo Header */}
      <div onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem', marginBottom: '1.75rem', cursor: 'pointer' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12a5 5 0 0 1 5-5" /><circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>SmartLedger AI</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Retail ERP Platform</div>
        </div>
      </div>

      {/* RENDER DYNAMIC NAVIGATION BASED ON USER ROLES */}
      {isCashier && renderNavGroup(cashierNav, 'Cashier Console')}
      {isWarehouse && renderNavGroup(warehouseNav, 'Warehouse Console')}

      {/* Executive & Operations Nav */}
      {(isOwner || isAdmin || (!isCashier && !isWarehouse)) && (
        <>
          {renderNavGroup(aiIntelligenceNav, 'AI Intelligence')}
          <div style={{ marginBottom: '1.25rem' }}>
            <div onClick={() => setErpOpen(!erpOpen)} style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, paddingLeft: '0.75rem', marginBottom: '0.65rem', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>ERP Operations</span>
              {erpOpen ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
            </div>
            {erpOpen && (
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {erpCoreNav.map(item => {
                  const active = isActive(item.path);
                  return (
                    <NavLink key={item.path} to={item.path} className={`sl-nav-item ${active ? 'active' : ''}`}>
                      <item.icon size={16} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {active && <FiChevronRight size={14} style={{ opacity: 0.8 }} />}
                    </NavLink>
                  );
                })}
              </nav>
            )}
          </div>
          {(isAdmin || isOwner) && renderNavGroup(adminNav, 'System')}
        </>
      )}

      {/* Bottom User Card */}
      <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', border: '1px solid #eef2f6', borderRadius: 14, padding: '0.65rem 0.85rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', flexShrink: 0 }}>
            {(user?.name || user?.full_name || 'M').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || user?.full_name || 'Staff'}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{user?.role || 'Executive'}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#ef4444', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
