import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import type { DBNotification } from '../api/notificationApi';
import { 
  Bell, 
  MessageSquare, 
  Briefcase, 
  Calendar, 
  X, 
  ArrowRight
} from 'lucide-react';

interface ToastAlert {
  id: string;
  title: string;
  body: string;
  targetUrl?: string;
  type?: string;
  timestamp: string;
}

export const GlobalRealtimeAlerts: React.FC = () => {
  const { user, isAuthenticated, activeRole } = useAuthStore();
  const { addNotification, fetchNotifications } = useNotificationStore();
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Synthesize a crisp, pleasant 2-tone notification chime via Web Audio API
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.26);

      // Note 2: A5 (880 Hz) - higher bell chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (e) {
      // Audio playback blocked by browser policy before interaction
    }
  }, []);

  // Request browser Notification API permission when authenticated
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [isAuthenticated]);

  // Push new toast and auto dismiss after 7 seconds
  const triggerAlert = useCallback((alert: Omit<ToastAlert, 'id' | 'timestamp'>) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastAlert = {
      ...alert,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep maximum 4 toasts stacked
    playChime();

    // Trigger native desktop browser notification if allowed
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(alert.title, {
          body: alert.body,
          icon: '/assets/favicon.png',
        });
        notif.onclick = () => {
          window.focus();
          if (alert.targetUrl) {
            navigate(alert.targetUrl);
          }
        };
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }

    // Auto-dismiss timer
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  }, [playChime, navigate]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToastClick = (toast: ToastAlert) => {
    dismissToast(toast.id);
    if (!toast.targetUrl) return;

    // Normalize URL
    let url = toast.targetUrl;
    if (url.startsWith('camcrew://chat/')) {
      url = `/chat?userId=${url.replace('camcrew://chat/', '')}`;
    } else if (url.startsWith('camcrew://booking/')) {
      url = '/dashboard?tab=bookings';
    } else if (url.startsWith('camcrew://job_board') || url.includes('jobboard')) {
      url = '/dashboard?tab=jobboard';
    } else if (url.startsWith('camcrew://')) {
      url = '/dashboard';
    }

    navigate(url);
  };

  // Setup Supabase Realtime Channels
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // 1. Initial fetch
    fetchNotifications(user.id);

    // 2. Realtime listener for private notifications table
    const notifChannel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as DBNotification;
          addNotification(row);
          triggerAlert({
            title: row.title,
            body: row.body,
            targetUrl: row.target_url,
            type: row.type || 'general',
          });
        }
      )
      .subscribe();

    // 3. For professionals: Realtime listener for new broadcast job_requests
    let jobsChannel: any = null;
    const isPro = user.role === 'professional' || activeRole === 'professional';

    if (isPro) {
      jobsChannel = supabase
        .channel('realtime_public_job_leads')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'job_requests',
            filter: 'status=eq.open',
          },
          (payload) => {
            const job = payload.new as any;
            // Ignore if current pro is the poster
            if (job.client_id === user.id) return;

            const locText = job.city ? (job.district ? `${job.city}, ${job.district}` : job.city) : (job.location || 'Your Region');
            const budgetText = job.budget ? ` • Budget ₹${Number(job.budget).toLocaleString('en-IN')}` : '';

            triggerAlert({
              title: `📢 New Broadcast Lead in ${locText}!`,
              body: `${job.title || 'Shoot Requirement'}${budgetText}`,
              targetUrl: '/dashboard?tab=jobboard',
              type: 'job_broadcast',
            });
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(notifChannel);
      if (jobsChannel) {
        supabase.removeChannel(jobsChannel);
      }
    };
  }, [isAuthenticated, user?.id, user?.role, activeRole, addNotification, fetchNotifications, triggerAlert]);

  if (toasts.length === 0) return null;

  return (
    <div className="camcrew-realtime-alert-container" aria-live="polite">
      {toasts.map((toast) => {
        const isChat = toast.type === 'chat' || toast.targetUrl?.includes('chat');
        const isJob = toast.type === 'job_broadcast' || toast.targetUrl?.includes('jobboard');
        const isBooking = toast.type === 'booking' || toast.targetUrl?.includes('booking');

        let Icon = Bell;
        let badgeClass = 'badge-general';
        let actionLabel = 'View Details';

        if (isChat) {
          Icon = MessageSquare;
          badgeClass = 'badge-chat';
          actionLabel = 'Reply to Chat';
        } else if (isJob) {
          Icon = Briefcase;
          badgeClass = 'badge-job';
          actionLabel = 'Apply Now';
        } else if (isBooking) {
          Icon = Calendar;
          badgeClass = 'badge-booking';
          actionLabel = 'View Booking';
        }

        return (
          <div 
            key={toast.id} 
            className="camcrew-realtime-toast"
            onClick={() => handleToastClick(toast)}
            role="alert"
          >
            <div className={`toast-icon-wrapper ${badgeClass}`}>
              <Icon size={18} />
            </div>

            <div className="toast-content">
              <div className="toast-header-row">
                <span className="toast-title">{toast.title}</span>
                <span className="toast-time">{toast.timestamp}</span>
              </div>
              <p className="toast-body">{toast.body}</p>
              
              <div className="toast-footer-action">
                <span className="toast-action-link">
                  {actionLabel} <ArrowRight size={13} />
                </span>
              </div>
            </div>

            <button 
              className="toast-close-btn" 
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
            <div className="toast-progress-bar" />
          </div>
        );
      })}
    </div>
  );
};
