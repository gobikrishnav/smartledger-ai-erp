import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAlertStore } from '../stores/alertStore';
import { Badge } from './Badge';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, clearAuth } = useAuthStore();
  const { unreadCount } = useAlertStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="h-16 bg-black text-white flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="font-bold text-xl tracking-wide">
        SmartLedger AI
      </div>
      <div className="flex items-center gap-6">
        {user?.role === 'Business_Owner' && (
          <div className="relative cursor-pointer" onClick={() => navigate('/audit-log')}>
            <Bell className="w-5 h-5 text-gray-300 hover:text-white transition" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-black">
                {unreadCount}
              </span>
            )}
          </div>
        )}
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user.full_name}</span>
            <Badge variant="muted">{user.role.replace('_', ' ')}</Badge>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className="bg-white text-black px-3 py-1.5 rounded text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-2"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};
