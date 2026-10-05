import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { professionalApi } from '../api/professionalApi';
import type { ProfessionalProfile } from '../types/professional';
import { ProCard } from '../components/ProCard';
import { SEOHead } from '../components/SEOHead';
import { 
  MapPin, 
  Camera, 
  ShieldCheck, 
  ArrowRight, 
  Radio, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';

interface CityMetadata {
  name: string;
  state: string;
  searchCity: string;
  tagline: string;
  hubs: string[];
  description: string;
  popularCategories: string[];
}

const CITIES_DATA: Record<string, CityMetadata> = {
  mumbai: {
    name: 'Mumbai',
    state: 'Maharashtra',
    searchCity: 'Mumbai',
    tagline: 'Bollywood, Commercial Ad Shoots & Luxury Weddings',
    hubs: ['Andheri & Lokhandwala', 'Bandra West', 'Goregaon Film City', 'South Bombay', 'BKC Studio Hubs'],
    description: 'Connect with verified Bollywood cinematographers, commercial directors of photography, wedding filmmakers, and rent Sony FX, ARRI, and RED cinema cameras across Mumbai.',
    popularCategories: ['Cinematographers', 'Photographers', 'Drone Pilots', 'Editors'],
  },
  delhi: {
    name: 'Delhi NCR',
    state: 'Delhi (NCR)',
    searchCity: 'Connaught Place',
    tagline: 'Grand Weddings, High-End Fashion & Corporate Campaigns',
    hubs: ['South Delhi (Hauz Khas, GK)', 'Connaught Place', 'Gurgaon Cyber Hub', 'Noida Film City (Sec 16A)'],
    description: 'Book verified fashion photographers, royal wedding cinematographers, DGCA licensed drone pilots, and equipment rental houses across Delhi, Gurgaon, and Noida.',
    popularCategories: ['Photographers', 'Cinematographers', 'Drone Pilots', 'Organisers'],
  },
  bengaluru: {
    name: 'Bengaluru',
    state: 'Karnataka',
    searchCity: 'Bangalore',
    tagline: 'Tech Brand Films, Indie Cinema & Creative Storytelling',
    hubs: ['Koramangala', 'Indiranagar', 'Whitefield Studios', 'HSR Layout', 'MG Road'],
    description: 'Hire top tech commercial directors, drone pilots for real estate/commercials, indie filmmakers, and rent cinema cameras in Bangalore with milestone escrow.',
    popularCategories: ['Videographers', 'Photographers', 'Drone Pilots', 'Editors'],
  },
  bangalore: {
    name: 'Bengaluru',
    state: 'Karnataka',
    searchCity: 'Bangalore',
    tagline: 'Tech Brand Films, Indie Cinema & Creative Storytelling',
    hubs: ['Koramangala', 'Indiranagar', 'Whitefield Studios', 'HSR Layout', 'MG Road'],
    description: 'Hire top tech commercial directors, drone pilots for real estate/commercials, indie filmmakers, and rent cinema cameras in Bangalore with milestone escrow.',
    popularCategories: ['Videographers', 'Photographers', 'Drone Pilots', 'Editors'],
  },
  hyderabad: {
    name: 'Hyderabad',
    state: 'Telangana',
    searchCity: 'Hyderabad',
    tagline: 'Tollywood Cinema, Grand Weddings & Studio Productions',
    hubs: ['Jubilee Hills', 'Banjara Hills', 'Hitec City', 'Ramoji Film City', 'Madhapur'],
    description: 'Discover verified Tollywood production crews, traditional wedding photographers, drone pilots, and camera rental gear across Hyderabad with escrow protection.',
    popularCategories: ['Cinematographers', 'Photographers', 'Drone Pilots', 'Organisers'],
  },
  chennai: {
    name: 'Chennai',
    state: 'Tamil Nadu',
    searchCity: 'Chennai',
    tagline: 'Kollywood Feature Shoots, Music Videos & Cultural Weddings',
    hubs: ['Kodambakkam Film Hub', 'T. Nagar', 'Adyar & Besant Nagar', 'ECR Coastal Shoots', 'Anna Nagar'],
    description: 'Find verified Kollywood cinematographers, music video directors, classical wedding photographers, and studio crews in Chennai.',
    popularCategories: ['Videographers', 'Photographers', 'Musicians', 'Editors'],
  },
  kolkata: {
    name: 'Kolkata',
    state: 'West Bengal',
    searchCity: 'Kolkata',
    tagline: 'Art-House Cinema, Documentary Shoots & Heritage Weddings',
    hubs: ['Tollygunge Studio Para', 'Salt Lake Sector V', 'Park Street', 'New Town', 'South Kolkata'],
    description: 'Hire verified art-house cinematographers, documentary filmmakers, wedding photographers, and video editors across Kolkata.',
    popularCategories: ['Photographers', 'Videographers', 'Editors', 'Musicians'],
  },
  goa: {
    name: 'Goa',
    state: 'Goa',
    searchCity: 'Panaji',
    tagline: 'Destination Weddings, Music Festivals & Coastal Campaigns',
    hubs: ['Panaji & Miramar', 'Calangute & Candolim', 'Anjuna & Vagator', 'South Goa Luxury Resorts'],
    description: 'Book verified destination wedding cinematographers, festival drone pilots, fashion photographers, and equipment in Goa with milestone escrow.',
    popularCategories: ['Photographers', 'Videographers', 'Drone Pilots', 'Organisers'],
  },
  pune: {
    name: 'Pune',
    state: 'Maharashtra',
    searchCity: 'Pune',
    tagline: 'Automotive Shoots, Corporate Films & Indie Productions',
    hubs: ['Koregaon Park', 'Baner & Balewadi', 'Kothrud', 'Viman Nagar', 'Hinjewadi'],
    description: 'Hire verified corporate film directors, wedding photographers, drone operators, and rent cinema cameras in Pune.',
    popularCategories: ['Photographers', 'Videographers', 'Drone Pilots', 'Editors'],
  }
};

export const CityLandingPage: React.FC = () => {
  const { city } = useParams<{ city: string }>();
  const cityKey = (city || 'mumbai').toLowerCase().trim();
  const cityData = CITIES_DATA[cityKey] || CITIES_DATA.mumbai;

  const [pros, setPros] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    professionalApi.getProfessionals({
      city: cityData.searchCity,
      state: cityData.state,
    }).then((res) => {
      if (!isMounted) return;
      if (res && res.length > 0) {
        setPros(res);
      } else {
        // Fallback to state or general featured if specific city has zero profiles yet
        professionalApi.getProfessionals({ state: cityData.state }).then((stateRes) => {
          if (!isMounted) return;
          if (stateRes && stateRes.length > 0) {
            setPros(stateRes);
          } else {
            // General featured
            professionalApi.getProfessionals({}).then((allRes) => {
              if (isMounted) setPros((allRes || []).slice(0, 6));
            });
          }
        });
      }
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [cityData]);

  const seoTitle = `Hire Verified Production Crews & Photographers in ${cityData.name} | Camqrew`;
  const seoDescription = `Book top-rated cinematographers, wedding photographers, drone pilots, and rent cinema cameras in ${cityData.name} (${cityData.hubs.slice(0, 3).join(', ')}). 100% Milestone Escrow Protection.`;

  return (
    <div className="city-landing-page">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={`https://camqrew.in/crews/${cityKey}`}
        keywords={`hire cinematographers in ${cityData.name}, wedding photographers ${cityData.name}, drone operators ${cityData.name}, camera gear rental ${cityData.name}, Camqrew ${cityData.name}`}
      />

      {/* Hero Header */}
      <section className="city-hero-section" style={{
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 13, 20, 0.4) 100%)',
        padding: '50px 20px 40px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))'
      }}>
        <div className="container">
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link to="/explore" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Explore</Link>
            <span>/</span>
            <span style={{ color: 'var(--accent, #10b981)', fontWeight: 600 }}>{cityData.name} Crews</span>
          </div>

          <div style={{ maxWidth: 840 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent, #10b981)',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 16
            }}>
              <MapPin size={15} />
              <span>Verified Production Crews • {cityData.name}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16, color: 'var(--text-primary)' }}>
              Hire Verified Film Crews, Photographers & Gear in {cityData.name}
            </h1>

            <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              {cityData.description}
            </p>

            {/* Quick Hub Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
                <Sparkles size={14} color="var(--accent)" /> Popular Shoot Locations:
              </span>
              {cityData.hubs.map((hub) => (
                <span key={hub} style={{
                  fontSize: 12.5,
                  padding: '4px 10px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)'
                }}>
                  {hub}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link to="/jobs/create" className="btn btn-primary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
                <Radio size={16} />
                <span>Post Broadcast Shoot in {cityData.name}</span>
              </Link>
              <Link to={`/marketplace?tab=catalog`} className="btn btn-outline" style={{ padding: '12px 22px', textDecoration: 'none' }}>
                <ShoppingBag size={16} />
                <span>Rent Cinema Gear</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Quick Links for this City */}
      <section style={{ padding: '32px 20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
        <div className="container">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
            Find Creative Specialists in {cityData.name}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {cityData.popularCategories.map((cat) => (
              <Link
                key={cat}
                to={`/explore?category=${encodeURIComponent(cat)}&state=${encodeURIComponent(cityData.state)}&city=${encodeURIComponent(cityData.searchCity)}`}
                className="card"
                style={{
                  padding: '16px 20px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, border-color 0.2s'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{cat}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>in {cityData.name}</div>
                </div>
                <ArrowRight size={16} color="var(--accent, #10b981)" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Professionals Listing */}
      <section style={{ padding: '48px 20px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                Top Verified Talent Available in {cityData.name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                Govt ID verified professionals with camera gear specs and milestone escrow protection.
              </p>
            </div>
            <Link 
              to={`/explore?state=${encodeURIComponent(cityData.state)}&city=${encodeURIComponent(cityData.searchCity)}`} 
              className="btn btn-outline"
              style={{ textDecoration: 'none' }}
            >
              <span>View All {cityData.name} Pros</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="pros-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card skeleton-card" style={{ height: 280 }} />
              ))}
            </div>
          ) : pros.length === 0 ? (
            <div className="empty-state card text-center" style={{ padding: 48 }}>
              <Camera size={44} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3>Be the First Creator in {cityData.name}!</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '8px auto 20px' }}>
                Join India's premier creative marketplace. Get direct bookings and milestone escrow guarantee.
              </p>
              <Link to="/register?role=professional" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Register as Creator in {cityData.name}
              </Link>
            </div>
          ) : (
            <div className="pros-grid">
              {pros.map((pro) => (
                <ProCard key={pro.id} pro={pro} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Escrow Guarantee Callout for Local Shoots */}
      <section style={{ padding: '40px 20px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
        <div className="container">
          <div className="card" style={{
            padding: '36px 32px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 13, 20, 0.8) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24
          }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent, #10b981)', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                <ShieldCheck size={20} />
                <span>100% Escrow Protection in {cityData.name}</span>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                Safe Bookings. Zero Payment Risk for Clients & Creators.
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                Your deposit is locked safely in Camqrew Escrow. Advance (30%) is held until shoot confirmation, 40% released upon physical shoot completion, and final 30% only after you inspect and approve deliverables.
              </p>
            </div>
            <Link to="/legal?section=escrow" className="btn btn-outline" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Learn About Escrow Rules
            </Link>
          </div>
        </div>
      </section>

      {/* Other Major Hubs */}
      <section style={{ padding: '48px 20px' }}>
        <div className="container">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18, color: 'var(--text-primary)' }}>
            Explore Creative Crews in Other Cities
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(CITIES_DATA).filter(([key]) => key !== cityKey && key !== 'bangalore').map(([key, data]) => (
              <Link
                key={key}
                to={`/crews/${key}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: 13.5,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <MapPin size={13} color="var(--accent, #10b981)" />
                <span>{data.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CityLandingPage;
