import { supabase } from './supabaseClient';
import type { ProfessionalProfile, ReviewItem, FeedReelItem } from '../types/professional';

export interface GetProfessionalsFilter {
  category?: string;
  state?: string;
  district?: string;
  city?: string;
  location?: string;
  minRate?: number;
  maxRate?: number;
  rating?: number;
  searchQuery?: string;
}

export interface ParsedVideo {
  type: 'youtube' | 'vimeo' | 'direct';
  embedUrl: string;
  thumbnailUrl?: string;
  isShort?: boolean;
}

export function parseVideoUrl(url: string): ParsedVideo {
  const cleanUrl = (url || '').trim();

  // 1. YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID or https://youtube.com/shorts/VIDEO_ID
  const shortsMatch = cleanUrl.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) {
    const videoId = shortsMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      isShort: true,
    };
  }

  // 2. YouTube Standard: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      isShort: false,
    };
  }

  // 3. Vimeo: https://vimeo.com/VIDEO_ID or https://player.vimeo.com/video/VIDEO_ID
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|))(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&color=3fb668&title=0&byline=0&portrait=0`,
      thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
      isShort: false,
    };
  }

  // 4. Direct video URL (MP4 / WebM)
  return {
    type: 'direct',
    embedUrl: cleanUrl,
    thumbnailUrl: undefined,
    isShort: cleanUrl.includes('portrait') || cleanUrl.includes('short') || cleanUrl.includes('reel'),
  };
}

const mapPro = (row: any): ProfessionalProfile => {
  const user = row.users || {};
  const name = user.name || 'Creative Studio';
  const avatar = user.avatar || '';
  const banner = row.banner_image || '';

  return {
    id: String(row.id),
    userId: String(row.id),
    name,
    title: row.title || 'Creative Professional',
    bio: row.bio || '',
    experienceYears: Number(row.experience_years || 0),
    avatar,
    bannerImage: banner,
    verified: Boolean(row.verified),
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || 0),
    city: row.city || '',
    state: row.state || '',
    district: row.district || row.city || '',
    locations: Array.isArray(row.locations) ? row.locations : (row.city ? [row.city] : []),
    categories: Array.isArray(row.categories) ? row.categories : [],
    ratePerDay: Number(row.rate_per_day || 0),
    equipment: Array.isArray(row.equipment) ? row.equipment : [],
    certifications: Array.isArray(row.certifications) ? row.certifications : [],
    portfolio: Array.isArray(row.portfolio_items) ? row.portfolio_items.map((i: any) => i.media_url) : [],
    services: Array.isArray(row.services) ? row.services : [], 
    videoReels: Array.isArray(row.video_reels) ? row.video_reels : [],
    reviews: [],
    weeklyAvailability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
    blockedDates: [],
  };
};

export const professionalApi = {
  getProfessionals: async (filters: GetProfessionalsFilter = {}): Promise<ProfessionalProfile[]> => {
    let query = supabase.from('professional_profiles').select(`
      *,
      users (
        name,
        avatar
      ),
      portfolio_items (
        media_url
      )
    `);

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    } else if (filters.district) {
      query = query.ilike('district', `%${filters.district}%`);
    } else if (filters.state) {
      query = query.ilike('state', `%${filters.state}%`);
    } else if (filters.location) {
      query = query.or(`city.ilike.%${filters.location}%,district.ilike.%${filters.location}%,state.ilike.%${filters.location}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching professionals:', error);
      return [];
    }

    let results = (data || []).map(mapPro);

    if (filters.category && filters.category !== 'All') {
      const catClean = filters.category.toLowerCase();
      results = results.filter(p => p.categories.some(c => c.toLowerCase().includes(catClean)));
    }
    
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.title.toLowerCase().includes(q) || 
        p.city.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q)
      );
    }

    if (filters.minRate) {
      results = results.filter(p => p.ratePerDay >= (filters.minRate || 0));
    }
    if (filters.maxRate) {
      results = results.filter(p => p.ratePerDay <= (filters.maxRate || Infinity));
    }

    return results;
  },

  getProfileById: async (id: string): Promise<ProfessionalProfile> => {
    const [profileRes, reviews] = await Promise.all([
      supabase.from('professional_profiles').select(`
        *,
        users (
          name,
          avatar
        ),
        portfolio_items (
          media_url
        )
      `).eq('id', id).single(),
      professionalApi.getReviews(id).catch(() => [])
    ]);

    const { data, error } = profileRes;

    if (error || !data) {
      throw new Error(error?.message || 'Profile not found');
    }

    const pro = mapPro(data);
    pro.reviews = reviews || [];
    if (pro.reviews.length > 0) {
      pro.reviewCount = pro.reviews.length;
    }
    return pro;
  },

  getReviews: async (proId: string): Promise<ReviewItem[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users!reviewer_id(name, avatar)')
      .eq('target_user_id', proId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching reviews:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: String(r.id),
      clientName: r.users?.name || 'Verified Client',
      clientAvatar: r.users?.avatar,
      rating: Number(r.rating || 5),
      date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
      comment: r.comment || '',
    }));
  },

  addReview: async (proId: string, rating: number, comment: string): Promise<ReviewItem> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('You must be signed in to leave a review.');

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        reviewer_id: userId,
        target_user_id: proId,
        rating,
        comment: comment.trim(),
      }])
      .select('*, users!reviewer_id(name, avatar)')
      .single();

    if (error) throw new Error(error.message);

    // Recalculate and update pro profile rating & review_count
    try {
      const { data: allRevs } = await supabase
        .from('reviews')
        .select('rating')
        .eq('target_user_id', proId);

      if (allRevs && allRevs.length > 0) {
        const avg = Number((allRevs.reduce((acc, cur) => acc + Number(cur.rating || 0), 0) / allRevs.length).toFixed(1));
        await supabase
          .from('professional_profiles')
          .update({ rating: avg, review_count: allRevs.length })
          .eq('id', proId);
      }
    } catch (err) {
      console.warn('Error updating pro rating stats:', err);
    }

    return {
      id: String(data.id),
      clientName: data.users?.name || userData.user?.user_metadata?.name || 'Verified Client',
      clientAvatar: data.users?.avatar,
      rating: Number(data.rating || rating),
      date: 'Just now',
      comment: data.comment || comment,
    };
  },

  updateProfile: async (data: Partial<ProfessionalProfile>): Promise<ProfessionalProfile> => {
    const { data: userData } = await supabase.auth.getUser();
    const ownerId = userData?.user?.id;
    
    if (!ownerId) throw new Error('Not authenticated');

    const { name, avatar, bannerImage, portfolio, ...proFields } = data;

    if (name || avatar) {
      await supabase.from('users').update({
        name: name,
        avatar: avatar,
      }).eq('id', ownerId);
    }

    if (portfolio) {
      await supabase.from('portfolio_items').delete().eq('professional_id', ownerId);
      if (portfolio.length > 0) {
        const inserts = portfolio.map(url => ({
          professional_id: ownerId,
          media_url: url,
          media_type: 'image',
        }));
        await supabase.from('portfolio_items').insert(inserts);
      }
    }

    const updatePayload: any = {};
    if (proFields.title) updatePayload.title = proFields.title;
    if (proFields.bio) updatePayload.bio = proFields.bio;
    if (proFields.experienceYears) updatePayload.experience_years = proFields.experienceYears;
    if (proFields.ratePerDay) updatePayload.rate_per_day = proFields.ratePerDay;
    if (proFields.city) updatePayload.city = proFields.city;
    if (proFields.district) updatePayload.district = proFields.district;
    if (proFields.state) updatePayload.state = proFields.state;
    if (proFields.equipment) updatePayload.equipment = proFields.equipment;
    if (proFields.categories) updatePayload.categories = proFields.categories;
    if (proFields.certifications) updatePayload.skills = proFields.certifications;
    if (proFields.services) updatePayload.services = proFields.services;
    if (proFields.videoReels !== undefined) updatePayload.video_reels = proFields.videoReels;

    let updated: any;
    if (Object.keys(updatePayload).length > 0) {
      const { data: updatedData, error } = await supabase
        .from('professional_profiles')
        .update(updatePayload)
        .eq('id', ownerId)
        .select(`*, users (name, avatar), portfolio_items (media_url)`)
        .single();
        
      if (error) throw new Error(error.message);
      updated = updatedData;
    } else {
      const { data: currentData, error } = await supabase
        .from('professional_profiles')
        .select(`*, users (name, avatar), portfolio_items (media_url)`)
        .eq('id', ownerId)
        .single();

      if (error) throw new Error(error.message);
      updated = currentData;
    }

    return mapPro(updated);
  },

  getAllReels: async (): Promise<FeedReelItem[]> => {
    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select(`
          id,
          title,
          city,
          rate_per_day,
          rating,
          categories,
          video_reels,
          verified,
          users (
            id,
            name,
            avatar
          )
        `)
        .not('video_reels', 'is', null);

      const dbReels: FeedReelItem[] = [];
      if (!error && Array.isArray(data)) {
        data.forEach((pro: any) => {
          if (Array.isArray(pro.video_reels)) {
            pro.video_reels.forEach((reel: any, idx: number) => {
              if (reel && (reel.url || reel.embedUrl)) {
                dbReels.push({
                  ...reel,
                  id: reel.id || `pro_reel_${pro.id}_${idx}`,
                  creatorId: pro.id,
                  creatorName: pro.users?.name || 'Verified Creator',
                  creatorAvatar: pro.users?.avatar || '',
                  creatorTitle: pro.title || 'Professional Creator',
                  creatorCity: pro.city || '',
                  creatorRatePerDay: pro.rate_per_day || 0,
                  creatorRating: pro.rating || 0,
                  creatorVerified: pro.verified ?? false,
                  likesCount: 0,
                });
              }
            });
          }
        });
      }

      const seen = new Set<string>();
      return dbReels.filter(r => {
        const key = r.embedUrl || r.url || r.id;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch (err) {
      console.warn('Failed to fetch reels from Supabase:', err);
      return [];
    }
  },
};

export const CURATED_FALLBACK_REELS: FeedReelItem[] = [];
