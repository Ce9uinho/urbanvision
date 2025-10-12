// Fix: Define and export all necessary types for the application.
export interface Coordinates {
  lat: number;
  lon: number;
}

export interface AddressSuggestion {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
}

export type PoiCategory =
  | 'school'
  | 'cafe'
  | 'restaurant'
  | 'park'
  | 'bus'
  | 'train'
  | 'shop'
  | 'hospital'
  | 'police'
  | 'fire_station'
  | 'hairdresser'
  | 'lawyer'
  | 'supermarket'
  | 'accountant';

export interface PointOfInterest {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, any>;
  category: PoiCategory;
  distance?: number;
}

export interface HighwayExit {
  name: string;
  distance: number;
}
