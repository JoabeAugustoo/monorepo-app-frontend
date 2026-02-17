import { io, Socket } from 'socket.io-client';
import { AppNotification } from '../types/notification';

export class NotificationSocketService {
  private socket: Socket | null = null;

  onNotification: ((notification: AppNotification) => void) | null = null;
  onCountUpdate: ((count: number) => void) | null = null;
  onConnectionChange: ((connected: boolean) => void) | null = null;

  connect(url: string, token: string): void {
    if (this.socket) return;

    this.socket = io(`${url}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    this.socket.on('connect', () => {
      this.onConnectionChange?.(true);
    });

    this.socket.on('disconnect', () => {
      this.onConnectionChange?.(false);
    });

    this.socket.on('notification', (notification: AppNotification) => {
      this.onNotification?.(notification);
    });

    this.socket.on('notification:count', (data: number | { count: number }) => {
      const count = typeof data === 'number' ? data : data.count;
      this.onCountUpdate?.(count);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[NotificationSocket] connect_error:', err.message);
    });
  }

  markAsRead(publicId: string): void {
    this.socket?.emit('markAsRead', { publicId });
  }

  markAllRead(): void {
    this.socket?.emit('markAllRead', {});
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.onConnectionChange?.(false);
    }
  }

  destroy(): void {
    this.disconnect();
    this.onNotification = null;
    this.onCountUpdate = null;
    this.onConnectionChange = null;
  }
}
