import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_ENDPOINT } from '../services/api';

export const useMultiplayerSync = (matchId, userId, authToken, onMessageReceived) => {
  const stompClientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!matchId || !authToken) return;

    let client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      connectHeaders: { Authorization: `Bearer ${authToken}` },
      reconnectDelay: 4000,
      onConnect: () => {
        setIsConnected(true);
        setError('');

        client.subscribe(`/topic/match/${matchId}/sync`, (message) => {
          try {
            const parsedMessage = JSON.parse(message.body);
            // Ignore messages sent by ourselves (optional, but usually good for avoiding echo loops)
            if (parsedMessage.senderId !== Number(userId)) {
                if (onMessageReceived) {
                    onMessageReceived(parsedMessage);
                }
            }
          } catch (e) {
            console.error('Error parsing sync message:', e);
          }
        });
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        setIsConnected(false);
        setError(frame.headers?.message || 'STOMP Error');
        console.error('STOMP Error', frame);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
      setIsConnected(false);
    };
  }, [matchId, authToken, userId, onMessageReceived]);

  const sendSyncEvent = useCallback((actionType, payload) => {
    if (!stompClientRef.current?.connected) {
      console.warn('Cannot send event, STOMP client is not connected.');
      return;
    }

    const message = {
      senderId: Number(userId),
      actionType,
      payload,
    };

    stompClientRef.current.publish({
      destination: `/app/match/${matchId}/sync`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(message),
    });
  }, [matchId, authToken, userId]);

  return { isConnected, error, sendSyncEvent };
};
