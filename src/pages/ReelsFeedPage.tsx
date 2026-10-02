import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { professionalApi } from '../api/professionalApi';
import type { FeedReelItem } from '../types/professional';
import { 
  Film, 
  Share2, 
  CalendarCheck, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  ArrowRight, 
  ExternalLink, 
  Loader2, 
  Check, 
  User, 
  Plus,
  Heart,
  Bookmark,
  Play,
  Pause,
  Search,
  LayoutGrid,
  Maximize2,
  Minimize2,
  MessageSquare,
  ShieldCheck,
  Star,
  Music,
  Sparkles,
  X,
  Keyboard
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { isCustomAvatar } from '../utils/avatarUtils';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = [
  'All',
  'Cinematography & Films',
  'Wedding & Sangeet',
  'Live Music & Bands',
  'Emcee & Stage Hosts',
  'Commercial & TVC',
  'Drone & Aerial',
  'Fashion & Runway',
  'Food & Culinary',
];

export const ReelsFeedPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();

  // Data state
  const [reels, setReels] = useState<FeedReelItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View & Filter state
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('cat') || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Player state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('0:00');
  const [durationStr, setDurationStr] = useState('0:00');
  const [showPlayAnim, setShowPlayAnim] = useState<'play' | 'pause' | null>(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Social & toast state
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('@camqrew_liked_reels');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('@camqrew_saved_reels');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cinemaContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<any>(null);
  const playAnimTimeoutRef = useRef<any>(null);

  // Toast trigger helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  // Load reels
  const loadReels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await professionalApi.getAllReels();
      setReels(data);

      // Deep link to specific reel if 'id' query param is provided
      const targetId = searchParams.get('id');
      if (targetId) {
        const foundIdx = data.findIndex(r => r.id === targetId);
        if (foundIdx !== -1) {
          setCurrentIndex(foundIdx);
        }
      }
    } catch (e) {
      console.warn('Failed to load reels feed:', e);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  // Filtered reels list
  const filteredReels = useMemo(() => {
    return reels.filter(r => {
      // Category match
      const catMatch = activeCategory === 'All' 
        ? true 
        : (r.category || '').toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0]);

      // Search match
      if (!searchQuery.trim()) return catMatch;
      const q = searchQuery.toLowerCase().trim();
      const text = `${r.title} ${r.creatorName} ${r.creatorCity} ${r.category} ${r.creatorTitle}`.toLowerCase();
      return catMatch && text.includes(q);
    });
  }, [reels, activeCategory, searchQuery]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= filteredReels.length && filteredReels.length > 0) {
      setCurrentIndex(0);
    }
  }, [filteredReels.length, currentIndex]);

  const currentReel = filteredReels[currentIndex] || null;

  // Video playback management on index / mute change
  useEffect(() => {
    if (viewMode !== 'feed' || !currentReel) return;

    setVideoProgress(0);
    setCurrentTimeStr('0:00');
    setIsPlaying(true);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isMuted;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // If unmuted autoplay fails due to browser restrictions, fallback to muted autoplay
        if (videoRef.current && !isMuted) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [currentIndex, viewMode, currentReel?.id, isMuted]);

  // Video time update listener
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setVideoProgress((cur / dur) * 100);

      const curM = Math.floor(cur / 60);
      const curS = Math.floor(cur % 60);
      const durM = Math.floor(dur / 60);
      const durS = Math.floor(dur % 60);
      setCurrentTimeStr(`${curM}:${curS < 10 ? '0' : ''}${curS}`);
      setDurationStr(`${durM}:${durS < 10 ? '0' : ''}${durS}`);
    }
  };

  // Toggle Play / Pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      triggerPlayAnim('play');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerPlayAnim('pause');
    }
  };

  const triggerPlayAnim = (type: 'play' | 'pause') => {
    setShowPlayAnim(type);
    if (playAnimTimeoutRef.current) clearTimeout(playAnimTimeoutRef.current);
    playAnimTimeoutRef.current = setTimeout(() => {
      setShowPlayAnim(null);
    }, 600);
  };

  // Double Click / Tap to like
  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentReel) return;
    if (!likedIds.has(currentReel.id)) {
      toggleLike(currentReel.id);
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
  };

  // Like Toggle
  const toggleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        triggerToast('Removed from liked reels');
      } else {
        next.add(id);
        triggerToast('Added to your liked reels ❤️');
      }
      try {
        localStorage.setItem('@camqrew_liked_reels', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Bookmark / Save Toggle
  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        triggerToast('Reel removed from saved');
      } else {
        next.add(id);
        triggerToast('Reel saved to your collection 🔖');
      }
      try {
        localStorage.setItem('@camqrew_saved_reels', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Share handler
  const handleShare = (reel: FeedReelItem) => {
    const shareUrl = `${window.location.origin}/reels?id=${reel.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${reel.title} • Camqrew Showcase`,
        text: `Watch ${reel.creatorName}'s verified creative showreel on Camqrew`,
        url: shareUrl,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      triggerToast('Reel link copied to clipboard!');
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cinemaContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Navigation: Next / Prev
  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredReels.length - 1));
  }, [filteredReels.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < filteredReels.length - 1 ? prev + 1 : 0));
  }, [filteredReels.length]);

  // Keyboard navigation
  useEffect(() => {
    if (viewMode !== 'feed') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in search input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key.toLowerCase() === 'm') {
        setIsMuted(m => !m);
        triggerToast(isMuted ? 'Audio Unmuted' : 'Audio Muted');
      } else if (e.key.toLowerCase() === 'l') {
        if (currentReel) toggleLike(currentReel.id);
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'g') {
        setViewMode('grid');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, viewMode, isMuted, currentReel]);

  // Touch Swipe for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartY.current = null;
  };

  // Wheel scroll debounce
  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode !== 'feed') return;
    if (wheelTimeoutRef.current) return;

    if (Math.abs(e.deltaY) > 35) {
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      wheelTimeoutRef.current = setTimeout(() => {
        wheelTimeoutRef.current = null;
      }, 450);
    }
  };

  // Progress Bar click seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * (videoRef.current.duration || 1);
    videoRef.current.currentTime = newTime;
    setVideoProgress(pos * 100);
  };

  // Embed URL builder for YouTube / Vimeo
  const getEmbedUrl = (reel: FeedReelItem) => {
    let src = reel.embedUrl || reel.url || '';
    if (src.includes('youtube.com/shorts/')) {
      const id = src.split('/shorts/')[1]?.split('?')[0];
      src = `https://www.youtube-nocookie.com/embed/${id}`;
    } else if (src.includes('youtube.com/watch')) {
      const match = src.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        src = `https://www.youtube-nocookie.com/embed/${match[1]}`;
      }
    } else if (src.includes('youtu.be/')) {
      const id = src.split('youtu.be/')[1]?.split('?')[0];
      if (id) {
        src = `https://www.youtube-nocookie.com/embed/${id}`;
      }
    }
    const paramChar = src.includes('?') ? '&' : '?';
    return `${src}${paramChar}autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playsinline=1&controls=0&modestbranding=1&rel=0`;
  };

  // Jump from grid view into feed at specific index
  const openReelInFeed = (index: number) => {
    setCurrentIndex(index);
    setViewMode('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="reels-feed-page-wrapper" onWheel={handleWheel}>
      <SEOHead
        title="Creator Video Showreels & 4K Portfolio Feed • Camqrew"
        description="Discover, watch, and book verified creative professionals across India through full-screen vertical 4K reels."
      />

      {/* Ambient background glow from current reel */}
      {viewMode === 'feed' && currentReel && (
        <div 
          className="reels-ambient-backdrop" 
          style={{ 
            backgroundImage: `url(${currentReel.thumbnailUrl || currentReel.creatorAvatar || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80'})` 
          }}
        />
      )}

      {/* =========================================================================
          TOP COMMAND TOOLBAR
          ========================================================================= */}
      <header className="reels-top-nav-bar">
        {/* Brand & Stats capsule */}
        <div className="reels-brand-cluster">
          <div className="reels-brand-pill">
            <span className="live-pulse-dot" />
            <Film size={18} color="var(--accent, #3fb668)" />
            <span className="brand-text">Showcase Reels</span>
            <span className="reels-count-chip">{filteredReels.length} Videos</span>
          </div>

          {user?.role === 'professional' && (
            <Link
              to="/dashboard?tab=overview"
              className="reels-upload-quick-btn"
              title="Upload your showcase reel"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Upload Reel</span>
            </Link>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="reels-search-box">
          <Search size={16} className="reels-search-icon" />
          <input
            type="text"
            placeholder="Search creators, cinematography, city, instruments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="reels-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="reels-search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* View Mode & Controls */}
        <div className="reels-top-actions">
          {/* Feed / Grid Switcher */}
          <div className="reels-view-switcher">
            <button
              type="button"
              className={`reels-view-btn ${viewMode === 'feed' ? 'active' : ''}`}
              onClick={() => setViewMode('feed')}
              title="Full-Screen Feed View [G]"
            >
              <Film size={15} />
              <span>Cinema Feed</span>
            </button>

            <button
              type="button"
              className={`reels-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Discover Grid View [G]"
            >
              <LayoutGrid size={15} />
              <span>Discover Grid</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            className={`reels-sound-toggle-btn ${isMuted ? 'muted' : 'active'}`}
            onClick={() => setIsMuted(m => !m)}
            title={isMuted ? "Unmute Sound (M)" : "Mute Sound (M)"}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} color="var(--accent, #3fb668)" />}
            <span className="sound-text">{isMuted ? "Muted" : "Sound On"}</span>
          </button>

          {/* Keyboard Shortcuts Hint */}
          <button
            type="button"
            className="reels-shortcuts-btn"
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard shortcuts cheatsheet"
          >
            <Keyboard size={16} />
          </button>
        </div>
      </header>

      {/* Category Pills Strip */}
      <div className="reels-category-strip-container">
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
              {cat === 'All' && <Sparkles size={13} style={{ marginRight: 4 }} />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: CINEMA FEED (TikTok / Instagram Reels Stream)
          ========================================================================= */}
      {viewMode === 'feed' && (
        <main 
          className="reels-stage-container"
          ref={cinemaContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="reels-loading-box">
              <Loader2 size={44} className="animate-spin" color="var(--accent, #3fb668)" />
              <h3>Loading High-Definition Showreels</h3>
              <p>Fetching 4K creator portfolio videos...</p>
            </div>
          ) : filteredReels.length === 0 ? (
            <div className="reels-empty-box card">
              <Film size={54} color="var(--accent, #3fb668)" />
              <h3>No reels found for your criteria</h3>
              <p>
                {searchQuery 
                  ? `No video showreels match "${searchQuery}". Try a different keyword.` 
                  : `No reels uploaded under "${activeCategory}" yet.`}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {searchQuery && (
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setActiveCategory('All');
                    setSearchQuery('');
                  }}
                >
                  Browse All Categories
                </button>
              </div>
            </div>
          ) : (
            <div className="reel-cinema-viewport">
              {/* ----------------- 9:16 VERTICAL VIDEO CARD ----------------- */}
              <div className="reel-video-card" onDoubleClick={handleDoubleTap}>
                {/* Format / Category Badge top-left */}
                <div className="reel-floating-header">
                  <span className="reel-floating-cat-badge">
                    {currentReel?.category || 'Cinematography'}
                  </span>
                  <span className="reel-floating-format-badge">
                    4K Vertical
                  </span>
                </div>

                {/* Sound Quick Pill top-right */}
                <button 
                  type="button"
                  className="reel-floating-sound-pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(m => !m);
                  }}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} color="var(--accent, #3fb668)" />}
                </button>

                {/* Heart Burst Splash on double click */}
                {showHeartBurst && (
                  <div className="reel-heart-burst">
                    <Heart size={84} fill="#ff3b5c" color="#ff3b5c" />
                  </div>
                )}

                {/* Play / Pause Splash Icon */}
                {showPlayAnim && (
                  <div className="reel-play-splash">
                    {showPlayAnim === 'play' ? (
                      <Play size={48} fill="#ffffff" color="#ffffff" />
                    ) : (
                      <Pause size={48} fill="#ffffff" color="#ffffff" />
                    )}
                  </div>
                )}

                {/* Video Media Source */}
                {currentReel && (
                  (currentReel.type === 'direct' || currentReel.url?.includes('.mp4') || currentReel.embedUrl?.includes('.mp4')) ? (
                    <video
                      ref={videoRef}
                      key={currentReel.id}
                      src={currentReel.url || currentReel.embedUrl}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      onTimeUpdate={handleTimeUpdate}
                      className="reel-iframe-video"
                      style={{ objectFit: 'cover', cursor: 'pointer' }}
                      onClick={togglePlayPause}
                    />
                  ) : (
                    <iframe
                      key={`${currentReel.id}_${isMuted}`}
                      src={getEmbedUrl(currentReel)}
                      title={currentReel.title}
                      className="reel-iframe-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )
                )}

                {/* Interactive Scrubber Timeline */}
                <div 
                  className="reel-timeline-bar-container"
                  onClick={handleProgressClick}
                  title="Click to seek"
                >
                  <div 
                    className="reel-timeline-bar-fill" 
                    style={{ width: `${videoProgress}%` }} 
                  />
                </div>

                {/* Mobile / Compact Overlay (Bottom of video) */}
                <div className="reel-card-bottom-overlay">
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
                    <span>{currentReel?.creatorCity || 'India'}</span>
                    <span className="divider">•</span>
                    <span className="title-text">{currentReel?.creatorTitle || 'Creative Professional'}</span>
                  </div>

                  <p className="reel-caption-title">{currentReel?.title}</p>

                  {/* Audio track & playback time badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div className="reel-audio-pill">
                      <Music size={12} color="var(--accent, #3fb668)" />
                      <span className="audio-title">Original Audio • {currentReel?.creatorName}</span>
                    </div>

                    <div className="reel-time-badge" style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', background: 'rgba(0, 0, 0, 0.55)', padding: '3px 8px', borderRadius: 10 }}>
                      {!isPlaying ? 'Paused • ' : ''}{currentTimeStr} / {durationStr}
                    </div>
                  </div>

                  {/* Mobile Quick Book CTA */}
                  <div className="reel-mobile-cta-row">
                    <Link
                      to={`/book/${currentReel?.creatorId}?jobTitle=${encodeURIComponent(currentReel?.title || 'Production Service')}`}
                      className="reel-book-cta-btn"
                    >
                      <CalendarCheck size={16} />
                      <span className="cta-txt">Book Now • ₹{(currentReel?.creatorRatePerDay || 18000).toLocaleString('en-IN')}/day</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* ----------------- VERTICAL NAVIGATION BUTTONS (ARROWS) ----------------- */}
              <div className="reel-nav-controls">
                <button
                  type="button"
                  className="reel-nav-btn up"
                  onClick={handlePrev}
                  title="Previous Reel [↑]"
                >
                  <ChevronUp size={22} />
                </button>

                <div className="reel-index-pill">
                  <span className="idx-num">{currentIndex + 1}</span>
                  <span className="idx-div">/</span>
                  <span className="idx-total">{filteredReels.length}</span>
                </div>

                <button
                  type="button"
                  className="reel-nav-btn down"
                  onClick={handleNext}
                  title="Next Reel [↓]"
                >
                  <ChevronDown size={22} />
                </button>
              </div>

              {/* ----------------- DESKTOP CREATOR & REEL SIDE PANEL ----------------- */}
              <aside className="reel-desktop-sidepanel">
                {/* Creator Profile Capsule */}
                <div className="sidepanel-creator-card">
                  <div className="sidepanel-creator-header">
                    <Link 
                      to={`/creators/${currentReel?.creatorId}`} 
                      className="sidepanel-avatar-link"
                      title={`View ${currentReel?.creatorName}'s profile`}
                    >
                      {isCustomAvatar(currentReel?.creatorAvatar) ? (
                        <img 
                          src={currentReel?.creatorAvatar} 
                          alt={currentReel?.creatorName} 
                          className="sidepanel-avatar-img"
                        />
                      ) : (
                        <div className="sidepanel-avatar-placeholder">
                          <User size={22} />
                        </div>
                      )}
                      <div className="sidepanel-avatar-verified">
                        <Check size={11} color="#ffffff" strokeWidth={3} />
                      </div>
                    </Link>

                    <div className="sidepanel-creator-info">
                      <Link to={`/creators/${currentReel?.creatorId}`} className="sidepanel-name-link">
                        <h4>{currentReel?.creatorName}</h4>
                        {currentReel?.creatorVerified && (
                          <CheckCircle size={15} color="#3fb668" fill="#3fb668" />
                        )}
                      </Link>
                      <p className="sidepanel-title">{currentReel?.creatorTitle || 'Creative Professional'}</p>

                      <div className="sidepanel-meta-row">
                        <div className="meta-item">
                          <Star size={13} fill="#f59e0b" color="#f59e0b" />
                          <span>{currentReel?.creatorRating?.toFixed(1) || '5.0'}</span>
                        </div>
                        <span className="dot">•</span>
                        <div className="meta-item">
                          <MapPin size={13} />
                          <span>{currentReel?.creatorCity || 'India'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Escrow Shield */}
                  <div className="sidepanel-pricing-banner">
                    <div className="pricing-col">
                      <span className="price-lbl">Starting Package / Rate</span>
                      <span className="price-val">₹{(currentReel?.creatorRatePerDay || 20000).toLocaleString('en-IN')}<small>/day</small></span>
                    </div>
                    <div className="escrow-badge-pill" title="Camqrew 100% Escrow Protection Guarantee">
                      <ShieldCheck size={14} color="#3fb668" />
                      <span>Escrow Protected</span>
                    </div>
                  </div>
                </div>

                {/* Reel Caption & Tags Box */}
                <div className="sidepanel-reel-details">
                  <span className="reel-category-chip">{currentReel?.category || 'Cinematography'}</span>
                  <h3 className="sidepanel-reel-title">{currentReel?.title}</h3>

                  <div className="sidepanel-soundtrack-box">
                    <Music size={14} color="var(--accent, #3fb668)" />
                    <span>Original Audio • {currentReel?.creatorName}</span>
                  </div>
                </div>

                {/* Interactive Engagement Row */}
                <div className="sidepanel-engagement-bar">
                  {/* Like Button */}
                  <button
                    type="button"
                    className={`sidepanel-action-btn ${currentReel && likedIds.has(currentReel.id) ? 'liked' : ''}`}
                    onClick={() => currentReel && toggleLike(currentReel.id)}
                    title="Like this reel [L]"
                  >
                    <Heart 
                      size={20} 
                      fill={currentReel && likedIds.has(currentReel.id) ? '#ff3b5c' : 'none'} 
                      color={currentReel && likedIds.has(currentReel.id) ? '#ff3b5c' : 'currentColor'} 
                    />
                    <span className="btn-count">
                      {(currentReel?.likesCount || 0) + (currentReel && likedIds.has(currentReel.id) ? 1 : 0)}
                    </span>
                  </button>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    className={`sidepanel-action-btn ${currentReel && savedIds.has(currentReel.id) ? 'saved' : ''}`}
                    onClick={() => currentReel && toggleSave(currentReel.id)}
                    title="Save to your collection"
                  >
                    <Bookmark 
                      size={19} 
                      fill={currentReel && savedIds.has(currentReel.id) ? 'var(--accent, #3fb668)' : 'none'} 
                      color={currentReel && savedIds.has(currentReel.id) ? 'var(--accent, #3fb668)' : 'currentColor'} 
                    />
                    <span>Save</span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    className="sidepanel-action-btn"
                    onClick={() => currentReel && handleShare(currentReel)}
                    title="Share this showcase reel"
                  >
                    <Share2 size={19} />
                    <span>Share</span>
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    className="sidepanel-action-btn"
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen [F]"
                  >
                    {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
                    <span>{isFullscreen ? 'Exit' : 'Cinema'}</span>
                  </button>
                </div>

                {/* Direct Booking & Action CTAs */}
                <div className="sidepanel-cta-cluster">
                  <Link
                    to={`/book/${currentReel?.creatorId}?jobTitle=${encodeURIComponent(currentReel?.title || 'Production Service')}`}
                    className="sidepanel-book-btn"
                  >
                    <CalendarCheck size={18} />
                    <span>Book {currentReel?.creatorName.split(' ')[0]}</span>
                    <ArrowRight size={16} style={{ marginLeft: 'auto' }} />
                  </Link>

                  <div className="sidepanel-secondary-btns">
                    <Link
                      to={`/chat?otherUserId=${currentReel?.creatorId}&name=${encodeURIComponent(currentReel?.creatorName || 'Creator')}`}
                      className="sidepanel-chat-btn"
                      title="Direct inquiry with creator"
                    >
                      <MessageSquare size={16} />
                      <span>Message</span>
                    </Link>

                    <Link
                      to={`/creators/${currentReel?.creatorId}`}
                      className="sidepanel-profile-btn"
                      title="Inspect entire creator portfolio & equipment"
                    >
                      <ExternalLink size={16} />
                      <span>View Profile</span>
                    </Link>
                  </div>
                </div>

                {/* Up Next in Queue Mini-Preview */}
                <div className="sidepanel-queue-preview">
                  <div className="queue-header">
                    <span className="queue-title">Up Next</span>
                    <span className="queue-progress">{currentIndex + 1} of {filteredReels.length}</span>
                  </div>

                  <div className="queue-items-list">
                    {filteredReels.slice(currentIndex + 1, currentIndex + 4).map((r, i) => (
                      <div 
                        key={r.id} 
                        className="queue-item-card"
                        onClick={() => openReelInFeed(currentIndex + 1 + i)}
                      >
                        <div 
                          className="queue-item-thumb" 
                          style={{ backgroundImage: `url(${r.thumbnailUrl || r.creatorAvatar})` }}
                        >
                          <Play size={12} fill="#fff" color="#fff" />
                        </div>
                        <div className="queue-item-info">
                          <p className="q-title">{r.title}</p>
                          <span className="q-creator">{r.creatorName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>
      )}

      {/* =========================================================================
          VIEW MODE 2: DISCOVER GRID (Pinterest / Shorts Gallery)
          ========================================================================= */}
      {viewMode === 'grid' && (
        <main className="reels-grid-container">
          <div className="reels-grid-header">
            <div>
              <h2 className="grid-heading">
                Explore Creative Showreels
              </h2>
              <p className="grid-subheading">
                Browse 4K portfolio edits, live music solos, wedding highlights, and drone reels.
              </p>
            </div>

            <div className="grid-meta-count">
              <span>{filteredReels.length} Showreels Available</span>
            </div>
          </div>

          {loading ? (
            <div className="reels-loading-box">
              <Loader2 size={44} className="animate-spin" color="var(--accent, #3fb668)" />
              <p>Loading creator showreels gallery...</p>
            </div>
          ) : filteredReels.length === 0 ? (
            <div className="reels-empty-box card" style={{ margin: '40px auto' }}>
              <Film size={48} color="var(--accent, #3fb668)" />
              <h3>No reels found</h3>
              <p>Try resetting filters or searching for another keyword.</p>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="reels-cards-grid">
              {filteredReels.map((reel, idx) => (
                <div 
                  key={reel.id} 
                  className="reel-grid-card"
                  onClick={() => openReelInFeed(idx)}
                >
                  {/* Poster / Thumbnail image with hover play */}
                  <div className="reel-grid-card-media">
                    <img 
                      src={reel.thumbnailUrl || reel.creatorAvatar || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80'} 
                      alt={reel.title}
                      className="grid-card-thumb"
                      loading="lazy"
                    />

                    {/* Gradient shading */}
                    <div className="grid-card-gradient" />

                    {/* Floating Category Pill */}
                    <div className="grid-card-top-tags">
                      <span className="grid-cat-pill">{reel.category || 'Cinematography'}</span>
                      {reel.isShort && (
                        <span className="grid-format-pill">9:16</span>
                      )}
                    </div>

                    {/* Center Hover Play Icon */}
                    <div className="grid-card-play-hover">
                      <div className="play-pulse-circle">
                        <Play size={24} fill="#ffffff" color="#ffffff" style={{ marginLeft: 3 }} />
                      </div>
                      <span className="play-hover-label">Watch Reel</span>
                    </div>

                    {/* Bottom Card Info Overlay */}
                    <div className="grid-card-bottom-info">
                      <div className="grid-creator-row">
                        {isCustomAvatar(reel.creatorAvatar) ? (
                          <img 
                            src={reel.creatorAvatar} 
                            alt={reel.creatorName} 
                            className="grid-creator-avatar"
                          />
                        ) : (
                          <div className="grid-creator-avatar placeholder">
                            <User size={13} />
                          </div>
                        )}
                        <span className="grid-creator-name">{reel.creatorName}</span>
                        {reel.creatorVerified && (
                          <CheckCircle size={13} color="#3fb668" fill="#3fb668" />
                        )}
                      </div>

                      <h4 className="grid-reel-title">{reel.title}</h4>

                      <div className="grid-card-footer">
                        <span className="grid-card-rate">
                          From ₹{(reel.creatorRatePerDay || 18000).toLocaleString('en-IN')}/day
                        </span>
                        <div className="grid-card-like-pill">
                          <Heart size={12} fill="#ff3b5c" color="#ff3b5c" />
                          <span>{(reel.likesCount || 0) + (likedIds.has(reel.id) ? 1 : 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* =========================================================================
          KEYBOARD SHORTCUTS MODAL
          ========================================================================= */}
      {showShortcutsModal && (
        <div className="reels-modal-backdrop" onClick={() => setShowShortcutsModal(false)}>
          <div className="reels-shortcuts-modal" onClick={e => e.stopPropagation()}>
            <div className="shortcuts-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Keyboard size={20} color="var(--accent, #3fb668)" />
                <h3>Keyboard Shortcuts</h3>
              </div>
              <button 
                type="button" 
                className="shortcuts-close-btn"
                onClick={() => setShowShortcutsModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="shortcuts-list">
              <div className="shortcut-row">
                <div className="keys"><kbd>↓</kbd> or <kbd>Page Down</kbd></div>
                <span>Next Showreel</span>
              </div>
              <div className="shortcut-row">
                <div className="keys"><kbd>↑</kbd> or <kbd>Page Up</kbd></div>
                <span>Previous Showreel</span>
              </div>
              <div className="shortcut-row">
                <div className="keys"><kbd>Space</kbd></div>
                <span>Play / Pause Video</span>
              </div>
              <div className="shortcut-row">
                <div className="keys"><kbd>M</kbd></div>
                <span>Mute / Unmute Audio</span>
              </div>
              <div className="shortcut-row">
                <div className="keys"><kbd>L</kbd></div>
                <span>Like Current Reel</span>
              </div>
              <div className="shortcut-row">
                <div className="keys"><kbd>F</kbd></div>
                <span>Toggle Cinema Fullscreen</span>
              </div>
              <div className="shortcut-row">
                <div className="keys"><kbd>G</kbd></div>
                <span>Toggle Feed / Grid Mode</span>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary btn-block"
              style={{ marginTop: 20 }}
              onClick={() => setShowShortcutsModal(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="reels-toast-banner">
          <Check size={16} color="#3fb668" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ReelsFeedPage;
