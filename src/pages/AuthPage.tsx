import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { LocationSelector } from '../components/LocationSelector';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { 
  Camera, 
  User, 
  Loader2,
  Mail,
  Phone,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { getArchetype, PROFESSIONAL_CATEGORIES } from '../constants/categories';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, activeRole, login } = useAuthStore();

  const isRegisterParam = searchParams.get('mode') === 'register' || window.location.pathname.includes('register');
  const roleParam = searchParams.get('role') === 'professional' ? 'professional' : 'customer';
  const redirectUrl = searchParams.get('redirect') || ((user?.role === 'professional' || activeRole === 'professional') ? '/dashboard?tab=overview' : '/dashboard');

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const explicitRedirect = searchParams.get('redirect');
      const target = explicitRedirect || ((user.role === 'professional' || activeRole === 'professional') ? '/dashboard?tab=overview' : '/dashboard');
      navigate(target, { replace: true });
    }
  }, [isLoading, isAuthenticated, user, activeRole, searchParams, navigate]);

  const [isSignUp, setIsSignUp] = useState(isRegisterParam);
  const [role, setRole] = useState<'customer' | 'professional'>(roleParam);

  // OTP Verification Step State
  const [authFlowStep, setAuthFlowStep] = useState<'form' | 'otp'>('form');
  const [pendingAuthAction, setPendingAuthAction] = useState<'login' | 'register'>('login');
  const [pendingAuthPayload, setPendingAuthPayload] = useState<any>(null);
  const [otpTargetPhone, setOtpTargetPhone] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  const [signInMode, setSignInMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState('Photographers');
  const proArchetype = getArchetype(selectedCategory);
  const [proTitle, setProTitle] = useState('');
  const [ratePerDay, setRatePerDay] = useState('');
  const [bio] = useState('');
  const [location, setLocation] = useState({
    state: '',
    district: '',
    city: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Resend OTP Countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');
    setLoading(true);

    try {
      if (signInMode === 'email') {
        const res = await authApi.login(email, password);
        // Enforce SMS OTP verification before completing login
        setPendingAuthAction('login');
        setPendingAuthPayload(res);
        setOtpTargetPhone(res.user.phone || '');
        setAuthFlowStep('otp');
        setOtp('');
        setOtpTimer(30);
        setSuccessNotice('SMS verification code dispatched. (Testing dummy OTP: 123456)');
      } else {
        if (!otpSent) {
          await authApi.sendOTP(phoneNumber);
          setOtpSent(true);
          setSuccessNotice(`OTP sent to +91 ${phoneNumber}. (Use dummy OTP: 123456)`);
          setLoading(false);
          return;
        } else {
          const res = await authApi.verifyOTP(phoneNumber, otp);
          await login(res.user, res.token);
          navigate(redirectUrl);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');
    setLoading(true);

    try {
      if (!name.trim()) throw new Error('Please enter your full name.');
      if (!regEmail.trim()) throw new Error('Please enter your email address.');
      const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) throw new Error('Please enter a valid 10-digit mobile number.');
      if (regPassword.length < 6) throw new Error('Password must be at least 6 characters.');

      // Check phone uniqueness before OTP
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .single();
      if (existingPhone) {
        throw new Error('This phone number is already registered. Please Sign In instead.');
      }

      if (role === 'professional') {
        if (!proTitle.trim()) throw new Error('Please enter your professional headline/title.');
        if (!ratePerDay || isNaN(Number(ratePerDay)) || Number(ratePerDay) <= 0) {
          throw new Error('Please specify your standard daily rate.');
        }
        if (!location.state || !location.city) {
          throw new Error('Please select your operating location.');
        }
      }

      const payload = role === 'customer' ? {
        name: name.trim(),
        email: regEmail.trim(),
        phone: cleanPhone,
        password: regPassword,
      } : {
        name: name.trim(),
        email: regEmail.trim(),
        phone: cleanPhone,
        password: regPassword,
        title: proTitle.trim(),
        bio,
        ratePerDay: Number(ratePerDay),
        state: location.state,
        district: location.district,
        city: location.city,
        categories: [selectedCategory],
      };

      // Require SMS OTP verification before creating the account
      setPendingAuthAction('register');
      setPendingAuthPayload(payload);
      setOtpTargetPhone(cleanPhone);
      setAuthFlowStep('otp');
      setOtp('');
      setOtpTimer(30);
      setSuccessNotice(`Verification code sent to +91 ${cleanPhone}. (Testing dummy OTP: 123456)`);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpStep = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (cleanOtp !== '123456') {
      setError('Invalid OTP code. Please enter 123456.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (pendingAuthAction === 'login') {
        if (!pendingAuthPayload?.user || !pendingAuthPayload?.token) {
          throw new Error('Session expired. Please sign in again.');
        }
        await login(pendingAuthPayload.user, pendingAuthPayload.token);
      } else {
        // Complete Registration
        if (role === 'customer') {
          const res = await authApi.registerCustomer(pendingAuthPayload);
          await login(res.user, res.token);
        } else {
          const res = await authApi.registerProfessional(pendingAuthPayload);
          await login(res.user, res.token);
        }
      }
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendAuthOtp = async () => {
    setOtpTimer(30);
    setSuccessNotice(`New OTP code dispatched to +91 ${otpTargetPhone}. (Testing dummy OTP: 123456)`);
    setError('');
  };

  if (isLoading || (isAuthenticated && user)) {
    return (
      <div className="auth-page-container container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Loader2 size={36} className="animate-spin" color="var(--accent, #3fb668)" />
        <p style={{ color: 'var(--text-muted, #888)', fontSize: '14px' }}>
          {isAuthenticated ? 'Already signed in. Redirecting to your dashboard...' : 'Loading account...'}
        </p>
      </div>
    );
  }

  return (
    <div className="auth-page-container container" style={{ maxWidth: isSignUp && role === 'professional' ? 520 : 480 }}>
      <div className="auth-card-redesigned card">
        {/* Title Header */}
        <div className="auth-header-block text-center">
          <h1 className="auth-title">
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {isSignUp ? 'Join India’s premier creative community' : 'Sign in to access your bookings & leads'}
          </p>
        </div>

        {authFlowStep === 'otp' ? (
          /* ================= SMS OTP STEP ================= */
          <div className="auth-form-body">
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
              onClick={() => {
                setAuthFlowStep('form');
                setError('');
                setSuccessNotice('');
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to {pendingAuthAction === 'login' ? 'Sign In' : 'Registration'}</span>
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(63, 182, 104, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#3fb668', marginBottom: 12 }}>
                <ShieldCheck size={26} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                SMS OTP Verification
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {pendingAuthAction === 'login' 
                  ? 'A security code has been dispatched to your mobile number.' 
                  : `A 6-digit verification code was sent to +91 ${otpTargetPhone}.`}
              </p>
            </div>

            <div style={{
              background: 'rgba(63, 182, 104, 0.12)',
              border: '1px solid rgba(63, 182, 104, 0.3)',
              borderRadius: 12,
              padding: '10px 14px',
              color: '#3fb668',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 16
            }}>
              Dummy SMS OTP for testing: <strong style={{ letterSpacing: '2px', fontSize: 15 }}>123456</strong>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
            {successNotice && <div className="alert alert-success" style={{ marginBottom: 16 }}>{successNotice}</div>}

            <form onSubmit={handleVerifyOtpStep}>
              <div className="auth-field-group">
                <label className="auth-field-label">6-digit verification code</label>
                <div className="auth-input-wrapper">
                  <KeyRound size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="auth-input-box"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{ letterSpacing: '4px', fontSize: 18, textAlign: 'center', fontWeight: 700 }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
                <button
                  type="button"
                  disabled={otpTimer > 0}
                  onClick={handleResendAuthOtp}
                  style={{ background: 'none', border: 'none', color: otpTimer > 0 ? 'var(--text-muted)' : '#3fb668', fontSize: 13, fontWeight: 600, cursor: otpTimer > 0 ? 'not-allowed' : 'pointer' }}
                >
                  {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend Code'}
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Code: 123456</span>
              </div>

              <button type="submit" className="auth-cta-btn" disabled={loading || otp.length < 6}>
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>{pendingAuthAction === 'login' ? 'Verify & Sign In' : 'Verify & Complete Registration'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Primary Segmented Toggle: Sign In vs Register */}
            <div className="auth-primary-segmented-switch">
              <button
                type="button"
                className={`auth-segment-tab ${!isSignUp ? 'active' : ''}`}
                onClick={() => { setIsSignUp(false); setError(''); setSuccessNotice(''); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-segment-tab ${isSignUp ? 'active' : ''}`}
                onClick={() => { setIsSignUp(true); setError(''); setSuccessNotice(''); }}
              >
                Register
              </button>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
            {successNotice && <div className="alert alert-success" style={{ marginBottom: 16 }}>{successNotice}</div>}

            {!isSignUp ? (
              /* ================= SIGN IN FORM ================= */
              <div className="auth-form-body">
                <form onSubmit={handleLogin}>
              {/* Method Toggle: Email vs Mobile OTP */}
              <div className="auth-method-pill-switch">
                <button
                  type="button"
                  className={`method-pill-btn ${signInMode === 'email' ? 'active' : ''}`}
                  onClick={() => { setSignInMode('email'); setOtpSent(false); }}
                >
                  <Mail size={14} />
                  <span>Email & Password</span>
                </button>
                <button
                  type="button"
                  className={`method-pill-btn ${signInMode === 'phone' ? 'active' : ''}`}
                  onClick={() => setSignInMode('phone')}
                >
                  <Phone size={14} />
                  <span>Mobile OTP</span>
                </button>
              </div>

              {signInMode === 'email' ? (
                <>
                  <div className="auth-field-group">
                    <label className="auth-field-label">Email address</label>
                    <div className="auth-input-wrapper">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        className="auth-input-box"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-field-label">Password</label>
                    <div className="auth-input-wrapper">
                      <KeyRound size={16} className="auth-input-icon" />
                      <input
                        type="password"
                        className="auth-input-box"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-field-group">
                    <label className="auth-field-label">Mobile number (+91)</label>
                    <div className="auth-input-wrapper">
                      <Phone size={16} className="auth-input-icon" />
                      <input
                        type="tel"
                        className="auth-input-box"
                        placeholder="9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div className="auth-field-group">
                      <label className="auth-field-label">6-digit verification code</label>
                      <div className="auth-input-wrapper">
                        <KeyRound size={16} className="auth-input-icon" />
                        <input
                          type="text"
                          className="auth-input-box"
                          placeholder="123456"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <button type="submit" className="auth-cta-btn" disabled={loading}>
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>{signInMode === 'phone' && !otpSent ? 'Send OTP' : 'Sign In'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider-line">
              <span>or sign in with</span>
            </div>

            {/* Social Authentication: Google & Apple */}
            <SocialAuthButtons
              mode="signin"
              redirectUrl={redirectUrl}
              onError={setError}
            />
          </div>
        ) : (
          /* ================= REGISTER FORM ================= */
          <div className="auth-form-body">
            {/* Role Selection Cards */}
            <div className="auth-role-picker-container">
              <label className="auth-field-label">I want to join as:</label>
              <div className="role-options-grid">
                <button
                  type="button"
                  className={`role-choice-card ${role === 'customer' ? 'active' : ''}`}
                  onClick={() => setRole('customer')}
                >
                  <div className="role-card-header-row">
                    <div className="role-avatar-circle">
                      <User size={18} />
                    </div>
                    {role === 'customer' && <CheckCircle2 size={16} className="role-check-icon" />}
                  </div>
                  <strong className="role-choice-title">Hire Crew / Gear</strong>
                  <span className="role-choice-sub">Customer Account</span>
                </button>

                <button
                  type="button"
                  className={`role-choice-card ${role === 'professional' ? 'active' : ''}`}
                  onClick={() => setRole('professional')}
                >
                  <div className="role-card-header-row">
                    <div className="role-avatar-circle">
                      <Camera size={18} />
                    </div>
                    {role === 'professional' && <CheckCircle2 size={16} className="role-check-icon" />}
                  </div>
                  <strong className="role-choice-title">Join as Creator</strong>
                  <span className="role-choice-sub">Pro Profile & Leads</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleRegister}>

            {/* Full Name */}
            <div className="auth-field-group">
              <label className="auth-field-label">Full name *</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-input-box"
                  placeholder="e.g. Rahul Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email & Phone 2-Col */}
            <div className="auth-form-row-2">
              <div className="auth-field-group">
                <label className="auth-field-label">Email address *</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    className="auth-input-box"
                    placeholder="rahul@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Mobile number *</label>
                <div className="auth-input-wrapper">
                  <Phone size={16} className="auth-input-icon" />
                  <input
                    type="tel"
                    className="auth-input-box"
                    placeholder="9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="auth-field-group">
              <label className="auth-field-label">Password *</label>
              <div className="auth-input-wrapper">
                <KeyRound size={16} className="auth-input-icon" />
                <input
                  type="password"
                  className="auth-input-box"
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            {/* Professional Specific Fields */}
            {role === 'professional' && (
              <div className="creator-fields-block">
                <div className="auth-field-group">
                  <label className="auth-field-label">Select Primary Category *</label>
                  <CustomSelect
                    value={selectedCategory}
                    onChange={(val) => setSelectedCategory(val)}
                    options={PROFESSIONAL_CATEGORIES.map(cat => ({
                      value: cat.name,
                      label: cat.name,
                    }))}
                    placeholder="Select primary category"
                    icon={<Briefcase size={16} />}
                  />
                </div>

                <div className="auth-form-row-2">
                  <div className="auth-field-group">
                    <label className="auth-field-label">Professional title *</label>
                    <input
                      type="text"
                      className="auth-input-box no-icon"
                      placeholder={
                        selectedCategory === 'Caterers'
                          ? 'e.g. Master Chef & Wedding Catering'
                          : selectedCategory === 'Organisers'
                          ? 'e.g. Turnkey Event Production & Stage Director'
                          : selectedCategory === 'Makeup Artists'
                          ? 'e.g. Celebrity Bridal Makeup Artist'
                          : selectedCategory === 'Mehendi Artists'
                          ? 'e.g. Royal Bridal Henna & Portrait Mehendi'
                          : selectedCategory === 'Developers'
                          ? 'e.g. Full-Stack Web & Mobile Developer'
                          : selectedCategory === 'Designers'
                          ? 'e.g. UI/UX & Brand Identity Specialist'
                          : 'e.g. Cinematographer & Drone Pilot'
                      }
                      value={proTitle}
                      onChange={(e) => setProTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-field-label">{proArchetype.rateLabel} *</label>
                    <input
                      type="number"
                      className="auth-input-box no-icon"
                      placeholder={proArchetype.ratePlaceholder}
                      value={ratePerDay}
                      onChange={(e) => setRatePerDay(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-field-label">Home base locality (India) *</label>
                  <LocationSelector
                    selectedState={location.state}
                    selectedDistrict={location.district}
                    selectedCity={location.city}
                    onChange={setLocation}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="auth-cta-btn" disabled={loading}>
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider-line">
            <span>or register with</span>
          </div>

          {/* Social Authentication (Google & Apple) for Registration */}
          <SocialAuthButtons
            mode="signup"
            role={role}
            redirectUrl={redirectUrl}
            onError={setError}
          />
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
