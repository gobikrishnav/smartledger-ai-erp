import React, { useState, useEffect } from 'react';
import {
  Barcode, ShoppingCart, Plus, Minus, Trash2, CheckCircle,
  CreditCard, DollarSign, Zap, Sparkles, MapPin, Search,
  ArrowRight, Shield, User, AlertCircle
} from 'lucide-react';
import client from '../api/client';
import RoleNavbar from '../components/RoleNavbar';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import ThermalReceiptModal from '../components/ThermalReceiptModal';
import NotificationDrawer from '../components/NotificationDrawer';
import InvoiceViewModal from '../components/InvoiceViewModal';

const CashierPOS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, CASH, CARD, CREDIT
  const [discountPercent, setDiscountPercent] = useState(0);

  // Modals
  const [showScanner, setShowScanner] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [completedItems, setCompletedItems] = useState([]);

  // Cross-sell recommendations from Python Apriori Microservice
  const [recommendations, setRecommendations] = useState([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch Products & Customers
  const fetchData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        client.get('/inventory/products'),
        client.get('/customers')
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
    } catch (err) {
      console.error('Error fetching POS data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Query Apriori AI Recommendations when cart changes
  useEffect(() => {
    const fetchCrossSell = async () => {
      if (cart.length === 0) {
        setRecommendations([]);
        return;
      }
      try {
        const cartSkus = cart.map(i => i.sku_barcode);
        const res = await client.post('/ai/recommend/cross-sell', { cart_items: cartSkus });
        if (res.data && res.data.recommendations) {
          setRecommendations(res.data.recommendations);
        }
      } catch (err) {
        console.error('Apriori recommendations error:', err);
      }
    };
    fetchCrossSell();
  }, [cart]);

  // Keyboard shortcut listener (F2: Open scanner, F4: Complete sale)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setShowScanner(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cart Management
  const addToCart = (product) => {
    setErrorMsg('');
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        if (existing.quantity + 1 > product.stock_quantity) {
          setErrorMsg(`Cannot add more than ${product.stock_quantity} available units.`);
          return prev;
        }
        return prev.map(item =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        if (product.stock_quantity < 1) {
          setErrorMsg(`'${product.product_name}' is out of stock!`);
          return prev;
        }
        return [...prev, {
          ...product,
          quantity: 1,
          gst_rate: product.category_id?.gst_rate || 18
        }];
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item._id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock_quantity) {
            setErrorMsg(`Available stock limit is ${item.stock_quantity}.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };

  const handleBarcodeScanned = (barcode) => {
    const matched = products.find(p => p.sku_barcode === barcode);
    if (matched) {
      addToCart(matched);
      setShowScanner(false);
    } else {
      setErrorMsg(`No product found for barcode '${barcode}'.`);
    }
  };

  // Calculations
  const rawSubtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  const discountAmt = (rawSubtotal * discountPercent) / 100;
  const taxableSubtotal = Math.max(0, rawSubtotal - discountAmt);

  const totalGST = cart.reduce((acc, item) => {
    const itemTaxable = (item.unit_price * item.quantity) * (1 - discountPercent / 100);
    const itemTax = (itemTaxable * (item.gst_rate || 18)) / 100;
    return acc + itemTax;
  }, 0);

  const netGrandTotal = taxableSubtotal + totalGST;

  // Selected customer
  const activeCustomer = customers.find(c => c._id === selectedCustomerId);

  // Complete POS Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Cart is empty. Please scan or select items to checkout.');
      return;
    }

    if (paymentMethod === 'CREDIT' && !activeCustomer) {
      setErrorMsg('Please select a registered B2B Trade Customer for Credit transactions.');
      return;
    }

    setLoadingCheckout(true);
    setErrorMsg('');

    try {
      const payload = {
        customer_id: activeCustomer?._id,
        customer_name: activeCustomer?.full_name || 'Retail Walk-in Customer',
        customer_phone: activeCustomer?.phone_number || '',
        payment_method: paymentMethod,
        discount_percent: discountPercent,
        branch_id: 'BR-CENTRAL-01',
        terminal_geo_token: {
          lat: 12.9716,
          lng: 77.5946,
          accuracy: 10.0,
          verified: true
        },
        items: cart.map(i => ({
          product_id: i._id,
          unit_price: i.unit_price,
          quantity: i.quantity,
          gst_rate: i.gst_rate,
          hsn_code: i.category_id?.hsn_sac_code || '85'
        }))
      };

      const res = await client.post('/invoices', payload);
      if (res.data && res.data.status === 'success') {
        setCompletedInvoice(res.data.invoice);
        setCompletedItems(res.data.items || cart);
        setCart([]);
        setShowReceipt(true);
        // Refresh product stocks
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Checkout failed.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.product_name.toLowerCase().includes(q) ||
           p.sku_barcode.toLowerCase().includes(q) ||
           p.category_id?.category_name?.toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      <RoleNavbar onOpenNotifications={() => setShowNotifications(true)} />
      <NotificationDrawer isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Main POS Container */}
      <div style={{ flex: 1, padding: '1.5rem 2rem', maxWidth: '1600px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.25fr 0.95fr', gap: '1.5rem' }}>
        
        {/* ── LEFT COLUMN: High-Speed Catalog & Quick Barcode Scanning ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Search & Barcode Trigger Toolbar */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #eef2f6',
            borderRadius: 18,
            padding: '1.15rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search item by name, barcode, or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '2.6rem',
                  borderRadius: 12,
                  background: '#f8fafc',
                  borderColor: '#e2e8f0',
                  color: '#0f172a'
                }}
              />
            </div>

            <button
              onClick={() => setShowScanner(true)}
              style={{
                borderRadius: 12,
                padding: '0.65rem 1.25rem',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Barcode size={18} />
              <span>Scan Barcode (F2)</span>
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await client.get('/invoices');
                  const list = Array.isArray(res.data) ? res.data : (res.data?.invoices || []);
                  const inv = list.find(i => i.invoice_no === '1384') || list[0] || {
                    invoice_no: '1384',
                    customer_name: 'Mah gondia sitaram chauraswya',
                    customer_phone: '7719975175',
                    company_name: 'VELAVAN CRACKERS',
                    subtotal: 27000,
                    other_charges: 1800,
                    packaging_charges: 405,
                    net_total: 29205,
                    total_cases: 5,
                    transport_name: 'VRL Logistics',
                    vehicle_number: 'TN 67 AB 1234',
                    amount_in_words: 'Twenty Nine Thousand Two Hundred and Five Rupees only',
                    received_amount: 0,
                    balance_amount: 29205,
                    items: [{
                      product_name: 'Red bijili 100 pcs gold bags',
                      case_content: 36,
                      brand: 'Karpagam',
                      no_of_cases: 5,
                      quantity: 180,
                      unit_price: 150,
                      line_total: 27000
                    }]
                  };
                  setCompletedInvoice(inv);
                  setShowInvoiceModal(true);
                } catch (e) {
                  setShowInvoiceModal(true);
                }
              }}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: 12,
                fontSize: '0.85rem',
                fontWeight: 700,
                background: '#f8fafc',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Open Velavan Crackers / Estimates Template (PDF 1)"
            >
              <Sparkles size={16} color="#eab308" />
              <span>View Velavan Estimate #1384</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 12, padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Catalog Grid */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #eef2f6',
            borderTop: '2px solid #06b6d4',
            borderRadius: 22,
            padding: '1.5rem',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Inventory Items ({filteredProducts.length})
              </h3>
              <span className="badge badge-primary">Dynamic GST Enabled</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '1rem',
              maxHeight: '520px',
              overflowY: 'auto',
              paddingRight: '0.25rem'
            }}>
              {filteredProducts.map(prod => {
                const isOutOfStock = prod.stock_quantity < 1;
                const isLowStock = prod.stock_quantity <= prod.reorder_level;
                return (
                  <div
                    key={prod._id}
                    onClick={() => !isOutOfStock && addToCart(prod)}
                    style={{
                      background: isOutOfStock ? '#f8fafc' : '#ffffff',
                      border: isOutOfStock ? '1px dashed #e2e8f0' : '1px solid #eef2f6',
                      borderRadius: 16,
                      padding: '1rem',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: isOutOfStock ? 0.6 : 1
                    }}
                    onMouseEnter={e => { if (!isOutOfStock) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { if (!isOutOfStock) e.currentTarget.style.transform = 'none'; }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                          {prod.sku_barcode}
                        </span>
                        <span className={`badge ${isOutOfStock ? 'badge-danger' : (isLowStock ? 'badge-warning' : 'badge-success')}`} style={{ fontSize: '0.62rem' }}>
                          {isOutOfStock ? 'Out of Stock' : `${prod.stock_quantity} in stock`}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                        {prod.product_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {prod.category_id?.category_name || 'General'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#2563eb' }}>
                        ₹{prod.unit_price.toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) addToCart(prod);
                        }}
                        disabled={isOutOfStock}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isOutOfStock ? '#f1f5f9' : '#2563eb',
                          color: isOutOfStock ? '#94a3b8' : '#ffffff',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                        }}
                        title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Active Cart, Real-Time Apriori Upsell, & Finalization ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Active Cart Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #eef2f6',
            borderTop: '2px solid #2563eb',
            borderRadius: 22,
            padding: '1.5rem',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '620px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Current Billing Matrix
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-primary">{cart.length} Line Items</span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { if (window.confirm('Clear all items from current cart?')) setCart([]); }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', color: '#ef4444', borderColor: '#fecaca', cursor: 'pointer' }}
                  >
                    Clear Cart
                  </button>
                )}
              </div>
            </div>

            {/* Customer Selector Dropdown */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                Customer / B2B Trade Buyer:
              </label>
              <select
                className="input-field"
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                style={{
                  borderRadius: 12,
                  padding: '0.55rem 0.85rem',
                  background: '#f8fafc',
                  borderColor: '#e2e8f0',
                  color: '#0f172a'
                }}
              >
                <option value="">Walk-in Retail Customer</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.full_name} (Credit: ₹{c.credit_limit} | Bal: ₹{c.current_balance})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem', minHeight: '140px' }}>
              {cart.map(item => (
                <div
                  key={item._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.85rem',
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px solid #eef2f6'
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.2 }}>
                      {item.product_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      ₹{item.unit_price} x {item.quantity} | GST {item.gst_rate}%
                    </div>
                  </div>

                  {/* Quantity Increment / Decrement Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 9999 }}>
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        style={{ border: 'none', background: 'transparent', padding: '0.25rem 0.5rem', cursor: 'pointer', color: '#94a3b8' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: 20, textAlign: 'center', color: '#0f172a' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        style={{ border: 'none', background: 'transparent', padding: '0.25rem 0.5rem', cursor: 'pointer', color: '#94a3b8' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#2563eb', minWidth: 65, textAlign: 'right' }}>
                      ₹{(item.unit_price * item.quantity).toLocaleString()}
                    </div>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <Barcode size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4, color: '#2563eb' }} />
                  Scan barcode (F2) or click inventory to populate POS cart.
                </div>
              )}
            </div>

            {/* ── APRIORI REAL-TIME CROSS-SELL RECOMMENDATIONS PILL ── */}
            {recommendations.length > 0 && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 14,
                padding: '0.85rem 1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '0.5rem' }}>
                  <Sparkles size={14} color="#2563eb" />
                  <span>AI APRIORI CROSS-SELL PROMPTS (Lift &gt; 1.2):</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  {recommendations.slice(0, 3).map(rec => {
                    const matchedProd = products.find(p => p.sku_barcode === rec.sku);
                    return (
                      <button
                        key={rec.sku}
                        onClick={() => matchedProd && addToCart(matchedProd)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #bfdbfe',
                          borderRadius: 10,
                          padding: '0.45rem 0.65rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          minWidth: '160px',
                          flexShrink: 0
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          + {rec.name}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', fontWeight: 800, marginTop: '0.2rem' }}>
                          <span>₹{rec.unit_price}</span>
                          <span style={{ color: '#10b981', fontSize: '0.68rem' }}>{rec.lift}x Lift</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Calculations & Totals Summary */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.82rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span>Taxable Subtotal:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{taxableSubtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span>Dynamic GST (CGST + SGST):</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>+ ₹{totalGST.toFixed(2)}</span>
              </div>

              {/* Payment Method Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', margin: '0.75rem 0' }}>
                {['UPI', 'CASH', 'CARD', 'CREDIT'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: '0.45rem',
                      borderRadius: 8,
                      border: paymentMethod === method ? 'none' : '1px solid #e2e8f0',
                      background: paymentMethod === method ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#f8fafc',
                      color: paymentMethod === method ? '#ffffff' : '#64748b',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      boxShadow: paymentMethod === method ? '0 2px 10px rgba(37, 99, 235, 0.3)' : 'none'
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Net Grand Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>
                    Net Amount Payable
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a' }}>
                    ₹{netGrandTotal.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loadingCheckout || cart.length === 0}
                  style={{
                    borderRadius: 14,
                    padding: '0.85rem 1.65rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#0f172a',
                    border: 'none',
                    cursor: (loadingCheckout || cart.length === 0) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 18px rgba(37, 99, 235, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loadingCheckout ? (
                    <span className="loading-spinner" style={{ width: 18, height: 18, borderTopColor: '#ffffff' }} />
                  ) : (
                    <>
                      <span>Finalize &amp; Sign</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanProduct={handleBarcodeScanned}
      />

      {/* Thermal Receipt Modal with Cryptographic SHA-256 Signature */}
      <ThermalReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        invoice={completedInvoice}
        items={completedItems}
      />

      {/* Velavan Crackers / Estimates Official Invoice Modal (PDF 1 Layout) */}
      {showInvoiceModal && completedInvoice && (
        <InvoiceViewModal
          invoice={completedInvoice}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
};

export default CashierPOS;
