export type NotificationType =
  | 'APPOINTMENT'
  | 'QUEUE'
  | 'MEDICAL_RECORD'
  | 'BILLING'
  | 'SYSTEM';

export type NotificationChannel = 'IN_APP' | 'SMS' | 'EMAIL';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  referenceId?: string;
  channel: NotificationChannel;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationSummary {
  total: number;
  unreadCount: number;
  notifications: AppNotification[];
}

export interface SendNotificationRequest {
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  referenceId?: string;
  channel?: NotificationChannel;
}
