import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAlertStore } from '../stores/alertStore';
import type { FraudAlert } from '../types';

export function useWebSocket() {
  const { accessToken } = useAuthStore();
  const addAlert = useAlertStore(state => state.addAlert);
  const [isConnected, setIsConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState<FraudAlert | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    if (!accessToken) return;

    function connect() {
      const url = `ws://localhost:8000/ws/v1/alerts/business-owner?token=${accessToken}`;
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as FraudAlert;
          addAlert(data);
          setLastAlert(data);
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        timeout.current = setTimeout(connect, delay);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    }

    connect();

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
      ws.current?.close();
    };
  }, [accessToken, addAlert]);

  return { isConnected, lastAlert };
}
