import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  FiSettings, FiSave, FiCheckCircle, FiShield, FiSliders,
  FiFileText, FiMapPin, FiCpu, FiDatabase, FiRefreshCw, FiTrash2, FiCloud, FiPlay
} from 'react-icons/fi';
import { useBusiness } from '../context/BusinessContext';

const Settings = () => {
  const { openWizard, refreshBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notification, setNotification] = useState('');
  const [dbStatus, setDbStatus] = useState(null);

  const [form, setForm] = useState({
    business_name: '',
    legal_name: '',
    gstin: '',
    pan_number: '',
    state_code: '29',
    state_name: 'Karnataka',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    invoice_prefix: 'INV-2026-',
    default_payment_terms: 'Net 30',
    tax_configuration: {
      hsn_default_rate: 18,
      enable_composition_scheme: false,
      round_off_totals: true
    },
    ai_alert_thresholds: {
      low_stock_buffer_days: 7,
      payment_delay_variance_days: 14,
      min_market_basket_lift: 1.2,
      cashflow_runway_warning_months: 2
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await client.get('/business');
        if (res.data?.data) {
          setForm(prev => ({
            ...prev,
            ...res.data.data,
            address: { ...prev.address, ...(res.data.data.address || {}) },
            tax_configuration: { ...prev.tax_configuration, ...(res.data.data.tax_configuration || {}) },
            ai_alert_thresholds: { ...prev.ai_alert_thresholds, ...(res.data.data.ai_alert_thresholds || {}) }
          }));
        }

        const statusRes = await client.get('/admin/db-status').catch(() => null);
        if (statusRes?.data) {
          setDbStatus(statusRes.data);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleResetDatabase = async (mode) => {
    const isClean = mode === 'clean_slate';
    const confirmMsg = isClean
      ? '⚠️ ARE YOU SURE? This will wipe all test transactions, mock invoices, and sample items to start 100% brand new. Your login credentials will remain active.'
      : 'Load sample enterprise products, customers, and invoices for demo testing?';

    if (!window.confirm(confirmMsg)) return;

    setResetting(true);
    try {
      const res = await client.post('/admin/reset-database', { mode });
      setNotification(res.data?.message || 'Database state updated.');
      const statusRes = await client.get('/admin/db-status').catch(() => null);
      if (statusRes?.data) setDbStatus(statusRes.data);
      await refreshBusiness();
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert('Error updating database: ' + (err.response?.data?.error || err.message));
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await client.put('/business', form);
      setNotification('System settings and tax parameters updated successfully.');
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert('Error updating business settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 1rem auto', display: 'block' }}></div>
        Loading enterprise configuration profile...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', padding: '0.65rem', borderRadius: '12px', color: '#ffffff', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}>
            <FiSettings size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>
              Business Profile & ERP Configuration
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
              Statutory GSTIN registration, invoicing sequence, and AI telemetry parameters
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.4rem', fontSize: '0.875rem' }}
        >
          <FiSave size={16} />
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>

      {notification && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399',
          padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'
        }}>
          <FiCheckCircle size={18} /> {notification}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Legal Entity Profile */}
        <div className="card" style={{ marginBottom: '1.5rem', borderTop: '2px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <FiShield size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Legal Entity & Statutory GST Identity
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Legal Company Name</label>
              <input
                type="text"
                className="input-field"
                value={form.legal_name}
                onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Trade / Brand Display Name</label>
              <input
                type="text"
                className="input-field"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">GSTIN (Goods and Services Tax ID)</label>
              <input
                type="text"
                maxLength="15"
                className="input-field"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                style={{ fontFamily: 'monospace', fontWeight: '700' }}
              />
            </div>

            <div>
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                maxLength="10"
                className="input-field"
                value={form.pan_number}
                onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="form-label">State Code (Indian GST)</label>
              <input
                type="text"
                className="input-field"
                value={form.state_code}
                onChange={(e) => setForm({ ...form, state_code: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">State Name</label>
              <input
                type="text"
                className="input-field"
                value={form.state_name}
                onChange={(e) => setForm({ ...form, state_name: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Address */}
        <div className="card" style={{ marginBottom: '1.5rem', borderTop: '2px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <FiMapPin size={20} color="#10b981" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Registered Corporate Office
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Address Line</label>
              <input
                type="text"
                className="input-field"
                value={form.address?.line1 || ''}
                onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })}
              />
            </div>

            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                className="input-field"
                value={form.address?.city || ''}
                onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
              />
            </div>

            <div>
              <label className="form-label">PIN / Postal Code</label>
              <input
                type="text"
                className="input-field"
                value={form.address?.pincode || ''}
                onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })}
              />
            </div>

            <div>
              <label className="form-label">Accounts Email</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Telephone Number</label>
              <input
                type="text"
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Invoicing & Payment Terms */}
        <div className="card" style={{ marginBottom: '1.5rem', borderTop: '2px solid #2563eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <FiFileText size={20} color="#2563eb" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Invoicing & Commercial Defaults
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Invoice Number Prefix</label>
              <input
                type="text"
                className="input-field"
                value={form.invoice_prefix}
                onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="form-label">Default Trade Credit Terms</label>
              <select
                className="input-field"
                value={form.default_payment_terms}
                onChange={(e) => setForm({ ...form, default_payment_terms: e.target.value })}
              >
                <option value="Immediate / Due on Receipt">Immediate / Due on Receipt</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="form-label">Default Statutory GST Bracket (%)</label>
              <select
                className="input-field"
                value={form.tax_configuration?.hsn_default_rate || 18}
                onChange={(e) => setForm({ ...form, tax_configuration: { ...form.tax_configuration, hsn_default_rate: Number(e.target.value) } })}
              >
                <option value={0}>0% (Exempt / Essential)</option>
                <option value={5}>5% (Basic Goods)</option>
                <option value={12}>12% (Standard Low)</option>
                <option value={18}>18% (Standard General)</option>
                <option value={28}>28% (Luxury / Automotive)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.5rem' }}>
              <input
                type="checkbox"
                id="round_off"
                checked={form.tax_configuration?.round_off_totals ?? true}
                onChange={(e) => setForm({ ...form, tax_configuration: { ...form.tax_configuration, round_off_totals: e.target.checked } })}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2563eb' }}
              />
              <label htmlFor="round_off" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1', cursor: 'pointer' }}>
                Automatically round off invoice grand totals to nearest rupee
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: AI Alert Thresholds */}
        <div className="card" style={{ marginBottom: '2rem', borderTop: '2px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <FiCpu size={20} color="#ef4444" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              AI Intelligence Trigger Thresholds
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Low Stock Safety Buffer (Days of Demand)</label>
              <input
                type="number"
                className="input-field"
                value={form.ai_alert_thresholds?.low_stock_buffer_days || 7}
                onChange={(e) => setForm({ ...form, ai_alert_thresholds: { ...form.ai_alert_thresholds, low_stock_buffer_days: Number(e.target.value) } })}
              />
            </div>

            <div>
              <label className="form-label">Payment Delay Anomaly Threshold (Days Past Due)</label>
              <input
                type="number"
                className="input-field"
                value={form.ai_alert_thresholds?.payment_delay_variance_days || 14}
                onChange={(e) => setForm({ ...form, ai_alert_thresholds: { ...form.ai_alert_thresholds, payment_delay_variance_days: Number(e.target.value) } })}
              />
            </div>

            <div>
              <label className="form-label">Minimum Market Basket Lift Multiplier</label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={form.ai_alert_thresholds?.min_market_basket_lift || 1.2}
                onChange={(e) => setForm({ ...form, ai_alert_thresholds: { ...form.ai_alert_thresholds, min_market_basket_lift: Number(e.target.value) } })}
              />
            </div>

            <div>
              <label className="form-label">Cash Flow Runway Alert Trigger (Months)</label>
              <input
                type="number"
                className="input-field"
                value={form.ai_alert_thresholds?.cashflow_runway_warning_months || 2}
                onChange={(e) => setForm({ ...form, ai_alert_thresholds: { ...form.ai_alert_thresholds, cashflow_runway_warning_months: Number(e.target.value) } })}
              />
            </div>
          </div>
        </div>

        {/* ── 5. Database, Cloud Deployment & Brand New Setup ── */}
        <div className="card" style={{ padding: '1.75rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FiDatabase size={22} color="#2563eb" />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Database & Cloud Deployment Center
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Manage MongoDB Atlas connection, switch between Brand New mode and Demo mode
                </p>
              </div>
            </div>
            {dbStatus && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.3rem 0.75rem',
                borderRadius: 9999,
                background: dbStatus.db_status === 'BLANK_SLATE' ? '#eff6ff' : '#f0fdf4',
                color: dbStatus.db_status === 'BLANK_SLATE' ? '#2563eb' : '#16a34a',
                border: dbStatus.db_status === 'BLANK_SLATE' ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <FiCloud size={14} />
                {dbStatus.connection?.cluster_type || 'MongoDB'} • {dbStatus.db_status === 'BLANK_SLATE' ? 'Clean Slate Mode' : 'Operational Dataset'}
              </span>
            )}
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active Database Host</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>
                {dbStatus?.connection?.host || 'localhost'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Database Name</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                {dbStatus?.connection?.db_name || 'smartledger_erp_db'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Live Invoices</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb' }}>
                {dbStatus?.counts?.invoices || 0} Records
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Catalog Products</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                {dbStatus?.counts?.products || 0} SKUs
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={openWizard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.7rem 1.3rem',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <FiPlay size={16} /> Run Business Setup Wizard
            </button>

            <button
              type="button"
              disabled={resetting}
              onClick={() => handleResetDatabase('clean_slate')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.7rem 1.3rem',
                borderRadius: 10,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: resetting ? 'wait' : 'pointer'
              }}
            >
              <FiTrash2 size={16} /> {resetting ? 'Resetting...' : 'Wipe Demo Data & Start 100% Brand New'}
            </button>

            <button
              type="button"
              disabled={resetting}
              onClick={() => handleResetDatabase('seed_sample')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.7rem 1.3rem',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: resetting ? 'wait' : 'pointer'
              }}
            >
              <FiRefreshCw size={16} /> Load Sample Demo Data
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
