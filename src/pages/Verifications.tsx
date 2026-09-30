import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  Briefcase, 
  DollarSign, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Phone, 
  Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { isCustomAvatar } from '../utils/avatarUtils';

export default function Verifications() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  
  // Inspection Dossier Modal
  const [inspectedProfile, setInspectedProfile] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  async function fetchVerifications(isManual = false) {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      let query = supabase
        .from('professional_profiles')
        .select(`
          *,
          users:id (
            id,
            name,
            email,
            phone,
            avatar,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.or('verified.is.null,verified.eq.false');
      } else if (statusFilter === 'verified') {
        query = query.eq('verified', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProfiles(data || []);
    } catch (e) {
      console.error('Error fetching verification queue', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleApprove(profileId: string, applicantName: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('professional_profiles')
        .update({ verified: true })
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      if (statusFilter === 'pending') {
        setProfiles(prev => prev.filter(p => p.id !== profileId));
      } else {
        setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, verified: true } : p));
      }

      if (inspectedProfile?.id === profileId) {
        setInspectedProfile({ ...inspectedProfile, verified: true });
      }

      setToastMessage(`Approved KYC & granted verified badge to ${applicantName}! 🎉`);
    } catch (e: any) {
      alert(e.message || 'Failed to approve profile');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(profileId: string, applicantName: string) {
    if (!window.confirm(`Are you sure you want to reject and remove verification for ${applicantName}?`)) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('professional_profiles')
        .update({ verified: false })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== profileId));
      if (inspectedProfile?.id === profileId) {
        setInspectedProfile(null);
      }

      setToastMessage(`Rejected verification for ${applicantName}.`);
    } catch (e: any) {
      alert(e.message || 'Failed to reject profile');
    } finally {
      setActionLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Filter profiles by search
  const filteredProfiles = profiles.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = p.users?.name?.toLowerCase() || '';
    const email = p.users?.email?.toLowerCase() || '';
    const title = p.title?.toLowerCase() || '';
    const city = p.city?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || title.includes(q) || city.includes(q);
  });

  return (
    <div className="admin-page-content">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-floating-toast">
          <CheckCircle2 size={18} color="var(--accent)" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="toast-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Verification Queue</h1>
          <p className="admin-page-subtitle">
            Review professional credentials, portfolio authenticity, and grant verified status
          </p>
        </div>

        <div className="admin-header-controls">
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchVerifications(true)}
            disabled={refreshing}
            title="Refresh queue"
          >
            <RefreshCw size={15} className={refreshing ? 'admin-spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Hub */}
      <div className="admin-filter-hub">
        <div className="admin-search-field">
          <div className="search-field-icon-wrap">
            <Search size={15} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applicant name, email, city, category..."
            className="admin-input-clean"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="clear-search-btn" title="Clear Search">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="admin-segmented-tabs">
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending Review ({statusFilter === 'pending' ? profiles.length : '•'})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'verified' ? 'active' : ''}`}
            onClick={() => setStatusFilter('verified')}
          >
            Verified Creators
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Applicants
          </button>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Applicant Profile</th>
                <th>Role / Category</th>
                <th>Daily Rate</th>
                <th>KYC Status</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map(profile => {
                const userName = profile.users?.name || 'Applicant';
                const userEmail = profile.users?.email || 'No email provided';
                const isVerified = Boolean(profile.verified);

                return (
                  <tr key={profile.id} className="admin-row-hover">
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-avatar-box">
                          {isCustomAvatar(profile.users?.avatar) ? (
                            <img src={profile.users.avatar} alt={userName} />
                          ) : (
                            <User size={20} color="var(--text-muted)" />
                          )}
                        </div>
                        <div className="admin-user-meta">
                          <div className="admin-user-name">
                            {userName}
                            {isVerified && (
                              <CheckCircle2 size={14} color="var(--accent)" style={{ display: 'inline', marginLeft: 4 }} />
                            )}
                          </div>
                          <div className="admin-user-email">
                            {userEmail} • {profile.city || profile.district || 'Location N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{profile.title || 'Creator'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {profile.experienceYears ? `${profile.experienceYears}+ yrs exp` : 'Portfolio Applicant'}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {formatCurrency(profile.ratePerDay)}
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/day</span>
                      </div>
                    </td>

                    <td>
                      {isVerified ? (
                        <span className="admin-pill-badge success">
                          <CheckCircle2 size={12} />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="admin-pill-badge warning">
                          <span className="status-live-dot warning" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDate(profile.created_at)}
                    </td>

                    <td>
                      <div className="admin-actions-cell">
                        {/* Functioning Inspect Button */}
                        <button 
                          type="button" 
                          className="admin-btn-action admin-btn-inspect"
                          onClick={() => setInspectedProfile(profile)}
                          title="Open Applicant Dossier"
                        >
                          <Eye size={15} />
                          <span>Inspect</span>
                        </button>

                        {/* Approve Button */}
                        {!isVerified && (
                          <button 
                            type="button" 
                            className="admin-btn-action admin-btn-approve"
                            onClick={() => handleApprove(profile.id, userName)}
                            disabled={actionLoading}
                            title="Approve & Grant Verified Badge"
                          >
                            <CheckCircle size={15} />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Reject Button */}
                        <button 
                          type="button" 
                          className="admin-table-icon-btn danger"
                          onClick={() => handleReject(profile.id, userName)}
                          disabled={actionLoading}
                          title="Reject Application"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProfiles.length === 0 && !loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-table-empty">
                      <ShieldCheck size={36} color="var(--accent)" />
                      <div className="empty-title">Queue is clear!</div>
                      <div className="empty-sub">
                        {searchQuery ? `No applicants match "${searchQuery}"` : 'No profiles currently awaiting KYC verification review.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Applicant Verification Dossier Modal */}
      {inspectedProfile && (
        <div className="admin-modal-backdrop" onClick={() => setInspectedProfile(null)}>
          <div className="admin-modal-card-md" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="dossier-avatar-wrap">
                  {isCustomAvatar(inspectedProfile.users?.avatar) ? (
                    <img src={inspectedProfile.users.avatar} alt="Avatar" />
                  ) : (
                    <User size={30} color="var(--text-muted)" />
                  )}
                  {inspectedProfile.verified && (
                    <span className="dossier-verified-badge" title="Verified Creator">
                      <CheckCircle2 size={16} fill="var(--accent)" color="#fff" />
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="admin-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {inspectedProfile.users?.name || 'Applicant Dossier'}
                  </h2>
                  <p className="admin-modal-sub">
                    {inspectedProfile.title || 'Creator'} • {inspectedProfile.city || inspectedProfile.district}, {inspectedProfile.state}
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setInspectedProfile(null)}
                className="admin-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dossier Content Body */}
            <div className="admin-modal-scroll-area">
              {/* Quick Info Grid */}
              <div className="dossier-meta-grid">
                <div className="dossier-meta-item">
                  <Mail size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Email Address</span>
                    <span className="dossier-value">{inspectedProfile.users?.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <Phone size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Phone Contact</span>
                    <span className="dossier-value">{inspectedProfile.users?.phone || 'Not shared'}</span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <Briefcase size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Experience</span>
                    <span className="dossier-value">{inspectedProfile.experienceYears || '1'}+ Years</span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <DollarSign size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Quoted Rate</span>
                    <span className="dossier-value">{formatCurrency(inspectedProfile.ratePerDay)} / day</span>
                  </div>
                </div>
              </div>

              {/* Bio & Artist Statement */}
              <div className="dossier-section">
                <h3 className="dossier-section-title">About the Creator</h3>
                <p className="dossier-bio-text">
                  {inspectedProfile.bio || 'No personal bio or artist statement provided.'}
                </p>
              </div>

              {/* Categories & Specialties */}
              {inspectedProfile.categories && inspectedProfile.categories.length > 0 && (
                <div className="dossier-section">
                  <h3 className="dossier-section-title">Verified Categories & Specialties</h3>
                  <div className="dossier-tags-row">
                    {inspectedProfile.categories.map((c: string) => (
                      <span key={c} className="admin-cat-pill">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Showcase Images */}
              {inspectedProfile.portfolio && inspectedProfile.portfolio.length > 0 && (
                <div className="dossier-section">
                  <h3 className="dossier-section-title">Submitted Portfolio Showcase</h3>
                  <div className="dossier-portfolio-grid">
                    {inspectedProfile.portfolio.map((img: string, idx: number) => (
                      <div key={idx} className="dossier-portfolio-item">
                        <img src={img} alt={`Portfolio ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dossier Footer Actions */}
            <div className="admin-modal-footer">
              <Link 
                to={`/creators/${inspectedProfile.id}`}
                target="_blank"
                rel="noreferrer"
                className="admin-btn admin-btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>View Public Profile</span>
                <ExternalLink size={14} />
              </Link>

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  type="button" 
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleReject(inspectedProfile.id, inspectedProfile.users?.name || 'Applicant')}
                  disabled={actionLoading}
                >
                  <XCircle size={15} />
                  <span>Reject</span>
                </button>

                {!inspectedProfile.verified && (
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-primary"
                    onClick={() => handleApprove(inspectedProfile.id, inspectedProfile.users?.name || 'Applicant')}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={15} />
                    <span>Approve & Grant Badge</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
