// Google Sheets Sync Module - Updated for force sync support
import { ResiRecord } from './db';
import { CourierCategory } from './courierCategories';

// Google Apps Script Web App URL (Optimized Version)
// PENTING: URL sudah diupdate dengan Web App yang aktif
// Spreadsheet: Database Scan Resi WH Online Surabaya
// Last Update: 13 Feb 2026 - Deploy baru dengan daily reset numbering
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby7JX24rHDDPFifoLaepvkw0PR2UVAyv-kKStvhhCFJO7pR7CfeDPNdtzokqUQI7z66EA/exec';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
}

export interface LastNumbersResult {
  success: boolean;
  lastNumbers?: Record<CourierCategory, number>;
  date?: string;
  error?: string;
}

// Format tanggal untuk Google Sheets
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Prepare data untuk dikirim ke Google Sheets
// IMPORTANT: hanya kirim kategori yang memiliki data, supaya Apps Script tidak membuat sheet baru untuk kategori kosong
// IMPORTANT: rowNumber adalah nomor urut dari database aplikasi, harus digunakan di Google Sheets
// IMPORTANT: Data HARUS diurutkan berdasarkan rowNumber agar masuk ke sheet dengan urutan benar
function prepareDataForSync(
  records: ResiRecord[],
  options?: { force?: boolean }
): Partial<Record<CourierCategory, any[]>> {
  const result: Partial<Record<CourierCategory, any[]>> = {};

  // Filter records yang perlu di-sync
  const recordsToProcess = options?.force 
    ? records 
    : records.filter(r => !r.syncedToSheet);

  // Sort berdasarkan rowNumber untuk memastikan urutan benar
  const sortedRecords = [...recordsToProcess].sort((a, b) => {
    // Pertama sort by category, lalu by rowNumber
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.rowNumber - b.rowNumber;
  });

  for (const record of sortedRecords) {
    const key = record.category;
    if (!result[key]) result[key] = [];

    result[key]!.push({
      // Nomor urut dari aplikasi - ini yang harus dipakai di Google Sheets
      no: record.rowNumber,
      rowNumber: record.rowNumber,
      nomorUrut: record.rowNumber,
      resi: record.resi,
      // Kirim dua nama field supaya kompatibel dengan beberapa versi Apps Script
      waktuscan: `${formatDate(record.timestamp)} ${formatTime(record.timestamp)}`,
      tanggalWaktu: `${formatDate(record.timestamp)} ${formatTime(record.timestamp)}`,
      status: record.isDuplicate ? 'DUPLIKAT' : 'OK',
    });
  }

  return result;
}

// Get nomor terakhir dari Google Sheets
export async function getLastNumbersFromSheet(): Promise<LastNumbersResult> {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getLastNumbers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting last numbers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Batch size untuk sync (100 record per batch)
const BATCH_SIZE = 100;

// Jumlah batch yang dikirim paralel sekaligus (lebih cepat)
const PARALLEL_BATCHES = 3;

// Sync satu batch ke Google Sheets
async function syncBatch(
  records: ResiRecord[], 
  options?: { force?: boolean; triggerSort?: boolean }
): Promise<boolean> {
  const dataToSync = prepareDataForSync(records, { force: options?.force });
  
  // Skip jika tidak ada data (semua sudah synced)
  if (Object.keys(dataToSync).length === 0) return true;
  
  const payload = {
    records: dataToSync,
    timestamp: new Date().toISOString(),
    // Flag untuk trigger sorting di server (hanya batch terakhir)
    triggerSort: options?.triggerSort || false
  };
  
  console.log('[Sync] Sending batch:', {
    categories: Object.keys(dataToSync),
    recordCounts: Object.entries(dataToSync).map(([k, v]) => `${k}: ${(v as any[]).length}`),
    triggerSort: payload.triggerSort,
    sampleData: Object.entries(dataToSync).slice(0, 1).map(([k, v]) => ({ category: k, first: (v as any[])[0] }))
  });
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });
    
    console.log('[Sync] Batch sent successfully (no-cors mode, status:', response.type, ')');
    return true;
  } catch (error) {
    console.error('[Sync] Batch failed:', error);
    throw error;
  }
}

// Sync data ke Google Sheets via Apps Script (dengan batching)
export async function syncToGoogleSheets(
  records: ResiRecord[], 
  onProgress?: (synced: number, total: number) => void,
  options?: { force?: boolean }
): Promise<SyncResult> {
  try {
    // Filter hanya record yang belum di-sync (kecuali force)
    const recordsToSync = options?.force ? records : records.filter(r => !r.syncedToSheet);
    
    if (recordsToSync.length === 0) {
      return {
        success: true,
        message: 'Semua data sudah tersinkronisasi',
        syncedCount: 0
      };
    }
    
    const totalRecords = recordsToSync.length;
    let syncedCount = 0;
    
    // Buat semua batch (sudah terurut dari prepareDataForSync)
    const batches: ResiRecord[][] = [];
    for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
      batches.push(recordsToSync.slice(i, i + BATCH_SIZE));
    }
    
    // Kirim batch secara paralel (PARALLEL_BATCHES sekaligus) untuk kecepatan
    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
      const parallelBatches = batches.slice(i, i + PARALLEL_BATCHES);
      const isLastGroup = i + PARALLEL_BATCHES >= batches.length;
      
      // Kirim semua batch dalam grup ini secara paralel
      // Batch terakhir dalam grup terakhir akan trigger sorting
      await Promise.all(parallelBatches.map((batch, idx) => {
        const isLastBatch = isLastGroup && idx === parallelBatches.length - 1;
        return syncBatch(batch, { 
          force: options?.force, 
          triggerSort: isLastBatch // Hanya batch terakhir yang trigger sort
        });
      }));
      
      // Update progress
      syncedCount += parallelBatches.reduce((sum, batch) => sum + batch.length, 0);
      onProgress?.(syncedCount, totalRecords);
      
      // Delay minimal antara grup batch (50ms)
      if (!isLastGroup) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return {
      success: true,
      message: `${totalRecords} resi berhasil dikirim ke Google Sheets`,
      syncedCount: totalRecords
    };
    
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal sync ke Google Sheets'
    };
  }
}

// Generate link ke Google Sheets (untuk manual check)
export function getGoogleSheetsUrl(): string {
  return 'https://docs.google.com/spreadsheets/d/1M28Dn7jF1Rq3HE010MB5c365xcSsEY-9adG8GaFoOtw/edit';
}
