/**
 * WideLoadFriendlyFilter
 * A directory of verified gas, food, and lodging that can accommodate oversize loads.
 */

export interface LocationMetadata {
    id: string;
    name: string;
    type: 'FUEL' | 'FOOD' | 'LODGING';
    wideLoadVerified: boolean;
    maxCapacityInches: number;
    isFeatured: boolean;
}

export class WideLoadFriendlyFilter {
    /**
     * Filters locations based on the current load width.
     */
    filterByWidth(locations: LocationMetadata[], loadWidthInches: number): LocationMetadata[] {
        return locations.filter(loc =>
            !loc.wideLoadVerified || loc.maxCapacityInches >= loadWidthInches
        );
    }

    /**
     * Adds a premium "High Clearance" tag to locations that have been verified by drivers.
     */
    getFeaturedPin(location: LocationMetadata): string {
        return location.isFeatured ? "PREMIUM_OVERSIZE_STOP" : "STANDARD_STOP";
    }
}
