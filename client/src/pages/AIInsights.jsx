import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';
import {
  FiZap, FiAlertTriangle, FiAlertCircle, FiInfo, FiTrendingUp,
  FiRefreshCw, FiCheckCircle, FiXCircle, FiArrowRight, FiSliders
} from 'react-icons/fi';

const AIInsights = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState({ totalActive: 0, criticalCount: 0, warningCount: 0, infoCount: 0, byModule: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModule, setActiveModule] = useState('ALL');
  const [notification, setNotification] = useState('');

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ status: 'ACTIVE' });
      if (activeModule !== 'ALL') params.append('module', activeModule);

      const [resList, resSum] = await Promise.all([
        client.get(`/insights?${params.toString()}`),
        client.get('/insights/summary')
      ]);

      if (resList.data?.data) {
        setInsights(resList.data.data);
      }
      if (resSum.data?.data) {
        setSummary(resSum.data.data);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [activeModule]);

  const handleRefreshSynthesis = async () => {
    try {
      setRefreshing(true);
      const res = await client.post('/insights/refresh', {});
      setNotification(res.data?.message || 'AI Intelligence synthesis completed successfully.');
      setTimeout(() => setNotification(''), 4000);
      fetchInsights();
    } catch (err) {
      alert('Error triggering AI synthesis: ' + (err.response?.data?.message || err.message));
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await client.patch(`/insights/${id}/status`, { status: newStatus });
      setNotification(`Insight marked as ${newStatus.toLowerCase()}.`);
      setTimeout(() => setNotification(''), 3000);
      setInsights(prev => prev.filter(i => i._id !== id && i.insight_id !== id));
      fetchInsights();
    } catch (err) {
      alert('Error updating insight status.');
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.18)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)', icon: FiAlertCircle };
      case 'WARNING':
        return { bg: 'rgba(245, 158, 11, 0.18)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)', icon: FiAlertTriangle };
      default:
        return { bg: 'rgba(56, 189, 248, 0.18)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)', icon: FiInfo };
    }
  };

  const getModuleBadge = (mod) => {
    switch (mod) {
      case 'CASH_FLOW':
        return { label: 'Bi-LSTM Cash Flow', color: '#38bdf8' };
      case 'INVENTORY':
        return { label: 'Inventory Velocity', color: '#10b981' };
      case 'CREDIT_RISK':
        return { label: 'Isolation Forest Risk', color: '#f87171' };
      case 'MARKET_BASKET':
        return { label: 'Apriori / FP-Growth', color: '#2563eb' };
      default:
        return { label: mod, color: '#94a3b8' };
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', padding: '0.65rem', borderRadius: '12px', color: '#ffffff', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}>
            <FiZap size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>
              AI Insights Command Center
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
              Synthesized neural and statistical intelligence across working capital, inventory, credit default, and basket cross-selling
            </p>
          </div>
        </div>

        <button
          onClick={handleRefreshSynthesis}
          disabled={refreshing}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.35rem', fontSize: '0.875rem' }}
        >
          <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Evaluating Neural Models...' : 'Run Live ML Synthesis'}
        </button>
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

      {/* Summary KPI Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderTop: '2px solid #38bdf8' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL ACTIVE INSIGHTS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.4rem', color: '#0f172a' }}>
            {summary.totalActive}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Synthesized across 4 engines</div>
        </div>

        <div className="card" style={{ borderTop: '2px solid #ef4444' }}>
          <div style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>CRITICAL ACTION REQUIRED</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.5rem', color: '#f87171' }}>
            {summary.criticalCount}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Stockouts & overdue credit risks</div>
        </div>

        <div className="card" style={{ borderTop: '2px solid #f59e0b' }}>
          <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>WARNINGS & HEADROOM</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.5rem', color: '#fbbf24' }}>
            {summary.warningCount}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Excess inventory & slow movers</div>
        </div>

        <div className="card" style={{ borderTop: '2px solid #2563eb' }}>
          <div style={{ color: '#2563eb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>GROWTH & CROSS-SELL</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.5rem', color: '#0f172a' }}>
            {summary.infoCount}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Positive lift & liquidity inflow</div>
        </div>
      </div>

      {/* Module Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'All Modules' },
          { key: 'CASH_FLOW', label: 'Cash Flow (Bi-LSTM)' },
          { key: 'INVENTORY', label: 'Inventory Velocity' },
          { key: 'CREDIT_RISK', label: 'Credit Risk (Isolation Forest)' },
          { key: 'MARKET_BASKET', label: 'Market Basket (Apriori)' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveModule(tab.key)}
            className={`btn ${activeModule === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '0.55rem 1.15rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insight Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem auto', display: 'block' }}></div>
          Querying explainable machine learning models...
        </div>
      ) : insights.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <FiCheckCircle size={40} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>All AI Intelligence Vectors Optimal</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
            No critical anomalies, liquidity crunches, or inventory stockout risks detected. All operational thresholds are within benchmark tolerance.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          {insights.map(item => {
            const sev = getSeverityBadge(item.severity);
            const mod = getModuleBadge(item.module);
            const SevIcon = sev.icon;

            return (
              <div
                key={item._id || item.insight_id}
                className="card"
                style={{
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                  borderLeft: `4px solid ${item.severity === 'CRITICAL' ? '#ef4444' : item.severity === 'WARNING' ? '#f59e0b' : '#38bdf8'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      background: sev.bg, color: sev.text, border: `1px solid ${sev.border}`,
                      padding: '0.35rem 0.65rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem',
                      fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      <SevIcon size={14} /> {item.severity}
                    </div>

                    <span style={{
                      background: `${mod.color}25`, color: mod.color, border: `1px solid ${mod.color}40`,
                      padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {mod.label}
                    </span>

                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      ID: {item.insight_id}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Confidence: <strong style={{ color: '#ffffff' }}>{Math.round((item.confidence_score || 0.9) * 100)}%</strong></span>
                    <span>•</span>
                    <span>{new Date(item.generated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.925rem', lineHeight: '1.5' }}>
                    {item.explanation}
                  </p>
                </div>

                {item.impact_metric && (
                  <div style={{
                    background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem 1rem', borderRadius: '10px',
                    border: '1px dashed rgba(56, 189, 248, 0.3)', fontSize: '0.875rem', color: '#0369a1', fontWeight: '600'
                  }}>
                    📈 Financial Impact Assessment: <span style={{ color: item.severity === 'CRITICAL' ? '#f87171' : '#38bdf8' }}>{item.impact_metric}</span>
                  </div>
                )}

                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.875rem', color: '#34d399'
                }}>
                  💡 <strong>Action Directive:</strong> {item.recommended_action}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <button
                    onClick={() => handleUpdateStatus(item._id || item.insight_id, 'DISMISSED')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
                  >
                    Dismiss
                  </button>

                  <button
                    onClick={() => {
                      if (item.action_route) {
                        navigate(item.action_route);
                      } else {
                        handleUpdateStatus(item._id || item.insight_id, 'RESOLVED');
                      }
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 1.15rem' }}
                  >
                    Execute Action <FiArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIInsights;
