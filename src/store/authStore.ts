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

const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('@camqrew_token') || localStorage.getItem('@camcrew_token');
    const userStr = localStorage.getItem('@camqrew_user') || localStorage.getItem('@camcrew_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        return {
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          activeRole: (user.role as UserRole) || 'customer',
        };
      }
    }
  } catch (e) {
    console.warn('Error reading initial auth from localStorage:', e);
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    activeRole: 'customer' as UserRole,
  };
};

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  isAuthenticated: initialAuth.isAuthenticated,
  isLoading: initialAuth.isLoading,
  activeRole: initialAuth.activeRole,

  login: async (user: User, token: string) => {
    set({ user, token, isAuthenticated: true, activeRole: user.role, isLoading: false });
    localStorage.setItem('@camqrew_token', token);
    localStorage.setItem('@camqrew_user', JSON.stringify(user));
  },

  logout: async () => {
    set({ user: null, token: null, isAuthenticated: false, activeRole: 'customer', isLoading: false });
    localStorage.removeItem('@camqrew_token');
    localStorage.removeItem('@camqrew_user');
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
      localStorage.setItem('@camqrew_user', JSON.stringify(updated));
    }
  },

  updateUser: (partial: Partial<User>) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...partial };
      set({ user: updated });
      localStorage.setItem('@camqrew_user', JSON.stringify(updated));
    }
  },

  loadAuth: async () => {
    try {
      const token = localStorage.getItem('@camqrew_token') || localStorage.getItem('@camcrew_token');
      const userStr = localStorage.getItem('@camqrew_user') || localStorage.getItem('@camcrew_user');
      const intendedRole = ((localStorage.getItem('@camqrew_intended_role') || localStorage.getItem('@camcrew_intended_role')) as UserRole) || 'customer';
      
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
        localStorage.setItem('@camqrew_token', session.access_token);
        localStorage.setItem('@camqrew_user', JSON.stringify(resolvedUser));
        localStorage.removeItem('@camqrew_intended_role');
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
