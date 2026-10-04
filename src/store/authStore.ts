import { create } from 'zustand';
import type { User, UserRole } from '../types/auth';
import { supabase } from '../api/supabaseClient';
import { isCustomAvatar } from '../utils/avatarUtils';

interface AuthStoreState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  needsRoleSelection: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setActiveRole: (role: UserRole) => void;
  selectAccountRole: (role: UserRole) => Promise<void>;
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
          needsRoleSelection: localStorage.getItem('@camcrew_needs_role') === 'true',
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
    needsRoleSelection: false,
  };
};

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  isAuthenticated: initialAuth.isAuthenticated,
  isLoading: initialAuth.isLoading,
  activeRole: initialAuth.activeRole,
  needsRoleSelection: initialAuth.needsRoleSelection,

  login: async (user: User, token: string) => {
    set({ user, token, isAuthenticated: true, activeRole: user.role, needsRoleSelection: false, isLoading: false });
    localStorage.setItem('@camqrew_token', token);
    localStorage.setItem('@camqrew_user', JSON.stringify(user));
    localStorage.removeItem('@camcrew_needs_role');
  },

  logout: async () => {
    set({ user: null, token: null, isAuthenticated: false, activeRole: 'customer', needsRoleSelection: false, isLoading: false });
    localStorage.removeItem('@camqrew_token');
    localStorage.removeItem('@camqrew_user');
    localStorage.removeItem('@camcrew_token');
    localStorage.removeItem('@camcrew_user');
    localStorage.removeItem('@camcrew_needs_role');
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

  selectAccountRole: async (role: UserRole) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, role };
      set({ user: updated, activeRole: role, needsRoleSelection: false });
      localStorage.setItem('@camqrew_user', JSON.stringify(updated));
      localStorage.removeItem('@camcrew_needs_role');
      try {
        await supabase.from('users').update({ role }).eq('id', current.id);
      } catch (err) {
        console.warn('Role update notice:', err);
      }
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

        // Extract Google / OAuth avatar from all possible metadata and identity locations
        const oauthAvatar = 
          meta.avatar_url || 
          meta.picture || 
          session.user.identities?.[0]?.identity_data?.avatar_url || 
          session.user.identities?.[0]?.identity_data?.picture || 
          '';

        const finalAvatar = isCustomAvatar(dbProfile?.avatar)
          ? dbProfile!.avatar
          : (oauthAvatar || (isCustomAvatar(parsedUser?.avatar) ? parsedUser!.avatar : ''));

        const resolvedUser: User = {
          id: session.user.id,
          name: dbProfile?.name || meta.name || meta.full_name || parsedUser?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || parsedUser?.email || '',
          phone: dbProfile?.phone || session.user.phone || meta.phone || parsedUser?.phone || '',
          role: userRole,
          avatar: finalAvatar,
          subscription_tier: dbProfile?.subscription_tier || 'free',
          subscription_status: dbProfile?.subscription_status || 'inactive',
          subscription_end_date: dbProfile?.subscription_end_date,
          createdAt: dbProfile?.created_at || new Date().toISOString(),
        };

        const isNewOAuth = !dbProfile;
        const needsRole = isNewOAuth || localStorage.getItem('@camcrew_needs_role') === 'true';

        // Auto-provision user record if first-time OAuth sign-in, or sync Google avatar if missing in DB
        if (!dbProfile) {
          try {
            await supabase.from('users').insert([{
              id: session.user.id,
              name: resolvedUser.name,
              email: resolvedUser.email,
              phone: resolvedUser.phone,
              role: userRole,
              avatar: resolvedUser.avatar || null,
            }]);
            localStorage.setItem('@camcrew_needs_role', 'true');
          } catch (insertErr) {
            console.warn('Profile auto-create notice:', insertErr);
          }
        } else if (oauthAvatar && (!dbProfile.avatar || !isCustomAvatar(dbProfile.avatar))) {
          // Sync Google avatar to database if dbProfile had empty or stock placeholder avatar
          supabase.from('users').update({ avatar: oauthAvatar }).eq('id', session.user.id).then();
          if (dbProfile.role === 'professional') {
            supabase.from('professional_profiles').update({ avatar: oauthAvatar }).eq('id', session.user.id).then();
          }
        }

        set({
          token: session.access_token,
          user: resolvedUser,
          isAuthenticated: true,
          activeRole: userRole,
          needsRoleSelection: needsRole,
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
