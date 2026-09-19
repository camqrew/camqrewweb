import React, { useState, useEffect } from 'react';
import { callSheetApi } from '../api/callSheetApi';
import type { CallSheet, ScheduleItem, CrewMember } from '../types/callSheet';
import type { Booking } from '../types/booking';
import { 
  X, 
  Share2, 
  Printer, 
  Save, 
  Plus, 
  Trash2, 
  Clock, 
  Phone, 
  ExternalLink, 
  Loader2, 
  FileText
} from 'lucide-react';

interface CallSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
}

export const CallSheetModal: React.FC<CallSheetModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const [sheet, setSheet] = useState<CallSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && booking?.id) {
      loadCallSheet();
    }
  }, [isOpen, booking?.id]);

  const loadCallSheet = async () => {
    setLoading(true);
    try {
      const data = await callSheetApi.getCallSheetForBooking(booking.id);
      setSheet(data);
    } catch (err: any) {
      console.error('Failed to load call sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sheet) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await callSheetApi.saveCallSheet(sheet);
      setSheet(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save call sheet: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!sheet) return;
    const message = callSheetApi.formatWhatsAppCallSheet(sheet);
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddScheduleItem = () => {
    if (!sheet) return;
    const newItem: ScheduleItem = {
      id: String(Date.now()),
      time: '12:00 PM',
      event: 'New Sequence / Scene',
      location: sheet.locationName || 'Main Floor',
      notes: '',
    };
    setSheet({
      ...sheet,
      scheduleItems: [...sheet.scheduleItems, newItem],
    });
  };

  const handleRemoveScheduleItem = (id: string) => {
    if (!sheet) return;
    setSheet({
      ...sheet,
      scheduleItems: sheet.scheduleItems.filter(item => item.id !== id),
    });
  };

  const handleScheduleChange = (id: string, field: keyof ScheduleItem, value: string) => {
    if (!sheet) return;
    setSheet({
      ...sheet,
      scheduleItems: sheet.scheduleItems.map(item => item.id === id ? { ...item, [field]: value } : item),
    });
  };

  const handleAddCrewMember = () => {
    if (!sheet) return;
    const newMember: CrewMember = {
      id: String(Date.now()),
      name: '',
      role: 'Camera Operator',
      phone: '',
      callTime: sheet.generalCallTime || '08:00 AM',
    };
    setSheet({
      ...sheet,
      crewMembers: [...sheet.crewMembers, newMember],
    });
  };

  const handleRemoveCrewMember = (id: string) => {
    if (!sheet) return;
    setSheet({
      ...sheet,
      crewMembers: sheet.crewMembers.filter(m => m.id !== id),
    });
  };

  const handleCrewChange = (id: string, field: keyof CrewMember, value: string) => {
    if (!sheet) return;
    setSheet({
      ...sheet,
      crewMembers: sheet.crewMembers.map(m => m.id === id ? { ...m, [field]: value } : m),
    });
  };

  const handleApplyPreset = (presetSchedule: ScheduleItem[]) => {
    if (!sheet) return;
    if (sheet.scheduleItems.length > 0) {
      if (!confirm('This will replace the current schedule items with this preset. Proceed?')) return;
    }
    setSheet({
      ...sheet,
      scheduleItems: presetSchedule,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-container call-sheet-modal-container card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: 1080,
          maxHeight: '94vh',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-elevated)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} color="var(--accent)" />
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Production Call Sheet & Shoot Day Dispatch
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Broadcast-ready daily call sheet for cast, crew, and client stakeholders.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* WhatsApp Share CTA */}
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleWhatsAppShare}
              style={{
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Broadcast call sheet to WhatsApp group"
            >
              <Share2 size={15} /> Share via WhatsApp
            </button>

            {/* Print / PDF CTA */}
            <button 
              className="btn btn-outline btn-sm"
              onClick={handlePrint}
              title="Print or export call sheet to PDF"
            >
              <Printer size={15} /> Print / PDF
            </button>

            {/* Save CTA */}
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {savedSuccess ? 'Saved ✓' : 'Save Changes'}
            </button>

            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 6,
                display: 'flex',
                borderRadius: 6,
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Call Sheet Printable Body */}
        <div className="call-sheet-printable-body" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <Loader2 size={32} className="animate-spin" color="var(--accent)" />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading call sheet...</p>
            </div>
          ) : !sheet ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Could not load call sheet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Project Title Banner */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 12,
                padding: 20,
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Production Title</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={sheet.title}
                      onChange={e => setSheet({ ...sheet, title: e.target.value })}
                      style={{ fontSize: 18, fontWeight: 800, padding: '8px 12px' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Shoot Date</label>
                      <input 
                        type="date"
                        className="input-field"
                        value={sheet.shootDate ? sheet.shootDate.split('T')[0] : ''}
                        onChange={e => setSheet({ ...sheet, shootDate: e.target.value })}
                        style={{ padding: '8px 12px', fontSize: 14 }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>General Call Time</label>
                      <input 
                        type="text"
                        className="input-field"
                        value={sheet.generalCallTime}
                        onChange={e => setSheet({ ...sheet, generalCallTime: e.target.value })}
                        style={{ padding: '8px 12px', fontSize: 14, fontWeight: 700, width: 130 }}
                        placeholder="08:00 AM"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Meta Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Venue Location</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input 
                        type="text"
                        className="input-field"
                        value={sheet.locationName}
                        onChange={e => setSheet({ ...sheet, locationName: e.target.value })}
                        placeholder="Venue / Studio name & address"
                        style={{ flex: 1, fontSize: 13 }}
                      />
                      {sheet.googleMapsUrl && (
                        <a 
                          href={sheet.googleMapsUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-outline btn-sm"
                          style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}
                          title="Open Google Maps"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Google Maps Link</label>
                    <input 
                      type="url"
                      className="input-field"
                      value={sheet.googleMapsUrl || ''}
                      onChange={e => setSheet({ ...sheet, googleMapsUrl: e.target.value })}
                      placeholder="https://maps.google.com/?q=..."
                      style={{ fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Weather & Conditions</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={sheet.weatherSummary || ''}
                      onChange={e => setSheet({ ...sheet, weatherSummary: e.target.value })}
                      placeholder="Clear Skies • 31°C • Drone Safe"
                      style={{ fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Emergency Contact / Producer</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={sheet.emergencyContact || ''}
                      onChange={e => setSheet({ ...sheet, emergencyContact: e.target.value })}
                      placeholder="Producer Name & Phone"
                      style={{ fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>

              {/* Presets Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Quick Schedule Presets:
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {callSheetApi.getPresetTemplates().map(p => (
                    <button 
                      key={p.name}
                      className="btn btn-outline btn-xs"
                      onClick={() => handleApplyPreset(p.schedule)}
                      style={{ fontSize: 12 }}
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── PRODUCTION TIMELINE TABLE ── */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 12,
                padding: 20,
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} color="var(--accent)" />
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Shoot Timeline & Event Sequence
                    </h3>
                  </div>

                  <button 
                    className="btn btn-outline btn-xs"
                    onClick={handleAddScheduleItem}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={13} /> Add Sequence
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px 10px', width: 120 }}>Time</th>
                        <th style={{ padding: '8px 10px', minWidth: 180 }}>Event / Sequence</th>
                        <th style={{ padding: '8px 10px', minWidth: 160 }}>Location / Set</th>
                        <th style={{ padding: '8px 10px' }}>Notes & Gear Spec</th>
                        <th style={{ padding: '8px 10px', width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.scheduleItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '6px 10px' }}>
                            <input 
                              type="text"
                              className="input-field"
                              value={item.time}
                              onChange={e => handleScheduleChange(item.id, 'time', e.target.value)}
                              style={{ padding: '6px 8px', fontSize: 12, fontWeight: 700 }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input 
                              type="text"
                              className="input-field"
                              value={item.event}
                              onChange={e => handleScheduleChange(item.id, 'event', e.target.value)}
                              style={{ padding: '6px 8px', fontSize: 12 }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input 
                              type="text"
                              className="input-field"
                              value={item.location || ''}
                              onChange={e => handleScheduleChange(item.id, 'location', e.target.value)}
                              placeholder="Set or Room"
                              style={{ padding: '6px 8px', fontSize: 12 }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input 
                              type="text"
                              className="input-field"
                              value={item.notes || ''}
                              onChange={e => handleScheduleChange(item.id, 'notes', e.target.value)}
                              placeholder="Lenses, lighting, mics..."
                              style={{ padding: '6px 8px', fontSize: 12 }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <button 
                              onClick={() => handleRemoveScheduleItem(item.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                              title="Delete row"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── CREW DIRECTORY ── */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 12,
                padding: 20,
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={16} color="var(--accent)" />
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Crew Directory & Call Times
                    </h3>
                  </div>

                  <button 
                    className="btn btn-outline btn-xs"
                    onClick={handleAddCrewMember}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={13} /> Add Crew Member
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px 10px', minWidth: 160 }}>Member Name</th>
                        <th style={{ padding: '8px 10px', minWidth: 160 }}>Production Role</th>
                        <th style={{ padding: '8px 10px', minWidth: 140 }}>Phone Number</th>
                        <th style={{ padding: '8px 10px', width: 120 }}>Individual Call Time</th>
                        <th style={{ padding: '8px 10px', width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.crewMembers.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '6px 10px' }}>
                            <input 
                              type="text"
                              className="input-field"
                              value={m.name}
                              onChange={e => handleCrewChange(m.id, 'name', e.target.value)}
                              placeholder="Name"
                              style={{ padding: '6px 8px', fontSize: 12, fontWeight: 600 }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input 
                              type="text"
                              className="input-field"
                              value={m.role}
                              onChange={e => handleCrewChange(m.id, 'role', e.target.value)}
                              placeholder="e.g. Drone Operator"
                              style={{ padding: '6px 8px', fontSize: 12 }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input 
                              type="tel"
                              className="input-field"
                              value={m.phone}
                              onChange={e => handleCrewChange(m.id, 'phone', e.target.value)}
                              placeholder="+91..."
                              style={{ padding: '6px 8px', fontSize: 12 }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input 
                              type="text"
                              className="input-field"
                              value={m.callTime}
                              onChange={e => handleCrewChange(m.id, 'callTime', e.target.value)}
                              placeholder="08:00 AM"
                              style={{ padding: '6px 8px', fontSize: 12, fontWeight: 700 }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <button 
                              onClick={() => handleRemoveCrewMember(m.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                              title="Delete row"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── NOTES & PRODUCTION RULES ── */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 12,
                padding: 20,
                border: '1px solid var(--border-color)',
              }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Production Rules, Catering & Basecamp Notes
                </h4>
                <textarea 
                  rows={4}
                  className="input-field"
                  value={sheet.notesAndRules || ''}
                  onChange={e => setSheet({ ...sheet, notesAndRules: e.target.value })}
                  placeholder="• Attire rules, parking spots, drone flying permissions, meal schedules..."
                  style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
                />
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
