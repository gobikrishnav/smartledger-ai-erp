import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiFileText, FiCheckCircle, FiClock, FiXCircle,
  FiPrinter, FiDownload, FiRefreshCw, FiSearch, FiSliders
} from 'react-icons/fi';
import client from '../api/client';
import InvoiceViewModal from '../components/InvoiceViewModal';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all, finalized, draft, cancelled
  const [search, setSearch]     = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await client.get('/invoices?limit=100');
      const list = Array.isArray(res.data) ? res.data : [];
      setInvoices(list);
    } catch (err) {
      console.error('Fetch invoices error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const totalRev = invoices
    .filter(i => {
      const s = (i.status || i.payment_status || '').toLowerCase();
      return s === 'finalized' || s === 'paid';
    })
    .reduce((s, i) => s + (i.grandTotal || i.net_total || 0), 0);

  const finalizedCount = invoices.filter(i => {
    const s = (i.status || i.payment_status || '').toLowerCase();
    return s === 'finalized' || s === 'paid';
  }).length;

  const draftCount = invoices.filter(i => {
    const s = (i.status || i.payment_status || '').toLowerCase();
    return s === 'draft' || s === 'pending';
  }).length;

  const exportCSV = () => {
    const headers = ['Invoice Number', 'Client Business', 'Status', 'Grand Total (INR)', 'Date'];
    const rows = invoices.map(inv => [
      inv.invoiceNumber || inv.invoice_no,
      `"${inv.client?.businessName || inv.clientId?.businessName || inv.customer_name || 'Retail Client'}"`,
      inv.status || inv.payment_status || 'Finalized',
      inv.grandTotal || inv.net_total || 0,
      new Date(inv.createdAt || inv.invoice_timestamp || Date.now()).toLocaleDateString('en-IN')
    ]);
    let csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'SmartLedger_AI_Invoices_Master_List.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(v || 0);

  const filteredInvoices = invoices.filter(inv => {
    const st = (inv.status || inv.payment_status || 'finalized').toLowerCase();
    if (statusFilter !== 'all') {
      if (statusFilter === 'finalized' && st !== 'finalized' && st !== 'paid') return false;
      if (statusFilter === 'draft' && st !== 'draft' && st !== 'pending') return false;
      if (statusFilter === 'cancelled' && st !== 'cancelled' && st !== 'void') return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const numMatch = (inv.invoiceNumber || inv.invoice_no || '')?.toLowerCase().includes(q);
      const custName = inv.client?.businessName || inv.clientId?.businessName || inv.customer_name || '';
      const cliMatch = custName.toLowerCase().includes(q);
      return numMatch || cliMatch;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      <style>{`
        .filter-btn {
          font-size: 0.82rem;
          font-weight: 700;
          padding: 0.5rem 1.15rem;
          border-radius: 9999px;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
          cursor: pointer;
        }
        .filter-btn.active {
          background: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
        }
        .filter-btn.inactive {
          background: #ffffff;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .filter-btn.inactive:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .inv-stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-top: 2px solid #2563eb;
          border-radius: 16px;
          padding: 1.35rem 1.5rem;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.03);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .inv-stat-card:hover {
          box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.06);
          transform: translateY(-1px);
        }
        .table-row-hover:hover {
          background: #f8fafc !important;
        }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiFileText size={18} />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Tax Invoice Master Ledger
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
            Statutory GST billing registry with automated intra/inter-state tax splitting, SHA-256 hash sealing, and A4/thermal printing.
          </p>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="btn" style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}>
            <FiPrinter /> Print List
          </button>
          <button onClick={exportCSV} className="btn" style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}>
            <FiDownload /> Export CSV
          </button>
          <button onClick={fetchInvoices} className="btn" style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}>
            <FiRefreshCw /> Refresh
          </button>
          <Link to="/invoices/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiPlus /> + Create New Invoice
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="inv-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              TOTAL INVOICES
            </span>
            <FiFileText color="#2563eb" size={17} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>{invoices.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>All registered billing transactions</div>
        </div>

        <div className="inv-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              REALIZED REVENUE
            </span>
            <FiCheckCircle color="#2563eb" size={17} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>{fmt(totalRev)}</div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, marginTop: '0.2rem' }}>{finalizedCount} finalized & settled</div>
        </div>

        <div className="inv-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              PENDING DRAFTS
            </span>
            <FiClock color="#2563eb" size={17} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>{draftCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Drafts awaiting settlement</div>
        </div>

        <div className="inv-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              AVERAGE TICKET
            </span>
            <FiSliders color="#2563eb" size={17} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
            {fmt(finalizedCount > 0 ? totalRev / finalizedCount : 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Per completed sales ticket</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16,
        marginBottom: '1.5rem', padding: '0.9rem 1.25rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setStatusFilter('all')} className={`filter-btn ${statusFilter === 'all' ? 'active' : 'inactive'}`}>
            All ({invoices.length})
          </button>
          <button onClick={() => setStatusFilter('finalized')} className={`filter-btn ${statusFilter === 'finalized' ? 'active' : 'inactive'}`}>
            Finalized ({finalizedCount})
          </button>
          <button onClick={() => setStatusFilter('draft')} className={`filter-btn ${statusFilter === 'draft' ? 'active' : 'inactive'}`}>
            Drafts ({draftCount})
          </button>
          <button onClick={() => setStatusFilter('cancelled')} className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : 'inactive'}`}>
            Cancelled ({invoices.filter(i => (i.status || i.payment_status) === 'cancelled' || (i.status || i.payment_status) === 'void').length})
          </button>
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <FiSearch style={{ position: 'absolute', top: 12, left: 12, color: '#94a3b8' }} />
          <input
            type="text"
            className="input-field"
            style={{
              margin: 0, paddingLeft: '2.4rem', fontSize: '0.85rem',
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9999
            }}
            placeholder="Search invoice # or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '35vh' }}>
          <div className="loading-spinner" style={{ width: 44, height: 44 }} />
        </div>
      ) : (
        /* Invoices Table */
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Invoice Number', 'Client Business', 'Place of Supply', 'Grand Total (₹)', 'Tax (₹)', 'Payment', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      <FiFileText size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>No Invoices Generated Yet</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>Your invoice register is clean. Click "+ Create Matrix Invoice" above to generate your first bill.</div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, idx) => {
                  const invNo = inv.invoiceNumber || inv.invoice_no || `INV-${idx + 1}`;
                  const clientName = inv.client?.businessName || inv.clientId?.businessName || inv.customer_name || 'Retail Client';
                  const grandTotal = inv.grandTotal || inv.net_total || 0;
                  const tax = inv.totalTax || inv.total_tax || 0;
                  const st = (inv.status || inv.payment_status || 'finalized').toLowerCase();
                  const isPaid = st === 'finalized' || st === 'paid';
                  const isCancelled = st === 'cancelled' || st === 'void';

                  return (
                    <tr key={inv._id || idx} className="table-row-hover" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.95rem 1.25rem', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                        {invNo}
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem', fontWeight: 600, color: '#0f172a' }}>
                        {clientName}
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
                        {inv.originStateCode || '29'} → {inv.destinationStateCode || '29'}
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem', fontWeight: 800, color: '#0f172a' }}>
                        {fmt(grandTotal)}
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem', color: '#64748b' }}>
                        {fmt(tax)}
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem', color: '#475569', fontSize: '0.82rem' }}>
                        {inv.payment_method || 'Cash / UPI'}
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <span style={{
                          background: isPaid ? '#ecfdf5' : isCancelled ? '#fef2f2' : '#eff6ff',
                          color: isPaid ? '#059669' : isCancelled ? '#dc2626' : '#2563eb',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 9999,
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          textTransform: 'capitalize'
                        }}>
                          {isPaid ? 'Finalized' : isCancelled ? 'Cancelled' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(inv.createdAt || inv.invoice_timestamp || Date.now()).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="btn"
                          style={{
                            padding: '0.35rem 0.8rem',
                            fontSize: '0.78rem',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#2563eb'
                          }}
                        >
                          View A4 / PDF
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceViewModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
};

export default Invoices;
