import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/inventory';
import { KPICard } from '../components/KPICard';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/Badge';

export default function WarehouseConsole() {
  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = {
    total: products?.length || 0,
    lowStock: products?.filter(p => p.stock_quantity <= p.reorder_level).length || 0,
    nearExpiry: products?.filter(p => p.expiry_date && new Date(p.expiry_date).getTime() < Date.now() + 30*24*60*60*1000).length || 0,
    value: products?.reduce((acc, p) => acc + (p.cost_price * p.stock_quantity), 0) || 0
  };

  const columns = [
    { key: 'sku_code', header: 'SKU' },
    { key: 'product_name', header: 'Product Name', render: (row: any) => <span className="font-bold">{row.product_name}</span> },
    { key: 'stock_quantity', header: 'Qty' },
    { key: 'reorder_level', header: 'Reorder Level' },
    { key: 'status', header: 'Status', render: (row: any) => {
      const isLow = row.stock_quantity <= row.reorder_level;
      return <Badge variant={isLow ? 'muted' : 'outline'}>{isLow ? 'LOW STOCK' : 'IN STOCK'}</Badge>
    }}
  ];

  const filteredProducts = products?.filter(p => p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku_code.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  
  const displayData = activeTab === 'LOW' 
    ? filteredProducts.filter(p => p.stock_quantity <= p.reorder_level)
    : filteredProducts;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Warehouse Console</h1>
        <button className="bg-black text-white px-4 py-2 font-bold rounded hover:bg-gray-800">
          Log Inward Shipment (GRN)
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Products" value={stats.total} />
        <KPICard title="Low Stock Items" value={stats.lowStock} />
        <KPICard title="Near Expiry" value={stats.nearExpiry} />
        <KPICard title="Inventory Value" value={`₹${stats.value.toFixed(2)}`} />
      </div>

      <div className="bg-white border border-gray-300 rounded p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-gray-300 pb-4">
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('ALL')} className={`font-bold pb-2 border-b-2 ${activeTab === 'ALL' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>All Inventory</button>
            <button onClick={() => setActiveTab('LOW')} className={`font-bold pb-2 border-b-2 ${activeTab === 'LOW' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Low Stock</button>
            <button onClick={() => setActiveTab('EXPIRY')} className={`font-bold pb-2 border-b-2 ${activeTab === 'EXPIRY' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Expiry Audit</button>
          </div>
          <input 
            type="text" 
            placeholder="Search SKU or Name..." 
            className="border border-gray-400 px-3 py-1.5 focus:outline-none focus:border-black text-sm w-64"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <DataTable data={displayData} columns={columns} loading={isLoading} />
      </div>
    </div>
  );
}
