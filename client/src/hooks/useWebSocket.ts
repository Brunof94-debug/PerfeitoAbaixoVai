import { useEffect, useRef, useState } from 'react';

interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: number;
}

export function useWebSocket() {
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const shouldReconnect = useRef(true);

  const connect = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        ws.current?.send(JSON.stringify({
          type: 'subscribe',
          symbols: ['btc', 'eth', 'bnb', 'sol', 'xrp', 'ada', 'doge', 'avax', 'dot', 'matic']
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'price_update') {
            setPrices(prev => ({
              ...prev,
              [data.symbol]: {
                symbol: data.symbol,
                price: data.price,
                change24h: data.change24h || 0,
                timestamp: Date.now(),
              }
            }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Only reconnect if component is still mounted
        if (shouldReconnect.current) {
          reconnectTimeout.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 5000);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    return () => {
      // Prevent reconnection attempts after unmount
      shouldReconnect.current = false;
      
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const subscribe = (symbols: string[]) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'subscribe',
        symbols
      }));
    }
  };

  const unsubscribe = (symbols: string[]) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'unsubscribe',
        symbols
      }));
    }
  };

  return {
    prices,
    isConnected,
    subscribe,
    unsubscribe,
  };
}