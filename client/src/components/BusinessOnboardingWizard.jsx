import React, { useState, useEffect } from 'react';
import {
  FiBriefcase, FiDollarSign, FiBox, FiUsers, FiCheckCircle,
  FiArrowRight, FiArrowLeft, FiX, FiCheck, FiCpu, FiTag
} from 'react-icons/fi';
import { useBusiness } from '../context/BusinessContext';

const INDIAN_STATES = [
  { code: '29', name: 'Karnataka' },
  { code: '27', name: 'Maharashtra' },
  { code: '07', name: 'Delhi' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '24', name: 'Gujarat' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '19', name: 'West Bengal' },
  { code: '08', name: 'Rajasthan' },
  { code: '32', name: 'Kerala' },
  { code: '03', name: 'Punjab' },
  { code: '06', name: 'Haryana' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '21', name: 'Odisha' },
  { code: '99', name: 'International / Other' }
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) — Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) — British Pound' },
  { code: 'AED', symbol: 'AED ', label: 'AED (Dirham) — UAE' }
];

const INDUSTRIES = [
  'Retail Store & POS',
  'Wholesale & Distribution',
  'Tech & Electronics',
  'Manufacturing & Industrial',
  'Pharmacy & Healthcare',
  'FMCG & Groceries',
  'Services & Consultancy'
];

const BusinessOnboardingWizard = () => {
  const { business, isWizardOpen, closeWizard, setupBusiness } = useBusiness();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    business_name: '',
    legal_name: '',
    industry: 'Retail Store & POS',
    currency: 'INR',
    currency_symbol: '₹',
    gstin: '',
    state_code: '29',
    state_name: 'Karnataka',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: 'Karnataka',
      pincode: '',
      country: 'India'
    },
    // Initial product
    initial_product: {
      product_name: '',
      category: 'General',
      sku: '',
      unit_price: 150,
      cost_price: 100,
      stock_quantity: 50,
      reorder_level: 10,
      hsn_code: '8471'
    },
    // Initial customer
    initial_customer: {
      full_name: '',
      phone: '',
      email: '',
      gstin: '',
      credit_limit: 50000
    }
  });

  useEffect(() => {
    if (business) {
      setForm(prev => ({
        ...prev,
        business_name: business.business_name !== 'SmartLedger Industrial Solutions Pvt Ltd' ? business.business_name : '',
        legal_name: business.legal_name || '',
        currency: business.currency || 'INR',
        currency_symbol: business.currency_symbol || '₹',
        gstin: business.gstin !== '29AAACS1420M1Z8' ? business.gstin : '',
        state_code: business.state_code || '29',
        state_name: business.state_name || 'Karnataka',
        email: business.email || '',
        phone: business.phone || '',
        address: { ...prev.address, ...(business.address || {}) }
      }));
    }
  }, [business]);

  if (!isWizardOpen) return null;

  const handleCurrencyChange = (currCode) => {
    const found = CURRENCIES.find(c => c.code === currCode);
    setForm({
      ...form,
      currency: currCode,
      currency_symbol: found ? found.symbol : '₹'
    });
  };

  const handleStateChange = (stCode) => {
    const found = INDIAN_STATES.find(s => s.code === stCode);
    setForm({
      ...form,
      state_code: stCode,
      state_name: found ? found.name : 'Other',
      address: {
        ...form.address,
        state: found ? found.name : 'Other'
      }
    });
  };

  const handleCompleteSetup = async () => {
    if (!form.business_name.trim()) {
      setError('Please provide a Business / Company Name to proceed.');
      setStep(1);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await setupBusiness(form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        closeWizard();
        window.location.reload();
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Setup submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: 720,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Wizard Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              width: 38,
              height: 38,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <FiBriefcase size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Enterprise Business Onboarding
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                Configure your company details, products, and currency
              </p>
            </div>
          </div>
          <button
            onClick={closeWizard}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px'
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #f1f5f9',
          background: '#ffffff',
          padding: '0.75rem 1.75rem'
        }}>
          {[
            { num: 1, label: 'Company Profile' },
            { num: 2, label: 'First Product' },
            { num: 3, label: 'First Customer' },
            { num: 4, label: 'Launch ERP' }
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => setStep(s.num)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                opacity: step === s.num ? 1 : 0.65,
                borderBottom: step === s.num ? '2px solid #2563eb' : '2px solid transparent',
                paddingBottom: '0.5rem'
              }}
            >
              <span style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: step === s.num ? '#2563eb' : step > s.num ? '#10b981' : '#e2e8f0',
                color: step >= s.num ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: step === s.num ? 700 : 500, color: '#0f172a' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            color: '#b91c1c',
            padding: '0.75rem 1.75rem',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        {/* Wizard Body (Scrollable) */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}>
                <FiCheckCircle size={36} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                🎉 Enterprise Configured!
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Your business inputs have been saved. Initializing your custom ERP workspace...
              </p>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Company Profile */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 12,
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#1e40af'
              }}>
                💡 Enter your real business details. Every invoice, receipt, tax report, and ledger record will instantly brand to your business.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Business / Trade Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Krishna Supermarket"
                    value={form.business_name}
                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Legal Registered Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Krishna Retail Pvt Ltd"
                    value={form.legal_name}
                    onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Industry Sector
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem',
                      background: '#ffffff'
                    }}
                  >
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Currency & Symbol
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem',
                      background: '#ffffff'
                    }}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    State / Jurisdiction
                  </label>
                  <select
                    value={form.state_code}
                    onChange={(e) => handleStateChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem',
                      background: '#ffffff'
                    }}
                  >
                    {INDIAN_STATES.map(st => (
                      <option key={st.code} value={st.code}>{st.name} ({st.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="billing@mybusiness.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            /* STEP 2: Add First Product */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#475569'
              }}>
                📦 Add your first inventory item or product SKU. You can add unlimited products later via Inventory or CSV import.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium Cotton Shirt L, Basmati Rice 5kg, Solar Panel 400W"
                  value={form.initial_product.product_name}
                  onChange={(e) => setForm({
                    ...form,
                    initial_product: { ...form.initial_product, product_name: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    SKU Code / Barcode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-PROD-01"
                    value={form.initial_product.sku}
                    onChange={(e) => setForm({
                      ...form,
                      initial_product: { ...form.initial_product, sku: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Product Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Groceries, Electronics, Apparel"
                    value={form.initial_product.category}
                    onChange={(e) => setForm({
                      ...form,
                      initial_product: { ...form.initial_product, category: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Selling Price ({form.currency_symbol})
                  </label>
                  <input
                    type="number"
                    value={form.initial_product.unit_price}
                    onChange={(e) => setForm({
                      ...form,
                      initial_product: { ...form.initial_product, unit_price: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Cost Price ({form.currency_symbol})
                  </label>
                  <input
                    type="number"
                    value={form.initial_product.cost_price}
                    onChange={(e) => setForm({
                      ...form,
                      initial_product: { ...form.initial_product, cost_price: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    value={form.initial_product.stock_quantity}
                    onChange={(e) => setForm({
                      ...form,
                      initial_product: { ...form.initial_product, stock_quantity: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : step === 3 ? (
            /* STEP 3: Add First Customer */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#475569'
              }}>
                👥 Add an initial customer or client profile to begin issuing invoices and monitoring credit risks.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Client / Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Enterprises, Walk-In Customer"
                  value={form.initial_customer.full_name}
                  onChange={(e) => setForm({
                    ...form,
                    initial_customer: { ...form.initial_customer, full_name: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={form.initial_customer.phone}
                    onChange={(e) => setForm({
                      ...form,
                      initial_customer: { ...form.initial_customer, phone: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="29ABCDE0000X1Z1"
                    value={form.initial_customer.gstin}
                    onChange={(e) => setForm({
                      ...form,
                      initial_customer: { ...form.initial_customer, gstin: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Assigned Credit Limit ({form.currency_symbol})
                </label>
                <input
                  type="number"
                  value={form.initial_customer.credit_limit}
                  onChange={(e) => setForm({
                    ...form,
                    initial_customer: { ...form.initial_customer, credit_limit: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
          ) : (
            /* STEP 4: Review & Launch */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: '1rem',
                color: '#15803d'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>Ready to Launch Your Enterprise!</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Review your initial inputs below. Once confirmed, SmartLedger AI will calibrate all POS registers, inventory ledgers, and AI predictive pipelines to your enterprise.
                </p>
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: 14,
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Enterprise Name:</span>
                  <strong style={{ color: '#0f172a' }}>{form.business_name || '(Not set)'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Industry & Currency:</span>
                  <strong style={{ color: '#0f172a' }}>{form.industry} ({form.currency_symbol} {form.currency})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Jurisdiction:</span>
                  <strong style={{ color: '#0f172a' }}>{form.state_name} (Code: {form.state_code})</strong>
                </div>
                {form.initial_product.product_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>First Product SKU:</span>
                    <strong style={{ color: '#2563eb' }}>{form.initial_product.product_name} ({form.currency_symbol}{form.initial_product.unit_price})</strong>
                  </div>
                )}
                {form.initial_customer.full_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>First Customer:</span>
                    <strong style={{ color: '#10b981' }}>{form.initial_customer.full_name}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        {!success && (
          <div style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff'
          }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1.2rem',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <FiArrowLeft size={16} /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={closeWizard}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: 'none',
                  color: '#94a3b8',
                  border: 'none',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !form.business_name.trim()) {
                    setError('Please provide a Business / Company Name to proceed.');
                    return;
                  }
                  setError('');
                  setStep(step + 1);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.4rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                Continue <FiArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteSetup}
                disabled={submitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.6rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                {submitting ? 'Calibrating ERP System...' : '🚀 Save & Launch My ERP'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessOnboardingWizard;
