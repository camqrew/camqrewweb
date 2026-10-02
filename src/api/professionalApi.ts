import { supabase } from './supabaseClient';
import { useAuthStore } from '../store/authStore';
import type { ProfessionalProfile, ReviewItem, FeedReelItem, MenuDishItem, ServiceItem } from '../types/professional';

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

export const getDefaultServicesForCategories = (categories: string[] = [], baseRate: number = 15000): ServiceItem[] => {
  const cats = (categories || []).map(c => (c || '').toLowerCase());
  
  if (cats.some(c => c.includes('drone') || c.includes('pilot') || c.includes('aerial'))) {
    return [
      { id: 'def_srv_drone_1', title: 'Cinematic 4K Aerial Drone Coverage', category: 'Aerial', rate: Math.max(18000, baseRate), unit: 'Day', description: '4K ProRes drone sweeps, procession and venue overhead captures with DGCA compliance.', deliverables: '4K uncompressed video files, 48MP raw still photos, dual battery operations' },
      { id: 'def_srv_drone_2', title: 'Dynamic FPV Indoor / Outdoor Flythrough', category: 'FPV', rate: Math.max(22000, Math.round(baseRate * 1.25)), unit: 'Day', description: 'One-shot continuous FPV drone flythrough of venues, resorts, or automotive chases.', deliverables: 'Reel-steady 4K 60fps stabilized footage, color graded rushes' },
      { id: 'def_srv_drone_3', title: 'Live Aerial Video Feed for Broadcast / LED', category: 'Live Feed', rate: Math.max(15000, Math.round(baseRate * 0.8)), unit: 'Event', description: 'Wireless zero-latency 1080p aerial feed output directly to OB vans or stage LED screens.', deliverables: 'Wireless receiver setup, HDMI/SDI output, continuous flight operator' },
    ];
  }

  if (cats.some(c => c.includes('video') || c.includes('cinema') || c.includes('film'))) {
    return [
      { id: 'def_srv_vid_1', title: 'Full-Day Cinematic Film Production', category: 'Cinematography', rate: Math.max(25000, baseRate), unit: 'Day', description: 'Multi-cam cinema production, prime lenses, gimbal stabilization, and wireless audio recording.', deliverables: 'Full day coverage, 1 highlight teaser (60s), 1 extended film, all raw rushes' },
      { id: 'def_srv_vid_2', title: 'Commercial Brand & Ad Directing', category: 'Commercial', rate: Math.max(30000, Math.round(baseRate * 1.2)), unit: 'Day', description: 'End-to-end commercial film directing, lighting setup, and creative moodboard execution.', deliverables: 'ProRes 422 HQ camera footage, multiple aspect ratio deliverables (16:9, 9:16)' },
      { id: 'def_srv_vid_3', title: 'Fast-Paced Event Aftermovie', category: 'Event Video', rate: Math.max(18000, Math.round(baseRate * 0.75)), unit: 'Event', description: 'High-energy event recap with dynamic editing, sound effects, and color grading.', deliverables: '2-3 minute social aftermovie delivered within 48-72 hours' },
    ];
  }

  if (cats.some(c => c.includes('edit') || c.includes('colorist'))) {
    return [
      { id: 'def_srv_edit_1', title: 'Cinematic Film Editing & Sound Design', category: 'Post-Production', rate: Math.max(20000, baseRate), unit: 'Project', description: 'Non-linear editing of multi-cam footage with dialogue cleanup and bespoke sound design.', deliverables: 'Full master cut, 2 revisions, mastered audio stems' },
      { id: 'def_srv_edit_2', title: 'DaVinci Resolve Creative Color Grade', category: 'Color Grading', rate: Math.max(15000, Math.round(baseRate * 0.8)), unit: 'Project', description: 'Color calibration, skin-tone optimization, and creative film emulation styling.', deliverables: 'DaVinci Resolve project archive and exported ProRes 4444 masters' },
      { id: 'def_srv_edit_3', title: 'Social Video & Reel Growth Pack (10 Reels)', category: 'Social Media', rate: Math.max(12000, Math.round(baseRate * 0.6)), unit: 'Package', description: '10 viral-hook short form reels with dynamic subtitles, B-roll overlays, and SFX.', deliverables: '10 finished 9:16 reels under 60 seconds' },
    ];
  }

  if (cats.some(c => c.includes('makeup') || c.includes('beauty'))) {
    return [
      { id: 'def_srv_mua_1', title: 'HD Airbrush Bridal Makeover & Hair', category: 'Bridal', rate: Math.max(18000, baseRate), unit: 'Bride', description: '18-hour sweatproof airbrush HD makeup, mink eyelashes, hair styling, and dupatta draping.', deliverables: 'Full bridal makeover, luxury cosmetics kit, complimentary touch-up set' },
      { id: 'def_srv_mua_2', title: 'Cocktail & Sangeet Party Glam', category: 'Party Glam', rate: Math.max(10000, Math.round(baseRate * 0.6)), unit: 'Person', description: 'Glam party makeup with smokey eye artistry, dewy finish, and Hollywood wave styling.', deliverables: 'Complete party makeover with false lashes and hair styling' },
      { id: 'def_srv_mua_3', title: 'Editorial & Fashion Shoot Makeup', category: 'Editorial', rate: Math.max(14000, Math.round(baseRate * 0.8)), unit: 'Day', description: 'On-set makeup for model catalogs, lookbooks, and high-fashion campaign photography.', deliverables: 'Up to 4 creative look changes, continuous set touch-ups' },
    ];
  }

  if (cats.some(c => c.includes('mehendi') || c.includes('henna') || c.includes('mehndi'))) {
    return [
      { id: 'def_srv_meh_1', title: 'Royal Bridal Mehendi (Elbows & Feet)', category: 'Bridal Henna', rate: Math.max(10000, baseRate), unit: 'Bride', description: 'Intricate bridal motifs, couple portraits, customized wedding hashtags, and 100% organic henna.', deliverables: 'Full bridal application up to elbows and feet, natural dark-stain aftercare kit' },
      { id: 'def_srv_meh_2', title: 'Sangeet Party Guest Henna (3 Hours)', category: 'Guest Package', rate: Math.max(7500, Math.round(baseRate * 0.75)), unit: 'Event', description: 'Fast elegant Arabic and Mandala floral patterns for up to 30 wedding guests with assistant artists.', deliverables: '3 hours continuous guest service, chemical-free organic cones' },
      { id: 'def_srv_meh_3', title: 'Engagement Minimalist Henna Cuffs', category: 'Contemporary', rate: Math.max(4500, Math.round(baseRate * 0.5)), unit: 'Hands', description: 'Delicate Moroccan cuffs and finger lace artwork for modern engagement celebrations.', deliverables: 'Both hands front & back application' },
    ];
  }

  if (cats.some(c => c.includes('cater') || c.includes('chef') || c.includes('culinary'))) {
    return [
      { id: 'def_srv_cat_1', title: 'Royal Banquet & Wedding Buffet', category: 'Wedding Catering', rate: Math.max(1200, baseRate), unit: 'Plate', description: 'Extensive multi-course gourmet buffet with live tandoor and uniformed five-star waitstaff.', deliverables: 'Complete chafing setup, fine bone china cutlery, service crew' },
      { id: 'def_srv_cat_2', title: 'Chef-Attended Live Street Food Counter', category: 'Live Counter', rate: 22000, unit: 'Counter', description: 'Interactive live cooking stations for woodfire pizza, dimsum, or gourmet chaat.', deliverables: 'Live equipment, ingredients, and specialized chefs for 150 guests' },
      { id: 'def_srv_cat_3', title: 'Gourmet Hi-Tea & Grazing Table', category: 'Corporate Catering', rate: 850, unit: 'Guest', description: 'Artisan grazing table with imported cheeses, canapés, dip platters, and mocktails.', deliverables: 'Aesthetic grazing setup, mocktail bar, premium glassware' },
    ];
  }

  if (cats.some(c => c.includes('organis') || c.includes('event') || c.includes('planner'))) {
    return [
      { id: 'def_srv_org_1', title: 'Turnkey Wedding Planning & Showrunning', category: 'Wedding Planning', rate: Math.max(100000, baseRate), unit: 'Event', description: 'Complete planning, vendor contracting, guest hospitality, logistics, and day-of show coordination.', deliverables: 'Full coordination crew, vendor milestone escrow management, detailed run of show' },
      { id: 'def_srv_org_2', title: 'Stage Fabrication, Trussing & LED Wall Setup', category: 'Stage Production', rate: Math.max(80000, Math.round(baseRate * 0.8)), unit: 'Event', description: 'AV stage trussing, curved LED video wall, digital lighting console, and sound engineering.', deliverables: 'Turnkey stage setup, audio/light engineers on site, tear-down crew' },
      { id: 'def_srv_org_3', title: 'Thematic Sangeet & Reception Decor', category: 'Decor', rate: Math.max(65000, Math.round(baseRate * 0.65)), unit: 'Event', description: 'Bespoke floral artistry, bridal entry walkway, set fabrication, and photo booths.', deliverables: 'Complete decor installation and lighting ambiance' },
    ];
  }

  if (cats.some(c => c.includes('baker') || c.includes('bake') || c.includes('cake'))) {
    return [
      { id: 'def_srv_bak_1', title: 'Multi-Tier Designer Wedding Cake', category: 'Wedding Cake', rate: 6000, unit: 'Cake (3-Tier)', description: 'Bespoke centerpiece wedding cake with edible gold leaf, handcrafted flowers, and gourmet Belgian truffle.', deliverables: '3-tier cake (4.5kg), temperature-controlled delivery, cake display setup' },
      { id: 'def_srv_bak_2', title: 'Artisan Dessert Table & Grazing Bar', category: 'Dessert Table', rate: 11000, unit: 'Table Setup', description: 'Gourmet dessert station with macarons, mini tartlets, cheesecake shooters, and cake pops (50 portions).', deliverables: '50 dessert portions, tiered display stands, name signage' },
      { id: 'def_srv_bak_3', title: 'Custom 3D Fondant Birthday Cake (2 Kg)', category: 'Celebration Cake', rate: 2600, unit: 'Cake', description: 'Handcrafted custom theme cake with 3D figurines and premium gift box packaging.', deliverables: '2kg cake in flavor of choice, custom sparkler candle' },
    ];
  }

  if (cats.some(c => c.includes('travel') || c.includes('transport') || c.includes('fleet'))) {
    return [
      { id: 'def_srv_trv_1', title: 'Luxury 2-Room Film Production Vanity Van', category: 'Vanity Van', rate: 14000, unit: 'Day (12 Hrs)', description: 'Dual room luxury van with illuminated makeup mirrors, AC, lounge, private washroom, and generator.', deliverables: '12-hour van hire with dedicated operator and generator fuel included' },
      { id: 'def_srv_trv_2', title: 'Toyota Innova Crysta / Hycross Crew Transport', category: 'Crew MPV', rate: 4500, unit: 'Day (8 Hrs / 80 Km)', description: 'Chauffeur-driven luxury MPV equipped with heavy-duty roof carrier for camera equipment cases.', deliverables: '8 hrs / 80 km package with verified professional driver' },
      { id: 'def_srv_trv_3', title: 'Mercedes E-Class / Luxury Bridal Entry Car', category: 'Bridal Car', rate: 18000, unit: 'Day', description: 'Decorated luxury sedan with executive chauffeur for bride & groom entry and departure.', deliverables: 'Uniformed chauffeur, premium floral car decoration, 100km package' },
    ];
  }

  if (cats.some(c => c.includes('craft') || c.includes('gift') || c.includes('hamper'))) {
    return [
      { id: 'def_srv_crf_1', title: 'Bespoke Wedding Trousseau Packing Trays', category: 'Trousseau', rate: 15000, unit: 'Set of 10 Trays', description: 'Handcrafted velvet and laser-cut acrylic trays with silk flowers and brocade accents.', deliverables: '10 presentation trays with protective cellophane wraps and monogram tags' },
      { id: 'def_srv_crf_2', title: 'Luxury VIP Return Gift Hampers', category: 'Hampers', rate: 1850, unit: 'Hamper', description: 'Curated wooden gift boxes with artisan candles, brass coasters, and dry fruits jars.', deliverables: 'Custom packed hamper with personalized wax seal tags' },
      { id: 'def_srv_crf_3', title: 'Fresh Floral Phoolon Ki Chaadar', category: 'Floral Crafts', rate: 6500, unit: 'Piece', description: 'Handcrafted fresh tuberose, baby breath, and rose chaadar with fairy-light accents.', deliverables: 'Fresh floral canopy ready on wedding day with 4-corner carry poles' },
    ];
  }

  if (cats.some(c => c.includes('develop') || c.includes('code') || c.includes('tech') || c.includes('software'))) {
    return [
      { id: 'def_srv_dev_1', title: 'Full-Stack Web App / SaaS MVP Development', category: 'Web App', rate: 85000, unit: 'Project', description: 'Production Next.js/React web application with Supabase/PostgreSQL, authentication, and payments.', deliverables: 'Full source code repo, CI/CD pipeline, SSL setup, 30 days support' },
      { id: 'def_srv_dev_2', title: 'Custom React Native Mobile App (iOS & Android)', category: 'Mobile App', rate: 75000, unit: 'Project', description: 'Cross-platform mobile app with push notifications, offline cache, and native fluid UI.', deliverables: 'App Store / Play Store submission packages and API integration' },
      { id: 'def_srv_dev_3', title: 'Technical Architecture & Code Performance Audit', category: 'Consulting', rate: 22000, unit: 'Day', description: 'Comprehensive review of database queries, security headers, and Core Web Vitals.', deliverables: 'Detailed technical remediation audit report with actionable pull requests' },
    ];
  }

  if (cats.some(c => c.includes('design') || c.includes('ui/ux'))) {
    return [
      { id: 'def_srv_des_1', title: 'Full Mobile App UI/UX Design System (Figma)', category: 'Product Design', rate: 55000, unit: 'Project', description: 'User-centered mobile UI in Figma up to 20 screens, clickable prototypes, and component library.', deliverables: 'Figma master file, atomic component library, responsive layouts, developer handoff' },
      { id: 'def_srv_des_2', title: 'Complete Brand Identity & Guidelines', category: 'Branding', rate: 32000, unit: 'Project', description: 'Custom logo mark, color palette, typography guidelines, stationery, and social media brand kit.', deliverables: 'Brand style guide PDF (30+ pages), vector logos (SVG, AI, PNG)' },
      { id: 'def_srv_des_3', title: 'High-Converting Landing Page Redesign', category: 'Web Design', rate: 25000, unit: 'Project', description: 'Modern desktop and mobile landing page engineered for maximum conversion and aesthetic delight.', deliverables: 'Figma artboards, vector illustrations, micro-interaction guidelines' },
    ];
  }

  if (cats.some(c => c.includes('model') || c.includes('runway'))) {
    return [
      { id: 'def_srv_mod_1', title: 'Full-Day Fashion Catalog & Lookbook Modeling', category: 'Fashion Modeling', rate: 22000, unit: 'Day', description: '8-hour editorial and e-commerce photoshoot for fashion labels with versatile posing.', deliverables: 'Up to 15 outfit changes, full digital & print promotional usage rights' },
      { id: 'def_srv_mod_2', title: 'Bridal Couture & High Jewelry Campaign', category: 'Bridal Fashion', rate: 28000, unit: 'Day', description: 'Luxury ethnic bridal wear and fine diamond/gold jewelry modeling with regal expressions.', deliverables: 'Full-day campaign shoot, close-up portraits, short reel clips' },
      { id: 'def_srv_mod_3', title: 'TVC & Digital Video Ad Campaign Appearance', category: 'Commercial Acting', rate: 25000, unit: 'Day', description: 'Lead or featured on-camera talent for brand commercials or digital advertising films.', deliverables: 'On-set performance up to 10 hours, character acting release' },
    ];
  }

  if (cats.some(c => c.includes('music') || c.includes('musician') || c.includes('band') || c.includes('guitar') || c.includes('vocal') || c.includes('violin') || c.includes('dj') || c.includes('instrument'))) {
    return [
      { id: 'def_srv_mus_1', title: 'Live Acoustic Performance & Vocals', category: 'Live Performance', rate: Math.max(25000, baseRate), unit: 'Performance (3 Hrs)', description: 'Acoustic guitar/violin and vocal set covering Bollywood, Sufi, Western pop, and retro classics with professional audio monitoring.', deliverables: '3 hours live performance, 2 set breaks, custom song requests included' },
      { id: 'def_srv_mus_2', title: 'Full Live Band Concert Experience', category: 'Live Band', rate: Math.max(65000, baseRate * 2), unit: 'Concert Set', description: '4-to-5 piece live band setup (Drums, Bass, Lead Guitar, Keys, Lead Vocalist) for grand sangeet, concerts, or college fests.', deliverables: 'High-energy 2.5-hour concert set, live stage coordination, complete band soundcheck' },
      { id: 'def_srv_mus_3', title: 'Solo Instrumental & Ambient Melodies', category: 'Solo Instrumental', rate: Math.max(15000, Math.round(baseRate * 0.6)), unit: 'Session', description: 'Soulful solo violin, flute, saxophone, or classical guitar set for guest receptions, cocktail dinners, and bridal entries.', deliverables: '2-hour ambient music set, wireless instrument pickup setup' },
    ];
  }

  if (cats.some(c => c.includes('emcee') || c.includes('ceremon') || c.includes('anchor') || c.includes('host') || c.includes('mc'))) {
    return [
      { id: 'def_srv_emc_1', title: 'Grand Wedding Sangeet & Reception Emcee', category: 'Wedding Emcee', rate: Math.max(25000, baseRate), unit: 'Evening Event', description: 'Bilingual energetic hosting (Hindi & English) driving family games, couple entries, dance performances, and audience engagement.', deliverables: 'Complete show rundown curation, stage anchoring up to 5 hours, crowd icebreakers' },
      { id: 'def_srv_emc_2', title: 'Corporate Summit & Annual Awards Host', category: 'Corporate Host', rate: Math.max(30000, baseRate), unit: 'Day / Conference', description: 'Polished, articulate, and poised stage presence for corporate summits, product launches, panel discussions, and gala dinner awards.', deliverables: 'Full day teleprompter / cue card hosting, speaker introductions, award protocol management' },
      { id: 'def_srv_emc_3', title: 'High-Energy Festival & Concert Stage Anchor', category: 'Concert Anchor', rate: Math.max(35000, baseRate), unit: 'Concert / Fest', description: 'Electrifying crowd engagement, celebrity intros, and rhythm coordination for college fests, music concerts, and sports leagues.', deliverables: 'Dynamic stage presence, sponsor rollouts, artist handoffs' },
    ];
  }

  // Default: Photography & General Creative Media
  return [
    { id: 'def_srv_photo_1', title: 'Full-Day Candid & Traditional Photography', category: 'Photography', rate: Math.max(20000, baseRate), unit: 'Day', description: 'Comprehensive shoot coverage with prime lenses capturing candid moments and portraits.', deliverables: '250+ color-graded high-resolution photos, private cloud gallery, 25 sneak peeks in 24 hrs' },
    { id: 'def_srv_photo_2', title: 'Pre-Wedding / Couple Portrait Storybook', category: 'Portraits', rate: Math.max(15000, Math.round(baseRate * 0.75)), unit: 'Session', description: '4-hour outdoor sunset session with 3 wardrobe changes and artistic creative direction.', deliverables: '40 master-retouched portraits, digital invitation graphic, all original high-res JPEG files' },
    { id: 'def_srv_photo_3', title: 'Executive Headshots & Studio Portraiture', category: 'Corporate', rate: Math.max(8000, Math.round(baseRate * 0.4)), unit: 'Session', description: 'Studio lighting setup for leadership team headshots, LinkedIn, and editorial PR portraits.', deliverables: '10 magazine-grade retouched headshots, transparent background cutouts' },
  ];
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

  const rawServices = Array.isArray(row.services) && row.services.length > 0
    ? (row.services as ServiceItem[])
    : getDefaultServicesForCategories(row.categories, Number(row.rate_per_day || 0));

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
    services: rawServices, 
    videoReels: Array.isArray(row.video_reels) ? row.video_reels : [],
    menuItems: resolvedMenuItems,
    musicTypes: Array.isArray(row.music_types) ? row.music_types : [],
    languages: Array.isArray(row.languages) ? row.languages : [],
    genres: Array.isArray(row.genres) ? row.genres : [],
    hostingStyles: Array.isArray(row.hosting_styles) ? row.hosting_styles : [],
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

  updateProfile: async (data: Partial<ProfessionalProfile>, explicitUserId?: string): Promise<ProfessionalProfile> => {
    let ownerId = explicitUserId;

    if (!ownerId) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        ownerId = userData?.user?.id;
      } catch (e) {}
    }

    if (!ownerId) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        ownerId = sessionData?.session?.user?.id;
      } catch (e) {}
    }

    if (!ownerId) {
      try {
        ownerId = useAuthStore.getState().user?.id;
      } catch (e) {}
    }

    if (!ownerId) {
      try {
        const storedStr = localStorage.getItem('@camqrew_user') || localStorage.getItem('@camcrew_user');
        if (storedStr) {
          const parsed = JSON.parse(storedStr);
          ownerId = parsed?.id;
        }
      } catch (e) {}
    }

    if (!ownerId) {
      throw new Error('Not authenticated. Please sign in to your creator account to upload reels.');
    }

    const { name, avatar, bannerImage, portfolio, ...proFields } = data;

    if (name || avatar || bannerImage) {
      const userUpdate: any = {};
      if (name) userUpdate.name = name;
      if (avatar) userUpdate.avatar = avatar;
      if (bannerImage) userUpdate.banner_image = bannerImage;
      try {
        await supabase.from('users').update(userUpdate).eq('id', ownerId);
      } catch (e) {}
    }

    if (portfolio) {
      try {
        await supabase.from('portfolio_items').delete().eq('professional_id', ownerId);
        if (portfolio.length > 0) {
          const inserts = portfolio.map(url => ({
            professional_id: ownerId,
            media_url: url,
            media_type: 'image',
          }));
          await supabase.from('portfolio_items').insert(inserts);
        }
      } catch (e) {}
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
    if (proFields.musicTypes !== undefined) updatePayload.music_types = proFields.musicTypes;
    if (proFields.languages !== undefined) updatePayload.languages = proFields.languages;
    if (proFields.genres !== undefined) updatePayload.genres = proFields.genres;
    if (proFields.hostingStyles !== undefined) updatePayload.hosting_styles = proFields.hostingStyles;
    if (proFields.menuItems !== undefined) {
      try {
        localStorage.setItem(`@camqrew_menu_items_${ownerId}`, JSON.stringify(proFields.menuItems));
      } catch {}
      updatePayload.menu_items = proFields.menuItems;
    }

    // Check if professional_profiles row exists for ownerId
    const { data: existingProfile } = await supabase
      .from('professional_profiles')
      .select('id')
      .eq('id', ownerId)
      .maybeSingle();

    let updated: any;
    if (!existingProfile) {
      const initialInsert: any = {
        id: ownerId,
        title: proFields.title || 'Creator & Professional',
        categories: proFields.categories || ['Photographers', 'Videographers'],
        skills: proFields.certifications || [],
        equipment: proFields.equipment || [],
        video_reels: proFields.videoReels || [],
        music_types: proFields.musicTypes || [],
        languages: proFields.languages || [],
        genres: proFields.genres || [],
        hosting_styles: proFields.hostingStyles || [],
        ...updatePayload,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('professional_profiles')
        .insert([initialInsert])
        .select(`*, users (name, avatar), portfolio_items (media_url)`)
        .single();

      if (insertError) throw new Error(insertError.message);
      updated = inserted;
    } else if (Object.keys(updatePayload).length > 0) {
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

      const allReels = [...dbReels, ...CURATED_FALLBACK_REELS];
      const seen = new Set<string>();
      return allReels.filter(r => {
        const key = r.embedUrl || r.url || r.id;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch (err) {
      console.warn('Failed to fetch reels from Supabase:', err);
      return CURATED_FALLBACK_REELS;
    }
  },
};

export const CURATED_FALLBACK_REELS: FeedReelItem[] = [
  {
    id: 'curated_reel_1',
    title: 'Automotive Commercial Film - 4K Cinema Cut',
    url: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790178787096_425tkq.mp4',
    embedUrl: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790178787096_425tkq.mp4',
    type: 'direct',
    isShort: true,
    category: 'Commercial & TVC',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
    creatorId: '9bbcfaa5-d0ba-45ea-8c94-77ec281b8b31',
    creatorName: 'Rohit Sen',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    creatorTitle: 'Commercial Director & High-End Cinematographer',
    creatorCity: 'Bengaluru',
    creatorRatePerDay: 35000,
    creatorRating: 4.9,
    creatorVerified: true,
    likesCount: 142,
  },
  {
    id: 'curated_reel_2',
    title: 'Candid Wedding Film - Royal Jodhpur Palace Golden Hour',
    url: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790518791960_ezgccj.mp4',
    embedUrl: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790518791960_ezgccj.mp4',
    type: 'direct',
    isShort: true,
    category: 'Wedding & Sangeet',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    creatorId: '409b83ad-8fd3-450d-ba45-bac6e980e94a',
    creatorName: 'Thaha Photographer',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    creatorTitle: 'Destination Wedding Photographer & Filmmaker',
    creatorCity: 'Kadri',
    creatorRatePerDay: 20000,
    creatorRating: 5.0,
    creatorVerified: true,
    likesCount: 289,
  },
  {
    id: 'curated_reel_3',
    title: 'Live Acoustic Sangeet Night - Bollywood Medley Session',
    url: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_test_1790183157849.mp4',
    embedUrl: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_test_1790183157849.mp4',
    type: 'direct',
    isShort: true,
    category: 'Live Music & Bands',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    creatorId: 'd9000000-0000-0000-0000-000000000009',
    creatorName: 'Kabir Sharma (Acoustic Strings & Vocals)',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    creatorTitle: 'Solo Guitarist, Classical Violinist & Live Ensemble Vocalist',
    creatorCity: 'Mumbai',
    creatorRatePerDay: 25000,
    creatorRating: 4.9,
    creatorVerified: true,
    likesCount: 310,
  },
  {
    id: 'curated_reel_4',
    title: '4K FPV Drone Reel - Coastal Cliff Cinematic Chase',
    url: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_sim_1790183482872.mp4',
    embedUrl: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_sim_1790183482872.mp4',
    type: 'direct',
    isShort: true,
    category: 'Drone & Aerial',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
    creatorId: 'ef063409-9428-431a-bf77-f90ec3315b26',
    creatorName: 'Rajesh Varma (SkyHawk Aerials)',
    creatorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    creatorTitle: 'DGCA Certified Commercial Drone Pilot & FPV Specialist',
    creatorCity: 'Hyderabad',
    creatorRatePerDay: 22000,
    creatorRating: 4.8,
    creatorVerified: true,
    likesCount: 198,
  },
  {
    id: 'curated_reel_5',
    title: 'Grand Sangeet Night Gala & Couple Games Interactive Hosting',
    url: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/test_1790182902223.mp4',
    embedUrl: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/test_1790182902223.mp4',
    type: 'direct',
    isShort: true,
    category: 'Emcee & Stage Hosts',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    creatorId: 'd9000000-0000-0000-0000-000000000010',
    creatorName: 'Rhea Singhania (Master of Ceremonies)',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    creatorTitle: 'Celebrity Master of Ceremonies, Multilingual Wedding Anchor & Gala Host',
    creatorCity: 'New Delhi',
    creatorRatePerDay: 35000,
    creatorRating: 5.0,
    creatorVerified: true,
    likesCount: 425,
  },
  {
    id: 'curated_reel_6',
    title: 'High-Fashion Editorial Runway & Lookbook Campaign',
    url: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790214123037_0507vd.mp4',
    embedUrl: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790214123037_0507vd.mp4',
    type: 'direct',
    isShort: true,
    category: 'Fashion & Runway',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    creatorId: '88a14b22-9901-4c55-bb33-112233445566',
    creatorName: 'Rhea Singhania',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    creatorTitle: 'International Runway, Editorial & High-Fashion Campaign Model',
    creatorCity: 'Mumbai',
    creatorRatePerDay: 25000,
    creatorRating: 4.9,
    creatorVerified: true,
    likesCount: 367,
  },
  {
    id: 'curated_reel_7',
    title: 'Live Tandoori & Gourmet Plating Banquet Showcase',
    url: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790178787096_425tkq.mp4',
    embedUrl: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790178787096_425tkq.mp4',
    type: 'direct',
    isShort: true,
    category: 'Food & Culinary',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    creatorId: '1500842a-0143-4df9-98a3-61b4196cf5c3',
    creatorName: 'Chef Vikramaditya & Saffron Banquet',
    creatorAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
    creatorTitle: 'Luxury Wedding, Gourmet Banquet & Live Kitchen Caterer',
    creatorCity: 'New Delhi',
    creatorRatePerDay: 1250,
    creatorRating: 4.8,
    creatorVerified: true,
    likesCount: 185,
  },
  {
    id: 'curated_reel_8',
    title: 'Royal Bridal HD Airbrush Styling & Draping Reveal',
    url: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790214123037_0507vd.mp4',
    embedUrl: 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/reels/reel_1790214123037_0507vd.mp4',
    type: 'direct',
    isShort: true,
    category: 'Wedding & Sangeet',
    thumbnailUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    creatorId: '76db53a0-333e-4f73-ba96-9ceca0ef70a8',
    creatorName: 'Kavya Menon (GlamCraft Studio)',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    creatorTitle: 'Celebrity Bridal Makeup Artist & Airbrush Specialist',
    creatorCity: 'Mumbai',
    creatorRatePerDay: 18000,
    creatorRating: 5.0,
    creatorVerified: true,
    likesCount: 512,
  },
];
