import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Film, ShoppingBag, User, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export const MobileTabBar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user, activeRole } = useAuthStore();
  const cartCount = useCartStore((s) => s.getTotalCount());
  const isPro = isAuthenticated && (user?.role === 'professional' || activeRole === 'professional');

  // Do not render on admin routes, booking checkout, or chat screens
  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/book') ||
    location.pathname.startsWith('/chat')
  ) {
    return null;
  }

  const accountPath = isAuthenticated
    ? (isPro ? '/dashboard?tab=overview' : '/dashboard?tab=bookings')
    : '/login';

  return (
    <nav className="camcrew-mobile-tab-bar" aria-label="Mobile Navigation">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `mobile-tab-item ${isActive && location.pathname === '/' ? 'active' : ''}`
        }
      >
        <div className="tab-icon-wrap">
          <Home size={20} />
        </div>
        <span className="tab-label">Home</span>
      </NavLink>

      <NavLink
        to="/explore"
        className={({ isActive }) =>
          `mobile-tab-item ${isActive || location.pathname.startsWith('/creators') ? 'active' : ''}`
        }
      >
        <div className="tab-icon-wrap">
          <Compass size={20} />
        </div>
        <span className="tab-label">Explore</span>
      </NavLink>

      <NavLink
        to="/reels"
        className={({ isActive }) =>
          `mobile-tab-item ${isActive ? 'active' : ''}`
        }
      >
        <div className="tab-icon-wrap reels-tab-icon">
          <Film size={20} />
          <span className="tab-live-dot" />
        </div>
        <span className="tab-label">Reels</span>
      </NavLink>

      <NavLink
        to="/marketplace"
        className={({ isActive }) =>
          `mobile-tab-item ${isActive || location.pathname.startsWith('/marketplace') || location.pathname.startsWith('/products') ? 'active' : ''}`
        }
      >
        <div className="tab-icon-wrap">
          <ShoppingBag size={20} />
          {cartCount > 0 && <span className="tab-cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
        </div>
        <span className="tab-label">Market</span>
      </NavLink>

      <NavLink
        to={accountPath}
        className={({ isActive }) =>
          `mobile-tab-item ${isActive || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/login') || location.pathname.startsWith('/register') ? 'active' : ''}`
        }
      >
        <div className="tab-icon-wrap">
          {isPro ? <LayoutDashboard size={20} /> : <User size={20} />}
        </div>
        <span className="tab-label">{isAuthenticated ? (isPro ? 'Studio' : 'Account') : 'Sign In'}</span>
      </NavLink>
    </nav>
  );
};
