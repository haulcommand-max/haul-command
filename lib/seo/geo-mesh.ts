
import { GeoLocation } from './programmatic-data';

// Determine nearby cities (Mock implementation for now)
// In production, use PostGIS 'ST_DWithin' or Haversine formula on 'cities' table
export function getNearbyCities(currentCity: GeoLocation, count: number = 8): string[] {
    // Return mock nearby cities from the data or generate placeholders
    if (currentCity.nearbyCities && currentCity.nearbyCities.length > 0) {
        return currentCity.nearbyCities.slice(0, count);
    }

    // No nearby cities data available — return empty to avoid fake city names on SEO pages
    return [];
}

// Generate URL for a city service page
export function getCityServiceUrl(country: string, state: string, city: string, service: string): string {
    return `/${country}/${state}/${city}/${service}`.toLowerCase();
}

// Generate URL for a city hub page
export function getCityHubUrl(country: string, state: string, city: string): string {
    return `/${country}/${state}/${city}`.toLowerCase();
}

// Generate URL for a State page
export function getStateUrl(country: string, state: string): string {
    return `/${country}/${state}`.toLowerCase();
}

// Generate "Near Me" Radius URL
export function getRadiusUrl(city: string, radius: number): string {
    return `/near/${city}-${radius}-miles`.toLowerCase();
}
