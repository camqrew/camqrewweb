import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProfessionalProfile } from '../types/professional';
import { Star, MapPin, CheckCircle2, UserCheck, User } from 'lucide-react';
import { getArchetype } from '../constants/categories';
import { isProAvailableOnDates } from '../api/professionalApi';

interface ProCardProps {
  pro: ProfessionalProfile;
  selectedDates?: {
    startDate: string;
    endDate?: string;
  };
}

export const ProCard: React.FC<ProCardProps> = ({ pro, selectedDates }) => {
  const [imgError, setImgError] = useState(false);
  const archetype = getArchetype(pro.categories);

  const isAvailableOnDates = selectedDates?.startDate
    ? isProAvailableOnDates(pro, selectedDates.startDate, selectedDates.endDate)
    : null;

  const specsText = pro.categories && pro.categories.length > 0
    ? pro.categories.slice(0, 3).join(' • ')
    : '4K Cinema • Drone Operator • Production Crew';

  // Fallback banner if none exists
  const bannerSrc = pro.bannerImage || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1600';

  const bookUrl = selectedDates?.startDate
    ? `/book/${pro.id}?startDate=${selectedDates.startDate}${selectedDates.endDate ? `&endDate=${selectedDates.endDate}` : ''}`
    : `/book/${pro.id}`;

  return (
    <div className="pro-card pro-card-mobile-match">
      {/* Top Cinematic Image Banner */}
      <div className="pro-card-banner-wrapper" style={{ position: 'relative' }}>
        <img
          src={bannerSrc}
          alt={pro.name}
          className="pro-card-banner-img"
          loading="lazy"
        />
        {isAvailableOnDates !== null && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '4px 9px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            backdropFilter: 'blur(8px)',
            background: isAvailableOnDates ? 'rgba(34, 197, 94, 0.92)' : 'rgba(239, 68, 68, 0.92)',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 2,
            letterSpacing: '0.2px'
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'inline-block'
            }} />
            <span>{isAvailableOnDates ? 'Available on Dates' : 'Blocked / Booked'}</span>
          </div>
        )}
      </div>

      {/* Floating Content Box with curved top overlapping banner */}
      <div className="pro-card-floating-body">
        {/* Header Info Row with Avatar on Left & (Rating + Name) on Right */}
        <div className="pro-card-header-row">
          <div className="pro-card-avatar-box">
            {pro.avatar && !imgError ? (
              <img
                src={pro.avatar}
                alt={pro.name}
                className="pro-card-avatar-img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="pro-card-avatar-placeholder">
                {pro.name ? pro.name[0].toUpperCase() : <User size={22} />}
              </div>
            )}
            {pro.verified && (
              <span className="pro-card-verified-badge" title="Verified Creator">
                <CheckCircle2 size={16} fill="#3fb668" color="#ffffff" />
              </span>
            )}
          </div>

          <div className="pro-card-info-col">
            {/* Rating Row with Green Star */}
            <div className="pro-card-rating-row">
              <Star size={13} fill="#3fb668" color="#3fb668" />
              <span className="pro-card-rating-val">{(pro.rating || 5.0).toFixed(1)}</span>
              <span className="pro-card-review-count">({pro.reviewCount || 0})</span>
              {(pro.city || pro.district) && (
                <>
                  <span className="pro-card-meta-dot">•</span>
                  <span className="pro-card-loc-text">
                    <MapPin size={11} style={{ marginRight: 2 }} />
                    {pro.city || pro.district}
                  </span>
                </>
              )}
            </div>

            {/* Pro Studio / Creator Name */}
            <h3 className="pro-card-pro-name" title={pro.name}>
              {pro.name}
            </h3>
          </div>
        </div>

        {/* Title / Role Subtitle */}
        <p className="pro-card-role-title">
          {pro.title || 'Creative Professional Studio'}
        </p>

        {/* Specs / Categories Subtext */}
        <p className="pro-card-specs-subtext">
          {specsText}
        </p>

        {/* Starting from Rate */}
        <div className="pro-card-rate-line">
          <span className="pro-card-rate-label">Starting from </span>
          <span className="pro-card-rate-val">
            ₹{(pro.ratePerDay || 0).toLocaleString('en-IN')}
          </span>
          <span className="pro-card-rate-unit">
            /{archetype.rateUnitDefault.toLowerCase()}
          </span>
        </div>

        {/* Action Buttons Row: View Profile + Book Now */}
        <div className="pro-card-actions-row">
          <Link to={`/creators/${pro.id}`} className="pro-card-btn-view">
            <span>View</span>
            <UserCheck size={15} />
          </Link>

          <Link to={bookUrl} className="pro-card-btn-book">
            <span>Book Now</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
