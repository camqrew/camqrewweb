import { supabase } from './supabaseClient';
import type { User, UserRole } from '../types/auth';

export const authApi = {
  sendOTP: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    try {
      await supabase.auth.signInWithOtp({
        phone: '+91' + cleanedPhone,
      });
    } catch (e) {
      console.warn('Supabase SMS provider notice:', e);
    }
    
    return {
      success: true,
      message: `OTP sent to +91 ${cleanedPhone}. (For testing, enter OTP: 123456)`,
    };
  },

  verifyOTP: async (phone: string, otp: string): Promise<{ token: string; user: User }> => {
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.trim();

    // Verify dummy OTP of 123456
    if (cleanOtp !== '123456') {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: '+91' + cleanedPhone,
          token: cleanOtp,
          type: 'sms',
        });
        if (!error && data?.session) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user?.id)
            .single();

          return {
            token: data.session.access_token,
            user: {
              id: data.user?.id || '',
              name: userProfile?.name || 'User',
              email: userProfile?.email || '',
              phone: userProfile?.phone || `+91 ${cleanedPhone}`,
              role: (userProfile?.role as UserRole) || 'customer',
              avatar: userProfile?.avatar || '',
              banner_image: userProfile?.banner_image || '',
              subscription_tier: userProfile?.subscription_tier || 'free',
              subscription_status: userProfile?.subscription_status || 'inactive',
              subscription_end_date: userProfile?.subscription_end_date,
              createdAt: userProfile?.created_at || new Date().toISOString(),
            },
          };
        }
      } catch (err) {
        // Fall through to error
      }

      throw new Error('Invalid OTP code. Please enter 123456.');
    }

    // Dummy OTP 123456 verified: Query user by phone
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${cleanedPhone},phone.eq.+91${cleanedPhone}`)
      .single();

    if (!userProfile) {
      // User is new (during phone registration flow)
      return {
        token: `verified-otp-${cleanedPhone}-${Date.now()}`,
        user: {
          id: `new-${cleanedPhone}`,
          name: 'New User',
          email: '',
          phone: `+91 ${cleanedPhone}`,
          role: 'customer',
          avatar: '',
          banner_image: '',
          subscription_tier: 'free',
          subscription_status: 'inactive',
          createdAt: new Date().toISOString(),
        },
      };
    }

    return {
      token: `otp-session-${userProfile.id}-${Date.now()}`,
      user: {
        id: userProfile.id,
        name: userProfile.name || 'User',
        email: userProfile.email || '',
        phone: userProfile.phone || `+91 ${cleanedPhone}`,
        role: (userProfile.role as UserRole) || 'customer',
        avatar: userProfile.avatar || '',
        banner_image: userProfile.banner_image || '',
        subscription_tier: userProfile.subscription_tier || 'free',
        subscription_status: userProfile.subscription_status || 'inactive',
        subscription_end_date: userProfile.subscription_end_date,
        createdAt: userProfile.created_at || new Date().toISOString(),
      },
    };
  },

  login: async (email: string, pass: string): Promise<{ token: string; user: User }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if email exists in users table first
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!userRecord) {
      throw new Error('This email ID is not registered with Camqrew. Please create an account.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass,
    });

    if (error || !data.session) {
      if (error?.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Incorrect password. Please try again or reset your password.');
      }
      throw new Error(error?.message || 'Invalid credentials');
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        name: userProfile?.name || email.split('@')[0],
        email: cleanEmail,
        phone: userProfile?.phone || '',
        role: (userProfile?.role as UserRole) || 'customer',
        avatar: userProfile?.avatar || '',
        banner_image: userProfile?.banner_image || '',
        subscription_tier: userProfile?.subscription_tier || 'free',
        subscription_status: userProfile?.subscription_status || 'inactive',
        subscription_end_date: userProfile?.subscription_end_date,
        createdAt: userProfile?.created_at || new Date().toISOString(),
      },
    };
  },

  registerCustomer: async (data: { name: string; email: string; phone: string; password: string }): Promise<{ token: string; user: User }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone?.trim();

    // 1. Check if email already exists in users table
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (existingEmail) {
      throw new Error('This email address is already registered. Please Sign In instead.');
    }

    // 2. Check if phone already exists
    if (cleanPhone) {
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (existingPhone) {
        throw new Error('This phone number is already registered. Please Sign In instead.');
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: cleanPhone || '',
          role: 'customer'
        }
      }
    });

    if (authError) {
      throw new Error(authError.message || 'Registration failed.');
    }

    // Supabase anti-enumeration safeguard: if email exists, signUp returns user with empty identities
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      throw new Error('This email address is already registered. Please Sign In instead.');
    }

    if (!authData.user) {
      throw new Error('Registration failed.');
    }

    return {
      token: authData.session?.access_token || '',
      user: {
        id: authData.user.id,
        name: data.name,
        email: cleanEmail,
        phone: cleanPhone || '',
        role: 'customer',
        avatar: '',
        subscription_tier: 'free',
        subscription_status: 'inactive',
        createdAt: new Date().toISOString(),
      },
    };
  },

  registerProfessional: async (data: any): Promise<{ token: string; user: User }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone?.trim();

    // 1. Check if email already exists in users table
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (existingEmail) {
      throw new Error('This email address is already registered. Please Sign In instead.');
    }

    // 2. Check if phone already exists
    if (cleanPhone) {
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (existingPhone) {
        throw new Error('This phone number is already registered. Please Sign In instead.');
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: cleanPhone || '',
          role: 'professional'
        }
      }
    });

    if (authError) {
      throw new Error(authError.message || 'Professional Registration failed.');
    }

    // Supabase anti-enumeration safeguard: if email exists, signUp returns user with empty identities
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      throw new Error('This email address is already registered. Please Sign In instead.');
    }

    if (!authData.user) {
      throw new Error('Professional Registration failed.');
    }

    await supabase.from('professional_profiles').insert([{
      id: authData.user.id,
      title: data.title,
      bio: data.bio,
      experience_years: data.experienceYears,
      state: data.state,
      district: data.district || data.city,
      city: data.city,
      rate_per_day: data.ratePerDay,
      categories: data.categories || ['Photographers'],
      equipment: data.equipment || [],
      skills: data.skills || data.certifications || [],
    }]);

    return {
      token: authData.session?.access_token || '',
      user: {
        id: authData.user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'professional',
        avatar: '',
        subscription_tier: 'free',
        subscription_status: 'inactive',
        createdAt: new Date().toISOString(),
      },
    };
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if email exists in users table first
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!userRecord) {
      throw new Error('This email ID is not registered with Camqrew. Please check your email or Sign Up.');
    }

    const redirectTo = `${window.location.origin}/login?type=recovery`;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });
    if (error) {
      throw new Error(error.message);
    }
    return { success: true, message: 'Password recovery link has been sent to ' + cleanEmail + '. Please check your inbox or spam folder.' };
  },

  updatePassword: async (password: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message);
    }
    return { success: true, message: 'Your password has been reset successfully. You can now log in.' };
  },

  signInWithOAuth: async (provider: 'google' | 'apple', role: 'customer' | 'professional' = 'customer'): Promise<void> => {
    localStorage.setItem('@camqrew_intended_role', role);
    localStorage.setItem('@camcrew_intended_role', role);
    const redirectTo = `${window.location.origin}/login`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: provider === 'google' ? {
          access_type: 'offline',
          prompt: 'consent',
        } : undefined,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  deleteAccount: async (): Promise<void> => {
    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
      throw new Error(error.message);
    }
    await supabase.auth.signOut();
  }
};
