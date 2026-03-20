/**
 * HC Platform Registry — The Alphabet Structure
 * 
 * Haul Command operates like Alphabet/Google:
 * One parent company, multiple verticals, each owning a rail.
 * Every dollar in the freight ecosystem flows through HC.
 * 
 * CANONICAL SOURCE OF TRUTH for:
 * - 8 HC Divisions (the Alphabet analogs)
 * - 8 Revenue Rails
 * - 57-Country Tier System
 * - Platform-wide constants
 */

import { HC_COUNTRY_TIERS, type CountryTier, type CountryEntry } from './hc-route/country-tiers';
import { HC_REVENUE_RAILS, type RevenueRail } from './hc-route/revenue-rails';

// ─── HC DIVISIONS (The Alphabet Structure) ────────────────────────────

export interface HCDivision {
  id: string;
  name: string;
  tagline: string;
  alphabetAnalog: string;
  description: string;
  revenueRails: string[];
  status: 'active' | 'beta' | 'planned';
}

export const HC_DIVISIONS: Record<string, HCDivision> = {
  'hc-track': {
    id: 'hc-track',
    name: 'HC Track',
    tagline: 'Every vehicle, everywhere',
    alphabetAnalog: 'Google Maps',
    description: 'GPS tracking and fleet visibility powered by Traccar. Real-time location, geofencing, telemetry for every vehicle in the HC ecosystem.',
    revenueRails: ['track-subscriptions'],
    status: 'planned',
  },
  'hc-load-marketplace': {
    id: 'hc-load-marketplace',
    name: 'HC Load Marketplace',
    tagline: 'The default for freight matching',
    alphabetAnalog: 'Google Search',
    description: 'Load board and freight matching engine. Operators find loads, brokers find carriers. HC is the default search engine for freight.',
    revenueRails: ['load-fees'],
    status: 'active',
  },
  'hc-adgrid': {
    id: 'hc-adgrid',
    name: 'HC AdGrid',
    tagline: 'Vendors pay to reach operators',
    alphabetAnalog: 'Google Ads',
    description: 'Contextual advertising network for the freight industry. Tire shops, insurance, fuel, parts — all bid for operator attention.',
    revenueRails: ['adgrid-revenue'],
    status: 'active',
  },
  'hc-pay': {
    id: 'hc-pay',
    name: 'HC Pay',
    tagline: 'Every transaction flows through Stripe',
    alphabetAnalog: 'Google Pay',
    description: 'Payment rails for every transaction in the HC ecosystem. Load payments, subscriptions, marketplace purchases, ad spend — all through Stripe.',
    revenueRails: ['load-fees'],
    status: 'active',
  },
  'hc-intelligence': {
    id: 'hc-intelligence',
    name: 'HC Intelligence',
    tagline: 'Data products and ML/AI on telemetry',
    alphabetAnalog: 'DeepMind',
    description: 'Data lake and intelligence layer. Rate prediction, demand forecasting, safety scoring, route optimization ML models. TimescaleDB on Supabase PostgreSQL.',
    revenueRails: ['data-intelligence'],
    status: 'planned',
  },
  'hc-developer-platform': {
    id: 'hc-developer-platform',
    name: 'HC Developer Platform',
    tagline: 'APIs others build on',
    alphabetAnalog: 'Google Cloud',
    description: 'Public REST APIs for tracking, loads, payments, routing. Third parties build on HC infrastructure and pay for access.',
    revenueRails: ['api-access-fees'],
    status: 'beta',
  },
  'hc-marketplace': {
    id: 'hc-marketplace',
    name: 'HC Marketplace',
    tagline: '30% clip on every extension',
    alphabetAnalog: 'Google Play Store',
    description: 'App store for freight. Third-party developers build extensions, integrations, and tools. HC takes 30% commission on every sale.',
    revenueRails: ['marketplace-commissions'],
    status: 'planned',
  },
  'hc-capital': {
    id: 'hc-capital',
    name: 'HC Capital',
    tagline: 'Finance operators, earn interest',
    alphabetAnalog: 'Google Ventures',
    description: 'Financing arm for operators. Equipment loans, factoring, working capital. HC earns interest on every dollar deployed.',
    revenueRails: ['capital-interest'],
    status: 'planned',
  },
} as const;

// ─── HC ROUTE (Net-New Division — Oversize Load Routing) ──────────────

export const HC_ROUTE = {
  id: 'hc-route',
  name: 'HC Route',
  tagline: 'Permit-aware oversize load routing',
  alphabetAnalog: 'Waze + PC*Miler killer',
  description: 'The only GPS routing engine purpose-built for oversized loads. Permit-aware, constraint-aware (bridge heights, road widths, weight limits), crowd-sourced hazard reporting. Built on GraphHopper + FHWA NBI + OpenStreetMap.',
  revenueRails: ['track-subscriptions'],
  status: 'planned' as const,
  techStack: {
    routingEngine: 'GraphHopper (Apache 2.0)',
    bridgeData: 'FHWA National Bridge Inventory (620K+ bridges)',
    mapData: 'OpenStreetMap (maxheight, maxweight, hgv tags)',
    crowdSourced: 'HC Waze (in-app hazard reporting)',
    wazeIntegration: 'Waze Connected Citizens Program (free data feed)',
    database: 'Supabase PostgreSQL + PostGIS',
    permitParser: 'OCR + LLM (permit PDF → GPS waypoints)',
  },
  dataSources: [
    { name: 'FHWA National Bridge Inventory', records: '620,000+', format: 'CSV', coverage: 'All US bridges', cost: 'Free' },
    { name: 'OpenStreetMap', records: 'Global', format: 'OSM PBF', coverage: 'Global', cost: 'Free' },
    { name: 'State DOT Data', records: 'Varies', format: 'APIs/GIS/PDFs', coverage: 'Per-state', cost: 'Free' },
    { name: 'Waze CCP Feed', records: 'Real-time', format: 'CIFS/JSON', coverage: 'US', cost: 'Free (partner program)' },
    { name: 'HC Crowd-Sourced', records: 'Growing', format: 'PostgreSQL', coverage: 'HC users', cost: 'Free (user-generated)' },
  ],
  competitors: [
    { name: 'Google Maps', gap: 'Zero truck awareness. No height/weight/width.' },
    { name: 'SmartTruckRoute', gap: 'No permit integration. No crowd-sourcing.' },
    { name: 'PC*Miler', gap: 'Expensive. Not mobile-first. No crowd-sourcing.' },
    { name: 'Oversize.IO', gap: 'Routing is basic. No real-time navigation.' },
    { name: 'ProMiles', gap: 'Limited state coverage. Not a full nav system.' },
  ],
} as const;

// ─── PLATFORM CONSTANTS ───────────────────────────────────────────────

export const HC_PLATFORM = {
  name: 'Haul Command',
  tagline: 'The Operating System for Freight',
  model: 'Start as the default (Uber model), scale as the parent company (Alphabet model)',
  totalDivisions: Object.keys(HC_DIVISIONS).length + 1, // +1 for HC Route
  totalRevenueRails: 8,
  totalCountries: 57,
  principles: [
    'Own the rails — no money leaves the ecosystem',
    'Default setting — like Uber, be the first choice',
    'Alphabet structure — each division owns a vertical',
    'Upgrade, never downgrade — every change makes the platform stronger',
    'Crowd-sourced intelligence — every user is a data source',
  ],
} as const;

// ─── RE-EXPORTS ───────────────────────────────────────────────────────

export { HC_COUNTRY_TIERS, HC_REVENUE_RAILS };
export type { CountryTier, CountryEntry, RevenueRail };
