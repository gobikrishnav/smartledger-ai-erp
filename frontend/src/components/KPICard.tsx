import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, trend }) => {
  return (
    <div className="bg-white border border-gray-300 p-4 rounded shadow-sm">
      <div className="text-gray-500 text-sm font-medium mb-1">{title}</div>
      <div className="text-black text-3xl font-bold mb-2">{value}</div>
      {(subtitle || trend) && (
        <div className="text-xs text-gray-500 flex items-center justify-between mt-2">
          {subtitle && <span>{subtitle}</span>}
          {trend && <span className="font-medium text-gray-600">{trend}</span>}
        </div>
      )}
    </div>
  );
};
