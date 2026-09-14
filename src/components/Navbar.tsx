import { Logo } from './Logo';
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { 
  ShoppingBag, 
  MessageSquare, 
  PlusCircle, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  ShieldCheck, 
  Briefcase, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const { user, isAuthenticated, logout, activeRole } = useAuthStore();
  const cartCount = useCartStore((s) => s.getTotalCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdown(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileDropdown(false);
        setMenuOpen(false);
      }
    };
    if (profileDropdown || menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdown, menuOpen]);

  const handleLogout = async () => {
    await logout();
    setProfileDropdown(false);
    navigate('/');
  };

  return (
    <header className={`camcrew-navbar ${menuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" title="Camcrew Home">
          <Logo height={32} />
        </Link>

        <nav className="desktop-nav">
          <NavLink to="/explore" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Explore Creators
          </NavLink>
          <NavLink to="/marketplace" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Marketplace
          </NavLink>
          <NavLink to="/jobs/create" className="nav-item broadcast-highlight">
            <PlusCircle size={16} /> Post a Job
          </NavLink>
        </nav>

        <div className="navbar-actions">
          <button onClick={toggleTheme} className="icon-btn" title="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link to="/marketplace?tab=cart" className="icon-btn cart-btn" title="Gear Cart">
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {isAuthenticated && (
            <Link to="/chat" className="icon-btn" title="Messages">
              <MessageSquare size={18} />
            </Link>
          )}

          {isAuthenticated && user ? (
            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button 
                className="user-pill-btn" 
                onClick={() => setProfileDropdown(!profileDropdown)}
                aria-expanded={profileDropdown}
                aria-haspopup="true"
              >
                <img src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'} alt={user.name} className="nav-avatar" />
                <span className="nav-user-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className={`dropdown-chevron ${profileDropdown ? 'open' : ''}`} />
              </button>

              {profileDropdown && (
                <div className="profile-menu">
                  <div className="profile-menu-header">
                    <p className="pm-name">{user.name}</p>
                    <span className="pm-role-badge">{user.role.toUpperCase()}</span>
                  </div>

                  <hr className="pm-divider" />

                  <Link 
                    to="/dashboard?tab=bookings" 
                    className="pm-link"
                    onClick={() => setProfileDropdown(false)}
                  >
                    <User size={16} /> My Bookings & Jobs
                  </Link>

                  {(user.role === 'professional' || activeRole === 'professional') && (
                    <Link 
                      to="/dashboard?tab=jobboard" 
                      className="pm-link"
                      onClick={() => setProfileDropdown(false)}
                    >
                      <Briefcase size={16} /> Creator Job Board
                    </Link>
                  )}

                  {user.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="pm-link"
                      onClick={() => setProfileDropdown(false)}
                    >
                      <ShieldCheck size={16} /> Admin Portal
                    </Link>
                  )}

                  <hr className="pm-divider" />

                  <button className="pm-link logout-link" onClick={handleLogout}>
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
              <Link to="/register?role=professional" className="btn btn-primary btn-sm">Join as Pro</Link>
            </div>
          )}

          <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-drawer">
          <Link to="/explore" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            Explore Creators
          </Link>
          <Link to="/marketplace" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            Marketplace
          </Link>
          <Link to="/jobs/create" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            + Post a Broadcast Job
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                My Dashboard
              </Link>
              <Link to="/chat" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                Messages
              </Link>
              <button className="mobile-nav-link logout-link" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <div className="mobile-auth-box">
              <Link to="/login" className="btn btn-outline" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
