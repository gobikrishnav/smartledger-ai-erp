import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  FiBookOpen, FiArrowDownRight, FiArrowUpRight, FiDollarSign,
  FiFilter, FiDownload, FiPlusCircle, FiSearch, FiRefreshCw, FiCheckCircle, FiX
} from 'react-icons/fi';

const Ledger = () => {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0, netBalance: 0, totalEntries: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New Journal Entry Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    account_name: 'Cash and Bank Balances',
    entry_type: 'DEBIT',
    amount: '',
    description: '',
    reference_no: '',
    transaction_type: 'ADJUSTMENT'
  });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState('');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (search) params.append('search', search);

      const [resEntries, resSummary] = await Promise.all([
        client.get(`/ledger?${params.toString()}`),
        client.get('/ledger/summary')
      ]);

      if (resEntries.data?.data) {
        setEntries(resEntries.data.data.entries || []);
        setTotalPages(resEntries.data.data.totalPages || 1);
      }
      if (resSummary.data?.data) {
        setSummary(resSummary.data.data);
      }
    } catch (err) {
      console.error('Error fetching ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [page, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLedger();
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        account_name: formData.account_name,
        debit: formData.entry_type === 'DEBIT' ? Number(formData.amount) : 0,
        credit: formData.entry_type === 'CREDIT' ? Number(formData.amount) : 0,
        transaction_type: formData.transaction_type,
        reference_no: formData.reference_no || `ADJ-${Date.now().toString().slice(-6)}`,
        description: formData.description
      };

      await client.post('/ledger/entry', payload);

      setShowModal(false);
      setFormData({
        account_name: 'Cash and Bank Balances',
        entry_type: 'DEBIT',
        amount: '',
        description: '',
        reference_no: '',
        transaction_type: 'ADJUSTMENT'
      });
      setNotification('Journal entry successfully posted to immutable ledger.');
      setTimeout(() => setNotification(''), 4000);
      fetchLedger();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (!entries.length) return;
    const headers = ['Entry ID', 'Date', 'Reference No', 'Transaction Type', 'Account', 'Description', 'Debit', 'Credit', 'Balance', 'Created By'];
    const rows = entries.map(e => [
      e.entry_id,
      new Date(e.date).toISOString().split('T')[0],
      e.reference_no,
      e.transaction_type,
      `"${e.account_name}"`,
      `"${e.description}"`,
      e.debit,
      e.credit,
      e.running_balance,
      e.created_by
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartLedger_General_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', padding: '0.6rem', borderRadius: '12px', color: '#ffffff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
              <FiBookOpen size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>
                General Financial Ledger
              </h1>
              <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
                Cryptographically audited, double-entry immutable accounting matrix with SHA-256 validation.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportCSV} className="btn btn-secondary">
            <FiDownload size={16} /> Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <FiPlusCircle size={16} /> Post Journal Entry
          </button>
        </div>
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

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderTop: '2px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>TOTAL DEBITS</span>
            <FiArrowDownRight size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.5rem', color: '#10b981' }}>
            ₹{Number(summary.totalDebit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Gross debited inflows & expenses</div>
        </div>

        <div className="card" style={{ borderTop: '2px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>TOTAL CREDITS</span>
            <FiArrowUpRight size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.5rem', color: '#ef4444' }}>
            ₹{Number(summary.totalCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Revenue & credit postings</div>
        </div>

        <div className="card" style={{ borderTop: '2px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>RUNNING LIQUIDITY BALANCE</span>
            <FiDollarSign size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.5rem', color: '#38bdf8' }}>
            ₹{Number(summary.netBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Cumulative net ledger position</div>
        </div>

        <div className="card" style={{ borderTop: '2px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>LEDGER RECORD COUNT</span>
            <FiBookOpen size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.4rem', color: '#0f172a' }}>
            {summary.totalEntries || entries.length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>All transactions locked with SHA-256 guard</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{
        padding: '1rem 1.25rem', marginBottom: '1.5rem',
        display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <FiSearch size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search reference, account or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ margin: 0, paddingLeft: '2.4rem', fontSize: '0.85rem' }}
            />
          </div>
        </form>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'INVOICE', 'PAYMENT', 'PURCHASE', 'EXPENSE', 'ADJUSTMENT'].map(type => (
            <button
              key={type}
              onClick={() => { setTypeFilter(type); setPage(1); }}
              className={`btn ${typeFilter === type ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Date & Entry ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Account</th>
                <th style={{ padding: '0.85rem 1rem' }}>Reference</th>
                <th style={{ padding: '0.85rem 1rem' }}>Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Description</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Debit (₹)</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Credit (₹)</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto', display: 'block' }}></div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No ledger entries found matching current filter parameters.
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr
                    key={entry._id || idx}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
                  >
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>
                        {new Date(entry.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {entry.entry_id}
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: '600', color: '#cbd5e1' }}>
                      {entry.account_name}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8' }}>
                      {entry.reference_no}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        {entry.transaction_type}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: '#94a3b8', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.description}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: '700', color: entry.debit ? '#10b981' : '#64748b' }}>
                      {entry.debit ? `₹${Number(entry.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: '700', color: entry.credit ? '#ef4444' : '#64748b' }}>
                      {entry.credit ? `₹${Number(entry.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                      ₹{Number(entry.running_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', background: '#ffffff'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Page {page} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal for manual journal entry */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Post Manual Journal Entry</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><FiX /></button>
            </div>
            <form onSubmit={handleCreateEntry}>
              <div className="form-group">
                <label className="form-label">Account Category</label>
                <select
                  className="input-field"
                  value={formData.account_name}
                  onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                >
                  <option value="Cash and Bank Balances">Cash and Bank Balances</option>
                  <option value="Accounts Receivable (Debtors)">Accounts Receivable (Debtors)</option>
                  <option value="Accounts Payable (Creditors)">Accounts Payable (Creditors)</option>
                  <option value="GST Input Tax Credit Pool">GST Input Tax Credit Pool</option>
                  <option value="GST Output Liability Pool">GST Output Liability Pool</option>
                  <option value="Operating Revenue">Operating Revenue</option>
                  <option value="Cost of Goods Sold (COGS)">Cost of Goods Sold (COGS)</option>
                  <option value="Operating Expenses">Operating Expenses</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Entry Type</label>
                  <select
                    className="input-field"
                    value={formData.entry_type}
                    onChange={e => setFormData({ ...formData, entry_type: e.target.value })}
                  >
                    <option value="DEBIT">DEBIT (Inflow / Asset / Exp)</option>
                    <option value="CREDIT">CREDIT (Outflow / Rev / Liab)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    className="input-field"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reference ID (Invoice/Cheque #)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. INV-2026-0045"
                  value={formData.reference_no}
                  onChange={e => setFormData({ ...formData, reference_no: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Narration</label>
                <textarea
                  className="input-field"
                  rows="3"
                  required
                  placeholder="Auditable business justification..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              >
                {submitting ? 'Cryptographically Signing...' : 'Commit to Immutable Ledger'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
