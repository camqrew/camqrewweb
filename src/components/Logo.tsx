import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  height?: number | string;
  className?: string;
  linkTo?: string;
}

export const Logo: React.FC<LogoProps> = ({
  height = 32,
  className = '',
  linkTo,
}) => {
  const content = (
    <span className={'camcrew-brand-logo ' + className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* Light-theme logo (dark graphics for light backgrounds) */}
      <img
        src="/camcrew-logo-dark.png"
        alt="Camqrew"
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
        alt="Camqrew"
        className="logo-img logo-for-dark"
        style={{
          height,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
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
