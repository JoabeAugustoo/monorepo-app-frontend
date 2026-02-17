import { NavigateFunction } from 'react-router-dom';

export enum NotificationType {
  REPORT_READY = 'REPORT_READY',
  REPORT_FAILED = 'REPORT_FAILED',
  PROCEDURE_COMPLETED = 'PROCEDURE_COMPLETED',
  PROCEDURE_CANCELLED = 'PROCEDURE_CANCELLED',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  PET_MARKED_DECEASED = 'PET_MARKED_DECEASED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export interface AppNotification {
  publicId: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationConfig {
  enabled: boolean;
  notificationUrl: string;
  getAuthToken?: () => string | null;
  onNotificationClick?: (notification: AppNotification, navigate: NavigateFunction) => void;
}
