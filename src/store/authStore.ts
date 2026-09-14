import { create } from 'zustand';
import type { User, UserRole } from '../types/auth';
import { supabase } from '../api/supabaseClient';

interface AuthStoreState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setActiveRole: (role: UserRole) => void;
  updateUser: (partial: Partial<User>) => void;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  activeRole: 'customer',

  login: async (user: User, token: string) => {
    set({ user, token, isAuthenticated: true, activeRole: user.role, isLoading: false });
    localStorage.setItem('@camcrew_token', token);
    localStorage.setItem('@camcrew_user', JSON.stringify(user));
  },

  logout: async () => {
    set({ user: null, token: null, isAuthenticated: false, activeRole: 'customer', isLoading: false });
    localStorage.removeItem('@camcrew_token');
    localStorage.removeItem('@camcrew_user');
    await supabase.auth.signOut();
  },

  setActiveRole: (role: UserRole) => {
    set({ activeRole: role });
    const current = get().user;
    if (current) {
      const updated = { ...current, role };
      set({ user: updated });
      localStorage.setItem('@camcrew_user', JSON.stringify(updated));
    }
  },

  updateUser: (partial: Partial<User>) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...partial };
      set({ user: updated });
      localStorage.setItem('@camcrew_user', JSON.stringify(updated));
    }
  },

  loadAuth: async () => {
    try {
      const token = localStorage.getItem('@camcrew_token');
      const userStr = localStorage.getItem('@camcrew_user');
      const intendedRole = (localStorage.getItem('@camcrew_intended_role') as UserRole) || 'customer';
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        let parsedUser: User | null = null;
        if (userStr) {
          try { parsedUser = JSON.parse(userStr); } catch {}
        }

        const { data: dbProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const userRole = (dbProfile?.role || session.user.user_metadata?.role || intendedRole || parsedUser?.role || 'customer') as UserRole;
        const meta = session.user.user_metadata || {};

        const resolvedUser: User = {
          id: session.user.id,
          name: dbProfile?.name || meta.name || meta.full_name || parsedUser?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || parsedUser?.email || '',
          phone: dbProfile?.phone || session.user.phone || meta.phone || parsedUser?.phone || '',
          role: userRole,
          avatar: dbProfile?.avatar || meta.avatar_url || meta.picture || parsedUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
          subscription_tier: dbProfile?.subscription_tier || 'free',
          subscription_status: dbProfile?.subscription_status || 'inactive',
          subscription_end_date: dbProfile?.subscription_end_date,
          createdAt: dbProfile?.created_at || new Date().toISOString(),
        };

        // Auto-provision user record if first-time OAuth sign-in
        if (!dbProfile) {
          try {
            await supabase.from('users').insert([{
              id: session.user.id,
              name: resolvedUser.name,
              email: resolvedUser.email,
              phone: resolvedUser.phone,
              role: userRole,
              avatar: resolvedUser.avatar,
            }]);
          } catch (insertErr) {
            console.warn('Profile auto-create notice:', insertErr);
          }
        }

        set({
          token: session.access_token,
          user: resolvedUser,
          isAuthenticated: true,
          activeRole: userRole,
          isLoading: false
        });
        localStorage.setItem('@camcrew_token', session.access_token);
        localStorage.setItem('@camcrew_user', JSON.stringify(resolvedUser));
        localStorage.removeItem('@camcrew_intended_role');
      } else if (token && userStr) {
        const parsed = JSON.parse(userStr);
        set({ token, user: parsed, isAuthenticated: true, activeRole: parsed.role, isLoading: false });
      } else {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
