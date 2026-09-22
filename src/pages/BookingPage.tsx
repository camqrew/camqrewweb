import React, { useState, useEffect, useMemo } from 'react';
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
  Lock,
  User
} from 'lucide-react';
import { isCustomAvatar } from '../utils/avatarUtils';
import { getArchetype } from '../constants/categories';

export const BookingPage: React.FC = () => {
  const { id: proId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const jobId = searchParams.get('jobId');
  const jobTitleParam = searchParams.get('jobTitle');
  const jobBudgetParam = searchParams.get('jobBudget');
  const jobLocationParam = searchParams.get('jobLocation');
  const totalParam = searchParams.get('total');
  const notesParam = searchParams.get('notes');

  const [pro, setPro] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successBookingId, setSuccessBookingId] = useState('');

  const proArchetype = useMemo(() => getArchetype(pro?.categories), [pro?.categories]);
  const archetype = proArchetype.archetype;

  const [serviceTitle, setServiceTitle] = useState(jobTitleParam || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysCount, setDaysCount] = useState(1);
  const [location, setLocation] = useState({
    state: 'Maharashtra',
    district: 'Mumbai',
    city: 'Mumbai',
  });
  const [venueAddress, setVenueAddress] = useState(jobLocationParam || '');
  const [notes, setNotes] = useState(notesParam || '');

  // Category-specific customization options
  const [bakerDietary, setBakerDietary] = useState<string>('Eggless (100% Veg)');
  const [bakerCakeMessage, setBakerCakeMessage] = useState<string>('');
  const [bakerCandlesKit, setBakerCandlesKit] = useState<boolean>(true);
  const [bakerTimeSlot, setBakerTimeSlot] = useState<string>('Afternoon (01:00 PM - 05:00 PM)');

  const [catererServingStyle, setCatererServingStyle] = useState<string>('Buffet Setup');
  const [catererDietary, setCatererDietary] = useState<string>('Pure Veg & Jain Counter');
  const [catererGuestCount, setCatererGuestCount] = useState<number>(50);
  const [catererMealSlot, setCatererMealSlot] = useState<string>('Dinner (07:30 PM - 11:30 PM)');

  const [modelAssignmentType, setModelAssignmentType] = useState<string>('High-Fashion Runway & Lookbook');
  const [modelLookCount, setModelLookCount] = useState<string>('4 - 6 Looks');
  const [modelUsageRights, setModelUsageRights] = useState<string>('Digital & Social Media (1 Year)');
  const [modelStylingProvided, setModelStylingProvided] = useState<string>('Stylist & MUA Provided on Set');

  const [eventScope, setEventScope] = useState<string>('Turnkey Event Planning & Decor');
  const [eventScale, setEventScale] = useState<string>('Medium (100 - 500 Guests)');

  const [techDeliverable, setTechDeliverable] = useState<string>('Full-Stack Web App');
  const [techSpecsLink, setTechSpecsLink] = useState<string>('');

  const [beautyStyle, setBeautyStyle] = useState<string>('HD Bridal Makeup & Hair Styling');
  const [beautyPartyCount, setBeautyPartyCount] = useState<string>('Bride Only');

  const [mediaProductionType, setMediaProductionType] = useState<string>('Wedding & Event Film');
  const [mediaDeliverableFormat, setMediaDeliverableFormat] = useState<string>('Color Graded 4K Reels & Stills');

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
          if (!jobTitleParam) {
            const arch = getArchetype(profile.categories);
            switch (arch.archetype) {
              case 'home_baker':
                setServiceTitle('Custom Artisan Cake & Fresh Bakes Order');
                break;
              case 'catering':
                setServiceTitle('Banquet Catering & Culinary Package');
                break;
              case 'modeling_talent':
                setServiceTitle('High-Fashion Campaign & Lookbook Shoot');
                break;
              case 'event_management':
                setServiceTitle('Turnkey Event Planning & Production Execution');
                break;
              case 'tech_digital':
                setServiceTitle('Full-Stack Web App MVP & Digital Design');
                break;
              case 'beauty_bridal':
                setServiceTitle('Full Bridal HD Makeup & Sangeet Mehendi');
                break;
              default:
                setServiceTitle('Video Production & Photography');
                break;
            }
          }
        })
        .catch((e) => setError(e.message || 'Could not load creator details'))
        .finally(() => setLoading(false));
    }
  }, [proId, jobTitleParam]);

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

  const isBudgetLocked = Boolean(totalParam || jobBudgetParam);
  const totalAmount = totalParam
    ? Number(totalParam)
    : (jobBudgetParam ? Number(jobBudgetParam) : ((pro?.ratePerDay || 15000) * daysCount));

  const advanceEscrow = Math.round(totalAmount * 0.3);
  const wrapEscrow = Math.round(totalAmount * 0.4);
  const finalEscrow = totalAmount - advanceEscrow - wrapEscrow;

  const categoryMilestones = useMemo(() => {
    switch (archetype) {
      case 'home_baker':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Order confirmation & ingredient sourcing', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Bake Ready Escrow (40%)', desc: 'Fresh baking & photo proof shared', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Delivery Wrap Escrow (30%)', desc: 'Safe delivery & client confirmation', percentage: 30, amount: finalEscrow },
        ];
      case 'catering':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Date lock & raw material procurement', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Setup Escrow (40%)', desc: 'Live buffet & kitchen counters running', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Service Wrap Escrow (30%)', desc: 'Banquet conclusion & final wrap', percentage: 30, amount: finalEscrow },
        ];
      case 'modeling_talent':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Date reservation & fitting rehearsal', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Shoot Wrap Escrow (40%)', desc: 'Call time wrap & looks completed', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Usage Rights Escrow (30%)', desc: 'Deliverables clearance & commercial license', percentage: 30, amount: finalEscrow },
        ];
      case 'tech_digital':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Sprint kickoff & technical architecture', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Core Sprint Escrow (40%)', desc: 'Prototype & core features deployed', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Production Release Escrow (30%)', desc: 'Code handover, QA testing & sign-off', percentage: 30, amount: finalEscrow },
        ];
      case 'beauty_bridal':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Date lock & bridal vanity prep', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Look Ready Escrow (40%)', desc: 'Bridal styling & draping wrap', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Wrap Escrow (30%)', desc: 'Touch-up wrap & photoshoot ready', percentage: 30, amount: finalEscrow },
        ];
      case 'event_management':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Vendor lock & material fabrication', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Setup Wrap Escrow (40%)', desc: 'Stage, sound & venue handover', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Event Wrap Escrow (30%)', desc: 'Event conclusion & vendor clearance', percentage: 30, amount: finalEscrow },
        ];
      default:
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Held now; locks creator calendar', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Shoot Wrap Escrow (40%)', desc: 'Released after production wraps', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Deliverables Escrow (30%)', desc: 'Released upon final deliverables approval', percentage: 30, amount: finalEscrow },
        ];
    }
  }, [archetype, advanceEscrow, wrapEscrow, finalEscrow]);

  // Category Configuration Meta
  const categoryConfig = useMemo(() => {
    switch (archetype) {
      case 'home_baker':
        return {
          pageTitle: 'Order Custom Cakes & Fresh Bakes',
          pageSubtitle: 'Configure delivery date, custom flavors, dietary preferences, and secure with escrow protection.',
          serviceSectionTitle: 'Bake & Order Details',
          serviceTitleLabel: 'Cake / Bake Order Title',
          serviceTitlePlaceholder: 'e.g. 2-Tier Belgian Chocolate Truffle Custom Cake',
          isSingleDate: true,
          dateSectionTitle: 'Delivery / Pickup Schedule',
          startDateLabel: 'Delivery / Pickup Date',
          endDateLabel: 'Event Date',
          locationSectionTitle: 'Delivery / Pickup Location',
          locationAddressLabel: 'Delivery Address, Landmark & Pincode *',
          locationAddressPlaceholder: 'e.g. Flat 402, Sea Green Apts, Bandra West, Mumbai - 400050 (or Studio Pickup)',
          specialOptionsTitle: 'Cake Customization & Dietary Options',
          notesTitle: 'Design Themes, Lettering & Packaging Instructions',
          notesPlaceholder: 'Tell the baker about color palettes, custom fondant themes, inscriptions, or packaging...',
          submitButtonPrefix: 'Confirm & Hold Escrow for Bakes',
          durationUnitLabel: (count: number) => count === 1 ? '1 Custom Order' : `${count} Orders / Batches`,
        };
      case 'catering':
        return {
          pageTitle: 'Book Catering Service & Banquet',
          pageSubtitle: 'Configure event dates, service timings, guest count, and secure with milestone escrow.',
          serviceSectionTitle: 'Catering Package Details',
          serviceTitleLabel: 'Catering Package Title',
          serviceTitlePlaceholder: 'e.g. Grand Wedding Reception Buffet & Live Counters',
          isSingleDate: false,
          dateSectionTitle: 'Event & Meal Service Schedule',
          startDateLabel: 'Service Start Date',
          endDateLabel: 'Service End Date',
          locationSectionTitle: 'Event Venue & Kitchen Setup Locality',
          locationAddressLabel: 'Banquet / Venue Address & Kitchen Access Details *',
          locationAddressPlaceholder: 'e.g. Royal Palm Banquets, Hall B, Andheri East, Mumbai',
          specialOptionsTitle: 'Catering Service Style & Dietary Standards',
          notesTitle: 'Live Counter Setup & Special Menu Instructions',
          notesPlaceholder: 'Details on buffet layout timing, water/power supply, guest dietary splits...',
          submitButtonPrefix: 'Confirm & Hold Catering Escrow',
          durationUnitLabel: (count: number) => `${count} ${count === 1 ? 'Event Day' : 'Event Days'}`,
        };
      case 'modeling_talent':
        return {
          pageTitle: 'Book Model / Fashion & Runway Talent',
          pageSubtitle: 'Configure shoot dates, call time, look count, usage rights, and secure with milestone escrow.',
          serviceSectionTitle: 'Campaign & Assignment Details',
          serviceTitleLabel: 'Campaign / Assignment Title',
          serviceTitlePlaceholder: 'e.g. High-Fashion Lookbook & E-Commerce Campaign',
          isSingleDate: false,
          dateSectionTitle: 'Shoot / Runway Schedule',
          startDateLabel: 'Call Date / Rehearsal',
          endDateLabel: 'Wrap Date',
          locationSectionTitle: 'Studio / Runway Location',
          locationAddressLabel: 'Studio / Location Address & Fitting Venue *',
          locationAddressPlaceholder: 'e.g. Film City Studio 5, Goregaon East, Mumbai',
          specialOptionsTitle: 'Look Count, Styling & Commercial Usage Rights',
          notesTitle: 'Moodboard, Styling Themes & Lookbook Details',
          notesPlaceholder: 'Share moodboard links, garment fitting schedule, hair & makeup brief...',
          submitButtonPrefix: 'Confirm & Hold Model Escrow',
          durationUnitLabel: (count: number) => `${count} ${count === 1 ? 'Shoot Day' : 'Shoot Days'}`,
        };
      case 'event_management':
        return {
          pageTitle: 'Hire Event Planner & Production Crew',
          pageSubtitle: 'Configure turnkey dates, stage fabrication, decor, and secure with milestone escrow.',
          serviceSectionTitle: 'Event Production Scope',
          serviceTitleLabel: 'Event Scope / Title',
          serviceTitlePlaceholder: 'e.g. 2-Day Turnkey Wedding Planning & Stage Production',
          isSingleDate: false,
          dateSectionTitle: 'Event Setup & Execution Schedule',
          startDateLabel: 'Setup / Fabrication Date',
          endDateLabel: 'Event Wrap Date',
          locationSectionTitle: 'Event Venue & Grounds',
          locationAddressLabel: 'Venue Address / Convention Grounds *',
          locationAddressPlaceholder: 'e.g. Jio World Convention Centre, BKC, Mumbai',
          specialOptionsTitle: 'Production Scope & Event Scale',
          notesTitle: 'Artist, Audio/Visual & Stage Production Notes',
          notesPlaceholder: 'Details on line array sound, LED walls, artist riders, or decor themes...',
          submitButtonPrefix: 'Confirm & Hold Event Escrow',
          durationUnitLabel: (count: number) => `${count} ${count === 1 ? 'Event Day' : 'Event Days'}`,
        };
      case 'tech_digital':
        return {
          pageTitle: 'Hire Developer / Digital Designer',
          pageSubtitle: 'Configure sprint milestones, tech deliverables, and secure with milestone escrow.',
          serviceSectionTitle: 'Project & Scope Details',
          serviceTitleLabel: 'Project Scope / Deliverable',
          serviceTitlePlaceholder: 'e.g. Full-Stack Web App MVP & Supabase Backend',
          isSingleDate: false,
          dateSectionTitle: 'Sprint / Milestone Target',
          startDateLabel: 'Sprint Kickoff Date',
          endDateLabel: 'Target Delivery Date',
          locationSectionTitle: 'Primary Working Location',
          locationAddressLabel: 'Remote / On-site Workplace Details *',
          locationAddressPlaceholder: 'e.g. Remote (IST Timezone) or Client Office, Lower Parel, Mumbai',
          specialOptionsTitle: 'Tech Stack, Frameworks & Deliverable Type',
          notesTitle: 'Repository, Figma Links & User Stories',
          notesPlaceholder: 'Figma design system link, GitHub repo link, API specifications, PRD link...',
          submitButtonPrefix: 'Confirm & Hold Sprint Escrow',
          durationUnitLabel: (count: number) => `${count} ${count === 1 ? 'Project Sprint' : 'Project Sprints'}`,
        };
      case 'beauty_bridal':
        return {
          pageTitle: 'Book Makeup & Mehendi Artist',
          pageSubtitle: 'Configure function date, getting-ready call time, venue, and secure with milestone escrow.',
          serviceSectionTitle: 'Bridal & Styling Service Details',
          serviceTitleLabel: 'Bridal / Styling Service Title',
          serviceTitlePlaceholder: 'e.g. Full Bridal HD Makeup & Sangeet Mehendi',
          isSingleDate: false,
          dateSectionTitle: 'Function & Getting-Ready Schedule',
          startDateLabel: 'Function Date',
          endDateLabel: 'Wrap / Reception Date',
          locationSectionTitle: 'Getting-Ready Venue / Suite',
          locationAddressLabel: 'Bridal Suite / Hotel / Home Address *',
          locationAddressPlaceholder: 'e.g. Suite 501, The Taj Mahal Palace, Colaba, Mumbai',
          specialOptionsTitle: 'Artistry Style & Bridal Party Size',
          notesTitle: 'Outfit Colors, Jewellery Draping & Skin Type Notes',
          notesPlaceholder: 'Lehenga / saree shade, jewellery styling assistance, skin sensitivities...',
          submitButtonPrefix: 'Confirm & Hold Artist Escrow',
          durationUnitLabel: (count: number) => `${count} ${count === 1 ? 'Session Day' : 'Session Days'}`,
        };
      default:
        return {
          pageTitle: 'Book Creative Production',
          pageSubtitle: 'Configure dates, shoot location, and secure your booking with milestone escrow.',
          serviceSectionTitle: 'Project & Service Details',
          serviceTitleLabel: 'Service Title',
          serviceTitlePlaceholder: 'e.g. Video Production & Photography',
          isSingleDate: false,
          dateSectionTitle: 'Shoot Dates',
          startDateLabel: 'Shoot Start Date',
          endDateLabel: 'Shoot End Date',
          locationSectionTitle: 'Shoot Locality (India)',
          locationAddressLabel: 'Venue / Studio / Address Details *',
          locationAddressPlaceholder: 'e.g. Studio 4, Bandra West, or specific event address',
          specialOptionsTitle: 'Production Type & Deliverables Format',
          notesTitle: 'Shoot Requirements & Notes',
          notesPlaceholder: 'Details on lighting, deliverables, schedule, or equipment expectations...',
          submitButtonPrefix: 'Confirm & Hold Escrow',
          durationUnitLabel: (count: number) => `${count} ${count === 1 ? 'Shoot Day' : 'Shoot Days'}`,
        };
    }
  }, [archetype]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (!venueAddress.trim()) {
      setError(`Please provide the ${categoryConfig.locationAddressLabel.toLowerCase()}`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const fullLoc = `${venueAddress}, ${location.city}, ${location.district}, ${location.state}`;
      
      let categoryDetailsSummary = '';
      if (archetype === 'home_baker') {
        categoryDetailsSummary = `\n--- BAKERY SPECIFICATIONS ---\n• Dietary: ${bakerDietary}\n• Delivery Slot: ${bakerTimeSlot}\n• Message on Cake: ${bakerCakeMessage || 'None'}\n• Candle & Knife Kit: ${bakerCandlesKit ? 'Yes' : 'No'}`;
      } else if (archetype === 'catering') {
        categoryDetailsSummary = `\n--- CATERING SPECIFICATIONS ---\n• Serving Style: ${catererServingStyle}\n• Dietary Standard: ${catererDietary}\n• Expected Guests: ${catererGuestCount}\n• Meal Timing: ${catererMealSlot}`;
      } else if (archetype === 'modeling_talent') {
        categoryDetailsSummary = `\n--- MODELING SPECIFICATIONS ---\n• Assignment Type: ${modelAssignmentType}\n• Look Count: ${modelLookCount}\n• Usage Rights: ${modelUsageRights}\n• Styling: ${modelStylingProvided}`;
      } else if (archetype === 'event_management') {
        categoryDetailsSummary = `\n--- EVENT SPECIFICATIONS ---\n• Scope: ${eventScope}\n• Event Scale: ${eventScale}`;
      } else if (archetype === 'tech_digital') {
        categoryDetailsSummary = `\n--- TECH SPECIFICATIONS ---\n• Deliverable: ${techDeliverable}\n• Specs/Docs Link: ${techSpecsLink || 'None provided'}`;
      } else if (archetype === 'beauty_bridal') {
        categoryDetailsSummary = `\n--- BEAUTY SPECIFICATIONS ---\n• Style: ${beautyStyle}\n• Party Count: ${beautyPartyCount}`;
      } else {
        categoryDetailsSummary = `\n--- PRODUCTION SPECIFICATIONS ---\n• Type: ${mediaProductionType}\n• Deliverables: ${mediaDeliverableFormat}`;
      }

      const fullNotes = notes.trim() 
        ? `${notes.trim()}\n${categoryDetailsSummary}` 
        : categoryDetailsSummary.trim();

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
        notes: fullNotes,
        totalAmount,
        ratePerDay: pro?.ratePerDay || totalAmount,
        milestones: categoryMilestones.map(m => ({
          id: m.id,
          title: m.title,
          percentage: m.percentage,
          amount: m.amount,
          status: 'held'
        })),
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
            Your booking with <strong>{pro?.name}</strong> has been secured with Camqrew Milestone Escrow.
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
        <h1 className="page-title">{categoryConfig.pageTitle}</h1>
        <p className="page-subtitle">{categoryConfig.pageSubtitle}</p>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="booking-grid">
        <div className="booking-form-col">
          <form onSubmit={handleConfirmBooking} className="card booking-form-card" style={{ padding: 28 }}>
            <h3 className="form-section-title">1. {categoryConfig.serviceSectionTitle}</h3>

            <div className="form-group">
              <label className="form-label">{categoryConfig.serviceTitleLabel}</label>
              <input
                type="text"
                className="input-field"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder={categoryConfig.serviceTitlePlaceholder}
                required
              />
            </div>

            {categoryConfig.isSingleDate ? (
              <div className="form-group">
                <label className="form-label">{categoryConfig.startDateLabel}</label>
                <CustomDatePicker
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    setEndDate(val);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder={categoryConfig.startDateLabel}
                  required
                />
              </div>
            ) : (
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">{categoryConfig.startDateLabel}</label>
                  <CustomDatePicker
                    value={startDate}
                    onChange={(val) => {
                      setStartDate(val);
                      if (endDate && val > endDate) {
                        setEndDate(val);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder={categoryConfig.startDateLabel}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{categoryConfig.endDateLabel}</label>
                  <CustomDatePicker
                    value={endDate}
                    onChange={(val) => setEndDate(val)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    placeholder={categoryConfig.endDateLabel}
                    required
                  />
                </div>
              </div>
            )}

            <h3 className="form-section-title" style={{ marginTop: 24 }}>2. {categoryConfig.locationSectionTitle}</h3>

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
              <label className="form-label">{categoryConfig.locationAddressLabel}</label>
              <input
                type="text"
                className="input-field"
                placeholder={categoryConfig.locationAddressPlaceholder}
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                required
              />
            </div>

            {/* ── 3. CATEGORY SPECIFIC INTERACTIVE OPTIONS ── */}
            <h3 className="form-section-title" style={{ marginTop: 24 }}>3. {categoryConfig.specialOptionsTitle}</h3>

            {archetype === 'home_baker' && (
              <div className="category-spec-box" style={{ background: 'var(--bg-surface, rgba(0,0,0,0.02))', padding: '16px 18px', borderRadius: 14, marginBottom: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Dietary Preference & Prep</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Eggless (100% Veg)', 'Contains Egg', 'Vegan', 'Gluten-Free', 'Keto / Sugar-Free'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setBakerDietary(d)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: bakerDietary === d ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: bakerDietary === d ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: bakerDietary === d ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {bakerDietary === d && '✓ '}{d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Preferred Delivery / Pickup Time Slot</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Morning (10 AM - 1 PM)', 'Afternoon (1 PM - 5 PM)', 'Evening (5 PM - 8 PM)', 'Self-Pickup from Studio'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBakerTimeSlot(slot)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: bakerTimeSlot === slot ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: bakerTimeSlot === slot ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: bakerTimeSlot === slot ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {bakerTimeSlot === slot && '✓ '}{slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Message on Cake / Inscription (Optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Happy 25th Anniversary Mom & Dad! 🎂"
                    value={bakerCakeMessage}
                    onChange={(e) => setBakerCakeMessage(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <input
                    type="checkbox"
                    id="bakerCandlesKit"
                    checked={bakerCandlesKit}
                    onChange={(e) => setBakerCandlesKit(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                  />
                  <label htmlFor="bakerCandlesKit" style={{ fontSize: 13.5, color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
                    Include complimentary birthday candle, matches & cake knife kit
                  </label>
                </div>
              </div>
            )}

            {archetype === 'catering' && (
              <div className="category-spec-box" style={{ background: 'var(--bg-surface, rgba(0,0,0,0.02))', padding: '16px 18px', borderRadius: 14, marginBottom: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Catering Serving Style</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Buffet Setup', 'Plated Table Service', 'Live Counters / Chaat', 'Packed Gourmet Boxes'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCatererServingStyle(s)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: catererServingStyle === s ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: catererServingStyle === s ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: catererServingStyle === s ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {catererServingStyle === s && '✓ '}{s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Dietary Classification</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Pure Veg Buffet', 'Veg + Non-Veg', 'Pure Veg & Jain Counter', 'Halal Certified Preparation'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCatererDietary(d)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: catererDietary === d ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: catererDietary === d ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: catererDietary === d ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {catererDietary === d && '✓ '}{d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Expected Guest Count</label>
                    <input
                      type="number"
                      className="input-field"
                      min={10}
                      value={catererGuestCount}
                      onChange={(e) => setCatererGuestCount(Math.max(10, parseInt(e.target.value) || 10))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Meal Service Window</label>
                    <input
                      type="text"
                      className="input-field"
                      value={catererMealSlot}
                      onChange={(e) => setCatererMealSlot(e.target.value)}
                      placeholder="e.g. Dinner (07:30 PM - 11:30 PM)"
                    />
                  </div>
                </div>
              </div>
            )}

            {archetype === 'modeling_talent' && (
              <div className="category-spec-box" style={{ background: 'var(--bg-surface, rgba(0,0,0,0.02))', padding: '16px 18px', borderRadius: 14, marginBottom: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Assignment / Shoot Type</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['High-Fashion Runway & Ramp', 'Bridal / Couture Lookbook', 'E-Commerce Catalog Fit', 'Commercial TVC / Video Ad', 'Editorial Magazine'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setModelAssignmentType(t)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: modelAssignmentType === t ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: modelAssignmentType === t ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: modelAssignmentType === t ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {modelAssignmentType === t && '✓ '}{t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Estimated Looks / Changes</label>
                    <input
                      type="text"
                      className="input-field"
                      value={modelLookCount}
                      onChange={(e) => setModelLookCount(e.target.value)}
                      placeholder="e.g. 4 - 6 Looks / 10 Outfits"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Hair & Styling Arrangement</label>
                    <input
                      type="text"
                      className="input-field"
                      value={modelStylingProvided}
                      onChange={(e) => setModelStylingProvided(e.target.value)}
                      placeholder="e.g. Stylist & MUA Provided on Set"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 8 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Commercial Usage Rights Licensing</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Digital & Social Media (1 Year)', 'E-Commerce Catalog (2 Years)', 'Print, Hoardings & Outdoor', 'Worldwide In Perpetuity'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setModelUsageRights(u)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: modelUsageRights === u ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: modelUsageRights === u ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: modelUsageRights === u ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {modelUsageRights === u && '✓ '}{u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {archetype === 'event_management' && (
              <div className="category-spec-box" style={{ background: 'var(--bg-surface, rgba(0,0,0,0.02))', padding: '16px 18px', borderRadius: 14, marginBottom: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Event Execution Scope</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Turnkey Planning & Decor', 'Stage & Light Fabrication', 'Concert Line Array Sound', 'Artist & DJ Management', 'Complete 360° Production'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEventScope(s)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: eventScope === s ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: eventScope === s ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: eventScope === s ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {eventScope === s && '✓ '}{s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Expected Event Footfall / Scale</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Intimate (< 100 Guests)', 'Medium (100 - 500 Guests)', 'Grand Gala (500 - 2000+ Guests)'].map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setEventScale(sc)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: eventScale === sc ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: eventScale === sc ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: eventScale === sc ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {eventScale === sc && '✓ '}{sc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {archetype === 'tech_digital' && (
              <div className="category-spec-box" style={{ background: 'var(--bg-surface, rgba(0,0,0,0.02))', padding: '16px 18px', borderRadius: 14, marginBottom: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Primary Deliverable Type</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Full-Stack Web App', 'Mobile App (React Native)', 'UI/UX Design System (Figma)', 'Backend API & Database Architecture'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTechDeliverable(d)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: techDeliverable === d ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: techDeliverable === d ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: techDeliverable === d ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {techDeliverable === d && '✓ '}{d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Figma, GitHub or PRD Document Link (Optional)</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://figma.com/file/... or https://github.com/..."
                    value={techSpecsLink}
                    onChange={(e) => setTechSpecsLink(e.target.value)}
                  />
                </div>
              </div>
            )}

            {archetype === 'beauty_bridal' && (
              <div className="category-spec-box" style={{ background: 'var(--bg-surface, rgba(0,0,0,0.02))', padding: '16px 18px', borderRadius: 14, marginBottom: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Artistry Style & Technique</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['HD Bridal Makeup & Hair Styling', 'Airbrush Makeup', 'Traditional Bridal Mehendi', 'Arabic & Indo-Western Henna'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBeautyStyle(b)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: beautyStyle === b ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: beautyStyle === b ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: beautyStyle === b ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {beautyStyle === b && '✓ '}{b}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Bridal Party Count</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Bride Only', 'Bride + 2 Family Members', 'Bridal Party (5+ Persons)'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setBeautyPartyCount(p)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: beautyPartyCount === p ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: beautyPartyCount === p ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: beautyPartyCount === p ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {beautyPartyCount === p && '✓ '}{p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {archetype === 'media_crew' && (
              <div className="category-spec-box" style={{ background: 'var(--bg-surface, rgba(0,0,0,0.02))', padding: '16px 18px', borderRadius: 14, marginBottom: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Production Type</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Wedding & Event Film', 'Commercial / TVC', 'Fashion & Lookbook', 'Music Video', 'Drone Aerial Shoot'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMediaProductionType(m)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: mediaProductionType === m ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: mediaProductionType === m ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: mediaProductionType === m ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {mediaProductionType === m && '✓ '}{m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Deliverable Package Format</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {['Color Graded 4K Reels & Stills', 'Full Edited Film + Teaser', 'Complete RAW Footage Transfer'].map((df) => (
                      <button
                        key={df}
                        type="button"
                        onClick={() => setMediaDeliverableFormat(df)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: mediaDeliverableFormat === df ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e2e8f0)',
                          background: mediaDeliverableFormat === df ? 'rgba(63, 182, 104, 0.12)' : 'var(--surface-elevated, #f8fafc)',
                          color: mediaDeliverableFormat === df ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        {mediaDeliverableFormat === df && '✓ '}{df}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <h3 className="form-section-title" style={{ marginTop: 24 }}>4. {categoryConfig.notesTitle}</h3>
            <div className="form-group">
              <textarea
                className="input-field"
                rows={3}
                placeholder={categoryConfig.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg full-width" disabled={submitting}>
              {submitting ? <Loader2 size={18} className="animate-spin" /> : `${categoryConfig.submitButtonPrefix} (₹${totalAmount.toLocaleString('en-IN')}) →`}
            </button>
          </form>
        </div>

        <aside className="booking-summary-col">
          <div className="card summary-card" style={{ padding: 24 }}>
            <h3 className="summary-title" style={{ fontSize: 18, fontWeight: 700 }}>Booking Summary</h3>

            <div className="pro-summary-mini">
              {isCustomAvatar(pro?.avatar) ? (
                <img src={pro?.avatar} alt={pro?.name} className="mini-avatar" />
              ) : (
                <div className="mini-avatar mini-avatar-placeholder">
                  <User size={20} />
                </div>
              )}
              <div>
                <h4 className="mini-name">{pro?.name}</h4>
                <p className="mini-title">{pro?.title}</p>
                <span className="mini-rate">
                  ₹{pro?.ratePerDay?.toLocaleString('en-IN')} / {archetype === 'home_baker' ? 'kg' : proArchetype.rateUnitDefault.toLowerCase()}
                </span>
              </div>
            </div>

            <hr className="divider" />

            <div className="cost-breakdown">
              <div className="cost-row">
                <span>Duration</span>
                <span>{categoryConfig.durationUnitLabel(daysCount)}</span>
              </div>
              {isBudgetLocked ? (
                <div className="cost-row locked-row" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  <span>Agreed Package Budget</span>
                  <span><Lock size={12} /> ₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="cost-row">
                  <span>
                    {archetype === 'home_baker' ? 'Order Rate' : `${proArchetype.rateUnitDefault} Rate`} (₹{pro?.ratePerDay?.toLocaleString('en-IN')} × {daysCount})
                  </span>
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

              {categoryMilestones.map((m) => (
                <div key={m.id} className="milestone-item">
                  <div className="m-left">
                    <span className="m-dot" />
                    <div>
                      <span className="m-name">{m.title}</span>
                      <span className="m-desc">{m.desc}</span>
                    </div>
                  </div>
                  <span className="m-price">₹{m.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookingPage;
