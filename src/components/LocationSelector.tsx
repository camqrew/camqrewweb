import React, { useState, useEffect } from 'react';
import { INDIA_LOCATIONS } from '../constants/locations';
import { X, MapPin } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

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
            <CustomSelect
              value={state}
              onChange={handleStateChange}
              options={states}
              placeholder="Select State (All India)"
              allOptionLabel="Select State (All India)"
              icon={<MapPin size={13} />}
            />
          </div>

          {/* District select */}
          <div className="select-box-wrapper">
            <CustomSelect
              value={district}
              onChange={handleDistrictChange}
              options={districts}
              placeholder={state ? 'Select District' : 'District'}
              allOptionLabel={state ? 'All Districts' : undefined}
              disabled={!state}
            />
          </div>

          {/* City select */}
          <div className="select-box-wrapper">
            <CustomSelect
              value={city}
              onChange={handleCityChange}
              options={cities}
              placeholder={district ? 'Select City / Locality' : 'City / Locality'}
              allOptionLabel={district ? 'All Cities / Localities' : undefined}
              disabled={!district}
            />
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
          <CustomSelect
            value={state}
            onChange={handleStateChange}
            options={states}
            placeholder="Select State"
            allOptionLabel="Select State"
            icon={<MapPin size={13} />}
          />
        </div>

        <div className="select-box-wrapper">
          <CustomSelect
            value={district}
            onChange={handleDistrictChange}
            options={districts}
            placeholder={state ? 'Select District' : 'District'}
            allOptionLabel={state ? 'All Districts' : undefined}
            disabled={!state}
          />
        </div>

        {/* Row 2: City / Locality (100% full span) */}
        <div className="select-box-wrapper full-span">
          <CustomSelect
            value={city}
            onChange={handleCityChange}
            options={cities}
            placeholder={district ? 'Select City / Locality' : 'City / Locality'}
            allOptionLabel={district ? 'All Cities / Localities' : undefined}
            disabled={!district}
          />
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
