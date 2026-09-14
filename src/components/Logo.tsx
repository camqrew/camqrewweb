import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  height?: number | string;
  className?: string;
  showAdminBadge?: boolean;
  linkTo?: string;
}

export const Logo: React.FC<LogoProps> = ({
  height = 32,
  className = '',
  showAdminBadge = false,
  linkTo,
}) => {
  const content = (
    <span className={'camcrew-brand-logo ' + className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* Light-theme logo (dark graphics for light backgrounds) */}
      <img
        src="/camcrew-logo-dark.png"
        alt="Camcrew"
        className="logo-img logo-for-light"
        style={{
          height,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'none',
        }}
      />
      {/* Dark-theme logo (white graphics for dark backgrounds) */}
      <img
        src="/camcrew-logo-white.png"
        alt="Camcrew"
        className="logo-img logo-for-dark"
        style={{
          height,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      {showAdminBadge && (
        <span
          className="admin-badge-pill"
          style={{
            fontSize: '11px',
            fontWeight: 800,
            background: 'rgba(63, 182, 104, 0.15)',
            color: 'var(--accent)',
            padding: '2px 8px',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            border: 'none',
            lineHeight: '1.4',
            whiteSpace: 'nowrap',
          }}
        >
          Admin
        </span>
      )}
    </span>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
        {content}
      </Link>
    );
  }

  return content;
};
