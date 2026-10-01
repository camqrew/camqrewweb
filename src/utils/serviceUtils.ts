import type { ServiceItem } from '../types/professional';

/**
 * Returns a high-definition cinematic visual banner matching the service domain
 */
export function getServiceImage(service: ServiceItem, fallbackCover?: string): string {
  if (service.imageUrl) return service.imageUrl;
  
  const title = (service.title || '').toLowerCase();
  const cat = (service.category || '').toLowerCase();

  // Drone & Aerial
  if (title.includes('drone') || cat.includes('drone') || title.includes('aerial') || cat.includes('aerial') || title.includes('fpv')) {
    return 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800';
  }

  // Commercial & TV Ads
  if (title.includes('commercial') || title.includes('tvc') || title.includes('brand') || title.includes('directing')) {
    return 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800';
  }

  // Wedding Film & Cinematography
  if (title.includes('wedding film') || title.includes('cinemat') || title.includes('highlight') || title.includes('teaser')) {
    return 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800';
  }

  // Music Video & Fashion
  if (title.includes('music video') || title.includes('fashion video') || cat.includes('music') || title.includes('dance')) {
    return 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800';
  }

  // Corporate & Events
  if (title.includes('aftermovie') || title.includes('event') || cat.includes('corporate') || title.includes('summit') || title.includes('expo') || title.includes('stage')) {
    return 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800';
  }

  // Editing & Color Grading
  if (title.includes('edit') || cat.includes('edit') || title.includes('davinci') || title.includes('color') || title.includes('reel pack')) {
    return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800';
  }

  // Bridal Makeup & Styling
  if (title.includes('makeup') || cat.includes('makeup') || (title.includes('bridal') && cat.includes('bridal')) || title.includes('airbrush') || title.includes('glam')) {
    return 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800';
  }

  // Henna & Mehendi
  if (title.includes('mehendi') || cat.includes('henna') || title.includes('henna') || cat.includes('mehendi')) {
    return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800';
  }

  // Cakes & Bakeries
  if (title.includes('cake') || cat.includes('baker') || cat.includes('cake') || title.includes('dessert') || title.includes('bake')) {
    return 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=800';
  }

  // Travels, Vanity Vans & Fleets
  if (title.includes('van') || title.includes('car') || cat.includes('travel') || title.includes('fleet') || title.includes('innova') || title.includes('mercedes')) {
    return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800';
  }

  // Crafts, Hampers & Gifting
  if (title.includes('hamper') || title.includes('trousseau') || cat.includes('gift') || cat.includes('craft') || title.includes('chaadar') || title.includes('invitation')) {
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800';
  }

  // Catering & Food
  if (title.includes('buffet') || cat.includes('cater') || title.includes('food') || title.includes('feast') || title.includes('plate') || title.includes('brunch')) {
    return 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800';
  }

  // Web & Mobile Development
  if (title.includes('web') || title.includes('app') || cat.includes('develop') || title.includes('code') || title.includes('software') || title.includes('saas')) {
    return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800';
  }

  // UI/UX Design & Branding
  if (title.includes('ui/ux') || cat.includes('design') || title.includes('branding') || title.includes('figma') || title.includes('logo')) {
    return 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800';
  }

  // Fashion & Modeling
  if (title.includes('model') || cat.includes('model') || title.includes('runway') || title.includes('catalog')) {
    return 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800';
  }

  // Photography & Portraits
  if (title.includes('portrait') || title.includes('photo') || cat.includes('photo') || title.includes('headshot')) {
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800';
  }

  return fallbackCover || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800';
}
