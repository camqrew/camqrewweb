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
            <h4 className="footer-title">For Creators & Clients</h4>
            <ul className="footer-links">
              <li><Link to="/register?role=professional">Join as a Creator</Link></li>
              <li><Link to="/jobs/create">Broadcast Shoot Requirements</Link></li>
              <li><Link to="/login">Sign In to Dashboard</Link></li>
              <li><Link to="/admin">Admin Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Camcrew India Technologies Pvt Ltd. All rights reserved.</p>
          <p className="footer-credit">Built with <Heart size={14} fill="var(--danger)" color="var(--danger)" /> for Indian Creators</p>
        </div>
      </div>
    </footer>
  );
};
