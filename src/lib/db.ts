import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CourierCategory, detectCategory } from './courierCategories';

export interface ResiRecord {
  id: string;
  resi: string;
  category: CourierCategory;
  timestamp: number;
  isDuplicate: boolean;
  rowNumber: number;
  syncedToSheet: boolean;
}

interface ResiDBSchema extends DBSchema {
  resi: {
    key: string;
    value: ResiRecord;
    indexes: {
      'by-category': CourierCategory;
      'by-resi': string;
      'by-timestamp': number;
    };
  };
  counters: {
    key: string;
    value: { key: string; category: string; date: string; count: number };
  };
}

let dbInstance: IDBPDatabase<ResiDBSchema> | null = null;

function getDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getDB(): Promise<IDBPDatabase<ResiDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ResiDBSchema>('resi-manager', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const resiStore = db.createObjectStore('resi', { keyPath: 'id' });
        resiStore.createIndex('by-category', 'category');
        resiStore.createIndex('by-resi', 'resi');
        resiStore.createIndex('by-timestamp', 'timestamp');
      }

      if (oldVersion < 2) {
        if (db.objectStoreNames.contains('counters')) {
          db.deleteObjectStore('counters');
        }
        db.createObjectStore('counters', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

export async function addResi(resiNumber: string, forceCategory?: CourierCategory): Promise<{ record: ResiRecord; isDuplicate: boolean }> {
  const db = await getDB();
  const trimmed = resiNumber.trim().toUpperCase();
  const now = Date.now();
  const dateKey = getDateKey(now);
  
  // Check for duplicate
  const existing = await db.getFromIndex('resi', 'by-resi', trimmed);
  const isDuplicate = !!existing;
  
  // Use forced category if provided, otherwise detect
  const category = forceCategory || detectCategory(trimmed);
  
  // Get current count for category
  const counterKey = `${category}|${dateKey}`;
  const counter = await db.get('counters', counterKey);
  const rowNumber = (counter?.count || 0) + 1;
  
  const record: ResiRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    resi: trimmed,
    category,
    timestamp: now,
    isDuplicate,
    rowNumber,
    syncedToSheet: false,
  };
  
  await db.put('resi', record);
  await db.put('counters', { key: counterKey, category, date: dateKey, count: rowNumber });
  
  return { record, isDuplicate };
}

export async function addBulkResi(resiNumbers: string[], forceCategory?: CourierCategory): Promise<{ records: ResiRecord[]; duplicates: number }> {
  const db = await getDB();
  const records: ResiRecord[] = [];
  let duplicates = 0;
  
  // Get all existing resi numbers for fast lookup
  const allResi = await db.getAllFromIndex('resi', 'by-resi');
  const existingSet = new Set(allResi.map(r => r.resi));
  
  // Also check within the batch
  const batchSet = new Set<string>();
  
  // Get all counters
  const counters: Record<string, number> = {};
  
  for (const resiNumber of resiNumbers) {
    const trimmed = resiNumber.trim().toUpperCase();
    if (!trimmed) continue;

    const now = Date.now();
    const dateKey = getDateKey(now);
    
    const isDuplicate = existingSet.has(trimmed) || batchSet.has(trimmed);
    if (isDuplicate) duplicates++;
    
    batchSet.add(trimmed);
    existingSet.add(trimmed);
    
    // Use forced category if provided, otherwise detect
    const category = forceCategory || detectCategory(trimmed);
    const counterKey = `${category}|${dateKey}`;
    
    if (counters[counterKey] === undefined) {
      const counter = await db.get('counters', counterKey);
      counters[counterKey] = counter?.count || 0;
    }
    counters[counterKey]++;
    
    const record: ResiRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resi: trimmed,
      category,
      timestamp: now,
      isDuplicate,
      rowNumber: counters[counterKey],
      syncedToSheet: false,
    };
    
    records.push(record);
  }
  
  // Batch insert
  const tx = db.transaction(['resi', 'counters'], 'readwrite');
  for (const record of records) {
    tx.objectStore('resi').put(record);
  }
  for (const [key, count] of Object.entries(counters)) {
    const [category, date] = key.split('|');
    tx.objectStore('counters').put({ key, category, date, count });
  }
  await tx.done;
  
  return { records, duplicates };
}

export async function getAllResi(): Promise<ResiRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('resi', 'by-timestamp');
}

export async function getResiByCategory(category: CourierCategory): Promise<ResiRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('resi', 'by-category', category);
}

export async function deleteResi(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('resi', id);
  
  // Reorder row numbers after deletion
  await reorderRowNumbers();
}

export async function deleteDuplicates(): Promise<number> {
  const db = await getDB();
  const allResi = await db.getAll('resi');
  const duplicates = allResi.filter(r => r.isDuplicate);
  
  const tx = db.transaction('resi', 'readwrite');
  for (const dup of duplicates) {
    tx.objectStore('resi').delete(dup.id);
  }
  await tx.done;
  
  // Reorder row numbers after deletion
  await reorderRowNumbers();
  
  return duplicates.length;
}

// Reorder row numbers to be sequential per category
export async function reorderRowNumbers(): Promise<void> {
  const db = await getDB();
  const allResi = await db.getAll('resi');
  
  // Group by category + date and sort by timestamp
  const byCategoryDate: Record<string, ResiRecord[]> = {};
  for (const record of allResi) {
    const dateKey = getDateKey(record.timestamp);
    const key = `${record.category}|${dateKey}`;
    if (!byCategoryDate[key]) {
      byCategoryDate[key] = [];
    }
    byCategoryDate[key].push(record);
  }
  
  const tx = db.transaction(['resi', 'counters'], 'readwrite');
  await tx.objectStore('counters').clear();
  
  for (const [key, records] of Object.entries(byCategoryDate)) {
    // Sort by timestamp
    records.sort((a, b) => a.timestamp - b.timestamp);
    
    // Reassign row numbers
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      record.rowNumber = i + 1;
      tx.objectStore('resi').put(record);
    }
    
    const [category, date] = key.split('|');
    // Update counter
    tx.objectStore('counters').put({ key, category, date, count: records.length });
  }
  
  await tx.done;
}

export async function resetAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('resi');
  await db.clear('counters');
}

export async function getStats(): Promise<{ total: number; byCategory: Record<CourierCategory, number>; duplicates: number }> {
  const db = await getDB();
  const allResi = await db.getAll('resi');
  
  const byCategory: Record<string, number> = {};
  let duplicates = 0;
  
  for (const record of allResi) {
    byCategory[record.category] = (byCategory[record.category] || 0) + 1;
    if (record.isDuplicate) duplicates++;
  }
  
  return {
    total: allResi.length,
    byCategory: byCategory as Record<CourierCategory, number>,
    duplicates,
  };
}

export async function markAsSynced(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('resi', 'readwrite');
  
  for (const id of ids) {
    const record = await tx.objectStore('resi').get(id);
    if (record) {
      record.syncedToSheet = true;
      tx.objectStore('resi').put(record);
    }
  }
  
  await tx.done;
}

// Export all data to JSON
export async function exportToJSON(): Promise<string> {
  const db = await getDB();
  const allResi = await db.getAll('resi');
  const counters = await db.getAll('counters');
  
  const exportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    resi: allResi,
    counters: counters,
  };
  
  return JSON.stringify(exportData, null, 2);
}

// Import data from JSON
export async function importFromJSON(jsonString: string): Promise<{ imported: number; skipped: number }> {
  const db = await getDB();
  
  const data = JSON.parse(jsonString);
  
  if (!data.resi || !Array.isArray(data.resi)) {
    throw new Error('Format JSON tidak valid');
  }
  
  // Get existing resi numbers to avoid duplicates
  const allExisting = await db.getAllFromIndex('resi', 'by-resi');
  const existingSet = new Set(allExisting.map(r => r.resi));
  
  let imported = 0;
  let skipped = 0;
  
  const tx = db.transaction(['resi', 'counters'], 'readwrite');
  
  for (const record of data.resi as ResiRecord[]) {
    // Skip if already exists
    if (existingSet.has(record.resi)) {
      skipped++;
      continue;
    }
    
    // Generate new ID to avoid conflicts
    const newRecord: ResiRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    tx.objectStore('resi').put(newRecord);
    existingSet.add(record.resi);
    imported++;
  }
  
  await tx.done;
  
  // Reorder row numbers after import
  await reorderRowNumbers();
  
  return { imported, skipped };
}
