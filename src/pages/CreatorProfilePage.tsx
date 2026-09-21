import React, { useState, useEffect, useMemo } from 'react';
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
  User,
  UtensilsCrossed,
  Minus,
  Users,
  ArrowRight
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

  // Catering Menu & Quotation State
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('All');
  const [dishQuantities, setDishQuantities] = useState<Record<string, number>>({});
  const [guestCount, setGuestCount] = useState<number>(50);

  const availableDishes = useMemo(() => {
    return (pro?.menuItems || []).filter(d => d.isAvailable);
  }, [pro?.menuItems]);

  const menuCategories = useMemo(() => {
    const cats = ['All'];
    availableDishes.forEach(d => {
      if (!cats.includes(d.category)) cats.push(d.category);
    });
    return cats;
  }, [availableDishes]);

  const filteredDishes = useMemo(() => {
    if (selectedMenuCategory === 'All') return availableDishes;
    return availableDishes.filter(d => d.category === selectedMenuCategory);
  }, [availableDishes, selectedMenuCategory]);

  const selectedDishesList = useMemo(() => {
    return availableDishes.filter(d => (dishQuantities[d.id] || 0) > 0);
  }, [availableDishes, dishQuantities]);

  const totalDishesSelectedCount = useMemo(() => {
    return Object.values(dishQuantities).reduce((acc, q) => acc + q, 0);
  }, [dishQuantities]);

  const perPlateSubtotal = useMemo(() => {
    return selectedDishesList.reduce((acc, d) => acc + (d.pricePerPlate * (dishQuantities[d.id] || 0)), 0);
  }, [selectedDishesList, dishQuantities]);

  const grandQuotationTotal = useMemo(() => {
    return perPlateSubtotal * guestCount;
  }, [perPlateSubtotal, guestCount]);

  const handleUpdateDishQty = (dishId: string, delta: number) => {
    setDishQuantities(prev => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [dishId]: next };
    });
  };

  const handleBookWithQuotation = () => {
    const itemsSummary = selectedDishesList
      .map(d => `${d.name} (${dishQuantities[d.id]}x @ ₹${d.pricePerPlate}/plate)`)
      .join(', ');
    const notes = `Catering Quotation for ${guestCount} Guests:\nSelected Dishes: ${itemsSummary}\nPer Plate: ₹${perPlateSubtotal.toLocaleString('en-IN')}\nEstimated Total: ₹${grandQuotationTotal.toLocaleString('en-IN')}`;
    navigate(`/book/${pro?.id}?total=${grandQuotationTotal}&jobTitle=${encodeURIComponent(`Catering Package - ${guestCount} Guests`)}&notes=${encodeURIComponent(notes)}`);
  };

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

            {/* ── CATERING MENU & DISHES WITH INSTANT QUOTATION (CATERERS ONLY) ── */}
            {proArchetype.archetype === 'catering' && availableDishes.length > 0 && (
              <div className="card profile-section-card catering-menu-section-card">
                <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UtensilsCrossed size={20} color="var(--accent, #3fb668)" />
                      Menu & Dishes
                      <span className="badge-sub" style={{ fontSize: 12, padding: '2px 8px' }}>
                        {availableDishes.length} available
                      </span>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                      Select dishes below to calculate an instant quotation for your event guest count.
                    </p>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="menu-cat-filter-pills" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
                  {menuCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedMenuCategory(cat)}
                      className={`cat-pill clickable ${selectedMenuCategory === cat ? 'active' : ''}`}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: selectedMenuCategory === cat ? '1px solid var(--accent, #3fb668)' : '1px solid var(--border-color)',
                        background: selectedMenuCategory === cat ? 'rgba(63, 182, 104, 0.15)' : 'var(--surface-elevated, #1a1e24)',
                        color: selectedMenuCategory === cat ? 'var(--accent, #3fb668)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Dish Cards Grid */}
                <div className="catering-dishes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
                  {filteredDishes.map(dish => {
                    const qty = dishQuantities[dish.id] || 0;
                    const isGreen = dish.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan');
                    return (
                      <div 
                        key={dish.id} 
                        className={`catering-dish-item-card ${qty > 0 ? 'selected-dish' : ''}`}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 12,
                          background: qty > 0 ? 'rgba(63, 182, 104, 0.06)' : 'var(--surface-elevated, #161a1f)',
                          border: qty > 0 ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color)',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span 
                              style={{ 
                                display: 'inline-block',
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                backgroundColor: isGreen ? '#22c55e' : '#ef4444',
                                flexShrink: 0
                              }} 
                              title={isGreen ? 'Vegetarian' : 'Non-Vegetarian'}
                            />
                            <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {dish.name}
                            </h4>
                          </div>

                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 6px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(63, 182, 104, 0.12)', color: 'var(--accent, #3fb668)' }}>
                              {dish.category}
                            </span>
                            {dish.dietaryTags?.map(t => (
                              <span key={t} style={{ 
                                fontSize: 10, 
                                fontWeight: 700, 
                                padding: '2px 6px', 
                                borderRadius: 4, 
                                background: (t === 'Veg' || t === 'Jain' || t === 'Vegan') ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: (t === 'Veg' || t === 'Jain' || t === 'Vegan') ? '#16a34a' : '#dc2626'
                              }}>
                                {t}
                              </span>
                            ))}
                          </div>

                          {dish.description && (
                            <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {dish.description}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent, #3fb668)' }}>
                              ₹{dish.pricePerPlate.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>/ plate</span>
                          </div>

                          {/* Stepper */}
                          <div className="dish-qty-stepper" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-card, #111)', padding: '4px 8px', borderRadius: 20, border: '1px solid var(--border-color)' }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateDishQty(dish.id, -1)}
                              disabled={qty <= 0}
                              style={{ border: 'none', background: 'transparent', cursor: qty > 0 ? 'pointer' : 'default', opacity: qty > 0 ? 1 : 0.4, color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: 'center', color: 'var(--text-primary)' }}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateDishQty(dish.id, 1)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent, #3fb668)', display: 'flex', alignItems: 'center' }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quotation Calculator Box */}
                <div className="catering-quotation-summary-box card" style={{ padding: 18, background: 'var(--surface-card, #111418)', border: '1px solid rgba(63, 182, 104, 0.3)', borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(63, 182, 104, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent, #3fb668)' }}>
                        <Users size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Event Guest Count
                        </h4>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Prices will multiply by guest count</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setGuestCount(g => Math.max(10, g - 10))}
                        style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={14} />
                      </button>
                      <div style={{ textAlign: 'center', minWidth: 70 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{guestCount}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: -2 }}>guests</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setGuestCount(g => g + 10)}
                        style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {selectedDishesList.length > 0 ? (
                    <div>
                      {/* Breakdown table */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>
                          <span>Selected Dish ({totalDishesSelectedCount})</span>
                          <span>Rate × Guests</span>
                        </div>
                        {selectedDishesList.map(dish => {
                          const q = dishQuantities[dish.id] || 0;
                          const lineTotal = dish.pricePerPlate * q * guestCount;
                          return (
                            <div key={dish.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13, borderBottom: '1px dashed rgba(255,255,255,0.06)' }}>
                              <div>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{dish.name}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>
                                  ({q}x @ ₹{dish.pricePerPlate}/plate)
                                </span>
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--accent, #3fb668)' }}>
                                ₹{lineTotal.toLocaleString('en-IN')}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, paddingTop: 4 }}>
                        <div>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Per Guest Subtotal: <strong>₹{perPlateSubtotal.toLocaleString('en-IN')}</strong> × {guestCount} guests
                          </span>
                          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent, #3fb668)', letterSpacing: '-0.5px' }}>
                            ₹{grandQuotationTotal.toLocaleString('en-IN')}
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>estimated quotation</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary btn-md"
                          onClick={handleBookWithQuotation}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 24 }}
                        >
                          <span>Proceed to Book with Menu</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 0 4px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                        👉 Click the <strong>+</strong> button on any dish above to calculate an instant quotation.
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--text-muted)' }}>
                    <ShieldCheck size={14} color="var(--accent, #3fb668)" />
                    <span>Camqrew Escrow Protection: 30% Advance • 40% Wrap • 30% Final Wrap</span>
                  </div>
                </div>
              </div>
            )}

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
                <span className="price-label">
                  {selectedDishesList.length > 0 ? `Quotation (${guestCount} Guests)` : 'Starting from'}
                </span>
                <div className="price-val-row">
                  <span className="price-val">
                    ₹{selectedDishesList.length > 0
                      ? grandQuotationTotal.toLocaleString('en-IN')
                      : pro.ratePerDay?.toLocaleString('en-IN')}
                  </span>
                  <span className="price-unit">
                    {selectedDishesList.length > 0 ? ' estimated' : `/ ${proArchetype.rateUnitDefault.toLowerCase()}`}
                  </span>
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
                {selectedDishesList.length > 0 ? (
                  <button 
                    type="button" 
                    onClick={handleBookWithQuotation} 
                    className="btn btn-primary btn-lg full-width"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <span>Book with Quotation</span> <ChevronRight size={18} />
                  </button>
                ) : (
                  <Link to={`/book/${pro.id}`} className="btn btn-primary btn-lg full-width">
                    {proArchetype.bookingCtaPrefix} <ChevronRight size={18} />
                  </Link>
                )}

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
