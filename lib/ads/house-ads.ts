import type { ServedAd } from './adrank';

export type HouseAdIntent =
  | 'claim'
  | 'directory'
  | 'training'
  | 'permits'
  | 'glossary'
  | 'infrastructure'
  | 'loads'
  | 'corridor'
  | 'tools'
  | 'advertise';

export type HouseAdGoal =
  | 'claim'
  | 'training'
  | 'sponsor_sales'
  | 'load_board'
  | 'tool_activation'
  | 'infrastructure_supply'
  | 'data_product'
  | 'directory_activation';

export type HouseAd = ServedAd & {
  intent: HouseAdIntent;
  goal: HouseAdGoal;
  proof_label: string;
  visual_alt: string;
  offer_ladder: 'free_action' | 'low_friction_paid' | 'business_action';
  secondary_cta_text?: string;
  secondary_cta_url?: string;
  package_key?: string;
  image_prompt?: string;
};

export type HouseAdCreativeScore = {
  total: number;
  context_match: number;
  offer_clarity: number;
  visual_quality: number;
  cta_strength: number;
  role_country_relevance: number;
  proof_or_credibility: number;
  mobile_readability: number;
  compliance_accessibility: number;
};

export type HouseAdContext = {
  limit?: number;
  surface?: string;
  placementId?: string;
  intent?: HouseAdIntent;
  role?: string;
  country?: string;
  region?: string;
  city?: string;
  corridor?: string;
  topic?: string;
  pageType?: string;
  slotType?: string;
  userIntent?: string;
  funnelStage?: string;
  monetizationGoal?: HouseAdGoal;
  excludeCreativeIds?: string[];
  completedGoals?: HouseAdGoal[];
};

type HouseAdPickOptions = HouseAdContext;

export type HouseAdCreativeBrief = {
  context: Required<Pick<HouseAdContext, 'surface' | 'placementId'>> & HouseAdContext;
  selected_ad_id: string;
  inheritance_path: string[];
  headline: string;
  body: string | null;
  cta_text: string;
  secondary_cta_text?: string;
  cta_url: string;
  image_prompt: string;
  mobile_variant: string;
  desktop_variant: string;
  tracking_tags: Record<string, string>;
  compliance_warning?: string;
};

const DEFAULT_IMAGE_PROMPT =
  'Premium cinematic heavy-haul command-center advertisement background, dark obsidian asphalt, amber beacon glow, subtle route-grid overlay, bronze and gold accents, no logos, no text, dark negative space for HTML headline overlay, photorealistic, sharp, trustworthy.';

const HOUSE_ADS: HouseAd[] = [
  {
    ad_id: 'house-claim-profile',
    campaign_id: 'house',
    creative_id: 'claim-profile-verification',
    intent: 'claim',
    headline: 'Your profile is already being searched.',
    body: 'Claim it, correct it, and turn source-backed directory traffic into broker-ready trust signals.',
    cta_text: 'Claim Your Profile',
    cta_url: '/claim',
    image_url: '/ads/claim-profile.png',
    creative_type: 'native_image',
    impression_token: 'house-claim-profile',
    price_model: 'house',
    ad_rank: 0.98,
    goal: 'claim',
    offer_ladder: 'free_action',
    proof_label: 'Profile Claim',
    visual_alt: 'Haul Command profile claim dashboard preview',
    secondary_cta_text: 'View Proof Signals',
    secondary_cta_url: '/directory',
    image_prompt:
      'Premium heavy-haul profile verification dashboard, dark command center, verified profile card, map pins, proof signals, amber and bronze accents, no logo, no text, negative space for headline overlay.',
  },
  {
    ad_id: 'house-directory-sponsor',
    campaign_id: 'house',
    creative_id: 'directory-market-sponsor',
    intent: 'directory',
    headline: 'Own the market where buyers are searching.',
    body: 'Directory sponsor slots put your offer beside high-intent pilot car, permit, and route-support searches.',
    cta_text: 'Sponsor Directory Demand',
    cta_url: '/advertise/buy?zone=directory_sponsor',
    image_url: '/ads/directory-hero-bg.png',
    creative_type: 'native_image',
    impression_token: 'house-directory-sponsor',
    price_model: 'house',
    ad_rank: 0.96,
    goal: 'sponsor_sales',
    offer_ladder: 'business_action',
    proof_label: 'Directory Sponsor',
    visual_alt: 'Heavy haul directory sponsor placement preview',
    secondary_cta_text: 'View Sponsor Packages',
    secondary_cta_url: '/advertise',
    package_key: 'directory_sponsor',
    image_prompt:
      'Premium dark media placement inside a heavy-haul directory, gold framed sponsor inventory, route grid, verified listing cards, industrial command-center atmosphere, no text, no logos.',
  },
  {
    ad_id: 'house-training-path',
    campaign_id: 'house',
    creative_id: 'training-certification-path',
    intent: 'training',
    headline: 'Get trained before the next load calls.',
    body: 'Turn role pages into certification demand with state-aware pilot car training and readiness paths.',
    cta_text: 'View Training Paths',
    cta_url: '/training',
    image_url: '/backgrounds/training-hero.jpg',
    creative_type: 'native_image',
    impression_token: 'house-training-path',
    price_model: 'house',
    ad_rank: 0.93,
    goal: 'training',
    offer_ladder: 'low_friction_paid',
    proof_label: 'Training Path',
    visual_alt: 'Pilot car training and certification visual',
    secondary_cta_text: 'See First-Job Track',
    secondary_cta_url: '/training/first-job',
    image_prompt:
      'Premium practical pilot-car training scene, field readiness checklist, convoy road edge, amber beacon, safety vest texture, dark cinematic logistics style, no text, no logos.',
  },
  {
    ad_id: 'house-permit-packet',
    campaign_id: 'house',
    creative_id: 'permit-move-packet',
    intent: 'permits',
    headline: 'Build the permit packet before the route gets expensive.',
    body: 'Check requirements, escort notes, permit support, and corridor risk before you commit the move.',
    cta_text: 'Build Permit Packet',
    cta_url: '/tools/permit-cost-calculator',
    image_url: '/ads/compliance-alert.png',
    creative_type: 'native_image',
    impression_token: 'house-permit-packet',
    price_model: 'house',
    ad_rank: 0.92,
    goal: 'tool_activation',
    offer_ladder: 'free_action',
    proof_label: 'Permit Tool',
    visual_alt: 'Oversize permit compliance dashboard visual',
    secondary_cta_text: 'Check Requirements',
    secondary_cta_url: '/tools/state-requirements',
    image_prompt:
      'Premium permit packet and route planning dashboard, oversize load route map, compliance documents, amber route lines, dark enterprise software feel, no text, no logo.',
  },
  {
    ad_id: 'house-glossary-sponsor',
    campaign_id: 'house',
    creative_id: 'glossary-category-sponsor',
    intent: 'glossary',
    headline: 'When buyers learn the term, own the next action.',
    body: 'Sponsor glossary categories, capture operator education demand, and route readers into claim, training, and permit tools.',
    cta_text: 'Lock Category Sponsorship',
    cta_url: '/advertise/buy?zone=glossary_category_sponsor',
    image_url: '/ads/glossary-hub-hero.png',
    creative_type: 'native_image',
    impression_token: 'house-glossary-sponsor',
    price_model: 'house',
    ad_rank: 0.91,
    goal: 'sponsor_sales',
    offer_ladder: 'business_action',
    proof_label: 'Glossary Sponsor',
    visual_alt: 'Haul Command glossary category sponsor creative',
    secondary_cta_text: 'View Sponsor Packages',
    secondary_cta_url: '/advertise',
    package_key: 'glossary_category_sponsor',
    image_prompt:
      'Premium heavy-haul knowledge graph and glossary command center, terminology cards, route-grid overlay, bronze and amber light, dark negative space, no text, no logos.',
  },
  {
    ad_id: 'house-routeready-infra',
    campaign_id: 'house',
    creative_id: 'routeready-infrastructure',
    intent: 'infrastructure',
    headline: 'Turn useful property into RouteReady infrastructure.',
    body: 'List staging yards, truck parking, escort meet-up points, high-pole staging, and emergency laydown space.',
    cta_text: 'List Heavy-Haul Space',
    cta_url: '/infrastructure/list-your-property',
    image_url: '/backgrounds/marketplace-hero.jpg',
    creative_type: 'native_image',
    impression_token: 'house-routeready-infra',
    price_model: 'house',
    ad_rank: 0.9,
    goal: 'infrastructure_supply',
    offer_ladder: 'business_action',
    proof_label: 'Infrastructure',
    visual_alt: 'Heavy haul staging yard and infrastructure network visual',
    secondary_cta_text: 'Preview RouteReady Sites',
    secondary_cta_url: '/infrastructure',
    image_prompt:
      'Premium oversize staging yard at night, wide industrial gate, escort vehicle beacon, secure yard lighting, route-grid overlay, dark bronze logistics atmosphere, no text.',
  },
  {
    ad_id: 'house-post-load',
    campaign_id: 'house',
    creative_id: 'broker-load-match',
    intent: 'loads',
    headline: 'Need support on a load today?',
    body: 'Post route, dimensions, timing, and needed roles so Haul Command can surface matching support signals.',
    cta_text: 'Post a Load',
    cta_url: '/loads/post',
    image_url: '/blog/hero-broker-match.png',
    creative_type: 'native_image',
    impression_token: 'house-post-load',
    price_model: 'house',
    ad_rank: 0.89,
    goal: 'load_board',
    offer_ladder: 'business_action',
    proof_label: 'Broker Match',
    visual_alt: 'Broker matching dashboard visual',
    secondary_cta_text: 'Open Load Board',
    secondary_cta_url: '/load-board',
    image_prompt:
      'Premium heavy-haul load board dashboard, freight card, route signal, broker-to-operator matching energy, dark command center, amber and gold accents, no text, no logos.',
  },
  {
    ad_id: 'house-corridor-intel',
    campaign_id: 'house',
    creative_id: 'corridor-shortage-index',
    intent: 'corridor',
    headline: 'See the corridor shortage before your competitors do.',
    body: 'Use route intelligence to spot thin supply, claim gaps, support locations, and sponsor-ready markets.',
    cta_text: 'Open Corridor Intel',
    cta_url: '/corridors',
    image_url: '/backgrounds/corridor-hero.jpg',
    creative_type: 'native_image',
    impression_token: 'house-corridor-intel',
    price_model: 'house',
    ad_rank: 0.88,
    goal: 'data_product',
    offer_ladder: 'low_friction_paid',
    proof_label: 'Corridor Intel',
    visual_alt: 'Route corridor intelligence visual',
    secondary_cta_text: 'Sponsor This Corridor',
    secondary_cta_url: '/advertise/buy?zone=corridor_sponsor',
    package_key: 'corridor_sponsor',
    image_prompt:
      'Premium aerial highway corridor at night, oversize convoy route line, state border grid, amber beacon trail, dark industrial command-map visual, no text.',
  },
  {
    ad_id: 'house-tools-command',
    campaign_id: 'house',
    creative_id: 'haul-command-tools',
    intent: 'tools',
    headline: 'Stop guessing. Run the tool.',
    body: 'Use Haul Command calculators and route tools to turn rules, dimensions, and risk into a next step.',
    cta_text: 'Open Tools',
    cta_url: '/tools',
    image_url: '/backgrounds/tools-hero.jpg',
    creative_type: 'native_image',
    impression_token: 'house-tools-command',
    price_model: 'house',
    ad_rank: 0.86,
    goal: 'tool_activation',
    offer_ladder: 'free_action',
    proof_label: 'Tools',
    visual_alt: 'Haul Command tool dashboard visual',
    secondary_cta_text: 'Build Route Packet',
    secondary_cta_url: '/tools/route-ready',
    image_prompt:
      'Premium route calculation tool UI, permit calculator, route packet, map overlay, industrial dark enterprise interface, amber and bronze accents, no text.',
  },
  {
    ad_id: 'house-adgrid-buy',
    campaign_id: 'house',
    creative_id: 'adgrid-self-serve',
    intent: 'advertise',
    headline: 'Put your offer where heavy-haul intent already exists.',
    body: 'Launch directory, corridor, glossary, training, and market-data placements with labeled paid inventory.',
    cta_text: 'Launch AdGrid Campaign',
    cta_url: '/advertise/buy?zone=directory_sponsor',
    image_url: '/ads/beta-access-bg.png',
    creative_type: 'native_image',
    impression_token: 'house-adgrid-buy',
    price_model: 'house',
    ad_rank: 0.85,
    goal: 'sponsor_sales',
    offer_ladder: 'business_action',
    proof_label: 'AdGrid',
    visual_alt: 'Haul Command AdGrid campaign visual',
    secondary_cta_text: 'Preview Slot Mockups',
    secondary_cta_url: '/advertise',
    package_key: 'self_serve_adgrid',
    image_prompt:
      'Premium self-serve ad campaign command center, sponsored inventory mockups, gold-framed placements, dark enterprise media dashboard, no text, no logos.',
  },
];

const ROLE_INTENTS: Record<string, HouseAdIntent[]> = {
  operator: ['claim', 'training', 'tools', 'directory'],
  escort: ['claim', 'training', 'tools', 'directory'],
  pilot: ['claim', 'training', 'tools', 'directory'],
  pilot_car: ['claim', 'training', 'tools', 'directory'],
  pilot_car_operator: ['claim', 'training', 'tools', 'directory'],
  broker: ['loads', 'permits', 'corridor', 'directory'],
  carrier: ['loads', 'permits', 'infrastructure', 'corridor'],
  advertiser: ['advertise', 'directory', 'glossary', 'corridor'],
};

const STRONG_CTA_VERBS = ['Claim', 'Lock', 'Build', 'Start', 'Post', 'Sponsor', 'View', 'Open', 'List', 'Launch'];

const COUNTRY_TERMS: Record<
  string,
  {
    label: string;
    oversize: string;
    pilotCar: string;
    routeSupport: string;
    currency?: string;
    complianceNote?: string;
  }
> = {
  US: {
    label: 'United States',
    oversize: 'oversize',
    pilotCar: 'pilot car',
    routeSupport: 'permit and escort support',
    currency: 'USD',
  },
  CA: {
    label: 'Canada',
    oversize: 'over-dimensional',
    pilotCar: 'pilot car',
    routeSupport: 'permit and escort support',
    currency: 'CAD',
  },
  AU: {
    label: 'Australia',
    oversize: 'oversize',
    pilotCar: 'pilot vehicle',
    routeSupport: 'permit and pilot vehicle support',
    currency: 'AUD',
  },
  NZ: {
    label: 'New Zealand',
    oversize: 'overdimension',
    pilotCar: 'pilot vehicle',
    routeSupport: 'overdimension route support',
    currency: 'NZD',
  },
  GB: {
    label: 'United Kingdom',
    oversize: 'abnormal indivisible load',
    pilotCar: 'escort vehicle',
    routeSupport: 'AIL and movement-order support',
    currency: 'GBP',
    complianceNote: 'Use UK abnormal-load terminology and avoid US-only permit language.',
  },
  UK: {
    label: 'United Kingdom',
    oversize: 'abnormal indivisible load',
    pilotCar: 'escort vehicle',
    routeSupport: 'AIL and movement-order support',
    currency: 'GBP',
    complianceNote: 'Use UK abnormal-load terminology and avoid US-only permit language.',
  },
  DE: {
    label: 'Germany',
    oversize: 'Schwertransport',
    pilotCar: 'Begleitfahrzeug',
    routeSupport: 'Schwertransport route support',
    currency: 'EUR',
  },
  FR: {
    label: 'France',
    oversize: 'convoi exceptionnel',
    pilotCar: 'voiture pilote',
    routeSupport: 'convoi exceptionnel route support',
    currency: 'EUR',
  },
  BR: {
    label: 'Brazil',
    oversize: 'carga excedente',
    pilotCar: 'escolta / batedor',
    routeSupport: 'carga excedente route support',
    currency: 'BRL',
  },
  MX: {
    label: 'Mexico',
    oversize: 'carga sobredimensionada',
    pilotCar: 'vehiculo escolta',
    routeSupport: 'permit and escort support',
    currency: 'MXN',
  },
};

function resolveIntent(surface = ''): HouseAdIntent {
  const normalized = surface.toLowerCase();
  if (normalized.includes('training') || normalized.includes('cert')) return 'training';
  if (normalized.includes('glossary') || normalized.includes('term')) return 'glossary';
  if (normalized.includes('permit') || normalized.includes('regulation') || normalized.includes('compliance')) return 'permits';
  if (normalized.includes('infra') || normalized.includes('yard') || normalized.includes('parking') || normalized.includes('staging')) return 'infrastructure';
  if (normalized.includes('load') || normalized.includes('broker')) return 'loads';
  if (normalized.includes('corridor') || normalized.includes('route')) return 'corridor';
  if (normalized.includes('tool') || normalized.includes('calculator')) return 'tools';
  if (normalized.includes('advertise') || normalized.includes('sponsor')) return 'advertise';
  if (normalized.includes('directory') || normalized.includes('search')) return 'directory';
  if (normalized.includes('claim') || normalized.includes('profile')) return 'claim';
  return 'directory';
}

function normalizeCountry(country?: string) {
  if (!country) return undefined;
  const normalized = country.trim().toUpperCase();
  if (normalized === 'UNITED KINGDOM') return 'GB';
  if (normalized === 'GREAT BRITAIN') return 'GB';
  if (normalized === 'UNITED STATES') return 'US';
  return normalized;
}

function stableIndex(key: string, length: number) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % Math.max(length, 1);
}

function withFreshToken(ad: HouseAd, key: string): HouseAd {
  return {
    ...ad,
    impression_token: `${ad.impression_token}_${stableIndex(key, 99999)}`,
  };
}

function addContextParams(url: string, opts: HouseAdPickOptions, ad: HouseAd) {
  if (!url.startsWith('/')) return url;
  const [path, rawQuery = ''] = url.split('?');
  const params = new URLSearchParams(rawQuery);
  const slot = opts.placementId ?? opts.surface;
  if (slot) params.set('slot', slot);
  if (opts.surface) params.set('source', opts.surface);
  if (opts.pageType) params.set('pageType', opts.pageType);
  if (opts.slotType) params.set('slotType', opts.slotType);
  if (opts.country) params.set('country', normalizeCountry(opts.country) ?? opts.country);
  if (opts.region) params.set('region', opts.region);
  if (opts.city) params.set('city', opts.city);
  if (opts.corridor) params.set('corridor', opts.corridor);
  if (opts.role) params.set('role', opts.role);
  if (opts.topic) params.set('topic', opts.topic);
  params.set('houseAd', ad.creative_id);
  params.set('goal', ad.goal);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function localizeAd(ad: HouseAd, opts: HouseAdPickOptions): HouseAd {
  const countryCode = normalizeCountry(opts.country);
  const country = countryCode ? COUNTRY_TERMS[countryCode] : undefined;
  const topic = opts.topic?.replace(/[-_]+/g, ' ');
  const role = opts.role?.replace(/[-_]+/g, ' ');
  let headline = ad.headline;
  let body = ad.body;
  let ctaText = ad.cta_text;
  let ctaUrl = ad.cta_url;

  if (country) {
    if (ad.intent === 'glossary') {
      headline =
        countryCode === 'GB'
          ? 'Own Visibility Around AIL Search Paths'
          : `Own ${country.oversize} visibility before the quote starts.`;
      body = `Sponsor the terminology, route intelligence, and ${country.routeSupport} discovery flows ${country.label} operators and buyers use before movement planning.`;
      ctaText = 'Sponsor This Category';
    }

    if (ad.intent === 'claim') {
      headline = `Claim your ${country.label} ${role || country.pilotCar} profile.`;
      body = `Correct the public record, add proof signals, and show up stronger when buyers search for ${country.oversize} support.`;
      ctaUrl = '/claim';
    }

    if (ad.intent === 'training') {
      headline = `Start the ${country.label} readiness path.`;
      body = `Use local terminology, field checklists, and role-specific training signals before the next ${country.oversize} move needs support.`;
      ctaText = 'Start Training';
      ctaUrl = role?.includes('pilot') ? '/training/first-job' : '/training';
    }

    if (ad.intent === 'corridor' && opts.corridor) {
      headline = `Own visibility on ${opts.corridor}.`;
      body = `Put your brand beside ${country.oversize} corridor intelligence, support gaps, and operator discovery for this route.`;
      ctaText = 'Sponsor This Corridor';
    }
  }

  if (topic && ad.intent === 'glossary' && !country) {
    headline = `Own the ${topic} search path.`;
    body = 'Put your brand beside the definitions, jurisdiction context, and tools buyers use before heavy-haul decisions.';
  }

  return {
    ...ad,
    headline,
    body,
    cta_text: ctaText,
    cta_url: addContextParams(ctaUrl, opts, ad),
    secondary_cta_url: ad.secondary_cta_url ? addContextParams(ad.secondary_cta_url, opts, ad) : undefined,
  };
}

export function pickHouseAd(opts: HouseAdPickOptions = {}): HouseAd {
  const intent = opts.intent ?? resolveIntent(`${opts.surface ?? ''} ${opts.placementId ?? ''}`);
  const roleIntents = opts.role ? ROLE_INTENTS[opts.role.toLowerCase()] : null;
  const intentPool = HOUSE_ADS.filter((ad) => ad.intent === intent);
  const rolePool = roleIntents ? HOUSE_ADS.filter((ad) => roleIntents.includes(ad.intent)) : [];
  const basePool = intentPool.length > 0 ? intentPool : rolePool.length > 0 ? rolePool : HOUSE_ADS;
  const excluded = new Set(opts.excludeCreativeIds ?? []);
  const completedGoals = new Set(opts.completedGoals ?? []);
  const filteredPool = basePool.filter((ad) => !excluded.has(ad.creative_id) && !completedGoals.has(ad.goal));
  const pool = filteredPool.length > 0 ? filteredPool : basePool;
  const key = [
    opts.surface ?? 'surface',
    opts.placementId ?? 'slot',
    opts.role ?? 'all',
    normalizeCountry(opts.country) ?? 'global',
    opts.corridor ?? 'no-corridor',
    opts.topic ?? 'no-topic',
    intent,
  ].join(':');
  return localizeAd(withFreshToken(pool[stableIndex(key, pool.length)], key), opts);
}

export function getHouseAds(opts: HouseAdPickOptions = {}): HouseAd[] {
  const limit = opts.limit ?? 4;
  const primary = pickHouseAd(opts);
  const remaining = HOUSE_ADS
    .filter((ad) => ad.ad_id !== primary.ad_id)
    .sort((a, b) => b.ad_rank - a.ad_rank)
    .slice(0, Math.max(limit - 1, 0))
    .map((ad) => withFreshToken(ad, `${opts.surface ?? 'surface'}:${ad.ad_id}`));
  return [primary, ...remaining].slice(0, limit);
}

export function getTopHouseAds(limit = 3, opts: HouseAdPickOptions = {}): HouseAd[] {
  return getHouseAds({ ...opts, limit });
}

export function scoreHouseAdCreative(ad: HouseAd, opts: Pick<HouseAdPickOptions, 'intent' | 'surface' | 'role'> = {}): HouseAdCreativeScore {
  const resolvedIntent = opts.intent ?? resolveIntent(opts.surface ?? '');
  const contextMatch = ad.intent === resolvedIntent ? 20 : 14;
  const offerClarity = ad.headline.length >= 22 && ad.body && ad.body.length >= 60 ? 20 : 14;
  const visualQuality = ad.image_url?.match(/^\/(ads|backgrounds|blog)\//) ? 15 : 8;
  const ctaStrength = STRONG_CTA_VERBS.some((verb) => ad.cta_text.startsWith(verb)) ? 15 : 8;
  const roleCountryRelevance = opts.role ? (ROLE_INTENTS[opts.role.toLowerCase()]?.includes(ad.intent) ? 10 : 7) : 9;
  const proofOrCredibility = ad.proof_label && ad.body?.match(/source|verified|route|sponsor|profile|permit|training|directory|country|jurisdiction/i) ? 10 : 6;
  const mobileReadability = ad.headline.length <= 88 && ad.cta_text.length <= 32 ? 5 : 3;
  const complianceAccessibility = ad.visual_alt.length >= 8 && ad.campaign_id === 'house' ? 5 : 2;

  return {
    total:
      contextMatch +
      offerClarity +
      visualQuality +
      ctaStrength +
      roleCountryRelevance +
      proofOrCredibility +
      mobileReadability +
      complianceAccessibility,
    context_match: contextMatch,
    offer_clarity: offerClarity,
    visual_quality: visualQuality,
    cta_strength: ctaStrength,
    role_country_relevance: roleCountryRelevance,
    proof_or_credibility: proofOrCredibility,
    mobile_readability: mobileReadability,
    compliance_accessibility: complianceAccessibility,
  };
}

export function buildHouseAdCreativeBrief(opts: HouseAdContext): HouseAdCreativeBrief {
  const surface = opts.surface ?? opts.pageType ?? 'global';
  const placementId = opts.placementId ?? opts.slotType ?? 'house-slot';
  const ad = pickHouseAd({ ...opts, surface, placementId });
  const country = normalizeCountry(opts.country);
  const inheritancePath = [
    'global',
    country ? `country:${country}` : null,
    opts.role ? `role:${opts.role}` : null,
    opts.pageType ? `page:${opts.pageType}` : null,
    `slot:${placementId}`,
  ].filter(Boolean) as string[];

  return {
    context: { ...opts, surface, placementId },
    selected_ad_id: ad.ad_id,
    inheritance_path: inheritancePath,
    headline: ad.headline,
    body: ad.body,
    cta_text: ad.cta_text,
    secondary_cta_text: ad.secondary_cta_text,
    cta_url: ad.cta_url,
    image_prompt: ad.image_prompt ?? DEFAULT_IMAGE_PROMPT,
    mobile_variant: '4:5 card with HTML headline overlay and accessible CTA',
    desktop_variant: '3:1 or 16:9 dark band with HTML headline overlay and visible disclosure',
    tracking_tags: buildHouseAdTrackingTags(ad, opts),
    compliance_warning: country ? COUNTRY_TERMS[country]?.complianceNote : undefined,
  };
}

export function buildHouseAdTrackingTags(ad: HouseAd, opts: HouseAdContext = {}): Record<string, string> {
  return {
    slotKey: opts.placementId ?? opts.surface ?? 'house-slot',
    pageType: opts.pageType ?? resolveIntent(opts.surface ?? '').toString(),
    country: normalizeCountry(opts.country) ?? 'global',
    role: opts.role ?? 'all',
    topic: opts.topic ?? 'none',
    campaignId: ad.campaign_id,
    creativeId: ad.creative_id,
    cta: ad.cta_text,
    goal: ad.goal,
    offerLadder: ad.offer_ladder,
    corridor: opts.corridor ?? 'none',
  };
}

export { HOUSE_ADS };
