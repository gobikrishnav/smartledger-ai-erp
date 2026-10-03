import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '../api/pos';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/Badge';

export default function Invoices() {
  const { data: invoices, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices });

  const columns = [
    { key: 'invoice_number', header: 'Invoice #', render: (row: any) => <span className="font-bold text-black">{row.invoice_number}</span> },
    { key: 'invoice_date', header: 'Date', render: (row: any) => new Date(row.invoice_date).toLocaleString() },
    { key: 'cashier_name', header: 'Cashier' },
    { key: 'payment_mode', header: 'Payment Mode' },
    { key: 'grand_total', header: 'Total Amount', render: (row: any) => <span className="font-bold">₹{row.grand_total.toFixed(2)}</span> },
    { key: 'payment_status', header: 'Status', render: (row: any) => {
      if (row.payment_status === 'PAID') return <Badge variant="solid">PAID</Badge>;
      if (row.payment_status === 'PENDING') return <Badge variant="outline">PENDING</Badge>;
      return <Badge variant="muted">VOID</Badge>;
    }}
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">Invoices</h1>
      <div className="bg-white border border-gray-300 rounded p-4">
        <DataTable data={invoices || []} columns={columns} loading={isLoading} />
      </div>
    </div>
  );
}
