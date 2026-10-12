  // KHOÁ HỌC TIẾNG TRUNG CHO NGƯỜI MỚI BẮT ĐẦU — 4 Phần × 6 Chặng → Bài. Thứ tự theo góp ý của giáo viên:
  // PINYIN trước (vận mẫu đơn → thanh mẫu → vận mẫu ghép, ví dụ đều đọc thanh 1), rồi THANH ĐIỆU, rồi mới
  // tới nội dung theo chủ đề. Cuối mỗi chặng app tự thêm bài "Ôn tập chặng"; mỗi phần có "Kiểm tra nhảy
  // cóc" cho ai đã biết. Chặng có pinyin: true là chặng phát âm (ôn tập / kiểm tra dùng đề pinyin thay vì
  // từ vựng). Phần chạy: zh-course.js.
  //
  // Cách khai báo 1 bài (lessons):
  //   { type: 'vocab', title, words: NGUỒN }       học từ mới: thẻ học rồi luyện tập trộn nhiều dạng
  //   { ref: 'tones' }                               dùng lại 1 bài có sẵn trong data/zh_roadmap.js (ZH_STEPS)
  //   { type: 'learn', title, items: [...] }         thẻ học (big, py, vi, note, say, hw — xem zh_roadmap.js)
  //   { type: 'learn', title, from: 'initials', only: ['b', 'p'] }   thẻ học âm đầu (chỉ các âm liệt kê)
  //   { type: 'learn', title, from: 'finals', only: ['a', 'o'] }     thẻ học vận mẫu (ZH_FINALS_1/2)
  //   { type: 'learn', title, from: 'syllables', initials: ['b'] }   thẻ ghép âm b + a = bā (ZH_SYLLABLES)
  //   { type: 'quiz', title, gen: 'initials', only: [...], count }   đố tự sinh (tones, initials, finals,
  //                     syllables (+ initials: [...]), pinyinWord, radicals, numbers, weekdays, time, money)
  //   { type: 'write', title, chars: ['一', '二'] }  tô chữ Hán
  //   { type: 'order', title, sentences: [{ tokens, py, vi, end }] }  sắp xếp câu
  //   { type: 'quiz', title, questions: [{ q, big, say, options }] }  đố soạn sẵn (options[0] là đáp án đúng; say: null = không đọc)
  //   { type: 'quiz', title, listen: 'u7' }         luyện nghe câu & hội thoại của chặng (data/zh_listening.js)
  // NGUỒN từ vựng:
  //   { topic: 'family', only: [...] }   từ trong data/topics_zh.js (có hình)
  //   { hsk: 'hsk_people', range: [0, 8] } từ trong ZH_HSK1 (data/zh_roadmap.js)
  //   { list: [['你好', 'nǐ hǎo', 'Xin chào', '👋'], ...] }  khai báo trực tiếp: chữ, pinyin, nghĩa, hình
  const ZH_COURSE = [
    { id: 'p0', title: 'Phần 1 · Pinyin & thanh điệu', desc: 'Nền tảng phát âm: bảng pinyin rồi 4 thanh điệu', units: [
      { id: 'py1', emoji: '🔤', title: 'Pinyin là gì? · 6 vận mẫu đơn', pinyin: true, lessons: [
        { type: 'learn', title: 'Pinyin là gì?', items: [
          { big: '拼音', py: 'pīnyīn', say: '拼音', vi: 'Pinyin = phiên âm La-tinh của tiếng Trung',
            note: 'Giống bảng chữ cái tiếng Việt: học xong là đọc được mọi phiên âm. Mỗi chữ Hán vẫn cần nhớ cách đọc riêng — vì vậy sách và app luôn ghi pinyin kèm chữ.' },
          { big: 'm + a = mā', py: '妈 · mẹ', say: '妈', vi: 'Âm tiết = thanh mẫu + vận mẫu + thanh điệu',
            note: 'm là thanh mẫu (âm đầu), a là vận mẫu (vần), dấu ‾ trên a là thanh điệu (thanh 1).' },
          { big: '21 + 36 + 4', py: '妈妈 · māma', say: '妈妈', vi: '21 thanh mẫu · khoảng 36 vận mẫu · 4 thanh điệu (+ thanh nhẹ)',
            note: 'Phần 1 học lần lượt: vận mẫu đơn → thanh mẫu → vận mẫu ghép → thanh điệu. Ở chặng 1–5 mọi ví dụ đều đọc thanh 1 (cao, đều) để bạn tập trung nghe âm. Bảng đầy đủ xem ở tab Thư viện › Pinyin.' },
        ] },
        { type: 'learn', title: '6 vận mẫu đơn: a o e i u ü', from: 'finals', only: ['a', 'o', 'e', 'i', 'u', 'ü'] },
        { type: 'quiz', title: 'Nghe và chọn vận mẫu', gen: 'finals', only: ['a', 'o', 'e', 'i', 'u', 'ü'], count: 8 },
      ] },
      { id: 'py2', emoji: '👄', title: 'Thanh mẫu: b p m f · d t n l', pinyin: true, lessons: [
        { type: 'learn', title: 'Thanh mẫu: b p m f d t n l', from: 'initials', only: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'] },
        { type: 'learn', title: 'Ghép âm: b + a = bā', from: 'syllables', initials: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'] },
        { type: 'quiz', title: 'Nghe và chọn đúng pinyin', gen: 'syllables', initials: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'], count: 10 },
      ] },
      { id: 'py3', emoji: '🗣️', title: 'Thanh mẫu: g k h · j q x', pinyin: true, lessons: [
        { type: 'learn', title: 'Thanh mẫu: g k h j q x', from: 'initials', only: ['g', 'k', 'h', 'j', 'q', 'x'] },
        { type: 'learn', title: 'Ghép âm với g k h j q x', from: 'syllables', initials: ['g', 'k', 'h', 'j', 'q', 'x'] },
        { type: 'quiz', title: 'Nghe và chọn đúng pinyin', gen: 'syllables', initials: ['g', 'k', 'h', 'j', 'q', 'x'], count: 10 },
      ] },
      { id: 'py4', emoji: '👅', title: 'Thanh mẫu: zh ch sh r · z c s · y w', pinyin: true, lessons: [
        { type: 'learn', title: 'Thanh mẫu: zh ch sh r z c s', from: 'initials', only: ['zh', 'ch', 'sh', 'r', 'z', 'c', 's'] },
        { type: 'learn', title: 'Chữ i đặc biệt · y và w', items: [
          { big: 'zhī · chī · shī', py: '知 · 吃 · 师', say: '知，吃，师', vi: 'zhi, chi, shi, ri: chữ i KHÔNG đọc là "i"',
            note: 'Giữ lưỡi ở vị trí uốn lưỡi của âm đầu rồi kéo dài — nghe gần "trư, chư, sư".' },
          { big: 'zī · cā · sī', py: '资 · 擦 · 思', say: '资，擦，思', vi: 'zi, ci, si: chữ i đọc gần "ư"',
            note: 'zī ≈ "chư" với đầu lưỡi thẳng chạm răng, sī ≈ "xư". (cā: c bật hơi mạnh.)' },
          { big: 'y · w', py: '衣 yī · 屋 wū', say: '衣，屋', vi: 'y và w: cách viết khi i, u, ü đứng đầu âm tiết',
            note: 'i → yi, u → wu, ü → yu; ia → ya, ua → wa, üe → yue… Đọc như chính nguyên âm đó.' },
        ] },
        { type: 'learn', title: 'Ghép âm với zh ch sh r z c s y w', from: 'syllables', initials: ['zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'] },
        { type: 'quiz', title: 'Nghe và chọn đúng pinyin', gen: 'syllables', initials: ['zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'], count: 10 },
      ] },
      { id: 'py5', emoji: '🎶', title: 'Vận mẫu ghép & vần mũi', pinyin: true, lessons: [
        { type: 'learn', title: 'Vận mẫu ghép & vần mũi', from: 'finals', only: ['ai', 'ei', 'ao', 'ou', 'er', 'an', 'en', 'ang', 'eng', 'ong'] },
        { type: 'quiz', title: 'Nghe và chọn vần (an hay ang?)', gen: 'finals', only: ['ai', 'ei', 'ao', 'ou', 'er', 'an', 'en', 'ang', 'eng', 'ong'], count: 10 },
        { type: 'learn', title: 'Vần có i-, u-, ü- đứng đầu', from: 'finals', only: ['ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'üe', 'üan', 'ün'] },
        { type: 'quiz', title: 'Nghe và chọn vần', gen: 'finals', only: ['ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'üe', 'üan', 'ün'], count: 10 },
      ] },
      { id: 'py6', emoji: '🎵', title: 'Thanh điệu & biến điệu', pinyin: true, lessons: [
        { ref: 'tones' },
        { ref: 'tones_quiz' },
        { ref: 'sandhi' },
        { ref: 'sandhi_quiz' },
        { type: 'quiz', title: 'Tổng hợp: nghe và chọn pinyin đúng', gen: 'pinyinWord', count: 10 },
      ] },
    ] },
    { id: 'p1', title: 'Phần 2 · Chủ đề cơ bản', desc: 'Từ vựng, nét chữ và những câu đầu tiên', units: [
      { id: 'u1', emoji: '👋', title: 'Xin chào!', lessons: [
        { type: 'vocab', title: 'Từ mới: chào hỏi', words: { list: [
          ['你好', 'nǐ hǎo', 'Xin chào', '👋'], ['谢谢', 'xièxie', 'Cảm ơn', '🙏'], ['不客气', 'bú kèqi', 'Không có gì', '😊'],
          ['对不起', 'duìbuqǐ', 'Xin lỗi', '😔'], ['没关系', 'méi guānxi', 'Không sao đâu', '👌'], ['再见', 'zàijiàn', 'Tạm biệt', '🙋'],
        ] } },
        { ref: 'basic_strokes' },
        { ref: 'stroke_rules' },
        { type: 'write', title: 'Viết chữ: 一 二 三', chars: ['一', '二', '三'] },
      ] },
      { id: 'u2', emoji: '🔢', title: 'Số đếm', lessons: [
        { type: 'vocab', title: 'Từ mới: số 1–10', words: { topic: 'numbers' } },
        { ref: 'num_learn' },
        { ref: 'num_quiz' },
        { type: 'write', title: 'Viết chữ: 四 五 六 八 十', chars: ['四', '五', '六', '八', '十'] },
      ] },
      { id: 'u3', emoji: '👨‍👩‍👧', title: 'Gia đình', topic: 'family', lessons: [
        { type: 'vocab', title: 'Từ mới: gia đình', words: { topic: 'family', only: ['妈妈', '爸爸', '哥哥', '姐姐', '奶奶', '爷爷', '宝宝', '家'] } },
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
        { ref: 'date_learn' },
        { ref: 'weekday_quiz' },
      ] },
    ] },
    { id: 'p2', title: 'Phần 3 · HSK 1', desc: '150 từ và ngữ pháp cốt lõi của HSK 1', units: [
      { id: 'u7', emoji: '🙋', title: 'Tôi và bạn', lessons: [
        { type: 'vocab', title: 'Từ mới: đại từ', words: { hsk: 'hsk_people', range: [0, 8] } },
        { type: 'vocab', title: 'Từ mới: con người', words: { hsk: 'hsk_people', range: [8, 15] } },
        { ref: 'greet_intro' },
        { ref: 'greet_quiz' },
        { ref: 'g_questions' },
        { type: 'write', title: 'Viết chữ: 我 你 他 好', chars: ['我', '你', '他', '好'] },
        { type: 'quiz', title: 'Luyện nghe câu & hội thoại', listen: 'u7' },
      ] },
      { id: 'u8', emoji: '🏫', title: 'Gia đình & nghề nghiệp', lessons: [
        { type: 'vocab', title: 'Từ mới: gia đình, nghề', words: { hsk: 'hsk_family', range: [0, 8] } },
        { type: 'vocab', title: 'Từ mới: nước, chữ, con vật', words: { hsk: 'hsk_family', range: [8, 16] } },
        { ref: 'greet_words' },
        { ref: 'radicals_1' },
        { type: 'write', title: 'Viết chữ: 中 国 学 生', chars: ['中', '国', '学', '生'] },
        { type: 'quiz', title: 'Luyện nghe câu & hội thoại', listen: 'u8' },
      ] },
      { id: 'u9', emoji: '🕒', title: 'Giờ giấc & số lượng', lessons: [
        { type: 'vocab', title: 'Từ mới: số lượng', words: { hsk: 'hsk_numbers', range: [10, 17] } },
        { type: 'vocab', title: 'Từ mới: giờ, tuần', words: { hsk: 'hsk_time', only: ['号', '星期', '点', '分钟', '时候', '中午'] } },
        { ref: 'time_learn' },
        { ref: 'time_quiz' },
        { ref: 'g_de_measure' },
        { type: 'quiz', title: 'Luyện nghe câu & hội thoại', listen: 'u9' },
      ] },
      { id: 'u10', emoji: '🛒', title: 'Mua sắm & đồ vật', lessons: [
        { type: 'vocab', title: 'Từ mới: đồ vật', words: { hsk: 'hsk_things', range: [0, 10] } },
        { type: 'vocab', title: 'Từ mới: đi lại, ăn uống', words: { hsk: 'hsk_things', range: [10, 18] } },
        { ref: 'money_learn' },
        { ref: 'money_quiz' },
        { type: 'learn', title: 'Câu giao tiếp hằng ngày', items: [
          { big: '请坐！', py: 'Qǐng zuò!', vi: 'Mời ngồi!', note: '请 + động từ = mời / xin hãy… (cách nói lịch sự).' },
          { big: '请喝茶。', py: 'Qǐng hē chá.', vi: 'Mời uống trà.' },
          { big: '喂，你好！', py: 'Wéi, nǐ hǎo!', vi: 'A lô, xin chào!', note: '喂 dùng khi nghe hoặc gọi điện thoại (thường đọc wéi).' },
          { big: '对不起！— 没关系。', py: 'Duìbuqǐ! — Méi guānxi.', vi: 'Xin lỗi! — Không sao.' },
          { big: '谢谢！— 不客气。', py: 'Xièxie! — Bú kèqi.', vi: 'Cảm ơn! — Không có gì.' },
          { big: '医院在哪儿？', py: 'Yīyuàn zài nǎr?', vi: 'Bệnh viện ở đâu?', note: 'Nơi chốn + 在哪儿？ = … ở đâu?' },
          { big: '在学校前面。', py: 'Zài xuéxiào qiánmiàn.', vi: 'Ở phía trước trường học.', note: '前面 phía trước · 后面 phía sau · 里 bên trong · 上 bên trên · 下 bên dưới.' },
          { big: '这个多少钱？', py: 'Zhège duōshao qián?', vi: 'Cái này bao nhiêu tiền?' },
          { big: '三十块。', py: 'Sānshí kuài.', vi: 'Ba mươi đồng (tệ).', note: '块 = đồng — cách nói tiền hằng ngày.' },
          { big: '再见！明天见！', py: 'Zàijiàn! Míngtiān jiàn!', vi: 'Tạm biệt! Mai gặp lại!' },
        ] },
        { type: 'order', title: 'Sắp xếp câu giao tiếp', sentences: [
          { tokens: ['请', '喝', '茶'], py: 'Qǐng hē chá.', vi: 'Mời uống trà.' },
          { tokens: ['医院', '在', '哪儿'], py: 'Yīyuàn zài nǎr?', vi: 'Bệnh viện ở đâu?', end: '？' },
          { tokens: ['这个', '多少', '钱'], py: 'Zhège duōshao qián?', vi: 'Cái này bao nhiêu tiền?', end: '？' },
          { tokens: ['在', '学校', '前面'], py: 'Zài xuéxiào qiánmiàn.', vi: 'Ở phía trước trường học.' },
        ] },
        { type: 'quiz', title: 'Tình huống: nói gì cho đúng?', questions: [
          { q: 'Bạn bè nói 谢谢！ Bạn đáp:', big: '💬', say: null, options: [['不客气。', 'Bú kèqi.'], ['没关系。', 'Méi guānxi.'], ['对不起。', 'Duìbuqǐ.'], ['再见。', 'Zàijiàn.']] },
          { q: 'Người khác nói 对不起！ Bạn đáp:', big: '💬', say: null, options: [['没关系。', 'Méi guānxi.'], ['不客气。', 'Bú kèqi.'], ['谢谢。', 'Xièxie.'], ['请坐。', 'Qǐng zuò.']] },
          { q: 'Bạn nhấc máy nghe điện thoại, câu đầu tiên là:', big: '📞', say: null, options: [['喂，你好！', 'Wéi, nǐ hǎo!'], ['再见！', 'Zàijiàn!'], ['请坐！', 'Qǐng zuò!'], ['没关系。', 'Méi guānxi.']] },
          { q: 'Mời khách ngồi:', big: '🪑', say: null, options: [['请坐！', 'Qǐng zuò!'], ['请喝茶。', 'Qǐng hē chá.'], ['再见！', 'Zàijiàn!'], ['对不起！', 'Duìbuqǐ!']] },
          { q: 'Hỏi giá một món đồ:', big: '💰', say: null, options: [['这个多少钱？', 'Zhège duōshao qián?'], ['这是什么？', 'Zhè shì shénme?'], ['你叫什么？', 'Nǐ jiào shénme?'], ['现在几点？', 'Xiànzài jǐ diǎn?']] },
          { q: 'Hỏi đường đến bệnh viện:', big: '🏥', say: null, options: [['医院在哪儿？', 'Yīyuàn zài nǎr?'], ['医院怎么样？', 'Yīyuàn zěnmeyàng?'], ['你去医院吗？', 'Nǐ qù yīyuàn ma?'], ['这是医院吗？', 'Zhè shì yīyuàn ma?']] },
        ] },
        { ref: 'radicals_2' },
        { type: 'quiz', title: 'Luyện nghe câu & hội thoại', listen: 'u10' },
      ] },
      { id: 'u11', emoji: '🏃', title: 'Hoạt động hằng ngày', lessons: [
        { type: 'vocab', title: 'Từ mới: động từ (1)', words: { hsk: 'hsk_verbs1' } },
        { type: 'vocab', title: 'Từ mới: động từ (2)', words: { hsk: 'hsk_verbs2' } },
        { type: 'vocab', title: 'Từ mới: nơi chốn', words: { hsk: 'hsk_places' } },
        { type: 'learn', title: 'Muốn – biết – có thể: 想 / 会 / 能', items: [
          { big: '我想喝茶。', py: 'Wǒ xiǎng hē chá.', vi: 'Tôi muốn uống trà.', note: '想 + động từ = muốn làm gì. Phủ định: 不想 (không muốn).' },
          { big: '我不想去。', py: 'Wǒ bù xiǎng qù.', vi: 'Tôi không muốn đi.' },
          { big: '他会说汉语。', py: 'Tā huì shuō Hànyǔ.', vi: 'Anh ấy biết nói tiếng Hán.', note: '会 = biết (kỹ năng phải học mới làm được). Phủ định: 不会.' },
          { big: '明天会下雨。', py: 'Míngtiān huì xià yǔ.', vi: 'Ngày mai sẽ mưa.', note: '会 còn có nghĩa "sẽ" khi dự đoán.' },
          { big: '我能坐这儿吗？', py: 'Wǒ néng zuò zhèr ma?', vi: 'Tôi có thể ngồi đây không?', note: '能 = có thể (có điều kiện, được phép). Phủ định: 不能.' },
          { big: '会 hay 能?', py: '会 huì · 能 néng', say: '会，能', vi: '会: biết làm (do học) · 能: làm được (có điều kiện)',
            note: '我会说汉语 = tôi biết nói (đã học); 今天我不能来 = hôm nay tôi không đến được (vì bận).' },
        ] },
        { type: 'order', title: 'Sắp xếp câu: 想 / 会 / 能', sentences: [
          { tokens: ['我', '想', '喝', '茶'], py: 'Wǒ xiǎng hē chá.', vi: 'Tôi muốn uống trà.' },
          { tokens: ['他', '会', '说', '汉语'], py: 'Tā huì shuō Hànyǔ.', vi: 'Anh ấy biết nói tiếng Hán.' },
          { tokens: ['我', '能', '坐', '这儿', '吗'], py: 'Wǒ néng zuò zhèr ma?', vi: 'Tôi có thể ngồi đây không?', end: '？' },
          { tokens: ['我', '不想', '去', '商店'], py: 'Wǒ bù xiǎng qù shāngdiàn.', vi: 'Tôi không muốn đi cửa hàng.' },
        ] },
        { type: 'quiz', title: 'Chọn 想, 会 hay 能?', questions: [
          { q: 'Điền từ đúng (nghĩa: biết nói)', big: '我___说汉语。', say: null, options: ['会', '想', '能', '在'] },
          { q: 'Điền từ đúng (nghĩa: muốn uống)', big: '我___喝茶。', say: null, options: ['想', '会', '能', '是'] },
          { q: 'Điền từ đúng (nghĩa: không đến được — vì bận)', big: '对不起，明天我不___来。', say: null, options: ['能', '想', '是', '在'] },
          { q: 'Điền từ đúng (nghĩa: biết nấu)', big: '你___做中国菜吗？', say: null, options: ['会', '是', '在', '很'] },
          { q: 'Điền từ đúng (nghĩa: sẽ — dự đoán)', big: '明天___下雨。', say: null, options: ['会', '想', '是', '在'] },
        ] },
        { ref: 'g_order_1' },
        { ref: 'g_order_2' },
        { ref: 'radicals_quiz' },
        { type: 'quiz', title: 'Luyện nghe câu & hội thoại', listen: 'u11' },
      ] },
      { id: 'u12', emoji: '💬', title: 'Giao tiếp tự nhiên', lessons: [
        { type: 'vocab', title: 'Từ mới: tính từ, phó từ', words: { hsk: 'hsk_adj' } },
        { type: 'vocab', title: 'Từ mới: giao tiếp, hư từ', words: { hsk: 'hsk_function' } },
        { type: 'learn', title: '呢 · 怎么样 · 怎么 · 都 · 和', items: [
          { big: '我很好，你呢？', py: 'Wǒ hěn hǎo, nǐ ne?', vi: 'Tôi khoẻ, còn bạn?', note: 'Danh từ / đại từ + 呢 = "… thì sao?" — hỏi lại cùng ý câu trước.' },
          { big: '我的书呢？', py: 'Wǒ de shū ne?', vi: 'Sách của tôi đâu rồi?', note: 'Người / vật + 呢 (không có câu trước) = "… đâu rồi?"' },
          { big: '天气怎么样？', py: 'Tiānqì zěnmeyàng?', vi: 'Thời tiết thế nào?', note: '怎么样 = thế nào (hỏi tình trạng, ý kiến), đứng cuối câu.' },
          { big: '你怎么去学校？', py: 'Nǐ zěnme qù xuéxiào?', vi: 'Bạn đến trường bằng cách nào?', note: '怎么 + động từ = làm … bằng cách nào.' },
          { big: '我们都是学生。', py: 'Wǒmen dōu shì xuésheng.', vi: 'Chúng tôi đều là học sinh.', note: '都 (đều) đứng SAU chủ ngữ, TRƯỚC động từ — không đứng đầu câu.' },
          { big: '我和妈妈', py: 'wǒ hé māma', vi: 'tôi và mẹ', note: '和 chỉ nối danh từ / đại từ (A 和 B), KHÔNG dùng để nối hai câu như "và" trong tiếng Việt.' },
        ] },
        { type: 'order', title: 'Sắp xếp câu: 呢 · 怎么样 · 都 · 和', sentences: [
          { tokens: ['我们', '都', '喜欢', '喝', '茶'], py: 'Wǒmen dōu xǐhuan hē chá.', vi: 'Chúng tôi đều thích uống trà.' },
          { tokens: ['你', '怎么', '去', '北京'], py: 'Nǐ zěnme qù Běijīng?', vi: 'Bạn đi Bắc Kinh bằng gì?', end: '？' },
          { tokens: ['这个', '饭店', '怎么样'], py: 'Zhège fàndiàn zěnmeyàng?', vi: 'Nhà hàng này thế nào?', end: '？' },
          { tokens: ['我', '和', '朋友', '去', '商店'], py: 'Wǒ hé péngyou qù shāngdiàn.', vi: 'Tôi với bạn đi cửa hàng.' },
        ] },
        { type: 'quiz', title: 'Chọn 呢, 怎么样, 怎么, 都 hay 和?', questions: [
          { q: 'Điền từ đúng (nghĩa: còn bạn?)', big: '我很好，你___？', say: null, options: ['呢', '吗', '的', '了'] },
          { q: 'Điền từ đúng (nghĩa: thế nào?)', big: '明天天气___？', say: null, options: ['怎么样', '什么', '哪儿', '几'] },
          { q: 'Điền từ đúng (nghĩa: bằng cách nào?)', big: '你___去医院？', say: null, options: ['怎么', '什么', '谁', '几'] },
          { q: 'Điền từ đúng (nghĩa: đều)', big: '我们___是中国人。', say: null, options: ['都', '和', '很', '太'] },
          { q: 'Điền từ đúng (nghĩa: và)', big: '爸爸___妈妈都是老师。', say: null, options: ['和', '都', '很', '的'] },
        ] },
        { ref: 'ime_setup' },
        { ref: 'type_1' },
        { ref: 'type_2' },
        { type: 'quiz', title: 'Luyện nghe câu & hội thoại', listen: 'u12' },
      ] },
    ] },
    { id: 'p3', title: 'Phần 4 · Từ vựng mở rộng', desc: 'Học thêm từ qua hình ảnh: màu sắc, thời tiết, cơ thể…', units: [
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
