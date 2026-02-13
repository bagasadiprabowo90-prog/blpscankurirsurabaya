# Panduan Update Aplikasi - 5 Kategori Kurir

## Perubahan yang Dilakukan

Aplikasi telah diupdate dari **9 kategori** menjadi **6 kategori kurir**:

### Kategori yang Dipertahankan:
1. ✅ **Shopee** (shopee)
2. ✅ **J&T Express** (jnt) 
3. ✅ **GOTO** (goto)
4. ✅ **JNE** (jne) - BARU ✨
5. ✅ **INSTAN** (instan-sameday)
6. ✅ **Lainnya** (spare)

### Kategori yang Dihapus:
- ❌ JNE & Zalora (jne-zalora)
- ❌ Zalora SAP (zalora-sap)
- ❌ Lazada (lazada)
- ❌ Ninja Express (ninja)
- ❌ SPX Central (spx-central)

## Google Sheets Baru

Aplikasi sekarang terhubung dengan Google Sheets:
- **Nama**: Database Scan Resi WH Online Surabaya
- **URL**: https://docs.google.com/spreadsheets/d/1M28Dn7jF1Rq3HE010MB5c365xcSsEY-9adG8GaFoOtw/edit

## Langkah Setup (WAJIB DILAKUKAN)

### ✅ Google Apps Script Sudah Terpasang

Aplikasi sudah terhubung dengan Google Apps Script yang aktif:
- **URL Web App**: `...AKfycbxMZ6zRi6WgQVqMeJxmvRb-NTfG6nJAJ_OQCsKwMWRoY2hLXU6XEe11aEO4FAw3jzZUOg/exec`
- Script sudah dikonfigurasi di [src/lib/googleSheetsSync.ts](src/lib/googleSheetsSync.ts)
- **TIDAK PERLU DEPLOY ULANG** - Script akan otomatis membuat sheet JNE saat pertama kali menerima data

### 1. Install Dependencies & Jalankan Aplikasi

```bash
# Install dependencies
bun install

# Jalankan development server
bun run dev
```

## Fitur yang Masih Sama

✅ Scan resi dengan kamera atau input manual
✅ **Input bebas** - pilih kategori manual untuk setiap resi
✅ Deteksi duplikat
✅ Export ke Excel
✅ Sync ke Google Sheets
✅ Dashboard statistik
✅ Print label

## Mode Input

**Pattern Detection: DISABLED** - Semua resi harus dipilih kategorinya secara manual.

Kenapa? Untuk fleksibilitas maksimal, Anda bisa input resi dengan format apapun ke kategori manapun sesuai kebutuhan.

## Testing

Setelah setup, test aplikasi dengan:

1. Input resi dengan format bebas (pilih kategori manual di tab):
   - Tab **Shopee**: Input resi apapun → masuk kategori Shopee
   - Tab **J&T**: Input resi apapun → masuk kategori J&T
   - Tab **GOTO**: Input resi apapun → masuk kategori GOTO
   - Tab **JNE**: Input resi apapun → masuk kategori JNE
   - Tab **INSTAN**: Input resi apapun → masuk kategori Instan
   - Tab **Lainnya**: Input resi apapun → masuk kategori Lainnya

   Contoh: `ABC123`, `999888`, `SPXID123`, `JT456` - semua bisa masuk ke tab manapun yang aktif

2. Check apakah data masuk ke Google Sheets dengan kategori yang benar
3. Verifikasi nomor urut terurut dengan benar per kategori

## Troubleshooting

### Data tidak sync ke Google Sheets
- Pastikan sudah deploy Google Apps Script
- Pastikan URL Apps Script sudah diupdate di `googleSheetsSync.ts`
- Check permission di Apps Script (harus "Anyone")

### Tab tidak muncul
- Clear browser cache
- Restart development server

### Resi masuk ke kategori yang salah
- Mode input sekarang **MANUAL** - pastikan Anda berada di tab yang benar saat input resi
- Resi akan masuk ke kategori tab yang sedang aktif
- Tidak ada auto-detection

## File yang Diubah

1. `src/lib/courierCategories.ts` - 6 kategori kurir (tambah JNE), pattern kosong (input manual)
2. `src/lib/googleSheetsSync.ts` - URL Google Sheets diupdate + komentar
3. `src/pages/Dashboard.tsx` - Warna chart disesuaikan untuk 6 kategori
4. `docs/GOOGLE_APPS_SCRIPT_5_CATEGORIES.md` - Script untuk Google Sheets

## Support

Jika ada masalah, check:
1. Console browser (F12) untuk error
2. Logs di Apps Script editor
3. Data di IndexedDB browser
