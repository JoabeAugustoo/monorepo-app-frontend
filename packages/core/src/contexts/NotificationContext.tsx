import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { AppNotification, NotificationConfig } from '../types/notification';
import { NotificationSocketService } from '../services/notificationSocketService';

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  panelOpen: boolean;
  wsConnected: boolean;
  setPanelOpen: (open: boolean) => void;
  markAsRead: (publicId: string) => void;
  markAllAsRead: () => void;
  config: NotificationConfig;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

export const useNotificationsOptional = (): NotificationContextValue | null => {
  return useContext(NotificationContext);
};

interface NotificationProviderProps {
  children: ReactNode;
  config: NotificationConfig;
}

export const NotificationProvider = ({ children, config }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<NotificationSocketService | null>(null);

  // Derive unread count from notifications array — single source of truth
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch initial notifications via REST
  useEffect(() => {
    const token = config.getAuthToken?.();
    if (!token) return;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const baseUrl = config.notificationUrl;

    fetch(`${baseUrl}/api/notifications?page=1&limit=20`, { headers })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data?: AppNotification[] }) => {
        if (Array.isArray(body.data)) {
          setNotifications(body.data);
        }
      })
      .catch(() => {
        // graceful fail - backend not ready
      });
  }, [config.notificationUrl, config.getAuthToken]);

  // Socket.IO connection
  useEffect(() => {
    const token = config.getAuthToken?.();
    if (!token) return;

    const socket = new NotificationSocketService();

    socket.onNotification = (notification: AppNotification) => {
      setNotifications((prev) => {
        // Deduplicate — don't add if already in the list
        if (prev.some((n) => n.publicId === notification.publicId)) {
          return prev;
        }
        return [notification, ...prev];
      });
    };

    socket.onConnectionChange = (connected: boolean) => {
      setWsConnected(connected);
    };

    socket.connect(config.notificationUrl, token);
    socketRef.current = socket;

    return () => {
      socket.destroy();
      socketRef.current = null;
    };
  }, [config.notificationUrl, config.getAuthToken]);

  const markAsRead = useCallback(
    (publicId: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.publicId === publicId ? { ...n, read: true, readAt: new Date().toISOString() } : n)),
      );

      // Emit via socket
      socketRef.current?.markAsRead(publicId);
    },
    [],
  );

  const markAllAsRead = useCallback(() => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })));

    // Emit via socket
    socketRef.current?.markAllRead();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        panelOpen,
        wsConnected,
        setPanelOpen,
        markAsRead,
        markAllAsRead,
        config,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
