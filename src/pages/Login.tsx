import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { Logo } from '../components/Logo';
import { GoogleIcon } from '../components/SocialAuthButtons';
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles
} from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mode: 'signin' | 'forgot'
  const [viewMode, setViewMode] = useState<'signin' | 'forgot'>('signin');

  // Auto-redirect if already signed in as admin/authenticated user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        navigate('/admin');
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your administrator email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.user) {
        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/admin/login` }
      );

      if (resetErr) {
        throw resetErr;
      }

      setSuccessMsg('Password reset link sent! Check your inbox to proceed.');
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to send reset link. Please check the email entered.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setError(err.message || 'Google authentication could not be completed.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      {/* Ambient background blur */}
      <div className="admin-login-ambient-bg" aria-hidden="true" />

      {/* Main framed container */}
      <main className="admin-login-canvas">
        {/* Background photo & cinematic shadow gradient */}
        <div className="admin-login-hero-bg" aria-hidden="true" />
        <div className="admin-login-overlay" aria-hidden="true" />

        {/* Content split grid */}
        <div className="admin-login-content">
          {/* Left Column: Brand & Editorial Statement */}
          <section className="admin-login-hero-side">
            <div className="admin-login-brand-row">
              <Logo height={34} />
              <div className="admin-login-badge">
                <span className="admin-login-badge-dot" />
                Admin Portal
              </div>
            </div>

            <div className="admin-login-hero-text">
              <h1 className="admin-login-hero-title">
                <span>CAPTURE</span>
                <span>HORIZONS</span>
              </h1>
              <p className="admin-login-hero-desc">
                Where India's Elite Visual Creators & Productions Unite.
              </p>
              <p className="admin-login-hero-subdesc">
                Authorized command center for talent verifications, gear inventory, logistics fulfillment, escrow settlements, and platform intelligence.
              </p>
            </div>

            <div className="admin-login-hero-footer">
              <div className="admin-login-hero-pill">
                <ShieldCheck size={14} color="#10b981" />
                <span>256-Bit SSL Encrypted</span>
              </div>
              <div className="admin-login-hero-pill">
                <Sparkles size={14} color="#60a5fa" />
                <span>Camqrew Backoffice v2.4</span>
              </div>
            </div>
          </section>

          {/* Right Column: Frosted Glassmorphism Card */}
          <section className="admin-login-card-side">
            <div className="admin-glass-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  {viewMode === 'signin' ? 'Admin Portal' : 'Reset Password'}
                </h2>
                <p className="admin-card-subtitle">
                  {viewMode === 'signin'
                    ? 'Sign in to manage the Camqrew ecosystem'
                    : 'Enter your email to receive recovery instructions'}
                </p>
              </div>

              {/* Status / Error Alerts */}
              {error && (
                <div className="admin-login-alert error" role="alert">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="admin-login-alert success" role="status">
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              {viewMode === 'signin' ? (
                /* Sign In Form */
                <form onSubmit={handleLogin} noValidate>
                  <div className="admin-input-group">
                    <label className="admin-input-label" htmlFor="admin-email">
                      Email
                    </label>
                    <div className="admin-input-wrapper">
                      <input
                        id="admin-email"
                        type="email"
                        className="admin-input-field"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading || googleLoading}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-input-group">
                    <label className="admin-input-label" htmlFor="admin-password">
                      Password
                    </label>
                    <div className="admin-input-wrapper">
                      <input
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        className="admin-input-field"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading || googleLoading}
                        autoComplete="current-password"
                        required
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        className="admin-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="admin-field-helper">
                    <button
                      type="button"
                      className="admin-forgot-btn"
                      onClick={() => {
                        setViewMode('forgot');
                        setError('');
                        setSuccessMsg('');
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="admin-submit-btn"
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      'SIGN IN'
                    )}
                  </button>

                  <div className="admin-divider">
                    <span className="admin-divider-line" />
                    <span className="admin-divider-text">or</span>
                    <span className="admin-divider-line" />
                  </div>

                  <button
                    type="button"
                    className="admin-google-btn"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                  >
                    {googleLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <GoogleIcon size={18} />
                    )}
                    <span>Sign in with Google</span>
                  </button>

                  <div className="admin-card-footer">
                    <Link to="/" className="admin-footer-link">
                      <ArrowLeft size={14} /> Back to Camqrew Storefront
                    </Link>
                    <div className="admin-security-note">
                      <Lock size={12} /> Authorized Personnel Only
                    </div>
                  </div>
                </form>
              ) : (
                /* Forgot Password Form */
                <form onSubmit={handleForgotPassword} noValidate>
                  <div className="admin-input-group">
                    <label className="admin-input-label" htmlFor="reset-email">
                      Administrator Email
                    </label>
                    <div className="admin-input-wrapper">
                      <input
                        id="reset-email"
                        type="email"
                        className="admin-input-field"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="admin-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Sending Instructions...</span>
                      </>
                    ) : (
                      'SEND RESET LINK'
                    )}
                  </button>

                  <div className="admin-card-footer" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="admin-forgot-btn"
                      style={{ fontSize: '13px' }}
                      onClick={() => {
                        setViewMode('signin');
                        setError('');
                        setSuccessMsg('');
                      }}
                    >
                      ← Return to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Login;
