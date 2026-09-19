import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { professionalApi } from '../api/professionalApi';
import type { ProfessionalProfile } from '../types/professional';
import { ProCard } from '../components/ProCard';
import { CustomSelect } from '../components/CustomSelect';
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
  X
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
    { name: 'Drone Pilots', icon: Plane, color: '#f59e0b' },
    { name: 'Editors', icon: Scissors, color: '#ec4899' },
    { name: 'Studios', icon: Building2, color: '#10b981' },
    { name: 'Gear Rental', icon: ShoppingBag, color: '#8b5cf6', link: '/marketplace' },
  ];

  return (
    <div className="home-page">
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

      <section className="escrow-explainer-section">
        <div className="container">
          <div className="escrow-header text-center">
            <div className="escrow-icon-badge">
              <ShieldCheck size={32} color="var(--accent)" />
            </div>
            <h2 className="section-title">Milestone Escrow Protection</h2>
            <p className="section-subtitle">Zero payment friction. Your money is held in escrow and disbursed as each milestone is met.</p>
          </div>

          <div className="escrow-steps-grid">
            <div className="escrow-step-card card">
              <div className="step-num">30%</div>
              <h3 className="step-title">Advance Escrow</h3>
              <p className="step-desc">Held safely when booking is confirmed. Pro locks calendar and travels to shoot location.</p>
            </div>
            <div className="escrow-step-card card">
              <div className="step-num">40%</div>
              <h3 className="step-title">Shoot Wrap Escrow</h3>
              <p className="step-desc">Released upon completion of physical shoot day and footage backup verification.</p>
            </div>
            <div className="escrow-step-card card">
              <div className="step-num">30%</div>
              <h3 className="step-title">Final Deliverables</h3>
              <p className="step-desc">Released only after you review high-res color graded deliverables and approve.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
