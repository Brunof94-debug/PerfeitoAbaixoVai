import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface AlertNotification {
  type: string;
  alert: {
    id: string;
    cryptoName: string;
    cryptoSymbol: string;
    currentPrice: number;
    message: string;
    triggered: boolean;
    triggeredAt: Date;
  };
}

export function useAlertNotifications() {
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Get current user
  const { data: user } = useQuery<{ id: string; email: string }>({
    queryKey: ['/api/auth/user'],
  });

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Listen for WebSocket alert notifications
  useEffect(() => {
    if (!user?.id) return;
    
    let ws: WebSocket | null = null;
    
    // Fetch WebSocket auth token and connect
    fetch('/api/auth/ws-token')
      .then(res => {
        if (!res.ok) throw new Error('Failed to get WS token');
        return res.json();
      })
      .then(({ token }) => {
        ws = new WebSocket(
          `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
        );

        ws.onopen = () => {
          console.log('[Alert Notifications] WebSocket connected');
          // Authenticate WebSocket with secure token
          ws!.send(JSON.stringify({
            type: 'auth',
            token,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data: AlertNotification = JSON.parse(event.data);

            if (data.type === 'auth-error') {
              console.error('[Alert Notifications] Auth error:', data);
              ws?.close();
              return;
            }

            if (data.type === 'alert-triggered') {
          // Show browser notification
          if (notificationPermission === 'granted') {
            new Notification('🔔 Price Alert Triggered!', {
              body: data.alert.message,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: data.alert.id,
              requireInteraction: true,
            });
          }

          // Show toast notification
          toast({
            title: '🔔 Price Alert Triggered!',
            description: data.alert.message,
            duration: 10000, // 10 seconds
          });

          // Invalidate alerts query to refresh the list
          queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });

          // Play notification sound (optional)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSOBz/LZlzcJGGe57OafTgwOUKfj8LNlHgU2jNTxz3YpBSh2x+/dj0IKEF6z6OmsWBULTKXh8rpuIgUjgc/y2JU2CRhnuezmn04LDlCm4+CyZh0FNIzU8c9zKgUpdsju3Y9DChBesuXrrVkVDEyh4PK8bCQFJH/N8tiWNwkZZ7rs5ptPDA5RqOPgsWYcBjaP1fHOcikEKXbH7t2RQgoQXLPm7K1aFgxLoeHyvWwmBSV9zvLYljgKGWi77OabUAwPUajk77JnHgU2jNXxzHMoAyh1yO7dk0MLEF20567NWhYMTKHh8bxsJgUkfszz2Jc4ChlnuuvmmFANEFGo5PC0aBwENI3V8cxzKAMpdcju3JNCCxBdtOevzloXDU2j4fK8biYFI3/M8tiWOAoZZ7vo5ptPDBBSqeTvsmYdBDON1PHMcSgDKnbI7NyTQwwQXrPn7s9aFw1Oo+Lxu24lBSKAy/LYlzgJGWe66+ebTwwRUqnk77JnHQUzjtXxy3IoAyp2x+3dlEILEF605+/PWBcOTKPi8btuJQQjgMzy2Jg4CRlouu3mmU8MElKp5fCzaB0FM47V8Mp0JgMqdcjs3ZVDCxBdsOfvz1oYDk2j4vG8bCUEI4DN8NiWOQkYaLrs55pQDBJSqeXws2geBDSO1fDLcycEKnXI7d2VQgwQXrTo7s9aGA1No+LyumwlBCOBzvDYlzoJGGi57OaaUQ0SEqnl8LRoHgQzj9bwynQmAyp1yO3dlUILEF205/DPWhkNTqTi8btsJQQkgMzw2Jc4ChhnuevmmFAMElKp5O+0aB0ENY/W8Ml0JwMrdsjt3ZVCDBBfte/vz1kZDk6k4vK8bCYEI3/N8NeWOAoYZ7rr5phQDBFSqeTws2gdBTWP1/DJdSYDK3bI7d2UQw'); 
            audio.play().catch(() => {}); // Ignore errors
          } catch (error) {
            // Silent fail for audio
          }

              console.log('[Alert Notifications] Alert triggered:', data.alert);
            }
          } catch (error) {
            console.error('[Alert Notifications] Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[Alert Notifications] WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('[Alert Notifications] WebSocket closed');
        };
      })
      .catch(error => {
        console.error('[Alert Notifications] Failed to connect:', error);
      });

    return () => {
      ws?.close();
    };
  }, [notificationPermission, toast, user]);

  return {
    notificationPermission,
    requestPermission: () => {
      if ('Notification' in window && Notification.permission === 'default') {
        return Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
          return permission;
        });
      }
      return Promise.resolve(notificationPermission);
    },
  };
}
