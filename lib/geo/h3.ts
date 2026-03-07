import { latLngToCell } from "h3-js";

export type H3Res = 6 | 7 | 8 | 9 | 10;

export function toH3Cell(lat: number, lng: number, res: H3Res): string {
    // h3-js expects (lat, lng)
    return latLngToCell(lat, lng, res);
}

/**
 * Suggested strategy:
 * - Store at least one mid-resolution cell on core entities:
 *   operators.h3_r8, load_requests.h3_r8, incidents.h3_r8
 * - Optionally store multiple (r6..r10) for flexible aggregation.
 */
export function computeH3Bundle(lat: number, lng: number) {
    return {
        h3_r6: toH3Cell(lat, lng, 6),
        h3_r7: toH3Cell(lat, lng, 7),
        h3_r8: toH3Cell(lat, lng, 8),
        h3_r9: toH3Cell(lat, lng, 9),
        h3_r10: toH3Cell(lat, lng, 10),
    };
}
