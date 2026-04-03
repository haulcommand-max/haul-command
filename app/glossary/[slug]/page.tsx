import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RelatedLinks from '@/components/seo/RelatedLinks';

export const revalidate = 86400;

const TERMS: Record<string, {
  term: string;
  slug: string;
  definition: string;
  extended: string;
  relatedTerms: string[];
  seeAlso: { label: string; href: string }[];
  faqs: { q: string; a: string }[];
}> = {
  'pilot-car': {
    term: 'Pilot Car',
    slug: 'pilot-car',
    definition: 'A vehicle that accompanies an oversize or overweight load to warn motorists, clear obstructions, and guide the transport safely through each jurisdiction.',
    extended: 'Pilot cars (also called escort vehicles) are required by law in every US state and Canadian province when a load exceeds certain width, height, or length thresholds. The pilot car operator must carry a copy of the oversize permit, maintain radio contact with the truck driver, and display an illuminated OVERSIZE LOAD banner. Most states require at least one rear pilot car for loads over 8.5 feet wide, and both a lead and rear pilot car for loads over 14 feet wide.',
    relatedTerms: ['escort-vehicle','chase-car','height-pole','pevo','oversize-load'],
    seeAlso: [
      { label: 'Find Pilot Car Operators', href: '/find/pilot-car-operator' },
      { label: 'Pilot Car Requirements by State', href: '/escort-requirements' },
      { label: 'Escort Calculator', href: '/tools/escort-calculator' },
    ],
    faqs: [
      { q: 'What is the difference between a pilot car and an escort vehicle?', a: 'Pilot car and escort vehicle are interchangeable terms. Both refer to a vehicle that accompanies an oversize load for safety.' },
      { q: 'How much does a pilot car cost?', a: 'Pilot car rates typically range from $1.75 to $3.50 per loaded mile in the US, with minimum trip fees of $150–$300.' },
      { q: 'When is a pilot car required?', a: 'A pilot car is required when a load exceeds legal width (typically 8.5 ft), height (13.5–14.5 ft depending on state), or other state-specific thresholds.' },
    ],
  },
  'oversize-load': {
    term: 'Oversize Load',
    slug: 'oversize-load',
    definition: 'Any load that exceeds the statutory width, height, length, or weight limits for public roads without a special permit.',
    extended: 'In the United States, the standard legal limits on Interstate highways are 8.5 feet wide, 13.5–14 feet tall (varies by state), 53 feet long for a trailer, and 80,000 lbs gross vehicle weight. Any load exceeding these dimensions requires an oversize or overweight permit and, depending on the excess, one or more pilot cars. Some states have additional restrictions for nighttime movement, holiday travel, and adverse weather.',
    relatedTerms: ['pilot-car','oversize-permit','superload','non-divisible-load','gross-vehicle-weight'],
    seeAlso: [
      { label: 'Permit Checker Tool', href: '/tools/permit-checker' },
      { label: 'State Escort Requirements', href: '/escort-requirements' },
      { label: 'Cost Calculator', href: '/tools/cost-calculator' },
    ],
    faqs: [
      { q: 'What qualifies as an oversize load?', a: 'Any load exceeding the legal width (8.5 ft), height (13.5–14.5 ft), length (53 ft trailer), or weight (80,000 lbs GVW) limits without a permit.' },
      { q: 'Do I need a permit for an oversize load?', a: 'Yes. An oversize permit is required from every state the load will travel through.' },
    ],
  },
  'superload': {
    term: 'Superload',
    slug: 'superload',
    definition: 'An extremely heavy or large load that exceeds standard oversize permit thresholds and requires special engineering analysis, police escort, and multi-agency permitting.',
    extended: 'Superloads typically exceed 200,000 lbs gross weight or 16 feet in width, though exact thresholds vary by state. Moving a superload requires detailed route surveys, bridge engineering studies, utility coordination, and often advance notification to law enforcement along the entire route. Superload permits can take weeks to months to obtain.',
    relatedTerms: ['oversize-load','overweight-permit','bridge-formula','route-survey','pilot-car'],
    seeAlso: [
      { label: 'Bridge Weight Calculator', href: '/tools/bridge-weight' },
      { label: 'Route Check Tool', href: '/route-check' },
      { label: 'Find Heavy Haul Carriers', href: '/directory' },
    ],
    faqs: [
      { q: 'What weight makes a load a superload?', a: 'Generally 200,000 lbs gross or more, but thresholds vary by state — some define superloads at 150,000 lbs.' },
      { q: 'How long does a superload permit take?', a: 'Superload permits can take 2–8 weeks depending on state requirements and bridge analysis complexity.' },
    ],
  },
  'escort-vehicle': {
    term: 'Escort Vehicle',
    slug: 'escort-vehicle',
    definition: 'A vehicle that accompanies an oversize load to provide advance warning and traffic management — also called a pilot car or chase car.',
    extended: 'Escort vehicle is the regulatory term used in most state statutes, while pilot car is the more common industry term. Escort vehicles must display an illuminated OVERSIZE LOAD banner, amber warning lights, and maintain CB radio contact on Channel 19. Requirements for escort vehicle equipment vary by state and load dimensions.',
    relatedTerms: ['pilot-car','chase-car','height-pole','pevo'],
    seeAlso: [
      { label: 'Escort Calculator', href: '/tools/escort-calculator' },
      { label: 'Find Escort Operators', href: '/find/pilot-car-operator' },
    ],
    faqs: [
      { q: 'Is an escort vehicle the same as a pilot car?', a: 'Yes, escort vehicle and pilot car are interchangeable terms used in different states and contexts.' },
    ],
  },
  'oversize-permit': {
    term: 'Oversize Permit',
    slug: 'oversize-permit',
    definition: 'A state-issued authorization allowing a vehicle or load to exceed standard width, height, length, or weight limits on public roads.',
    extended: 'Oversize permits are required from every state a load will travel through. They specify the exact route, permitted dimensions, travel time windows, and escort requirements. Most states offer single-trip permits valid for one specific move, as well as annual blanket permits for repeated movements. Permits must be carried in the transport vehicle and presented on demand.',
    relatedTerms: ['annual-permit','single-trip-permit','oversize-load','overweight-permit'],
    seeAlso: [
      { label: 'Permit Checker Tool', href: '/tools/permit-checker' },
      { label: 'State Requirements', href: '/escort-requirements' },
    ],
    faqs: [
      { q: 'Do I need a separate permit for each state?', a: 'Yes. You need an oversize permit from every state your load travels through.' },
      { q: 'How long does an oversize permit take?', a: 'Single-trip permits are often issued same-day or within 24 hours for standard oversize loads. Superloads can take weeks.' },
    ],
  },
  'height-pole': {
    term: 'Height Pole',
    slug: 'height-pole',
    definition: 'A measuring device mounted on the lead pilot car that detects overhead obstructions — wires, bridges, overpasses — before the oversize load passes beneath them.',
    extended: 'Height poles are calibrated to the actual height of the load plus a small safety margin. As the lead pilot car travels ahead, the height pole contact with any overhead obstruction immediately alerts the operator to stop the transport. Height pole service is required in most states when loads exceed 14–14.5 feet in height.',
    relatedTerms: ['pilot-car','escort-vehicle','oversize-load','route-survey'],
    seeAlso: [
      { label: 'Escort Calculator', href: '/tools/escort-calculator' },
      { label: 'Find Pilot Car Operators', href: '/find/pilot-car-operator' },
    ],
    faqs: [
      { q: 'When is a height pole required?', a: 'Most states require height pole service when load height exceeds 14 feet (some states 13.5 ft).' },
      { q: 'Does the height pole driver need special certification?', a: 'Requirements vary by state. Most require valid driver\'s license and knowledge of height pole operation procedures.' },
    ],
  },
  'chase-car': {
    term: 'Chase Car',
    slug: 'chase-car',
    definition: 'A rear escort vehicle that follows behind an oversize load to warn approaching traffic and assist with lane management.',
    extended: 'The chase car (rear escort) is the most commonly required escort position — when only one escort is mandated, it is almost always the rear chase car. Chase cars must display OVERSIZE LOAD banners, amber lights, and maintain radio contact with the truck driver and lead car. The chase car operator manages merging traffic, signals turns, and assists with backing maneuvers.',
    relatedTerms: ['pilot-car','escort-vehicle','height-pole'],
    seeAlso: [
      { label: 'Find Pilot Car Operators', href: '/find/pilot-car-operator' },
      { label: 'Escort Requirements by State', href: '/escort-requirements' },
    ],
    faqs: [
      { q: 'Is the chase car the same as the pilot car?', a: 'Yes, a chase car is a type of pilot car — specifically the rear escort vehicle.' },
      { q: 'When is only a rear chase car required?', a: 'Most states require only a rear escort for loads between 8.5–14 feet wide. Above 14 feet, both lead and rear are typically required.' },
    ],
  },
  'pevo': {
    term: 'PEVO Certification',
    slug: 'pevo',
    definition: 'Pilot/Escort Vehicle Operator certification — a nationally recognized credential verifying knowledge of escort procedures and state-specific regulations.',
    extended: 'PEVO certification is offered by several organizations including the National Association of Escort & Pilot Cars (NAEC) and state-specific programs. Certified operators demonstrate knowledge of oversize load regulations, equipment requirements, communication procedures, and safety practices across multiple states. Some brokers and carriers require PEVO certification.',
    relatedTerms: ['pilot-car','escort-vehicle'],
    seeAlso: [
      { label: 'Find Certified Operators', href: '/find/pilot-car-operator' },
      { label: 'Pilot Car Jobs & Loads', href: '/loads' },
    ],
    faqs: [
      { q: 'Is PEVO certification required by law?', a: 'PEVO certification is not universally required by law, but many states and carriers require it. Requirements vary by state.' },
      { q: 'How do I get PEVO certified?', a: 'Contact NAEC or your state DOT for approved certification programs. Training typically takes 1–3 days.' },
    ],
  },
  'overweight-permit': {
    term: 'Overweight Permit',
    slug: 'overweight-permit',
    definition: 'Authorization to operate a vehicle exceeding the standard gross vehicle weight limit — typically 80,000 lbs on US Interstate highways.',
    extended: 'Overweight permits are separate from oversize permits and are triggered by weight rather than dimensions. They require axle weight calculations, bridge formula compliance checks, and may require route-specific bridge engineering analysis. Some states issue combined oversize/overweight permits for loads that exceed both thresholds.',
    relatedTerms: ['gross-vehicle-weight','bridge-formula','oversize-permit','superload'],
    seeAlso: [
      { label: 'Bridge Weight Calculator', href: '/tools/bridge-weight' },
      { label: 'Permit Checker', href: '/tools/permit-checker' },
    ],
    faqs: [
      { q: 'What is the maximum weight without a permit on US Interstates?', a: '80,000 lbs gross vehicle weight is the federal Interstate limit. State roads vary.' },
    ],
  },
  'gross-vehicle-weight': {
    term: 'Gross Vehicle Weight (GVW)',
    slug: 'gross-vehicle-weight',
    definition: 'The total weight of a vehicle including its load, fuel, driver, passengers, and all equipment.',
    extended: 'GVW is the key threshold for overweight permit requirements. The federal limit on US Interstate highways is 80,000 lbs GVW. Gross Vehicle Weight Rating (GVWR) is the manufacturer-specified maximum, while actual GVW is what determines permit needs. Axle weight distribution is equally important — the bridge formula limits weight per axle group to protect bridge infrastructure.',
    relatedTerms: ['bridge-formula','overweight-permit','superload'],
    seeAlso: [
      { label: 'Bridge Weight Calculator', href: '/tools/bridge-weight' },
      { label: 'Cost Calculator', href: '/tools/cost-calculator' },
    ],
    faqs: [
      { q: 'What is the difference between GVW and GVWR?', a: 'GVW is the actual current weight of the loaded vehicle. GVWR is the manufacturer-rated maximum safe operating weight.' },
    ],
  },
  'bridge-formula': {
    term: 'Bridge Formula',
    slug: 'bridge-formula',
    definition: 'A federal formula that limits the weight placed on any single axle or group of axles to prevent bridge damage.',
    extended: 'The Federal Bridge Formula (Bridge Formula B) calculates the maximum weight allowed based on axle spacing. The formula is: W = 500 × [(LN/(N-1)) + 12N + 36], where W is max weight in pounds, L is distance in feet between axle extremes, and N is number of axles. Violations can result in fines and denied permits.',
    relatedTerms: ['gross-vehicle-weight','overweight-permit','route-survey'],
    seeAlso: [
      { label: 'Bridge Weight Calculator', href: '/tools/bridge-weight' },
    ],
    faqs: [
      { q: 'Does the bridge formula apply to all roads?', a: 'The federal bridge formula applies to Interstate highways. State roads may have different limits.' },
    ],
  },
  'route-survey': {
    term: 'Route Survey',
    slug: 'route-survey',
    definition: 'A pre-move inspection of the planned transport route to identify obstructions, clearance issues, weight limits, and permit requirements.',
    extended: 'Route surveys are conducted by specialized operators who physically drive or inspect the planned corridor before the oversize load departs. They document bridge clearances, utility line heights, turning radius constraints, road surface conditions, and any obstructions requiring removal. A route survey report is required by many states for superloads and complex oversize moves.',
    relatedTerms: ['pilot-car','superload','height-pole','oversize-permit'],
    seeAlso: [
      { label: 'Find Operators', href: '/directory' },
      { label: 'Corridors Intelligence', href: '/corridors' },
    ],
    faqs: [
      { q: 'Is a route survey always required?', a: 'Route surveys are mandatory for superloads and complex moves. For standard oversize loads, they are best practice but not always required.' },
    ],
  },
  'divisible-load': {
    term: 'Divisible Load',
    slug: 'divisible-load',
    definition: 'A load that can be broken into smaller pieces without damage or destruction of its function. Divisible loads are generally ineligible for oversize permits.',
    extended: 'Regulators generally require that divisible loads be broken down to legal size before transport rather than issued oversize permits. Common divisible loads include gravel, lumber stacks, and palletized goods. If a load can physically be separated without destroying its utility, it is considered divisible.',
    relatedTerms: ['non-divisible-load','oversize-permit','oversize-load'],
    seeAlso: [
      { label: 'Permit Checker', href: '/tools/permit-checker' },
    ],
    faqs: [
      { q: 'Can I get an oversize permit for a divisible load?', a: 'Generally no. Most states require divisible loads to be reduced to legal dimensions rather than permitted.' },
    ],
  },
  'non-divisible-load': {
    term: 'Non-Divisible Load',
    slug: 'non-divisible-load',
    definition: 'A load that cannot be reduced in size without destroying its structural integrity or intended function — the primary basis for oversize permit eligibility.',
    extended: 'Non-divisible loads are the foundation of oversize permitting. Wind turbine blades, power transformers, crane booms, prefab building sections, and large industrial equipment are common examples. Because these loads cannot be disassembled for transport, states grant oversize permits allowing movement beyond standard legal limits.',
    relatedTerms: ['divisible-load','oversize-permit','superload','oversize-load'],
    seeAlso: [
      { label: 'Permit Checker', href: '/tools/permit-checker' },
      { label: 'Cost Calculator', href: '/tools/cost-calculator' },
    ],
    faqs: [
      { q: 'Who decides if a load is non-divisible?', a: 'The permit applicant must justify non-divisibility. States may audit or verify the claim, especially for borderline cases.' },
    ],
  },
  'single-trip-permit': {
    term: 'Single Trip Permit',
    slug: 'single-trip-permit',
    definition: 'An oversize or overweight permit authorizing one specific move along a defined route within a set time window.',
    extended: 'Single-trip permits specify the exact origin, destination, route, load dimensions, permitted travel hours, and escort requirements. They are the most common permit type for project cargo and infrequent oversize moves. Most states issue them within 24 hours for standard loads. The permit must be in the vehicle for the entire move and surrendered or reported as complete.',
    relatedTerms: ['annual-permit','oversize-permit','overweight-permit'],
    seeAlso: [
      { label: 'Permit Checker Tool', href: '/tools/permit-checker' },
      { label: 'State Requirements', href: '/escort-requirements' },
    ],
    faqs: [
      { q: 'Can I reuse a single-trip permit?', a: 'No. A single-trip permit is valid for one specific move only. Each trip requires a new permit.' },
    ],
  },
  'annual-permit': {
    term: 'Annual Permit',
    slug: 'annual-permit',
    definition: 'A blanket permit allowing repeated oversize or overweight movements throughout a state for one year without per-trip applications.',
    extended: 'Annual permits are ideal for operators who regularly move loads of consistent dimensions within a state. They are typically limited to specific dimension ranges (e.g., up to 14 feet wide) and exclude superloads. Annual permits significantly reduce administrative burden for high-frequency movers but still require compliance with all escort and movement rules.',
    relatedTerms: ['single-trip-permit','oversize-permit'],
    seeAlso: [
      { label: 'State Requirements', href: '/escort-requirements' },
      { label: 'Find Operators', href: '/directory' },
    ],
    faqs: [
      { q: 'Is an annual permit valid in all states?', a: 'No. Annual permits are issued per state and are only valid within that state\'s borders.' },
    ],
  },
  'corridor': {
    term: 'Corridor',
    slug: 'corridor',
    definition: 'A defined heavy haul transport route between two points, characterized by specific permit, escort, and infrastructure requirements.',
    extended: 'In the heavy haul industry, a corridor refers to a recurring transport lane — typically a major highway or freight route — where oversize loads move regularly. Haul Command tracks corridor-specific escort requirements, operator density, permit complexity, and historical pricing to give brokers and operators actionable route intelligence.',
    relatedTerms: ['pilot-car','route-survey','oversize-permit','escort-vehicle'],
    seeAlso: [
      { label: 'View All Corridors', href: '/corridors' },
      { label: 'Route Check Tool', href: '/route-check' },
    ],
    faqs: [
      { q: 'What makes a corridor different from a route?', a: 'A corridor is a recurring, named lane with documented requirements and operator coverage. A route is any specific path for a single move.' },
    ],
  },
  'lowboy': {
    term: 'Lowboy',
    slug: 'lowboy',
    definition: 'A trailer with an extremely low deck height designed to transport tall equipment such as cranes, bulldozers, and construction machinery while keeping overall load height within legal limits.',
    extended: 'Lowboy trailers (also called low-loaders or float trailers outside the US) have a deck height of 18–24 inches above the ground, compared to 48–52 inches for standard flatbeds. This extra clearance allows tall equipment to be transported within height permit limits. Some lowboys have removable goosenecks (RGN) to allow equipment to drive directly onto the trailer.',
    relatedTerms: ['flatbed','rgn','oversize-load','oversize-permit'],
    seeAlso: [
      { label: 'Find Heavy Haul Carriers', href: '/directory' },
      { label: 'Cost Calculator', href: '/tools/cost-calculator' },
    ],
    faqs: [
      { q: 'What is the deck height of a lowboy trailer?', a: 'Lowboy decks are typically 18–24 inches from the ground, allowing tall equipment transport within legal height limits.' },
    ],
  },
  'flatbed': {
    term: 'Flatbed',
    slug: 'flatbed',
    definition: 'An open-deck trailer without sides or a roof, used to transport oversized or irregularly shaped cargo that cannot fit in a standard enclosed trailer.',
    extended: 'Flatbed trailers are the workhorses of heavy haul transport. Standard flatbeds are 48–53 feet long with a deck height of about 48–52 inches. Step-deck and double-drop variants provide lower deck heights for taller cargo. Flatbeds are used for steel, lumber, construction materials, machinery, and equipment that requires crane loading.',
    relatedTerms: ['lowboy','rgn','oversize-load'],
    seeAlso: [
      { label: 'Find Carriers', href: '/directory' },
    ],
    faqs: [
      { q: 'What is the weight limit on a standard flatbed?', a: 'Standard flatbeds carry up to 48,000 lbs of cargo within the 80,000 lb GVW limit. Overweight permits allow more.' },
    ],
  },
  'rgn': {
    term: 'RGN (Removable Gooseneck)',
    slug: 'rgn',
    definition: 'A trailer type with a detachable front section (gooseneck) that lowers to the ground, allowing heavy equipment to drive directly onto the trailer deck.',
    extended: 'RGN trailers (also called removable gooseneck or hydraulic dovetail trailers) are the preferred choice for equipment that must be driven on and off rather than crane-loaded. Once the gooseneck is removed, the front of the trailer drops to ground level. They are commonly used for excavators, bulldozers, cranes, and military vehicles.',
    relatedTerms: ['lowboy','flatbed','oversize-load'],
    seeAlso: [
      { label: 'Find Carriers', href: '/directory' },
      { label: 'Cost Calculator', href: '/tools/cost-calculator' },
    ],
    faqs: [
      { q: 'What equipment uses an RGN trailer?', a: 'Excavators, large dozers, cranes, and any equipment that must drive onto the trailer rather than be crane-loaded.' },
    ],
  },
};

const TERM_SLUGS = Object.keys(TERMS);

export async function generateStaticParams() {
  return TERM_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TERMS[slug];
  if (!t) return { title: 'Term Not Found — Haul Command' };
  return {
    title: `${t.term} Definition — Heavy Haul Glossary | Haul Command`,
    description: t.definition,
    keywords: [t.term.toLowerCase(), 'heavy haul glossary', 'oversize load terminology', `what is ${t.term.toLowerCase()}`],
    alternates: { canonical: `https://haulcommand.com/glossary/${slug}` },
    openGraph: {
      title: `${t.term} — Heavy Haul Glossary`,
      description: t.definition,
      url: `https://haulcommand.com/glossary/${slug}`,
    },
  };
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TERMS[slug];
  if (!t) notFound();

  const gold = '#D4A844';

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTerm',
        name: t.term,
        description: t.definition,
        inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Heavy Haul Transport Glossary', url: 'https://haulcommand.com/glossary' },
        url: `https://haulcommand.com/glossary/${slug}`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: t.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
          { '@type': 'ListItem', position: 2, name: 'Glossary', item: 'https://haulcommand.com/glossary' },
          { '@type': 'ListItem', position: 3, name: t.term, item: `https://haulcommand.com/glossary/${slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main style={{ minHeight: '100vh', background: '#06080f', color: '#e5e7eb' }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ maxWidth: 860, margin: '0 auto', padding: '20px 20px 0', fontSize: 11, color: '#6b7280', display: 'flex', gap: 6, alignItems: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/glossary" style={{ color: '#6b7280', textDecoration: 'none' }}>Glossary</Link>
          <span>›</span>
          <span style={{ color: gold }}>{t.term}</span>
        </nav>

        {/* Hero */}
        <section style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(1.5rem,4vw,3rem) 20px 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.2)', borderRadius: 20, marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Definition</span>
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#f9fafb' }}>{t.term}</h1>
          <p style={{ margin: 0, fontSize: 18, color: '#d1d5db', lineHeight: 1.65, maxWidth: 700, borderLeft: `3px solid ${gold}`, paddingLeft: 16 }}>{t.definition}</p>
        </section>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 20px' }}>

          {/* Extended definition */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Full Definition</h2>
            <p style={{ fontSize: 15, color: '#9ca3af', lineHeight: 1.75, margin: 0 }}>{t.extended}</p>
          </section>

          {/* Related terms */}
          {t.relatedTerms.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Related Terms</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {t.relatedTerms.map(rt => (
                  <Link key={rt} href={`/glossary/${rt}`} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d5db', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    {TERMS[rt]?.term ?? rt}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* See also */}
          {t.seeAlso.length > 0 && (
            <section style={{ marginBottom: '2.5rem', padding: '1.25rem 1.5rem', background: 'rgba(212,168,68,0.05)', border: '1px solid rgba(212,168,68,0.15)', borderRadius: 14 }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Related Tools & Resources</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {t.seeAlso.map(s => (
                  <Link key={s.href} href={s.href} style={{ fontSize: 14, color: gold, fontWeight: 700, textDecoration: 'none' }}>→ {s.label}</Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQs */}
          {t.faqs.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {t.faqs.map((f, i) => (
                  <div key={i} style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>{f.q}</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.65 }}>{f.a}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Back to glossary */}
          <div style={{ marginBottom: '2rem' }}>
            <Link href="/glossary" style={{ fontSize: 13, color: gold, fontWeight: 700, textDecoration: 'none' }}>← Back to Full Glossary</Link>
          </div>

          {/* SEO equity strip */}
          <RelatedLinks pageType="glossary" heading={`Related tools and resources for ${t.term}`} />
        </div>
      </main>
    </>
  );
}
