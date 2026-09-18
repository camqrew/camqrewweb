import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  RotateCcw, 
  Camera, 
  Package, 
  Trash2, 
  Scale, 
  AlertTriangle,
  Mail
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

type LegalSection = 'terms' | 'escrow' | 'cancellation' | 'copyright' | 'rentals' | 'privacy' | 'deletion';

export const LegalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = (searchParams.get('section') || searchParams.get('tab') || 'terms') as LegalSection;
  const [activeSection, setActiveSection] = useState<LegalSection>(initialSection);

  useEffect(() => {
    const s = searchParams.get('section') || searchParams.get('tab');
    if (s && ['terms', 'escrow', 'cancellation', 'copyright', 'rentals', 'privacy', 'deletion'].includes(s)) {
      setActiveSection(s as LegalSection);
    }
  }, [searchParams]);

  const handleSelectSection = (sec: LegalSection) => {
    setActiveSection(sec);
    setSearchParams({ section: sec });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="legal-page-container">
      <SEOHead 
        title="Legal, Compliance & Terms of Service"
        description="Comprehensive Terms of Service, Milestone Escrow Rules, DPDP 2023 Privacy Policy, and Shoot Contracts for Camcrew India."
      />

      {/* Header Banner */}
      <div className="legal-hero-banner">
        <div className="container">
          <div className="legal-hero-badge">
            <Scale size={16} color="var(--accent)" />
            <span>Legal, Privacy & Compliance Center</span>
          </div>
          <h1 className="legal-hero-title">Camcrew Terms, Policies & Escrow Protection</h1>
          <p className="legal-hero-sub">
            Clear, transparent, and legally binding guidelines compliant with the Indian Contract Act 1872, Information Technology Act 2000, and Digital Personal Data Protection (DPDP) Act 2023.
          </p>
          <div className="legal-hero-meta">
            <span>Last Updated: September 2026</span>
            <span className="dot">•</span>
            <span>Version: 3.2 (Production Standard)</span>
          </div>
        </div>
      </div>

      <div className="container legal-content-wrapper">
        <div className="legal-layout-grid">
          
          {/* Navigation Sidebar */}
          <aside className="legal-sidebar">
            <div className="card legal-nav-card">
              <h3 className="legal-nav-header">Legal Documents</h3>
              <nav className="legal-nav-list">
                <button 
                  className={`legal-nav-item ${activeSection === 'terms' ? 'active' : ''}`}
                  onClick={() => handleSelectSection('terms')}
                >
                  <FileText size={18} />
                  <span>Terms of Service</span>
                </button>

                <button 
                  className={`legal-nav-item ${activeSection === 'escrow' ? 'active' : ''}`}
                  onClick={() => handleSelectSection('escrow')}
                >
                  <Lock size={18} />
                  <span>3-Stage Escrow Rules</span>
                </button>

                <button 
                  className={`legal-nav-item ${activeSection === 'cancellation' ? 'active' : ''}`}
                  onClick={() => handleSelectSection('cancellation')}
                >
                  <RotateCcw size={18} />
                  <span>Cancellation & Refunds</span>
                </button>

                <button 
                  className={`legal-nav-item ${activeSection === 'copyright' ? 'active' : ''}`}
                  onClick={() => handleSelectSection('copyright')}
                >
                  <Camera size={18} />
                  <span>Creator IP & Copyright</span>
                </button>

                <button 
                  className={`legal-nav-item ${activeSection === 'rentals' ? 'active' : ''}`}
                  onClick={() => handleSelectSection('rentals')}
                >
                  <Package size={18} />
                  <span>Gear Rental Agreement</span>
                </button>

                <button 
                  className={`legal-nav-item ${activeSection === 'privacy' ? 'active' : ''}`}
                  onClick={() => handleSelectSection('privacy')}
                >
                  <ShieldCheck size={18} />
                  <span>Privacy Policy (DPDP)</span>
                </button>

                <button 
                  className={`legal-nav-item ${activeSection === 'deletion' ? 'active' : ''}`}
                  onClick={() => handleSelectSection('deletion')}
                >
                  <Trash2 size={18} />
                  <span>Account Deletion Rights</span>
                </button>
              </nav>

              <div className="legal-support-box">
                <Mail size={16} color="var(--accent)" />
                <div>
                  <strong>Legal & Grievance Cell</strong>
                  <p>legal@camcrew.in</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Document Content Area */}
          <main className="legal-main-content">
            <div className="card legal-document-card">
              
              {/* 1. TERMS OF SERVICE */}
              {activeSection === 'terms' && (
                <article className="legal-article">
                  <span className="legal-doc-badge">Document Ref: CC-LEGAL-TOS-2026</span>
                  <h2>Terms of Service</h2>
                  <p className="lead-text">
                    Welcome to Camcrew India Technologies Pvt Ltd (&quot;Camcrew&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing or using the Camcrew web platform, mobile applications, or associated escrow services, you agree to be bound by these Terms of Service.
                  </p>

                  <section className="legal-section">
                    <h3>1. Intermediary Status under IT Act 2000</h3>
                    <p>
                      Camcrew operates as an electronic marketplace and communications intermediary under Section 79 of the Information Technology Act, 2000. Camcrew provides an algorithmic discovery engine, verified identity badging, milestone escrow management, and automated shoot contracting to facilitate agreements between independent Creative Specialists (&quot;Creators&quot;) and Clients (&quot;Producers&quot; or &quot;Customers&quot;).
                    </p>
                  </section>

                  <section className="legal-section">
                    <h3>2. Eligibility & Account Verification</h3>
                    <p>
                      Users must be at least 18 years of age. All Creators offering paid cinema, photography, and aerial drone services certify that they possess genuine portfolio rights and applicable government licenses (including DGCA Remote Pilot Certification for drone operations). Camcrew reserves the right to suspend or terminate accounts providing fraudulent credentials or misrepresenting equipment rosters.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h3>3. Contractual Relationship</h3>
                    <p>
                      When a Client books a Creator on Camcrew, a legally binding Production Service Agreement is formed directly between the Client and the Creator, governed by the Indian Contract Act, 1872. Camcrew acts as the designated escrow holding agent and neutral arbitrator for milestone releases.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h3>4. Platform Fees & Commission</h3>
                    <p>
                      Camcrew charges a nominal 2.5% platform technology fee on cleared transactions to cover instant UPI payment gateway charges, automated shoot contract generation, server storage, and neutral dispute mediation.
                    </p>
                  </section>
                </article>
              )}

              {/* 2. 3-STAGE ESCROW RULES */}
              {activeSection === 'escrow' && (
                <article className="legal-article">
                  <span className="legal-doc-badge">Document Ref: CC-LEGAL-ESCROW-2026</span>
                  <h2>3-Stage Milestone Escrow Rules</h2>
                  <p className="lead-text">
                    Camcrew operates an automated milestone escrow engine engineered specifically for media and production workflows to guarantee complete payment security for both clients and creators.
                  </p>

                  <div className="escrow-breakdown-card">
                    <div className="escrow-tier-item">
                      <div className="tier-header">
                        <span className="tier-pill">Stage 1 • 30%</span>
                        <h4>Advance Calendar Lock</h4>
                      </div>
                      <p>Deposited by Client upon booking confirmation. Held safely in escrow to guarantee the Creator's calendar dates and prevent frivolous cancellations.</p>
                    </div>

                    <div className="escrow-tier-item">
                      <div className="tier-header">
                        <span className="tier-pill">Stage 2 • 40%</span>
                        <h4>Shoot Wrap Milestone</h4>
                      </div>
                      <p>Released immediately upon completion of principal photography / shoot call wrap on set. Confirmed via client signature or mutual check-in.</p>
                    </div>

                    <div className="escrow-tier-item">
                      <div className="tier-header">
                        <span className="tier-pill">Stage 3 • 30%</span>
                        <h4>Final Deliverables Clearance</h4>
                      </div>
                      <p>Released upon delivery of high-resolution master video edits, RAW photo archives, or graded assets via Camcrew Cloud Drive within the agreed turnaround schedule.</p>
                    </div>
                  </div>

                  <section className="legal-section" style={{ marginTop: 24 }}>
                    <h3>Automated Acceptance & Dispute Deadlines</h3>
                    <p>
                      Following deliverable upload, the Client has seven (7) business days to review master files or request one of their two (2) complimentary revision rounds. If no dispute is filed within 7 business days, the escrow engine automatically releases the final 30% milestone to the Creator&apos;s UPI wallet.
                    </p>
                  </section>
                </article>
              )}

              {/* 3. CANCELLATION & REFUNDS */}
              {activeSection === 'cancellation' && (
                <article className="legal-article">
                  <span className="legal-doc-badge">Document Ref: CC-LEGAL-REFUND-2026</span>
                  <h2>Cancellation, Rescheduling & Refund Policy</h2>
                  <p className="lead-text">
                    Production bookings require reserving high-demand talent and blocking critical shoot dates. Our tiered cancellation schedule balances flexibility for clients while protecting creator livelihood.
                  </p>

                  <div className="refund-table-wrapper">
                    <table className="legal-table">
                      <thead>
                        <tr>
                          <th>Cancellation Timing</th>
                          <th>Refund to Client</th>
                          <th>Creator Compensation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>More than 7 Days</strong> before call time</td>
                          <td><span className="badge-green">90% Refund</span></td>
                          <td>10% Administrative Fee</td>
                        </tr>
                        <tr>
                          <td><strong>48 Hours to 7 Days</strong> before call time</td>
                          <td><span className="badge-amber">50% Refund</span></td>
                          <td>50% Retained by Creator</td>
                        </tr>
                        <tr>
                          <td><strong>Less than 48 Hours</strong> before call time</td>
                          <td><span className="badge-red">No Refund</span></td>
                          <td>100% Advance retained for calendar block</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <section className="legal-section" style={{ marginTop: 24 }}>
                    <h3>Inclement Weather & Force Majeure</h3>
                    <p>
                      For outdoor and drone shoots affected by certified severe weather, monsoons, or governmental shoot restrictions, both parties agree to reschedule to a mutually agreeable backup date without financial penalty or forfeiture of escrow.
                    </p>
                  </section>
                </article>
              )}

              {/* 4. CREATOR IP & COPYRIGHT */}
              {activeSection === 'copyright' && (
                <article className="legal-article">
                  <span className="legal-doc-badge">Document Ref: CC-LEGAL-IP-2026</span>
                  <h2>Intellectual Property & Copyright Ownership</h2>
                  <p className="lead-text">
                    Transparent IP terms established in accordance with the Indian Copyright Act, 1957.
                  </p>

                  <section className="legal-section">
                    <h3>1. Ownership Prior to Full Escrow Release</h3>
                    <p>
                      The Creative Specialist retains all legal copyright and master RAW footage ownership during the production and editing phase until the final 100% escrow balance has cleared.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h3>2. Commercial License Transfer Upon Full Payment</h3>
                    <p>
                      Upon 100% release of all escrow milestones, the Client automatically receives a perpetual, worldwide, commercial license to broadcast, publish, distribute, monetize, and exhibit the final delivered assets across digital, television, and print mediums.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h3>3. Creator Portfolio & Showreel Rights</h3>
                    <p>
                      The Specialist retains non-exclusive rights to showcase excerpt clips, behind-the-scenes photographs, and finished video reels on their Camcrew public profile, personal showreel, and creative portfolio, unless an explicit Non-Disclosure Agreement (NDA) was booked.
                    </p>
                  </section>
                </article>
              )}

              {/* 5. GEAR RENTAL AGREEMENT */}
              {activeSection === 'rentals' && (
                <article className="legal-article">
                  <span className="legal-doc-badge">Document Ref: CC-LEGAL-RENTALS-2026</span>
                  <h2>Cinema Equipment Rental Liability</h2>
                  <p className="lead-text">
                    Regulations governing peer-to-peer and studio equipment rentals across cinema camera packages, lenses, stabilizers, and lighting.
                  </p>

                  <section className="legal-section">
                    <h3>1. ₹5,000 Security Deposit Escrow</h3>
                    <p>
                      All gear rentals require a refundable security deposit held in Camcrew Escrow. The deposit is automatically released back to the renter within 24 hours of equipment return and physical inspection.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h3>2. Pre-Rental Condition Inspection</h3>
                    <p>
                      The renter must inspect equipment upon courier delivery or studio pickup, photographing any existing cosmetic scratches or sensor dust within two (2) hours of receipt.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h3>3. Damage Liability & Repair Escrow</h3>
                    <p>
                      In the event of accidental impact, water ingress, or equipment malfunction due to negligence, the renter is liable for official manufacturer repair costs or insurance deductible, deducted directly from the security deposit.
                    </p>
                  </section>
                </article>
              )}

              {/* 6. PRIVACY POLICY */}
              {activeSection === 'privacy' && (
                <article className="legal-article">
                  <span className="legal-doc-badge">Document Ref: CC-LEGAL-PRIVACY-2026</span>
                  <h2>Privacy Policy (DPDP Act 2023 Compliant)</h2>
                  <p className="lead-text">
                    Camcrew India Technologies Pvt Ltd is committed to safeguarding your personal and creative data in compliance with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023.
                  </p>

                  <section className="legal-section">
                    <h3>1. Data We Collect</h3>
                    <ul>
                      <li><strong>Identity Data:</strong> Full Name, verified phone number, email address, and profile photographs.</li>
                      <li><strong>Professional Data:</strong> Equipment rosters, pricing rates, portfolio media, and certified industry badges.</li>
                      <li><strong>Financial Data:</strong> UPI VPA handles for payouts (we never store raw credit card CVV or netbanking passwords; payment processing is secured by RBI-authorized payment aggregators).</li>
                      <li><strong>Device Data:</strong> Push notification tokens (Expo push service) to deliver realtime shoot and chat notifications.</li>
                    </ul>
                  </section>

                  <section className="legal-section">
                    <h3>2. Camera & Media Permissions</h3>
                    <p>
                      Our mobile applications request access to your device camera and media library solely for uploading profile avatars, portfolio photographs, and showreels. We never access your gallery without your explicit in-app selection.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h3>3. Statutory Grievance Redressal Officer</h3>
                    <div className="grievance-officer-card">
                      <p><strong>Grievance Redressal Officer (Rule 3(11) IT Rules 2021 & DPDP Act):</strong></p>
                      <p>Name: Thaha Hussain</p>
                      <p>Designation: Head of Trust & Safety, Camcrew India</p>
                      <p>Email: grievance@camcrew.in / legal@camcrew.in</p>
                      <p>Address: Camcrew Studios, Bandra West, Mumbai, Maharashtra 400050</p>
                    </div>
                  </section>
                </article>
              )}

              {/* 7. ACCOUNT DELETION RIGHTS */}
              {activeSection === 'deletion' && (
                <article className="legal-article">
                  <span className="legal-doc-badge">Document Ref: CC-LEGAL-DELETION-2026</span>
                  <h2>Self-Service Account Deletion & Right to Erasure</h2>
                  <p className="lead-text">
                    In compliance with Apple App Store Guideline 5.1.1(v), Google Play User Data Policy, and the DPDP Act 2023, Camcrew provides immediate in-app and web self-service account deletion.
                  </p>

                  <div className="deletion-steps-card">
                    <h4>How to Delete Your Account:</h4>
                    <ol>
                      <li><strong>In Web:</strong> Navigate to <Link to="/dashboard" className="accent-link">My Dashboard</Link> → Settings / Danger Zone → Click <strong>&quot;Delete Account&quot;</strong>.</li>
                      <li><strong>In Mobile App:</strong> Open the Profile Tab → Tap <strong>App Settings</strong> → Scroll to Danger Zone → Tap <strong>&quot;Delete Account&quot;</strong>.</li>
                      <li>Type the confirmation word <code>DELETE</code> to verify your request.</li>
                    </ol>
                  </div>

                  <section className="legal-section" style={{ marginTop: 20 }}>
                    <h3>What Happens When You Delete Your Account:</h3>
                    <ul>
                      <li>Your personal profile, bio, phone number, and email are permanently purged from active databases.</li>
                      <li>Your portfolio showcases, video reels, and product listings are permanently deleted.</li>
                      <li>All push notification tokens and device sessions are revoked immediately.</li>
                    </ul>
                  </section>

                  <div className="warning-notice-box">
                    <AlertTriangle size={20} color="var(--warning)" />
                    <div>
                      <strong>Active Escrow Protection Guard:</strong>
                      <p>
                        To prevent abandonment of financial or production obligations, account deletion will be rejected if you have active, confirmed bookings with held escrow funds. All active shoots must be wrapped, released, or cancelled before account deletion can proceed.
                      </p>
                    </div>
                  </div>
                </article>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
