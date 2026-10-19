@echo off
rem Chạy mỗi ngày bằng Task Scheduler (tác vụ "5PhutTTS"): tạo tiếp giọng đọc còn thiếu — tiếng Anh rồi tiếng Trung
rem (mỗi mô hình Gemini chỉ cho ~100 lượt / ngày, 2 ngôn ngữ dùng 2 mô hình khác nhau nên chạy được cả hai).
rem Cả hai đều xong (generate.mjs thoát với mã 0) thì tự xoá lịch chạy hằng ngày.
chcp 65001 >nul
cd /d "%~dp0..\.."
echo. >> tools\tts\generate.log
echo ===== %date% %time% · tieng Anh ===== >> tools\tts\generate.log
"C:\Program Files\nodejs\node.exe" tools\tts\generate.mjs --prune >> tools\tts\generate.log 2>&1
set EN_RC=%errorlevel%
echo ===== %date% %time% · tieng Trung ===== >> tools\tts\generate.log
"C:\Program Files\nodejs\node.exe" tools\tts\generate.mjs --lang zh --prune >> tools\tts\generate.log 2>&1
set ZH_RC=%errorlevel%
if %EN_RC%==0 if %ZH_RC%==0 (
  echo TAT CA DA XONG - xoa lich chay hang ngay. >> tools\tts\generate.log
  schtasks /Delete /TN "5PhutTTS" /F >> tools\tts\generate.log 2>&1
)
