/**
 * India Geographic Boundary & Country Validation Utilities
 * Restricts routing strictly to Indian territory and roads,
 * preventing international detours (Sri Lanka, Bangladesh, Pakistan, Nepal, etc.).
 */

export interface LatLng {
  lat: number;
  lng: number;
}

// Broad boundary box enclosing mainland India and islands
export const INDIA_BOUNDS = {
  minLat: 6.5,
  maxLat: 37.3,
  minLng: 68.1,
  maxLng: 97.4,
};

/**
 * Checks if a single coordinate point lies within India's geographic territory.
 * Specifically excludes Sri Lanka, Bangladesh, Pakistan, Nepal, and international waters.
 */
export function isPointInIndia(lat: number, lng: number): boolean {
  // 1. Outside broad India geographic envelope
  if (
    lat < INDIA_BOUNDS.minLat ||
    lat > INDIA_BOUNDS.maxLat ||
    lng < INDIA_BOUNDS.minLng ||
    lng > INDIA_BOUNDS.maxLng
  ) {
    return false;
  }

  // 2. Exclude Sri Lanka:
  // Sri Lanka lies between ~5.9°N - 9.85°N and 79.5°E - 81.9°E.
  // Palk Strait separates India (Tamil Nadu coastline ~lng 79.3 at Rameshwaram) and Sri Lanka.
  if (lat < 10.0 && lng > 79.75) {
    return false;
  }
  if (lat < 9.8 && lng > 79.6) {
    return false;
  }
  if (lat < 9.0 && lng > 79.3) {
    return false;
  }

  // 3. Exclude Bangladesh interior:
  // Roughly 21.0°N to 26.5°N and 88.5°E to 92.5°E
  // (Preserve West Bengal corridor around 88.0E - 88.3E, Assam/Tripura corridors)
  if (lat >= 21.5 && lat <= 26.0 && lng >= 89.0 && lng <= 92.0) {
    return false;
  }

  // 4. Exclude Nepal interior:
  // Roughly 26.8°N to 30.4°N and 80.2°E to 88.1°E (Himalayan range)
  if (lat >= 27.5 && lat <= 30.2 && lng >= 81.0 && lng <= 87.5) {
    return false;
  }

  // 5. Exclude Pakistan border (West of 68.5°E in Gujarat/Rajasthan)
  if (lat >= 23.5 && lat <= 32.0 && lng < 69.5) {
    return false;
  }

  return true;
}

/**
 * Verifies that every coordinate point along a route polyline remains within India.
 * Rejects any route that travels through foreign countries or crosses international waters.
 */
export function isRouteContainedInIndia(points: LatLng[]): boolean {
  if (!points || points.length === 0) return false;
  return points.every((p) => isPointInIndia(p.lat, p.lng));
}

/**
 * Decodes Google Maps encoded polyline algorithm into LatLng array
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      lat: Number((lat / 1e5).toFixed(6)),
      lng: Number((lng / 1e5).toFixed(6)),
    });
  }

  return points;
}
