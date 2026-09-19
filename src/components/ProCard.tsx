import React from 'react';
import { Link } from 'react-router-dom';
import type { ProfessionalProfile } from '../types/professional';
import { Star, MapPin, CheckCircle2, ArrowRight, User } from 'lucide-react';
import { isCustomAvatar } from '../utils/avatarUtils';

interface ProCardProps {
  pro: ProfessionalProfile;
}

export const ProCard: React.FC<ProCardProps> = ({ pro }) => {
  return (
    <div className="pro-card">
      <div className="pro-card-header">
        <div className="pro-avatar-wrapper">
          {isCustomAvatar(pro.avatar) ? (
            <img src={pro.avatar} alt={pro.name} className="pro-avatar" />
          ) : (
            <div className="pro-avatar pro-avatar-placeholder">
              <User size={24} />
            </div>
          )}
          {pro.verified && (
            <span className="pro-verified-badge" title="Verified Creator">
              <CheckCircle2 size={16} fill="var(--accent)" color="#fff" />
            </span>
          )}
        </div>
        <div className="pro-header-info">
          <div className="pro-name-row">
            <h3 className="pro-name">{pro.name}</h3>
          </div>
          <p className="pro-title">{pro.title}</p>
          <div className="pro-rating-location">
            <span className="pro-rating">
              <Star size={14} fill="#F5A623" color="#F5A623" />
              <strong>{pro.rating?.toFixed(1) || '5.0'}</strong>
              <span className="pro-reviews">({pro.reviewCount || 0})</span>
            </span>
            <span className="pro-loc">
              <MapPin size={14} color="var(--text-muted)" />
              {pro.city || pro.district}, {pro.state}
            </span>
          </div>
        </div>
      </div>

      <p className="pro-bio" title={pro.bio}>
        {pro.bio && pro.bio.length > 110 ? pro.bio.slice(0, 110) + '...' : pro.bio}
      </p>

      {pro.categories && pro.categories.length > 0 && (
        <div className="pro-tags">
          {pro.categories.slice(0, 3).map((cat) => (
            <span key={cat} className="pro-tag">{cat}</span>
          ))}
        </div>
      )}

      <div className="pro-card-footer">
        <div className="pro-rate-box">
          <span className="rate-label">Day Rate</span>
          <span className="rate-value">₹{pro.ratePerDay?.toLocaleString('en-IN') || '—'}</span>
        </div>
        <div className="pro-card-actions">
          <Link to={`/creators/${pro.id}`} className="btn btn-outline btn-sm">
            Profile
          </Link>
          <Link to={`/book/${pro.id}`} className="btn btn-primary btn-sm">
            Book Now <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
