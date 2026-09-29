  // Ngữ âm 2 — nội dung RIÊNG của lớp Chồi (5–6 tuổi), nối tiếp "Ngữ âm cơ bản" của lớp Mầm
  // (data/phonics.js: chỉ họ vần -AT/-OG/-UG/-AN). Ở đây có 2 kiểu nhóm:
  //   • Họ vần nguyên âm ngắn mới (-EN, -IN, -OP, -UN): cùng shape với phonics.js, mỗi ô = 1 chữ cái.
  //   • Âm ghép (digraph) SH / CH / TH: mỗi từ có thêm `units` — mảng "ô" bé bấm, trong đó 2 chữ đi
  //     cùng nhau tạo 1 âm (SH, CH, TH, EE, AI...) nằm chung 1 ô. Câu đố hỏi âm ĐẦU, đáp án là ô đầu tiên.
  // Không có `units` thì app tự tách từng chữ cái. Dùng chung 2 màn hình học/đố với Ngữ âm cơ bản
  // (chỉ là bộ máy chạy bài), nhưng dữ liệu, tiến độ (doneTopics) và lớp hiển thị là của lớp Chồi.
  const PHONICS2_TOPICS = [
    { id: 'phonics2_en', label: 'Họ vần -EN', emoji: '🔊', cls: 't-pink', kind: 'family',
      words: [
        { en: 'HEN', vi: 'Con gà mái', emoji: '🐔' },
        { en: 'PEN', vi: 'Cái bút', emoji: '🖊️' },
        { en: 'TEN', vi: 'Số mười', emoji: '🔟' },
        { en: 'MEN', vi: 'Những người đàn ông', emoji: '👬' },
      ] },
    { id: 'phonics2_in', label: 'Họ vần -IN', emoji: '🔊', cls: 't-blue', kind: 'family',
      words: [
        { en: 'PIN', vi: 'Cái ghim', emoji: '📌' },
        { en: 'BIN', vi: 'Thùng rác', emoji: '🗑️' },
        { en: 'WIN', vi: 'Chiến thắng', emoji: '🏆' },
        { en: 'TIN', vi: 'Hộp thiếc', emoji: '🥫' },
      ] },
    { id: 'phonics2_op', label: 'Họ vần -OP', emoji: '🔊', cls: 't-gold', kind: 'family',
      words: [
        { en: 'TOP', vi: 'Trên cùng', emoji: '🔝' },
        { en: 'MOP', vi: 'Cây lau nhà', emoji: '🧹' },
        { en: 'POP', vi: 'Bắp rang', emoji: '🍿' },
        { en: 'COP', vi: 'Chú cảnh sát', emoji: '👮' },
      ] },
    { id: 'phonics2_un', label: 'Họ vần -UN', emoji: '🔊', cls: 't-mint', kind: 'family',
      words: [
        { en: 'SUN', vi: 'Mặt trời', emoji: '☀️' },
        { en: 'RUN', vi: 'Chạy', emoji: '🏃' },
        { en: 'FUN', vi: 'Vui', emoji: '🎉' },
        { en: 'BUN', vi: 'Bánh mì', emoji: '🍞' },
      ] },
    { id: 'phonics2_sh', label: 'Âm ghép SH', emoji: '🤫', cls: 't-accent', kind: 'digraph',
      words: [
        { en: 'SHIP', vi: 'Con tàu', emoji: '🚢', units: ['SH', 'I', 'P'] },
        { en: 'SHEEP', vi: 'Con cừu', emoji: '🐑', units: ['SH', 'EE', 'P'] },
        { en: 'SHELL', vi: 'Vỏ sò', emoji: '🐚', units: ['SH', 'E', 'L', 'L'] },
        { en: 'SHOP', vi: 'Cửa hàng', emoji: '🏪', units: ['SH', 'O', 'P'] },
      ] },
    { id: 'phonics2_ch', label: 'Âm ghép CH', emoji: '🪑', cls: 't-pink', kind: 'digraph',
      words: [
        { en: 'CHAIR', vi: 'Cái ghế', emoji: '🪑', units: ['CH', 'AI', 'R'] },
        { en: 'CHEESE', vi: 'Phô mai', emoji: '🧀', units: ['CH', 'EE', 'S', 'E'] },
        { en: 'CHICK', vi: 'Gà con', emoji: '🐥', units: ['CH', 'I', 'CK'] },
        { en: 'CHIP', vi: 'Khoai chiên', emoji: '🍟', units: ['CH', 'I', 'P'] },
      ] },
    { id: 'phonics2_th', label: 'Âm ghép TH', emoji: '👍', cls: 't-blue', kind: 'digraph',
      words: [
        { en: 'THUMB', vi: 'Ngón tay cái', emoji: '👍', units: ['TH', 'U', 'M', 'B'] },
        { en: 'THREE', vi: 'Số ba', emoji: '3️⃣', units: ['TH', 'R', 'EE'] },
        { en: 'THUNDER', vi: 'Sấm', emoji: '⛈️', units: ['TH', 'U', 'N', 'D', 'ER'] },
        { en: 'THINK', vi: 'Suy nghĩ', emoji: '💭', units: ['TH', 'I', 'N', 'K'] },
      ] },
  ];

  // Cách đọc khi bé bấm 1 ô nhiều chữ cái (chữ đơn thì đọc tên chữ như Ngữ âm cơ bản).
  // BL (data/phonics3.js — lớp Lá) dùng chung bảng này vì cũng là 1 "ô âm" nhiều chữ cái.
  const PHONICS_UNIT_SAY = {
    SH: 'sh, as in ship', CH: 'ch, as in chair', TH: 'th, as in thumb',
    EE: 'ee', AI: 'ay', CK: 'k', ER: 'er', BL: 'bl, as in black',
  };
  // Đáp án nhiễu cho câu đố âm đầu khi đáp án là 1 âm ghép (thêm vài chữ đơn dễ nhầm với S, C, T).
  // BL cũng nằm ở đây để làm đáp án nhiễu cho các câu đố âm ghép/phụ âm ghép khác.
  const PHONICS2_DIGRAPH_POOL = ['SH', 'CH', 'TH', 'WH', 'BL', 'S', 'C', 'T'];
