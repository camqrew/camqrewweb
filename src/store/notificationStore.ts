import { create } from 'zustand';
import { notificationApi } from '../api/notificationApi';
import type { DBNotification } from '../api/notificationApi';

interface NotificationStoreState {
  notifications: DBNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (notif: DBNotification) => void;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });
    try {
      const list = await notificationApi.getNotifications(userId);
      const unreadCount = list.filter(n => !n.is_read).length;
      set({ notifications: list, unreadCount, isLoading: false });
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    const list = get().notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    const unreadCount = list.filter(n => !n.is_read).length;
    set({ notifications: list, unreadCount });
    await notificationApi.markAsRead(id);
  },

  markAllAsRead: async (userId: string) => {
    const list = get().notifications.map(n => ({ ...n, is_read: true }));
    set({ notifications: list, unreadCount: 0 });
    await notificationApi.markAllAsRead(userId);
  },

  addNotification: (notif: DBNotification) => {
    const existing = get().notifications;
    if (existing.some(n => n.id === notif.id)) return;
    const list = [notif, ...existing];
    const unreadCount = list.filter(n => !n.is_read).length;
    set({ notifications: list, unreadCount });
  },
}));
