import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiSave, FiCheckCircle, FiArrowLeft, FiPrinter, FiCopy, FiTrendingUp, FiAlertTriangle, FiX, FiBox, FiDollarSign, FiZap } from 'react-icons/fi';
import client from '../api/client';
import {
  pageEnter, staggerCards, modalIn, buttonPress, profitPulse, highlightRow,
  init3DCardHover, pulseNeonBorder, badgePulse, floatLogo, bounceIn
} from '../utils/animations';
import InvoiceViewModal from '../components/InvoiceViewModal';

const INDIAN_STATES = [
  { code:'01', name:'Jammu & Kashmir' }, { code:'02', name:'Himachal Pradesh' },
  { code:'03', name:'Punjab' },          { code:'04', name:'Chandigarh' },
  { code:'05', name:'Uttarakhand' },     { code:'06', name:'Haryana' },
  { code:'07', name:'Delhi' },           { code:'08', name:'Rajasthan' },
  { code:'09', name:'Uttar Pradesh' },   { code:'10', name:'Bihar' },
  { code:'11', name:'Sikkim' },          { code:'12', name:'Arunachal Pradesh' },
  { code:'13', name:'Nagaland' },        { code:'14', name:'Manipur' },
  { code:'15', name:'Mizoram' },         { code:'16', name:'Tripura' },
  { code:'17', name:'Meghalaya' },       { code:'18', name:'Assam' },
  { code:'19', name:'West Bengal' },     { code:'20', name:'Jharkhand' },
  { code:'21', name:'Odisha' },          { code:'22', name:'Chhattisgarh' },
  { code:'23', name:'Madhya Pradesh' },  { code:'24', name:'Gujarat' },
  { code:'26', name:'Dadra & Nagar Haveli' }, { code:'27', name:'Maharashtra' },
  { code:'29', name:'Karnataka' },       { code:'30', name:'Goa' },
  { code:'32', name:'Kerala' },          { code:'33', name:'Tamil Nadu' },
  { code:'34', name:'Puducherry' },      { code:'36', name:'Telangana' },
  { code:'37', name:'Andhra Pradesh' },  { code:'38', name:'Ladakh' },
];

const getGstRate = (hsnCode) => {
  if (!hsnCode) return 18;
  const p = String(hsnCode).substring(0, 2).padStart(2, '0');
  const n = parseInt(p, 10);
  if (n >= 1  && n <=  9)  return 0;
  if (n >= 10 && n <= 15)  return 5;
  if (n >= 16 && n <= 24)  return 28;
  if (n >= 25 && n <= 27)  return 18;
  if (n >= 28 && n <= 49)  return 12;
  if (n >= 50 && n <= 63)  return 5;
  if (n >= 64 && n <= 85)  return 18;
  if (n >= 86 && n <= 89)  return 28;
  return 18;
};

const emptyItem = () => ({
  productId:'', productName:'', quantity:1, unitPrice:0, costPrice:0, hsnCode:'',
  taxableAmount:0, cgstRate:0, sgstRate:0, igstRate:0,
  cgstAmount:0, sgstAmount:0, igstAmount:0, lineTotal:0, profitAmt:0
});

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const [clients,  setClients]  = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);

  // Quick Add Product Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '', productName: '', unitPrice: '', costPrice: '', hsnSacCode: '8501', category: 'Electronics', stockQty: '50'
  });
  const modalRef = useRef(null);
  const profitBoxRef = useRef(null);
  const aiBadgeRef = useRef(null);

  const [formData, setFormData] = useState({
    clientId:            '',
    originStateCode:     '27',
    destinationStateCode:'27',
    notes:               '',
    discountAmt:         0,
    shippingAmt:         0
  });

  const [items, setItems] = useState([emptyItem()]);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const handleOpenPdfPreview = (e) => {
    if (e) buttonPress(e.currentTarget);
    const activeClient = clients.find(c => c._id === formData.clientId);
    const validItems = items.filter(i => i.productId && i.quantity > 0);
    const draft = {
      invoiceNumber: 'DRAFT-PREVIEW',
      invoice_no: 'DRAFT-PREVIEW',
      clientId: activeClient || { businessName: 'Cash / Direct Client', gstin: '29AAACT2727Q1ZW' },
      client: activeClient,
      customer_name: activeClient?.businessName || activeClient?.name || 'Cash / Direct Client',
      originStateCode: formData.originStateCode || '29',
      destinationStateCode: formData.destinationStateCode || '29',
      notes: formData.notes || 'Draft preview',
      discountAmt: Number(formData.discountAmt) || 0,
      shippingAmt: Number(formData.shippingAmt) || 0,
      subtotalAmt: summary.subTotal,
      subtotal: summary.subTotal,
      cgstTotal: summary.cgstTotal,
      sgstTotal: summary.sgstTotal,
      igstTotal: summary.igstTotal,
      grandTotal: summary.grandTotal,
      net_total: summary.grandTotal,
      items: (validItems.length > 0 ? validItems : items).map(i => ({
        productName: i.productName || 'Catalog Product',
        product_name: i.productName || 'Catalog Product',
        hsnCode: i.hsnCode || '85',
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.unitPrice || 0),
        taxableAmount: Number(i.taxableAmount || (i.quantity * i.unitPrice)),
        cgstAmount: Number(i.cgstAmount || 0),
        sgstAmount: Number(i.sgstAmount || 0),
        igstAmount: Number(i.igstAmount || 0),
        gstRate: Number(i.gstRate || 18)
      })),
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    setPreviewInvoice(draft);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cliRes, prodRes] = await Promise.all([client.get('/clients'), client.get('/products')]);
        setClients(Array.isArray(cliRes.data) ? cliRes.data : []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Initialize all dramatic Anime.js animations
  useEffect(() => {
    if (!loading) {
      pageEnter('.inv-create-section', 0);
      staggerCards('.inv-create-section', 100);
      setTimeout(() => {
        init3DCardHover('.card-3d-hover');
        pulseNeonBorder('.pnl-banner-box', 'rgba(52,211,153,0.45)');
        badgePulse('.ai-badge-live');
        floatLogo('.ai-float-icon');
      }, 300);
    }
  }, [loading]);

  useEffect(() => {
    if (showProductModal && modalRef.current) modalIn(modalRef.current);
  }, [showProductModal]);

  // ── Live Billing & Profit / Loss Calculation ─────────────────────────────
  useEffect(() => {
    const isSameState = formData.originStateCode === formData.destinationStateCode;
    let subTotal = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0, totalCost = 0;

    const newItems = items.map(item => {
      const taxableAmount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const itemCost = (Number(item.quantity) || 0) * (Number(item.costPrice) || 0);
      const profitAmt = taxableAmount - itemCost;

      const gstRate = getGstRate(item.hsnCode);
      let cgstRate = 0, sgstRate = 0, igstRate = 0;
      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

      if (isSameState) {
        cgstRate = gstRate / 2;
        sgstRate = gstRate / 2;
        cgstAmount = (taxableAmount * cgstRate) / 100;
        sgstAmount = (taxableAmount * sgstRate) / 100;
      } else {
        igstRate = gstRate;
        igstAmount = (taxableAmount * igstRate) / 100;
      }
      const lineTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;
      subTotal += taxableAmount;
      totalCost += itemCost;
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;
      igstTotal += igstAmount;
      return { ...item, taxableAmount, cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount, lineTotal, profitAmt };
    });

    const discountNum = Number(formData.discountAmt) || 0;
    const shippingNum = Number(formData.shippingAmt) || 0;
    const grandTotal = Math.max(0, subTotal - discountNum + cgstTotal + sgstTotal + igstTotal + shippingNum);
    const netProfit = subTotal - discountNum - totalCost;
    const profitMargin = subTotal > 0 ? ((netProfit / subTotal) * 100) : 0;

    setItems(newItems);
    setSummary({ subTotal, cgstTotal, sgstTotal, igstTotal, grandTotal, totalCost, netProfit, profitMargin });
  // eslint-disable-next-line
  }, [formData.originStateCode, formData.destinationStateCode, formData.discountAmt, formData.shippingAmt,
      JSON.stringify(items.map(i => ({ p: i.productId, q: i.quantity, u: i.unitPrice, c: i.costPrice, h: i.hsnCode })))]);

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p._id === productId);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: productId,
      productName: product?.productName || '',
      unitPrice:   product?.unitPrice  || 0,
      costPrice:   product?.costPrice  || (product?.unitPrice * 0.65) || 0,
      hsnCode:     product?.hsnSacCode || '',
    };
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = (e) => {
    if (e) buttonPress(e.currentTarget);
    setItems(prev => [...prev, emptyItem()]);
  };

  const duplicateItem = (index, e) => {
    if (e) buttonPress(e.currentTarget);
    const rowToCopy = { ...items[index] };
    setItems(prev => [...prev.slice(0, index + 1), rowToCopy, ...prev.slice(index + 1)]);
    setTimeout(() => highlightRow(`.item-row-${index + 1}`), 50);
  };

  const removeItem = (index, e) => {
    if (e) buttonPress(e.currentTarget);
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllItems = (e) => {
    if (e) buttonPress(e.currentTarget);
    if (!window.confirm('Clear all rows from this invoice matrix?')) return;
    setItems([emptyItem()]);
  };

  // ── Quick Add Product Handler ───────────────────────────────────────────
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        sku: newProduct.sku || ('SKU-' + Date.now().toString().slice(-6)),
        unitPrice: Number(newProduct.unitPrice),
        costPrice: Number(newProduct.costPrice || Number(newProduct.unitPrice) * 0.65),
        stockQty: Number(newProduct.stockQty || 10)
      };
      const res = await client.post('/products', payload);
      const created = res.data;
      setProducts(prev => [created, ...prev]);
      
      const firstEmptyIndex = items.findIndex(i => !i.productId);
      if (firstEmptyIndex >= 0) {
        handleProductChange(firstEmptyIndex, created._id);
      } else {
        const newRow = {
          ...emptyItem(),
          productId: created._id,
          productName: created.productName,
          unitPrice: created.unitPrice,
          costPrice: created.costPrice,
          hsnCode: created.hsnSacCode
        };
        setItems(prev => [...prev, newRow]);
      }
      setShowProductModal(false);
      setNewProduct({ sku: '', productName: '', unitPrice: '', costPrice: '', hsnSacCode: '8501', category: 'Electronics', stockQty: '50' });
      setTimeout(() => highlightRow(`.item-row-${items.length - 1}`), 100);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create product');
    }
  };

  // ── Submit Invoice ──────────────────────────────────────────────────────
  const handleSubmit = async (status = 'draft', e) => {
    if (e) buttonPress(e.currentTarget);
    if (!formData.clientId) { alert('Please select a client'); return; }
    if (items.some(i => !i.productId || i.quantity <= 0)) { alert('Please fill in all item rows'); return; }

    setSaving(true);
    try {
      const payload = {
        clientId:             formData.clientId,
        customer_id:          formData.clientId,
        originStateCode:      formData.originStateCode,
        destinationStateCode: formData.destinationStateCode,
        notes:                formData.notes,
        discountAmt:          Number(formData.discountAmt) || 0,
        shippingAmt:          Number(formData.shippingAmt) || 0,
        items: items.map(i => ({
          productId:   i.productId,
          product_id:  i.productId,
          productName: i.productName,
          product_name: i.productName,
          hsnCode:     i.hsnCode,
          hsn_code:    i.hsnCode,
          quantity:    Number(i.quantity),
          unitPrice:   Number(i.unitPrice),
          unit_price:  Number(i.unitPrice),
          costPrice:   Number(i.costPrice),
          cost_price:  Number(i.costPrice),
          gstRate:     Number(i.gstRate || 18),
          gst_rate:    Number(i.gstRate || 18)
        })),
      };
      const res = await client.post('/invoices', payload);
      const newInv = res.data;
      const invoiceId = newInv._id || newInv.invoice?._id;
      if (status === 'finalized' && invoiceId) {
        await client.put(`/invoices/${invoiceId}/finalize`);
      }

      setSuccess(true);
      setTimeout(() => navigate('/invoices'), 1200);
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating invoice');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:2 }).format(v || 0);
  const isSameState = formData.originStateCode === formData.destinationStateCode;

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'50vh' }}>
      <div className="loading-spinner" style={{ width:44, height:44 }} />
    </div>
  );

  return (
    <div>
      <style>{`
        .item-row { transition: background 0.15s, transform 0.15s; }
        .item-row:hover { background: #f8fafc; transform: scale(1.001); }
        .summary-row { display:flex; justify-content:space-between; padding:0.48rem 0; font-size:0.875rem; }
        .btn-hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .btn-hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(96,165,250,0.35); }
        .modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(8px); z-index:999; display:flex; alignItems:center; justifyContent:center; padding:1.5rem; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      {success && (
        <div className="success-banner" style={{ background:'rgba(52,211,153,0.18)', border:'1px solid var(--accent-green)', borderRadius:'var(--radius)', padding:'1.25rem 1.75rem', marginBottom:'1.5rem', color:'var(--accent-green)', fontWeight:800, textAlign:'center', fontSize:'1.2rem', boxShadow:'0 10px 35px rgba(52,211,153,0.25)' }}>
          ✅ Invoice finalized & stock inventory reconciled! Redirecting…
        </div>
      )}

      {/* Quick Add Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div ref={modalRef} className="card" style={{ width:'100%', maxWidth:500, padding:'2rem', position:'relative', background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:0, display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <FiBox color="var(--accent-blue)" /> Quick Add Product to Catalog
              </h3>
              <button onClick={() => setShowProductModal(false)} className="btn btn-secondary" style={{ padding:'0.3rem' }}><FiX /></button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom:'1rem' }}>
                  <label className="form-label">Product Name *</label>
                  <input type="text" className="input-field" required placeholder="e.g. Copper Wire Core" value={newProduct.productName} onChange={e => setNewProduct({...newProduct, productName: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom:'1rem' }}>
                  <label className="form-label">SKU Code</label>
                  <input type="text" className="input-field" placeholder="Auto if blank" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom:'1rem' }}>
                  <label className="form-label">Selling Price (₹) *</label>
                  <input type="number" className="input-field" required min="1" step="0.01" value={newProduct.unitPrice} onChange={e => setNewProduct({...newProduct, unitPrice: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom:'1rem' }}>
                  <label className="form-label">Cost Price / Purchase Price (₹)</label>
                  <input type="number" className="input-field" min="0" step="0.01" placeholder="For P&L tracking" value={newProduct.costPrice} onChange={e => setNewProduct({...newProduct, costPrice: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom:'1rem' }}>
                  <label className="form-label">HSN/SAC Code *</label>
                  <input type="text" className="input-field" required value={newProduct.hsnSacCode} onChange={e => setNewProduct({...newProduct, hsnSacCode: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom:'1rem' }}>
                  <label className="form-label">Category</label>
                  <select className="input-field" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                    <option value="Electronics">Electronics</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Packaging">Packaging</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', marginTop:'1rem', padding:'0.75rem' }}>
                <FiPlus /> Save & Select in Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header with Enterprise Toolbar & Glowing Badge */}
      <div className="page-header inv-create-section">
        <div>
          <button onClick={(e) => { buttonPress(e.currentTarget); navigate('/invoices'); }} className="btn btn-secondary no-print" style={{ marginBottom:'0.75rem', padding:'0.4rem 0.85rem', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <FiArrowLeft size={14} /> Back to Invoices
          </button>
          <h1 style={{ fontSize:'1.95rem', marginBottom:'0.25rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
            Enterprise Invoice Billing
            <span className="badge badge-primary ai-badge-live" style={{ fontSize:'0.78rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
              <FiZap className="ai-float-icon" /> AI Realtime GST & Margin Engine
            </span>
          </h1>
          <p style={{ margin:0, color:'var(--text-secondary)' }}>Auto-calculating GST, Cost of Goods Sold (COGS), Discount, Shipping & Live P&L Margin.</p>
        </div>

        {/* Top Feature Action Buttons with Ripple effects */}
        <div className="no-print" style={{ display:'flex', gap:'0.65rem', flexWrap:'wrap' }}>
          <button onClick={handleOpenPdfPreview} className="btn btn-secondary btn-hover-lift" style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <FiPrinter /> Print / Export PDF
          </button>
          <button onClick={(e) => { buttonPress(e.currentTarget); setShowProductModal(true); }} className="btn btn-secondary btn-hover-lift" style={{ display:'flex', alignItems:'center', gap:'0.4rem', border:'1px solid var(--accent-blue)', color:'var(--accent-blue)' }}>
            <FiPlus /> + Quick Add Product
          </button>
          <button onClick={(e) => handleSubmit('draft', e)} className="btn btn-secondary btn-hover-lift" disabled={saving} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <FiSave /> Save Draft
          </button>
          <button onClick={(e) => handleSubmit('finalized', e)} className="btn btn-primary btn-hover-lift" disabled={saving} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            {saving ? <span className="loading-spinner" style={{ width:18, height:18 }} /> : <><FiCheckCircle /> Finalize & Reconcile Stock</>}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gap:'1.5rem' }}>
        {/* ① Client & Geo-Token Mapping (3D hover card) */}
        <div className="card inv-create-section card-3d-hover">
          <h3 style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span style={{ color:'var(--accent-blue)' }}>①</span> Client & Geo-Token Mapping
          </h3>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Client / Buyer Business *</label>
              <select className="input-field" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                <option value="">— Select Client Business —</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.businessName} {c.gstin ? `[GSTIN: ${c.gstin}]` : ''} {c.riskScore ? `(Risk: ${c.riskScore})` : ''}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Internal Reference / Notes</label>
              <input type="text" className="input-field" placeholder="PO number or payment terms…" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom:0, marginTop:'1.25rem' }}>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Origin State (Seller Geo-Token)</label>
              <select className="input-field" value={formData.originStateCode} onChange={e => setFormData({...formData, originStateCode: e.target.value})}>
                {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Destination State (Buyer Geo-Token)</label>
              <select className="input-field" value={formData.destinationStateCode} onChange={e => setFormData({...formData, destinationStateCode: e.target.value})}>
                {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop:'1rem', padding:'0.75rem 1.25rem', borderRadius:'var(--radius-sm)', background: isSameState ? 'rgba(52,211,153,0.08)' : 'rgba(96,165,250,0.08)', border:`1px solid ${isSameState?'rgba(52,211,153,0.25)':'rgba(96,165,250,0.25)'}`, display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ fontSize:'1.4rem' }}>{isSameState ? '🏠' : '🚚'}</span>
            <div>
              <div style={{ fontWeight:700, color: isSameState ? 'var(--accent-green)' : 'var(--accent-blue)', fontSize:'0.875rem' }}>
                {isSameState ? 'Intra-State Transaction — CGST + SGST Engine Active' : 'Inter-State Transaction — IGST Engine Active'}
              </div>
              <div style={{ fontSize:'0.775rem', color:'var(--text-muted)' }}>
                {isSameState ? `Taxes split 50/50 between Central & State GST based on HSN code rules.` : `Full Integrated GST rate applied automatically based on HSN code rules.`}
              </div>
            </div>
          </div>
        </div>

        {/* ② Live Profit & Loss Engine Banner */}
        <div ref={profitBoxRef} className="card inv-create-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.35rem 1.85rem', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              <div style={{ fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'1px', color:'#10b981', fontWeight:800, display:'flex', alignItems:'center', gap:'0.45rem' }}>
                <FiTrendingUp /> Authentic P&L Engine — Realtime Transaction Margin Analysis
              </div>
              <div style={{ fontSize:'0.88rem', color:'#64748b', marginTop:'0.25rem' }}>
                Total Cost of Goods Sold: <strong style={{ color:'#0f172a' }}>{fmt(summary.totalCost)}</strong> | 
                Selling Price Total: <strong style={{ color:'#0f172a' }}>{fmt(summary.subTotal)}</strong>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding:'0.75rem 1.35rem', borderRadius:'var(--radius-sm)' }}>
              <div>
                <div style={{ fontSize:'0.72rem', color:'#94a3b8', textTransform:'uppercase' }}>Estimated Net Profit</div>
                <div style={{ fontSize:'1.55rem', fontWeight:900, color: summary.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  {fmt(summary.netProfit)}
                </div>
              </div>
              <span className={`badge badge-${summary.profitMargin >= 20 ? 'success' : summary.profitMargin >= 0 ? 'warning' : 'danger'}`} style={{ padding:'0.5rem 0.9rem', fontSize:'0.88rem', fontWeight:800 }}>
                {summary.profitMargin.toFixed(1)}% Margin
              </span>
            </div>
          </div>

          {summary.netProfit < 0 && (
            <div style={{ marginTop:'0.85rem', color:'#ef4444', fontSize:'0.825rem', display:'flex', alignItems:'center', gap:'0.4rem', background:'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding:'0.6rem 0.9rem', borderRadius:6 }}>
              <FiAlertTriangle /> <strong>Loss Warning:</strong> This invoice is currently pricing items below their Purchase/Cost price!
            </div>
          )}
        </div>

        {/* ③ Items Matrix with authentic Multi-Button actions */}
        <div className="card inv-create-section" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
            <h3 style={{ margin:0, display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span style={{ color:'var(--accent-purple)' }}>②</span> Multi-Row Items Matrix
              <span style={{ fontSize:'0.75rem', fontWeight:400, color:'var(--text-muted)', marginLeft:'0.5rem' }}>{items.length} product row{items.length!==1?'s':''}</span>
            </h3>
            <div className="no-print" style={{ display:'flex', gap:'0.5rem' }}>
              <button onClick={(e) => { buttonPress(e.currentTarget); setShowProductModal(true); }} className="btn btn-secondary" style={{ fontSize:'0.78rem', padding:'0.4rem 0.85rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <FiPlus /> + New Catalog Product
              </button>
              <button onClick={(e) => clearAllItems(e)} className="btn btn-danger" style={{ fontSize:'0.78rem', padding:'0.4rem 0.85rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <FiTrash2 /> Clear Rows
              </button>
            </div>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Product Item', 'Qty', 'Selling Price (₹)', 'Cost Price (₹)', 'HSN Code', 'Taxable Amt',
                    ...(isSameState ? ['CGST','SGST'] : ['IGST']),
                    'Est. Profit', 'Line Total', 'Actions'].map(h => (
                    <th key={h} style={{ padding:'0.875rem 1rem', textAlign:'left', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-muted)', fontWeight:600, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className={`item-row item-row-${index}`} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'0.75rem 1rem', minWidth:200 }}>
                      <select className="input-field" style={{ margin:0, padding:'0.5rem 0.75rem' }} value={item.productId} onChange={e => handleProductChange(index, e.target.value)}>
                        <option value="">— Select Product —</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.productName} [₹{p.unitPrice}]</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'0.75rem 1rem', width:80 }}>
                      <input type="number" className="input-field" style={{ margin:0, padding:'0.5rem 0.6rem', width:70 }} min="1" value={item.quantity} onChange={e => handleItemChange(index,'quantity',e.target.value)} />
                    </td>
                    <td style={{ padding:'0.75rem 1rem', width:130 }}>
                      <input type="number" className="input-field" style={{ margin:0, padding:'0.5rem 0.6rem', width:110 }} min="0" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(index,'unitPrice',e.target.value)} />
                    </td>
                    <td style={{ padding:'0.75rem 1rem', width:130 }}>
                      <input type="number" className="input-field" style={{ margin:0, padding:'0.5rem 0.6rem', width:110, color:'var(--text-secondary)' }} min="0" step="0.01" value={item.costPrice} onChange={e => handleItemChange(index,'costPrice',e.target.value)} />
                    </td>
                    <td style={{ padding:'0.75rem 1rem', fontFamily:'monospace', fontSize:'0.8rem', color:'var(--text-secondary)' }}>{item.hsnCode || '—'}</td>
                    <td style={{ padding:'0.75rem 1rem', fontWeight:600 }}>{item.taxableAmount.toFixed(2)}</td>
                    {isSameState ? (
                      <>
                        <td style={{ padding:'0.75rem 1rem', color:'var(--accent-green)' }}>{item.cgstRate}%<br/><small style={{ color:'var(--text-muted)' }}>₹{item.cgstAmount.toFixed(2)}</small></td>
                        <td style={{ padding:'0.75rem 1rem', color:'var(--accent-cyan)' }}>{item.sgstRate}%<br/><small style={{ color:'var(--text-muted)' }}>₹{item.sgstAmount.toFixed(2)}</small></td>
                      </>
                    ) : (
                      <td style={{ padding:'0.75rem 1rem', color:'var(--accent-blue)' }}>{item.igstRate}%<br/><small style={{ color:'var(--text-muted)' }}>₹{item.igstAmount.toFixed(2)}</small></td>
                    )}
                    <td style={{ padding:'0.75rem 1rem', fontWeight:700, color: item.profitAmt >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      ₹{item.profitAmt.toFixed(2)}
                    </td>
                    <td style={{ padding:'0.75rem 1rem', fontWeight:700, color:'var(--accent-purple)' }}>{item.lineTotal.toFixed(2)}</td>
                    <td style={{ padding:'0.75rem 1rem', whiteSpace:'nowrap' }} className="no-print">
                      <button onClick={(e) => duplicateItem(index, e)} className="btn btn-secondary" style={{ padding:'0.35rem 0.5rem', marginRight:'0.3rem' }} title="Duplicate Row">
                        <FiCopy size={13} />
                      </button>
                      {items.length > 1 && (
                        <button onClick={(e) => removeItem(index, e)} className="btn btn-danger" style={{ padding:'0.35rem 0.5rem' }} title="Remove Row">
                          <FiTrash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={(e) => addItem(e)} className="btn btn-secondary btn-hover-lift" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <FiPlus /> Add Item Row
              </button>
              <button onClick={(e) => { buttonPress(e.currentTarget); profitPulse(profitBoxRef.current); }} className="btn btn-secondary btn-hover-lift" style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--accent-green)', borderColor:'var(--accent-green)' }}>
                <FiTrendingUp /> Highlight P&L Margin
              </button>
            </div>
            <div style={{ fontSize:'0.825rem', color:'var(--text-secondary)' }}>
              Tip: Cost Price is used purely for your internal AI Profit & Loss calculation.
            </div>
          </div>
        </div>

        {/* ④ Discount, Shipping & Authentic Billing Breakdown (3D hover cards) */}
        <div className="inv-create-section" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'1.5rem' }}>
          <div className="card card-3d-hover">
            <h3 style={{ marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span style={{ color:'var(--accent-cyan)' }}>③</span> Billing Adjustments (Optional)
            </h3>
            <div className="form-group">
              <label className="form-label">Discount Amount (₹)</label>
              <input type="number" className="input-field" min="0" step="0.01" placeholder="0.00" value={formData.discountAmt} onChange={e => setFormData({...formData, discountAmt: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Shipping / Freight & Packaging Charges (₹)</label>
              <input type="number" className="input-field" min="0" step="0.01" placeholder="0.00" value={formData.shippingAmt} onChange={e => setFormData({...formData, shippingAmt: e.target.value})} />
            </div>
          </div>

          <div className="card card-3d-hover" style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
            <h3 style={{ marginBottom:'1.25rem', borderBottom:'1px solid var(--border)', paddingBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span style={{ color:'var(--accent-purple)' }}>④</span> Authentic Invoice Summary
            </h3>
            <div className="summary-row"><span style={{ color:'var(--text-secondary)' }}>Taxable Subtotal</span><span>{fmt(summary.subTotal)}</span></div>
            {Number(formData.discountAmt) > 0 && (
              <div className="summary-row"><span style={{ color:'var(--accent-red)' }}>Discount Applied</span><span>- {fmt(formData.discountAmt)}</span></div>
            )}
            {isSameState ? (
              <>
                <div className="summary-row"><span style={{ color:'var(--accent-green)' }}>CGST Total</span><span>+ {fmt(summary.cgstTotal)}</span></div>
                <div className="summary-row"><span style={{ color:'var(--accent-cyan)' }}>SGST Total</span><span>+ {fmt(summary.sgstTotal)}</span></div>
              </>
            ) : (
              <div className="summary-row"><span style={{ color:'var(--accent-blue)' }}>IGST Total</span><span>+ {fmt(summary.igstTotal)}</span></div>
            )}
            {Number(formData.shippingAmt) > 0 && (
              <div className="summary-row"><span style={{ color:'var(--accent-blue)' }}>Shipping / Freight</span><span>+ {fmt(formData.shippingAmt)}</span></div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1rem', paddingTop:'1rem', borderTop:'1px dashed var(--border)', fontSize:'1.4rem', fontWeight:900 }}>
              <span className="text-gradient">Grand Total Payable</span>
              <span className="text-gradient-primary">{fmt(summary.grandTotal)}</span>
            </div>

            <div className="no-print" style={{ display:'flex', gap:'0.75rem', marginTop:'1.75rem' }}>
              <button onClick={(e) => handleSubmit('draft', e)} className="btn btn-secondary" disabled={saving} style={{ flex:1 }}>
                <FiSave size={15} /> Save as Draft
              </button>
              <button onClick={(e) => handleSubmit('finalized', e)} className="btn btn-primary" disabled={saving} style={{ flex:1 }}>
                {saving ? <span className="loading-spinner" style={{ width:16, height:16 }} /> : <><FiCheckCircle size={15} /> Finalize Invoice</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewInvoice && (
        <InvoiceViewModal invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}
    </div>
  );
};

export default InvoiceCreate;
