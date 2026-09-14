import { supabase } from './supabaseClient';
import type { JobRequest } from '../types/job';
import { getLocalityKeywords, parseLocationString, formatLocationString } from '../constants/locations';
import { notificationApi } from './notificationApi';

export interface JobLocationFilter {
  city?: string;
  district?: string;
  state?: string;
  scope?: 'city' | 'district' | 'state' | 'all';
}

export const jobApi = {
  createJobRequest: async (payload: {
    client_id: string;
    title: string;
    requirements: string;
    location: string;
    budget: number;
    state?: string;
    district?: string;
    city?: string;
  }) => {
    let { state, district, city, location } = payload;
    if (!city || !state) {
      const parsed = parseLocationString(location);
      city = city || parsed.city;
      district = district || parsed.district;
      state = state || parsed.state;
    }
    if (!location && (city || district || state)) {
      location = formatLocationString(city, district, state);
    }

    const insertPayload: any = {
      client_id: payload.client_id,
      title: payload.title,
      requirements: payload.requirements,
      location: location || payload.location,
      budget: payload.budget,
      state: state || null,
      district: district || null,
      city: city || null,
    };

    const { data, error } = await supabase
      .from('job_requests')
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw new Error(error.message);

    try {
      const localityKeywords = getLocalityKeywords(state, district, city);
      let proQuery = supabase.from('professional_profiles').select('id, city, district, state');

      const orConditions: string[] = [];
      if (city) orConditions.push(`city.ilike.%${city}%`);
      if (district) {
        orConditions.push(`district.ilike.%${district}%`);
        orConditions.push(`city.ilike.%${district}%`);
      }
      if (state) orConditions.push(`state.ilike.%${state}%`);

      localityKeywords.slice(0, 10).forEach(keyword => {
        if (keyword && keyword !== state && keyword !== city && keyword !== district) {
          orConditions.push(`city.ilike.%${keyword}%`);
        }
      });

      if (orConditions.length > 0) {
        proQuery = proQuery.or(orConditions.join(','));
      }

      const { data: pros } = await proQuery.limit(100);

      if (pros && pros.length > 0) {
        const locationDisplay = city ? (district ? `${city}, ${district}` : city) : 'your area';

        const notificationsToInsert = pros.map((p: any) => ({
          user_id: p.id,
          title: `📢 New Job in ${locationDisplay}!`,
          body: `${payload.title} • Budget: ₹${payload.budget.toLocaleString('en-IN')}`,
          target_url: '/dashboard?tab=jobboard',
          is_read: false,
        }));

        await supabase.from('notifications').insert(notificationsToInsert);

        pros.forEach((p: any) => {
          notificationApi.sendPushNotification(p.id, {
            title: `📢 New Job in ${locationDisplay}!`,
            body: `${payload.title} • Budget: ₹${payload.budget.toLocaleString('en-IN')}`,
            targetUrl: '/dashboard?tab=jobboard',
          }).catch(() => {});
        });
      }
    } catch (notifErr) {
      console.warn('Could not dispatch job broadcast notifications:', notifErr);
    }

    return data as JobRequest;
  },

  getOpenJobs: async (
    locationFilter?: string | JobLocationFilter,
    proId?: string
  ) => {
    let query = supabase.from('job_requests').select('*').eq('status', 'open');

    if (locationFilter) {
      if (typeof locationFilter === 'string') {
        const trimmed = locationFilter.trim();
        if (trimmed) {
          query = query.or(`location.ilike.%${trimmed}%,city.ilike.%${trimmed}%,district.ilike.%${trimmed}%`);
        }
      } else {
        const { city, district, state, scope } = locationFilter;

        if (scope === 'all') {
          // All jobs across India
        } else if (scope === 'state' && state) {
          query = query.or(`state.ilike.%${state}%,location.ilike.%${state}%`);
        } else if (scope === 'district' && district) {
          const conditions = [`district.ilike.%${district}%`, `location.ilike.%${district}%`];
          if (city) {
            conditions.push(`city.ilike.%${city}%`);
            conditions.push(`location.ilike.%${city}%`);
          }
          query = query.or(conditions.join(','));
        } else if (city || district) {
          const keywords = getLocalityKeywords(state, district, city);
          const orFilters: string[] = [];
          if (city) {
            orFilters.push(`city.ilike.%${city}%`);
            orFilters.push(`location.ilike.%${city}%`);
          }
          if (district) {
            orFilters.push(`district.ilike.%${district}%`);
            orFilters.push(`location.ilike.%${district}%`);
          }
          keywords.slice(0, 8).forEach(k => {
            if (k && k !== state && k !== city && k !== district) {
              orFilters.push(`location.ilike.%${k}%`);
              orFilters.push(`city.ilike.%${k}%`);
            }
          });
          if (orFilters.length > 0) {
            query = query.or(orFilters.join(','));
          }
        }
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    
    let openJobs = data as JobRequest[];
    if (proId) {
      openJobs = openJobs.filter(job => !job.rejected_pros?.includes(proId));
    }
    
    return openJobs;
  },

  getClientJobs: async (clientId: string) => {
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as JobRequest[];
  },

  acceptJob: async (jobId: string, proId: string) => {
    const { data, error } = await supabase
      .from('job_requests')
      .update({ status: 'reviewing', accepted_by: proId })
      .eq('id', jobId)
      .select()
      .single();
    if (error) throw new Error(error.message);

    try {
      const { data: proProfile } = await supabase
        .from('professional_profiles')
        .select('id, title, city, users:id (name)')
        .eq('id', proId)
        .single();

      const proName = (proProfile?.users as any)?.name || 'A verified creator';
      const notifTitle = `🎉 ${proName} Accepted Your Lead!`;
      const notifBody = `Pitch received for "${data.title}" (₹${data.budget.toLocaleString('en-IN')}). Review and accept to book.`;

      await notificationApi.sendPushNotification(data.client_id, {
        title: notifTitle,
        body: notifBody,
        targetUrl: `/jobs/review/${jobId}`,
      });
    } catch (notifErr) {
      console.warn('Could not dispatch client notification for accepted job:', notifErr);
    }

    return data as JobRequest;
  },

  getJobById: async (jobId: string): Promise<JobRequest | null> => {
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .eq('id', jobId)
      .single();
    if (error) return null;
    return data as JobRequest;
  },

  markJobBooked: async (jobId: string) => {
    const { data, error } = await supabase
      .from('job_requests')
      .update({ status: 'booked' })
      .eq('id', jobId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as JobRequest;
  },

  rejectPro: async (jobId: string, proId: string) => {
    const { data: job } = await supabase.from('job_requests').select('rejected_pros').eq('id', jobId).single();
    const rejected = job?.rejected_pros || [];
    
    const { data, error } = await supabase
      .from('job_requests')
      .update({ 
        status: 'open', 
        accepted_by: null, 
        rejected_pros: [...rejected, proId] 
      })
      .eq('id', jobId)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return data as JobRequest;
  }
};
