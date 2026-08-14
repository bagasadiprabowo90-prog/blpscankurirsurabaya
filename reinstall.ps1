# Script reinstall bersih - jalankan sebagai Administrator jika perlu
Write-Host "=== Menghapus node_modules ===" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "node_modules dihapus." -ForegroundColor Green
}

Write-Host "=== Menghapus package-lock.json ===" -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

Write-Host "=== npm install ===" -ForegroundColor Yellow
npm install

Write-Host "`n=== Cek apakah vite.cmd ada ===" -ForegroundColor Yellow
if (Test-Path "node_modules\.bin\vite.cmd") {
    Write-Host "OK! vite.cmd ditemukan." -ForegroundColor Green
    Write-Host "`nJalankan dev server dengan:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor White
} else {
    Write-Host "vite.cmd tidak ditemukan. Coba jalankan:" -ForegroundColor Red
    Write-Host "  node node_modules/vite/bin/vite.js" -ForegroundColor White
}
