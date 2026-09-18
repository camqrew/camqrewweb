import { Logo } from './Logo';
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="camcrew-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <Logo height={28} linkTo="/" />
            </div>
            <p className="footer-desc">
              India's premier marketplace for creative talent, video production crews, and cinema equipment rentals. Backed by automated milestone escrow.
            </p>
            <div className="escrow-badge-pill">
              <ShieldCheck size={16} color="var(--accent)" />
              <span>100% Escrow Protection Guaranteed</span>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Explore Creators</h4>
            <ul className="footer-links">
              <li><Link to="/explore?category=Photographers">Wedding Photographers</Link></li>
              <li><Link to="/explore?category=Videographers">Cinematographers & Videographers</Link></li>
              <li><Link to="/explore?category=Drone+Pilots">Certified Drone Pilots</Link></li>
              <li><Link to="/explore?category=Editors">Post-Production & Editors</Link></li>
              <li><Link to="/explore?category=Fashion">Fashion & Editorial Photographers</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Gear Marketplace</h4>
            <ul className="footer-links">
              <li><Link to="/marketplace?type=rental&category=Cameras">Cinema Cameras for Rent</Link></li>
              <li><Link to="/marketplace?type=rental&category=Lenses">Prime & Zoom Lenses</Link></li>
              <li><Link to="/marketplace?type=rental&category=Lighting">Lighting Rigs & Modifiers</Link></li>
              <li><Link to="/marketplace?type=sale">Buy Certified Used Gear</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Trust & Compliance</h4>
            <ul className="footer-links">
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/legal?section=escrow">Milestone Escrow Rules</Link></li>
              <li><Link to="/legal?section=cancellation">Cancellation & Refunds</Link></li>
              <li><Link to="/privacy">Privacy Policy (DPDP)</Link></li>
              <li><Link to="/legal?section=deletion">Account Deletion Rights</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-legal-links" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10, fontSize: 12 }}>
            <Link to="/terms" style={{ color: 'var(--text-muted)' }}>Terms of Service</Link>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <Link to="/legal?section=escrow" style={{ color: 'var(--text-muted)' }}>Escrow Terms</Link>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <Link to="/legal?section=cancellation" style={{ color: 'var(--text-muted)' }}>Cancellation Policy</Link>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <Link to="/privacy" style={{ color: 'var(--text-muted)' }}>Privacy Policy</Link>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <Link to="/legal?section=deletion" style={{ color: 'var(--text-muted)' }}>Data Erasure</Link>
          </div>
          <p>© {new Date().getFullYear()} Camqrew India Technologies Pvt Ltd. All rights reserved.</p>
          <p className="footer-credit">Built with <Heart size={14} fill="var(--danger)" color="var(--danger)" /> for Indian Creators</p>
        </div>
      </div>
    </footer>
  );
};
