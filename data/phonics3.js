  // Ngữ âm 3 — nội dung RIÊNG của lớp Lá (7–8 tuổi), nối tiếp Ngữ âm 2 của lớp Chồi (data/phonics2.js).
  // Thêm 2 họ vần mới (-AP, -OT, cùng shape với phonics.js/phonics2.js) và LẦN ĐẦU có PHỤ ÂM GHÉP ĐẦU TỪ
  // (blend — 2 phụ âm đọc nối liền, khác digraph SH/CH/TH của Chồi là 1 âm hoàn toàn mới): "BL" —
  // vẫn dùng `units` + kind:'digraph' để dùng chung bộ máy học/đố với Ngữ âm 2 (xem PHONICS_UNIT_SAY).
  // Một số từ trùng với từ vựng lớp khác (VD "HOT", "BLACK") — bình thường trong dạy ngữ âm, không phải lỗi.
  const PHONICS3_TOPICS = [
    { id: 'phonics3_ap', label: 'Họ vần -AP', emoji: '🔊', cls: 't-blue', kind: 'family',
      words: [
        { en: 'CAP', vi: 'Mũ lưỡi trai', emoji: '🧢' },
        { en: 'MAP', vi: 'Bản đồ', emoji: '🗺️' },
        { en: 'NAP', vi: 'Giấc ngủ ngắn', emoji: '😴' },
        { en: 'TAP', vi: 'Vòi nước', emoji: '🚰' },
      ] },
    { id: 'phonics3_ot', label: 'Họ vần -OT', emoji: '🔊', cls: 't-gold', kind: 'family',
      words: [
        { en: 'POT', vi: 'Cái nồi', emoji: '🍲' },
        { en: 'DOT', vi: 'Chấm tròn', emoji: '🔴' },
        { en: 'HOT', vi: 'Nóng', emoji: '🥵' },
        { en: 'COT', vi: 'Giường nhỏ', emoji: '🛏️' },
      ] },
    { id: 'phonics3_bl', label: 'Phụ âm ghép BL', emoji: '🧱', cls: 't-mint', kind: 'digraph',
      words: [
        { en: 'BLACK', vi: 'Màu đen', emoji: '⚫', units: ['BL', 'A', 'CK'] },
        { en: 'BLOCK', vi: 'Khối vuông', emoji: '🧱', units: ['BL', 'O', 'CK'] },
        { en: 'BLOW', vi: 'Thổi', emoji: '💨', units: ['BL', 'O', 'W'] },
        { en: 'BLANKET', vi: 'Cái chăn', emoji: '🛌', units: ['BL', 'A', 'N', 'K', 'E', 'T'] },
      ] },
  ];
