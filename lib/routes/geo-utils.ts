/**
 * Heavy Haul Route Intelligence — Geo Utilities
 *
 * Distance calculations, point-to-line distance, bounding box helpers.
 * All distances in meters. All coordinates in WGS84 (lat/lng).
 */

const EARTH_RADIUS_M = 6_371_000;

/** Haversine distance between two points in meters */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Minimum distance from a point to a GeoJSON LineString in meters.
 * Used for route deviation detection.
 */
export function pointToLineDistance(
  pointLat: number, pointLng: number,
  lineCoords: number[][] // [[lng, lat], [lng, lat], ...]
): number {
  let minDist = Infinity;
  for (let i = 0; i < lineCoords.length - 1; i++) {
    const [aLng, aLat] = lineCoords[i];
    const [bLng, bLat] = lineCoords[i + 1];
    const dist = pointToSegmentDistance(pointLat, pointLng, aLat, aLng, bLat, bLng);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

/** Distance from a point to a line segment (great circle approximation) */
function pointToSegmentDistance(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  const ab = haversineDistance(aLat, aLng, bLat, bLng);
  if (ab < 1) return haversineDistance(pLat, pLng, aLat, aLng); // degenerate segment

  const ap = haversineDistance(aLat, aLng, pLat, pLng);
  const bp = haversineDistance(bLat, bLng, pLat, pLng);

  // Project point onto segment
  // Using cosine rule to find the projection distance
  const cosA = (ap * ap + ab * ab - bp * bp) / (2 * ap * ab);
  const projDist = ap * cosA;

  if (projDist < 0) return ap; // Before segment start
  if (projDist > ab) return bp; // After segment end

  // Perpendicular distance using area formula
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  return ap * sinA;
}

/** Get bounding box for a radius around a point */
export function getBoundingBox(
  lat: number, lng: number, radiusM: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((lat * Math.PI) / 180);
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

/**
 * Classify clearance margin risk level.
 * margin_m = clearance_m - load_height_m
 */
export function classifyClearanceRisk(
  marginM: number
): 'safe' | 'tight' | 'danger' | 'blocked' {
  if (marginM < 0) return 'blocked';
  if (marginM < 0.15) return 'danger';  // less than 6 inches
  if (marginM < 0.6) return 'tight';    // less than 2 feet
  return 'safe';
}

/** Convert feet to meters */
export function ftToM(ft: number): number { return ft * 0.3048; }
/** Convert meters to feet */
export function mToFt(m: number): number { return m / 0.3048; }
/** Convert kg to lbs */
export function kgToLbs(kg: number): number { return kg * 2.20462; }
/** Convert lbs to kg */
export function lbsToKg(lbs: number): number { return lbs / 2.20462; }

/**
 * Extract coordinates from GeoJSON geometry (LineString or MultiLineString)
 */
export function extractLineCoords(geojson: GeoJSON.Geometry): number[][] {
  if (geojson.type === 'LineString') {
    return geojson.coordinates;
  }
  if (geojson.type === 'MultiLineString') {
    return geojson.coordinates.flat();
  }
  return [];
}

/**
 * Sample points along a GeoJSON LineString at regular intervals.
 * Used to check clearances/restrictions near the route.
 */
export function sampleRoutePoints(
  lineCoords: number[][],
  intervalM: number = 500
): Array<{ lat: number; lng: number; distanceAlongM: number }> {
  const points: Array<{ lat: number; lng: number; distanceAlongM: number }> = [];
  let accumulated = 0;
  let nextSample = 0;

  points.push({ lat: lineCoords[0][1], lng: lineCoords[0][0], distanceAlongM: 0 });

  for (let i = 1; i < lineCoords.length; i++) {
    const segDist = haversineDistance(
      lineCoords[i - 1][1], lineCoords[i - 1][0],
      lineCoords[i][1], lineCoords[i][0]
    );

    while (nextSample <= accumulated + segDist) {
      const ratio = (nextSample - accumulated) / segDist;
      const lat = lineCoords[i - 1][1] + ratio * (lineCoords[i][1] - lineCoords[i - 1][1]);
      const lng = lineCoords[i - 1][0] + ratio * (lineCoords[i][0] - lineCoords[i - 1][0]);
      points.push({ lat, lng, distanceAlongM: nextSample });
      nextSample += intervalM;
    }
    accumulated += segDist;
  }

  // Always include endpoint
  const last = lineCoords[lineCoords.length - 1];
  points.push({ lat: last[1], lng: last[0], distanceAlongM: accumulated });

  return points;
}
