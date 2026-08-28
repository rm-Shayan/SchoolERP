export interface NotificationLog {
  id: string;
  schoolId: string;
  recipient: string;
  channel: 'SMS' | 'EMAIL';
  message: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  errorReason?: string;
  sentAt?: string;
  createdAt: string;
  school?: { id: string; name: string; code: string };
}

export interface NotificationLogsResponse {
  items: NotificationLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NotificationDeliveryStatus {
  summary: { total: number; sent: number; delivered: number; pending: number; failed: number };
  byChannel: Record<string, number>;
}
