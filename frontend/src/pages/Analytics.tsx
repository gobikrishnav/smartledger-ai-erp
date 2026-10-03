import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, cogs: 2400 },
  { name: 'Feb', revenue: 3000, cogs: 1398 },
  { name: 'Mar', revenue: 2000, cogs: 9800 },
  { name: 'Apr', revenue: 2780, cogs: 3908 },
  { name: 'May', revenue: 1890, cogs: 4800 },
  { name: 'Jun', revenue: 2390, cogs: 3800 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">Analytics</h1>
      <div className="bg-white border border-gray-300 p-4 rounded h-96">
        <h2 className="text-lg font-bold text-black mb-4">Revenue vs COGS (Monthly)</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cccccc" />
            <XAxis dataKey="name" stroke="#555555" />
            <YAxis stroke="#555555" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#000', color: '#000' }} />
            <Bar dataKey="revenue" fill="#000000" />
            <Bar dataKey="cogs" fill="#bbbbbb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
