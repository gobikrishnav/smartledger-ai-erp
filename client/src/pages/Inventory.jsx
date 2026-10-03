import React, { useState, useEffect, useRef } from 'react';
import {
  FiBox, FiPlus, FiRefreshCw, FiAlertTriangle, FiPackage,
  FiCheck, FiX, FiTrendingUp, FiDollarSign, FiSearch, FiFilter, FiZap
} from 'react-icons/fi';
import client from '../api/client';
import {
  pageEnter, staggerCards, rowStaggerElastic, countUp, countUpFloat,
  modalIn, buttonPress, init3DCardHover, badgePulse, floatLogo
} from '../utils/animations';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // all, low, highMargin
  const [search, setSearch]     = useState('');

  // Animated counters
  const [animCount, setAnimCount]     = useState(0);
  const [animStockVal, setAnimStockVal] = useState(0);
  const [animProfitVal, setAnimProfitVal] = useState(0);
  const [animAlerts, setAnimAlerts]   = useState(0);

  // Restock Modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct]   = useState(null);
  const [restockQty, setRestockQty]             = useState('');
  const [restockNotes, setRestockNotes]         = useState('');

  // Add Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState({
    sku: '', productName: '', unitPrice: '', costPrice: '', hsnSacCode: '8501', category: 'Electronics', stockQty: '50', reorderPoint: '10'
  });

  const pageRef = useRef(null);
  const restockModalRef = useRef(null);
  const addModalRef = useRef(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await client.get('/inventory');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pageEnter(pageRef.current);
    fetchInventory();
  }, []);

  useEffect(() => {
    if (!loading) {
      staggerCards('.inv-summary-card', 85);
      rowStaggerElastic('.inv-data-row', 40);
      setTimeout(() => {
        init3DCardHover('.card-3d-hover');
        badgePulse('.pulse-badge');
        floatLogo('.ai-float-icon');
      }, 300);

      const lowCount = products.filter(p => p.stockQty <= p.reorderPoint).length;
      const totalVal = products.reduce((s, p) => s + p.stockQty * p.unitPrice, 0);
      const costVal  = products.reduce((s, p) => s + p.stockQty * (p.costPrice || p.unitPrice * 0.65), 0);
      const profitVal = totalVal - costVal;

      countUp(setAnimCount, products.length, 1200);
      countUp(setAnimStockVal, totalVal, 1600);
      countUp(setAnimProfitVal, profitVal, 1600);
      countUp(setAnimAlerts, lowCount, 1200);
    }
  }, [loading, filterMode]);

  useEffect(() => {
    if (showRestockModal && restockModalRef.current) modalIn(restockModalRef.current);
    if (showAddModal && addModalRef.current) modalIn(addModalRef.current);
  }, [showRestockModal, showAddModal]);

  const handleRestock = async (e) => {
    e.preventDefault();
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) return alert('Enter a valid quantity');
    try {
      await client.post('/inventory/restock', {
        productId: selectedProduct._id,
        quantity: qty,
        notes: restockNotes || 'Manual UI restock'
      });
      setShowRestockModal(false);
      setSelectedProduct(null);
      setRestockQty('');
      setRestockNotes('');
      fetchInventory();
    } catch {
      alert('Failed to restock product');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProd,
        sku: newProd.sku || ('SKU-' + Date.now().toString().slice(-6)),
        unitPrice: Number(newProd.unitPrice),
        costPrice: Number(newProd.costPrice || Number(newProd.unitPrice) * 0.65),
        stockQty: Number(newProd.stockQty || 10),
        reorderPoint: Number(newProd.reorderPoint || 10)
      };
      await client.post('/products', payload);
      setShowAddModal(false);
      setNewProd({ sku: '', productName: '', unitPrice: '', costPrice: '', hsnSacCode: '8501', category: 'Electronics', stockQty: '50', reorderPoint: '10' });
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating product');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || p.productName.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterMode === 'low') return p.stockQty <= p.reorderPoint;
    if (filterMode === 'highMargin') {
      const cost = p.costPrice || p.unitPrice * 0.65;
      const margin = p.unitPrice > 0 ? ((p.unitPrice - cost) / p.unitPrice) * 100 : 0;
      return margin >= 35;
    }
    return true;
  });

  return (
    <div ref={pageRef} style={{ maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      <style>{`
        .inv-row { transition: background 0.2s, transform 0.15s; }
        .inv-row:hover { background: var(--bg-card-hover) !important; transform: scale(1.003); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
      `}</style>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.95rem', marginBottom: '0.25rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
            Enterprise Inventory & Catalog
            <span className="badge badge-primary pulse-badge" style={{ fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
              <FiZap className="ai-float-icon" /> AI Stock Monitor
            </span>
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Realtime stock tracking, Cost Price vs Selling Price margin analysis & automated reorder alerts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={(e) => { buttonPress(e.currentTarget); setShowAddModal(true); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding:'0.6rem 1.15rem' }}>
            <FiPlus /> + Add New Product
          </button>
          <button onClick={(e) => { buttonPress(e.currentTarget); fetchInventory(); }} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiRefreshCw /> Refresh Stock
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (with countUp and 3D hover) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card inv-summary-card card-3d-hover" style={{ borderTop: '2px solid var(--accent-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Products</span>
            <FiBox color="var(--accent-blue)" size={18} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>{animCount}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Catalog SKUs</div>
        </div>

        <div className="card inv-summary-card card-3d-hover" style={{ borderTop: '2px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Selling Stock Value</span>
            <FiDollarSign color="var(--accent-purple)" size={18} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>{formatCurrency(animStockVal)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total retail inventory</div>
        </div>

        <div className="card inv-summary-card card-3d-hover" style={{ borderTop: '2px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Stock Profit Value</span>
            <FiTrendingUp color="var(--accent-green)" size={18} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-green)' }}>{formatCurrency(animProfitVal)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight:700 }}>Realizable Gross Profit</div>
        </div>

        <div className="card inv-summary-card card-3d-hover" style={{ borderTop: animAlerts > 0 ? '2px solid var(--accent-red)' : '2px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Restock Alerts</span>
            <FiAlertTriangle color={animAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} size={18} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: animAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{animAlerts}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Below reorder threshold</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={(e) => { buttonPress(e.currentTarget); setFilterMode('all'); }} className={`btn ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}>
            All Products ({products.length})
          </button>
          <button onClick={(e) => { buttonPress(e.currentTarget); setFilterMode('low'); }} className={`btn ${filterMode === 'low' ? 'btn-danger' : 'btn-secondary'}`} style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}>
            ⚠️ Low Stock ({products.filter(p => p.stockQty <= p.reorderPoint).length})
          </button>
          <button onClick={(e) => { buttonPress(e.currentTarget); setFilterMode('highMargin'); }} className={`btn ${filterMode === 'highMargin' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}>
            📈 High Margin (&gt;35%)
          </button>
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <FiSearch style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            style={{ margin: 0, paddingLeft: '2.5rem', fontSize: '0.85rem' }}
            placeholder="Search SKU or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['SKU Code', 'Product Name', 'Category', 'Stock Qty', 'Cost Price (₹)', 'Selling Price (₹)', 'Unit Margin ₹ (%)', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const cost = p.costPrice || p.unitPrice * 0.65;
                const unitProfit = p.unitPrice - cost;
                const marginPercent = p.unitPrice > 0 ? ((unitProfit / p.unitPrice) * 100) : 0;
                const isLow = p.stockQty <= p.reorderPoint;
                return (
                  <tr key={p._id} className="inv-data-row inv-row" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{p.sku}</td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{p.productName}</td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.category || 'General'}</td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: isLow ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                      {p.stockQty} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>units</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>₹{cost.toFixed(2)}</td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>₹{p.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontWeight: 700, color: unitProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        ₹{unitProfit.toFixed(2)}
                      </span>
                      <small style={{ display: 'block', color: 'var(--text-muted)' }}>({marginPercent.toFixed(1)}%)</small>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className={`badge badge-${isLow ? 'danger' : 'success'}`}>
                        {isLow ? '⚠️ Restock Required' : '✅ Healthy Stock'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <button
                        onClick={(e) => { buttonPress(e.currentTarget); setSelectedProduct(p); setShowRestockModal(true); }}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <FiPlus /> Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div ref={addModalRef} className="card" style={{ width: '100%', maxWidth: 520, padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Create New Catalog Product</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><FiX /></button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input type="text" className="input-field" required placeholder="e.g. Solar Core Inverter" value={newProd.productName} onChange={e => setNewProd({...newProd, productName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU Code</label>
                  <input type="text" className="input-field" placeholder="Auto if blank" value={newProd.sku} onChange={e => setNewProd({...newProd, sku: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Selling Price (₹) *</label>
                  <input type="number" className="input-field" required min="1" step="0.01" value={newProd.unitPrice} onChange={e => setNewProd({...newProd, unitPrice: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Cost Price (₹)</label>
                  <input type="number" className="input-field" min="0" step="0.01" placeholder="For P&L analysis" value={newProd.costPrice} onChange={e => setNewProd({...newProd, costPrice: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">HSN/SAC Code *</label>
                  <input type="text" className="input-field" required value={newProd.hsnSacCode} onChange={e => setNewProd({...newProd, hsnSacCode: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input-field" value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})}>
                    <option value="Electronics">Electronics</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Packaging">Packaging</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Initial Stock Qty</label>
                  <input type="number" className="input-field" min="0" value={newProd.stockQty} onChange={e => setNewProd({...newProd, stockQty: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Alert Threshold</label>
                  <input type="number" className="input-field" min="1" value={newProd.reorderPoint} onChange={e => setNewProd({...newProd, reorderPoint: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}>
                <FiPlus /> Save Product to Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedProduct && (
        <div className="modal-overlay">
          <div ref={restockModalRef} className="card" style={{ width: '100%', maxWidth: 440, padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Restock Product</h3>
              <button onClick={() => { setShowRestockModal(false); setSelectedProduct(null); }} className="btn btn-secondary" style={{ padding: '0.3rem' }}><FiX /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Adding units for <strong>{selectedProduct.productName}</strong> (Current Stock: {selectedProduct.stockQty})
            </p>
            <form onSubmit={handleRestock}>
              <div className="form-group">
                <label className="form-label">Quantity to Add *</label>
                <input type="number" className="input-field" min="1" required placeholder="e.g. 50" value={restockQty} onChange={e => setRestockQty(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Restock Notes</label>
                <input type="text" className="input-field" placeholder="Optional notes..." value={restockNotes} onChange={e => setRestockNotes(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
                <FiCheck /> Confirm Restock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
