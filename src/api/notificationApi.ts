import { supabase } from './supabaseClient';

export interface DBNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  target_url?: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationApi = {
  getNotifications: async (userId: string): Promise<DBNotification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Error fetching notifications:', error);
      return [];
    }
    return (data || []) as DBNotification[];
  },

  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) console.warn('Error marking notification read:', error);
  },

  markAllAsRead: async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) console.warn('Error marking all notifications read:', error);
  },

  createNotification: async (userId: string, payload: { title: string; body: string; targetUrl?: string }) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: payload.title,
        body: payload.body,
        target_url: payload.targetUrl,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.warn('Error creating notification:', error);
    }
    return data;
  },

  sendPushNotification: async (receiverId: string, payload: { title: string; body: string; targetUrl?: string }) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('push_token')
        .eq('id', receiverId)
        .single();

      await notificationApi.createNotification(receiverId, payload);

      if (userData?.push_token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            to: userData.push_token,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: { url: payload.targetUrl },
          }),
        }).catch(err => console.warn('Push delivery failed:', err));
      }
    } catch (e) {
      console.warn('sendPushNotification error:', e);
    }
  },
};
