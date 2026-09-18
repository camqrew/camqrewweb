export interface ServiceItem {
  id: string;
  type?: 'standard' | 'package';
  title: string;
  category: string;
  rate: number;
  unit: string;
  description: string;
  deliverables?: string;
}

export interface ReviewItem {
  id: string;
  clientName: string;
  clientAvatar?: string;
  rating: number;
  date: string;
  comment: string;
}

export interface VideoReelItem {
  id: string;
  title: string;
  url: string;
  type: 'youtube' | 'vimeo' | 'direct';
  embedUrl: string;
  thumbnailUrl?: string;
  category?: string;
  isShort?: boolean;
}

export interface FeedReelItem extends VideoReelItem {
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorTitle?: string;
  creatorCity?: string;
  creatorRatePerDay?: number;
  creatorRating?: number;
  creatorVerified?: boolean;
  likesCount?: number;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  name: string;
  title: string;
  avatar: string;
  bannerImage: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  ratePerDay: number;
  bio: string;
  gstin?: string;
  state: string;
  district: string;
  city: string;
  locations: string[];
  categories: string[];
  services: ServiceItem[];
  portfolio: string[];
  equipment: string[];
  certifications: string[];
  reviews: ReviewItem[];
  weeklyAvailability: { [day: string]: boolean };
  blockedDates: string[];
  internationalTravel?: boolean;
  iCalUrl?: string;
  iCalExportUrl?: string;
  iCalImportUrl?: string;
  socials?: {
    instagram?: string;
    website?: string;
    youtube?: string;
    facebook?: string;
  };
  videoReels?: VideoReelItem[];
  views?: number;
  totalEarnings?: number;
}
