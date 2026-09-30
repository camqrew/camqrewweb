import { Logo } from '../components/Logo';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Forgot password mode toggle
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        throw signInError;
      }
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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
            {!isResetMode ? (
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
            ) : (
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
                      placeholder="admin@camqrew.in"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
