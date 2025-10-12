import type { PoiCategory, PointOfInterest } from './types.ts';

export const POI_CATEGORY_COLORS: Record<PoiCategory, { bg: string; text: string; }> = {
  school: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  cafe: { bg: 'bg-amber-100', text: 'text-amber-600' },
  restaurant: { bg: 'bg-orange-100', text: 'text-orange-600' },
  park: { bg: 'bg-green-100', text: 'text-green-600' },
  bus: { bg: 'bg-sky-100', text: 'text-sky-600' },
  train: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  hospital: { bg: 'bg-red-100', text: 'text-red-600' },
  police: { bg: 'bg-blue-100', text: 'text-blue-600' },
  fire_station: { bg: 'bg-rose-100', text: 'text-rose-600' },
  hairdresser: { bg: 'bg-pink-100', text: 'text-pink-600' },
  lawyer: { bg: 'bg-gray-200', text: 'text-gray-700' },
  supermarket: { bg: 'bg-lime-100', text: 'text-lime-600' },
  accountant: { bg: 'bg-stone-200', text: 'text-stone-700' },
  shop: { bg: 'bg-violet-100', text: 'text-violet-600' },
};


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
    railway: '^(station|stop|halt)$',
    public_transport: '^(station|stop_position)$',
  },
  hospital: { amenity: 'hospital' },
  police: { amenity: 'police' },
  fire_station: { amenity: 'fire_station' },
  hairdresser: { shop: 'hairdresser' },
  lawyer: { office: 'lawyer' },
  supermarket: { shop: 'supermarket' },
  accountant: { office: 'accountant' },
  shop: { shop: true }, // Any shop - MUST BE LAST shop-related check
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
  if (tags.amenity === 'police') return 'police';
  if (tags.amenity === 'fire_station') return 'fire_station';
  if (tags.shop === 'hairdresser') return 'hairdresser';
  if (tags.office === 'lawyer') return 'lawyer';
  if (tags.shop === 'supermarket') return 'supermarket';
  if (tags.office === 'accountant') return 'accountant';
  if (tags.shop) return 'shop'; // General shop check after specific shops
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
  school: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 8.48L6.25 8.2 12 5.32 17.75 8.2 12 11.48zM17 18h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H7v-2h2v2z"/></svg>`,
  cafe: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4v-2z"/></svg>`,
  restaurant: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5V8H21V2h-2v4h-2.5z"/></svg>`,
  park: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h2L12 2 5.05 12H7l-3.5 7h17L17 12z"/></svg>`,
  bus: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 11H6V6h12v5z"/></svg>`,
  train: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2.23v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zm0 2c3.51 0 4.96.48 5.5 1H6.5c.54-.52 1.99-1 5.5-1zM6 15.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S8.33 17 7.5 17 6 16.33 6 15.5zm10.5 1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 12H6V7h12v5z"/></svg>`,
  shop: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16.5 6l-3.07 5.54-5.11.92L11 9.51 14.28 6h3.22z"/></svg>`,
  hospital: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>`,
  police: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`,
  fire_station: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14h2v6h-2zm0 8h2v2h-2z" transform="rotate(45 12 12) scale(0.8)"/><path d="M16.24 7.76C15.07 6.59 13.6 6 12 6s-3.07.59-4.24 1.76C6.59 9.93 6 11.4 6 13c0 2.08 1.17 3.88 2.81 4.83.37.22.81.23 1.19.01.52-.3.8-1.02.5-1.54-.25-.43-.78-.63-1.24-.46-.6.22-1.04-.3-1.04-.94 0-1.1.9-2 2-2s2 .9 2 2c0 .64-.44 1.16-1.04.94-.46-.17-.99.03-1.24.46-.3.52-.02 1.24.5 1.54.38.22.82.21 1.19-.01C16.83 16.88 18 15.08 18 13c0-1.6-.59-3.07-1.76-4.24z"/></svg>`,
  hairdresser: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.64 7.64c.23-.23.53-.34.83-.34s.6.11.83.34l3.36 3.36c1.17-1.17 1.17-3.07 0-4.24L12.5 4.6a3 3 0 00-4.24 0l-2.12 2.12a3 3 0 000 4.24l2.5-2.5zm1.42 8.42c-.23.23-.53.34-.83.34s-.6-.11-.83-.34L6.04 12.7c-1.17 1.17-1.17 3.07 0 4.24l2.12 2.12a3 3 0 004.24 0l2.12-2.12a3 3 0 000-4.24l-2.5 2.5zm3.18-5.06l-4.24 4.24 1.41 1.41 4.24-4.24-1.41-1.41zM4.93 19.07a1 1 0 010-1.41l14.14-14.14a1 1 0 111.41 1.41L6.34 20.48a1 1 0 01-1.41 0z"/></svg>`,
  lawyer: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zM9.5 16.5L5 12l1.41-1.41L9.5 13.67 17.59 5.59 19 7l-9.5 9.5z" transform="scale(0.9)"/></svg>`,
  supermarket: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1z"/></svg>`,
  accountant: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM16 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
};