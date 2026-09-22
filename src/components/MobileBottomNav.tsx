import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Film, ShoppingBag, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useNotificationStore } from '../store/notificationStore';

export const MobileBottomNav: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const cartCount = useCartStore((s) => s.getTotalCount());
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const location = useLocation();

  // Hide on full-screen focused flows (e.g. active chat conversation, checkout modals)
  const isChatRoom = location.pathname.startsWith('/chat') && new URLSearchParams(location.search).has('userId');
  const isBookingFlow = location.pathname.startsWith('/book/');
  if (isChatRoom || isBookingFlow) {
    return null;
  }

  const accountPath = isAuthenticated ? '/dashboard' : '/login';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Bar">
      <div className="mobile-bottom-nav-inner">
        {/* Tab 1: Creators (Home) */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `mobile-nav-tab ${isActive && location.pathname === '/' ? 'active' : ''}`
          }
          end
        >
          <div className="mobile-tab-icon-wrapper">
            <Home size={21} strokeWidth={2.2} />
          </div>
          <span className="mobile-tab-label">Creators</span>
        </NavLink>

        {/* Tab 2: Categories (Explore) */}
        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `mobile-nav-tab ${isActive ? 'active' : ''}`
          }
        >
          <div className="mobile-tab-icon-wrapper">
            <LayoutGrid size={21} strokeWidth={2.2} />
          </div>
          <span className="mobile-tab-label">Explore</span>
        </NavLink>

        {/* Tab 3: Reels Feed */}
        <NavLink
          to="/reels"
          className={({ isActive }) =>
            `mobile-nav-tab ${isActive ? 'active' : ''}`
          }
        >
          <div className="mobile-tab-icon-wrapper">
            <Film size={21} strokeWidth={2.2} />
            <span className="mobile-tab-reels-pulse" />
          </div>
          <span className="mobile-tab-label">Reels</span>
        </NavLink>

        {/* Tab 4: Gear Store (Marketplace) */}
        <NavLink
          to="/marketplace"
          className={({ isActive }) =>
            `mobile-nav-tab ${isActive ? 'active' : ''}`
          }
        >
          <div className="mobile-tab-icon-wrapper">
            <ShoppingBag size={21} strokeWidth={2.2} />
            {cartCount > 0 && (
              <span className="mobile-tab-badge">{cartCount > 9 ? '9+' : cartCount}</span>
            )}
          </div>
          <span className="mobile-tab-label">Gear Store</span>
        </NavLink>

        {/* Tab 5: Account / Profile */}
        <NavLink
          to={accountPath}
          className={({ isActive }) =>
            `mobile-nav-tab ${isActive ? 'active' : ''}`
          }
        >
          <div className="mobile-tab-icon-wrapper">
            {isAuthenticated && user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="mobile-tab-avatar" />
            ) : (
              <User size={21} strokeWidth={2.2} />
            )}
            {unreadCount > 0 && <span className="mobile-tab-dot" />}
          </div>
          <span className="mobile-tab-label">Account</span>
        </NavLink>
      </div>
    </nav>
  );
};
