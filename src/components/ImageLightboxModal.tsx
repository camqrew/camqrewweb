import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface ImageLightboxModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
    }
  }, [isOpen, initialIndex, images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) return null;

  const currentImg = images[currentIndex];

  return (
    <div 
      className="modal-backdrop lightbox-backdrop" 
      onClick={onClose}
      style={{
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Top Header Bar */}
      <div 
        className="lightbox-top-bar"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span 
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#3fb668',
              background: 'rgba(63, 182, 104, 0.15)',
              padding: '4px 10px',
              borderRadius: 20,
              border: '1px solid rgba(63, 182, 104, 0.3)',
            }}
          >
            {currentIndex + 1} / {images.length}
          </span>
          {title && (
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              {title}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href={currentImg}
            target="_blank"
            rel="noopener noreferrer"
            className="lightbox-btn"
            title="Open original image in new tab"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} /> Full Res
          </a>
          <button
            type="button"
            className="lightbox-close-btn"
            onClick={onClose}
            title="Close (Esc)"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              padding: 8,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div 
        className="lightbox-image-wrapper"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '92vw',
          maxHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={currentImg}
          alt={`Portfolio photo ${currentIndex + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: 8,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            userSelect: 'none',
          }}
        />

        {/* Prev / Next Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="lightbox-nav-btn prev"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              title="Previous Photo (Left Arrow)"
              style={{
                position: 'absolute',
                left: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.65)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                width: 44,
                height: 44,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <ChevronLeft size={24} />
            </button>

            <button
              type="button"
              className="lightbox-nav-btn next"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              title="Next Photo (Right Arrow)"
              style={{
                position: 'absolute',
                right: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.65)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                width: 44,
                height: 44,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnails Strip */}
      {images.length > 1 && (
        <div
          className="lightbox-thumb-strip"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 12,
            display: 'flex',
            gap: 8,
            padding: '8px 14px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 14,
            maxWidth: '90vw',
            overflowX: 'auto',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              style={{
                border: idx === currentIndex ? '2px solid #3fb668' : '2px solid transparent',
                borderRadius: 6,
                padding: 0,
                background: 'none',
                cursor: 'pointer',
                opacity: idx === currentIndex ? 1 : 0.6,
                transition: 'opacity 0.2s, border 0.2s',
                overflow: 'hidden',
                width: 52,
                height: 40,
                flexShrink: 0,
              }}
            >
              <img
                src={img}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
