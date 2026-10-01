export interface EscrowMilestoneRule {
  id: string;
  title: string;
  desc: string;
  percentage: number;
}

export interface ComputedMilestone {
  id: string;
  booking_id?: string;
  title: string;
  desc: string;
  percentage: number;
  amount: number;
  status: 'paid' | 'pending';
}

/**
 * Returns category-specific milestone rules matching Camqrew's updated payment policy:
 * - 50% / 50% (2 Milestones): Musicians, Master of Ceremonies, Models & Talent, Home Bakers, Mehendi Artists, Crafts & Gifting
 * - 70% / 30% (2 Milestones): Travels & Transport
 * - 30% / 40% / 30% (3 Milestones): Photographers, Videographers, Caterers, Event Organisers, Makeup Artists, Developers, Designers
 */
export function getEscrowMilestoneRules(categoryOrList?: string | string[]): EscrowMilestoneRule[] {
  const catArray = Array.isArray(categoryOrList)
    ? categoryOrList
    : categoryOrList
    ? [categoryOrList]
    : [];

  const text = catArray.filter(Boolean).join(' ').toLowerCase();

  // 10. Mehendi Artists (50% Advance | 50% Stage Wrap)
  if (text.includes('mehendi') || text.includes('mehndi') || text.includes('henna')) {
    return [
      { id: '1', title: '50% Advance Escrow', desc: 'Date lock & organic henna preparation', percentage: 50 },
      { id: '2', title: '50% Stage Wrap', desc: 'Application wrap & client sign-off', percentage: 50 },
    ];
  }

  // 14. Crafts & Gifting (50% Advance | 50% Delivery)
  if (text.includes('craft') || text.includes('hamper') || text.includes('gift') || text.includes('trousseau') || text.includes('chaadar') || text.includes('wrap')) {
    return [
      { id: '1', title: '50% Advance Escrow', desc: 'Order confirmation & raw material procurement', percentage: 50 },
      { id: '2', title: '50% Delivery Escrow', desc: 'Hamper packing completion & safe delivery handover', percentage: 50 },
    ];
  }

  // 6. Home Bakers (50% Advance | 50% Delivery)
  if (text.includes('baker') || text.includes('bake') || text.includes('cake') || text.includes('pastry') || text.includes('confectionery')) {
    return [
      { id: '1', title: '50% Advance Escrow', desc: 'Order confirmation & premium ingredient procurement', percentage: 50 },
      { id: '2', title: '50% Delivery Escrow', desc: 'Baking completion & safe delivery handover', percentage: 50 },
    ];
  }

  // 3. Musicians & Bands (50% Advance | 50% Stage Wrap)
  if (text.includes('music') || text.includes('band') || text.includes('guitar') || text.includes('violin') || text.includes('vocal') || text.includes('singer') || text.includes('instrument') || text.includes('flute') || text.includes('dj') || text.includes('sax') || text.includes('acoustic')) {
    return [
      { id: '1', title: '50% Advance Escrow', desc: 'Date lock, rehearsal & setlist curation', percentage: 50 },
      { id: '2', title: '50% Stage Wrap Escrow', desc: 'Live performance set completion & stage wrap', percentage: 50 },
    ];
  }

  // 4. Master of Ceremonies (50% Advance | 50% Stage Wrap)
  if (text.includes('ceremon') || text.includes('emcee') || text.includes('mc') || text.includes('anchor') || text.includes('host') || text.includes('presenter')) {
    return [
      { id: '1', title: '50% Advance Escrow', desc: 'Date reservation & script coordination', percentage: 50 },
      { id: '2', title: '50% Stage Wrap Escrow', desc: 'Stage anchoring wrap & ceremony conclusion', percentage: 50 },
    ];
  }

  // 5. Models & Talent (50% Advance | 50% Shoot Wrap)
  if (text.includes('model') || text.includes('runway') || text.includes('talent')) {
    return [
      { id: '1', title: '50% Advance Escrow', desc: 'Date reservation & fitting rehearsal', percentage: 50 },
      { id: '2', title: '50% Shoot Wrap Escrow', desc: 'Call time wrap & commercial usage handover', percentage: 50 },
    ];
  }

  // 13. Travels & Transport (70% Advance | 30% Final Mileage Clear)
  if (text.includes('travel') || text.includes('transport') || text.includes('fleet') || text.includes('van') || text.includes('car') || text.includes('driver') || text.includes('innova') || text.includes('cab')) {
    return [
      { id: '1', title: '70% Advance Escrow', desc: 'Vehicle fleet lock, fuel mobilization & driver reservation', percentage: 70 },
      { id: '2', title: '30% Final Mileage Clear', desc: 'Route completion, toll reconciliation & final drop-off', percentage: 30 },
    ];
  }

  // 7. Caterers & Chefs (30% Advance | 40% Buffet Service Wrap | 30% Final Headcount Clear)
  if (text.includes('cater') || text.includes('chef') || text.includes('food') || text.includes('culinary')) {
    return [
      { id: '1', title: '30% Advance Escrow', desc: 'Date lock & fresh ingredient procurement', percentage: 30 },
      { id: '2', title: '40% Buffet Service Wrap', desc: 'Live kitchen & buffet service conclusion', percentage: 40 },
      { id: '3', title: '30% Final Headcount Clear', desc: 'Headcount reconciliation & site clean-up', percentage: 30 },
    ];
  }

  // 8. Event Organisers (30% Advance | 40% Show Execution | 30% Vendor Wrap & Audit)
  if (text.includes('organis') || text.includes('organiz') || text.includes('event') || text.includes('planner') || text.includes('production')) {
    return [
      { id: '1', title: '30% Advance Escrow', desc: 'Vendor lock & stage fabrication deposit', percentage: 30 },
      { id: '2', title: '40% Show Execution', desc: 'Live event setup & program execution', percentage: 40 },
      { id: '3', title: '30% Vendor Wrap & Audit', desc: 'Teardown sign-off & final accounts settlement', percentage: 30 },
    ];
  }

  // 9. Makeup Artists (30% Advance | 40% Look Ready / Wrap | 30% Touchup & Handover)
  if (text.includes('makeup') || text.includes('mua') || text.includes('bridal') || text.includes('beauty') || text.includes('hair')) {
    return [
      { id: '1', title: '30% Advance Escrow', desc: 'Date lock & bridal vanity prep', percentage: 30 },
      { id: '2', title: '40% Look Ready / Wrap', desc: 'Bridal airbrush styling & draping wrap', percentage: 40 },
      { id: '3', title: '30% Touchup & Handover', desc: 'Pre-entry touchups & photoshoot ready', percentage: 30 },
    ];
  }

  // 11. Web & App Developers (30% Advance | 40% Staging Demo | 30% Production Code)
  if (text.includes('develop') || text.includes('code') || text.includes('software') || text.includes('app') || text.includes('web')) {
    return [
      { id: '1', title: '30% Advance Escrow', desc: 'Sprint kickoff & technical architecture', percentage: 30 },
      { id: '2', title: '40% Staging Demo', desc: 'Core feature walkthrough & staging deployment', percentage: 40 },
      { id: '3', title: '30% Production Code', desc: 'Code repository handover & live deployment', percentage: 30 },
    ];
  }

  // 12. UI/UX Designers (30% Advance | 40% Figma Prototype | 30% Handoff & Assets)
  if (text.includes('design') || text.includes('ui/ux') || text.includes('figma') || text.includes('brand')) {
    return [
      { id: '1', title: '30% Advance Escrow', desc: 'Sprint kickoff, moodboards & design tokens', percentage: 30 },
      { id: '2', title: '40% Figma Prototype', desc: 'Interactive clickable prototype approval', percentage: 40 },
      { id: '3', title: '30% Handoff & Assets', desc: 'Figma master specs, design system & asset handoff', percentage: 30 },
    ];
  }

  // 2. Videographers (30% Advance | 40% Shoot Wrap | 30% 4K Edits & Teaser)
  if (text.includes('video') || text.includes('cinemat') || text.includes('film') || text.includes('teaser') || text.includes('reel')) {
    return [
      { id: '1', title: '30% Advance Escrow', desc: 'Schedule lock & camera crew reservation', percentage: 30 },
      { id: '2', title: '40% Shoot Wrap', desc: 'On-set production wrap & multi-cam backup', percentage: 40 },
      { id: '3', title: '30% 4K Edits & Teaser', desc: 'Master cuts, 9:16 reels & 4K film delivery', percentage: 30 },
    ];
  }

  // 1. Photographers / Default (30% Advance | 40% Shoot Wrap | 30% Final Vault Proofs)
  return [
    { id: '1', title: '30% Advance Escrow', desc: 'Held now; locks creator calendar', percentage: 30 },
    { id: '2', title: '40% Shoot Wrap', desc: 'Released after on-site shoot wraps', percentage: 40 },
    { id: '3', title: '30% Final Vault Proofs', desc: 'Color-graded high-res photos via Camqrew Vault', percentage: 30 },
  ];
}

/**
 * Computes exact monetary amounts for each milestone ensuring sum === totalAmount
 */
export function computeCategoryMilestones(
  categoryOrList: string | string[] | undefined,
  totalAmount: number,
  bookingId?: string
): ComputedMilestone[] {
  const rules = getEscrowMilestoneRules(categoryOrList);

  if (rules.length === 2) {
    const p1 = rules[0].percentage;
    const m1Amount = Math.round(totalAmount * (p1 / 100));
    const m2Amount = totalAmount - m1Amount; // Guarantee exact sum

    return [
      {
        id: '1',
        booking_id: bookingId,
        title: rules[0].title,
        desc: rules[0].desc,
        percentage: p1,
        amount: m1Amount,
        status: 'paid',
      },
      {
        id: '2',
        booking_id: bookingId,
        title: rules[1].title,
        desc: rules[1].desc,
        percentage: rules[1].percentage,
        amount: m2Amount,
        status: 'pending',
      },
    ];
  }

  // 3-tier: 30% / 40% / 30%
  const m1Amount = Math.round(totalAmount * 0.3);
  const m2Amount = Math.round(totalAmount * 0.4);
  const m3Amount = totalAmount - m1Amount - m2Amount; // Guarantee exact sum

  return [
    {
      id: '1',
      booking_id: bookingId,
      title: rules[0].title,
      desc: rules[0].desc,
      percentage: 30,
      amount: m1Amount,
      status: 'paid',
    },
    {
      id: '2',
      booking_id: bookingId,
      title: rules[1].title,
      desc: rules[1].desc,
      percentage: 40,
      amount: m2Amount,
      status: 'pending',
    },
    {
      id: '3',
      booking_id: bookingId,
      title: rules[2].title,
      desc: rules[2].desc,
      percentage: 30,
      amount: m3Amount,
      status: 'pending',
    },
  ];
}

/**
 * Returns a short human-readable escrow summary (e.g. '50% Advance • 50% Wrap')
 */
export function getEscrowSummaryText(categoryOrList?: string | string[]): string {
  const rules = getEscrowMilestoneRules(categoryOrList);
  return rules.map(r => r.title.replace(' Escrow', '')).join(' • ');
}
