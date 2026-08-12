export type CourierCategory = 
  | 'shopee'
  | 'jnt'
  | 'goto'
  | 'jne'
  | 'instan-sameday'
  | 'spare';

export interface CategoryConfig {
  id: CourierCategory;
  name: string;
  shortName: string;
  prefixes: string[];
  patterns: RegExp[];
  color: string;
  bgClass: string;
}

export const COURIER_CATEGORIES: CategoryConfig[] = [
  {
    id: 'shopee',
    name: 'Shopee',
    shortName: 'SHP',
    prefixes: ['SPXID'],
    patterns: [],
    color: 'hsl(16, 100%, 50%)',
    bgClass: 'category-shopee',
  },
  {
    id: 'jnt',
    name: 'J&T Express',
    shortName: 'JNT',
    prefixes: ['JP', 'JX', 'JD', 'JZ', 'JO'],
    patterns: [],
    color: 'hsl(0, 84%, 50%)',
    bgClass: 'category-jnt',
  },
  {
    id: 'goto',
    name: 'GOTO',
    shortName: 'GOTO',
    prefixes: ['GOTO'],
    patterns: [],
    color: 'hsl(142, 70%, 40%)',
    bgClass: 'category-goto',
  },
  {
    id: 'jne',
    name: 'JNE',
    shortName: 'JNE',
    prefixes: ['CM'],
    patterns: [/^[0-9]+$/], // Angka 0-9 saja
    color: 'hsl(262, 83%, 58%)',
    bgClass: 'category-jne',
  },
  {
    id: 'instan-sameday',
    name: 'INSTAN',
    shortName: 'ISD',
    prefixes: [],
    patterns: [/^[A-Z0-9]+$/], // Bebas angka dan huruf, menjadi fallback sebelum spare
    color: 'hsl(45, 93%, 47%)',
    bgClass: 'category-instan-sameday',
  },
  {
    id: 'spare',
    name: 'Lainnya',
    shortName: 'OTH',
    prefixes: [],
    patterns: [],
    color: 'hsl(220, 9%, 46%)',
    bgClass: 'category-spare',
  },
];

export function tryDetectCategory(resi: string): CourierCategory | null {
  const trimmed = resi.trim().toUpperCase();
  
  for (const category of COURIER_CATEGORIES) {
    if (category.id === 'spare') continue;
    
    for (const pattern of category.patterns) {
      if (pattern.test(trimmed)) {
        return category.id;
      }
    }
    
    for (const prefix of category.prefixes) {
      if (trimmed.startsWith(prefix)) {
        return category.id;
      }
    }
  }
  
  return null;
}

export function detectCategory(resi: string): CourierCategory {
  return tryDetectCategory(resi) || 'spare';
}

export function getCategoryConfig(category: CourierCategory): CategoryConfig {
  return COURIER_CATEGORIES.find(c => c.id === category) || COURIER_CATEGORIES[COURIER_CATEGORIES.length - 1];
}
