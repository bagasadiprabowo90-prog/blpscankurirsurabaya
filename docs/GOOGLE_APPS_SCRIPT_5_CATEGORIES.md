# Google Apps Script - 6 Kategori Kurir

## ✅ Status: AKTIF & TERPASANG

Google Apps Script sudah di-deploy dan aktif:
- **Web App URL**: `https://script.google.com/macros/s/AKfycbwvNji-N2XtpOee1ZH98FAntSJ3_vJFdMrQMkusu_-ja0Nb05_OXH7srSlYYhrobZtf4A/exec`
- **Status**: Terhubung dengan aplikasi
- **Konfigurasi**: Sudah diset di `src/lib/googleSheetsSync.ts`
- **Last Deploy**: 24 Januari 2026

## Spreadsheet Target
**Database Scan Resi WH Online Surabaya**
- URL: https://docs.google.com/spreadsheets/d/1M28Dn7jF1Rq3HE010MB5c365xcSsEY-9adG8GaFoOtw/edit
- Sheet ID: `1M28Dn7jF1Rq3HE010MB5c365xcSsEY-9adG8GaFoOtw`

## Kategori Kurir (6 Tab):
1. **shopee** - Shopee
2. **jnt** - J&T Express
3. **goto** - GOTO
4. **jne** - JNE
5. **instan-sameday** - INSTAN
6. **spare** - Lainnya

## Cara Deploy Google Apps Script

### Langkah 1: Buka Google Apps Script
1. Buka spreadsheet: https://docs.google.com/spreadsheets/d/1M28Dn7jF1Rq3HE010MB5c365xcSsEY-9adG8GaFoOtw/edit
2. Klik menu **Extensions** > **Apps Script**
3. Hapus semua kode default yang ada

### Langkah 2: Copy Script Berikut

```javascript
/**
 * RESI SCANNER - OPTIMIZED GOOGLE APPS SCRIPT
 * Version 3.0 - 5 Kategori Kurir (Shopee, J&T, Goto, Instan, Lainnya)
 * 
 * Optimizations:
 * - Batch writing (setValues instead of appendRow)
 * - Sheet caching
 * - Minimal API calls
 * - Auto-sort by row number after data received
 */

// ID Spreadsheet - Sudah di-set ke Database Scan Resi WH Online Surabaya
const SPREADSHEET_ID = '1M28Dn7jF1Rq3HE010MB5c365xcSsEY-9adG8GaFoOtw';

// Cache untuk sheet references
let sheetsCache = {};

// Mapping kategori dari aplikasi ke nama sheet
const CATEGORY_SHEET_NAMES = {
  'shopee': 'shopee',
  'jnt': 'jnt',
  'goto': 'goto',
  'jne': 'jne',
  'instan-sameday': 'instan-sameday',
  'spare': 'spare'
};

// Mendapatkan atau membuat sheet dengan caching
function getOrCreateSheet(ss, sheetName) {
  if (sheetsCache[sheetName]) {
    return sheetsCache[sheetName];
  }
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // Setup header
    sheet.getRange(1, 1, 1, 4).setValues([['No', 'Resi', 'Waktu Scan', 'Status']]);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    sheet.setFrozenRows(1);
    
    // Format columns
    sheet.setColumnWidth(1, 60);  // No
    sheet.setColumnWidth(2, 200); // Resi
    sheet.setColumnWidth(3, 150); // Waktu Scan
    sheet.setColumnWidth(4, 100); // Status
  }
  
  sheetsCache[sheetName] = sheet;
  return sheet;
}

// Sort sheet berdasarkan kolom No (kolom A)
function sortSheetByNumber(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return; // Tidak ada data selain header
  
  // Sort range data (skip header row 1)
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 4);
  dataRange.sort({ column: 1, ascending: true });
}

// Handle POST request - OPTIMIZED dengan batch writing + auto-sort
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    // Timeout 30 detik untuk lock
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const data = JSON.parse(e.postData.contents);
    const records = data.records;
    const shouldSort = data.triggerSort === true; // Flag untuk trigger sorting
    
    let totalAdded = 0;
    const processedSheets = []; // Track sheets yang perlu di-sort
    
    // Process setiap kategori
    for (const category in records) {
      const categoryRecords = records[category];
      if (!categoryRecords || categoryRecords.length === 0) continue;
      
      // Validasi kategori
      if (!CATEGORY_SHEET_NAMES[category]) {
        Logger.log('Unknown category: ' + category);
        continue;
      }
      
      const sheetName = CATEGORY_SHEET_NAMES[category];
      const sheet = getOrCreateSheet(ss, sheetName);
      processedSheets.push(sheet);
      
      // BATCH WRITING - Prepare semua data sekaligus
      const rowsToAdd = categoryRecords.map(record => [
        record.no || record.rowNumber || record.nomorUrut || '',
        record.resi || '',
        record.waktuscan || record.tanggalWaktu || '',
        record.status || 'OK'
      ]);
      
      // Tulis semua baris sekaligus (JAUH lebih cepat!)
      if (rowsToAdd.length > 0) {
        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, rowsToAdd.length, 4).setValues(rowsToAdd);
        totalAdded += rowsToAdd.length;
      }
    }
    
    // AUTO-SORT jika diminta
    if (shouldSort) {
      Logger.log('Triggering auto-sort for ' + processedSheets.length + ' sheets...');
      for (const sheet of processedSheets) {
        sortSheetByNumber(sheet);
      }
      Logger.log('Auto-sort completed');
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        added: totalAdded,
        sorted: shouldSort
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Handle GET request - Mendapatkan nomor terakhir dari setiap kategori
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getLastNumbers') {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const lastNumbers = {};
      const today = new Date();
      const dateStr = Utilities.formatDate(today, 'Asia/Jakarta', 'dd MMM yyyy');
      
      // Cek setiap kategori
      for (const category in CATEGORY_SHEET_NAMES) {
        const sheetName = CATEGORY_SHEET_NAMES[category];
        const sheet = ss.getSheetByName(sheetName);
        
        if (sheet) {
          const lastRow = sheet.getLastRow();
          if (lastRow > 1) {
            // Ambil nomor dari baris terakhir
            const lastNumber = sheet.getRange(lastRow, 1).getValue();
            lastNumbers[category] = parseInt(lastNumber) || 0;
          } else {
            lastNumbers[category] = 0;
          }
        } else {
          lastNumbers[category] = 0;
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          lastNumbers: lastNumbers,
          date: dateStr
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: 'Unknown action' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function untuk debugging
function testSync() {
  const testData = {
    records: {
      'shopee': [
        { no: 1, resi: 'SPXID123456789', waktuscan: '23 Jan 2026 10:00', status: 'OK' }
      ],
      'jnt': [
        { no: 1, resi: 'JT123456789', waktuscan: '23 Jan 2026 10:01', status: 'OK' }
      ]
    },
    triggerSort: true
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(e);
  Logger.log(result.getContent());
}
```

### Langkah 3: Deploy sebagai Web App

1. **Save Script**
   - Klik tombol **Save** (ikon disk)
   - Beri nama: "Resi Scanner Sync 5 Categories"

2. **Deploy**
   - Klik tombol **Deploy** > **New deployment**
   - Pilih **Web app** sebagai type
   - Isi deskripsi: "Resi Scanner API - 5 Categories"
   - **Execute as**: Me (email Anda)
   - **Who has access**: Anyone
   - Klik **Deploy**

3. **Copy URL**
   - Setelah deploy, copy **Web app URL**
   - URL akan berbentuk: `https://script.google.com/macros/s/[ID]/exec`

4. **Update di Aplikasi**
   - Buka file `src/lib/googleSheetsSync.ts`
   - Ganti `APPS_SCRIPT_URL` dengan URL yang baru
   - Contoh:
   ```typescript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/[YOUR_SCRIPT_ID]/exec';
   ```

### Langkah 4: Test Script

1. Jalankan function `testSync()` dari Apps Script editor
2. Authorize permission yang diminta
3. Check hasil di spreadsheet

## Struktur Sheet yang Dibuat

Setiap kategori akan memiliki sheet dengan kolom:
- **No**: Nomor urut dari aplikasi
- **Resi**: Nomor resi
- **Waktu Scan**: Tanggal dan waktu scan
- **Status**: OK atau DUPLIKAT

## Fitur Script

1. **Batch Writing**: Menulis banyak data sekaligus (lebih cepat)
2. **Auto-Sort**: Otomatis mengurutkan berdasarkan nomor
3. **Sheet Caching**: Cache referensi sheet untuk performa
4. **Lock Service**: Mencegah race condition
5. **Get Last Numbers**: API untuk mendapatkan nomor terakhir setiap kategori

## Troubleshooting

### Data tidak masuk ke sheet
- Pastikan script sudah di-deploy sebagai Web App
- Pastikan "Who has access" = Anyone
- Check authorization sudah diberikan

### Error "Permission denied"
- Jalankan `testSync()` dan authorize permission
- Pastikan email yang execute adalah owner spreadsheet

### Data tidak terurut
- Script akan auto-sort saat batch terakhir dikirim
- Atau manual trigger dengan `triggerSort: true`
