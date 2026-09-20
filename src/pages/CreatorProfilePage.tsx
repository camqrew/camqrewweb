import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { professionalApi } from '../api/professionalApi';
import type { ProfessionalProfile, ReviewItem } from '../types/professional';
import { useAuthStore } from '../store/authStore';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  Camera, 
  Briefcase, 
  ArrowLeft,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle,
  MessageCircle,
  X,
  LogIn,
  Share2,
  Film,
  Plus,
  ZoomIn,
  Image as ImageIcon,
  User
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { SocialShareModal } from '../components/SocialShareModal';
import { VideoReelsGallery } from '../components/VideoReelsGallery';
import { isCustomAvatar } from '../utils/avatarUtils';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { getArchetype } from '../constants/categories';

export const CreatorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [pro, setPro] = useState<ProfessionalProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review Composer State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewToast, setReviewToast] = useState<string | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (id) {
      professionalApi.getProfileById(id)
        .then((profile) => {
          setPro(profile);
          setReviews(profile.reviews || []);
        })
        .catch((err) => setError(err.message || 'Failed to load profile'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Auto-clear toast
  useEffect(() => {
    if (reviewToast) {
      const timer = setTimeout(() => setReviewToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [reviewToast]);

  const handleOpenReview = () => {
    if (!isAuthenticated || !user) {
      setAuthPromptOpen(true);
      return;
    }
    setSelectedRating(5);
    setComment('');
    setShowReviewForm(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pro) return;
    if (!comment.trim()) {
      alert('Please write a brief comment describing your shoot experience.');
      return;
    }

    setSubmittingReview(true);
    try {
      const newRev = await professionalApi.addReview(pro.id, selectedRating, comment);
      setReviews(prev => [newRev, ...prev]);

      // Locally update creator's rating & reviewCount
      const newCount = (pro.reviewCount || 0) + 1;
      const currentRating = pro.rating || 5.0;
      const newAvg = Number(((currentRating * (pro.reviewCount || 0) + selectedRating) / newCount).toFixed(1));

      setPro(prev => prev ? {
        ...prev,
        rating: newAvg,
        reviewCount: newCount,
        reviews: [newRev, ...(prev.reviews || [])]
      } : null);

      setShowReviewForm(false);
      setComment('');
      setReviewToast('Your verified rating and review have been published! ⭐');
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container profile-loading" style={{ padding: '80px 20px' }}>
        <div className="card skeleton-card" style={{ height: 400 }} />
      </div>
    );
  }

  if (error || !pro) {
    return (
      <div className="container text-center" style={{ padding: '80px 20px' }}>
        <h2>Creator Not Found</h2>
        <p>{error || 'The requested profile does not exist.'}</p>
        <Link to="/explore" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Explore
        </Link>
      </div>
    );
  }

  const effectiveStar = hoverStar !== null ? hoverStar : selectedRating;
  const ratingLabels: { [key: number]: string } = {
    5: '⭐⭐⭐⭐⭐ Exceptional Quality!',
    4: '⭐⭐⭐⭐ Very Good Experience',
    3: '⭐⭐⭐ Good / Satisfactory',
    2: '⭐⭐ Fair / Minor Issues',
    1: '⭐ Needs Improvement'
  };

  const proArchetype = getArchetype(pro.categories);

  return (
    <div className="creator-profile-page">
      {/* Dynamic Open Graph / Twitter Meta Tags for WhatsApp & Social Sharing */}
      <SEOHead 
        title={`${pro.name} - ${pro.title}`}
        description={`Book verified ${proArchetype.roleNoun.toLowerCase()} ${pro.name} (${pro.title}) in ${pro.city || pro.district}, ${pro.state}. Starting at ₹${pro.ratePerDay?.toLocaleString('en-IN')}/${proArchetype.rateUnitDefault.toLowerCase()} with milestone escrow protection.`}
        image={pro.bannerImage || pro.avatar}
      />

      {/* Toast Notification */}
      {reviewToast && (
        <div className="global-floating-toast">
          <CheckCircle size={18} className="toast-icon" />
          <span>{reviewToast}</span>
          <button className="toast-close-btn" onClick={() => setReviewToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="profile-hero-banner" style={{ backgroundImage: `url(${pro.bannerImage})` }}>
        <div className="banner-overlay">
          <div className="container banner-nav-container">
            <button onClick={() => navigate(-1)} className="btn btn-sm btn-ghost back-link">
              <ArrowLeft size={16} /> Back
            </button>

            <button 
              type="button" 
              onClick={() => setShareModalOpen(true)}
              className="btn btn-sm btn-glass hero-share-btn"
              title="Share profile card on WhatsApp & Instagram"
            >
              <Share2 size={15} /> Share Profile
            </button>
          </div>
        </div>
      </div>

      <div className="container profile-content-container">
        <div className="profile-layout-grid">
          {/* Main Column */}
          <div className="profile-main-col">
            <div className="card profile-header-card">
              <div className="avatar-header-row">
                <div className="avatar-wrapper-lg">
                  {isCustomAvatar(pro.avatar) ? (
                    <img src={pro.avatar} alt={pro.name} className="profile-avatar-lg" />
                  ) : (
                    <div className="profile-avatar-lg avatar-placeholder-lg">
                      <User size={48} />
                    </div>
                  )}
                  {pro.verified && (
                    <span className="badge-verified-lg" title="Verified Creator">
                      <CheckCircle2 size={22} fill="var(--accent)" color="#fff" />
                    </span>
                  )}
                </div>
                <div className="header-meta">
                  <h1 className="profile-name">{pro.name}</h1>
                  <p className="profile-title">{pro.title}</p>
                  <div className="meta-pills-row">
                    <span className="meta-pill">
                      <Star size={16} fill="#F5A623" color="#F5A623" />
                      <strong>{pro.rating?.toFixed(1) || '5.0'}</strong> ({reviews.length || pro.reviewCount || 0} reviews)
                    </span>
                    <span className="meta-pill">
                      <MapPin size={16} color="var(--text-muted)" />
                      {pro.city || pro.district}, {pro.state}
                    </span>
                    <span className="meta-pill">
                      <Briefcase size={16} color="var(--text-muted)" />
                      {pro.experienceYears}+ years exp
                    </span>
                  </div>
                </div>
              </div>

              {pro.categories && pro.categories.length > 0 && (
                <div className="profile-categories-row">
                  {pro.categories.map((c) => (
                    <span key={c} className="cat-pill">{c}</span>
                  ))}
                </div>
              )}
            </div>

            {/* About Card */}
            <div className="card profile-section-card">
              <h3 className="section-heading">About the {proArchetype.roleNoun}</h3>
              <p className="bio-text">{pro.bio || 'No bio provided.'}</p>
            </div>

            {/* Capabilities / Equipment Card */}
            {pro.equipment && pro.equipment.length > 0 && (
              <div className="card profile-section-card">
                <h3 className="section-heading">{proArchetype.equipmentSectionTitle}</h3>
                <div className="gear-grid">
                  {pro.equipment.map((item, idx) => (
                    <div key={idx} className="gear-item-card">
                      <Briefcase size={18} color="var(--accent)" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications & Industry Badges Card */}
            {pro.certifications && pro.certifications.length > 0 && (
              <div className="card profile-section-card">
                <h3 className="section-heading">{proArchetype.skillsSectionTitle}</h3>
                <div className="gear-grid">
                  {pro.certifications.map((cert, idx) => (
                    <div key={idx} className="gear-item-card" style={{ borderColor: 'var(--accent-alpha, rgba(63, 182, 104, 0.25))' }}>
                      <ShieldCheck size={18} color="var(--accent)" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Showreels & Video Reels Section */}
            {pro.videoReels && pro.videoReels.length > 0 ? (
              <VideoReelsGallery 
                reels={pro.videoReels}
                proName={pro.name}
                proAvatar={pro.avatar}
                onBookClick={() => navigate(`/book/${pro.id}`)}
              />
            ) : (
              (user?.id === pro.id || user?.id === pro.userId) && (
                <div className="card profile-section-card reel-creator-prompt-card">
                  <div className="reel-prompt-inner">
                    <div className="reel-prompt-icon-box">
                      <Film size={22} color="var(--accent, #3fb668)" />
                    </div>
                    <div className="reel-prompt-text-col">
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Showcase Your Video Reels & 9:16 Shorts
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                        Add YouTube videos, vertical Shorts, and Vimeo showreels to boost client booking conversions.
                      </p>
                    </div>
                    <Link to="/dashboard?tab=overview" className="btn btn-sm btn-primary" style={{ whiteSpace: 'nowrap' }}>
                      <Plus size={14} /> Add Reels
                    </Link>
                  </div>
                </div>
              )
            )}

            {/* Portfolio Card */}
            <div className="card profile-section-card">
              <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ImageIcon size={18} color="var(--accent, #3fb668)" />
                    Portfolio Highlights
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge-sub">{pro.portfolio?.length || 0} items</span>
                  {(user?.id === pro.id || user?.id === pro.userId) && (
                    <Link to="/dashboard?tab=overview" className="btn btn-sm btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12 }}>
                      <Plus size={13} /> Manage Photos
                    </Link>
                  )}
                </div>
              </div>

              {pro.portfolio && pro.portfolio.length > 0 ? (
                <div className="portfolio-gallery-grid">
                  {pro.portfolio.map((imgUrl, i) => (
                    <div 
                      key={i} 
                      className="portfolio-img-box clickable-portfolio-img"
                      onClick={() => {
                        setLightboxIndex(i);
                        setLightboxOpen(true);
                      }}
                      title="Click to view fullscreen"
                    >
                      <img src={imgUrl} alt={`Portfolio work ${i + 1}`} loading="lazy" />
                      <div className="portfolio-hover-zoom-overlay">
                        <ZoomIn size={22} color="#fff" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                (user?.id === pro.id || user?.id === pro.userId) ? (
                  <div className="reel-creator-prompt-card" style={{ padding: 16, marginTop: 4 }}>
                    <div className="reel-prompt-inner">
                      <div className="reel-prompt-icon-box">
                        <Camera size={22} color="var(--accent, #3fb668)" />
                      </div>
                      <div className="reel-prompt-text-col">
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Add Your Photography & Stills
                        </h4>
                        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                          Showcase client shoots, lookbooks, and behind-the-scenes to attract direct booking leads.
                        </p>
                      </div>
                      <Link to="/dashboard?tab=overview" className="btn btn-sm btn-primary" style={{ whiteSpace: 'nowrap' }}>
                        <Plus size={13} /> Upload Photos
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted">No portfolio items uploaded yet.</p>
                )
              )}
            </div>

            {/* ── CLIENT REVIEWS & STAR RATINGS SECTION ── */}
            <div className="card profile-section-card reviews-section-card">
              <div className="reviews-section-header">
                <div>
                  <h3 className="section-heading" style={{ margin: 0 }}>Client Reviews & Ratings</h3>
                  <div className="reviews-score-banner">
                    <Star size={18} color="#F5A623" fill="#F5A623" />
                    <span className="reviews-large-score">{pro.rating?.toFixed(1) || '5.0'}</span>
                    <span className="reviews-count-badge">
                      Based on {reviews.length} {reviews.length === 1 ? 'verified review' : 'verified reviews'}
                    </span>
                  </div>
                </div>

                {!showReviewForm && (
                  <button 
                    type="button"
                    className="btn btn-outline btn-sm write-review-trigger-btn"
                    onClick={handleOpenReview}
                  >
                    <Star size={14} fill="var(--accent)" color="var(--accent)" />
                    <span>Write a Review</span>
                  </button>
                )}
              </div>

              {/* Expandable Review Form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="card review-composer-form">
                  <div className="review-composer-header">
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                      Rate & Review {pro.name}
                    </h4>
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => setShowReviewForm(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Interactive Star Rating Selector */}
                  <div className="star-rating-selector-block">
                    <span className="star-picker-label">Your Rating:</span>
                    <div className="star-interactive-row">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          className="star-click-btn"
                          onMouseEnter={() => setHoverStar(starVal)}
                          onMouseLeave={() => setHoverStar(null)}
                          onClick={() => setSelectedRating(starVal)}
                          title={`Rate ${starVal} Stars`}
                        >
                          <Star
                            size={28}
                            color={starVal <= effectiveStar ? '#F5A623' : 'var(--text-muted)'}
                            fill={starVal <= effectiveStar ? '#F5A623' : 'transparent'}
                            className="star-icon-anim"
                          />
                        </button>
                      ))}
                    </div>
                    <span className="star-dynamic-caption">
                      {ratingLabels[effectiveStar] || 'Select Rating'}
                    </span>
                  </div>

                  {/* Review Textarea */}
                  <div className="form-group" style={{ marginTop: 14 }}>
                    <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                      Share details of your experience
                    </label>
                    <textarea
                      className="form-input review-textarea"
                      placeholder="Describe shoot communication, punctuality, creative vision, deliverable timelines..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={500}
                      rows={4}
                      required
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {comment.length}/500 characters
                      </span>
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="review-form-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowReviewForm(false)}
                      disabled={submittingReview}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={submittingReview}
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={14} style={{ marginRight: 6 }} />
                          Submit Verified Review
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="empty-reviews-state">
                  <MessageCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h4>No Client Reviews Yet</h4>
                  <p>Be the first verified customer to share your experience working with {pro.name}.</p>
                  {!showReviewForm && (
                    <button 
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleOpenReview}
                      style={{ marginTop: 14 }}
                    >
                      Rate & Review Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="reviews-feed-list">
                  {reviews.map((rev, i) => (
                    <div key={rev.id || i} className="review-feed-item">
                      <div className="review-author-meta-row">
                        <div className="reviewer-info-group">
                          {isCustomAvatar(rev.clientAvatar) ? (
                            <img src={rev.clientAvatar} alt={rev.clientName} className="reviewer-avatar-img" />
                          ) : (
                            <div className="reviewer-initials-badge">
                              {rev.clientName ? rev.clientName[0].toUpperCase() : 'C'}
                            </div>
                          )}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <strong className="reviewer-name-text">{rev.clientName}</strong>
                              <span className="client-verified-tag">✓ Verified Client</span>
                            </div>
                            <span className="review-date-text">{rev.date}</span>
                          </div>
                        </div>

                        {/* Stars Pill */}
                        <div className="review-stars-pill">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <Star
                              key={starVal}
                              size={14}
                              color={starVal <= rev.rating ? '#F5A623' : 'var(--text-muted)'}
                              fill={starVal <= rev.rating ? '#F5A623' : 'transparent'}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="review-body-text">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <aside className="profile-sidebar-col">
            <div className="card booking-sidebar-card">
              <div className="price-header">
                <span className="price-label">Starting Rate</span>
                <div className="price-val-row">
                  <span className="price-val">₹{pro.ratePerDay?.toLocaleString('en-IN')}</span>
                  <span className="price-unit">/ {proArchetype.rateUnitDefault.toLowerCase()}</span>
                </div>
              </div>

              <hr className="divider" />

              <div className="escrow-highlight-box">
                <ShieldCheck size={20} color="var(--accent)" />
                <div>
                  <strong>Camqrew Escrow Protected</strong>
                  <p>30% Advance • 40% Wrap • 30% Delivery</p>
                </div>
              </div>

              <div className="action-buttons-stack">
                <Link to={`/book/${pro.id}`} className="btn btn-primary btn-lg full-width">
                  {proArchetype.bookingCtaPrefix} <ChevronRight size={18} />
                </Link>

                <Link to={`/chat?userId=${pro.id}`} className="btn btn-outline full-width">
                  <MessageSquare size={16} /> Direct Message
                </Link>

                <button 
                  type="button" 
                  onClick={() => setShareModalOpen(true)}
                  className="btn btn-ghost full-width share-sidebar-trigger-btn"
                >
                  <Share2 size={16} /> Share Preview Card
                </button>
              </div>

              <div className="guarantee-points">
                <span>✓ Verified capabilities & credentials</span>
                <span>✓ Direct calendar booking</span>
                <span>✓ 100% money back if cancelled per policy</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Auth Prompt Modal */}
      {authPromptOpen && (
        <div className="auth-gate-modal-backdrop" onClick={() => setAuthPromptOpen(false)}>
          <div className="auth-gate-modal-card card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-icon" onClick={() => setAuthPromptOpen(false)}>
              <X size={20} />
            </button>

            <div className="auth-gate-icon-circle">
              <Star size={32} color="var(--accent)" fill="var(--accent)" />
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 16, textAlign: 'center' }}>
              Sign In to Leave a Review
            </h3>

            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '12px 0 24px', fontSize: 14, lineHeight: 1.6 }}>
              You need to be signed in to submit a rating and review for <strong style={{ color: 'var(--text-primary)' }}>{pro.name}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                type="button"
                className="btn btn-primary btn-lg full-width"
                onClick={() => {
                  setAuthPromptOpen(false);
                  navigate(`/login?redirect=${encodeURIComponent(`/creators/${pro.id}`)}`);
                }}
              >
                <LogIn size={18} style={{ marginRight: 6 }} />
                Sign In or Register →
              </button>

              <button 
                type="button"
                className="btn btn-outline full-width"
                onClick={() => setAuthPromptOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Share Preview Modal */}
      {pro && (
        <SocialShareModal 
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          pro={pro}
        />
      )}

      {/* Fullscreen Portfolio Lightbox */}
      {pro && (
        <ImageLightboxModal
          isOpen={lightboxOpen}
          images={pro.portfolio || []}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          title={`${pro.name} Portfolio`}
        />
      )}
    </div>
  );
};

export default CreatorProfilePage;
