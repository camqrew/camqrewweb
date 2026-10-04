import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { LocationSelector } from '../components/LocationSelector';
import { GoogleIcon, AppleIcon } from '../components/SocialAuthButtons';
import { CustomSelect } from '../components/CustomSelect';
import { getArchetype, PROFESSIONAL_CATEGORIES } from '../constants/categories';
import './AuthFlow.css';

import {
  User,
  Camera,
  Building2,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';

export type OnboardingRoleType = 'customer' | 'professional' | 'business';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, activeRole, needsRoleSelection, login, selectAccountRole } = useAuthStore();

  const isRegisterParam = searchParams.get('mode') === 'register' || window.location.pathname.includes('register');
  const redirectUrl = searchParams.get('redirect') || ((user?.role === 'professional' || activeRole === 'professional') ? '/dashboard?tab=overview' : '/dashboard');

  // Main flow screen: 'screen1_auth' | 'screen2_role' | 'screen3_details' | 'forgot_password'
  const [currentScreen, setCurrentScreen] = useState<'screen1_auth' | 'screen2_role' | 'screen3_details' | 'forgot_password'>('screen1_auth');

  // Screen 1: Auth Hub state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(isRegisterParam ? 'signup' : 'login');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields for Screen 1
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Screen 2: Account Type Selection
  const [selectedRoleType, setSelectedRoleType] = useState<OnboardingRoleType | null>(null);

  // Screen 3: Additional Details
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [location, setLocation] = useState({ state: '', district: '', city: '' });

  // Creator specific
  const [selectedCategory, setSelectedCategory] = useState('Photographers');
  const proArchetype = getArchetype(selectedCategory);
  const [proTitle, setProTitle] = useState('');
  const [ratePerDay, setRatePerDay] = useState('');
  const [experienceYears, setExperienceYears] = useState('3');

  // Studio / Business specific
  const [studioSpecialty, setStudioSpecialty] = useState('Commercials & Ad Films');
  const [teamSize, setTeamSize] = useState('5-15 crew members');
  const [gstin, setGstin] = useState('');

  // Client specific
  const [clientInterests, setClientInterests] = useState<string[]>(['Weddings', 'Commercial Shoots']);

  // Shared UI states
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // If user already authenticated and completed onboarding, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !needsRoleSelection && currentScreen === 'screen1_auth') {
      navigate(redirectUrl, { replace: true });
    }
  }, [isLoading, isAuthenticated, user, needsRoleSelection, currentScreen, redirectUrl, navigate]);

  // If user signed in via OAuth and needs role selection, immediately open Screen 2
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && needsRoleSelection) {
      setCurrentScreen('screen2_role');
      if (user.name) setFullName(user.name);
      if (user.email) setProfileEmail(user.email);
      if (user.phone) setProfilePhone(user.phone);
    }
  }, [isLoading, isAuthenticated, user, needsRoleSelection]);

  // Countdown timer for OTP
  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  // ─────────────────────────────────────────────────────────────────────────
  // Screen 1: Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setError('');
    setOauthLoading(provider);
    try {
      await authApi.signInWithOAuth(provider, 'customer');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('unsupported')) {
        // Fallback for local demo if keys not yet entered in Supabase dashboard
        const mockName = provider === 'google' ? 'Arjun Sharma (Google)' : 'Priya Patel (Apple)';
        const mockEmail = provider === 'google' ? 'arjun.sharma@gmail.com' : 'priya.patel@apple.com';
        setFullName(mockName);
        setProfileEmail(mockEmail);
        setCurrentScreen('screen2_role');
        setSuccessNotice(`Connected with ${provider === 'google' ? 'Google' : 'Apple'}. Please select your account type.`);
      } else {
        setError(msg || `Failed to sign in with ${provider}.`);
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    // If in Email mode
    if (method === 'email') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      if (authMode === 'login') {
        setLoading(true);
        try {
          const res = await authApi.login(email.trim().toLowerCase(), password);
          await login(res.user, res.token);
          navigate(redirectUrl);
        } catch (err: any) {
          setError(err.message || 'Invalid email or password. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        // Sign up flow: Transition to Screen 2
        setProfileEmail(email.trim().toLowerCase());
        setCurrentScreen('screen2_role');
      }
    } else {
      // Mobile OTP mode
      const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }

      if (!otpSent) {
        setLoading(true);
        try {
          await authApi.sendOTP(cleanPhone);
          setOtpSent(true);
          setOtpTimer(30);
          setSuccessNotice(`Verification code sent to +91 ${cleanPhone}. (Testing dummy OTP: 123456)`);
        } catch (err: any) {
          setError(err.message || 'Failed to dispatch SMS OTP.');
        } finally {
          setLoading(false);
        }
      } else {
        // Verify OTP
        if (!otp.trim()) {
          setError('Please enter the 6-digit verification code.');
          return;
        }

        setLoading(true);
        try {
          const res = await authApi.verifyOTP(cleanPhone, otp.trim());
          if (authMode === 'login' && res.user && !res.user.id.startsWith('new-')) {
            await login(res.user, res.token);
            navigate(redirectUrl);
          } else {
            // New user or signup -> Screen 2
            setProfilePhone(`+91 ${cleanPhone}`);
            setCurrentScreen('screen2_role');
          }
        } catch (err: any) {
          setError(err.message || 'Invalid verification code. Please enter 123456.');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessNotice('');
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSuccessNotice(res.message || 'Password reset link sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Screen 2: Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleRoleContinue = () => {
    if (!selectedRoleType) return;
    setError('');
    setSuccessNotice('');
    setCurrentScreen('screen3_details');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Screen 3: Complete Setup Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (!fullName.trim() && !companyName.trim()) {
      setError('Please provide your name or business name.');
      return;
    }
    if (!location.state || !location.city) {
      setError('Please select your operating state and city.');
      return;
    }

    if (selectedRoleType === 'professional' && (!ratePerDay || Number(ratePerDay) <= 0)) {
      setError('Please specify your standard daily rate.');
      return;
    }

    setLoading(true);

    try {
      const resolvedRole = selectedRoleType === 'customer' ? 'customer' : 'professional';
      const cleanPhone = (profilePhone || phoneNumber).replace(/\D/g, '').slice(-10);

      // 1. If user is already authenticated via Supabase session (e.g. Google SSO or existing session)
      if (user && user.id && !user.id.startsWith('new-') && !user.id.startsWith('demo-')) {
        await selectAccountRole(resolvedRole);

        // Update profile in users table
        await supabase.from('users').update({
          name: fullName.trim() || companyName.trim() || user.name,
          phone: cleanPhone ? `+91 ${cleanPhone}` : user.phone,
        }).eq('id', user.id);

        // If creator or studio, update professional_profiles
        if (resolvedRole === 'professional') {
          const proPayload: any = {
            id: user.id,
            userId: user.id,
            name: fullName.trim() || companyName.trim() || user.name,
            avatar: user.avatar || '',
            title: selectedRoleType === 'business' 
              ? `${companyName.trim() || fullName.trim()} • Studio & Production Agency` 
              : (proTitle.trim() || 'Visual Storyteller & Creator'),
            city: location.city,
            district: location.district || location.city,
            state: location.state,
            rate_per_day: Number(ratePerDay) || 5000,
            experience_years: Number(experienceYears) || 3,
            categories: selectedRoleType === 'business' ? ['Organisers', 'Photographers'] : [selectedCategory],
            bio: selectedRoleType === 'business' 
              ? `${companyName.trim()} is a creative studio specializing in ${studioSpecialty}. Team size: ${teamSize}.` 
              : `Experienced ${selectedCategory} based in ${location.city}, ${location.state}. Available for commercial, wedding, and event projects nationwide.`,
          };

          await supabase.from('professional_profiles').upsert([proPayload]);
        }

        navigate(resolvedRole === 'professional' ? '/dashboard?tab=overview' : '/dashboard');
        return;
      }

      // 2. Fresh registration with email & password
      if (resolvedRole === 'customer') {
        const res = await authApi.registerCustomer({
          name: fullName.trim(),
          email: profileEmail.trim() || email.trim(),
          phone: cleanPhone || '9876543210',
          password: password || 'camcrewPass123!',
        });
        await login(res.user, res.token);
      } else {
        const proRegistrationPayload = {
          name: selectedRoleType === 'business' ? (companyName.trim() || fullName.trim()) : fullName.trim(),
          email: profileEmail.trim() || email.trim(),
          phone: cleanPhone || '9876543210',
          password: password || 'camcrewPass123!',
          title: selectedRoleType === 'business'
            ? `${companyName.trim() || fullName.trim()} • Production Studio & Rental`
            : (proTitle.trim() || 'Visual Storyteller & Creator'),
          bio: selectedRoleType === 'business'
            ? `Premier creative studio & production house based in ${location.city}. Focus: ${studioSpecialty}. Team capacity: ${teamSize}.`
            : `Creative professional in ${selectedCategory} with ${experienceYears} years of experience in ${location.city}.`,
          experienceYears: Number(experienceYears) || 3,
          ratePerDay: Number(ratePerDay) || 5000,
          state: location.state,
          district: location.district || location.city,
          city: location.city,
          categories: selectedRoleType === 'business' ? ['Organisers', 'Photographers'] : [selectedCategory],
        };

        const res = await authApi.registerProfessional(proRegistrationPayload);
        await login(res.user, res.token);
      }

      navigate(resolvedRole === 'professional' ? '/dashboard?tab=overview' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Setup submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setClientInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  return (
    <div className="auth-flow-viewport">
      <div className="auth-centered-wrapper">
        

          {/* ─────────────────────────────────────────────────────────────
              SCREEN 1: THE MAIN AUTHENTICATION HUB
             ───────────────────────────────────────────────────────────── */}
          {currentScreen === 'screen1_auth' && (
            <div className="auth-form-card">
              
              {/* Header */}
              <div className="auth-header">
                <h2 className="auth-title">
                  {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
                </h2>
                <p className="auth-subtitle">
                  {authMode === 'login'
                    ? 'Enter your credentials to access your account'
                    : 'Get started in under two minutes with Camcrew'}
                </p>
              </div>

              {/* Segmented Switcher: Sign In vs Create Account */}
              <div className="auth-segmented-switch">
                <button
                  type="button"
                  className={`auth-segment-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('login'); setError(''); setSuccessNotice(''); }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-segment-btn ${authMode === 'signup' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('signup'); setError(''); setSuccessNotice(''); }}
                >
                  Create Account
                </button>
              </div>

              {/* Error & Success Alerts */}
              {error && (
                <div className="auth-alert-notice auth-alert-danger">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </div>
              )}
              {successNotice && (
                <div className="auth-alert-notice auth-alert-success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{successNotice}</span>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleAuthSubmit}>
                {method === 'email' ? (
                  <>
                    <div className="auth-field-block">
                      <label className="auth-label">Email address</label>
                      <div className="auth-input-container">
                        <span className="auth-input-icon-adornment">
                          <Mail size={16} />
                        </span>
                        <input
                          type="email"
                          className="auth-input"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="auth-field-block">
                      <div className="auth-field-header">
                        <label className="auth-label">Password</label>
                        {authMode === 'login' && (
                          <span
                            className="auth-label-help"
                            onClick={() => { setCurrentScreen('forgot_password'); setError(''); setSuccessNotice(''); }}
                          >
                            Forgot Password?
                          </span>
                        )}
                      </div>
                      <div className="auth-input-container">
                        <span className="auth-input-icon-adornment">
                          <Lock size={16} />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="auth-input"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                        />
                        <button
                          type="button"
                          className="auth-password-toggle-btn"
                          onClick={() => setShowPassword(p => !p)}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="auth-field-block">
                      <label className="auth-label">Mobile Number</label>
                      <div className="auth-phone-input-row">
                        <div className="auth-country-code-pill">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <div className="auth-input-container">
                          <span className="auth-input-icon-adornment">
                            <Phone size={16} />
                          </span>
                          <input
                            type="tel"
                            className="auth-input"
                            placeholder="98765 43210"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            maxLength={10}
                            required
                            disabled={otpSent}
                          />
                        </div>
                      </div>
                    </div>

                    {otpSent && (
                      <>
                        <div className="auth-otp-display-box">
                          A 6-digit verification code was sent to <strong>+91 {phoneNumber}</strong>.
                          <div style={{ marginTop: 4, fontWeight: 700 }}>Test OTP: 123456</div>
                        </div>

                        <div className="auth-field-block">
                          <label className="auth-label">Enter 6-digit OTP Code</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="auth-input auth-otp-input"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <button
                            type="button"
                            disabled={otpTimer > 0}
                            onClick={() => {
                              setOtpTimer(30);
                              setSuccessNotice(`New OTP dispatched. (Testing dummy OTP: 123456)`);
                            }}
                            style={{ background: 'none', border: 'none', color: otpTimer > 0 ? 'var(--auth-text-muted)' : 'var(--auth-accent)', fontSize: 13, fontWeight: 600, cursor: otpTimer > 0 ? 'default' : 'pointer' }}
                          >
                            {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend Code'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); setOtp(''); }}
                            style={{ background: 'none', border: 'none', color: 'var(--auth-text-muted)', fontSize: 12, cursor: 'pointer' }}
                          >
                            Change Number
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  className="auth-primary-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>
                        {method === 'phone'
                          ? (!otpSent ? 'Send OTP Verification' : 'Verify & Continue')
                          : authMode === 'login'
                          ? 'Sign In to Dashboard'
                          : 'Continue to Account Setup'}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Alternative Methods Divider */}
              <div className="auth-divider">
                <span>or</span>
              </div>

              {/* Classy Minimal SSO Buttons */}
              <div className="auth-sso-row">
                <button
                  type="button"
                  className="auth-sso-card-btn"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={oauthLoading !== null}
                  title="Continue with Google"
                >
                  {oauthLoading === 'google' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon size={17} />
                      <span>Google</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="auth-sso-card-btn"
                  onClick={() => handleOAuthLogin('apple')}
                  disabled={oauthLoading !== null}
                  title="Continue with Apple"
                >
                  {oauthLoading === 'apple' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <AppleIcon size={17} />
                      <span>Apple</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={`auth-sso-card-btn ${method === 'phone' ? 'active-method' : ''}`}
                  onClick={() => {
                    setMethod(method === 'email' ? 'phone' : 'email');
                    setError('');
                    setOtpSent(false);
                  }}
                  title={method === 'email' ? 'Sign in with Mobile OTP' : 'Sign in with Email'}
                >
                  {method === 'email' ? (
                    <>
                      <Phone size={15} />
                      <span>Mobile OTP</span>
                    </>
                  ) : (
                    <>
                      <Mail size={15} />
                      <span>Email</span>
                    </>
                  )}
                </button>
              </div>

              <div className="auth-legal-notice">
                By continuing, you agree to our{' '}
                <Link to="/legal">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/legal">Privacy Policy</Link>.
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              FORGOT PASSWORD SCREEN
             ───────────────────────────────────────────────────────────── */}
          {currentScreen === 'forgot_password' && (
            <div className="auth-form-card">
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--auth-text-muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={() => { setCurrentScreen('screen1_auth'); setError(''); setSuccessNotice(''); }}
              >
                <ArrowLeft size={16} />
                <span>Back to Sign In</span>
              </button>

              <div className="auth-header" style={{ textAlign: 'left', marginBottom: 20 }}>
                <h2 className="auth-title">Reset your password</h2>
                <p className="auth-subtitle">
                  Enter your verified account email address and we'll send you a password recovery link.
                </p>
              </div>

              {error && (
                <div className="auth-alert-notice auth-alert-danger">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </div>
              )}
              {successNotice && (
                <div className="auth-alert-notice auth-alert-success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{successNotice}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword}>
                <div className="auth-field-block">
                  <label className="auth-label">Email address</label>
                  <div className="auth-input-container">
                    <span className="auth-input-icon-adornment">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-primary-submit-btn"
                  disabled={loading}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Send Reset Link</span>}
                </button>
              </form>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SCREEN 2: POST-SIGNUP ONBOARDING - ACCOUNT TYPE SELECTION
             ───────────────────────────────────────────────────────────── */}
          {currentScreen === 'screen2_role' && (
            <div className="auth-form-card wide-card">
              
              {/* Progress Indicator: Step 1 of 2 */}
              <div className="onboarding-progress-block">
                <div className="onboarding-step-label-row">
                  <span>Step 1 of 2</span>
                  <span>50% Complete</span>
                </div>
                <div className="onboarding-progress-track">
                  <div className="onboarding-progress-fill" style={{ width: '50%' }} />
                </div>
              </div>

              {/* Header */}
              <div className="auth-header" style={{ textAlign: 'left', marginBottom: 24 }}>
                <h2 className="auth-title">Choose your account type</h2>
                <p className="auth-subtitle">
                  Select how you plan to use Camcrew. You can collaborate and switch workspaces anytime from your account settings.
                </p>
              </div>

              {/* 3 Clickable Account Type Cards */}
              <div className="role-cards-grid">
                
                {/* 1. Client / Personal */}
                <div
                  className={`role-selection-card ${selectedRoleType === 'customer' ? 'selected' : ''}`}
                  onClick={() => setSelectedRoleType('customer')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="role-card-icon-box">
                    <User size={24} />
                  </div>
                  <div className="role-card-details">
                    <div className="role-card-top-header">
                      <div className="role-card-title-group">
                        <h3 className="role-card-title">Personal / Client</h3>
                        <span className="role-card-badge">Hire Crew</span>
                      </div>
                      <div className="role-card-radio-circle">
                        {selectedRoleType === 'customer' && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="role-card-desc">
                      For individuals, brands, and agencies looking to book top creative talent and rent production equipment with escrow protection.
                    </p>
                    <div className="role-card-features-row">
                      <span className="role-card-feature-pill">
                        <CheckCircle2 size={13} color="var(--auth-accent)" /> Hire Photographers & Filmmakers
                      </span>
                      <span className="role-card-feature-pill">
                        <CheckCircle2 size={13} color="var(--auth-accent)" /> 100% Escrow Milestone Safety
                      </span>
                      <span className="role-card-feature-pill">
                        <CheckCircle2 size={13} color="var(--auth-accent)" /> Rent Cinema Cameras & Gear
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Creator / Professional */}
                <div
                  className={`role-selection-card ${selectedRoleType === 'professional' ? 'selected' : ''}`}
                  onClick={() => setSelectedRoleType('professional')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="role-card-icon-box">
                    <Camera size={24} />
                  </div>
                  <div className="role-card-details">
                    <div className="role-card-top-header">
                      <div className="role-card-title-group">
                        <h3 className="role-card-title">Creator / Freelancer</h3>
                        <span className="role-card-badge">Get Booked</span>
                      </div>
                      <div className="role-card-radio-circle">
                        {selectedRoleType === 'professional' && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="role-card-desc">
                      For filmmakers, photographers, editors, drone pilots, and creative pros offering services and looking for verified client bookings.
                    </p>
                    <div className="role-card-features-row">
                      <span className="role-card-feature-pill">
                        <CheckCircle2 size={13} color="var(--auth-accent)" /> Verified Pro Profile & Showcase
                      </span>
                      <span className="role-card-feature-pill">
                        <CheckCircle2 size={13} color="var(--auth-accent)" /> Set Your Own Daily Rates
                      </span>
                      <span className="role-card-feature-pill">
                        <CheckCircle2 size={13} color="var(--auth-accent)" /> Guaranteed Escrow Direct Payouts
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Studio / Business */}
                <div
                  className={`role-selection-card ${selectedRoleType === 'business' ? 'selected' : ''}`}
                  onClick={() => setSelectedRoleType('business')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="role-card-icon-box">
                    <Building2 size={24} />
                  </div>
                  <div className="role-card-details">
                    <div className="role-card-top-header">
                      <div className="role-card-title-group">
                        <h3 className="role-card-title">Studio / Production House</h3>
                        <span className="role-card-badge">Scale Business</span>
                      </div>
                      <div className="role-card-radio-circle">
                        {selectedRoleType === 'business' && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="role-card-desc">
                      For production houses, media agencies, studios, and rental companies managing multi-member teams and client productions.
                    </p>
                    <div className="role-card-features-row">
                      <span className="role-card-feature-pill">
                        <CheckCircle2 size={13} color="var(--auth-accent)" /> Crew Roster & Team Management
                      </span>
                      <span className="role-card-feature-pill">
                        <CheckCircle2 size={13} color="var(--auth-accent)" /> GST Invoicing & Agency Contracts
                      </span>
                      <span className="role-card-feature-pill">
                        <CheckCircle2 size={13} color="var(--auth-accent)" /> List Equipment Fleet for Rent
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Button: Disabled until role selected */}
              <button
                type="button"
                className="auth-primary-submit-btn"
                disabled={!selectedRoleType}
                onClick={handleRoleContinue}
              >
                <span>Continue to Details (Step 2 of 2)</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SCREEN 3: POST-SIGNUP ONBOARDING - ADDITIONAL DETAILS
             ───────────────────────────────────────────────────────────── */}
          {currentScreen === 'screen3_details' && (
            <div className="auth-form-card wide-card">
              
              {/* Progress Indicator: Step 2 of 2 */}
              <div className="onboarding-progress-block">
                <div className="onboarding-step-label-row">
                  <span>Step 2 of 2</span>
                  <span>Final Step • 100%</span>
                </div>
                <div className="onboarding-progress-track">
                  <div className="onboarding-progress-fill" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Dynamic Header based on Role */}
              <div className="auth-header" style={{ textAlign: 'left', marginBottom: 24 }}>
                <h2 className="auth-title">
                  {selectedRoleType === 'customer'
                    ? 'Complete Your Client Profile'
                    : selectedRoleType === 'business'
                    ? 'Setup Your Studio Details'
                    : 'Setup Your Creative Pro Profile'}
                </h2>
                <p className="auth-subtitle">
                  {selectedRoleType === 'customer'
                    ? 'Tell us your contact details and shoot interests to personalize your experience.'
                    : selectedRoleType === 'business'
                    ? 'Provide your production company details, services, and operating home base.'
                    : 'Specify your craft headline, daily rate, and locality so clients can book you directly.'}
                </p>
              </div>

              {error && (
                <div className="auth-alert-notice auth-alert-danger">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleFinalSubmit}>
                <div className="onboarding-form-grid">
                  
                  {/* Name Fields */}
                  {selectedRoleType === 'business' ? (
                    <div className="onboarding-two-col">
                      <div className="auth-field-block">
                        <label className="auth-label">Production House / Studio Name *</label>
                        <input
                          type="text"
                          className="auth-input no-icon"
                          placeholder="e.g. Apex Cinema Works Studios"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="auth-field-block">
                        <label className="auth-label">Contact Person Name *</label>
                        <input
                          type="text"
                          className="auth-input no-icon"
                          placeholder="e.g. Rohit Malhotra"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="auth-field-block">
                      <label className="auth-label">Full Name *</label>
                      <div className="auth-input-container">
                        <span className="auth-input-icon-adornment">
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          className="auth-input"
                          placeholder="e.g. Rahul Verma"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  {/* Email & Phone Contact Row */}
                  <div className="onboarding-two-col">
                    <div className="auth-field-block">
                      <label className="auth-label">Email Address *</label>
                      <div className="auth-input-container">
                        <span className="auth-input-icon-adornment">
                          <Mail size={16} />
                        </span>
                        <input
                          type="email"
                          className="auth-input"
                          placeholder="name@example.com"
                          value={profileEmail || email}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="auth-field-block">
                      <label className="auth-label">Mobile Number (WhatsApp) *</label>
                      <div className="auth-input-container">
                        <span className="auth-input-icon-adornment">
                          <Phone size={16} />
                        </span>
                        <input
                          type="tel"
                          className="auth-input"
                          placeholder="+91 98765 43210"
                          value={profilePhone || phoneNumber}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Operating Location */}
                  <div className="auth-field-block">
                    <label className="auth-label">Operating Location (India) *</label>
                    <LocationSelector
                      selectedState={location.state}
                      selectedDistrict={location.district}
                      selectedCity={location.city}
                      onChange={setLocation}
                    />
                  </div>

                  {/* Role Specific Fields: CREATOR */}
                  {selectedRoleType === 'professional' && (
                    <>
                      <div className="onboarding-two-col">
                        <div className="auth-field-block">
                          <label className="auth-label">Primary Craft / Category *</label>
                          <CustomSelect
                            value={selectedCategory}
                            onChange={(val) => setSelectedCategory(val)}
                            options={PROFESSIONAL_CATEGORIES.map(cat => ({
                              value: cat.name,
                              label: cat.name,
                            }))}
                            placeholder="Select primary category"
                          />
                        </div>

                        <div className="auth-field-block">
                          <label className="auth-label">Years of Experience</label>
                          <CustomSelect
                            value={experienceYears}
                            onChange={(val) => setExperienceYears(val)}
                            options={[
                              { value: '1', label: '1 - 2 years (Emerging)' },
                              { value: '3', label: '3 - 5 years (Professional)' },
                              { value: '6', label: '6 - 10 years (Senior Pro)' },
                              { value: '10', label: '10+ years (Master / Lead)' },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="auth-field-block">
                        <label className="auth-label">Professional Headline / Title *</label>
                        <input
                          type="text"
                          className="auth-input no-icon"
                          placeholder={
                            selectedCategory === 'Photographers'
                              ? 'e.g. Commercial & Fashion Photographer'
                              : selectedCategory === 'Cinematographers'
                              ? 'e.g. Cinema DP & Drone Camera Operator'
                              : selectedCategory === 'Video Editors'
                              ? 'e.g. Narrative Film & Commercial Colorist'
                              : 'e.g. Creative Specialist & Director'
                          }
                          value={proTitle}
                          onChange={(e) => setProTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="auth-field-block">
                        <div className="auth-field-header">
                          <label className="auth-label">{proArchetype.rateLabel} (Standard ₹) *</label>
                          <span style={{ fontSize: 12, color: 'var(--auth-text-muted)' }}>per standard 8h day</span>
                        </div>
                        <input
                          type="number"
                          className="auth-input no-icon"
                          placeholder="e.g. 8000"
                          value={ratePerDay}
                          onChange={(e) => setRatePerDay(e.target.value)}
                          required
                        />
                        <div className="preset-chips-row">
                          {[5000, 8000, 12000, 18000, 25000].map(val => (
                            <button
                              key={val}
                              type="button"
                              className={`preset-chip-btn ${ratePerDay === String(val) ? 'active' : ''}`}
                              onClick={() => setRatePerDay(String(val))}
                            >
                              ₹{val.toLocaleString('en-IN')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Role Specific Fields: STUDIO / BUSINESS */}
                  {selectedRoleType === 'business' && (
                    <>
                      <div className="onboarding-two-col">
                        <div className="auth-field-block">
                          <label className="auth-label">Primary Production Specialty</label>
                          <CustomSelect
                            value={studioSpecialty}
                            onChange={(val) => setStudioSpecialty(val)}
                            options={[
                              { value: 'Commercials & Ad Films', label: 'Commercials & Ad Films' },
                              { value: 'OTT & Feature Films', label: 'OTT & Feature Films' },
                              { value: 'Weddings & High-End Events', label: 'Weddings & High-End Events' },
                              { value: 'Camera & Lighting Rental House', label: 'Camera & Lighting Rental House' },
                              { value: 'Post-Production & VFX Studio', label: 'Post-Production & VFX Studio' },
                            ]}
                          />
                        </div>

                        <div className="auth-field-block">
                          <label className="auth-label">Team / Crew Capacity</label>
                          <CustomSelect
                            value={teamSize}
                            onChange={(val) => setTeamSize(val)}
                            options={[
                              { value: '1-5 crew members', label: '1 - 5 crew members' },
                              { value: '6-15 crew members', label: '6 - 15 crew members' },
                              { value: '16-30 crew members', label: '16 - 30 crew members' },
                              { value: '30+ crew members', label: '30+ crew members (Enterprise)' },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="auth-field-block">
                        <label className="auth-label">GSTIN / Company Tax ID (Optional)</label>
                        <input
                          type="text"
                          className="auth-input no-icon"
                          placeholder="e.g. 27ABCDE1234F1Z5"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        />
                      </div>
                    </>
                  )}

                  {/* Role Specific Fields: CLIENT */}
                  {selectedRoleType === 'customer' && (
                    <div className="auth-field-block">
                      <label className="auth-label">What types of shoots or gear are you looking for?</label>
                      <div className="preset-chips-row">
                        {[
                          'Weddings & Pre-weddings',
                          'Commercial & Brand Shoots',
                          'Music Videos',
                          'Fashion & Lookbooks',
                          'Corporate & Conferences',
                          'Camera & Lighting Rentals',
                          'Sound & Podcast Recording',
                          'Drone Aerial Shoots'
                        ].map(interest => (
                          <button
                            key={interest}
                            type="button"
                            className={`preset-chip-btn ${clientInterests.includes(interest) ? 'active' : ''}`}
                            onClick={() => toggleInterest(interest)}
                          >
                            {clientInterests.includes(interest) ? '✓ ' : '+ '}{interest}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Back and Complete Setup Button Group */}
                <div className="onboarding-action-row">
                  <button
                    type="button"
                    className="auth-secondary-btn"
                    onClick={() => { setCurrentScreen('screen2_role'); setError(''); }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="auth-primary-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <span>Complete Setup & Go to Dashboard</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

      </div>
    </div>
  );
};

export default AuthPage;
