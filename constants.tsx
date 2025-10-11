import type { PoiCategory, PointOfInterest } from './types.ts';

// Fix: Consolidate POI categories, replacing 'transport' with 'bus' and 'train' for consistency.
export const POI_CATEGORIES: Record<PoiCategory, { [key: string]: string | boolean }> = {
  school: { amenity: 'school' },
  cafe: { amenity: 'cafe' },
  restaurant: { amenity: 'restaurant' },
  park: { leisure: 'park' },
  bus: {
    amenity: 'bus_station',
    highway: 'bus_stop',
  },
  train: {
    railway: 'station',
    public_transport: 'station',
  },
  shop: { shop: true }, // Any shop
  hospital: { amenity: 'hospital' },
};

// Fix: Update POI categorization logic to return 'bus' or 'train' instead of a generic 'transport' category.
export function getPoiCategory(poi: PointOfInterest): PoiCategory | null {
  const tags = poi.tags;
  // Ordered check for more specific categories first if needed
  if (tags.amenity === 'hospital') return 'hospital';
  if (tags.amenity === 'school') return 'school';
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.leisure === 'park') return 'park';
  if (tags.shop) return 'shop';
  // Specific transport checks
  if (
    tags.amenity === 'bus_station' ||
    tags.highway === 'bus_stop'
  ) {
    return 'bus';
  }
  if (
    ['station', 'stop', 'halt'].includes(tags.railway) ||
    ['station', 'stop_position'].includes(tags.public_transport)
  ) {
    return 'train';
  }
  return null;
}

// Fix: Update icons to match the 'bus' and 'train' categories.
export const POI_CATEGORY_ICONS: Record<PoiCategory, string> = {
  school: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-white p-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 8.48L6.25 8.2 12 5.32 17.75 8.2 12 11.48zM17 18h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H7v-2h2v2z"/></svg>`,
  cafe: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-white p-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4v-2z"/></svg>`,
  restaurant: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-white p-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5V8H21V2h-2v4h-2.5z"/></svg>`,
  park: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-white p-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h2L12 2 5.05 12H7l-3.5 7h17L17 12z"/></svg>`,
  bus: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-white p-2" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 11H6V6h12v5z"/></svg>`,
  train: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-white p-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2.23v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zm0 2c3.51 0 4.96.48 5.5 1H6.5c.54-.52 1.99-1 5.5-1zM6 15.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S8.33 17 7.5 17 6 16.33 6 15.5zm10.5 1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 12H6V7h12v5z"/></svg>`,
  shop: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-white p-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16.5 6l-3.07 5.54-5.11.92L11 9.51 14.28 6h3.22z"/></svg>`,
  hospital: `<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-white p-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>`,
};
