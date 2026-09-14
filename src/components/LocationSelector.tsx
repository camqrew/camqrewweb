import React, { useState, useEffect } from 'react';
import { INDIA_LOCATIONS } from '../constants/locations';
import { X, ChevronDown } from 'lucide-react';

interface LocationSelectorProps {
  selectedState?: string;
  selectedDistrict?: string;
  selectedCity?: string;
  onChange: (location: { state: string; district: string; city: string }) => void;
  inline?: boolean;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedState = '',
  selectedDistrict = '',
  selectedCity = '',
  onChange,
  inline = false,
  className = '',
}) => {
  const [state, setState] = useState(selectedState);
  const [district, setDistrict] = useState(selectedDistrict);
  const [city, setCity] = useState(selectedCity);

  useEffect(() => {
    setState(selectedState);
    setDistrict(selectedDistrict);
    setCity(selectedCity);
  }, [selectedState, selectedDistrict, selectedCity]);

  const states = Object.keys(INDIA_LOCATIONS);
  const districts = state && INDIA_LOCATIONS[state] ? Object.keys(INDIA_LOCATIONS[state]) : [];
  const cities = state && district && INDIA_LOCATIONS[state]?.[district] ? INDIA_LOCATIONS[state][district] : [];

  const handleStateChange = (newSt: string) => {
    setState(newSt);
    setDistrict('');
    setCity('');
    onChange({ state: newSt, district: '', city: '' });
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    setCity('');
    onChange({ state, district: newDist, city: '' });
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    onChange({ state, district, city: newCity });
  };

  const handleClear = () => {
    setState('');
    setDistrict('');
    setCity('');
    onChange({ state: '', district: '', city: '' });
  };

  const hasSelection = Boolean(state || district || city);

  if (inline) {
    return (
      <div className={`location-selector inline-selector ${className}`}>
        <div className="location-inline-grid">
          {/* State select */}
          <div className="select-box-wrapper">
            <select
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              className="custom-select-field"
            >
              <option value="">Select State (All India)</option>
              {states.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>

          {/* District select */}
          <div className="select-box-wrapper">
            <select
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!state}
              className="custom-select-field"
            >
              <option value="">{state ? 'Select District' : 'District'}</option>
              {districts.map((dst) => (
                <option key={dst} value={dst}>{dst}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>

          {/* City select */}
          <div className="select-box-wrapper">
            <select
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              disabled={!district}
              className="custom-select-field"
            >
              <option value="">{district ? 'Select City / Locality' : 'City / Locality'}</option>
              {cities.map((ct) => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>

          {/* Reset Action */}
          {hasSelection && (
            <button
              type="button"
              className="clear-location-pill-btn"
              onClick={handleClear}
              title="Clear location filter"
            >
              <X size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Stacked / Form Layout (e.g. Auth Page, Create Job, Booking)
  return (
    <div className={`location-selector stacked-selector ${className}`}>
      <div className="location-stacked-grid">
        {/* Row 1: State (50%) & District (50%) */}
        <div className="select-box-wrapper">
          <select
            value={state}
            onChange={(e) => handleStateChange(e.target.value)}
            className="custom-select-field"
          >
            <option value="">Select State</option>
            {states.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-chevron" />
        </div>

        <div className="select-box-wrapper">
          <select
            value={district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={!state}
            className="custom-select-field"
          >
            <option value="">{state ? 'Select District' : 'District'}</option>
            {districts.map((dst) => (
              <option key={dst} value={dst}>{dst}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-chevron" />
        </div>

        {/* Row 2: City / Locality (100% full span) */}
        <div className="select-box-wrapper full-span">
          <select
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={!district}
            className="custom-select-field"
          >
            <option value="">{district ? 'Select City / Locality' : 'City / Locality'}</option>
            {cities.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-chevron" />
        </div>
      </div>

      {hasSelection && (
        <div className="location-reset-row">
          <button
            type="button"
            className="location-reset-link"
            onClick={handleClear}
          >
            <X size={12} /> Reset location filter
          </button>
        </div>
      )}
    </div>
  );
};
