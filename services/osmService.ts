import type { Coordinates, PointOfInterest, PoiCategory, HighwayExit } from '../types.ts';
import { POI_CATEGORIES, getPoiCategory } from '../constants.tsx';
import { haversineDistance } from '../utils/geometry.ts';

const PROXY_URL = 'https://corsproxy.io/?';
const OVERPASS_API_URL = 'https://z.overpass-api.de/api/interpreter';

/**
 * Fetches Points of Interest (POIs) directly from the Overpass API.
 * @param center The center coordinates.
 * @param radius The search radius in meters.
 * @returns A promise that resolves to an array of all found POIs.
 */
export async function fetchAllPOIs(center: Coordinates, radius: number): Promise<PointOfInterest[]> {
  const { lat, lon } = center;

  const tagMap: Map<string, Set<string>> = new Map();
  const keyExistsSet: Set<string> = new Set();

  // Group all tag-value pairs from POI_CATEGORIES to build an efficient query
  Object.values(POI_CATEGORIES).forEach(tags => {
      Object.entries(tags).forEach(([key, value]) => {
          if (value === true) {
              keyExistsSet.add(key);
              return;
          }
          if (typeof value === 'string') {
              if (!tagMap.has(key)) {
                  tagMap.set(key, new Set());
              }
              tagMap.get(key)!.add(value);
          }
      });
  });

  const queryClauses: string[] = [];
  
  tagMap.forEach((values, key) => {
      const regex = Array.from(values).join('|');
      const containsRegexChars = /[?^${}()|[\]\\]/.test(regex);
      
      // If the values already form a complex regex (e.g., for trains), use it as is.
      // Otherwise, wrap simple values for an exact match.
      const finalRegex = containsRegexChars ? regex : `^(${regex})$`;
      queryClauses.push(`nwr["${key}"~"${finalRegex}"](around:${radius},${lat},${lon});`);
  });

  keyExistsSet.forEach((key) => {
      queryClauses.push(`nwr["${key}"](around:${radius},${lat},${lon});`);
  });

  const query = `[out:json][timeout:90];(\n  ${queryClauses.join('\n  ')}\n);\nout center;`;

  try {
    const response = await fetch(`${PROXY_URL}${OVERPASS_API_URL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const seenIds = new Set();
    
    const pois: PointOfInterest[] = data.elements.map((element: any): PointOfInterest | null => {
        if (seenIds.has(element.id)) return null;
        seenIds.add(element.id);

        const coords: Coordinates = { lat: element.center?.lat ?? element.lat, lon: element.center?.lon ?? element.lon };
        const tempPoi = { id: element.id, tags: element.tags || {}, lat: coords.lat, lon: coords.lon, category: 'school' as PoiCategory };
        const category = getPoiCategory(tempPoi);

        if (!category || !coords.lat || !coords.lon) return null;

        return { ...tempPoi, category, distance: haversineDistance(center, coords) };
    }).filter((poi): poi is PointOfInterest => poi !== null);

    pois.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return pois;

  } catch (error) {
    console.error("Error fetching POIs from Overpass API:", error);
    throw new Error("Failed to fetch data from OpenStreetMap.");
  }
}

/**
 * Fetches the two closest highway exits within a 5km radius.
 * @param center The center coordinates.
 * @returns A promise that resolves to an array of up to two highway exits.
 */
export async function fetchHighwayExits(center: Coordinates): Promise<HighwayExit[]> {
  const { lat, lon } = center;
  const query = `[out:json][timeout:90];
    node["highway"="motorway_junction"](around:5000,${lat},${lon});
    out center;`;

  try {
    const response = await fetch(`${PROXY_URL}${OVERPASS_API_URL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API request for exits failed with status ${response.status}`);
    }

    const data = await response.json();
    
    const exits: HighwayExit[] = data.elements.map((element: any): HighwayExit | null => {
        const name = element.tags?.name || element.tags?.ref;
        if (!name) return null;

        const coords: Coordinates = { lat: element.center?.lat ?? element.lat, lon: element.center?.lon ?? element.lon };
        if (!coords.lat || !coords.lon) return null;
        
        return {
            name,
            distance: haversineDistance(center, coords)
        };
    }).filter((exit): exit is HighwayExit => exit !== null);

    exits.sort((a, b) => a.distance - b.distance);
    return exits.slice(0, 2);

  } catch (error) {
    console.error("Error fetching highway exits from Overpass API:", error);
    // Return empty array on failure, not a critical error
    return [];
  }
}