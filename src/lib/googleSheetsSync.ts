// Google Sheets Sync Module - v4.0 Fixed Anteraja Sync
import { ResiRecord } from './db';
import { CourierCategory } from './courierCategories';

// Google Apps Script Web App URL (Optimized Version)
// PENTING: URL sudah diupdate dengan Web App yang aktif
// Spreadsheet: Database Scan Resi WH Online Surabaya
// Last Update: 14 Feb 2026 - v3.6 speed optimized
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgMEP9ahfEG0OTiMMJ1Y1wUryHLXxZ7gRu6tkOvBHC57FSZJlp4GyiZSOHNn4fDlb3/exec';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  detail?: Record<string, number>; // Per-sheet count breakdown
}

export interface LastNumbersResult {
  success: boolean;
  lastNumbers?: Record<CourierCategory, number>;
  date?: string;
  error?: string;
}

// Format tanggal untuk Google Sheets - format Indonesia yang konsisten dengan data existing
// Format: D/M/YYYY, HH.MM.SS (sama dengan format Google Sheets Indonesia)
function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;
}

// Mapping kategori aplikasi ke nama sheet di Google Sheets
export const CATEGORY_TO_SHEET_NAME: Record<CourierCategory, string> = {
  'shopee': 'SHOPEE',
  'anteraja': 'ANTERAJA',
  'jne': 'JNE',
  'instan-sameday': 'INSTAN',
  'spare': 'LAINNYA',
};

// Prepare data untuk dikirim ke Google Sheets
// IMPORTANT: hanya kirim kategori yang memiliki data
// IMPORTANT: rowNumber adalah nomor urut dari database aplikasi
// IMPORTANT: Data diurutkan berdasarkan timestamp (urutan scan asli)
function prepareDataForSync(
  records: ResiRecord[],
): Record<string, any[]> {
  const result: Record<string, any[]> = {};

  // Sort berdasarkan timestamp (urutan scan asli), bukan alphabetically by category
  const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);

  for (const record of sortedRecords) {
    // Map ke nama sheet yang benar
    const sheetName = CATEGORY_TO_SHEET_NAME[record.category] || 'LAINNYA';
    if (!result[sheetName]) result[sheetName] = [];

    result[sheetName]!.push({
      // Nomor urut dari aplikasi - ini yang harus dipakai di Google Sheets
      no: record.rowNumber,
      rowNumber: record.rowNumber,
      nomorUrut: record.rowNumber,
      resi: record.resi,
      // Format tanggal waktu
      waktuscan: formatDateTime(record.timestamp),
      tanggalWaktu: formatDateTime(record.timestamp),
      status: record.isDuplicate ? 'DUPLIKAT' : 'OK',
      // Kirim kategori untuk debug di Apps Script
      kategori: record.category,
    });
  }

  return result;
}

// Get nomor terakhir dari Google Sheets
export async function getLastNumbersFromSheet(): Promise<LastNumbersResult> {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getLastNumbers`, {
      method: 'GET',
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

// =====================================================================
// DIAGNOSTIK — Cek kondisi Google Sheets dari sisi Apps Script
// =====================================================================
export interface DiagnosticsResult {
  success: boolean;
  rawResponse?: string;          // Response mentah dari Apps Script
  sheetNames?: string[];         // Nama sheet yang ADA di spreadsheet
  lastNumbers?: Record<string, number>; // Nomor terakhir per sheet
  missingSheets?: string[];      // Sheet yang diharapkan tapi tidak ada
  errorMessage?: string;
}

export async function runSyncDiagnostics(): Promise<DiagnosticsResult> {
  const expectedSheets = Object.values(CATEGORY_TO_SHEET_NAME); // ['SHOPEE','ANTERAJA','JNE','INSTAN','LAINNYA']

  try {
    // 1. Coba panggil getLastNumbers — Apps Script harus return per-sheet data
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getLastNumbers`, {
      method: 'GET',
    });

    const rawText = await response.text();
    console.log('[Diagnostics] Raw getLastNumbers response:', rawText);

    let parsed: any = null;
    try { parsed = JSON.parse(rawText); } catch { /* bukan JSON */ }

    if (!parsed) {
      return {
        success: false,
        rawResponse: rawText,
        errorMessage: 'Apps Script tidak return JSON yang valid. Kemungkinan Apps Script error.',
      };
    }

    // 2. Coba kirim 1 record dummy ANTERAJA untuk test write
    const testPayload = {
      records: {
        ANTERAJA: [{
          no: 9999,
          rowNumber: 9999,
          nomorUrut: 9999,
          resi: 'DIAGNOSTIC_TEST_DELETE_ME',
          waktuscan: '1/1/2099, 00.00.00',
          tanggalWaktu: '1/1/2099, 00.00.00',
          status: 'TEST',
          kategori: 'anteraja',
        }]
      },
      timestamp: new Date().toISOString(),
      triggerSort: false,
      isDiagnosticTest: true,  // Flag khusus — kalau Apps Script support, bisa handle beda
    };

    console.log('[Diagnostics] Sending test ANTERAJA record...');
    const writeResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(testPayload),
    });

    const writeRaw = await writeResponse.text();
    console.log('[Diagnostics] Write test response:', writeRaw);

    let writeResult: any = null;
    try { writeResult = JSON.parse(writeRaw); } catch { /* bukan JSON */ }

    // 3. Ekstrak info dari getLastNumbers
    const lastNumbers = parsed?.lastNumbers || parsed?.data || parsed || {};
    const sheetNames = Object.keys(lastNumbers).filter(k => k !== 'date' && k !== 'success' && k !== 'message');
    
    console.log('[Diagnostics] Sheets detected in spreadsheet:', sheetNames);
    console.log('[Diagnostics] Expected sheets:', expectedSheets);

    const missingSheets = expectedSheets.filter(
      s => !sheetNames.some(k => k.toUpperCase() === s.toUpperCase())
    );

    console.log('[Diagnostics] MISSING sheets:', missingSheets);

    return {
      success: true,
      rawResponse: rawText,
      sheetNames,
      lastNumbers,
      missingSheets,
    };

  } catch (error) {
    console.error('[Diagnostics] Error:', error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Batch size untuk sync (100 record per batch - lebih aman untuk Apps Script)
const BATCH_SIZE = 100;

// Jumlah batch yang dikirim paralel sekaligus (dikurangi supaya tidak timeout)
const PARALLEL_BATCHES = 3;

// Kirim satu batch dengan retry
async function sendWithRetry(
  payload: object,
  maxRetries = 3,
  batchLabel = 'batch'
): Promise<{ success: boolean; result: any }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Sync] ${batchLabel} - attempt ${attempt}/${maxRetries}`);

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // Apps Script butuh text/plain agar tidak pre-flight OPTIONS gagal
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'no body');
        console.error(`[Sync] HTTP ${response.status}:`, errText.slice(0, 300));
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }

      const text = await response.text();
      console.log(`[Sync] Raw response (${batchLabel}):`, text.slice(0, 500));

      let result: any = null;
      try {
        result = JSON.parse(text);
      } catch {
        // Apps Script kadang return HTML error page — tangkap ini
        if (text.toLowerCase().includes('error') || text.toLowerCase().includes('exception')) {
          throw new Error(`Apps Script error: ${text.slice(0, 300)}`);
        }
        // Jika tidak ada JSON tapi response 200, anggap sukses
        result = { success: true, message: 'OK (non-JSON response)' };
      }

      if (result && result.success === false) {
        throw new Error(result.message || result.error || 'Apps Script melaporkan error');
      }

      return { success: true, result };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Sync] ${batchLabel} attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1500ms, 4500ms
        const delayMs = 500 * Math.pow(3, attempt - 1);
        console.log(`[Sync] Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('All retries failed');
}

// Sync satu batch ke Google Sheets
async function syncBatch(
  records: ResiRecord[],
  options?: { force?: boolean; triggerSort?: boolean; batchIndex?: number; totalBatches?: number }
): Promise<boolean> {
  const dataToSync = prepareDataForSync(records);

  // Skip jika tidak ada data
  if (Object.keys(dataToSync).length === 0) return true;

  const batchLabel = `Batch ${(options?.batchIndex ?? 0) + 1}/${options?.totalBatches ?? '?'}`;

  const payload = {
    records: dataToSync,
    timestamp: new Date().toISOString(),
    triggerSort: options?.triggerSort || false,
    batchInfo: batchLabel,
  };

  // Log detail per kategori
  const categorySummary = Object.entries(dataToSync).map(([k, v]) => {
    const arr = v as any[];
    return `${k}:${arr.length} (resi:${arr.map(r => r.resi).slice(0, 3).join(',')})`;
  });
  console.log(`[Sync] ${batchLabel} - Sending:`, categorySummary.join(' | '));

  const { result } = await sendWithRetry(payload, 3, batchLabel);
  console.log(`[Sync] ${batchLabel} - Success:`, result);
  return true;
}

// Sync data ke Google Sheets via Apps Script (dengan batching per kategori)
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

    // Log breakdown per kategori SEBELUM sync untuk diagnosis
    const categoryBreakdown: Record<string, number> = {};
    for (const r of recordsToSync) {
      const sheetName = CATEGORY_TO_SHEET_NAME[r.category] || 'LAINNYA';
      categoryBreakdown[sheetName] = (categoryBreakdown[sheetName] || 0) + 1;
    }
    console.log('[Sync] Total records to sync:', totalRecords);
    console.log('[Sync] Per-sheet breakdown:', categoryBreakdown);

    // Buat semua batch
    const batches: ResiRecord[][] = [];
    for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
      batches.push(recordsToSync.slice(i, i + BATCH_SIZE));
    }

    console.log(`[Sync] Total batches: ${batches.length}, BATCH_SIZE: ${BATCH_SIZE}, PARALLEL: ${PARALLEL_BATCHES}`);

    // Kirim batch secara paralel (PARALLEL_BATCHES sekaligus)
    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
      const parallelBatches = batches.slice(i, i + PARALLEL_BATCHES);
      const isLastGroup = i + PARALLEL_BATCHES >= batches.length;

      // Kirim semua batch dalam grup ini secara paralel
      await Promise.all(parallelBatches.map((batch, idx) => {
        const batchIndex = i + idx;
        const isLastBatch = isLastGroup && idx === parallelBatches.length - 1;
        return syncBatch(batch, {
          force: options?.force,
          triggerSort: isLastBatch, // Hanya batch terakhir yang trigger sort
          batchIndex,
          totalBatches: batches.length,
        });
      }));

      // Update progress
      syncedCount += parallelBatches.reduce((sum, batch) => sum + batch.length, 0);
      onProgress?.(syncedCount, totalRecords);

      // Delay antar grup batch
      if (!isLastGroup) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: true,
      message: `${totalRecords} resi berhasil dikirim ke Google Sheets`,
      syncedCount: totalRecords,
      detail: categoryBreakdown,
    };

  } catch (error) {
    console.error('[Sync] Fatal error:', error);
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
