import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  min,
  max,
  disabled = false,
  className = '',
  style,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view month/year from value or current date
  const initialDate = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d);
      }
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [value]);

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

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Format value for trigger button (e.g. "25 Sep 2026")
  const formattedDisplay = useMemo(() => {
    if (!value) return '';
    const [y, m, d] = value.split('-').map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return value;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [value]);

  // Today string for highlighting
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Compute calendar days for current view
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      day: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 12 : viewMonth;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr,
        isDisabled: true,
        isSelected: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let isDisabled = false;
      if (min && dateStr < min) isDisabled = true;
      if (max && dateStr > max) isDisabled = true;

      days.push({
        day: d,
        isCurrentMonth: true,
        dateStr,
        isDisabled,
        isSelected: dateStr === value,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill rows
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 1 : viewMonth + 2;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr,
        isDisabled: true,
        isSelected: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [viewYear, viewMonth, min, max, value, todayStr]);

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (min && todayStr < min) return;
    if (max && todayStr > max) return;
    onChange(todayStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={style}
      className={`custom-datepicker-root ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      <input
        type="hidden"
        value={value}
        required={required}
      />

      {/* Trigger Button */}
      <button
        type="button"
        className={`custom-datepicker-trigger ${value ? 'has-value' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="custom-datepicker-trigger-content">
          <CalendarIcon size={15} className="custom-datepicker-leading-icon" />
          <span className={`custom-datepicker-label-text ${!formattedDisplay ? 'placeholder' : ''}`}>
            {formattedDisplay || placeholder}
          </span>
        </div>
        {value && !required && !disabled ? (
          <span
            className="custom-datepicker-clear-btn"
            onClick={handleClear}
            title="Clear date"
          >
            <X size={13} />
          </span>
        ) : null}
      </button>

      {/* Floating Calendar Popover */}
      {isOpen && !disabled && (
        <div className="custom-datepicker-popover" role="dialog" aria-modal="true">
          {/* Header with Month/Year & Navigation */}
          <div className="datepicker-header">
            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="datepicker-month-year">
              <span className="month-name">{MONTHS[viewMonth]}</span>
              <span className="year-number">{viewYear}</span>
            </div>
            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="datepicker-weekdays-grid">
            {DAYS_SHORT.map((day) => (
              <span key={day} className="datepicker-weekday-cell">
                {day}
              </span>
            ))}
          </div>

          {/* Days Matrix */}
          <div className="datepicker-days-grid">
            {calendarDays.map((item, index) => {
              if (!item.isCurrentMonth) {
                return (
                  <div key={index} className="datepicker-day-cell is-empty">
                    <span>{item.day}</span>
                  </div>
                );
              }

              return (
                <button
                  key={index}
                  type="button"
                  disabled={item.isDisabled}
                  className={`datepicker-day-cell ${item.isSelected ? 'is-selected' : ''} ${item.isToday ? 'is-today' : ''} ${item.isDisabled ? 'is-disabled' : ''}`}
                  onClick={() => !item.isDisabled && handleSelectDate(item.dateStr)}
                >
                  <span className="day-number">{item.day}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Footer Action */}
          <div className="datepicker-footer">
            <button
              type="button"
              className="datepicker-today-btn"
              onClick={handleSelectToday}
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                className="datepicker-reset-btn"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
