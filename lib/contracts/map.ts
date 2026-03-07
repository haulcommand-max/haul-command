/**
 * Haul Command — Map Contract Types
 *
 * Shared types for Mapbox integration, API routes, and component contracts.
 */

export type BBox = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

export type GeoJSONFeatureCollection = {
    type: 'FeatureCollection';
    features: GeoJSONFeature[];
};

export type GeoJSONFeature = {
    type: 'Feature';
    geometry: {
        type: 'Point' | 'LineString';
        coordinates: number[] | number[][];
    };
    properties: Record<string, unknown>;
};

export type LoadRouteFeatureProps = {
    load_id: string;
    origin_label?: string;
    dest_label?: string;
    corridor_id?: string;
    value_band?: string;
    urgency?: string;
};

export type EscortPointFeatureProps = {
    user_id: string;
    occurred_at: string;
    accuracy_m?: number;
    speed_mps?: number;
    heading_deg?: number;
    is_moving?: boolean;
};
