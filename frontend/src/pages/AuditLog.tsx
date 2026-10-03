import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAnomalies } from '../api/anomalies';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/Badge';

export default function AuditLog() {
  const { data: anomalies, isLoading } = useQuery({ queryKey: ['all-anomalies'], queryFn: getAllAnomalies });

  const columns = [
    { key: 'invoice_number', header: 'Invoice #', render: (row: any) => <span className="font-bold">{row.invoice_number}</span> },
    { key: 'risk_score', header: 'Risk Score', render: (row: any) => (
        <div className="flex items-center gap-2 w-32">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-black" style={{ width: `${row.risk_score * 100}%` }}></div>
          </div>
          <span className="text-xs font-bold">{(row.risk_score * 100).toFixed(0)}%</span>
        </div>
      ) 
    },
    { key: 'flag_level', header: 'Flag Level', render: (row: any) => (
      <Badge variant={row.flag_level === 'HIGH_RISK' ? 'solid' : 'muted'}>{row.flag_level}</Badge>
    )},
    { key: 'grand_total', header: 'Amount', render: (row: any) => `₹${row.grand_total.toFixed(2)}` },
    { key: 'review_status', header: 'Status', render: (row: any) => {
      if (row.review_status === 'CONFIRMED') return <span className="text-black font-bold">CONFIRMED</span>;
      if (row.review_status === 'OVERRIDDEN') return <span className="text-gray-500 line-through">OVERRIDDEN</span>;
      return <span className="text-gray-800">PENDING</span>;
    }}
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">AI Fraud Audit Log</h1>
      <div className="bg-white border border-gray-300 rounded p-4">
        <DataTable data={anomalies || []} columns={columns} loading={isLoading} />
      </div>
    </div>
  );
}
