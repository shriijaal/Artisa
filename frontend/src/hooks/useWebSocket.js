import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * useWebSocket hook for real-time messaging.
 *
 * Usage:
 *   const { send, typing, connected } = useWebSocket({
 *     onMessage: (msg) => { ... },
 *     onTyping: (userId, isTyping) => { ... },
 *     onRead: (messageIds, readerId) => { ... },
 *     onPresence: (userId, online) => { ... },
 *   });
 *
 *   send({ type: 'chat_message', message: { ... } });
 *   send({ type: 'typing', is_typing: true });
 *   send({ type: 'message_read', message_ids: [...] });
 */
const useWebSocket = ({ onMessage, onTyping, onRead, onPresence }) => {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const callbacksRef = useRef({ onMessage, onTyping, onRead, onPresence });

  // Keep callbacks ref fresh
  useEffect(() => {
    callbacksRef.current = { onMessage, onTyping, onRead, onPresence };
  }, [onMessage, onTyping, onRead, onPresence]);

  const connect = useCallback(() => {
    if (!user?.id) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/messages/${user.id}/`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const cbs = callbacksRef.current;

          switch (data.type) {
            case 'chat_message':
              cbs.onMessage?.(data.message);
              break;
            case 'typing':
              cbs.onTyping?.(data.user_id, data.is_typing);
              break;
            case 'message_read':
              cbs.onRead?.(data.message_ids, data.reader_id);
              break;
            case 'presence':
              cbs.onPresence?.(data.user_id, data.online);
              break;
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = (e) => {
        console.log('[WS] Disconnected, reconnecting in 3s...');
        wsRef.current = null;
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [user?.id]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const connected = wsRef.current?.readyState === WebSocket.OPEN;

  return { send, connected };
};

export default useWebSocket;
