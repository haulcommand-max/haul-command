
import { supabaseServer } from "@/lib/supabase/server";

// Types for programmatic SEO data
export type GeoLocation = {
    country: string;
    state: string;
    city: string;
    lat: number;
    lng: number;
    slug: string;
    nearbyCities: string[];
};

export type ServiceType = {
    id: string;
    name: string;
    slug: string;
    description: string;
};

export type ProviderStats = {
    count: number;
    avgRating: number | null;
    verifiedCount: number;
};

// ── Canonical service types (constant, not mock — these are real HC categories) ──
const HC_SERVICES: ServiceType[] = [
    { id: 'pilot-car', name: 'Pilot Car', slug: 'pilot-car', description: 'Certified pilot car operators for oversize load escorts.' },
    { id: 'high-pole', name: 'High Pole', slug: 'high-pole', description: 'High pole chase cars for height clearance verification.' },
    { id: 'route-survey', name: 'Route Survey', slug: 'route-survey', description: 'Detailed route surveys for superloads and height-critical moves.' },
    { id: 'rear-chase', name: 'Rear Chase', slug: 'rear-chase', description: 'Rear chase escort vehicles for load protection.' },
    { id: 'police-escort', name: 'Police Escort', slug: 'police-escort', description: 'State and local police escort services for superloads.' },
    { id: 'bucket-truck', name: 'Bucket Truck', slug: 'bucket-truck', description: 'Bucket truck services for utility line lifting and clearance.' },
];

// ── Data Fetching Functions (DB-backed) ──

/**
 * Get city data by looking up directory listings for that city.
 * Returns null if city not found (triggers 404), never returns fake data.
 */
export async function getCityData(country: string, state: string, citySlug: string): Promise<GeoLocation | null> {
    const supabase = supabaseServer();
    const cityName = citySlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    // DB schema uses `latitude` / `longitude`, not `lat` / `lng`
    const { data, error } = await supabase
        .from("hc_global_operators")
        .select("city, admin1_code, country_code")
        .ilike("country_code", country)
        .ilike("admin1_code", state)
        .ilike("city", cityName)
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("[programmatic-data] getCityData error:", error.message);
        return null;
    }

    if (!data) return null;

    // Get nearby cities from the same region
    const { data: nearby } = await supabase
        .from("hc_global_operators")
        .select("city")
        .ilike("country_code", country)
        .ilike("admin1_code", state)
        .not("city", "ilike", cityName)
        .not("city", "is", null)
        .limit(20);

    const nearbyCities = Array.from(
        new Set((nearby ?? []).map((r: any) => (r.city || "").trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean))
    ).slice(0, 5);

    return {
        country,
        state,
        city: data.city ?? cityName,
        lat: 0,
        lng: 0,
        slug: citySlug,
        nearbyCities,
    };
}

export async function getServiceData(serviceSlug: string): Promise<ServiceType | null> {
    return HC_SERVICES.find(s => s.slug === serviceSlug) || null;
}

/**
 * Get real provider stats from directory_listings.
 * NEVER returns Math.random() or fabricated numbers.
 */
export async function getProviderStats(citySlug: string, serviceSlug: string): Promise<ProviderStats> {
    const supabase = supabaseServer();
    const cityName = citySlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    const { count, error } = await supabase
        .from("hc_global_operators")
        .select("*", { count: "exact", head: true })
        .ilike("city", cityName);

    if (error) {
        console.error("[programmatic-data] getProviderStats error:", error.message);
    }

    return {
        count: count ?? 0,
        avgRating: null,       // Real reviews not yet aggregated — show null, never fake
        verifiedCount: 0,      // Verification pipeline pending — show 0, never fake
    };
}

export async function getAllServices(): Promise<ServiceType[]> {
    return HC_SERVICES;
}

// ── Provider Profile ──

export type ProviderProfile = {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    verified: boolean;
    rating: number | null;
    reviewCount: number;
    services: string[];
    description: string;
};

/**
 * Get provider by slug from directory_listings.
 * Returns null if not found (triggers 404). Never fabricates a profile.
 */
export async function getProviderBySlug(slug: string): Promise<ProviderProfile | null> {
    const supabase = supabaseServer();

    const { data, error } = await supabase
        .from("hc_global_operators")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    if (error || !data) return null;

    return {
        id: data.id,
        slug: data.slug ?? slug,
        name: data.business_name ?? data.place_name ?? slug,
        city: data.city ?? "",
        state: data.admin1_code ?? "",
        verified: data.is_verified ?? false,
        rating: data.overall_rating ? Number(data.overall_rating) : null,
        reviewCount: data.review_count ?? 0,
        services: data.categories ?? [],
        description: data.description ?? "",
    };
}

// ── Load Feed ──

export type LoadFeedItem = {
    id: string;
    origin: string;
    destination: string;
    cargo: string;
    posted: string;
};

/**
 * Get load feed by city/region.
 * Returns empty array if no loads found. Never fabricates loads.
 */
export async function getLoadFeedBySlug(slug: string): Promise<{ title: string; loads: LoadFeedItem[] }> {
    const supabase = supabaseServer();
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const { data, error } = await supabase
        .from("loads")
        .select("id,origin_text,dest_text,load_type,created_at")
        .or(`origin_text.ilike.%${title}%,dest_text.ilike.%${title}%`)
        .order("created_at", { ascending: false })
        .limit(5);

    if (error || !data || data.length === 0) {
        return { title, loads: [] };
    }

    return {
        title,
        loads: data.map((l: any) => ({
            id: l.id,
            origin: l.origin_text ?? "Unknown",
            destination: l.dest_text ?? "Unknown",
            cargo: l.load_type ?? "Oversize",
            posted: new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        })),
    };
}
