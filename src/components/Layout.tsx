import { Logo } from './Logo';
import { NavLink, Outlet, Link } from 'react-router-dom';
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
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { CursorBackgroundFollower } from './CursorBackgroundFollower';

interface LayoutProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Layout = ({ theme, toggleTheme }: LayoutProps) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="app-container">
      <CursorBackgroundFollower />
      <nav className="sidebar">
        <div className="sidebar-logo" style={{ padding: '0 8px', marginBottom: 32 }}>
          <Logo height={26} showAdminBadge linkTo="/admin" />
        </div>
        
        <NavLink to="/admin" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        
        <NavLink to="/admin/inventory" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Package size={20} /> Inventory
        </NavLink>

        <NavLink to="/admin/verifications" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <ShieldAlert size={20} /> Verifications
        </NavLink>

        <NavLink to="/admin/subscriptions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Users size={20} /> Subscriptions
        </NavLink>

        <NavLink to="/admin/orders" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Package size={20} /> Orders
        </NavLink>

        <NavLink to="/admin/disputes" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <ShieldAlert size={20} /> Disputes
        </NavLink>

        <hr style={{ margin: '16px 0', borderColor: 'var(--border)' }} />

        <Link to="/" className="nav-link" style={{ color: 'var(--accent)' }}>
          <ArrowLeft size={20} /> Back to Main Site
        </Link>
      </nav>

      <main className="main-content">
        <header className="top-header">
          <div className="omni-search">
            <Search size={20} />
            <input type="text" className="input-field" placeholder="Omni-Search (Ctrl+K)" />
          </div>
          
          <div className="header-actions">
            <button className="btn" onClick={toggleTheme} style={{ padding: 12, borderRadius: '50%' }}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="btn" style={{ padding: 12, borderRadius: '50%' }}>
              <Bell size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--accent)' }}></div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Admin Portal</span>
            </div>
            <button className="btn" onClick={handleLogout} style={{ padding: 12, borderRadius: '50%' }} title="Logout">
              <LogOut size={20} color="var(--danger)" />
            </button>
          </div>
        </header>

        <div className="page-container">
          <Outlet />
        </div>
      </main>

      <div className="fab-container">
        <button className="fab-main">
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};
