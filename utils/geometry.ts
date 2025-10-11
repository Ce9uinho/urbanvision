
import type { Coordinates } from '../types.ts';

/**
 * Calculates the distance between two geographical coordinates using the Haversine formula.
 * @param coords1 The first set of coordinates.
 * @param coords2 The second set of coordinates.
 * @returns The distance in meters.
 */
export function haversineDistance(coords1: Coordinates, coords2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const lat1 = coords1.lat * Math.PI / 180; // φ, λ in radians
  const lat2 = coords2.lat * Math.PI / 180;
  const deltaLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const deltaLon = (coords2.lon - coords1.lon) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}
