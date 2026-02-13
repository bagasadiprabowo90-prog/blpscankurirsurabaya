# Google Apps Script - Dashboard Rekap Harian

Script ini menambahkan fitur Dashboard otomatis di Google Sheets untuk melihat rekap scan resi harian dan kumulatif.

## PENTING! Copy SELURUH Script Ini

```javascript
// ===============================================
// DASHBOARD FUNCTIONS - FIXED VERSION
// ===============================================

// GANTI DENGAN SPREADSHEET ID ANDA
const SPREADSHEET_ID = '1UvYl8XjDt4Rxg7_kX9gt3DsevJLV5OuhitHTITfxd2o';

// Courier sheet names - SUDAH SESUAI dengan Google Sheets Anda
const COURIER_SHEETS = [
  { name: 'SHOPEE', fullName: 'Shopee' },
  { name: 'JNT', fullName: 'JNT' },
  { name: 'GOTO', fullName: 'Goto' },
  { name: 'jne-zalora', fullName: 'JNE Zalora' },
  { name: 'zalora-sap', fullName: 'Zalora SAP' },
  { name: 'LAZADA', fullName: 'Lazada' },
  { name: 'NINJA', fullName: 'Ninja' },
  { name: 'instan-sameday', fullName: 'Instan & Sameday' },
  { name: 'spx-central', fullName: 'SPX Central' },
  { name: 'spare', fullName: 'Spare' }
];

// Mapping bulan Indonesia ke English
const MONTH_MAP = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'May': 4, 'Jun': 5,
  'Jul': 6, 'Agu': 7, 'Aug': 7, 'Sep': 8, 'Okt': 9, 'Oct': 9, 'Nov': 10, 'Des': 11, 'Dec': 11
};

/**
 * CRITICAL: Parse berbagai format tanggal dari Kolom C
 * Mendukung:
 * - "15 Jan 2026 16.38"
 * - "05 Jan 2026, 16.32.03"
 * - "05/01/26, 17.52.03"
 * - Date object dari Google Sheets
 * 
 * Returns: "YYYY-MM-DD" format untuk perbandingan yang konsisten
 */
function parseDateToYMD(value) {
  if (!value) return null;
  
  // Jika sudah Date object (dari Google Sheets)
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  
  const str = value.toString().trim();
  
  // Format 1: "15 Jan 2026 16.38" atau "05 Jan 2026, 16.32.03"
  const format1 = str.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (format1) {
    const day = format1[1].padStart(2, '0');
    const monthStr = format1[2];
    const year = format1[3];
    const month = MONTH_MAP[monthStr];
    if (month !== undefined) {
      return year + '-' + String(month + 1).padStart(2, '0') + '-' + day;
    }
  }
  
  // Format 2: "05/01/26, 17.52.03" (DD/MM/YY)
  const format2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})/);
  if (format2) {
    const day = format2[1].padStart(2, '0');
    const month = format2[2].padStart(2, '0');
    let year = parseInt(format2[3], 10);
    // Asumsi tahun 20xx jika < 50, 19xx jika >= 50
    year = year < 50 ? 2000 + year : 1900 + year;
    return year + '-' + month + '-' + day;
  }
  
  // Format 3: Try to parse as standard date string
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + d;
    }
  } catch (e) {}
  
  return null;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayYMD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

/**
 * Test function - jalankan ini untuk debug parsing tanggal
 */
function testDateParsing() {
  const testCases = [
    "15 Jan 2026 16.38",
    "05 Jan 2026, 16.32.03",
    "05/01/26, 17.52.03",
    "16/01/26, 10.00.00",
    new Date()
  ];
  
  console.log("Today YMD: " + getTodayYMD());
  console.log("---");
  
  for (const test of testCases) {
    const result = parseDateToYMD(test);
    const isToday = result === getTodayYMD();
    console.log("Input: " + test.toString());
    console.log("Parsed: " + result);
    console.log("Is Today: " + isToday);
    console.log("---");
  }
}

/**
 * Debug: Cek data dari sheet tertentu
 */
function debugSheetData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName || 'JNT');
  
  if (!sheet) {
    console.log('Sheet not found: ' + sheetName);
    return;
  }
  
  const todayYMD = getTodayYMD();
  console.log("Today: " + todayYMD);
  console.log("Sheet: " + sheetName);
  console.log("Total rows: " + sheet.getLastRow());
  
  const data = sheet.getDataRange().getValues();
  let todayCount = 0;
  
  // Tampilkan 10 baris pertama untuk debug
  for (let i = 1; i < Math.min(data.length, 11); i++) {
    const rawDate = data[i][2];
    const parsedDate = parseDateToYMD(rawDate);
    const isToday = parsedDate === todayYMD;
    console.log("Row " + (i+1) + ": Raw='" + rawDate + "' | Parsed=" + parsedDate + " | Today=" + isToday);
    if (isToday) todayCount++;
  }
  
  // Hitung total hari ini
  for (let i = 1; i < data.length; i++) {
    const parsedDate = parseDateToYMD(data[i][2]);
    if (parsedDate === todayYMD) {
      todayCount++;
    }
  }
  
  console.log("Total for today: " + todayCount);
}

/**
 * Create or update the Dashboard sheet
 */
function createDashboard() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let dashboard = ss.getSheetByName('Dashboard');

  if (!dashboard) {
    dashboard = ss.insertSheet('Dashboard', 0);
  }

  updateDashboard();
}

/**
 * MAIN FUNCTION: Update dashboard with latest data
 */
function updateDashboard() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let dashboard = ss.getSheetByName('Dashboard');

  if (!dashboard) {
    dashboard = ss.insertSheet('Dashboard', 0);
  }

  // Clear existing content
  dashboard.clear();
  
  // Remove existing charts
  const charts = dashboard.getCharts();
  for (const chart of charts) {
    dashboard.removeChart(chart);
  }

  const todayYMD = getTodayYMD();
  const todayFormatted = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy, HH.mm.ss');

  // ===== SECTION 1: HEADER =====
  dashboard.getRange('A1').setValue('📊 DASHBOARD REKAP SCAN RESI');
  dashboard.getRange('A1').setFontSize(18).setFontWeight('bold');
  dashboard.getRange('A2').setValue('Last Updated: ' + todayFormatted);
  dashboard.getRange('A2').setFontColor('#666666');

  // ===== SECTION 2: REKAP HARI INI =====
  dashboard.getRange('A4').setValue('📅 REKAP HARI INI (' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy') + ')');
  dashboard.getRange('A4').setFontSize(14).setFontWeight('bold');

  // Headers
  dashboard.getRange('A5:C5').setValues([['Kurir', 'Total Scan', 'Persentase']]);
  dashboard.getRange('A5:C5').setFontWeight('bold').setBackground('#E8F0FE');

  let row = 6;
  let todayGrandTotal = 0;
  const todayCounts = [];
  const allTimeCounts = [];

  // Count entries for each courier
  for (const courier of COURIER_SHEETS) {
    const sheet = ss.getSheetByName(courier.name);
    let todayCount = 0;
    let allTimeCount = 0;

    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      allTimeCount = data.length - 1; // Semua data minus header
      
      // Count today's entries - HANYA hitung yang tanggalnya PERSIS hari ini
      for (let i = 1; i < data.length; i++) {
        const rowDate = data[i][2]; // Column C = Waktu Scan
        const parsedDate = parseDateToYMD(rowDate);
        
        if (parsedDate === todayYMD) {
          todayCount++;
        }
      }
    }

    todayCounts.push({ name: courier.fullName, count: todayCount });
    allTimeCounts.push({ name: courier.fullName, count: allTimeCount });
    todayGrandTotal += todayCount;
  }

  // Sort by count descending
  todayCounts.sort((a, b) => b.count - a.count);

  // Write today's data
  for (const item of todayCounts) {
    const percentage = todayGrandTotal > 0 ? ((item.count / todayGrandTotal) * 100).toFixed(1) + '%' : '0%';
    dashboard.getRange(row, 1, 1, 3).setValues([[item.name, item.count, percentage]]);

    if (item.count > 0) {
      dashboard.getRange(row, 2).setBackground('#D4EDDA');
    }
    row++;
  }

  // Total row
  dashboard.getRange(row, 1, 1, 3).setValues([['TOTAL', todayGrandTotal, '100%']]);
  dashboard.getRange(row, 1, 1, 3).setFontWeight('bold').setBackground('#FFF3CD');

  // ===== SECTION 3: DONUT CHART (only if there's data) =====
  if (todayGrandTotal > 0) {
    const chartBuilder = dashboard.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(dashboard.getRange('A6:B' + (row - 1)))
      .setPosition(4, 5, 0, 0)
      .setOption('title', 'Persentase per Kurir')
      .setOption('pieHole', 0.4)
      .setOption('width', 450)
      .setOption('height', 350)
      .setOption('legend', { position: 'right' })
      .setOption('pieSliceText', 'percentage');

    dashboard.insertChart(chartBuilder.build());
  }

  // ===== SECTION 4: TOTAL KUMULATIF =====
  const historyRow = row + 3;
  dashboard.getRange('A' + historyRow).setValue('📦 TOTAL KUMULATIF (SEMUA DATA)');
  dashboard.getRange('A' + historyRow).setFontSize(14).setFontWeight('bold');

  dashboard.getRange('A' + (historyRow + 1) + ':B' + (historyRow + 1)).setValues([['Kurir', 'Total']]);
  dashboard.getRange('A' + (historyRow + 1) + ':B' + (historyRow + 1)).setFontWeight('bold').setBackground('#E8F0FE');

  // Sort all-time counts
  allTimeCounts.sort((a, b) => b.count - a.count);
  
  let hRow = historyRow + 2;
  let allTimeTotal = 0;
  for (const item of allTimeCounts) {
    if (item.count > 0) {
      dashboard.getRange(hRow, 1, 1, 2).setValues([[item.name, item.count]]);
      allTimeTotal += item.count;
      hRow++;
    }
  }
  
  // All-time total
  dashboard.getRange(hRow, 1, 1, 2).setValues([['TOTAL', allTimeTotal]]);
  dashboard.getRange(hRow, 1, 1, 2).setFontWeight('bold').setBackground('#FFF3CD');

  // Format columns
  dashboard.setColumnWidth(1, 150);
  dashboard.setColumnWidth(2, 100);
  dashboard.setColumnWidth(3, 100);

  // Freeze header
  dashboard.setFrozenRows(3);
  
  console.log('Dashboard updated! Today: ' + todayGrandTotal + ', All-time: ' + allTimeTotal);
}

/**
 * Manual refresh - panggil dari menu
 */
function refreshDashboard() {
  updateDashboard();
  SpreadsheetApp.getActive().toast('Dashboard berhasil diupdate!', '✅ Success');
}

/**
 * Add menu to spreadsheet
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔄 Resi Manager')
    .addItem('Refresh Dashboard', 'refreshDashboard')
    .addItem('Debug JNT Data', 'debugJNT')
    .addItem('Test Date Parsing', 'testDateParsing')
    .addToUi();
}

/**
 * Quick debug for JNT sheet
 */
function debugJNT() {
  debugSheetData('JNT');
}

/**
 * Setup hourly auto-refresh
 */
function setupDashboardTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'updateDashboard') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger('updateDashboard')
    .timeBased()
    .everyHours(1)
    .create();

  console.log('Dashboard trigger created - will update every hour');
}
```

## Cara Pakai

### Step 1: Copy Script
1. Buka Google Apps Script project Anda
2. **HAPUS script dashboard lama** (jika ada)
3. Copy-paste SELURUH kode di atas
4. Pastikan `SPREADSHEET_ID` sudah benar
5. Klik **Save**

### Step 2: Test Parsing Tanggal
1. Pilih function **`testDateParsing`** dari dropdown
2. Klik **Run ▶️**
3. Lihat hasil di **Logs** (View > Logs)
4. Pastikan tanggal hari ini ter-parse dengan benar

### Step 3: Debug Data JNT
1. Pilih function **`debugJNT`**
2. Klik **Run ▶️**
3. Lihat di Logs apakah data JNT ter-parse dengan benar
4. Perhatikan kolom "Today=" - harus `true` untuk data hari ini

### Step 4: Update Dashboard
1. Pilih function **`createDashboard`**
2. Klik **Run ▶️**
3. Buka sheet **Dashboard**
4. Sekarang seharusnya menampilkan data yang benar

## Troubleshooting

### Jika data masih salah:
1. Jalankan `debugJNT()` dan lihat output di Logs
2. Screenshot hasil Logs dan bagikan ke saya
3. Saya akan sesuaikan parsing-nya

### Format tanggal yang didukung:
- ✅ `15 Jan 2026 16.38`
- ✅ `05 Jan 2026, 16.32.03`
- ✅ `05/01/26, 17.52.03`
- ✅ Date object dari Google Sheets
