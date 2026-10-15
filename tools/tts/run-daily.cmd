@echo off
rem Chạy mỗi ngày bằng Task Scheduler (tác vụ "5PhutTTS"): tạo tiếp giọng đọc còn thiếu (Gemini chỉ cho ~100 lượt / ngày).
rem Tạo xong toàn bộ (generate.mjs thoát với mã 0) thì tự xoá lịch chạy hằng ngày.
chcp 65001 >nul
cd /d "%~dp0..\.."
echo. >> tools\tts\generate.log
echo ===== %date% %time% ===== >> tools\tts\generate.log
"C:\Program Files\nodejs\node.exe" tools\tts\generate.mjs --prune >> tools\tts\generate.log 2>&1
if %errorlevel%==0 (
  echo TAT CA DA XONG - xoa lich chay hang ngay. >> tools\tts\generate.log
  schtasks /Delete /TN "5PhutTTS" /F >> tools\tts\generate.log 2>&1
)
