import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | CustomSelectOption)[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  icon?: React.ReactNode;
  allOptionLabel?: string;
  size?: 'md' | 'sm';
  align?: 'left' | 'right';
  style?: React.CSSProperties;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  disabled = false,
  searchable,
  className = '',
  icon,
  allOptionLabel,
  size = 'md',
  align = 'left',
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to { value, label }
  const normalizedOptions: CustomSelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // If searchable is undefined, auto-enable if > 5 options
  const isSearchable = searchable !== undefined ? searchable : normalizedOptions.length > 5;

  // Find label for current value
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : '';

  // Close on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, isSearchable]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={style}
      className={`custom-select-root ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className={`custom-select-trigger ${size === 'sm' ? 'size-sm' : ''} ${value ? 'has-value' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="custom-select-trigger-content">
          {icon && <span className="custom-select-leading-icon">{icon}</span>}
          <span className={`custom-select-label-text ${!displayLabel ? 'placeholder' : ''}`}>
            {displayLabel || placeholder}
          </span>
        </div>
        <ChevronDown
          size={size === 'sm' ? 12 : 14}
          className={`custom-select-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && !disabled && (
        <div className={`custom-select-popover ${align === 'right' ? 'align-right' : ''}`} role="listbox">
          {/* Search Box */}
          {isSearchable && (
            <div className="custom-select-search-wrap">
              <Search size={13} className="custom-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="custom-select-search-input"
                placeholder={`Search...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="custom-select-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="custom-select-list">
            {/* Optional All / Default Option */}
            {allOptionLabel && (
              <button
                type="button"
                className={`custom-select-option ${value === '' ? 'is-selected' : ''}`}
                onClick={() => handleSelect('')}
              >
                <span className="custom-select-option-text">{allOptionLabel}</span>
                {value === '' && <Check size={14} className="custom-select-check" />}
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`custom-select-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="custom-select-option-text">{opt.label}</span>
                    {isSelected && <Check size={14} className="custom-select-check" />}
                  </button>
                );
              })
            ) : (
              <div className="custom-select-empty">
                <span>No results for "{searchQuery}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
