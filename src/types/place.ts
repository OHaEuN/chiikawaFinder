export type PlaceType = 'popup' | 'store' | 'cafe' | 'restaurant' | 'event' | 'other';

export interface Place {
  id: string;
  type: PlaceType;
  name: string;
  country: 'KR' | 'JP';
  city: string;
  address: string;
  lat: number;
  lng: number;
  image?: string;
  description: string;
  sells: string[];
  priceRange?: string;
  period?: { start: string; end?: string };
  hours?: string;
  official: boolean;
  url?: string;
  sources: string[];
}
