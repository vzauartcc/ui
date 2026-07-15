export interface INotification {
  _id: string;
  recipient: number;
  read: boolean;
  title: string;
  content: string;
  link?: string;
  createdAt: string; // ISO date
}

export interface INotificationResponse {
  unread: number;
  amount: number;
  notif: INotification[];
}
