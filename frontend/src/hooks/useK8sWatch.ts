import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WatchEvent {
  type: string;
  resource_type: string;
  name: string;
  namespace: string;
  status: string;
}

export function useK8sWatch(channels: string[]) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<WatchEvent[]>([]);
  const queryClient = useQueryClient();
  const retriesRef = useRef(0);
  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/watch`);

    ws.onopen = () => {
      setConnected(true);
      retriesRef.current = 0;
      // Subscribe to all channels
      channelsRef.current.forEach(channel => {
        ws.send(JSON.stringify({ action: 'subscribe', channel }));
      });
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'pong' || data.type === 'subscribed' || data.type === 'unsubscribed') {
          return;
        }
        // It's a watch event
        const event = data as WatchEvent;
        setEvents(prev => [...prev.slice(-99), event]);

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['resources', event.resource_type] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // Reconnect with exponential backoff
      const delay = Math.min(1000 * 2 ** retriesRef.current, 30000);
      retriesRef.current++;
      setTimeout(() => {
        if (channelsRef.current.length > 0) {
          connect();
        }
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [queryClient]);

  useEffect(() => {
    if (channels.length > 0) {
      connect();
    }

    return () => {
      wsRef.current?.close();
    };
  }, [channels.join(','), connect]);

  // Ping to keep alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return { connected, events };
}
