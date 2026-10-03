import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Monitor, FileText, Package, AlertTriangle, LayoutDashboard, BarChart2, ShieldAlert } from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuthStore();
  
  if (!user) return null;

  const links = [];
  
  if (user.role === 'Cashier' || user.role === 'Business_Owner') {
    links.push({ to: '/pos', label: 'POS Terminal', icon: <Monitor size={18} /> });
    links.push({ to: '/invoices', label: 'Invoices', icon: <FileText size={18} /> });
  }
  
  if (user.role === 'Warehouse_Manager' || user.role === 'Business_Owner') {
    links.push({ to: '/warehouse', label: 'Warehouse Console', icon: <Package size={18} /> });
    links.push({ to: '/inventory', label: 'Inventory Management', icon: <AlertTriangle size={18} /> });
  }
  
  if (user.role === 'Business_Owner') {
    links.push({ to: '/owner', label: 'Dashboard', icon: <LayoutDashboard size={18} /> });
    links.push({ to: '/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> });
    links.push({ to: '/audit-log', label: 'Fraud Audit Log', icon: <ShieldAlert size={18} /> });
  }

  return (
    <aside className="w-60 bg-[#f3f3f3] border-r border-gray-300 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive ? 'bg-black text-white' : 'text-black hover:bg-[#e0e0e0]'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};
