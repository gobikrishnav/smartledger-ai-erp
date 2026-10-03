import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiTrendingUp, FiFileText, FiShoppingBag,
  FiPieChart, FiSliders, FiUsers, FiTruck, FiBox, FiShield,
  FiSettings, FiChevronRight, FiChevronDown, FiBookOpen,
  FiCpu, FiBarChart2, FiActivity, FiPackage, FiTag,
  FiClipboard, FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [erpOpen, setErpOpen] = useState(true);

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  const userRole = user?.role?.toUpperCase() || '';
  const isCashier = userRole === 'CASHIER' || userRole === 'CASHIER';
  const isWarehouse = userRole === 'WAREHOUSE_MGR' || userRole === 'WAREHOUSE MANAGER';
  const isOwner = userRole === 'BUSINESS_OWNER' || userRole === 'BUSINESS OWNER';
  const isAdmin = userRole === 'ADMIN';

  // Role-Specific Navigation Definitions
  const cashierNav = [
    { path: '/pos', label: 'POS Terminal', icon: FiShoppingBag },
  ];

  const warehouseNav = [
    { path: '/warehouse', label: 'Warehouse Console', icon: FiPackage },
    { path: '/inventory', label: 'Inventory (GRN)', icon: FiBox },
    { path: '/suppliers', label: 'Suppliers', icon: FiTruck },
  ];

  const ownerNav = [
    { path: '/dashboard', label: 'Executive Dashboard', icon: FiGrid },
    { path: '/owner', label: 'Owner AI Portal', icon: FiBarChart2 },
    { path: '/analytics', label: 'AI Analytics', icon: FiPieChart },
    { path: '/reports', label: 'Financial Reports', icon: FiTrendingUp },
    { path: '/insights', label: 'Predictive Insights', icon: FiCpu },
  ];

  const erpNav = [
    { path: '/invoices', label: 'Invoice Ledger', icon: FiFileText },
    { path: '/ledger', label: 'General Ledger', icon: FiBookOpen },
    { path: '/tax-engine', label: 'GST Engine', icon: FiSliders },
    { path: '/clients', label: 'B2B Customers', icon: FiUsers },
    { path: '/pos', label: 'POS Terminal', icon: FiShoppingBag },
    { path: '/inventory', label: 'Inventory', icon: FiBox },
  ];

  const adminNav = [
    { path: '/admin', label: 'User Management', icon: FiShield },
    { path: '/audit-logs', label: 'Audit Logs', icon: FiActivity },
    { path: '/models', label: 'AI Models Config', icon: FiTag },
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
      <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem', marginBottom: '2rem', cursor: 'pointer' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12a5 5 0 0 1 5-5" /><circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>SmartLedger AI</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>Retail ERP Platform</div>
        </div>
      </div>

      {/* RENDER DYNAMIC NAVIGATION BASED ON STRICT ROLE ISOLATION */}
      {isCashier && renderNavGroup(cashierNav, 'Cashier Console')}
      
      {isWarehouse && renderNavGroup(warehouseNav, 'Warehouse Ops')}
      
      {(isOwner || isAdmin) && renderNavGroup(ownerNav, 'Executive')}
      
      {(isOwner || isAdmin) && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div onClick={() => setErpOpen(!erpOpen)} style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, paddingLeft: '0.75rem', marginBottom: '0.65rem', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Enterprise ERP</span>
            {erpOpen ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
          </div>
          {erpOpen && (
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {erpNav.map(item => (
                <NavLink key={item.path} to={item.path} className={`sl-nav-item ${isActive(item.path) ? 'active' : ''}`}>
                  <item.icon size={16} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      )}

      {isAdmin && renderNavGroup(adminNav, 'Administration')}

      {/* Bottom User Card */}
      <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
        {(isWarehouse || isAdmin || isOwner) && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
            <FiAlertCircle size={13} color="#d97706" />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#92400e' }}>7 low-stock alerts</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', border: '1px solid #eef2f6', borderRadius: 14, padding: '0.65rem 0.85rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', flexShrink: 0 }}>
            {(user?.name || 'M').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Staff'}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{user?.role || 'Authorized User'}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#ef4444', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
