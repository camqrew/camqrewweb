import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, User } from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { isCustomAvatar } from '../utils/avatarUtils';

export default function Verifications() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  async function fetchPendingVerifications() {
    setLoading(true);
    try {
      // Fetch professional_profiles where verified is false or null
      // Assuming verified is a boolean column that defaults to false/null
      const { data, error } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          users (
            name,
            email,
            avatar
          )
        `)
        .or('verified.is.null,verified.eq.false');
        
      if (error) throw error;
      setProfiles(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    if (!window.confirm('Approve this professional profile?')) return;
    try {
      await supabase.from('professional_profiles').update({ verified: true }).eq('id', id);
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleReject(id: string) {
    if (!window.confirm('Reject and delete this professional profile?')) return;
    try {
      // Typically we'd flag it, but let's just delete the profile for now
      await supabase.from('professional_profiles').delete().eq('id', id);
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading verification queue...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Verification Queue</h1>
          <p className="page-subtitle">Review professional profiles and KYC documents</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Category</th>
                <th>Status</th>
                <th>Submission Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(profile => (
                <tr key={profile.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ backgroundColor: "var(--bg-surface)", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {isCustomAvatar(profile.users?.avatar) ? (
                          <img src={profile.users.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={22} color="var(--text-muted)" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{profile.users?.name || 'Unknown'}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{profile.users?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{profile.title || 'Professional'}</td>
                  <td><span className="badge badge-warning">Pending</span></td>
                  <td>{formatDate(profile.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn"><Eye size={16} /> Inspect</button>
                      <button className="btn btn-success" onClick={() => handleApprove(profile.id)}>
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button className="btn btn-danger" onClick={() => handleReject(profile.id)}>
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending verifications.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
