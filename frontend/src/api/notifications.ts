import apiClient from './client';
import type { ApiResponse, Notification } from '@/types';

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.get<ApiResponse<Notification[]>>('/notifications');
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch notifications');
  }
  return response.data.data ?? [];
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
  if (!response.data.success || !response.data.data) {
    return 0;
  }
  return response.data.data.unreadCount;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  const response = await apiClient.patch<ApiResponse<unknown>>(`/notifications/${id}/read`);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to mark notification as read');
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const response = await apiClient.patch<ApiResponse<unknown>>('/notifications/read-all');
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to mark all notifications as read');
  }
};
