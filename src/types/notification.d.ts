type NotificationAction = {
  label: string;
  type?: 'primary' | 'secondary';
  onClick?: () => void;
  link?: string;
}

export interface Notification {
  title: string;
  description: string;
  duration?: number;
  type: 'success' | 'warning' | 'info' | 'error' | 'pending';
  link?: string;
  actions?: NotificationAction[];
}

export interface INotificationContext {
  notification: Notification | null;
  showNotification: boolean;
  dismissNotification: () => void;
  popNotification: (notification: Notification) => void;
}