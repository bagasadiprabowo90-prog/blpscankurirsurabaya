@echo off
netstat -an | find ":8080" | find "LISTEN" >nul 2>&1
if %errorlevel% neq 0 (
  echo Port 8080 not running, starting dev server...
  start "" cmd /k "cd /d C:\Users\Ahmad Chanif\blpscankurirsurabaya && npm run dev"
)
echo {}
