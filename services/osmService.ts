import type { Coordinates, PointOfInterest, PoiCategory, HighwayExit } from '../types.ts';
import { POI_CATEGORIES, getPoiCategory } from '../constants.tsx';
import { haversineDistance } from '../utils/geometry.ts';

const PROXY_URL = 'https://corsproxy.io/?';
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Fetches Points of Interest (POIs) directly from the Overpass API.
 * @param center The center coordinates.
 * @param radius The search radius in meters.
 * @returns A promise that resolves to an array of all found POIs.
 */
export async function fetchAllPOIs(center: Coordinates, radius: number): Promise<PointOfInterest[]> {
  const { lat, lon } = center;

  const allCategoryQueries = (Object.keys(POI_CATEGORIES) as PoiCategory[]).map((key) => {
    const tags = POI_CATEGORIES[key];
    if (key === 'bus') return `nwr["amenity"~"bus_station"](around:${radius},${lat},${lon}); nwr["highway"~"bus_stop"](around:${radius},${lat},${lon});`;
    if (key === 'train') return `nwr["railway"~"^(station|stop|halt)$"](around:${radius},${lat},${lon}); nwr["public_transport"~"^(station|stop_position)$"](around:${radius},${lat},${lon});`;
    const tagQueries = Object.entries(tags).map(([k, v]) => v === true ? `[~"^${k}$"~"."]` : `["${k}"="${v}"]`).join('');
    return `nwr${tagQueries}(around:${radius},${lat},${lon});`;
  }).join('\n');

  const query = `[out:json][timeout:60];( ${allCategoryQueries} ); out center;`;

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
  const query = `[out:json][timeout:30];
    nwr["highway"="motorway_junction"](around:5000,${lat},${lon});
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