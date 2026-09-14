import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import { jobApi } from '../api/jobApi';
import type { Booking } from '../types/booking';
import type { JobRequest } from '../types/job';
import { useAuthStore } from '../store/authStore';
import { 
  Calendar, 
  Radio, 
  Briefcase, 
  MapPin, 
  MessageSquare, 
  Loader2,
  TrendingUp
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, activeRole } = useAuthStore();
  const navigate = useNavigate();

  const initialTab = searchParams.get('tab') || (user?.role === 'professional' ? 'jobboard' : 'bookings');
  const [activeTab, setActiveTab] = useState(initialTab);

  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [clientJobs, setClientJobs] = useState<JobRequest[]>([]);
  const [proJobBoard, setProJobBoard] = useState<JobRequest[]>([]);
  const [proBookings, setProBookings] = useState<Booking[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !user) {
      navigate('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cBookings, cJobs] = await Promise.all([
        bookingApi.getCustomerBookings(),
        jobApi.getClientJobs(user.id),
      ]);
      setCustomerBookings(cBookings);
      setClientJobs(cJobs);

      if (user.role === 'professional' || activeRole === 'professional') {
        const [openJobs, pBookings] = await Promise.all([
          jobApi.getOpenJobs(undefined, user.id),
          bookingApi.getProfessionalBookings(),
        ]);
        setProJobBoard(openJobs);
        setProBookings(pBookings);
      }
    } catch (err) {
      console.warn('Dashboard data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user, activeRole]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleAcceptLead = async (jobId: string) => {
    if (!user) return;
    setActionLoading(jobId);
    try {
      await jobApi.acceptJob(jobId, user.id);
      alert('You have accepted this lead! The client has been notified to review your profile and confirm booking.');
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to accept lead');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="dashboard-page container">
      <div className="dashboard-header card" style={{ padding: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img 
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'} 
            alt={user?.name} 
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: 'none' }}
          />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Welcome, {user?.name} 👋</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Account Role: <strong style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{user?.role}</strong> • {user?.email}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/jobs/create" className="btn btn-primary btn-sm">
            + Post Broadcast Job
          </Link>
          <Link to="/explore" className="btn btn-outline btn-sm">
            Find Creators
          </Link>
        </div>
      </div>

      <div className="dashboard-tabs" style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        <button
          className={`btn btn-sm ${activeTab === 'bookings' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => handleTabChange('bookings')}
        >
          <Calendar size={16} /> My Bookings ({customerBookings.length})
        </button>

        <button
          className={`btn btn-sm ${activeTab === 'broadcasts' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => handleTabChange('broadcasts')}
        >
          <Radio size={16} /> My Broadcast Jobs ({clientJobs.length})
        </button>

        {(user?.role === 'professional' || activeRole === 'professional') && (
          <>
            <button
              className={`btn btn-sm ${activeTab === 'jobboard' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleTabChange('jobboard')}
            >
              <Briefcase size={16} /> Creator Job Board ({proJobBoard.length} Open Leads)
            </button>

            <button
              className={`btn btn-sm ${activeTab === 'probookings' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleTabChange('probookings')}
            >
              <TrendingUp size={16} /> Pro Bookings ({proBookings.length})
            </button>
          </>
        )}
      </div>

      {activeTab === 'bookings' && (
        <div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={32} className="animate-spin" /></div>
          ) : customerBookings.length === 0 ? (
            <div className="card text-center" style={{ padding: 48 }}>
              <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3>No bookings yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Explore creative talent and book them with milestone escrow protection.</p>
              <Link to="/explore" className="btn btn-primary" style={{ marginTop: 16 }}>Explore Creators</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {customerBookings.map((b) => (
                <div key={b.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <img src={b.professionalAvatar} alt={b.professionalName} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <span className={`status-pill status-${b.status}`} style={{ textTransform: 'uppercase', fontSize: 11 }}>
                        {b.status}
                      </span>
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: '4px 0' }}>{b.serviceTitle}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        With <strong>{b.professionalName}</strong> • {b.startDate} ({b.daysCount} days)
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        📍 {b.location}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Escrow Total</span>
                    <strong style={{ fontSize: 20, color: 'var(--accent)' }}>₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Link to={`/chat?userId=${b.professionalId}`} className="btn btn-outline btn-sm">
                        <MessageSquare size={14} /> Message
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'broadcasts' && (
        <div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={32} className="animate-spin" /></div>
          ) : clientJobs.length === 0 ? (
            <div className="card text-center" style={{ padding: 48 }}>
              <Radio size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3>No broadcast jobs posted</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Need a crew urgently? Broadcast your shoot requirements to all verified creators in your district.</p>
              <Link to="/jobs/create" className="btn btn-primary" style={{ marginTop: 16 }}>Post a Broadcast Job</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {clientJobs.map((job) => (
                <div key={job.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`status-pill status-${job.status}`} style={{ textTransform: 'uppercase', fontSize: 11 }}>
                        {job.status}
                      </span>
                      {job.status === 'reviewing' && (
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
                          🎉 Pro Applied! Review Required
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: '6px 0 4px' }}>{job.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {job.location}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{job.requirements}</p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Budget</span>
                    <strong style={{ fontSize: 20, color: 'var(--accent)' }}>₹{job.budget?.toLocaleString('en-IN')}</strong>
                    <div style={{ marginTop: 10 }}>
                      {job.status === 'reviewing' ? (
                        <Link to={`/jobs/review/${job.id}`} className="btn btn-primary btn-sm">
                          Review Applicant & Book →
                        </Link>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {job.status === 'open' ? 'Waiting for local creators to apply...' : 'Booking confirmed'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'jobboard' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Open Broadcast Leads in Your Locality</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Accept a job to pitch your services. The client will be notified to review your profile and confirm booking at the agreed budget.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={32} className="animate-spin" /></div>
          ) : proJobBoard.length === 0 ? (
            <div className="card text-center" style={{ padding: 48 }}>
              <Briefcase size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3>No open broadcast leads right now</h3>
              <p style={{ color: 'var(--text-secondary)' }}>You will receive automatic alerts when clients post shoot requirements in your area.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {proJobBoard.map((job) => (
                <div key={job.id} className="card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div className="broadcast-badge" style={{ display: 'inline-flex', marginBottom: 8, fontSize: 11 }}>
                      <Radio size={12} /> <span>OPEN BROADCAST LEAD</span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>{job.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} /> {job.location}
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 8 }}>
                      {job.requirements}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 160 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Offered Budget</span>
                    <strong style={{ fontSize: 22, color: 'var(--accent)' }}>₹{job.budget?.toLocaleString('en-IN')}</strong>
                    
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => handleAcceptLead(job.id)}
                        disabled={actionLoading === job.id}
                        className="btn btn-primary btn-sm"
                      >
                        {actionLoading === job.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          'Accept Lead 📢'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'probookings' && (
        <div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={32} className="animate-spin" /></div>
          ) : proBookings.length === 0 ? (
            <div className="card text-center" style={{ padding: 48 }}>
              <TrendingUp size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3>No incoming bookings yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Ensure your profile and rates are up to date on your public creator profile.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {proBookings.map((b) => (
                <div key={b.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <span className={`status-pill status-${b.status}`} style={{ textTransform: 'uppercase', fontSize: 11 }}>
                      {b.status}
                    </span>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: '6px 0 4px' }}>{b.serviceTitle}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Client: <strong>{b.customerName}</strong> • {b.startDate} to {b.endDate}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📍 {b.location}</p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Payout in Escrow</span>
                    <strong style={{ fontSize: 20, color: 'var(--accent)' }}>₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                    <div style={{ marginTop: 8 }}>
                      <Link to={`/chat?userId=${b.customerId}`} className="btn btn-outline btn-sm">
                        <MessageSquare size={14} /> Message Client
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
