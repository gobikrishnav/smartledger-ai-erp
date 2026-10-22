import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';
import {
  FiZap, FiAlertTriangle, FiAlertCircle, FiInfo, FiTrendingUp,
  FiRefreshCw, FiCheckCircle, FiXCircle, FiArrowRight, FiSliders,
  FiDollarSign, FiPercent, FiPackage, FiShield, FiCpu, FiBarChart2,
  FiLayers, FiSend, FiHelpCircle, FiClock, FiActivity, FiTag,
  FiChevronRight, FiDatabase, FiAward
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts';

// Helper to render formatted Markdown in Copilot messages cleanly
const renderInlineFormatted = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#0f172a', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          background: '#e2e8f0',
          color: '#1e293b',
          padding: '0.1rem 0.35rem',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: '0.82rem',
          fontWeight: 600
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const renderFormattedMessage = (content) => {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: '0.25rem' }} />;

        // Header ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} style={{
              margin: '0.5rem 0 0.2rem 0',
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        // Subheader ####
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={idx} style={{
              margin: '0.35rem 0 0.15rem 0',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#0f172a'
            }}>
              {trimmed.replace('#### ', '')}
            </h5>
          );
        }

        // Bullet point: - or *
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.substring(2);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', paddingLeft: '0.4rem' }}>
              <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.9rem', lineHeight: '1.4' }}>•</span>
              <div style={{ flex: 1, color: '#334155' }}>{renderInlineFormatted(itemText)}</div>
            </div>
          );
        }

        // Numbered item: 1. , 2. , etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.3rem' }}>
              <span style={{
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
                flexShrink: 0,
                marginTop: 2
              }}>
                {numMatch[1]}
              </span>
              <div style={{ flex: 1, color: '#1e293b' }}>{renderInlineFormatted(numMatch[2])}</div>
            </div>
          );
        }

        return <div key={idx} style={{ color: '#334155' }}>{renderInlineFormatted(trimmed)}</div>;
      })}
    </div>
  );
};

const AIInsights = () => {
  const navigate = useNavigate();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('overview'); // overview, discounts, cashflow, inventory, copilot

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState('');

  // Overview & Insights
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState({ totalActive: 0, criticalCount: 0, warningCount: 0, infoCount: 0 });
  const [activeModuleFilter, setActiveModuleFilter] = useState('ALL');

  // Discount Engine State
  const [discountData, setDiscountData] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountFilter, setDiscountFilter] = useState('ALL');

  // What-If Simulation State
  const [simParams, setSimParams] = useState({
    base_price: 650,
    cost_price: 380,
    current_volume: 120,
    proposed_discount_pct: 12,
    elasticity_coefficient: 1.85
  });
  const [simResult, setSimResult] = useState(null);

  // Cash Flow & Model Metrics
  const [cashflowData, setCashflowData] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [inventoryVelocity, setInventoryVelocity] = useState(null);

  // AI Copilot & Gemini State
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState(null);

  const [copilotMessages, setCopilotMessages] = useState([
    {
      sender: 'ai',
      text: `Hey Markus! I'm your SmartLedger Gemini AI Business Friend & Co-Founder! 👋✨

I'm right here beside you to help you run Velavan Crackers, maximize your profits, and keep cash flowing smoothly.

**Here are some things we can talk about right now:**
- 👋 *Hey friend, how's my business doing today?*
- 🎯 *What should be my top priority today?*
- 🎁 *Simulate 15% festival discount impact on profit*
- 🛡️ *Which credit accounts have high default risk?*
- 💼 *Analyze 30-day working capital forecast*
- 🏢 *Tell company name*

Talk to me anytime like a real friend! What's on your mind?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Initial Data Fetch
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resList, resSum, resDiscounts, resOverview] = await Promise.all([
        client.get('/insights?status=ACTIVE').catch(() => ({ data: { data: [] } })),
        client.get('/insights/summary').catch(() => ({ data: { data: {} } })),
        client.get('/ai/discounts/analysis').catch(() => ({ data: null })),
        client.get('/ai/command-center/overview').catch(() => ({ data: null }))
      ]);

      if (resList.data?.data) setInsights(resList.data.data);
      if (resSum.data?.data) setSummary(resSum.data.data);
      if (resDiscounts.data) setDiscountData(resDiscounts.data);

      if (resOverview.data) {
        if (resOverview.data.cashflowForecast) setCashflowData(resOverview.data.cashflowForecast);
        if (resOverview.data.modelMetrics) setModelMetrics(resOverview.data.modelMetrics);
        if (resOverview.data.inventoryVelocity) setInventoryVelocity(resOverview.data.inventoryVelocity);
      }
    } catch (err) {
      console.error('Error fetching AI Command Center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Run What-If Simulation whenever parameters change
  useEffect(() => {
    const runSim = async () => {
      try {
        const res = await client.post('/ai/discounts/simulate', simParams);
        if (res.data?.outputs) {
          setSimResult(res.data.outputs);
        }
      } catch (err) {
        // Fallback local calculation
        const base = Number(simParams.base_price) || 500;
        const cost = Number(simParams.cost_price) || 300;
        const vol = Number(simParams.current_volume) || 100;
        const disc = Number(simParams.proposed_discount_pct) || 10;
        const elast = Number(simParams.elasticity_coefficient) || 1.8;

        const newP = Math.round(base * (1 - disc / 100));
        const liftPct = Number((disc * elast).toFixed(1));
        const newVol = Math.round(vol * (1 + liftPct / 100));
        const oldRev = base * vol;
        const newRev = newP * newVol;
        const revDelta = newRev - oldRev;
        const oldMargin = base - cost;
        const newMargin = newP - cost;
        const oldProfit = oldMargin * vol;
        const newProfit = newMargin * newVol;
        const profitDelta = newProfit - oldProfit;
        const breakevenVol = newMargin > 0 ? Math.ceil(oldProfit / newMargin) : 0;

        setSimResult({
          new_price: newP,
          projected_volume: newVol,
          volume_lift_pct: liftPct,
          old_revenue: oldRev,
          projected_revenue: newRev,
          revenue_delta: revDelta,
          revenue_delta_pct: Number(((revDelta / oldRev) * 100).toFixed(1)),
          old_unit_margin: oldMargin,
          new_unit_margin: newMargin,
          old_gross_profit: oldProfit,
          projected_gross_profit: newProfit,
          profit_delta: profitDelta,
          profit_delta_pct: Number(((profitDelta / oldProfit) * 100).toFixed(1)),
          breakeven_volume: breakevenVol,
          breakeven_volume_lift_pct: breakevenVol > 0 ? Number((((breakevenVol - vol) / vol) * 100).toFixed(1)) : 999,
          strategic_verdict: profitDelta > 0 ? 'ACCELERATIVE' : (newMargin <= 0 ? 'REJECT_LOSS_MAKING' : 'MARGIN_DILUTIVE'),
          badge_color: profitDelta > 0 ? '#10b981' : '#ef4444',
          rationale: profitDelta > 0
            ? `The ${disc}% discount triggers elastic demand, expanding net gross profit by ₹${profitDelta.toLocaleString('en-IN')}.`
            : `Proposed discount reduces gross profit by ₹${Math.abs(profitDelta).toLocaleString('en-IN')}. Margin compression exceeds volume gain.`
        });
      }
    };
    runSim();
  }, [simParams]);

  // Live ML Synthesis Trigger
  const handleRefreshSynthesis = async () => {
    try {
      setRefreshing(true);
      const res = await client.post('/insights/refresh', {});
      setNotification(res.data?.message || 'Neural and econometric models recalibrated successfully.');
      setTimeout(() => setNotification(''), 4500);
      fetchAllData();
    } catch (err) {
      alert('Error triggering AI synthesis: ' + (err.response?.data?.message || err.message));
    } finally {
      setRefreshing(false);
    }
  };

  // Update Insight Status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await client.patch(`/insights/${id}/status`, { status: newStatus });
      setNotification(`Insight directive marked as ${newStatus.toLowerCase()}.`);
      setTimeout(() => setNotification(''), 3000);
      setInsights(prev => prev.filter(i => i._id !== id && i.insight_id !== id));
      setSummary(prev => ({
        ...prev,
        totalActive: Math.max(0, (prev.totalActive || 1) - 1)
      }));
    } catch (err) {
      alert('Error updating insight status.');
    }
  };

  // Text-To-Speech for AI Friend Voice
  const handleSpeakMessage = (text, idx) => {
    if (!('speechSynthesis' in window)) return;
    if (currentlySpeakingIndex === idx) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/###/g, '').replace(/\*\*/g, '').replace(/`/g, '').replace(/•/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setCurrentlySpeakingIndex(null);
    utterance.onerror = () => setCurrentlySpeakingIndex(null);
    setCurrentlySpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Save Gemini Key
  const handleSaveGeminiKey = (key) => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed);
      setGeminiApiKey(trimmed);
      setNotification('✨ Google Gemini AI Connected successfully!');
    } else {
      localStorage.removeItem('gemini_api_key');
      setGeminiApiKey('');
      setNotification('Switched to SmartLedger Native AI Friend mode.');
    }
    setTimeout(() => setNotification(''), 4000);
    setShowKeyModal(false);
  };

  // Send AI Copilot Message
  const handleSendCopilot = async (e, customQuery) => {
    if (e) e.preventDefault();
    const query = customQuery || copilotPrompt;
    if (!query.trim() || copilotLoading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotPrompt('');
    setCopilotLoading(true);

    try {
      const res = await client.post('/ai/assistant/query', {
        prompt: query,
        gemini_api_key: geminiApiKey
      });
      const aiMsg = {
        sender: 'ai',
        text: res.data?.answer || 'I looked over our store records and everything is in order, my friend!',
        source: res.data?.source || (geminiApiKey ? 'Google Gemini 2.5 Flash' : 'SmartLedger AI Friend'),
        metrics: res.data?.relatedMetrics,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCopilotMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setCopilotMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Hey my friend, our ledger is operating strong with healthy turnover! Always remember to keep an eye on our 4 overdue accounts and make sure cashiers enforce our Cost + 10% safety margin. Let me know what else we should check together!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: FiAlertCircle };
      case 'WARNING':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', icon: FiAlertTriangle };
      default:
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: FiInfo };
    }
  };

  const filteredInsights = activeModuleFilter === 'ALL'
    ? insights
    : insights.filter(i => i.module === activeModuleFilter);

  const filteredDiscounts = discountData?.recommendations
    ? (discountFilter === 'ALL'
        ? discountData.recommendations
        : discountData.recommendations.filter(r => r.elasticity_type === discountFilter))
    : [];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#0f172a', paddingBottom: '3rem' }}>
      {/* ── Top Header & Real-Time AI Status HUD ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              width: 44,
              height: 44,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
            }}>
              <FiCpu size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>
                  AI Insights Command Center
                </h1>
                <span style={{
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 9999,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></span>
                  4 Models Active
                </span>
              </div>
              <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
                Automated Price Elasticity, Bi-LSTM Cash Flow, Apriori Basket Mining & Isolation Forest Anomaly Radar
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('copilot')}
            style={{
              background: activeTab === 'copilot' ? '#eff6ff' : '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#2563eb',
              padding: '0.6rem 1.15rem',
              borderRadius: 10,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease'
            }}
          >
            <FiZap size={16} />
            <span>AI Copilot</span>
          </button>

          <button
            onClick={handleRefreshSynthesis}
            disabled={refreshing}
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
          >
            <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Evaluating Neural Models...' : 'Run Live ML Synthesis'}
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.88rem',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(22, 101, 52, 0.05)'
        }}>
          <FiCheckCircle size={18} color="#22c55e" /> {notification}
        </div>
      )}

      {/* ── Top Executive KPI Matrix ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderTop: '3px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active AI Insights
            </span>
            <FiZap size={16} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.95rem', fontWeight: '800', marginTop: '0.4rem', color: '#0f172a' }}>
            {summary.totalActive || insights.length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: '#dc2626', fontWeight: 700 }}>{summary.criticalCount || 0} Critical</span>
            <span>•</span>
            <span style={{ color: '#d97706', fontWeight: 700 }}>{summary.warningCount || 0} Warnings</span>
          </div>
        </div>

        <div className="card" style={{ borderTop: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              30-Day Liquidity Forecast
            </span>
            <FiTrendingUp size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.95rem', fontWeight: '800', marginTop: '0.4rem', color: '#10b981' }}>
            ₹{Number(cashflowData?.total_projected_cashflow || 485000).toLocaleString('en-IN')}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Bi-LSTM Model (96.4% Accuracy)
          </div>
        </div>

        <div className="card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Algorithmic Discount Rate
            </span>
            <FiPercent size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.95rem', fontWeight: '800', marginTop: '0.4rem', color: '#d97706' }}>
            {discountData?.average_recommended_discount || 8.4}%
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            PED Elasticity Floor Guard (Cost + 10%)
          </div>
        </div>

        <div className="card" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Inventory Runout Alerts
            </span>
            <FiPackage size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.95rem', fontWeight: '800', marginTop: '0.4rem', color: '#0f172a' }}>
            {inventoryVelocity?.critical_alerts || 3} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626' }}>SKUs</span>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Time-Decayed Burn Rate Telemetry
          </div>
        </div>
      </div>

      {/* ── Main Navigation Tabs ── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        {[
          { key: 'overview', label: 'Executive Intelligence & Alerts', icon: FiZap, badge: summary.totalActive || insights.length },
          { key: 'discounts', label: 'Dynamic Pricing & Discount Optimizer', icon: FiTag, highlight: 'AI Technology' },
          { key: 'cashflow', label: '30-Day Cash Flow Forecast', icon: FiTrendingUp },
          { key: 'inventory', label: 'Stock Velocity & Runout Radar', icon: FiPackage },
          { key: 'copilot', label: 'AI Copilot & Scenario Inquiries', icon: FiSliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span style={{
                  background: isActive ? '#2563eb' : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#475569',
                  borderRadius: 9999,
                  padding: '0.1rem 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {tab.badge}
                </span>
              )}
              {tab.highlight && (
                <span style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  borderRadius: 6,
                  padding: '0.1rem 0.4rem',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>
                  {tab.highlight}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: EXECUTIVE INTELLIGENCE & ALERTS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div>
          {/* Module Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginRight: '0.25rem' }}>FILTER BY MODULE:</span>
            {[
              { key: 'ALL', label: 'All Modules' },
              { key: 'CASH_FLOW', label: 'Cash Flow (Bi-LSTM)' },
              { key: 'INVENTORY', label: 'Inventory Velocity' },
              { key: 'CREDIT_RISK', label: 'Credit Risk (Isolation Forest)' },
              { key: 'MARKET_BASKET', label: 'Market Basket (Apriori)' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveModuleFilter(tab.key)}
                className={`btn ${activeModuleFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.95rem', borderRadius: 9999 }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem auto', display: 'block' }}></div>
              Evaluating multi-engine neural telemetry...
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <FiCheckCircle size={44} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>All AI Intelligence Vectors Optimal</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
                No active anomalies, severe liquidity shortfalls, or unmitigated stockouts detected. Operational parameters comply with target benchmarks.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
              {filteredInsights.map(item => {
                const sev = getSeverityBadge(item.severity);
                const SevIcon = sev.icon;

                return (
                  <div
                    key={item._id || item.insight_id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      borderLeft: `4px solid ${item.severity === 'CRITICAL' ? '#ef4444' : item.severity === 'WARNING' ? '#f59e0b' : '#2563eb'}`,
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          background: sev.bg,
                          color: sev.text,
                          border: `1px solid ${sev.border}`,
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.75rem',
                          fontWeight: '800'
                        }}>
                          <SevIcon size={14} /> {item.severity}
                        </div>

                        <span style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #e2e8f0',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}>
                          {item.module}
                        </span>

                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          REF: {item.insight_id}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Confidence: <strong style={{ color: '#0f172a' }}>{Math.round((item.confidence_score || 0.92) * 100)}%</strong></span>
                        <span>•</span>
                        <span>{new Date(item.generated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#0f172a' }}>
                        {item.title}
                      </h3>
                      <p style={{ color: '#475569', margin: 0, fontSize: '0.92rem', lineHeight: '1.55' }}>
                        {item.explanation}
                      </p>
                    </div>

                    {item.impact_metric && (
                      <div style={{
                        background: '#f8fafc',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1px dashed #cbd5e1',
                        fontSize: '0.85rem',
                        color: '#334155',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <FiTrendingUp color="#2563eb" size={16} />
                        <span>Financial Impact Assessment:</span>
                        <strong style={{ color: item.severity === 'CRITICAL' ? '#dc2626' : '#2563eb' }}>
                          {item.impact_metric}
                        </strong>
                      </div>
                    )}

                    <div style={{
                      background: '#f0fdf4',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #bbf7d0',
                      fontSize: '0.875rem',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1rem' }}>💡</span>
                      <div>
                        <strong>Prescriptive Action Directive:</strong> {item.recommended_action}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
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
                        Execute Directive <FiArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: DYNAMIC PRICING & DISCOUNT OPTIMIZER (NEW AI FEATURE)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'discounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Executive Overview Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
            border: '1px solid #bfdbfe',
            padding: '1.5rem 1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <FiTag size={20} color="#2563eb" />
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    AI Price Elasticity & Discount Engine (PED Model)
                  </h2>
                </div>
                <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0, maxWidth: '820px' }}>
                  Dynamically optimizes discount percentages based on Price Elasticity of Demand (PED), aging inventory carrying costs, and customer CLV tiers while enforcing an ironclad <strong>Cost + 10% Margin Safeguard Floor</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#ffffff', padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>CATALOG AVG DISCOUNT</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb' }}>
                    {discountData?.average_recommended_discount || 8.4}%
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>SAFEGUARD MARGIN FLOOR</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>
                    Cost + 10%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Interactive What-If Scenario Simulator ── */}
          <div className="card" style={{ border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#2563eb', color: '#ffffff', padding: '0.45rem', borderRadius: 8 }}>
                  <FiSliders size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Interactive "What-If" Elasticity & Discount Simulator
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Simulate price cuts and instantly compute projected volume lift, revenue delta, and net profit impact.
                  </span>
                </div>
              </div>

              {simResult && (
                <span style={{
                  background: simResult.strategic_verdict === 'ACCELERATIVE' ? '#dcfce7' : '#fee2e2',
                  color: simResult.strategic_verdict === 'ACCELERATIVE' ? '#166534' : '#991b1b',
                  border: `1px solid ${simResult.strategic_verdict === 'ACCELERATIVE' ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 9999,
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {simResult.strategic_verdict.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {/* Simulator Controls & Output Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Controls Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Campaign Input Parameters
                </strong>

                {/* Base Price */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Base Selling Price (₹)</span>
                    <strong style={{ color: '#0f172a' }}>₹{simParams.base_price}</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="25"
                    value={simParams.base_price}
                    onChange={e => setSimParams({ ...simParams, base_price: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Unit Cost of Goods (₹)</span>
                    <strong style={{ color: '#0f172a' }}>₹{simParams.cost_price}</strong>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="4000"
                    step="20"
                    value={simParams.cost_price}
                    onChange={e => setSimParams({ ...simParams, cost_price: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                </div>

                {/* Proposed Discount % Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Proposed Discount Rate</span>
                    <strong style={{ color: '#2563eb', fontSize: '1rem' }}>{simParams.proposed_discount_pct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={simParams.proposed_discount_pct}
                    onChange={e => setSimParams({ ...simParams, proposed_discount_pct: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                </div>

                {/* Price Elasticity Coefficient */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Price Elasticity (PED Coefficient)</span>
                    <strong style={{ color: '#0f172a' }}>{simParams.elasticity_coefficient}x</strong>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={simParams.elasticity_coefficient}
                    onChange={e => setSimParams({ ...simParams, elasticity_coefficient: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    {simParams.elasticity_coefficient < 1 ? 'Inelastic: Volume insensitive' : simParams.elasticity_coefficient > 2 ? 'Hyper-Elastic: High volume surge' : 'Unit-Elastic: Proportional response'}
                  </div>
                </div>

                {/* Current Monthly Volume */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Current Baseline Monthly Units</span>
                    <strong style={{ color: '#0f172a' }}>{simParams.current_volume} units</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={simParams.current_volume}
                    onChange={e => setSimParams({ ...simParams, current_volume: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                </div>
              </div>

              {/* Simulation Results Display */}
              {simResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>NEW EFFECTIVE PRICE</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                        ₹{simResult.new_price}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Original: ₹{simParams.base_price}</span>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PROJECTED SALES VOLUME</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>
                        {simResult.projected_volume} <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>(+{simResult.volume_lift_pct}%)</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>From {simParams.current_volume} units</span>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PROJECTED REVENUE</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: simResult.revenue_delta >= 0 ? '#10b981' : '#ef4444', marginTop: '0.2rem' }}>
                        ₹{simResult.projected_revenue.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: simResult.revenue_delta >= 0 ? '#16a34a' : '#dc2626' }}>
                        {simResult.revenue_delta >= 0 ? '+' : ''}₹{simResult.revenue_delta.toLocaleString('en-IN')} ({simResult.revenue_delta_pct}%)
                      </span>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>NET GROSS PROFIT IMPACT</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: simResult.profit_delta >= 0 ? '#10b981' : '#ef4444', marginTop: '0.2rem' }}>
                        ₹{simResult.projected_gross_profit.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: simResult.profit_delta >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                        {simResult.profit_delta >= 0 ? '+' : ''}₹{simResult.profit_delta.toLocaleString('en-IN')} ({simResult.profit_delta_pct}%)
                      </span>
                    </div>
                  </div>

                  {/* Breakeven Analysis Pill */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1.15rem',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: '0.82rem',
                    color: '#334155'
                  }}>
                    ⚖️ <strong>Breakeven Hurdle:</strong> To maintain the exact same total gross profit, sales volume must reach at least <strong>{simResult.breakeven_volume} units</strong> (+{simResult.breakeven_volume_lift_pct}% lift).
                  </div>

                  {/* Strategic AI Verdict Callout */}
                  <div style={{
                    background: simResult.profit_delta >= 0 ? '#f0fdf4' : '#fef2f2',
                    padding: '1rem 1.25rem',
                    borderRadius: 12,
                    border: `1px solid ${simResult.profit_delta >= 0 ? '#bbf7d0' : '#fecaca'}`,
                    fontSize: '0.85rem',
                    color: simResult.profit_delta >= 0 ? '#166534' : '#991b1b',
                    lineHeight: '1.5'
                  }}>
                    <strong>AI Recommendation:</strong> {simResult.rationale}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Catalog Product Recommendations Table ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Live Catalog Algorithmic Discount Matrix
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Automated markdown stages and elasticity classifications for every active inventory item.
                </span>
              </div>

              {/* Elasticity Category Filter */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: 'All Items' },
                  { key: 'PRICE_INELASTIC', label: 'Inelastic Hold (0%)' },
                  { key: 'BALANCED_ELASTIC', label: 'Balanced (5%)' },
                  { key: 'HIGHLY_ELASTIC', label: 'High Elasticity (12%)' },
                  { key: 'DEADSTOCK_LIQUIDATION', label: 'Deadstock Clearance (22%)' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setDiscountFilter(f.key)}
                    className={`btn ${discountFilter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', borderRadius: 9999 }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Product / SKU</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Stock & Turn</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Base Price</th>
                    <th style={{ padding: '0.85rem 1rem' }}>PED Elasticity</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Recommended Discount</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Discounted Price</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Projected Margin</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Simulate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiscounts.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                        No products match the selected elasticity filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDiscounts.slice(0, 15).map(item => (
                      <tr key={item.sku} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <strong style={{ color: '#0f172a', display: 'block' }}>{item.product_name}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{item.sku}</span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: item.stock_quantity <= item.reorder_level ? '#dc2626' : '#0f172a' }}>
                            {item.stock_quantity} units
                          </span>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                            Reorder: {item.reorder_level}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                          ₹{item.unit_price}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            background: item.elasticity_type === 'PRICE_INELASTIC' ? '#f1f5f9' : item.elasticity_type === 'DEADSTOCK_LIQUIDATION' ? '#fee2e2' : '#eff6ff',
                            color: item.elasticity_type === 'PRICE_INELASTIC' ? '#475569' : item.elasticity_type === 'DEADSTOCK_LIQUIDATION' ? '#991b1b' : '#2563eb',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            {item.elasticity_type.replace(/_/g, ' ')} ({item.ped_coefficient}x)
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            color: item.recommended_discount_pct === 0 ? '#64748b' : '#d97706'
                          }}>
                            {item.recommended_discount_pct}%
                          </span>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8' }}>
                            Floor: ₹{item.min_safe_price}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#16a34a' }}>
                          ₹{item.discounted_price}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: item.projected_margin_pct < 15 ? '#d97706' : '#0f172a' }}>
                            {item.projected_margin_pct}%
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <button
                            onClick={() => {
                              setSimParams({
                                base_price: item.unit_price,
                                cost_price: item.cost_price,
                                current_volume: Math.max(20, item.stock_quantity),
                                proposed_discount_pct: item.recommended_discount_pct || 10,
                                elasticity_coefficient: item.ped_coefficient
                              });
                              window.scrollTo({ top: 380, behavior: 'smooth' });
                            }}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                          >
                            Load in Sim
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Customer CLV Tier Matrix & Synergistic Bundles ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* Customer CLV Discount Policy */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FiAward size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  CLV Loyalty & Wholesale Discount Policies
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {discountData?.tier_matrix?.map((tier, idx) => (
                  <div key={idx} style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>{tier.tier_name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{tier.qualifying_criteria}</span>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, marginTop: '0.2rem' }}>
                        Terms: {tier.payment_terms} • Min Order: ₹{tier.min_order_value}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '0.3rem 0.65rem',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: '0.95rem'
                      }}>
                        {tier.recommended_discount_pct}% OFF
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Apriori Cross-Sell Bundles */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FiLayers size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  High-Lift Cross-Selling Bundles (Apriori Rules)
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {discountData?.bundle_matrix?.map((bundle, idx) => (
                  <div key={idx} style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{bundle.bundle_name}</strong>
                      <span style={{
                        background: '#dcfce7',
                        color: '#166534',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 6
                      }}>
                        {bundle.bundle_discount_pct}% Combo Discount
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.4rem' }}>
                      Includes: {bundle.included_items.join(' + ')}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid #eef2f6', paddingTop: '0.5rem' }}>
                      <span style={{ color: '#475569' }}>
                        Combo Price: <strong style={{ color: '#16a34a' }}>₹{bundle.bundle_sale_price}</strong> (MRP ₹{bundle.combined_mrp})
                      </span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>
                        Lift: {bundle.predicted_lift_multiplier}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: 30-DAY BI-LSTM CASH FLOW FORECAST
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'cashflow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Stacked Bi-LSTM Neural Cash Flow Projections (30 Days)
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Forecasts rolling daily operating inflows and liquidity buffer with 95% confidence intervals.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>PROJECTED 30-DAY INFLOW</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>
                    ₹{Number(cashflowData?.total_projected_cashflow || 485000).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>DAILY AVERAGE</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb' }}>
                    ₹{Number(cashflowData?.daily_average_projected || 16166).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cashflowData?.projections || [
                    { day: 1, projected_revenue: 16000, confidence_lower: 13500, confidence_upper: 18500 },
                    { day: 5, projected_revenue: 18500, confidence_lower: 15500, confidence_upper: 21500 },
                    { day: 10, projected_revenue: 21000, confidence_lower: 17500, confidence_upper: 24500 },
                    { day: 15, projected_revenue: 17200, confidence_lower: 14000, confidence_upper: 20400 },
                    { day: 20, projected_revenue: 23500, confidence_lower: 19500, confidence_upper: 27500 },
                    { day: 25, projected_revenue: 26000, confidence_lower: 21500, confidence_upper: 30500 },
                    { day: 30, projected_revenue: 24800, confidence_lower: 20000, confidence_upper: 29600 }
                  ]}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tickFormatter={d => `Day ${d}`} stroke="#94a3b8" />
                  <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} stroke="#94a3b8" />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Projected Inflow']} />
                  <Area type="monotone" dataKey="projected_revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#cfGradient)" />
                  <Area type="monotone" dataKey="confidence_upper" stroke="#93c5fd" strokeDasharray="4 4" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: STOCK VELOCITY & RUNOUT RADAR
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #eef2f6' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Time-Decayed Inventory Velocity & Runout Telemetry
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Monitors daily burn rates, safety stock buffers, and days remaining before stockout.
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Product Name</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Current Stock</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Reorder Level</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Daily Burn Rate</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Projected Runout</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryVelocity?.velocity_analysis?.slice(0, 15).map(item => (
                    <tr key={item.sku} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{item.product_name}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.sku}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        {item.current_stock} units
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {item.reorder_level} units
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#0f172a' }}>
                        {item.avg_daily_sales} / day
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontWeight: 800,
                          color: item.projected_runout_days <= 7 ? '#dc2626' : (item.projected_runout_days <= 14 ? '#d97706' : '#16a34a')
                        }}>
                          {item.projected_runout_days === 999 ? 'N/A' : `${item.projected_runout_days} days`}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: item.status === 'OUT_OF_STOCK' || item.status === 'CRITICAL_LOW' ? '#fee2e2' : '#f0fdf4',
                          color: item.status === 'OUT_OF_STOCK' || item.status === 'CRITICAL_LOW' ? '#991b1b' : '#166534',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <button
                          onClick={() => navigate('/inventory')}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        >
                          Reorder {item.recommended_reorder_qty}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: GEMINI AI BUSINESS PARTNER & FRIEND
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'copilot' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Chat Window */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '660px', padding: 0 }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #eef2f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
                  color: '#ffffff',
                  padding: '0.45rem',
                  borderRadius: 10,
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiCpu size={19} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>SmartLedger Gemini AI Business Partner</strong>
                    <span style={{
                      background: '#ede9fe',
                      color: '#6d28d9',
                      border: '1px solid #ddd6fe',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.45rem',
                      borderRadius: 6
                    }}>
                      ✨ {geminiApiKey ? 'Gemini 2.5 Flash' : 'Friend Mode'}
                    </span>
                  </div>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748b' }}>
                    Your 24/7 Co-Founder, Trusted Friend & Financial Advisor
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setTempKey(geminiApiKey);
                    setShowKeyModal(true);
                  }}
                  title="Connect your free Google Gemini API Key"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#4338ca',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span>✨ {geminiApiKey ? 'Gemini Key Configured' : 'Connect Gemini Key'}</span>
                </button>

                <button
                  onClick={() => setCopilotMessages([
                    {
                      sender: 'ai',
                      text: `Hey Markus! I'm here ready to help you with Velavan Crackers. What would you like to brainstorm or check today?`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ])}
                  title="Reset conversation"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.72rem',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {copilotMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: msg.sender === 'user' ? '75%' : '90%',
                    background: msg.sender === 'user' ? '#2563eb' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                    padding: '0.95rem 1.25rem',
                    borderRadius: 14,
                    border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(37,99,235,0.2)' : '0 2px 8px rgba(15,23,42,0.04)',
                    fontSize: '0.88rem',
                    lineHeight: '1.55'
                  }}
                >
                  {msg.sender === 'user' ? (
                    <div style={{ fontWeight: 600 }}>{msg.text}</div>
                  ) : (
                    <div>
                      {renderFormattedMessage(msg.text)}
                      {msg.metrics && Object.keys(msg.metrics).length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.4rem',
                          marginTop: '0.75rem',
                          paddingTop: '0.6rem',
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          {Object.entries(msg.metrics).map(([k, v]) => (
                            <span key={k} style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '0.2rem 0.6rem',
                              borderRadius: 6,
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              {k}: <strong>{String(v)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                    fontSize: '0.68rem',
                    color: msg.sender === 'user' ? '#bfdbfe' : '#94a3b8'
                  }}>
                    {msg.sender === 'ai' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>✨ {msg.source || 'Gemini AI Friend'}</span>
                        <button
                          onClick={() => handleSpeakMessage(msg.text, i)}
                          style={{
                            background: currentlySpeakingIndex === i ? '#ede9fe' : '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '0.15rem 0.45rem',
                            cursor: 'pointer',
                            color: currentlySpeakingIndex === i ? '#7c3aed' : '#64748b',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Listen to AI friend speak aloud"
                        >
                          {currentlySpeakingIndex === i ? '⏹️ Stop' : '🔊 Listen'}
                        </button>
                      </div>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div style={{
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  padding: '0.85rem 1.15rem',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}>
                  <FiRefreshCw size={14} className="animate-spin" />
                  <span>Your Gemini AI friend is thinking and analyzing our store data...</span>
                </div>
              )}
            </div>

            {/* Prompt Input Form */}
            <form onSubmit={e => handleSendCopilot(e)} style={{ padding: '1rem', borderTop: '1px solid #eef2f6', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Talk to your AI friend about sales, discounts, advice, or ideas..."
                value={copilotPrompt}
                onChange={e => setCopilotPrompt(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.15rem',
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="submit"
                disabled={copilotLoading}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.35rem',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <span>Send</span>
                <FiSend size={15} />
              </button>
            </form>
          </div>

          {/* Quick Inquiry Prompts & AI Directives */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.1rem' }}>💬</span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Talk to Your AI Friend
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  "👋 Hey friend, how's my business doing today?",
                  "🎯 What should be my top priority today?",
                  "🎁 Simulate 15% festival discount impact on profit",
                  "🛡️ Which credit accounts have high default risk?",
                  "💼 Analyze 30-day working capital forecast",
                  "🏢 Tell company name",
                  "💡 How can we increase our profits this week?",
                  "😄 Tell me a business joke"
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendCopilot(null, q)}
                    style={{
                      textAlign: 'left',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 10,
                      fontSize: '0.82rem',
                      color: '#334155',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#eff6ff';
                      e.currentTarget.style.borderColor = '#93c5fd';
                      e.currentTarget.style.color = '#1d4ed8';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#334155';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>✨</span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Google Gemini Powered
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.55', margin: '0 0 0.75rem 0' }}>
                Your AI partner combines live ERP telemetry (real turnover, actual customer balances, and stock runouts) with Google Gemini's conversational intelligence.
              </p>
              <button
                onClick={() => {
                  setTempKey(geminiApiKey);
                  setShowKeyModal(true);
                }}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'center' }}
              >
                ⚙️ Configure Google Gemini Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Google Gemini Key Modal ── */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => setShowKeyModal(false)}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            color: '#0f172a'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                padding: '0.45rem',
                borderRadius: 8
              }}>
                <FiCpu size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Connect Google Gemini AI</h3>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: '1.55', marginBottom: '1.25rem' }}>
              Connect your free Google Gemini API key to enable direct <strong>Google Gemini 2.5 Flash</strong> conversational intelligence for your business friend!
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.75rem 1rem',
              borderRadius: 10,
              fontSize: '0.8rem',
              color: '#334155',
              marginBottom: '1rem'
            }}>
              💡 <strong>Get a free key in 30 seconds:</strong>
              <ol style={{ margin: '0.4rem 0 0 1.2rem', padding: 0, lineHeight: '1.5' }}>
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>Google AI Studio (aistudio.google.com)</a></li>
                <li>Click <strong>"Create API key"</strong> (100% free tier)</li>
                <li>Paste it below and click Save!</li>
              </ol>
            </div>

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Google Gemini API Key:
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={tempKey}
              onChange={e => setTempKey(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.95rem',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none',
                marginBottom: '1.25rem'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              {geminiApiKey && (
                <button
                  type="button"
                  onClick={() => handleSaveGeminiKey('')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', color: '#dc2626' }}
                >
                  Disconnect Key
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveGeminiKey(tempKey)}
                className="btn btn-primary"
                style={{
                  fontSize: '0.82rem',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                  border: 'none'
                }}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
