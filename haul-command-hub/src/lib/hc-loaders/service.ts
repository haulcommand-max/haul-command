import { COUNTRIES } from '@/lib/seo-countries';

export const SERVICE_REGISTRY = [
  { slug: 'pilot-car-services', label: 'Pilot Car Services', termKey: 'pilot_car' as const },
  { slug: 'escort-vehicle-services', label: 'Escort Vehicle Services', termKey: 'escort_vehicle' as const },
  { slug: 'oversize-load-escorts', label: 'Oversize Load Escorts', termKey: 'oversize_load' as const },
  { slug: 'wide-load-escorts', label: 'Wide Load Escorts', termKey: 'wide_load' as const },
  { slug: 'route-surveys', label: 'Route Surveys', termKey: 'route_survey' as const },
  { slug: 'height-pole-services', label: 'Height Pole Services', termKey: 'pilot_car' as const },
  { slug: 'superload-support', label: 'Superload Support', termKey: 'superload' as const },
  { slug: 'permit-routing-support', label: 'Permit & Routing Support', termKey: 'permit' as const },
] as const;

export function getServiceBySlug(slug: string) {
  return SERVICE_REGISTRY.find(s => s.slug === slug);
}

export function getLocalizedServiceName(serviceSlug: string, countrySlug: string): string {
  const service = getServiceBySlug(serviceSlug);
  const country = COUNTRIES.find(c => c.slug === countrySlug);
  if (!service || !country) return service?.label ?? serviceSlug;
  return country.terms[service.termKey] ?? service.label;
}

export function getAllServiceSlugs(): string[] {
  return SERVICE_REGISTRY.map(s => s.slug);
}
