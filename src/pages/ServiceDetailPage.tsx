import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { professionalApi } from '../api/professionalApi';
import type { ProfessionalProfile, ServiceItem } from '../types/professional';
import { getServiceImage } from '../utils/serviceUtils';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Calendar, 
  Share2, 
  Camera, 
  Check, 
  MessageSquare, 
  ArrowRight, 
  Layers, 
  Briefcase,
  MapPin,
  ChevronRight,
  Info,
  Eye,
  ShoppingBag
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

export const ServiceDetailPage: React.FC = () => {
  const params = useParams<{ id?: string; creatorId?: string; serviceId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Route resolvers: supports /creators/:id/services/:serviceId, /services/:creatorId/:serviceId, /services/:id
  const resolvedCreatorId = params.creatorId || (params.serviceId ? params.id : (searchParams.get('creatorId') || ''));
  const resolvedServiceId = params.serviceId || params.id || '';

  const [creator, setCreator] = useState<ProfessionalProfile | null>(null);
  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setLoading(true);
    setError(null);

    const loadServiceData = async () => {
      try {
        let pro: ProfessionalProfile | null = null;

        if (resolvedCreatorId) {
          pro = await professionalApi.getProfileById(resolvedCreatorId);
        } else {
          // If no creator ID given directly in route, scan professionals
          const allPros = await professionalApi.getProfessionals();
          pro = allPros.find(p => p.services && p.services.some(s => s.id === resolvedServiceId)) || allPros[0] || null;
        }

        if (!pro) {
          throw new Error('Creator profile not found.');
        }

        setCreator(pro);

        // Find the matching service item
        const srv = (pro.services || []).find(
          s => s.id === resolvedServiceId || s.title.toLowerCase() === decodeURIComponent(resolvedServiceId).toLowerCase()
        ) || (pro.services && pro.services.length > 0 ? pro.services[0] : null);

        if (!srv) {
          throw new Error('Service details not found for this creator.');
        }

        setService(srv);
      } catch (err: any) {
        console.error('Failed to load service detail:', err);
        setError(err.message || 'Unable to load service details.');
      } finally {
        setLoading(false);
      }
    };

    loadServiceData();
  }, [resolvedCreatorId, resolvedServiceId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const handleProceedToBooking = () => {
    if (!creator || !service) return;
    const notes = `Service: ${service.title}\nCategory: ${service.category}\nRate: ₹${service.rate.toLocaleString('en-IN')}/${service.unit}\nDescription: ${service.description}${service.deliverables ? `\nDeliverables: ${service.deliverables}` : ''}`;
    navigate(`/book/${creator.id}?jobTitle=${encodeURIComponent(service.title)}&total=${service.rate}&notes=${encodeURIComponent(notes)}`);
  };

  const handleOpenChat = () => {
    if (!creator) return;
    navigate(`/chat?otherUserId=${creator.userId || creator.id}&name=${encodeURIComponent(creator.name)}`);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', minHeight: '60vh' }}>
        <div className="skeleton-card" style={{ height: 420, borderRadius: 24 }} />
      </div>
    );
  }

  if (error || !creator || !service) {
    return (
      <div className="container text-center" style={{ padding: '80px 20px', minHeight: '60vh' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Service Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error || 'This service or package is currently unavailable.'}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {creator && (
            <Link to={`/creators/${creator.id}`} className="btn btn-outline">
              ← Back to {creator.name}&apos;s Profile
            </Link>
          )}
          <Link to="/explore" className="btn btn-primary">
            Explore Creative Services
          </Link>
        </div>
      </div>
    );
  }

  const serviceBanner = getServiceImage(service, creator.bannerImage);

  // Split deliverables into distinct items if formatted with commas or bullet points
  const deliverableItems = service.deliverables 
    ? service.deliverables.split(/[,;\n•]+/).map(d => d.trim()).filter(Boolean)
    : [];

  const otherServices = (creator.services || []).filter(s => s.id !== service.id);

  return (
    <div className="service-detail-page">
      <SEOHead 
        title={`${service.title} by ${creator.name} - Camqrew`}
        description={`${service.title} (${service.category}) by verified professional ${creator.name}. Starting at ₹${service.rate.toLocaleString('en-IN')}/${service.unit}. Milestone escrow protected.`}
        image={serviceBanner}
      />

      {copiedToast && (
        <div className="global-floating-toast">
          <CheckCircle2 size={18} className="toast-icon" />
          <span>Service link copied to clipboard!</span>
        </div>
      )}

      <div className="container service-detail-container">
        {/* Top Breadcrumb & Action Strip */}
        <div className="service-detail-nav-strip">
          <div className="service-breadcrumbs">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <ChevronRight size={14} className="breadcrumb-arrow" />
            <Link to="/explore" className="breadcrumb-link">Creators</Link>
            <ChevronRight size={14} className="breadcrumb-arrow" />
            <Link to={`/creators/${creator.id}`} className="breadcrumb-link">{creator.name}</Link>
            <ChevronRight size={14} className="breadcrumb-arrow" />
            <span className="breadcrumb-current">{service.title}</span>
          </div>

          <div className="service-top-actions">
            <button 
              type="button" 
              className="service-back-btn"
              onClick={() => navigate(`/creators/${creator.id}`)}
              title="Return to creator profile"
            >
              <ArrowLeft size={16} />
              <span>Back to {creator.name}</span>
            </button>

            <button 
              type="button" 
              className="service-share-btn"
              onClick={handleShare}
              title="Share service package"
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Responsive Layout */}
        <div className="service-detail-grid">
          {/* LEFT COLUMN: Media, Description, Deliverables, Escrow, Gear, Reviews */}
          <div className="service-detail-main-col">
            {/* Cinematic Hero Banner */}
            <div className="service-hero-banner-wrapper">
              <img 
                src={serviceBanner} 
                alt={service.title} 
                className="service-hero-banner-img"
              />
              <div className="service-hero-badges-overlay">
                <span className="service-hero-cat-badge">{service.category}</span>
                <span className="service-hero-escrow-badge">
                  <ShieldCheck size={14} />
                  <span>100% Escrow Protection</span>
                </span>
              </div>
            </div>

            {/* Title & Metadata Block */}
            <div className="service-title-block card">
              <h1 className="service-main-title">{service.title}</h1>
              <p className="service-main-category-tag">
                <Sparkles size={15} color="var(--accent, #3fb668)" />
                <span>{service.category} Package</span>
                <span className="service-meta-dot">•</span>
                <span>Milestone-Based Escrow</span>
              </p>

              {/* Creator Inline Profile Card */}
              <div className="service-creator-strip">
                <Link to={`/creators/${creator.id}`} className="service-creator-avatar-wrap">
                  <img src={creator.avatar} alt={creator.name} className="service-creator-avatar" />
                  {creator.verified && (
                    <span className="creator-verified-indicator" title="Camqrew Verified">✓</span>
                  )}
                </Link>

                <div className="service-creator-info">
                  <div className="service-creator-name-row">
                    <Link to={`/creators/${creator.id}`} className="service-creator-name">
                      {creator.name}
                    </Link>
                    {creator.verified && (
                      <span className="verified-badge-pill">Verified Pro</span>
                    )}
                  </div>
                  <p className="service-creator-role">{creator.title}</p>
                  
                  <div className="service-creator-meta-line">
                    <div className="creator-star-rating">
                      <Star size={13} fill="#3fb668" color="#3fb668" />
                      <span className="creator-rating-num">{creator.rating?.toFixed(1) || '5.0'}</span>
                      <span className="creator-review-count">({creator.reviewCount || 0} reviews)</span>
                    </div>
                    <span className="service-meta-dot">•</span>
                    <div className="creator-location-tag">
                      <MapPin size={12} />
                      <span>{creator.city || creator.district}, {creator.state}</span>
                    </div>
                  </div>
                </div>

                <Link to={`/creators/${creator.id}`} className="service-view-profile-btn">
                  <span>View Profile</span>
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>

            {/* About / Description Section */}
            <div className="card service-section-card">
              <h2 className="service-section-title">
                <Info size={18} color="var(--accent, #3fb668)" />
                <span>Service Overview</span>
              </h2>
              <div className="service-description-content">
                <p>{service.description}</p>
              </div>
            </div>

            {/* Deliverables & Scope Checklist */}
            <div className="card service-section-card">
              <h2 className="service-section-title">
                <CheckCircle2 size={18} color="var(--accent, #3fb668)" />
                <span>Deliverables & What&apos;s Included</span>
              </h2>

              {deliverableItems.length > 0 ? (
                <div className="service-deliverables-grid">
                  {deliverableItems.map((item, idx) => (
                    <div key={idx} className="service-deliverable-item">
                      <div className="deliverable-check-circle">
                        <Check size={14} />
                      </div>
                      <span className="deliverable-text">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="service-deliverables-grid">
                  <div className="service-deliverable-item">
                    <div className="deliverable-check-circle"><Check size={14} /></div>
                    <span className="deliverable-text">Complete primary project production and capture</span>
                  </div>
                  <div className="service-deliverable-item">
                    <div className="deliverable-check-circle"><Check size={14} /></div>
                    <span className="deliverable-text">Color grading & professional master exports</span>
                  </div>
                  <div className="service-deliverable-item">
                    <div className="deliverable-check-circle"><Check size={14} /></div>
                    <span className="deliverable-text">Full commercial rights & digital asset handover</span>
                  </div>
                </div>
              )}
            </div>

            {/* Production Capabilities & Gear (from Creator) */}
            {creator.equipment && creator.equipment.length > 0 && (
              <div className="card service-section-card">
                <h2 className="service-section-title">
                  <Camera size={18} color="var(--accent, #3fb668)" />
                  <span>Production Equipment & Capabilities</span>
                </h2>
                <div className="service-gear-grid">
                  {creator.equipment.map((item, idx) => (
                    <div key={idx} className="service-gear-chip">
                      <Briefcase size={14} color="var(--accent, #3fb668)" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestone Escrow Assurance Section */}
            <div className="card service-section-card service-escrow-card">
              <div className="escrow-card-header">
                <div className="escrow-icon-bubble">
                  <ShieldCheck size={24} color="#3fb668" />
                </div>
                <div>
                  <h2 className="service-section-title" style={{ margin: 0 }}>
                    Camqrew 100% Escrow Protection Guarantee
                  </h2>
                  <p className="escrow-card-subtitle">
                    Your payment stays safely locked in Camqrew Escrow and is released in milestones as the work is delivered.
                  </p>
                </div>
              </div>

              <div className="escrow-milestone-steps-grid">
                <div className="escrow-step-item">
                  <div className="escrow-step-num">1</div>
                  <div className="escrow-step-info">
                    <h4>30% Advance Escrow</h4>
                    <p>Secured in escrow prior to shoot. Creator commences pre-production and reserves the dates.</p>
                  </div>
                </div>

                <div className="escrow-step-item">
                  <div className="escrow-step-num">2</div>
                  <div className="escrow-step-info">
                    <h4>40% Shoot Wrap Escrow</h4>
                    <p>Released upon physical production wrap or first major project draft delivery.</p>
                  </div>
                </div>

                <div className="escrow-step-item">
                  <div className="escrow-step-num">3</div>
                  <div className="escrow-step-info">
                    <h4>30% Final Delivery Escrow</h4>
                    <p>Released only when you approve the final master deliverables. Zero risk.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            {creator.reviews && creator.reviews.length > 0 && (
              <div className="card service-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 className="service-section-title" style={{ margin: 0 }}>
                    <Star size={18} fill="#3fb668" color="#3fb668" />
                    <span>Client Reviews ({creator.reviews.length})</span>
                  </h2>
                  <div className="service-rating-pill">
                    <Star size={13} fill="#3fb668" color="#3fb668" />
                    <span>{creator.rating?.toFixed(1) || '5.0'} / 5.0</span>
                  </div>
                </div>

                <div className="service-reviews-list">
                  {creator.reviews.slice(0, 3).map((rev) => (
                    <div key={rev.id} className="service-review-item">
                      <div className="service-review-header">
                        <div className="review-author-info">
                          <span className="review-author-name">{rev.clientName}</span>
                          <span className="review-date">{rev.date}</span>
                        </div>
                        <div className="review-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < rev.rating ? "#3fb668" : "none"} 
                              color={i < rev.rating ? "#3fb668" : "rgba(255,255,255,0.2)"} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="service-review-text">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Services by Creator */}
            {otherServices.length > 0 && (
              <div className="service-other-packages-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 className="section-heading" style={{ margin: 0 }}>
                    Other Packages by {creator.name}
                  </h3>
                  <Link to={`/creators/${creator.id}`} className="btn-link" style={{ fontSize: 13, color: 'var(--accent, #3fb668)' }}>
                    View All →
                  </Link>
                </div>

                <div className="pros-grid" style={{ marginTop: 14 }}>
                  {otherServices.slice(0, 2).map((other) => (
                    <div 
                      key={other.id} 
                      className="pro-card product-card-mobile-match cursor-pointer"
                      onClick={() => navigate(`/creators/${creator.id}/services/${other.id}`)}
                    >
                      <div className="pro-card-banner-wrapper">
                        <img 
                          src={getServiceImage(other, creator.bannerImage)} 
                          alt={other.title} 
                          className="pro-card-banner-img" 
                          loading="lazy"
                        />
                        <div className="product-banner-badges">
                          <span className="product-type-badge badge-sale">
                            {other.type === 'package' ? 'PACKAGE' : 'SERVICE'}
                          </span>
                          <span className="product-cat-pill">{other.category || 'Package'}</span>
                        </div>
                      </div>

                      <div className="pro-card-floating-body">
                        <div className="pro-card-header-row product-card-header-row">
                          <div className="product-brand-box">
                            <span className="product-brand-pill">{creator.name}</span>
                          </div>
                          <div className="pro-card-info-col">
                            <div className="pro-card-rating-row">
                              <Star size={13} fill="#3fb668" color="#3fb668" />
                              <span className="pro-card-rating-val">{(creator.rating || 5.0).toFixed(1)}</span>
                              <span className="pro-card-review-count">(Escrow)</span>
                              <span className="pro-card-meta-dot">•</span>
                              <span className="product-stock-pill in-stock">Available</span>
                            </div>
                          </div>
                        </div>

                        <h4 className="pro-card-pro-name product-title" title={other.title}>
                          {other.title}
                        </h4>

                        <p className="pro-card-role-title product-subtitle">
                          {other.category} Package • 100% Escrow
                        </p>

                        <p className="product-desc-snippet" title={other.description}>
                          {other.description}
                        </p>

                        <div className="pro-card-rate-line product-price-line">
                          <span className="pro-card-rate-label">Starting from</span>
                          <span className="pro-card-rate-val product-price-val">
                            ₹{other.rate.toLocaleString('en-IN')}
                          </span>
                          <span className="pro-card-rate-unit">/{other.unit?.toLowerCase() || 'package'}</span>
                        </div>

                        <div className="pro-card-actions-row product-card-actions-row">
                          <button 
                            type="button"
                            className="pro-card-btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/creators/${creator.id}/services/${other.id}`);
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
                              const notes = `Service: ${other.title}\nCategory: ${other.category}\nRate: ₹${other.rate.toLocaleString('en-IN')}/${other.unit}\nDescription: ${other.description}${other.deliverables ? `\nDeliverables: ${other.deliverables}` : ''}`;
                              navigate(`/book/${creator.id}?jobTitle=${encodeURIComponent(other.title)}&total=${other.rate}&notes=${encodeURIComponent(notes)}`);
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
          </div>

          {/* RIGHT COLUMN: Sticky Booking & Inquiry Sidebar */}
          <div className="service-detail-sidebar-col">
            <div className="service-sticky-booking-card card">
              {/* Price Header */}
              <div className="service-pricing-header">
                <span className="service-price-sub">Starting from</span>
                <div className="service-pricing-row">
                  <span className="service-price-amount">₹{service.rate.toLocaleString('en-IN')}</span>
                  <span className="service-price-unit">/{service.unit?.toLowerCase() || 'package'}</span>
                </div>
                <div className="service-escrow-guarantee-pill">
                  <ShieldCheck size={13} />
                  <span>100% Milestone Escrow Protected</span>
                </div>
              </div>

              {/* Highlights Summary */}
              <div className="service-sidebar-highlights">
                <div className="sidebar-highlight-item">
                  <Calendar size={16} color="var(--accent, #3fb668)" />
                  <div>
                    <strong>Flexible Scheduling</strong>
                    <span>Book dates directly with {creator.name}</span>
                  </div>
                </div>

                <div className="sidebar-highlight-item">
                  <Clock size={16} color="var(--accent, #3fb668)" />
                  <div>
                    <strong>Fast Turnaround</strong>
                    <span>Milestone tracking inside your dashboard</span>
                  </div>
                </div>

                <div className="sidebar-highlight-item">
                  <Layers size={16} color="var(--accent, #3fb668)" />
                  <div>
                    <strong>Full Deliverables Handover</strong>
                    <span>Digital masters & raw assets included</span>
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="service-sidebar-cta-group">
                <button
                  type="button"
                  className="btn btn-primary service-cta-book-btn"
                  onClick={handleProceedToBooking}
                >
                  <span>Book This Service Now</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="btn btn-outline service-cta-chat-btn"
                  onClick={handleOpenChat}
                >
                  <MessageSquare size={16} />
                  <span>Chat with {creator.name}</span>
                </button>
              </div>

              {/* Security & Assurance List */}
              <div className="service-sidebar-assurances">
                <div className="assurance-bullet">
                  <CheckCircle2 size={14} color="var(--accent, #3fb668)" />
                  <span>Money stays in escrow until project milestones are approved</span>
                </div>
                <div className="assurance-bullet">
                  <CheckCircle2 size={14} color="var(--accent, #3fb668)" />
                  <span>Direct phone & chat communication with creator</span>
                </div>
                <div className="assurance-bullet">
                  <CheckCircle2 size={14} color="var(--accent, #3fb668)" />
                  <span>Official GST invoice & Camqrew dispute mediation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
