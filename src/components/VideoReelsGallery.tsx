import React, { useState } from 'react';
import type { VideoReelItem } from '../types/professional';
import { 
  Play, 
  Film, 
  Smartphone, 
  Tv, 
  X, 
  ExternalLink, 
  CalendarCheck
} from 'lucide-react';

interface VideoReelsGalleryProps {
  reels?: VideoReelItem[];
  proName: string;
  proAvatar?: string;
  onBookClick?: () => void;
}

export const VideoReelsGallery: React.FC<VideoReelsGalleryProps> = ({
  reels = [],
  proName,
  proAvatar,
  onBookClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'shorts' | 'cinematic'>('all');
  const [activeReel, setActiveReel] = useState<VideoReelItem | null>(null);

  if (!reels || reels.length === 0) {
    return null;
  }

  const verticalReels = reels.filter(r => r.isShort);
  const cinematicReels = reels.filter(r => !r.isShort);

  const displayedReels = reels.filter(r => {
    if (filter === 'shorts') return r.isShort;
    if (filter === 'cinematic') return !r.isShort;
    return true;
  });

  return (
    <div className="card profile-section-card video-reels-section">
      <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Film size={20} color="var(--accent, #3fb668)" />
            Showreels & Video Reels
          </h3>
          <p className="section-subtext" style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Cinematic portfolio, commercials, and 9:16 vertical shorts
          </p>
        </div>

        {/* Filter Pills */}
        <div className="reel-filter-pills">
          <button 
            className={`reel-pill-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({reels.length})
          </button>
          {verticalReels.length > 0 && (
            <button 
              className={`reel-pill-btn ${filter === 'shorts' ? 'active' : ''}`}
              onClick={() => setFilter('shorts')}
            >
              <Smartphone size={13} /> Shorts ({verticalReels.length})
            </button>
          )}
          {cinematicReels.length > 0 && (
            <button 
              className={`reel-pill-btn ${filter === 'cinematic' ? 'active' : ''}`}
              onClick={() => setFilter('cinematic')}
            >
              <Tv size={13} /> Cinematic ({cinematicReels.length})
            </button>
          )}
        </div>
      </div>

      {/* Grid of Reels */}
      <div className="video-reels-grid">
        {displayedReels.map((reel) => {
          const isShort = Boolean(reel.isShort);
          const thumb = reel.thumbnailUrl || 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=800';

          return (
            <div 
              key={reel.id}
              className={`reel-card-item ${isShort ? 'reel-card-vertical' : 'reel-card-cinematic'}`}
              onClick={() => setActiveReel(reel)}
              role="button"
              tabIndex={0}
            >
              <div className="reel-card-thumbnail-wrap">
                {reel.thumbnailUrl ? (
                  <img src={reel.thumbnailUrl} alt={reel.title} loading="lazy" className="reel-card-thumb-img" />
                ) : (reel.type === 'direct' || reel.url?.includes('.mp4')) ? (
                  <video 
                    src={reel.url || reel.embedUrl}
                    preload="metadata"
                    muted
                    playsInline
                    className="reel-card-thumb-img"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <img src={thumb} alt={reel.title} loading="lazy" className="reel-card-thumb-img" />
                )}
                
                <div className="reel-card-overlay">
                  <div className="reel-play-circle">
                    <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                  </div>

                  <div className="reel-badge-top-row">
                    <span className="reel-platform-tag">
                      {isShort ? '9:16 Reel' : 'Cinema Video'}
                    </span>
                    {reel.category && (
                      <span className="reel-category-tag">{reel.category}</span>
                    )}
                  </div>

                  <div className="reel-info-bottom">
                    <h4 className="reel-item-title">{reel.title}</h4>
                    <span className="reel-watch-prompt">Click to play video ↗</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* THEATER VIDEO PLAYER MODAL */}
      {activeReel && (
        <div className="theater-video-modal-backdrop" onClick={() => setActiveReel(null)}>
          <div className="theater-video-modal-container card" onClick={(e) => e.stopPropagation()}>
            <div className="theater-header">
              <div className="theater-header-left">
                {proAvatar && <img src={proAvatar} alt="" className="theater-creator-avatar" />}
                <div>
                  <h3 className="theater-title">{activeReel.title}</h3>
                  <span className="theater-subtitle">
                    Created by {proName} • {activeReel.category || 'Showreel'}
                  </span>
                </div>
              </div>
              <button 
                className="theater-close-btn" 
                onClick={() => setActiveReel(null)}
                aria-label="Close player"
              >
                <X size={20} />
              </button>
            </div>

            {/* Embed Player */}
            <div className={`theater-player-frame ${activeReel.isShort ? 'frame-vertical-short' : 'frame-widescreen'}`}>
              {activeReel.type === 'direct' ? (
                <video 
                  src={activeReel.embedUrl || activeReel.url} 
                  controls 
                  autoPlay 
                  playsInline 
                  className="theater-html5-video"
                />
              ) : (
                <iframe
                  src={activeReel.embedUrl || activeReel.url}
                  title={activeReel.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="theater-embed-iframe"
                />
              )}
            </div>

            {/* Footer */}
            <div className="theater-footer">
              <span className="theater-footer-note">
                Interested in booking a shoot with this visual style?
              </span>
              <div className="theater-footer-btns">
                {activeReel.type === 'direct' ? (
                  <a 
                    href={activeReel.url || activeReel.embedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-ghost btn-sm"
                  >
                    <ExternalLink size={14} /> Open Video
                  </a>
                ) : (
                  <a 
                    href={activeReel.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-ghost btn-sm"
                  >
                    <ExternalLink size={14} /> Open on {activeReel.type === 'youtube' ? 'YouTube' : 'Vimeo'}
                  </a>
                )}
                {onBookClick && (
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm" 
                    onClick={() => {
                      setActiveReel(null);
                      onBookClick();
                    }}
                  >
                    <CalendarCheck size={14} /> Book This Creator
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
