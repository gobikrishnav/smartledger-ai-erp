import React from 'react';
import { X, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

const NotificationDrawer = ({ isOpen, onClose }) => {
  const { stockAlerts, riskAlerts, recentLiveInvoices } = useSocket();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-end'
    }} onClick={onClose}>
      <div style={{
        width: '420px',
        maxWidth: '90vw',
        height: '100%',
        background: '#ffffff',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.08)',
        borderLeft: '1px solid #eef2f6',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
              Live Telemetry Feed
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
              Real-time stock alerts &amp; AI anomaly stream
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. Low Stock Alerts Section */}
        {stockAlerts.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={14} /> Warehouse Safety Alerts ({stockAlerts.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {stockAlerts.map((alert, i) => (
                <div key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '0.85rem', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '0.2rem' }}>
                    {alert.product_name}
                  </div>
                  <div style={{ color: '#b91c1c', fontSize: '0.76rem' }}>
                    Current Stock: <strong>{alert.stock_quantity}</strong> units (Reorder Point: {alert.reorder_level})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. AI Credit Risk Anomaly Section */}
        {riskAlerts.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} /> Isolation Forest Risk Anomaly Stream ({riskAlerts.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {riskAlerts.map((risk, i) => (
                <div key={i} style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '0.85rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, color: '#5b21b6' }}>{risk.customer_name}</span>
                    <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 800 }}>
                      Score: {risk.risk_score}
                    </span>
                  </div>
                  <div style={{ color: '#6d28d9', fontSize: '0.76rem' }}>
                    {risk.recommended_action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Recent Real-time POS Invoices */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={14} /> Recent POS Transactions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recentLiveInvoices.map((inv, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem 0.85rem', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{inv.invoice_no}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{inv.customer_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#2563eb' }}>₹{Number(inv.net_total).toFixed(2)}</div>
                  <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>✓ SHA-256 Verified</div>
                </div>
              </div>
            ))}
            {recentLiveInvoices.length === 0 && stockAlerts.length === 0 && riskAlerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                Gateway connected. Live events will appear in real time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
