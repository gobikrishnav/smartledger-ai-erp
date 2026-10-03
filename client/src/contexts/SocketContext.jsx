import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentLiveInvoices, setRecentLiveInvoices] = useState([]);

  useEffect(() => {
    // Connect to backend Socket.io gateway on Render or localhost
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://smartledger-ai-erp.onrender.com');
    const socketClient = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socketClient.on('connect', () => {
      console.log('📡 Connected to SmartLedger Socket.io Gateway:', socketClient.id);
      if (user?.role) {
        socketClient.emit('join_role_room', user.role);
      }
    });

    // 1. Stock Low Alert (for Warehouse Managers & General)
    socketClient.on('stock:low_alert', (data) => {
      console.log('📦 Low Stock Event Received:', data);
      setStockAlerts(prev => [data, ...prev.slice(0, 19)]);
    });

    // 2. Risk Anomaly Flag (for Business Owners)
    socketClient.on('risk:anomaly_flag', (data) => {
      console.log('⚠️ Risk Anomaly Event Received:', data);
      setRiskAlerts(prev => [data, ...prev.slice(0, 19)]);
    });

    // 3. Live Notification Feed
    socketClient.on('notification:feed', (data) => {
      setNotifications(prev => [data, ...prev.slice(0, 29)]);
    });

    // 4. Live Invoices Created
    socketClient.on('invoice:created', (data) => {
      setRecentLiveInvoices(prev => [data, ...prev.slice(0, 19)]);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [user?.role]);

  return (
    <SocketContext.Provider value={{
      socket,
      stockAlerts,
      riskAlerts,
      notifications,
      recentLiveInvoices
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
