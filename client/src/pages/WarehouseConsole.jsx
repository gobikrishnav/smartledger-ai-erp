import React, { useState, useEffect } from 'react';
import {
  Box, AlertTriangle, CheckCircle, RefreshCw, PlusCircle,
  Truck, ArrowDownRight, ArrowUpRight, Calendar, Search,
  Filter, FileText, Send, ShieldAlert, Check, X, Clock, Layers
} from 'lucide-react';
import client from '../api/client';
import RoleNavbar from '../components/RoleNavbar';
import NotificationDrawer from '../components/NotificationDrawer';
import { useSocket } from '../contexts/SocketContext';

const WarehouseConsole = () => {
  const { stockAlerts } = useSocket();
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [expiryAudit, setExpiryAudit] = useState({ expired: [], near_expiry: [], safe: [] });
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [showGRNModal, setShowGRNModal] = useState(false);

  const [grnForm, setGrnForm] = useState({
    product_id: '',
    batch_number: '',
    inward_quantity: 1,
    unit_cost: 0,
    mfg_date: new Date().toISOString().slice(0, 10),
    expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    supplier_name: ''
  });

  const [notificationMsg, setNotificationMsg] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotificationMsg({ msg, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      const [prodRes, poRes, expiryRes] = await Promise.all([
        client.get('/inventory/products'),
        client.get('/po'),
        client.get('/inventory/expiry-audit')
      ]);

      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setPurchaseOrders(Array.isArray(poRes.data) ? poRes.data : []);
      if (expiryRes.data) {
        setExpiryAudit(expiryRes.data);
      }
    } catch (err) {
      console.error('Error loading warehouse data:', err);
      showToast('Failed to load warehouse inventory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  useEffect(() => {
    if (stockAlerts.length > 0) {
      showToast('Low stock alert received for catalog item.', 'warning');
      fetchWarehouseData();
    }
  }, [stockAlerts]);

  const handleRecordGRN = async (e) => {
    e.preventDefault();
    if (!grnForm.product_id) {
      showToast('Please select a product for the shipment.', 'error');
      return;
    }
    try {
      await client.post('/inventory/grn', {
        product_id: grnForm.product_id,
        batch_number: grnForm.batch_number || ('BATCH-' + Date.now().toString().slice(-6)),
        inward_quantity: Number(grnForm.inward_quantity),
        manufacturing_date: grnForm.mfg_date,
        expiry_date: grnForm.expiry_date,
        unit_cost: Number(grnForm.unit_cost)
      });
      showToast('Goods Received Note (GRN) logged! Inventory updated.');
      setShowGRNModal(false);
      fetchWarehouseData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to record GRN.', 'error');
    }
  };

  const handleAutoDispatchPO = async (product) => {
    try {
      const qty = Math.max(50, (product.reorder_level * 2) - product.current_stock);
      const res = await client.post('/po/auto-dispatch', {
        product_id: product._id,
        reorder_quantity: qty,
        supplier_name: 'Priority Wholesale Direct Ltd'
      });
      showToast('PO auto-dispatched for ' + product.product_name + '!');
      fetchWarehouseData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Auto PO dispatch failed.', 'error');
    }
  };

  const handleMarkPOReceived = async (po) => {
    try {
      await client.put('/po/' + po._id + '/status', { status: 'RECEIVED' });
      await client.post('/inventory/grn', {
        product_id: po.product_id._id || po.product_id,
        batch_number: 'GRN-PO-' + po.po_number.slice(-6),
        inward_quantity: po.reorder_quantity,
        expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
        unit_cost: (po.product_id.unit_price || 100) * 0.75
      });
      showToast('PO ' + po.po_number + ' received & added to live stock.');
      fetchWarehouseData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update PO status.', 'error');
    }
  };

  const lowStockCount = products.filter(p => p.current_stock <= p.reorder_level).length;
  const expiredCount = (expiryAudit.expired || []).length;
  const nearExpiryCount = (expiryAudit.near_expiry || []).length;
  const activePOCount = purchaseOrders.filter(po => po.status === 'PENDING' || po.status === 'DISPATCHED').length;

  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku_barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category_id?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      <RoleNavbar onOpenNotifications={() => setShowNotifications(true)} />
      <NotificationDrawer isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {notificationMsg && (
        <div style={{
          position: 'fixed',
          top: 76,
          right: 24,
          zIndex: 100,
          background: notificationMsg.type === 'error' ? '#ef4444' : (notificationMsg.type === 'warning' ? '#f59e0b' : '#10b981'),
          color: '#0f172a',
          padding: '0.75rem 125rem',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: '0.88rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {notificationMsg.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span>{notificationMsg.msg}</span>
        </div>
      )}

      <main style={{ flex: 1, padding: '1.75rem 2.25rem', maxWidth: 1600, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                Warehouse &amp; Inventory Terminal
              </h1>
              <span style={{
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: 9999,
                letterSpacing: '0.04em'
              }}>
                CENTRAL DEPOT (WH-01)
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Real-time batch tracking, shelf-life audits, and automated supplier procurement orders.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={fetchWarehouseData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.6rem 1rem',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                if (products.length > 0) {
                  setGrnForm(prev => ({
                    ...prev,
                    product_id: products[0]._id,
                    batch_number: 'BATCH-' + Date.now().toString().slice(-6)
                  }));
                }
                setShowGRNModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                padding: '0.6rem 1.15rem',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)'
              }}
            >
              <PlusCircle size={16} />
              <span>Inward Shipment (GRN)</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderTop: '2px solid #06b6d4', borderRadius: 12, padding: '1.15rem 1.25rem', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <span>TOTAL ACTIVE SKUS</span>
              <Box size={18} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
              {products.length}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Check size={13} /> 100% Barcode Catalogued
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #eef2f6',
            borderTop: '2px solid #f59e0b',
            borderRadius: 12,
            padding: '1.15rem 1.25rem',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <span>BELOW REORDER LEVEL</span>
              <AlertTriangle size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: lowStockCount > 0 ? '#f59e0b' : '#ffffff' }}>
              {lowStockCount}
            </div>
            <div style={{ fontSize: '0.74rem', color: lowStockCount > 0 ? '#f59e0b' : '#94a3b8', fontWeight: 600, marginTop: '0.35rem' }}>
              {lowStockCount > 0 ? 'Requires immediate restock' : 'All SKUs above safety buffer'}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #eef2f6',
            borderTop: '2px solid #ef4444',
            borderRadius: 12,
            padding: '1.15rem 1.25rem',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: expiredCount > 0 ? '#f87171' : '#94a3b8', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <span>BATCH EXPIRY AUDIT</span>
              <ShieldAlert size={18} color={expiredCount > 0 ? '#ef4444' : '#f59e0b'} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: expiredCount > 0 ? '#f87171' : '#ffffff' }}>
              {expiredCount} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>/ {nearExpiryCount} Near</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: expiredCount > 0 ? '#f87171' : '#94a3b8', fontWeight: 600, marginTop: '0.35rem' }}>
              {expiredCount > 0 ? 'Expired items flagged for write-off' : 'Next audit cycle active'}
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderTop: '2px solid #2563eb', borderRadius: 12, padding: '1.15rem 1.25rem', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <span>ACTIVE PURCHASE ORDERS</span>
              <Truck size={18} color="#2563eb" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
              {activePOCount}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginTop: '0.35rem' }}>
              In-transit from primary distributors
            </div>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #eef2f6',
          borderRadius: 12,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'inventory' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                color: activeTab === 'inventory' ? '#ffffff' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: activeTab === 'inventory' ? '0 4px 15px rgba(37, 99, 235, 0.25)' : 'none'
              }}
            >
              <Layers size={15} />
              <span>SKU Inventory ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('expiry')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'expiry' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                color: activeTab === 'expiry' ? '#ffffff' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: activeTab === 'expiry' ? '0 4px 15px rgba(37, 99, 235, 0.25)' : 'none'
              }}
            >
              <Clock size={15} />
              <span>Expiry &amp; Batch Audits ({expiredCount + nearExpiryCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'orders' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                color: activeTab === 'orders' ? '#ffffff' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: activeTab === 'orders' ? '0 4px 15px rgba(37, 99, 235, 0.25)' : 'none'
              }}
            >
              <Truck size={15} />
              <span>Procurement POs ({purchaseOrders.length})</span>
            </button>
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search SKU, name, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.1rem',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            />
          </div>
        </div>

        {activeTab === 'inventory' && (
          <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Product &amp; SKU</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Batch No.</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Current Stock</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Reorder Level</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Stock Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Unit Price</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isLow = p.current_stock <= p.reorder_level;
                    const isZero = p.current_stock === 0;
                    return (
                      <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.product_name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {p.sku_barcode}
                          </div>
                        </td>

                        <td style={{ padding: '0.9rem 1rem', color: '#cbd5e1', fontWeight: 600 }}>
                          {p.category_id?.name || 'General'}
                        </td>

                        <td style={{ padding: '0.9rem 1rem', fontFamily: 'monospace', fontSize: '0.76rem', color: '#94a3b8' }}>
                          {p.batch_number || 'BATCH-STD-01'}
                        </td>

                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span style={{
                            fontWeight: 900,
                            fontSize: '0.95rem',
                            color: isZero ? '#ef4444' : (isLow ? '#f59e0b' : '#ffffff')
                          }}>
                            {p.current_stock}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 4 }}>units</span>
                        </td>

                        <td style={{ padding: '0.9rem 1rem', color: '#94a3b8', fontWeight: 600 }}>
                          {p.reorder_level} units
                        </td>

                        <td style={{ padding: '0.9rem 1rem' }}>
                          {isZero ? (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.25rem 0.6rem', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 800 }}>
                              DEPLETED
                            </span>
                          ) : isLow ? (
                            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.25rem 0.6rem', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 800 }}>
                              LOW STOCK
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.25rem 0.6rem', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 800 }}>
                              OPTIMAL
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                          ₹{Number(p.unit_price).toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                            <button
                              onClick={() => {
                                setGrnForm(prev => ({
                                  ...prev,
                                  product_id: p._id,
                                  batch_number: 'BATCH-' + Date.now().toString().slice(-6)
                                }));
                                setShowGRNModal(true);
                              }}
                              title="Record Inward GRN"
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                color: '#0f172a',
                                padding: '0.35rem 0.65rem',
                                borderRadius: 6,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              + GRN
                            </button>

                            {isLow && (
                              <button
                                onClick={() => handleAutoDispatchPO(p)}
                                title="1-Click Auto Dispatch PO"
                                style={{
                                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                  border: 'none',
                                  color: '#ffffff',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: 6,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                                }}
                              >
                                Auto PO
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expiry' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderTop: '2px solid #f59e0b', borderRadius: 12, padding: '1.25rem', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Clock size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>
                  Near Expiry Batches (&lt;30 Days)
                </h3>
              </div>
              {(expiryAudit.near_expiry || []).length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No batches approaching expiry within the 30-day window.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {expiryAudit.near_expiry.map(item => (
                    <div key={item._id} style={{ background: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{item.product_name}</div>
                        <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 800 }}>
                          NEAR EXPIRY
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                        Batch: <strong style={{ color: '#0f172a' }}>{item.batch_number}</strong> | On Hand: <strong style={{ color: '#0f172a' }}>{item.current_stock} units</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, marginTop: '0.2rem' }}>
                        Expiry Date: {new Date(item.expiry_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderTop: '2px solid #ef4444', borderRadius: 12, padding: '1.25rem', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ShieldAlert size={18} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f87171' }}>
                  Expired Batches (Flagged For Disposal)
                </h3>
              </div>
              {(expiryAudit.expired || []).length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Zero expired inventory items detected. Safe inventory standing.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {expiryAudit.expired.map(item => (
                    <div key={item._id} style={{ background: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{item.product_name}</div>
                        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 800 }}>
                          EXPIRED
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                        Batch: <strong style={{ color: '#0f172a' }}>{item.batch_number}</strong> | On Hand: <strong style={{ color: '#0f172a' }}>{item.current_stock} units</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700, marginTop: '0.2rem' }}>
                        Expired on: {new Date(item.expiry_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>PO Number</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Product / SKU</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Supplier</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Order Qty</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Estimated Cost</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Receive &amp; Restock</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                        No purchase orders recorded yet. Low-stock products can trigger automated POs.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.9rem 1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#2563eb' }}>
                          {po.po_id || po.po_number}
                        </td>

                        <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                          {Array.isArray(po.items) && po.items.length > 0 ? (
                            <span>{po.items.length} Low-Stock SKUs ({po.items[0].product_name}...)</span>
                          ) : (
                            <span>{po.product_id?.product_name || 'Catalog Restock Item'}</span>
                          )}
                        </td>

                        <td style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>
                          {po.supplier_name || 'Priority Wholesale Direct Ltd'}
                        </td>

                        <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                          {Array.isArray(po.items) && po.items.length > 0
                            ? po.items.reduce((sum, it) => sum + (it.quantity_ordered || 0), 0)
                            : (po.reorder_quantity || 0)} units
                        </td>

                        <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#38bdf8' }}>
                          ₹{Number(po.total_estimated_cost || po.estimated_total_cost || 0).toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span style={{
                            background: po.status === 'RECEIVED' ? 'rgba(16, 185, 129, 0.15)' : (po.status === 'DISPATCHED' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                            color: po.status === 'RECEIVED' ? '#34d399' : (po.status === 'DISPATCHED' ? '#818cf8' : '#fbbf24'),
                            padding: '0.25rem 0.6rem',
                            borderRadius: 9999,
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            {po.status}
                          </span>
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                          {po.status !== 'RECEIVED' ? (
                            <button
                              onClick={() => handleMarkPOReceived(po)}
                              style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                border: 'none',
                                color: '#ffffff',
                                padding: '0.35rem 0.75rem',
                                borderRadius: 6,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                              }}
                            >
                              Receive (GRN)
                            </button>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Check size={14} /> Stock Added
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showGRNModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 11, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 90,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 520,
            padding: '1.75rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderTop: '2px solid #2563eb',
            color: '#0f172a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                  Log Goods Received Note (GRN)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Receive inbound truck delivery and register batch metadata into ERP inventory.
                </p>
              </div>
              <button
                onClick={() => setShowGRNModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordGRN}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  SELECT PRODUCT / SKU
                </label>
                <select
                  value={grnForm.product_id}
                  onChange={(e) => setGrnForm({ ...grnForm, product_id: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: '0.85rem',
                    background: '#f8fafc',
                    color: '#0f172a'
                  }}
                >
                  <option value=''>-- Choose Catalog SKU --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.product_name} ({p.sku_barcode}) - Stock: {p.current_stock}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    BATCH IDENTIFIER
                  </label>
                  <input
                    type='text'
                    value={grnForm.batch_number}
                    onChange={(e) => setGrnForm({ ...grnForm, batch_number: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    INWARD QUANTITY
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={grnForm.inward_quantity}
                    onChange={(e) => setGrnForm({ ...grnForm, inward_quantity: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    UNIT COST (₹)
                  </label>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={grnForm.unit_cost}
                    onChange={(e) => setGrnForm({ ...grnForm, unit_cost: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    BATCH EXPIRY DATE
                  </label>
                  <input
                    type='date'
                    value={grnForm.expiry_date}
                    onChange={(e) => setGrnForm({ ...grnForm, expiry_date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type='button'
                  onClick={() => setShowGRNModal(false)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#94a3b8',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    color: '#0f172a',
                    padding: '0.65rem 1.5rem',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  Record Inward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseConsole;

