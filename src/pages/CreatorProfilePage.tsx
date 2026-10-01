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
  ArrowRight,
  Clock,
  Sparkles,
  Gift,
  ShoppingBag,
  Eye,
  Music,
  Globe,
  Mic
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { SocialShareModal } from '../components/SocialShareModal';
import { VideoReelsGallery } from '../components/VideoReelsGallery';
import { isCustomAvatar } from '../utils/avatarUtils';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { getArchetype } from '../constants/categories';
import { ProductCard } from '../components/ProductCard';
import { productApi } from '../api/productApi';
import { useCartStore } from '../store/cartStore';
import type { Product } from '../types/product';
import { getServiceImage } from '../utils/serviceUtils';
import { getEscrowMilestoneRules, getEscrowSummaryText } from '../utils/escrowUtils';

export const CreatorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [pro, setPro] = useState<ProfessionalProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem: addToCart } = useCartStore();

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

  const proArchetype = useMemo(() => getArchetype(pro?.categories), [pro?.categories]);
  const isBaker = proArchetype.archetype === 'home_baker';
  const isCrafts = proArchetype.archetype === 'crafts_gifting';
  const isMusician = proArchetype.archetype === 'musician' || Boolean(pro?.categories?.some(c => c.toLowerCase().includes('music') || c.toLowerCase().includes('band')));
  const isEmcee = proArchetype.archetype === 'emcee' || Boolean(pro?.categories?.some(c => c.toLowerCase().includes('ceremon') || c.toLowerCase().includes('emcee') || c.toLowerCase().includes('host')));
  const isItemDirectTotal = isBaker || isCrafts;
  const proEscrowRules = useMemo(() => getEscrowMilestoneRules(pro?.categories), [pro?.categories]);
  const proEscrowSummary = useMemo(() => getEscrowSummaryText(pro?.categories), [pro?.categories]);

  // Catering & Bakery Menu State
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

  // Home bakers and Crafts/Gifting creators do NOT use per-head / guest count multiplication; total is direct sum of items
  const grandQuotationTotal = useMemo(() => {
    return isItemDirectTotal ? perPlateSubtotal : (perPlateSubtotal * guestCount);
  }, [isItemDirectTotal, perPlateSubtotal, guestCount]);

  const handleUpdateDishQty = (dishId: string, delta: number) => {
    setDishQuantities(prev => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [dishId]: next };
    });
  };

  const handleBookWithQuotation = () => {
    const itemsSummary = selectedDishesList
      .map(d => `${d.name} (${dishQuantities[d.id]}x @ ₹${d.pricePerPlate}${d.unit ? `/${d.unit}` : (isBaker ? '/kg' : '/plate')})`)
      .join(', ');
    const notes = isBaker
      ? `Bakery Order:\nSelected Items: ${itemsSummary}\nTotal Order Value: ₹${grandQuotationTotal.toLocaleString('en-IN')}`
      : `Catering Quotation for ${guestCount} Guests:\nSelected Dishes: ${itemsSummary}\nPer Plate: ₹${perPlateSubtotal.toLocaleString('en-IN')}\nEstimated Total: ₹${grandQuotationTotal.toLocaleString('en-IN')}`;
    const jobTitle = isBaker
      ? `Bakery Order - ${totalDishesSelectedCount} Items`
      : `Catering Package - ${guestCount} Guests`;
    navigate(`/book/${pro?.id}?total=${grandQuotationTotal}&jobTitle=${encodeURIComponent(jobTitle)}&notes=${encodeURIComponent(notes)}`);
  };

  const displayProducts = useMemo(() => {
    if (products.length > 0) return products;
    if (isCrafts && pro?.menuItems && pro.menuItems.length > 0) {
      return pro.menuItems.filter(m => m.isAvailable).map(m => ({
        id: m.id,
        name: m.name,
        brand: 'Handcrafted',
        category: m.category || 'Crafts & Gifting',
        type: 'sale' as const,
        price: m.pricePerPlate,
        condition: 'New' as const,
        image: m.imageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800',
        gallery: m.imageUrl ? [m.imageUrl] : [],
        description: m.description || '',
        inStock: true,
        rating: 4.9,
        codEnabled: true,
      }));
    }
    return [];
  }, [products, isCrafts, pro?.menuItems]);

  useEffect(() => {
    if (id) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      professionalApi.getProfileById(id)
        .then((profile) => {
          setPro(profile);
          setReviews(profile.reviews || []);
          return productApi.getProductsByOwner(profile.userId || profile.id);
        })
        .then((prods) => {
          if (prods) setProducts(prods);
        })
        .catch((err) => setError(err.message || 'Failed to load profile'))
        .finally(() => {
          setLoading(false);
          requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          });
        });
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

      <div className="container profile-content-container">
        {/* Top Navigation & Action Strip */}
        <div className="profile-top-nav-bar">
          <button onClick={() => navigate(-1)} className="profile-top-back-btn" type="button">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <button 
            type="button" 
            onClick={() => setShareModalOpen(true)}
            className="profile-top-share-btn"
            title="Share profile card on WhatsApp & Instagram"
          >
            <Share2 size={15} />
            <span>Share Profile</span>
          </button>
        </div>

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
                    {pro.musicTypes && pro.musicTypes.length > 0 && (
                      <span className="meta-pill" title="Music Types / Instruments">
                        <Music size={15} color="var(--accent)" />
                        <strong>{pro.musicTypes.slice(0, 3).join(', ')}{pro.musicTypes.length > 3 ? ` +${pro.musicTypes.length - 3}` : ''}</strong>
                      </span>
                    )}
                    {pro.languages && pro.languages.length > 0 && (
                      <span className="meta-pill" title="Languages Spoken & Hosted">
                        <Globe size={15} color="var(--accent)" />
                        <strong>{pro.languages.slice(0, 3).join(', ')}{pro.languages.length > 3 ? ` +${pro.languages.length - 3}` : ''}</strong>
                      </span>
                    )}
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

            {/* ── MUSICIAN SPECIALIZATIONS CARD ── */}
            {(isMusician || (pro.musicTypes && pro.musicTypes.length > 0) || (pro.genres && pro.genres.length > 0)) && (
              <div className="card profile-section-card musician-specialties-card">
                <div className="section-header-inline" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Music size={20} color="var(--accent, #3fb668)" />
                  <h3 className="section-heading" style={{ margin: 0 }}>Music Specializations & Performance Roster</h3>
                </div>
                
                {pro.musicTypes && pro.musicTypes.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 }}>
                      Instruments & Music Types
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {pro.musicTypes.map((type) => (
                        <span key={type} className="gear-item-card" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: 'rgba(63, 182, 104, 0.08)', borderColor: 'rgba(63, 182, 104, 0.25)' }}>
                          <Music size={14} color="var(--accent)" />
                          <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{type}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {pro.genres && pro.genres.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 }}>
                      Genres & Performance Repertoire
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {pro.genres.map((genre) => (
                        <span key={genre} className="meta-pill" style={{ fontSize: 12.5, padding: '5px 12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                          🎵 {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MASTER OF CEREMONIES SPECIALIZATIONS CARD ── */}
            {(isEmcee || (pro.languages && pro.languages.length > 0) || (pro.hostingStyles && pro.hostingStyles.length > 0)) && (
              <div className="card profile-section-card emcee-specialties-card">
                <div className="section-header-inline" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Mic size={20} color="var(--accent, #3fb668)" />
                  <h3 className="section-heading" style={{ margin: 0 }}>Languages & Stage Hosting Portfolio</h3>
                </div>

                {pro.languages && pro.languages.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 }}>
                      Languages Spoken & Hosted
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {pro.languages.map((lang) => (
                        <span key={lang} className="gear-item-card" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
                          <Globe size={14} color="#3b82f6" />
                          <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{lang}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {pro.hostingStyles && pro.hostingStyles.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 }}>
                      Hosting Formats & Event Styles
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {pro.hostingStyles.map((style) => (
                        <span key={style} className="meta-pill" style={{ fontSize: 12.5, padding: '5px 12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                          🎤 {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SERVICES & PACKAGES SECTION (PRODUCT CARD DESIGN) ── */}
            {pro.services && pro.services.length > 0 && (
              <div className="card profile-section-card services-section-card">
                <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={20} color="var(--accent, #3fb668)" />
                      Services & Packages
                      <span className="badge-sub" style={{ fontSize: 12, padding: '2px 8px' }}>
                        {pro.services.length} {pro.services.length === 1 ? 'service' : 'services'}
                      </span>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                      Standardized creative offerings and customizable packages with milestone escrow protection.
                    </p>
                  </div>
                </div>

                <div className="pros-grid" style={{ marginTop: 14 }}>
                  {pro.services.map((srv) => (
                    <div 
                      key={srv.id} 
                      className="pro-card product-card-mobile-match cursor-pointer"
                      onClick={() => navigate(`/creators/${pro.id}/services/${srv.id}`)}
                    >
                      {/* Top Cinematic Image Banner */}
                      <div className="pro-card-banner-wrapper">
                        <img
                          src={getServiceImage(srv, pro.bannerImage)}
                          alt={srv.title}
                          className="pro-card-banner-img"
                          loading="lazy"
                        />

                        {/* Floating Badges on Banner */}
                        <div className="product-banner-badges">
                          <span className="product-type-badge badge-sale">
                            {srv.type === 'package' ? 'PACKAGE' : 'SERVICE'}
                          </span>

                          <span className="product-cat-pill">
                            {srv.category || 'Package'}
                          </span>
                        </div>
                      </div>

                      {/* Floating Content Box with curved top overlapping banner */}
                      <div className="pro-card-floating-body">
                        {/* Header Info Row: Brand tag & Star Rating */}
                        <div className="pro-card-header-row product-card-header-row">
                          <div className="product-brand-box">
                            <span className="product-brand-pill">
                              {pro.name}
                            </span>
                          </div>

                          <div className="pro-card-info-col">
                            <div className="pro-card-rating-row">
                              <Star size={13} fill="#3fb668" color="#3fb668" />
                              <span className="pro-card-rating-val">{(pro.rating || 5.0).toFixed(1)}</span>
                              <span className="pro-card-review-count">
                                (Escrow)
                              </span>
                              <span className="pro-card-meta-dot">•</span>
                              <span className="product-stock-pill in-stock">
                                Available
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Product Title */}
                        <h3 className="pro-card-pro-name product-title" title={srv.title}>
                          {srv.title}
                        </h3>

                        {/* Specs / Condition Subtitle */}
                        <p className="pro-card-role-title product-subtitle">
                          {srv.category} Package • 100% Escrow
                        </p>

                        {/* Description snippet */}
                        <p className="product-desc-snippet" title={srv.description}>
                          {srv.description}
                        </p>

                        {/* Price / Rate Line */}
                        <div className="pro-card-rate-line product-price-line">
                          <span className="pro-card-rate-label">
                            Starting from
                          </span>
                          <span className="pro-card-rate-val product-price-val">
                            ₹{srv.rate.toLocaleString('en-IN')}
                          </span>
                          <span className="pro-card-rate-unit">/{srv.unit?.toLowerCase() || 'package'}</span>
                        </div>

                        {/* Action Buttons Row: View + Book */}
                        <div className="pro-card-actions-row product-card-actions-row">
                          <button 
                            type="button"
                            className="pro-card-btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/creators/${pro.id}/services/${srv.id}`);
                            }}
                            title="View Service Details"
                          >
                            <span>View</span>
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const notes = `Service: ${srv.title}\nCategory: ${srv.category}\nRate: ₹${srv.rate.toLocaleString('en-IN')}/${srv.unit}\nDescription: ${srv.description}${srv.deliverables ? `\nDeliverables: ${srv.deliverables}` : ''}`;
                              navigate(`/book/${pro.id}?jobTitle=${encodeURIComponent(srv.title)}&total=${srv.rate}&notes=${encodeURIComponent(notes)}`);
                            }}
                            className="pro-card-btn-book product-btn-add-cart"
                            title="Book Service"
                          >
                            <ShoppingBag size={15} />
                            <span>Book</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRODUCT CARDS (CRAFTS, HAMPERS & GEAR FOR SALE) ── */}
            {displayProducts && displayProducts.length > 0 && (
              <div className="card profile-section-card products-section-card">
                <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isCrafts ? (
                        <Gift size={20} color="var(--accent, #f43f5e)" />
                      ) : (
                        <ShoppingBag size={20} color="var(--accent, #3fb668)" />
                      )}
                      {isCrafts ? 'Handcrafted Products & Hampers' : (isBaker ? 'Artisanal Bakes & Products' : 'Gear & Products for Sale')}
                      <span className="badge-sub" style={{ fontSize: 12, padding: '2px 8px' }}>
                        {displayProducts.length} {displayProducts.length === 1 ? 'item' : 'items'}
                      </span>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {isCrafts
                        ? 'Handcrafted hampers, bespoke gift wrapping, floral bouquets & personalized crafts available for direct order.'
                        : 'Explore equipment, gear, and items listed directly by this creator.'}
                    </p>
                  </div>
                </div>

                <div className="pros-grid" style={{ marginTop: 14 }}>
                  {displayProducts.map(prod => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onAddToCart={(p) => {
                        addToCart(p);
                        setReviewToast(`Added "${p.name}" to your cart! 🛍️`);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── CATERING, BAKERY & CRAFTS MENU WITH INSTANT QUOTATION ── */}
            {(proArchetype.archetype === 'catering' || isItemDirectTotal) && availableDishes.length > 0 && (
              <div className="card profile-section-card catering-menu-section-card">
                <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isCrafts ? (
                        <Gift size={20} color="var(--accent, #ec4899)" />
                      ) : (
                        <UtensilsCrossed size={20} color="var(--accent, #3fb668)" />
                      )}
                      {isCrafts ? 'Crafts, Hampers & Gift Catalog' : (isBaker ? 'Cakes, Bakes & Food Menu' : 'Menu & Dishes')}
                      <span className="badge-sub" style={{ fontSize: 12, padding: '2px 8px' }}>
                        {availableDishes.length} available
                      </span>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {isCrafts
                        ? 'Handcrafted hampers, bespoke gift wrapping, floral art & personalized gifts. Select items below for instant ordering.'
                        : (isBaker
                          ? 'Freshly baked from scratch with flexible low minimum quantities. Select items below for instant pricing.'
                          : 'Select dishes below to calculate an instant quotation for your event guest count.')}
                    </p>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="menu-cat-filter-pills">
                  {menuCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedMenuCategory(cat)}
                      className={`menu-cat-pill ${selectedMenuCategory === cat ? 'active' : ''}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Dish Cards Grid (4 in a row) */}
                <div className="catering-dishes-grid">
                  {filteredDishes.map(dish => {
                    const qty = dishQuantities[dish.id] || 0;
                    const isGreen = dish.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan');
                    const fallbackDishImage = isCrafts
                      ? 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800'
                      : (isBaker 
                        ? 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800'
                        : 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800');

                    return (
                      <div 
                        key={dish.id} 
                        className={`customer-dish-card dish-card-mobile-match ${qty > 0 ? 'selected-dish' : ''}`}
                      >
                        {/* Top Cinematic Image Banner */}
                        <div className="dish-card-banner-wrapper">
                          <img 
                            src={dish.imageUrl || fallbackDishImage} 
                            alt={dish.name} 
                            className="dish-card-banner-img" 
                            loading="lazy"
                          />
                          <div className="dish-card-banner-badges">
                            {/* Veg / Non-Veg FSSAI Badge */}
                            {!isCrafts && (
                              <div className={`swiggy-fssai-box ${isGreen ? 'veg' : 'nonveg'}`} title={isGreen ? 'Vegetarian' : 'Non-Vegetarian'}>
                                {isGreen ? (
                                  <div className="swiggy-fssai-dot veg" />
                                ) : (
                                  <div className="swiggy-fssai-triangle" />
                                )}
                              </div>
                            )}

                            {/* Category Tag floating top-right */}
                            <span className="dish-banner-cat-pill">
                              {dish.category}
                            </span>
                          </div>
                        </div>

                        {/* Floating Content Box with curved top overlapping banner */}
                        <div className="dish-card-floating-body">
                          {/* Dish Title & Price */}
                          <div className="dish-card-header-row">
                            <h4 className="dish-card-title" title={dish.name}>
                              {dish.name}
                            </h4>
                            <div className="dish-card-price-box">
                              <span className="dish-card-price-val">₹{dish.pricePerPlate.toLocaleString('en-IN')}</span>
                              <span className="dish-card-price-unit">{dish.unit ? `/ ${dish.unit}` : (isCrafts ? '/ piece' : (isBaker ? '/ kg' : '/ plate'))}</span>
                            </div>
                          </div>

                          {/* Metadata Pills Row (Min Qty, Prep Time, Dietary Tags) */}
                          <div className="dish-card-pills-row">
                            {dish.minQuantity && (
                              <span className="dish-pill dish-pill-min">
                                Min: {dish.minQuantity}
                              </span>
                            )}
                            {dish.prepTime && (
                              <span className="dish-pill dish-pill-prep" title="Preparation / Lead Time">
                                <Clock size={11} /> Prep: {dish.prepTime}
                              </span>
                            )}
                            {dish.dietaryTags?.map((tag) => {
                              const tagIsVeg = tag === 'Veg' || tag === 'Jain' || tag === 'Vegan';
                              return (
                                <span key={tag} className={`dish-pill ${tagIsVeg ? 'dish-pill-veg' : 'dish-pill-nonveg'}`}>
                                  {tag}
                                </span>
                              );
                            })}
                          </div>

                          {/* Description */}
                          {dish.description && (
                            <p className="dish-card-desc" title={dish.description}>
                              {dish.description}
                            </p>
                          )}

                          {/* Selected Indicator & Action Button Row */}
                          <div className="dish-card-actions-row">
                            {qty > 0 ? (
                              <div className="dish-card-selected-group">
                                <div className="dish-card-qty-indicator" title={`${qty} selected`}>
                                  <span className="dish-card-qty-check">✓</span>
                                  <span>{qty} {isItemDirectTotal ? (dish.unit ? `${dish.unit}s` : 'units') : (qty === 1 ? 'plate' : 'plates')} (₹{(dish.pricePerPlate * qty).toLocaleString('en-IN')})</span>
                                </div>
                                <div className="dish-stepper-btn">
                                  <button 
                                    type="button" 
                                    onClick={() => handleUpdateDishQty(dish.id, -1)}
                                    title="Decrease quantity"
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <span className="dish-stepper-val">{qty}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleUpdateDishQty(dish.id, 1)}
                                    title="Increase quantity"
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="dish-btn-add-action"
                                onClick={() => handleUpdateDishQty(dish.id, 1)}
                                title={isCrafts ? "Add item to gifting order" : (isBaker ? "Add item to order" : "Add dish to quotation")}
                              >
                                <span>ADD</span>
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modernized Quotation Calculator Box */}
                <div className="catering-quotation-summary-box">
                  {!isItemDirectTotal ? (
                    <div className="quote-calculator-header-block">
                      <div className="quote-calc-title-group">
                        <div className="quote-calc-icon-box">
                          <Users size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h4 className="quote-calc-title">Event Guest Calculator</h4>
                            <span className="quote-calc-live-badge">Live Per-Head Pricing</span>
                          </div>
                          <p className="quote-calc-sub">Select your guest count below to automatically compute per-plate and total event costs.</p>
                        </div>
                      </div>

                      {/* Stepper & Preset Chips Container */}
                      <div className="quote-calc-stepper-container">
                        <div className="guest-presets-row">
                          {[25, 50, 100, 250, 500].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className={`guest-preset-chip ${guestCount === preset ? 'active' : ''}`}
                              onClick={() => setGuestCount(preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        <div className="guest-stepper-control">
                          <button
                            type="button"
                            className="guest-stepper-btn"
                            onClick={() => setGuestCount(g => Math.max(10, g - 10))}
                            title="Decrease 10 guests"
                          >
                            <Minus size={14} />
                          </button>
                          <div className="guest-count-display">
                            <span className="guest-count-val">{guestCount}</span>
                            <span className="guest-count-label">Guests</span>
                          </div>
                          <button
                            type="button"
                            className="guest-stepper-btn"
                            onClick={() => setGuestCount(g => g + 10)}
                            title="Increase 10 guests"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="quote-calculator-header-block">
                      <div className="quote-calc-title-group">
                        <div className={`quote-calc-icon-box ${isCrafts ? 'crafts' : 'baker'}`}>
                          {isCrafts ? <Gift size={20} /> : <UtensilsCrossed size={20} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h4 className="quote-calc-title">
                              {isCrafts ? 'Handcrafted Gifting Order' : 'Bakery Order Summary'}
                            </h4>
                            <span className={`quote-calc-live-badge ${isCrafts ? 'crafts' : 'baker'}`}>Item-Based Pricing</span>
                          </div>
                          <p className="quote-calc-sub">
                            {isCrafts
                              ? 'Handcrafted hampers, gift wraps & floral sets are calculated directly from selected quantities.'
                              : 'Custom baked orders are calculated directly from selected cake & pastry quantities.'}
                          </p>
                        </div>
                      </div>

                      <div className="baker-order-pill-badge">
                        <span className="baker-pill-dot" />
                        <span>{totalDishesSelectedCount} {totalDishesSelectedCount === 1 ? 'item' : 'items'} in order</span>
                      </div>
                    </div>
                  )}

                  {selectedDishesList.length > 0 ? (
                    <div className="quote-active-summary-body">
                      {/* Breakdown table */}
                      <div className="quote-breakdown-card">
                        <div className="quote-breakdown-head">
                          <span>
                            {isCrafts
                              ? 'Selected Hampers & Crafts'
                              : (isBaker ? 'Selected Bakes & Confectionery' : 'Selected Dish')} ({totalDishesSelectedCount})
                          </span>
                          <span>{isItemDirectTotal ? 'Item Subtotal' : `Rate × ${guestCount} Guests`}</span>
                        </div>
                        <div className="quote-breakdown-items-list">
                          {selectedDishesList.map(dish => {
                            const q = dishQuantities[dish.id] || 0;
                            const lineTotal = isItemDirectTotal ? (dish.pricePerPlate * q) : (dish.pricePerPlate * q * guestCount);
                            return (
                              <div key={dish.id} className="quote-breakdown-item-row">
                                <div className="quote-item-info">
                                  <span className="quote-item-name">{dish.name}</span>
                                  <span className="quote-item-details">
                                    {q}x @ ₹{dish.pricePerPlate}{dish.unit ? `/${dish.unit}` : (isCrafts ? '/pc' : (isBaker ? '/kg' : '/plate'))}
                                    {dish.prepTime ? ` • ⏱️ ${dish.prepTime}` : ''}
                                  </span>
                                </div>
                                <span className="quote-item-total">
                                  ₹{lineTotal.toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Total & Action Row */}
                      <div className="quote-total-action-bar">
                        <div className="quote-total-info">
                          {!isItemDirectTotal ? (
                            <span className="quote-per-guest-subtext">
                              Per Guest: <strong>₹{perPlateSubtotal.toLocaleString('en-IN')}</strong> × {guestCount} guests
                            </span>
                          ) : (
                            <span className="quote-per-guest-subtext">
                              Total of {totalDishesSelectedCount} handcrafted {totalDishesSelectedCount === 1 ? 'item' : 'items'} • Custom curated to order
                            </span>
                          )}
                          <div className="quote-grand-total-row">
                            <span className="quote-grand-total-val">₹{grandQuotationTotal.toLocaleString('en-IN')}</span>
                            <span className="quote-grand-total-tag">
                              {isItemDirectTotal ? 'Order Total' : 'Estimated Quotation'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="quote-proceed-btn"
                          onClick={handleBookWithQuotation}
                        >
                          <span>{isCrafts ? 'Proceed to Order Gifting' : (isBaker ? 'Proceed to Order Bakes' : 'Proceed to Book with Menu')}</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="quote-empty-state-card">
                      <div className="quote-empty-icon-wrap">
                        <Sparkles size={22} />
                      </div>
                      <div className="quote-empty-text-wrap">
                        <h5 className="quote-empty-title">
                          No {isItemDirectTotal ? 'items' : 'dishes'} added to quotation yet
                        </h5>
                        <p className="quote-empty-desc">
                          Click the <strong>+ ADD</strong> button on any {isCrafts ? 'craft or hamper' : (isBaker ? 'cake or bake' : 'dish')} above. Your live breakdown and total will calculate here in real-time.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Escrow Protection Milestone Bar */}
                  <div className="quote-escrow-milestone-footer">
                    <div className="quote-escrow-label">
                      <ShieldCheck size={16} />
                      <span>Camqrew Escrow Protection:</span>
                    </div>
                    <div className="quote-escrow-chips">
                      {proEscrowRules.map((rule, idx) => (
                        <React.Fragment key={rule.id}>
                          {idx > 0 && <span className="escrow-step-arrow">→</span>}
                          <span className="escrow-step-chip">{rule.title}</span>
                        </React.Fragment>
                      ))}
                    </div>
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
                        Upload video showreels and 9:16 vertical reels (MP4, MOV, WebM) to boost client booking conversions.
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
                  <p>{proEscrowSummary}</p>
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
