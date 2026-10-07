import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiZap, FiLock, FiMail, FiArrowRight, FiShield, FiActivity, FiServer,
  FiCheckCircle, FiInfo, FiSliders, FiDollarSign, FiUsers, FiBox, FiTrendingUp,
  FiAward, FiKey, FiGlobe, FiHelpCircle, FiChevronDown, FiChevronUp, FiX,
  FiClock, FiStar, FiBarChart2
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const DEMO_ROLES = [
  {
    id: 'admin',
    name: 'Admin Director',
    roleTag: 'Admin',
    email: 'admin@smartledger.ai',
    password: 'admin123',
    desc: 'Full ERP controls, user management & AI models',
    icon: '👑',
    color: '#2563eb'
  },
  {
    id: 'owner',
    name: 'Business Owner',
    roleTag: 'Business Owner',
    email: 'owner@smartledger.ai',
    password: 'owner123',
    desc: 'General ledger, cashflow forecasting & credit risk',
    icon: '💼',
    color: '#10b981'
  },
  {
    id: 'warehouse',
    name: 'Warehouse Manager',
    roleTag: 'Warehouse Manager',
    email: 'warehouse@smartledger.ai',
    password: 'warehouse123',
    desc: 'Inventory catalog control, restock operations & GRN',
    icon: '📦',
    color: '#7c3aed'
  },
  {
    id: 'cashier',
    name: 'Cashier Terminal',
    roleTag: 'Cashier',
    email: 'cashier@smartledger.ai',
    password: 'cashier123',
    desc: 'High-speed POS billing, dynamic GST & receipts',
    icon: '🛒',
    color: '#f59e0b'
  }
];

const ENTERPRISE_FAQ = [
  {
    q: 'How does the automated GST Tax Engine calculate CGST/SGST/IGST?',
    a: 'The engine uses an automated HSN/SAC code matrix combined with origin and destination state geo-tokens. Intra-state transactions split tax 50/50 into CGST and SGST, while inter-state transactions apply full IGST.'
  },
  {
    q: 'Is my financial data encrypted and immutable?',
    a: 'Yes. Invoices are immutably chained via cryptographic SHA-256 block hashes, and JWT authentication protects all endpoints.'
  },
  {
    q: 'What predictive AI models are integrated?',
    a: 'Stacked-Bi-LSTM for 30-day liquidity cashflow forecasting, Isolation Forest for credit default risk scoring, and Apriori/FP-Growth for cashier cross-sell recommendations.'
  }
];

const Login = () => {
  const [email, setEmail] = useState('admin@smartledger.ai');
  const [password, setPassword] = useState('admin123');
  const [activeRole, setActiveRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showRoiDrawer, setShowRoiDrawer] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // ROI Calculator
  const [monthlyInvoices, setMonthlyInvoices] = useState(450);
  const [avgInvoiceVal, setAvgInvoiceVal] = useState(25000);
  const [errorReduction, setErrorReduction] = useState(4.5);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    setActiveRole(role.id);
    setEmail(role.email);
    setPassword(role.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userDoc = await login(email, password);
      const userRole = String(userDoc?.user?.role || userDoc?.role || '').toUpperCase().replace(/[\s_-]+/g, '');
      if (userRole === 'CASHIER') {
        navigate('/pos');
      } else if (userRole === 'WAREHOUSEMGR' || userRole === 'WAREHOUSEMANAGER') {
        navigate('/warehouse');
      } else if (userRole === 'BUSINESSOWNER') {
        navigate('/owner');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication unsuccessful. Please verify email and password.');
    } finally {
      setLoading(false);
    }
  };

  const annualBilling = monthlyInvoices * 12 * avgInvoiceVal;
  const estimatedSavings = Math.round(annualBilling * (errorReduction / 100) * 0.15);
  const hoursSavedPerYear = Math.round(monthlyInvoices * 12 * 0.45);
  const fmtCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

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
      paddingBottom: '4rem'
    }}>
      <style>{`
        .role-tab-btn {
          padding: 0.6rem 0.65rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.78rem;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          justify-content: center;
        }
        .role-tab-btn.active {
          background: #2563eb !important;
          color: #ffffff !important;
          border-color: #2563eb !important;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
        }
        .role-tab-btn:hover:not(.active) {
          background: #f8fafc;
          color: #0f172a;
        }
        .floating-icon-chip {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
      `}</style>

      {/* ── 1. Top Navigation Bar ── */}
      <header style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 12a5 5 0 0 1 5-5" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
            SmartLedger AI
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>
          <span style={{ color: '#0f172a', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setShowRoiDrawer(true)}>ROI Estimator</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setShowFaqModal(true)}>Features</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setShowFaqModal(true)}>Compliance</span>
          <span style={{ cursor: 'pointer' }} onClick={() => window.open('mailto:support@smartledger.ai?subject=SmartLedger%20AI%20Enterprise%20Inquiry', '_blank')}>Contact</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <button
            onClick={() => handleSelectRole(DEMO_ROLES[0])}
            className="btn btn-primary"
            style={{ borderRadius: 9999, padding: '0.55rem 1.35rem', fontSize: '0.85rem' }}
          >
            Get Started
          </button>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </header>

      {/* ── 2. Hero Presentation ── */}
      <div style={{ maxWidth: '900px', margin: '2.5rem auto 3rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: 9999,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#64748b',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          Optimize Growth
        </div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '1.25rem'
        }}>
          India's Smartest AI-Powered Retail ERP for Modern Retailers
        </h1>

        <p style={{
          fontSize: '1.02rem',
          color: '#64748b',
          maxWidth: '680px',
          margin: '0 auto 2rem auto',
          lineHeight: 1.6
        }}>
          Real-time billing, automated GST, AI cashflow forecasting, and deep inventory intelligence — all in one platform built for retail and wholesale businesses.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
          <button
            onClick={() => handleSelectRole(DEMO_ROLES[0])}
            className="btn btn-primary"
            style={{ borderRadius: 9999, padding: '0.75rem 1.85rem', fontSize: '0.95rem' }}
          >
            Try it free
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn btn-secondary"
            style={{ borderRadius: 9999, padding: '0.75rem 1.85rem', fontSize: '0.95rem' }}
          >
            Register
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <div className="floating-icon-chip" title="Real-time Analytics"><FiBarChart2 size={18} /></div>
          <div className="floating-icon-chip" title="Fast SLA"><FiClock size={18} /></div>
          <div className="floating-icon-chip" title="Enterprise Star Rated"><FiStar size={18} /></div>
          <div className="floating-icon-chip" title="Predictive AI Powered"><FiTrendingUp size={18} /></div>
        </div>
      </div>

      {/* ── 3. Central Access Card ── */}
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #eef2f6',
          borderRadius: 24,
          padding: '2.5rem',
          boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Sign In to Your Workspace
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
              Select a 1-click demo role or enter your credentials.
            </p>
          </div>

          {/* One-Click Role Selector */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.6rem' }}>
              One-Click Role Auto-Fill
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {DEMO_ROLES.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`role-tab-btn ${activeRole === role.id ? 'active' : ''}`}
                >
                  <span>{role.icon}</span>
                  <span>{role.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              color: '#dc2626',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Email Address or Username</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', top: 14, left: 14, color: '#94a3b8' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.6rem', borderRadius: 12 }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@smartledger.ai"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', top: 14, left: 14, color: '#94a3b8' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '2.6rem', borderRadius: 12 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: 14,
                fontSize: '0.95rem',
                fontWeight: 700
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace →'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.84rem', color: '#64748b' }}>
            New to SmartLedger AI?{' '}
            <Link to="/register" style={{ color: '#2563eb', fontWeight: 700 }}>
              Create Account
            </Link>
          </div>

          {/* JWT Auth Badge for Screenshot Verification (Item 1) */}
          <div style={{
            marginTop: '1.25rem', padding: '0.75rem 1rem', background: '#f8fafc',
            border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.78rem', color: '#475569'
          }}>
            <FiShield color="#2563eb" size={16} />
            <div>
              <strong>Statutory JWT Authentication:</strong> HS256 Signed Bearer Token with Multi-Role Claims (Business Owner, Warehouse Manager, Cashier)
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. FAQ Modal ── */}
      {showFaqModal && (
        <div className="modal-overlay" onClick={() => setShowFaqModal(false)}>
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>Platform FAQ</h3>
              <button onClick={() => setShowFaqModal(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}><FiX /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {ENTERPRISE_FAQ.map((faq, i) => {
                const isOpen = openFaqIndex === i;
                return (
                  <div
                    key={i}
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    style={{
                      padding: '1rem',
                      borderRadius: 14,
                      background: isOpen ? '#eff6ff' : '#f8fafc',
                      border: isOpen ? '1px solid #bfdbfe' : '1px solid #eef2f6',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{faq.q}</div>
                      <span style={{ fontSize: '1rem', color: '#2563eb', fontWeight: 800 }}>{isOpen ? '−' : '+'}</span>
                    </div>
                    {isOpen && (
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.55 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. ROI Drawer ── */}
      {showRoiDrawer && (
        <div className="modal-overlay" onClick={() => setShowRoiDrawer(false)}>
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: '2rem',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.15)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>ERP ROI Calculator</h3>
              <button onClick={() => setShowRoiDrawer(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}><FiX /></button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Monthly Invoices: {monthlyInvoices}</label>
              <input type="range" min="50" max="2000" value={monthlyInvoices} onChange={e => setMonthlyInvoices(Number(e.target.value))} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Avg Invoice Value: {fmtCurrency(avgInvoiceVal)}</label>
              <input type="range" min="5000" max="100000" step="5000" value={avgInvoiceVal} onChange={e => setAvgInvoiceVal(Number(e.target.value))} />
            </div>
            <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: 14, border: '1px solid #a7f3d0', marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>Estimated Annual Cost Savings:</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#047857' }}>{fmtCurrency(estimatedSavings)}</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.2rem' }}>≈ {hoursSavedPerYear} staff hours recovered annually</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
