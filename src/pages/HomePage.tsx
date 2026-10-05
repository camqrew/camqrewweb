import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { professionalApi } from '../api/professionalApi';
import type { ProfessionalProfile } from '../types/professional';
import { ProCard } from '../components/ProCard';
import { CustomSelect } from '../components/CustomSelect';
import { SEOHead } from '../components/SEOHead';
import { INDIA_LOCATIONS } from '../constants/locations';
import { 
  Search, 
  ShieldCheck, 
  Radio, 
  ArrowRight, 
  Camera, 
  Film, 
  Plane, 
  Scissors, 
  Building2, 
  ShoppingBag,
  CheckCircle,
  MapPin,
  ChevronDown,
  X,
  Heart,
  Palette,
  Utensils,
  Calendar,
  User,
  Cake,
  Car,
  Gift,
  Music,
  Mic,
  Lock,
  Scale,
  CheckCircle2
} from 'lucide-react';

const POPULAR_HUBS = [
  { label: 'All India', state: '', district: '', city: '' },
  { label: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', city: 'Mumbai' },
  { label: 'Delhi NCR', state: 'Delhi (NCR)', district: 'New Delhi', city: 'Connaught Place' },
  { label: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bangalore' },
  { label: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad' },
  { label: 'Goa', state: 'Goa', district: 'North Goa', city: 'Panaji' },
  { label: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai' },
  { label: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', city: 'Jaipur' },
];

export const HomePage: React.FC = () => {
  const [featuredPros, setFeaturedPros] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ state: string; district: string; city: string }>({
    state: '',
    district: '',
    city: ''
  });
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationPopoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    professionalApi.getProfessionals()
      .then((pros) => setFeaturedPros(pros.slice(0, 6)))
      .catch((err) => console.warn('Could not load featured pros', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationPopoverRef.current &&
        !locationPopoverRef.current.contains(event.target as Node)
      ) {
        setIsLocationOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLocationOpen(false);
      }
    };
    if (isLocationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLocationOpen]);

  const availableStates = Object.keys(INDIA_LOCATIONS);
  const availableDistricts = selectedLocation.state && INDIA_LOCATIONS[selectedLocation.state]
    ? Object.keys(INDIA_LOCATIONS[selectedLocation.state])
    : [];
  const availableCities = selectedLocation.state && selectedLocation.district && INDIA_LOCATIONS[selectedLocation.state]?.[selectedLocation.district]
    ? INDIA_LOCATIONS[selectedLocation.state][selectedLocation.district]
    : [];

  const handleStateChange = (st: string) => {
    setSelectedLocation({ state: st, district: '', city: '' });
  };

  const handleDistrictChange = (dst: string) => {
    setSelectedLocation((prev) => ({ ...prev, district: dst, city: '' }));
  };

  const handleCityChange = (ct: string) => {
    setSelectedLocation((prev) => ({ ...prev, city: ct }));
  };

  const handleClearLocation = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLocation({ state: '', district: '', city: '' });
  };

  const handleSelectHub = (hub: typeof POPULAR_HUBS[number]) => {
    setSelectedLocation({
      state: hub.state,
      district: hub.district || '',
      city: hub.city || '',
    });
    setIsLocationOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedLocation.state) params.set('state', selectedLocation.state);
    if (selectedLocation.district) params.set('district', selectedLocation.district);
    if (selectedLocation.city) params.set('city', selectedLocation.city);
    navigate(`/explore?${params.toString()}`);
  };

  const locationDisplayText = selectedLocation.city
    ? `${selectedLocation.city}, ${selectedLocation.state}`
    : selectedLocation.district
    ? `${selectedLocation.district}, ${selectedLocation.state}`
    : selectedLocation.state
    ? selectedLocation.state
    : 'All India';

  const hasLocationSelection = Boolean(
    selectedLocation.state || selectedLocation.district || selectedLocation.city
  );

  const categories = [
    { name: 'Photographers', icon: Camera, color: '#3fb668' },
    { name: 'Videographers', icon: Film, color: '#6366f1' },
    { name: 'Musicians', icon: Music, color: '#f43f5e' },
    { name: 'Master of Ceremonies', icon: Mic, color: '#3fb668' },
    { name: 'Models', icon: User, color: '#ec4899' },
    { name: 'Home Bakers', icon: Cake, color: '#f59e0b' },
    { name: 'Drone Pilots', icon: Plane, color: '#f59e0b' },
    { name: 'Caterers', icon: Utensils, color: '#f97316' },
    { name: 'Organisers', icon: Calendar, color: '#e11d48' },
    { name: 'Crafts & Gifting', icon: Gift, color: '#f43f5e' },
    { name: 'Travels', icon: Car, color: '#06b6d4' },
    { name: 'Makeup Artists', icon: Heart, color: '#ff416c' },
    { name: 'Mehendi Artists', icon: Palette, color: '#10b981' },
    { name: 'Editors', icon: Scissors, color: '#ec4899' },
    { name: 'Studios', icon: Building2, color: '#10b981' },
    { name: 'Gear Rental', icon: ShoppingBag, color: '#8b5cf6', link: '/marketplace' },
  ];

  return (
    <div className="home-page">
      <SEOHead 
        title="Camqrew - Creative Marketplace & Production Crews"
        description="Hire verified photographers, cinematographers, drone pilots, and rent cinema gear anywhere in India with milestone escrow protection."
        url="https://camqrew.in/"
        type="website"
      />
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <span>India's Verified Creative Crew Marketplace</span>
          </div>

          <h1 className="hero-title">
            Hire Top Creators & Rent Gear <br />
            <span className="hero-gradient-text">Anywhere in India</span>
          </h1>

          <p className="hero-subtitle">
            Book certified photographers, cinematographers, and drone operators with automated milestone escrow protection.
          </p>

          <form className="hero-search-box" onSubmit={handleSearchSubmit}>
            {/* Segment 1: Specialty / Role */}
            <div className="hero-search-segment search-query-segment">
              <div className="segment-icon-wrap">
                <Search size={18} className="segment-icon" />
              </div>
              <div className="segment-field-wrap">
                <label htmlFor="hero-specialty-input" className="segment-micro-label">Specialty / Role</label>
                <input
                  id="hero-specialty-input"
                  type="text"
                  className="hero-search-input"
                  placeholder="Wedding, Drone, Fashion..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  className="segment-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search query"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="hero-search-divider" aria-hidden="true" />

            {/* Segment 2: Shoot Location */}
            <div className="hero-search-segment location-segment" ref={locationPopoverRef}>
              <div
                className={`hero-location-trigger ${isLocationOpen ? 'is-active' : ''}`}
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsLocationOpen(!isLocationOpen);
                  }
                }}
                aria-expanded={isLocationOpen}
                aria-haspopup="dialog"
              >
                <div className="segment-icon-wrap location-icon-wrap">
                  <MapPin size={18} className="segment-icon location-pin-icon" />
                </div>
                <div className="segment-field-wrap">
                  <span className="segment-micro-label">Shoot Location</span>
                  <span className="location-display-text" title={locationDisplayText}>
                    {locationDisplayText}
                  </span>
                </div>
                {hasLocationSelection ? (
                  <button
                    type="button"
                    className="segment-clear-btn"
                    onClick={handleClearLocation}
                    title="Reset to All India"
                    aria-label="Reset location"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <ChevronDown size={16} className={`trigger-chevron ${isLocationOpen ? 'open' : ''}`} />
                )}
              </div>

              {/* Floating Location Popover Card */}
              {isLocationOpen && (
                <div className="hero-location-popover-card" role="dialog" aria-label="Select Shoot Location">
                  <div className="popover-header">
                    <div className="popover-title-wrap">
                      <span className="popover-title">Select Shoot Location</span>
                      <span className="popover-subtitle">Filter verified creators near your production</span>
                    </div>
                    {hasLocationSelection && (
                      <button
                        type="button"
                        className="popover-reset-btn"
                        onClick={handleClearLocation}
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  {/* Popular Creative Hubs */}
                  <div className="popover-section">
                    <span className="popover-section-label">Popular Creative Hubs</span>
                    <div className="popover-hubs-grid">
                      {POPULAR_HUBS.map((hub) => {
                        const isActive =
                          (!hub.state && !selectedLocation.state) ||
                          (hub.state === selectedLocation.state &&
                            (!hub.city || hub.city === selectedLocation.city));
                        return (
                          <button
                            type="button"
                            key={hub.label}
                            className={`hub-pill-btn ${isActive ? 'active' : ''}`}
                            onClick={() => handleSelectHub(hub)}
                          >
                            {hub.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cascading State, District, City Selector */}
                  <div className="popover-section">
                    <span className="popover-section-label">Or Browse Region</span>
                    <div className="popover-cascading-grid">
                      {/* State Select */}
                      <div className="popover-select-group">
                        <label className="select-micro-label">State</label>
                        <CustomSelect
                          value={selectedLocation.state}
                          onChange={(val) => handleStateChange(val)}
                          options={availableStates}
                          placeholder="All States (India)"
                          allOptionLabel="All States (India)"
                        />
                      </div>

                      {/* District Select */}
                      <div className="popover-select-group">
                        <label className="select-micro-label">District</label>
                        <CustomSelect
                          value={selectedLocation.district}
                          onChange={(val) => handleDistrictChange(val)}
                          options={availableDistricts}
                          placeholder={selectedLocation.state ? 'All Districts' : 'Select State'}
                          allOptionLabel={selectedLocation.state ? 'All Districts' : undefined}
                          disabled={!selectedLocation.state}
                        />
                      </div>

                      {/* City Select */}
                      <div className="popover-select-group full-width">
                        <label className="select-micro-label">City / Locality</label>
                        <CustomSelect
                          value={selectedLocation.city}
                          onChange={(val) => handleCityChange(val)}
                          options={availableCities}
                          placeholder={selectedLocation.district ? 'All Cities / Localities' : 'Select District'}
                          allOptionLabel={selectedLocation.district ? 'All Cities / Localities' : undefined}
                          disabled={!selectedLocation.district}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Popover Footer */}
                  <div className="popover-footer">
                    <button
                      type="button"
                      className="popover-apply-btn"
                      onClick={() => setIsLocationOpen(false)}
                    >
                      Apply Location
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Segment 3: Submit Action */}
            <button type="submit" className="hero-search-btn" aria-label="Search Crew">
              <span>Search Crew</span>
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="categories-pills">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const toUrl = cat.link || `/explore?category=${encodeURIComponent(cat.name)}`;
              return (
                <Link key={cat.name} to={toUrl} className="category-pill">
                  <span className="pill-icon-box" style={{ color: cat.color }}>
                    <Icon size={18} />
                  </span>
                  <span className="pill-label">{cat.name}</span>
                </Link>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
            <Link 
              to="/reels" 
              className="btn btn-outline"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 9, 
                padding: '10px 22px', 
                borderRadius: 24, 
                borderColor: 'rgba(63, 182, 104, 0.45)', 
                background: 'rgba(63, 182, 104, 0.1)',
                textDecoration: 'none'
              }}
            >
              <Film size={17} color="var(--accent, #3fb668)" />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>
                ⚡ Watch Creator Showreels & 9:16 Shorts Feed
              </span>
              <ArrowRight size={15} color="var(--accent, #3fb668)" />
            </Link>
          </div>
        </div>
      </section>

      <section className="broadcast-banner-section">
        <div className="container">
          <div className="broadcast-card">
            <div className="broadcast-card-content">
              <div className="broadcast-badge">
                <Radio size={16} className="pulse-icon" />
                <span>Instant Locality Broadcast</span>
              </div>
              <h2 className="broadcast-title">Need a Production Crew Urgently?</h2>
              <p className="broadcast-desc">
                Post your shoot date, budget, and requirements. Nearby verified creators in your district receive instant mobile notifications and accept your lead.
              </p>
              <div className="broadcast-features">
                <span><CheckCircle size={16} color="var(--accent)" /> Smart District Matching</span>
                <span><CheckCircle size={16} color="var(--accent)" /> Direct Chat & Lead Review</span>
                <span><CheckCircle size={16} color="var(--accent)" /> Fixed Budget Guarantee</span>
              </div>
            </div>
            <div className="broadcast-card-action">
              <Link to="/jobs/create" className="btn btn-primary btn-lg">
                Post a Broadcast Job <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Creative Talent</h2>
              <p className="section-subtitle">Verified professionals with top ratings and proven portfolios</p>
            </div>
            <Link to="/explore" className="btn btn-outline">
              View All Creators <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="pros-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card skeleton-card" style={{ height: 280 }} />
              ))}
            </div>
          ) : featuredPros.length === 0 ? (
            <div className="empty-state card text-center" style={{ padding: 40 }}>
              <Camera size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <p>No professionals listed yet. Be the first to register as a creator!</p>
              <Link to="/register?role=professional" className="btn btn-primary" style={{ marginTop: 12 }}>
                Join as Professional
              </Link>
            </div>
          ) : (
            <div className="pros-grid">
              {featuredPros.map((pro) => (
                <ProCard key={pro.id} pro={pro} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TOP PRODUCTION HUBS BY CITY (LOCAL SEO & DISCOVERY) ── */}
      <section className="city-hubs-section" style={{ padding: '60px 0', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: 28 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent, #10b981)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                <MapPin size={15} />
                <span>Pan-India Film & Media Network</span>
              </div>
              <h2 className="section-title">Explore Production Crews by City</h2>
              <p className="section-subtitle">Find local cinematographers, wedding photographers, and rental gear stationed in top creative hubs.</p>
            </div>
            <Link to="/explore" className="btn btn-outline">
              Explore All Districts <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { slug: 'mumbai', name: 'Mumbai', desc: 'Bollywood, Commercial Ad Shoots & Film City', count: '120+ Crews', color: '#3fb668' },
              { slug: 'delhi', name: 'Delhi NCR', desc: 'Royal Weddings, Fashion & Noida Film City', count: '95+ Crews', color: '#6366f1' },
              { slug: 'bengaluru', name: 'Bengaluru', desc: 'Tech Brand Films, Indie Cinema & Aerial Shoots', count: '80+ Crews', color: '#f59e0b' },
              { slug: 'hyderabad', name: 'Hyderabad', desc: 'Tollywood Features, Studio Shoots & Events', count: '70+ Crews', color: '#ec4899' },
              { slug: 'chennai', name: 'Chennai', desc: 'Kollywood Feature Shoots & Classical Weddings', count: '60+ Crews', color: '#06b6d4' },
              { slug: 'goa', name: 'Goa', desc: 'Destination Weddings, Music Festivals & Coastal', count: '45+ Crews', color: '#10b981' },
            ].map((hub) => (
              <Link
                key={hub.slug}
                to={`/crews/${hub.slug}`}
                className="card"
                style={{
                  padding: '24px 20px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
                  transition: 'transform 0.2s, border-color 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{hub.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: hub.color }}>
                      {hub.count}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {hub.desc}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent, #10b981)', fontSize: 13, fontWeight: 700, marginTop: 18 }}>
                  <span>View Verified Crews</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADVANCED TRUST & MILESTONE ESCROW ARCHITECTURE ── */}
      <section className="escrow-explainer-section" style={{ padding: '70px 0', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.03) 0%, transparent 100%)' }}>
        <div className="container">
          <div className="escrow-header text-center" style={{ maxWidth: 760, margin: '0 auto 40px auto' }}>
            <div className="escrow-icon-badge" style={{ display: 'inline-flex', padding: 12, borderRadius: 24, background: 'rgba(16, 185, 129, 0.12)', marginBottom: 16 }}>
              <ShieldCheck size={36} color="var(--accent, #10b981)" />
            </div>
            <h2 className="section-title" style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800 }}>
              Milestone Escrow Protection Guarantee
            </h2>
            <p className="section-subtitle" style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8 }}>
              Zero payment friction. Your money is held in a secure escrow vault and only disbursed as verified deliverables are met and approved.
            </p>
          </div>

          {/* 3-Step Milestone Timeline */}
          <div className="escrow-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 36 }}>
            <div className="escrow-step-card card" style={{ padding: '28px 24px', borderRadius: 16, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent, #10b981)' }}>30%</span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent, #10b981)' }}>
                  MILESTONE 1
                </span>
              </div>
              <h3 className="step-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                Advance Escrow Lock
              </h3>
              <p className="step-desc" style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Client deposits funds into escrow upon booking confirmation. The creator locks their calendar, confirms call sheet, and begins pre-production prep.
              </p>
            </div>

            <div className="escrow-step-card card" style={{ padding: '28px 24px', borderRadius: 16, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#6366f1' }}>40%</span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                  MILESTONE 2
                </span>
              </div>
              <h3 className="step-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                Shoot Wrap & Backup
              </h3>
              <p className="step-desc" style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Released upon completion of physical shoot day, footage offloading verification, and client check-in confirmation on the Camqrew platform.
              </p>
            </div>

            <div className="escrow-step-card card" style={{ padding: '28px 24px', borderRadius: 16, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b' }}>30%</span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  MILESTONE 3
                </span>
              </div>
              <h3 className="step-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                Final Deliverables & Signoff
              </h3>
              <p className="step-desc" style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Released only after you inspect the high-resolution deliverables, master edits, or color-graded photos and approve release.
              </p>
            </div>
          </div>

          {/* Dual Perspective Trust Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* For Clients */}
            <div className="card" style={{ padding: '28px 26px', borderRadius: 16, background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: 'var(--text-primary)' }}>
                <Lock size={20} color="var(--accent, #10b981)" />
                <h4 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Client Protection Guarantee</h4>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} color="var(--accent, #10b981)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong>Zero Ghosting Risk:</strong> Funds are never paid direct in cash upfront before work begins.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} color="var(--accent, #10b981)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong>Inspection Window:</strong> 72-hour review period for client deliverable approval.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} color="var(--accent, #10b981)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong>Neutral Dispute Resolution:</strong> Free Camqrew arbitration if shoot requirements are unfulfilled.</span>
                </li>
              </ul>
            </div>

            {/* For Creators */}
            <div className="card" style={{ padding: '28px 26px', borderRadius: 16, background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: 'var(--text-primary)' }}>
                <Scale size={20} color="#6366f1" />
                <h4 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Creator Security & Guaranteed Payouts</h4>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong>Verified Client Budget:</strong> Shoot funds are confirmed in escrow before you pack your camera gear.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong>Cancellation Fee Protection:</strong> If client cancels within 48h of shoot, advance is retained by creator.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong>Instant Bank Settlement:</strong> Automated payouts straight to your verified UPI or bank account.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
