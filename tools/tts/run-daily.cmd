@echo off
rem Chạy mỗi ngày bằng Task Scheduler (tác vụ "5PhutTTS"): tạo tiếp giọng đọc còn thiếu (Gemini ~100 lượt / ngày).
rem Ưu tiên tiếng Anh: chỉ khi tiếng Anh đã xong toàn bộ (generate.mjs thoát với mã 0) mới chuyển sang tiếng Trung.
rem Tiếng Trung cũng xong thì tự xoá lịch chạy hằng ngày.
chcp 65001 >nul
cd /d "%~dp0..\.."
echo. >> tools\tts\generate.log
echo ===== %date% %time% - tieng Anh ===== >> tools\tts\generate.log
"C:\Program Files\nodejs\node.exe" tools\tts\generate.mjs --prune >> tools\tts\generate.log 2>&1
if not %errorlevel%==0 goto :eof
echo ===== %date% %time% - tieng Trung ===== >> tools\tts\generate.log
"C:\Program Files\nodejs\node.exe" tools\tts\generate.mjs --lang zh --prune >> tools\tts\generate.log 2>&1
if %errorlevel%==0 (
  echo TAT CA DA XONG - xoa lich chay hang ngay. >> tools\tts\generate.log
  schtasks /Delete /TN "5PhutTTS" /F >> tools\tts\generate.log 2>&1
)
