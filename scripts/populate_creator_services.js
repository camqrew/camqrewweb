import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres.lwvmtjraqvniknstcvpk',
  password: 'Adgjmpu123@#',
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const CREATOR_SERVICES = {
  // 1. Rohit Sen - Cinematographer / Videographer
  '9bbcfaa5-d0ba-45ea-8c94-77ec281b8b31': [
    {
      id: 'srv_rohit_1',
      title: 'Cinematic 4K Wedding Highlight Film',
      category: 'Cinematography',
      rate: 45000,
      unit: 'Project',
      description: 'Full-day multi-camera cinematic coverage with Sony FX6/FX3 packages, gimbal stabilization, ambient audio capture, and master color grading.',
      deliverables: '1 Cinematic Teaser (60s), 1 Main Highlight Film (5-7 mins), Complete RAW footage on portable SSD'
    },
    {
      id: 'srv_rohit_2',
      title: 'Brand / TV Commercial Directing',
      category: 'Commercial',
      rate: 35000,
      unit: 'Day',
      description: 'End-to-end commercial shoot direction including storyboard collaboration, cinema lighting setup, actor cueing, and pro audio.',
      deliverables: 'Full-day 10hr production shoot, ProRes 422 HQ camera rushes, director notes for post-production'
    },
    {
      id: 'srv_rohit_3',
      title: 'Fashion & Music Video Production',
      category: 'Music Video',
      rate: 30000,
      unit: 'Day',
      description: 'High-concept visual styling, creative colored lighting setups, fast dynamic camera tracking, and speed-ramp choreography.',
      deliverables: '4K DCI master cut, Instagram Reel / 9:16 cuts, high-speed 120fps slow-motion shots'
    },
    {
      id: 'srv_rohit_4',
      title: 'Corporate Summit & Event Aftermovie',
      category: 'Corporate',
      rate: 22000,
      unit: 'Event',
      description: 'Dynamic event coverage for corporate conferences, exhibitions, or gala award ceremonies with keynote recording and crowd energy.',
      deliverables: '2-3 minute fast-paced aftermovie delivered within 48 hours for immediate social marketing'
    }
  ],

  // 2. Priya Nair (Elysian Productions) - Organiser / Event Management
  '98426082-3abf-4918-a2df-1f0baa5bccc2': [
    {
      id: 'srv_priya_1',
      title: 'Turnkey Destination Wedding Execution',
      category: 'Wedding Production',
      rate: 150000,
      unit: 'Event',
      description: 'End-to-end wedding production including vendor contracting, design styling, hospitality desk, guest transfers, and live showrunning.',
      deliverables: 'Dedicated 8-member production crew, day-by-day run of show, vendor milestone management'
    },
    {
      id: 'srv_priya_2',
      title: 'Corporate Expo & Summit Stage Production',
      category: 'Corporate Events',
      rate: 120000,
      unit: 'Event',
      description: 'Complete AV stage trussing, P2.5 high-definition curved LED display wall, line-array acoustics, and delegate check-in coordination.',
      deliverables: 'Turnkey stage setup, audio engineer on-site, stage lighting designer, keynote technical support'
    },
    {
      id: 'srv_priya_3',
      title: 'Thematic Sangeet & Reception Stage Decor',
      category: 'Event Decor',
      rate: 85000,
      unit: 'Event',
      description: 'Architectural floral arches, custom stage backdrops, fairy-light tunnels, and illuminated bridal ramp fabrication.',
      deliverables: 'Complete set fabrication, ambient venue illumination, photo booth setup, setup & tear-down logistics'
    },
    {
      id: 'srv_priya_4',
      title: 'Live Artist & Celebrity Booking Liaison',
      category: 'Entertainment',
      rate: 40000,
      unit: 'Event',
      description: 'Artist coordination, contract curation, technical rider fulfillment, backstage hospitality, and stage sound check supervision.',
      deliverables: 'Dedicated artist manager on site, sound & greenroom rider setup, itinerary synchronization'
    }
  ],

  // 3. Thaha - Photographer
  '409b83ad-8fd3-450d-ba45-bac6e980e94a': [
    {
      id: 'srv_thaha_1',
      title: 'Full-Day Candid & Traditional Wedding Photography',
      category: 'Wedding',
      rate: 25000,
      unit: 'Day',
      description: 'Comprehensive wedding coverage with 2 prime lens shooters capturing emotional candids, traditional rituals, and family group portraits.',
      deliverables: '300+ color-graded high-resolution photos, private cloud gallery with 1-year hosting, 25 sneak peeks in 24 hrs'
    },
    {
      id: 'srv_thaha_2',
      title: 'Pre-Wedding Couple Sunset Portraiture',
      category: 'Portraits',
      rate: 15000,
      unit: 'Session',
      description: '4-hour outdoor golden hour portrait session at destination location with 3 wardrobe changes and artistic editorial direction.',
      deliverables: '40 master-retouched portraits, digital invitation graphic, all original high-res JPEG files'
    },
    {
      id: 'srv_thaha_3',
      title: 'Executive Headshots & Corporate Studio Stills',
      category: 'Corporate',
      rate: 8000,
      unit: 'Session',
      description: 'Studio lighting setup for leadership team portraits, LinkedIn executive headshots, and editorial business profiles.',
      deliverables: '10 magazine-grade retouched headshots, transparent background cutouts for web, same-week delivery'
    },
    {
      id: 'srv_thaha_4',
      title: 'Private Event & Birthday Stills',
      category: 'Event Photography',
      rate: 12000,
      unit: 'Event',
      description: '4-hour coverage for private celebrations, anniversary parties, or milestone birthdays with candid party moments.',
      deliverables: '100+ edited photographs, social media ready resolution, delivery within 72 hours'
    }
  ],

  // 4. Tanvi Kulkarni (VividCut Studio) - Editor & Colorist
  'f9814b3c-1388-4b1b-b40b-5884e98a0da2': [
    {
      id: 'srv_tanvi_1',
      title: 'Cinematic Wedding Film Editing & Sound Design',
      category: 'Wedding Post-Production',
      rate: 25000,
      unit: 'Project',
      description: 'High-end non-linear editing of multi-cam wedding footage, multi-track audio mixing, dialogue cleaning, and emotion-driven pacing.',
      deliverables: '1 Teaser (60s), 1 Highlight Film (5-8 mins), full ceremony continuous edit, 2 revision rounds'
    },
    {
      id: 'srv_tanvi_2',
      title: 'Commercial TVC & Digital Ad Post-Production',
      category: 'Commercial Editing',
      rate: 18000,
      unit: 'Project',
      description: 'Fast-turnaround editing for brand commercials with motion graphic overlays, kinetic typography, SFX sound design, and master delivery.',
      deliverables: 'Master cuts in 16:9, 9:16 (Reels/TikTok), and 1:1 formats with loudness compliance for broadcast'
    },
    {
      id: 'srv_tanvi_3',
      title: 'DaVinci Resolve Creative Color Grading',
      category: 'Color Grading',
      rate: 15000,
      unit: 'Project',
      description: 'Studio calibrated color grading on calibrated OLED monitors. Custom show LUT design, skin tone optimization, and cinematic look development.',
      deliverables: 'Full DaVinci Resolve project archive + exported Apple ProRes 4444 / 422 HQ masters'
    },
    {
      id: 'srv_tanvi_4',
      title: 'Creator Social Reel / YouTube Pack (10 Videos)',
      category: 'Social Media',
      rate: 12000,
      unit: 'Package',
      description: 'High-retention short-form video editing with viral hook pacing, animated subtitles, sound effects, and sound library licensing.',
      deliverables: '10 finished 9:16 vertical reels (under 60s each) optimized for maximum viewer retention'
    }
  ],

  // 5. Kavya Menon (GlamCraft Studio) - Makeup Artist
  '76db53a0-333e-4f73-ba96-9ceca0ef70a8': [
    {
      id: 'srv_kavya_1',
      title: 'Luxury HD Airbrush Bridal Makeup & Hair',
      category: 'Bridal Makeup',
      rate: 18000,
      unit: 'Bride',
      description: 'Flawless 18-hour sweatproof airbrush HD makeup, luxury Mink eyelashes, bespoke hair artistry, authentic saree/dupatta draping, and jewelry styling.',
      deliverables: 'Full bridal makeover (3 hrs), premium international cosmetics (Dior, MAC, Huda Beauty), complimentary touch-up kit'
    },
    {
      id: 'srv_kavya_2',
      title: 'Sangeet / Reception Cocktail Glam Look',
      category: 'Party Glam',
      rate: 10000,
      unit: 'Person',
      description: 'Contemporary cocktail glam makeover featuring smoky eyes, glass-skin finish, Hollywood waves or textured updo styling.',
      deliverables: 'Complete glam makeover, hair extensions styling, custom lip pairing, setting spray lock'
    },
    {
      id: 'srv_kavya_3',
      title: 'Editorial & Fashion Campaign Makeup',
      category: 'Editorial',
      rate: 15000,
      unit: 'Day',
      description: 'Full-day on-set makeup support for fashion catalogs, designer lookbooks, and high-fashion model shoots with continuous touch-ups.',
      deliverables: 'Up to 4 creative look changes, matte/dewy skin transitions, on-set continuity monitoring'
    },
    {
      id: 'srv_kavya_4',
      title: 'Bridesmaid & Family Glam Package (3 Persons)',
      category: 'Group Package',
      rate: 16000,
      unit: 'Package',
      description: 'Sophisticated event makeup and hair blow-dry/styling for up to 3 immediate family members or bridesmaids.',
      deliverables: '3 complete party makeovers, lash application, dupatta pinning, on-location service'
    }
  ],

  // 6. Kabir Mehta - Photographer
  '9daf1309-0853-4f0e-92e8-f5b7d7edeb92': [
    {
      id: 'srv_kabir_1',
      title: 'Luxury Destination Wedding Photography',
      category: 'Wedding',
      rate: 35000,
      unit: 'Day',
      description: 'Editorial storytelling and intimate candid captures with Leica and Hasselblad optics. Includes 2 primary photographers and lighting assistant.',
      deliverables: '350+ master color-corrected photos, drone aerial venue stills, same-day 20 photo teaser package'
    },
    {
      id: 'srv_kabir_2',
      title: 'Editorial Fashion Campaign & Lookbook Shoot',
      category: 'Fashion',
      rate: 28000,
      unit: 'Day',
      description: 'Full-day high-fashion shoot for designers and luxury brands. Creative lighting design (Profoto), moodboard execution, and high-end skin retouching.',
      deliverables: '25 magazine-cover retouched hero images, complete web-optimized lookbook catalog'
    },
    {
      id: 'srv_kabir_3',
      title: 'Couple Pre-Wedding Sunset Storybook',
      category: 'Pre-Wedding',
      rate: 22000,
      unit: 'Session',
      description: 'Cinematic sunset and twilight couple shoot at scenic landscapes or heritage architecture with drone portraits.',
      deliverables: '50 fine-art retouched stills, premium lay-flat mini album layout, online high-res delivery'
    },
    {
      id: 'srv_kabir_4',
      title: 'Commercial Product & Jewelry Stills',
      category: 'Commercial',
      rate: 20000,
      unit: 'Project',
      description: 'Macro precision lighting for jewelry, cosmetics, and luxury goods with true-to-life metallic reflections and zero dust blemishes.',
      deliverables: '20 high-resolution e-commerce and billboard-ready composite photographs'
    }
  ],

  // 7. Chef Vikramaditya & Saffron Banquet - Caterer
  '1500842a-0143-4df9-98a3-61b4196cf5c3': [
    {
      id: 'srv_chef_1',
      title: 'Royal Mughlai & North Indian Wedding Buffet',
      category: 'Wedding Catering',
      rate: 1450,
      unit: 'Plate',
      description: 'Gourmet banquet spread featuring 6 starters, 8 main courses, 3 Dum Biryanis, live Tandoor counter, and 4 artisan Indian desserts.',
      deliverables: 'Buffet chafing setup, fine bone china cutlery, uniformed five-star trained waitstaff, executive chef supervision'
    },
    {
      id: 'srv_chef_2',
      title: 'Artisan Live Counters (Woodfire, Dimsum & Chaat)',
      category: 'Live Counters',
      rate: 25000,
      unit: 'Counter',
      description: 'Interactive chef-attended live food theater featuring artisan thin-crust pizzas, steamed dimsum baskets, and Delhi-style street chaat.',
      deliverables: 'Complete live cooking station, specialized gas/oven equipment, fresh on-the-spot preparation for up to 150 guests'
    },
    {
      id: 'srv_chef_3',
      title: 'Continental Grazing Table & Mocktail Lounge',
      category: 'Cocktail Catering',
      rate: 950,
      unit: 'Guest',
      description: 'Aesthetic grazing tables with imported cheeses, artisan breads, dip platters, and a handcrafted mixologist beverage bar.',
      deliverables: '6 bespoke mocktail concoctions, visual grazing table styling, glassware, and certified mixologist'
    },
    {
      id: 'srv_chef_4',
      title: 'Destination Pre-Wedding Brunch Spread',
      category: 'Brunch Catering',
      rate: 1100,
      unit: 'Plate',
      description: 'Light gourmet morning brunch featuring live Dosa stations, tropical fruit platters, Continental breakfast bakes, and freshly brewed filter coffee.',
      deliverables: 'Live breakfast stations, customized beverage cart, eco-friendly premium tableware'
    }
  ],

  // 8. Aditya Sharma (DevForge Systems) - Developer
  '9a4b70ce-d747-4f9c-bb1b-35c90f9f47d4': [
    {
      id: 'srv_aditya_1',
      title: 'Full-Stack Web Application / SaaS MVP',
      category: 'Web Development',
      rate: 95000,
      unit: 'Project',
      description: 'Complete production-ready web application built with Next.js/React, TypeScript, Supabase/PostgreSQL, authentication, and Razorpay/Stripe billing.',
      deliverables: 'Full source code repository, automated CI/CD pipeline, SSL setup, 30 days post-launch warranty support'
    },
    {
      id: 'srv_aditya_2',
      title: 'Custom Cross-Platform Mobile App (iOS & Android)',
      category: 'Mobile Apps',
      rate: 85000,
      unit: 'Project',
      description: 'Performant native-feel mobile app built in React Native / Expo with push notifications, offline cache, and smooth fluid animations.',
      deliverables: 'App Store & Google Play submission packages, API integration, Figma-to-code pixel perfection'
    },
    {
      id: 'srv_aditya_3',
      title: 'High-Converting E-Commerce Storefront',
      category: 'E-Commerce',
      rate: 45000,
      unit: 'Project',
      description: 'Custom e-commerce store with product catalogue, inventory management, cart abandoned recovery, and sub-second page load times.',
      deliverables: 'Fully configured storefront, payment gateway integration, automated invoice generation'
    },
    {
      id: 'srv_aditya_4',
      title: 'Code Audit, Security & Performance Optimization',
      category: 'Consulting',
      rate: 25000,
      unit: 'Day',
      description: 'Deep architectural code review, SQL query index optimization, security vulnerability audit, and Core Web Vitals performance boost.',
      deliverables: 'Comprehensive technical audit report, pull requests with actionable code fixes'
    }
  ],

  // 9. Ananya Deshmukh (Studio Kanso) - Designer
  '77699313-ef15-4af3-99ab-e5224b518968': [
    {
      id: 'srv_ananya_1',
      title: 'End-to-End Mobile App UI/UX Design System',
      category: 'Product Design',
      rate: 60000,
      unit: 'Project',
      description: 'User-centered mobile app design in Figma (up to 20 screens), interactive clickable prototypes, design tokens, and accessibility testing.',
      deliverables: 'Figma master file, atomic component library, responsive layouts, developer handoff documentation'
    },
    {
      id: 'srv_ananya_2',
      title: 'Comprehensive Brand Identity & Visual Guidelines',
      category: 'Branding',
      rate: 35000,
      unit: 'Project',
      description: 'Holistic brand strategy including custom logo mark, dynamic color palette, typography pairing, brand voice, and social templates.',
      deliverables: 'Brand style guide PDF (30+ pages), vector logo package (SVG, AI, PNG), business collateral kit'
    },
    {
      id: 'srv_ananya_3',
      title: 'SaaS / E-Commerce Landing Page Redesign',
      category: 'Web Design',
      rate: 28000,
      unit: 'Project',
      description: 'Modern, high-converting desktop and mobile landing page design engineered to maximize conversion rates and user delight.',
      deliverables: 'Desktop + tablet + mobile Figma artboards, custom vector illustrations, micro-interaction guidelines'
    },
    {
      id: 'srv_ananya_4',
      title: 'Rapid UX Usability Audit & Heuristic Teardown',
      category: 'UX Audit',
      rate: 18000,
      unit: 'Audit',
      description: 'Comprehensive teardown of existing digital products identifying friction points, drop-off funnels, and cognitive load issues.',
      deliverables: 'Detailed UX audit deck with annotated screenshots and prioritized visual remediation steps'
    }
  ],

  // 10. Rhea Singhania - Model
  '88a14b22-9901-4c55-bb33-112233445566': [
    {
      id: 'srv_rhea_1',
      title: 'Full-Day Fashion Catalog & Campaign Modeling',
      category: 'Fashion Modeling',
      rate: 25000,
      unit: 'Day',
      description: '8-hour editorial and e-commerce lookbook shoot for apparel brands, lifestyle catalogs, or retail brands. Versatile posing and high stamina.',
      deliverables: 'Up to 15 outfit changes, full digital and print commercial promotional usage rights'
    },
    {
      id: 'srv_rhea_2',
      title: 'Bridal Couture & High Jewelry Campaign',
      category: 'Bridal Fashion',
      rate: 30000,
      unit: 'Day',
      description: 'Luxury ethnic bridal wear, designer lehenga showcases, and fine diamond/gold jewelry modeling with regal expressions.',
      deliverables: 'Full-day campaign shoot, close-up jewelry portraits, short cinematic video reel clips'
    },
    {
      id: 'srv_rhea_3',
      title: 'TVC & Digital Video Ad Campaign Appearance',
      category: 'Commercial Acting',
      rate: 28000,
      unit: 'Day',
      description: 'Lead or featured on-camera talent for television commercials, YouTube ads, or digital brand marketing films with spoken dialogue.',
      deliverables: 'On-set performance (up to 10 hours), character acting, commercial broadcast release'
    },
    {
      id: 'srv_rhea_4',
      title: 'Runway Catwalk & Fashion Week Showcase',
      category: 'Runway',
      rate: 20000,
      unit: 'Event',
      description: 'Professional runway walk for designer couture showcases, bridal fashion weeks, and brand launch ceremonies.',
      deliverables: 'Stage rehearsals, choreography walk, media photo calls'
    }
  ],

  // 11. Rajesh Varma (SkyHawk Aerials) - Drone Pilot
  'ef063409-9428-431a-bf77-f90ec3315b26': [
    {
      id: 'srv_rajesh_1',
      title: 'Cinematic 4K Aerial Drone Shoot (DJI Mavic 3 Cine)',
      category: 'Aerial Cinematography',
      rate: 22000,
      unit: 'Day',
      description: 'High-altitude cinematic drone sweeps, destination wedding baraat bird-eye views, and landscape framing recorded in 4K ProRes.',
      deliverables: 'DGCA compliant operations, dual battery packs for continuous flights, 4K master ProRes video files'
    },
    {
      id: 'srv_rajesh_2',
      title: 'Dynamic FPV Indoor Flythrough & Action Chase',
      category: 'FPV Drones',
      rate: 28000,
      unit: 'Day',
      description: 'Custom-built naked GoPro FPV drone for adrenaline-fueled continuous one-shot venue flythroughs, car chases, or indoor architectural tours.',
      deliverables: 'Stabilized 4K 60fps Reel-steady footage, high-speed maneuvering, unique visual angles'
    },
    {
      id: 'srv_rajesh_3',
      title: 'Real Estate & Infrastructure Aerial Mapping',
      category: 'Industrial Aerial',
      rate: 25000,
      unit: 'Project',
      description: 'High-accuracy aerial survey, construction progress monitoring, and ultra high-res 48MP orthomosaic imagery for developers.',
      deliverables: 'High-resolution stitched aerial maps, 3D point cloud exports, geo-tagged inspection photos'
    },
    {
      id: 'srv_rajesh_4',
      title: 'Live Drone Wireless Video Feed (HDMI / SDI)',
      category: 'Broadcast Drone',
      rate: 18000,
      unit: 'Event',
      description: 'Low-latency live 1080p aerial feed transmitted directly into event switcher, OB van, or live streaming console for large crowds.',
      deliverables: 'Wireless video receiver setup, live feed operator, broadcast sync'
    }
  ],

  // 12. Fatima Zaidi (Royal Henna Art) - Mehendi Artist
  '5814b1cb-7233-4d13-bed8-127cddc30824': [
    {
      id: 'srv_fatima_1',
      title: 'Royal Bridal Mehendi (Elbows & Feet)',
      category: 'Bridal Henna',
      rate: 12000,
      unit: 'Bride',
      description: 'Exquisite bridal mehendi with couple portraits, wedding baraat procession motifs, personalized hashtag etchings, and 100% natural organic henna.',
      deliverables: 'Intricate design up to elbows and mid-calf feet, natural color-guarantee aftercare oil kit'
    },
    {
      id: 'srv_fatima_2',
      title: 'Sangeet Party Guest Henna Package (3 Hours)',
      category: 'Guest Package',
      rate: 8000,
      unit: 'Event',
      description: 'Fast, graceful Arabic, Mandala, and contemporary floral designs for up to 30 wedding guests with 2 skilled assistant artists.',
      deliverables: '3 hours of continuous guest application, natural organic cones, zero chemicals'
    },
    {
      id: 'srv_fatima_3',
      title: 'Engagement & Minimalist Bridal Cuff Artwork',
      category: 'Contemporary Henna',
      rate: 5500,
      unit: 'Hands',
      description: 'Delicate Moroccan grids, bracelet cuffs, and botanical finger jewelry designs tailored for modern engagement ceremonies.',
      deliverables: 'Both hands front & back application, premium dark-stain organic formula'
    },
    {
      id: 'srv_fatima_4',
      title: 'Maternity Belly Henna / Baby Shower Blessing',
      category: 'Maternity',
      rate: 4000,
      unit: 'Session',
      description: 'Safe, hypoallergenic cooling herbal henna mandala designed on expectant mothers bellies for maternity photoshoot celebrations.',
      deliverables: '1.5-hour gentle customized artwork session, lavender infused organic paste'
    }
  ],

  // 13. Meera Kulkarni (The Whisk Studio) - Home Baker
  '7a3910c2-5501-4d33-bc22-998877665544': [
    {
      id: 'srv_meera_1',
      title: 'Custom Multi-Tier Designer Wedding Cake',
      category: 'Wedding Cakes',
      rate: 6500,
      unit: '3-Tier Cake',
      description: 'Handcrafted wedding centerpiece cake featuring edible gold leaf, handmade sugar flowers, and premium Belgian chocolate truffle or salted caramel filling.',
      deliverables: '3-tier custom cake (approx 4.5kg), temperature-controlled venue delivery, cake stand display'
    },
    {
      id: 'srv_meera_2',
      title: 'Artisan Dessert Table & Grazing Bar (50 Guests)',
      category: 'Dessert Bar',
      rate: 12000,
      unit: 'Table Setup',
      description: 'Gourmet dessert station with assorted French macarons, Belgian chocolate tartlets, mini cheesecake shooters, and cake pops.',
      deliverables: '50 gourmet dessert portions, tiered wooden & marble display stands, decorative name tags'
    },
    {
      id: 'srv_meera_3',
      title: 'Bespoke 3D Theme Birthday Cake (2 Kg)',
      category: 'Celebration Cakes',
      rate: 2800,
      unit: 'Cake',
      description: 'Fully customized theme cake with handcrafted edible fondant figurines, textured ganache finish, and premium cake box packaging.',
      deliverables: '2kg cake in flavor of choice, custom sparkler candle, personalized cake topper'
    },
    {
      id: 'srv_meera_4',
      title: 'Luxury Artisan Cookie & Brownie Hamper',
      category: 'Gifting Bakes',
      rate: 1200,
      unit: 'Hamper',
      description: 'Freshly baked fudgy walnut brownies, Belgian chocolate chunk cookies, and almond biscotti beautifully presented in a wooden gift box.',
      deliverables: 'Box of 12 artisan treats, satin ribbon bow, customized greeting message card'
    }
  ],

  // 14. Vikramaditya Rathore (Apex Cinema Fleets & Travels) - Travels & Logistics
  'a8410f0e-8001-4baf-a5b2-2e740aba82f7': [
    {
      id: 'srv_vikram_1',
      title: 'Luxury 2-Room Film Production Vanity Van',
      category: 'Vanity Vans',
      rate: 14000,
      unit: 'Day (12 Hrs)',
      description: 'State-of-the-art dual room vanity van equipped with illuminated makeup mirrors, air conditioning, luxury lounge sofa, private washroom, and silent generator.',
      deliverables: '12-hour van hire with dedicated operator, generator fuel included, on-set standby'
    },
    {
      id: 'srv_vikram_2',
      title: 'Toyota Innova Crysta / Hycross Film Crew Rental',
      category: 'Crew Transport',
      rate: 4500,
      unit: 'Day (8 Hrs / 80 Km)',
      description: 'Chauffeur-driven luxury MPV equipped with heavy-duty roof carrier for camera and lighting pelican cases. Punctual, verified drivers.',
      deliverables: '8 hours / 80km package, professional driver, toll & parking assistance'
    },
    {
      id: 'srv_vikram_3',
      title: 'Mercedes E-Class / Luxury Bridal Entry Car',
      category: 'Bridal Transport',
      rate: 18000,
      unit: 'Day',
      description: 'Immaculately maintained luxury sedan decorated with fresh floral ribbons for bride & groom venue arrival and royal departure.',
      deliverables: 'Uniformed chauffeur, premium floral car decoration, 100km city package'
    },
    {
      id: 'srv_vikram_4',
      title: 'Force Urbania 17-Seater Executive Crew Mini-Bus',
      category: 'Production Logistics',
      rate: 9500,
      unit: 'Day',
      description: 'Ultra-comfortable ergonomic reclining seats, ambient cabin lighting, individual USB chargers, and expansive rear boot space for equipment crew transfers.',
      deliverables: '17-passenger capacity, experienced highway driver, outstation travel ready'
    }
  ],

  // 15. Aaradhya Patel (The Kraft & Gifting Studio) - Crafts & Gifting
  'c8000000-0000-0000-0000-000000000008': [
    {
      id: 'srv_aaradhya_1',
      title: 'Bespoke Wedding Trousseau Packing Trays (Set of 10)',
      category: 'Trousseau Packing',
      rate: 15000,
      unit: 'Set of 10 Trays',
      description: 'Custom handcrafted royal velvet and laser-cut acrylic trays adorned with imported silk flowers, brocade fabrics, and crystal accents for wedding gifts.',
      deliverables: '10 decorated presentation trays, protective cellophane covers, customized family monogram'
    },
    {
      id: 'srv_aaradhya_2',
      title: 'Luxury VIP Return Gift Hampers',
      category: 'Hampers',
      rate: 1850,
      unit: 'Hamper',
      description: 'Handcrafted pine-wood hamper box containing artisan scented soy candles, brass tea-light holders, dry fruit jar pair, and wax-sealed greeting card.',
      deliverables: 'Complete packed hamper with custom brand/couple tags, minimum order 15 units'
    },
    {
      id: 'srv_aaradhya_3',
      title: 'Rigid Acrylic Wedding Invitation Boxes',
      category: 'Invitations',
      rate: 450,
      unit: 'Box (Min 50)',
      description: 'Luxury rigid invitation boxes with gold foil-stamped acrylic invitation cards, potpourri drawer, and bespoke wedding branding.',
      deliverables: 'Custom invitation box, hot-stamped foil card, fragrant potpourri pouch'
    },
    {
      id: 'srv_aaradhya_4',
      title: 'Floral Phoolon Ki Chaadar for Bridal Entry',
      category: 'Floral Crafts',
      rate: 6500,
      unit: 'Piece',
      description: 'Handcrafted fresh floral canopy made with white tuberoses, baby breath, and red roses featuring lightweight bamboo frame and fairy-light accents.',
      deliverables: 'Fresh floral canopy ready on wedding day, sturdy 4-corner carry handles'
    }
  ]
};

async function run() {
  try {
    await client.connect();
    console.log('Connected to database to update creator services...');

    // Also update Thaha categories if empty
    await client.query(`
      UPDATE public.professional_profiles 
      SET categories = ARRAY['Photographers', 'Wedding', 'Portraits']
      WHERE id = '409b83ad-8fd3-450d-ba45-bac6e980e94a' AND (categories IS NULL OR cardinality(categories) = 0);
    `);

    for (const [proId, services] of Object.entries(CREATOR_SERVICES)) {
      const res = await client.query(
        `UPDATE public.professional_profiles SET services = $1::jsonb WHERE id = $2 RETURNING id, title;`,
        [JSON.stringify(services), proId]
      );
      if (res.rows.length > 0) {
        console.log(`Updated services for [${proId}]: ${res.rows[0].title} (${services.length} services)`);
      } else {
        console.warn(`Creator with id ${proId} not found in database!`);
      }
    }

    console.log('All creator services updated successfully in PostgreSQL database!');
    await client.end();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
