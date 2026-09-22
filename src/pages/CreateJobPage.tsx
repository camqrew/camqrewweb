import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApi } from '../api/jobApi';
import { LocationSelector } from '../components/LocationSelector';
import { CustomSelect } from '../components/CustomSelect';
import { useAuthStore } from '../store/authStore';
import { 
  Radio, 
  Loader2, 
  ArrowLeft,
  Bell,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Send
} from 'lucide-react';

export const CreateJobPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('25000');
  const [category, setCategory] = useState('Videographers');
  const [location, setLocation] = useState({
    state: 'Maharashtra',
    district: 'Mumbai',
    city: 'Mumbai',
  });
  const [areaDetails, setAreaDetails] = useState('');
  const [requirements, setRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = [
    'Videographers',
    'Photographers',
    'Models',
    'Home Bakers',
    'Drone Pilots',
    'Cinematographers',
    'Caterers',
    'Organisers',
    'Makeup Artists',
    'Mehendi Artists',
    'Developers',
    'Designers',
    'Editors',
    'All Creative Pros',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      navigate('/login?redirect=/jobs/create');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a project title.');
      return;
    }
    if (!budget || Number(budget) <= 0) {
      setError('Please enter a valid budget.');
      return;
    }
    if (!location.state || !location.district) {
      setError('Please select state and district.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const locString = [location.city, location.district, location.state, areaDetails]
        .filter(Boolean)
        .join(', ');

      await jobApi.createJobRequest({
        client_id: user.id,
        title,
        requirements: requirements || `${category} requirement for ${title} in ${locString}`,
        budget: Number(budget),
        location: locString,
        state: location.state,
        district: location.district,
        city: location.city,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to broadcast job.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="create-job-page container">
        <div className="broadcast-success-card card text-center">
          <div className="success-icon-circle">
            <Radio size={40} color="var(--accent)" />
          </div>
          <h2 className="success-title">Broadcast Job Live! 📢</h2>
          <p className="success-desc">
            Your shoot requirement has been dispatched to verified professionals in{' '}
            <strong>{location.district}, {location.state}</strong>. You will receive a notification as soon as a creator reviews and accepts your lead.
          </p>

          <div className="success-actions-row">
            <button onClick={() => navigate('/dashboard?tab=broadcasts')} className="btn btn-primary btn-lg">
              View My Broadcasts →
            </button>
            <button onClick={() => { setSuccess(false); setTitle(''); setRequirements(''); }} className="btn btn-outline btn-lg">
              Post Another Requirement
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-job-page container">
      {/* Top Breadcrumb Navigation */}
      <div className="broadcast-top-nav">
        <button onClick={() => navigate(-1)} className="btn-back-link">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Hero Header Row - Symmetrical and Aligned */}
      <div className="broadcast-header-section">
        <div className="broadcast-header-content">
          <div className="broadcast-pill-badge">
            <Radio size={14} className="pulse-icon" />
            <span>SMART LOCALITY MATCHING</span>
          </div>
          <h1 className="broadcast-page-title">Broadcast a Shoot Requirement</h1>
          <p className="broadcast-page-subtitle">
            Publish your project requirements. Verified cinematographers, photographers, and drone pilots in your district receive immediate alerts and apply directly at your budget.
          </p>
        </div>

        <div className="broadcast-header-stats">
          <div className="header-stat-pill">
            <ShieldCheck size={16} color="var(--accent)" />
            <span>100% Escrow Protection</span>
          </div>
          <div className="header-stat-pill">
            <span>Instant Dispatch</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 24 }}>{error}</div>}

      {/* Main 2-Column Responsive Layout Grid */}
      <div className="broadcast-layout-grid">
        {/* Left Column: Comprehensive Form */}
        <div className="broadcast-form-column">
          <form onSubmit={handleSubmit} className="broadcast-form-card card">
            {/* Step 1: Project Overview */}
            <div className="form-section-block">
              <div className="section-label-header">
                <span className="section-number-badge">1</span>
                <div>
                  <h3 className="section-title-text">Project Overview</h3>
                  <p className="section-subtitle-text">What kind of creative production do you need?</p>
                </div>
              </div>

              <div className="form-field-group">
                <label className="broadcast-field-label">Project Title *</label>
                <input
                  type="text"
                  className="broadcast-input-box"
                  placeholder="e.g. 2-Day Pre-Wedding Cinematic Video & Drone Shoot"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="broadcast-form-row-2">
                <div className="form-field-group">
                  <label className="broadcast-field-label">Creative Category *</label>
                  <CustomSelect
                    value={category}
                    onChange={setCategory}
                    options={categories}
                    placeholder="Select Creative Category"
                  />
                </div>

                <div className="form-field-group">
                  <label className="broadcast-field-label">Expected Budget (₹ INR) *</label>
                  <div className="broadcast-currency-input-wrapper">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      className="broadcast-currency-input"
                      placeholder="25000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      min="1000"
                      step="500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Shoot Location */}
            <div className="form-section-block">
              <div className="section-label-header">
                <span className="section-number-badge">2</span>
                <div>
                  <h3 className="section-title-text">Shoot Location</h3>
                  <p className="section-subtitle-text">Where will the physical shoot take place?</p>
                </div>
              </div>

              <div className="form-field-group">
                <div className="field-label-with-hint">
                  <label className="broadcast-field-label">Shoot Locality (India) *</label>
                  <span className="field-hint-text">Pros in this district receive immediate alerts</span>
                </div>
                <LocationSelector
                  selectedState={location.state}
                  selectedDistrict={location.district}
                  selectedCity={location.city}
                  onChange={setLocation}
                />
              </div>

              <div className="form-field-group" style={{ marginTop: 14 }}>
                <label className="broadcast-field-label">Specific Area, Landmark or Studio</label>
                <input
                  type="text"
                  className="broadcast-input-box"
                  placeholder="e.g. Bandra West, or Resort near Calangute Beach"
                  value={areaDetails}
                  onChange={(e) => setAreaDetails(e.target.value)}
                />
              </div>
            </div>

            {/* Step 3: Requirements & Deliverables */}
            <div className="form-section-block">
              <div className="section-label-header">
                <span className="section-number-badge">3</span>
                <div>
                  <h3 className="section-title-text">Requirements & Deliverables</h3>
                  <p className="section-subtitle-text">Share equipment needs, shot list, and delivery timelines.</p>
                </div>
              </div>

              <div className="form-field-group">
                <textarea
                  className="broadcast-textarea-box"
                  rows={4}
                  placeholder="Describe what you need: dates, hours, 4K cameras, drone permission, reels/teaser delivery timeline..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </div>
            </div>

            {/* Process Info Tip */}
            <div className="broadcast-info-tip">
              <div className="tip-icon-circle">
                <Bell size={18} color="var(--accent)" />
              </div>
              <p className="tip-text">
                <strong>How It Works:</strong> Once a creator accepts your lead, you can review their portfolio, rating, and gear. Then click <strong>Accept & Book</strong> to lock this exact budget under Camqrew 30/40/30 milestone escrow protection.
              </p>
            </div>

            {/* Primary Submit CTA */}
            <button type="submit" className="btn-broadcast-submit" disabled={submitting}>
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Broadcast Lead to Local Creators</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Preview & Assurance Sidebar */}
        <div className="broadcast-sidebar-column">
          {/* Live Card Preview */}
          <div className="card broadcast-preview-card">
            <div className="preview-card-header">
              <span>Live Job Board Preview</span>
            </div>

            <div className="preview-body">
              <div className="preview-category-badge">{category || 'Videographers'}</div>
              <h4 className="preview-job-title">{title || 'Untitled Shoot Requirement'}</h4>

              <div className="preview-meta-row">
                <div className="preview-meta-item">
                  <span className="meta-lbl">Budget</span>
                  <strong className="meta-val">₹{Number(budget || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="preview-meta-item">
                  <span className="meta-lbl">Location</span>
                  <strong className="meta-val" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} color="var(--accent)" />
                    {location.city || location.district || 'India'}
                    {location.state ? `, ${location.state}` : ''}
                  </strong>
                </div>
              </div>

              <div className="preview-dispatch-status">
                <Radio size={12} className="pulse-icon" />
                <span>Ready to alert nearby pros</span>
              </div>
            </div>
          </div>

          {/* Escrow Guarantee Card */}
          <div className="card broadcast-assurance-card">
            <div className="assurance-header">
              <ShieldCheck size={22} color="var(--accent)" />
              <div>
                <h4 className="assurance-title">100% Escrow Protection</h4>
                <p className="assurance-subtitle">Camqrew Milestone Assurance</p>
              </div>
            </div>

            <ul className="assurance-list">
              <li>
                <CheckCircle size={15} color="var(--accent)" />
                <span><strong>No fee to post:</strong> Broadcast is 100% free.</span>
              </li>
              <li>
                <CheckCircle size={15} color="var(--accent)" />
                <span><strong>Pre-screen applicants:</strong> Check portfolio & past client reviews.</span>
              </li>
              <li>
                <CheckCircle size={15} color="var(--accent)" />
                <span><strong>Milestone escrow:</strong> Pay 30% advance only when you confirm.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJobPage;
