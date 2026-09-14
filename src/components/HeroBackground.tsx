import React, { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

export const HeroBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 40 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate deterministic floating particles for cinematic bokeh / light motes
  const particles: Particle[] = [
    { id: 1, left: 12, top: 75, size: 4, duration: 18, delay: -2, opacity: 0.6, color: '#3fb668' },
    { id: 2, left: 22, top: 40, size: 6, duration: 22, delay: -9, opacity: 0.5, color: '#30b0c7' },
    { id: 3, left: 35, top: 85, size: 3, duration: 16, delay: -4, opacity: 0.7, color: '#ffffff' },
    { id: 4, left: 48, top: 60, size: 5, duration: 20, delay: -14, opacity: 0.6, color: '#3fb668' },
    { id: 5, left: 62, top: 80, size: 7, duration: 24, delay: -7, opacity: 0.4, color: '#f59e0b' },
    { id: 6, left: 74, top: 35, size: 4, duration: 19, delay: -11, opacity: 0.6, color: '#30b0c7' },
    { id: 7, left: 88, top: 70, size: 5, duration: 21, delay: -5, opacity: 0.5, color: '#3fb668' },
    { id: 8, left: 18, top: 90, size: 3, duration: 17, delay: -15, opacity: 0.7, color: '#ffffff' },
    { id: 9, left: 42, top: 25, size: 8, duration: 26, delay: -8, opacity: 0.35, color: '#30b0c7' },
    { id: 10, left: 55, top: 92, size: 4, duration: 18, delay: -13, opacity: 0.6, color: '#3fb668' },
    { id: 11, left: 80, top: 50, size: 6, duration: 23, delay: -3, opacity: 0.45, color: '#f59e0b' },
    { id: 12, left: 92, top: 30, size: 3, duration: 15, delay: -10, opacity: 0.65, color: '#ffffff' },
    { id: 13, left: 28, top: 65, size: 5, duration: 21, delay: -16, opacity: 0.5, color: '#3fb668' },
    { id: 14, left: 68, top: 85, size: 4, duration: 19, delay: -6, opacity: 0.55, color: '#30b0c7' },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="hero-animated-bg"
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`,
      } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* 1. Interactive Cursor Ambient Spotlight */}
      <div className="hero-interactive-spotlight" />

      {/* 2. Fluid Drifting Ambient Aurora Orbs */}
      <div className="ambient-orb orb-emerald" />
      <div className="ambient-orb orb-cyan" />
      <div className="ambient-orb orb-violet" />
      <div className="ambient-orb orb-amber" />

      {/* 3. Subtle Digital Production Dot Matrix Grid */}
      <div className="hero-grid-matrix" />

      {/* 4. Cinematic Camera Lens Focus Rings (Rotational Reticle) */}
      <div className="hero-lens-reticle-wrap">
        <svg 
          className="hero-lens-svg" 
          viewBox="0 0 800 800" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Lens Diameter Ring - Clockwise 60s */}
          <circle 
            cx="400" 
            cy="400" 
            r="360" 
            className="lens-ring outer-ring" 
            stroke="currentColor" 
            strokeWidth="1.2" 
            strokeDasharray="6 14" 
          />
          {/* Aperture Focus Distance Ring - Counter-Clockwise 45s */}
          <circle 
            cx="400" 
            cy="400" 
            r="270" 
            className="lens-ring middle-ring" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeDasharray="2 18" 
          />
          {/* Inner Viewfinder Ring with Quarter Markers */}
          <circle 
            cx="400" 
            cy="400" 
            r="180" 
            className="lens-ring inner-ring" 
            stroke="currentColor" 
            strokeWidth="0.8" 
            strokeDasharray="12 24" 
          />
          {/* Crosshair Viewfinder Tick Marks */}
          <line x1="400" y1="20" x2="400" y2="40" stroke="currentColor" strokeWidth="1.5" className="reticle-tick" />
          <line x1="400" y1="760" x2="400" y2="780" stroke="currentColor" strokeWidth="1.5" className="reticle-tick" />
          <line x1="20" y1="400" x2="40" y2="400" stroke="currentColor" strokeWidth="1.5" className="reticle-tick" />
          <line x1="760" y1="400" x2="780" y2="400" stroke="currentColor" strokeWidth="1.5" className="reticle-tick" />
        </svg>

        {/* Cinematic Corner Crop Marks (ARRI/RED Cinema Frame Style) */}
        <div className="viewfinder-corner top-left" />
        <div className="viewfinder-corner top-right" />
        <div className="viewfinder-corner bottom-left" />
        <div className="viewfinder-corner bottom-right" />
      </div>

      {/* 5. Floating Cinematic Bokeh / Dust Particles */}
      <div className="hero-particles-layer">
        {particles.map((p) => (
          <span
            key={p.id}
            className="floating-mote"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* 6. Soft Horizon Vignette (Smooth Transition into page body) */}
      <div className="hero-bottom-fade" />
    </div>
  );
};
