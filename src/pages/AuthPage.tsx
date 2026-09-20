import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  CheckCircle2
} from 'lucide-react';
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (signInMode === 'email') {
        const res = await authApi.login(email, password);
        await login(res.user, res.token);
      } else {
        if (!otpSent) {
          await authApi.sendOTP(phoneNumber);
          setOtpSent(true);
          setLoading(false);
          return;
        } else {
          const res = await authApi.verifyOTP(phoneNumber, otp);
          await login(res.user, res.token);
        }
      }
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'customer') {
        const res = await authApi.registerCustomer({
          name,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
        });
        await login(res.user, res.token);
      } else {
        const res = await authApi.registerProfessional({
          name,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          title: proTitle,
          bio,
          ratePerDay: Number(ratePerDay),
          state: location.state,
          district: location.district,
          city: location.city,
          categories: [selectedCategory],
        });
        await login(res.user, res.token);
      }
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
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

        {/* Primary Segmented Toggle: Sign In vs Register */}
        <div className="auth-primary-segmented-switch">
          <button
            type="button"
            className={`auth-segment-tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-segment-tab ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 14 }}>
                    {PROFESSIONAL_CATEGORIES.map(cat => {
                      const isSel = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.name)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 20,
                            border: isSel ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border, #333)',
                            background: isSel ? 'var(--accent-alpha, rgba(63, 182, 104, 0.15))' : 'var(--surface-elevated, #1f2937)',
                            color: isSel ? 'var(--accent, #3fb668)' : 'var(--text-primary, #fff)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
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
      </div>
    </div>
  );
};

export default AuthPage;
