import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { professionalApi } from '../api/professionalApi';
import { bookingApi } from '../api/bookingApi';
import { jobApi } from '../api/jobApi';
import type { ProfessionalProfile } from '../types/professional';
import { LocationSelector } from '../components/LocationSelector';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { useAuthStore } from '../store/authStore';
import { 
  ShieldCheck, 
  CheckCircle, 
  ArrowLeft, 
  Loader2, 
  Lock
} from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { id: proId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const jobId = searchParams.get('jobId');
  const jobTitleParam = searchParams.get('jobTitle');
  const jobBudgetParam = searchParams.get('jobBudget');
  const jobLocationParam = searchParams.get('jobLocation');

  const [pro, setPro] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successBookingId, setSuccessBookingId] = useState('');

  const [serviceTitle, setServiceTitle] = useState(jobTitleParam || 'Video Production & Photography');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysCount, setDaysCount] = useState(1);
  const [location, setLocation] = useState({
    state: 'Maharashtra',
    district: 'Mumbai',
    city: 'Mumbai',
  });
  const [venueAddress, setVenueAddress] = useState(jobLocationParam || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (proId) {
      professionalApi.getProfileById(proId)
        .then((profile) => {
          setPro(profile);
          if (profile.state && profile.district) {
            setLocation({
              state: profile.state,
              district: profile.district,
              city: profile.city || profile.district,
            });
          }
        })
        .catch((e) => setError(e.message || 'Could not load creator details'))
        .finally(() => setLoading(false));
    }
  }, [proId]);

  useEffect(() => {
    try {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setDaysCount(diff > 0 ? diff : 1);
    } catch {
      setDaysCount(1);
    }
  }, [startDate, endDate]);

  const isBudgetLocked = Boolean(jobBudgetParam);
  const totalAmount = isBudgetLocked 
    ? Number(jobBudgetParam) 
    : ((pro?.ratePerDay || 15000) * daysCount);

  const advanceEscrow = Math.round(totalAmount * 0.3);
  const wrapEscrow = Math.round(totalAmount * 0.4);
  const finalEscrow = totalAmount - advanceEscrow - wrapEscrow;

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (!venueAddress.trim()) {
      setError('Please provide the venue address or shoot locality.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const fullLoc = `${venueAddress}, ${location.city}, ${location.district}, ${location.state}`;
      
      const created = await bookingApi.createBooking({
        professionalId: proId,
        professionalName: pro?.name || 'Creator',
        professionalAvatar: pro?.avatar,
        customerId: user?.id || '',
        customerName: user?.name || 'Client',
        serviceTitle,
        startDate,
        endDate,
        daysCount,
        location: fullLoc,
        notes,
        totalAmount,
        ratePerDay: pro?.ratePerDay || totalAmount,
        milestones: [
          { id: '1', title: 'Advance Escrow (30%)', percentage: 30, amount: advanceEscrow, status: 'held' },
          { id: '2', title: 'Shoot Wrap Escrow (40%)', percentage: 40, amount: wrapEscrow, status: 'held' },
          { id: '3', title: 'Final Deliverables Escrow (30%)', percentage: 30, amount: finalEscrow, status: 'held' },
        ],
      });

      if (jobId) {
        await jobApi.markJobBooked(jobId).catch((err) => console.warn('Could not mark job booked:', err));
      }

      await bookingApi.payAndConfirmBooking(created.id).catch((err) => console.warn('Escrow init warning:', err));

      setSuccessBookingId(created.id);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center" style={{ padding: '80px 0' }}>
        <Loader2 size={32} className="animate-spin" />
        <p style={{ marginTop: 12 }}>Loading booking configuration...</p>
      </div>
    );
  }

  if (successBookingId) {
    return (
      <div className="container booking-success-container" style={{ padding: '60px 0', maxWidth: 600 }}>
        <div className="card booking-success-card text-center" style={{ padding: 40 }}>
          <div className="success-icon-circle">
            <CheckCircle size={48} color="var(--accent)" />
          </div>
          <h2>Booking Confirmed & Escrow Initialized!</h2>
          <p className="success-sub" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Your booking with <strong>{pro?.name}</strong> has been secured with Camcrew Milestone Escrow.
          </p>

          <div className="booking-summary-box card" style={{ background: 'var(--bg-surface)', padding: 16, margin: '20px 0', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Service</span>
              <strong>{serviceTitle}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Dates</span>
              <strong>{startDate} to {endDate} ({daysCount} {daysCount === 1 ? 'day' : 'days'})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Budget (in Escrow)</span>
              <strong className="accent-text">₹{totalAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="success-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/dashboard?tab=bookings" className="btn btn-primary btn-lg">
              View in My Bookings →
            </Link>
            <Link to={`/chat?userId=${proId}`} className="btn btn-outline">
              Message {pro?.name}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page container">
      <div className="booking-header" style={{ marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} className="btn btn-sm btn-ghost back-btn">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="page-title">Book Creative Production</h1>
        <p className="page-subtitle">Configure dates, location, and secure your booking with milestone escrow.</p>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="booking-grid">
        <div className="booking-form-col">
          <form onSubmit={handleConfirmBooking} className="card booking-form-card" style={{ padding: 28 }}>
            <h3 className="form-section-title">1. Project & Service Details</h3>

            <div className="form-group">
              <label className="form-label">Service Title</label>
              <input
                type="text"
                className="input-field"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <CustomDatePicker
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    if (endDate && val > endDate) {
                      setEndDate(val);
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder="Select Start Date"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <CustomDatePicker
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  placeholder="Select End Date"
                  required
                />
              </div>
            </div>

            <h3 className="form-section-title" style={{ marginTop: 24 }}>2. Shoot Locality (India)</h3>

            <div className="form-group">
              <label className="form-label">State, District & City</label>
              <LocationSelector
                selectedState={location.state}
                selectedDistrict={location.district}
                selectedCity={location.city}
                onChange={setLocation}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Venue / Studio / Address Details *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Studio 4, Bandra West, or specific event address"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                required
              />
            </div>

            <h3 className="form-section-title" style={{ marginTop: 24 }}>3. Shoot Requirements & Notes</h3>
            <div className="form-group">
              <textarea
                className="input-field"
                rows={3}
                placeholder="Details on lighting, deliverables, schedule, or equipment expectations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg full-width" disabled={submitting}>
              {submitting ? <Loader2 size={18} className="animate-spin" /> : `Confirm & Hold Escrow (₹${totalAmount.toLocaleString('en-IN')}) →`}
            </button>
          </form>
        </div>

        <aside className="booking-summary-col">
          <div className="card summary-card" style={{ padding: 24 }}>
            <h3 className="summary-title" style={{ fontSize: 18, fontWeight: 700 }}>Booking Summary</h3>

            <div className="pro-summary-mini">
              <img src={pro?.avatar} alt={pro?.name} className="mini-avatar" />
              <div>
                <h4 className="mini-name">{pro?.name}</h4>
                <p className="mini-title">{pro?.title}</p>
                <span className="mini-rate">₹{pro?.ratePerDay?.toLocaleString('en-IN')} / day</span>
              </div>
            </div>

            <hr className="divider" />

            <div className="cost-breakdown">
              <div className="cost-row">
                <span>Duration</span>
                <span>{daysCount} {daysCount === 1 ? 'Shoot Day' : 'Shoot Days'}</span>
              </div>
              {isBudgetLocked ? (
                <div className="cost-row locked-row" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  <span>Agreed Broadcast Budget</span>
                  <span><Lock size={12} /> ₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="cost-row">
                  <span>Day Rate (₹{pro?.ratePerDay} × {daysCount})</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="cost-row total-row">
                <strong>Total Amount</strong>
                <strong className="accent-text">₹{totalAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <hr className="divider" />

            <div className="escrow-milestones-box">
              <div className="emb-header">
                <ShieldCheck size={18} color="var(--accent)" />
                <span className="emb-title">Milestone Escrow Schedule</span>
              </div>

              <div className="milestone-item">
                <div className="m-left">
                  <span className="m-dot" />
                  <div>
                    <span className="m-name">Advance Escrow (30%)</span>
                    <span className="m-desc">Held now; locks pro calendar</span>
                  </div>
                </div>
                <span className="m-price">₹{advanceEscrow.toLocaleString('en-IN')}</span>
              </div>

              <div className="milestone-item">
                <div className="m-left">
                  <span className="m-dot" />
                  <div>
                    <span className="m-name">Shoot Wrap Escrow (40%)</span>
                    <span className="m-desc">Released after shoot wraps</span>
                  </div>
                </div>
                <span className="m-price">₹{wrapEscrow.toLocaleString('en-IN')}</span>
              </div>

              <div className="milestone-item">
                <div className="m-left">
                  <span className="m-dot" />
                  <div>
                    <span className="m-name">Deliverables Escrow (30%)</span>
                    <span className="m-desc">Released upon final approval</span>
                  </div>
                </div>
                <span className="m-price">₹{finalEscrow.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookingPage;
