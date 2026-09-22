// ============================================================================
// BACKEND APPS SCRIPT DUY NHẤT CHO "5 PHÚT TIẾNG ANH" — dán TOÀN BỘ file này
// vào 1 project Apps Script (Extensions > Apps Script từ Google Sheet lưu dữ
// liệu). Gồm 2 phần độc lập, dùng chung 1 sheet "Progress":
//
//   PHẦN 1 — doGet(): xác thực email bằng mã OTP + đồng bộ hồ sơ/tiến độ 2
//   chiều với app. Đây là hàm mà app.js đang gọi tới qua webAppUrl trong
//   data/sheets-config.js — THIẾU hàm này (hoặc thiếu cả file) là lý do màn
//   "Xác thực email" báo "Không gửi được mã..." (Google trả về trang lỗi
//   "Không tìm thấy hàm tập lệnh: doGet" thay vì JSON).
//
//   PHẦN 2 — sendInactivityReminders()/sendWeeklyDigest(): 2 hàm chạy theo
//   lịch (Time-driven Trigger, tự cấu hình riêng, KHÔNG liên quan doGet) để
//   nhắc ba mẹ qua email khi bé nghỉ học lâu, và gửi báo cáo tuần.
//
// Nếu project đã có sẵn 1 hàm doGet() khác từ trước (kể cả bản lỗi/rỗng),
// XOÁ hàm đó đi trước khi dán — Apps Script không cho 2 hàm doGet() trùng tên
// trong cùng 1 project.
// ============================================================================

const CONFIG = {
  SHEET_NAME: 'Progress',
  FROM_NAME: '5 Phút Tiếng Anh',

  // --- Phần 1: xác thực OTP ---
  OTP_TTL_MINUTES: 10,          // mã hết hạn sau bao nhiêu phút
  RESEND_COOLDOWN_SECONDS: 60,  // phải đợi bao lâu mới được gửi lại mã (khớp startResendCooldown(60) trong app.js)
  DAILY_SEND_LIMIT: 10,         // tối đa bao nhiêu lần gửi mã / email / ngày

  // --- Phần 2: nhắc học qua email ---
  INACTIVE_DAYS_THRESHOLD: 2,   // bao nhiêu ngày không học liên tiếp thì gửi email nhắc
  APP_URL: 'https://ten-mien-cua-ban.com', // đổi thành domain thật bạn đang host
};

// Cột theo đúng thứ tự sẽ tự tạo trên sheet "Progress" nếu sheet chưa có/chưa
// có tiêu đề — Phần 1 (doGet) đọc/ghi các cột này bằng TÊN, không phải A/B/C.
const AUTH_HEADERS = [
  'Email', 'DeviceId', 'Name', 'Age', 'Avatar', 'Phone', 'Progress',
  'OtpCode', 'OtpExpiresAt', 'OtpLastSentAt', 'OtpSentCountToday', 'OtpSentCountDate',
  'UpdatedAt',
];

// Từ khoá để Phần 2 (nhắc học) tự dò cột Email/Progress theo TÊN Ở HÀNG TIÊU
// ĐỀ (không phân biệt hoa/thường) — vẫn khớp header 'Email'/'Progress' ở trên.
const EMAIL_HEADER_HINTS = ['email'];
const PROGRESS_HEADER_HINTS = ['progress', 'tiến độ', 'tiendo'];

// ============================================================================
// PHẦN 1 — XÁC THỰC EMAIL (OTP) + ĐỒNG BỘ HỒ SƠ/TIẾN ĐỘ
// ============================================================================

// ---------- ĐIỂM VÀO DUY NHẤT: mọi request GET từ app đều qua đây ----------
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  let result;
  try {
    switch (action) {
      case 'sendCode':
        result = handleSendCode_(e.parameter.email);
        break;
      case 'verifyCode':
        result = handleVerifyCode_(e.parameter.email, e.parameter.code);
        break;
      case 'getUserData':
        result = handleGetUserData_(e.parameter.email, e.parameter.deviceId);
        break;
      case 'saveProgress':
        result = handleSaveProgress_(e.parameter.email, e.parameter.deviceId, e.parameter.progress);
        break;
      case 'checkSession':
        result = handleCheckSession_(e.parameter.email, e.parameter.deviceId);
        break;
      case 'saveProfile':
        result = handleSaveProfile_(e.parameter);
        break;
      default:
        result = { ok: false, error: 'unknown_action' };
    }
  } catch (err) {
    result = { ok: false, error: 'server_error', message: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- action=sendCode ----------
// Sinh mã 6 số, lưu vào sheet kèm hạn dùng, gửi qua email. Có chặn gửi dồn dập
// (too_soon) và chặn spam trong ngày (daily_limit) — đúng 2 mã lỗi app.js đã
// biết map sẵn sang tiếng Việt (xem mapBackendError trong app.js).
function handleSendCode_(email) {
  if (!isValidEmail_(email)) return { ok: false, error: 'invalid_email' };

  const sheet = getSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = getOrCreateRowForEmail_(sheet, email);
    const now = new Date();

    const lastSentRaw = getCell_(sheet, row, 'OtpLastSentAt');
    if (lastSentRaw) {
      const secsSince = (now - new Date(lastSentRaw)) / 1000;
      if (secsSince < CONFIG.RESEND_COOLDOWN_SECONDS) return { ok: false, error: 'too_soon' };
    }

    const todayStr = formatDateYmd_(now);
    const sentDate = getCell_(sheet, row, 'OtpSentCountDate');
    let sentCount = Number(getCell_(sheet, row, 'OtpSentCountToday')) || 0;
    if (sentDate !== todayStr) sentCount = 0; // sang ngày mới thì reset đếm
    if (sentCount >= CONFIG.DAILY_SEND_LIMIT) return { ok: false, error: 'daily_limit' };

    const code = generateOtpCode_();
    const expiresAt = new Date(now.getTime() + CONFIG.OTP_TTL_MINUTES * 60000);

    setCell_(sheet, row, 'OtpCode', code);
    setCell_(sheet, row, 'OtpExpiresAt', expiresAt.toISOString());
    setCell_(sheet, row, 'OtpLastSentAt', now.toISOString());
    setCell_(sheet, row, 'OtpSentCountToday', sentCount + 1);
    setCell_(sheet, row, 'OtpSentCountDate', todayStr);

    try {
      MailApp.sendEmail({
        to: email,
        subject: 'Mã xác thực "5 Phút Tiếng Anh": ' + code,
        body: 'Chào ba mẹ,\n\n' +
          'Mã xác thực đăng nhập "5 Phút Tiếng Anh" là: ' + code + '\n\n' +
          'Mã có hiệu lực trong ' + CONFIG.OTP_TTL_MINUTES + ' phút. Nếu không phải ba mẹ yêu cầu, hãy bỏ qua email này.\n\n' +
          '— ' + CONFIG.FROM_NAME,
        name: CONFIG.FROM_NAME,
      });
    } catch (mailErr) {
      return { ok: false, error: 'send_failed' };
    }

    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------- action=verifyCode ----------
function handleVerifyCode_(email, code) {
  const sheet = getSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = findRowByEmail_(sheet, email);
    if (row === -1) return { ok: false, error: 'expired_or_missing' };

    const storedCode = getCell_(sheet, row, 'OtpCode');
    const expiresAtRaw = getCell_(sheet, row, 'OtpExpiresAt');
    if (!storedCode || !expiresAtRaw) return { ok: false, error: 'expired_or_missing' };
    if (new Date() > new Date(expiresAtRaw)) return { ok: false, error: 'expired_or_missing' };
    if (String(code).trim() !== String(storedCode).trim()) return { ok: false, error: 'wrong_code' };

    // Dùng xong thì xoá mã ngay để không ai dùng lại được (kể cả đúng mã cũ).
    setCell_(sheet, row, 'OtpCode', '');
    setCell_(sheet, row, 'OtpExpiresAt', '');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------- action=getUserData ----------
// Gọi ngay sau khi xác thực mã thành công. Vừa trả hồ sơ/tiến độ đã lưu trên
// cloud (nếu có), vừa biến thiết bị gọi hàm này thành thiết bị "đang hoạt
// động" của email đó (ghi đè thiết bị active trước đó, nếu có).
function handleGetUserData_(email, deviceId) {
  const sheet = getSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = getOrCreateRowForEmail_(sheet, email);
    setCell_(sheet, row, 'DeviceId', deviceId || '');
    setCell_(sheet, row, 'UpdatedAt', new Date().toISOString());

    const name = getCell_(sheet, row, 'Name');
    const progressRaw = getCell_(sheet, row, 'Progress');
    const found = !!(name || progressRaw);
    if (!found) return { ok: true, found: false };

    let progress = null;
    if (progressRaw) {
      try { progress = JSON.parse(progressRaw); } catch (e) { progress = null; }
    }
    let profile = null;
    if (name) {
      profile = {
        name: name,
        age: Number(getCell_(sheet, row, 'Age')) || null,
        avatar: getCell_(sheet, row, 'Avatar') || '🧒',
        parentPhone: String(getCell_(sheet, row, 'Phone') || ''),
      };
    }
    return { ok: true, found: true, profile: profile, progress: progress };
  } finally {
    lock.releaseLock();
  }
}

// ---------- action=saveProgress ----------
// App gọi fire-and-forget (không đọc response) mỗi khi tiến độ đổi. Chặn ghi
// nếu request đến từ 1 thiết bị KHÔNG phải thiết bị đang active của email đó,
// để tránh thiết bị đã bị đăng xuất/đè lại ghi đè tiến độ mới hơn của thiết bị
// đang dùng thật.
function handleSaveProgress_(email, deviceId, progressJson) {
  if (!email || !progressJson) return { ok: false, error: 'missing_params' };
  const sheet = getSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = getOrCreateRowForEmail_(sheet, email);
    const activeDevice = getCell_(sheet, row, 'DeviceId');
    if (activeDevice && deviceId && activeDevice !== deviceId) return { ok: false, error: 'device_mismatch' };

    setCell_(sheet, row, 'Progress', progressJson);
    setCell_(sheet, row, 'UpdatedAt', new Date().toISOString());
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------- action=checkSession ----------
// App tự hỏi mỗi lần mở: thiết bị này còn là thiết bị active của email đó
// không, hay đã bị 1 thiết bị khác xác thực đè lên.
function handleCheckSession_(email, deviceId) {
  const sheet = getSheet_();
  const row = findRowByEmail_(sheet, email);
  if (row === -1) return { ok: true, active: true };
  const activeDevice = getCell_(sheet, row, 'DeviceId');
  return { ok: true, active: !activeDevice || activeDevice === deviceId };
}

// ---------- action=saveProfile ----------
function handleSaveProfile_(p) {
  const email = p.email;
  if (!email) return { ok: false, error: 'missing_params' };
  const sheet = getSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = getOrCreateRowForEmail_(sheet, email);
    const activeDevice = getCell_(sheet, row, 'DeviceId');
    if (activeDevice && p.deviceId && activeDevice !== p.deviceId) return { ok: false, error: 'device_mismatch' };

    setCell_(sheet, row, 'Name', p.name || '');
    setCell_(sheet, row, 'Age', p.age || '');
    setCell_(sheet, row, 'Avatar', p.avatar || '');
    setCell_(sheet, row, 'Phone', p.phone || '');
    setCell_(sheet, row, 'UpdatedAt', new Date().toISOString());
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------- Helpers Phần 1 — sheet "Progress": 1 dòng / email, cột theo AUTH_HEADERS ----------

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(AUTH_HEADERS);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(AUTH_HEADERS);
  }
  return sheet;
}

function col_(name) {
  const idx = AUTH_HEADERS.indexOf(name);
  if (idx === -1) throw new Error('Cột không tồn tại: ' + name);
  return idx + 1; // Range dùng chỉ số 1-based
}

function findRowByEmail_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, col_('Email'), lastRow - 1, 1).getValues();
  const target = String(email || '').toLowerCase().trim();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === target) return i + 2;
  }
  return -1;
}

function getOrCreateRowForEmail_(sheet, email) {
  const existing = findRowByEmail_(sheet, email);
  if (existing !== -1) return existing;
  sheet.appendRow([email]); // các cột còn lại để trống, điền dần qua setCell_
  return sheet.getLastRow();
}

function getCell_(sheet, row, name) {
  return sheet.getRange(row, col_(name)).getValue();
}

function setCell_(sheet, row, name, value) {
  sheet.getRange(row, col_(name)).setValue(value);
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function generateOtpCode_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function formatDateYmd_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// ============================================================================
// PHẦN 2 — NHẮC HỌC QUA EMAIL (chạy theo lịch, không liên quan doGet)
// ============================================================================

// Tìm chỉ số cột (0-based) của hàng tiêu đề khớp 1 trong các từ khoá cho trước.
function findColumnIndex_(headerRow, hints) {
  for (let i = 0; i < headerRow.length; i++) {
    const cell = String(headerRow[i] || '').toLowerCase();
    if (hints.some(h => cell.includes(h))) return i;
  }
  return -1;
}

// ---------- 2a) NHẮC HỌC KHI BÉ NGHỈ >= N NGÀY LIÊN TIẾP ----------
// Gắn hàm này vào 1 Time-driven Trigger chạy 1 lần/ngày (VD 19h tối) trong menu
// Triggers (⏰) của Apps Script — Edit > Current project's triggers > Add Trigger.
function sendInactivityReminders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { Logger.log('Không tìm thấy sheet "' + CONFIG.SHEET_NAME + '" — sửa SHEET_NAME trong CONFIG.'); return; }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return; // chỉ có header, chưa có dữ liệu

  const header = data[0];
  const emailCol = findColumnIndex_(header, EMAIL_HEADER_HINTS);
  const progressCol = findColumnIndex_(header, PROGRESS_HEADER_HINTS);
  if (emailCol === -1 || progressCol === -1) {
    Logger.log('Không tìm thấy cột email/progress theo từ khoá cấu hình — mở sheet xem tên cột thật rồi sửa EMAIL_HEADER_HINTS/PROGRESS_HEADER_HINTS.');
    return;
  }

  const today = new Date();
  let sentCount = 0;

  for (let r = 1; r < data.length; r++) {
    const email = data[r][emailCol];
    const progressRaw = data[r][progressCol];
    if (!email || !progressRaw) continue;

    let progress;
    try { progress = JSON.parse(progressRaw); } catch (e) { continue; } // ô này không phải JSON hợp lệ, bỏ qua

    const lastDate = progress && progress.streak && progress.streak.lastDate;
    if (!lastDate) continue; // chưa học buổi nào, không có gì để nhắc "lỡ mất"

    const daysSince = Math.floor((today - new Date(lastDate)) / (1000 * 60 * 60 * 24));
    if (daysSince < CONFIG.INACTIVE_DAYS_THRESHOLD) continue;

    // Tránh gửi lại nhiều lần cùng 1 hôm nghỉ — chỉ gửi đúng vào ngày daysSince CHẠM ngưỡng lần
    // đầu (VD ngưỡng 2: gửi khi lỡ đúng 2 ngày, không gửi lại mỗi ngày sau đó nữa cho tới khi họ
    // quay lại học rồi lại nghỉ tiếp). Nếu muốn nhắc lại định kỳ (VD mỗi 3 ngày sau đó), đổi dòng
    // dưới thành: if (daysSince !== threshold && daysSince % 3 !== 0) continue;
    if (daysSince !== CONFIG.INACTIVE_DAYS_THRESHOLD) continue;

    const streakBest = (progress.streak && progress.streak.best) || 0;
    const subject = 'Bé đang nhớ "5 Phút Tiếng Anh" đó! 💚';
    const body =
      'Chào ba mẹ,\n\n' +
      'Đã ' + daysSince + ' ngày bé chưa vào học tiếp rồi. ' +
      (streakBest > 1 ? 'Bé từng đạt chuỗi ' + streakBest + ' ngày liên tiếp — quay lại học ngay hôm nay để giữ phong độ nhé!' : 'Chỉ cần 5 phút mỗi ngày là đủ, ba mẹ cùng bé vào học lại nhé!') +
      '\n\n👉 ' + CONFIG.APP_URL +
      '\n\n— ' + CONFIG.FROM_NAME;

    try {
      MailApp.sendEmail({ to: email, subject: subject, body: body, name: CONFIG.FROM_NAME });
      sentCount++;
    } catch (e) {
      Logger.log('Gửi email nhắc thất bại cho ' + email + ': ' + e);
    }
  }

  Logger.log('Đã gửi ' + sentCount + ' email nhắc học.');
}

// ---------- 2b) BÁO CÁO TUẦN CHO BA MẸ ----------
// Gắn vào 1 Time-driven Trigger chạy 1 lần/tuần (VD Chủ nhật 20h) — trigger riêng, tách khỏi
// sendInactivityReminders() để 2 việc không phụ thuộc lịch của nhau.
function sendWeeklyDigest() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { Logger.log('Không tìm thấy sheet "' + CONFIG.SHEET_NAME + '".'); return; }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  const header = data[0];
  const emailCol = findColumnIndex_(header, EMAIL_HEADER_HINTS);
  const progressCol = findColumnIndex_(header, PROGRESS_HEADER_HINTS);
  if (emailCol === -1 || progressCol === -1) { Logger.log('Không tìm thấy cột email/progress.'); return; }

  let sentCount = 0;
  for (let r = 1; r < data.length; r++) {
    const email = data[r][emailCol];
    const progressRaw = data[r][progressCol];
    if (!email || !progressRaw) continue;

    let progress;
    try { progress = JSON.parse(progressRaw); } catch (e) { continue; }
    if (!progress || !progress.streak || !progress.streak.lastDate) continue; // chưa học lần nào, chưa có gì để báo cáo

    const doneTopicsCount = progress.doneTopics ? Object.keys(progress.doneTopics).length : 0;
    const stars = progress.stars || 0;
    const streakCount = progress.streak.count || 0;

    const subject = '📊 Báo cáo tuần học tiếng Anh của bé';
    const body =
      'Chào ba mẹ,\n\n' +
      'Tổng kết tiến độ học của bé tính tới hôm nay:\n' +
      '⭐ Tổng số sao: ' + stars + '\n' +
      '📚 Số chủ đề đã học xong: ' + doneTopicsCount + '\n' +
      '🔥 Chuỗi ngày học liên tiếp hiện tại: ' + streakCount + ' ngày\n\n' +
      'Ba mẹ cùng bé vào học tiếp để giữ đà nhé!\n' +
      '👉 ' + CONFIG.APP_URL +
      '\n\n— ' + CONFIG.FROM_NAME;

    try {
      MailApp.sendEmail({ to: email, subject: subject, body: body, name: CONFIG.FROM_NAME });
      sentCount++;
    } catch (e) {
      Logger.log('Gửi báo cáo tuần thất bại cho ' + email + ': ' + e);
    }
  }

  Logger.log('Đã gửi ' + sentCount + ' báo cáo tuần.');
}

// ============================================================================
// CÁCH CÀI ĐẶT (làm 1 lần):
// 1. Mở Google Sheet dùng để lưu dữ liệu (hoặc mở thẳng project Apps Script
//    đang gắn với Web App URL trong data/sheets-config.js) — Extensions >
//    Apps Script.
// 2. Nếu project đang có code cũ (VD chỉ có sendInactivityReminders/
//    sendWeeklyDigest như hiện tại, không có doGet) — XOÁ HẾT code cũ trong
//    file đó, dán TOÀN BỘ nội dung file này đè vào (trừ khối comment hướng
//    dẫn cuối cùng).
// 3. Sửa CONFIG.APP_URL thành domain thật bạn đang host, kiểm tra
//    CONFIG.SHEET_NAME đúng tên tab đang lưu dữ liệu.
// 4. Deploy > Manage deployments > bấm bút chì (Edit) trên deployment đang có
//    URL trùng với webAppUrl trong data/sheets-config.js > mục Version chọn
//    "New version" > Deploy. (Nếu chưa từng deploy Web App, dùng New
//    deployment, chọn loại "Web app", Execute as "Me", Who has access
//    "Anyone" — rồi copy URL /exec dán vào data/sheets-config.js.)
//    Lần đầu Google sẽ hỏi cấp quyền đọc/ghi Sheet + gửi email — bấm Allow.
// 5. Báo lại để mình gọi thử API (curl) xác nhận đã hết lỗi ở màn xác thực
//    email.
// 6. (Tuỳ chọn) Bật nhắc học tự động: vào Triggers (icon ⏰ bên trái) > Add
//    Trigger > chọn hàm sendInactivityReminders, loại "Time-driven" > "Day
//    timer" > khung giờ muốn gửi (VD 19:00-20:00); thêm 1 trigger khác cho
//    sendWeeklyDigest, loại "Week timer", chọn 1 ngày trong tuần. Chạy thử
//    bằng tay (nút ▶ Run) trước khi bật trigger để kiểm tra log không lỗi.
//    MailApp có hạn ngạch ~100 email/ngày cho tài khoản Gmail thường.
// ============================================================================
