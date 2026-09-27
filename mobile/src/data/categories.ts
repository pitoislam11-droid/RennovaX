import type { CategoryId } from './types';

export type IconName =
  | 'brush-outline'
  | 'water-outline'
  | 'restaurant-outline'
  | 'grid-outline'
  | 'home-outline'
  | 'construct-outline'
  | 'flash-outline'
  | 'leaf-outline'
  | 'expand-outline'
  | 'layers-outline'
  | 'hammer-outline';

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  blurb: string;
  icon: IconName;
  /** Pastel tile background and icon colour. */
  tint: { bg: string; fg: string };
}

export const CATEGORIES: Category[] = [
  { id: 'painting', name: 'Painting & Decorating', shortName: 'Painting &\nDecorating', blurb: 'Walls, woodwork, wallpaper', icon: 'brush-outline', tint: { bg: '#FFEDE4', fg: '#EF6A2E' } },
  { id: 'bathroom', name: 'Bathroom Renovation', shortName: 'Bathroom\nRenovation', blurb: 'Refits, tiling, showers', icon: 'water-outline', tint: { bg: '#E7F0FF', fg: '#2F6BFF' } },
  { id: 'kitchen', name: 'Kitchen Renovation', shortName: 'Kitchen\nRenovation', blurb: 'Units, worktops, fitting', icon: 'restaurant-outline', tint: { bg: '#E5F6EC', fg: '#1E9E57' } },
  { id: 'flooring', name: 'Flooring', shortName: 'Flooring', blurb: 'Wood, laminate, tiles', icon: 'grid-outline', tint: { bg: '#FFF4DB', fg: '#D99A00' } },
  { id: 'roofing', name: 'Roofing', shortName: 'Roofing', blurb: 'Repairs, re-roofs, gutters', icon: 'home-outline', tint: { bg: '#FFEDE4', fg: '#E0581F' } },
  { id: 'plumbing', name: 'Plumbing', shortName: 'Plumbing', blurb: 'Leaks, boilers, radiators', icon: 'construct-outline', tint: { bg: '#E7F0FF', fg: '#2F6BFF' } },
  { id: 'electrical', name: 'Electrical', shortName: 'Electrical', blurb: 'Rewires, sockets, lighting', icon: 'flash-outline', tint: { bg: '#FFF1E0', fg: '#F08A00' } },
  { id: 'landscaping', name: 'Landscaping', shortName: 'Landscaping', blurb: 'Patios, fencing, lawns', icon: 'leaf-outline', tint: { bg: '#E5F6EC', fg: '#1E9E57' } },
  { id: 'extensions', name: 'Extensions', shortName: 'Extensions', blurb: 'Rear, side, wraparound', icon: 'expand-outline', tint: { bg: '#F0EBFF', fg: '#6D4CFF' } },
  { id: 'loft', name: 'Loft Conversions', shortName: 'Loft\nConversion', blurb: 'Dormer, Velux, hip-to-gable', icon: 'layers-outline', tint: { bg: '#F0EBFF', fg: '#6D4CFF' } },
  { id: 'general', name: 'General Renovation', shortName: 'General\nRenovation', blurb: 'Several trades, or not sure', icon: 'hammer-outline', tint: { bg: '#EEF0F3', fg: '#3A3F47' } },
];

export function getCategory(id: CategoryId): Category {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown category ${id}`);
  return found;
}
