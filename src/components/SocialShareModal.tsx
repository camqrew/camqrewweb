import React, { useState } from 'react';
import type { ProfessionalProfile } from '../types/professional';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pro: ProfessionalProfile;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  pro,
}) => {
  const [copied, setCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<'whatsapp' | 'instagram'>('whatsapp');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/creators/${pro.id}`
    : `https://camqrew.in/creators/${pro.id}`;

  const ratingStr = pro.rating ? pro.rating.toFixed(1) : '5.0';
  const locationStr = `${pro.city || pro.district || 'India'}, ${pro.state || ''}`.replace(/,\s*$/, '');
  const rateStr = `₹${pro.ratePerDay?.toLocaleString('en-IN') || '15,000'}/day`;

  const shareText = `Check out ${pro.name} (${pro.title}) on Camqrew! 📸 Rated ${ratingStr}★ in ${locationStr}. Starting at ${rateStr} with escrow protection.\n${profileUrl}`;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      showToast('Profile link copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy link automatically.');
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleInstagramStory = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast('Link copied! Open Instagram Story & paste in the Link Sticker 🔗');
    } catch {
      showToast('Could not copy link.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${pro.name} - ${pro.title} | Camqrew`,
          text: `Book verified creator ${pro.name} on Camqrew (${rateStr})`,
          url: profileUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="share-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="share-modal-card card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <div className="share-header-title-box">
            <div className="share-header-icon-circle">
              <Share2 size={18} color="var(--accent, #3fb668)" />
            </div>
            <div>
              <h3 className="share-modal-title">Share Creator Profile</h3>
              <p className="share-modal-subtitle">Dynamic preview card for WhatsApp & Instagram</p>
            </div>
          </div>
          <button className="share-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Floating Toast inside modal */}
        {toastMsg && (
          <div className="share-inline-toast">
            <Sparkles size={14} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Tab Switcher: WhatsApp Preview vs Instagram Preview */}
        <div className="preview-tab-pills">
          <button 
            className={`preview-tab-btn ${previewTab === 'whatsapp' ? 'active-wa' : ''}`}
            onClick={() => setPreviewTab('whatsapp')}
          >
            <span className="wa-dot" /> WhatsApp Preview Card
          </button>
          <button 
            className={`preview-tab-btn ${previewTab === 'instagram' ? 'active-ig' : ''}`}
            onClick={() => setPreviewTab('instagram')}
          >
            <span className="ig-dot" /> Instagram Preview Card
          </button>
        </div>

        {/* PREVIEW CONTAINER */}
        <div className="share-preview-display-box">
          {previewTab === 'whatsapp' ? (
            /* WhatsApp Chat Bubble Mockup */
            <div className="whatsapp-bubble-mockup">
              <div className="wa-bubble-content">
                <div className="wa-link-card">
                  <div className="wa-preview-image-wrap">
                    <img 
                      src={pro.bannerImage || pro.avatar} 
                      alt={pro.name} 
                      className="wa-preview-img"
                    />
                    <div className="wa-avatar-badge">
                      <img src={pro.avatar} alt="" className="wa-thumb-avatar" />
                    </div>
                  </div>
                  <div className="wa-preview-info">
                    <div className="wa-domain-row">
                      <span className="wa-domain-text">CAMQREW.IN</span>
                      <span className="wa-escrow-tag">
                        <ShieldCheck size={11} /> Escrow Verified
                      </span>
                    </div>
                    <h4 className="wa-card-title">{pro.name} - {pro.title}</h4>
                    <p className="wa-card-desc">
                      ⭐ {ratingStr} ({pro.reviewCount || pro.reviews?.length || 0} reviews) • {locationStr} • Starting at {rateStr}
                    </p>
                  </div>
                </div>

                <div className="wa-bubble-text">
                  <span>{profileUrl}</span>
                  <span className="wa-bubble-time">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Instagram DM / Story Link Mockup */
            <div className="instagram-dm-mockup">
              <div className="ig-story-sticker-card">
                <div className="ig-card-top-row">
                  <div className="ig-profile-avatar-stack">
                    <img src={pro.avatar} alt="" className="ig-card-avatar" />
                    {pro.verified && (
                      <CheckCircle2 size={14} className="ig-verified-icon" fill="#3897f0" color="#fff" />
                    )}
                  </div>
                  <div className="ig-card-title-col">
                    <span className="ig-card-handle">{pro.name}</span>
                    <span className="ig-card-subtitle">{pro.title} • {locationStr}</span>
                  </div>
                </div>

                <div className="ig-card-banner-box">
                  <img src={pro.bannerImage || pro.avatar} alt="" className="ig-card-banner-img" />
                  <div className="ig-card-pill-overlay">
                    <Star size={12} fill="#ffd700" color="#ffd700" />
                    <span>{ratingStr} Rating</span>
                    <span className="pill-separator">•</span>
                    <span>{rateStr}</span>
                  </div>
                </div>

                <div className="ig-card-footer-cta">
                  <span className="ig-card-link-text">camqrew.in/creators/{pro.id}</span>
                  <span className="ig-sticker-button">View Profile ↗</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Link Field */}
        <div className="share-url-copy-box">
          <input 
            type="text" 
            readOnly 
            value={profileUrl} 
            className="share-url-input" 
          />
          <button 
            type="button" 
            className={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={handleCopyLink}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Share Action Grid */}
        <div className="share-actions-grid">
          <button 
            type="button" 
            className="share-action-btn wa-share-btn"
            onClick={handleWhatsAppShare}
          >
            <div className="btn-icon-svg-wa">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </div>
            <span>Send on WhatsApp</span>
          </button>

          <button 
            type="button" 
            className="share-action-btn ig-share-btn"
            onClick={handleInstagramStory}
          >
            <div className="btn-icon-svg-ig">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <span>Instagram Story Link</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button 
              type="button" 
              className="share-action-btn native-share-btn"
              onClick={handleNativeShare}
            >
              <Share2 size={18} />
              <span>More Options...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
