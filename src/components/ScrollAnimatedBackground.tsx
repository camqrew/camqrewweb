import React, { useEffect, useState } from 'react';

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

export const ScrollAnimatedBackground: React.FC = () => {
  const [scrollState, setScrollState] = useState<{ y: number; progress: number }>({ y: 0, progress: 0 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 30 });

  // 18 deterministic cinematic light bokeh / dust particles
  const particles: Particle[] = [
    { id: 1, left: 8, top: 20, size: 4, duration: 18, delay: -2, opacity: 0.6, color: '#3fb668' },
    { id: 2, left: 18, top: 60, size: 6, duration: 22, delay: -9, opacity: 0.5, color: '#30b0c7' },
    { id: 3, left: 28, top: 40, size: 3, duration: 16, delay: -4, opacity: 0.7, color: '#ffffff' },
    { id: 4, left: 38, top: 78, size: 5, duration: 20, delay: -14, opacity: 0.6, color: '#3fb668' },
    { id: 5, left: 48, top: 25, size: 7, duration: 24, delay: -7, opacity: 0.45, color: '#f59e0b' },
    { id: 6, left: 58, top: 85, size: 4, duration: 19, delay: -11, opacity: 0.6, color: '#30b0c7' },
    { id: 7, left: 68, top: 35, size: 5, duration: 21, delay: -5, opacity: 0.5, color: '#3fb668' },
    { id: 8, left: 78, top: 70, size: 3, duration: 17, delay: -15, opacity: 0.7, color: '#ffffff' },
    { id: 9, left: 88, top: 15, size: 8, duration: 26, delay: -8, opacity: 0.4, color: '#30b0c7' },
    { id: 10, left: 14, top: 90, size: 4, duration: 18, delay: -13, opacity: 0.6, color: '#3fb668' },
    { id: 11, left: 24, top: 10, size: 6, duration: 23, delay: -3, opacity: 0.45, color: '#f59e0b' },
    { id: 12, left: 34, top: 52, size: 3, duration: 15, delay: -10, opacity: 0.65, color: '#ffffff' },
    { id: 13, left: 52, top: 95, size: 5, duration: 21, delay: -16, opacity: 0.5, color: '#3fb668' },
    { id: 14, left: 64, top: 58, size: 4, duration: 19, delay: -6, opacity: 0.55, color: '#30b0c7' },
    { id: 15, left: 74, top: 12, size: 6, duration: 22, delay: -12, opacity: 0.4, color: '#6366f1' },
    { id: 16, left: 84, top: 82, size: 5, duration: 20, delay: -1, opacity: 0.6, color: '#3fb668' },
    { id: 17, left: 92, top: 48, size: 3, duration: 16, delay: -8, opacity: 0.7, color: '#ffffff' },
    { id: 18, left: 44, top: 68, size: 6, duration: 25, delay: -15, opacity: 0.45, color: '#f59e0b' },
  ];

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY || document.documentElement.scrollTop;
          const maxScroll = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            1
          );
          const progress = Math.min(Math.max(currentScroll / maxScroll, 0), 1);
          setScrollState({ y: currentScroll, progress });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="page-scroll-animated-bg"
      style={{
        '--scroll-y': `${scrollState.y}px`,
        '--scroll-num': scrollState.y,
        '--scroll-progress': scrollState.progress,
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`,
      } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* 1. Global Interactive Ambient Spotlight */}
      <div className="scroll-interactive-spotlight" />

      {/* 2. Full-Page Parallax Aurora Orbs Layer */}
      <div className="scroll-orbs-container">
        {/* Top Hero Zone Orbs */}
        <div className="scroll-orb orb-top-emerald" />
        <div className="scroll-orb orb-top-cyan" />

        {/* Mid-Page Zone Orbs (Broadcast / Categories) */}
        <div className="scroll-orb orb-mid-violet" />
        <div className="scroll-orb orb-mid-emerald" />

        {/* Lower-Page Zone Orbs (Featured Pros / Reviews / Footer) */}
        <div className="scroll-orb orb-bottom-amber" />
        <div className="scroll-orb orb-bottom-teal" />
      </div>

      {/* 3. Subtle Continuous Production Dot Matrix */}
      <div className="scroll-grid-matrix" />

      {/* 4. Cinematic Rotating Camera Lens Rings with Scroll Parallax */}
      <div className="scroll-lens-reticle-wrap primary-lens">
        <svg
          className="scroll-lens-svg"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Lens Diameter Ring - Spins clockwise with scroll */}
          <circle
            cx="400"
            cy="400"
            r="360"
            className="scroll-lens-ring scroll-outer-ring"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="6 14"
          />
          {/* Aperture Distance Ring - Counter-rotates with scroll */}
          <circle
            cx="400"
            cy="400"
            r="270"
            className="scroll-lens-ring scroll-middle-ring"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 18"
          />
          {/* Inner Viewfinder Ring */}
          <circle
            cx="400"
            cy="400"
            r="180"
            className="scroll-lens-ring scroll-inner-ring"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="12 24"
          />
          {/* Viewfinder Cardinal Ticks */}
          <line x1="400" y1="20" x2="400" y2="40" stroke="currentColor" strokeWidth="1.5" className="scroll-reticle-tick" />
          <line x1="400" y1="760" x2="400" y2="780" stroke="currentColor" strokeWidth="1.5" className="scroll-reticle-tick" />
          <line x1="20" y1="400" x2="40" y2="400" stroke="currentColor" strokeWidth="1.5" className="scroll-reticle-tick" />
          <line x1="760" y1="400" x2="780" y2="400" stroke="currentColor" strokeWidth="1.5" className="scroll-reticle-tick" />
        </svg>
      </div>

      {/* Secondary Distant Aperture Ring (Deeper Parallax in Mid-Page) */}
      <div className="scroll-lens-reticle-wrap secondary-lens">
        <svg
          className="scroll-lens-svg"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="300"
            cy="300"
            r="250"
            className="scroll-lens-ring secondary-outer-ring"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 16"
          />
          <circle
            cx="300"
            cy="300"
            r="160"
            className="scroll-lens-ring secondary-inner-ring"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="8 20"
          />
        </svg>
      </div>

      {/* 5. Floating Cinematic Bokeh Particles Layer */}
      <div className="scroll-particles-layer">
        {particles.map((p) => (
          <span
            key={p.id}
            className="scroll-floating-mote"
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
    </div>
  );
};
