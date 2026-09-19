import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobApi } from '../api/jobApi';
import { professionalApi } from '../api/professionalApi';
import type { JobRequest } from '../types/job';
import type { ProfessionalProfile } from '../types/professional';
import { 
   
  Star, 
  MapPin, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader2,
  User
} from 'lucide-react';
import { isCustomAvatar } from '../utils/avatarUtils';

export const JobReviewPage: React.FC = () => {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobRequest | null>(null);
  const [pro, setPro] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;

    const loadData = async () => {
      try {
        const jobData = await jobApi.getJobById(jobId);
        if (!jobData) throw new Error('Job request not found.');
        setJob(jobData);

        if (jobData.accepted_by) {
          const proProfile = await professionalApi.getProfileById(jobData.accepted_by);
          setPro(proProfile);
        }
      } catch (err: any) {
        setError(err.message || 'Could not load job details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [jobId]);

  const handleReject = async () => {
    if (!job || !job.accepted_by) return;
    if (!window.confirm('Are you sure you want to reject this professional? The job will be reopened for other local creators.')) {
      return;
    }

    setActionLoading(true);
    try {
      await jobApi.rejectPro(job.id, job.accepted_by);
      alert('Professional rejected. Job has been reopened to the community pool.');
      navigate('/dashboard?tab=broadcasts');
    } catch (err: any) {
      alert(err.message || 'Failed to reject applicant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = () => {
    if (!job || !pro) return;
    const params = new URLSearchParams({
      jobId: job.id,
      jobTitle: job.title,
      jobBudget: String(job.budget),
      jobLocation: job.location,
    });
    navigate(`/book/${pro.id}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="container text-center" style={{ padding: '80px 0' }}>
        <Loader2 size={32} className="animate-spin" />
        <p style={{ marginTop: 12 }}>Loading applicant pitch...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container text-center" style={{ padding: '80px 20px' }}>
        <h2>Job Not Found</h2>
        <p>{error || 'This broadcast job does not exist.'}</p>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 16 }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="job-review-page container" style={{ maxWidth: 840 }}>
      <button onClick={() => navigate(-1)} className="btn btn-sm btn-ghost back-btn" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 className="page-title">Review Lead Applicant</h1>
        <p className="page-subtitle">
          A creative professional accepted your broadcast lead. Review their credentials and proceed with booking.
        </p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="badge-sub" style={{ textTransform: 'uppercase', marginBottom: 6, display: 'inline-block' }}>
              Broadcast Job Post
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{job.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={14} /> {job.location}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Agreed Budget</span>
            <strong style={{ fontSize: 22, color: 'var(--accent)' }}>₹{job.budget?.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {job.requirements && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>REQUIREMENTS:</span>
            <p style={{ fontSize: 14, marginTop: 4, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {job.requirements}
            </p>
          </div>
        )}
      </div>

      {pro ? (
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)' }}>
            APPLIED CREATIVE PROFESSIONAL
          </h3>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {isCustomAvatar(pro.avatar) ? (
              <img 
                src={pro.avatar} 
                alt={pro.name} 
                style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: 'none' }} 
              />
            ) : (
              <div 
                style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
              >
                <User size={38} />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>{pro.name}</h2>
                {pro.verified && <CheckCircle size={18} fill="var(--accent)" color="#fff" />}
              </div>
              <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 15, marginTop: 2 }}>{pro.title}</p>
              
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={14} fill="#F5A623" color="#F5A623" /> {pro.rating?.toFixed(1) || '5.0'} ({pro.reviewCount || 0} reviews)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} /> {pro.city}, {pro.state}
                </span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 20 }}>
            {pro.bio}
          </p>

          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 20, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleReject}
              disabled={actionLoading}
              className="btn btn-outline"
              style={{ flex: 1, minWidth: 160, color: 'var(--danger)', background: 'rgba(255, 51, 75, 0.1)', border: 'none' }}
            >
              <XCircle size={16} /> Reject & Re-open Job
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={actionLoading}
              className="btn btn-primary"
              style={{ flex: 2, minWidth: 240, padding: 14, fontSize: 15, fontWeight: 700 }}
            >
              Accept & Book (₹{job.budget?.toLocaleString('en-IN')}) →
            </button>
          </div>
        </div>
      ) : (
        <div className="card text-center" style={{ padding: 40 }}>
          <p>No professional has accepted this lead yet, or applicant profile could not be loaded.</p>
        </div>
      )}
    </div>
  );
};

export default JobReviewPage;
