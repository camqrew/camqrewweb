import { supabase } from './supabaseClient';
import type { ProfessionalProfile, ReviewItem, FeedReelItem, MenuDishItem } from '../types/professional';

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

export const DEFAULT_CATERER_DISHES: MenuDishItem[] = [
  {
    id: 'dish_cat_1',
    name: 'Galouti Kebab on Ulte Tawe Ka Paratha',
    category: 'Starter',
    pricePerPlate: 350,
    dietaryTags: ['Non-Veg'],
    description: 'Mouth-melting Awadhi minced mutton smoked with clove and betel leaf, served on saffron-glazed mini parathas.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
    isAvailable: true,
  },
  {
    id: 'dish_cat_2',
    name: 'Paneer Tikka Angara',
    category: 'Starter',
    pricePerPlate: 240,
    dietaryTags: ['Veg', 'Jain'],
    description: 'Charcoal-grilled cottage cheese cubes marinated in Kashmiri deghi mirch, hung curd, and aromatic ajwain.',
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=800',
    isAvailable: true,
  },
  {
    id: 'dish_cat_3',
    name: 'Murgh Malai Tikka',
    category: 'Starter',
    pricePerPlate: 320,
    dietaryTags: ['Non-Veg'],
    description: 'Tender chicken suprêmes marinated in clotted cream, green cardamom, cheese, and grilled in a clay tandoor.',
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=800',
    isAvailable: true,
  },
  {
    id: 'dish_cat_4',
    name: 'Dahi Ke Kebab',
    category: 'Starter',
    pricePerPlate: 220,
    dietaryTags: ['Veg'],
    description: 'Crisp shallow-fried hung yogurt patties with fresh coriander, bell peppers, and roasted cumin core.',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800',
    isAvailable: true,
  },
  {
    id: 'dish_cat_5',
    name: 'Amritsari Fish Tikka',
    category: 'Starter',
    pricePerPlate: 360,
    dietaryTags: ['Non-Veg'],
    description: 'Crisp golden river sole fillets marinated in carom seeds, ginger-garlic relish, and gram flour.',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=800',
    isAvailable: true,
  },
  {
    id: 'dish_cat_6',
    name: 'Dum Pukht Awadhi Mutton Biryani',
    category: 'Main Course',
    pricePerPlate: 450,
    dietaryTags: ['Non-Veg'],
    description: 'Aged long-grain basmati rice layered with succulent baby goat, sealed with dough in a heavy brass degh and slow-cooked over coals.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800',
    isAvailable: true,
  },
  {
    id: 'dish_cat_7',
    name: 'Dal Makhani Bukhara Style',
    category: 'Main Course',
    pricePerPlate: 260,
    dietaryTags: ['Veg'],
    description: 'Slow-simmered whole black lentils cooked overnight for 18 hours with vine-ripened tomatoes, white butter, and clotted cream.',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800',
    isAvailable: true,
  },
  {
    id: 'dish_cat_8',
    name: 'Butter Chicken Delhite 1952',
    category: 'Main Course',
    pricePerPlate: 380,
    dietaryTags: ['Non-Veg'],
    description: 'Tandoori chicken shredded and tossed in a velvety, satin-smooth sun-dried tomato and cashew butter gravy finished with kasoori methi.',
    imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800',
    isAvailable: true,
  },
  {
    id: 'dish_cat_9',
    name: 'Live Woodfire Neapolitan Pizza Counter',
    category: 'Live Counter',
    pricePerPlate: 300,
    dietaryTags: ['Veg'],
    description: 'Live station baking artisanal 48-hour fermented sourdough pizzas with San Marzano tomatoes, fresh Fior di Latte, and basil.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800',
    isAvailable: true,
  },
  {
    id: 'dish_cat_10',
    name: 'Royal Zafrani Kesar Phirni & Malpua Rabdi',
    category: 'Dessert',
    pricePerPlate: 190,
    dietaryTags: ['Veg'],
    description: 'Kashmiri saffron infused broken basmati pudding served in chilled earthen shikoras paired with silver-leaf malpua and thick rabdi.',
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800',
    isAvailable: true,
  },
];

export const getCategoryDefaultCover = (categories?: string[]): string => {
  const cats = (categories || []).map(c => (c || '').toLowerCase());
  if (cats.some(c => c.includes('model') || c.includes('runway'))) return 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600';
  if (cats.some(c => c.includes('baker') || c.includes('bake') || c.includes('cake') || c.includes('pastry'))) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1600';
  if (cats.some(c => c.includes('cater') || c.includes('chef') || c.includes('food') || c.includes('culinary'))) return 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1600';
  if (cats.some(c => c.includes('organis') || c.includes('event') || c.includes('planner'))) return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1600';
  if (cats.some(c => c.includes('develop') || c.includes('code') || c.includes('tech') || c.includes('software'))) return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1600';
  if (cats.some(c => c.includes('design') || c.includes('ui/ux'))) return 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1600';
  if (cats.some(c => c.includes('drone') || c.includes('pilot') || c.includes('aerial'))) return 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1600';
  if (cats.some(c => c.includes('edit') || c.includes('colorist'))) return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1600';
  if (cats.some(c => c.includes('makeup') || c.includes('beauty'))) return 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1600';
  if (cats.some(c => c.includes('mehendi') || c.includes('henna') || c.includes('mehndi'))) return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600';
  if (cats.some(c => c.includes('travel') || c.includes('transport') || c.includes('fleet') || c.includes('van') || c.includes('car'))) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1600';
  if (cats.some(c => c.includes('video') || c.includes('cinema') || c.includes('film'))) return 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1600';
  return 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1600';
};

const mapPro = (row: any): ProfessionalProfile => {
  const user = row.users || {};
  const name = user.name || 'Creative Studio';
  const avatar = user.avatar || '';
  const banner = row.banner_image || user.banner_image || getCategoryDefaultCover(row.categories);

  const isCaterer = (Array.isArray(row.categories) && row.categories.some((c: string) => c.toLowerCase().includes('cater')))
    || String(row.id).includes('1500842a')
    || (row.title && row.title.toLowerCase().includes('cater'));

  let resolvedMenuItems: MenuDishItem[] = [];
  if (Array.isArray(row.menu_items) && row.menu_items.length > 0) {
    resolvedMenuItems = row.menu_items as MenuDishItem[];
  } else {
    try {
      const saved = localStorage.getItem(`@camqrew_menu_items_${row.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          resolvedMenuItems = parsed;
        }
      }
    } catch {}

    if (resolvedMenuItems.length === 0 && isCaterer) {
      resolvedMenuItems = DEFAULT_CATERER_DISHES;
    }
  }

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
    certifications: Array.isArray(row.certifications) ? row.certifications : (Array.isArray(row.skills) ? row.skills : []),
    portfolio: Array.isArray(row.portfolio_items) ? row.portfolio_items.map((i: any) => i.media_url) : [],
    services: Array.isArray(row.services) ? row.services : [], 
    videoReels: Array.isArray(row.video_reels) ? row.video_reels : [],
    menuItems: resolvedMenuItems,
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

    if (name || avatar || bannerImage) {
      const userUpdate: any = {};
      if (name) userUpdate.name = name;
      if (avatar) userUpdate.avatar = avatar;
      if (bannerImage) userUpdate.banner_image = bannerImage;
      await supabase.from('users').update(userUpdate).eq('id', ownerId);
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
    if (bannerImage) updatePayload.banner_image = bannerImage;
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
    if (proFields.menuItems !== undefined) {
      try {
        localStorage.setItem(`@camqrew_menu_items_${ownerId}`, JSON.stringify(proFields.menuItems));
      } catch {}
      updatePayload.menu_items = proFields.menuItems;
    }

    let updated: any;
    if (Object.keys(updatePayload).length > 0) {
      let { data: updatedData, error } = await supabase
        .from('professional_profiles')
        .update(updatePayload)
        .eq('id', ownerId)
        .select(`*, users (name, avatar), portfolio_items (media_url)`)
        .single();
        
      if (error && error.message && error.message.includes('menu_items')) {
        // If menu_items column hasn't been migrated yet, retry update without it
        delete updatePayload.menu_items;
        if (Object.keys(updatePayload).length > 0) {
          const retry = await supabase
            .from('professional_profiles')
            .update(updatePayload)
            .eq('id', ownerId)
            .select(`*, users (name, avatar), portfolio_items (media_url)`)
            .single();
          if (retry.error) throw new Error(retry.error.message);
          updatedData = retry.data;
        } else {
          const fetchCurr = await supabase
            .from('professional_profiles')
            .select(`*, users (name, avatar), portfolio_items (media_url)`)
            .eq('id', ownerId)
            .single();
          updatedData = fetchCurr.data;
        }
      } else if (error) {
        throw new Error(error.message);
      }
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
