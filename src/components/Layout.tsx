import { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShieldAlert, 
  Sun, 
  Moon, 
  Search, 
  Bell, 
  Plus, 
  LogOut,
  ArrowLeft,
  X,
  Menu,
  ChevronRight,
  Command,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Layout = ({ theme, toggleTheme }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Command palette state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notification popover state
  const [notifsOpen, setNotifsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // FAB quick action menu state
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Platform alert stats for notification badge & sidebar counts
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [activeDisputes, setActiveDisputes] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  // Fetch real-time operational alerts
  useEffect(() => {
    async function fetchAlerts() {
      try {
        // Pending verifications
        const { count: verifCount } = await supabase
          .from('professional_profiles')
          .select('id', { count: 'exact', head: true })
          .or('verified.is.null,verified.eq.false');
        setPendingVerifications(verifCount || 0);

        // Low stock products
        const { count: stockCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .or('in_stock.eq.false,stock_quantity.lte.3');
        setLowStockCount(stockCount || 0);

        // Active disputes
        const { count: disputeCount } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('status', ['cancelled', 'flagged']);
        setActiveDisputes(disputeCount || 0);

        // Pending orders
        const { count: ordersCount } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'accepted']);
        setPendingOrders(ordersCount || 0);
      } catch (e) {
        console.error('Failed to load admin notification alerts', e);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Global Ctrl+K keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifsOpen(false);
        setFabOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifsOpen(false);
      }
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const totalNotifications = pendingVerifications + lowStockCount + activeDisputes;

  // Command palette search actions
  const commandPaletteItems = [
    { title: 'Dashboard Overview', desc: 'Real-time revenue, users, and platform analytics', icon: LayoutDashboard, path: '/admin', category: 'Navigation' },
    { title: 'Inventory Management', desc: 'Gear catalogue, products for sale, and stock limits', icon: Package, path: '/admin/inventory', category: 'Operations' },
    { title: 'Add New Product', desc: 'Create a new gear listing in the official store', icon: Plus, path: '/admin/inventory?action=new', category: 'Quick Action' },
    { title: 'Verification Queue', desc: `${pendingVerifications} professionals awaiting KYC approval`, icon: ShieldCheck, path: '/admin/verifications', category: 'Trust & Safety', badge: pendingVerifications },
    { title: 'Order Tracking & Shiprocket', desc: 'Equipment purchases, logistics, and service bookings', icon: Truck, path: '/admin/orders', category: 'Commerce', badge: pendingOrders },
    { title: 'Dispute Resolution', desc: `${activeDisputes} flagged bookings or refund requests`, icon: ShieldAlert, path: '/admin/disputes', category: 'Trust & Safety', badge: activeDisputes },
    { title: 'User Control & Subscriptions', desc: 'User directories, account roles, and status changes', icon: Users, path: '/admin/subscriptions', category: 'Community' },
    { title: 'Marketplace Front Store', desc: 'Open consumer-facing marketplace storefront', icon: ExternalLink, path: '/marketplace', category: 'Main Website' },
    { title: 'Post a Custom Job Broadcast', desc: 'Broadcast a job to creators on the platform', icon: Plus, path: '/jobs/create', category: 'Quick Action' },
    { title: 'Toggle Light / Dark Mode', desc: `Currently using ${theme} mode`, icon: theme === 'dark' ? Sun : Moon, action: toggleTheme, category: 'Preferences' }
  ];

  const filteredCommands = commandPaletteItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  return (
    <div className="admin-app-layout">
      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="admin-mobile-overlay" 
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Logo height={24} showAdminBadge linkTo="/admin" />
          <button 
            type="button"
            className="admin-mobile-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-sidebar-nav-scroll">
          {/* Section: Overview */}
          <div className="admin-nav-section-label">Overview</div>
          <NavLink 
            to="/admin" 
            end 
            className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
          >
            <div className="admin-nav-link-content">
              <LayoutDashboard size={19} className="admin-nav-icon" />
              <span>Dashboard</span>
            </div>
          </NavLink>

          {/* Section: Commerce & Operations */}
          <div className="admin-nav-section-label">Operations</div>
          <NavLink 
            to="/admin/inventory" 
            className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
          >
            <div className="admin-nav-link-content">
              <Package size={19} className="admin-nav-icon" />
              <span>Inventory</span>
            </div>
            {lowStockCount > 0 && (
              <span className="admin-nav-badge badge-warning" title={`${lowStockCount} items need stock`}>
                {lowStockCount}
              </span>
            )}
          </NavLink>

          <NavLink 
            to="/admin/orders" 
            className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
          >
            <div className="admin-nav-link-content">
              <Truck size={19} className="admin-nav-icon" />
              <span>Orders & Logistics</span>
            </div>
            {pendingOrders > 0 && (
              <span className="admin-nav-badge badge-accent">
                {pendingOrders}
              </span>
            )}
          </NavLink>

          {/* Section: Trust & Safety */}
          <div className="admin-nav-section-label">Trust & Safety</div>
          <NavLink 
            to="/admin/verifications" 
            className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
          >
            <div className="admin-nav-link-content">
              <ShieldCheck size={19} className="admin-nav-icon" />
              <span>Verifications</span>
            </div>
            {pendingVerifications > 0 && (
              <span className="admin-nav-badge badge-warning" title={`${pendingVerifications} pending KYC approvals`}>
                {pendingVerifications}
              </span>
            )}
          </NavLink>

          <NavLink 
            to="/admin/disputes" 
            className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
          >
            <div className="admin-nav-link-content">
              <ShieldAlert size={19} className="admin-nav-icon" />
              <span>Disputes & Escrow</span>
            </div>
            {activeDisputes > 0 && (
              <span className="admin-nav-badge badge-danger" title={`${activeDisputes} flagged bookings`}>
                {activeDisputes}
              </span>
            )}
          </NavLink>

          {/* Section: Community */}
          <div className="admin-nav-section-label">Community</div>
          <NavLink 
            to="/admin/subscriptions" 
            className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
          >
            <div className="admin-nav-link-content">
              <Users size={19} className="admin-nav-icon" />
              <span>Users & Roles</span>
            </div>
          </NavLink>
        </div>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-back-site-btn">
            <ArrowLeft size={16} />
            <span>Return to Main Site</span>
          </Link>

          <div className="admin-profile-chip">
            <div className="admin-profile-avatar">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="admin-profile-info">
              <div className="admin-profile-name">{user?.name || 'Administrator'}</div>
              <div className="admin-profile-role">Super Admin</div>
            </div>
            <button 
              type="button" 
              onClick={handleLogout} 
              className="admin-logout-btn" 
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Wrapper */}
      <div className="admin-main-wrap">
        {/* Top Header Bar */}
        <header className="admin-top-bar">
          <div className="admin-top-left">
            <button 
              type="button" 
              className="admin-mobile-menu-btn" 
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open Navigation"
            >
              <Menu size={20} />
            </button>

            {/* Omni-Search Trigger Button */}
            <button 
              type="button" 
              className="admin-search-trigger"
              onClick={() => setSearchOpen(true)}
              title="Quick Search or Jump to Section (Ctrl+K)"
            >
              <div className="search-field-icon-wrap">
                <Search size={14} />
              </div>
              <span className="admin-search-text">Search commands, pages, or gear...</span>
              <kbd className="admin-search-kbd">
                <Command size={11} /> K
              </kbd>
            </button>
          </div>

          <div className="admin-top-actions">
            {/* Quick Add Action Button */}
            <button 
              type="button" 
              className="admin-btn-action admin-btn-add-quick" 
              onClick={() => navigate('/admin/inventory?action=new')}
              title="Add Gear to Catalogue"
            >
              <Plus size={16} />
              <span>Add Product</span>
            </button>

            {/* Theme Toggle Button */}
            <button 
              type="button" 
              className="admin-icon-btn" 
              onClick={toggleTheme} 
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Center Popover */}
            <div className="admin-notif-wrapper" ref={notifRef}>
              <button 
                type="button" 
                className={`admin-icon-btn ${totalNotifications > 0 ? 'has-badge' : ''}`}
                onClick={() => setNotifsOpen(prev => !prev)}
                title="Platform Notifications"
              >
                <Bell size={18} />
                {totalNotifications > 0 && (
                  <span className="admin-bell-dot" />
                )}
              </button>

              {notifsOpen && (
                <div className="admin-notif-popover">
                  <div className="admin-notif-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bell size={16} color="var(--accent)" />
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Operational Alerts</span>
                    </div>
                    <span className="admin-notif-badge">
                      {totalNotifications} active
                    </span>
                  </div>

                  <div className="admin-notif-list">
                    {pendingVerifications > 0 && (
                      <div 
                        className="admin-notif-item" 
                        onClick={() => { setNotifsOpen(false); navigate('/admin/verifications'); }}
                      >
                        <div className="notif-icon-box warning">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="notif-text-box">
                          <div className="notif-title">KYC Verifications Pending</div>
                          <div className="notif-sub">{pendingVerifications} professional profiles awaiting credential review</div>
                        </div>
                        <ChevronRight size={14} className="notif-arrow" />
                      </div>
                    )}

                    {lowStockCount > 0 && (
                      <div 
                        className="admin-notif-item" 
                        onClick={() => { setNotifsOpen(false); navigate('/admin/inventory'); }}
                      >
                        <div className="notif-icon-box warning">
                          <AlertTriangle size={16} />
                        </div>
                        <div className="notif-text-box">
                          <div className="notif-title">Low Stock Alert</div>
                          <div className="notif-sub">{lowStockCount} items have zero or critically low inventory</div>
                        </div>
                        <ChevronRight size={14} className="notif-arrow" />
                      </div>
                    )}

                    {activeDisputes > 0 && (
                      <div 
                        className="admin-notif-item" 
                        onClick={() => { setNotifsOpen(false); navigate('/admin/disputes'); }}
                      >
                        <div className="notif-icon-box danger">
                          <ShieldAlert size={16} />
                        </div>
                        <div className="notif-text-box">
                          <div className="notif-title">Active Escrow Disputes</div>
                          <div className="notif-sub">{activeDisputes} customer or creator flagged incidents</div>
                        </div>
                        <ChevronRight size={14} className="notif-arrow" />
                      </div>
                    )}

                    {totalNotifications === 0 && (
                      <div className="admin-notif-empty">
                        <CheckCircle2 size={28} color="var(--accent, #3fb668)" />
                        <div style={{ fontWeight: 600, fontSize: 13, marginTop: 8 }}>All Systems Nominal</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No urgent platform disputes or pending approvals.</div>
                      </div>
                    )}
                  </div>

                  <div className="admin-notif-footer">
                    <button 
                      type="button" 
                      className="admin-notif-viewall-btn"
                      onClick={() => { setNotifsOpen(false); navigate('/admin'); }}
                    >
                      View Platform Pulse →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Main Site Link */}
            <Link 
              to="/" 
              className="admin-icon-btn" 
              title="Open Camqrew Home"
            >
              <ExternalLink size={18} />
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="admin-content-viewport">
          <Outlet />
        </main>
      </div>

      {/* Floating Action Button (FAB) with Menu */}
      <div className="admin-fab-container" ref={fabRef}>
        {fabOpen && (
          <div className="admin-fab-menu">
            <button 
              type="button" 
              className="admin-fab-action-item"
              onClick={() => { setFabOpen(false); navigate('/admin/inventory?action=new'); }}
            >
              <span className="fab-action-label">Add Product for Sale</span>
              <div className="fab-action-icon-circle accent">
                <Package size={16} />
              </div>
            </button>

            <button 
              type="button" 
              className="admin-fab-action-item"
              onClick={() => { setFabOpen(false); navigate('/admin/verifications'); }}
            >
              <span className="fab-action-label">Verify Profiles ({pendingVerifications})</span>
              <div className="fab-action-icon-circle warning">
                <ShieldCheck size={16} />
              </div>
            </button>

            <button 
              type="button" 
              className="admin-fab-action-item"
              onClick={() => { setFabOpen(false); navigate('/jobs/create'); }}
            >
              <span className="fab-action-label">Post Job Lead</span>
              <div className="fab-action-icon-circle primary">
                <Plus size={16} />
              </div>
            </button>
          </div>
        )}

        <button 
          type="button" 
          className={`admin-fab-trigger ${fabOpen ? 'active' : ''}`}
          onClick={() => setFabOpen(prev => !prev)}
          title="Quick Actions"
          aria-label="Quick Actions"
        >
          <Plus size={24} className="admin-fab-icon" />
        </button>
      </div>

      {/* Command Palette Modal (Ctrl+K) */}
      {searchOpen && (
        <div className="admin-palette-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="admin-palette-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-palette-input-box">
              <div className="search-field-icon-wrap palette">
                <Search size={16} />
              </div>
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a command, page name, or action..."
                className="admin-palette-input"
              />
              <button 
                type="button" 
                onClick={() => setSearchOpen(false)} 
                className="palette-close-btn"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-palette-results">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  return (
                    <div 
                      key={idx}
                      className="admin-palette-item"
                      onClick={() => {
                        setSearchOpen(false);
                        if (cmd.action) {
                          cmd.action();
                        } else if (cmd.path) {
                          navigate(cmd.path);
                        }
                      }}
                    >
                      <div className="palette-item-icon">
                        <Icon size={18} />
                      </div>
                      <div className="palette-item-text">
                        <div className="palette-item-title-row">
                          <span className="palette-item-title">{cmd.title}</span>
                          <span className="palette-item-category">{cmd.category}</span>
                        </div>
                        <div className="palette-item-desc">{cmd.desc}</div>
                      </div>
                      {typeof cmd.badge === 'number' && cmd.badge > 0 && (
                        <span className="palette-badge">{cmd.badge}</span>
                      )}
                      <ChevronRight size={14} className="palette-item-arrow" />
                    </div>
                  );
                })
              ) : (
                <div className="admin-palette-empty">
                  No commands or pages matching "{searchQuery}"
                </div>
              )}
            </div>

            <div className="admin-palette-footer">
              <span>Navigation: <kbd>↑</kbd> <kbd>↓</kbd></span>
              <span>Open: <kbd>↵ Enter</kbd></span>
              <span>Dismiss: <kbd>Esc</kbd></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
