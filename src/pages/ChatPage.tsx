import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { chatApi, type ChatMessage, type ChatThread } from '../api/chatApi';
import { professionalApi } from '../api/professionalApi';
import { useAuthStore } from '../store/authStore';
import { 
  Send, 
  MessageSquare, 
  Loader2, 
  CheckCheck
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const targetUserId = searchParams.get('userId');

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeOtherUserId, setActiveOtherUserId] = useState<string>(targetUserId || '');
  const [activeOtherUser, setActiveOtherUser] = useState<{ name: string; avatar: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated && !user) {
      navigate('/login?redirect=/chat');
    }
  }, [isAuthenticated, user, navigate]);

  const loadThreads = async () => {
    try {
      const threadList = await chatApi.getThreads();
      setThreads(threadList);
      if (!activeOtherUserId && threadList.length > 0) {
        setActiveOtherUserId(threadList[0].otherUserId);
      }
    } catch (err) {
      console.warn('Error loading threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadThreads();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (targetUserId) {
      setActiveOtherUserId(targetUserId);
      professionalApi.getProfileById(targetUserId)
        .then((p) => setActiveOtherUser({ name: p.name, avatar: p.avatar }))
        .catch(() => setActiveOtherUser({ name: 'Creative Pro', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' }));
    }
  }, [targetUserId]);

  useEffect(() => {
    if (!activeOtherUserId) return;

    setLoadingMessages(true);
    chatApi.getMessages(activeOtherUserId)
      .then((msgs) => {
        setMessages(msgs);
        const thread = threads.find(t => t.otherUserId === activeOtherUserId);
        if (thread) {
          setActiveOtherUser({ name: thread.otherUserName, avatar: thread.otherUserAvatar });
        }
      })
      .catch((e) => console.warn('Could not load messages', e))
      .finally(() => setLoadingMessages(false));

    const { unsubscribe } = chatApi.subscribeToMessages(
      activeOtherUserId,
      (newMsg) => {
        setMessages((prev) => [...prev, newMsg]);
        loadThreads();
      },
      user?.id
    );

    return () => {
      unsubscribe();
    };
  }, [activeOtherUserId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeOtherUserId || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const sentMsg = await chatApi.sendMessage(activeOtherUserId, textToSend);
      setMessages((prev) => [...prev, sentMsg]);
      loadThreads();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-page-container container" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="chat-layout card" style={{ height: '100%', display: 'flex', overflow: 'hidden', padding: 0 }}>
        <div className="chat-threads-sidebar" style={{ width: 320, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div className="threads-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Messages</h2>
          </div>

          <div className="threads-list" style={{ flex: 1, overflowY: 'auto' }}>
            {loadingThreads ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : threads.length === 0 && !activeOtherUserId ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14 }}>No conversations yet.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Messages with booked creators will appear here.</p>
              </div>
            ) : (
              threads.map((t) => (
                <div
                  key={t.id}
                  className={`thread-item ${activeOtherUserId === t.otherUserId ? 'active' : ''}`}
                  onClick={() => setActiveOtherUserId(t.otherUserId)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: activeOtherUserId === t.otherUserId ? 'var(--bg-elevated)' : 'transparent',
                  }}
                >
                  <img
                    src={t.otherUserAvatar}
                    alt={t.otherUserName}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 14 }} className="truncate">{t.otherUserName}</strong>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.lastMessageTime}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }} className="truncate">
                      {t.lastMessage}
                    </p>
                  </div>
                  {t.unreadCount > 0 && (
                    <span className="badge-unread" style={{ alignSelf: 'center' }}>{t.unreadCount}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeOtherUserId ? (
            <>
              <div className="chat-room-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={activeOtherUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'}
                  alt={activeOtherUser?.name}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{activeOtherUser?.name || 'User'}</h3>
                  <span style={{ fontSize: 11, color: 'var(--accent)' }}>● Direct Secure Messenger</span>
                </div>
              </div>

              <div className="chat-messages-body" style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', margin: 'auto' }}>
                    <Loader2 size={28} className="animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 12px' }} />
                    <p>Start a conversation. Introduce your shoot or ask about equipment availability.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`message-row ${isMine ? 'mine' : 'theirs'}`}
                        style={{
                          display: 'flex',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          className="message-bubble"
                          style={{
                            maxWidth: '65%',
                            padding: '10px 14px',
                            borderRadius: 14,
                            background: isMine ? 'var(--accent)' : 'var(--bg-elevated)',
                            color: isMine ? '#fff' : 'var(--text-primary)',
                          }}
                        >
                          <p style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{m.text}</p>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <span style={{ fontSize: 10, opacity: 0.75 }}>{m.timestamp}</span>
                            {isMine && <CheckCheck size={12} style={{ opacity: 0.75 }} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-bar" style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="input-field"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={!inputText.trim() || sending}>
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 16px' }} />
              <h3>Select a conversation</h3>
              <p>Choose an applicant or booked pro from the left to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
