
import { SupabaseClient } from '@supabase/supabase-js';

// Types for our programmatic data
export type GeoLocation = {
    country: string;
    state: string; // Admin1
    city: string;
    lat: number;
    lng: number;
    slug: string;
    nearbyCities: string[]; // Slugs of nearby cities
};

export type ServiceType = {
    id: string;
    name: string;
    slug: string;
    description: string;
};

export type ProviderStats = {
    count: number;
    avgRating: number;
    verifiedCount: number;
};

// Mock Data for Initial Build
const MOCK_CITIES: Record<string, GeoLocation> = {
    'gainesville': {
        country: 'us',
        state: 'fl',
        city: 'Gainesville',
        lat: 29.6516,
        lng: -82.3248,
        slug: 'gainesville',
        nearbyCities: ['ocala', 'jacksonville', 'lake-city', 'palatka', 'starke']
    },
    'miami': {
        country: 'us',
        state: 'fl',
        city: 'Miami',
        lat: 25.7617,
        lng: -80.1918,
        slug: 'miami',
        nearbyCities: ['fort-lauderdale', 'hialeah', 'hollywood', 'homestead', 'west-palm-beach']
    },
    // Add more as needed for testing
};

const MOCK_SERVICES: ServiceType[] = [
    { id: '1', name: 'Pilot Car', slug: 'pilot-car', description: 'Certified pilot car operators for oversize load escorts.' },
    { id: '2', name: 'High Pole', slug: 'high-pole', description: 'High pole chase cars for height clearance verification.' },
    { id: '3', name: 'Route Survey', slug: 'route-survey', description: 'Detailed route surveys for superloads and height-critical moves.' },
];

// Data Fetching Functions (Can be swapped for Real DB calls later)

export async function getCityData(country: string, state: string, citySlug: string): Promise<GeoLocation | null> {
    // In a real app, this would query Supabase 'cities' table
    // For now, return mock data if it matches, or generate a generic one for testing "scale"
    const key = citySlug.toLowerCase();

    if (MOCK_CITIES[key]) {
        return MOCK_CITIES[key];
    }

    // Fallback for "Programmatic Scale" simulation - effectively "wildcard" matching for demo
    // In production, return null to 404
    return {
        country,
        state,
        city: citySlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        lat: 30.0, // Default mock
        lng: -82.0,
        slug: citySlug,
        nearbyCities: ['mock-city-1', 'mock-city-2', 'mock-city-3']
    };
}

export async function getServiceData(serviceSlug: string): Promise<ServiceType | null> {
    return MOCK_SERVICES.find(s => s.slug === serviceSlug) || null;
}

export async function getProviderStats(citySlug: string, serviceSlug: string): Promise<ProviderStats> {
    // Mock random stats for "Live Data" feel
    return {
        count: Math.floor(Math.random() * 50) + 5,
        avgRating: 4.5 + (Math.random() * 0.5),
        verifiedCount: Math.floor(Math.random() * 10) + 1
    };
}


export async function getAllServices(): Promise<ServiceType[]> {
    return MOCK_SERVICES;
}

// Mock Provider Data
export type ProviderProfile = {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    verified: boolean;
    rating: number;
    reviewCount: number;
    services: string[];
    description: string;
};

export async function getProviderBySlug(slug: string): Promise<ProviderProfile | null> {
    // Mock logic
    return {
        id: '123',
        slug,
        name: slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        city: 'Gainesville',
        state: 'FL',
        verified: true,
        rating: 4.9,
        reviewCount: 24,
        services: ['Pilot Car', 'High Pole'],
        description: 'Professional pilot car service with 10 years experience. High pole qualified and amber light certified.'
    };
}

// Mock Load Feed Data
export type LoadFeedItem = {
    id: string;
    origin: string;
    destination: string;
    cargo: string;
    posted: string;
};

export async function getLoadFeedBySlug(slug: string): Promise<{ title: string; loads: LoadFeedItem[] }> {
    // Mock logic based on slug
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
        title,
        loads: [
            { id: 'L1', origin: 'Miami, FL', destination: 'Atlanta, GA', cargo: 'Construction Equipment', posted: '2 hours ago' },
            { id: 'L2', origin: 'Jacksonville, FL', destination: 'Houston, TX', cargo: 'Oversize Pipe', posted: '4 hours ago' },
            { id: 'L3', origin: 'Orlando, FL', destination: 'Savannah, GA', cargo: 'Modular Home', posted: '5 hours ago' }
        ]
    };
}

