import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ data, columns, loading, emptyMessage = 'No data available' }: DataTableProps<T>) {
  if (loading) return <LoadingSpinner size="lg" />;
  
  if (!data.length) return <div className="p-8 text-center text-gray-500 italic">{emptyMessage}</div>;

  return (
    <div className="overflow-x-auto border border-gray-300 rounded">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-gray-100 border-b border-gray-300">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="py-3 px-4 text-left font-bold text-black border-r border-gray-200 last:border-0">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="py-3 px-4 text-gray-700 border-r border-gray-200 last:border-0">
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
