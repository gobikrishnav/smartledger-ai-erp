import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  FiFileText, FiDownload, FiCalendar, FiFilter, FiTrendingUp,
  FiBox, FiUsers, FiDollarSign, FiRefreshCw
} from 'react-icons/fi';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales'); // sales, gst, inventory, customers
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await client.get(`/reports/${activeTab}?${params.toString()}`);

      if (res.data?.data) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const downloadCSV = () => {
    const params = new URLSearchParams({ format: 'csv' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const downloadUrl = `/api/reports/${activeTab}?${params.toString()}`;
    window.open(downloadUrl, '_blank');
  };

  const downloadJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartLedger_${activeTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', padding: '0.65rem', borderRadius: '12px', color: '#ffffff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
            <FiFileText size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>
              Executive & Statutory Reports
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
              Compliant GSTR-1, sales realization, inventory valuation, and aging schedules
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={downloadJSON} className="btn btn-secondary">
            <FiDownload size={16} /> Export JSON
          </button>
          <button onClick={downloadCSV} className="btn btn-primary">
            <FiDownload size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {[
          { id: 'sales', label: 'Sales & Realization', icon: FiTrendingUp },
          { id: 'gst', label: 'GST Statutory (GSTR-1)', icon: FiFileText },
          { id: 'inventory', label: 'Inventory Valuation', icon: FiBox },
          { id: 'customers', label: 'Receivables & Aging', icon: FiUsers },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.55rem 1.15rem' }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Range Selector */}
      {(activeTab === 'sales' || activeTab === 'gst') && (
        <div className="card" style={{
          padding: '1rem 1.25rem', marginBottom: '1.5rem',
          display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <FiCalendar size={16} color="var(--accent-purple)" /> <span>From:</span>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <span>To:</span>
            <input
              type="date"
              className="input-field"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            />
          </div>

          <button onClick={fetchReport} className="btn btn-primary" style={{ padding: '0.5rem 1.15rem', fontSize: '0.85rem' }}>
            Filter Records
          </button>
        </div>
      )}

      {/* Report Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem auto', display: 'block' }}></div>
          Compiling enterprise report data...
        </div>
      ) : !reportData ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          No data available for selected criteria.
        </div>
      ) : (
        <div>
          {/* TAB 1: SALES REPORT */}
          {activeTab === 'sales' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ borderTop: '2px solid #10b981' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL REVENUE</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #2563eb' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>TAX COLLECTED</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.totalTaxCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #38bdf8' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL INVOICES</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>
                    {reportData.summary?.invoiceCount || 0}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #ef4444' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>AVG TICKET SIZE</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.averageTicketSize || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Invoice No</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Method</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Subtotal</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Tax</th>
                        <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.invoices || []).map((inv, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <td style={{ padding: '0.9rem 1.25rem', fontWeight: '700', color: '#38bdf8', fontFamily: 'monospace' }}>
                            {inv.invoice_number}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>
                            {new Date(inv.date).toLocaleDateString('en-IN')}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>
                            {inv.customer_name || 'Retail Client'}
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span className="badge badge-secondary">{inv.payment_method}</span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                            ₹{Number(inv.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right', color: '#2563eb' }}>
                            ₹{Number(inv.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                            ₹{Number(inv.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GSTR-1 STATUTORY REPORT */}
          {activeTab === 'gst' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ borderTop: '2px solid #38bdf8' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>TAXABLE TURNOVER</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.totalTaxable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #10b981' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>CGST OUTPUT</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.totalCGST || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #10b981' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>SGST OUTPUT</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.totalSGST || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #475569' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>IGST INTER-STATE</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.totalIGST || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>GSTIN</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Recipient Name</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Invoice #</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Supply Place</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Taxable Value</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>IGST</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>CGST</th>
                        <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>SGST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.b2bInvoices || []).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <td style={{ padding: '0.9rem 1.25rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                            {row.gstin}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>{row.recipient_name}</td>
                          <td style={{ padding: '0.9rem 1rem', fontFamily: 'monospace', color: '#38bdf8' }}>{row.invoice_number}</td>
                          <td style={{ padding: '0.9rem 1rem' }}>{row.place_of_supply}</td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                            ₹{Number(row.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right', color: '#2563eb' }}>
                            ₹{Number(row.igst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right', color: '#10b981' }}>
                            ₹{Number(row.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', color: '#10b981' }}>
                            ₹{Number(row.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY VALUATION */}
          {activeTab === 'inventory' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ borderTop: '2px solid #10b981' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL ASSET VALUE</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.totalAssetValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #38bdf8' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL ITEMS IN STOCK</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>
                    {reportData.summary?.totalItemsInStock || 0}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #ef4444' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>LOW STOCK ITEMS</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f87171', marginTop: '0.4rem' }}>
                    {reportData.summary?.lowStockCount || 0}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>SKU</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Product Name</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>On Hand</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Total Asset Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.valuationList || []).map((prod, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <td style={{ padding: '0.9rem 1.25rem', fontFamily: 'monospace', color: '#38bdf8' }}>{prod.sku}</td>
                          <td style={{ padding: '0.9rem 1rem', fontWeight: '600' }}>{prod.name}</td>
                          <td style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>{prod.category}</td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: '700' }}>{prod.stock_qty}</td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                            ₹{Number(prod.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>
                            ₹{Number(prod.total_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RECEIVABLES AGING */}
          {activeTab === 'customers' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ borderTop: '2px solid #ef4444' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL RECEIVABLES</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f87171', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.totalReceivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #f59e0b' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>OVERDUE &gt; 30 DAYS</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fbbf24', marginTop: '0.4rem' }}>
                    ₹{Number(reportData.summary?.overdue30Days || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '2px solid #38bdf8' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>DEBTORS MONITORED</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>
                    {reportData.summary?.debtorCount || 0}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Debtor Business</th>
                        <th style={{ padding: '0.85rem 1rem' }}>GSTIN</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Current (0-30)</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>31-60 Days</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>61-90 Days</th>
                        <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>90+ Days Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.agingSchedule || []).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <td style={{ padding: '0.9rem 1.25rem', fontWeight: '700' }}>{row.name}</td>
                          <td style={{ padding: '0.9rem 1rem', fontFamily: 'monospace', color: '#94a3b8' }}>{row.gstin}</td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                            ₹{Number(row.bucket_current || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                            ₹{Number(row.bucket_30_60 || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right', color: '#fbbf24' }}>
                            ₹{Number(row.bucket_60_90 || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: '800', color: '#f87171' }}>
                            ₹{Number(row.bucket_90_plus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
