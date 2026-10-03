import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiTrendingUp, FiDollarSign, FiBox, FiFileText,
  FiArrowRight, FiActivity, FiDownload, FiPlusCircle, FiMaximize2,
  FiAlertCircle, FiShoppingCart, FiPackage, FiPercent, FiRefreshCw
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { business, currencySymbol, formatCurrency, openWizard, isOnboarded } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);

  // Dynamic monthly revenue calculated from live invoices
  const [monthlyRevenue, setMonthlyRevenue] = useState(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonth = new Date().getMonth();
    const list = [];
    for (let i = 11; i >= 0; i--) {
      const idx = (curMonth - i + 12) % 12;
      list.push({ month: monthNames[idx], revenue: 0, units: 0 });
    }
    return list;
  });

  const topProducts = catalogProducts.slice(0, 5).map((p, idx) => {
    let soldCount = 0;
    let revTotal = 0;
    recentInvoices.forEach(inv => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach(it => {
          if (String(it.productId || it.product_id) === String(p._id || p.id) || it.name === p.name || it.productName === p.product_name) {
            soldCount += (it.quantity || 1);
            revTotal += ((it.unitPrice || it.unit_price || p.unit_price || 0) * (it.quantity || 1)) / 100000;
          }
        });
      }
    });

    return {
      name: p.product_name || p.name,
      sku: p.sku || `SKU-00${idx + 1}`,
      sold: soldCount,
      revenue: Number(revTotal.toFixed(2)),
      trend: soldCount > 0 ? '+100%' : 'Active'
    };
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, invRes, prodRes] = await Promise.all([
          client.get('/admin/stats').catch(() => ({ data: {} })),
          client.get('/invoices?limit=100').catch(() => ({ data: [] })),
          client.get('/products').catch(() => ({ data: [] }))
        ]);
        const invoicesList = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.invoices || []);
        const productsList = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
        setStats(statsRes.data || {});
        setRecentInvoices(invoicesList);
        setCatalogProducts(productsList);

        // Compute monthly revenue dynamically from invoices
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const curMonth = new Date().getMonth();
        const mRevMap = {};
        for (let i = 11; i >= 0; i--) {
          const idx = (curMonth - i + 12) % 12;
          mRevMap[monthNames[idx]] = { month: monthNames[idx], revenue: 0, units: 0 };
        }

        invoicesList.forEach(inv => {
          if (inv.status !== 'cancelled' && inv.payment_status !== 'VOID') {
            const date = new Date(inv.invoice_timestamp || inv.createdAt || inv.created_at || Date.now());
            const mName = monthNames[date.getMonth()];
            if (mRevMap[mName]) {
              const rev = (inv.grandTotal || inv.net_total || 0) / 100000;
              mRevMap[mName].revenue = Number((mRevMap[mName].revenue + rev).toFixed(2));
              const itemsCount = Array.isArray(inv.items) ? inv.items.reduce((acc, it) => acc + (it.quantity || 1), 0) : 1;
              mRevMap[mName].units += itemsCount;
            }
          }
        });
        setMonthlyRevenue(Object.values(mRevMap));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fmt = (v) => formatCurrency(v);
  const fmtL = (v) => `${currencySymbol}${v}L`;

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#ffffff',
          color: '#1e293b',
          border: '1px solid #e2e8f0',
          padding: '0.75rem 1rem',
          borderRadius: 12,
          fontSize: '0.78rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
          minWidth: 150
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: '#0f172a' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span>Revenue: <strong style={{ color: '#2563eb' }}>₹{payload[0]?.value}L</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span>Units Sold: <strong style={{ color: '#10b981' }}>{payload[1]?.value?.toLocaleString()}</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  const peakMonth = monthlyRevenue.reduce((a, b) => a.revenue > b.revenue ? a : b);

  return (
    <div className="dashboard-container" style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <style>{`
        .kpi-card {
          background: #ffffff;
          border: 1px solid #eef2f6;
          border-radius: 20px;
          padding: 1.35rem 1.5rem;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.03);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .kpi-card:hover {
          box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.08);
          transform: translateY(-2px);
        }
        .product-row:hover {
          background: #f8fafc !important;
        }
      `}</style>

      {/* ── 1. Welcome Banner with Enterprise Onboarding Trigger ── */}
      <div style={{
        background: !isOnboarded ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#ffffff',
        border: !isOnboarded ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
        borderRadius: 22,
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#1e293b',
        boxShadow: '0 4px 20px rgba(37, 99, 235, 0.05)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: !isOnboarded ? '#2563eb' : '#eff6ff',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: !isOnboarded ? '#ffffff' : '#2563eb',
            boxShadow: !isOnboarded ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'
          }}>
            {!isOnboarded ? <FiPlusCircle size={22} /> : <FiAlertCircle size={20} />}
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              {!isOnboarded
                ? `Welcome to SmartLedger AI! Set Up Your Business Profile`
                : `Active Enterprise: ${business?.business_name || 'My Enterprise'}`}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
              {!isOnboarded
                ? 'Your ERP is ready for your inputs. Configure your business name, currency, catalog, and tax parameters.'
                : `${stats?.totalProducts || 0} Products active • ${stats?.totalInvoices || 0} Invoices registered • Currency: ${currencySymbol}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={openWizard}
            className="btn btn-primary"
            style={{ borderRadius: 9999, padding: '0.6rem 1.45rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiPlusCircle size={16} /> {!isOnboarded ? 'Launch Setup Wizard' : 'Modify Business Profile'}
          </button>
          <button
            onClick={() => navigate('/inventory')}
            className="btn btn-secondary"
            style={{ borderRadius: 9999, padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
          >
            Inventory Catalog
          </button>
        </div>
      </div>

      {/* ── 2. Four Retail KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Today's Revenue */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Today's Revenue</span>
            <FiMaximize2 size={14} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiDollarSign size={19} />
            </div>
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                {fmt(stats?.todayRevenue !== undefined && stats?.todayRevenue !== null ? stats.todayRevenue : 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <FiTrendingUp size={11} /> Real-time active
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Total Products in Stock */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Products in Stock</span>
            <FiMaximize2 size={14} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiBox size={19} />
            </div>
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                {(stats?.totalProducts !== undefined ? stats.totalProducts : catalogProducts.length).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                {catalogProducts.filter(p => (p.stock_quantity || p.stockQty || 0) <= (p.reorder_level || p.reorderPoint || 10)).length} low stock alerts
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Invoices This Month */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Invoices This Month</span>
            <FiMaximize2 size={14} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiFileText size={19} />
            </div>
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                {stats?.totalInvoices !== undefined ? stats.totalInvoices : recentInvoices.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                {recentInvoices.filter(i => i.status === 'draft' || i.payment_status === 'PENDING').length} pending payment
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Gross Profit Margin */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Gross Profit Margin</span>
            <FiMaximize2 size={14} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiPercent size={19} />
            </div>
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                {stats?.profitMargin || '0.0'}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <FiTrendingUp size={11} /> Operating margin
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Two Columns: Top Selling Products & Monthly Revenue Chart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Top Selling Products */}
        <div style={{
          background: '#ffffff', border: '1px solid #eef2f6',
          borderRadius: 22, padding: '1.75rem',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>Top Selling Products</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Best performers this month by units sold.</p>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 9999, padding: '0.4rem 0.9rem',
                fontSize: '0.76rem', fontWeight: 600, color: '#334155', cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topProducts.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                <FiPackage size={32} style={{ color: '#94a3b8', marginBottom: '0.6rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>No products in catalog yet</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Add products in the Inventory tab to start tracking item sales.</div>
              </div>
            ) : (
              topProducts.map((p, i) => (
                <div
                  key={i}
                  className="product-row"
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 14,
                    border: '1px solid #f1f5f9',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: '#eff6ff', color: '#2563eb',
                      border: '1px solid #dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.78rem'
                    }}>
                      #{i + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{p.sku}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{p.sold} units</div>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 600,
                      color: p.sold > 0 ? '#10b981' : '#64748b'
                    }}>
                      {p.sold > 0 ? p.trend : 'In Stock'} · {fmtL(p.revenue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/invoices/new')}
              className="btn btn-secondary"
              style={{ width: '100%', borderRadius: 12, padding: '0.7rem', fontSize: '0.85rem' }}
            >
              <FiPlusCircle style={{ marginRight: '0.4rem' }} /> Create New Invoice
            </button>
          </div>
        </div>

        {/* Right: Monthly Revenue Bar Chart */}
        <div style={{
          background: '#ffffff', border: '1px solid #eef2f6',
          borderRadius: 22, padding: '1.75rem',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>Monthly Revenue</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Sales revenue trend — last 12 months (₹ Lakhs).</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                title="Download Report"
                style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: '50%', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748b', cursor: 'pointer'
                }}
                onClick={() => navigate('/reports')}
              >
                <FiDownload size={14} />
              </button>
            </div>
          </div>

          <div style={{ height: 260, width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}L`} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                  {monthlyRevenue.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.month === peakMonth.month ? '#2563eb' : '#dbeafe'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.82rem', color: '#64748b' }}>
            <div>Peak: <strong style={{ color: '#2563eb' }}>{peakMonth?.revenue > 0 ? `${peakMonth.month} (${currencySymbol}${peakMonth.revenue}L)` : 'No sales recorded yet'}</strong></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 700 }}>
              <FiActivity size={16} /> Live Data Feed
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Recent Invoices Table ── */}
      <div style={{
        background: '#ffffff', border: '1px solid #eef2f6',
        borderRadius: 22, padding: '1.75rem',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>Recent Sales Invoices</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Real-time GST billing — latest retail transactions</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => navigate('/invoices')} className="btn btn-secondary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}>
              View All
            </button>
            <button onClick={() => navigate('/invoices/new')} className="btn btn-primary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}>
              <FiPlusCircle /> + New Invoice
            </button>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                {['Invoice #', 'Customer / Business', 'Taxable Amount', 'GST', 'Grand Total', 'Status', 'Action'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(inv => (
                <tr key={inv._id}>
                  <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {inv.clientId?.businessName || 'Walk-in Customer'}
                  </td>
                  <td>{fmt(inv.subtotalAmt)}</td>
                  <td>{fmt(inv.totalTax)}</td>
                  <td style={{ fontWeight: 800, color: '#0f172a' }}>{fmt(inv.grandTotal)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'finalized' ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <Link to="/invoices" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    <FiShoppingCart size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                    <div>No sales invoices recorded yet. Start billing from the POS terminal.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Open POS Terminal', icon: FiShoppingCart, color: '#2563eb', bg: '#eff6ff', path: '/pos' },
          { label: 'Add Product', icon: FiPackage, color: '#7c3aed', bg: '#f5f3ff', path: '/inventory' },
          { label: 'New Invoice', icon: FiFileText, color: '#10b981', bg: '#ecfdf5', path: '/invoices/new' },
          { label: 'View Reports', icon: FiActivity, color: '#ea580c', bg: '#fff7ed', path: '/reports' },
          { label: 'AI Insights', icon: FiTrendingUp, color: '#0891b2', bg: '#ecfeff', path: '/insights' },
          { label: 'GST Engine', icon: FiRefreshCw, color: '#d97706', bg: '#fffbeb', path: '/tax-engine' },
        ].map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              style={{
                background: '#ffffff',
                border: '1px solid #eef2f6',
                borderRadius: 16,
                padding: '1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.18s',
                textAlign: 'left',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: action.bg, color: action.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={17} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
