  // Bảng chữ cái ABC — tách riêng khỏi TOPICS (data/topics.js) để không ảnh hưởng tới khoá tuần tự/
  // huy hiệu "Bậc thầy tí hon"/mảnh ghép tranh của 12 chủ đề từ vựng chính (xem cách app.js dùng
  // ABC_TOPICS: luôn mở, không cần học theo thứ tự, không tính vào PUZZLE_TOPICS).
  // Mỗi "topic" ở đây gồm 4-5 chữ cái liền nhau, dùng lại đúng shape { en, vi, emoji, example,
  // exampleVi } như TOPICS để tái sử dụng nguyên vẹn màn flashcard/quiz/ghép tranh đã có — "en" là
  // chữ cái, "vi" giải thích kèm từ ví dụ, "emoji" minh hoạ cho từ ví dụ đó (không phải cho chữ cái).
  const ABC_TOPICS = [
    { id: 'abc_a_d', label: 'Chữ cái A - D', emoji: '🔤', cls: 't-pink',
      words: [
        { en: 'A', vi: 'A — như trong Quả táo (APPLE)', emoji: '🍎', example: 'A is for APPLE.', exampleVi: 'A là quả táo.' },
        { en: 'B', vi: 'B — như trong Quả bóng (BALL)', emoji: '⚽', example: 'B is for BALL.', exampleVi: 'B là quả bóng.' },
        { en: 'C', vi: 'C — như trong Con mèo (CAT)', emoji: '🐱', example: 'C is for CAT.', exampleVi: 'C là con mèo.' },
        { en: 'D', vi: 'D — như trong Con chó (DOG)', emoji: '🐶', example: 'D is for DOG.', exampleVi: 'D là con chó.' },
      ] },
    { id: 'abc_e_h', label: 'Chữ cái E - H', emoji: '🔤', cls: 't-blue',
      words: [
        { en: 'E', vi: 'E — như trong Con voi (ELEPHANT)', emoji: '🐘', example: 'E is for ELEPHANT.', exampleVi: 'E là con voi.' },
        { en: 'F', vi: 'F — như trong Con cá (FISH)', emoji: '🐟', example: 'F is for FISH.', exampleVi: 'F là con cá.' },
        { en: 'G', vi: 'G — như trong Quả nho (GRAPE)', emoji: '🍇', example: 'G is for GRAPE.', exampleVi: 'G là quả nho.' },
        { en: 'H', vi: 'H — như trong Cái mũ (HAT)', emoji: '🎩', example: 'H is for HAT.', exampleVi: 'H là cái mũ.' },
      ] },
    { id: 'abc_i_m', label: 'Chữ cái I - M', emoji: '🔤', cls: 't-gold',
      words: [
        { en: 'I', vi: 'I — như trong Kem (ICE CREAM)', emoji: '🍦', example: 'I is for ICE CREAM.', exampleVi: 'I là kem.' },
        { en: 'J', vi: 'J — như trong Nước ép (JUICE)', emoji: '🧃', example: 'J is for JUICE.', exampleVi: 'J là nước ép.' },
        { en: 'K', vi: 'K — như trong Diều (KITE)', emoji: '🪁', example: 'K is for KITE.', exampleVi: 'K là diều.' },
        { en: 'L', vi: 'L — như trong Sư tử (LION)', emoji: '🦁', example: 'L is for LION.', exampleVi: 'L là sư tử.' },
        { en: 'M', vi: 'M — như trong Con khỉ (MONKEY)', emoji: '🐵', example: 'M is for MONKEY.', exampleVi: 'M là con khỉ.' },
      ] },
    { id: 'abc_n_r', label: 'Chữ cái N - R', emoji: '🔤', cls: 't-mint',
      words: [
        { en: 'N', vi: 'N — như trong Cái mũi (NOSE)', emoji: '👃', example: 'N is for NOSE.', exampleVi: 'N là cái mũi.' },
        { en: 'O', vi: 'O — như trong Quả cam (ORANGE)', emoji: '🍊', example: 'O is for ORANGE.', exampleVi: 'O là quả cam.' },
        { en: 'P', vi: 'P — như trong Bút chì (PENCIL)', emoji: '✏️', example: 'P is for PENCIL.', exampleVi: 'P là bút chì.' },
        { en: 'Q', vi: 'Q — như trong Nữ hoàng (QUEEN)', emoji: '👸', example: 'Q is for QUEEN.', exampleVi: 'Q là nữ hoàng.' },
        { en: 'R', vi: 'R — như trong Con thỏ (RABBIT)', emoji: '🐰', example: 'R is for RABBIT.', exampleVi: 'R là con thỏ.' },
      ] },
    { id: 'abc_s_v', label: 'Chữ cái S - V', emoji: '🔤', cls: 't-accent',
      words: [
        { en: 'S', vi: 'S — như trong Mặt trời (SUN)', emoji: '☀️', example: 'S is for SUN.', exampleVi: 'S là mặt trời.' },
        { en: 'T', vi: 'T — như trong Con hổ (TIGER)', emoji: '🐯', example: 'T is for TIGER.', exampleVi: 'T là con hổ.' },
        { en: 'U', vi: 'U — như trong Cái ô (UMBRELLA)', emoji: '☂️', example: 'U is for UMBRELLA.', exampleVi: 'U là cái ô.' },
        { en: 'V', vi: 'V — như trong Đàn vi-ô-lin (VIOLIN)', emoji: '🎻', example: 'V is for VIOLIN.', exampleVi: 'V là đàn vi-ô-lin.' },
      ] },
    { id: 'abc_w_z', label: 'Chữ cái W - Z', emoji: '🔤', cls: 't-pink',
      words: [
        { en: 'W', vi: 'W — như trong Nước (WATER)', emoji: '💧', example: 'W is for WATER.', exampleVi: 'W là nước.' },
        { en: 'X', vi: 'X — như trong Ảnh X-quang (X-RAY)', emoji: '🩻', example: 'X is for X-RAY.', exampleVi: 'X là ảnh X-quang.' },
        { en: 'Y', vi: 'Y — như trong Con quay yoyo (YOYO)', emoji: '🪀', example: 'Y is for YOYO.', exampleVi: 'Y là con quay yoyo.' },
        { en: 'Z', vi: 'Z — như trong Ngựa vằn (ZEBRA)', emoji: '🦓', example: 'Z is for ZEBRA.', exampleVi: 'Z là ngựa vằn.' },
      ] },
  ];
