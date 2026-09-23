  // Ngữ âm cơ bản (Phonics) — dạy bé ghép ÂM từng chữ cái thành từ đơn giản 3 chữ (CVC), khác
  // "Bảng chữ cái" (chỉ học TÊN chữ + 1 từ ví dụ) và khác "Xếp chữ" ở Tap Trò chơi (đánh vần lại cả
  // từ). Nhóm theo HỌ VẦN (word family) — cùng 1 vần cuối, chỉ đổi chữ cái đầu — đúng phương pháp
  // dạy phonics phổ biến, giúp bé nhận ra quy luật thay vì học thuộc lòng từng từ rời rạc.
  // Mỗi "topic" ở đây dùng lại shape { en, vi, emoji } đơn giản (không cần example/exampleVi vì
  // phonics dùng 2 màn hình riêng, không đi qua flashcard/quiz dùng chung của TOPICS/ABC_TOPICS).
  const PHONICS_TOPICS = [
    { id: 'phonics_at', label: 'Họ vần -AT', emoji: '🔊', cls: 't-pink',
      words: [
        { en: 'CAT', vi: 'Con mèo', emoji: '🐱' },
        { en: 'HAT', vi: 'Cái mũ', emoji: '🎩' },
        { en: 'BAT', vi: 'Con dơi', emoji: '🦇' },
        { en: 'RAT', vi: 'Con chuột', emoji: '🐀' },
      ] },
    { id: 'phonics_og', label: 'Họ vần -OG', emoji: '🔊', cls: 't-blue',
      words: [
        { en: 'DOG', vi: 'Con chó', emoji: '🐶' },
        { en: 'FOG', vi: 'Sương mù', emoji: '🌫️' },
        { en: 'LOG', vi: 'Khúc gỗ', emoji: '🪵' },
        { en: 'FROG', vi: 'Con ếch', emoji: '🐸' },
      ] },
    { id: 'phonics_ug', label: 'Họ vần -UG', emoji: '🔊', cls: 't-gold',
      words: [
        { en: 'BUG', vi: 'Con bọ', emoji: '🐛' },
        { en: 'MUG', vi: 'Cái cốc', emoji: '☕' },
        { en: 'HUG', vi: 'Cái ôm', emoji: '🤗' },
        { en: 'JUG', vi: 'Cái bình', emoji: '🫙' },
      ] },
    { id: 'phonics_an', label: 'Họ vần -AN', emoji: '🔊', cls: 't-mint',
      words: [
        { en: 'CAN', vi: 'Lon đồ hộp', emoji: '🥫' },
        { en: 'MAN', vi: 'Người đàn ông', emoji: '👨' },
        { en: 'PAN', vi: 'Cái chảo', emoji: '🍳' },
        { en: 'VAN', vi: 'Xe van', emoji: '🚐' },
      ] },
  ];
