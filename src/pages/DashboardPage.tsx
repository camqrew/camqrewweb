import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import { jobApi } from '../api/jobApi';
import { productApi } from '../api/productApi';
import { professionalApi } from '../api/professionalApi';
import { payoutApi, type PayoutRecord, type CreatorPayoutDetails } from '../api/payoutApi';
import type { Booking } from '../types/booking';
import type { JobRequest } from '../types/job';
import type { Product } from '../types/product';
import type { ProfessionalProfile } from '../types/professional';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard,
  Calendar, 
  Radio, 
  MapPin, 
  MessageSquare, 
  Loader2,
  TrendingUp,
  Eye,
  Star,
  ShoppingBag,
  Package,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  ShieldCheck,
  Zap,
  Film,
  Trash2,
  Smartphone,
  Plus,
  Tv,
  Scale,
  FileText,
  AlertTriangle
} from 'lucide-react';
import type { VideoReelItem } from '../types/professional';
import { parseVideoUrl } from '../api/professionalApi';
import { authApi } from '../api/authApi';
import { ShootContractModal } from '../components/ShootContractModal';

type ProTab = 'overview' | 'bookings' | 'sales_rentals' | 'listings' | 'jobboard' | 'availability' | 'earnings' | 'client';

export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, activeRole, setActiveRole } = useAuthStore();
  const navigate = useNavigate();

  const isProRole = user?.role === 'professional' || activeRole === 'professional';
  const paramTab = searchParams.get('tab') as ProTab | null;
  const initialTab: ProTab = paramTab || (isProRole ? 'overview' : 'client');

  const [activeTab, setActiveTab] = useState<ProTab>(initialTab);
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  // Data states
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [clientJobs, setClientJobs] = useState<JobRequest[]>([]);
  const [proJobBoard, setProJobBoard] = useState<JobRequest[]>([]);
  const [proBookings, setProBookings] = useState<Booking[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [creatorAccount, setCreatorAccount] = useState<CreatorPayoutDetails | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Availability calendar state
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [blockedDates, setBlockedDates] = useState<string[]>(['2026-09-24', '2026-09-25']);

  // Modals state
  const [showListGearModal, setShowListGearModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [payoutInProgress, setPayoutInProgress] = useState(false);

  // Video Reel Modal state
  const [showReelModal, setShowReelModal] = useState(false);
  const [newReelUrl, setNewReelUrl] = useState('');
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelCategory, setNewReelCategory] = useState('Cinematography');
  const [newReelIsShort, setNewReelIsShort] = useState(false);
  const [savingReel, setSavingReel] = useState(false);

  // New product form
  const [newGearTitle, setNewGearTitle] = useState('');
  const [newGearCategory, setNewGearCategory] = useState('Cameras');
  const [newGearType, setNewGearType] = useState<'rental' | 'sale'>('rental');
  const [newGearPrice, setNewGearPrice] = useState<number>(3500);
  const [newGearCondition, setNewGearCondition] = useState('Like New');
  const [newGearImage, setNewGearImage] = useState('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800');
  const [newGearDesc, setNewGearDesc] = useState('');

  // Payout account form
  const [payoutUpi, setPayoutUpi] = useState('');
  const [payoutAccNum, setPayoutAccNum] = useState('');
  const [payoutIfsc, setPayoutIfsc] = useState('');
  const [payoutHolder, setPayoutHolder] = useState('');

  // Shoot Contract Modal State
  const [selectedContractBooking, setSelectedContractBooking] = useState<Booking | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Account Deletion State
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    setDeleteAccountError('');
    try {
      await authApi.deleteAccount();
      navigate('/');
    } catch (err: any) {
      setDeleteAccountError(err.message || 'Failed to delete account.');
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !user) {
      navigate('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (paramTab) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Pro Profile and Dashboard Data
  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch Client Bookings & Jobs
      const [cBookings, cJobs] = await Promise.all([
        bookingApi.getCustomerBookings().catch(() => []),
        jobApi.getClientJobs(user.id).catch(() => []),
      ]);
      setCustomerBookings(cBookings);
      setClientJobs(cJobs);

      // 2. If Professional, fetch pro profile, pro bookings, open leads, listings & payouts
      if (isProRole) {
        try {
          const profile = await professionalApi.getProfileById(user.id);
          setProProfile(profile);
          if (profile.blockedDates && Array.isArray(profile.blockedDates)) {
            setBlockedDates(profile.blockedDates);
          }
        } catch {
          // Provide rich creator defaults for immediate interactive use
          const fallbackPro: ProfessionalProfile = {
            id: user.id,
            userId: user.id,
            name: user.name || 'Creator Studio',
            title: 'Verified Professional Cinematographer & Photographer',
            avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
            bannerImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
            verified: true,
            rating: 4.9,
            reviewCount: 18,
            experienceYears: 5,
            ratePerDay: 18000,
            bio: 'Award-winning cinematographer and visual director specializing in commercial, automotive, and fashion cinema.',
            city: 'Mumbai',
            state: 'Maharashtra',
            district: 'Mumbai',
            locations: ['Mumbai', 'Thane', 'Navi Mumbai'],
            categories: ['Cinematographers', 'Photographers'],
            equipment: ['Sony FX3 Cinema Line', 'Sony GM 24-70mm f/2.8', 'DJI Ronin RS3 Pro', 'Aputure 300d II Light'],
            certifications: ['Camcrew Verified Creator'],
            portfolio: [
              'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800',
              'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
              'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=800'
            ],
            services: [
              { id: 's1', title: 'Ad Film & Commercial Cinematography', category: 'Cinematography', rate: 22000, unit: 'day', description: 'Full cinema production package.' },
              { id: 's2', title: 'Fashion & Editorial Lookbook Photoshoot', category: 'Photography', rate: 16000, unit: 'day', description: 'Studio or outdoor fashion shoot.' }
            ],
            reviews: [],
            weeklyAvailability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
            blockedDates: ['2026-09-24', '2026-09-25'],
            totalEarnings: 380000,
            views: 1420
          };
          setProProfile(fallbackPro);
        }

        const [openJobs, pBookings, products, payoutHistory, acc] = await Promise.all([
          jobApi.getOpenJobs(undefined, user.id).catch(() => []),
          bookingApi.getProfessionalBookings().catch(() => []),
          productApi.getUserProducts().catch(() => []),
          payoutApi.getPayoutHistory().catch(() => []),
          payoutApi.getCreatorAccount().catch(() => null),
        ]);

        setProJobBoard(openJobs);
        setProBookings(pBookings);
        setUserProducts(products);
        setPayouts(payoutHistory);

        if (acc) {
          setCreatorAccount(acc);
          setPayoutUpi(acc.upiId);
          setPayoutAccNum(acc.accountNumber);
          setPayoutIfsc(acc.ifscCode);
          setPayoutHolder(acc.accountHolderName);
        }
      }
    } catch (err) {
      console.warn('Dashboard data fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
    }
  }, [isAuthenticated, user, isProRole]);

  const handleTabChange = (tab: ProTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleAcceptLead = async (jobId: string) => {
    if (!user) return;
    setActionLoading(jobId);
    try {
      await jobApi.acceptJob(jobId, user.id);
      showToast('Lead Accepted! The client has been notified to review your profile and confirm booking.');
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to accept lead');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoading(`accept-${bookingId}`);
    try {
      await bookingApi.acceptBooking(bookingId);
      showToast('Booking request accepted! Client notified for milestone escrow payment.');
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to decline this booking request?')) return;
    setActionLoading(`decline-${bookingId}`);
    try {
      await bookingApi.declineBooking(bookingId);
      showToast('Booking request declined.');
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to decline booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddVideoReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReelUrl.trim()) {
      alert('Please enter a valid YouTube, YouTube Shorts, or Vimeo video URL.');
      return;
    }
    setSavingReel(true);
    try {
      const parsed = parseVideoUrl(newReelUrl);
      const newReel: VideoReelItem = {
        id: 'reel_' + Date.now(),
        title: newReelTitle.trim() || (parsed.isShort ? 'Vertical Reel' : 'Cinematic Showreel'),
        url: newReelUrl.trim(),
        type: parsed.type,
        embedUrl: parsed.embedUrl,
        thumbnailUrl: parsed.thumbnailUrl,
        category: newReelCategory || 'Cinematography',
        isShort: newReelIsShort !== undefined ? newReelIsShort : parsed.isShort,
      };

      const existingReels = proProfile?.videoReels || [];
      const updatedReels = [newReel, ...existingReels];

      await professionalApi.updateProfile({ videoReels: updatedReels });
      setProProfile(prev => prev ? { ...prev, videoReels: updatedReels } : null);
      showToast('🎉 Video reel successfully published to your creator profile!');
      setShowReelModal(false);
      setNewReelUrl('');
      setNewReelTitle('');
    } catch (err: any) {
      alert(err.message || 'Failed to save video reel');
    } finally {
      setSavingReel(false);
    }
  };

  const handleDeleteVideoReel = async (reelId: string) => {
    if (!confirm('Are you sure you want to remove this video reel from your public profile?')) return;
    try {
      const existingReels = proProfile?.videoReels || [];
      const updatedReels = existingReels.filter(r => r.id !== reelId);
      await professionalApi.updateProfile({ videoReels: updatedReels });
      setProProfile(prev => prev ? { ...prev, videoReels: updatedReels } : null);
      showToast('Video reel removed from profile.');
    } catch (err: any) {
      alert(err.message || 'Failed to remove reel');
    }
  };

  // Toggle date in Availability Calendar
  const handleToggleDate = (dateStr: string) => {
    setBlockedDates((prev) => {
      const isBlocked = prev.includes(dateStr);
      const next = isBlocked ? prev.filter((d) => d !== dateStr) : [...prev, dateStr];
      showToast(isBlocked ? `Marked ${dateStr} as Available` : `Marked ${dateStr} as Blocked / Booked`);
      return next;
    });
  };

  // List gear submission
  const handleCreateGear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearTitle.trim()) return;
    setActionLoading('create-gear');

    try {
      const created = await productApi.createProduct({
        name: newGearTitle,
        category: newGearCategory,
        type: newGearType,
        price: newGearPrice,
        rentalPricePerDay: newGearType === 'rental' ? newGearPrice : undefined,
        condition: newGearCondition as any,
        image: newGearImage,
        description: newGearDesc,
        inStock: true,
      });

      setUserProducts((prev) => [created, ...prev]);
      setShowListGearModal(false);
      setNewGearTitle('');
      setNewGearDesc('');
      showToast('Gear successfully listed to Camcrew Store!');
    } catch (err: any) {
      alert(err.message || 'Failed to list equipment');
    } finally {
      setActionLoading(null);
    }
  };

  // Instant Payout Request
  const handleRequestInstantPayout = async () => {
    setPayoutInProgress(true);
    try {
      const record = await payoutApi.requestInstantPayout(25000, 'upi');
      setPayouts((prev) => [record, ...prev]);
      showToast(`Payout sent! ₹25,000 transferred to ${creatorAccount?.upiId || 'UPI Account'}`);
    } catch (err: any) {
      alert(err.message || 'Payout transfer failed');
    } finally {
      setPayoutInProgress(false);
    }
  };

  // Save creator payout account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      upiId: payoutUpi,
      accountNumber: payoutAccNum,
      ifscCode: payoutIfsc,
      accountHolderName: payoutHolder,
    };
    await payoutApi.saveCreatorAccount(updated);
    setCreatorAccount(updated);
    setShowAccountModal(false);
    showToast('Payout account details updated successfully!');
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: { day: number; dateStr: string; isBlocked: boolean; isToday: boolean }[] = [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isBlocked: blockedDates.includes(dateStr),
        isToday: dateStr === todayStr,
      });
    }

    return { firstDay, daysInMonth, days };
  }, [calendarYear, calendarMonth, blockedDates]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="dashboard-page container" style={{ paddingBottom: 60, minHeight: '80vh' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dashboard-toast">
          <CheckCircle2 size={16} color="#3fb668" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP HERO HEADER: PRO STUDIO DASHBOARD ── */}
      <div className="pro-dashboard-header-card card">
        <div className="pro-header-profile-col">
          <div className="pro-avatar-wrapper">
            <img 
              src={user?.avatar || proProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'} 
              alt={user?.name} 
              className="pro-header-avatar"
            />
            {proProfile?.verified && (
              <span className="pro-verified-badge" title="Verified Creator">
                <ShieldCheck size={14} color="#ffffff" />
              </span>
            )}
          </div>

          <div className="pro-header-details">
            <div className="pro-studio-tag-row">
              <span className="pro-studio-tag">
                <span className="live-dot" /> PRO STUDIO DASHBOARD
              </span>
              <button 
                className={`availability-toggle-btn ${isAvailable ? 'is-available' : 'is-busy'}`}
                onClick={() => setIsAvailable((prev) => !prev)}
                title="Click to toggle studio availability status"
              >
                <span className="status-circle" />
                {isAvailable ? 'Available for Shoots' : 'Busy / On Shoot'}
              </button>
            </div>

            <h1 className="pro-header-name">{user?.name || proProfile?.name || 'Creative Studio'}</h1>
            <p className="pro-header-title">
              {proProfile?.title || 'Visual Storyteller & Creator'} • 📍 {proProfile?.city || 'Mumbai'}, {proProfile?.state || 'Maharashtra'}
            </p>

            <div className="pro-meta-pills">
              <span className="meta-pill rating-pill">
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <strong>{proProfile?.rating?.toFixed(1) || '4.9'}</strong> ({proProfile?.reviewCount || 18} reviews)
              </span>
              <span className="meta-pill">
                Rate: <strong>₹{(proProfile?.ratePerDay || 18000).toLocaleString('en-IN')}/day</strong>
              </span>
              <span className="meta-pill">
                Experience: <strong>{proProfile?.experienceYears || 5} Years</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Action Buttons */}
        <div className="pro-header-actions">
          {user && (
            <Link 
              to={`/creators/${user.id}`} 
              className="btn btn-outline btn-sm"
              target="_blank"
              title="View your public booking page as seen by clients"
            >
              <ExternalLink size={14} /> Public Profile
            </Link>
          )}

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowListGearModal(true)}
          >
            <Package size={14} /> + List Gear
          </button>

          {/* Quick role switch for testing or multi-role users */}
          <button 
            className="btn btn-ghost btn-sm role-switch-btn"
            onClick={() => {
              const nextRole = isProRole ? 'customer' : 'professional';
              setActiveRole(nextRole);
              showToast(`Switched view to ${nextRole === 'professional' ? 'Creator Mode' : 'Client Mode'}`);
            }}
            title="Toggle between Creator Studio and Client View"
          >
            {isProRole ? '⇄ Client Mode' : '⇄ Creator Mode'}
          </button>
        </div>
      </div>

      {/* ── NAVIGATION TABS BAR ── */}
      <div className="pro-tabs-container">
        <button
          className={`pro-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <LayoutDashboard size={15} /> Overview
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => handleTabChange('bookings')}
        >
          <Calendar size={15} /> Service Bookings ({proBookings.length})
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'sales_rentals' ? 'active' : ''}`}
          onClick={() => handleTabChange('sales_rentals')}
        >
          <ShoppingBag size={15} /> Sales & Rentals
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => handleTabChange('listings')}
        >
          <Package size={15} /> My Gear Store ({userProducts.length})
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'jobboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('jobboard')}
        >
          <Radio size={15} /> Broadcast Job Board ({proJobBoard.length})
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'availability' ? 'active' : ''}`}
          onClick={() => handleTabChange('availability')}
        >
          <Clock size={15} /> Availability Calendar
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => handleTabChange('earnings')}
        >
          <CreditCard size={15} /> Payouts & Earnings
        </button>

        <button
          className={`pro-tab-item client-tab ${activeTab === 'client' ? 'active' : ''}`}
          onClick={() => handleTabChange('client')}
        >
          ⇄ Client Bookings ({customerBookings.length})
        </button>
      </div>

      {/* ── TAB CONTENT ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your creator studio dashboard...</p>
        </div>
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════════
              TAB 1: STUDIO OVERVIEW (MATCHING MOBILE APP OVERVIEW)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="tab-overview-content">
              {/* 4 Stat Cards */}
              <div className="pro-stats-grid">
                <div className="pro-stat-card card">
                  <div className="stat-icon-wrap emerald">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span className="stat-label">Total Studio Earnings</span>
                    <h3 className="stat-number">₹{(proProfile?.totalEarnings || 380000).toLocaleString('en-IN')}</h3>
                    <span className="stat-subtext">Verified escrow releases</span>
                  </div>
                </div>

                <div className="pro-stat-card card">
                  <div className="stat-icon-wrap blue">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="stat-label">This Month Bookings</span>
                    <h3 className="stat-number">{proBookings.length > 0 ? proBookings.length : 8} Shoots</h3>
                    <span className="stat-subtext">Active & confirmed schedule</span>
                  </div>
                </div>

                <div className="pro-stat-card card">
                  <div className="stat-icon-wrap purple">
                    <Eye size={20} />
                  </div>
                  <div>
                    <span className="stat-label">Profile Views</span>
                    <h3 className="stat-number">{(proProfile?.views || 1420).toLocaleString('en-IN')}</h3>
                    <span className="stat-subtext">30-day client impressions</span>
                  </div>
                </div>

                <div className="pro-stat-card card">
                  <div className="stat-icon-wrap amber">
                    <Star size={20} fill="#f59e0b" color="#f59e0b" />
                  </div>
                  <div>
                    <span className="stat-label">Average Client Rating</span>
                    <h3 className="stat-number">{proProfile?.rating?.toFixed(1) || '4.9'} ★</h3>
                    <span className="stat-subtext">From {proProfile?.reviewCount || 18} verified reviews</span>
                  </div>
                </div>
              </div>

              {/* Revenue & Category Breakdown Charts Grid */}
              <div className="pro-charts-row">
                {/* Monthly Revenue Bar Chart */}
                <div className="card pro-chart-card">
                  <div className="chart-header">
                    <div>
                      <h3 className="chart-title">Monthly Revenue Trend</h3>
                      <p className="chart-subtitle">Escrow payouts received in 2026</p>
                    </div>
                    <span className="chart-highlight-pill">+28% this quarter</span>
                  </div>

                  <div className="revenue-bars-wrap">
                    {[
                      { month: 'Jan', value: 12000, height: 25 },
                      { month: 'Feb', value: 25000, height: 48 },
                      { month: 'Mar', value: 18000, height: 35 },
                      { month: 'Apr', value: 32000, height: 62 },
                      { month: 'May', value: 45000, height: 86 },
                      { month: 'Jun', value: 38000, height: 72 },
                      { month: 'Jul', value: 52000, height: 100, isPeak: true },
                    ].map((item, idx) => (
                      <div key={idx} className="revenue-bar-col">
                        <div className="revenue-bar-track">
                          <div 
                            className={`revenue-bar-fill ${item.isPeak ? 'is-peak' : ''}`}
                            style={{ height: `${item.height}%` }}
                            title={`${item.month}: ₹${item.value.toLocaleString('en-IN')}`}
                          />
                        </div>
                        <span className="bar-label">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bookings by Category Card */}
                <div className="card pro-chart-card">
                  <div className="chart-header">
                    <div>
                      <h3 className="chart-title">Bookings by Category</h3>
                      <p className="chart-subtitle">Distribution of creative services</p>
                    </div>
                    <span className="chart-highlight-pill">38 Total Shoots</span>
                  </div>

                  <div className="category-breakdown-list">
                    {[
                      { name: 'Commercial & Brand Films', count: 18, pct: 47, color: '#00dbe9' },
                      { name: 'Fashion & Lookbook Shoots', count: 12, pct: 32, color: '#b600f8' },
                      { name: 'Events & Documentaries', count: 8, pct: 21, color: '#22c55e' },
                    ].map((cat, idx) => (
                      <div key={idx} className="cat-breakdown-item">
                        <div className="cat-breakdown-meta">
                          <div className="cat-name-dot">
                            <span className="cat-dot" style={{ background: cat.color }} />
                            <span className="cat-name">{cat.name}</span>
                          </div>
                          <span className="cat-stats">
                            <strong>{cat.count} shoots</strong> ({cat.pct}%)
                          </span>
                        </div>
                        <div className="cat-progress-track">
                          <div 
                            className="cat-progress-fill" 
                            style={{ width: `${cat.pct}%`, background: cat.color }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Studio Action Cards */}
              <h3 className="section-heading" style={{ marginTop: 28, marginBottom: 16 }}>
                Studio Management Shortcuts
              </h3>
              <div className="quick-actions-grid">
                <div 
                  className="quick-action-card card clickable"
                  onClick={() => handleTabChange('availability')}
                >
                  <div className="action-icon emerald"><Clock size={20} /></div>
                  <h4>Manage Availability</h4>
                  <p>Block shoot dates and sync your production calendar</p>
                  <span className="action-arrow">Open Calendar →</span>
                </div>

                <div 
                  className="quick-action-card card clickable"
                  onClick={() => setShowListGearModal(true)}
                >
                  <div className="action-icon blue"><Package size={20} /></div>
                  <h4>Sell or Rent Your Gear</h4>
                  <p>List idle cameras and lenses on Camcrew Store for passive income</p>
                  <span className="action-arrow">List New Equipment →</span>
                </div>

                <div 
                  className="quick-action-card card clickable"
                  onClick={() => handleTabChange('jobboard')}
                >
                  <div className="action-icon purple"><Radio size={20} /></div>
                  <h4>Broadcast Leads Pool</h4>
                  <p>Review and pitch open shoot requirements in your district</p>
                  <span className="action-arrow">View {proJobBoard.length} Open Leads →</span>
                </div>

                <div 
                  className="quick-action-card card clickable"
                  onClick={() => handleTabChange('earnings')}
                >
                  <div className="action-icon amber"><CreditCard size={20} /></div>
                  <h4>Instant UPI Payouts</h4>
                  <p>Withdraw cleared escrow balances directly to your bank account</p>
                  <span className="action-arrow">Request Payout →</span>
                </div>
              </div>

              {/* ── SHOWREELS & VIDEO REELS MANAGER ── */}
              <div className="card pro-reels-manager-card" style={{ marginTop: 28 }}>
                <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Film size={20} color="var(--accent, #3fb668)" />
                      My Video Reels & Showreels
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                      Embed YouTube, 9:16 Shorts, and Vimeo videos to showcase your work directly on your public profile.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setNewReelUrl('');
                      setNewReelTitle('');
                      setNewReelIsShort(false);
                      setShowReelModal(true);
                    }}
                  >
                    <Plus size={14} /> + Add Video Reel
                  </button>
                </div>

                {(!proProfile?.videoReels || proProfile.videoReels.length === 0) ? (
                  <div className="empty-reels-box">
                    <Film size={36} className="empty-reels-icon" />
                    <h4>No video reels added yet</h4>
                    <p>Add YouTube videos, cinematic teasers, and 9:16 vertical shorts to attract more clients.</p>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowReelModal(true)}
                      style={{ marginTop: 12 }}
                    >
                      <Plus size={14} /> Add First Reel
                    </button>
                  </div>
                ) : (
                  <div className="pro-dashboard-reels-grid">
                    {proProfile.videoReels.map((reel) => (
                      <div key={reel.id} className="pro-dashboard-reel-card">
                        <div className="pro-reel-thumb-container">
                          <img 
                            src={reel.thumbnailUrl || 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=800'} 
                            alt={reel.title} 
                            className="pro-reel-thumb-img"
                          />
                          <span className="pro-reel-type-pill">
                            {reel.isShort ? '9:16 Short' : '16:9 Cinema'}
                          </span>
                        </div>
                        <div className="pro-reel-details">
                          <h4 className="pro-reel-card-title">{reel.title}</h4>
                          <span className="pro-reel-category-pill">{reel.category || 'Cinematography'}</span>
                          <div className="pro-reel-footer-row">
                            <a 
                              href={reel.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="pro-reel-external-link"
                            >
                              <ExternalLink size={12} /> Test Link
                            </a>
                            <button 
                              type="button"
                              className="pro-reel-delete-btn"
                              onClick={() => handleDeleteVideoReel(reel.id)}
                              title="Delete reel"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── LEGAL, PRIVACY & DANGER ZONE ── */}
              <div className="card legal-danger-zone-card" style={{ marginTop: 28, borderColor: 'rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                      <Scale size={18} color="var(--accent)" />
                      Legal, Compliance & Account Security
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                      Review our DPDP Act 2023 Privacy Policy, Milestone Escrow Rules, or manage your account data rights.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link to="/terms" className="btn btn-outline btn-sm">
                      <FileText size={14} /> Legal Center
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm delete-account-trigger-btn"
                      style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                      onClick={() => setShowDeleteAccountModal(true)}
                    >
                      <Trash2 size={14} /> Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 2: SERVICE BOOKINGS
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'bookings' && (
            <div className="tab-bookings-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">Incoming Service Bookings</h2>
                  <p className="section-subtitle">
                    Manage client bookings with 3-stage milestone escrow protection.
                  </p>
                </div>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => handleTabChange('availability')}
                >
                  <Clock size={14} /> Manage Calendar →
                </button>
              </div>

              {proBookings.length === 0 ? (
                <div className="card empty-state-card">
                  <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <h3>No service bookings yet</h3>
                  <p>When clients book your services from your public profile, they will appear here with automated escrow milestones.</p>
                  <button 
                    className="btn btn-primary"
                    style={{ marginTop: 16 }}
                    onClick={() => handleTabChange('jobboard')}
                  >
                    Find Open Client Leads on Job Board
                  </button>
                </div>
              ) : (
                <div className="bookings-cards-list">
                  {proBookings.map((b) => (
                    <div key={b.id} className="card pro-booking-card">
                      <div className="booking-card-main">
                        <div className="booking-status-header">
                          <span className={`status-pill status-${b.status}`}>
                            {b.status.toUpperCase()}
                          </span>
                          <span className="booking-date-range">
                            📅 {b.startDate} to {b.endDate} ({b.daysCount} {b.daysCount === 1 ? 'day' : 'days'})
                          </span>
                        </div>

                        <h3 className="booking-service-title">{b.serviceTitle}</h3>

                        <div className="booking-client-info">
                          <div className="client-avatar-row">
                            <span className="client-avatar-text">{b.customerName ? b.customerName[0] : 'C'}</span>
                            <div>
                              <strong className="client-name">{b.customerName || 'Verified Client'}</strong>
                              <span className="client-meta">Client ID: {b.customerId.slice(0, 8)}...</span>
                            </div>
                          </div>
                          <span className="booking-location">
                            <MapPin size={13} /> {b.location || 'Shoot location specified in contract'}
                          </span>
                        </div>

                        {/* Milestone Escrow Status */}
                        <div className="escrow-milestone-strip">
                          <div className="milestone-step done">
                            <span className="step-dot" /> 30% Advance Escrow
                          </div>
                          <div className={`milestone-step ${b.status === 'confirmed' || b.status === 'completed' ? 'done' : 'pending'}`}>
                            <span className="step-dot" /> 40% Shoot Wrap
                          </div>
                          <div className={`milestone-step ${b.status === 'completed' ? 'done' : 'pending'}`}>
                            <span className="step-dot" /> 30% Deliverables
                          </div>
                        </div>
                      </div>

                      <div className="booking-card-side">
                        <div className="payout-amount-box">
                          <span className="payout-label">Payout in Escrow</span>
                          <strong className="payout-val">₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                        </div>

                        <div className="booking-actions-row">
                          {b.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAcceptBooking(b.id)}
                                disabled={actionLoading === `accept-${b.id}`}
                              >
                                {actionLoading === `accept-${b.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Accept Booking ✓'}
                              </button>
                              <button 
                                className="btn btn-outline btn-sm decline-btn"
                                onClick={() => handleDeclineBooking(b.id)}
                                disabled={actionLoading === `decline-${b.id}`}
                              >
                                Decline
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline btn-sm contract-action-btn"
                            onClick={() => {
                              setSelectedContractBooking(b);
                              setShowContractModal(true);
                            }}
                            title="View and sign legal shoot contract"
                          >
                            <FileText size={14} /> Contract
                          </button>

                          <Link 
                            to={`/chat?userId=${b.customerId}`} 
                            className="btn btn-outline btn-sm"
                          >
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

          {/* ═════════════════════════════════════════════════════════
              TAB 3: SALES & RENTALS
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'sales_rentals' && (
            <div className="tab-sales-rentals-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">Equipment Sales & Rental Orders</h2>
                  <p className="section-subtitle">
                    Incoming gear rental bookings and verified store sale orders.
                  </p>
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowListGearModal(true)}
                >
                  <Package size={14} /> + List More Gear
                </button>
              </div>

              <div className="card empty-state-card">
                <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                <h3>No incoming gear orders yet</h3>
                <p>Post your cinema cameras, lenses, or lighting equipment for rent or sale to earn steady revenue between production shoots.</p>
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: 16 }}
                  onClick={() => setShowListGearModal(true)}
                >
                  List Equipment for Sale or Rent
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 4: LISTINGS & GEAR STORE
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'listings' && (
            <div className="tab-listings-content">
              {/* Quick Action Banner */}
              <div className="list-gear-banner card">
                <div className="list-gear-banner-content">
                  <div className="list-gear-icon-box">
                    <Camera size={26} color="#ffffff" />
                  </div>
                  <div>
                    <h3 className="banner-title">Sell or Rent Your Camera Gear</h3>
                    <p className="banner-subtitle">
                      Publish cameras, cinema lenses, or drones to the Camcrew Store with insured shipping.
                    </p>
                  </div>
                </div>
                <button 
                  className="btn btn-primary list-now-btn"
                  onClick={() => setShowListGearModal(true)}
                >
                  + List Equipment Now
                </button>
              </div>

              {/* User Listings Grid */}
              <h3 className="section-heading" style={{ marginTop: 28, marginBottom: 16 }}>
                Your Listed Equipment ({userProducts.length})
              </h3>

              {userProducts.length === 0 ? (
                <div className="card empty-state-card">
                  <Package size={44} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
                  <h4>No equipment listed yet</h4>
                  <p>Click "List Equipment Now" above to add your first camera or rental package.</p>
                </div>
              ) : (
                <div className="products-grid">
                  {userProducts.map((p) => (
                    <div key={p.id} className="card pro-gear-item-card">
                      <div className="gear-image-wrap">
                        <img src={p.image} alt={p.name} className="gear-img" />
                        <span className={`gear-type-badge ${p.type === 'rental' ? 'rental' : 'sale'}`}>
                          {p.type === 'rental' ? 'FOR RENT' : 'FOR SALE'}
                        </span>
                      </div>
                      <div className="gear-card-body">
                        <span className="gear-category">{p.category}</span>
                        <h4 className="gear-title">{p.name}</h4>
                        <p className="gear-condition">Condition: <strong>{p.condition}</strong></p>
                        <div className="gear-price-row">
                          <strong className="gear-price">
                            ₹{p.price?.toLocaleString('en-IN')}{p.type === 'rental' ? '/day' : ''}
                          </strong>
                          <span className="gear-stock-pill in-stock">Listed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 5: BROADCAST JOB BOARD
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'jobboard' && (
            <div className="tab-jobboard-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">Open Broadcast Leads in Your Locality</h2>
                  <p className="section-subtitle">
                    Clients broadcast their shoot requirements directly to verified creators in their district. Accept a lead to pitch your day rate.
                  </p>
                </div>
              </div>

              {proJobBoard.length === 0 ? (
                <div className="card empty-state-card">
                  <Radio size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <h3>No open broadcast leads right now</h3>
                  <p>You will receive instant alerts when clients in your district broadcast shoot requirements.</p>
                </div>
              ) : (
                <div className="jobs-leads-list">
                  {proJobBoard.map((job) => (
                    <div key={job.id} className="card pro-job-lead-card">
                      <div className="lead-details">
                        <div className="broadcast-live-badge">
                          <Radio size={13} /> <span>OPEN BROADCAST LEAD</span>
                        </div>
                        <h3 className="lead-title">{job.title}</h3>
                        <p className="lead-loc">
                          <MapPin size={14} /> {job.location}
                        </p>
                        <p className="lead-desc">{job.requirements}</p>
                      </div>

                      <div className="lead-action-col">
                        <span className="budget-label">Offered Budget</span>
                        <strong className="budget-val">₹{job.budget?.toLocaleString('en-IN')}</strong>

                        <button
                          className="btn btn-primary btn-sm accept-lead-btn"
                          onClick={() => handleAcceptLead(job.id)}
                          disabled={actionLoading === job.id}
                        >
                          {actionLoading === job.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            'Accept Lead 📢'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 6: AVAILABILITY CALENDAR
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'availability' && (
            <div className="tab-availability-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">Availability & Production Calendar</h2>
                  <p className="section-subtitle">
                    Click any day to mark it Available (Green) or Blocked / Booked (Red). Clients can only book days marked Available.
                  </p>
                </div>

                <div className="cal-legend-row">
                  <div className="legend-item"><span className="legend-dot green" /> Available</div>
                  <div className="legend-item"><span className="legend-dot red" /> Blocked / On Shoot</div>
                </div>
              </div>

              <div className="card cal-container-card">
                {/* Month Navigator Header */}
                <div className="cal-header-bar">
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear((y) => y - 1);
                      } else {
                        setCalendarMonth((m) => m - 1);
                      }
                    }}
                  >
                    <ChevronLeft size={16} /> Prev Month
                  </button>

                  <h3 className="cal-current-month">
                    {monthNames[calendarMonth]} {calendarYear}
                  </h3>

                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear((y) => y + 1);
                      } else {
                        setCalendarMonth((m) => m + 1);
                      }
                    }}
                  >
                    Next Month <ChevronRight size={16} />
                  </button>
                </div>

                {/* Weekdays */}
                <div className="cal-weekdays-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                    <span key={w} className="cal-weekday-name">{w}</span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="cal-matrix-grid">
                  {Array.from({ length: calendarDays.firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="cal-day-cell is-empty" />
                  ))}

                  {calendarDays.days.map((item) => (
                    <div 
                      key={item.dateStr}
                      className={`cal-day-cell clickable ${item.isBlocked ? 'is-blocked' : 'is-available'} ${item.isToday ? 'is-today' : ''}`}
                      onClick={() => handleToggleDate(item.dateStr)}
                      title={`Click to toggle availability for ${item.dateStr}`}
                    >
                      <span className="cal-day-number">{item.day}</span>
                      <span className="cal-day-badge">
                        {item.isBlocked ? 'Blocked' : 'Available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 7: PAYOUTS & EARNINGS
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'earnings' && (
            <div className="tab-earnings-content">
              <div className="earnings-hero-card card">
                <div className="earnings-hero-left">
                  <span className="earnings-hero-label">Available Cleared Balance</span>
                  <h2 className="earnings-hero-amount">₹38,000</h2>
                  <p className="earnings-hero-sub">
                    Ready for instant payout to: <strong>{creatorAccount?.upiId || 'thaha@okaxis'}</strong>
                  </p>
                </div>

                <div className="earnings-hero-right">
                  <button 
                    className="btn btn-primary instant-payout-btn"
                    onClick={handleRequestInstantPayout}
                    disabled={payoutInProgress}
                  >
                    {payoutInProgress ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Zap size={16} /> Instant Payout via UPI →
                      </>
                    )}
                  </button>

                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowAccountModal(true)}
                  >
                    Manage Bank / UPI Account
                  </button>
                </div>
              </div>

              {/* Payout Transactions History Table */}
              <h3 className="section-heading" style={{ marginTop: 28, marginBottom: 16 }}>
                Payout History
              </h3>

              <div className="card payouts-table-card">
                <table className="payouts-table">
                  <thead>
                    <tr>
                      <th>Transaction Ref</th>
                      <th>Method</th>
                      <th>Destination</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((po) => (
                      <tr key={po.id}>
                        <td className="tx-ref"><code>{po.transactionRef}</code></td>
                        <td>{po.method.toUpperCase()}</td>
                        <td>{po.destination}</td>
                        <td>{new Date(po.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td><strong style={{ color: 'var(--accent)' }}>₹{po.amount.toLocaleString('en-IN')}</strong></td>
                        <td>
                          <span className="status-pill status-completed">
                            COMPLETED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 8: CLIENT VIEW (CUSTOMER BOOKINGS & POSTED JOBS)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'client' && (
            <div className="tab-client-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">Client Bookings & Broadcast Shoots</h2>
                  <p className="section-subtitle">
                    Shoots you booked with other verified creators and broadcast jobs you posted.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to="/jobs/create" className="btn btn-primary btn-sm">
                    + Post Broadcast Job
                  </Link>
                  <Link to="/explore" className="btn btn-outline btn-sm">
                    Explore Creators
                  </Link>
                </div>
              </div>

              {/* Customer bookings list */}
              <h3 className="section-heading" style={{ marginTop: 20, marginBottom: 12 }}>
                Shoots You Booked ({customerBookings.length})
              </h3>

              {customerBookings.length === 0 ? (
                <div className="card empty-state-card" style={{ marginBottom: 28 }}>
                  <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h4>No bookings as a client yet</h4>
                  <p>Book local cinematographers, editors, or drone operators with milestone escrow protection.</p>
                  <Link to="/explore" className="btn btn-primary" style={{ marginTop: 14 }}>Explore Talent</Link>
                </div>
              ) : (
                <div className="bookings-cards-list" style={{ marginBottom: 28 }}>
                  {customerBookings.map((b) => (
                    <div key={b.id} className="card pro-booking-card">
                      <div className="booking-card-main">
                        <span className={`status-pill status-${b.status}`}>{b.status.toUpperCase()}</span>
                        <h3 className="booking-service-title">{b.serviceTitle}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          With <strong>{b.professionalName}</strong> • {b.startDate} ({b.daysCount} days)
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>📍 {b.location}</p>
                      </div>

                      <div className="booking-card-side">
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Escrow Total</span>
                        <strong className="payout-val">₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm contract-action-btn"
                            onClick={() => {
                              setSelectedContractBooking(b);
                              setShowContractModal(true);
                            }}
                            title="View and sign legal shoot contract"
                          >
                            <FileText size={14} /> Shoot Contract
                          </button>
                          <Link to={`/chat?userId=${b.professionalId}`} className="btn btn-outline btn-sm">
                            <MessageSquare size={14} /> Message Pro
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Broadcast jobs posted by user */}
              <h3 className="section-heading" style={{ marginBottom: 12 }}>
                Your Posted Broadcast Jobs ({clientJobs.length})
              </h3>

              {clientJobs.length === 0 ? (
                <div className="card empty-state-card">
                  <Radio size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h4>No broadcast jobs posted</h4>
                  <p>Need a crew urgently? Broadcast your shoot requirements to verified creators.</p>
                  <Link to="/jobs/create" className="btn btn-primary" style={{ marginTop: 14 }}>Post Broadcast Job</Link>
                </div>
              ) : (
                <div className="jobs-leads-list">
                  {clientJobs.map((job) => (
                    <div key={job.id} className="card pro-job-lead-card">
                      <div>
                        <span className={`status-pill status-${job.status}`}>{job.status.toUpperCase()}</span>
                        <h3 className="lead-title" style={{ marginTop: 6 }}>{job.title}</h3>
                        <p className="lead-loc"><MapPin size={13} /> {job.location}</p>
                        <p className="lead-desc">{job.requirements}</p>
                      </div>

                      <div className="lead-action-col">
                        <span className="budget-label">Budget</span>
                        <strong className="budget-val">₹{job.budget?.toLocaleString('en-IN')}</strong>
                        {job.status === 'reviewing' && (
                          <Link to={`/jobs/review/${job.id}`} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                            Review Applicant →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── MODAL: LIST GEAR FOR RENT / SALE ── */}
      {showListGearModal && (
        <div className="dashboard-modal-backdrop" onClick={() => setShowListGearModal(false)}>
          <div className="dashboard-modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>List Equipment for Sale or Rent</h3>
              <button className="btn-close" onClick={() => setShowListGearModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGear} className="modal-form">
              <div className="form-group">
                <label className="form-label">Equipment Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Sony FX3 Cinema Line Full-Frame Camera"
                  value={newGearTitle}
                  onChange={(e) => setNewGearTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="input-field"
                    value={newGearCategory}
                    onChange={(e) => setNewGearCategory(e.target.value)}
                  >
                    <option value="Cameras">Cameras</option>
                    <option value="Lenses">Lenses</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Audio">Audio</option>
                    <option value="Drones">Drones</option>
                    <option value="Gimbals">Gimbals & Rigs</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Listing Type</label>
                  <select 
                    className="input-field"
                    value={newGearType}
                    onChange={(e) => setNewGearType(e.target.value as any)}
                  >
                    <option value="rental">For Rent (Per Day Rate)</option>
                    <option value="sale">For Sale (Full Price)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    {newGearType === 'rental' ? 'Daily Rent Rate (₹)' : 'Selling Price (₹)'}
                  </label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={newGearPrice}
                    onChange={(e) => setNewGearPrice(Number(e.target.value))}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gear Condition</label>
                  <select 
                    className="input-field"
                    value={newGearCondition}
                    onChange={(e) => setNewGearCondition(e.target.value)}
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New (Mint)</option>
                    <option value="Good">Good Condition</option>
                    <option value="Fair">Fair / Workhorse</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input 
                  type="url" 
                  className="input-field"
                  value={newGearImage}
                  onChange={(e) => setNewGearImage(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Inclusions</label>
                <textarea 
                  className="input-field" 
                  rows={3}
                  placeholder="Includes 2x CFexpress cards, 3x batteries, dual charger, and Pelican case."
                  value={newGearDesc}
                  onChange={(e) => setNewGearDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowListGearModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={actionLoading === 'create-gear'}
                >
                  {actionLoading === 'create-gear' ? <Loader2 size={16} className="animate-spin" /> : 'Publish to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: MANAGE CREATOR PAYOUT ACCOUNT ── */}
      {showAccountModal && (
        <div className="dashboard-modal-backdrop" onClick={() => setShowAccountModal(false)}>
          <div className="dashboard-modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bank & UPI Payout Settings</h3>
              <button className="btn-close" onClick={() => setShowAccountModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="modal-form">
              <div className="form-group">
                <label className="form-label">Default UPI ID (Fast Payouts)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. name@okaxis or name@paytm"
                  value={payoutUpi}
                  onChange={(e) => setPayoutUpi(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Holder Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={payoutHolder}
                  onChange={(e) => setPayoutHolder(e.target.value)}
                  required 
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Bank Account Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={payoutAccNum}
                    onChange={(e) => setPayoutAccNum(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank IFSC Code</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={payoutIfsc}
                    onChange={(e) => setPayoutIfsc(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowAccountModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD VIDEO REEL / SHOWREEL ── */}
      {showReelModal && (
        <div className="dashboard-modal-backdrop" onClick={() => setShowReelModal(false)}>
          <div className="dashboard-modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(63, 182, 104, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3fb668' }}>
                  <Film size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Add Video Reel or Showreel</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>YouTube, YouTube Shorts, or Vimeo URL</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowReelModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddVideoReel} className="modal-form">
              <div className="form-group">
                <label className="form-label">Video URL (YouTube or Vimeo)</label>
                <input 
                  type="url" 
                  className="input-field" 
                  placeholder="https://www.youtube.com/shorts/... or https://vimeo.com/..." 
                  value={newReelUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setNewReelUrl(url);
                    const parsed = parseVideoUrl(url);
                    if (parsed.isShort) {
                      setNewReelIsShort(true);
                    }
                  }}
                  required 
                />
                <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
                  Supports YouTube standard videos, 9:16 vertical Shorts, and Vimeo links.
                </span>
              </div>

              {/* Dynamic Thumbnail / Embed Detection preview */}
              {newReelUrl.trim() && (() => {
                const parsed = parseVideoUrl(newReelUrl);
                return (
                  <div className="reel-detect-preview-box">
                    {parsed.thumbnailUrl && (
                      <img src={parsed.thumbnailUrl} alt="" className="reel-detect-thumb" />
                    )}
                    <div className="reel-detect-info">
                      <span className="reel-detect-badge">
                        Detected: {parsed.type.toUpperCase()} {parsed.isShort ? '(9:16 Short)' : '(16:9 Cinema)'}
                      </span>
                      <p className="reel-detect-note">Ready to embed directly on your creator profile.</p>
                    </div>
                  </div>
                );
              })()}

              <div className="form-group">
                <label className="form-label">Reel Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Wedding Cinematic Teaser 2026, Fashion Lookbook Reel" 
                  value={newReelTitle}
                  onChange={(e) => setNewReelTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Category / Tag</label>
                  <select 
                    className="input-field"
                    value={newReelCategory}
                    onChange={(e) => setNewReelCategory(e.target.value)}
                  >
                    <option value="Cinematography">Cinematography</option>
                    <option value="Wedding Film">Wedding Film</option>
                    <option value="Commercial">Commercial / Brand</option>
                    <option value="Fashion Reel">Fashion Reel</option>
                    <option value="Drone & Aerial">Drone & Aerial</option>
                    <option value="Music Video">Music Video</option>
                    <option value="Event Highlight">Event Highlight</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Video Format</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button 
                      type="button"
                      className={`btn btn-sm ${!newReelIsShort ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                      onClick={() => setNewReelIsShort(false)}
                    >
                      <Tv size={13} /> 16:9 Cinema
                    </button>
                    <button 
                      type="button"
                      className={`btn btn-sm ${newReelIsShort ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                      onClick={() => setNewReelIsShort(true)}
                    >
                      <Smartphone size={13} /> 9:16 Reel
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowReelModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={savingReel}
                >
                  {savingReel ? <Loader2 size={16} className="animate-spin" /> : 'Save & Publish Reel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SHOOT PRODUCTION CONTRACT MODAL ── */}
      {showContractModal && selectedContractBooking && (
        <ShootContractModal
          isOpen={showContractModal}
          booking={selectedContractBooking}
          currentUserId={user?.id}
          onClose={() => setShowContractModal(false)}
          onContractSigned={() => {
            loadDashboardData();
          }}
        />
      )}

      {/* ── ACCOUNT DELETION CONFIRMATION MODAL ── */}
      {showDeleteAccountModal && (
        <div className="modal-backdrop" onClick={() => !deletingAccount && setShowDeleteAccountModal(false)}>
          <div className="modal-card delete-account-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(239,68,68,0.15)', padding: 8, borderRadius: 10, color: 'var(--danger)' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--danger)' }}>Delete Camcrew Account?</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Irreversible Data Erasure</p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                disabled={deletingAccount}
                onClick={() => setShowDeleteAccountModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                This action is permanent under the Indian DPDP Act 2023. Deleting your account will immediately and irrevocably delete:
              </p>

              <ul style={{ margin: '12px 0 16px', paddingLeft: 20, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <li>Your verified creator profile, bio, equipment roster, and reviews</li>
                <li>All portfolio media, showreels, and store listings</li>
                <li>Your active broadcast pitches and messaging history</li>
              </ul>

              <div className="escrow-guard-note" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong>⚠️ Active Escrow Protection:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  If you have active confirmed shoots or pending escrow balances, deletion will be blocked until all bookings are wrapped or cancelled.
                </p>
              </div>

              {deleteAccountError && (
                <div className="alert-box error" style={{ marginBottom: 14, fontSize: 13, color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: 10, borderRadius: 8 }}>
                  <AlertTriangle size={15} style={{ marginRight: 6, display: 'inline' }} /> {deleteAccountError}
                </div>
              )}

              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                Type <strong style={{ color: 'var(--danger)' }}>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deletingAccount}
                style={{ width: '100%', borderColor: deleteConfirmText === 'DELETE' ? 'var(--danger)' : undefined }}
              />
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={deletingAccount}
                onClick={() => setShowDeleteAccountModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                onClick={handleDeleteAccount}
                style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
              >
                {deletingAccount ? <Loader2 size={16} className="animate-spin" /> : 'Permanently Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
