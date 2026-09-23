export type CategoryArchetype = 'media_crew' | 'catering' | 'event_management' | 'tech_digital' | 'beauty_bridal' | 'modeling_talent' | 'home_baker' | 'travels';

export interface CategoryMeta {
  id: string;
  name: string;
  archetype: CategoryArchetype;
  icon: string;
  description: string;
  bgGradient: [string, string];
}

export interface ArchetypeConfig {
  archetype: CategoryArchetype;
  label: string;
  roleNoun: string;
  rateLabel: string;
  ratePlaceholder: string;
  rateUnitDefault: string;
  rateUnitOptions: string[];
  equipmentSectionTitle: string;
  equipmentInputLabel: string;
  equipmentInputPlaceholder: string;
  equipmentPresets: string[];
  skillsSectionTitle: string;
  skillsInputLabel: string;
  skillsInputPlaceholder: string;
  skillsPresets: string[];
  travelCheckboxLabel: string;
  portfolioPromptTitle: string;
  portfolioPromptSubtitle: string;
  serviceTitlePlaceholder: string;
  serviceDeliverablesPlaceholder: string;
  bookingCtaPrefix: string;
}

export const ARCHETYPE_CONFIGS: Record<CategoryArchetype, ArchetypeConfig> = {
  media_crew: {
    archetype: 'media_crew',
    label: 'Media & Production Crew',
    roleNoun: 'Creator',
    rateLabel: 'Starting from (₹)',
    ratePlaceholder: '15000',
    rateUnitDefault: 'Day',
    rateUnitOptions: ['Day', 'Half Day', 'Event', 'Project', 'Hour'],
    equipmentSectionTitle: 'Equipment Roster',
    equipmentInputLabel: 'Add Gear / Lenses',
    equipmentInputPlaceholder: 'e.g. Sony FX3, 24-70mm GM, DJI Mavic 3',
    equipmentPresets: [
      'Sony A7S III',
      'Sony FX3',
      'Canon R5',
      'DJI Mavic 3 Cine',
      '24-70mm f/2.8 GM',
      '70-200mm f/2.8',
      'Godox AD600 Pro',
      'DJI Ronin RS3 Pro',
      'Wireless Lav Mic Kit',
      'Aputure 300d II',
    ],
    skillsSectionTitle: 'Certifications & Industry Badges',
    skillsInputLabel: 'Add Certifications (e.g. DGCA Drone Pilot, RED Operator)',
    skillsInputPlaceholder: 'e.g. DGCA Drone Pilot, RED Certified, Adobe Certified Pro',
    skillsPresets: [
      'DGCA Certified Drone Pilot',
      'RED Digital Cinema Certified',
      'ARRI Certified User',
      'DaVinci Resolve Colorist',
      'Adobe Premiere Pro Master',
    ],
    travelCheckboxLabel: 'Willing to travel for destination shoots',
    portfolioPromptTitle: 'Add Photography & Stills',
    portfolioPromptSubtitle: 'Showcase lookbooks, client shoots, and portfolio stills to attract bookings.',
    serviceTitlePlaceholder: 'e.g. Full Day Wedding Shoot',
    serviceDeliverablesPlaceholder: 'e.g. 50 Edited High-Res Photos, 1 Highlight Reel',
    bookingCtaPrefix: 'Book Shoot',
  },
  catering: {
    archetype: 'catering',
    label: 'Catering & Culinary Services',
    roleNoun: 'Caterer',
    rateLabel: 'Starting from per Plate (₹)',
    ratePlaceholder: '850',
    rateUnitDefault: 'Plate',
    rateUnitOptions: ['Plate', 'Guest', 'Event Package', 'Day', 'Fixed Package'],
    equipmentSectionTitle: 'Cuisine Specialties & Setup',
    equipmentInputLabel: 'Add Cuisine Specialties & Setup Capabilities',
    equipmentInputPlaceholder: 'e.g. Mughlai, Italian, Live Chaat Counter, Mocktail Bar',
    equipmentPresets: [
      'North Indian & Mughlai',
      'Authentic South Indian',
      'Live Chaat & Street Food',
      'Continental & Italian',
      'Pan-Asian & Dimsum',
      'Woodfire Pizza Live',
      'Vegan & Jain Specialties',
      'Mocktail & Beverage Bar',
      'Gourmet Desserts & Bakery',
      'Buffet Warmers & Chafing',
      'Crockery & Cutlery Included',
      'Uniformed Waitstaff Included',
    ],
    skillsSectionTitle: 'Food Safety & Compliance Badges',
    skillsInputLabel: 'Add Food Safety Licenses & Certifications',
    skillsInputPlaceholder: 'e.g. FSSAI License, ISO 22000, HACCP Certified, ServSafe',
    skillsPresets: [
      'FSSAI Registered & Licensed',
      'ISO 22000 Food Safety',
      'HACCP Certified Kitchen',
      'ServSafe Food Handler',
      'Five-Star Hotel Trained Chefs',
    ],
    travelCheckboxLabel: 'Available for outdoor & destination catering',
    portfolioPromptTitle: 'Add Food & Banquet Highlights',
    portfolioPromptSubtitle: 'Showcase your signature dishes, buffet presentations, and live counter setups.',
    serviceTitlePlaceholder: 'e.g. Premium Wedding Buffet Package',
    serviceDeliverablesPlaceholder: 'e.g. 5 Starters, 8 Mains, 4 Desserts, Live Pasta Counter, Cutlery & Service Crew',
    bookingCtaPrefix: 'Book Catering',
  },
  event_management: {
    archetype: 'event_management',
    label: 'Event Planning & Production',
    roleNoun: 'Organiser',
    rateLabel: 'Starting from (₹)',
    ratePlaceholder: '75000',
    rateUnitDefault: 'Event',
    rateUnitOptions: ['Event', 'Project', 'Turnkey Package', 'Day', 'Custom'],
    equipmentSectionTitle: 'Production Capabilities & Logistics',
    equipmentInputLabel: 'Add Production & Vendor Logistics',
    equipmentInputPlaceholder: 'e.g. Stage Fabrication, Sound & Trussing, Artist Booking',
    equipmentPresets: [
      'End-to-End Turnkey Execution',
      'Destination Wedding Planning',
      'Corporate Expo & Seminars',
      'Stage, Truss & Light Rigging',
      'Line Array Concert Sound',
      'Artist & Celebrity Management',
      'Floral & Theme Decor Fabrication',
      'LED Video Wall Setup',
      'Government & Police Permissions',
      'Guest Hospitality & RSVP Desk',
      'Crowd Management & Security',
    ],
    skillsSectionTitle: 'Industry Affiliations & Credentials',
    skillsInputLabel: 'Add Industry Badges & Diplomas',
    skillsInputPlaceholder: 'e.g. EEMA Member, Certified Special Events Professional (CSEP)',
    skillsPresets: [
      'EEMA Member (Event Management Assoc)',
      'Certified Special Events Professional (CSEP)',
      'Diploma in Event Management',
      'Certified Wedding Planner (CWP)',
      'ISO 9001 Event Operations',
    ],
    travelCheckboxLabel: 'Available for destination & multi-city event execution',
    portfolioPromptTitle: 'Add Event Case Studies & Renders',
    portfolioPromptSubtitle: 'Showcase 3D stage renders, completed venue transformations, and event highlights.',
    serviceTitlePlaceholder: 'e.g. 2-Day Turnkey Wedding Production',
    serviceDeliverablesPlaceholder: 'e.g. Stage Fabrication, Sound & Light Truss, Decor, Artist Booking, Floor Manager',
    bookingCtaPrefix: 'Hire Organiser',
  },
  tech_digital: {
    archetype: 'tech_digital',
    label: 'Software, Web & Digital Design',
    roleNoun: 'Developer',
    rateLabel: 'Starting from (₹)',
    ratePlaceholder: '35000',
    rateUnitDefault: 'Project',
    rateUnitOptions: ['Project', 'Hour', 'Sprint', 'Month', 'Day'],
    equipmentSectionTitle: 'Tech Stack & Frameworks',
    equipmentInputLabel: 'Add Tech Stack, Tools & Frameworks',
    equipmentInputPlaceholder: 'e.g. React, Next.js, Node.js, Python, Supabase, Figma',
    equipmentPresets: [
      'React / Next.js',
      'React Native / Mobile App',
      'Node.js / Express',
      'TypeScript',
      'Python / Django / FastAPI',
      'Supabase / PostgreSQL',
      'Tailwind CSS',
      'Figma to Code',
      'AWS / Cloudflare',
      'Shopify / E-Commerce',
      'GraphQL / REST APIs',
      'Docker / CI/CD',
    ],
    skillsSectionTitle: 'Tech Certifications & Industry Badges',
    skillsInputLabel: 'Add Cloud & Framework Certifications',
    skillsInputPlaceholder: 'e.g. AWS Certified Solutions Architect, Google Cloud, Meta Developer',
    skillsPresets: [
      'AWS Certified Solutions Architect',
      'Google Cloud Professional Architect',
      'Meta Certified Front-End Developer',
      'Certified Kubernetes Administrator',
      'PostgreSQL Certified Professional',
    ],
    travelCheckboxLabel: 'Available for remote contracts & timezone overlap',
    portfolioPromptTitle: 'Add Projects & Product Demos',
    portfolioPromptSubtitle: 'Showcase web applications, mobile apps, and UI case studies with live URLs.',
    serviceTitlePlaceholder: 'e.g. Full-Stack Web Application MVP',
    serviceDeliverablesPlaceholder: 'e.g. Responsive Web App, Database Schema, Auth & Payment Integration, Deployment',
    bookingCtaPrefix: 'Hire Developer',
  },
  beauty_bridal: {
    archetype: 'beauty_bridal',
    label: 'Beauty, Bridal Makeup & Mehendi Art',
    roleNoun: 'Artist',
    rateLabel: 'Starting from (₹)',
    ratePlaceholder: '15000',
    rateUnitDefault: 'Event',
    rateUnitOptions: ['Event', 'Bride', 'Session', 'Person', 'Package'],
    equipmentSectionTitle: 'Kit, Premium Products & Artistry',
    equipmentInputLabel: 'Add Brands, Products & Tools',
    equipmentInputPlaceholder: 'e.g. Temptu Airbrush, Charlotte Tilbury, MAC Pro, Organic Henna',
    equipmentPresets: [
      'HD & Airbrush Bridal Makeup',
      'Temptu Airbrush System',
      'Charlotte Tilbury & MAC Pro Kit',
      'Huda Beauty & Estée Lauder',
      'Dyson Supersonic & Airwrap',
      '100% Organic Sojat Rajasthani Henna',
      'Bridal Portrait Mehendi Art',
      'Arabic & Indo-Western Henna',
      'Fine Needle Henna Precision Cone',
      'Jewellery & Saree/Lehenga Draping',
      'Eyelash & Hair Extension Styling',
    ],
    skillsSectionTitle: 'Certifications & Masterclass Badges',
    skillsInputLabel: 'Add Certifications & Diplomas',
    skillsInputPlaceholder: 'e.g. Certified Bridal Makeup Artist, Airbrush Specialist',
    skillsPresets: [
      'Certified Bridal Makeup Artist',
      'Temptu Certified Airbrush Specialist',
      'Master Henna & Mehendi Artist Certificate',
      'London School of Makeup Masterclass',
      'CIDESCO Certified Aesthetician',
    ],
    travelCheckboxLabel: 'Available for bridal venue visits & destination weddings',
    portfolioPromptTitle: 'Add Bridal Looks & Mehendi Stills',
    portfolioPromptSubtitle: 'Showcase bridal transformations, intricate henna patterns, and hair styling.',
    serviceTitlePlaceholder: 'e.g. Full Bridal HD Makeup & Hair Styling',
    serviceDeliverablesPlaceholder: 'e.g. Airbrush Makeup, Lehenga Draping, Hair Extensions, Touch-up Kit',
    bookingCtaPrefix: 'Book Artist',
  },
  modeling_talent: {
    archetype: 'modeling_talent',
    label: 'Fashion, Commercial & Runway Models',
    roleNoun: 'Model',
    rateLabel: 'Starting from (₹)',
    ratePlaceholder: '20000',
    rateUnitDefault: 'Day',
    rateUnitOptions: ['Day', 'Half Day', 'Event', 'Project', 'Hour'],
    equipmentSectionTitle: 'Vitals, Measurements & Look Specialties',
    equipmentInputLabel: 'Add Vitals, Measurements & Specialties',
    equipmentInputPlaceholder: 'e.g. Height: 5\'10", Vitals: 34-25-36, High-Fashion Runway, Couture Bridal',
    equipmentPresets: [
      'Height: 5\'10" (178 cm)',
      'Height: 5\'8" (173 cm)',
      'Height: 6\'1" (185 cm)',
      'High-Fashion Runway & Ramp Walk',
      'Couture Bridal & Heritage Jewelry',
      'Editorial & Magazine Lookbooks',
      'Commercial TVC & Brand Endorsements',
      'E-Commerce & Designer Catalog Fit',
      'Swimwear & Athleisure Fit',
      'Passport Ready for Destination Shoots',
    ],
    skillsSectionTitle: 'Industry Badges & Fashion Week Appearances',
    skillsInputLabel: 'Add Fashion Weeks, Agency Affiliations & Editorial Credits',
    skillsInputPlaceholder: 'e.g. Lakmé Fashion Week, FDCI India Fashion Week, Vogue Feature',
    skillsPresets: [
      'Lakmé Fashion Week Runway Model',
      'FDCI India Fashion Week Model',
      'Vogue India Editorial Feature',
      'Harper\'s Bazaar Lookbook Feature',
      'Elle India Campaign Model',
      'Elite Model Look Finalist',
      'Professional Ramp Walk Certified',
    ],
    travelCheckboxLabel: 'Available for destination campaigns & global shoots',
    portfolioPromptTitle: 'Add Lookbook & Campaign Stills',
    portfolioPromptSubtitle: 'Showcase editorial spreads, runway walks, and commercial catalog shots.',
    serviceTitlePlaceholder: 'e.g. Full Day Campaign / Lookbook Shoot',
    serviceDeliverablesPlaceholder: 'e.g. 8 Hours Shoot, up to 10 Garment Changes, Commercial Rights',
    bookingCtaPrefix: 'Book Model',
  },
  home_baker: {
    archetype: 'home_baker',
    label: 'Home Bakers, Cakes & Confectionery',
    roleNoun: 'Home Baker',
    rateLabel: 'Starting from (₹)',
    ratePlaceholder: '1200',
    rateUnitDefault: 'Kg',
    rateUnitOptions: ['Kg', 'Piece', 'Box', 'Order', 'Platter'],
    equipmentSectionTitle: 'Baking Specialties, Flavors & Dietary Options',
    equipmentInputLabel: 'Add Specialties, Flavors & Minimum Quantities',
    equipmentInputPlaceholder: 'e.g. Designer Fondant Cakes, Bento Cakes, 100% Eggless, Min Qty: 0.5 Kg',
    equipmentPresets: [
      'Custom Designer & Theme Fondant Cakes',
      'Korean Aesthetic Bento Cakes (Min: 250g / 1 Pc)',
      'Tiered Wedding & Engagement Cakes (Min: 1.5 Kg)',
      'Gourmet Cupcakes (Min: 6 Pcs)',
      '100% Eggless & Vegan Options',
      'Artisan Sourdough & Garlic Focaccia (Min: 1 Loaf)',
      'French Macarons & Tea Cakes',
      'Savory Mini Quiches & Puffs Platter',
      'Gluten-Free & Refined Sugar-Free Options',
      'Customized Dessert Table Grazing',
      'FSSAI Registered Home Kitchen',
      'Doorstep Delivery in Fragile Ice Boxes',
    ],
    skillsSectionTitle: 'Baking Certifications & Kitchen Standards',
    skillsInputLabel: 'Add Pastry Diplomas, Certifications & FSSAI Licenses',
    skillsInputPlaceholder: 'e.g. FSSAI Home Kitchen Certified, French Pastry Diploma, Cake Art Masterclass',
    skillsPresets: [
      'FSSAI Registered & Certified Home Kitchen',
      'Diploma in French Pastry & Baking Arts',
      'Certified Sugar Florist & Fondant Artist',
      'Food Safety & Hygiene Certified',
      'Master Pastry Chef Masterclass Alumni',
    ],
    travelCheckboxLabel: 'Available for doorstep delivery & celebration venue setup',
    portfolioPromptTitle: 'Add Cake & Dessert Portfolio',
    portfolioPromptSubtitle: 'Showcase custom birthday cakes, bento boxes, dessert tables, and artisan pastry creations.',
    serviceTitlePlaceholder: 'e.g. Custom Designer Theme Cake (Min 1 Kg)',
    serviceDeliverablesPlaceholder: 'e.g. 1 Kg Gourmet Cake, Custom Fondant Art, Greeting Tag, Candle & Eco-Knife Included',
    bookingCtaPrefix: 'Order from Baker',
  },
  travels: {
    archetype: 'travels',
    label: 'Travels, Transport & Tour Fleets',
    roleNoun: 'Travel Partner / Chauffeur',
    rateLabel: 'Starting Rate (₹)',
    ratePlaceholder: '3500',
    rateUnitDefault: 'Day',
    rateUnitOptions: ['Day', 'Km', 'Trip', 'Hour', 'Package'],
    equipmentSectionTitle: 'Fleet Roster & Vehicle Types',
    equipmentInputLabel: 'Add Vehicles & Fleet Capabilities',
    equipmentInputPlaceholder: 'e.g. Innova Crysta, Tempo Traveller 17-Seater, Urbania, Luxury Sedan, 4x4 Thar',
    equipmentPresets: [
      'Innova Crysta (7-Seater)',
      'Force Tempo Traveller (12/17-Seater)',
      'Force Urbania Luxury Van',
      'Toyota Fortuner 4x4',
      'Mahindra Thar 4x4 (Offroad)',
      'Maruti Ertiga (6-Seater)',
      'Sedan (Dzire / Ciaz / City)',
      'Mercedes E-Class / Luxury Fleet',
      'Production Equipment Van (Closed Body)',
      'AC Sleeper Bus / Coach',
      'Luggage Carrier & Roof Rack Equipped',
      'GPS Real-Time Tracking',
      'All-India Commercial Permit (Yellow Board)',
    ],
    skillsSectionTitle: 'Permits, Safety & Driver Badges',
    skillsInputLabel: 'Add Commercial Badges, Permits & Insurances',
    skillsInputPlaceholder: 'e.g. All India Tourist Permit, Commercial Driving License, Zero Accidental Record',
    skillsPresets: [
      'All India Tourist Permit (AITP)',
      'Commercial Heavy/Light Vehicle Badge',
      'Comprehensive Commercial Insurance',
      'Verified & Uniformed Chauffeurs',
      'Hill & Mountain Terrain Specialist',
      '24x7 Breakdown Roadside Assistance',
      'Zero Accidental Driving Track Record',
    ],
    travelCheckboxLabel: 'Available for interstate outstation trips & destination shoots',
    portfolioPromptTitle: 'Add Fleet Photos & Travel Highlights',
    portfolioPromptSubtitle: 'Showcase clean vehicle interiors, fleet lineup, outstation routes, and client travel moments.',
    serviceTitlePlaceholder: 'e.g. 3-Day Outstation Production Fleet / Innova Crysta',
    serviceDeliverablesPlaceholder: 'e.g. AC Innova Crysta, Fuel & Toll Included, Uniformed Driver, 300 Km/Day Allowance',
    bookingCtaPrefix: 'Book Travels',
  },
};

export function getArchetype(categoryOrList?: string | string[]): ArchetypeConfig {
  const catArray = Array.isArray(categoryOrList)
    ? categoryOrList
    : categoryOrList
    ? [categoryOrList]
    : [];

  const lowerCats = catArray.map(c => (c || '').toLowerCase().trim());

  if (lowerCats.some(c => c.includes('travel') || c.includes('transport') || c.includes('cab') || c.includes('driver') || c.includes('car') || c.includes('fleet') || c.includes('tour') || c.includes('van') || c.includes('bus') || c.includes('taxi'))) {
    return ARCHETYPE_CONFIGS.travels;
  }
  if (lowerCats.some(c => c.includes('model') || c.includes('runway') || c.includes('fashion model'))) {
    return ARCHETYPE_CONFIGS.modeling_talent;
  }
  if (lowerCats.some(c => c.includes('baker') || c.includes('bake') || c.includes('cake') || c.includes('pastry') || c.includes('confectionery'))) {
    return ARCHETYPE_CONFIGS.home_baker;
  }
  if (lowerCats.some(c => c.includes('cater') || c.includes('chef') || c.includes('food') || c.includes('culinary'))) {
    return ARCHETYPE_CONFIGS.catering;
  }
  if (lowerCats.some(c => c.includes('organis') || c.includes('organiz') || c.includes('event') || c.includes('planner') || c.includes('logistics'))) {
    return ARCHETYPE_CONFIGS.event_management;
  }
  if (lowerCats.some(c => c.includes('develop') || c.includes('design') || c.includes('code') || c.includes('tech') || c.includes('web') || c.includes('app') || c.includes('software'))) {
    return ARCHETYPE_CONFIGS.tech_digital;
  }
  if (lowerCats.some(c => c.includes('makeup') || c.includes('mehendi') || c.includes('mehndi') || c.includes('beauty') || c.includes('bridal') || c.includes('hair') || c.includes('henna'))) {
    return ARCHETYPE_CONFIGS.beauty_bridal;
  }
  return ARCHETYPE_CONFIGS.media_crew;
}

export const PROFESSIONAL_CATEGORIES: CategoryMeta[] = [
  {
    id: 'photographers',
    name: 'Photographers',
    archetype: 'media_crew',
    icon: 'camera',
    description: 'Portrait, Wedding, Commercial & Fashion Photography',
    bgGradient: ['#ff416c', '#ff4b2b'],
  },
  {
    id: 'videographers',
    name: 'Videographers',
    archetype: 'media_crew',
    icon: 'video',
    description: 'Cinematography, Events, Reels & Documentaries',
    bgGradient: ['#8a2387', '#e94057'],
  },
  {
    id: 'models',
    name: 'Models',
    archetype: 'modeling_talent',
    icon: 'user',
    description: 'Fashion, Runway, Commercial & Editorial Models',
    bgGradient: ['#ec4899', '#8b5cf6'],
  },
  {
    id: 'home_bakers',
    name: 'Home Bakers',
    archetype: 'home_baker',
    icon: 'cake',
    description: 'Custom Cakes, Bento Boxes, Pastries & Baked Foods with Low Minimum Quantities',
    bgGradient: ['#f59e0b', '#ec4899'],
  },
  {
    id: 'caterers',
    name: 'Caterers',
    archetype: 'catering',
    icon: 'coffee',
    description: 'Gourmet Catering, Private Chefs & Food Styling',
    bgGradient: ['#ff9966', '#ff5e62'],
  },
  {
    id: 'organisers',
    name: 'Organisers',
    archetype: 'event_management',
    icon: 'calendar',
    description: 'Event Planning, Stage Direction & Logistics',
    bgGradient: ['#f857a6', '#ff5858'],
  },
  {
    id: 'makeup_artists',
    name: 'Makeup Artists',
    archetype: 'beauty_bridal',
    icon: 'heart',
    description: 'Bridal, HD Airbrush, Party & Editorial Makeup',
    bgGradient: ['#ff4b2b', '#ff416c'],
  },
  {
    id: 'mehendi_artists',
    name: 'Mehendi Artists',
    archetype: 'beauty_bridal',
    icon: 'palette',
    description: 'Bridal Henna, Arabic, Indo-Western & Portrait Mehendi',
    bgGradient: ['#11998e', '#38ef7d'],
  },
  {
    id: 'developers',
    name: 'Developers',
    archetype: 'tech_digital',
    icon: 'code',
    description: 'Mobile Apps, Web Platforms & Custom Integrations',
    bgGradient: ['#11998e', '#38ef7d'],
  },
  {
    id: 'designers',
    name: 'Designers',
    archetype: 'tech_digital',
    icon: 'palette',
    description: 'UI/UX, Brand Identity, Motion Graphics & 3D',
    bgGradient: ['#4776e6', '#8e54e9'],
  },
  {
    id: 'travels',
    name: 'Travels & Transport',
    archetype: 'travels',
    icon: 'car',
    description: 'Outstation Production Vans, Luxury Fleets, Location Scouts & Chauffeurs',
    bgGradient: ['#06b6d4', '#3b82f6'],
  },
];

export const GEAR_CATEGORIES = [
  'All',
  'Camera Bodies',
  'Lenses',
  'Lighting',
  'Audio Gear',
  'Drones & Gimbals',
  'Tripods & Rigging',
  'Accessories',
];

export const PRICING_UNITS = [
  'per day',
  'per km',
  'per trip',
  'per plate',
  'per guest',
  'per event',
  'per hour',
  'per project',
  'custom',
];
