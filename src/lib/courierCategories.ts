export type CourierCategory = 
  | 'shopee'
  | 'anteraja'
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
  // Jika true, resi WAJIB dimulai dengan salah satu prefix (tidak bisa lolos tanpa prefix)
  requiresPrefix?: boolean;
  // Jika true, resi hanya boleh berisi digit angka (setelah prefix)
  digitsOnly?: boolean;
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
    requiresPrefix: true,
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
    requiresPrefix: true,
  },
  {
    id: 'anteraja',
    name: 'Anteraja',
    shortName: 'ATJ',
    prefixes: [],              // tidak ada prefix — hanya 17 digit angka murni
    patterns: [],
    color: 'hsl(270, 60%, 75%)',  // ungu pastel
    bgClass: 'category-anteraja',
    exactLength: 14,              // tepat 14 digit angka, contoh: 11004245411584
    digitsOnly: true,             // hanya angka, tanpa huruf sama sekali
  },
  {
    id: 'instan-sameday',
    name: 'Instan',
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
 * Validasi ketat:
 * - Kategori dengan requiresPrefix=true: WAJIB cocok prefix, dan panjang harus pas (jika ada exactLength).
 * - Kategori Anteraja (digitsOnly=true): 17 digit angka murni.
 * - Kategori pattern-based (Instan): cek pattern + exactLength.
 * - Prefix yang cocok tapi panjang salah → return 'invalid' signal (null) agar ditolak.
 */
export function tryDetectCategory(resi: string): CourierCategory | null {
  const trimmed = resi.trim().toUpperCase();
  
  for (const category of COURIER_CATEGORIES) {
    if (category.id === 'spare') continue;
    
    // === Kategori berbasis PREFIX ===
    if (category.prefixes.length > 0) {
      let matchedByPrefix = false;
      for (const prefix of category.prefixes) {
        if (trimmed.startsWith(prefix)) {
          matchedByPrefix = true;
          break;
        }
      }
      
      if (matchedByPrefix) {
        // Prefix cocok → validasi panjang jika ada
        if (category.exactLength !== undefined && trimmed.length !== category.exactLength) {
          // Prefix cocok tapi panjang belum pas — tolak keras (return null agar tidak diterima tab manapun)
          return null;
        }
        return category.id;
      }
      
      // Prefix tidak cocok → skip (jangan cek pattern)
      continue;
    }
    
    // === Kategori Anteraja: 17 digit angka murni (digitsOnly, tanpa prefix) ===
    if (category.digitsOnly) {
      const isAllDigits = /^\d+$/.test(trimmed);
      if (isAllDigits) {
        if (category.exactLength !== undefined && trimmed.length !== category.exactLength) {
          continue; // panjang tidak pas, lanjut ke kategori berikutnya
        }
        return category.id;
      }
      continue;
    }
    
    // === Kategori berbasis PATTERN (mis. Instan) ===
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
  
  return null;
}

export function detectCategory(resi: string): CourierCategory {
  return tryDetectCategory(resi) || 'spare';
}

export function getCategoryConfig(category: CourierCategory): CategoryConfig {
  return COURIER_CATEGORIES.find(c => c.id === category) || COURIER_CATEGORIES[COURIER_CATEGORIES.length - 1];
}
