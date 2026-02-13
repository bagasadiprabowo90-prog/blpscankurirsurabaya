# 📦 Aplikasi Scan Resi Kurir - WH Online Surabaya

Aplikasi web untuk scanning dan tracking resi kurir dengan 6 kategori, sync otomatis ke Google Sheets, dan export Excel.

## ✨ Fitur Utama

- 📱 **Scan Barcode/QR** dengan kamera
- ⌨️ **Input Manual** dengan format bebas
- 🏷️ **6 Kategori Kurir**: Shopee, J&T, GOTO, JNE, INSTAN, Lainnya
- 🔍 **Deteksi Duplikat** otomatis
- 📊 **Dashboard Statistik** lengkap
- ☁️ **Sync ke Google Sheets** real-time
- 📑 **Export Excel** per kategori
- 🖨️ **Print Label** resi
- 🔔 **Sound Notification**
- 📱 **Progressive Web App (PWA)**

## 🚀 Demo Live

Deploy ke Vercel: [Akan diupdate setelah deploy]

## 📋 Kategori Kurir

| No | Kategori | ID | Mode Input |
|----|----------|----|------------|
| 1 | Shopee | `shopee` | Manual |
| 2 | J&T Express | `jnt` | Manual |
| 3 | GOTO | `goto` | Manual |
| 4 | JNE | `jne` | Manual |
| 5 | INSTAN | `instan-sameday` | Manual |
| 6 | Lainnya | `spare` | Manual |

**Mode Input**: Pilih tab kurir → Input resi dengan format apapun → Resi masuk ke kategori tab aktif

## 🔗 Google Sheets Integration

Aplikasi terhubung dengan Google Sheets:
- **Nama**: Database Scan Resi WH Online Surabaya
- **URL**: [Google Sheets](https://docs.google.com/spreadsheets/d/1M28Dn7jF1Rq3HE010MB5c365xcSsEY-9adG8GaFoOtw/edit)
- **Sync**: Otomatis setiap scan resi

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Database**: IndexedDB (Dexie.js)
- **Charts**: Recharts
- **Excel Export**: ExcelJS
- **Barcode Scanner**: html5-qrcode

## 📦 Installation

```bash
# Clone repository
git clone <YOUR_REPO_URL>
cd blpbeautyscankurir-main

# Install dependencies dengan Bun (recommended) atau npm
bun install
# atau
npm install

# Jalankan development server
bun run dev
# atau
npm run dev
```

Aplikasi akan berjalan di: `http://localhost:5173`

## 🚀 Build & Deploy

```bash
# Build production
bun run build
# atau
npm run build

# Preview build
bun run preview
# atau
npm run preview
```

### Deploy ke Vercel

1. Push code ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Deploy otomatis setiap push ke main branch

## 📖 Dokumentasi

- [PANDUAN_UPDATE.md](PANDUAN_UPDATE.md) - Panduan lengkap fitur aplikasi
- [UPDATE_FINAL.md](UPDATE_FINAL.md) - Ringkasan update dan testing
- [docs/GOOGLE_APPS_SCRIPT_5_CATEGORIES.md](docs/GOOGLE_APPS_SCRIPT_5_CATEGORIES.md) - Setup Google Apps Script

## 🎯 Cara Penggunaan

### 1. Scan/Input Resi

1. Pilih tab kategori kurir (Shopee/J&T/GOTO/JNE/INSTAN/Lainnya)
2. Klik tombol "Scan Barcode" atau ketik manual
3. Input nomor resi (format bebas)
4. Resi otomatis masuk ke kategori tab yang aktif

### 2. Lihat Data

- Tab per kategori menampilkan resi yang sudah discan
- Nomor urut otomatis per kategori
- Status OK atau DUPLIKAT
- Timestamp scan

### 3. Sync ke Google Sheets

- Klik tombol "Sync to Google Sheets"
- Data otomatis tersinkronisasi
- Sheet terpisah per kategori

### 4. Export Excel

- Klik tombol "Export to Excel"
- Download file Excel dengan 6 sheet
- Format: No, Resi, Waktu Scan, Status

### 5. Dashboard

- Lihat statistik lengkap
- Chart pie distribution
- Chart bar per kategori
- Timeline scan

## 🔧 Configuration

### Google Sheets URL

Update URL di `src/lib/googleSheetsSync.ts`:
```typescript
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL';
```

### Kategori Kurir

Edit di `src/lib/courierCategories.ts` untuk menambah/edit kategori.

## 📄 License

MIT License - Free to use

## 👨‍💻 Developer

BLP Beauty - WH Online Surabaya

---

**Version**: 3.0 - 6 Categories with Manual Input
**Last Update**: 24 Januari 2026
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
