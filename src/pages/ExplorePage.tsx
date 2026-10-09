import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { professionalApi, type GetProfessionalsFilter, isProAvailableOnDates } from '../api/professionalApi';
import type { ProfessionalProfile } from '../types/professional';
import { ProCard } from '../components/ProCard';
import { LocationSelector } from '../components/LocationSelector';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { Search, UserCheck, X, MapPin, Calendar, ArrowUpDown } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pros, setPros] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState({
    state: searchParams.get('state') || '',
    district: searchParams.get('district') || '',
    city: searchParams.get('city') || '',
  });

  // Date Availability & Sorting State
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [isRange, setIsRange] = useState(Boolean(searchParams.get('endDate')));
  const [onlyAvailable, setOnlyAvailable] = useState(searchParams.get('available') === 'true');
  const [sortBy, setSortBy] = useState<'available' | 'rating' | 'price_asc' | 'price_desc' | 'experience'>(
    (searchParams.get('sortBy') as any) || (searchParams.get('startDate') ? 'available' : 'rating')
  );

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const categories = [
    'All',
    'Photographers',
    'Videographers',
    'Musicians',
    'Master of Ceremonies',
    'Models',
    'Home Bakers',
    'Drone Pilots',
    'Caterers',
    'Organisers',
    'Crafts & Gifting',
    'Travels',
    'Makeup Artists',
    'Mehendi Artists',
    'Developers',
    'Designers',
    'Editors',
    'Cinematographers',
    'Wedding',
    'Fashion',
    'Commercial',
  ];

  const fetchPros = async () => {
    setLoading(true);
    try {
      const filters: GetProfessionalsFilter = {
        category: category !== 'All' ? category : undefined,
        searchQuery: searchQuery.trim() || undefined,
        state: location.state || undefined,
        district: location.district || undefined,
        city: location.city || undefined,
      };
      const results = await professionalApi.getProfessionals(filters);
      setPros(results);
    } catch (e) {
      console.warn('Error fetching pros:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPros();
  }, [category, location]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPros();
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && sortBy !== 'available') {
      setSortBy('available');
    }
    if (isRange && endDate && val > endDate) {
      setEndDate(val);
    }
  };

  const formatDateLabel = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-').map(Number);
    if (!y || !m || !day) return d;
    const dateObj = new Date(y, m - 1, day);
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Sync search params with URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (category !== 'All') params.category = category;
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (location.state) params.state = location.state;
    if (location.district) params.district = location.district;
    if (location.city) params.city = location.city;
    if (startDate) params.startDate = startDate;
    if (isRange && endDate) params.endDate = endDate;
    if (onlyAvailable) params.available = 'true';
    if (sortBy && sortBy !== 'rating') params.sortBy = sortBy;
    setSearchParams(params, { replace: true });
  }, [category, searchQuery, location, startDate, endDate, isRange, onlyAvailable, sortBy]);

  const clearAllFilters = () => {
    setCategory('All');
    setSearchQuery('');
    setLocation({ state: '', district: '', city: '' });
    setStartDate('');
    setEndDate('');
    setIsRange(false);
    setOnlyAvailable(false);
    setSortBy('rating');
    setSearchParams({});
  };

  // Availability calculation
  const availableCount = useMemo(() => {
    if (!startDate) return 0;
    return pros.filter(p => isProAvailableOnDates(p, startDate, isRange ? endDate : undefined)).length;
  }, [pros, startDate, endDate, isRange]);

  // Filtered & Sorted professionals
  const sortedAndFilteredPros = useMemo(() => {
    let list = [...pros];

    // 1. Filter only available if toggle enabled
    if (startDate && onlyAvailable) {
      list = list.filter(p => isProAvailableOnDates(p, startDate, isRange ? endDate : undefined));
    }

    // 2. Sort list
    list.sort((a, b) => {
      if (sortBy === 'available' && startDate) {
        const aAvail = isProAvailableOnDates(a, startDate, isRange ? endDate : undefined) ? 1 : 0;
        const bAvail = isProAvailableOnDates(b, startDate, isRange ? endDate : undefined) ? 1 : 0;
        if (aAvail !== bAvail) {
          return bAvail - aAvail; // Available (1) before Blocked (0)
        }
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'price_asc') {
        return (a.ratePerDay || 0) - (b.ratePerDay || 0);
      }
      if (sortBy === 'price_desc') {
        return (b.ratePerDay || 0) - (a.ratePerDay || 0);
      }
      if (sortBy === 'experience') {
        return (b.experienceYears || 0) - (a.experienceYears || 0);
      }
      return 0;
    });

    return list;
  }, [pros, startDate, endDate, isRange, onlyAvailable, sortBy]);

  const hasActiveFilters = category !== 'All' || !!searchQuery || !!location.state || !!startDate || onlyAvailable;

  const locString = location.city || location.district || location.state || 'India';
  const seoTitle = category && category !== 'All'
    ? `Hire Verified ${category} in ${locString}`
    : `Explore Verified Production Crews & Creators in ${locString}`;
  const seoDescription = category && category !== 'All'
    ? `Find and book top-rated verified ${category.toLowerCase()} in ${locString}. View portfolios, verified reviews, and hire securely with milestone escrow on Camqrew.`
    : `Browse verified cinematographers, wedding photographers, drone pilots, and editors across India. Book safely with escrow protection on Camqrew.`;

  return (
    <div className="explore-page container">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical="https://camqrew.in/explore"
      />
      <div className="explore-header" style={{ marginBottom: 24 }}>
        <h1 className="page-title">Explore Creative Crew Across India</h1>
        <p className="page-subtitle">
          Find verified cinematographers, wedding photographers, drone operators, and editors in your locality.
        </p>
      </div>

      <div className="explore-filter-hub card">
        {/* Top Search Bar */}
        <form onSubmit={handleSearchSubmit} className="explore-search-row">
          <div className="explore-search-input-box">
            <Search size={18} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search by creator name, specialty, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="explore-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search query"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-explore-search">
            <Search size={16} />
            <span>Search</span>
          </button>
        </form>

        {/* Location Filter Section */}
        <div className="explore-location-row">
          <div className="explore-location-badge">
            <MapPin size={15} color="var(--accent)" />
            <span>Location Filter:</span>
          </div>
          <div className="explore-location-selector-wrap">
            <LocationSelector
              selectedState={location.state}
              selectedDistrict={location.district}
              selectedCity={location.city}
              onChange={setLocation}
              inline
            />
          </div>
        </div>

        {/* Date Availability & Sorting Section */}
        <div className="explore-date-row">
          <div className="explore-date-header">
            <div className="explore-location-badge">
              <Calendar size={15} color="var(--accent)" />
              <span>Event / Shoot Date Availability:</span>
            </div>
            <div className="explore-date-mode-toggle">
              <button
                type="button"
                className={`date-mode-pill ${!isRange ? 'active' : ''}`}
                onClick={() => {
                  setIsRange(false);
                  setEndDate('');
                }}
              >
                Single Day
              </button>
              <button
                type="button"
                className={`date-mode-pill ${isRange ? 'active' : ''}`}
                onClick={() => {
                  setIsRange(true);
                  if (startDate && !endDate) setEndDate(startDate);
                }}
              >
                Date Range
              </button>
            </div>
          </div>

          <div className="explore-date-inputs-wrap">
            <div className="explore-datepicker-item">
              <span className="datepicker-mini-label">{isRange ? 'Start Date' : 'Shoot Date'}</span>
              <CustomDatePicker
                value={startDate}
                onChange={handleStartDateChange}
                min={todayStr}
                placeholder={isRange ? 'Select start date' : 'Select shoot date'}
              />
            </div>

            {isRange && (
              <div className="explore-datepicker-item">
                <span className="datepicker-mini-label">End Date</span>
                <CustomDatePicker
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  min={startDate || todayStr}
                  placeholder="Select end date"
                />
              </div>
            )}

            {startDate && (
              <button
                type="button"
                className="btn-clear-date"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  if (sortBy === 'available') setSortBy('rating');
                }}
                title="Clear date filter"
              >
                <X size={14} /> Clear Dates
              </button>
            )}

            {startDate && (
              <label className="only-available-toggle">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                <span className="available-indicator-dot" />
                <span>Only Show Available</span>
              </label>
            )}

            <div className="explore-sort-wrap">
              <span className="sort-mini-label">
                <ArrowUpDown size={12} color="var(--accent)" /> Sort Creators By:
              </span>
              <select
                className="explore-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                {startDate && (
                  <option value="available">🟢 Available on Dates First</option>
                )}
                <option value="rating">⭐ Highest Rated</option>
                <option value="price_asc">💰 Price: Low to High</option>
                <option value="price_desc">💎 Price: High to Low</option>
                <option value="experience">🏆 Most Experienced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="explore-categories-row">
          <div className="category-chips-scroll">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-filter-chip ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Tag Strip */}
        {hasActiveFilters && (
          <div className="active-filters-bar">
            <div className="active-tags-list">
              <span className="active-filter-label">Active Filters:</span>
              {category !== 'All' && (
                <span className="active-filter-tag">
                  Category: <strong>{category}</strong>
                  <button type="button" onClick={() => setCategory('All')} title="Remove filter"><X size={12} /></button>
                </span>
              )}
              {location.state && (
                <span className="active-filter-tag">
                  <MapPin size={12} color="var(--accent)" />
                  <strong>{location.state}{location.district ? ` > ${location.district}` : ''}{location.city ? ` > ${location.city}` : ''}</strong>
                  <button type="button" onClick={() => setLocation({ state: '', district: '', city: '' })} title="Remove filter"><X size={12} /></button>
                </span>
              )}
              {startDate && (
                <span className="active-filter-tag">
                  <Calendar size={12} color="var(--accent)" />
                  <strong>
                    {formatDateLabel(startDate)}
                    {isRange && endDate && endDate !== startDate ? ` - ${formatDateLabel(endDate)}` : ''}
                  </strong>
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      if (sortBy === 'available') setSortBy('rating');
                    }}
                    title="Remove date filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {onlyAvailable && (
                <span className="active-filter-tag">
                  <span className="available-indicator-dot" style={{ width: 6, height: 6 }} />
                  <strong>Only Available</strong>
                  <button type="button" onClick={() => setOnlyAvailable(false)} title="Remove filter"><X size={12} /></button>
                </span>
              )}
              {searchQuery && (
                <span className="active-filter-tag">
                  Query: <strong>"{searchQuery}"</strong>
                  <button type="button" onClick={() => setSearchQuery('')} title="Remove filter"><X size={12} /></button>
                </span>
              )}
            </div>
            <button type="button" onClick={clearAllFilters} className="clear-all-filters-btn">
              <X size={13} /> Reset all
            </button>
          </div>
        )}
      </div>

      <div className="results-count-bar" style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span>
          Showing <strong>{sortedAndFilteredPros.length}</strong> verified creative professionals
          {startDate && (
            <>
              {' • '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {availableCount} available on {formatDateLabel(startDate)}{isRange && endDate && endDate !== startDate ? ` - ${formatDateLabel(endDate)}` : ''}
              </span>
            </>
          )}
        </span>
        {startDate && (
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Sorted by: <strong>{sortBy === 'available' ? 'Available First' : sortBy}</strong>
          </span>
        )}
      </div>

      {loading ? (
        <div className="pros-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card skeleton-card" style={{ height: 320 }} />
          ))}
        </div>
      ) : sortedAndFilteredPros.length === 0 ? (
        <div className="empty-results card text-center" style={{ padding: 48 }}>
          <UserCheck size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>No creators found matching this criteria</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {onlyAvailable && startDate
              ? 'No creators are currently marked available on your selected dates. Try unchecking "Only Show Available" to see all creators.'
              : 'Try widening your search location or clearing category filters to find nearby crew.'}
          </p>
          <button onClick={clearAllFilters} className="btn btn-primary" style={{ marginTop: 16 }}>
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="pros-grid">
          {sortedAndFilteredPros.map((pro) => (
            <ProCard
              key={pro.id}
              pro={pro}
              selectedDates={startDate ? { startDate, endDate: isRange ? endDate : undefined } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
