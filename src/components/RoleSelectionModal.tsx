import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isCustomAvatar } from '../utils/avatarUtils';
import { 
  User, 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag, 
  Film, 
  X
} from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onRoleSelected?: (role: 'customer' | 'professional') => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onRoleSelected,
}) => {
  const { user, needsRoleSelection, setNeedsRoleSelection, selectAccountRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState<'customer' | 'professional'>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is currently on /login or /register, let AuthPage handle the inline onboarding flow
  const isAuthRoute = location.pathname.startsWith('/login') || location.pathname.startsWith('/register');

  // If isOpen is not provided, follow needsRoleSelection from auth store
  const showModal = (isOpen !== undefined ? isOpen : needsRoleSelection) && !isAuthRoute;

  if (!showModal || !user) {
    return null;
  }

  const handleConfirmRole = async (roleToSet?: 'customer' | 'professional') => {
    const role = roleToSet || selectedRole;
    setIsSubmitting(true);
    try {
      await selectAccountRole(role);
      onRoleSelected?.(role);
      onClose?.();
      // Redirect to the appropriate dashboard
      if (role === 'professional') {
        navigate('/dashboard?tab=overview');
      } else {
        navigate('/dashboard?tab=client');
      }
    } catch (err) {
      console.error('Failed to set role:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    // Default to customer if dismissed
    setNeedsRoleSelection(false);
    onClose?.();
  };

  const firstName = user.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="role-selection-backdrop" onClick={handleDismiss}>
      <div 
        className="role-selection-modal card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button 
          className="role-selection-close-btn" 
          onClick={handleDismiss}
          title="Skip for now (default to Client)"
        >
          <X size={18} />
        </button>

        {/* Top Header */}
        <div className="role-selection-header">
          <div className="role-selection-avatar-wrapper">
            {isCustomAvatar(user.avatar) ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="role-selection-avatar" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="role-selection-avatar role-selection-avatar-placeholder">
                <User size={32} />
              </div>
            )}
            <span className="role-selection-sparkle-badge">
              <Sparkles size={13} color="#ffffff" />
            </span>
          </div>

          <div className="role-selection-tag">
            <Sparkles size={13} /> ONE QUICK STEP
          </div>

          <h2 className="role-selection-title">Welcome to Camcrew, {firstName}! 🎉</h2>
          <p className="role-selection-subtitle">
            Choose your account type below. This helps us customize your dashboard, tools, and marketplace experience.
          </p>
        </div>

        {/* 2 Role Choice Cards */}
        <div className="role-selection-grid">
          {/* Option 1: Client / Customer */}
          <div 
            className={`role-card-option ${selectedRole === 'customer' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('customer')}
          >
            <div className="role-card-top-row">
              <span className="role-type-pill client-pill">
                <User size={12} /> CLIENT / BOOKER
              </span>
              <div className={`role-radio-check ${selectedRole === 'customer' ? 'checked' : ''}`}>
                {selectedRole === 'customer' && <CheckCircle2 size={18} color="#3fb668" />}
              </div>
            </div>

            <div className="role-card-icon-banner client-banner">
              <ShoppingBag size={28} />
            </div>

            <h3 className="role-card-name">I want to Hire Creators & Gear</h3>
            <p className="role-card-summary">
              For individuals, brands, and agencies looking to book top creative talent and rent equipment.
            </p>

            <ul className="role-card-perks">
              <li>
                <CheckCircle2 size={14} color="#3fb668" />
                <span>Book Cinematographers, Photographers, Editors & Emcees</span>
              </li>
              <li>
                <ShieldCheck size={14} color="#3fb668" />
                <span>100% Escrow Protection on every shoot milestone</span>
              </li>
              <li>
                <ShoppingBag size={14} color="#3fb668" />
                <span>Rent & buy production cameras, lenses & lighting gear</span>
              </li>
              <li>
                <Film size={14} color="#3fb668" />
                <span>Broadcast urgent shoot requirements to local crews</span>
              </li>
            </ul>

            <button 
              type="button"
              className={`btn btn-block ${selectedRole === 'customer' ? 'btn-primary' : 'btn-outline'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRole('customer');
                handleConfirmRole('customer');
              }}
              disabled={isSubmitting}
            >
              {isSubmitting && selectedRole === 'customer' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Continue as Client</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>

          {/* Option 2: Creator / Professional */}
          <div 
            className={`role-card-option pro-option ${selectedRole === 'professional' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('professional')}
          >
            <div className="role-card-top-row">
              <span className="role-type-pill pro-pill">
                <Camera size={12} /> CREATOR / PRO
              </span>
              <div className={`role-radio-check ${selectedRole === 'professional' ? 'checked' : ''}`}>
                {selectedRole === 'professional' && <CheckCircle2 size={18} color="#f59e0b" />}
              </div>
            </div>

            <div className="role-card-icon-banner pro-banner">
              <Camera size={28} />
            </div>

            <h3 className="role-card-name">I am a Creator & Creative Pro</h3>
            <p className="role-card-summary">
              For filmmakers, photographers, drone pilots, sound artists, and caterers offering services.
            </p>

            <ul className="role-card-perks">
              <li>
                <CheckCircle2 size={14} color="#f59e0b" />
                <span>Get booked for commercial, wedding & event shoots</span>
              </li>
              <li>
                <ShieldCheck size={14} color="#f59e0b" />
                <span>Guaranteed milestone escrow & direct bank / UPI payouts</span>
              </li>
              <li>
                <ShoppingBag size={14} color="#f59e0b" />
                <span>List your gear store for rentals or food catering menu</span>
              </li>
              <li>
                <Film size={14} color="#f59e0b" />
                <span>Pitch and claim open broadcast shoot leads nearby</span>
              </li>
            </ul>

            <button 
              type="button"
              className={`btn btn-block ${selectedRole === 'professional' ? 'btn-accent-pro' : 'btn-outline'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRole('professional');
                handleConfirmRole('professional');
              }}
              disabled={isSubmitting}
            >
              {isSubmitting && selectedRole === 'professional' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Continue as Creator</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="role-selection-footer-note">
          💡 You can also switch between Client Mode and Creator Studio anytime from your dashboard settings.
        </p>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
