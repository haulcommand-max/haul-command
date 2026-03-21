/**
 * Company listing types and seed data registry.
 * Used by /companies/[slug] pages for SSG.
 */

export interface CompanyListing {
  slug: string;
  company_name: string;
  company_type: 'autonomous' | 'broker' | 'fleet' | 'wind_energy' | 'mining' | 'heavy_haul';
  country_code: string;
  countries_operating: string[];
  website: string;
  description: string;
  hq_city: string;
  hq_country: string;
  estimated_annual_escorts: number;
  related_corridors: string[];
}

export const COMPANY_TYPE_LABELS: Record<string, string> = {
  autonomous: 'Autonomous Freight',
  broker: 'Freight Broker',
  fleet: 'Fleet Operator',
  wind_energy: 'Wind Energy',
  mining: 'Mining & Resources',
  heavy_haul: 'Heavy Haul & Transport',
};

export const COMPANY_TYPE_COLORS: Record<string, string> = {
  autonomous: '#8b5cf6',
  broker: '#3b82f6',
  fleet: '#10b981',
  wind_energy: '#06b6d4',
  mining: '#f59e0b',
  heavy_haul: '#C6923A',
};

export const COMPANIES: CompanyListing[] = [
  // Autonomous
  { slug: 'aurora-innovation', company_name: 'Aurora Innovation', company_type: 'autonomous', country_code: 'US', countries_operating: ['US'], website: 'https://aurora.tech', description: 'Self-driving technology company developing the Aurora Driver for trucks and ride-hailing.', hq_city: 'Pittsburgh', hq_country: 'US', estimated_annual_escorts: 2400, related_corridors: ['I-45 TX', 'I-20 TX', 'I-10 TX'] },
  { slug: 'waymo-via', company_name: 'Waymo Via', company_type: 'autonomous', country_code: 'US', countries_operating: ['US'], website: 'https://waymo.com', description: 'Alphabet subsidiary operating autonomous trucks on US highways.', hq_city: 'Mountain View', hq_country: 'US', estimated_annual_escorts: 3200, related_corridors: ['I-10 AZ', 'I-40 NM', 'I-10 TX'] },
  { slug: 'kodiak-robotics', company_name: 'Kodiak Robotics', company_type: 'autonomous', country_code: 'US', countries_operating: ['US'], website: 'https://kodiak.ai', description: 'Autonomous trucking company operating daily routes between Dallas and Houston.', hq_city: 'Mountain View', hq_country: 'US', estimated_annual_escorts: 1800, related_corridors: ['I-45 TX', 'I-35 TX', 'I-10 TX'] },
  { slug: 'plus-ai', company_name: 'Plus.ai', company_type: 'autonomous', country_code: 'US', countries_operating: ['US', 'CN'], website: 'https://plus.ai', description: 'Autonomous driving technology for long-haul trucks with PlusDrive system.', hq_city: 'Cupertino', hq_country: 'US', estimated_annual_escorts: 1200, related_corridors: ['I-80 CA', 'I-5 CA', 'I-10 CA'] },
  { slug: 'gatik', company_name: 'Gatik', company_type: 'autonomous', country_code: 'US', countries_operating: ['US', 'CA'], website: 'https://gatik.ai', description: 'B2B short-haul autonomous delivery for major retailers.', hq_city: 'Mountain View', hq_country: 'US', estimated_annual_escorts: 800, related_corridors: ['I-5 CA', 'AR corridors'] },
  { slug: 'einride', company_name: 'Einride', company_type: 'autonomous', country_code: 'SE', countries_operating: ['SE', 'US', 'DE', 'GB'], website: 'https://einride.tech', description: 'Swedish electric and autonomous freight technology company.', hq_city: 'Stockholm', hq_country: 'SE', estimated_annual_escorts: 1500, related_corridors: ['E4 SE', 'I-95 US', 'A2 DE'] },
  { slug: 'volvo-autonomous-solutions', company_name: 'Volvo Autonomous Solutions', company_type: 'autonomous', country_code: 'SE', countries_operating: ['SE', 'US', 'AU', 'NO'], website: 'https://www.volvoautonomoussolutions.com', description: 'Autonomous transport solutions for logistics, mining, and ports.', hq_city: 'Gothenburg', hq_country: 'SE', estimated_annual_escorts: 2000, related_corridors: ['E6 SE', 'I-70 US', 'Pacific Highway AU'] },
  { slug: 'daimler-truck-autonomous', company_name: 'Daimler Truck Autonomous', company_type: 'autonomous', country_code: 'DE', countries_operating: ['DE', 'US'], website: 'https://daimlertruck.com', description: 'Daimler Truck autonomous driving division developing SAE Level 4 trucks.', hq_city: 'Stuttgart', hq_country: 'DE', estimated_annual_escorts: 2800, related_corridors: ['A5 DE', 'I-45 TX', 'I-10 TX'] },
  { slug: 'torc-robotics', company_name: 'Torc Robotics', company_type: 'autonomous', country_code: 'US', countries_operating: ['US'], website: 'https://torc.ai', description: 'Daimler Truck subsidiary developing Level 4 self-driving trucks.', hq_city: 'Blacksburg', hq_country: 'US', estimated_annual_escorts: 1600, related_corridors: ['I-45 TX', 'I-35 TX', 'I-10 TX'] },
  { slug: 'locomation', company_name: 'Locomation', company_type: 'autonomous', country_code: 'US', countries_operating: ['US'], website: 'https://locomation.ai', description: 'Autonomous relay convoy trucking technology company.', hq_city: 'Pittsburgh', hq_country: 'US', estimated_annual_escorts: 900, related_corridors: ['I-76 PA', 'I-80 OH', 'I-70 IN'] },
  // Heavy Haul
  { slug: 'mammoet', company_name: 'Mammoet', company_type: 'heavy_haul', country_code: 'NL', countries_operating: ['NL', 'US', 'AU', 'AE', 'SA', 'BR', 'DE', 'GB', 'CA', 'MX'], website: 'https://mammoet.com', description: 'World\'s largest heavy lifting and transport company.', hq_city: 'Schiedam', hq_country: 'NL', estimated_annual_escorts: 8500, related_corridors: ['A15 NL', 'I-10 US', 'Pacific Highway AU'] },
  { slug: 'sarens', company_name: 'Sarens', company_type: 'heavy_haul', country_code: 'BE', countries_operating: ['BE', 'US', 'AU', 'AE', 'SA', 'NL', 'DE', 'FR', 'GB', 'IN'], website: 'https://sarens.com', description: 'Global leader in crane rental, heavy lifting, and engineered transport solutions.', hq_city: 'Wolvertem', hq_country: 'BE', estimated_annual_escorts: 6200, related_corridors: ['E40 BE', 'I-10 US', 'A1 DE'] },
  { slug: 'ale-heavylift', company_name: 'ALE Heavylift', company_type: 'heavy_haul', country_code: 'GB', countries_operating: ['GB', 'US', 'AU', 'AE', 'SA', 'NL', 'DE'], website: 'https://ale-heavylift.com', description: 'World leader in heavy lifting and transport, now part of Mammoet.', hq_city: 'Stafford', hq_country: 'GB', estimated_annual_escorts: 4800, related_corridors: ['M6 GB', 'A1 GB', 'I-10 US'] },
  { slug: 'vestas', company_name: 'Vestas', company_type: 'wind_energy', country_code: 'DK', countries_operating: ['DK', 'US', 'AU', 'DE', 'GB', 'ES', 'BR', 'IN', 'MX', 'SE'], website: 'https://vestas.com', description: 'World\'s largest manufacturer of wind turbines requiring extensive blade transport.', hq_city: 'Aarhus', hq_country: 'DK', estimated_annual_escorts: 15000, related_corridors: ['I-35 TX', 'I-40 OK', 'I-70 KS', 'A7 DE'] },
  { slug: 'ge-vernova', company_name: 'GE Vernova', company_type: 'wind_energy', country_code: 'US', countries_operating: ['US', 'CA', 'BR', 'AU', 'GB', 'FR', 'DE', 'IN'], website: 'https://gevernova.com', description: 'GE energy division manufacturing wind turbines requiring oversized blade transport.', hq_city: 'Cambridge', hq_country: 'US', estimated_annual_escorts: 12000, related_corridors: ['I-35 TX', 'I-70 CO', 'I-80 IA', 'I-90 SD'] },
  { slug: 'siemens-gamesa', company_name: 'Siemens Gamesa', company_type: 'wind_energy', country_code: 'ES', countries_operating: ['ES', 'US', 'GB', 'DE', 'DK', 'AU', 'BR', 'IN', 'MX'], website: 'https://siemensgamesa.com', description: 'Leading wind turbine manufacturer with global operations.', hq_city: 'Zamudio', hq_country: 'ES', estimated_annual_escorts: 11000, related_corridors: ['I-35 TX', 'A1 ES', 'M62 GB', 'A7 DE'] },
];

export function getCompanyBySlug(slug: string): CompanyListing | undefined {
  return COMPANIES.find(c => c.slug === slug);
}

export function getAllCompanySlugs(): string[] {
  return COMPANIES.map(c => c.slug);
}
