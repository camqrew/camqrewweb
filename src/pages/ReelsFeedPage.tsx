import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { professionalApi } from '../api/professionalApi';
import type { FeedReelItem } from '../types/professional';
import { 
  Film, 
  Heart, 
  MessageSquare, 
  Share2, 
  CalendarCheck, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  MapPin, 
  ArrowRight,
  ExternalLink,
  Loader2,
  Check
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

const CATEGORIES = ['All', 'Commercial', 'Wedding Film', 'Drone & Aerial', 'Fashion Reel', 'Cinematography'];

export const ReelsFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [reels, setReels] = useState<FeedReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<{ [id: string]: boolean }>({});
  const [likeCounts, setLikeCounts] = useState<{ [id: string]: number }>({});
  const [copiedToast, setCopiedToast] = useState(false);

  // Load reels
  const loadReels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await professionalApi.getAllReels();
      setReels(data);
      const initialLikes: { [id: string]: number } = {};
      data.forEach(r => {
        initialLikes[r.id] = r.likesCount || 150;
      });
      setLikeCounts(initialLikes);
    } catch (e) {
      console.warn('Failed to load reels feed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  // Filtered reels
  const filteredReels = reels.filter(r => {
    if (activeCategory === 'All') return true;
    return (r.category || '').toLowerCase().includes(activeCategory.toLowerCase());
  });

  const currentReel = filteredReels[currentIndex] || null;

  // Keyboard navigation
  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredReels.length - 1));
  }, [filteredReels.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < filteredReels.length - 1 ? prev + 1 : 0));
  }, [filteredReels.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key.toLowerCase() === 'm') {
        setIsMuted(m => !m);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Wheel debounce
  const wheelTimeoutRef = useRef<any>(null);
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeoutRef.current) return;
    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      wheelTimeoutRef.current = setTimeout(() => {
        wheelTimeoutRef.current = null;
      }, 500);
    }
  };

  const toggleLike = (reelId: string) => {
    setLikedReels(prev => {
      const isLiked = !!prev[reelId];
      setLikeCounts(c => ({ ...c, [reelId]: (c[reelId] || 0) + (isLiked ? -1 : 1) }));
      return { ...prev, [reelId]: !isLiked };
    });
  };

  const handleShare = (reel: FeedReelItem) => {
    const shareUrl = `${window.location.origin}/creators/${reel.creatorId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Embed URL construction
  const getEmbedUrl = (reel: FeedReelItem) => {
    let src = reel.embedUrl || reel.url;
    if (src.includes('youtube.com/shorts/')) {
      const id = src.split('/shorts/')[1]?.split('?')[0];
      src = `https://www.youtube-nocookie.com/embed/${id}`;
    }
    const paramChar = src.includes('?') ? '&' : '?';
    return `${src}${paramChar}autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playsinline=1&controls=0&modestbranding=1&rel=0`;
  };

  return (
    <div className="reels-feed-page-wrapper" onWheel={handleWheel}>
      <SEOHead
        title="Creator Video Reels & Showreels • Camqrew"
        description="Discover and book verified cinematographers, drone pilots, and commercial filmmakers through full-screen vertical reels."
      />

      {/* Ambient background glow */}
      {currentReel?.thumbnailUrl && (
        <div 
          className="reels-ambient-backdrop" 
          style={{ backgroundImage: `url(${currentReel.thumbnailUrl})` }}
        />
      )}

      {/* Top Floating Category Bar */}
      <div className="reels-top-nav-bar">
        <div className="reels-brand-pill">
          <Film size={18} color="var(--accent, #3fb668)" />
          <span className="brand-text">Showcase Reels</span>
        </div>

        <div className="reels-category-pills">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`reels-cat-pill-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                setCurrentIndex(0);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="reels-sound-toggle-btn"
          onClick={() => setIsMuted(m => !m)}
          title={isMuted ? "Unmute (M)" : "Mute (M)"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} color="var(--accent, #3fb668)" />}
          <span className="sound-text">{isMuted ? "Muted" : "Sound On"}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="reels-stage-container">
        {loading ? (
          <div className="reels-loading-box">
            <Loader2 size={40} className="animate-spin" color="var(--accent, #3fb668)" />
            <p>Loading creator showreels...</p>
          </div>
        ) : filteredReels.length === 0 ? (
          <div className="reels-empty-box card">
            <Film size={48} color="var(--text-muted)" />
            <h3>No reels found in this category</h3>
            <p>Browse all categories to see cinematic showreels.</p>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => setActiveCategory('All')}
            >
              Show All Categories
            </button>
          </div>
        ) : (
          <div className="reel-cinema-viewport">
            {/* Vertical Video Card */}
            <div className="reel-video-card">
              {currentReel && (
                <iframe
                  key={`${currentReel.id}_${isMuted}`}
                  src={getEmbedUrl(currentReel)}
                  title={currentReel.title}
                  className="reel-iframe-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}

              {/* Bottom Information Overlay */}
              <div className="reel-card-bottom-overlay">
                <div className="reel-tag-row">
                  <span className="reel-cat-badge">{currentReel?.category || 'Cinematography'}</span>
                  {currentReel?.isShort && (
                    <span className="reel-short-badge">
                      <Sparkles size={11} /> 9:16 Short
                    </span>
                  )}
                </div>

                <div className="reel-creator-header-row">
                  <Link to={`/creators/${currentReel?.creatorId}`} className="reel-creator-name-link">
                    <span className="creator-name">{currentReel?.creatorName}</span>
                    {currentReel?.creatorVerified && (
                      <CheckCircle size={15} color="#3fb668" fill="#3fb668" />
                    )}
                  </Link>
                </div>

                <div className="reel-creator-meta">
                  <MapPin size={12} />
                  <span>{currentReel?.creatorCity || 'Mumbai'}</span>
                  <span className="divider">•</span>
                  <span className="title-text">{currentReel?.creatorTitle || 'Cinematographer'}</span>
                </div>

                <p className="reel-caption-title">{currentReel?.title}</p>

                {/* Prominent Instant Booking CTA */}
                <Link
                  to={`/book/${currentReel?.creatorId}`}
                  className="reel-book-cta-btn"
                >
                  <div className="book-cta-icon-box">
                    <CalendarCheck size={16} />
                  </div>
                  <div className="book-cta-text-col">
                    <span className="book-cta-main">Book {currentReel?.creatorName.split(' ')[0]}</span>
                    <span className="book-cta-sub">
                      From ₹{(currentReel?.creatorRatePerDay || 18000).toLocaleString('en-IN')}/day • Milestone Escrow Protected
                    </span>
                  </div>
                  <div className="book-cta-arrow">
                    <ArrowRight size={15} />
                  </div>
                </Link>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="reel-action-sidebar">
              {/* Creator Profile Avatar */}
              <Link 
                to={`/creators/${currentReel?.creatorId}`} 
                className="reel-action-avatar-btn"
                title={`View ${currentReel?.creatorName}'s public profile`}
              >
                <img 
                  src={currentReel?.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'} 
                  alt={currentReel?.creatorName} 
                  className="reel-avatar-img"
                />
                <div className="reel-avatar-check">
                  <Check size={10} color="#fff" />
                </div>
              </Link>

              {/* Like Button */}
              <button 
                type="button" 
                className={`reel-action-btn ${likedReels[currentReel?.id || ''] ? 'liked' : ''}`}
                onClick={() => currentReel && toggleLike(currentReel.id)}
                title="Like reel"
              >
                <div className="action-circle">
                  <Heart 
                    size={22} 
                    fill={likedReels[currentReel?.id || ''] ? '#ff3b5c' : 'none'} 
                    color={likedReels[currentReel?.id || ''] ? '#ff3b5c' : '#ffffff'} 
                  />
                </div>
                <span className="action-label">
                  {(likeCounts[currentReel?.id || ''] || 150).toLocaleString()}
                </span>
              </button>

              {/* Direct Message Button */}
              <button 
                type="button" 
                className="reel-action-btn"
                onClick={() => navigate(`/chat?userId=${currentReel?.creatorId}`)}
                title="Message creator"
              >
                <div className="action-circle">
                  <MessageSquare size={20} />
                </div>
                <span className="action-label">Chat</span>
              </button>

              {/* Share Button */}
              <button 
                type="button" 
                className="reel-action-btn"
                onClick={() => currentReel && handleShare(currentReel)}
                title="Copy share link"
              >
                <div className="action-circle">
                  <Share2 size={20} />
                </div>
                <span className="action-label">Share</span>
              </button>

              {/* View Full Profile link */}
              <Link 
                to={`/creators/${currentReel?.creatorId}`} 
                className="reel-action-btn"
                title="Open portfolio profile"
              >
                <div className="action-circle">
                  <ExternalLink size={18} />
                </div>
                <span className="action-label">Profile</span>
              </Link>
            </div>

            {/* Vertical Next / Prev Controls */}
            <div className="reel-nav-controls">
              <button
                type="button"
                className="reel-nav-btn up"
                onClick={handlePrev}
                title="Previous Reel (Up Arrow)"
              >
                <ChevronUp size={24} />
              </button>

              <span className="reel-index-badge">
                {currentIndex + 1} / {filteredReels.length}
              </span>

              <button
                type="button"
                className="reel-nav-btn down"
                onClick={handleNext}
                title="Next Reel (Down Arrow / Space)"
              >
                <ChevronDown size={24} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Copy Toast */}
      {copiedToast && (
        <div className="reels-toast-banner">
          <Check size={16} color="#3fb668" />
          <span>Creator profile link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
};

export default ReelsFeedPage;
