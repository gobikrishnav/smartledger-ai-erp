import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiExternalLink, FiCheckCircle, FiCamera, FiLayers } from 'react-icons/fi';

const IMPLEMENTATION_VIEWS = [
  {
    id: 1,
    category: 'Core ERP modules',
    title: 'Login / registration with role selection',
    description: 'Role selector (Business Owner, Warehouse Manager, Cashier), showing JWT authentication flow',
    path: '/login',
    actionText: 'Open Login'
  },
  {
    id: 2,
    category: 'Core ERP modules',
    title: 'Executive dashboard',
    description: 'KPI stat cards, gross revenue trends, recent invoices, and high-level ERP health metrics',
    path: '/dashboard',
    actionText: 'Open Dashboard'
  },
  {
    id: 3,
    category: 'Core ERP modules',
    title: 'POS billing terminal (Empty Cart)',
    description: 'High-speed cashier POS interface with empty cart state, quick barcode scanner trigger',
    path: '/pos',
    actionText: 'Open POS (Empty)'
  },
  {
    id: 4,
    category: 'Core ERP modules',
    title: 'POS cart with items added & dynamic CGST/SGST',
    description: 'Cart with crackers products, dynamic CGST/SGST calculation, and payment mode selector',
    path: '/pos',
    actionText: 'Open POS Cart'
  },
  {
    id: 5,
    category: 'Core ERP modules',
    title: 'Generated invoice / thermal QR receipt (Velavan Crackers layout)',
    description: 'Official estimate/invoice (#1384, Mah gondia, cases, charges, words) + Thermal QR receipt',
    path: '/invoices',
    actionText: 'Open Invoices (#1384)'
  },
  {
    id: 6,
    category: 'Core ERP modules',
    title: 'Invoice ledger list (Draft / Finalized / Paid statuses)',
    description: 'Invoice master table displaying Draft, Finalized, and Paid status badges with filter tabs',
    path: '/invoices',
    actionText: 'Open Invoice Ledger'
  },
  {
    id: 7,
    category: 'Core ERP modules',
    title: 'General ledger entries (Dr/Cr posted after sale)',
    description: 'Double-entry ledger showing Debit (Cash/Bank) and Credit (Sales, Freight, Packaging) after Invoice 1384',
    path: '/ledger',
    actionText: 'Open General Ledger'
  },
  {
    id: 8,
    category: 'Tax and inventory',
    title: 'GST engine with the tax simulator',
    description: 'Live interactive GST calculator, HSN directory, intra/inter state CGST/SGST/IGST breakdown',
    path: '/tax-engine',
    actionText: 'Open GST Engine'
  },
  {
    id: 9,
    category: 'Tax and inventory',
    title: 'Exported GSTR-1 JSON or HSN CSV file opened (Proof of Output)',
    description: 'Click "Open Exported GSTR-1 JSON (Proof)" or "Open Exported HSN CSV (Proof)" in the toolbar',
    path: '/tax-engine',
    actionText: 'Open File Proof Viewer'
  },
  {
    id: 10,
    category: 'Tax and inventory',
    title: 'Inventory & catalog',
    description: '185 Sivakasi crackers products catalog with case content, brand, stock levels, and HSN 3604',
    path: '/inventory',
    actionText: 'Open Catalog'
  },
  {
    id: 11,
    category: 'Tax and inventory',
    title: 'Low-stock alert / restock workflow with AI velocity',
    description: 'Automated reorder triggers, stockout velocity days remaining, and one-click restock PO',
    path: '/inventory',
    actionText: 'Open Restock Alerts'
  },
  {
    id: 12,
    category: 'AI modules',
    title: 'Isolation Forest: Console / Jupyter Output',
    description: 'Input feature vector [Amt, Disc, Items, ΔTime, Hour] and the resulting anomaly score',
    path: '/ai-evaluation',
    actionText: 'Open Feature Vector Console'
  },
  {
    id: 13,
    category: 'AI modules',
    title: 'B2B customers credit risk matrix with risk scores',
    description: 'Customer creditworthiness matrix with risk score badges (Low/Medium/High risk categories)',
    path: '/clients',
    actionText: 'Open Credit Risk Matrix'
  },
  {
    id: 14,
    category: 'AI modules',
    title: 'Isolation Forest evaluation: Score distribution & F1 / Confusion matrix',
    description: 'Anomaly score distribution plot histogram, F1-Score 0.953, and 2x2 confusion matrix (TP, FP, FN, TN)',
    path: '/ai-evaluation',
    actionText: 'Open F1 & Confusion Matrix'
  },
  {
    id: 15,
    category: 'AI modules',
    title: 'LSTM cash-flow: 24-month forecast graph with confidence bounds',
    description: 'Interactive AreaChart showing 24 months forward revenue with upper and lower confidence bounds',
    path: '/analytics',
    actionText: 'Open Cash-Flow Forecast'
  },
  {
    id: 16,
    category: 'AI modules',
    title: 'LSTM training loss curve with final RMSE value',
    description: 'Epochs 1-100 training and validation loss curve with final RMSE = ₹1,420.45',
    path: '/ai-evaluation',
    actionText: 'Open LSTM Loss Curve'
  },
  {
    id: 17,
    category: 'AI modules',
    title: 'Market basket analysis: Apriori rules & POS suggestions',
    description: 'Apriori frequent itemsets (support, confidence, lift) and "frequently billed together" POS suggestions',
    path: '/analytics',
    actionText: 'Open Market Basket Rules'
  },
  {
    id: 18,
    category: 'System and integration',
    title: 'Real-time WebSocket alert popup & Admin ML model health',
    description: 'Live WebSocket toast alert popup + Admin panel with model metrics (F1/RMSE) and retrain button',
    path: '/ai-evaluation',
    actionText: 'Open WebSocket & Admin ML'
  }
];

const ScreenshotGuideModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
    }} onClick={onClose}>
      
      <div style={{
        background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: '1000px',
        maxHeight: '92vh', overflowY: 'auto', border: '1px solid #cbd5e1',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)', color: '#0f172a'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#ffffff', zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#2563eb', color: '#ffffff', padding: '0.5rem', borderRadius: 8 }}>
                <FiCamera size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                18 Implementation Screenshot Pages &amp; Direct Links
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Click any item below to navigate directly to the exact page and take screenshots for your report or submission.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '50%',
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b'
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* List of 18 Views */}
        <div style={{ padding: '1.5rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            {IMPLEMENTATION_VIEWS.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem 1.25rem', borderRadius: 12, border: '1px solid #e2e8f0',
                  background: item.id <= 7 ? '#f8fafc' : (item.id <= 11 ? '#f0fdf4' : (item.id <= 17 ? '#eff6ff' : '#faf5ff')),
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#0f172a', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0
                  }}>
                    {item.id}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        [{item.category}]
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{item.title}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                      {item.description}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    navigate(item.path);
                  }}
                  style={{
                    background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8,
                    padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', marginLeft: '1rem',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <span>{item.actionText}</span>
                  <FiExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ScreenshotGuideModal;
