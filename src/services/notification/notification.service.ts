import { zauApi } from '@/utils/api';
import type { INotificationResponse } from './notification.types';

export const notificationService = {
  getNotifications(): Promise<INotificationResponse> {
    return zauApi
      .get('user/notifications', {
        context: { silent: true },
      })
      .json();
  },
  deleteAllNotifications() {
    return zauApi.delete('user/notifications').json();
  },
  readAllNotifications() {
    return zauApi.put('user/notifications/read/all').json();
  },
  readNotification(id: string) {
    return zauApi.put(`user/notifications/read/${id}`).json();
  },
  deleteNotification(id: string) {
    return zauApi.delete(`user/notifications/${id}`).json();
  },
};
