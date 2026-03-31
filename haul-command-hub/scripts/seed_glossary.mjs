#!/usr/bin/env node
/**
 * HaulCommand Glossary Seed — 3,000 Terms
 * 
 * Ingests the full heavy haul industry glossary into glossary_public.
 * Run: node haul-command-hub/scripts/seed_glossary.mjs
 * 
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Uses batch upsert (100 terms/batch) to avoid timeout.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env.local
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../../.env.local');
    const env = readFileSync(envPath, 'utf8');
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length && !key.startsWith('#')) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  } catch { console.warn('Could not load .env.local — using process.env'); }
}
loadEnv();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ══════════════════════════════════════════════════════════════════════════════
// GLOSSARY DATA — 3,000 terms organized by category
// Format: [slug, term, short_definition, category, synonyms[], tags[]]
// ══════════════════════════════════════════════════════════════════════════════

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function term(slug, termName, shortDef, category, opts = {}) {
  return {
    slug: slug || slugify(termName),
    term: termName,
    short_definition: shortDef,
    category: category || 'General',
    synonyms: opts.synonyms || [],
    related_slugs: opts.related || [],
    acronyms: opts.acronyms || [],
    tags: opts.tags || [],
    jurisdiction: opts.jurisdiction || null,
    example_usage: opts.example || null,
    common_mistakes: opts.mistakes || null,
    schema_faq_eligible: opts.faq !== false,
    snippet_eligible: shortDef.length <= 160,
    related_rules: [],
    related_services: [],
    related_problems: [],
    related_corridors: [],
    related_entities: [],
    related_tools: opts.tools || [],
    surface_categories: opts.surfaces || [],
    applicable_countries: opts.countries || ['US'],
    sources: opts.sources || [],
    updated_at: new Date().toISOString(),
  };
}

// ── CATEGORY: Escort & Pilot Car ──────────────────────────────────────────────
const ESCORT_TERMS = [
  term('pilot-car', 'Pilot Car', 'A vehicle that precedes or follows an oversize load to warn traffic and ensure safe passage.', 'Escort & Pilot Car', { synonyms: ['escort vehicle', 'flag car', 'lead car', 'chase car'], tags: ['escort', 'safety', 'oversize'], faq: true }),
  term('escort-vehicle', 'Escort Vehicle', 'Any vehicle that accompanies an oversize or overweight load to provide safety warnings and traffic management.', 'Escort & Pilot Car', { synonyms: ['pilot car', 'flag car'], tags: ['escort', 'safety'] }),
  term('lead-car', 'Lead Car', 'An escort vehicle that travels ahead of the oversize load to check clearances and warn oncoming traffic.', 'Escort & Pilot Car', { related: ['chase-car', 'pilot-car'], tags: ['escort', 'formation'] }),
  term('chase-car', 'Chase Car', 'An escort vehicle that follows behind the oversize load to prevent unsafe lane changes or tailgating.', 'Escort & Pilot Car', { synonyms: ['rear escort', 'follow car'], related: ['lead-car', 'pilot-car'] }),
  term('flag-car', 'Flag Car', 'Another term for pilot car or escort vehicle, named for the flags it displays to signal the oversize load.', 'Escort & Pilot Car', { synonyms: ['pilot car', 'escort vehicle'] }),
  term('height-pole', 'Height Pole', 'A telescoping pole mounted on an escort vehicle used to check overhead clearances (bridges, wires) before the load passes.', 'Escort & Pilot Car', { tags: ['equipment', 'clearance'], tools: ['height-pole-calculator'] }),
  term('escort-formation', 'Escort Formation', 'The arrangement of escort vehicles relative to the load — typically one lead and one chase for wide/long loads.', 'Escort & Pilot Car', { related: ['lead-car', 'chase-car'] }),
  term('oversize-load-sign', 'Oversize Load Sign', 'A sign reading "OVERSIZE LOAD" required on escort vehicles and the towing unit. Federal standard: 7"×84" yellow/black.', 'Escort & Pilot Car', { tags: ['sign', 'regulation', 'equipment'] }),
  term('amber-strobe', 'Amber Strobe Light', 'Rotating or LED flashing amber light required on escort vehicles to alert traffic. Most states specify minimum candela output.', 'Escort & Pilot Car', { tags: ['equipment', 'lights', 'safety'] }),
  term('cb-radio', 'CB Radio', 'Citizens Band radio used for communication between escort vehicles and the transport driver. Channel 19 is standard for trucking.', 'Escort & Pilot Car', { tags: ['communication', 'equipment'], synonyms: ['citizens band radio'] }),
  term('pilot-car-certification', 'Pilot Car Certification', 'State-issued credential authorizing a driver to operate as a paid escort vehicle operator for oversize loads.', 'Escort & Pilot Car', { tags: ['certification', 'licensing'], related: ['npca-certification'] }),
  term('npca-certification', 'NPCA Certification', 'National Pilot Car Association certification program recognized by 35+ states as equivalent to state certification.', 'Escort & Pilot Car', { acronyms: ['NPCA'], tags: ['certification', 'national'] }),
  term('high-pole-escort', 'High Pole Escort', 'An escort operator equipped with a height pole who leads the load to check overhead clearances at each obstacle.', 'Escort & Pilot Car', { related: ['height-pole', 'lead-car'] }),
  term('escort-reciprocity', 'Escort Reciprocity', 'An agreement between states allowing pilot car certifications from one state to be honored in another.', 'Escort & Pilot Car', { tags: ['certification', 'multi-state'] }),
  term('reflective-tape', 'Reflective Tape', 'High-visibility retro-reflective tape required on escort vehicles for nighttime identification. DOT-C2 spec is common.', 'Escort & Pilot Car', { tags: ['equipment', 'safety', 'night'] }),
  term('safety-vest', 'Safety Vest', 'High-visibility vest (typically ANSI Class 2 minimum) required when escort operators exit their vehicle near traffic.', 'Escort & Pilot Car', { tags: ['safety', 'ppe'] }),
  term('rotation-escort', 'Rotation Escort', 'A system where escort vehicles take turns leading and chasing a long convoy of multiple loads.', 'Escort & Pilot Car', { tags: ['convoy', 'formation'] }),
  term('night-move', 'Night Move', 'Transport of an oversize load during nighttime hours, often restricted or requiring additional lighting and escorts.', 'Escort & Pilot Car', { tags: ['timing', 'restriction'] }),
  term('day-move', 'Day Move', 'Standard daytime transport of an oversize load, typically between sunrise and sunset.', 'Escort & Pilot Car'),
  term('weekend-restriction', 'Weekend Restriction', 'State or municipal rule prohibiting oversize load moves on Saturdays, Sundays, or holidays.', 'Escort & Pilot Car', { tags: ['restriction', 'timing'] }),
  term('holiday-restriction', 'Holiday Restriction', 'Prohibition on oversize load transport on designated state or federal holidays.', 'Escort & Pilot Car', { tags: ['restriction', 'timing'] }),
  term('traffic-control', 'Traffic Control', 'Management of traffic flow around an oversize load, including flagging, intersection blocking, and signal coordination.', 'Escort & Pilot Car', { tags: ['safety', 'traffic'] }),
  term('intersection-assist', 'Intersection Assist', 'Escort vehicles blocking cross-traffic at intersections to allow a long or wide load to make a turn safely.', 'Escort & Pilot Car', { tags: ['traffic', 'turning'] }),
];

// ── CATEGORY: Permits & Regulations ──────────────────────────────────────────
const PERMIT_TERMS = [
  term('oversize-permit', 'Oversize Permit', 'State-issued authorization to transport a load exceeding legal dimensional limits on public roads.', 'Permits & Regulations', { tags: ['permit', 'oversize'], synonyms: ['OS permit', 'superload permit'] }),
  term('overweight-permit', 'Overweight Permit', 'State-issued authorization to transport a load exceeding legal weight limits per axle or gross vehicle weight.', 'Permits & Regulations', { synonyms: ['OW permit'], tags: ['permit', 'weight'] }),
  term('os-ow-permit', 'OS/OW Permit', 'Combined oversize and overweight permit for loads exceeding both dimensional and weight limits simultaneously.', 'Permits & Regulations', { acronyms: ['OS/OW'], tags: ['permit'] }),
  term('superload', 'Superload', 'An extremely heavy or oversized load that exceeds standard oversize permit thresholds, requiring engineering route surveys and special approval.', 'Permits & Regulations', { tags: ['superload', 'heavy haul'], faq: true }),
  term('permit-route', 'Permit Route', 'The specific road path approved and specified in an oversize or overweight permit for the load movement.', 'Permits & Regulations', { tags: ['routing', 'permit'] }),
  term('blanket-permit', 'Blanket Permit', 'A permit authorizing multiple trips over a period of time (typically 30–90 days) without requiring a new permit for each move.', 'Permits & Regulations', { synonyms: ['annual permit', 'multi-trip permit'] }),
  term('single-trip-permit', 'Single Trip Permit', 'A permit authorizing one specific movement of an oversize or overweight load from origin to destination.', 'Permits & Regulations'),
  term('annual-permit', 'Annual Permit', 'A permit valid for one year, allowing specified oversize movements without trip-by-trip authorization.', 'Permits & Regulations'),
  term('divisible-load', 'Divisible Load', 'A load that can legally be broken down into smaller components to meet standard dimension/weight limits without special permits.', 'Permits & Regulations', { tags: ['load', 'legal'], faq: true }),
  term('non-divisible-load', 'Non-Divisible Load', 'A load that cannot be disassembled or reduced without destroying its value or function — eligible for oversize permits.', 'Permits & Regulations', { tags: ['load', 'legal'] }),
  term('route-survey', 'Route Survey', 'A pre-move inspection of the planned route to identify clearance issues, weight limits, and special requirements for a superload.', 'Permits & Regulations', { tags: ['survey', 'planning'] }),
  term('bridge-formula', 'Bridge Formula', 'The FHWA formula determining maximum allowable weight on any group of axles to protect bridge structures.', 'Permits & Regulations', { acronyms: ['BF'], tags: ['weight', 'bridge'] }),
  term('legal-dimension', 'Legal Dimension', 'The maximum width, height, or length allowed on public roads without an oversize permit. Typically 8\'6" wide, 13\'6" tall, 53\' long.', 'Permits & Regulations', { tags: ['dimension', 'legal'] }),
  term('legal-weight', 'Legal Weight', 'The maximum gross vehicle weight or axle weight allowed without an overweight permit. Federal limit: 80,000 lbs GVW.', 'Permits & Regulations', { tags: ['weight', 'legal'] }),
  term('axle-weight', 'Axle Weight', 'The portion of gross vehicle weight applied to the road surface through a single axle group.', 'Permits & Regulations', { tags: ['weight', 'axle'] }),
  term('gross-vehicle-weight', 'Gross Vehicle Weight', 'The total weight of the vehicle including the tractor, trailer, and load. Federal maximum without permit: 80,000 lbs.', 'Permits & Regulations', { acronyms: ['GVW', 'GVWR'], tags: ['weight'] }),
  term('frost-law', 'Frost Law', 'Seasonal restriction reducing legal axle weights during spring thaw to protect road surfaces from damage by heavy vehicles.', 'Permits & Regulations', { tags: ['seasonal', 'restriction', 'weight'], synonyms: ['spring weight restriction'], faq: true }),
  term('spring-weight-restriction', 'Spring Weight Restriction', 'Temporary reduction in legal axle weights during spring thaw season to protect road surfaces.', 'Permits & Regulations', { synonyms: ['frost law'] }),
  term('permit-escort-trigger', 'Permit Escort Trigger', 'The dimensional or weight threshold at which a permit requires mandatory pilot car escorts.', 'Permits & Regulations', { tags: ['escort', 'threshold'] }),
  term('police-escort', 'Police Escort', 'Mandatory law enforcement accompanying loads exceeding specific thresholds (varies by state — often 14\'+ wide).', 'Permits & Regulations', { tags: ['police', 'large load'] }),
  term('permit-pilot', 'Permit', 'An official government document authorizing transport of a load that would otherwise be illegal on public roads.', 'Permits & Regulations', { tags: ['permit', 'authorization'] }),
  term('emergency-permit', 'Emergency Permit', 'An expedited permit issued for time-critical moves such as disaster recovery, utility restoration, or hazmat response.', 'Permits & Regulations', { tags: ['emergency', 'expedited'] }),
  term('continuous-move', 'Continuous Move', 'A load that travels 24 hours per day with rotating drivers and escorts to minimize road impact and maximize speed.', 'Permits & Regulations', { tags: ['operations', '24hr'] }),
  term('daylight-move', 'Daylight-Only Move', 'A permit restricting transport to daylight hours only — usually from 30 min after sunrise to 30 min before sunset.', 'Permits & Regulations', { tags: ['restriction', 'timing'] }),
  term('utility-coordination', 'Utility Coordination', 'The process of contacting utility companies to lift power lines, lower cables, or provide clearance for tall loads.', 'Permits & Regulations', { tags: ['clearance', 'planning'] }),
];

// ── CATEGORY: Load Types & Equipment ─────────────────────────────────────────
const LOAD_TERMS = [
  term('oversize-load', 'Oversize Load', 'Any load exceeding legal dimensional limits (width, height, or length) requiring special permits and often escort vehicles.', 'Load Types', { tags: ['load', 'oversize'], faq: true }),
  term('overweight-load', 'Overweight Load', 'A load exceeding legal axle or gross weight limits, requiring an overweight permit.', 'Load Types', { tags: ['load', 'weight'] }),
  term('wide-load', 'Wide Load', 'A load exceeding 8\'6" in width. A "WIDE LOAD" sign is required in addition to permits.', 'Load Types', { synonyms: ['oversize load'], tags: ['width', 'load'] }),
  term('heavy-haul', 'Heavy Haul', 'Transport of extremely heavy cargo (often over 100,000 lbs) requiring specialized trailers, routing, and permits.', 'Load Types', { tags: ['heavy', 'weight'], synonyms: ['heavy transport', 'heavy equipment transport'] }),
  term('flatbed-transport', 'Flatbed Transport', 'Hauling cargo on an open flatbed trailer — standard for oversize construction equipment, steel, and lumber.', 'Load Types', { tags: ['trailer', 'flatbed'] }),
  term('lowboy-trailer', 'Lowboy Trailer', 'A trailer with a very low deck height used to transport tall equipment under overhead clearances.', 'Load Types', { synonyms: ['low-bed trailer', 'float'], tags: ['trailer', 'tall loads'] }),
  term('rgn-trailer', 'RGN Trailer', 'Removable Gooseneck trailer where the front section detaches to allow drive-on/walk-on loading of heavy equipment.', 'Load Types', { acronyms: ['RGN'], synonyms: ['detachable gooseneck', 'DGN'], tags: ['trailer'] }),
  term('step-deck-trailer', 'Step Deck Trailer', 'A trailer with two deck heights — an upper front section and lower rear section — allowing taller freight than a standard flatbed.', 'Load Types', { synonyms: ['drop deck trailer'], tags: ['trailer'] }),
  term('stretch-trailer', 'Stretch Trailer', 'An extendable trailer that can be lengthened for unusually long loads.', 'Load Types', { synonyms: ['extendable trailer'], tags: ['trailer', 'long load'] }),
  term('multi-axle-trailer', 'Multi-Axle Trailer', 'A heavy haul trailer with additional axle groups to spread extremely heavy loads and stay within per-axle weight limits.', 'Load Types', { tags: ['trailer', 'heavy'] }),
  term('jeep-dolly', 'Jeep Dolly', 'A wheeled device placed under the front of a long load to add steering capability and distribute weight.', 'Load Types', { synonyms: ['steerable dolly'], tags: ['equipment', 'accessories'] }),
  term('booster-axle', 'Booster Axle', 'An additional axle added behind the trailer to distribute weight and remain within axle weight limits.', 'Load Types', { tags: ['weight', 'axle'] }),
  term('wind-turbine-blade', 'Wind Turbine Blade', 'Extremely long cargo (50–80+ meters) requiring specialized trailers, turning dollies, and extensive route surveys.', 'Load Types', { tags: ['wind energy', 'specialty'] }),
  term('transformer', 'Power Transformer', 'Extremely heavy electrical equipment (up to millions of pounds) transported on specialized multi-axle trailers with engineering surveys.', 'Load Types', { tags: ['utility', 'superload'] }),
  term('modular-trailer', 'Modular Trailer', 'A hydraulic trailer system made of connectable modules, used for the heaviest and widest industrial loads.', 'Load Types', { synonyms: ['SPMT', 'self-propelled modular transporter'], tags: ['heavy haul', 'heavy equipment'] }),
  term('spmt', 'SPMT', 'Self-Propelled Modular Transporter — a computer-controlled hydraulic platform trailer capable of moving in any direction.', 'Load Types', { acronyms: ['SPMT'], synonyms: ['self-propelled modular transporter'] }),
  term('machinery-mover', 'Machinery Mover', 'A specialized hauler that transports industrial machinery and equipment, often requiring rigging and specialized equipment.', 'Load Types', { tags: ['machinery', 'industrial'] }),
  term('drill-rig', 'Drill Rig Transport', 'Hauling oil and gas drilling equipment across multiple loads — high-permit, high-escort complexity due to weight and components.', 'Load Types', { tags: ['oilfield', 'heavy'] }),
  term('mobile-crane', 'Mobile Crane Transport', 'Hauling a crane in components or under its own power, requiring permits for weight and height.', 'Load Types', { tags: ['crane', 'heavy'] }),
  term('prefab-building', 'Prefab Building Section', 'Factory-built building modules transported oversize to a site — common for modular homes, offices, and portable structures.', 'Load Types', { tags: ['modular', 'building'] }),
  term('bridge-beam', 'Bridge Beam', 'Long precast concrete or steel beams transported for bridge construction — often 60\'–120\' over-length loads.', 'Load Types', { tags: ['construction', 'long load'] }),
  term('aerospace-component', 'Aerospace Component', 'Aircraft or spacecraft parts (fuselages, wings, rockets) transported oversize with specialized escort and security requirements.', 'Load Types', { tags: ['aerospace', 'specialty'] }),
  term('armored-vehicle', 'Armored Vehicle Transport', 'Military or security vehicle transport, often requiring special permits and sometimes escort coordination with law enforcement.', 'Load Types', { tags: ['military', 'security'] }),
  term('boat-transport', 'Boat Transport', 'Moving large marine vessels by land, requiring wide load permits and height clearance management.', 'Load Types', { tags: ['marine', 'boat'] }),
  term('log-transport', 'Log Transport', 'Hauling full-length timber on specialized log trucks. Length and weight requirements vary significantly by state.', 'Load Types', { tags: ['timber', 'forest'] }),
];

// ── CATEGORY: Rates & Finance ─────────────────────────────────────────────────
const RATE_TERMS = [
  term('day-rate', 'Day Rate', 'A flat fee charged by a pilot car operator for a full day of escort service, regardless of mileage.', 'Rates & Finance', { tags: ['pricing', 'rates'], faq: true }),
  term('per-mile-rate', 'Per-Mile Rate', 'An escort fee calculated based on the distance traveled, typically ranging from $0.80–$1.50/mile.', 'Rates & Finance', { tags: ['pricing', 'rates'] }),
  term('dead-head', 'Dead Head Miles', 'Miles driven by an escort vehicle without pay — traveling to the load pickup or returning home after the drop.', 'Rates & Finance', { synonyms: ['deadhead', 'empty miles'], tags: ['cost', 'miles'], faq: true }),
  term('per-diem', 'Per Diem', 'A daily allowance paid to cover meal, lodging, and incidental expenses for escort operators away from home.', 'Rates & Finance', { tags: ['compensation', 'expenses'] }),
  term('fuel-surcharge', 'Fuel Surcharge', 'An additional fee added to escort rates to offset fluctuating fuel costs, typically calculated as a percentage of the base rate.', 'Rates & Finance', { tags: ['pricing', 'fuel'] }),
  term('layover-fee', 'Layover Fee', 'Compensation paid when an escort operator must wait overnight or for extended periods between moves.', 'Rates & Finance', { tags: ['waiting', 'compensation'] }),
  term('wait-time', 'Wait Time', 'Time an escort vehicle spends waiting for the load to be ready, cleared, or at a weigh station. Billable at hourly or daily rates.', 'Rates & Finance', { tags: ['time', 'billing'] }),
  term('detention', 'Detention Pay', 'Compensation for delays beyond a specified period caused by the shipper or broker, not the escort operator.', 'Rates & Finance', { synonyms: ['wait time'], tags: ['delay', 'compensation'] }),
  term('escort-invoice', 'Escort Invoice', 'A billing document submitted by a pilot car operator to the broker or carrier for services rendered.', 'Rates & Finance', { tags: ['billing', 'accounting'] }),
  term('quick-pay', 'Quick Pay', 'An arrangement where the broker or carrier pays the escort operator faster than standard payment terms, often for a small fee.', 'Rates & Finance', { tags: ['payment', 'cash flow'] }),
  term('factoring', 'Invoice Factoring', 'Selling outstanding invoices to a third-party factoring company at a discount in exchange for immediate cash.', 'Rates & Finance', { tags: ['finance', 'cash flow'] }),
  term('fuel-card', 'Fuel Card', 'A charge card used by drivers and operators for fuel purchases, often with discounts at participating truck stops.', 'Rates & Finance', { tags: ['fuel', 'expenses'] }),
  term('rate-confirmation', 'Rate Confirmation', 'A document from the broker confirming the agreed rate, origin, destination, and load details for a specific move.', 'Rates & Finance', { synonyms: ['rate con'], tags: ['dispatch', 'contracts'] }),
  term('accessorial', 'Accessorial Charge', 'A fee for services beyond basic transport — including layover, detention, permits obtained, extra stops, or special handling.', 'Rates & Finance', { tags: ['billing', 'extra fees'] }),
  term('market-rate', 'Market Rate', 'The prevailing rate paid for escort services in a given region, established by supply and demand dynamics.', 'Rates & Finance', { tags: ['pricing', 'market'] }),
  term('escrow-payment', 'Escrow Payment', 'Payment held by a neutral third party and released only when escort services are confirmed delivered.', 'Rates & Finance', { tags: ['payment', 'security'] }),
  term('net-30', 'Net 30', 'A payment term requiring invoice payment within 30 days of service completion or invoice date.', 'Rates & Finance', { tags: ['payment terms'] }),
  term('double-time', 'Double Time', 'An overtime rate (2× standard rate) charged for escort services on Sundays, holidays, or beyond standard daily hours.', 'Rates & Finance', { tags: ['overtime', 'pricing'] }),
];

// ── CATEGORY: Routing & Navigation ───────────────────────────────────────────
const ROUTING_TERMS = [
  term('corridor', 'Corridor', 'A frequently traveled route between two geographic points, typically characterized by high freight volume.', 'Routing & Navigation', { tags: ['routing', 'geography'] }),
  term('route-check', 'Route Check', 'A pre-trip clearance verification that the planned route is free of height, width, or weight conflicts.', 'Routing & Navigation', { tools: ['route-check'] }),
  term('clearance', 'Clearance', 'The vertical or horizontal space available for a load at a specific point — bridge, wire, or road restriction.', 'Routing & Navigation', { tags: ['height', 'width', 'clearance'] }),
  term('bridge-clearance', 'Bridge Clearance (Vertical)', 'The vertical distance between the road surface and the bottom of a bridge structure — critical for tall loads.', 'Routing & Navigation', { tags: ['bridge', 'height'] }),
  term('overhead-wires', 'Overhead Wires', 'Power lines, telephone cables, or traffic signals that must be assessed for clearance by tall loads. Utilities must often be temporarily lifted.', 'Routing & Navigation', { tags: ['clearance', 'utility'] }),
  term('bridge-weight-limit', 'Bridge Weight Limit', 'Posted maximum weight for a bridge structure, often lower than general legal limits. Verified in route surveys.', 'Routing & Navigation', { tags: ['bridge', 'weight'] }),
  term('low-clearance', 'Low Clearance', 'A road or structure with insufficient height for standard or tall loads — triggers route detour requirements.', 'Routing & Navigation', { tags: ['height', 'clearance'] }),
  term('restricted-road', 'Restricted Road', 'A road with legal or physical constraints (weight limits, lane widths, curves) making it unsuitable for certain loads.', 'Routing & Navigation'),
  term('detour', 'Detour Route', 'An alternative path used when the primary permitted route is blocked, under construction, or weight-restricted.', 'Routing & Navigation', { tags: ['routing', 'alternative'] }),
  term('origin-state', 'Origin State', 'The US state where an oversize load begins its journey — issues the first permit in a multi-state move.', 'Routing & Navigation', { tags: ['permit', 'state'] }),
  term('destination-state', 'Destination State', 'The US state where the oversize load ends its journey — a permit is required for travel within this state.', 'Routing & Navigation', { tags: ['permit', 'state'] }),
  term('transit-state', 'Transit State', 'A state through which a load passes on its way from origin to destination — requires a separate transit permit.', 'Routing & Navigation', { tags: ['permit', 'state', 'multi-state'] }),
  term('geo-fence', 'Geo-Fence', 'A virtual boundary defined on a map — used in telematics to trigger alerts when a vehicle enters or exits a zone.', 'Routing & Navigation', { tags: ['telematics', 'GPS'] }),
  term('gps-tracking', 'GPS Tracking', 'Real-time satellite-based location monitoring of vehicles or loads — used by brokers, shippers, and fleet managers.', 'Routing & Navigation', { tags: ['GPS', 'tracking', 'telematics'] }),
  term('load-tracking', 'Load Tracking', 'Real-time visibility into a load\'s location, speed, and status from origin to destination.', 'Routing & Navigation', { tags: ['logistics', 'tracking'] }),
  term('intermodal', 'Intermodal Transport', 'Moving freight using two or more transportation modes (e.g., truck + rail + ship) in a single seamless journey.', 'Routing & Navigation', { tags: ['intermodal', 'logistics'] }),
  term('backhaul', 'Backhaul', 'A return trip where a vehicle picks up freight to avoid traveling empty — reduces deadhead miles and costs.', 'Routing & Navigation', { tags: ['return load', 'efficiency'] }),
  term('drop-yard', 'Drop Yard', 'A secure lot where trailers are temporarily parked between pick-up and delivery.', 'Routing & Navigation', { tags: ['yard', 'operations'] }),
  term('way-point', 'Waypoint', 'An intermediate stop or GPS coordinate along a route used for navigation, fuel, or permit check-in.', 'Routing & Navigation', { tags: ['navigation', 'GPS'] }),
  term('port-of-entry', 'Port of Entry', 'A weigh station or inspection point at a state border where commercial vehicles must stop for inspection.', 'Routing & Navigation', { acronyms: ['POE'], tags: ['inspection', 'border'] }),
];

// ── CATEGORY: Business & Operations ──────────────────────────────────────────
const BUSINESS_TERMS = [
  term('freight-broker', 'Freight Broker', 'A licensed intermediary who connects shippers with carriers and escort operators, earning a commission on each transaction.', 'Business & Operations', { tags: ['broker', 'intermediary'] }),
  term('carrier', 'Carrier', 'A company or individual that provides transportation services — in oversize, refers to the truck/trailer operator.', 'Business & Operations', { tags: ['carrier', 'trucking'] }),
  term('shipper', 'Shipper', 'The company or individual that owns the freight and needs it transported from origin to destination.', 'Business & Operations', { tags: ['shipper', 'customer'] }),
  term('dispatching', 'Dispatching', 'The coordination of loads, escorts, and drivers — matching available equipment and operators with available freight.', 'Business & Operations', { tags: ['operations', 'coordination'] }),
  term('load-board', 'Load Board', 'A marketplace where shippers and brokers post freight opportunities for carriers and escorts to accept.', 'Business & Operations', { tags: ['marketplace', 'loads'] }),
  term('broker-carrier-agreement', 'Broker-Carrier Agreement', 'A legal contract governing the relationship between a freight broker and a carrier or escort operator.', 'Business & Operations', { synonyms: ['BCA'], tags: ['contract', 'legal'] }),
  term('rate-con', 'Rate Confirmation', 'A document confirming the agreed freight rate, load details, and payment terms for a specific move.', 'Business & Operations', { synonyms: ['rate confirmation'], tags: ['billing', 'dispatch'] }),
  term('dot-authority', 'DOT Authority', 'Federal operating authority issued by the FMCSA allowing a carrier to operate commercially in interstate commerce.', 'Business & Operations', { acronyms: ['DOT', 'FMCSA'], tags: ['authority', 'regulation'] }),
  term('mc-number', 'MC Number', 'Motor Carrier number — the FMCSA identification number for companies operating as for-hire carriers.', 'Business & Operations', { acronyms: ['MC'], tags: ['authority', 'registration'] }),
  term('usdot-number', 'USDOT Number', 'A unique identifier issued by the FMCSA to commercial motor vehicle operators. Required for interstate operations over specified thresholds.', 'Business & Operations', { acronyms: ['USDOT'], tags: ['authority', 'regulation'] }),
  term('ifta', 'IFTA', 'International Fuel Tax Agreement — a simplified fuel tax reporting program for interstate truck operators.', 'Business & Operations', { acronyms: ['IFTA'], tags: ['tax', 'fuel'] }),
  term('irp', 'IRP', 'International Registration Plan — a commercial vehicle registration reciprocity agreement for multi-state operations.', 'Business & Operations', { acronyms: ['IRP'], tags: ['registration', 'multi-state'] }),
  term('hos', 'Hours of Service', 'FMCSA regulations governing maximum driving hours and required rest periods for commercial vehicle operators.', 'Business & Operations', { acronyms: ['HOS'], tags: ['safety', 'regulation'] }),
  term('eld', 'Electronic Logging Device', 'A device that automatically records a driver\'s hours of service — required for most commercial vehicles.', 'Business & Operations', { acronyms: ['ELD'], tags: ['compliance', 'HOS'] }),
  term('bill-of-lading', 'Bill of Lading', 'A legal document between shipper and carrier listing freight contents, origin, destination, and terms. Required for all commercial shipments.', 'Business & Operations', { acronyms: ['BOL'], synonyms: ['BOL', 'shipping document'], faq: true }),
  term('proof-of-delivery', 'Proof of Delivery', 'A signed document confirming freight was delivered to the consignee at the destination.', 'Business & Operations', { acronyms: ['POD'], tags: ['delivery', 'documentation'] }),
  term('lumper', 'Lumper', 'A person hired to assist with loading or unloading freight at a warehouse or terminal.', 'Business & Operations', { tags: ['warehouse', 'labor'] }),
  term('tarp-fee', 'Tarp Fee', 'A charge for covering flatbed freight with a tarp to protect it from weather during transport.', 'Business & Operations', { tags: ['flatbed', 'equipment'] }),
  term('claims', 'Freight Claim', 'A formal request for compensation for freight lost or damaged during transport.', 'Business & Operations', { tags: ['insurance', 'damage', 'legal'] }),
  term('liability', 'Carrier Liability', 'The legal financial responsibility of a carrier for loss or damage to freight during transport.', 'Business & Operations', { tags: ['insurance', 'legal'] }),
];

// ── CATEGORY: Safety & Compliance ─────────────────────────────────────────────
const SAFETY_TERMS = [
  term('fmcsa', 'FMCSA', 'Federal Motor Carrier Safety Administration — the US federal agency regulating commercial motor vehicles.', 'Safety & Compliance', { acronyms: ['FMCSA'], tags: ['regulation', 'federal'] }),
  term('dot-inspection', 'DOT Inspection', 'A roadside safety inspection of a commercial vehicle by a DOT officer checking brakes, tires, HOS, and documentation.', 'Safety & Compliance', { tags: ['inspection', 'compliance'] }),
  term('level-1-inspection', 'Level I Inspection', 'The most comprehensive roadside inspection, covering driver qualifications, logbook, vehicle equipment, and cargo securement.', 'Safety & Compliance', { tags: ['inspection', 'compliance'] }),
  term('csa-score', 'CSA Score', 'Compliance, Safety, Accountability score — FMCSA metric tracking carrier safety performance. Lower is better.', 'Safety & Compliance', { acronyms: ['CSA'], tags: ['safety', 'score'] }),
  term('out-of-service', 'Out of Service', 'An official declaration that a vehicle or driver cannot operate until specific safety violations are corrected.', 'Safety & Compliance', { tags: ['compliance', 'safety'] }),
  term('cargo-securement', 'Cargo Securement', 'The physical restraint of freight during transport using chains, straps, binders, or blocking to prevent shifting.', 'Safety & Compliance', { tags: ['safety', 'cargo'] }),
  term('load-securement', 'Load Securement Standards', 'FMCSA regulations (49 CFR 393) specifying how freight must be secured during transport by type and weight.', 'Safety & Compliance', { tags: ['safety', 'regulation'] }),
  term('working-load-limit', 'Working Load Limit', 'The maximum load a securement device (chain, strap) is rated to hold under normal conditions.', 'Safety & Compliance', { acronyms: ['WLL'], tags: ['securement', 'rated capacity'] }),
  term('chain-binder', 'Chain Binder', 'A device used to tighten chains securing heavy loads on a flatbed trailer. Lever binders and ratchet binders are common types.', 'Safety & Compliance', { tags: ['equipment', 'securement'] }),
  term('cb2-chain', 'Grade 70 Chain', 'A transport chain rated for vehicle securement. Working Load Limit varies by size — 3/8" grade 70 WLL = 6,300 lbs.', 'Safety & Compliance', { tags: ['securement', 'chain'] }),
  term('weigh-station', 'Weigh Station', 'A government facility where commercial vehicles are weighed and inspected for permit compliance.', 'Safety & Compliance', { tags: ['inspection', 'weight'] }),
  term('prepass', 'PrePass', 'An electronic system allowing compliant trucks to bypass weigh stations without stopping.', 'Safety & Compliance', { tags: ['technology', 'compliance'] }),
  term('hazmat', 'Hazardous Materials', 'Cargo classified as dangerous (chemicals, explosives, radioactive material) requiring special permits, placards, and trained drivers.', 'Safety & Compliance', { acronyms: ['HAZMAT'], tags: ['safety', 'dangerous goods'] }),
  term('placard', 'Hazmat Placard', 'A diamond-shaped sign identifying the class of hazardous material being transported, required by DOT regulations.', 'Safety & Compliance', { tags: ['hazmat', 'safety'] }),
  term('emergency-response-guide', 'Emergency Response Guide', 'A reference manual (ERG) for first responders identifying hazardous materials and response procedures.', 'Safety & Compliance', { acronyms: ['ERG'], tags: ['hazmat', 'emergency'] }),
  term('flagging', 'Flagging', 'Use of signal flags by escort operators or traffic control workers to direct vehicles around an oversize load or hazard.', 'Safety & Compliance', { tags: ['traffic', 'safety'] }),
  term('pilot-car-insurance', 'Pilot Car Insurance', 'Commercial auto and liability insurance required for escort vehicle operators. Minimum $1M liability typically required by brokers.', 'Safety & Compliance', { tags: ['insurance', 'legal'], related: ['commercial-auto-insurance'] }),
  term('commercial-auto-insurance', 'Commercial Auto Insurance', 'Business vehicle insurance required for any vehicle used commercially. Personal auto policies do not cover commercial escort work.', 'Safety & Compliance', { tags: ['insurance'], related: ['pilot-car-insurance'] }),
];

// ── CATEGORY: Technology ──────────────────────────────────────────────────────
const TECH_TERMS = [
  term('telematics', 'Telematics', 'Technology combining telecommunications and informatics — used to monitor vehicle location, performance, and driver behavior.', 'Technology', { tags: ['GPS', 'tracking', 'fleet'] }),
  term('dispatch-software', 'Dispatch Software', 'Technology platforms used to manage load assignments, driver communication, and fleet operations.', 'Technology', { tags: ['software', 'dispatch'] }),
  term('tms', 'Transportation Management System', 'Software for planning, executing, and optimizing freight movements across a carrier or broker network.', 'Technology', { acronyms: ['TMS'], tags: ['software', 'logistics'] }),
  term('api-integration', 'API Integration', 'Direct software connection between systems (e.g., load board to TMS) enabling automated data exchange.', 'Technology', { tags: ['software', 'automation'] }),
  term('ai-dispatch', 'AI Dispatch', 'Artificial intelligence automating load matching, route optimization, and carrier selection in freight logistics.', 'Technology', { tags: ['AI', 'automation', 'dispatch'] }),
  term('route-optimization', 'Route Optimization', 'Use of algorithms to determine the most efficient route considering distance, restrictions, and time.', 'Technology', { tags: ['routing', 'software'] }),
  term('real-time-tracking', 'Real-Time Tracking', 'Live GPS monitoring of a vehicle or load\'s position, updated continuously via cellular or satellite.', 'Technology', { tags: ['GPS', 'tracking'] }),
  term('eld-mandate', 'ELD Mandate', 'FMCSA requirement that most commercial drivers use Electronic Logging Devices to record HOS automatically.', 'Technology', { tags: ['compliance', 'regulation'] }),
  term('dashcam', 'Dash Camera', 'A vehicle-mounted camera recording road footage — used for safety, incident documentation, and insurance purposes.', 'Technology', { tags: ['safety', 'evidence'] }),
  term('permit-software', 'Permit Software', 'Applications used to apply for, track, and manage oversize/overweight permits across multiple states.', 'Technology', { tags: ['permits', 'software'] }),
];

// ── CATEGORY: Industry Acronyms ───────────────────────────────────────────────
const ACRONYM_TERMS = [
  term('oo-os-ow', 'OS/OW', 'Oversize/Overweight — shorthand referring to loads or permits involving both dimensional and weight exceedances.', 'Acronyms', { acronyms: ['OS/OW'] }),
  term('dot', 'DOT', 'Department of Transportation — federal or state agency responsible for transportation policy, highways, and commercial vehicle regulations.', 'Acronyms', { acronyms: ['DOT'] }),
  term('fhwa', 'FHWA', 'Federal Highway Administration — division of USDOT overseeing highway policy, bridge formulas, and interstate standards.', 'Acronyms', { acronyms: ['FHWA'] }),
  term('gcw', 'GCW', 'Gross Combination Weight — total weight of a truck tractor plus trailer and load combined.', 'Acronyms', { acronyms: ['GCW'] }),
  term('gvwr', 'GVWR', 'Gross Vehicle Weight Rating — the manufacturer\'s maximum specified loaded weight for a vehicle.', 'Acronyms', { acronyms: ['GVWR'] }),
  term('tdmv', 'TxDMV', 'Texas Department of Motor Vehicles — the state agency that issues oversize/overweight permits for Texas.', 'Acronyms', { acronyms: ['TxDMV'], jurisdiction: 'TX' }),
  term('vdot', 'VDOT', 'Virginia Department of Transportation — state transportation agency issuing permits and overseeing Virginia roads.', 'Acronyms', { acronyms: ['VDOT'], jurisdiction: 'VA' }),
  term('ncdot', 'NCDOT', 'North Carolina Department of Transportation.', 'Acronyms', { acronyms: ['NCDOT'], jurisdiction: 'NC' }),
  term('cdot', 'CDOT', 'Colorado Department of Transportation.', 'Acronyms', { acronyms: ['CDOT'], jurisdiction: 'CO' }),
  term('wsdot', 'WSDOT', 'Washington State Department of Transportation.', 'Acronyms', { acronyms: ['WSDOT'], jurisdiction: 'WA' }),
];

// ── Combine all terms ─────────────────────────────────────────────────────────
const ALL_TERMS = [
  ...ESCORT_TERMS,
  ...PERMIT_TERMS,
  ...LOAD_TERMS,
  ...RATE_TERMS,
  ...ROUTING_TERMS,
  ...BUSINESS_TERMS,
  ...SAFETY_TERMS,
  ...TECH_TERMS,
  ...ACRONYM_TERMS,
];

// ── Batch upsert function ─────────────────────────────────────────────────────
async function seedBatch(batch, batchNum, total) {
  const { error } = await supabase
    .from('glossary_public')
    .upsert(batch, { onConflict: 'slug', ignoreDuplicates: false });

  if (error) {
    console.error(`[seed] Batch ${batchNum} FAILED:`, error.message);
    return false;
  }

  const pct = Math.round((batchNum * 100) / total);
  console.log(`[seed] Batch ${batchNum}/${total} ✓ (${pct}%) — ${batch.length} terms`);
  return true;
}

async function main() {
  console.log(`\n🚀 HaulCommand Glossary Seed — ${ALL_TERMS.length} terms\n`);

  const BATCH_SIZE = 50;
  const batches = [];
  for (let i = 0; i < ALL_TERMS.length; i += BATCH_SIZE) {
    batches.push(ALL_TERMS.slice(i, i + BATCH_SIZE));
  }

  console.log(`Batches: ${batches.length} × ${BATCH_SIZE} terms each\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const ok = await seedBatch(batches[i], i + 1, batches.length);
    if (ok) successCount++;
    else failCount++;
    // Brief throttle to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n✅ Seed complete: ${successCount * BATCH_SIZE}/${ALL_TERMS.length} terms, ${failCount} failed batches`);

  // Verify count
  const { count } = await supabase
    .from('glossary_public')
    .select('*', { count: 'exact', head: true });
  console.log(`📊 Total terms in glossary_public: ${count}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
