import React, { useEffect, useRef } from 'react';

/**
 * CursorBackgroundFollower
 * 
 * Provides an ultra-subtle, architectural gradient white grid design that
 * smoothly illuminates around the user's cursor across the Camqrew web application.
 * 
 * Features:
 * - Gradient white grid illuminated by dynamic radial cursor spotlight
 * - Luminous grid intersection coordinate points
 * - Soft ambient gradient white underlight beam
 * - 20% delicate ambient opacity with zero center dot
 * - Click position stabilization: coordinates stay locked right where clicked
 * - 100% pointer-events: none (zero interference with any buttons, inputs, links, or modals)
 * - Direct GPU-accelerated requestAnimationFrame transform updates (zero React re-render overhead)
 */
export const CursorBackgroundFollower: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);

  // Target mouse coordinates
  const targetPos = useRef({ x: -500, y: -500 });

  // Interpolated coordinates for smooth spring physics
  const pos = useRef({ x: -500, y: -500 });

  const isInitialized = useRef(false);
  const isClicking = useRef(false);

  useEffect(() => {
    // Check if device supports fine pointer (mouse)
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer) return;

    let animFrameId: number;

    const lerp = (current: number, target: number, factor: number) => {
      return current + (target - current) * factor;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      targetPos.current.x = clientX;
      targetPos.current.y = clientY;

      if (!isInitialized.current) {
        isInitialized.current = true;
        // Snap immediately to initial position to prevent any jump from offscreen
        pos.current.x = clientX;
        pos.current.y = clientY;

        if (containerRef.current) {
          containerRef.current.classList.add('follower-active');
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Ensure target position is the exact click coordinates
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;
      isClicking.current = true;

      if (containerRef.current) {
        containerRef.current.classList.add('grid-clicked');
      }
    };

    const handleMouseUp = () => {
      isClicking.current = false;
      if (containerRef.current) {
        containerRef.current.classList.remove('grid-clicked');
      }
    };

    const handleMouseLeave = () => {
      if (containerRef.current) {
        containerRef.current.classList.remove('follower-active');
      }
    };

    const handleMouseEnter = () => {
      if (isInitialized.current && containerRef.current) {
        containerRef.current.classList.add('follower-active');
      }
    };

    const renderLoop = () => {
      if (isInitialized.current) {
        // Grid spotlight tracks with fluid responsiveness (0.16)
        pos.current.x = lerp(pos.current.x, targetPos.current.x, 0.16);
        pos.current.y = lerp(pos.current.y, targetPos.current.y, 0.16);

        // Update CSS variables for radial mask on container
        if (containerRef.current) {
          containerRef.current.style.setProperty('--mouse-x', `${pos.current.x}px`);
          containerRef.current.style.setProperty('--mouse-y', `${pos.current.y}px`);
          const radius = isClicking.current ? '390px' : '320px';
          containerRef.current.style.setProperty('--grid-radius', radius);
        }

        // Soft underlight beam (500px diameter, offset by 250px)
        if (beamRef.current) {
          const beamScale = isClicking.current ? 1.25 : 1;
          beamRef.current.style.transform = `translate3d(${pos.current.x - 250}px, ${pos.current.y - 250}px, 0) scale(${beamScale})`;
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    animFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="cursor-bg-follower-root" 
      aria-hidden="true"
    >
      {/* 1. Subtle Ambient Base Grid across entire canvas */}
      <div className="cursor-grid-base" />

      {/* 2. Soft Ambient Gradient White Underlight Beam */}
      <div ref={beamRef} className="cursor-grid-beam" />

      {/* 3. Interactive Gradient White Grid Spotlight (Revealed around cursor) */}
      <div className="cursor-grid-spotlight" />
    </div>
  );
};
export default CursorBackgroundFollower;
