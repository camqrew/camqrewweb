import { supabase } from './supabaseClient';
import { notificationApi } from './notificationApi';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'professional';
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatThread {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const chatApi = {
  getThreads: async (): Promise<ChatThread[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];
    const myId = userData.user.id;

    const { data: msgs, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id(id, name, avatar),
        receiver:users!receiver_id(id, name, avatar)
      `)
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order('created_at', { ascending: false });

    if (error || !msgs) {
      console.warn('Error fetching threads:', error);
      return [];
    }

    const threadsMap = new Map<string, ChatThread>();

    msgs.forEach((m: any) => {
      const isSender = m.sender_id === myId;
      const otherUser = isSender ? m.receiver : m.sender;
      if (!otherUser) return;

      const otherUserId = otherUser.id;
      
      if (!threadsMap.has(otherUserId)) {
        threadsMap.set(otherUserId, {
          id: otherUserId,
          otherUserId: otherUserId,
          otherUserName: otherUser.name || 'User',
          otherUserAvatar: otherUser.avatar || '',
          lastMessage: m.text,
          lastMessageTime: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unreadCount: (!isSender && !m.is_read) ? 1 : 0,
        });
      } else {
        if (!isSender && !m.is_read) {
          const t = threadsMap.get(otherUserId)!;
          t.unreadCount += 1;
        }
      }
    });

    return Array.from(threadsMap.values());
  },

  getMessages: async (otherUserId: string): Promise<ChatMessage[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];
    const myId = userData.user.id;

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id(id, name)
      `)
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching messages', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      threadId: otherUserId,
      senderId: row.sender_id,
      senderName: row.sender?.name || 'User',
      senderRole: row.sender_id === myId ? 'customer' : 'professional',
      text: row.text || '',
      isRead: row.is_read,
      timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  },

  sendMessage: async (receiverId: string, text: string): Promise<ChatMessage> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');
    const myId = userData.user.id;

    const { data: senderProfile } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', myId)
      .single();
    const senderRole = (senderProfile?.role || 'customer') as any;

    const { data: bookingData } = await supabase
      .from('bookings')
      .select('id')
      .or(`and(customer_id.eq.${myId},professional_id.eq.${receiverId}),and(customer_id.eq.${receiverId},professional_id.eq.${myId})`)
      .limit(1)
      .maybeSingle();

    const newRow = {
      sender_id: myId,
      receiver_id: receiverId,
      text: text,
      is_read: false,
      booking_id: bookingData ? bookingData.id : null,
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([newRow])
      .select(`
        *,
        sender:users!sender_id(id, name)
      `)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to send message');
    }

    try {
      await notificationApi.sendPushNotification(receiverId, {
        title: `💬 New message from ${senderProfile?.name || 'Someone'}`,
        body: text.length > 80 ? text.slice(0, 80) + '...' : text,
        targetUrl: `/chat?userId=${myId}`,
      });
    } catch (e) {
      console.warn('Chat notification error', e);
    }
    
    return {
      id: String(data.id),
      threadId: receiverId,
      senderId: data.sender_id,
      senderName: data.sender?.name || 'You',
      senderRole: senderRole,
      text: data.text,
      isRead: false,
      timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  },
  
  markAsRead: async (otherUserId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const myId = userData.user.id;

    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', myId)
      .eq('is_read', false);
  },

  subscribeToMessages: (
    otherUserId: string,
    onNewMessage: (msg: ChatMessage) => void,
    currentUserId?: string
  ) => {
    let myId = currentUserId || '';
    const sortedIds = [myId || 'anon', otherUserId].sort();
    const channelName = 'chat_' + sortedIds.join('_');

    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as any;
          if (
            (row.sender_id === myId && row.receiver_id === otherUserId) ||
            (row.sender_id === otherUserId && row.receiver_id === myId)
          ) {
            onNewMessage({
              id: String(row.id),
              threadId: otherUserId,
              senderId: row.sender_id,
              senderName: row.sender_id === myId ? 'You' : 'User',
              senderRole: row.sender_id === myId ? 'customer' : 'professional',
              text: row.text || '',
              isRead: row.is_read,
              timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }
        }
      )
      .subscribe();

    if (!myId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          myId = data.user.id;
        }
      });
    }

    const unsubscribe = () => {
      supabase.removeChannel(channel);
    };

    return { unsubscribe };
  }
};
