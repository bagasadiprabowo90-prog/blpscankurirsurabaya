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
  // Strict length validation (jika diisi, resi harus pas panjangnya)
  exactLength?: number;
  // Hint untuk placeholder input
  lengthHint?: string;
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
    exactLength: 17,           // SPXID(5) + 12 digit, contoh: SPXID060808603278
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
    patterns: [],              // hanya prefix CM + exactLength yang menentukan
    color: 'hsl(262, 83%, 58%)',
    bgClass: 'category-jne',
    exactLength: 13,           // CM(2) + 11 digit, contoh: CM16861561115
  },
  {
    id: 'instan-sameday',
    name: 'INSTAN',
    shortName: 'ISD',
    prefixes: [],
    patterns: [/^[A-Z0-9]+$/], // Bebas angka dan huruf, menjadi fallback sebelum spare
    color: 'hsl(45, 93%, 47%)',
    bgClass: 'category-instan-sameday',
    exactLength: 14,           // contoh: 2608138JFUAC9P
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

/**
 * Mencoba mendeteksi kategori dari nomor resi.
 * Jika kategori punya exactLength, panjang resi HARUS pas — jika tidak, tidak cocok.
 */
export function tryDetectCategory(resi: string): CourierCategory | null {
  const trimmed = resi.trim().toUpperCase();
  
  for (const category of COURIER_CATEGORIES) {
    if (category.id === 'spare') continue;
    
    // Cek prefix dulu
    let matchedByPrefix = false;
    for (const prefix of category.prefixes) {
      if (trimmed.startsWith(prefix)) {
        matchedByPrefix = true;
        break;
      }
    }
    
    if (matchedByPrefix) {
      // Jika ada aturan panjang, validasi panjang juga
      if (category.exactLength !== undefined && trimmed.length !== category.exactLength) {
        // Prefix cocok tapi panjang belum pas — tolak (masuk ke spare)
        return null;
      }
      return category.id;
    }
    
    // Cek pattern (hanya untuk yang tidak pakai prefix, mis. INSTAN)
    if (category.prefixes.length === 0) {
      for (const pattern of category.patterns) {
        if (pattern.test(trimmed)) {
          // Validasi panjang jika ada
          if (category.exactLength !== undefined && trimmed.length !== category.exactLength) {
            continue;
          }
          return category.id;
        }
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
