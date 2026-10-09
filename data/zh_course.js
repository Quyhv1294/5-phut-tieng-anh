  // KHOÁ HỌC TIẾNG TRUNG CHO NGƯỜI MỚI BẮT ĐẦU — Phần → Chặng → Bài. Mỗi chặng xoay quanh 1 chủ đề
  // giao tiếp và đan xen đủ kỹ năng: từ mới + phát âm + viết chữ + mẫu câu. Cuối mỗi chặng app tự thêm
  // bài "Ôn tập chặng"; đầu mỗi phần có "Kiểm tra nhảy cóc" cho ai đã biết. Phần chạy: zh-course.js.
  //
  // Cách khai báo 1 bài (lessons):
  //   { type: 'vocab', title, words: NGUỒN }       học từ mới: thẻ học rồi luyện tập trộn nhiều dạng
  //   { ref: 'tones' }                               dùng lại 1 bài có sẵn trong data/zh_roadmap.js (ZH_STEPS)
  //   { type: 'learn', title, items: [...] }         thẻ học (big, py, vi, note, say, hw — xem zh_roadmap.js)
  //   { type: 'learn', title, from: 'initials', only: ['b', 'p'] }   thẻ học âm đầu (chỉ các âm liệt kê)
  //   { type: 'quiz', title, gen: 'initials', only: [...], count }   đố tự sinh (tones, initials, radicals,
  //                                                                  numbers, weekdays, time, money)
  //   { type: 'write', title, chars: ['一', '二'] }  tô chữ Hán
  //   { type: 'order', title, sentences: [{ tokens, py, vi, end }] }  sắp xếp câu
  // NGUỒN từ vựng:
  //   { topic: 'family', only: [...] }   từ trong data/topics_zh.js (có hình)
  //   { hsk: 'hsk_people', range: [0, 8] } từ trong ZH_HSK1 (data/zh_roadmap.js)
  //   { list: [['你好', 'nǐ hǎo', 'Xin chào', '👋'], ...] }  khai báo trực tiếp: chữ, pinyin, nghĩa, hình
  const ZH_COURSE = [
    { id: 'p1', title: 'Phần 1 · Nhập môn', desc: 'Phát âm chuẩn và những câu đầu tiên', units: [
      { id: 'u1', emoji: '👋', title: 'Xin chào!', lessons: [
        { type: 'vocab', title: 'Từ mới: chào hỏi', words: { list: [
          ['你好', 'nǐ hǎo', 'Xin chào', '👋'], ['谢谢', 'xièxie', 'Cảm ơn', '🙏'], ['不客气', 'bú kèqi', 'Không có gì', '😊'],
          ['对不起', 'duìbuqǐ', 'Xin lỗi', '😔'], ['没关系', 'méi guānxi', 'Không sao đâu', '👌'], ['再见', 'zàijiàn', 'Tạm biệt', '🙋'],
        ] } },
        { ref: 'tones' },
        { ref: 'tones_quiz' },
        { type: 'write', title: 'Viết chữ: 一 二 三', chars: ['一', '二', '三'] },
      ] },
      { id: 'u2', emoji: '🔢', title: 'Số đếm', lessons: [
        { type: 'vocab', title: 'Từ mới: số 1–10', words: { topic: 'numbers' } },
        { type: 'learn', title: 'Âm đầu: b p m f d t n l', from: 'initials', only: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'] },
        { type: 'quiz', title: 'Nghe chọn âm đầu', gen: 'initials', only: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'], count: 8 },
        { ref: 'num_learn' },
        { ref: 'num_quiz' },
        { type: 'write', title: 'Viết chữ: 四 五 六 八 十', chars: ['四', '五', '六', '八', '十'] },
      ] },
      { id: 'u3', emoji: '👨‍👩‍👧', title: 'Gia đình', topic: 'family', lessons: [
        { type: 'vocab', title: 'Từ mới: gia đình', words: { topic: 'family', only: ['妈妈', '爸爸', '哥哥', '姐姐', '奶奶', '爷爷', '宝宝', '家'] } },
        { type: 'learn', title: 'Âm đầu: g k h j q x', from: 'initials', only: ['g', 'k', 'h', 'j', 'q', 'x'] },
        { type: 'quiz', title: 'Nghe chọn âm đầu', gen: 'initials', only: ['g', 'k', 'h', 'j', 'q', 'x'], count: 8 },
        { type: 'learn', title: 'Mẫu câu: 是 (là) và 的 (của)', items: [
          { big: '我是学生。', py: 'Wǒ shì xuésheng.', vi: 'Tôi là học sinh.' },
          { big: '这是我妈妈。', py: 'Zhè shì wǒ māma.', vi: 'Đây là mẹ tôi.', note: 'Với người thân có thể bỏ 的: 我妈妈 = mẹ tôi.' },
          { big: '这是我的书。', py: 'Zhè shì wǒ de shū.', vi: 'Đây là sách của tôi.', note: 'Người sở hữu + 的 + vật — ngược với tiếng Việt.' },
          { big: '他不是我哥哥。', py: 'Tā bú shì wǒ gēge.', vi: 'Anh ấy không phải anh trai tôi.', note: 'Phủ định của 是 là 不是.' },
        ] },
        { type: 'order', title: 'Sắp xếp câu', sentences: [
          { tokens: ['这', '是', '我', '妈妈'], py: 'Zhè shì wǒ māma.', vi: 'Đây là mẹ tôi.' },
          { tokens: ['他', '是', '我', '哥哥'], py: 'Tā shì wǒ gēge.', vi: 'Anh ấy là anh trai tôi.' },
          { tokens: ['这', '是', '我的', '书'], py: 'Zhè shì wǒ de shū.', vi: 'Đây là sách của tôi.' },
          { tokens: ['她', '不是', '我', '姐姐'], py: 'Tā bú shì wǒ jiějie.', vi: 'Cô ấy không phải chị gái tôi.' },
        ] },
        { type: 'write', title: 'Viết chữ: 人 口 女 子', chars: ['人', '口', '女', '子'] },
      ] },
      { id: 'u4', emoji: '🐱', title: 'Con vật', topic: 'animals', lessons: [
        { type: 'vocab', title: 'Từ mới: con vật', words: { topic: 'animals', only: ['猫', '狗', '鸟', '鱼', '鸭子', '兔子', '猴子', '大象'] } },
        { type: 'learn', title: 'Âm đầu: zh ch sh r z c s', from: 'initials', only: ['zh', 'ch', 'sh', 'r', 'z', 'c', 's'] },
        { type: 'quiz', title: 'Nghe chọn âm đầu', gen: 'initials', only: ['zh', 'ch', 'sh', 'r', 'z', 'c', 's'], count: 8 },
        { type: 'learn', title: 'Mẫu câu: 有 (có) và 没有 (không có)', items: [
          { big: '我有一只猫。', py: 'Wǒ yǒu yì zhī māo.', vi: 'Tôi có một con mèo.', note: '只 zhī là lượng từ cho con vật nhỏ.' },
          { big: '我没有狗。', py: 'Wǒ méiyǒu gǒu.', vi: 'Tôi không có chó.', note: 'Phủ định của 有 luôn là 没有 (không nói 不有).' },
          { big: '你有猫吗？', py: 'Nǐ yǒu māo ma?', vi: 'Bạn có mèo không?', note: 'Thêm 吗 cuối câu thành câu hỏi.' },
        ] },
        { type: 'order', title: 'Sắp xếp câu', sentences: [
          { tokens: ['我', '有', '一只', '猫'], py: 'Wǒ yǒu yì zhī māo.', vi: 'Tôi có một con mèo.' },
          { tokens: ['我', '没有', '狗'], py: 'Wǒ méiyǒu gǒu.', vi: 'Tôi không có chó.' },
          { tokens: ['你', '有', '猫', '吗'], py: 'Nǐ yǒu māo ma?', vi: 'Bạn có mèo không?', end: '？' },
        ] },
        { type: 'write', title: 'Viết chữ: 大 小 山 水', chars: ['大', '小', '山', '水'] },
      ] },
      { id: 'u5', emoji: '🍚', title: 'Ăn uống', topic: 'food', lessons: [
        { type: 'vocab', title: 'Từ mới: đồ ăn, đồ uống', words: { topic: 'food', only: ['米饭', '牛奶', '面包', '鸡蛋', '面条', '水', '果汁', '鸡肉'] } },
        { ref: 'finals1' },
        { ref: 'g_svo' },
        { ref: 'g_neg' },
        { type: 'order', title: 'Sắp xếp câu', sentences: [
          { tokens: ['我', '吃', '米饭'], py: 'Wǒ chī mǐfàn.', vi: 'Tôi ăn cơm.' },
          { tokens: ['我', '不', '喝', '牛奶'], py: 'Wǒ bù hē niúnǎi.', vi: 'Tôi không uống sữa.' },
          { tokens: ['妈妈', '喝', '水'], py: 'Māma hē shuǐ.', vi: 'Mẹ uống nước.' },
          { tokens: ['我', '昨天', '没', '吃', '面条'], py: 'Wǒ zuótiān méi chī miàntiáo.', vi: 'Hôm qua tôi không ăn mì.' },
        ] },
        { type: 'write', title: 'Viết chữ: 米 火 木 日', chars: ['米', '火', '木', '日'] },
      ] },
      { id: 'u6', emoji: '📅', title: 'Thứ, ngày, tháng', lessons: [
        { type: 'vocab', title: 'Từ mới: thời gian', words: { hsk: 'hsk_time', only: ['今天', '明天', '昨天', '现在', '上午', '下午', '年', '月'] } },
        { ref: 'finals2' },
        { ref: 'sandhi' },
        { ref: 'sandhi_quiz' },
        { ref: 'date_learn' },
        { ref: 'weekday_quiz' },
      ] },
    ] },
    { id: 'p2', title: 'Phần 2 · HSK 1', desc: '150 từ và ngữ pháp cốt lõi của HSK 1', units: [
      { id: 'u7', emoji: '🙋', title: 'Tôi và bạn', lessons: [
        { type: 'vocab', title: 'Từ mới: đại từ', words: { hsk: 'hsk_people', range: [0, 8] } },
        { type: 'vocab', title: 'Từ mới: con người', words: { hsk: 'hsk_people', range: [8, 15] } },
        { ref: 'greet_intro' },
        { ref: 'greet_quiz' },
        { ref: 'g_questions' },
        { type: 'write', title: 'Viết chữ: 我 你 他 好', chars: ['我', '你', '他', '好'] },
      ] },
      { id: 'u8', emoji: '🏫', title: 'Gia đình & nghề nghiệp', lessons: [
        { type: 'vocab', title: 'Từ mới: gia đình, nghề', words: { hsk: 'hsk_family', range: [0, 8] } },
        { type: 'vocab', title: 'Từ mới: nước, chữ, con vật', words: { hsk: 'hsk_family', range: [8, 16] } },
        { ref: 'greet_words' },
        { ref: 'radicals_1' },
        { type: 'write', title: 'Viết chữ: 中 国 学 生', chars: ['中', '国', '学', '生'] },
      ] },
      { id: 'u9', emoji: '🕒', title: 'Giờ giấc & số lượng', lessons: [
        { type: 'vocab', title: 'Từ mới: số lượng', words: { hsk: 'hsk_numbers', range: [10, 17] } },
        { type: 'vocab', title: 'Từ mới: giờ, tuần', words: { hsk: 'hsk_time', only: ['号', '星期', '点', '分钟', '时候', '中午'] } },
        { ref: 'time_learn' },
        { ref: 'time_quiz' },
        { ref: 'g_de_measure' },
      ] },
      { id: 'u10', emoji: '🛒', title: 'Mua sắm & đồ vật', lessons: [
        { type: 'vocab', title: 'Từ mới: đồ vật', words: { hsk: 'hsk_things', range: [0, 10] } },
        { type: 'vocab', title: 'Từ mới: đi lại, ăn uống', words: { hsk: 'hsk_things', range: [10, 18] } },
        { ref: 'money_learn' },
        { ref: 'money_quiz' },
        { ref: 'radicals_2' },
      ] },
      { id: 'u11', emoji: '🏃', title: 'Hoạt động hằng ngày', lessons: [
        { type: 'vocab', title: 'Từ mới: động từ (1)', words: { hsk: 'hsk_verbs1' } },
        { type: 'vocab', title: 'Từ mới: động từ (2)', words: { hsk: 'hsk_verbs2' } },
        { type: 'vocab', title: 'Từ mới: nơi chốn', words: { hsk: 'hsk_places' } },
        { ref: 'g_order_1' },
        { ref: 'g_order_2' },
        { ref: 'radicals_quiz' },
      ] },
      { id: 'u12', emoji: '💬', title: 'Giao tiếp tự nhiên', lessons: [
        { type: 'vocab', title: 'Từ mới: tính từ, phó từ', words: { hsk: 'hsk_adj' } },
        { type: 'vocab', title: 'Từ mới: giao tiếp, hư từ', words: { hsk: 'hsk_function' } },
        { ref: 'ime_setup' },
        { ref: 'type_1' },
        { ref: 'type_2' },
      ] },
    ] },
    { id: 'p3', title: 'Phần 3 · Từ vựng mở rộng', desc: 'Học thêm từ qua hình ảnh: màu sắc, thời tiết, cơ thể…', units: [
      { id: 'u13', emoji: '🎨', title: 'Màu sắc', topic: 'colors', lessons: [
        { type: 'vocab', title: 'Từ mới: màu sắc (1)', words: { topic: 'colors', range: [0, 5] } },
        { type: 'vocab', title: 'Từ mới: màu sắc (2)', words: { topic: 'colors', range: [5, 10] } },
        { type: 'write', title: 'Viết chữ: 红 白 色', chars: ['红', '白', '色'] },
      ] },
      { id: 'u14', emoji: '⛅', title: 'Thời tiết', topic: 'weather', lessons: [
        { type: 'vocab', title: 'Từ mới: thời tiết (1)', words: { topic: 'weather', range: [0, 5] } },
        { type: 'vocab', title: 'Từ mới: thời tiết (2)', words: { topic: 'weather', range: [5, 10] } },
        { type: 'write', title: 'Viết chữ: 雨 雪 风 云', chars: ['雨', '雪', '风', '云'] },
      ] },
      { id: 'u15', emoji: '🧒', title: 'Cơ thể', topic: 'body', lessons: [
        { type: 'vocab', title: 'Từ mới: cơ thể (1)', words: { topic: 'body', range: [0, 5] } },
        { type: 'vocab', title: 'Từ mới: cơ thể (2)', words: { topic: 'body', range: [5, 10] } },
        { type: 'write', title: 'Viết chữ: 手 头 耳 目', chars: ['手', '头', '耳', '目'] },
      ] },
      { id: 'u16', emoji: '🚗', title: 'Phương tiện', topic: 'transport', lessons: [
        { type: 'vocab', title: 'Từ mới: phương tiện (1)', words: { topic: 'transport', range: [0, 5] } },
        { type: 'vocab', title: 'Từ mới: phương tiện (2)', words: { topic: 'transport', range: [5, 10] } },
        { type: 'write', title: 'Viết chữ: 车 船 飞 机', chars: ['车', '船', '飞', '机'] },
      ] },
      { id: 'u17', emoji: '🍇', title: 'Trái cây', topic: 'fruits', lessons: [
        { type: 'vocab', title: 'Từ mới: trái cây (1)', words: { topic: 'fruits', range: [0, 5] } },
        { type: 'vocab', title: 'Từ mới: trái cây (2)', words: { topic: 'fruits', range: [5, 10] } },
        { type: 'write', title: 'Viết chữ: 果 瓜 西 草', chars: ['果', '瓜', '西', '草'] },
      ] },
      { id: 'u18', emoji: '🧸', title: 'Đồ chơi & đồ vật', topic: 'toys', lessons: [
        { type: 'vocab', title: 'Từ mới: đồ chơi', words: { topic: 'toys', range: [0, 5] } },
        { type: 'vocab', title: 'Từ mới: đồ chơi (2)', words: { topic: 'toys', range: [5, 10] } },
        { type: 'vocab', title: 'Từ mới: đồ vật quen thuộc', words: { topic: 'objects' } },
        { type: 'write', title: 'Viết chữ: 球 书 门 床', chars: ['球', '书', '门', '床'] },
      ] },
    ] },
  ];
