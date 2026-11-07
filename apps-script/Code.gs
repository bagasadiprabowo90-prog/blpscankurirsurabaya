/**
 * RESI SCANNER - GOOGLE APPS SCRIPT
 * Version 3.9 - Fix data "loncat" ke bawah karena catatan di kolom E dst
 *
 * CHANGELOG v3.9:
 * - FIX: Baris terakhir dihitung HANYA dari kolom B (Resi) via getLastDataRow(),
 *        bukan sheet.getLastRow(). Catatan manual di kolom E dst tidak lagi
 *        membuat data baru ditulis jauh di bawah.
 * - FIX: Sort hanya mengurutkan baris yang berisi resi. Baris kosong tidak lagi
 *        naik ke atas dan mendorong data ke bawah.
 * - FIX: Dedup, highlight, dan getLastNumbers juga memakai getLastDataRow().
 *
 * CHANGELOG v3.8:
 * - FIX: Tambah 'ANTERAJA' ke ALLOWED_CATEGORIES (bug utama!)
 * - FIX: Dedup check — resi yang sudah ada tidak ditulis ulang
 * - FIX: doGet handle action=getLastNumbers untuk diagnostik
 * - NEW: Highlight hijau muda pada baris pertama tiap tanggal (No = 1)
 */

const SPREADSHEET_ID = '1M28Dn7jF1Rq3HE010MB5c365xcSsEY-9adG8GaFoOtw';
let sheetsCache = {};

// Warna highlight untuk baris pertama tiap tanggal (No = 1)
const DATE_START_COLOR = '#c8e6c9'; // Hijau muda (Material Green 100)

// ✅ FIXED: Tambah ANTERAJA, sesuaikan dengan kategori aktif di aplikasi
const ALLOWED_CATEGORIES = new Set(['SHOPEE', 'ANTERAJA', 'JNE', 'INSTAN', 'LAINNYA']);

/**
 * ✅ v3.9: Baris data terakhir berdasarkan kolom B (Resi) saja.
 * sheet.getLastRow() menghitung SEMUA kolom, jadi catatan di kolom E dst
 * ikut dianggap "data" dan membuat penulisan loncat ke bawah.
 * Return 1 jika hanya ada header.
 */
function getLastDataRow(sheet) {
  const maxRow = sheet.getLastRow();
  if (maxRow <= 1) return 1;
  const colB = sheet.getRange(2, 2, maxRow - 1, 1).getValues();
  for (let i = colB.length - 1; i >= 0; i--) {
    const v = colB[i][0];
    if (v !== '' && v !== null && v.toString().trim() !== '') return i + 2;
  }
  return 1;
}

function parseWaktuScan(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();

  const text = value.toString();
  if (text.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(text.replace(' ', 'T')).getTime() || 0;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(\d{2})\.(\d{2})(?:\.(\d{2}))?)?/);
  if (slashMatch) {
    return new Date(
      parseInt(slashMatch[3]),
      parseInt(slashMatch[2]) - 1,
      parseInt(slashMatch[1]),
      parseInt(slashMatch[4]) || 0,
      parseInt(slashMatch[5]) || 0,
      parseInt(slashMatch[6]) || 0
    ).getTime();
  }
  return 0;
}

function getDateKeyFromScanTime(value) {
  if (!value) return '';
  if (value instanceof Date) return Utilities.formatDate(value, 'Asia/Jakarta', 'yyyy-MM-dd');

  const text = value.toString();
  if (text.match(/^\d{4}-\d{2}-\d{2}/)) return text.substring(0, 10);

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
  }
  return '';
}

function getLastNumbersByDate(sheet, dateKeys) {
  const result = {};
  dateKeys.forEach(key => { result[key] = 0; });
  const lastRow = getLastDataRow(sheet); // ✅ v3.9
  if (lastRow <= 1) return result;

  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  for (const row of values) {
    const no = parseInt(row[0]) || 0;
    const dateKey = getDateKeyFromScanTime(row[2]);
    if (dateKey && result[dateKey] !== undefined && no > result[dateKey]) {
      result[dateKey] = no;
    }
  }
  return result;
}

function getOrCreateSheet(ss, sheetName) {
  if (sheetsCache[sheetName]) return sheetsCache[sheetName];

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, 4).setValues([['No', 'Resi', 'Waktu Scan', 'Status']]);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheetsCache[sheetName] = sheet;
  return sheet;
}

/**
 * Sort sheet berdasarkan WAKTU SCAN (timestamp) sebagai primary key.
 * Ini lebih reliable dari sort by No karena timestamp bersifat absolut —
 * tidak terpengaruh oleh urutan batch yang dikirim client.
 * Tie-breaker: No (nomor urut) untuk scan dalam detik yang sama.
 *
 * ✅ v3.9: Hanya baris berisi resi yang diurutkan, baris kosong (A–D)
 * ditaruh di bawah — sebelumnya baris kosong (timestamp 0) naik ke atas.
 */
function sortSheetByDateTime(sheet) {
  const lastRow = getLastDataRow(sheet);
  if (lastRow <= 2) return;

  const dataRange = sheet.getRange(2, 1, lastRow - 1, 4);
  const data = dataRange.getValues();

  const isFilled = row => row[1] !== '' && row[1] !== null && row[1].toString().trim() !== '';
  const filled = data.filter(isFilled);
  const empty = data.filter(row => !isFilled(row));

  filled.sort((a, b) => {
    // Primary: waktu scan (timestamp aktual)
    const timeA = parseWaktuScan(a[2]);
    const timeB = parseWaktuScan(b[2]);
    if (timeA !== timeB) return timeA - timeB;
    // Tie-breaker: nomor urut (No) — untuk scan dalam detik yang sama
    return (parseInt(a[0]) || 0) - (parseInt(b[0]) || 0);
  });

  dataRange.setValues(filled.concat(empty));
}

/**
 * Highlight baris pertama tiap tanggal (No = 1) dengan warna hijau muda.
 * Baris lain dikembalikan ke putih/default.
 * Menggunakan setBackgrounds() — SATU API call untuk seluruh range, jauh lebih cepat.
 */
function applyDateBoundaryColors(sheet) {
  const lastRow = getLastDataRow(sheet); // ✅ v3.9
  if (lastRow <= 1) return;

  const numDataRows = lastRow - 1;

  // Baca kolom No (kolom 1) — satu API call
  const noValues = sheet.getRange(2, 1, numDataRows, 1).getValues();

  // Bangun array warna 2D (1 baris = 4 kolom) — lakukan di JavaScript (zero cost)
  const colors = noValues.map(row => {
    const no = parseInt(row[0]) || 0;
    const color = no === 1 ? DATE_START_COLOR : null; // null = default/putih
    return [color, color, color, color]; // 4 kolom
  });

  // Set semua warna sekaligus — SATU API call, sekencang mungkin
  sheet.getRange(2, 1, numDataRows, 4).setBackgrounds(colors);
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const data = JSON.parse(e.postData.contents);
    const records = data.records;
    const shouldSort = data.triggerSort === true;

    let totalAdded = 0;
    const processedSheets = [];
    const addedPerSheet = {};
    const skippedCategories = [];

    for (const category in records) {
      if (!ALLOWED_CATEGORIES.has(category)) {
        skippedCategories.push(category);
        continue;
      }

      const categoryRecords = records[category];
      if (!categoryRecords || categoryRecords.length === 0) continue;

      const sheet = getOrCreateSheet(ss, category);
      processedSheets.push(sheet);

      // ✅ DEDUP: Baca semua resi yang sudah ada di sheet ke dalam Set
      const existingResiSet = new Set();
      const lastRowCheck = getLastDataRow(sheet); // ✅ v3.9
      if (lastRowCheck > 1) {
        const existingValues = sheet.getRange(2, 2, lastRowCheck - 1, 1).getValues();
        for (const row of existingValues) {
          if (row[0]) existingResiSet.add(row[0].toString().trim().toUpperCase());
        }
      }

      const rowsToAdd = [];
      for (const record of categoryRecords) {
        if (!record.resi || record.resi === 'DIAGNOSTIC_TEST_DELETE_ME') continue;

        // ✅ DEDUP: Skip jika resi sudah ada di sheet
        const resiKey = record.resi.toString().trim().toUpperCase();
        if (existingResiSet.has(resiKey)) {
          skippedCategories.push(`DEDUP:${resiKey}`);
          continue;
        }
        existingResiSet.add(resiKey);

        const scanTime = record.waktuscan || record.tanggalWaktu || '';

        // ✅ GUNAKAN nomor dari client langsung (tidak dihitung ulang)
        // Client sudah menghitung rowNumber dalam urutan scan yang benar.
        // Menghitung ulang di sini menyebabkan nomor salah jika batch datang tidak berurutan.
        const nomor = record.no || record.rowNumber || record.nomorUrut || '';

        rowsToAdd.push([nomor, record.resi || '', scanTime, record.status || 'OK']);
      }

      if (rowsToAdd.length > 0) {
        // ✅ v3.9: tulis tepat di bawah resi terakhir (kolom B), bukan getLastRow()
        const lastRow = getLastDataRow(sheet);
        sheet.getRange(lastRow + 1, 1, rowsToAdd.length, 4).setValues(rowsToAdd);
        totalAdded += rowsToAdd.length;
        addedPerSheet[category] = rowsToAdd.length;
      }
    }

    // Sort dulu jika diminta (batch terakhir), BARU apply highlight
    if (shouldSort) {
      for (const sheet of processedSheets) {
        sortSheetByDateTime(sheet); // ✅ sort by timestamp, bukan by No
      }
    }

    // ✅ NEW: Highlight baris pertama tiap tanggal (No = 1) setelah data final
    for (const sheet of processedSheets) {
      applyDateBoundaryColors(sheet);
    }

    SpreadsheetApp.flush();
    sheetsCache = {};

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `${totalAdded} records added${shouldSort ? ' and sorted' : ''}`,
      count: totalAdded,
      sorted: shouldSort,
      addedPerSheet: addedPerSheet,
      skippedCategories: skippedCategories,
      version: '3.9',
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack ? error.stack.substring(0, 500) : ''
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  // Handle action=getLastNumbers untuk diagnostik dari aplikasi
  if (action === 'getLastNumbers') {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const lastNumbers = {};

      for (const categoryName of ALLOWED_CATEGORIES) {
        const sheet = ss.getSheetByName(categoryName);
        if (!sheet) {
          lastNumbers[categoryName] = null;
          continue;
        }
        const lastRow = getLastDataRow(sheet); // ✅ v3.9
        if (lastRow <= 1) {
          lastNumbers[categoryName] = 0;
          continue;
        }
        const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        let maxNo = 0;
        for (const row of values) {
          const no = parseInt(row[0]) || 0;
          if (no > maxNo) maxNo = no;
        }
        lastNumbers[categoryName] = maxNo;
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        lastNumbers: lastNumbers,
        allowedCategories: Array.from(ALLOWED_CATEGORIES),
        date: new Date().toISOString(),
      })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: error.message
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Default GET response
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Resi Scanner API v3.9 - Last row by Resi column',
    allowedCategories: Array.from(ALLOWED_CATEGORIES),
    version: '3.9'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fungsi utilitas: re-apply sort + warna highlight ke SEMUA sheet sekaligus.
 * Jalankan manual dari Apps Script editor untuk refresh data lama.
 * Cara: buka Apps Script editor → pilih 'reapplyAllHighlights' → klik Run
 */
function reapplyAllHighlights() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  for (const categoryName of ALLOWED_CATEGORIES) {
    const sheet = ss.getSheetByName(categoryName);
    if (sheet) {
      sortSheetByDateTime(sheet);       // Sort by timestamp dulu
      applyDateBoundaryColors(sheet);   // Baru highlight
      Logger.log(`Done: ${categoryName}`);
    }
  }
  SpreadsheetApp.flush();
  Logger.log('All sheets sorted and highlighted.');
}

/**
 * ✅ v3.9: Cek perbandingan getLastRow vs getLastDataRow tiap tab.
 * Kalau angkanya beda jauh, berarti ada isi di luar kolom data (mis. catatan di kolom E).
 * Cara: buka Apps Script editor → pilih 'testLastDataRow' → klik Run → lihat Log
 */
function testLastDataRow() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  for (const categoryName of ALLOWED_CATEGORIES) {
    const sheet = ss.getSheetByName(categoryName);
    if (!sheet) { Logger.log(`${categoryName}: (tidak ada)`); continue; }
    Logger.log(`${categoryName}: getLastRow=${sheet.getLastRow()} | getLastDataRow=${getLastDataRow(sheet)}`);
  }
}
