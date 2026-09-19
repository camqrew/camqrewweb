import { supabase } from './supabaseClient';
import type { CallSheet, ScheduleItem, CrewMember } from '../types/callSheet';

const mapCallSheet = (row: any): CallSheet => ({
  id: String(row.id),
  bookingId: String(row.booking_id),
  creatorId: row.creator_id,
  title: row.title || 'Shoot Call Sheet',
  shootDate: row.shoot_date || new Date().toISOString(),
  generalCallTime: row.general_call_time || '08:00 AM',
  locationName: row.location_name || '',
  googleMapsUrl: row.google_maps_url || '',
  weatherSummary: row.weather_summary || 'Sunny • 30°C • Light breeze (drone safe)',
  emergencyContact: row.emergency_contact || '',
  scheduleItems: Array.isArray(row.schedule_items) ? row.schedule_items : [],
  crewMembers: Array.isArray(row.crew_members) ? row.crew_members : [],
  notesAndRules: row.notes_and_rules || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const callSheetApi = {
  getCallSheetForBooking: async (bookingId: string): Promise<CallSheet> => {
    // 1. Check if call sheet already exists
    const { data: existing, error } = await supabase
      .from('call_sheets')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    if (existing) {
      return mapCallSheet(existing);
    }

    // 2. Auto-initialize from booking metadata
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        users (name, phone),
        professional_profiles (users (name, phone))
      `)
      .eq('id', bookingId)
      .single();

    const title = booking?.items?.serviceTitle || 'Commercial Production';
    const loc = booking?.location_details?.address || booking?.location_details?.city || 'Studio Venue';
    const proName = booking?.professional_profiles?.users?.name || 'Lead Creator';
    const proPhone = booking?.professional_profiles?.users?.phone || '';
    const clientName = booking?.users?.name || 'Production Lead';
    const clientPhone = booking?.users?.phone || '';

    const defaultSchedule: ScheduleItem[] = [
      { id: '1', time: '08:00 AM', event: 'Crew Call & Gear Check-in', location: loc, notes: 'Camera prep, sensor cleaning, battery test' },
      { id: '2', time: '09:30 AM', event: 'First Look / Morning Session', location: loc, notes: 'Natural light & prime lenses (50mm/85mm)' },
      { id: '3', time: '01:30 PM', event: 'Lunch Break & Battery Swap', location: 'Green Room / Dining', notes: 'DIT backup of card A & card B' },
      { id: '4', time: '03:00 PM', event: 'Main Event / Sequence 2', location: loc, notes: 'Gimbal & Drone coverage' },
      { id: '5', time: '07:30 PM', event: 'Wrap & Media Offload', location: loc, notes: 'Verify all checksums before release' },
    ];

    const defaultCrew: CrewMember[] = [
      { id: 'c1', name: proName, role: 'Lead Director / Cinematographer', phone: proPhone, callTime: '08:00 AM' },
      { id: 'c2', name: '2nd Cam Operator', role: 'B-Roll & Candid', phone: '', callTime: '08:15 AM' },
      { id: 'c3', name: 'Drone Pilot', role: 'Aerial Cinema & Gimbal', phone: '', callTime: '08:30 AM' },
      { id: 'c4', name: clientName, role: 'Client Contact / Producer', phone: clientPhone, callTime: '08:30 AM' },
    ];

    const newSheet = {
      booking_id: bookingId,
      creator_id: booking?.professional_id || booking?.studio_id,
      title: `${title} — Official Call Sheet`,
      shoot_date: booking?.start_datetime || new Date().toISOString(),
      general_call_time: '08:00 AM',
      location_name: loc,
      google_maps_url: loc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}` : '',
      weatherSummary: 'Clear Skies • 31°C • Low wind (Drone clearance verified)',
      emergency_contact: `${clientName} (${clientPhone || 'Producer'})`,
      schedule_items: defaultSchedule,
      crew_members: defaultCrew,
      notes_and_rules: '• All crew must wear neutral/dark production attire.\n• Drone flights restricted near high-tension lines.\n• Battery charging station located near Basecamp Room 1.',
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('call_sheets')
      .insert([newSheet])
      .select()
      .single();

    if (insertErr) {
      // If concurrent insert occurred, fallback to fetching
      const { data: fallback } = await supabase
        .from('call_sheets')
        .select('*')
        .eq('booking_id', bookingId)
        .single();
      if (fallback) return mapCallSheet(fallback);
      throw new Error(insertErr.message);
    }

    return mapCallSheet(inserted);
  },

  saveCallSheet: async (sheet: Partial<CallSheet> & { bookingId: string }): Promise<CallSheet> => {
    const payload: any = {
      title: sheet.title,
      shoot_date: sheet.shootDate,
      general_call_time: sheet.generalCallTime,
      location_name: sheet.locationName,
      google_maps_url: sheet.googleMapsUrl,
      weather_summary: sheet.weatherSummary,
      emergency_contact: sheet.emergencyContact,
      schedule_items: sheet.scheduleItems,
      crew_members: sheet.crewMembers,
      notes_and_rules: sheet.notesAndRules,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('call_sheets')
      .update(payload)
      .eq('booking_id', sheet.bookingId)
      .select()
      .single();

    if (error) {
      // Insert if row did not exist yet
      const { data: inserted, error: insErr } = await supabase
        .from('call_sheets')
        .insert([{ ...payload, booking_id: sheet.bookingId }])
        .select()
        .single();
      if (insErr) throw new Error(insErr.message);
      data = inserted;
    }

    return mapCallSheet(data);
  },

  formatWhatsAppCallSheet: (sheet: CallSheet): string => {
    const dateFormatted = new Date(sheet.shootDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const lines: string[] = [
      `🎬 *CALL SHEET: ${sheet.title.toUpperCase()}*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📅 *Date:* ${dateFormatted}`,
      `⏰ *General Call Time:* ${sheet.generalCallTime}`,
      `📍 *Location:* ${sheet.locationName || 'Venue TBD'}`,
    ];

    if (sheet.googleMapsUrl) {
      lines.push(`🗺️ *Maps Link:* ${sheet.googleMapsUrl}`);
    }
    if (sheet.weatherSummary) {
      lines.push(`☀️ *Weather:* ${sheet.weatherSummary}`);
    }

    lines.push(`\n📋 *PRODUCTION TIMELINE*`);
    if (sheet.scheduleItems && sheet.scheduleItems.length > 0) {
      sheet.scheduleItems.forEach((item) => {
        lines.push(`• *${item.time}* - ${item.event}${item.location ? ` (${item.location})` : ''}`);
        if (item.notes) lines.push(`   ↳ _${item.notes}_`);
      });
    } else {
      lines.push(`• Schedule to be announced on arrival.`);
    }

    lines.push(`\n👥 *CREW DIRECTORY*`);
    if (sheet.crewMembers && sheet.crewMembers.length > 0) {
      sheet.crewMembers.forEach((m) => {
        lines.push(`• *${m.name}* [${m.role}] - Call: ${m.callTime}${m.phone ? ` (📞 ${m.phone})` : ''}`);
      });
    }

    if (sheet.emergencyContact) {
      lines.push(`\n🚨 *Emergency Lead:* ${sheet.emergencyContact}`);
    }

    if (sheet.notesAndRules) {
      lines.push(`\n⚠️ *PRODUCTION NOTES:*`);
      lines.push(sheet.notesAndRules);
    }

    lines.push(`\n━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`⚡ Powered by *Camqrew* • India's Verified Creative Marketplace`);

    return lines.join('\n');
  },

  getPresetTemplates: () => [
    {
      name: 'Wedding & Reception Shoot',
      schedule: [
        { id: 'w1', time: '07:30 AM', event: 'Crew Call & Gear Setup', location: 'Bridal Suite & Lawn', notes: 'Check all gimbal balances & audio mics' },
        { id: 'w2', time: '09:00 AM', event: 'Haldi / Mehendi Ceremony', location: 'Poolside Lawn', notes: 'Slow-motion candid portraiture (60/120 fps)' },
        { id: 'w3', time: '01:00 PM', event: 'Lunch Break & Battery Recharge', location: 'Dining Hall', notes: 'Backup card dump to dual SSDs' },
        { id: 'w4', time: '04:00 PM', event: 'Bridal & Groom Solo Portraits', location: 'Royal Courtyard', notes: 'Golden hour lighting with reflectors' },
        { id: 'w5', time: '06:30 PM', event: 'Baraat & Varmala', location: 'Main Entrance & Mandap', notes: 'Drone aerial entry + 2 ground cameras' },
        { id: 'w6', time: '08:30 PM', event: 'Pheras & Reception Stage', location: 'Mandap', notes: 'Continuous 4K master audio & multi-cam sync' },
        { id: 'w7', time: '11:00 PM', event: 'Wrap & Final DIT Handover', location: 'Media Room', notes: 'Verify all checksums' },
      ],
    },
    {
      name: 'Commercial Ad & Brand Film',
      schedule: [
        { id: 'a1', time: '08:00 AM', event: 'Call Time & Lighting Rigging', location: 'Studio Bay A', notes: 'Gaffer & Grip lighting placement' },
        { id: 'a2', time: '09:30 AM', event: 'Scene 1: Product Showcase', location: 'White Cyclorama', notes: 'Motorized slider & macro probe lens' },
        { id: 'a3', time: '01:00 PM', event: 'Lunch & Client Review', location: 'Conference Room', notes: 'Color temp review with agency director' },
        { id: 'a4', time: '02:30 PM', event: 'Scene 2: Talent & Narrative Cuts', location: 'Set 2 (Living Room)', notes: 'Boom mic + wireless lavalier sync' },
        { id: 'a5', time: '06:30 PM', event: 'Wrap, Gear Count & Offload', location: 'Grip Truck', notes: 'Inspect rental gear condition' },
      ],
    },
  ],
};
