
import { normalizeSlug, normalizeCity } from './slug-helper';

/**
 * Module 2: Canonical URL Builder
 * Purpose: Centralized logic for generating the "One True URL" for any entity.
 * Prevents logic drift between sitemaps, frontend, and schema.
 */

const DOMAIN = 'https://haulcommand.com';

export const Canonical = {
    // Geo Hubs
    country: (country: string) =>
        `${DOMAIN}/${normalizeSlug(country)}`,

    state: (country: string, state: string) =>
        `${DOMAIN}/${normalizeSlug(country)}/${normalizeSlug(state)}`,

    city: (country: string, state: string, city: string) =>
        `${DOMAIN}/${normalizeSlug(country)}/${normalizeSlug(state)}/${normalizeCity(city, 'geo')}`,

    // Content Pages
    cityService: (country: string, state: string, city: string, service: string) =>
        `${DOMAIN}/${normalizeSlug(country)}/${normalizeSlug(state)}/${normalizeCity(city, 'geo')}/${normalizeSlug(service)}`,

    radius: (city: string, radiusMiles: number) =>
        `${DOMAIN}/near/${normalizeCity(city, 'geo')}-${radiusMiles}-miles`,

    // Entities
    provider: (slug: string) =>
        `${DOMAIN}/providers/${normalizeSlug(slug)}`,

    load: (id: string) =>
        `${DOMAIN}/loads/${id}`,

    serviceVertical: (slug: string) =>
        `${DOMAIN}/services/${normalizeSlug(slug)}`,

    corridor: (slug: string) =>
        `${DOMAIN}/corridor/${normalizeSlug(slug)}`,
};
