import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiZap, FiBarChart2, FiClock, FiStar, FiTrendingUp,
  FiChevronDown, FiChevronRight, FiArrowRight,
  FiSettings, FiBell, FiUsers, FiDownload, FiCheck,
  FiX, FiBox, FiFileText, FiShoppingCart, FiShield,
  FiDollarSign, FiGrid, FiPackage, FiPercent, FiActivity,
  FiMaximize2, FiFilter, FiSearch
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin / Director',
    email: 'admin@smartledger.ai',
    password: 'admin123',
    desc: 'Full ERP controls, users, ledger audits & AI models',
    color: '#2563eb',
    redirect: '/dashboard'
  },
  {
    role: 'Business Owner',
    email: 'owner@smartledger.ai',
    password: 'owner123',
    desc: 'Owner analytics, cashflow forecast & credit risk',
    color: '#10b981',
    redirect: '/owner'
  },
  {
    role: 'Warehouse Manager',
    email: 'warehouse@smartledger.ai',
    password: 'warehouse123',
    desc: 'Stock catalog, batch expiry, reorder POs & GRN',
    color: '#7c3aed',
    redirect: '/warehouse'
  },
  {
    role: 'Cashier Terminal',
    email: 'cashier@smartledger.ai',
    password: 'cashier123',
    desc: 'High-speed POS, barcode scanning & thermal receipts',
    color: '#f59e0b',
    redirect: '/pos'
  }
];

const FEATURES = [
  {
    icon: FiShoppingCart, color: '#2563eb', bg: '#eff6ff',
    title: 'Smart POS Terminal',
    desc: 'Lightning-fast billing with barcode scanner, cart management, UPI/Cash/Card payments, and thermal receipt printing.'
  },
  {
    icon: FiBox, color: '#7c3aed', bg: '#f5f3ff',
    title: 'Live Inventory Control',
    desc: 'Real-time stock levels, batch & expiry tracking, automatic reorder alerts, GRN and supplier management.'
  },
  {
    icon: FiBarChart2, color: '#10b981', bg: '#ecfdf5',
    title: 'AI Revenue Forecasting',
    desc: 'Stacked Bi-LSTM models predict 30-day cashflow with 94% accuracy. Know your revenue before it happens.'
  },
  {
    icon: FiShield, color: '#ea580c', bg: '#fff7ed',
    title: 'Automated GST Engine',
    desc: 'HSN-code CGST/SGST/IGST matrix. One-click GSTR-1, GSTR-3B preparation. Full compliance, zero errors.'
  },
  {
    icon: FiUsers, color: '#0891b2', bg: '#ecfeff',
    title: 'Customer & Credit Risk',
    desc: 'Isolation Forest credit scoring flags high-risk buyers. Full customer ledger, payment history & outstanding dues.'
  },
  {
    icon: FiActivity, color: '#d97706', bg: '#fffbeb',
    title: 'AI Cross-Sell Engine',
    desc: 'Apriori/FP-Growth market basket analysis drives real-time product recommendations at checkout to increase basket size.'
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('admin@smartledger.ai');
  const [authPassword, setAuthPassword] = useState('admin123');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleQuickLogin = async (account) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await login(account.email, account.password);
      navigate(account.redirect || '/dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await login(authEmail, authPassword);
      setShowAuthModal(false);
      const role = String(data?.user?.role || data?.role || '').toUpperCase().replace(/[\s_-]+/g, '');
      if (role === 'CASHIER') navigate('/pos');
      else if (role === 'WAREHOUSEMGR' || role === 'WAREHOUSEMANAGER') navigate('/warehouse');
      else if (role === 'BUSINESSOWNER') navigate('/owner');
      else navigate('/dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f6f8fb',
      backgroundImage: `
        linear-gradient(rgba(226, 232, 240, 0.45) 1px, transparent 1px),
        linear-gradient(90deg, rgba(226, 232, 240, 0.45) 1px, transparent 1px)
      `,
      backgroundSize: '32px 32px',
      color: '#0f172a',
      paddingBottom: '5rem',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <style>{`
        .lp-nav-link {
          color: #64748b;
          font-size: 0.92rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s;
          text-decoration: none;
        }
        .lp-nav-link:hover { color: #0f172a; }
        .lp-feature-card {
          background: #ffffff;
          border: 1px solid #eef2f6;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px -2px rgba(15,23,42,0.03);
          transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px -6px rgba(15,23,42,0.08);
        }
        .lp-action-chip {
          width: 42px; height: 42px; border-radius: 50%;
          background: #ffffff; border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(15,23,42,0.05);
          display: flex; align-items: center; justify-content: center;
          color: #2563eb; cursor: pointer; transition: all 0.2s;
        }
        .lp-action-chip:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(37,99,235,0.15); }
        .sl-sidebar-item {
          display: flex; align-items: center; gap: 0.65rem;
          padding: 0.55rem 0.85rem; border-radius: 9999;
          color: #64748b; font-size: 0.82rem; font-weight: 500;
        }
      `}</style>

      {/* ── 1. Top Navigation ── */}
      <header style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12a5 5 0 0 1 5-5" /><circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>SmartLedger AI</div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>Retail ERP Platform</div>
          </div>
        </div>

        {/* Center Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2.25rem' }}>
          <span className="lp-nav-link" style={{ color: '#0f172a', fontWeight: 600 }}>Home</span>
          <span className="lp-nav-link" onClick={() => navigate('/dashboard')}>Dashboard</span>
          <span className="lp-nav-link" onClick={() => navigate('/pos')}>POS Terminal</span>
          <span className="lp-nav-link" onClick={() => navigate('/inventory')}>Inventory</span>
          <span className="lp-nav-link" onClick={() => navigate('/insights')}>AI Insights</span>
        </nav>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ borderRadius: 9999, padding: '0.6rem 1.4rem', fontSize: '0.88rem' }}>
              Open Dashboard
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn btn-primary" style={{ borderRadius: 9999, padding: '0.6rem 1.4rem', fontSize: '0.88rem' }}>
              Get Started Free
            </button>
          )}
          <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ borderRadius: 9999, padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}>
            Sign In
          </button>
        </div>
      </header>

      {/* ── 2. Hero Section ── */}
      <div style={{ maxWidth: '960px', margin: '3.5rem auto 3rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 1rem', borderRadius: 9999,
          background: '#eff6ff', border: '1px solid #bfdbfe',
          fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', marginBottom: '1.5rem'
        }}>
          <FiZap size={13} /> AI-Powered Retail Intelligence Platform
        </div>

        <h1 style={{
          fontSize: '3.15rem', fontWeight: 800, color: '#0f172a',
          letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem'
        }}>
          India's Smartest ERP for<br />
          <span style={{ color: '#2563eb' }}>Retail & Wholesale</span> Businesses
        </h1>

        <p style={{
          fontSize: '1rem', color: '#64748b', maxWidth: '680px',
          margin: '0 auto 2.25rem auto', lineHeight: 1.65
        }}>
          Real-time GST billing, AI cashflow forecasting, live inventory tracking, and smart cross-sell recommendations — built specifically for product-based retailers.
        </p>

        {/* Dual CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', alignItems: 'center', marginBottom: '2.5rem' }}>
          <button
            onClick={() => handleQuickLogin(DEMO_ACCOUNTS[0])}
            className="btn btn-primary"
            style={{ borderRadius: 9999, padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          >
            Try Demo Free
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn btn-secondary"
            style={{ borderRadius: 9999, padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          >
            Register Business
          </button>
        </div>

        {/* 4 Floating Badges */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', maxWidth: '780px', margin: '0 auto' }}>
          <div className="lp-action-chip" title="Real-time Analytics"><FiBarChart2 size={18} /></div>
          <div className="lp-action-chip" title="Fast Checkout"><FiClock size={18} /></div>
          <div className="lp-action-chip" title="GST Compliant"><FiShield size={18} /></div>
          <div className="lp-action-chip" title="AI Forecasting"><FiTrendingUp size={18} /></div>
        </div>
      </div>

      {/* ── 3. Embedded SmartLedger Dashboard Preview ── */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.5rem', position: 'relative' }}>
        {/* Floating side chips */}
        <div style={{
          position: 'absolute', left: -15, bottom: 220,
          background: '#ffffff', border: '1px solid #eef2f6', borderRadius: 16,
          padding: '0.85rem 1.15rem', boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.65rem', zIndex: 10
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiTrendingUp size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>Revenue ↑22%</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>vs last month</div>
          </div>
        </div>

        <div style={{
          position: 'absolute', right: -15, bottom: 180,
          background: '#ffffff', border: '1px solid #eef2f6', borderRadius: 16,
          padding: '0.85rem 1.15rem', boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 10
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiBox size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>7 Low Stock</div>
            <div style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 600 }}>Reorder now</div>
          </div>
        </div>

        {/* Dashboard Shell */}
        <div style={{
          background: '#ffffff', borderRadius: 28, border: '1px solid #eef2f6',
          boxShadow: '0 25px 60px -12px rgba(15,23,42,0.08), 0 4px 18px rgba(0,0,0,0.02)',
          display: 'flex', overflow: 'hidden', minHeight: '740px'
        }}>
          {/* Mini Sidebar */}
          <div style={{
            width: '220px', background: '#ffffff', borderRight: '1px solid #eef2f6',
            padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', flexShrink: 0
          }}>
            {/* Sidebar Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem', paddingLeft: '0.4rem' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12a5 5 0 0 1 5-5" /><circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>SmartLedger AI</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Retail ERP</div>
              </div>
            </div>

            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, paddingLeft: '0.6rem', marginBottom: '0.5rem' }}>
              Main
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.85rem', borderRadius: 9999, background: '#2563eb', color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}>
                <FiGrid size={16} /><span style={{ flex: 1 }}>Dashboard</span>
              </div>
              {[
                { icon: FiFileText, label: 'Invoices' },
                { icon: FiBarChart2, label: 'Analytics' },
                { icon: FiTrendingUp, label: 'Reports' },
              ].map((item, i) => (
                <div key={i} className="sl-sidebar-item">
                  <item.icon size={16} /><span style={{ flex: 1 }}>{item.label}</span><FiChevronRight size={13} style={{ opacity: 0.4 }} />
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, paddingLeft: '0.6rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
              Retail ERP
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[
                { icon: FiBox, label: 'Inventory' },
                { icon: FiShoppingCart, label: 'POS Terminal' },
                { icon: FiUsers, label: 'Customers' },
                { icon: FiShield, label: 'GST Engine' },
              ].map((item, i) => (
                <div key={i} className="sl-sidebar-item">
                  <item.icon size={16} /><span style={{ flex: 1 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Dashboard Panel */}
          <div style={{ flex: 1, padding: '1.75rem', background: '#f8fafc', overflowY: 'auto' }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>Good morning, Vikramaditya! 👋</div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Today's retail dashboard · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 9999, padding: '0.45rem 1.15rem', width: '220px' }}>
                  <FiSearch size={13} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Search products, invoices...</span>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', position: 'relative' }}>
                  <FiBell size={15} />
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                </div>
              </div>
            </div>

            {/* Low Stock Alert Banner */}
            <div style={{
              background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: 16,
              padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>✓</div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>System Ready & Initialized</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Clean ledger slate — 0 stock alerts. Add your products in Warehouse Console to begin.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 9999, padding: '0.35rem 1rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Add Products
              </button>
            </div>

            {/* 4 KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                { label: "Today's Revenue", value: '₹0', icon: FiDollarSign, color: '#10b981', bg: '#ecfdf5', sub: 'Ready for billing' },
                { label: 'Products in Stock', value: '0', icon: FiBox, color: '#2563eb', bg: '#eff6ff', sub: '0 stock alerts' },
                { label: 'Invoices (Month)', value: '0', icon: FiFileText, color: '#7c3aed', bg: '#f5f3ff', sub: '0 pending payment' },
                { label: 'Gross Margin', value: '0.0%', icon: FiPercent, color: '#ea580c', bg: '#fff7ed', sub: 'Dynamic margin tracker' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #eef2f6', borderRadius: 14, padding: '0.95rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.68rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <span>{kpi.label}</span><FiMaximize2 size={11} color="#94a3b8" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <kpi.icon size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{kpi.value}</div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>{kpi.sub}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Two Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem' }}>
              {/* Top Products */}
              <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderRadius: 16, padding: '1.15rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.3rem' }}>Top Selling Products</div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.9rem' }}>Fastest moving SKUs computed live.</div>
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                  <FiBox size={26} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <div>No transactions recorded yet.</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>Product sales rank here dynamically.</div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderRadius: 16, padding: '1.15rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem' }}>Monthly Revenue Overview</div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.9rem' }}>Live invoice aggregation (₹ Lakhs).</div>
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                  <FiBarChart2 size={26} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <div>Awaiting first invoice creation.</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>Sales chart activates with live data.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Features Grid ── */}
      <div style={{ maxWidth: '1200px', margin: '5rem auto 0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Everything Your Retail Business Needs
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '1rem' }}>
            Built for Product-Based Retailers
          </h2>
          <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: '580px', margin: '0 auto', lineHeight: 1.65 }}>
            From corner kiranas to large distributors — SmartLedger AI handles your entire retail operation intelligently.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="lp-feature-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: f.bg, color: f.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={21} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '0.4rem' }}>{f.title}</div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Role Portals Section ── */}
      <div style={{ maxWidth: '1200px', margin: '5rem auto 0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
            Dedicated Portals for Every Role
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '560px', margin: '0 auto', lineHeight: 1.65 }}>
            Each team member gets a purpose-built interface — no clutter, just the tools they need.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {DEMO_ACCOUNTS.map((acc) => (
            <div
              key={acc.role}
              style={{
                background: '#ffffff', border: `1px solid ${acc.color}20`,
                borderRadius: 20, padding: '1.5rem',
                boxShadow: '0 4px 20px -2px rgba(15,23,42,0.03)',
                transition: 'all 0.22s', cursor: 'pointer'
              }}
              onClick={() => handleQuickLogin(acc)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 12px 28px -4px ${acc.color}25`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(15,23,42,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: `${acc.color}15`, color: acc.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.35rem', marginBottom: '1rem'
              }}>
                {acc.role === 'Admin / Director' ? '👑' : acc.role === 'Business Owner' ? '💼' : acc.role === 'Warehouse Manager' ? '📦' : '🛒'}
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '0.35rem' }}>{acc.role}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.55, marginBottom: '1.15rem' }}>{acc.desc}</div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleQuickLogin(acc); }}
                style={{
                  width: '100%', padding: '0.55rem', borderRadius: 10,
                  background: `${acc.color}10`, color: acc.color,
                  border: `1px solid ${acc.color}30`, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
                }}
              >
                Enter Portal →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. One-Click Demo Login Modal ── */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }} onClick={() => setShowAuthModal(false)}>
          <div style={{
            background: '#ffffff', borderRadius: 24, padding: '2rem',
            maxWidth: '520px', width: '100%',
            boxShadow: '0 25px 60px -15px rgba(15,23,42,0.15)', border: '1px solid #eef2f6'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>Sign In to SmartLedger AI</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Select a 1-click demo role to access the portal
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <FiX size={16} />
              </button>
            </div>

            {authError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '0.75rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.82rem' }}>
                {authError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {DEMO_ACCOUNTS.map(acc => (
                <div
                  key={acc.role}
                  onClick={() => handleQuickLogin(acc)}
                  style={{
                    padding: '0.85rem 1rem', borderRadius: 14, border: '1px solid #e2e8f0',
                    background: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{acc.role}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{acc.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleQuickLogin(acc); }}
                    disabled={authLoading}
                    className="btn btn-primary"
                    style={{ borderRadius: 9999, padding: '0.4rem 1rem', fontSize: '0.78rem' }}
                  >
                    Enter →
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <input
                  type="email" className="input-field"
                  value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                  placeholder="Email address" required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <input
                  type="password" className="input-field"
                  value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                  placeholder="Password" required
                />
              </div>
              <button
                type="submit" disabled={authLoading} className="btn btn-primary"
                style={{ width: '100%', borderRadius: 12, padding: '0.75rem', fontSize: '0.9rem' }}
              >
                {authLoading ? 'Signing In...' : 'Sign In with Email'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
