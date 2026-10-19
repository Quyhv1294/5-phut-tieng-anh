# Giọng đọc tiếng Anh thu sẵn (Gemini TTS, Google AI Studio)

Công cụ `generate.mjs` dùng Gemini để tạo file mp3 cho mọi từ và câu tiếng Anh trong `data/`. Kết quả ghi vào:

- `assets/tts/en/gemini-<giọng>-<phiên bản>/`: các file mp3.
- `data/tts-en.js`: danh sách các câu đã có file.

Câu nào chưa có file thì app vẫn đọc bằng giọng của máy như trước.

## 1. Lấy khoá API (miễn phí, không cần thẻ)

1. Vào https://aistudio.google.com/apikey và đăng nhập tài khoản Google.
2. Bấm **Create API key**. Nếu được hỏi dự án thì chọn hoặc tạo một dự án bất kỳ.
3. Sao chép khoá (bắt đầu bằng `AIza...`).
4. Tạo file `tools/tts/gemini-api-key.txt`, dán khoá vào (chỉ 1 dòng) rồi lưu lại.
   - File này đã nằm trong `.gitignore`, sẽ **không** bị đưa lên GitHub.
   - **Không** dán khoá vào app, vào chat hay vào file nào khác.

## 2. Cài đặt (chỉ 1 lần)

Mở PowerShell tại thư mục gốc của app:

```powershell
cd tools/tts
npm install
cd ../..
```

Lệnh này cài thư viện nén mp3. Thư viện chỉ nằm trên máy anh/chị, không đưa vào app.

## 3. Chạy

```powershell
node tools/tts/generate.mjs --check    # đếm câu còn thiếu, không gọi Gemini
node tools/tts/generate.mjs --sample   # nghe thử giọng ở tools/tts/samples/
node tools/tts/generate.mjs            # tạo file còn thiếu
```

**Giới hạn của gói miễn phí:**

- Gemini giới hạn số lượt mỗi phút và mỗi ngày, nên khoảng 1.065 câu có thể phải chạy rải ra **vài ngày**.
- Khi hết lượt trong ngày, công cụ tự dừng và lưu tiến độ. Hôm sau anh/chị chạy lại đúng lệnh trên, công cụ bỏ qua câu đã có file và làm tiếp.
- Công cụ làm lớp Mầm trước, rồi tới lớp Chồi, rồi lớp Lá. Nhờ vậy lớp nhỏ có giọng mới sớm nhất.
- Bấm `Ctrl + C` để dừng giữa chừng. Tiến độ vẫn được lưu.

Sau mỗi lần chạy có tạo thêm file:

1. Tăng `CACHE_VERSION` trong `sw.js`.
2. Commit thư mục `assets/tts/en/`, file `data/tts-en.js` và `tools/tts/clips-en.json` (danh sách mã → câu, để tra cứu).

## 4. Khi thêm chủ đề hoặc sửa câu

Thêm hoặc sửa nội dung trong `data/` như bình thường, rồi chạy lại `node tools/tts/generate.mjs`.

Công cụ chỉ tạo file cho câu **mới** hoặc câu **đã sửa** (tên file là mã của nội dung câu). Thêm `--prune` để xoá các file của câu không còn dùng.

## 5. Đổi giọng hoặc cách đọc

Sửa ở đầu `generate.mjs`:

Mỗi ngôn ngữ có cấu hình riêng trong `PROFILES` (`en`, `zh`).

- **`VOICE`:** tên giọng. Nghe thử bằng `--sample`; danh sách giọng có tại https://ai.google.dev/gemini-api/docs/speech-generation
- **`STYLE`:** lời dặn cách đọc, ví dụ đọc chậm hơn, vui hơn. Sửa lời dặn thì **tăng `STYLE_VERSION`** (`v1` thành `v2`).
- **`MODEL`:** tên mô hình. Nếu Google đổi tên, công cụ tự in danh sách các mô hình đọc đang có.

Sau đó chạy `node tools/tts/generate.mjs --prune`. Giọng mới nằm ở thư mục mới, nên máy của bé không phát nhầm bản cũ. Thư mục giọng cũ bị xoá khi đã tạo xong toàn bộ.

## Ghi chú

- **Chữ IN HOA:** chữ in hoa trong dữ liệu (VD `I love my MOM.`) được đọc như chữ thường, để không bị đánh vần thành từ viết tắt. Chữ cái đứng riêng (`A`) thì được dặn đọc tên chữ cái.
- **Câu được đọc:** công cụ đọc các trường `en`, `example`, `q`, `a` trong `data/*.js`, trừ phần tiếng Trung, và bỏ qua chuỗi có dấu tiếng Việt. Nếu thêm loại dữ liệu mới dùng tên trường khác, cần sửa `EN_KEYS`.
- **Dùng khi mất mạng:** khi bé mở 1 chủ đề, app tải trước file của chủ đề đó. File lưu ở bộ nhớ đệm riêng, nên lần sau dùng được cả khi mất mạng.
- **Dữ liệu ở gói miễn phí:** Google có thể dùng nội dung gửi lên (từ vựng, câu cho bé) để cải thiện sản phẩm. Gửi lên không có thông tin cá nhân nào.

## Giọng đọc tiếng Trung

Thêm `--lang zh` vào mọi lệnh ở trên, ví dụ `node tools/tts/generate.mjs --lang zh --check`.

- **Mô hình riêng:** tiếng Trung dùng `gemini-2.5-flash-preview-tts`, tiếng Anh dùng `gemini-3.1-flash-tts-preview`. Hạn mức ~100 lượt / ngày tính riêng cho từng mô hình, nên hai ngôn ngữ chạy song song được.
- **Thứ tự ưu tiên:** bảng pinyin và 4 thanh điệu (`zh_roadmap.js`) trước, rồi lộ trình, từ vựng, bài nghe, bài đọc, đề thi thử.
- **Đọc đúng thanh:** từ ngắn (tối đa 4 chữ) có pinyin trong dữ liệu thì được dặn đọc đúng âm đó, tránh đọc sai chữ đa âm (VD 行 háng / xíng).
- **Câu được đọc:** mọi chuỗi có chữ Hán trong `zh_*.js` và `topics_zh.js`, trừ chuỗi lẫn tiếng Việt, pinyin hoặc chữ số (đó là ghi chú giải thích). Câu ghép lúc chạy (VD số 11–99, giờ, giá tiền) vẫn dùng giọng của máy.
- **Kết quả:** file ở `assets/tts/zh/`, danh sách ở `data/tts-zh.js` và `tools/tts/clips-zh.json`.
- **Lịch chạy hằng ngày** (`run-daily.cmd`) chạy tiếng Anh rồi tiếng Trung, và tự xoá lịch khi cả hai đã xong.
