
import { DirectoryProfileRow } from "@/lib/data/directory";

export interface DriverProfileModel {
    slug: string;
    name: string;
    location: {
        city: string;
        state: string;
    };
    serviceArea: string[];
    stats: {
        rating: number;
        reviews: number;
        yearsInBusiness: number;
    };
    contact: {
        phone: string | null;
        website: string | null;
    };
    verification: {
        tier: string;
        badges: string[];
    };
    equipment: string[];
    description: string;
    images: {
        logo: string | null;
        cover: string | null;
    };
    metadata: {
        joinedAt: string;
        lastActiveAt?: string;
    };
}

export function mapDriverProfile(row: DirectoryProfileRow): DriverProfileModel {
    return {
        slug: row.slug,
        name: row.display_name,
        location: {
            city: row.city,
            state: row.state,
        },
        serviceArea: row.service_area_states || [],
        stats: {
            rating: row.avg_rating || 0,
            reviews: row.review_count || 0,
            yearsInBusiness: row.years_in_business || 0,
        },
        contact: {
            phone: row.public_phone,
            website: row.public_website,
        },
        verification: {
            tier: row.verified_tier || 'V0',
            badges: row.verification_badges || [],
        },
        equipment: row.equipment_tags || [],
        description: row.description || `Professional pilot car service based in ${row.city}, ${row.state}.`,
        images: {
            logo: row.logo_url,
            cover: row.cover_image_url,
        },
        metadata: {
            joinedAt: row.joined_at,
            // lastActiveAt: row.last_active_at, // If available in view
        },
    };
}
