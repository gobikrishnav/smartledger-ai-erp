import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExecutiveSummary } from '../api/analytics';
import { getPendingAnomalies } from '../api/anomalies';
import { useWebSocket } from '../hooks/useWebSocket';
import { KPICard } from '../components/KPICard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock chart data for now
const chartData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

export default function OwnerDashboard() {
  const { data: summary, isLoading: loadingSummary } = useQuery({ queryKey: ['summary'], queryFn: () => getExecutiveSummary() });
  const { data: anomalies, isLoading: loadingAnomalies } = useQuery({ queryKey: ['anomalies'], queryFn: getPendingAnomalies });
  
  const { isConnected } = useWebSocket();

  if (loadingSummary) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        <KPICard title="Total Revenue" value={`₹${summary?.total_revenue?.toLocaleString() || '0'}`} trend="+5.2%" />
        <KPICard title="Gross Profit" value={`₹${summary?.gross_profit?.toLocaleString() || '0'}`} trend="+2.1%" />
        <KPICard title="Gross Margin" value={`${summary?.gross_margin_pct?.toFixed(1) || '0'}%`} />
        <KPICard title="Tax Collected" value={`₹${summary?.total_tax_collected?.toLocaleString() || '0'}`} />
        <KPICard title="Invoices" value={summary?.invoice_count || 0} />
      </div>

      <div className="bg-white border border-gray-300 p-4 rounded h-72">
        <h2 className="text-lg font-bold text-black mb-4">Revenue Overview</h2>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cccccc" />
            <XAxis dataKey="name" stroke="#555555" tick={{fill: '#555555'}} />
            <YAxis stroke="#555555" tick={{fill: '#555555'}} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#000', color: '#000' }} />
            <Area type="monotone" dataKey="revenue" stroke="#000000" fill="#e0e0e0" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-gray-300 p-4 rounded">
          <h2 className="text-lg font-bold text-black mb-4">Recent Invoices</h2>
          <p className="text-gray-500 italic">Table implementation here...</p>
        </div>
        
        <div className="col-span-1 bg-white border border-gray-300 rounded flex flex-col h-96">
          <div className="p-4 border-b border-gray-300 flex justify-between items-center">
            <h2 className="text-lg font-bold text-black">⚠ Live Fraud Alerts</h2>
            <div title={isConnected ? "Connected to AI Security Core" : "Disconnected"} className={`w-3 h-3 rounded-full ${isConnected ? 'bg-black' : 'border-2 border-gray-400 bg-white'}`}></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingAnomalies ? <LoadingSpinner size="md" /> : null}
            {anomalies?.length === 0 && !loadingAnomalies && (
              <p className="text-gray-500 italic text-center py-8">No pending alerts</p>
            )}
            {anomalies?.map(alert => (
              <div key={alert.audit_id} className="border border-black rounded p-3 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-black">{alert.invoice_number}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${alert.flag_level === 'HIGH_RISK' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}>
                    {alert.flag_level}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Risk Score</span><span className="font-bold text-black">{(alert.risk_score * 100).toFixed(0)}%</span></div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-black" style={{ width: `${alert.risk_score * 100}%` }}></div>
                  </div>
                </div>
                <p className="text-sm font-bold text-black mb-3">₹{alert.grand_total.toFixed(2)}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-black text-white text-xs font-bold py-1.5 hover:bg-gray-800">CONFIRM</button>
                  <button className="flex-1 bg-white text-black border border-black text-xs font-bold py-1.5 hover:bg-gray-100">OVERRIDE</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
