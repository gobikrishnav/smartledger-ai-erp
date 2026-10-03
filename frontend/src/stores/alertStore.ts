import { create } from 'zustand';
import type { FraudAlert } from '../types';

interface AlertState {
  alerts: FraudAlert[];
  unreadCount: number;
  addAlert: (alert: FraudAlert) => void;
  markAllRead: () => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unreadCount: 0,
  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts], unreadCount: s.unreadCount + 1 })),
  markAllRead: () => set((s) => ({ ...s, unreadCount: 0 })),
  clearAlerts: () => set({ alerts: [], unreadCount: 0 }),
}));
