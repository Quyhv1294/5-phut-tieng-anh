// ============================================================================
// NHẮC HỌC QUA EMAIL — dán vào project Apps Script HIỆN CÓ (script đang gửi mã
// OTP xác thực email của "5 Phút Tiếng Anh") rồi bật Time-driven Trigger để
// chạy tự động mỗi ngày. File này KHÔNG thay thế code cũ — chỉ thêm 2 hàm mới,
// không đụng gì tới doGet()/doPost() hay logic gửi OTP đang có.
//
// MÌNH KHÔNG CÓ QUYỀN TRUY CẬP project Apps Script này nên không tự dán/chạy
// thử được — bạn cần tự dán, chỉnh CONFIG bên dưới cho khớp sheet thật, chạy
// thử 1 lần bằng tay (nút ▶ Run trong trình soạn thảo Apps Script) trước khi
// bật trigger tự động.
//
// GIẢ ĐỊNH (dựa theo dữ liệu app gửi lên qua action=saveProgress&email=...
// &progress=<JSON>): mỗi dòng trong sheet lưu tiến độ có 1 cột chứa EMAIL và
// 1 cột chứa JSON progress (chuỗi y hệt progress.stars/progress.streak.lastDate
// .../ trong app.js). Script tự dò cột theo TÊN Ở HÀNG TIÊU ĐỀ (không cố định
// theo chữ cái cột A/B/C) để đỡ phải sửa code nếu sheet đổi thứ tự cột — nhưng
// nếu dò không ra, hãy mở sheet, xem tên cột thật rồi sửa EMAIL_HEADER_HINTS /
// PROGRESS_HEADER_HINTS bên dưới cho khớp.
// ============================================================================

const REMINDER_CONFIG = {
  // Tên sheet (tab) đang lưu tiến độ đồng bộ từ action=saveProgress — đổi lại
  // cho đúng tên tab thật trong Google Sheet của bạn.
  SHEET_NAME: 'Progress',

  // Từ khoá để tự tìm cột (không phân biệt hoa/thường, chỉ cần chứa 1 trong các
  // từ này ở ô tiêu đề — VD "Email", "email khách hàng" đều khớp EMAIL).
  EMAIL_HEADER_HINTS: ['email'],
  PROGRESS_HEADER_HINTS: ['progress', 'tiến độ', 'tiendo'],

  // Bao nhiêu ngày không học liên tiếp thì gửi email nhắc.
  INACTIVE_DAYS_THRESHOLD: 2,

  // Tên người gửi hiện trong hộp thư người nhận.
  FROM_NAME: '5 Phút Tiếng Anh',

  // Đường link app — đổi thành domain thật bạn đang host.
  APP_URL: 'https://ten-mien-cua-ban.com',
};

// Tìm chỉ số cột (0-based) của hàng tiêu đề khớp 1 trong các từ khoá cho trước.
function findColumnIndex_(headerRow, hints) {
  for (let i = 0; i < headerRow.length; i++) {
    const cell = String(headerRow[i] || '').toLowerCase();
    if (hints.some(h => cell.includes(h))) return i;
  }
  return -1;
}

// ---------- 1) NHẮC HỌC KHI BÉ NGHỈ >= N NGÀY LIÊN TIẾP ----------
// Gắn hàm này vào 1 Time-driven Trigger chạy 1 lần/ngày (VD 19h tối) trong menu
// Triggers (⏰) của Apps Script — Edit > Current project's triggers > Add Trigger.
function sendInactivityReminders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REMINDER_CONFIG.SHEET_NAME);
  if (!sheet) { Logger.log('Không tìm thấy sheet "' + REMINDER_CONFIG.SHEET_NAME + '" — sửa SHEET_NAME trong REMINDER_CONFIG.'); return; }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return; // chỉ có header, chưa có dữ liệu

  const header = data[0];
  const emailCol = findColumnIndex_(header, REMINDER_CONFIG.EMAIL_HEADER_HINTS);
  const progressCol = findColumnIndex_(header, REMINDER_CONFIG.PROGRESS_HEADER_HINTS);
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
    if (daysSince < REMINDER_CONFIG.INACTIVE_DAYS_THRESHOLD) continue;

    // Tránh gửi lại nhiều lần cùng 1 hôm nghỉ — chỉ gửi đúng vào ngày daysSince CHẠM ngưỡng lần
    // đầu (VD ngưỡng 2: gửi khi lỡ đúng 2 ngày, không gửi lại mỗi ngày sau đó nữa cho tới khi họ
    // quay lại học rồi lại nghỉ tiếp). Nếu muốn nhắc lại định kỳ (VD mỗi 3 ngày sau đó), đổi dòng
    // dưới thành: if (daysSince !== threshold && daysSince % 3 !== 0) continue;
    if (daysSince !== REMINDER_CONFIG.INACTIVE_DAYS_THRESHOLD) continue;

    const streakBest = (progress.streak && progress.streak.best) || 0;
    const subject = 'Bé đang nhớ "5 Phút Tiếng Anh" đó! 💚';
    const body =
      'Chào ba mẹ,\n\n' +
      'Đã ' + daysSince + ' ngày bé chưa vào học tiếp rồi. ' +
      (streakBest > 1 ? 'Bé từng đạt chuỗi ' + streakBest + ' ngày liên tiếp — quay lại học ngay hôm nay để giữ phong độ nhé!' : 'Chỉ cần 5 phút mỗi ngày là đủ, ba mẹ cùng bé vào học lại nhé!') +
      '\n\n👉 ' + REMINDER_CONFIG.APP_URL +
      '\n\n— ' + REMINDER_CONFIG.FROM_NAME;

    try {
      MailApp.sendEmail({ to: email, subject: subject, body: body, name: REMINDER_CONFIG.FROM_NAME });
      sentCount++;
    } catch (e) {
      Logger.log('Gửi email nhắc thất bại cho ' + email + ': ' + e);
    }
  }

  Logger.log('Đã gửi ' + sentCount + ' email nhắc học.');
}

// ---------- 2) BÁO CÁO TUẦN CHO BA MẸ ----------
// Gắn vào 1 Time-driven Trigger chạy 1 lần/tuần (VD Chủ nhật 20h) — trigger riêng, tách khỏi
// sendInactivityReminders() để 2 việc không phụ thuộc lịch của nhau.
function sendWeeklyDigest() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REMINDER_CONFIG.SHEET_NAME);
  if (!sheet) { Logger.log('Không tìm thấy sheet "' + REMINDER_CONFIG.SHEET_NAME + '".'); return; }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  const header = data[0];
  const emailCol = findColumnIndex_(header, REMINDER_CONFIG.EMAIL_HEADER_HINTS);
  const progressCol = findColumnIndex_(header, REMINDER_CONFIG.PROGRESS_HEADER_HINTS);
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
      '📚 Số chủ đề đã học xong: ' + doneTopicsCount + '/10\n' +
      '🔥 Chuỗi ngày học liên tiếp hiện tại: ' + streakCount + ' ngày\n\n' +
      'Ba mẹ cùng bé vào học tiếp để giữ đà nhé!\n' +
      '👉 ' + REMINDER_CONFIG.APP_URL +
      '\n\n— ' + REMINDER_CONFIG.FROM_NAME;

    try {
      MailApp.sendEmail({ to: email, subject: subject, body: body, name: REMINDER_CONFIG.FROM_NAME });
      sentCount++;
    } catch (e) {
      Logger.log('Gửi báo cáo tuần thất bại cho ' + email + ': ' + e);
    }
  }

  Logger.log('Đã gửi ' + sentCount + ' báo cáo tuần.');
}

// ============================================================================
// CÁCH CÀI ĐẶT (làm 1 lần):
// 1. Mở project Apps Script đang chạy webAppUrl trong data/sheets-config.js
//    (Extensions > Apps Script từ chính Google Sheet lưu dữ liệu, hoặc mở từ
//    script.google.com nếu bạn quản lý project độc lập với Sheet).
// 2. Tạo 1 file mới (File > New > Script file), đặt tên "EmailReminder", dán
//    toàn bộ nội dung file này vào (trừ khối comment hướng dẫn này).
// 3. Sửa REMINDER_CONFIG.SHEET_NAME cho đúng tên tab đang lưu progress, và
//    kiểm tra EMAIL_HEADER_HINTS/PROGRESS_HEADER_HINTS có khớp tên cột thật
//    không (mở sheet, xem hàng tiêu đề).
// 4. Bấm ▶ Run, chọn hàm sendInactivityReminders để chạy thử 1 lần bằng tay —
//    lần đầu Google sẽ hỏi cấp quyền gửi email + đọc Sheet, bấm Allow.
//    Xem log (View > Logs) để kiểm tra có báo lỗi cột không.
// 5. Nếu chạy thử ổn, vào Triggers (icon ⏰ bên trái) > Add Trigger:
//      - sendInactivityReminders: chọn "Time-driven" > "Day timer" > khung giờ
//        muốn gửi (VD 19:00-20:00), chạy mỗi ngày.
//      - sendWeeklyDigest: tương tự nhưng chọn "Week timer", chọn 1 ngày trong
//        tuần (VD Chủ nhật).
// 6. MailApp có hạn ngạch ~100 email/ngày cho tài khoản Gmail thường (nhiều hơn
//    nếu dùng Google Workspace) — đủ dùng cho quy mô nhỏ; nếu vượt hạn mức,
//    cân nhắc đổi sang GmailApp.sendEmail() (cùng cú pháp, hạn mức khác) hoặc
//    thêm giới hạn số email gửi/lần chạy.
// ============================================================================
