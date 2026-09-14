import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types/auth';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface SocialAuthButtonsProps {
  mode?: 'signin' | 'signup';
  role?: 'customer' | 'professional';
  redirectUrl?: string;
  onError?: (err: string) => void;
}

export const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12c0 2.06.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const AppleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.61 1.34-.56.64-1.05 1.69-.92 2.71 1 .08 2.01-.48 2.61-1.2z" />
  </svg>
);

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  mode = 'signin',
  role = 'customer',
  redirectUrl = '/dashboard',
  onError,
}) => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const [demoProvider, setDemoProvider] = useState<'google' | 'apple' | null>(null);

  const isSignUp = mode === 'signup';

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoadingProvider(provider);
    setDemoProvider(null);
    onError?.('');

    try {
      await authApi.signInWithOAuth(provider, role);
    } catch (err: any) {
      const msg = err.message || '';
      console.warn(`OAuth notice for ${provider}:`, msg);
      
      // If the provider credentials haven't been entered in Supabase dashboard yet:
      if (
        msg.toLowerCase().includes('not enabled') ||
        msg.toLowerCase().includes('unsupported') ||
        msg.toLowerCase().includes('validation failed')
      ) {
        setDemoProvider(provider);
        onError?.(
          `Supabase ${provider === 'google' ? 'Google' : 'Apple'} OAuth provider is not yet activated in your Supabase Auth dashboard.`
        );
      } else {
        onError?.(msg || `Failed to authenticate with ${provider}.`);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleDemoSignIn = async (provider: 'google' | 'apple') => {
    const demoUser: User = {
      id: `demo-${provider}-${Date.now()}`,
      name: provider === 'google' ? 'Arjun Sharma (Google Verified)' : 'Priya Patel (Apple Verified)',
      email: provider === 'google' ? 'arjun.sharma@gmail.com' : 'priya.patel@privaterelay.appleid.com',
      phone: '+91 9876543210',
      role: role,
      avatar: provider === 'google'
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400',
      subscription_tier: 'free',
      subscription_status: 'active',
      createdAt: new Date().toISOString(),
    };

    await login(demoUser, `demo-token-${provider}`);
    navigate(redirectUrl);
  };

  return (
    <div className="auth-social-wrapper">
      <div className="auth-social-grid">
        {/* Google Authentication Button */}
        <button
          type="button"
          className="auth-social-btn btn-google"
          onClick={() => handleOAuth('google')}
          disabled={loadingProvider !== null}
          title={isSignUp ? 'Sign up with Google' : 'Continue with Google'}
        >
          {loadingProvider === 'google' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <GoogleIcon size={18} />
              <span>{isSignUp ? 'Sign up with Google' : 'Continue with Google'}</span>
            </>
          )}
        </button>

        {/* Apple Authentication Button */}
        <button
          type="button"
          className="auth-social-btn btn-apple"
          onClick={() => handleOAuth('apple')}
          disabled={loadingProvider !== null}
          title={isSignUp ? 'Sign up with Apple' : 'Continue with Apple'}
        >
          {loadingProvider === 'apple' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <AppleIcon size={18} />
              <span>{isSignUp ? 'Sign up with Apple' : 'Continue with Apple'}</span>
            </>
          )}
        </button>
      </div>

      {/* Graceful Developer Testing Fallback if Supabase OAuth keys not yet entered */}
      {demoProvider && (
        <div className="auth-demo-oauth-notice">
          <div className="demo-notice-header">
            <AlertCircle size={15} color="var(--accent)" />
            <span>Testing in Local Development?</span>
          </div>
          <p className="demo-notice-text">
            To use real OAuth, activate {demoProvider === 'google' ? 'Google' : 'Apple'} in your Supabase Auth dashboard. In the meantime, you can test with a verified demo profile:
          </p>
          <button
            type="button"
            className="demo-oauth-quick-btn"
            onClick={() => handleDemoSignIn(demoProvider)}
          >
            <span>Sign in as Verified {demoProvider === 'google' ? 'Google' : 'Apple'} User</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialAuthButtons;
