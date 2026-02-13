# Panduan Push ke GitHub dan Deploy Vercel

## 🔧 Langkah 1: Setup GitHub Repository

### Opsi A: Buat Repo Baru di GitHub (Manual)

1. **Buka GitHub**: https://github.com/new
2. **Nama Repository**: `blpbeautyscankurir` atau nama lain
3. **Visibility**: Public atau Private
4. **JANGAN** centang "Initialize with README" (sudah ada)
5. Klik **Create repository**

### Opsi B: Gunakan GitHub CLI (jika sudah install)

```bash
# Login ke GitHub
gh auth login

# Buat repository baru
gh repo create blpbeautyscankurir --public --source=. --remote=origin

# Push ke GitHub
git push -u origin main
```

### Opsi C: Push Manual ke Existing Repository

```bash
# Tambahkan remote GitHub
git remote add origin https://github.com/YOUR_USERNAME/blpbeautyscankurir.git

# Push ke GitHub
git push -u origin main
```

## 🚀 Langkah 2: Deploy ke Vercel

### Cara Termudah (Vercel Dashboard):

1. **Buka Vercel**: https://vercel.com/new
2. **Import Git Repository**:
   - Klik "Import Project"
   - Pilih GitHub
   - Authorize Vercel jika belum
   - Pilih repository `blpbeautyscankurir`

3. **Configure Project**:
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables** (Optional):
   - Tidak ada yang perlu ditambahkan
   - Google Apps Script URL sudah ada di code

5. **Klik Deploy**:
   - Tunggu proses build (2-3 menit)
   - Selesai! Aplikasi live di: `https://NAMA_PROJECT.vercel.app`

### Atau Gunakan Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy Production
vercel --prod
```

## ✅ Setelah Deploy

1. **Test Aplikasi**:
   - Buka URL Vercel
   - Test scan/input resi
   - Check sync ke Google Sheets

2. **Update README.md**:
   - Ganti URL demo dengan URL Vercel
   - Commit dan push

```bash
# Update README dengan URL live
git add README.md
git commit -m "Update demo URL"
git push
```

3. **Auto-Deploy**:
   - Setiap push ke GitHub akan auto-deploy ke Vercel
   - Branch `main` → Production
   - Branch lain → Preview

## 🔗 Link Penting

- **Repository GitHub**: `https://github.com/YOUR_USERNAME/blpbeautyscankurir`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **Live App**: `https://NAMA_PROJECT.vercel.app` (setelah deploy)
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1M28Dn7jF1Rq3HE010MB5c365xcSsEY-9adG8GaFoOtw/edit

## 🐛 Troubleshooting

### Error saat push ke GitHub

```bash
# Jika error authentication
git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/blpbeautyscankurir.git
```

### Error saat build di Vercel

- Check Node version: Gunakan Node 18 atau 20
- Check build command: `npm run build` atau `bun run build`
- Check output directory: `dist`

### Aplikasi tidak bisa sync ke Google Sheets

- Pastikan Google Apps Script masih aktif
- Check console browser untuk error
- Test URL Apps Script di browser

## 📝 Commands Recap

```bash
# 1. Status Git
git status

# 2. Add & Commit
git add .
git commit -m "Your message"

# 3. Push ke GitHub
git push -u origin main

# 4. Deploy ke Vercel
vercel --prod

# 5. Check logs Vercel
vercel logs
```

---

**Status Current**: 
✅ Git initialized
✅ All files committed
⏳ Waiting: Push to GitHub
⏳ Waiting: Deploy to Vercel
