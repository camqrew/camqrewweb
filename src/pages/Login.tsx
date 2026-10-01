import { Logo } from '../components/Logo';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { 
  Loader2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  Camera, 
  Lock, 
  Sparkles 
} from 'lucide-react';
import './Login.css';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Auth Step: credentials vs otp
  const [authStep, setAuthStep] = useState<'credentials' | 'otp'>('credentials');
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [pendingAdmin, setPendingAdmin] = useState<{ profile: any; token: string; phone: string } | null>(null);

  // Forgot password mode toggle
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (isMounted && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (isMounted && profile?.role === 'admin') {
          navigate('/admin', { replace: true });
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Resend OTP Countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Check for inactivity logout redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reason') === 'inactivity') {
      setError('You have been logged out due to 5 minutes of inactivity for security.');
      setAuthStep('credentials');
    }
  }, [location.search]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!authData?.user || !authData.session) {
        throw new Error('Authentication succeeded but session could not be established.');
      }

      // Verify the user possesses admin privileges
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. This account does not possess administrator privileges.');
      }

      // Transition to SMS OTP Step
      setPendingAdmin({
        profile,
        token: authData.session.access_token,
        phone: profile.phone || '9999999999',
      });
      setAuthStep('otp');
      setOtp('');
      setOtpTimer(30);
      setSuccessMsg('SMS verification code sent. (Use dummy OTP: 123456)');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    if (cleanOtp !== '123456') {
      setError('Invalid OTP code. Please enter 123456.');
      return;
    }

    if (!pendingAdmin) {
      setError('Session expired. Please sign in again.');
      setAuthStep('credentials');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await useAuthStore.getState().login(pendingAdmin.profile, pendingAdmin.token);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to complete admin sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    setOtpTimer(30);
    setSuccessMsg('New SMS verification code sent. (Use dummy OTP: 123456)');
    setError('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to receive recovery instructions.');
      return;
    }

    setResetLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/admin/login` }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccessMsg('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Could not send recovery instructions. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="admin-login-viewport">
      {/* Background with user's editorial photographer hero image */}
      <div className="admin-login-backdrop" aria-hidden="true">
        <img
          src="/assets/admin-login-hero.png"
          alt="Camqrew Production Studio"
          className="admin-login-backdrop-img"
        />
        <div className="admin-login-overlay" />
      </div>

      {/* Main 2-Column Presentation */}
      <div className="admin-login-content-wrapper">
        {/* Left Column: Bold Typography & Brand Mission */}
        <div className="admin-login-hero-pane">
          <div className="admin-hero-brand-header">
            <Logo height={40} />
            <div className="admin-hero-badge">
              <span className="admin-hero-badge-dot" />
              <span>Admin Command</span>
            </div>
          </div>

          <h1 className="admin-hero-title">
            CAPTURE<br />THE VISION
          </h1>

          <p className="admin-hero-tagline">
            Where Creator Ambition Becomes Reality.
          </p>

          <p className="admin-hero-description">
            Centralized platform administration for studio production escrow, 
            verified creator KYC, dispute mediation, and gear logistics.
          </p>

          <div className="admin-hero-features-list">
            <div className="admin-hero-feature-chip">
              <Camera size={14} />
              <span>Gear Fleet Oversight</span>
            </div>
            <div className="admin-hero-feature-chip">
              <ShieldCheck size={14} />
              <span>Creator KYC Trust</span>
            </div>
            <div className="admin-hero-feature-chip">
              <Lock size={14} />
              <span>Escrow Milestones</span>
            </div>
            <div className="admin-hero-feature-chip">
              <Sparkles size={14} />
              <span>Studio Analytics</span>
            </div>
          </div>
        </div>

        {/* Right Column: Glassmorphic Frosted Card */}
        <div className="admin-login-card-pane">
          <div className="admin-frosted-card">
            {isResetMode ? (
              /* Password Reset Screen */
              <div className="admin-reset-screen">
                <button
                  type="button"
                  className="admin-reset-back-btn"
                  onClick={() => {
                    setIsResetMode(false);
                    setError('');
                    setSuccessMsg('');
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </button>

                <div>
                  <h2 className="admin-card-title">Reset Password</h2>
                  <p className="admin-card-subtitle">
                    Enter your email to receive recovery instructions.
                  </p>
                </div>

                {error && (
                  <div className="admin-login-alert" role="alert">
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="admin-login-alert admin-login-alert-success" role="status">
                    <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form className="admin-card-form" onSubmit={handleForgotPassword}>
                  <div className="admin-input-group">
                    <label className="admin-input-label" htmlFor="reset-email">
                      Admin Email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      className="admin-text-input"
                      placeholder="admin@camcrew.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={resetLoading}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="admin-primary-btn"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      'Send Recovery Link'
                    )}
                  </button>
                </form>
              </div>
            ) : authStep === 'otp' ? (
              /* SMS OTP Verification Screen */
              <div className="admin-reset-screen">
                <button
                  type="button"
                  className="admin-reset-back-btn"
                  onClick={() => {
                    setAuthStep('credentials');
                    setError('');
                    setSuccessMsg('');
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Credentials</span>
                </button>

                <div>
                  <h2 className="admin-card-title">SMS OTP Verification</h2>
                  <p className="admin-card-subtitle">
                    Security code sent to admin phone ({pendingAdmin?.phone ? `+91 ${pendingAdmin.phone.slice(-10, -4)}••••` : '+91 99999 •••••'}).
                  </p>
                </div>

                <div style={{
                  background: 'rgba(63, 182, 104, 0.12)',
                  border: '1px solid rgba(63, 182, 104, 0.35)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: '#3fb668',
                  fontSize: '13px',
                  fontWeight: '600',
                  textAlign: 'left'
                }}>
                  Dummy SMS OTP for testing: <strong style={{ letterSpacing: '2px', fontSize: '15px' }}>123456</strong>
                </div>

                {error && (
                  <div className="admin-login-alert" role="alert">
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="admin-login-alert admin-login-alert-success" role="status">
                    <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form className="admin-card-form" onSubmit={handleVerifyOtp}>
                  <div className="admin-input-group">
                    <label className="admin-input-label" htmlFor="admin-otp-input">
                      6-Digit SMS Verification Code
                    </label>
                    <input
                      id="admin-otp-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className="admin-text-input"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      required
                      style={{ letterSpacing: '4px', fontSize: '18px', textAlign: 'center', fontWeight: '700' }}
                      autoFocus
                    />
                  </div>

                  <div className="admin-forgot-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="admin-forgot-btn"
                      disabled={otpTimer > 0}
                      onClick={handleResendOtp}
                      style={{ color: otpTimer > 0 ? '#6c747d' : '#3fb668', cursor: otpTimer > 0 ? 'not-allowed' : 'pointer' }}
                    >
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend Code'}
                    </button>
                    <span style={{ fontSize: '12px', color: '#6c747d' }}>Default: 123456</span>
                  </div>

                  <button
                    type="submit"
                    className="admin-primary-btn"
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Verifying OTP...</span>
                      </>
                    ) : (
                      'Verify & Enter Portal'
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Admin Portal</h2>
                  <p className="admin-card-subtitle">Sign in to manage Camqrew</p>
                </div>

                {error && (
                  <div className="admin-login-alert" role="alert">
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="admin-login-alert admin-login-alert-success" role="status">
                    <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form className="admin-card-form" onSubmit={handleLogin}>
                  {/* Email Input */}
                  <div className="admin-input-group">
                    <label className="admin-input-label" htmlFor="admin-email">
                      Email
                    </label>
                    <div className="admin-input-control-box">
                      <input
                        id="admin-email"
                        type="email"
                        className="admin-text-input"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="admin-input-group">
                    <label className="admin-input-label" htmlFor="admin-password">
                      Password
                    </label>
                    <div className="admin-input-control-box">
                      <input
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        className="admin-text-input"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="current-password"
                        required
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        className="admin-pwd-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="admin-forgot-row">
                    <button
                      type="button"
                      className="admin-forgot-btn"
                      onClick={() => {
                        setIsResetMode(true);
                        setError('');
                        setSuccessMsg('');
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="admin-primary-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Card Footer */}
                <div className="admin-card-footer">
                  <Link to="/marketplace" className="admin-return-link">
                    <ArrowLeft size={14} />
                    <span>Return to Camqrew Storefront</span>
                  </Link>

                  <div className="admin-security-caption">
                    <ShieldCheck size={13} />
                    <span>Camqrew Enterprise Security • 256-bit SSL</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
