import { supabase } from './supabaseClient';
import type { Booking, BookingStatus } from '../types/booking';
import { notificationApi } from './notificationApi';

const mapBooking = (b: any): Booking => {
  const loc = b.location_details?.address || b.location_details?.city || (typeof b.location_details === 'string' ? b.location_details : '') || '';
  const service = b.items?.serviceTitle || b.service_title || 'Creative Service';
  const notes = b.items?.notes || '';
  const contractSig = b.items?.contractSignature || '';

  let days = b.items?.daysCount || 1;
  if (b.start_datetime && b.end_datetime && !b.items?.daysCount) {
    try {
      const d1 = new Date(b.start_datetime);
      const d2 = new Date(b.end_datetime);
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) days = diff;
    } catch {}
  }

  const seenTitles = new Set<string>();
  const rawMilestones = Array.isArray(b.booking_milestones) ? b.booking_milestones
    .filter((m: any) => {
      if (seenTitles.has(m.title)) return false;
      seenTitles.add(m.title);
      return true;
    })
    .map((m: any) => ({
      id: String(m.id),
      title: m.title,
      amount: Number(m.amount),
      status: (m.status === 'paid' || m.status === 'released') ? 'released' : 'held',
    })) : [];

  const proAvatar = b.professional_profiles?.users?.avatar || b.studio_bays?.users?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';

  return {
    id: String(b.id),
    professionalId: b.professional_id,
    studioId: b.studio_id,
    professionalAvatar: proAvatar,
    professionalName: b.professional_profiles?.users?.name || b.studio_bays?.users?.name || 'Professional',
    customerId: b.customer_id,
    customerName: b.users?.name || 'Customer',
    serviceTitle: service,
    startDate: b.start_datetime,
    endDate: b.end_datetime || b.start_datetime,
    daysCount: days,
    location: loc,
    notes: notes,
    contractSignature: contractSig,
    status: (b.status === 'escrow_held' ? 'confirmed' : b.status) as BookingStatus,
    ratePerDay: Number(b.total_amount || 0),
    totalAmount: Number(b.total_amount || 0),
    milestones: rawMilestones,
    createdAt: b.created_at,
  };
};

export const bookingApi = {
  createBooking: async (data: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
    const { data: userData } = await supabase.auth.getUser();
    const clientId = userData?.user?.id;
    if (!clientId) throw new Error('Not authenticated. Please sign in to book.');

    const { data: existingUser } = await supabase.from('users').select('id').eq('id', clientId).single();
    if (!existingUser) {
      await supabase.from('users').insert([{
        id: clientId,
        name: userData.user?.user_metadata?.name || data.customerName || 'Customer',
        email: userData.user?.email || '',
        phone: userData.user?.phone || userData.user?.user_metadata?.phone || '0000000000',
        role: 'customer'
      }]);
    }

    const parseDate = (d: string) => {
      if (!d) return new Date().toISOString().split('T')[0];
      try {
        const parts = d.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return d;
      } catch(e) {
        return new Date().toISOString().split('T')[0];
      }
    };

    const newBookingRow: any = {
      customer_id: clientId,
      start_datetime: parseDate(data.startDate),
      end_datetime: parseDate(data.endDate),
      total_amount: data.totalAmount,
      status: 'pending',
      location_details: data.location ? { address: data.location } : null,
      items: {
        serviceTitle: data.serviceTitle,
        notes: data.notes,
        contractSignature: data.contractSignature,
        daysCount: data.daysCount,
      }
    };
    
    if (data.professionalId) {
      newBookingRow.professional_id = data.professionalId;
    }
    if (data.studioId) {
      newBookingRow.studio_id = data.studioId;
    }

    const { data: inserted, error } = await supabase
      .from('bookings')
      .insert([newBookingRow])
      .select(`
        *,
        users (name, avatar),
        professional_profiles (users (name, avatar)),
        booking_milestones (*)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    try {
      const receiverId = data.professionalId || data.studioId;
      if (receiverId) {
        await notificationApi.sendPushNotification(receiverId, {
          title: '📅 New Booking Request!',
          body: `${data.customerName || 'A customer'} requested to book you for ${data.serviceTitle || 'a project'}.`,
          targetUrl: `/dashboard?tab=bookings`,
        });
      }
    } catch (e) {
      console.warn('Failed to send booking notification', e);
    }

    return mapBooking(inserted);
  },

  getCustomerBookings: async (): Promise<Booking[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users (name, avatar),
        professional_profiles (users (name, avatar)),
        booking_milestones (*)
      `)
      .eq('customer_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching customer bookings', error);
      return [];
    }

    return (data || []).map(mapBooking);
  },

  getProfessionalBookings: async (): Promise<Booking[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users (name, avatar),
        professional_profiles (users (name, avatar)),
        booking_milestones (*)
      `)
      .eq('professional_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching professional bookings', error);
      return [];
    }

    return (data || []).map(mapBooking);
  },

  acceptBooking: async (bookingId: string): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId)
      .select(`*, users (name, avatar), professional_profiles (users (name, avatar)), booking_milestones (*)`)
      .single();

    if (error) throw new Error(error.message);

    try {
      if (data?.customer_id) {
        notificationApi.sendPushNotification(data.customer_id, {
          title: '🎉 Booking Accepted!',
          body: 'Your booking request was accepted! Pay the advance escrow to confirm your dates.',
          targetUrl: '/dashboard?tab=bookings',
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Booking accept notification failed:', e);
    }

    return mapBooking(data);
  },

  declineBooking: async (bookingId: string): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select(`*, users (name, avatar), professional_profiles (users (name, avatar)), booking_milestones (*)`)
      .single();

    if (error) throw new Error(error.message);

    try {
      if (data?.customer_id) {
        notificationApi.sendPushNotification(data.customer_id, {
          title: 'Booking Declined',
          body: 'The professional is unavailable for this booking. Explore other top creators on Camqrew.',
          targetUrl: '/dashboard?tab=bookings',
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Booking decline notification failed:', e);
    }

    return mapBooking(data);
  },

  payAndConfirmBooking: async (bookingId: string): Promise<Booking> => {
    const { data: current } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (!current) throw new Error('Booking not found');

    const tot = current.total_amount || 20000;
    const advance = Math.round(tot * 0.3);
    const shootWrap = Math.round(tot * 0.4);
    const final = tot - advance - shootWrap;
    const milestonesToInsert = [
      { booking_id: bookingId, title: 'Advance Escrow (30%)', amount: advance, status: 'paid' },
      { booking_id: bookingId, title: 'Shoot Wrap Escrow (40%)', amount: shootWrap, status: 'pending' },
      { booking_id: bookingId, title: 'Final Deliverables Escrow (30%)', amount: final, status: 'pending' },
    ];

    const { data: existingMilestones } = await supabase.from('booking_milestones').select('id').eq('booking_id', bookingId);
    if (!existingMilestones || existingMilestones.length === 0) {
      await supabase.from('booking_milestones').insert(milestonesToInsert);
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .select(`*, users (name, avatar), professional_profiles (users (name, avatar)), booking_milestones (*)`)
      .single();

    if (error) throw new Error(error.message);

    try {
      const recipientId = data?.professional_id || data?.studio_id;
      if (recipientId) {
        notificationApi.sendPushNotification(recipientId, {
          title: '✅ Advance Escrow Paid & Booking Confirmed!',
          body: `Advance escrow of ₹${advance.toLocaleString('en-IN')} has been funded. Dates are locked!`,
          targetUrl: '/dashboard?tab=bookings',
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Payment notification failed:', e);
    }

    return mapBooking(data);
  },

  releaseMilestone: async (bookingId: string, milestoneId: string): Promise<void> => {
    const { error } = await supabase
      .from('booking_milestones')
      .update({ status: 'paid' })
      .eq('id', milestoneId);

    if (error) throw new Error(error.message);

    const { data: milestones } = await supabase
      .from('booking_milestones')
      .select('status')
      .eq('booking_id', bookingId);

    if (milestones && milestones.length > 0 && milestones.every(m => m.status === 'paid')) {
      await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);
    }
  },

  signContract: async (bookingId: string, signatoryName: string, role: 'customer' | 'professional' = 'customer'): Promise<void> => {
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('items')
      .eq('id', bookingId)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);

    const items = booking?.items || {};
    const nowIso = new Date().toISOString();

    if (role === 'professional') {
      items.proSignature = signatoryName;
      items.proSignedAt = nowIso;
    } else {
      items.contractSignature = signatoryName;
      items.contractSignedAt = nowIso;
    }

    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ items })
      .eq('id', bookingId);

    if (updateErr) throw new Error(updateErr.message);
  },
};
