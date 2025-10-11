import type { Coordinates, PointOfInterest, PoiCategory } from '../types.ts';
import { haversineDistance } from '../utils/geometry.ts';
import { getPoiCategory, POI_CATEGORIES } from '../constants.tsx';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

/**
 * Fetches Points of Interest (POIs) for all defined categories from the Overpass API.
 * @param center The center coordinates.
 * @param radius The search radius in meters.
 * @returns A promise that resolves to an array of all found POIs.
 */
export async function fetchAllPOIs(center: Coordinates, radius: number): Promise<PointOfInterest[]> {
  const allCategoryQueries = (Object.keys(POI_CATEGORIES) as PoiCategory[]).map((key) => {
    const tags = POI_CATEGORIES[key];
    
    // Use specific, optimized queries for transport types
    if (key === 'bus') {
      return `
        nwr["amenity"~"bus_station"](around:${radius},${center.lat},${center.lon});
        nwr["highway"~"bus_stop"](around:${radius},${center.lat},${center.lon});
      `;
    }
    if (key === 'train') {
       return `
        nwr["railway"~"^(station|stop|halt)$"](around:${radius},${center.lat},${center.lon});
        nwr["public_transport"~"^(station|stop_position)$"](around:${radius},${center.lat},${center.lon});
      `;
    }

    const tagQueries = Object.entries(tags).map(([tagKey, value]) => {
      if (value === true) {
        return `[~"^${tagKey}$"~"."]`; // Key exists (e.g., [shop])
      }
      return `["${tagKey}"="${value}"]`;
    }).join('');
    return `nwr${tagQueries}(around:${radius},${center.lat},${center.lon});`;
  }).join('\n');

  const query = `
    [out:json][timeout:60];
    (
      ${allCategoryQueries}
    );
    out center;
  `;

  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const seenIds = new Set();
    const pois: PointOfInterest[] = data.elements
      .map((element: any): PointOfInterest | null => {
        if (seenIds.has(element.id)) {
          return null; // Deduplicate results
        }
        seenIds.add(element.id);

        const coords = {
          lat: element.center?.lat ?? element.lat,
          lon: element.center?.lon ?? element.lon,
        };
        
        // Create a temporary POI to pass to the categorizer
        const tempPoi = {
          id: element.id,
          tags: element.tags || {},
          lat: coords.lat,
          lon: coords.lon,
          category: 'school' as PoiCategory, // Dummy category
        };
        
        const category = getPoiCategory(tempPoi);
        
        if (!category) return null; // Ignore if it doesn't fit a category

        return {
          ...tempPoi,
          category, // Assign the correct category
          distance: haversineDistance(center, coords),
        };
      })
      .filter((poi): poi is PointOfInterest => poi !== null && poi.lat != null && poi.lon != null);

    // Sort by distance
    pois.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return pois;
  } catch (error) {
    console.error("Error fetching POIs:", error);
    throw new Error("Failed to fetch data from OpenStreetMap.");
  }
}