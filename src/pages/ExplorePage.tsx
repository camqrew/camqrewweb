import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { professionalApi, type GetProfessionalsFilter } from '../api/professionalApi';
import type { ProfessionalProfile } from '../types/professional';
import { ProCard } from '../components/ProCard';
import { LocationSelector } from '../components/LocationSelector';
import { Search, UserCheck, X, MapPin } from 'lucide-react';

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

  const categories = [
    'All',
    'Photographers',
    'Videographers',
    'Models',
    'Drone Pilots',
    'Caterers',
    'Organisers',
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

  const clearAllFilters = () => {
    setCategory('All');
    setSearchQuery('');
    setLocation({ state: '', district: '', city: '' });
    setSearchParams({});
  };

  const hasActiveFilters = category !== 'All' || searchQuery || location.state;

  return (
    <div className="explore-page container">
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

      <div className="results-count-bar" style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
        <span>Showing <strong>{pros.length}</strong> verified creative professionals</span>
      </div>

      {loading ? (
        <div className="pros-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card skeleton-card" style={{ height: 320 }} />
          ))}
        </div>
      ) : pros.length === 0 ? (
        <div className="empty-results card text-center" style={{ padding: 48 }}>
          <UserCheck size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>No creators found matching this criteria</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try widening your search location or clearing category filters to find nearby crew.</p>
          <button onClick={clearAllFilters} className="btn btn-primary" style={{ marginTop: 16 }}>
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="pros-grid">
          {pros.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
