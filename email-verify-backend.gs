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
//   PHẦN 2 — sendInactivityReminders(): hàm chạy theo
//   lịch (Time-driven Trigger, tự cấu hình riêng, KHÔNG liên quan doGet) để
//   nhắc học qua email khi nghỉ học lâu — riêng cho
//   tiếng Anh (cột Progress) và Tiếng Trung (cột ProgressZh).
//
// Nếu project đã có sẵn 1 hàm doGet() khác từ trước (kể cả bản
// lỗi/rỗng), XOÁ hàm đó đi trước khi dán — Apps Script không cho 2 hàm trùng
// tên trong cùng 1 project.
// ============================================================================

const CONFIG = {
  SHEET_NAME: 'Progress',
  FROM_NAME: '5 Phút Tiếng Anh',
  FROM_NAME_ZH: '5 Phút Tiếng Trung', // tên người gửi cho email của người học Tiếng Trung

  // --- Phần 1: xác thực OTP ---
  OTP_TTL_MINUTES: 10,          // mã hết hạn sau bao nhiêu phút
  RESEND_COOLDOWN_SECONDS: 60,  // phải đợi bao lâu mới được gửi lại mã (khớp startResendCooldown(60) trong app.js)
  DAILY_SEND_LIMIT: 10,         // tối đa bao nhiêu lần gửi mã / email / ngày

  // --- Ý kiến phản hồi của người dùng (action=saveFeedback) ---
  FEEDBACK_SHEET_NAME: 'Feedback', // tab riêng, tự tạo lần đầu có người gửi ý kiến
  FEEDBACK_MAX_LEN: 500,           // khớp FEEDBACK_MAX_LEN trong app.js
  FEEDBACK_DAILY_LIMIT: 5,         // tối đa bao nhiêu ý kiến / thiết bị / ngày (chống spam)

  // --- Phần 2: nhắc học qua email ---
  // Đang TẠM TẮT email nhắc học (cả tiếng Anh lẫn Tiếng Trung). Muốn bật lại: đổi thành true,
  // Lưu + Deploy (New version). Trigger có chạy cũng không gửi gì khi đang tắt.
  REMINDERS_ENABLED: false,
  INACTIVE_DAYS_THRESHOLD: 2,   // bao nhiêu ngày không học liên tiếp thì gửi email nhắc
  APP_URL: 'https://quyhv1294.github.io/5-phut-tieng-anh/', // địa chỉ app (GitHub Pages) — dùng trong email nhắc học
};

// Cột theo đúng thứ tự sẽ tự tạo trên sheet "Progress" nếu sheet chưa có/chưa
// có tiêu đề — Phần 1 (doGet) đọc/ghi các cột này bằng TÊN, không phải A/B/C.
const AUTH_HEADERS = [
  'Email', 'DeviceId', 'Name', 'Age', 'Avatar', 'Phone', 'Progress',
  'OtpCode', 'OtpExpiresAt', 'OtpLastSentAt', 'OtpSentCountToday', 'OtpSentCountDate',
  'UpdatedAt',
  // Thêm SAU CÙNG để không xê dịch cột của sheet đang có (getSheet_ tự điền tiêu đề còn thiếu).
  'ProgressZh', // tiến độ khoá Tiếng Trung (JSON) — tách riêng khỏi cột Progress của tiếng Anh
  'Source',     // nguồn đầu tiên đưa người dùng tới app (?src=fb-reel, zalo, group, share, cert…; truc-tiep = không có mã)
];

// Tab "Visits": mỗi MÁY mở app lần đầu = 1 dòng (kể cả người học thử chưa lưu bằng email) — đếm người tới
// theo nguồn. Ẩn danh: không có email / tên / số điện thoại.
const VISITS_SHEET_NAME = 'Visits';
const VISITS_HEADERS = ['Time', 'DeviceId', 'Source', 'Lang', 'Platform'];

// Cột của tab "Feedback" (mỗi ý kiến 1 dòng, thứ tự cột = thứ tự trong appendRow ở handleSaveFeedback_).
const FEEDBACK_HEADERS = ['Time', 'Email', 'Name', 'Rating', 'Category', 'Message', 'Platform', 'DeviceId', 'Status'];

// Từ khoá để Phần 2 (nhắc học) tự dò cột Email/Progress theo TÊN Ở HÀNG TIÊU
// ĐỀ (không phân biệt hoa/thường) — vẫn khớp header 'Email'/'Progress' ở trên.
const EMAIL_HEADER_HINTS = ['email'];
const PROGRESS_HEADER_HINTS = ['progress', 'tiến độ', 'tiendo'];

// ============================================================================
// PHẦN 1 — XÁC THỰC EMAIL (OTP) + ĐỒNG BỘ HỒ SƠ/TIẾN ĐỘ
// ============================================================================

// ---------- POST: tiến độ Tiếng Trung (JSON lớn, không nhét vừa URL của GET) ----------
// App gửi text/plain {action:'saveProgress', email, deviceId, lang:'zh', progress:'<json>'}.
function doPost(e) {
  let result;
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'saveProgress') {
      const json = typeof body.progress === 'string' ? body.progress : JSON.stringify(body.progress || '');
      result = handleSaveProgress_(body.email, body.deviceId, json, body.lang);
    } else {
      result = { ok: false, error: 'unknown_action' };
    }
  } catch (err) {
    result = { ok: false, error: 'server_error', message: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- ĐIỂM VÀO DUY NHẤT: mọi request GET từ app đều qua đây ----------
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  let result;
  try {
    switch (action) {
      case 'sendCode':
        result = handleSendCode_(e.parameter.email, e.parameter.lang);
        break;
      case 'verifyCode':
        result = handleVerifyCode_(e.parameter.email, e.parameter.code);
        break;
      case 'getUserData':
        result = handleGetUserData_(e.parameter.email, e.parameter.deviceId);
        break;
      case 'saveProgress':
        result = handleSaveProgress_(e.parameter.email, e.parameter.deviceId, e.parameter.progress, e.parameter.lang);
        break;
      case 'checkSession':
        result = handleCheckSession_(e.parameter.email, e.parameter.deviceId);
        break;
      case 'saveProfile':
        result = handleSaveProfile_(e.parameter);
        break;
      case 'saveFeedback':
        result = handleSaveFeedback_(e.parameter);
        break;
      case 'logVisit':
        result = handleLogVisit_(e.parameter);
        break;
      case 'logActive':
        result = handleLogActive_(e.parameter);
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
// lang = 'zh' (app đang ở chế độ học Tiếng Trung) → email viết cho người học, tên app Tiếng Trung.
function handleSendCode_(email, lang) {
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
      const zh = lang === 'zh';
      const appName = zh ? CONFIG.FROM_NAME_ZH : CONFIG.FROM_NAME;
      MailApp.sendEmail({
        to: email,
        subject: 'Mã xác thực "' + appName + '": ' + code,
        body: (zh ? 'Chào bạn,\n\n' : 'Chào ba mẹ,\n\n') +
          'Mã xác thực đăng nhập "' + appName + '" là: ' + code + '\n\n' +
          'Mã có hiệu lực trong ' + CONFIG.OTP_TTL_MINUTES + ' phút. Nếu không phải ' + (zh ? 'bạn' : 'ba mẹ') + ' yêu cầu, hãy bỏ qua email này.\n\n' +
          '— ' + appName,
        name: appName,
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
    const progressZhRaw = getCell_(sheet, row, 'ProgressZh');
    const found = !!(name || progressRaw || progressZhRaw);
    // zhSync: báo app biết backend này đã có cột ProgressZh (bản cũ không trả trường này → app
    // không gửi tiến độ Tiếng Trung, tránh ghi nhầm vào cột Progress của tiếng Anh).
    if (!found) return { ok: true, found: false, zhSync: true };

    let progress = null, progressZh = null;
    if (progressRaw) {
      try { progress = JSON.parse(progressRaw); } catch (e) { progress = null; }
    }
    if (progressZhRaw) {
      try { progressZh = JSON.parse(progressZhRaw); } catch (e) { progressZh = null; }
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
    return { ok: true, found: true, profile: profile, progress: progress, progressZh: progressZh, zhSync: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------- action=saveProgress ----------
// App gọi fire-and-forget (không đọc response) mỗi khi tiến độ đổi. Chặn ghi
// nếu request đến từ 1 thiết bị KHÔNG phải thiết bị đang active của email đó,
// để tránh thiết bị đã bị đăng xuất/đè lại ghi đè tiến độ mới hơn của thiết bị
// đang dùng thật.
// lang = 'zh' → ghi vào cột ProgressZh; còn lại (không truyền) → cột Progress của tiếng Anh.
function handleSaveProgress_(email, deviceId, progressJson, lang) {
  if (!email || !progressJson) return { ok: false, error: 'missing_params' };
  const sheet = getSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = getOrCreateRowForEmail_(sheet, email);
    const activeDevice = getCell_(sheet, row, 'DeviceId');
    if (activeDevice && deviceId && activeDevice !== deviceId) return { ok: false, error: 'device_mismatch' };

    setCell_(sheet, row, lang === 'zh' ? 'ProgressZh' : 'Progress', progressJson);
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
  if (row === -1) return { ok: true, active: true, zhSync: true };
  const activeDevice = getCell_(sheet, row, 'DeviceId');
  return { ok: true, active: !activeDevice || activeDevice === deviceId, zhSync: true };
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
    // Nguồn chỉ ghi lần đầu (giữ nguồn gốc thật, không bị lần lưu sau từ máy khác ghi đè).
    if (p.src && !getCell_(sheet, row, 'Source')) setCell_(sheet, row, 'Source', safeCell_(p.src, 40));
    setCell_(sheet, row, 'UpdatedAt', new Date().toISOString());
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------- action=saveFeedback ----------
// Mỗi ý kiến = 1 dòng MỚI ở tab "Feedback" (khác tab "Progress" là 1 dòng / email). Gọi từ màn
// Cài đặt > "Gửi ý kiến cho chúng tôi" trong app. Web App này công khai nên phải tự chặn spam:
// tối đa FEEDBACK_DAILY_LIMIT ý kiến / thiết bị / ngày, và cắt độ dài mọi trường.
function handleSaveFeedback_(p) {
  const message = String(p.message || '').trim().slice(0, CONFIG.FEEDBACK_MAX_LEN);
  if (message.length < 5) return { ok: false, error: 'message_too_short' };
  const rating = Math.min(5, Math.max(1, Number(p.rating) || 0));
  if (!Number(p.rating)) return { ok: false, error: 'missing_params' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getFeedbackSheet_();
    const now = new Date();
    const deviceId = String(p.deviceId || '').slice(0, 64);

    // Đếm số ý kiến cùng thiết bị trong hôm nay (đọc tối đa ~200 dòng cuối cho nhanh).
    const lastRow = sheet.getLastRow();
    if (deviceId && lastRow >= 2) {
      const fromRow = Math.max(2, lastRow - 199);
      const rows = sheet.getRange(fromRow, 1, lastRow - fromRow + 1, FEEDBACK_HEADERS.length).getValues();
      const todayStr = formatDateYmd_(now);
      const devIdx = FEEDBACK_HEADERS.indexOf('DeviceId');
      const timeIdx = FEEDBACK_HEADERS.indexOf('Time');
      let sentToday = 0;
      rows.forEach(function (r) {
        if (String(r[devIdx]) === deviceId && r[timeIdx] instanceof Date && formatDateYmd_(r[timeIdx]) === todayStr) sentToday++;
      });
      if (sentToday >= CONFIG.FEEDBACK_DAILY_LIMIT) return { ok: false, error: 'feedback_limit' };
    }

    sheet.appendRow([
      now,
      safeCell_(p.email, 120),
      safeCell_(p.name, 60),
      rating,
      safeCell_(p.category, 40),
      safeCell_(message, CONFIG.FEEDBACK_MAX_LEN),
      safeCell_(p.platform, 60),
      deviceId,
      'Mới',   // Trạng thái xử lý — bạn tự đổi thành "Đã đọc"/"Đã xử lý" trên Sheet
    ]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------- action=logVisit ----------
// App gọi đúng 1 lần / máy (lần mở đầu tiên). Bỏ qua mã máy đã có trong ~500 dòng cuối để chống ghi trùng.
function handleLogVisit_(p) {
  const deviceId = String(p.deviceId || '').slice(0, 64);
  if (!deviceId) return { ok: false, error: 'missing_params' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(VISITS_SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(VISITS_SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(VISITS_HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, VISITS_HEADERS.length).setFontWeight('bold');
    }
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const fromRow = Math.max(2, lastRow - 499);
      const ids = sheet.getRange(fromRow, 2, lastRow - fromRow + 1, 1).getValues();
      if (ids.some(function (r) { return String(r[0]) === deviceId; })) return { ok: true, dup: true };
    }
    sheet.appendRow([new Date(), deviceId, safeCell_(p.src || 'truc-tiep', 40), safeCell_(p.lang, 4), safeCell_(p.platform, 60)]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------- action=logActive ----------
// Nhịp hoạt động: 1 dòng / máy / ngày (cập nhật số bài trong ngày). Không có email hay tên.
const ACTIVE_SHEET_NAME = 'Active';
const ACTIVE_HEADERS = ['Day', 'DeviceId', 'Lang', 'Class', 'Sessions', 'FirstSeen', 'LastSeen', 'Source'];

function handleLogActive_(p) {
  const deviceId = String(p.deviceId || '').slice(0, 64);
  const day = String(p.day || '');
  if (!deviceId || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return { ok: false, error: 'missing_params' };
  // Chỉ nhận ngày gần hôm nay (chống ghi bậy ngày xa); múi giờ máy có thể lệch ±1 ngày.
  const diff = Math.abs(new Date(day + 'T12:00:00Z').getTime() - Date.now()) / 86400000;
  if (diff > 2) return { ok: false, error: 'bad_day' };
  const sessions = Math.max(0, Math.min(99, parseInt(p.sessions, 10) || 0));
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ACTIVE_SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(ACTIVE_SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(ACTIVE_HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, ACTIVE_HEADERS.length).setFontWeight('bold');
      sheet.getRange('A:A').setNumberFormat('@');
    }
    const lastRow = sheet.getLastRow();
    const now = new Date();
    if (lastRow >= 2) {
      const fromRow = Math.max(2, lastRow - 999);
      const rows = sheet.getRange(fromRow, 1, lastRow - fromRow + 1, 2).getValues();
      for (let i = rows.length - 1; i >= 0; i--) {
        if (String(rows[i][0]) === day && String(rows[i][1]) === deviceId) {
          const row = fromRow + i;
          sheet.getRange(row, 5).setValue(sessions);
          sheet.getRange(row, 7).setValue(now);
          return { ok: true, updated: true };
        }
      }
    }
    sheet.appendRow([day, deviceId, safeCell_(p.lang, 4), safeCell_(p.cls, 8), sessions, now, now, safeCell_(p.src || '', 40)]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// Chạy tay trong trình soạn Apps Script (Run ▶ activityReport) → xem kết quả ở Execution log.
// Số máy mới / máy hoạt động theo ngày, và tỷ lệ quay lại sau 1 ngày, 7 ngày.
function activityReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ACTIVE_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) { Logger.log('Chưa có dữ liệu trong tab Active.'); return; }
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  const days = {};            // ngày → { deviceId: sessions }
  const firstDay = {};        // deviceId → ngày đầu tiên thấy
  rows.forEach(function (r) {
    const d = String(r[0]), id = String(r[1]);
    (days[d] = days[d] || {})[id] = Number(r[4]) || 0;
    if (!firstDay[id] || d < firstDay[id]) firstDay[id] = d;
  });
  const dayList = Object.keys(days).sort();
  const addDays = function (d, n) { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  Logger.log('Ngày | máy hoạt động | máy mới | có học ≥1 bài');
  dayList.forEach(function (d) {
    const ids = Object.keys(days[d]);
    Logger.log(d + ' | ' + ids.length + ' | ' + ids.filter(function (id) { return firstDay[id] === d; }).length
      + ' | ' + ids.filter(function (id) { return days[d][id] >= 1; }).length);
  });
  const last = dayList[dayList.length - 1];
  [1, 7].forEach(function (n) {
    let base = 0, back = 0;
    Object.keys(firstDay).forEach(function (id) {
      const target = addDays(firstDay[id], n);
      if (target > last) return;   // chưa đủ ngày để biết
      base++;
      if (days[target] && days[target][id] !== undefined) back++;
    });
    Logger.log('Quay lại đúng ngày thứ ' + n + ': ' + back + '/' + base + (base ? ' (' + Math.round(100 * back / base) + '%)' : ''));
  });
  Logger.log('Tổng số máy đã từng hoạt động: ' + Object.keys(firstDay).length);
}

// Cắt độ dài + chặn "chèn công thức" (ô bắt đầu bằng = + - @ sẽ bị Google Sheet hiểu là công thức,
// người lạ có thể lợi dụng vì Web App này công khai) bằng cách thêm dấu ' phía trước.
function safeCell_(value, maxLen) {
  let s = String(value == null ? '' : value).trim().slice(0, maxLen);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function getFeedbackSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.FEEDBACK_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.FEEDBACK_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(FEEDBACK_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, FEEDBACK_HEADERS.length).setFontWeight('bold');
  }
  return sheet;
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
  // Sheet tạo từ bản cũ thiếu cột mới thêm ở cuối AUTH_HEADERS (VD ProgressZh) → điền tiêu đề còn thiếu.
  const lastCol = sheet.getLastColumn();
  if (lastCol < AUTH_HEADERS.length) {
    sheet.getRange(1, lastCol + 1, 1, AUTH_HEADERS.length - lastCol).setValues([AUTH_HEADERS.slice(lastCol)]);
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

// Đọc sheet cho Phần 2: trả về { data, emailCol, cols: { en, zh } } (zh = -1 nếu chưa có cột ProgressZh).
// Cột tiếng Anh dò theo PROGRESS_HEADER_HINTS (khớp cột đầu tiên — tức 'Progress', đứng trước 'ProgressZh').
function readProgressSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { Logger.log('Không tìm thấy sheet "' + CONFIG.SHEET_NAME + '" — sửa SHEET_NAME trong CONFIG.'); return null; }
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null; // chỉ có header, chưa có dữ liệu
  const header = data[0];
  const emailCol = findColumnIndex_(header, EMAIL_HEADER_HINTS);
  const enCol = findColumnIndex_(header, PROGRESS_HEADER_HINTS);
  const zhCol = header.findIndex(h => String(h || '').toLowerCase().trim() === 'progresszh');
  if (emailCol === -1 || enCol === -1) {
    Logger.log('Không tìm thấy cột email/progress theo từ khoá cấu hình — mở sheet xem tên cột thật rồi sửa EMAIL_HEADER_HINTS/PROGRESS_HEADER_HINTS.');
    return null;
  }
  return { data: data, emailCol: emailCol, cols: { en: enCol, zh: zhCol } };
}

function parseProgress_(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; } // ô không phải JSON hợp lệ thì bỏ qua
}

function daysSince_(dateStr, today) {
  return Math.floor((today - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

// ---------- 2a) NHẮC HỌC KHI NGHỈ >= N NGÀY LIÊN TIẾP ----------
// Gắn hàm này vào 1 Time-driven Trigger chạy 1 lần/ngày (VD 19h tối) trong menu
// Triggers (⏰) của Apps Script — Edit > Current project's triggers > Add Trigger.
// Tiếng Anh (cột Progress, viết cho ba mẹ) và Tiếng Trung (cột ProgressZh, viết cho người học)
// xét RIÊNG: ai học cả 2 mà nghỉ 1 bên thì chỉ nhắc bên đó.
function sendInactivityReminders() {
  if (!CONFIG.REMINDERS_ENABLED) { Logger.log('Email nhắc học đang tắt (CONFIG.REMINDERS_ENABLED = false) — không gửi gì.'); return; }
  const sh = readProgressSheet_();
  if (!sh) return;
  const today = new Date();
  let sentCount = 0;

  for (let r = 1; r < sh.data.length; r++) {
    const email = sh.data[r][sh.emailCol];
    if (!email) continue;
    ['en', 'zh'].forEach(function (lang) {
      if (sh.cols[lang] === -1) return;
      const progress = parseProgress_(sh.data[r][sh.cols[lang]]);
      const lastDate = progress && progress.streak && progress.streak.lastDate;
      if (!lastDate) return; // chưa học buổi nào, không có gì để nhắc "lỡ mất"

      // Chỉ gửi đúng vào ngày số ngày nghỉ CHẠM ngưỡng lần đầu (VD ngưỡng 2: gửi khi lỡ đúng 2 ngày,
      // không gửi lại mỗi ngày sau đó cho tới khi quay lại học rồi lại nghỉ tiếp). Muốn nhắc lại định
      // kỳ (VD mỗi 3 ngày sau đó) thì đổi thành: if (days !== threshold && days % 3 !== 0) return;
      const days = daysSince_(lastDate, today);
      if (days !== CONFIG.INACTIVE_DAYS_THRESHOLD) return;

      const mail = lang === 'zh' ? zhReminderMail_(progress, days) : enReminderMail_(progress, days);
      try {
        MailApp.sendEmail({ to: email, subject: mail.subject, body: mail.body, name: mail.from });
        sentCount++;
      } catch (e) {
        Logger.log('Gửi email nhắc thất bại cho ' + email + ' (' + lang + '): ' + e);
      }
    });
  }

  Logger.log('Đã gửi ' + sentCount + ' email nhắc học.');
}

function enReminderMail_(progress, days) {
  const streakBest = (progress.streak && progress.streak.best) || 0;
  return {
    from: CONFIG.FROM_NAME,
    subject: 'Bé đang nhớ "5 Phút Tiếng Anh" đó! 💚',
    body:
      'Chào ba mẹ,\n\n' +
      'Đã ' + days + ' ngày bé chưa vào học tiếp rồi. ' +
      (streakBest > 1 ? 'Bé từng đạt chuỗi ' + streakBest + ' ngày liên tiếp — quay lại học ngay hôm nay để giữ phong độ nhé!' : 'Chỉ cần 5 phút mỗi ngày là đủ, ba mẹ cùng bé vào học lại nhé!') +
      '\n\n👉 ' + CONFIG.APP_URL +
      '\n\n— ' + CONFIG.FROM_NAME,
  };
}

function zhReminderMail_(progress, days) {
  const z = zhStats_(progress);
  return {
    from: CONFIG.FROM_NAME_ZH,
    subject: 'Đã ' + days + ' ngày bạn chưa học tiếng Trung 📚',
    body:
      'Chào bạn,\n\n' +
      'Đã ' + days + ' ngày bạn chưa vào học tiếp khoá Tiếng Trung. ' +
      (z.due > 0 ? 'Hiện có ' + z.due + ' từ đã đến hạn ôn — ôn ngay để không quên nhé! ' : '') +
      (z.streakBest > 1 ? 'Bạn từng học ' + z.streakBest + ' ngày liên tiếp, quay lại hôm nay để giữ nhịp nhé!' : 'Chỉ cần 5 phút mỗi ngày là đủ, vào học tiếp nhé!') +
      '\n\n📈 Tiến độ: ' + z.units + ' chặng đã xong · ' + z.words + ' từ đã học' +
      '\n\n👉 ' + CONFIG.APP_URL +
      '\n\n— ' + CONFIG.FROM_NAME_ZH,
  };
}

// Số liệu khoá Tiếng Trung từ progress.zh (xem zh-course.js): units = chặng đã xong,
// srs = từ đã học (mỗi từ có hạn ôn "due" dạng yyyy-MM-dd).
function zhStats_(progress) {
  const z = (progress && progress.zh) || {};
  const srs = z.srs || {};
  const todayStr = formatDateYmd_(new Date());
  return {
    units: Object.keys(z.units || {}).length,
    words: Object.keys(srs).length,
    due: Object.keys(srs).filter(k => srs[k] && srs[k].due && srs[k].due <= todayStr).length,
    stars: progress.stars || 0,
    streak: (progress.streak && progress.streak.count) || 0,
    streakBest: (progress.streak && progress.streak.best) || 0,
  };
}

// ============================================================================
// CÁCH CÀI ĐẶT (làm 1 lần):
// 1. Mở Google Sheet dùng để lưu dữ liệu (hoặc mở thẳng project Apps Script
//    đang gắn với Web App URL trong data/sheets-config.js) — Extensions >
//    Apps Script.
// 2. Nếu project đang có code cũ (VD chỉ có sendInactivityReminders/
//    như hiện tại, không có doGet) — XOÁ HẾT code cũ trong
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
//    timer" > khung giờ muốn gửi (VD 19:00-20:00). Chạy thử
//    bằng tay (nút ▶ Run) trước khi bật trigger để kiểm tra log không lỗi.
//    MailApp có hạn ngạch ~100 email/ngày cho tài khoản Gmail thường.
// ============================================================================
