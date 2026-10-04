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
  AlertCircle
} from 'lucide-react';

export type OnboardingRoleType = 'customer' | 'professional' | 'business';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, activeRole, needsRoleSelection, login, selectAccountRole, updateUser } = useAuthStore();

  const isRegisterParam = searchParams.get('mode') === 'register' || window.location.pathname.includes('register');
  const redirectUrl = searchParams.get('redirect') || ((user?.role === 'professional' || activeRole === 'professional') ? '/dashboard?tab=overview' : '/dashboard');

  // Check if returning from an OAuth callback
  const isOAuthCallback = typeof window !== 'undefined' && (
    window.location.hash.includes('access_token') || 
    window.location.search.includes('code=')
  );

  // Main flow screen: 'screen1_auth' | 'screen2_role' | 'forgot_password'
  const [currentScreen, setCurrentScreen] = useState<'screen1_auth' | 'screen2_role' | 'forgot_password'>('screen1_auth');

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

  // Screen 2: Account Type Selection (default: customer)
  const [selectedRoleType, setSelectedRoleType] = useState<OnboardingRoleType>('customer');

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
    if (!isLoading && !isOAuthCallback && isAuthenticated && user && !needsRoleSelection && currentScreen === 'screen1_auth') {
      const targetUrl = (user.role === 'professional' || activeRole === 'professional') ? '/dashboard?tab=overview' : '/dashboard';
      navigate(targetUrl, { replace: true });
    }
  }, [isLoading, isOAuthCallback, isAuthenticated, user, needsRoleSelection, currentScreen, activeRole, navigate]);

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
  // Combined Onboarding: Complete Setup Handlers
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

        const updatedPhone = cleanPhone ? `+91 ${cleanPhone}` : (user.phone || '+91 9876543210');
        const updatedName = fullName.trim() || companyName.trim() || user.name;

        // Upsert profile in users table so first-time Google users get full record
        await supabase.from('users').upsert([{
          id: user.id,
          name: updatedName,
          email: user.email || profileEmail.trim(),
          phone: updatedPhone,
          role: resolvedRole,
          avatar: user.avatar || null,
        }], { onConflict: 'id' });

        // Update in-memory authStore user state
        updateUser({
          name: updatedName,
          phone: updatedPhone,
          role: resolvedRole,
        });
        localStorage.removeItem('@camcrew_needs_role');

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

  if (isOAuthCallback || (isLoading && !user)) {
    return (
      <div className="auth-flow-viewport">
        <div className="auth-centered-wrapper" style={{ justifyContent: 'center', minHeight: '60vh' }}>
          <div className="auth-form-card" style={{ textAlign: 'center', padding: '40px 24px', maxWidth: 400 }}>
            <Loader2 size={36} className="animate-spin" color="var(--auth-accent, #3fb668)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--auth-text-primary)' }}>
              Verifying your account...
            </h3>
            <p style={{ fontSize: 13, color: 'var(--auth-text-secondary)', margin: 0 }}>
              Please wait while we connect your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                          <span className="auth-country-code-prefix">IN</span>
                          <span className="auth-country-code-val">+91</span>
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
                <span>OR</span>
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
                  className={`auth-sso-card-btn ${method === 'phone' ? 'is-phone-active' : ''}`}
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
                      <Mail size={15} className="auth-email-toggle-icon" />
                      <span className="auth-email-toggle-text">Email</span>
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
              SCREEN 2: COMBINED POST-SIGNUP ONBOARDING (ROLE & DETAILS)
             ───────────────────────────────────────────────────────────── */}
          {currentScreen === 'screen2_role' && (
            <div className="auth-form-card compact-onboarding-card">
              
              {/* Header */}
              <div className="auth-header" style={{ textAlign: 'left', marginBottom: 16 }}>
                <h2 className="auth-title" style={{ fontSize: 20, marginBottom: 4 }}>Complete Your Profile</h2>
                <p className="auth-subtitle" style={{ fontSize: 12.5 }}>
                  Choose your account type and fill in your details to get started.
                </p>
              </div>

              {error && (
                <div className="auth-alert-notice auth-alert-danger" style={{ padding: '8px 12px', fontSize: 12.5, marginBottom: 14 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleFinalSubmit}>
                {/* 1. Account Type Compact Selector (Stroke-Free) */}
                <div className="auth-field-block" style={{ marginBottom: 14 }}>
                  <label className="auth-label">Account Type</label>
                  <div className="role-compact-grid">
                    {/* 1. Client */}
                    <div
                      className={`role-compact-card ${selectedRoleType === 'customer' ? 'selected' : ''}`}
                      onClick={() => setSelectedRoleType('customer')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="role-compact-icon">
                        <User size={15} />
                      </div>
                      <div className="role-compact-info">
                        <span className="role-compact-title">Client</span>
                        <span className="role-compact-sub">Book & Rent</span>
                      </div>
                    </div>

                    {/* 2. Creator */}
                    <div
                      className={`role-compact-card ${selectedRoleType === 'professional' ? 'selected' : ''}`}
                      onClick={() => setSelectedRoleType('professional')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="role-compact-icon">
                        <Camera size={15} />
                      </div>
                      <div className="role-compact-info">
                        <span className="role-compact-title">Creator</span>
                        <span className="role-compact-sub">Get Booked</span>
                      </div>
                    </div>

                    {/* 3. Studio */}
                    <div
                      className={`role-compact-card ${selectedRoleType === 'business' ? 'selected' : ''}`}
                      onClick={() => setSelectedRoleType('business')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="role-compact-icon">
                        <Building2 size={15} />
                      </div>
                      <div className="role-compact-info">
                        <span className="role-compact-title">Studio</span>
                        <span className="role-compact-sub">Fleet & Crew</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Compact Form Fields Grid */}
                <div className="onboarding-compact-grid">
                  
                  {/* Name Fields */}
                  {selectedRoleType === 'business' ? (
                    <div className="onboarding-two-col">
                      <div className="auth-field-block">
                        <label className="auth-label">Studio Name *</label>
                        <input
                          type="text"
                          className="auth-input no-icon compact"
                          placeholder="e.g. Apex Cinema Works"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="auth-field-block">
                        <label className="auth-label">Contact Person *</label>
                        <input
                          type="text"
                          className="auth-input no-icon compact"
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
                          <User size={15} />
                        </span>
                        <input
                          type="text"
                          className="auth-input compact"
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
                          <Mail size={15} />
                        </span>
                        <input
                          type="email"
                          className="auth-input compact"
                          placeholder="name@example.com"
                          value={profileEmail || email}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="auth-field-block">
                      <label className="auth-label">Mobile (WhatsApp) *</label>
                      <div className="auth-input-container">
                        <span className="auth-input-icon-adornment">
                          <Phone size={15} />
                        </span>
                        <input
                          type="tel"
                          className="auth-input compact"
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
                          <label className="auth-label">Primary Craft *</label>
                          <CustomSelect
                            value={selectedCategory}
                            onChange={(val) => setSelectedCategory(val)}
                            options={PROFESSIONAL_CATEGORIES.map(cat => ({
                              value: cat.name,
                              label: cat.name,
                            }))}
                            placeholder="Select craft"
                          />
                        </div>

                        <div className="auth-field-block">
                          <label className="auth-label">Experience</label>
                          <CustomSelect
                            value={experienceYears}
                            onChange={(val) => setExperienceYears(val)}
                            options={[
                              { value: '1', label: '1 - 2 yrs' },
                              { value: '3', label: '3 - 5 yrs' },
                              { value: '6', label: '6 - 10 yrs' },
                              { value: '10', label: '10+ yrs' },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="auth-field-block">
                        <label className="auth-label">Professional Headline *</label>
                        <input
                          type="text"
                          className="auth-input no-icon compact"
                          placeholder="e.g. Commercial & Fashion Photographer"
                          value={proTitle}
                          onChange={(e) => setProTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="auth-field-block">
                        <div className="auth-field-header">
                          <label className="auth-label">{proArchetype.rateLabel} (Standard ₹) *</label>
                          <span style={{ fontSize: 11, color: 'var(--auth-text-muted)' }}>per 8h day</span>
                        </div>
                        <input
                          type="number"
                          className="auth-input no-icon compact"
                          placeholder="e.g. 8000"
                          value={ratePerDay}
                          onChange={(e) => setRatePerDay(e.target.value)}
                          required
                        />
                        <div className="preset-chips-row compact-chips">
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
                          <label className="auth-label">Studio Specialty</label>
                          <CustomSelect
                            value={studioSpecialty}
                            onChange={(val) => setStudioSpecialty(val)}
                            options={[
                              { value: 'Commercials & Ad Films', label: 'Commercials & Ad Films' },
                              { value: 'OTT & Feature Films', label: 'OTT & Feature Films' },
                              { value: 'Weddings & High-End Events', label: 'Weddings & Events' },
                              { value: 'Camera & Lighting Rental House', label: 'Gear Rental House' },
                              { value: 'Post-Production & VFX Studio', label: 'Post-Production & VFX' },
                            ]}
                          />
                        </div>

                        <div className="auth-field-block">
                          <label className="auth-label">Crew Capacity</label>
                          <CustomSelect
                            value={teamSize}
                            onChange={(val) => setTeamSize(val)}
                            options={[
                              { value: '1-5 crew members', label: '1 - 5 crew members' },
                              { value: '6-15 crew members', label: '6 - 15 crew members' },
                              { value: '16-30 crew members', label: '16 - 30 crew members' },
                              { value: '30+ crew members', label: '30+ crew members' },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="auth-field-block">
                        <label className="auth-label">GSTIN / Tax ID (Optional)</label>
                        <input
                          type="text"
                          className="auth-input no-icon compact"
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
                      <label className="auth-label">What are you looking for?</label>
                      <div className="preset-chips-row compact-chips">
                        {[
                          'Weddings & Events',
                          'Commercial & Ads',
                          'Music Videos',
                          'Fashion & Portfolios',
                          'Equipment Rentals',
                          'Drone Shoots'
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

                {/* Submit Action */}
                <button
                  type="submit"
                  className="auth-primary-submit-btn compact-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Complete Setup & Go to Dashboard</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

      </div>
    </div>
  );
};

export default AuthPage;
