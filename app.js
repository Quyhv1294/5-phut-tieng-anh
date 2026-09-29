(function () {

  // ---------- 3D EMOJI ICONS ----------
  // Tự động quét mọi đoạn text trong trang (kể cả nội dung được JS tạo ra sau này)
  // và thay các ký tự emoji đã có trong EMOJI_ICONS bằng ảnh icon 3D tương ứng.
  // Nhờ dùng MutationObserver nên không cần sửa từng chỗ render riêng lẻ —
  // chỉ cần khai báo icon 1 lần trong data/emoji-icons.js là áp dụng toàn app.
  const EMOJI_KEYS = Object.keys(typeof EMOJI_ICONS !== 'undefined' ? EMOJI_ICONS : {})
    .sort((a, b) => b.length - a.length);
  const EMOJI_PATTERN = EMOJI_KEYS.length
    ? new RegExp('(' + EMOJI_KEYS.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g')
    : null;

  function upgradeEmojiIcons(root) {
    if (!EMOJI_PATTERN || !root) return;
    if (root.nodeType === 1 && root.closest && root.closest('.print-area')) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && EMOJI_PATTERN.test(node.nodeValue)) textNodes.push(node);
      EMOJI_PATTERN.lastIndex = 0;
    }

    textNodes.forEach(textNode => {
      const text = textNode.nodeValue;
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let m;
      EMOJI_PATTERN.lastIndex = 0;
      while ((m = EMOJI_PATTERN.exec(text))) {
        if (m.index > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        const img = document.createElement('img');
        img.className = 'emoji-icon';
        img.src = EMOJI_ICONS[m[0]];
        img.alt = m[0];
        img.loading = 'lazy';
        frag.appendChild(img);
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  if (EMOJI_PATTERN) {
    const emojiObserver = new MutationObserver(mutations => {
      mutations.forEach(mut => {
        if (mut.type === 'characterData') {
          if (mut.target.parentNode) upgradeEmojiIcons(mut.target.parentNode);
          return;
        }
        mut.addedNodes.forEach(n => {
          if (n.nodeType === 1) upgradeEmojiIcons(n);
          else if (n.nodeType === 3 && n.parentNode) upgradeEmojiIcons(n.parentNode);
        });
      });
    });
    const startObserving = () => {
      upgradeEmojiIcons(document.body);
      emojiObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    };
    if (document.readyState !== 'loading') startObserving();
    else document.addEventListener('DOMContentLoaded', startObserving);
  }

  const STORAGE_KEY = '5phut_progress_v1';
  const SPELLING_WORD_COUNT = 4; // Xếp chữ chỉ lấy ngẫu nhiên 4 từ/lượt cho vừa sức bé
  // Luật Xếp chữ theo lớp: độ dài từ và số từ mỗi lượt. Mầm: từ 3-4 chữ cái cho vừa sức bé;
  // Chồi: từ 3-6 chữ cái, 5 từ/lượt.
  const MEMORY_PAIRS = 6; // Lật thẻ (lớp Chồi): 6 cặp = 12 thẻ
  let choiGamesMode = 'spell'; // Trò chơi lớp Chồi đang chọn: 'spell' (Xếp chữ) | 'memory' (Lật thẻ) | 'simon' (Simon nói)
  let laGamesMode = 'spell'; // Trò chơi lớp Lá đang chọn: 'spell' (Xếp chữ dài) | 'speed' (Đố nhanh) | 'order' (Sắp xếp câu)
  let laSentencesMode = 'qa'; // Câu lớp Lá đang chọn: 'qa' (Hỏi-đáp) | 'dialogue' (Đối thoại) | 'write' (Viết câu)
  const QA_ROUND_COUNT = 6; // Hỏi-đáp (lớp Lá): mỗi lượt nối 6 cặp câu hỏi-trả lời
  const SIMON_ROUNDS = 8; // Simon nói (lớp Chồi): 8 lượt mỗi ván
  const SIMON_SAYS_CHANCE = 0.65; // xác suất 1 lượt có "Simon says" (còn lại là lượt gài bẫy)
  const SENTENCE_BUILD_COUNT = 5; // Ghép câu (lớp Chồi): mỗi lượt 5 câu
  const CHOI_FIRST_ROUND_STARS = 5; // sao thưởng lần ĐẦU hoàn thành mỗi chủ đề Xếp chữ / nhóm Ghép câu của lớp Chồi
  const SPELLING_RULES = {
    mam: { minLetters: 3, maxLetters: 4, count: SPELLING_WORD_COUNT },
    choi: { minLetters: 3, maxLetters: 6, count: 5 },
    la: { minLetters: 5, maxLetters: 9, count: 5 },
  };
  // Các từ của chủ đề đủ điều kiện cho Xếp chữ của lớp (có thể ít hơn số từ/lượt, hoặc rỗng — chủ
  // đề rỗng bị ẩn khỏi danh sách game, xem renderGamesScreen / renderChoiSpellGrid).
  function getSpellingPool(topic, classId) {
    const r = SPELLING_RULES[classId || 'mam'];
    return topic.words.filter(w => w.en.length >= r.minLetters && w.en.length <= r.maxLetters);
  }
  const SPEED_WORD_COUNT = 8; // Đố vui tính giờ: lấy tối đa 8 từ/lượt để có đủ thời gian "đua"
  const SPEED_TIME_LIMIT = 30; // giây cho mỗi lượt chơi
  const QUIZPARENT_WORD_COUNT = 8; // Đố ba mẹ: lấy tối đa 8 từ/lượt, đủ dài nhưng không quá dài
  const REVERSE_WORD_COUNT = 6; // Đoán nghĩa: lấy tối đa 6 từ/lượt
  const FILLBLANK_WORD_COUNT = 6; // Điền từ: lấy tối đa 6 câu/lượt

  // ---------- GHÉP HÌNH (mảnh ghép tranh — thay cho sổ sticker cũ) ----------
  // Dùng TẤT CẢ chủ đề hiện có (không còn chủ đề nào khoá vĩnh viễn unlocksAt: Infinity nữa) để
  // bức tranh luôn có thể ghép trọn vẹn.
  const PUZZLE_TOPICS = TOPICS.filter(t => !t.unlocksAt || isFinite(t.unlocksAt));
  const PUZZLE_COLS = 4;
  const PUZZLE_ROWS = Math.ceil(PUZZLE_TOPICS.length / PUZZLE_COLS);
  const PUZZLE_BG_SIZE = (PUZZLE_COLS * 100) + '% ' + (PUZZLE_ROWS * 100) + '%';
  // Ảnh tranh ghép — ảnh thật (assets/anh_ghep.jpeg, 1376x768) do người dùng cung cấp, thay cho
  // cảnh minh hoạ vẽ tay bằng SVG trước đây. LƯU Ý: .puzzle-board trong style.css có
  // aspect-ratio khớp ĐÚNG tỉ lệ khung hình của ảnh này (1376/768) — đổi ảnh khác thì phải đổi
  // luôn aspect-ratio đó theo tỉ lệ khung hình mới, không thì các mảnh ghép sẽ bị méo.
  const PUZZLE_BG_URL = 'url("assets/anh_ghep.jpeg")';

  // ---------- TRANG PHỤC CHO CHÚ CÁO ----------
  // unlocksAt = mốc SỐ SAO (progress.stars) cần CÓ ĐỦ để mua — đúng 1 số sao duy nhất bé nhìn
  // thấy, kiếm được và tiêu được, không tách "ví" riêng (mua thật sự trừ thẳng vào progress.stars).
  // Đủ mốc sao chỉ mở ra CƠ HỘI mua (is-buyable) chứ không tự động cấp — bé phải tự bấm mua mới
  // thực sự sở hữu. Cấp độ (getLevel) KHÔNG dùng progress.stars này (vì nó giảm khi tiêu) mà dùng
  // progress.lifetimeStars — 1 số ẩn, không hiển thị, chỉ tăng chứ không bao giờ giảm, để mua đồ
  // không bao giờ làm bé bị "tụt cấp" (xem addStars). (Chủ đề học ở Tap "Học" KHÔNG dùng cơ chế
  // mua này — xem isTopicLocked, mở tuần tự theo điểm quiz, không liên quan sao.)
  // slot: 'head' (đè lên vùng đầu ảnh chú cáo) hoặc 'body' (đè lên vùng thân) — bé có thể mặc
  // ĐỒNG THỜI 1 món đầu + 1 món thân (2 slot độc lập, không tranh chỗ nhau), xem
  // progress.equippedOutfits/renderMascotAccessory.
  // img: ảnh thật (assets/outfits/<id>.png, do người dùng cung cấp + đã xoá nền) chụp đúng con cáo
  // này đang mặc SẴN đúng món đó — dùng khi CHỈ 1 món đang được mặc trong toàn bộ (nhìn như mặc
  // thật, không phải icon dán đè). Khi mặc ĐÚNG 1 món đầu + 1 món thân cùng lúc, xem COMBO_IMAGES
  // bên dưới (ảnh ghép sẵn riêng, không phải ghép 2 ảnh solo chồng lên nhau). Các trường hợp còn lại
  // (0 món, hoặc từ 2 món đầu trở lên) quay lại ảnh nền (mascot-fox.png) + badge emoji đè như cũ.
  const OUTFITS = [
    { id: 'scarf', emoji: '🧣', label: 'Khăn quàng', unlocksAt: 10, slot: 'head', img: 'assets/outfits/scarf.png' },
    { id: 'tshirt', emoji: '👕', label: 'Áo thun', unlocksAt: 20, slot: 'body', img: 'assets/outfits/tshirt.png' },
    { id: 'ribbon', emoji: '🎀', label: 'Nơ xinh', unlocksAt: 25, slot: 'head', img: 'assets/outfits/ribbon.png' },
    { id: 'vest', emoji: '🦺', label: 'Áo phản quang', unlocksAt: 45, slot: 'body', img: 'assets/outfits/vest.png' },
    { id: 'hat', emoji: '🎩', label: 'Mũ chóp', unlocksAt: 50, slot: 'head', img: 'assets/outfits/hat.png' },
    { id: 'jacket', emoji: '🧥', label: 'Áo khoác', unlocksAt: 80, slot: 'body', img: 'assets/outfits/jacket.png' },
    { id: 'glasses', emoji: '🕶️', label: 'Kính râm', unlocksAt: 100, slot: 'head', img: 'assets/outfits/glasses.png' },
    { id: 'labcoat', emoji: '🥼', label: 'Áo bác sĩ', unlocksAt: 130, slot: 'body', img: 'assets/outfits/labcoat.png' },
    { id: 'necktie', emoji: '👔', label: 'Cà vạt', unlocksAt: 150, slot: 'head', img: 'assets/outfits/necktie.png' },
    { id: 'martial', emoji: '🥋', label: 'Võ phục', unlocksAt: 190, slot: 'body', img: 'assets/outfits/martial.png' },
    { id: 'crown', emoji: '👑', label: 'Vương miện', unlocksAt: 250, slot: 'head', img: 'assets/outfits/crown.png' },
    { id: 'astronaut', emoji: '🧑‍🚀', label: 'Đồ phi hành gia', unlocksAt: 300, slot: 'body', img: 'assets/outfits/astronaut.png' },
  ];

  // Ảnh ghép sẵn riêng cho combo "đúng 1 món đầu + đúng 1 món thân cùng lúc" — khoá là
  // '<headId>_<bodyId>' — do người dùng cung cấp + đã xoá nền, KHÔNG phải 2 ảnh solo chồng lên
  // nhau. Đủ 36/36 tổ hợp (6 đầu × 6 thân).
  const COMBO_IMAGES = {
    crown_tshirt: 'assets/outfits/combo/crown_tshirt.png',
    crown_jacket: 'assets/outfits/combo/crown_jacket.png',
    crown_labcoat: 'assets/outfits/combo/crown_labcoat.png',
    crown_vest: 'assets/outfits/combo/crown_vest.png',
    crown_martial: 'assets/outfits/combo/crown_martial.png',
    crown_astronaut: 'assets/outfits/combo/crown_astronaut.png',
    hat_tshirt: 'assets/outfits/combo/hat_tshirt.png',
    hat_jacket: 'assets/outfits/combo/hat_jacket.png',
    hat_labcoat: 'assets/outfits/combo/hat_labcoat.png',
    hat_vest: 'assets/outfits/combo/hat_vest.png',
    hat_martial: 'assets/outfits/combo/hat_martial.png',
    hat_astronaut: 'assets/outfits/combo/hat_astronaut.png',
    glasses_martial: 'assets/outfits/combo/glasses_martial.png',
    glasses_astronaut: 'assets/outfits/combo/glasses_astronaut.png',
    glasses_jacket: 'assets/outfits/combo/glasses_jacket.png',
    glasses_labcoat: 'assets/outfits/combo/glasses_labcoat.png',
    glasses_tshirt: 'assets/outfits/combo/glasses_tshirt.png',
    glasses_vest: 'assets/outfits/combo/glasses_vest.png',
    ribbon_tshirt: 'assets/outfits/combo/ribbon_tshirt.png',
    ribbon_vest: 'assets/outfits/combo/ribbon_vest.png',
    ribbon_jacket: 'assets/outfits/combo/ribbon_jacket.png',
    ribbon_astronaut: 'assets/outfits/combo/ribbon_astronaut.png',
    ribbon_labcoat: 'assets/outfits/combo/ribbon_labcoat.png',
    ribbon_martial: 'assets/outfits/combo/ribbon_martial.png',
    necktie_jacket: 'assets/outfits/combo/necktie_jacket.png',
    necktie_astronaut: 'assets/outfits/combo/necktie_astronaut.png',
    necktie_vest: 'assets/outfits/combo/necktie_vest.png',
    necktie_labcoat: 'assets/outfits/combo/necktie_labcoat.png',
    necktie_martial: 'assets/outfits/combo/necktie_martial.png',
    necktie_tshirt: 'assets/outfits/combo/necktie_tshirt.png',
    scarf_labcoat: 'assets/outfits/combo/scarf_labcoat.png',
    scarf_vest: 'assets/outfits/combo/scarf_vest.png',
    scarf_tshirt: 'assets/outfits/combo/scarf_tshirt.png',
    scarf_jacket: 'assets/outfits/combo/scarf_jacket.png',
    scarf_astronaut: 'assets/outfits/combo/scarf_astronaut.png',
    scarf_martial: 'assets/outfits/combo/scarf_martial.png',
  };

  // Chuẩn hoá 1 object progress thô (từ localStorage HOẶC từ document Firestore của 1 bé)
  // về đúng shape mong đợi, điền mặc định cho field thiếu.
  //
  // ĐỔI TÊN (gộp sao, không tách ví nữa): trước đây có 2 số — "stars" (tổng trọn đời, không giảm,
  // dùng để lên cấp) và "wallet" (để dành, giảm khi mua). Theo yêu cầu, giờ chỉ còn 1 số "stars"
  // DUY NHẤT bé nhìn thấy — kiếm được thì cộng, mua gì thì trừ thẳng vào đây, không còn khái niệm
  // "ví" riêng. Để cấp độ không bị tụt khi bé mua đồ, tổng sao trọn đời được giữ lại dưới tên ẩn
  // "lifetimeStars" — không hiển thị ở đâu cả, chỉ dùng ngầm cho getLevel.
  // Di trú: progress cũ (đã từng có "wallet") thì "stars" mới = "wallet" cũ (đúng số sao bé đang
  // thực sự tiêu được), "lifetimeStars" mới = "stars" cũ. Progress cũ hơn nữa (trước khi có "wallet",
  // tức trước khi có cơ chế mua) thì chưa từng tiêu gì nên "stars" mới = "lifetimeStars" mới =
  // đúng "stars" cũ (khi đó 2 khái niệm này vốn là 1).
  //
  // Di trú 1 lần cho trang phục (progress cũ trước khi có cơ chế "mua" thủ công): nếu chưa từng
  // có purchasedOutfits, giữ nguyên các trang phục đã đủ mốc sao tại thời điểm này coi như "đã
  // mua" (không trừ sao) để không đột nhiên khoá lại thứ bé đã có.
  //
  // Di trú 1 lần cho chủ đề (progress cũ trước khi có cơ chế mở tuần tự theo điểm quiz): nếu chưa
  // từng có topicPassed, coi các chủ đề đã từng hoàn thành (doneTopics) là đã "đạt" luôn — không
  // có dữ liệu điểm số cũ để biết chính xác có đạt 80% hay không, nên cho qua hết, ưu tiên không
  // khoá lại nội dung bé đã học qua hơn là siết chặt hồi tố.
  //
  // purchasedTopics/topicsSeen là dữ liệu cũ từ thời Trò chơi/Câu còn khoá mua bằng sao (2 tab này
  // giờ luôn mở, không còn đọc 2 field này ở đâu nữa) — giữ lại migrate cho khỏi vỡ dữ liệu cũ của
  // bé đã lưu trước đây, không có tác dụng khoá gì nữa.
  function normalizeProgress(p) {
    p = p || {};
    // "p" có thể ở 1 trong 3 dạng: (a) đã ở schema mới (có sẵn lifetimeStars, VD mọi lần tải lại
    // SAU lần di trú đầu tiên) — giữ nguyên; (b) đang ở schema cũ (có wallet, chưa có lifetimeStars,
    // đúng lúc vừa deploy đổi tên này) — di trú 1 lần; (c) rất cũ (chưa từng có wallet lẫn
    // lifetimeStars) — 2 số vốn là 1 nên dùng chung "stars" cũ. TUYỆT ĐỐI không được lấy
    // lifetimeStars từ p.stars khi p.lifetimeStars đã tồn tại, vì p.stars ở dạng (a) là số ĐÃ BỊ
    // TRỪ khi mua đồ — lấy nhầm sẽ khiến cấp độ tụt theo mỗi lần tải lại trang.
    const lifetimeStars = p.lifetimeStars !== undefined ? (p.lifetimeStars || 0) : (p.stars || 0);
    const stars = p.wallet !== undefined ? (p.wallet || 0) : (p.stars || 0);
    const purchasedOutfits = p.purchasedOutfits || {};
    if (!p.purchasedOutfits) {
      OUTFITS.forEach(o => { if (lifetimeStars >= o.unlocksAt) purchasedOutfits[o.id] = true; });
    }
    const topicPassed = p.topicPassed || {};
    if (!p.topicPassed) {
      Object.keys(p.doneTopics || {}).forEach(id => { topicPassed[id] = true; });
    }
    const purchasedTopics = p.purchasedTopics || {};
    if (!p.purchasedTopics) {
      TOPICS.forEach(t => { if (topicPassed[t.id] || (p.doneTopics && p.doneTopics[t.id])) purchasedTopics[t.id] = true; });
    }
    const topicsSeen = p.topicsSeen || {};
    if (!p.topicsSeen) {
      TOPICS.forEach(t => { if (t.unlocksAt && stars >= t.unlocksAt) topicsSeen[t.id] = true; });
    }
    return {
      stars: stars,
      lifetimeStars: lifetimeStars,
      purchasedOutfits: purchasedOutfits,
      purchasedTopics: purchasedTopics,
      doneTopics: p.doneTopics || {},
      topicPassed: topicPassed,
      streak: { count: (p.streak && p.streak.count) || 0, lastDate: (p.streak && p.streak.lastDate) || null, best: (p.streak && p.streak.best) || 0 },
      streakFreezes: p.streakFreezes || 0,
      dailyMissions: { date: (p.dailyMissions && p.dailyMissions.date) || null, claimed: !!(p.dailyMissions && p.dailyMissions.claimed), stats: (p.dailyMissions && p.dailyMissions.stats) || null },
      perfectCount: p.perfectCount || 0,
      badges: p.badges || {},
      wordStats: p.wordStats || {},
      placedPieces: p.placedPieces || {},
      outfitsSeen: p.outfitsSeen || {},
      placement: (p.placement && PLACEMENT_LEVELS[p.placement.level]) ? p.placement : null,
      promotions: p.promotions || {}, // ngày bé đậu bài kiểm tra lên lớp: { mam: 'YYYY-MM-DD', choi: '...' }
      // Tiến độ riêng của lớp Chồi (Xếp chữ + Ghép câu) — xem finishChoiRound.
      choi: {
        spellWords: (p.choi && p.choi.spellWords) || 0,
        sentencesBuilt: (p.choi && p.choi.sentencesBuilt) || 0,
        spellTopics: (p.choi && p.choi.spellTopics) || {},
        sentenceGroups: (p.choi && p.choi.sentenceGroups) || {},
        memoryTopics: (p.choi && p.choi.memoryTopics) || {},   // chủ đề Lật thẻ đã hoàn thành
        writeGroups: (p.choi && p.choi.writeGroups) || {},     // nhóm Tập viết đã hoàn thành
        lettersWritten: (p.choi && p.choi.lettersWritten) || 0,
        simonPlayed: (p.choi && p.choi.simonPlayed) || {},     // đã chơi xong 1 ván Simon nói (key cố định 'simon')
        songsPlayed: (p.choi && p.choi.songsPlayed) || {},     // bài hát đã hát xong ít nhất 1 lần
      },
      // Tiến độ riêng của lớp Lá (Xếp chữ dài + Sắp xếp câu ở tab Trò chơi; Hỏi-đáp + Đối thoại +
      // Viết câu ở tab Câu) — xem finishLaRound.
      la: {
        spellWords: (p.la && p.la.spellWords) || 0,
        sentencesBuilt: (p.la && p.la.sentencesBuilt) || 0,
        spellTopics: (p.la && p.la.spellTopics) || {},
        sentenceGroups: (p.la && p.la.sentenceGroups) || {},
        qaGroups: (p.la && p.la.qaGroups) || {},
        dialogueGroups: (p.la && p.la.dialogueGroups) || {},
        writeSentGroups: (p.la && p.la.writeSentGroups) || {},
        paragraphGroups: (p.la && p.la.paragraphGroups) || {},
        memoryTopics: (p.la && p.la.memoryTopics) || {},
        simonPlayed: (p.la && p.la.simonPlayed) || {},
        songsPlayed: (p.la && p.la.songsPlayed) || {},
      },
      topicsSeen: topicsSeen,
      // Di trú equippedOutfits qua 3 đời schema, cũ nhất trước:
      //  (a) chưa từng có slot: progress.equippedOutfit là 1 string (hoặc null) — coi là 1 món đầu.
      //  (b) có slot đầu/thân nhưng đầu vẫn chỉ mặc được 1 món: equippedOutfits.head là 1 string.
      //  (c) đầu mặc được NHIỀU món cùng lúc (hiện tại): equippedOutfits.head là mảng string[].
      // Luôn chuẩn hoá về dạng (c) — head là mảng — để code phía sau không phải tự đoán kiểu dữ liệu.
      equippedOutfits: {
        head: Array.isArray(p.equippedOutfits && p.equippedOutfits.head) ? p.equippedOutfits.head
          : (p.equippedOutfits && p.equippedOutfits.head) ? [p.equippedOutfits.head]
          : p.equippedOutfit ? [p.equippedOutfit] : [],
        body: (p.equippedOutfits && p.equippedOutfits.body) || null,
      },
    };
  }
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeProgress(raw ? JSON.parse(raw) : {});
    } catch (e) { return blankProgress(); }
  }
  function blankProgress() {
    return {
      stars: 0, lifetimeStars: 0, purchasedOutfits: {}, purchasedTopics: {},
      doneTopics: {}, topicPassed: {}, streak: { count: 0, lastDate: null, best: 0 }, streakFreezes: 0,
      dailyMissions: { date: null, claimed: false, stats: null },
      perfectCount: 0, badges: {}, wordStats: {}, placedPieces: {},
      outfitsSeen: {}, topicsSeen: {}, equippedOutfits: { head: [], body: null }, placement: null, promotions: {},
      choi: { spellWords: 0, sentencesBuilt: 0, spellTopics: {}, sentenceGroups: {}, memoryTopics: {}, writeGroups: {}, lettersWritten: 0, simonPlayed: {}, songsPlayed: {} },
      la: { spellWords: 0, sentencesBuilt: 0, spellTopics: {}, sentenceGroups: {}, qaGroups: {}, dialogueGroups: {}, writeSentGroups: {}, paragraphGroups: {}, memoryTopics: {}, simonPlayed: {}, songsPlayed: {} },
    };
  }
  // Cộng sao: tăng cả số sao bé nhìn thấy/tiêu được (progress.stars) lẫn tổng sao trọn đời ẩn
  // (progress.lifetimeStars, chỉ dùng cho lên cấp — xem getLevel) — 2 số luôn cộng dồn song song,
  // chỉ progress.stars mới bị trừ khi mua đồ, lifetimeStars không bao giờ giảm. Đồng thời báo cho
  // nhiệm vụ hằng ngày biết vừa kiếm thêm sao (xem bumpDailyMission — hàm này có thể gọi ngược lại
  // addStars() để phát sao thưởng khi bé vừa hoàn thành đủ nhiệm vụ, nhưng không lặp vô hạn vì
  // bumpDailyMission luôn đánh dấu "đã phát thưởng hôm nay" TRƯỚC khi gọi addStars cho phần thưởng đó).
  function addStars(amount) {
    progress.stars += amount;
    progress.lifetimeStars += amount;
    bumpDailyMission('starsEarned', amount);
  }

  // ---------- GHI NHỚ TỪ VỰNG (lặp lại ngắt quãng — spaced repetition) ----------
  // Mỗi từ được theo dõi riêng: trả lời đúng thì giãn khoảng ôn tiếp theo ra xa hơn (1 → 3 → 7 →
  // 14 → 30 ngày), trả lời sai thì quay về ôn lại ngay hôm sau — đúng lúc bé sắp quên thì mới nhắc
  // ôn, hiệu quả hơn nhiều so với ôn ngẫu nhiên. Đồng thời đếm số lần sai để gom thành danh sách
  // "từ hay sai" cho bé luyện trúng trọng tâm (xem getDueWords / getDifficultWords bên dưới).
  const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
  const DIFFICULT_WRONG_THRESHOLD = 2;

  const WORD_TO_TOPIC = new Map();
  const WORD_BY_KEY = new Map();
  TOPICS.concat(CHOI_TOPICS).concat(LA_TOPICS).forEach(topic => {
    topic.words.forEach(w => {
      WORD_TO_TOPIC.set(w, topic);
      WORD_BY_KEY.set(topic.id + ':' + w.en, w);
    });
  });
  // Ôn tập ngắt quãng tách theo lớp: từ vựng lớp Chồi/Lá có id chủ đề bắt đầu bằng "choi_"/"la_" nên
  // khoá wordStats ("choi_school:PENCIL") phân biệt được; mọi khoá khác thuộc lớp Mầm.
  function classOfWordKey(key) {
    return key.indexOf('choi_') === 0 ? 'choi' : key.indexOf('la_') === 0 ? 'la' : 'mam';
  }
  function reviewClassId() {
    const c = getActiveClassId();
    return (c === 'choi' || c === 'la') ? c : 'mam';
  }
  // Lớp của 1 từ vựng (tra theo chủ đề chứa nó) — dùng để ôn tập tách lớp và độ khó đố.
  function wordClassId(word) {
    const t = WORD_TO_TOPIC.get(word);
    return t ? classOfWordKey(t.id) : 'mam';
  }
  // Độ khó nâng cao (đố nhiều lựa chọn hơn, xem renderQuiz): áp dụng cho cả Chồi lẫn Lá, không riêng Chồi.
  function isAdvancedVocabWord(word) { return wordClassId(word) !== 'mam'; }
  // Danh sách chủ đề từ vựng dùng để đếm "đã học bao nhiêu chủ đề" / gom pool ôn tập tổng hợp theo lớp.
  function vocabTopicsOf(cls) { return cls === 'choi' ? CHOI_TOPICS : cls === 'la' ? LA_TOPICS : TOPICS; }

  function wordKey(word) {
    const topic = WORD_TO_TOPIC.get(word);
    return (topic ? topic.id : '?') + ':' + word.en;
  }

  // Ghi nhận 1 lần bé trả lời đúng/sai 1 từ (gọi từ Quiz, Tính giờ, Xếp chữ, Đoán nghĩa, Điền từ...).
  // Chỉ cập nhật trong bộ nhớ, KHÔNG tự lưu/đồng bộ ở đây — màn hình gọi hàm này chịu trách nhiệm
  // gọi saveProgress(progress) một lần duy nhất khi kết thúc cả lượt chơi.
  function recordWordAnswer(word, isCorrect) {
    const key = wordKey(word);
    const stat = progress.wordStats[key] || { step: 0, wrongCount: 0, lastSeen: null, nextDue: null };
    if (isCorrect) {
      stat.step = Math.min(stat.step + 1, REVIEW_INTERVALS.length - 1);
      stat.wrongCount = Math.max(0, stat.wrongCount - 1);
    } else {
      stat.step = 0;
      stat.wrongCount += 1;
    }
    stat.lastSeen = toDateStr(new Date());
    const due = new Date();
    due.setDate(due.getDate() + REVIEW_INTERVALS[stat.step]);
    stat.nextDue = toDateStr(due);
    progress.wordStats[key] = stat;
  }

  // Các từ đã "đến hạn" ôn lại hôm nay (nextDue <= hôm nay), quá hạn lâu nhất lên trước.
  function getDueWords(limit, classId) {
    const cls = classId || reviewClassId();
    const todayStr = toDateStr(new Date());
    const due = [];
    Object.keys(progress.wordStats).forEach(key => {
      const stat = progress.wordStats[key];
      const word = WORD_BY_KEY.get(key);
      if (word && classOfWordKey(key) === cls && stat.nextDue && stat.nextDue <= todayStr) due.push({ word: word, nextDue: stat.nextDue });
    });
    due.sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1));
    return due.slice(0, limit || 12).map(d => d.word);
  }

  // Các từ bé hay trả lời sai (sai >= ngưỡng, chưa "gỡ" lại đủ bằng các lần đúng sau đó).
  function getDifficultWords(limit, classId) {
    const cls = classId || reviewClassId();
    const list = [];
    Object.keys(progress.wordStats).forEach(key => {
      const stat = progress.wordStats[key];
      const word = WORD_BY_KEY.get(key);
      if (word && classOfWordKey(key) === cls && stat.wrongCount >= DIFFICULT_WRONG_THRESHOLD) list.push({ word: word, wrongCount: stat.wrongCount });
    });
    list.sort((a, b) => b.wrongCount - a.wrongCount);
    return list.slice(0, limit || 12).map(d => d.word);
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {}
    // Đồng bộ ngược lên Google Sheet mỗi khi tiến độ thay đổi, để thiết bị khác đăng nhập cùng
    // email sau này lấy được đúng bản mới nhất (xem syncProgressToCloud, khai báo phía dưới —
    // an toàn vì hàm này chỉ thực sự CHẠY từ các sự kiện người dùng, sau khi cả file đã nạp xong).
    syncProgressToCloud(p);
  }
  let progress = loadProgress();

  const screens = {
    home: document.getElementById('screen-home'),
    games: document.getElementById('screen-games'),
    sentences: document.getElementById('screen-sentences'),
    sentencePractice: document.getElementById('screen-sentence-practice'),
    sentenceBuild: document.getElementById('screen-sentence-build'),
    sight: document.getElementById('screen-sight'),
    memory: document.getElementById('screen-memory'),
    simon: document.getElementById('screen-simon'),
    songPlay: document.getElementById('screen-song'),
    write: document.getElementById('screen-write'),
    badges: document.getElementById('screen-badges'),
    progress: document.getElementById('screen-progress'),
    settings: document.getElementById('screen-settings'),
    account: document.getElementById('screen-account'),
    donate: document.getElementById('screen-donate'),
    feedback: document.getElementById('screen-feedback'),
    placement: document.getElementById('screen-placement'),
    profileCreate: document.getElementById('screen-profile-create'),
    cards: document.getElementById('screen-cards'),
    phonicsLearn: document.getElementById('screen-phonics-learn'),
    phonicsQuiz: document.getElementById('screen-phonics-quiz'),
    grammarLearn: document.getElementById('screen-grammar-learn'),
    grammarQuiz: document.getElementById('screen-grammar-quiz'),
    storyRead: document.getElementById('screen-story-read'),
    storyQuiz: document.getElementById('screen-story-quiz'),
    quiz: document.getElementById('screen-quiz'),
    quizRecap: document.getElementById('screen-quiz-recap'),
    match: document.getElementById('screen-match'),
    spelling: document.getElementById('screen-spelling'),
    speed: document.getElementById('screen-speed'),
    quizparent: document.getElementById('screen-quizparent'),
    reverse: document.getElementById('screen-reverse'),
    fillblank: document.getElementById('screen-fillblank'),
    weekly: document.getElementById('screen-weekly'),
    done: document.getElementById('screen-done'),
    laQa: document.getElementById('screen-la-qa'),
    laDialogue: document.getElementById('screen-la-dialogue'),
    laWrite: document.getElementById('screen-la-write'),
  };
  const TOP_LEVEL_SCREENS = ['home', 'games', 'sentences', 'badges', 'progress'];

  function showScreen(name) {
    // Rời màn "Ai nhanh hơn" giữa chừng thì phải dừng đồng hồ đếm giờ, không thì nó vẫn
    // chạy ngầm và tự kết thúc lượt chơi (cộng sao) trong lúc bé đang ở màn khác.
    if (name !== 'speed' && speedTimerId) {
      clearInterval(speedTimerId);
      speedTimerId = null;
      speedActive = false;
    }
    // Tương tự cho đồng hồ đếm giờ của "Đố ba mẹ" — rời màn giữa chừng (VD bấm tab khác) thì
    // phải dừng, không thì nó vẫn tự chạy ngầm rồi tự tính "hết giờ" ở màn khác.
    if (name !== 'quizparent') stopQuizParentTimer();
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo(0, 0);

    const isTopLevel = TOP_LEVEL_SCREENS.includes(name);
    document.getElementById('tabbar').hidden = !isTopLevel;
    if (isTopLevel) setActiveTab(name);
  }

  function setActiveTab(name) {
    document.getElementById('tabHome').classList.toggle('active', name === 'home');
    document.getElementById('tabGames').classList.toggle('active', name === 'games');
    document.getElementById('tabSentences').classList.toggle('active', name === 'sentences');
    document.getElementById('tabBadges').classList.toggle('active', name === 'badges');
    document.getElementById('tabProgress').classList.toggle('active', name === 'progress');
  }

  // Trượt viên "thumb" của segment-toggle (kiểu iOS) tới đúng vị trí nút đang active.
  // Gọi lại mỗi khi đổi chế độ HOẶC ngay khi màn chứa nó vừa hiện ra (trước đó display:none
  // nên offsetLeft/offsetWidth đều = 0, không đo được).
  function moveSegmentThumb(container) {
    if (!container) return;
    const active = container.querySelector('.segment-btn.active');
    const thumb = container.querySelector('.segment-thumb');
    if (!active || !thumb) return;
    thumb.style.width = active.offsetWidth + 'px';
    thumb.style.top = active.offsetTop + 'px';
    thumb.style.height = active.offsetHeight + 'px';
    thumb.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }
  window.addEventListener('resize', () => {
    ['gamesModeToggle', 'sentencesModeToggle', 'laSentencesModeToggle', 'collectionModeToggle', 'homeModeToggle', 'choiHomeModeToggle', 'laHomeModeToggle', 'choiGamesModeToggle', 'laGamesModeToggle'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetParent !== null) moveSegmentThumb(el);
    });
  });

  // Tap "Học" gộp 3 khối nội dung lớn (bản đồ 12 chủ đề / bảng chữ cái / ngữ âm) đằng sau 1 segment-
  // toggle thay vì xếp chồng hết lên nhau — trang chủ trước đây dài, phải kéo rất nhiều mới hết.
  // Nhiệm vụ hôm nay/Ôn tập vẫn hiện sẵn phía trên (không thuộc tab nhỏ nào) vì đó là việc bé cần
  // thấy ngay mỗi ngày, không phải "thư viện nội dung" để chọn duyệt qua.
  let homeMode = 'vocab'; // 'vocab' (bản đồ 12 chủ đề), 'abc' (bảng chữ cái), 'phonics' (ngữ âm) hoặc 'story' (truyện tranh)
  function setHomeMode(mode) {
    homeMode = mode;
    document.getElementById('homeModeVocabBtn').classList.toggle('active', mode === 'vocab');
    document.getElementById('homeModeAbcBtn').classList.toggle('active', mode === 'abc');
    document.getElementById('homeModePhonicsBtn').classList.toggle('active', mode === 'phonics');
    document.getElementById('homeModeStoryBtn').classList.toggle('active', mode === 'story');
    document.getElementById('homeModeVocabPanel').hidden = mode !== 'vocab';
    document.getElementById('homeModeAbcPanel').hidden = mode !== 'abc';
    document.getElementById('homeModePhonicsPanel').hidden = mode !== 'phonics';
    document.getElementById('homeModeStoryPanel').hidden = mode !== 'story';
    moveSegmentThumb(document.getElementById('homeModeToggle'));
  }
  document.getElementById('homeModeVocabBtn').addEventListener('click', () => setHomeMode('vocab'));
  document.getElementById('homeModeAbcBtn').addEventListener('click', () => setHomeMode('abc'));
  document.getElementById('homeModePhonicsBtn').addEventListener('click', () => setHomeMode('phonics'));
  document.getElementById('homeModeStoryBtn').addEventListener('click', () => setHomeMode('story'));

  document.getElementById('tabHome').addEventListener('click', () => goHome());
  document.getElementById('brandHomeBtn').addEventListener('click', () => { if (enforceGate()) goHome(); });
  // renderGamesScreen/renderSentencesScreen phải chạy lại mỗi lần vào tab (không chỉ 1 lần lúc
  // mở app) để danh sách chủ đề khoá/mở phản ánh đúng tiến độ mới nhất — quan trọng hơn hẳn từ
  // khi chủ đề mở tuần tự theo từng bài học, thay vì hiếm khi đổi như mốc sao trước đây.
  document.getElementById('tabGames').addEventListener('click', () => { renderGamesScreen(); showScreen('games'); moveSegmentThumb(document.getElementById('gamesModeToggle')); });
  document.getElementById('tabSentences').addEventListener('click', () => { renderSentencesScreen(); showScreen('sentences'); moveSegmentThumb(document.getElementById('sentencesModeToggle')); });
  document.getElementById('tabBadges').addEventListener('click', () => { renderBadgesScreen(); showScreen('badges'); moveSegmentThumb(document.getElementById('collectionModeToggle')); });
  document.getElementById('tabProgress').addEventListener('click', () => { renderProgressScreen(); showScreen('progress'); });

  const LEVELS = [
    { min: 0, emoji: '🌱', label: 'Mầm non' },
    { min: 20, emoji: '⭐', label: 'Học trò chăm' },
    { min: 40, emoji: '🥉', label: 'Ngôi sao đồng' },
    { min: 60, emoji: '🥈', label: 'Ngôi sao bạc' },
    { min: 80, emoji: '🥇', label: 'Ngôi sao vàng' },
    { min: 100, emoji: '🏅', label: 'Nhà vô địch nhí' },
    { min: 200, emoji: '🏆', label: 'Bậc thầy tiếng Anh' },
  ];
  function getLevel(stars) {
    let level = LEVELS[0];
    for (const l of LEVELS) { if (stars >= l.min) level = l; }
    return level;
  }

  // Chủ đề mở TUẦN TỰ: phải học lần lượt từ chủ đề đầu tiên, đạt tối thiểu TOPIC_PASS_RATIO
  // (80%) số câu quiz đúng thì chủ đề TIẾP THEO mới mở (xem finishTopic — set progress.topicPassed).
  // Nếu 1 chủ đề bất kỳ trước đó chưa đạt thì MỌI chủ đề từ đó trở về sau đều khoá, không chỉ chủ
  // đề liền kề — nên phải rà toàn bộ chủ đề đứng trước, không chỉ check 1 chủ đề ngay trước nó.
  // unlocksAt: Infinity (VD "Cơ thể bé", "Phương tiện") là chủ đề CHƯA RA MẮT — luôn khoá, không
  // tính vào chuỗi tuần tự (không cản chủ đề phía sau nó nếu sau này được thêm nội dung).
  function isTopicLocked(topic) {
    if (topic.unlocksAt === Infinity) return true;
    const idx = TOPICS.indexOf(topic);
    for (let i = 0; i < idx; i++) {
      if (TOPICS[i].unlocksAt === Infinity) continue;
      if (!progress.topicPassed[TOPICS[i].id]) return true;
    }
    return false;
  }
  // Lý do đang khoá, hiện trên card/toast — chỉ ra ĐÚNG chủ đề đầu tiên bé cần học xong.
  function topicLockReasonText(topic) {
    if (topic.unlocksAt === Infinity) return 'Sắp ra mắt';
    const idx = TOPICS.indexOf(topic);
    const blocker = TOPICS.slice(0, idx).find(t => t.unlocksAt !== Infinity && !progress.topicPassed[t.id]);
    return blocker ? 'Học xong "' + blocker.label + '" (đạt ≥80%) để mở khoá' : 'Sắp mở khoá';
  }
  // Class/badge dùng chung cho mọi nơi vẽ topic-card.
  function topicLockClasses(topic) {
    return isTopicLocked(topic) ? ' is-locked' : '';
  }
  function topicLockBadgeHtml(topic) {
    return isTopicLocked(topic) ? '<span class="lock-badge">🔒</span>' : '';
  }

  // Tap "Trò chơi" và "Câu": khoá theo TỪNG chủ đề riêng lẻ, không tuần tự như Tap "Học" ở trên —
  // chỉ cần bé đã học xong (progress.doneTopics, tức đã làm xong quiz của chủ đề đó ít nhất 1 lần,
  // không cần đạt ≥80%) là chủ đề đó mở ngay ở cả 2 tab, không phụ thuộc các chủ đề khác đã xong
  // hay chưa.
  function isTopicLockedForPractice(topic) {
    return !progress.doneTopics[topic.id];
  }
  function practiceLockReasonText(topic) {
    return 'Học xong "' + topic.label + '" ở Tap Học để mở khoá';
  }
  function practiceLockClasses(topic) {
    return isTopicLockedForPractice(topic) ? ' is-locked' : '';
  }
  function practiceLockBadgeHtml(topic) {
    return isTopicLockedForPractice(topic) ? '<span class="lock-badge">🔒</span>' : '';
  }
  function showLockedPracticeTopicNotice(topic) {
    showToast('🔒 ' + practiceLockReasonText(topic) + '!', '🔒');
  }
  function renderTotalStars() {
    document.getElementById('totalStars').textContent = progress.stars;
    document.getElementById('levelBadge').textContent = getLevel(progress.lifetimeStars).emoji;
  }

  // ---------- BADGES (huy hiệu cột mốc) ----------
  // Huy hiệu chuỗi ngày (streak_*) còn thưởng thêm 1 "khiên bảo vệ chuỗi" (freeze) — xem
  // updateStreakOnComplete: nếu bé lỡ đúng 1 ngày mà còn khiên, chuỗi được nối tiếp thay vì
  // reset về 1, đỡ nản khi lỡ quên 1 hôm sau cả tuần/tháng chăm chỉ.
  const BADGES = [
    { id: 'first_topic', icon: '🌟', label: 'Bài học đầu tiên', desc: 'Hoàn thành 1 chủ đề từ vựng', check: p => Object.keys(p.doneTopics).length >= 1 },
    { id: 'streak_3', icon: '🔥', label: '3 ngày chăm chỉ', desc: 'Học liên tiếp 3 ngày (+5 sao, +1 🛡️ khiên bảo vệ chuỗi)', bonus: 5, freeze: 1, check: p => p.streak.count >= 3 },
    { id: 'streak_7', icon: '🔥', label: '1 tuần bền bỉ', desc: 'Học liên tiếp 7 ngày (+10 sao, +1 🛡️ khiên bảo vệ chuỗi)', bonus: 10, freeze: 1, check: p => p.streak.count >= 7 },
    { id: 'streak_14', icon: '🔥', label: '2 tuần kiên trì', desc: 'Học liên tiếp 14 ngày (+20 sao, +1 🛡️ khiên bảo vệ chuỗi)', bonus: 20, freeze: 1, check: p => p.streak.count >= 14 },
    { id: 'streak_30', icon: '🔥', label: 'Bền bỉ cả tháng', desc: 'Học liên tiếp 30 ngày (+40 sao, +1 🛡️ khiên bảo vệ chuỗi)', bonus: 40, freeze: 1, check: p => p.streak.count >= 30 },
    { id: 'perfect_5', icon: '🥇', label: 'Ngôi sao xuất sắc', desc: 'Đạt điểm tuyệt đối 5 lần', check: p => (p.perfectCount || 0) >= 5 },
    { id: 'abc_master', icon: '🔤', label: 'Thuộc lòng bảng chữ cái', desc: 'Học xong cả 26 chữ cái (+20 sao)', bonus: 20, check: p => ABC_TOPICS.every(t => p.doneTopics[t.id]) },
    { id: 'promo_choi', icon: '🎓', label: 'Lên Lớp Chồi', desc: 'Đậu bài kiểm tra lên Lớp Chồi (+30 sao)', bonus: 30, check: p => !!(p.promotions && p.promotions.mam) },
    { id: 'promo_la', icon: '🎓', label: 'Lên Lớp Lá', desc: 'Đậu bài kiểm tra lên Lớp Lá (+50 sao)', bonus: 50, check: p => !!(p.promotions && p.promotions.choi) },
    // Huy hiệu này còn quyết định lúc nào rương kho báu trên trang chủ mở ra (xem renderHome) —
    // nên cần có phần thưởng thật sự tương xứng, không chỉ là 1 huy hiệu để khoe.
    { id: 'all_topics', icon: '🏆', label: 'Bậc thầy tí hon', desc: 'Hoàn thành tất cả chủ đề (+100 sao, mở kho báu bí mật!)', bonus: 100, check: p => TOPICS.every(t => p.doneTopics[t.id]) },
    // ----- Huy hiệu riêng của Lớp Chồi (group: 'choi' → nhóm riêng ở tab Sưu tập, xem renderBadgesScreen) -----
    { id: 'choi_phonics_1', group: 'choi', icon: '🔊', label: 'Nhà thám hiểm âm', desc: 'Học xong 1 nhóm Ngữ âm 2 (+5 sao)', bonus: 5,
      check: p => PHONICS2_TOPICS.some(t => p.doneTopics[t.id]) },
    { id: 'choi_digraph', group: 'choi', icon: '🤫', label: 'Bậc thầy âm ghép', desc: 'Học xong cả 3 nhóm âm ghép SH, CH, TH (+10 sao)', bonus: 10,
      check: p => ['phonics2_sh', 'phonics2_ch', 'phonics2_th'].every(id => p.doneTopics[id]) },
    { id: 'choi_phonics_all', group: 'choi', icon: '🌿', label: 'Thợ ghép vần', desc: 'Học xong cả 7 nhóm Ngữ âm 2 (+20 sao)', bonus: 20,
      check: p => PHONICS2_TOPICS.every(t => p.doneTopics[t.id]) },
    { id: 'choi_speller', group: 'choi', icon: '🔤', label: 'Thợ xếp chữ', desc: 'Xếp đúng 30 từ ở trò chơi Xếp chữ (+10 sao)', bonus: 10,
      check: p => p.choi && p.choi.spellWords >= 30 },
    { id: 'choi_sentences', group: 'choi', icon: '🧩', label: 'Nhà văn nhí', desc: 'Ghép đúng 30 câu ở tab Câu (+10 sao)', bonus: 10,
      check: p => p.choi && p.choi.sentencesBuilt >= 30 },
    { id: 'choi_vocab', group: 'choi', icon: '📚', label: 'Bạn của từ mới', desc: 'Học xong cả 9 chủ đề từ vựng Lớp Chồi (+20 sao)', bonus: 20,
      check: p => CHOI_TOPICS.every(t => p.doneTopics[t.id]) },
    { id: 'choi_sight', group: 'choi', icon: '👀', label: 'Đọc nhanh như chớp', desc: 'Học xong cả 9 nhóm Từ hay gặp (+20 sao)', bonus: 20,
      check: p => SIGHT_TOPICS.every(t => p.doneTopics[t.id]) },
    { id: 'choi_writer', group: 'choi', icon: '✍️', label: 'Bàn tay vàng', desc: 'Tô đẹp cả 6 nhóm chữ ở Tập viết (+20 sao)', bonus: 20,
      check: p => WRITE_GROUPS.every(g => p.choi && p.choi.writeGroups[g.id]) },
    { id: 'choi_reader', group: 'choi', icon: '📗', label: 'Mọt sách nhí', desc: 'Đọc hết cả 4 truyện của Lớp Chồi (+15 sao)', bonus: 15,
      check: p => STORY_TOPICS_CHOI.every(t => p.doneTopics[t.id]) },
    { id: 'choi_simon', group: 'choi', icon: '🕺', label: 'Nhanh như Simon', desc: 'Chơi xong 1 ván Simon nói (+5 sao)', bonus: 5,
      check: p => !!(p.choi && p.choi.simonPlayed && p.choi.simonPlayed.simon) },
    { id: 'choi_singer', group: 'choi', icon: '🎤', label: 'Ca sĩ nhí', desc: 'Hát xong 1 bài hát tiếng Anh (+5 sao)', bonus: 5,
      check: p => !!(p.choi && p.choi.songsPlayed && Object.keys(p.choi.songsPlayed).length > 0) },
    { id: 'choi_master', group: 'choi', icon: '🏅', label: 'Học trò xuất sắc lớp Chồi', desc: 'Đạt cả 6 huy hiệu: Thợ ghép vần, Bạn của từ mới, Đọc nhanh như chớp, Bàn tay vàng, Thợ xếp chữ, Nhà văn nhí (+40 sao)', bonus: 40,
      check: p => !!(p.badges.choi_phonics_all && p.badges.choi_vocab && p.badges.choi_sight && p.badges.choi_writer && p.badges.choi_speller && p.badges.choi_sentences) },
    // ----- Huy hiệu riêng của Lớp Lá (group: 'la' → nhóm riêng ở tab Sưu tập, xem renderBadgesScreen) -----
    { id: 'la_vocab', group: 'la', icon: '📚', label: 'Học giả nhí', desc: 'Học xong cả 5 chủ đề từ vựng Lớp Lá (+20 sao)', bonus: 20,
      check: p => LA_TOPICS.every(t => p.doneTopics[t.id]) },
    { id: 'la_grammar', group: 'la', icon: '🔤', label: 'Bậc thầy ngữ pháp', desc: 'Học xong cả 9 bài Ngữ pháp cơ bản (+20 sao)', bonus: 20,
      check: p => GRAMMAR_LA_TOPICS.every(t => p.doneTopics[t.id]) },
    { id: 'la_phonics', group: 'la', icon: '🧱', label: 'Cao thủ ghép âm', desc: 'Học xong cả 3 nhóm Ngữ âm 3 (+15 sao)', bonus: 15,
      check: p => PHONICS3_TOPICS.every(t => p.doneTopics[t.id]) },
    { id: 'la_reader', group: 'la', icon: '📗', label: 'Độc giả nhí', desc: 'Đọc hết cả 3 truyện của Lớp Lá (+15 sao)', bonus: 15,
      check: p => STORY_TOPICS_LA.every(t => p.doneTopics[t.id]) },
    { id: 'la_speller', group: 'la', icon: '🔤', label: 'Thợ xếp chữ dài', desc: 'Xếp đúng 30 từ ở trò chơi Xếp chữ dài (+10 sao)', bonus: 10,
      check: p => p.la && p.la.spellWords >= 30 },
    { id: 'la_sentence_builder', group: 'la', icon: '🧩', label: 'Cao thủ sắp câu', desc: 'Sắp xếp đúng 30 câu ở trò chơi Sắp xếp câu (+10 sao)', bonus: 10,
      check: p => p.la && p.la.sentencesBuilt >= 30 },
    { id: 'la_qa', group: 'la', icon: '❓', label: 'Nhà hùng biện nhí', desc: 'Chơi xong cả 5 nhóm Hỏi-đáp (+15 sao)', bonus: 15,
      check: p => p.la && QA_LA_TOPICS.every(t => p.la.qaGroups[t.id]) },
    { id: 'la_dialogue', group: 'la', icon: '🗣️', label: 'Diễn viên nhí', desc: 'Đóng vai xong cả 4 hội thoại (+15 sao)', bonus: 15,
      check: p => p.la && DIALOGUE_LA_TOPICS.every(t => p.la.dialogueGroups[t.id]) },
    { id: 'la_writer', group: 'la', icon: '✍️', label: 'Cây bút nhí', desc: 'Viết xong cả 5 nhóm câu ở Viết câu ngắn (+15 sao)', bonus: 15,
      check: p => p.la && WRITE_LA_TOPICS.every(t => p.la.writeSentGroups[t.id]) },
    { id: 'la_phrases', group: 'la', icon: '🗣️', label: 'Giao tiếp giỏi', desc: 'Học xong cả 5 nhóm Cụm từ thông dụng (+20 sao)', bonus: 20,
      check: p => PHRASES_LA_TOPICS.every(t => p.doneTopics[t.id]) },
    { id: 'la_reading', group: 'la', icon: '📋', label: 'Chuyên gia tra cứu', desc: 'Đọc hiểu xong cả 3 bài văn bản thông tin (+15 sao)', bonus: 15,
      check: p => READING_LA_TOPICS.every(t => p.doneTopics[t.id]) },
    { id: 'la_paragraph', group: 'la', icon: '📝', label: 'Nhà văn nhí lớp Lá', desc: 'Viết xong cả 4 đoạn văn ngắn (+15 sao)', bonus: 15,
      check: p => p.la && PARAGRAPH_LA_TOPICS.every(t => p.la.paragraphGroups[t.id]) },
    // choi_simon/choi_singer (xem BADGES nhóm 'choi') KHÔNG bắt buộc cho choi_master — Lật thẻ/Simon
    // nói/Bài hát là nội dung "thêm" (bonus), không phải nội dung cốt lõi — la_memory (không có, xem
    // finishLaRound comment), la_simon, la_songs cũng theo đúng tinh thần đó: không bắt buộc cho la_master.
    { id: 'la_simon', group: 'la', icon: '🕺', label: 'Nhanh như Simon', desc: 'Chơi xong 1 ván Simon nói nâng cao (+5 sao)', bonus: 5,
      check: p => !!(p.la && p.la.simonPlayed && p.la.simonPlayed.simon) },
    { id: 'la_songs', group: 'la', icon: '🎤', label: 'Ca sĩ nhí lớp Lá', desc: 'Hát xong 1 bài hát tiếng Anh (+5 sao)', bonus: 5,
      check: p => !!(p.la && p.la.songsPlayed && Object.keys(p.la.songsPlayed).length > 0) },
    { id: 'la_master', group: 'la', icon: '🏅', label: 'Học trò xuất sắc lớp Lá', desc: 'Đạt đủ 12 huy hiệu Lớp Lá: Học giả nhí, Bậc thầy ngữ pháp, Cao thủ ghép âm, Độc giả nhí, Thợ xếp chữ dài, Cao thủ sắp câu, Nhà hùng biện nhí, Diễn viên nhí, Cây bút nhí, Giao tiếp giỏi, Chuyên gia tra cứu, Nhà văn nhí lớp Lá (+40 sao)', bonus: 40,
      check: p => !!(p.badges.la_vocab && p.badges.la_grammar && p.badges.la_phonics && p.badges.la_reader && p.badges.la_speller && p.badges.la_sentence_builder && p.badges.la_qa && p.badges.la_dialogue && p.badges.la_writer && p.badges.la_phrases && p.badges.la_reading && p.badges.la_paragraph) },
  ];

  // Kiểm tra sau mỗi lần hoàn thành bài học xem có mở khoá huy hiệu mới không.
  // Trả về danh sách huy hiệu vừa mở khoá (để hiện hiệu ứng ăn mừng). Huy hiệu chuỗi ngày
  // (streak_*) còn kèm thưởng sao (bonus) để chuỗi ngày thực sự có phần thưởng, không chỉ để khoe.
  function checkNewBadges() {
    const newlyUnlocked = [];
    BADGES.forEach(b => {
      if (!progress.badges[b.id] && b.check(progress)) {
        progress.badges[b.id] = true;
        if (b.bonus) addStars(b.bonus);
        if (b.freeze) progress.streakFreezes = (progress.streakFreezes || 0) + b.freeze;
        newlyUnlocked.push(b);
      }
    });
    if (newlyUnlocked.length) saveProgress(progress);
    return newlyUnlocked;
  }

  // So sánh cấp độ trước/sau khi cộng sao — trả về { level } nếu vừa lên cấp, hoặc null nếu chưa
  // đủ lên cấp. Dùng lifetimeStars (không phải progress.stars) vì stars có thể GIẢM khi bé mua đồ
  // — cấp độ không được phép tụt theo, phải tính trên tổng sao TỪNG kiếm được.
  function checkLevelUp(oldLifetimeStars) {
    if (typeof oldLifetimeStars !== 'number') return null;
    const oldLevel = getLevel(oldLifetimeStars);
    const newLevel = getLevel(progress.lifetimeStars);
    if (newLevel === oldLevel) return null;
    return { level: newLevel };
  }

  // ---------- CONFETTI (hiệu ứng ăn mừng, không cần thư viện ngoài) ----------
  function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:200;pointer-events:none;width:100%;height:100%;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const colors = ['#FF8A65', '#4FB0A5', '#6FA8DC', '#F5A6C6', '#FFC97A', '#7FD1B9'];
    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: 2 + Math.random() * 3,
      speedX: (Math.random() - 0.5) * 2,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    }));
    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (elapsed < 2200) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(frame);
  }

  // Gộp MỌI mốc thưởng đạt được cùng lúc sau 1 lượt học (huy hiệu mới + lên cấp + mảnh ghép tranh
  // mới) thành DUY NHẤT 1 thẻ ở giữa màn hình, thay vì xếp hàng nhiều toast nối tiếp nhau khiến bé
  // phải đợi lâu mới xem hết — bé liếc 1 phát là biết ngay vừa nhận được những gì.
  function showRewardsSummaryToast(badges, levelUp, newPieceTopic) {
    const items = [];
    badges.forEach(b => {
      items.push({ icon: b.icon, label: b.label + (b.bonus ? ' +' + b.bonus + '⭐' : '') });
    });
    if (levelUp) items.push({ icon: levelUp.level.emoji, label: 'Lên cấp: ' + levelUp.level.label });
    if (newPieceTopic) items.push({ icon: '🖼️', label: 'Mảnh ghép mới!' });
    if (!items.length) return;

    const toast = document.createElement('div');
    toast.className = 'rewards-toast';
    toast.innerHTML =
      '<div class="rewards-toast-title">🎉 Phần thưởng!</div>' +
      '<div class="rewards-toast-list">' +
      items.map(it =>
        '<span class="rewards-toast-item"><span class="rewards-toast-icon">' + it.icon + '</span>' +
        '<span class="rewards-toast-label">' + it.label + '</span></span>'
      ).join('') +
      '</div>';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 500);
  }

  // Thông báo nổi ngắn dùng chung (VD: xác thực email thành công) — tái dùng khung .badge-toast
  // nhưng đổi màu viền để phân biệt với thông báo huy hiệu.
  function showToast(message, icon) {
    const toast = document.createElement('div');
    toast.className = 'badge-toast info-toast';
    toast.innerHTML = '<span class="badge-icon">' + icon + '</span><span class="badge-label">' + message + '</span>';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  }

  // Bấm vào 1 chủ đề đang khoá: báo bé cần học xong chủ đề nào (đạt ≥80%) trước — không còn mua
  // được bằng sao nữa, phải học tuần tự.
  function showLockedTopicNotice(topic) {
    if (topic.unlocksAt === Infinity) {
      showToast('🔒 Chủ đề "' + topic.label + '" sắp ra mắt!', '🔒');
      return;
    }
    showToast('🔒 ' + topicLockReasonText(topic) + '!', '🔒');
  }

  // Hộp thoại xác nhận theo giao diện app (thay cho window.confirm() mặc định của trình duyệt,
  // trông như hộp thoại hệ điều hành). Trả về Promise<boolean> — true nếu bấm Đồng ý.
  function showConfirmDialog(message, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const overlay = document.getElementById('confirmOverlay');
      const okBtn = document.getElementById('confirmOkBtn');
      const cancelBtn = document.getElementById('confirmCancelBtn');
      document.getElementById('confirmMessage').textContent = message;
      okBtn.textContent = opts.okLabel || 'Đồng ý';
      cancelBtn.textContent = opts.cancelLabel || 'Huỷ';
      okBtn.classList.toggle('is-danger', !!opts.danger);
      overlay.hidden = false;

      function cleanup(result) {
        overlay.hidden = true;
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      }
      function onOk() { cleanup(true); }
      function onCancel() { cleanup(false); }
      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  }

  // Gọi sau khi bé hoàn thành 1 lượt học/ôn tập: mở khoá huy hiệu (nếu có) + hiệu ứng ăn mừng.
  // oldLifetimeStars phải chụp lại TRƯỚC khi addStars() chạy ở nơi gọi, vì lifetimeStars không bao
  // giờ giảm (khác progress.stars có thể bị trừ khi mua đồ) nên không thể suy ra số cũ từ số hiện tại.
  function celebrate(isPerfect, oldLifetimeStars, newPieceTopic) {
    const newBadges = checkNewBadges();
    const levelUp = checkLevelUp(oldLifetimeStars);
    if (isPerfect || newBadges.length || levelUp || newPieceTopic) launchConfetti();
    showRewardsSummaryToast(newBadges, levelUp, newPieceTopic);
    renderTotalStars(); // huy hiệu chuỗi ngày có thể vừa cộng thêm sao thưởng, cập nhật lại topbar cho khớp
  }

  // ---------- STREAK & DAILY REMINDER ----------
  function toDateStr(d) { return d.toISOString().slice(0, 10); }

  // Gọi khi bé hoàn thành xong 1 chủ đề trong ngày (finishTopic).
  function updateStreakOnComplete() {
    const todayStr = toDateStr(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDateStr(yesterday);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = toDateStr(twoDaysAgo);

    let usedFreeze = false;
    if (progress.streak.lastDate === todayStr) {
      // hôm nay đã học rồi, không đổi chuỗi
    } else if (progress.streak.lastDate === yesterdayStr) {
      progress.streak.count += 1;
      progress.streak.lastDate = todayStr;
    } else if (progress.streak.lastDate === twoDaysAgoStr && (progress.streakFreezes || 0) > 0) {
      // Lỡ đúng 1 ngày nhưng còn khiên — dùng khiên để nối chuỗi thay vì reset về 1. Khiên chỉ
      // cứu được đúng 1 ngày lỡ, lỡ từ 2 ngày trở lên thì vẫn reset như cũ.
      progress.streakFreezes -= 1;
      progress.streak.count += 1;
      progress.streak.lastDate = todayStr;
      usedFreeze = true;
    } else {
      progress.streak.count = 1;
      progress.streak.lastDate = todayStr;
    }
    progress.streak.best = Math.max(progress.streak.best || 0, progress.streak.count);
    saveProgress(progress);
    if (usedFreeze) showToast('🛡️ Bé lỡ mất 1 ngày nhưng đã dùng khiên để giữ chuỗi ' + progress.streak.count + ' ngày!', '🛡️');
    bumpDailyMission('sessions');
  }

  // ---------- NHIỆM VỤ HẰNG NGÀY ----------
  // 3 việc nhỏ, cụ thể, reset mỗi ngày — cho bé 1 checklist rõ ràng để quay lại mỗi ngày thay vì
  // chỉ có mục tiêu mơ hồ "học 5 phút". Không cần cron/backend: tự phát hiện qua ngày mới bằng
  // cách so progress.dailyMissions.date với hôm nay mỗi lần được đọc/ghi (ensureDailyMissions).
  const DAILY_MISSION_BONUS = 5;
  const DAILY_MISSIONS = [
    { id: 'session', icon: '📚', label: 'Học hoặc ôn tập 1 lượt', check: s => s.sessions >= 1 },
    { id: 'game', icon: '🎮', label: 'Chơi 1 trò chơi trong tab Trò chơi', check: s => s.games >= 1 },
    { id: 'stars5', icon: '⭐', label: 'Kiếm được 5 sao', check: s => s.starsEarned >= 5 },
  ];
  // Nhiệm vụ của lớp Chồi: thay "kiếm 5 sao" bằng "ghép 1 nhóm câu" để dẫn bé đi hết các phần của lớp.
  const DAILY_MISSIONS_CHOI = [
    { id: 'session', icon: '📚', label: 'Học hoặc ôn tập 1 lượt', check: s => s.sessions >= 1 },
    { id: 'game', icon: '🎮', label: 'Chơi 1 trò chơi (Xếp chữ, Lật thẻ hoặc Simon nói)', check: s => s.games >= 1 },
    { id: 'sentence', icon: '🧩', label: 'Ghép 1 nhóm câu ở tab Câu', check: s => (s.sentences || 0) >= 1 },
  ];
  // Nhiệm vụ của lớp Lá: nay Trò chơi VÀ Câu đều đã có nội dung nên dùng cùng dạng 3 việc như Chồi
  // (session + game + hoàn thành 1 hoạt động ở tab Câu) thay vì "kiếm 5 sao".
  const DAILY_MISSIONS_LA = [
    { id: 'session', icon: '📚', label: 'Học hoặc ôn tập 1 lượt', check: s => s.sessions >= 1 },
    { id: 'game', icon: '🎮', label: 'Chơi 1 trò chơi (Xếp chữ, Đố nhanh hoặc Sắp xếp câu)', check: s => s.games >= 1 },
    { id: 'sentence', icon: '💬', label: 'Hoàn thành 1 hoạt động ở tab Câu', check: s => (s.sentences || 0) >= 1 },
  ];
  // Danh sách nhiệm vụ của lớp bé đang xem. Thưởng chung 1 lần/ngày (dm.claimed) dù bé làm ở lớp nào.
  function getDailyMissions() {
    const c = getActiveClassId();
    return c === 'choi' ? DAILY_MISSIONS_CHOI : c === 'la' ? DAILY_MISSIONS_LA : DAILY_MISSIONS;
  }
  function blankDailyStats() { return { sessions: 0, games: 0, starsEarned: 0, sentences: 0 }; }
  function ensureDailyMissions() {
    const todayStr = toDateStr(new Date());
    if (progress.dailyMissions.date !== todayStr) {
      progress.dailyMissions = { date: todayStr, claimed: false, stats: blankDailyStats() };
    }
    if (!progress.dailyMissions.stats) progress.dailyMissions.stats = blankDailyStats();
    return progress.dailyMissions;
  }
  // LƯU Ý: không tự saveProgress() ở đây — mọi nơi gọi bumpDailyMission() đều tự lưu tiến độ
  // ngay sau đó (addStars() luôn có 1 saveProgress() theo sau ở nơi gọi nó; còn nhánh "Ghép
  // tranh" chơi tự do ở tab Trò chơi thì tự thêm saveProgress() riêng ngay sau lệnh gọi, xem
  // handleMatchClick). Nếu thêm 1 nơi gọi bumpDailyMission() mới, nhớ đảm bảo có saveProgress()
  // theo sau, không thì mốc nhiệm vụ vừa tăng sẽ mất khi tải lại.
  function bumpDailyMission(key, amount) {
    const dm = ensureDailyMissions();
    dm.stats[key] = (dm.stats[key] || 0) + (amount || 1);
    checkDailyMissionsComplete();
  }
  // Phát thưởng ngay khi đủ cả 3 nhiệm vụ trong ngày — LUÔN đánh dấu dm.claimed = true TRƯỚC khi
  // gọi addStars(), vì addStars() gọi ngược lại bumpDailyMission() (để phần thưởng cũng tính vào
  // "kiếm được 5 sao"), mà bumpDailyMission() lại gọi hàm này — đổi thứ tự 2 dòng dưới sẽ gây lặp
  // vô hạn.
  function checkDailyMissionsComplete() {
    const dm = progress.dailyMissions;
    if (dm.claimed || !getDailyMissions().every(m => m.check(dm.stats))) return;
    dm.claimed = true;
    addStars(DAILY_MISSION_BONUS);
    showToast('🎉 Bé đã hoàn thành hết nhiệm vụ hôm nay, thưởng thêm ' + DAILY_MISSION_BONUS + ' sao!', '🎉');
    launchConfetti();
  }
  // Vẽ checklist nhiệm vụ hôm nay lên trang chủ.
  function renderDailyMissions() {
    const dm = ensureDailyMissions();
    const list = document.getElementById('dailyMissionList');
    list.innerHTML = '';
    getDailyMissions().forEach(m => {
      const done = m.check(dm.stats);
      const row = document.createElement('div');
      row.className = 'daily-mission-row' + (done ? ' is-done' : '');
      row.innerHTML =
        '<span class="dm-icon">' + (done ? '✅' : m.icon) + '</span>' +
        '<span class="dm-label">' + m.label + '</span>';
      list.appendChild(row);
    });
    document.getElementById('dailyMissionClaimed').hidden = !dm.claimed;
  }

  // Hiện banner nhắc học / banner streak trên trang chủ, dựa vào ngày học gần nhất.
  function renderHomeBanners() {
    renderPlacementBanner();
    const todayStr = toDateStr(new Date());
    const studiedToday = progress.streak.lastDate === todayStr;

    const reminderBanner = document.getElementById('reminderBanner');
    reminderBanner.hidden = !(progress.streak.lastDate && !studiedToday);

    const streakBanner = document.getElementById('streakBanner');
    if (studiedToday && progress.streak.count > 1) {
      document.getElementById('streakCount').textContent = progress.streak.count;
      streakBanner.hidden = false;
    } else {
      streakBanner.hidden = true;
    }

    const freezeBadge = document.getElementById('streakFreezeBadge');
    freezeBadge.hidden = !(progress.streakFreezes > 0);
    if (progress.streakFreezes > 0) document.getElementById('streakFreezeCount').textContent = progress.streakFreezes;
  }

  // ---------- PROGRESS SCREEN ----------
  function renderProgressScreen() {
    renderClassSwitches();
    const cls = getActiveClassId();
    const doneTopicsList = TOPICS.filter(t => progress.doneTopics[t.id]);
    const doneCount = doneTopicsList.length;
    const doneWords = doneTopicsList.reduce((sum, t) => sum + t.words.length, 0);
    document.getElementById('progressStars').textContent = progress.stars;
    document.getElementById('progressStreakBest').textContent = progress.streak.best || 0;

    const level = getLevel(progress.lifetimeStars);
    document.getElementById('levelEmoji').textContent = level.emoji;
    document.getElementById('levelLabel').textContent = level.label;

    const tile2 = document.getElementById('progressTopicsDone'), tile2Label = document.getElementById('progressTile2Label');
    const tile3 = document.getElementById('progressWords'), tile3Label = document.getElementById('progressTile3Label');
    const listLabel = document.getElementById('progressListLabel');
    const list = document.getElementById('progressList');
    list.innerHTML = '';

    if (cls === 'choi') {
      // Tiến độ của Lớp Chồi: Ngữ âm 2 + Xếp chữ + Ghép câu (không lẫn với 12 chủ đề từ vựng của lớp Mầm).
      const c = progress.choi;
      tile2.textContent = choiLessonsDone() + '/' + choiLessonsTotal();
      tile2Label.textContent = '📖 Bài đã học';
      tile3.textContent = c.spellWords + c.sentencesBuilt;
      tile3Label.textContent = '🧩 Từ & câu đã luyện';
      listLabel.textContent = 'Chi tiết Lớp Chồi';
      const promo = getPromotionInfo('choi');
      const played = (map, list) => list.filter(t => map[t.id]).length;
      const gameTopics = getChoiSpellTopics();
      const spellList = gameTopics.filter(t => getSpellingPool(t, 'choi').length > 0);
      const memList = gameTopics.filter(t => getMemoryPool(t).length >= MEMORY_PAIRS);
      const sumRow = (emoji, label, n, total) => progressRowHtml(emoji, label, n >= total, '✓ ' + n + '/' + total, n + '/' + total + ' chủ đề đã chơi');
      const rowsOf = (arr, map, doneText, todoText) => arr.map(t => progressRowHtml(t.emoji, t.label, !!map[t.id], doneText, todoText)).join('');
      list.innerHTML =
        '<div class="progress-subhead">🎓 Điều kiện lên Lớp Lá' + (promo.passedDate ? ' — đã đậu ✅' : '') + '</div>' +
        promo.items.map(i => progressRowHtml(i.icon, i.label, i.have >= i.need, '✓ ' + Math.min(i.have, i.need) + '/' + i.need, i.have + '/' + i.need)).join('') +
        '<div class="progress-subhead">📚 Từ vựng Lớp Chồi</div>' + rowsOf(CHOI_TOPICS, progress.doneTopics, '✓ Đã học', 'Chưa học') +
        '<div class="progress-subhead">🔊 Ngữ âm 2</div>' + rowsOf(PHONICS2_TOPICS, progress.doneTopics, '✓ Đã học', 'Chưa học') +
        '<div class="progress-subhead">👀 Từ hay gặp</div>' + rowsOf(SIGHT_TOPICS, progress.doneTopics, '✓ Đã học', 'Chưa học') +
        '<div class="progress-subhead">📗 Truyện</div>' + rowsOf(STORY_TOPICS_CHOI, progress.doneTopics, '✓ Đã đọc', 'Chưa đọc') +
        '<div class="progress-subhead">✍️ Tập viết chữ</div>' + rowsOf(WRITE_GROUPS, c.writeGroups, '✓ Đã viết', 'Chưa viết') +
        '<div class="progress-subhead">🧩 Ghép câu</div>' + rowsOf(SENTENCE_BUILD_TOPICS, c.sentenceGroups, '✓ Đã chơi', 'Chưa chơi') +
        '<div class="progress-subhead">🎵 Bài hát</div>' + rowsOf(SONGS_CHOI.map(s => ({ id: s.id, emoji: s.emoji, label: s.titleVi })), c.songsPlayed, '✓ Đã hát', 'Chưa hát') +
        '<div class="progress-subhead">🎮 Trò chơi</div>' +
        sumRow('🔤', 'Xếp chữ', played(c.spellTopics, spellList), spellList.length) +
        sumRow('🧠', 'Lật thẻ', played(c.memoryTopics, memList), memList.length) +
        progressRowHtml('🕺', 'Simon nói', !!c.simonPlayed.simon, '✓ Đã chơi', 'Chưa chơi');
      return;
    }

    if (cls === 'la') {
      // Tiến độ của Lớp Lá: Học (doneTopics) + Trò chơi/Câu (progress.la, như Chồi).
      const c = progress.la;
      tile2.textContent = laLessonsDone() + '/' + laLessonsTotal();
      tile2Label.textContent = '📖 Bài đã học';
      tile3.textContent = c.spellWords + c.sentencesBuilt;
      tile3Label.textContent = '🧩 Từ & câu đã luyện';
      listLabel.textContent = 'Chi tiết Lớp Lá';
      const rowsOf = (arr, doneText, todoText) => arr.map(t => progressRowHtml(t.emoji, t.label, !!progress.doneTopics[t.id], doneText, todoText)).join('');
      const rowsOfLa = (arr, map, doneText, todoText) => arr.map(t => progressRowHtml(t.emoji, t.label, !!map[t.id], doneText, todoText)).join('');
      const spellList = getLaSpellTopics().filter(t => getSpellingPool(t, 'la').length > 0);
      const memList = getLaSpellTopics().filter(t => getLaMemoryPool(t).length >= MEMORY_PAIRS);
      const played = (map, list) => list.filter(t => map[t.id]).length;
      const sumRow = (emoji, label, n, total) => progressRowHtml(emoji, label, n >= total, '✓ ' + n + '/' + total, n + '/' + total + ' chủ đề đã chơi');
      list.innerHTML =
        '<div class="progress-subhead">📚 Từ vựng Lớp Lá</div>' + rowsOf(LA_TOPICS, '✓ Đã học', 'Chưa học') +
        '<div class="progress-subhead">🔤 Ngữ pháp cơ bản</div>' + rowsOf(GRAMMAR_LA_TOPICS, '✓ Đã học', 'Chưa học') +
        '<div class="progress-subhead">🔊 Ngữ âm 3</div>' + rowsOf(PHONICS3_TOPICS, '✓ Đã học', 'Chưa học') +
        '<div class="progress-subhead">📗 Truyện</div>' + rowsOf(STORY_TOPICS_LA, '✓ Đã đọc', 'Chưa đọc') +
        '<div class="progress-subhead">🗣️ Cụm từ thông dụng</div>' + rowsOf(PHRASES_LA_TOPICS, '✓ Đã học', 'Chưa học') +
        '<div class="progress-subhead">📋 Đọc hiểu văn bản</div>' + rowsOf(READING_LA_TOPICS, '✓ Đã đọc', 'Chưa đọc') +
        '<div class="progress-subhead">🎵 Bài hát</div>' + rowsOfLa(SONGS_LA.map(s => ({ id: s.id, emoji: s.emoji, label: s.titleVi })), c.songsPlayed, '✓ Đã hát', 'Chưa hát') +
        '<div class="progress-subhead">🎮 Trò chơi</div>' +
        sumRow('🔤', 'Xếp chữ dài', played(c.spellTopics, spellList), spellList.length) +
        sumRow('🧠', 'Lật thẻ nâng cao', played(c.memoryTopics, memList), memList.length) +
        progressRowHtml('🕺', 'Simon nói nâng cao', !!c.simonPlayed.simon, '✓ Đã chơi', 'Chưa chơi') +
        rowsOfLa(SENTENCE_BUILD_LA_TOPICS, c.sentenceGroups, '✓ Đã chơi', 'Chưa chơi') +
        '<div class="progress-subhead">💬 Câu</div>' +
        rowsOfLa(QA_LA_TOPICS, c.qaGroups, '✓ Đã chơi', 'Chưa chơi') +
        rowsOfLa(DIALOGUE_LA_TOPICS, c.dialogueGroups, '✓ Đã chơi', 'Chưa chơi') +
        rowsOfLa(WRITE_LA_TOPICS, c.writeSentGroups, '✓ Đã viết', 'Chưa viết') +
        rowsOfLa(PARAGRAPH_LA_TOPICS, c.paragraphGroups, '✓ Đã viết', 'Chưa viết');
      return;
    }

    if (!CLASS_CONTENT[cls].screens.home) {
      // Lớp chưa có nội dung (Lớp Lá): chưa có gì để thống kê.
      tile2.textContent = '—'; tile2Label.textContent = '📚 Bài học';
      tile3.textContent = '—'; tile3Label.textContent = '🧩 Đã luyện';
      listLabel.textContent = 'Chi tiết ' + PLACEMENT_LEVELS[cls].label;
      list.innerHTML = '<p class="account-note">' + PLACEMENT_LEVELS[cls].label + ' đang được chuẩn bị — bài học sẽ hiện ở đây khi ra mắt.</p>';
      return;
    }

    // Lớp Mầm (mặc định): 12 chủ đề từ vựng.
    tile2.textContent = doneCount + '/' + TOPICS.length;
    tile2Label.textContent = '📚 Chủ đề xong';
    tile3.textContent = doneWords;
    tile3Label.textContent = '🔤 Từ đã học';
    listLabel.textContent = 'Chi tiết chủ đề';
    TOPICS.forEach(topic => {
      const done = !!progress.doneTopics[topic.id];
      const row = document.createElement('div');
      row.className = 'progress-row' + (done ? ' is-done' : '') + topicLockClasses(topic);
      row.innerHTML =
        '<span class="pr-emoji">' + topic.emoji + '</span>' +
        '<span class="pr-label">' + topic.label + '</span>' +
        '<span class="pr-status">' + (isTopicLocked(topic) ? '🔒 ' + topicLockReasonText(topic) : (done ? '✓ Đã học' : 'Chưa học')) + '</span>';
      list.appendChild(row);
    });
  }

  // ---------- BADGES / PUZZLE COLLECTION SCREEN ----------
  let collectionMode = 'badges'; // 'badges' | 'puzzle'
  function renderBadgesScreen() {
    const badgeGrid = document.getElementById('badgeGrid');
    badgeGrid.innerHTML = '';
    let lastGroup = null;
    BADGES.forEach(b => {
      if ((b.group || null) !== lastGroup) { // tiêu đề nhóm khi chuyển sang nhóm huy hiệu khác (Lớp Chồi)
        lastGroup = b.group || null;
        if (lastGroup === 'choi') {
          const head = document.createElement('div');
          head.className = 'badge-group-label';
          head.textContent = '🌿 Huy hiệu Lớp Chồi';
          badgeGrid.appendChild(head);
        }
        if (lastGroup === 'la') {
          const head = document.createElement('div');
          head.className = 'badge-group-label';
          head.textContent = '🍃 Huy hiệu Lớp Lá';
          badgeGrid.appendChild(head);
        }
      }
      const unlocked = !!progress.badges[b.id];
      const item = document.createElement('div');
      item.className = 'badge-item' + (unlocked ? ' is-unlocked' : '');
      item.innerHTML =
        '<span class="badge-icon">' + b.icon + '</span>' +
        '<span class="badge-text">' +
          '<span class="badge-label">' + b.label + '</span><br>' +
          '<span class="badge-desc">' + b.desc + '</span>' +
        '</span>';
      badgeGrid.appendChild(item);
    });

    renderPuzzleScreen();
    renderOutfitShop();
  }

  function setCollectionMode(mode) {
    collectionMode = mode;
    document.getElementById('collectionBadgesBtn').classList.toggle('active', mode === 'badges');
    document.getElementById('collectionPuzzleBtn').classList.toggle('active', mode === 'puzzle');
    document.getElementById('collectionOutfitsBtn').classList.toggle('active', mode === 'outfits');
    document.getElementById('badgeGrid').hidden = mode !== 'badges';
    document.getElementById('puzzleWrap').hidden = mode !== 'puzzle';
    document.getElementById('outfitWrap').hidden = mode !== 'outfits';
    moveSegmentThumb(document.getElementById('collectionModeToggle'));
  }
  document.getElementById('collectionBadgesBtn').addEventListener('click', () => setCollectionMode('badges'));
  document.getElementById('collectionPuzzleBtn').addEventListener('click', () => setCollectionMode('puzzle'));
  document.getElementById('collectionOutfitsBtn').addEventListener('click', () => setCollectionMode('outfits'));

  // ---------- GHÉP HÌNH: dựng bảng tranh + khay mảnh ghép, kéo-thả bằng Pointer Events ----------
  // Mỗi chủ đề trong PUZZLE_TOPICS ứng với đúng 1 ô trên tranh (vị trí cố định theo thứ tự chủ đề).
  // Học xong chủ đề (doneTopics) = "có" mảnh ghép (nằm trong khay); progress.placedPieces đánh dấu
  // mảnh đã được bé kéo vào đúng ô trên tranh (mới thực sự hiện ra trên bảng).
  let puzzleDragState = null;
  function renderPuzzleScreen() {
    const board = document.getElementById('puzzleBoard');
    const tray = document.getElementById('puzzleTray');
    board.innerHTML = '';
    tray.innerHTML = '';
    let placedCount = 0;
    const trayPieces = [];

    PUZZLE_TOPICS.forEach((topic, i) => {
      const col = i % PUZZLE_COLS;
      const row = Math.floor(i / PUZZLE_COLS);
      const posX = PUZZLE_COLS === 1 ? 0 : (col / (PUZZLE_COLS - 1)) * 100;
      const posY = PUZZLE_ROWS === 1 ? 0 : (row / (PUZZLE_ROWS - 1)) * 100;
      const earned = !!progress.doneTopics[topic.id];
      const placed = earned && !!progress.placedPieces[topic.id];
      if (placed) placedCount++;

      const slot = document.createElement('div');
      slot.className = 'puzzle-slot' + (placed ? ' is-filled' : '');
      slot.dataset.topicId = topic.id;
      slot.style.backgroundImage = PUZZLE_BG_URL;
      slot.style.backgroundSize = PUZZLE_BG_SIZE;
      slot.style.backgroundPosition = posX + '% ' + posY + '%';
      board.appendChild(slot);

      if (earned && !placed) trayPieces.push({ topic: topic, posX: posX, posY: posY });
    });

    const trayLabel = document.getElementById('puzzleTrayLabel');
    trayLabel.hidden = trayPieces.length === 0;
    trayPieces.forEach(tp => {
      const piece = document.createElement('div');
      piece.className = 'puzzle-piece';
      piece.dataset.topicId = tp.topic.id;
      piece.title = tp.topic.label;
      piece.style.backgroundImage = PUZZLE_BG_URL;
      piece.style.backgroundSize = PUZZLE_BG_SIZE;
      piece.style.backgroundPosition = tp.posX + '% ' + tp.posY + '%';
      tray.appendChild(piece);
      initPuzzlePieceDrag(piece);
    });

    document.getElementById('puzzleCountLabel').textContent =
      'Đã ghép ' + placedCount + '/' + PUZZLE_TOPICS.length + ' mảnh tranh';
  }

  // Kéo-thả bằng Pointer Events (chạy được cả chuột lẫn cảm ứng, không cần thư viện ngoài).
  // Khi thả, chỉ cần điểm thả nằm gần đúng ô của mảnh đó (có nới lỏng biên độ cho vừa tay bé)
  // là ghép được — không cần thả chính xác tuyệt đối.
  function initPuzzlePieceDrag(piece) {
    piece.addEventListener('pointerdown', e => {
      e.preventDefault();
      const rect = piece.getBoundingClientRect();
      puzzleDragState = {
        topicId: piece.dataset.topicId,
        el: piece,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
      piece.setPointerCapture(e.pointerId);
      piece.classList.add('is-dragging');
      document.body.appendChild(piece);
      piece.style.position = 'fixed';
      piece.style.width = rect.width + 'px';
      piece.style.height = rect.height + 'px';
      piece.style.left = rect.left + 'px';
      piece.style.top = rect.top + 'px';
      piece.style.zIndex = 500;
    });
    piece.addEventListener('pointermove', e => {
      if (!puzzleDragState || puzzleDragState.el !== piece) return;
      piece.style.left = (e.clientX - puzzleDragState.offsetX) + 'px';
      piece.style.top = (e.clientY - puzzleDragState.offsetY) + 'px';
    });
    piece.addEventListener('pointerup', e => finishPuzzleDrag(piece, e.clientX, e.clientY));
    piece.addEventListener('pointercancel', () => finishPuzzleDrag(piece, null, null));
  }
  function finishPuzzleDrag(piece, x, y) {
    if (!puzzleDragState || puzzleDragState.el !== piece) return;
    const topicId = puzzleDragState.topicId;
    puzzleDragState = null;
    let placed = false;
    if (x !== null) {
      const slot = document.querySelector('.puzzle-slot[data-topic-id="' + topicId + '"]');
      if (slot) {
        const r = slot.getBoundingClientRect();
        const pad = 26;
        placed = x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
      }
    }
    if (placed) {
      progress.placedPieces[topicId] = true;
      saveProgress(progress);
    }
    piece.remove(); // piece đã bị chuyển ra document.body lúc bắt đầu kéo nên renderPuzzleScreen() không tự dọn được
    renderPuzzleScreen(); // dựng lại toàn bộ khay+bảng theo state mới nhất — đơn giản, tránh lỗi vặt DOM
    if (placed) checkPuzzleComplete();
  }
  function checkPuzzleComplete() {
    const allPlaced = PUZZLE_TOPICS.every(t => progress.placedPieces[t.id]);
    if (allPlaced) {
      launchConfetti();
      showToast('🖼️ Bé đã ghép xong bức tranh rồi, giỏi quá!', '🎉');
    }
  }

  // ---------- TỦ ĐỒ CHO CHÚ CÁO ----------
  const SLOT_LABEL = { head: '🎩 Đội đầu', body: '👕 Toàn thân' };
  // Mỗi slot (đầu/thân) chỉ mặc được ĐÚNG 1 món tại 1 thời điểm — mặc món đầu mới sẽ tự thay thế
  // món đầu đang mặc (giống hệt cách slot thân vẫn hoạt động từ trước), không cộng dồn nữa. Tối đa
  // luôn là 2 món cùng lúc (1 đầu + 1 thân) — không cần kiểm tra/giới hạn riêng vì cấu trúc dữ liệu
  // đã đảm bảo điều đó, và đúng khớp với COMBO_IMAGES (ảnh ghép sẵn cho mọi tổ hợp 1 đầu + 1 thân).
  // progress.equippedOutfits.head vẫn LÀ MẢNG (không đổi lại thành string) để không phải sửa lại
  // renderMascotAccessory/renderOutfitShop/normalizeProgress — chỉ khác là mảng giờ luôn dài 0 hoặc 1.

  // Cập nhật icon phụ kiện đang "mặc" — badge nhỏ đè lên mascot góc trên, và ảnh lớn ở đầu màn
  // Trang phục.
  //
  // Ảnh lớn có 3 chế độ, tuỳ đang mặc gì:
  //  - ĐÚNG 1 món trong TOÀN BỘ (1 món đầu và không có món thân, hoặc ngược lại): ảnh thật
  //    "outfit.img" (chú cáo đã mặc SẴN món đó) — nhìn như mặc thật.
  //  - ĐÚNG 1 món đầu + 1 món thân cùng lúc VÀ có sẵn ảnh ghép (COMBO_IMAGES): dùng ảnh ghép riêng
  //    đó — cũng là ảnh thật do người dùng cung cấp, KHÔNG phải 2 ảnh solo chồng lên nhau.
  //  - 0 món: ảnh nền mascot-fox.png, không badge.
  //  - Trường hợp còn lại (về lý thuyết không nên xảy ra nữa vì mỗi slot chỉ 1 món, nhưng vẫn giữ
  //    làm lưới an toàn — VD lỡ thiếu ảnh combo cho 1 cặp nào đó): quay lại ảnh nền + đè badge
  //    emoji (1 cho đầu, 1 cho thân).
  // Gọi lại mỗi khi equippedOutfits đổi hoặc lúc khởi động app.
  function renderMascotAccessory() {
    const headOutfits = progress.equippedOutfits.head.map(id => OUTFITS.find(o => o.id === id)).filter(Boolean);
    const bodyOutfit = OUTFITS.find(o => o.id === progress.equippedOutfits.body);

    const el = document.getElementById('mascotAccessory');
    if (el) {
      if (headOutfits.length) { el.textContent = headOutfits[0].emoji; el.hidden = false; }
      else { el.hidden = true; }
    }

    const shopImg = document.getElementById('shopMascotImg');
    const shopHeadBadges = document.getElementById('shopMascotHeadBadges');
    const shopBodyEl = document.getElementById('shopMascotAccessoryBody');
    if (!shopImg) return;

    const totalCount = headOutfits.length + (bodyOutfit ? 1 : 0);
    const soloOutfit = totalCount === 1 ? (headOutfits[0] || bodyOutfit) : null;
    const comboImg = (headOutfits.length === 1 && bodyOutfit) ? COMBO_IMAGES[headOutfits[0].id + '_' + bodyOutfit.id] : null;

    if (soloOutfit) {
      shopImg.src = soloOutfit.img;
      shopHeadBadges.innerHTML = '';
      shopBodyEl.hidden = true;
    } else if (comboImg) {
      shopImg.src = comboImg;
      shopHeadBadges.innerHTML = '';
      shopBodyEl.hidden = true;
    } else {
      shopImg.src = 'assets/mascot-fox.png';
      shopHeadBadges.innerHTML = headOutfits.map(o => '<span class="head-badge">' + o.emoji + '</span>').join('');
      if (bodyOutfit) { shopBodyEl.textContent = bodyOutfit.emoji; shopBodyEl.hidden = false; }
      else { shopBodyEl.hidden = true; }
    }
  }
  renderMascotAccessory();

  function renderOutfitShop() {
    const grid = document.getElementById('outfitGrid');
    grid.innerHTML = '';
    let ownedCount = 0;
    const adminUnlocked = isAdminEmail();
    OUTFITS.forEach(outfit => {
      const owned = !!progress.purchasedOutfits[outfit.id] || adminUnlocked;
      const buyable = !owned && progress.stars >= outfit.unlocksAt;
      const equipped = outfit.slot === 'head'
        ? progress.equippedOutfits.head.indexOf(outfit.id) !== -1
        : progress.equippedOutfits.body === outfit.id;
      if (owned) ownedCount++;
      const card = document.createElement('button');
      card.className = 'outfit-card' + (owned ? ' is-owned' : '') + (equipped ? ' is-equipped' : '') + (buyable ? ' is-buyable' : '');
      const countText = owned ? (equipped ? 'Bấm để cởi ra' : 'Bấm để mặc vào') :
        buyable ? 'Mua ngay · ' + outfit.unlocksAt + '⭐ (đang có ' + progress.stars + ')' :
        'Cần thêm ' + (outfit.unlocksAt - progress.stars) + ' sao';
      card.innerHTML =
        '<span class="slot-tag">' + SLOT_LABEL[outfit.slot] + '</span>' +
        (equipped ? '<span class="done-badge">✓ Đang mặc</span>' : buyable ? '<span class="buy-badge">🛒 Mua</span>' : '') +
        '<span class="emoji">' + outfit.emoji + '</span>' +
        '<span class="label">' + outfit.label + '</span>' +
        '<span class="count">' + countText + '</span>';
      card.addEventListener('click', () => handleOutfitClick(outfit));
      grid.appendChild(card);
    });
    document.getElementById('outfitCountLabel').textContent = 'Đã mua ' + ownedCount + '/' + OUTFITS.length + ' trang phục';
  }

  // Chưa mua: đủ mốc sao chỉ mở ra cơ hội mua — bấm vào sẽ hỏi có muốn dùng sao (trừ thẳng vào
  // progress.stars) mua hẳn hay không, không tự động cấp. Đã mua rồi: bấm chỉ để mặc/cởi, không
  // tiêu tốn hay ảnh hưởng gì tới sao.
  async function handleOutfitClick(outfit) {
    const owned = !!progress.purchasedOutfits[outfit.id] || isAdminEmail();
    if (!owned) {
      const cost = outfit.unlocksAt;
      if (progress.stars < cost) {
        showToast('🔒 Cần thêm ' + (cost - progress.stars) + ' sao để mua "' + outfit.label + '"!', '🔒');
        return;
      }
      const ok = await showConfirmDialog(
        'Dùng ' + cost + ' sao để mua trang phục "' + outfit.label + '"? (còn lại ' + (progress.stars - cost) + ' sao sau khi mua)',
        { okLabel: 'Mua ngay' }
      );
      if (!ok) return;
      progress.stars -= cost;
      progress.purchasedOutfits[outfit.id] = true;
      saveProgress(progress);
      showToast('🎉 Đã mua "' + outfit.label + '"!', '🎉');
      launchConfetti();
      renderOutfitShop();
      renderTotalStars();
      return;
    }
    if (outfit.slot === 'head') {
      const idx = progress.equippedOutfits.head.indexOf(outfit.id);
      // Bấm lại đúng món đang mặc -> cởi ra. Bấm món khác -> THAY THẾ hẳn món đầu đang mặc (nếu
      // có) bằng món mới, không cộng dồn — giống hệt cách slot thân đã hoạt động từ trước.
      progress.equippedOutfits.head = idx !== -1 ? [] : [outfit.id];
    } else {
      progress.equippedOutfits.body = progress.equippedOutfits.body === outfit.id ? null : outfit.id;
    }
    saveProgress(progress);
    renderMascotAccessory();
    renderOutfitShop();
  }

  document.getElementById('resetProgressBtn').addEventListener('click', () => {
    showConfirmDialog('Xoá toàn bộ số sao, chuỗi ngày học và các chủ đề đã học của bé? Không thể hoàn tác.', { danger: true, okLabel: 'Xoá hết' })
      .then(ok => {
        if (!ok) return;
        progress = blankProgress();
        saveProgress(progress);
        renderProgressScreen();
        renderTotalStars();
        renderMascotAccessory();
        renderOutfitShop();
      });
  });

  // ---------- EMAIL VERIFICATION (mã OTP gửi qua Google Apps Script) ----------
  // Xác thực email là BẮT BUỘC trước khi vào học (xem enforceGate). Tiến trình học vẫn lưu
  // chính ở localStorage của thiết bị (hoạt động offline bình thường), nhưng mỗi khi xác thực
  // thành công app sẽ đồng bộ 2 chiều với Google Sheet theo đúng email đó (xem fetchCloudDataAndProceed
  // + syncProgressToCloud) — nhờ vậy đăng nhập cùng email ở thiết bị khác sẽ khôi phục lại đúng
  // hồ sơ + tiến độ đã học, và chỉ 1 thiết bị được coi là "đang hoạt động" tại 1 thời điểm
  // (xem checkDeviceSession) để tránh 2 thiết bị ghi đè tiến độ lẫn nhau.
  const DEVICE_ID_KEY = '5phut_device_id_v1';
  function getDeviceId() {
    let id = null;
    try { id = localStorage.getItem(DEVICE_ID_KEY); } catch (e) {}
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(DEVICE_ID_KEY, id); } catch (e) {}
    }
    return id;
  }
  const deviceId = getDeviceId();

  const VERIFIED_EMAIL_KEY = '5phut_verified_email_v1';
  let verifiedEmail = null;
  let pendingVerifyEmail = null;
  let resendCooldownTimer = null;
  let profileResyncedForSession = false; // xem syncProgressToCloud — tự gửi lại hồ sơ 1 lần/phiên để "chữa lành" nếu lần lưu hồ sơ gốc từng lỗi ngầm

  // Email test/admin: xác thực đúng 1 trong các email này thì toàn bộ trang phục coi như "đã mua"
  // (chỉ để bấm thử mặc, KHÔNG đụng gì tới progress.stars/purchasedOutfits thật — tắt xác thực khỏi
  // email này là mất quyền ngay, không lưu lại gì). Chỉ ảnh hưởng trang phục, KHÔNG mở khoá chủ đề
  // Học/Trò chơi/Câu — 2 cơ chế đó vẫn hoạt động bình thường cho mọi tài khoản. Thêm/bớt email vào
  // đây khi cần, không cần đụng gì tới Apps Script/Google Sheet.
  const ADMIN_EMAILS = [];
  function isAdminEmail() {
    return !!verifiedEmail && ADMIN_EMAILS.indexOf(verifiedEmail.toLowerCase().trim()) !== -1;
  }

  try { verifiedEmail = localStorage.getItem(VERIFIED_EMAIL_KEY); } catch (e) {}

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  }

  function maskEmail(email) {
    const parts = String(email || '').split('@');
    if (parts.length !== 2) return email || '';
    const user = parts[0], domain = parts[1];
    const maskedUser = user.length <= 2 ? user[0] + '*' : user.slice(0, 2) + '***';
    return maskedUser + '@' + domain;
  }

  function mapBackendError(code) {
    switch (code) {
      case 'invalid_email': return 'Email không hợp lệ.';
      case 'too_soon': return 'Vui lòng đợi một chút rồi thử gửi lại mã.';
      case 'daily_limit': return 'Hệ thống tạm hết lượt gửi hôm nay, vui lòng thử lại vào ngày mai.';
      case 'expired_or_missing': return 'Mã đã hết hạn, vui lòng bấm gửi mã mới.';
      case 'wrong_code': return 'Mã xác thực không đúng.';
      case 'feedback_limit': return 'Hôm nay ba mẹ đã gửi khá nhiều ý kiến rồi, mai gửi tiếp giúp mình nhé!';
      case 'message_too_short': return 'Ba mẹ nhắn thêm vài chữ giúp mình nhé.';
      default: return 'Có lỗi xảy ra, vui lòng thử lại.';
    }
  }

  function backendConfigured() {
    return typeof SHEETS_CONFIG !== 'undefined' && SHEETS_CONFIG.webAppUrl
      && SHEETS_CONFIG.webAppUrl.indexOf('REPLACE_ME') !== 0;
  }

  function showEmailEntryError(msg) {
    const el = document.getElementById('emailEntryError');
    el.textContent = msg;
    el.hidden = !msg;
  }

  function showEmailCodeError(msg) {
    const el = document.getElementById('emailCodeError');
    el.textContent = msg;
    el.hidden = !msg;
  }

  function startResendCooldown(seconds) {
    const hint = document.getElementById('emailResendHint');
    let remaining = seconds;
    if (resendCooldownTimer) clearInterval(resendCooldownTimer);
    const tick = () => {
      if (remaining <= 0) {
        clearInterval(resendCooldownTimer);
        resendCooldownTimer = null;
        hint.textContent = '';
        return;
      }
      hint.textContent = 'Gửi lại mã sau ' + remaining + 's';
      remaining--;
    };
    tick();
    resendCooldownTimer = setInterval(tick, 1000);
  }

  // Modal chặn thao tác (không cho bấm sang tab/màn khác) trong lúc chờ gửi mã, xác thực mã hoặc
  // khôi phục dữ liệu từ cloud — các bước này chỉ mất 1-2 giây nhưng nếu không có gì báo hiệu, phụ
  // huynh dễ tưởng app đứng rồi bấm lung tung sang chỗ khác giữa chừng.
  function showLoading(msg) {
    document.getElementById('loadingMessage').textContent = msg || 'Đang xử lý...';
    document.getElementById('loadingOverlay').hidden = false;
  }
  function hideLoading() {
    document.getElementById('loadingOverlay').hidden = true;
  }

  function sendEmailCode(email) {
    showEmailEntryError('');
    if (!backendConfigured()) {
      showEmailEntryError('Tính năng đang được cấu hình, vui lòng quay lại sau.');
      return;
    }
    showLoading('Đang gửi mã xác thực...');
    const url = SHEETS_CONFIG.webAppUrl + '?action=sendCode&email=' + encodeURIComponent(email);
    fetch(url).then(r => r.json()).then(data => {
      hideLoading();
      if (!data.ok) { showEmailEntryError(mapBackendError(data.error)); return; }
      pendingVerifyEmail = email;
      document.getElementById('emailEntryForm').hidden = true;
      document.getElementById('emailCodeForm').hidden = false;
      document.getElementById('emailCodeTarget').textContent = maskEmail(email);
      document.getElementById('codeInput').value = '';
      document.getElementById('codeInput').focus();
      startResendCooldown(60);
    }).catch(() => { hideLoading(); showEmailEntryError('Không gửi được mã, vui lòng kiểm tra mạng và thử lại.'); });
  }

  function confirmEmailCode(code) {
    showEmailCodeError('');
    showLoading('Đang xác thực mã...');
    const url = SHEETS_CONFIG.webAppUrl + '?action=verifyCode&email=' + encodeURIComponent(pendingVerifyEmail) + '&code=' + encodeURIComponent(code);
    fetch(url).then(r => r.json()).then(data => {
      if (!data.ok) { hideLoading(); showEmailCodeError(mapBackendError(data.error)); return; }
      verifiedEmail = pendingVerifyEmail;
      profileResyncedForSession = false;
      try { localStorage.setItem(VERIFIED_EMAIL_KEY, verifiedEmail); } catch (e) {}
      showToast('Xác thực email thành công!', '✅');
      showLoading('Đang khôi phục hồ sơ...');
      fetchCloudDataAndProceed(); // tự tắt loading (hideLoading) khi xong, xem bên dưới
    }).catch(() => { hideLoading(); showEmailCodeError('Có lỗi xảy ra, vui lòng thử lại.'); });
  }

  // Xoá sạch hồ sơ + tiến độ đang lưu trên MÁY này — KHÔNG đụng gì tới dữ liệu email vừa rời đi
  // trên cloud (dữ liệu đó vẫn an toàn, tự khôi phục đủ khi xác thực lại đúng email đó). Gọi khi
  // đăng xuất hoặc khi xác thực 1 email mới mà cloud báo chưa từng có dữ liệu, để tránh hồ sơ/tiến
  // độ của bé dùng trước đó trên máy này bị lẫn/đồng bộ nhầm sang tài khoản mới.
  function resetLocalChildData() {
    profile = null;
    try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
    try { localStorage.removeItem('5phut_active_class_v1'); } catch (e) {}
    progress = blankProgress();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) {}
    renderTotalStars();
    renderMascotAccessory();
  }

  // Sau khi xác thực email trên 1 thiết bị (thiết bị mới, hoặc xác thực lại để giành quyền
  // hoạt động), hỏi Google Sheet xem email này đã có hồ sơ + tiến độ lưu sẵn chưa. Có thì tự
  // động khôi phục để dùng lại y như thiết bị cũ; đồng thời lệnh gọi này khiến thiết bị hiện tại
  // trở thành thiết bị "đang hoạt động" của email đó (xem handleGetUserData ở Apps Script).
  function fetchCloudDataAndProceed() {
    if (!backendConfigured()) { hideLoading(); if (enforceGate()) bootAfterGate(); return; }
    const url = SHEETS_CONFIG.webAppUrl + '?action=getUserData&email=' + encodeURIComponent(verifiedEmail) + '&deviceId=' + encodeURIComponent(deviceId);
    fetch(url).then(r => r.json()).then(data => {
      if (data.ok && data.found) {
        if (data.profile) { profile = data.profile; saveProfileLocal(profile); }
        if (data.progress) { progress = normalizeProgress(data.progress); saveProgress(progress); renderTotalStars(); }
        showToast('Đã khôi phục hồ sơ & tiến độ học trước đó!', '☁️');
      } else if (data.ok && !data.found) {
        // Email mới, cloud xác nhận chưa từng có dữ liệu: đảm bảo máy này đang sạch (phòng khi
        // trước đó vừa dùng cho 1 bé/email khác) để bé mới bắt đầu từ đầu, không bị lẫn dữ liệu.
        resetLocalChildData();
      }
      hideLoading();
      if (enforceGate()) bootAfterGate();
    }).catch(() => { hideLoading(); if (enforceGate()) bootAfterGate(); });
  }

  // Đẩy tiến độ mới nhất lên Google Sheet (chỉ khi đã xác thực email — chưa xác thực thì tiến độ
  // vẫn hoạt động bình thường, chỉ là không đồng bộ được sang thiết bị khác).
  function syncProgressToCloud(p) {
    if (!backendConfigured() || !verifiedEmail) return;
    const url = SHEETS_CONFIG.webAppUrl + '?action=saveProgress'
      + '&email=' + encodeURIComponent(verifiedEmail)
      + '&deviceId=' + encodeURIComponent(deviceId)
      + '&progress=' + encodeURIComponent(JSON.stringify(p));
    fetch(url).catch(() => {});

    // "Chữa lành" hồ sơ trên cloud: logProfileToSheet vốn gửi ngầm (fire-and-forget, không có báo
    // lỗi/thử lại) đúng 1 lần lúc tạo hồ sơ — nếu lần đó mạng chập chờn thì hồ sơ bị thiếu trên
    // Sheet vĩnh viễn dù tiến độ vẫn đồng bộ bình thường (khiến lần xác thực sau ở thiết bị khác bị
    // bắt tạo lại hồ sơ dù email đã có dữ liệu). Gửi lại hồ sơ tối đa 1 lần/phiên xác thực để tự vá.
    if (profile && !profileResyncedForSession) {
      profileResyncedForSession = true;
      logProfileToSheet(profile);
    }
  }

  // Kiểm tra âm thầm mỗi lần mở app (thiết bị đã đăng nhập từ trước): thiết bị này có còn là
  // thiết bị "đang hoạt động" của email đó không, hay đã bị 1 thiết bị khác xác thực đè lên.
  // Mất mạng thì bỏ qua hẳn, không chặn bé học offline.
  function checkDeviceSession() {
    if (!backendConfigured() || !verifiedEmail) return;
    const url = SHEETS_CONFIG.webAppUrl + '?action=checkSession&email=' + encodeURIComponent(verifiedEmail) + '&deviceId=' + encodeURIComponent(deviceId);
    fetch(url).then(r => r.json()).then(data => {
      if (data.ok && data.active === false) {
        verifiedEmail = null;
        try { localStorage.removeItem(VERIFIED_EMAIL_KEY); } catch (e) {}
        showToast('Tài khoản đang được đăng nhập ở thiết bị khác. Vui lòng đăng xuất ở thiết bị đó hoặc xác thực lại tại đây để tiếp tục.', '⚠️');
        enforceGate();
      }
    }).catch(() => {});
  }

  function signOutEmail() {
    verifiedEmail = null;
    try { localStorage.removeItem(VERIFIED_EMAIL_KEY); } catch (e) {}
    resetLocalChildData();
    resetEmailForms();
    enforceGate();
  }

  function resetEmailForms() {
    pendingVerifyEmail = null;
    if (resendCooldownTimer) { clearInterval(resendCooldownTimer); resendCooldownTimer = null; }
    document.getElementById('emailEntryForm').hidden = false;
    document.getElementById('emailCodeForm').hidden = true;
    document.getElementById('emailInput').value = '';
    showEmailEntryError('');
    showEmailCodeError('');
  }

  function renderAccountScreen() {
    const loggedOut = document.getElementById('accountLoggedOut');
    const loggedIn = document.getElementById('accountLoggedIn');
    const accountBtn = document.getElementById('accountBtn');

    accountBtn.textContent = profile ? profile.avatar : '👤';

    if (!verifiedEmail) {
      loggedOut.hidden = false;
      loggedIn.hidden = true;
      accountBtn.classList.remove('is-logged-in');
      return;
    }

    loggedOut.hidden = true;
    loggedIn.hidden = false;
    accountBtn.classList.add('is-logged-in');
    document.getElementById('accountAvatarDisplay').textContent = profile ? profile.avatar : '✅';
    document.getElementById('accountChildName').textContent = profile ? profile.name : '—';
    document.getElementById('accountChildAge').textContent = profile ? profile.age + ' tuổi' : '—';
    document.getElementById('accountEmailDisplay').textContent = maskEmail(verifiedEmail);
    document.getElementById('accountPhoneDisplay').textContent = profile ? profile.parentPhone : '—';
    const accLv = progress.placement ? PLACEMENT_LEVELS[progress.placement.level] : null;
    document.getElementById('accountLevelDisplay').textContent = accLv ? accLv.emoji + ' ' + accLv.label : 'Chưa kiểm tra';
  }

  document.getElementById('accountBtn').addEventListener('click', () => {
    if (!enforceGate()) return;
    showScreen('account');
  });
  document.getElementById('backFromAccount').addEventListener('click', () => { if (enforceGate()) goHome(); });

  document.getElementById('donateBtn').addEventListener('click', () => showScreen('donate'));
  document.getElementById('backFromDonate').addEventListener('click', () => { if (enforceGate()) goHome(); });

  document.getElementById('settingsBtn').addEventListener('click', () => showScreen('settings'));
  document.getElementById('backFromSettings').addEventListener('click', () => { if (enforceGate()) goHome(); });

  // ---------- BÀI KIỂM TRA TRÌNH ĐỘ (xếp lớp Mầm / Chồi / Lá) ----------
  // Đề sinh ngẫu nhiên trong data/placement.js. Kết quả lưu ở progress.placement
  // ({ level, t1, t2, date, manual }) nên tự đồng bộ cloud theo tiến độ, không cần đổi backend.
  // Không cộng sao, không ghi vào wordStats (không ảnh hưởng ôn tập ngắt quãng) và không tính
  // nhiệm vụ hằng ngày — đây chỉ là bài đo, bé làm dở rồi thoát thì không lưu gì cả.
  // Hiện tại lớp chỉ hiển thị + gợi ý; nội dung theo lớp sẽ nối vào sau qua getChildLevelId().
  let placementState = null; // { tier, index, questions, scores: [n, n|null], locked, used }

  function getChildLevelId() {
    if (progress.placement) return progress.placement.level;
    const age = profile ? profile.age : 0;
    return age >= 7 ? 'la' : age >= 5 ? 'choi' : 'mam'; // chưa kiểm tra thì tạm đoán theo tuổi
  }

  function renderPlacementBanner() {
    const lv = progress.placement ? PLACEMENT_LEVELS[progress.placement.level] : null;
    document.getElementById('placementBannerEmoji').textContent = lv ? lv.emoji : '🧪';
    document.getElementById('placementBannerEyebrow').textContent = lv ? 'Lớp của bé' : 'Kiểm tra nhỏ · 3 phút';
    document.getElementById('placementBannerTitle').textContent = lv ? lv.label : 'Xem bé hợp lớp nào nhé!';
  }

  function showPlacementPanel(name) {
    document.getElementById('placementIntro').hidden = name !== 'intro';
    document.getElementById('placementQuestion').hidden = name !== 'question';
    document.getElementById('placementResult').hidden = name !== 'result';
    document.getElementById('placementPromo').hidden = name !== 'promo';
    document.getElementById('placementProgressTrack').hidden = name !== 'question';
  }

  function openPlacementIntro(firstRun) {
    const name = profile ? profile.name : 'bé';
    document.getElementById('placementIntroTitle').textContent = firstRun ? 'Xếp lớp cho ' + name : 'Kiểm tra nhỏ cho bé';
    document.getElementById('placementIntroText').textContent = firstRun
      ? 'Hồ sơ của ' + name + ' đã sẵn sàng! Giờ bé làm bài kiểm tra nhỏ (5–10 câu, không mất sao) để mình xếp lớp cho hợp. Ba mẹ ngồi cùng bé nhé — câu nào bé chưa biết cứ chọn đại.'
      : 'Chỉ khoảng 5–10 câu, không tính điểm và không mất sao. Ba mẹ ngồi cùng bé nhé — câu nào bé chưa biết cứ chọn đại, mình chỉ cần biết bé đang ở đâu để xếp lớp cho hợp.';
    showPlacementPanel('intro');
    showScreen('placement');
  }

  function openPlacement() {
    if (!enforceGate()) return;
    if (progress.placement) { showPlacementResult(); showScreen('placement'); }
    else openPlacementIntro(false);
  }

  // Rời khỏi bài kiểm tra (Để sau / Bắt đầu học / nút quay lại). Dùng bootAfterGate thay vì goHome:
  // lần đầu (ngay sau khi tạo hồ sơ) nó mới chạy phần khởi động 1 lần — hướng dẫn sử dụng, bài ôn
  // tập tuần; các lần sau nó chỉ đơn giản về trang chủ.
  function leavePlacement() {
    placementState = null;
    bootAfterGate();
  }

  function startPlacement() {
    placementState = { tier: 0, index: 0, questions: [], scores: [0, null], locked: false, used: new Set() };
    placementState.questions = buildPlacementTier(0, TOPICS, placementState.used);
    showPlacementPanel('question');
    showScreen('placement');
    renderPlacementQuestion();
  }

  function renderPlacementQuestion() {
    const st = placementState;
    const q = st.questions[st.index];
    st.locked = false;
    const total = st.questions.length;
    document.getElementById('placementPart').textContent = st.promo
      ? 'Bài kiểm tra lên lớp · Câu ' + (st.index + 1) + '/' + total
      : 'Phần ' + (st.tier + 1) + '/' + PLACEMENT_TIER_COUNT + ' · Câu ' + (st.index + 1) + '/' + total;
    document.getElementById('placementProgressFill').style.width = (st.index / total) * 100 + '%';
    document.getElementById('placementPrompt').textContent = q.prompt;

    const visual = document.getElementById('placementVisual');
    visual.innerHTML = '';
    if (q.visual.kind !== 'none') {
      const el = document.createElement('div');
      if (q.visual.kind === 'emoji') { el.className = 'placement-emoji'; el.textContent = q.visual.value; }
      else if (q.visual.kind === 'word') { el.className = 'placement-word'; el.textContent = q.visual.value; }
      else {
        el.className = 'fillblank-sentence';
        el.innerHTML = q.visual.value.replace('____', '<span class="blank">____</span>');
      }
      visual.appendChild(el);
    }

    const listenBtn = document.getElementById('placementListenBtn');
    listenBtn.hidden = !q.speak;
    if (q.speak) setTimeout(() => { if (placementState === st && st.questions[st.index] === q) speak(q.speak); }, 250);

    const wrap = document.getElementById('placementOptions');
    wrap.className = 'quiz-options placement-options' + (q.optionKind === 'long' ? ' is-long' : '');
    wrap.innerHTML = '';
    q.options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'quiz-opt' + (q.optionKind === 'emoji' ? '' : q.optionKind === 'long' ? ' text-opt long-opt'
        : (q.skill === 'letter' || q.skill === 'phonics') ? ' text-opt letter-opt' : ' text-opt');
      b.textContent = opt.label;
      b.addEventListener('click', () => answerPlacement(b, opt.correct));
      wrap.appendChild(b);
    });
  }

  function answerPlacement(btn, isCorrect) {
    const st = placementState;
    if (!st || st.locked) return;
    st.locked = true; // chỉ nhận 1 lần bấm/câu — bấm liên tục không được tính nhiều lần
    btn.classList.add('is-picked'); // không báo đúng/sai: đây là bài đo, không phải bài học
    document.querySelectorAll('#placementOptions .quiz-opt').forEach(o => { o.disabled = true; });
    if (isCorrect) st.scores[st.tier]++;
    setTimeout(() => { if (placementState === st) advancePlacement(); }, 500);
  }

  function advancePlacement() {
    const st = placementState;
    st.index++;
    if (st.index < st.questions.length) { renderPlacementQuestion(); return; }
    if (st.promo) { finishPromotion(); return; } // bài kiểm tra lên lớp chỉ có 1 phần
    // Hết 1 phần: qua cửa thì sang phần 2, không thì dừng luôn (bé nhỏ khỏi làm câu quá khó).
    if (st.tier === 0 && st.scores[0] >= PLACEMENT_PASS) {
      st.tier = 1; st.index = 0; st.scores[1] = 0;
      st.questions = buildPlacementTier(1, TOPICS, st.used);
      renderPlacementQuestion();
      return;
    }
    finishPlacement();
  }

  function finishPlacement() {
    const st = placementState;
    progress.placement = {
      level: placementLevelFromScores(st.scores),
      t1: st.scores[0],
      t2: st.scores[1],
      date: toDateStr(new Date()),
      manual: false,
    };
    placementState = null;
    saveProgress(progress);
    setActiveClass(progress.placement.level); // làm xong bài kiểm tra là vào luôn lớp được xếp
    showPlacementResult();
  }

  function showPlacementResult() {
    const pl = progress.placement;
    const lv = PLACEMENT_LEVELS[pl.level];
    document.getElementById('placementResultEmoji').textContent = lv.emoji;
    document.getElementById('placementResultTitle').textContent =
      (profile ? profile.name + ' hợp với ' : 'Bé hợp với ') + lv.label + '!';
    document.getElementById('placementResultMsg').textContent =
      pl.manual ? 'Ba mẹ đã chọn ' + lv.label + ' cho bé. ' + lv.message : lv.message;

    const rows = [];
    if (pl.t1 !== null && pl.t1 !== undefined) {
      rows.push('<div class="account-detail-row"><span class="account-detail-label">🔤 Chữ cái & đọc từ</span><span class="account-detail-value">' + pl.t1 + '/' + PLACEMENT_QUESTIONS_PER_TIER + '</span></div>');
    }
    if (pl.t2 !== null && pl.t2 !== undefined) {
      rows.push('<div class="account-detail-row"><span class="account-detail-label">📖 Đánh vần & đọc câu</span><span class="account-detail-value">' + pl.t2 + '/' + PLACEMENT_QUESTIONS_PER_TIER + '</span></div>');
    }
    rows.push('<div class="account-detail-row"><span class="account-detail-label">📅 Ngày kiểm tra</span><span class="account-detail-value">' + pl.date + '</span></div>');
    document.getElementById('placementResultDetail').innerHTML = rows.join('');

    const picker = document.getElementById('placementPicker');
    picker.hidden = true;
    picker.innerHTML = '';
    PLACEMENT_LEVEL_ORDER.forEach(id => {
      const l = PLACEMENT_LEVELS[id];
      const b = document.createElement('button');
      b.className = 'placement-level-btn' + (id === pl.level ? ' is-current' : '');
      b.innerHTML = '<span class="lv-emoji">' + l.emoji + '</span><span>' + l.label + '<small>Thường hợp bé ' + l.ageText + '</small></span>';
      b.addEventListener('click', () => {
        // manual = lớp ba mẹ chọn khác với lớp bài kiểm tra đề xuất (chọn lại đúng lớp đề xuất thì bỏ cờ manual).
        progress.placement = Object.assign({}, progress.placement, { level: id, manual: pl.t1 !== null && pl.t1 !== undefined && id !== placementLevelFromScores([pl.t1, pl.t2]) });
        saveProgress(progress);
        setActiveClass(id); // ba mẹ chọn lớp nào thì vào lớp đó
        showPlacementResult();
      });
      picker.appendChild(b);
    });
    showPlacementPanel('result');
  }

  document.getElementById('placementBanner').addEventListener('click', openPlacement);
  document.getElementById('openPlacementBtn').addEventListener('click', openPlacement);
  document.getElementById('placementStartBtn').addEventListener('click', startPlacement);
  document.getElementById('placementRetakeBtn').addEventListener('click', startPlacement);
  document.getElementById('placementLaterBtn').addEventListener('click', leavePlacement);
  document.getElementById('placementGoHomeBtn').addEventListener('click', leavePlacement);
  document.getElementById('backFromPlacement').addEventListener('click', leavePlacement);
  document.getElementById('placementPickBtn').addEventListener('click', () => {
    const picker = document.getElementById('placementPicker');
    picker.hidden = !picker.hidden;
  });
  document.getElementById('placementListenBtn').addEventListener('click', () => {
    if (placementState) speak(placementState.questions[placementState.index].speak);
  });

  // ---------- CHỌN LỚP (Mầm / Chồi / Lá) ----------
  // 3 ô ở đầu các màn Học, Trò chơi, Câu. Mỗi lớp có nội dung RIÊNG (xem data/classes.js): lớp đã
  // ready thì hiện nội dung, chưa ready thì hiện thẻ "đang được chuẩn bị". Sao, chuỗi ngày, huy
  // hiệu, bộ sưu tập, tiến độ vẫn là của chung bé (không tách theo lớp).
  // Lớp đang xem lưu ở localStorage của máy (không đồng bộ cloud); chưa chọn lần nào thì là lớp
  // bài kiểm tra xếp cho bé, chưa làm bài kiểm tra thì là lớp Mầm (lớp duy nhất hiện đã có nội dung —
  // KHÔNG đoán theo tuổi, để bé đang dùng app không bị đẩy sang lớp còn trống).
  const CLASS_SCREENS = [
    { key: 'home', soon: 'classSoonHome' },
    { key: 'games', soon: 'classSoonGames' },
    { key: 'sentences', soon: 'classSoonSentences' },
  ];

  function getActiveClassId() {
    let saved = null;
    try { saved = localStorage.getItem('5phut_active_class_v1'); } catch (e) {}
    if (saved && CLASS_CONTENT[saved]) return saved;
    return progress.placement ? progress.placement.level : 'mam';
  }

  function setActiveClass(id) {
    if (!CLASS_CONTENT[id]) return;
    try { localStorage.setItem('5phut_active_class_v1', id); } catch (e) {}
    applyClassScope();
    if (screens.progress.classList.contains('active')) renderProgressScreen();
    renderDailyMissions();
    renderReviewButtons();
  }

  function renderClassSwitches() {
    const activeId = getActiveClassId();
    const ownId = progress.placement ? progress.placement.level : null;
    document.querySelectorAll('[data-class-switch]').forEach(box => {
      box.innerHTML = '';
      PLACEMENT_LEVEL_ORDER.forEach(id => {
        const lv = PLACEMENT_LEVELS[id];
        const b = document.createElement('button');
        b.className = 'class-box' + (id === activeId ? ' is-active' : '');
        b.setAttribute('aria-pressed', id === activeId ? 'true' : 'false');
        b.innerHTML = (id === ownId ? '<span class="cb-own">Lớp của bé</span>' : '')
          + '<span class="cb-emoji">' + lv.emoji + '</span>'
          + '<span>' + lv.label + '</span><small>' + lv.ageText + '</small>';
        b.addEventListener('click', () => setActiveClass(id));
        box.appendChild(b);
      });
    });
  }

  function fillClassSoon(el, classId, screenKey) {
    const lv = PLACEMENT_LEVELS[classId];
    const list = (CLASS_CONTENT[classId].upcoming && CLASS_CONTENT[classId].upcoming[screenKey]) || [];
    // Lớp đầu tiên đã có nội dung ở đúng màn này để mời bé sang xem tạm.
    const readyId = PLACEMENT_LEVEL_ORDER.find(id => id !== classId && CLASS_CONTENT[id].screens[screenKey]);
    el.innerHTML =
      '<div class="cs-emoji">' + lv.emoji + '</div>'
      + '<h2>' + lv.label + ' đang được chuẩn bị</h2>'
      + '<p>Các ' + CLASS_SCREEN_LABEL[screenKey] + ' riêng cho ' + lv.label + ' sắp ra mắt.'
      + (list.length ? ' Sắp có:' : '') + '</p>'
      + (list.length ? '<ul>' + list.map(t => '<li>' + t + '</li>').join('') + '</ul>' : '')
      + (readyId ? '<button class="cta-btn" data-goto-class="' + readyId + '">Xem ' + PLACEMENT_LEVELS[readyId].label + ' ' + PLACEMENT_LEVELS[readyId].emoji + '</button>' : '');
    const btn = el.querySelector('[data-goto-class]');
    if (btn) btn.addEventListener('click', () => setActiveClass(btn.dataset.gotoClass));
  }

  function applyClassScope() {
    const id = getActiveClassId();
    CLASS_SCREENS.forEach(s => {
      const ready = !!CLASS_CONTENT[id].screens[s.key];
      // Chỉ khối nội dung của ĐÚNG lớp đang chọn mới hiện (và chỉ khi lớp đó đã có nội dung ở màn này).
      document.querySelectorAll('#screen-' + s.key + ' [data-class-content]').forEach(el => {
        el.hidden = !(ready && el.dataset.classContent.split(',').indexOf(id) !== -1); // data-class-content có thể liệt kê nhiều lớp: "mam,choi"
      });
      const soon = document.getElementById(s.soon);
      soon.hidden = ready;
      if (!ready) fillClassSoon(soon, id, s.key);
      // Câu giới thiệu ở đầu tab: mỗi lớp có câu riêng (CLASS_CONTENT[lớp].hero), không khai báo thì dùng
      // câu gốc của lớp Mầm trong index.html. Trò chơi / Câu chỉ hiện câu này khi lớp có nội dung ở màn đó.
      const hero = document.querySelector('#screen-' + s.key + ' .home-hero');
      if (hero) {
        const h1 = hero.querySelector('h1'), p = hero.querySelector('p');
        if (hero.dataset.origTitle === undefined) { hero.dataset.origTitle = h1.innerHTML; hero.dataset.origText = p.innerHTML; } // innerHTML: giữ cả emoji đã được đổi thành ảnh
        const custom = CLASS_CONTENT[id].hero && CLASS_CONTENT[id].hero[s.key];
        if (custom) { h1.textContent = custom.title; p.textContent = custom.text; }
        else { h1.innerHTML = hero.dataset.origTitle; p.innerHTML = hero.dataset.origText; }
        if (s.key !== 'home') hero.hidden = !ready;
      }
    });
    renderClassSwitches();
    ['homeModeToggle', 'choiHomeModeToggle', 'laHomeModeToggle', 'gamesModeToggle', 'choiGamesModeToggle', 'laGamesModeToggle', 'sentencesModeToggle', 'laSentencesModeToggle'].forEach(tid => { // thumb chỉ đo được khi màn đang hiện
      const el = document.getElementById(tid);
      if (el && el.offsetParent !== null) moveSegmentThumb(el);
    });
  }

  // ---------- LÊN LỚP (Mầm → Chồi, Chồi → Lá) ----------
  // Mỗi lớp có 1 danh sách điều kiện học tập (getPromotionInfo). Đủ điều kiện thì bé được làm 1 bài
  // kiểm tra ngắn (5 câu, đúng ≥ PLACEMENT_PASS) — dùng lại đề của bài xếp lớp: phần 1 cho Mầm → Chồi,
  // phần 2 cho Chồi → Lá. Đậu thì ghi progress.promotions[lớp] = ngày, thưởng sao qua huy hiệu
  // "Lên Lớp …", và nếu lớp mới ĐÃ có nội dung thì chuyển bé sang lớp đó luôn; chưa có nội dung (Lớp Lá)
  // thì giữ bé ở lớp hiện tại và báo "sắp ra mắt" — tránh đẩy bé vào lớp còn trống.
  function getPromotionInfo(from) {
    const to = from === 'mam' ? 'choi' : from === 'choi' ? 'la' : null;
    if (!to) return null;
    const cnt = (list) => list.filter(t => progress.doneTopics[t.id]).length;
    let items;
    if (from === 'mam') {
      items = [
        { icon: '📚', label: 'Chủ đề từ vựng', have: cnt(TOPICS), need: 6 },
        { icon: '🔊', label: 'Nhóm Ngữ âm cơ bản', have: cnt(PHONICS_TOPICS), need: PHONICS_TOPICS.length },
        { icon: '🔤', label: 'Nhóm Bảng chữ cái', have: cnt(ABC_TOPICS), need: 3 },
      ];
    } else {
      items = [
        { icon: '📚', label: 'Chủ đề từ vựng Lớp Chồi', have: cnt(CHOI_TOPICS), need: 4 },
        { icon: '🔊', label: 'Nhóm Ngữ âm 2', have: cnt(PHONICS2_TOPICS), need: PHONICS2_TOPICS.length },
        { icon: '👀', label: 'Nhóm Từ hay gặp', have: cnt(SIGHT_TOPICS), need: 3 },
        { icon: '📗', label: 'Truyện đã đọc', have: cnt(STORY_TOPICS_CHOI), need: 2 },
        { icon: '✍️', label: 'Nhóm Tập viết chữ', have: WRITE_GROUPS.filter(g => progress.choi.writeGroups[g.id]).length, need: 3 },
        { icon: '🔤', label: 'Từ đã xếp ở Xếp chữ', have: progress.choi.spellWords, need: 30 },
        { icon: '🧩', label: 'Câu đã ghép', have: progress.choi.sentencesBuilt, need: 30 },
      ];
    }
    const missing = items.filter(i => i.have < i.need).length;
    return {
      from: from, to: to, tier: from === 'mam' ? 0 : 1,
      items: items, ready: missing === 0, missing: missing,
      passedDate: (progress.promotions && progress.promotions[from]) || null,
    };
  }

  function promotionTargetHasContent(to) {
    return Object.keys(CLASS_CONTENT[to].screens).some(k => CLASS_CONTENT[to].screens[k]);
  }
  // Lớp bé ĐÃ được xếp chính thức (chưa làm bài kiểm tra xếp lớp thì coi là Mầm — không đoán theo tuổi).
  function officialLevelId() { return progress.placement ? progress.placement.level : 'mam'; }

  // Vẽ thẻ "Lên lớp" trên trang Học của lớp Mầm và lớp Chồi.
  function renderPromoCards() {
    [['promoCardMam', 'mam'], ['promoCardChoi', 'choi']].forEach(pair => {
      const el = document.getElementById(pair[0]);
      if (!el) return;
      const info = getPromotionInfo(pair[1]);
      const already = PLACEMENT_LEVEL_ORDER.indexOf(officialLevelId()) >= PLACEMENT_LEVEL_ORDER.indexOf(info.to);
      const toLv = PLACEMENT_LEVELS[info.to];
      if (already && !info.passedDate) { el.innerHTML = ''; return; } // đã được xếp thẳng lên lớp cao hơn qua bài kiểm tra xếp lớp
      const rows = info.items.map(i => {
        const done = i.have >= i.need;
        return '<li class="' + (done ? 'is-done' : '') + '">' + (done ? '✅' : '⬜') + ' ' + i.icon + ' ' + i.label +
          ': <strong>' + Math.min(i.have, i.need) + '/' + i.need + '</strong></li>';
      }).join('');
      let action;
      if (info.passedDate) {
        action = promotionTargetHasContent(info.to)
          ? '<p class="promo-note">🎉 Bé đã lên ' + toLv.label + ' rồi!</p>'
          : '<p class="promo-note">🎉 Bé đã đủ điều kiện lên ' + toLv.label + '! ' + toLv.label + ' sắp ra mắt — trong lúc chờ, bé cứ tiếp tục học lớp này nhé.</p>';
      } else if (info.ready) {
        action = '<button class="cta-btn" data-promo-start="' + info.from + '">🎓 Làm bài kiểm tra lên ' + toLv.label + '</button>';
      } else {
        action = '<p class="promo-note">Còn ' + info.missing + ' điều kiện nữa là bé được làm bài kiểm tra lên lớp.</p>';
      }
      el.innerHTML =
        '<div class="promo-card">' +
          '<div class="promo-title">🎓 Lên ' + toLv.label + ' ' + toLv.emoji + '</div>' +
          '<ul class="promo-list">' + rows + '</ul>' + action +
        '</div>';
      const btn = el.querySelector('[data-promo-start]');
      if (btn) btn.addEventListener('click', () => startPromotionTest(btn.dataset.promoStart));
    });
  }

  function startPromotionTest(from) {
    const info = getPromotionInfo(from);
    if (!info || !info.ready) return;
    placementState = { tier: info.tier, index: 0, questions: [], scores: [0, 0], locked: false, used: new Set(), promo: from };
    placementState.questions = buildPlacementTier(info.tier, TOPICS, placementState.used);
    showPlacementPanel('question');
    showScreen('placement');
    renderPlacementQuestion();
  }

  function finishPromotion() {
    const st = placementState;
    const info = getPromotionInfo(st.promo);
    const score = st.scores[st.tier];
    const passed = score >= PLACEMENT_PASS;
    const toLv = PLACEMENT_LEVELS[info.to];
    placementState = null;
    let toReady = false;
    if (passed) {
      const oldLifetimeStars = progress.lifetimeStars;
      progress.promotions = progress.promotions || {};
      progress.promotions[info.from] = toDateStr(new Date());
      toReady = promotionTargetHasContent(info.to);
      if (toReady) { // chuyển bé sang lớp mới (giữ điểm bài xếp lớp cũ nếu có)
        progress.placement = Object.assign({ t1: null, t2: null, manual: false }, progress.placement || {}, { level: info.to, date: toDateStr(new Date()), promoted: true });
      }
      saveProgress(progress);
      celebrate(true, oldLifetimeStars, null); // mở huy hiệu "Lên Lớp …" (kèm thưởng sao) + pháo giấy
      if (toReady) setActiveClass(info.to);
    }
    document.getElementById('promoEmoji').textContent = passed ? '🎓' : '💪';
    document.getElementById('promoTitle').textContent = passed ? 'Chúc mừng! Bé lên ' + toLv.label + '!' : 'Gần được rồi!';
    document.getElementById('promoMsg').textContent = passed
      ? (toReady ? toLv.message : toLv.label + ' đang được chuẩn bị — bé cứ tiếp tục học lớp hiện tại cho đến khi ' + toLv.label + ' ra mắt nhé!')
      : 'Bé đúng ' + score + '/' + PLACEMENT_QUESTIONS_PER_TIER + ' câu, cần đúng ít nhất ' + PLACEMENT_PASS + ' câu. Bé ôn thêm một chút rồi thử lại nhé!';
    document.getElementById('promoRetryBtn').hidden = passed;
    document.getElementById('promoRetryBtn').dataset.from = info.from;
    showPlacementPanel('promo');
  }

  document.getElementById('promoContinueBtn').addEventListener('click', leavePlacement);
  document.getElementById('promoRetryBtn').addEventListener('click', (e) => startPromotionTest(e.currentTarget.dataset.from));

  // ---------- GỬI Ý KIẾN (ghi vào tab "Feedback" của Google Sheet qua Apps Script) ----------
  // Khác saveProgress/saveProfile (bắn rồi bỏ), gửi ý kiến phải ĐỢI phản hồi thật để chỉ báo
  // "đã gửi" khi Sheet đã ghi được — nếu không, ba mẹ gõ cả đoạn dài rồi mất trắng mà không biết.
  const FEEDBACK_MAX_LEN = 500; // GET URL có giới hạn độ dài, 500 ký tự tiếng Việt vẫn nằm gọn trong đó
  const FEEDBACK_MIN_LEN = 5;
  let feedbackRating = 0;
  let feedbackCategory = 'Góp ý tính năng';
  let feedbackSending = false;

  function showFeedbackError(msg) {
    const el = document.getElementById('feedbackError');
    el.textContent = msg;
    el.hidden = !msg;
  }
  function setFeedbackRating(value) {
    feedbackRating = value;
    showFeedbackError('');
    document.querySelectorAll('#feedbackRating .feedback-star').forEach(btn => {
      const v = Number(btn.dataset.value);
      btn.classList.toggle('on', v <= value);
      btn.setAttribute('aria-checked', v === value ? 'true' : 'false');
    });
  }
  function setFeedbackCategory(value) {
    feedbackCategory = value;
    showFeedbackError('');
    document.querySelectorAll('#feedbackCategories .feedback-chip').forEach(btn => {
      const on = btn.dataset.value === value;
      btn.classList.toggle('selected', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  function resetFeedbackForm() {
    setFeedbackRating(0);
    setFeedbackCategory('Góp ý tính năng');
    document.getElementById('feedbackMessage').value = '';
    document.getElementById('feedbackCounter').textContent = '0/' + FEEDBACK_MAX_LEN;
    showFeedbackError('');
  }
  function feedbackPlatform() {
    const cap = window.Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return 'Android APK';
    const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    return standalone || navigator.standalone ? 'Web app (đã thêm vào màn hình chính)' : 'Trình duyệt web';
  }

  document.getElementById('openFeedbackBtn').addEventListener('click', () => {
    resetFeedbackForm();
    showScreen('feedback');
  });
  document.getElementById('backFromFeedback').addEventListener('click', () => showScreen('settings'));
  document.querySelectorAll('#feedbackRating .feedback-star').forEach(btn => {
    btn.addEventListener('click', () => setFeedbackRating(Number(btn.dataset.value)));
  });
  document.querySelectorAll('#feedbackCategories .feedback-chip').forEach(btn => {
    btn.addEventListener('click', () => setFeedbackCategory(btn.dataset.value));
  });
  document.getElementById('feedbackMessage').addEventListener('input', (e) => {
    showFeedbackError('');
    document.getElementById('feedbackCounter').textContent = e.target.value.length + '/' + FEEDBACK_MAX_LEN;
  });

  document.getElementById('feedbackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (feedbackSending) return;
    const message = document.getElementById('feedbackMessage').value.trim().slice(0, FEEDBACK_MAX_LEN);
    if (!feedbackRating) { showFeedbackError('Ba mẹ chọn số sao giúp mình nhé.'); return; }
    if (message.length < FEEDBACK_MIN_LEN) { showFeedbackError(mapBackendError('message_too_short')); return; }
    if (!backendConfigured()) { showFeedbackError('Tính năng gửi ý kiến đang được cấu hình, ba mẹ thử lại sau nhé.'); return; }
    showFeedbackError('');

    const url = SHEETS_CONFIG.webAppUrl + '?action=saveFeedback'
      + '&email=' + encodeURIComponent(verifiedEmail || '')
      + '&name=' + encodeURIComponent(profile ? profile.name : '')
      + '&rating=' + feedbackRating
      + '&category=' + encodeURIComponent(feedbackCategory)
      + '&message=' + encodeURIComponent(message)
      + '&platform=' + encodeURIComponent(feedbackPlatform())
      + '&deviceId=' + encodeURIComponent(deviceId);

    const submitBtn = document.getElementById('feedbackSubmitBtn');
    feedbackSending = true;
    submitBtn.disabled = true;
    showLoading('Đang gửi ý kiến...');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    fetch(url, { signal: ctrl.signal }).then(r => r.json()).then(data => {
      if (!data.ok) { showFeedbackError(mapBackendError(data.error)); return; }
      showToast('Đã gửi ý kiến, cảm ơn ba mẹ nhiều!', '💚');
      resetFeedbackForm();
      showScreen('settings');
    }).catch(() => {
      showFeedbackError('Chưa gửi được, ba mẹ kiểm tra mạng rồi thử lại nhé (nội dung vẫn được giữ nguyên).');
    }).finally(() => {
      clearTimeout(timer);
      hideLoading();
      feedbackSending = false;
      submitBtn.disabled = false;
    });
  });
  document.getElementById('donateCopyBtn').addEventListener('click', () => {
    const number = document.getElementById('donateAccountNumber').textContent;
    if (!navigator.clipboard || !navigator.clipboard.writeText) return;
    navigator.clipboard.writeText(number)
      .then(() => showToast('Đã sao chép số tài khoản!', '📋'))
      .catch(() => {});
  });

  document.getElementById('emailEntryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim();
    if (!isValidEmail(email)) {
      showEmailEntryError('Email không hợp lệ.');
      return;
    }
    sendEmailCode(email);
  });

  document.getElementById('emailCodeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('codeInput').value.trim();
    if (code.length !== 6) {
      showEmailCodeError('Vui lòng nhập đủ 6 số.');
      return;
    }
    confirmEmailCode(code);
  });

  document.getElementById('emailChangeBtn').addEventListener('click', resetEmailForms);
  document.getElementById('emailSignOutBtn').addEventListener('click', () => {
    showConfirmDialog('Xác thực email khác? Hồ sơ và tiến độ hiện tại đã lưu an toàn trên hệ thống và sẽ được xoá khỏi máy này — xác thực lại đúng email cũ để khôi phục nhé.', { okLabel: 'Đồng ý' })
      .then(ok => { if (ok) signOutEmail(); });
  });

  // ---------- CHILD PROFILE (bắt buộc, 1 hồ sơ / thiết bị) ----------
  const PROFILE_KEY = '5phut_profile_v1';
  const AVATAR_PRESETS = ['🧒', '👦', '👧', '🐱', '🐶', '🦊', '🐦', '🐟', '😄', '😊'];
  let selectedAvatar = AVATAR_PRESETS[0];

  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || !p.name || !p.avatar) return null;
      return p;
    } catch (e) { return null; }
  }
  function saveProfileLocal(p) {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {}
  }
  let profile = loadProfile();

  function isValidVnPhone(phone) {
    return /^0\d{9}$/.test(String(phone || '').replace(/[\s.-]/g, ''));
  }

  function renderAvatarGrid() {
    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = '';
    AVATAR_PRESETS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option' + (emoji === selectedAvatar ? ' selected' : '');
      btn.textContent = emoji;
      btn.setAttribute('aria-label', 'Chọn hình ' + emoji);
      btn.addEventListener('click', () => {
        selectedAvatar = emoji;
        grid.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      grid.appendChild(btn);
    });
  }

  function showProfileFormError(msg) {
    const el = document.getElementById('profileFormError');
    el.textContent = msg;
    el.hidden = !msg;
  }

  function renderProfileCreateScreen() {
    document.getElementById('profileCreateTitle').textContent = profile ? 'Sửa hồ sơ của bé' : 'Tạo hồ sơ cho bé';
    document.getElementById('profileNameInput').value = profile ? profile.name : '';
    document.getElementById('profileAgeInput').value = profile ? profile.age : '';
    document.getElementById('profilePhoneInput').value = profile ? profile.parentPhone : '';
    selectedAvatar = profile ? profile.avatar : AVATAR_PRESETS[0];
    renderAvatarGrid();
    showProfileFormError('');
  }

  function logProfileToSheet(p) {
    if (!backendConfigured()) return;
    const url = SHEETS_CONFIG.webAppUrl + '?action=saveProfile'
      + '&email=' + encodeURIComponent(verifiedEmail || '')
      + '&name=' + encodeURIComponent(p.name)
      + '&age=' + encodeURIComponent(p.age)
      + '&avatar=' + encodeURIComponent(p.avatar)
      + '&phone=' + encodeURIComponent(p.parentPhone)
      + '&deviceId=' + encodeURIComponent(deviceId);
    fetch(url).catch(() => {});
  }

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('profileNameInput').value.trim();
    const age = parseInt(document.getElementById('profileAgeInput').value, 10);
    const phone = document.getElementById('profilePhoneInput').value.trim();

    if (!name) { showProfileFormError('Vui lòng nhập tên bé.'); return; }
    if (!age || age < 3 || age > 12) { showProfileFormError('Tuổi của bé phải từ 3 đến 12.'); return; }
    if (!isValidVnPhone(phone)) { showProfileFormError('Số điện thoại chưa đúng định dạng (VD: 0912345678).'); return; }

    const wasEditing = !!profile;
    profile = { name: name, age: age, avatar: selectedAvatar, parentPhone: phone };
    saveProfileLocal(profile);
    logProfileToSheet(profile);
    if (!wasEditing) showToast('Tạo hồ sơ thành công!', '🎉');
    if (!enforceGate()) return;
    // Hồ sơ vừa tạo mới và bé chưa được xếp lớp → dẫn thẳng vào bài kiểm tra trình độ; bootAfterGate
    // (trang chủ + hướng dẫn lần đầu) chạy sau khi bé xem xong kết quả xếp lớp — xem leavePlacement.
    if (!wasEditing && !progress.placement) openPlacementIntro(true);
    else bootAfterGate();
  });

  document.getElementById('editProfileBtn').addEventListener('click', () => {
    renderProfileCreateScreen();
    showScreen('profileCreate');
  });
  document.getElementById('backFromProfileCreate').addEventListener('click', () => { if (enforceGate()) goHome(); });

  // ---------- ACCESS GATE (email xác thực + hồ sơ bé là bắt buộc) ----------
  function enforceGate() {
    document.getElementById('backFromAccount').hidden = !(verifiedEmail && profile);
    document.getElementById('backFromProfileCreate').hidden = !(verifiedEmail && profile);
    renderAccountScreen();

    if (!verifiedEmail) {
      showScreen('account');
      return false;
    }
    if (!profile) {
      renderProfileCreateScreen();
      showScreen('profileCreate');
      return false;
    }
    return true;
  }

  // ---------- ONBOARDING TOUR ----------
  const ONBOARDING_KEY = '5phut_onboarding_seen_v1';
  function showOnboarding() { document.getElementById('onboardingOverlay').hidden = false; }
  function hideOnboarding() { document.getElementById('onboardingOverlay').hidden = true; }
  document.getElementById('onboardingStartBtn').addEventListener('click', () => {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch (e) {}
    hideOnboarding();
  });
  document.getElementById('replayOnboardingBtn').addEventListener('click', showOnboarding);

  // ---------- GAMES TAB ----------
  let gamesMode = 'match'; // 'match' (ghép tranh), 'spell' (xếp chữ), 'speed' (đố vui tính giờ) hoặc 'quizparent' (đố ba mẹ)
  // Lưới chủ đề của Xếp chữ lớp Chồi (tab Trò chơi, khi đang chọn Lớp Chồi).
  function renderChoiSpellGrid() {
    const grid = document.getElementById('choiSpellTopicGrid');
    // Simon nói không cần chọn chủ đề — ẩn lưới, hiện thẻ giới thiệu thay vào đó.
    grid.hidden = choiGamesMode === 'simon';
    document.getElementById('simonIntro').hidden = choiGamesMode !== 'simon';
    if (choiGamesMode === 'simon') return;
    grid.innerHTML = '';
    const memory = choiGamesMode === 'memory'; // cùng danh sách chủ đề cho Xếp chữ và Lật thẻ
    getChoiSpellTopics().forEach(topic => {
      const pool = memory ? getMemoryPool(topic) : getSpellingPool(topic, 'choi');
      if (memory ? pool.length < MEMORY_PAIRS : pool.length === 0) return;
      const done = memory ? !!progress.choi.memoryTopics[topic.id] : !!progress.choi.spellTopics[topic.id];
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã chơi</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + (memory ? 'Lật ' + MEMORY_PAIRS + ' cặp' : 'Xếp ' + Math.min(SPELLING_RULES.choi.count, pool.length) + ' từ') + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
      btn.addEventListener('click', () => memory ? startMemory(topic.id) : startSpelling(topic.id, 'choi'));
      grid.appendChild(btn);
    });
  }

  // Lưới trò chơi của lớp Lá (tab Trò chơi, khi đang chọn Lớp Lá): 5 chế độ Xếp chữ dài / Đố nhanh
  // nâng cao / Sắp xếp câu / Lật thẻ / Simon nói — không khoá theo doneTopics như Học (giống Chồi:
  // chọn lớp Lá là chơi được ngay, xem [[project_games_sentences_unlock]] trong bộ nhớ về vì sao Học
  // vẫn khoá còn đây thì không).
  function renderLaGamesGrid() {
    const grid = document.getElementById('laGamesTopicGrid');
    // Simon nói không cần chọn chủ đề — ẩn lưới, hiện thẻ giới thiệu thay vào đó (giống Chồi).
    grid.hidden = laGamesMode === 'simon';
    document.getElementById('laSimonIntro').hidden = laGamesMode !== 'simon';
    if (laGamesMode === 'simon') return;
    grid.innerHTML = '';
    if (laGamesMode === 'spell' || laGamesMode === 'memory') {
      const memory = laGamesMode === 'memory'; // cùng danh sách chủ đề cho Xếp chữ dài và Lật thẻ, giống Chồi
      getLaSpellTopics().forEach(topic => {
        const pool = memory ? getLaMemoryPool(topic) : getSpellingPool(topic, 'la');
        if (memory ? pool.length < MEMORY_PAIRS : pool.length === 0) return;
        const done = memory ? !!progress.la.memoryTopics[topic.id] : !!progress.la.spellTopics[topic.id];
        const btn = document.createElement('button');
        btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
        btn.innerHTML =
          (done ? '<span class="done-badge">✓ Đã chơi</span>' : '') +
          '<span class="emoji">' + topic.emoji + '</span>' +
          '<span><span class="label">' + topic.label + '</span><br>' +
          '<span class="count">' + (memory ? 'Lật ' + MEMORY_PAIRS + ' cặp' : 'Xếp ' + Math.min(SPELLING_RULES.la.count, pool.length) + ' từ') + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
        btn.addEventListener('click', () => memory ? startMemory(topic.id, 'la') : startSpelling(topic.id, 'la'));
        grid.appendChild(btn);
      });
    } else if (laGamesMode === 'speed') {
      LA_TOPICS.forEach(topic => {
        const btn = document.createElement('button');
        btn.className = 'topic-card ' + topic.cls;
        btn.innerHTML =
          '<span class="emoji">' + topic.emoji + '</span>' +
          '<span><span class="label">' + topic.label + '</span><br>' +
          '<span class="count">Đố ' + Math.min(SPEED_WORD_COUNT, topic.words.length) + ' từ / ' + SPEED_TIME_LIMIT + 's</span></span>';
        btn.addEventListener('click', () => startSpeedQuiz(topic.id, 'la'));
        grid.appendChild(btn);
      });
    } else { // order (Sắp xếp câu)
      SENTENCE_BUILD_LA_TOPICS.forEach(topic => {
        const done = !!progress.la.sentenceGroups[topic.id];
        const btn = document.createElement('button');
        btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
        btn.innerHTML =
          (done ? '<span class="done-badge">✓ Đã chơi</span>' : '') +
          '<span class="emoji">' + topic.emoji + '</span>' +
          '<span><span class="label">' + topic.label + '</span><br>' +
          '<span class="count">Sắp xếp ' + Math.min(SENTENCE_BUILD_COUNT, topic.sentences.length) + ' câu' + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
        btn.addEventListener('click', () => startSentenceBuild(topic.id, 'la'));
        grid.appendChild(btn);
      });
    }
  }

  function renderGamesScreen() {
    applyClassScope();
    renderChoiSpellGrid();
    renderLaGamesGrid();
    const grid = document.getElementById('gamesTopicGrid');
    grid.innerHTML = '';
    TOPICS.forEach(topic => {
      // Xếp chữ: chủ đề không có từ 3-4 chữ cái nào thì không đưa vào game.
      if (gamesMode === 'spell' && getSpellingPool(topic, 'mam').length === 0) return;
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + practiceLockClasses(topic);
      const countText = isTopicLockedForPractice(topic) ? practiceLockReasonText(topic) :
        gamesMode === 'match' ? 'Nối ' + topic.words.length + ' cặp' :
        gamesMode === 'spell' ? 'Xếp ' + Math.min(SPELLING_RULES.mam.count, getSpellingPool(topic, 'mam').length) + ' từ' :
        gamesMode === 'speed' ? 'Đố ' + Math.min(SPEED_WORD_COUNT, topic.words.length) + ' từ / ' + SPEED_TIME_LIMIT + 's' :
        'Đố ba mẹ ' + Math.min(QUIZPARENT_WORD_COUNT, topic.words.length) + ' từ';
      btn.innerHTML =
        practiceLockBadgeHtml(topic) +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + countText + '</span></span>';
      btn.addEventListener('click', () => {
        if (gamesMode === 'match') startPracticeMatch(topic.id);
        else if (gamesMode === 'spell') startSpelling(topic.id);
        else if (gamesMode === 'speed') startSpeedQuiz(topic.id);
        else startQuizParent(topic.id);
      });
      grid.appendChild(btn);
    });
  }
  renderGamesScreen();

  function setGamesMode(mode) {
    gamesMode = mode;
    document.getElementById('gameModeMatchBtn').classList.toggle('active', mode === 'match');
    document.getElementById('gameModeSpellBtn').classList.toggle('active', mode === 'spell');
    document.getElementById('gameModeSpeedBtn').classList.toggle('active', mode === 'speed');
    document.getElementById('gameModeQuizParentBtn').classList.toggle('active', mode === 'quizparent');
    renderGamesScreen();
    moveSegmentThumb(document.getElementById('gamesModeToggle'));
  }
  document.getElementById('gameModeMatchBtn').addEventListener('click', () => setGamesMode('match'));
  document.getElementById('gameModeSpellBtn').addEventListener('click', () => setGamesMode('spell'));
  document.getElementById('gameModeSpeedBtn').addEventListener('click', () => setGamesMode('speed'));
  document.getElementById('gameModeQuizParentBtn').addEventListener('click', () => setGamesMode('quizparent'));

  // ---------- SENTENCES TAB ----------
  let sentencesMode = 'read'; // 'read' (đọc câu), 'reverse' (đoán nghĩa) hoặc 'fill' (điền từ)

  // Lưới tab Câu của lớp Lá: 3 chế độ Hỏi-đáp / Đối thoại nhập vai / Viết câu — như Trò chơi của Lá,
  // không khoá theo doneTopics (mở sẵn khi đã chọn lớp Lá).
  function renderLaSentencesGrid() {
    const grid = document.getElementById('laSentencesTopicGrid');
    grid.innerHTML = '';
    if (laSentencesMode === 'qa') {
      QA_LA_TOPICS.forEach(topic => {
        const done = !!progress.la.qaGroups[topic.id];
        const btn = document.createElement('button');
        btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
        btn.innerHTML =
          (done ? '<span class="done-badge">✓ Đã chơi</span>' : '') +
          '<span class="emoji">' + topic.emoji + '</span>' +
          '<span><span class="label">' + topic.label + '</span><br>' +
          '<span class="count">Nối ' + Math.min(QA_ROUND_COUNT, topic.pairs.length) + ' câu' + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
        btn.addEventListener('click', () => startLaQa(topic.id));
        grid.appendChild(btn);
      });
    } else if (laSentencesMode === 'dialogue') {
      DIALOGUE_LA_TOPICS.forEach(topic => {
        const done = !!progress.la.dialogueGroups[topic.id];
        const btn = document.createElement('button');
        btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
        btn.innerHTML =
          (done ? '<span class="done-badge">✓ Đã chơi</span>' : '') +
          '<span class="emoji">' + topic.emoji + '</span>' +
          '<span><span class="label">' + topic.label + '</span><br>' +
          '<span class="count">' + topic.turns.length + ' lượt thoại' + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
        btn.addEventListener('click', () => startLaDialogue(topic.id));
        grid.appendChild(btn);
      });
    } else if (laSentencesMode === 'write') {
      WRITE_LA_TOPICS.forEach(topic => {
        const done = !!progress.la.writeSentGroups[topic.id];
        const btn = document.createElement('button');
        btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
        btn.innerHTML =
          (done ? '<span class="done-badge">✓ Đã chơi</span>' : '') +
          '<span class="emoji">' + topic.emoji + '</span>' +
          '<span><span class="label">' + topic.label + '</span><br>' +
          '<span class="count">Viết ' + topic.sentences.length + ' câu' + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
        btn.addEventListener('click', () => startLaWrite(topic.id, WRITE_LA_TOPICS));
        grid.appendChild(btn);
      });
    } else { // paragraph (Viết đoạn văn)
      PARAGRAPH_LA_TOPICS.forEach(topic => {
        const done = !!progress.la.paragraphGroups[topic.id];
        const btn = document.createElement('button');
        btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
        btn.innerHTML =
          (done ? '<span class="done-badge">✓ Đã viết</span>' : '') +
          '<span class="emoji">' + topic.emoji + '</span>' +
          '<span><span class="label">' + topic.label + '</span><br>' +
          '<span class="count">Viết ' + topic.sentences.length + ' câu' + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
        btn.addEventListener('click', () => startLaWrite(topic.id, PARAGRAPH_LA_TOPICS));
        grid.appendChild(btn);
      });
    }
  }

  function renderSentencesScreen() {
    applyClassScope();
    renderChoiSentenceGrid();
    renderLaSentencesGrid();
    const grid = document.getElementById('sentencesTopicGrid');
    grid.innerHTML = '';
    TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + practiceLockClasses(topic);
      const countText = isTopicLockedForPractice(topic) ? practiceLockReasonText(topic) :
        sentencesMode === 'read' ? topic.words.length + ' câu' :
        sentencesMode === 'reverse' ? 'Đoán ' + Math.min(REVERSE_WORD_COUNT, topic.words.length) + ' từ' :
        'Điền ' + Math.min(FILLBLANK_WORD_COUNT, topic.words.length) + ' câu';
      btn.innerHTML =
        practiceLockBadgeHtml(topic) +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + countText + '</span></span>';
      btn.addEventListener('click', () => {
        if (sentencesMode === 'read') startSentenceTopic(topic.id);
        else if (sentencesMode === 'reverse') startReverseQuiz(topic.id);
        else startFillBlank(topic.id);
      });
      grid.appendChild(btn);
    });
  }
  renderSentencesScreen();

  function setSentencesMode(mode) {
    sentencesMode = mode;
    document.getElementById('sentenceModeReadBtn').classList.toggle('active', mode === 'read');
    document.getElementById('sentenceModeReverseBtn').classList.toggle('active', mode === 'reverse');
    document.getElementById('sentenceModeFillBtn').classList.toggle('active', mode === 'fill');
    renderSentencesScreen();
    moveSegmentThumb(document.getElementById('sentencesModeToggle'));
  }
  document.getElementById('sentenceModeReadBtn').addEventListener('click', () => setSentencesMode('read'));
  document.getElementById('sentenceModeReverseBtn').addEventListener('click', () => setSentencesMode('reverse'));
  document.getElementById('sentenceModeFillBtn').addEventListener('click', () => setSentencesMode('fill'));

  function setLaSentencesMode(mode) {
    laSentencesMode = mode;
    document.getElementById('laSentModeQaBtn').classList.toggle('active', mode === 'qa');
    document.getElementById('laSentModeDialogueBtn').classList.toggle('active', mode === 'dialogue');
    document.getElementById('laSentModeWriteBtn').classList.toggle('active', mode === 'write');
    document.getElementById('laSentModeParagraphBtn').classList.toggle('active', mode === 'paragraph');
    renderLaSentencesGrid();
    moveSegmentThumb(document.getElementById('laSentencesModeToggle'));
  }
  document.getElementById('laSentModeQaBtn').addEventListener('click', () => setLaSentencesMode('qa'));
  document.getElementById('laSentModeDialogueBtn').addEventListener('click', () => setLaSentencesMode('dialogue'));
  document.getElementById('laSentModeWriteBtn').addEventListener('click', () => setLaSentencesMode('write'));
  document.getElementById('laSentModeParagraphBtn').addEventListener('click', () => setLaSentencesMode('paragraph'));

  function startSentenceTopic(topicId) {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLockedForPractice(topic)) { showLockedPracticeTopicNotice(topic); return; }
    document.getElementById('sentenceTopicTitle').textContent = topic.label;

    const list = document.getElementById('sentenceList');
    list.innerHTML = '';
    topic.words.forEach(w => {
      if (!w.example) return;
      const highlighted = w.example.replace(w.en, '<span class="hl">' + w.en + '</span>');
      const card = document.createElement('div');
      card.className = 'sentence-card';
      card.innerHTML =
        '<span class="sentence-emoji">' + w.emoji + '</span>' +
        '<span class="sentence-text">' +
          '<span class="sentence-en"><span class="lang-flag">🇬🇧</span>' + highlighted + '</span>' +
          '<span class="sentence-vi"><span class="lang-flag">🇻🇳</span>' + (w.exampleVi || '') + '</span>' +
        '</span>' +
        '<button class="sentence-listen-btn" aria-label="Nghe câu">🔊</button>';
      card.querySelector('.sentence-listen-btn').addEventListener('click', () => speak(w.example));
      list.appendChild(card);
    });

    showScreen('sentencePractice');
  }

  document.getElementById('backFromSentences').addEventListener('click', () => showScreen('sentences'));

  // ---------- REVERSE QUIZ (Đoán nghĩa: cho nghĩa tiếng Việt, đoán đúng từ tiếng Anh) ----------
  // Chiều ngược lại với Quiz thường (nghe Anh → chọn tranh) — nhớ 1 từ theo nhiều chiều thì nhớ
  // sâu và lâu hơn. Luyện tập tự do (không tính sao) nhưng vẫn ghi nhận vào wordStats để phục vụ
  // Ôn tập thông minh + Luyện từ khó.
  let reverseWords = [];
  let reverseIndex = 0;

  function startReverseQuiz(topicId) {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLockedForPractice(topic)) { showLockedPracticeTopicNotice(topic); return; }
    currentTopic = topic;
    reverseWords = shuffle(topic.words).slice(0, Math.min(REVERSE_WORD_COUNT, topic.words.length));
    reverseIndex = 0;
    document.getElementById('reverseWrap').hidden = false;
    document.getElementById('reverseDoneWrap').hidden = true;
    renderReverseQuestion();
    showScreen('reverse');
  }

  function renderReverseQuestion() {
    const pct = (reverseIndex / reverseWords.length) * 100;
    document.getElementById('reverseProgressFill').style.width = pct + '%';
    document.getElementById('reverseFeedback').textContent = '';
    document.getElementById('reverseFeedback').className = 'quiz-feedback';

    const word = reverseWords[reverseIndex];
    document.getElementById('reverseEmoji').textContent = word.emoji;
    document.getElementById('reverseWord').textContent = word.vi;

    const distractors = shuffle(currentTopic.words.filter(w => w !== word)).slice(0, 3);
    const options = shuffle([word, ...distractors]);

    const wrap = document.getElementById('reverseOptions');
    wrap.innerHTML = '';
    options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'quiz-opt text-opt';
      b.textContent = opt.en;
      b.addEventListener('click', () => handleReverseAnswer(b, opt.en === word.en));
      wrap.appendChild(b);
    });
  }

  function handleReverseAnswer(btn, isCorrect) {
    const word = reverseWords[reverseIndex];
    document.querySelectorAll('#reverseOptions .quiz-opt').forEach(o => o.disabled = true);
    const fb = document.getElementById('reverseFeedback');
    recordWordAnswer(word, isCorrect);
    if (isCorrect) {
      btn.classList.add('correct');
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      speak(word.en);
    } else {
      btn.classList.add('wrong');
      fb.textContent = 'Chưa đúng, từ đúng là "' + word.en + '"';
      fb.className = 'quiz-feedback no';
    }
    setTimeout(() => {
      reverseIndex++;
      if (reverseIndex >= reverseWords.length) {
        document.getElementById('reverseProgressFill').style.width = '100%';
        document.getElementById('reverseWrap').hidden = true;
        document.getElementById('reverseDoneWrap').hidden = false;
        saveProgress(progress);
      } else {
        renderReverseQuestion();
      }
    }, 1000);
  }

  document.getElementById('backFromReverse').addEventListener('click', () => showScreen('sentences'));
  document.getElementById('reverseReplayBtn').addEventListener('click', () => startReverseQuiz(currentTopic.id));
  document.getElementById('reverseOtherTopicBtn').addEventListener('click', () => showScreen('sentences'));

  // ---------- FILL IN THE BLANK (Điền từ vào câu) ----------
  // Cho câu ví dụ bị khuyết mất từ chính, bé phải tự nhớ lại đúng từ để chọn điền vào — luyện nhớ
  // từ trong ngữ cảnh thay vì chỉ nhận diện thụ động như phần "Đọc câu". Cũng luyện tập tự do,
  // vẫn ghi nhận vào wordStats.
  let fillBlankWords = [];
  let fillBlankIndex = 0;

  function startFillBlank(topicId) {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLockedForPractice(topic)) { showLockedPracticeTopicNotice(topic); return; }
    currentTopic = topic;
    const withExamples = topic.words.filter(w => w.example);
    fillBlankWords = shuffle(withExamples).slice(0, Math.min(FILLBLANK_WORD_COUNT, withExamples.length));
    fillBlankIndex = 0;
    document.getElementById('fillBlankWrap').hidden = false;
    document.getElementById('fillBlankDoneWrap').hidden = true;
    renderFillBlankQuestion();
    showScreen('fillblank');
  }

  function renderFillBlankQuestion() {
    const pct = (fillBlankIndex / fillBlankWords.length) * 100;
    document.getElementById('fillBlankProgressFill').style.width = pct + '%';
    document.getElementById('fillBlankFeedback').textContent = '';
    document.getElementById('fillBlankFeedback').className = 'quiz-feedback';

    const word = fillBlankWords[fillBlankIndex];
    document.getElementById('fillBlankEmoji').textContent = word.emoji;
    document.getElementById('fillBlankSentence').innerHTML = word.example.replace(word.en, '<span class="blank">____</span>');
    document.getElementById('fillBlankVi').textContent = word.exampleVi || '';

    const distractors = shuffle(currentTopic.words.filter(w => w !== word)).slice(0, 3);
    const options = shuffle([word, ...distractors]);

    const wrap = document.getElementById('fillBlankOptions');
    wrap.innerHTML = '';
    options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'quiz-opt text-opt';
      b.textContent = opt.en;
      b.addEventListener('click', () => handleFillBlankAnswer(b, opt.en === word.en));
      wrap.appendChild(b);
    });
  }

  function handleFillBlankAnswer(btn, isCorrect) {
    const word = fillBlankWords[fillBlankIndex];
    document.querySelectorAll('#fillBlankOptions .quiz-opt').forEach(o => o.disabled = true);
    const fb = document.getElementById('fillBlankFeedback');
    recordWordAnswer(word, isCorrect);
    if (isCorrect) {
      btn.classList.add('correct');
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      document.getElementById('fillBlankSentence').textContent = word.example;
      speak(word.example);
    } else {
      btn.classList.add('wrong');
      fb.textContent = 'Chưa đúng, từ đúng là "' + word.en + '"';
      fb.className = 'quiz-feedback no';
    }
    setTimeout(() => {
      fillBlankIndex++;
      if (fillBlankIndex >= fillBlankWords.length) {
        document.getElementById('fillBlankProgressFill').style.width = '100%';
        document.getElementById('fillBlankWrap').hidden = true;
        document.getElementById('fillBlankDoneWrap').hidden = false;
        saveProgress(progress);
      } else {
        renderFillBlankQuestion();
      }
    }, 1200);
  }

  document.getElementById('backFromFillBlank').addEventListener('click', () => showScreen('sentences'));
  document.getElementById('fillBlankReplayBtn').addEventListener('click', () => startFillBlank(currentTopic.id));
  document.getElementById('fillBlankOtherTopicBtn').addEventListener('click', () => showScreen('sentences'));

  // Cập nhật text/trạng thái disabled của 3 nút ôn tập (đặt ở màn Học) theo dữ liệu mới nhất.
  function renderReviewButtons() {
    const doneCount = vocabTopicsOf(reviewClassId()).filter(t => progress.doneTopics[t.id]).length;
    const mixedBtn = document.getElementById('mixedReviewBtn');
    mixedBtn.disabled = doneCount === 0;
    mixedBtn.title = doneCount === 0 ? 'Bé cần học xong ít nhất 1 chủ đề trước nhé!' : '';

    const dueCount = getDueWords(999).length;
    const smartBtn = document.getElementById('smartReviewBtn');
    smartBtn.textContent = dueCount > 0 ? '🧠 Ôn tập thông minh (' + dueCount + ' từ)' : '🧠 Ôn tập thông minh';
    smartBtn.disabled = dueCount === 0;
    smartBtn.title = dueCount === 0 ? 'Chưa có từ nào đến hạn ôn lại, bé học tiếp đã nhé!' : '';

    const difficultCount = getDifficultWords(999).length;
    const difficultBtn = document.getElementById('difficultReviewBtn');
    difficultBtn.textContent = difficultCount > 0 ? '📌 Luyện từ khó (' + difficultCount + ' từ)' : '📌 Luyện từ khó';
    difficultBtn.disabled = difficultCount === 0;
    difficultBtn.title = difficultCount === 0 ? 'Bé chưa có từ nào hay sai cả, giỏi quá!' : '';
  }

  // Bảng chữ cái ABC — 6 nhóm chữ cái liền nhau (ABC_TOPICS, data/alphabet.js), luôn mở hết, không
  // khoá tuần tự/không tính vào "Bậc thầy tí hon"/mảnh ghép tranh (những thứ đó chỉ tính 12 chủ đề
  // từ vựng chính trong TOPICS). Chỉ đánh dấu "✓ Đã học" theo progress.doneTopics như bình thường.
  function renderAbcSection() {
    const grid = document.getElementById('abcTopicGrid');
    grid.innerHTML = '';
    ABC_TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      const done = !!progress.doneTopics[topic.id];
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã học</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.words.length + ' chữ cái</span></span>';
      btn.addEventListener('click', () => startTopic(topic.id));
      grid.appendChild(btn);
    });
  }

  // Ngữ âm cơ bản (Phonics) — 4 nhóm họ vần (PHONICS_TOPICS, data/phonics.js), cùng nguyên tắc với
  // ABC_TOPICS: luôn mở hết, tách khỏi TOPICS nên không đụng khoá tuần tự/huy hiệu/mảnh ghép tranh.
  function renderPhonicsSection() {
    const grid = document.getElementById('phonicsTopicGrid');
    grid.innerHTML = '';
    PHONICS_TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      const done = !!progress.doneTopics[topic.id];
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã học</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.words.length + ' từ</span></span>';
      btn.addEventListener('click', () => startPhonicsGroup(topic.id));
      grid.appendChild(btn);
    });
  }

  // Từ vựng lớp Chồi (CHOI_TOPICS, data/vocab_choi.js): 9 chủ đề, luôn mở, học theo luồng thẻ → đố → hoàn thành
  // như chủ đề lớp Mầm nhưng không khoá tuần tự và không có mảnh ghép tranh (xem startTopic / finishTopic).
  function renderChoiVocab() {
    const grid = document.getElementById('choiVocabGrid');
    grid.innerHTML = '';
    CHOI_TOPICS.forEach(topic => {
      const done = !!progress.doneTopics[topic.id];
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã học</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.words.length + ' từ vựng</span></span>';
      btn.addEventListener('click', () => startTopic(topic.id));
      grid.appendChild(btn);
    });
  }

  // Chọn phần học trên trang Học của lớp Chồi (cùng kiểu segment-toggle như lớp Mầm).
  const CHOI_HOME_MODES = [
    { key: 'vocab', btn: 'choiModeVocabBtn', panel: 'choiPanelVocab' },
    { key: 'phonics', btn: 'choiModePhonicsBtn', panel: 'choiPanelPhonics' },
    { key: 'sight', btn: 'choiModeSightBtn', panel: 'choiPanelSight' },
    { key: 'write', btn: 'choiModeWriteBtn', panel: 'choiPanelWrite' },
    { key: 'songs', btn: 'choiModeSongsBtn', panel: 'choiPanelSongs' },
    { key: 'stories', btn: 'choiModeStoriesBtn', panel: 'choiPanelStories' },
  ];
  function setChoiHomeMode(mode) {
    CHOI_HOME_MODES.forEach(m => {
      document.getElementById(m.btn).classList.toggle('active', m.key === mode);
      document.getElementById(m.panel).hidden = m.key !== mode;
    });
    moveSegmentThumb(document.getElementById('choiHomeModeToggle'));
  }
  CHOI_HOME_MODES.forEach(m => document.getElementById(m.btn).addEventListener('click', () => setChoiHomeMode(m.key)));

  // Ngữ âm 2 (PHONICS2_TOPICS, data/phonics2.js) — nội dung riêng của lớp Chồi, luôn mở hết như
  // Ngữ âm cơ bản của lớp Mầm; dùng lại 2 màn học/đố của phonics (xem startPhonicsGroup).
  function renderPhonics2Section() {
    const grid = document.getElementById('phonics2TopicGrid');
    grid.innerHTML = '';
    PHONICS2_TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      const done = !!progress.doneTopics[topic.id];
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã học</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.words.length + ' từ</span></span>';
      btn.addEventListener('click', () => startPhonicsGroup(topic.id));
      grid.appendChild(btn);
    });
  }

  // Truyện tranh song ngữ ngắn (STORY_TOPICS, data/stories.js) — cùng nguyên tắc ABC_TOPICS/
  // PHONICS_TOPICS: luôn mở hết, tách khỏi TOPICS nên không đụng khoá tuần tự/huy hiệu/mảnh ghép tranh.
  function renderStorySection() {
    const grid = document.getElementById('storyTopicGrid');
    grid.innerHTML = '';
    STORY_TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      const done = !!progress.doneTopics[topic.id];
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã đọc</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.pages.length + ' trang truyện</span></span>';
      btn.addEventListener('click', () => startStory(topic.id));
      grid.appendChild(btn);
    });
  }

  // Truyện tranh song ngữ RIÊNG của lớp Chồi (STORY_TOPICS_CHOI, data/stories_choi.js) — dài và khó
  // hơn truyện của lớp Mầm, dùng chung màn đọc/đố (xem startStory ở trên tìm theo id trong cả 2 mảng).
  function renderStoryChoiSection() {
    const grid = document.getElementById('storyChoiTopicGrid');
    if (!grid) return;
    grid.innerHTML = '';
    STORY_TOPICS_CHOI.forEach(topic => {
      const btn = document.createElement('button');
      const done = !!progress.doneTopics[topic.id];
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã đọc</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.pages.length + ' trang truyện</span></span>';
      btn.addEventListener('click', () => startStory(topic.id));
      grid.appendChild(btn);
    });
  }

  // ---------- LỚP LÁ (tab Học) ----------
  // Từ vựng riêng (LA_TOPICS, data/vocab_la.js) — cùng nguyên tắc CHOI_TOPICS: luôn mở sẵn, không khoá
  // tuần tự, dùng chung màn thẻ/đố với TOPICS/CHOI_TOPICS (xem startTopic ở trên).
  function renderLaVocab() {
    const grid = document.getElementById('laVocabGrid');
    if (!grid) return;
    grid.innerHTML = '';
    LA_TOPICS.forEach(topic => {
      const done = !!progress.doneTopics[topic.id];
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã học</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.words.length + ' từ vựng</span></span>';
      btn.addEventListener('click', () => startTopic(topic.id));
      grid.appendChild(btn);
    });
  }

  // Ngữ âm 3 (PHONICS3_TOPICS, data/phonics3.js) — nối tiếp Ngữ âm 2 của lớp Chồi, dùng chung 2 màn
  // học/đố của phonics (xem startPhonicsGroup, isAdvancedPhonicsTopic).
  function renderPhonics3Section() {
    const grid = document.getElementById('phonics3TopicGrid');
    if (!grid) return;
    grid.innerHTML = '';
    PHONICS3_TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      const done = !!progress.doneTopics[topic.id];
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã học</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.words.length + ' từ</span></span>';
      btn.addEventListener('click', () => startPhonicsGroup(topic.id));
      grid.appendChild(btn);
    });
  }

  // Truyện tranh song ngữ RIÊNG của lớp Lá (STORY_TOPICS_LA, data/stories_la.js) — dài và khó hơn cả
  // truyện lớp Chồi, dùng chung màn đọc/đố (xem startStory ở trên tìm theo id trong cả 3 mảng).
  function renderStoryLaSection() {
    const grid = document.getElementById('storyLaTopicGrid');
    if (!grid) return;
    grid.innerHTML = '';
    STORY_TOPICS_LA.forEach(topic => {
      const btn = document.createElement('button');
      const done = !!progress.doneTopics[topic.id];
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã đọc</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.pages.length + ' trang truyện</span></span>';
      btn.addEventListener('click', () => startStory(topic.id));
      grid.appendChild(btn);
    });
  }

  // Đọc hiểu văn bản thông tin (READING_LA_TOPICS, data/reading_la.js) — dùng lại nguyên màn đọc/đố
  // của Truyện (startStory tìm theo id ở CẢ 4 mảng giờ đây), chỉ khác nội dung là văn bản thông tin.
  function renderReadingSection() {
    const grid = document.getElementById('readingLaTopicGrid');
    if (!grid) return;
    grid.innerHTML = '';
    READING_LA_TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      const done = !!progress.doneTopics[topic.id];
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã đọc</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.pages.length + ' trang</span></span>';
      btn.addEventListener('click', () => startStory(topic.id));
      grid.appendChild(btn);
    });
  }

  // Chọn phần học trên trang Học của lớp Lá (cùng kiểu segment-toggle như lớp Chồi).
  const LA_HOME_MODES = [
    { key: 'vocab', btn: 'laModeVocabBtn', panel: 'laPanelVocab' },
    { key: 'grammar', btn: 'laModeGrammarBtn', panel: 'laPanelGrammar' },
    { key: 'phonics', btn: 'laModePhonicsBtn', panel: 'laPanelPhonics' },
    { key: 'stories', btn: 'laModeStoriesBtn', panel: 'laPanelStories' },
    { key: 'phrases', btn: 'laModePhrasesBtn', panel: 'laPanelPhrases' },
    { key: 'songs', btn: 'laModeSongsBtn', panel: 'laPanelSongs' },
    { key: 'reading', btn: 'laModeReadingBtn', panel: 'laPanelReading' },
  ];
  function setLaHomeMode(mode) {
    LA_HOME_MODES.forEach(m => {
      document.getElementById(m.btn).classList.toggle('active', m.key === mode);
      document.getElementById(m.panel).hidden = m.key !== mode;
    });
    moveSegmentThumb(document.getElementById('laHomeModeToggle'));
  }
  LA_HOME_MODES.forEach(m => document.getElementById(m.btn).addEventListener('click', () => setLaHomeMode(m.key)));

  function laVocabDoneCount() { return LA_TOPICS.filter(t => progress.doneTopics[t.id]).length; }
  function laGrammarDoneCount() { return GRAMMAR_LA_TOPICS.filter(t => progress.doneTopics[t.id]).length; }
  function laPhonicsDoneCount() { return PHONICS3_TOPICS.filter(t => progress.doneTopics[t.id]).length; }
  function laStoryDoneCount() { return STORY_TOPICS_LA.filter(t => progress.doneTopics[t.id]).length; }
  function laPhraseDoneCount() { return PHRASES_LA_TOPICS.filter(t => progress.doneTopics[t.id]).length; }
  function laReadingDoneCount() { return READING_LA_TOPICS.filter(t => progress.doneTopics[t.id]).length; }
  function laLessonsDone() { return laVocabDoneCount() + laGrammarDoneCount() + laPhonicsDoneCount() + laStoryDoneCount() + laPhraseDoneCount() + laReadingDoneCount(); }
  function laLessonsTotal() { return LA_TOPICS.length + GRAMMAR_LA_TOPICS.length + PHONICS3_TOPICS.length + STORY_TOPICS_LA.length + PHRASES_LA_TOPICS.length + READING_LA_TOPICS.length; }

  // Thẻ tóm tắt ở đầu phần Lớp Lá trên trang Học — cùng kiểu choiSummary.
  function renderLaSummary() {
    const el = document.getElementById('laSummary');
    if (!el) return;
    const c = progress.la;
    const next = BADGES.find(b => b.group === 'la' && !progress.badges[b.id]);
    el.innerHTML =
      '<div class="cs-chips">' +
        '<span class="cs-chip">📚 ' + laVocabDoneCount() + '/' + LA_TOPICS.length + ' chủ đề</span>' +
        '<span class="cs-chip">🔤 ' + laGrammarDoneCount() + '/' + GRAMMAR_LA_TOPICS.length + ' bài ngữ pháp</span>' +
        '<span class="cs-chip">🔊 ' + laPhonicsDoneCount() + '/' + PHONICS3_TOPICS.length + ' nhóm âm</span>' +
        '<span class="cs-chip">📗 ' + laStoryDoneCount() + '/' + STORY_TOPICS_LA.length + ' truyện</span>' +
        '<span class="cs-chip">📋 ' + laReadingDoneCount() + '/' + READING_LA_TOPICS.length + ' bài đọc hiểu</span>' +
        '<span class="cs-chip">🗣️ ' + laPhraseDoneCount() + '/' + PHRASES_LA_TOPICS.length + ' cụm từ</span>' +
        '<span class="cs-chip">🔤 ' + c.spellWords + ' từ đã xếp</span>' +
        '<span class="cs-chip">🧩 ' + c.sentencesBuilt + ' câu đã sắp</span>' +
      '</div>' +
      (next ? '<div class="choi-next">🎯 Huy hiệu tiếp theo: <strong>' + next.icon + ' ' + next.label + '</strong> — ' + next.desc + '</div>'
            : '<div class="choi-next">🏅 Bé đã đạt hết huy hiệu của Lớp Lá — giỏi quá!</div>');
  }

  // ---------- NGỮ PHÁP CƠ BẢN (GRAMMAR_LA_TOPICS, data/grammar_la.js, tab Học lớp Lá) ----------
  // Khác các bài từ vựng/ngữ âm: không có thẻ hình từng từ, chỉ có 1 "thẻ quy tắc" (rule) + vài câu ví
  // dụ (dùng lại .sentence-card như tab Câu), rồi làm đố điền từ vào chỗ trống (dùng lại .fillblank-sentence
  // + .blank như Điền từ). Hoàn thành đánh dấu progress.doneTopics như Ngữ âm/Từ hay gặp — không đi qua
  // finishTopic() vì GRAMMAR_LA_TOPICS không nằm trong TOPICS.
  let currentGrammar = null;
  let grammarQuizIndex = 0;
  let grammarQuizCorrectCount = 0;

  function renderGrammarSection() {
    const grid = document.getElementById('grammarTopicGrid');
    if (!grid) return;
    grid.innerHTML = '';
    GRAMMAR_LA_TOPICS.forEach(topic => {
      const done = !!progress.doneTopics[topic.id];
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã học</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.questions.length + ' câu đố</span></span>';
      btn.addEventListener('click', () => startGrammar(topic.id));
      grid.appendChild(btn);
    });
  }

  function startGrammar(topicId) {
    const topic = GRAMMAR_LA_TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    currentGrammar = topic;
    document.getElementById('grammarTitle').textContent = topic.label;
    document.getElementById('grammarRule').textContent = '💡 ' + topic.rule;
    const list = document.getElementById('grammarExamples');
    list.innerHTML = '';
    topic.examples.forEach(ex => {
      const card = document.createElement('div');
      card.className = 'sentence-card';
      card.innerHTML =
        '<span class="sentence-emoji">' + topic.emoji + '</span>' +
        '<span class="sentence-text">' +
          '<span class="sentence-en"><span class="lang-flag">🇬🇧</span>' + ex.en + '</span>' +
          '<span class="sentence-vi"><span class="lang-flag">🇻🇳</span>' + ex.vi + '</span>' +
        '</span>' +
        '<button class="sentence-listen-btn" aria-label="Nghe câu">🔊</button>';
      card.querySelector('.sentence-listen-btn').addEventListener('click', () => speak(ex.en));
      list.appendChild(card);
    });
    showScreen('grammarLearn');
  }

  function startGrammarQuiz() {
    grammarQuizIndex = 0;
    grammarQuizCorrectCount = 0;
    renderGrammarQuizQuestion();
    showScreen('grammarQuiz');
  }

  function renderGrammarQuizQuestion() {
    document.getElementById('grammarQuizFeedback').textContent = '';
    document.getElementById('grammarQuizFeedback').className = 'quiz-feedback';
    document.getElementById('grammarQuizProgressFill').style.width = (grammarQuizIndex / currentGrammar.questions.length) * 100 + '%';
    const q = currentGrammar.questions[grammarQuizIndex];
    document.getElementById('grammarQuizSentence').innerHTML = q.sentence.replace('____', '<span class="blank">____</span>');
    const options = shuffle([q.answer].concat(q.others));
    const wrap = document.getElementById('grammarQuizOptions');
    wrap.innerHTML = '';
    options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'quiz-opt text-opt';
      b.textContent = opt;
      b.addEventListener('click', () => handleGrammarAnswer(b, opt === q.answer));
      wrap.appendChild(b);
    });
  }

  function handleGrammarAnswer(btn, isCorrect) {
    document.querySelectorAll('#grammarQuizOptions .quiz-opt').forEach(o => o.disabled = true);
    const q = currentGrammar.questions[grammarQuizIndex];
    const fb = document.getElementById('grammarQuizFeedback');
    if (isCorrect) {
      btn.classList.add('correct');
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      grammarQuizCorrectCount++;
    } else {
      btn.classList.add('wrong');
      fb.textContent = 'Chưa đúng rồi, đáp án là "' + q.answer + '"';
      fb.className = 'quiz-feedback no';
    }
    setTimeout(() => {
      grammarQuizIndex++;
      if (grammarQuizIndex < currentGrammar.questions.length) renderGrammarQuizQuestion();
      else finishGrammar();
    }, 1100);
  }

  // Không đi qua finishTopic(): tự lo sao thưởng/doneTopics/màn Hoàn thành riêng, giống finishStory().
  // Sao thưởng = 2 sao nền (học xong quy tắc) + số câu đố trả lời đúng.
  function finishGrammar() {
    const total = currentGrammar.questions.length;
    const isPerfect = grammarQuizCorrectCount === total;
    const starsEarned = grammarQuizCorrectCount + 2;
    const oldLifetimeStars = progress.lifetimeStars;
    const isNew = !progress.doneTopics[currentGrammar.id];
    if (isNew) { addStars(starsEarned); progress.doneTopics[currentGrammar.id] = true; }
    if (isPerfect) progress.perfectCount = (progress.perfectCount || 0) + 1;
    saveProgress(progress);
    updateStreakOnComplete();

    document.getElementById('doneTitle').textContent = isPerfect ? 'Xuất sắc! 🌟' : 'Giỏi quá!';
    document.getElementById('doneSubtitle').textContent = 'Bé trả lời đúng ' + grammarQuizCorrectCount + '/' + total + ' câu về "' + currentGrammar.label + '".';
    document.getElementById('earnedStars').textContent = '⭐'.repeat(Math.max(1, starsEarned));
    document.getElementById('parentTip').innerHTML = '💬 Ba mẹ thử ra thêm vài câu có "' + currentGrammar.label + '" để bé luyện nói nhé.';
    document.getElementById('printBtn').hidden = true;
    const replayBtn = document.getElementById('replayBtn');
    replayBtn.textContent = 'Học lại bài này';
    replayBtn.onclick = () => startGrammar(currentGrammar.id);
    renderTotalStars();
    celebrate(isPerfect, oldLifetimeStars, null);
    resetChest();
    showScreen('done');
  }

  document.getElementById('backFromGrammarLearn').addEventListener('click', () => goHome());
  document.getElementById('grammarStartQuizBtn').addEventListener('click', () => startGrammarQuiz());
  document.getElementById('backFromGrammarQuiz').addEventListener('click', () => goHome());

  function renderHome() {
    applyClassScope();
    renderGrammarSection();
    renderPhonics2Section();
    renderChoiVocab();
    renderSightSection();
    renderWriteSection();
    renderSongsSection();
    renderStoryChoiSection();
    renderChoiSummary();
    renderLaVocab();
    renderPhonics3Section();
    renderStoryLaSection();
    renderPhraseSection();
    renderSongsSection('la');
    renderReadingSection();
    renderLaSummary();
    renderPromoCards();
    renderAbcSection();
    renderPhonicsSection();
    renderStorySection();
    const grid = document.getElementById('topicGrid');
    grid.innerHTML = '';
    // Bản đồ hành trình: đánh dấu chủ đề TIẾP THEO bé cần vượt qua (chưa đạt ≥80%) bằng 1 mascot
    // nhảy nhót ở đúng vị trí — dùng topicPassed chứ không phải doneTopics, vì bé có thể đã "học
    // qua" (doneTopics) 1 chủ đề mà chưa đạt yêu cầu, lúc đó chủ đề kế tiếp vẫn đang khoá và mascot
    // không nên nhảy sang đó.
    const nextUpTopic = TOPICS.find(t => t.unlocksAt !== Infinity && !progress.topicPassed[t.id]);
    TOPICS.forEach((topic, i) => {
      const btn = document.createElement('button');
      const isCurrent = !!nextUpTopic && topic.id === nextUpTopic.id;
      btn.className = 'topic-card ' + topic.cls + (progress.doneTopics[topic.id] ? ' is-done' : '') + topicLockClasses(topic) + (isCurrent ? ' is-current' : '');
      btn.innerHTML =
        '<span class="stop-number">' + (i + 1) + '</span>' +
        (isCurrent ? '<span class="current-badge">🦊<small>Bé ở đây!</small></span>' : '') +
        (isTopicLocked(topic) ? topicLockBadgeHtml(topic) : '<span class="done-badge">✓ Đã học</span>') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + (isTopicLocked(topic) ? topicLockReasonText(topic) : topic.words.length + ' từ vựng') + '</span></span>';
      btn.addEventListener('click', () => startTopic(topic.id));
      grid.appendChild(btn);
    });
    // Rương kho báu cuối bản đồ — mở ra khi bé học xong TRỌN VẸN mọi chủ đề hiện có, dùng lại đúng
    // điều kiện của huy hiệu "all_topics" (BADGES) cho nhất quán, không cần thêm cờ theo dõi riêng.
    const treasureFound = TOPICS.every(t => progress.doneTopics[t.id]);
    document.getElementById('treasureChest').classList.toggle('is-open', treasureFound);
    document.getElementById('treasureChestIcon').textContent = treasureFound ? '💰' : '📦';
    document.getElementById('treasureChestLabel').textContent = treasureFound
      ? 'Bé đã tìm ra kho báu, giỏi quá!' : 'Kho báu bí mật — học hết ' + TOPICS.length + ' chủ đề để mở khoá!';
    renderTotalStars();
    renderHomeBanners();
    renderReviewButtons();
    renderDailyMissions();
  }

  // ---------- FLASHCARDS ----------
  let currentTopic = null;
  let cardIndex = 0;

  function startTopic(topicId) {
    // Bảng chữ cái (ABC_TOPICS) tách riêng khỏi TOPICS, luôn mở, không qua khoá tuần tự —
    // check trước, không rơi vào nhánh isTopicLocked() vốn chỉ áp dụng cho 12 chủ đề từ vựng chính.
    const abcTopic = ABC_TOPICS.find(t => t.id === topicId);
    if (abcTopic) {
      currentTopic = abcTopic;
      cardIndex = 0;
      isMixedReview = false;
      renderCard();
      showScreen('cards');
      return;
    }
    // Từ vựng lớp Chồi (CHOI_TOPICS) / lớp Lá (LA_TOPICS) cũng tách khỏi TOPICS: luôn mở sẵn, không khoá tuần tự.
    const advTopic = CHOI_TOPICS.find(t => t.id === topicId) || LA_TOPICS.find(t => t.id === topicId);
    if (advTopic) {
      currentTopic = advTopic;
      cardIndex = 0;
      isMixedReview = false;
      renderCard();
      showScreen('cards');
      return;
    }
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLocked(topic)) { showLockedTopicNotice(topic); return; }
    currentTopic = topic;
    cardIndex = 0;
    isMixedReview = false;
    renderCard();
    showScreen('cards');
  }

  // Độ khó nâng cao cho Lớp Chồi: ẩn nghĩa tiếng Việt trên thẻ học, bé đoán qua hình + chữ tiếng Anh
  // trước rồi mới bấm nút để xem — Lớp Mầm vẫn hiện nghĩa ngay như cũ. Dùng chung cho cả 3 màn thẻ học
  // (Từ vựng, Ngữ âm, Ngữ âm 2) — xem renderCard/renderPhonicsLearnCard.
  function setViHidden(viEl, btnEl, hidden) {
    viEl.classList.toggle('vi-hidden', hidden);
    btnEl.hidden = !hidden;
  }

  function renderCard() {
    const w = currentTopic.words[cardIndex];
    document.getElementById('cardEmoji').textContent = w.emoji;
    document.getElementById('cardWordEn').textContent = w.en;
    document.getElementById('cardWordVi').textContent = w.vi;
    setViHidden(document.getElementById('cardWordVi'), document.getElementById('cardRevealViBtn'), CHOI_TOPICS.includes(currentTopic) || LA_TOPICS.includes(currentTopic));
    const pct = ((cardIndex) / currentTopic.words.length) * 100;
    document.getElementById('cardProgressFill').style.width = pct + '%';
    document.getElementById('prevCardBtn').disabled = cardIndex === 0;
    document.getElementById('nextCardBtn').textContent = (cardIndex === currentTopic.words.length - 1) ? 'Ôn tập →' : 'Tiếp →';
    resetReadAloud();
  }
  document.getElementById('cardRevealViBtn').addEventListener('click', () =>
    setViHidden(document.getElementById('cardWordVi'), document.getElementById('cardRevealViBtn'), false));

  // ---------- MUTE TOGGLE ----------
  const MUTE_KEY = '5phut_muted_v1';
  let isMuted = false;
  try { isMuted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

  function applyMuteUI() {
    const btn = document.getElementById('muteBtn');
    btn.textContent = isMuted ? '🔇' : '🔊';
    btn.classList.toggle('is-muted', isMuted);
    btn.setAttribute('aria-label', isMuted ? 'Bật âm thanh' : 'Tắt âm thanh');
  }
  document.getElementById('muteBtn').addEventListener('click', () => {
    isMuted = !isMuted;
    try { localStorage.setItem(MUTE_KEY, isMuted ? '1' : '0'); } catch (e) {}
    if (isMuted) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    applyMuteUI();
  });
  applyMuteUI();

  // ---------- THEME TOGGLE (sáng / tối / theo máy) ----------
  const THEME_KEY = '5phut_theme_v1';
  let themeMode = 'auto'; // 'auto' | 'light' | 'dark'
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') themeMode = savedTheme;
  } catch (e) {}

  function applyThemeUI() {
    const btn = document.getElementById('themeBtn');
    if (themeMode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      btn.textContent = '☀️';
      btn.setAttribute('aria-label', 'Đang dùng giao diện sáng, bấm để đổi sang tối');
    } else if (themeMode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      btn.textContent = '🌙';
      btn.setAttribute('aria-label', 'Đang dùng giao diện tối, bấm để đổi theo máy');
    } else {
      document.documentElement.removeAttribute('data-theme');
      btn.textContent = '🌗';
      btn.setAttribute('aria-label', 'Đang theo giao diện máy, bấm để đổi sang sáng');
    }
  }
  document.getElementById('themeBtn').addEventListener('click', () => {
    themeMode = themeMode === 'auto' ? 'light' : (themeMode === 'light' ? 'dark' : 'auto');
    try {
      if (themeMode === 'auto') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, themeMode);
    } catch (e) {}
    applyThemeUI();
    showToast(
      themeMode === 'light' ? '☀️ Đã đổi sang giao diện sáng' :
      themeMode === 'dark' ? '🌙 Đã đổi sang giao diện tối' :
      '🌗 Đã đổi theo giao diện máy', '🎨'
    );
  });
  applyThemeUI();

  // Toàn bộ từ vựng + câu đều dùng chung MỘT giọng đọc máy (TTS) chuẩn tiếng Anh (Mỹ),
  // thay vì trộn lẫn file mp3 thu sẵn (nhiều nguồn, nhiều giọng khác nhau) với giọng máy
  // như trước — để bé nghe đồng nhất 1 giọng duy nhất ở mọi nơi trong app.
  const SPEECH_RATE = 0.6;
  let preferredVoice = null;

  function pickPreferredVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    preferredVoice =
      voices.find(v => v.lang === 'en-US' && /Google|Natural|Online|Samantha|Aria|Jenny/i.test(v.name)) ||
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang && v.lang.startsWith('en')) ||
      voices[0];
    return preferredVoice;
  }
  if ('speechSynthesis' in window) {
    pickPreferredVoice();
    window.speechSynthesis.onvoiceschanged = pickPreferredVoice;
  }

  function speak(text) {
    if (isMuted) return;
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = SPEECH_RATE;
      u.pitch = 1;
      const voice = preferredVoice || pickPreferredVoice();
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  document.getElementById('speakBtn').addEventListener('click', () => {
    speak(currentTopic.words[cardIndex].en);
  });
  document.getElementById('prevCardBtn').addEventListener('click', () => {
    if (cardIndex > 0) { cardIndex--; renderCard(); }
  });
  document.getElementById('nextCardBtn').addEventListener('click', () => {
    if (cardIndex < currentTopic.words.length - 1) {
      cardIndex++; renderCard();
    } else {
      startQuiz();
    }
  });
  document.getElementById('backFromCards').addEventListener('click', () => { resetReadAloud(); goHome(); });

  // ---------- ĐỌC THEO CHẤM ĐIỂM (Web Speech API) ----------
  // LƯU Ý: đây KHÔNG phải chấm phát âm chuẩn ngữ âm học (cần AI/server riêng, tốn phí) — chỉ là
  // nhận dạng giọng nói thành văn bản (SpeechRecognition của trình duyệt) rồi so khớp với từ mục
  // tiêu. Đây là cách khả thi duy nhất cho 1 app miễn phí không có backend riêng, vẫn tạo được
  // cảm giác "được chấm điểm khi đọc" cho bé. Tự ẩn nút nếu trình duyệt không hỗ trợ (VD Safari
  // cũ) để không có nút bấm vào không chạy gì.
  // Từng tạm ẩn (2026-09-16) vì hay nhận diện sai — bật lại (2026-09-21) sau khi đổi cách chấm
  // sang xét NHIỀU phương án nhận dạng (maxAlternatives) thay vì chỉ phương án tốt nhất, và nới
  // ngưỡng cho từ ngắn (xem scoreReading/readRecognition.onresult bên dưới).
  const READ_ALOUD_ENABLED = true;
  const SpeechRecognitionCtor = READ_ALOUD_ENABLED ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const readAloudBtn = document.getElementById('readAloudBtn');
  const readFeedbackEl = document.getElementById('readFeedback');
  let readRecognition = null;
  let isListeningRead = false;

  function resetReadAloud() {
    if (readRecognition) { try { readRecognition.abort(); } catch (e) {} }
    isListeningRead = false;
    readAloudBtn.classList.remove('is-listening');
    readAloudBtn.textContent = '🎤 Bé đọc thử';
    readFeedbackEl.hidden = true;
  }

  if (!SpeechRecognitionCtor) {
    readAloudBtn.hidden = true;
  } else {
    function normalizeSpeech(s) {
      return (s || '').toLowerCase().replace(/[^a-z\s]/g, '').trim();
    }
    // Khoảng cách Levenshtein — dùng để chấm "gần đúng" thay vì chỉ đúng/sai tuyệt đối,
    // vì bé đọc gần chuẩn (thiếu/thừa 1-2 ký tự do nhận dạng chưa hoàn hảo) vẫn nên được khích lệ.
    function levenshtein(a, b) {
      const m = a.length, n = b.length;
      const dp = [];
      for (let i = 0; i <= m; i++) dp.push([i].concat(new Array(n).fill(0)));
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
      return dp[m][n];
    }
    function similarity(a, b) {
      if (!a || !b) return 0;
      return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
    }
    function showReadFeedback(text, cls) {
      readFeedbackEl.textContent = text;
      readFeedbackEl.className = 'read-feedback ' + cls;
      readFeedbackEl.hidden = false;
    }
    // Xét CẢ DÀN phương án nhận dạng (không chỉ phương án tốt nhất) rồi lấy điểm giống cao nhất —
    // giọng bé thường khiến engine xếp phương án đúng ở vị trí 2-3 chứ không phải đầu tiên, đây là
    // nguyên nhân chính gây báo sai trước đây. Từ ngắn (<=4 ký tự, chiếm phần lớn từ vựng ở app
    // này) cũng được nới: lệch đúng 1 ký tự vẫn tính "Khá đó" thay vì "Chưa đúng", vì trên từ ngắn
    // 1 ký tự lệch đã kéo tỉ lệ giống (Levenshtein/độ dài) xuống rất thấp dù về cơ bản đọc đúng.
    function scoreReading(transcripts, target) {
      const heardList = (Array.isArray(transcripts) ? transcripts : [transcripts]).map(normalizeSpeech).filter(Boolean);
      const targetNorm = normalizeSpeech(target);
      if (!heardList.length) { showReadFeedback('😶 Chưa nghe rõ, bé đọc to hơn nhé!', 'is-retry'); return; }
      if (heardList.some(h => h === targetNorm || h.split(' ').includes(targetNorm))) {
        showReadFeedback('🌟 Xuất sắc! Đọc chuẩn quá!', 'is-good');
        return;
      }
      const bestSim = Math.max(...heardList.map(h => similarity(h, targetNorm)));
      const closeShortWord = targetNorm.length <= 4 && heardList.some(h => levenshtein(h, targetNorm) <= 1);
      if (bestSim >= 0.55 || closeShortWord) {
        showReadFeedback('👍 Khá đó! Đọc lại cho thật chuẩn nhé.', 'is-okay');
      } else {
        showReadFeedback('🔁 Chưa đúng, bé nghe lại rồi đọc theo nhé!', 'is-retry');
      }
    }

    readAloudBtn.addEventListener('click', () => {
      if (isListeningRead) return;
      const word = currentTopic.words[cardIndex];
      readRecognition = new SpeechRecognitionCtor();
      readRecognition.lang = 'en-US';
      readRecognition.interimResults = false;
      readRecognition.maxAlternatives = 5;

      isListeningRead = true;
      readAloudBtn.classList.add('is-listening');
      readAloudBtn.textContent = '🎤 Đang nghe...';
      readFeedbackEl.hidden = true;

      readRecognition.onresult = (e) => {
        const alternatives = [];
        for (let i = 0; i < e.results[0].length; i++) alternatives.push(e.results[0][i].transcript);
        scoreReading(alternatives, word.en);
      };
      readRecognition.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          showReadFeedback('🎙️ App cần quyền micro để nghe bé đọc nhé!', 'is-retry');
        } else if (e.error === 'no-speech') {
          showReadFeedback('😶 Chưa nghe thấy gì, bé thử đọc to hơn nhé!', 'is-retry');
        } else if (e.error !== 'aborted') {
          showReadFeedback('⚠️ Có lỗi khi nghe, bé thử lại nhé!', 'is-retry');
        }
      };
      readRecognition.onend = () => {
        isListeningRead = false;
        readAloudBtn.classList.remove('is-listening');
        readAloudBtn.textContent = '🎤 Bé đọc thử';
      };
      try { readRecognition.start(); } catch (e) {}
    });
  }

  // ---------- PHONICS (Ngữ âm cơ bản) ----------
  // Màn riêng, KHÔNG dùng chung #screen-cards/#screen-quiz với TOPICS/ABC_TOPICS: bé bấm từng chữ
  // cái để nghe TÊN chữ (học ghép âm), rồi quiz kiểu khác hẳn — cho hình + nghe cả từ, chọn ĐÚNG
  // CHỮ CÁI đầu (không phải chọn hình như quiz thường) — đúng kỹ năng "nhận biết âm đầu" của phonics,
  // khác "Xếp chữ" (Trò chơi) vốn đánh vần lại TOÀN BỘ từ.
  let currentPhonicsTopic = null;
  let phonicsIndex = 0;
  let phonicsQuizIndex = 0;
  let phonicsQuizCorrectCount = 0;
  const PHONICS_DISTRACTOR_LETTERS = ['B','C','D','F','G','H','J','K','L','M','N','P','R','S','T','V','W'];
  // Ngữ âm 2 (Chồi) / Ngữ âm 3 (Lá) đều "nâng cao" hơn Ngữ âm cơ bản của Mầm: ẩn nghĩa tiếng Việt +
  // đố 5 lựa chọn (xem renderPhonicsLearnCard / renderPhonicsQuizQuestion).
  function isAdvancedPhonicsTopic(topic) { return PHONICS2_TOPICS.includes(topic) || PHONICS3_TOPICS.includes(topic); }

  function startPhonicsGroup(topicId) {
    const topic = PHONICS_TOPICS.concat(PHONICS2_TOPICS).concat(PHONICS3_TOPICS).find(t => t.id === topicId);
    if (!topic) return;
    currentPhonicsTopic = topic;
    phonicsIndex = 0;
    const isDigraph = topic.kind === 'digraph'; // nhóm âm ghép: bấm theo "ô âm", hỏi ÂM đầu thay vì chữ đầu
    document.getElementById('phonicsHint').textContent = isDigraph
      ? '👆 Bấm từng ô để nghe âm nhé! (SH, CH, TH là 1 âm — 2 chữ đứng cạnh nhau)'
      : '👆 Bấm từng chữ cái để nghe tên chữ nhé!';
    document.getElementById('phonicsQuizPrompt').textContent = isDigraph ? 'Từ này bắt đầu bằng âm nào?' : 'Từ này bắt đầu bằng chữ gì?';
    renderPhonicsLearnCard();
    showScreen('phonicsLearn');
  }

  function renderPhonicsLearnCard() {
    const w = currentPhonicsTopic.words[phonicsIndex];
    document.getElementById('phonicsCardEmoji').textContent = w.emoji;
    document.getElementById('phonicsCardVi').textContent = w.vi;
    setViHidden(document.getElementById('phonicsCardVi'), document.getElementById('phonicsRevealViBtn'), isAdvancedPhonicsTopic(currentPhonicsTopic));
    const tiles = document.getElementById('phonicsLetterTiles');
    tiles.innerHTML = '';
    (w.units || w.en.split('')).forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'spelling-tile';
      btn.textContent = letter;
      if (letter.length > 1) { // ô âm ghép (SH, CH, EE...) rộng hơn ô chữ đơn
        btn.style.width = 'auto'; btn.style.minWidth = '58px'; btn.style.padding = '0 10px';
      }
      btn.addEventListener('click', () => speak(PHONICS_UNIT_SAY[letter] || letter));
      tiles.appendChild(btn);
    });
    const pct = (phonicsIndex / currentPhonicsTopic.words.length) * 100;
    document.getElementById('phonicsLearnProgressFill').style.width = pct + '%';
    document.getElementById('phonicsPrevBtn').disabled = phonicsIndex === 0;
    document.getElementById('phonicsNextBtn').textContent =
      (phonicsIndex === currentPhonicsTopic.words.length - 1) ? 'Đố vui →' : 'Tiếp →';
  }

  document.getElementById('phonicsBlendBtn').addEventListener('click', () => {
    speak(currentPhonicsTopic.words[phonicsIndex].en);
  });
  document.getElementById('phonicsRevealViBtn').addEventListener('click', () =>
    setViHidden(document.getElementById('phonicsCardVi'), document.getElementById('phonicsRevealViBtn'), false));
  document.getElementById('phonicsPrevBtn').addEventListener('click', () => {
    if (phonicsIndex > 0) { phonicsIndex--; renderPhonicsLearnCard(); }
  });
  document.getElementById('phonicsNextBtn').addEventListener('click', () => {
    if (phonicsIndex < currentPhonicsTopic.words.length - 1) {
      phonicsIndex++;
      renderPhonicsLearnCard();
    } else {
      startPhonicsQuiz();
    }
  });
  document.getElementById('backFromPhonicsLearn').addEventListener('click', () => goHome());

  function startPhonicsQuiz() {
    phonicsQuizIndex = 0;
    phonicsQuizCorrectCount = 0;
    renderPhonicsQuizQuestion();
    showScreen('phonicsQuiz');
  }

  function renderPhonicsQuizQuestion() {
    document.getElementById('phonicsQuizFeedback').textContent = '';
    document.getElementById('phonicsQuizFeedback').className = 'quiz-feedback';
    const pct = (phonicsQuizIndex / currentPhonicsTopic.words.length) * 100;
    document.getElementById('phonicsQuizProgressFill').style.width = pct + '%';

    const word = currentPhonicsTopic.words[phonicsQuizIndex];
    document.getElementById('phonicsQuizEmoji').textContent = word.emoji;
    speak(word.en);

    const correctLetter = (word.units || word.en.split(''))[0]; // chữ đầu, hoặc ô âm ghép đầu (SH/CH/TH)
    const pool = correctLetter.length > 1 ? PHONICS2_DIGRAPH_POOL : PHONICS_DISTRACTOR_LETTERS;
    // Độ khó nâng cao lớp Chồi: đố 5 lựa chọn thay vì 4 (xem PHONICS2_TOPICS — nhóm Ngữ âm 2 của lớp Chồi).
    const wantDistractors = isAdvancedPhonicsTopic(currentPhonicsTopic) ? 4 : 3;
    const letterPool = pool.filter(l => l !== correctLetter);
    const distractors = shuffle(letterPool).slice(0, Math.min(wantDistractors, letterPool.length));
    const options = shuffle([correctLetter, ...distractors]);

    const wrap = document.getElementById('phonicsQuizOptions');
    wrap.innerHTML = '';
    options.forEach(letter => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = letter;
      b.addEventListener('click', () => handlePhonicsQuizAnswer(b, letter === correctLetter));
      wrap.appendChild(b);
    });
  }

  function handlePhonicsQuizAnswer(btn, isCorrect) {
    document.querySelectorAll('#phonicsQuizOptions .quiz-opt').forEach(o => o.disabled = true);
    const fb = document.getElementById('phonicsQuizFeedback');
    if (isCorrect) {
      btn.classList.add('correct');
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      phonicsQuizCorrectCount++;
    } else {
      btn.classList.add('wrong');
      fb.textContent = 'Chưa đúng rồi, thử lại lần sau nhé!';
      fb.className = 'quiz-feedback no';
    }
    setTimeout(() => {
      phonicsQuizIndex++;
      if (phonicsQuizIndex < currentPhonicsTopic.words.length) {
        renderPhonicsQuizQuestion();
      } else {
        finishPhonics();
      }
    }, 1000);
  }

  document.getElementById('phonicsQuizReplayBtn').addEventListener('click', () => {
    speak(currentPhonicsTopic.words[phonicsQuizIndex].en);
  });
  document.getElementById('backFromPhonicsQuiz').addEventListener('click', () => goHome());

  // Không đi qua finishTopic() vì PHONICS_TOPICS không nằm trong TOPICS (giống ABC_TOPICS) — tự lo
  // sao thưởng/doneTopics/màn Hoàn thành riêng, không có "in flashcard" hay "chủ đề tiếp theo".
  function finishPhonics() {
    const totalWords = currentPhonicsTopic.words.length;
    const isPerfect = phonicsQuizCorrectCount === totalWords;
    const oldLifetimeStars = progress.lifetimeStars;
    const isNewGroup = !progress.doneTopics[currentPhonicsTopic.id];
    if (isNewGroup) {
      addStars(phonicsQuizCorrectCount);
      progress.doneTopics[currentPhonicsTopic.id] = true;
    }
    if (isPerfect) progress.perfectCount = (progress.perfectCount || 0) + 1;
    saveProgress(progress);
    updateStreakOnComplete();

    document.getElementById('doneTitle').textContent = isPerfect ? 'Xuất sắc! 🌟' : 'Giỏi quá!';
    document.getElementById('doneSubtitle').textContent =
      'Bé đoán đúng ' + phonicsQuizCorrectCount + '/' + totalWords + ' âm đầu trong nhóm "' + currentPhonicsTopic.label + '".';
    document.getElementById('earnedStars').textContent = '⭐'.repeat(Math.max(1, phonicsQuizCorrectCount));

    const tipWord = currentPhonicsTopic.words[Math.floor(Math.random() * totalWords)];
    document.getElementById('parentTip').innerHTML =
      '💬 Ba mẹ thử hỏi bé: "<strong>' + tipWord.en + '</strong> đánh vần thế nào nhỉ?" (đáp án: <strong>' +
      tipWord.en.split('').join('-') + '</strong>)';

    document.getElementById('printBtn').hidden = true;
    const replayBtn = document.getElementById('replayBtn');
    replayBtn.textContent = 'Học lại nhóm vần này';
    replayBtn.onclick = () => startPhonicsGroup(currentPhonicsTopic.id);

    renderTotalStars();
    celebrate(isPerfect, oldLifetimeStars, null);
    resetChest();
    showScreen('done');
  }

  // ---------- TRUYỆN TRANH SONG NGỮ (STORY_TOPICS, data/stories.js) ----------
  // Màn riêng, không dùng chung #screen-cards/#screen-quiz với TOPICS/ABC_TOPICS: đọc từng trang
  // truyện (emoji + câu tiếng Anh + nghĩa tiếng Việt) rồi trả lời câu hỏi HIỂU TRUYỆN bằng tiếng
  // Việt (không phải chọn nghĩa 1 từ vựng như quiz thường).
  let currentStory = null;
  let storyPageIndex = 0;
  let storyQuizIndex = 0;
  let storyQuizCorrectCount = 0;

  function startStory(topicId) {
    // Tìm ở cả 4 mảng STORY_TOPICS (Mầm) / STORY_TOPICS_CHOI (Chồi) / STORY_TOPICS_LA (Lá, truyện) /
    // READING_LA_TOPICS (Lá, đọc hiểu văn bản thông tin) — dùng chung 1 màn đọc + đố.
    const topic = STORY_TOPICS.find(t => t.id === topicId) || STORY_TOPICS_CHOI.find(t => t.id === topicId) || STORY_TOPICS_LA.find(t => t.id === topicId) || READING_LA_TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    currentStory = topic;
    storyPageIndex = 0;
    renderStoryPage();
    showScreen('storyRead');
  }

  function renderStoryPage() {
    const page = currentStory.pages[storyPageIndex];
    document.getElementById('storyPageEmoji').textContent = page.emoji;
    document.getElementById('storyPageEn').textContent = page.en;
    document.getElementById('storyPageVi').textContent = page.vi;
    speak(page.en);
    const pct = (storyPageIndex / currentStory.pages.length) * 100;
    document.getElementById('storyReadProgressFill').style.width = pct + '%';
    document.getElementById('storyPrevBtn').disabled = storyPageIndex === 0;
    document.getElementById('storyNextBtn').textContent =
      (storyPageIndex === currentStory.pages.length - 1) ? 'Trả lời câu hỏi →' : 'Tiếp →';
  }

  document.getElementById('storyReadSpeakBtn').addEventListener('click', () => {
    speak(currentStory.pages[storyPageIndex].en);
  });
  document.getElementById('storyPrevBtn').addEventListener('click', () => {
    if (storyPageIndex > 0) { storyPageIndex--; renderStoryPage(); }
  });
  document.getElementById('storyNextBtn').addEventListener('click', () => {
    if (storyPageIndex < currentStory.pages.length - 1) {
      storyPageIndex++;
      renderStoryPage();
    } else {
      startStoryQuiz();
    }
  });
  document.getElementById('backFromStoryRead').addEventListener('click', () => goHome());

  function startStoryQuiz() {
    storyQuizIndex = 0;
    storyQuizCorrectCount = 0;
    renderStoryQuizQuestion();
    showScreen('storyQuiz');
  }

  function renderStoryQuizQuestion() {
    document.getElementById('storyQuizFeedback').textContent = '';
    document.getElementById('storyQuizFeedback').className = 'quiz-feedback';
    const pct = (storyQuizIndex / currentStory.questions.length) * 100;
    document.getElementById('storyQuizProgressFill').style.width = pct + '%';

    const question = currentStory.questions[storyQuizIndex];
    document.getElementById('storyQuizQuestion').textContent = question.q;

    const wrap = document.getElementById('storyQuizOptions');
    wrap.innerHTML = '';
    question.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt story-opt';
      b.innerHTML =
        '<span class="story-opt-emoji">' + opt.emoji + '</span>' +
        '<span class="story-opt-en">' + opt.en + '</span>' +
        '<span class="story-opt-vi">' + opt.vi + '</span>';
      b.addEventListener('click', () => handleStoryQuizAnswer(b, i === question.answer));
      wrap.appendChild(b);
    });
  }

  function handleStoryQuizAnswer(btn, isCorrect) {
    document.querySelectorAll('#storyQuizOptions .quiz-opt').forEach(o => o.disabled = true);
    const fb = document.getElementById('storyQuizFeedback');
    if (isCorrect) {
      btn.classList.add('correct');
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      storyQuizCorrectCount++;
    } else {
      btn.classList.add('wrong');
      fb.textContent = 'Chưa đúng rồi, đọc lại truyện lần sau nhé!';
      fb.className = 'quiz-feedback no';
    }
    setTimeout(() => {
      storyQuizIndex++;
      if (storyQuizIndex < currentStory.questions.length) {
        renderStoryQuizQuestion();
      } else {
        finishStory();
      }
    }, 1000);
  }

  document.getElementById('backFromStoryQuiz').addEventListener('click', () => goHome());

  // Không đi qua finishTopic() vì STORY_TOPICS không nằm trong TOPICS (giống ABC_TOPICS/
  // PHONICS_TOPICS) — tự lo sao thưởng/doneTopics/màn Hoàn thành riêng. Sao thưởng = số trang truyện
  // (công đọc hết truyện) + số câu hỏi trả lời đúng (thưởng thêm cho phần hiểu truyện).
  function finishStory() {
    const totalQuestions = currentStory.questions.length;
    const isPerfect = storyQuizCorrectCount === totalQuestions;
    const starsEarned = currentStory.pages.length + storyQuizCorrectCount;
    const oldLifetimeStars = progress.lifetimeStars;
    const isNewStory = !progress.doneTopics[currentStory.id];
    if (isNewStory) {
      addStars(starsEarned);
      progress.doneTopics[currentStory.id] = true;
    }
    if (isPerfect) progress.perfectCount = (progress.perfectCount || 0) + 1;
    saveProgress(progress);
    updateStreakOnComplete();

    const isReading = READING_LA_TOPICS.includes(currentStory);
    document.getElementById('doneTitle').textContent = isPerfect ? 'Xuất sắc! 🌟' : 'Giỏi quá!';
    document.getElementById('doneSubtitle').textContent =
      'Bé trả lời đúng ' + storyQuizCorrectCount + '/' + totalQuestions + (isReading ? ' câu hỏi về văn bản "' : ' câu hỏi về truyện "') + currentStory.label + '".';
    document.getElementById('earnedStars').textContent = '⭐'.repeat(Math.max(1, starsEarned));

    document.getElementById('parentTip').innerHTML = isReading
      ? '💬 Ba mẹ thử hỏi bé lại 1 thông tin trong bài vừa đọc để bé tra cứu và trả lời bằng tiếng Anh nhé.'
      : '💬 Ba mẹ thử hỏi bé: "Trong truyện vừa đọc có những ai/những gì?" để bé kể lại bằng tiếng Anh nhé.';

    document.getElementById('printBtn').hidden = true;
    const replayBtn = document.getElementById('replayBtn');
    replayBtn.textContent = isReading ? 'Đọc lại văn bản này' : 'Đọc lại truyện này';
    replayBtn.onclick = () => startStory(currentStory.id);

    renderTotalStars();
    celebrate(isPerfect, oldLifetimeStars, null);
    resetChest();
    showScreen('done');
  }

  // ---------- QUIZ ----------
  let quizIndex = 0;
  let quizOrder = [];
  let quizCorrectCount = 0;
  let isMixedReview = false;
  let reviewKind = 'mixed'; // 'mixed' | 'smart' | 'difficult' — chọn tiêu đề/gợi ý phù hợp lúc kết thúc
  let quizCurrentWordIdx = null;
  // Trạng thái đúng/sai mới nhất của từng từ trong chủ đề (theo index trong currentTopic.words),
  // dùng để tổng kết cuối bài quiz + cho bé làm lại riêng các từ sai đến khi đúng hết.
  let quizWordStatus = {};

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startQuiz() {
    quizIndex = 0;
    quizCorrectCount = 0;
    quizWordStatus = {};
    quizOrder = shuffle(currentTopic.words.map((_, i) => i));
    renderQuiz();
    showScreen('quiz');
  }

  // Làm lại riêng các từ đã trả lời sai (từ màn tổng kết), không reset trạng thái các từ đã đúng.
  function startQuizRetry(indices) {
    quizIndex = 0;
    quizOrder = shuffle(indices);
    renderQuiz();
    showScreen('quiz');
  }

  // ---------- MIXED-TOPIC REVIEW ----------
  // Ôn tập tổng hợp: gom từ vựng từ tất cả chủ đề bé đã học xong vào 1 bài quiz,
  // giúp chống quên thay vì chỉ ôn trong phạm vi 1 chủ đề.
  function startMixedReview() {
    const pool = [];
    vocabTopicsOf(reviewClassId()).forEach(t => { if (progress.doneTopics[t.id]) pool.push(...t.words); });
    if (pool.length < 4) {
      alert('Bé cần học xong ít nhất 1 chủ đề trước khi ôn tập tổng hợp nhé!');
      return;
    }
    currentTopic = { id: '__mixed__', label: 'Ôn tập tổng hợp', words: shuffle(pool).slice(0, Math.min(10, pool.length)) };
    isMixedReview = true;
    reviewKind = 'mixed';
    startQuiz();
  }

  document.getElementById('mixedReviewBtn').addEventListener('click', startMixedReview);

  // Ôn tập thông minh: chỉ hỏi lại đúng những từ đã "đến hạn" theo lịch ghi nhớ ngắt quãng
  // (xem recordWordAnswer/getDueWords) — đúng lúc bé sắp quên, hiệu quả hơn ôn ngẫu nhiên.
  function startSmartReview() {
    const dueWords = getDueWords(12);
    if (!dueWords.length) { showToast('Chưa có từ nào đến hạn ôn lại, bé học tiếp đã nhé!', '🧠'); return; }
    currentTopic = { id: '__smart__', label: 'Ôn tập thông minh', words: dueWords };
    isMixedReview = true;
    reviewKind = 'smart';
    startQuiz();
  }
  document.getElementById('smartReviewBtn').addEventListener('click', startSmartReview);

  // Luyện riêng các từ bé hay trả lời sai (gộp từ mọi chế độ: Học, Tính giờ, Xếp chữ, Đoán nghĩa...).
  function startDifficultReview() {
    const words = getDifficultWords(12);
    if (!words.length) { showToast('Bé chưa có từ nào hay sai cả, giỏi quá! 🎉', '📌'); return; }
    currentTopic = { id: '__difficult__', label: 'Luyện từ khó', words: words };
    isMixedReview = true;
    reviewKind = 'difficult';
    startQuiz();
  }
  document.getElementById('difficultReviewBtn').addEventListener('click', startDifficultReview);

  function renderQuiz() {
    document.getElementById('quizFeedback').textContent = '';
    document.getElementById('quizFeedback').className = 'quiz-feedback';
    const pct = (quizIndex / quizOrder.length) * 100;
    document.getElementById('quizProgressFill').style.width = pct + '%';

    const wIdx = quizOrder[quizIndex];
    quizCurrentWordIdx = wIdx;
    const correctWord = currentTopic.words[wIdx];
    document.getElementById('quizWord').textContent = correctWord.en;
    speak(correctWord.en);

    // Độ khó nâng cao lớp Chồi/Lá: đố 5 lựa chọn thay vì 4 (khó đoán mò hơn) — xem isAdvancedVocabWord.
    const wantDistractors = isAdvancedVocabWord(correctWord) ? 4 : 3;
    const pool = currentTopic.words.filter((_, i) => i !== wIdx);
    const distractors = shuffle(pool).slice(0, Math.min(wantDistractors, pool.length));
    const options = shuffle([correctWord, ...distractors]);

    const wrap = document.getElementById('quizOptions');
    wrap.innerHTML = '';
    options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = opt.emoji;
      b.addEventListener('click', () => handleQuizAnswer(b, opt.en === correctWord.en));
      wrap.appendChild(b);
    });
  }

  function handleQuizAnswer(btn, isCorrect) {
    const allOpts = document.querySelectorAll('.quiz-opt');
    allOpts.forEach(o => o.disabled = true);
    const fb = document.getElementById('quizFeedback');
    if (!isMixedReview) quizWordStatus[quizCurrentWordIdx] = isCorrect;
    recordWordAnswer(currentTopic.words[quizCurrentWordIdx], isCorrect);
    if (isCorrect) {
      btn.classList.add('correct');
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      quizCorrectCount++;
    } else {
      btn.classList.add('wrong');
      fb.textContent = 'Chưa đúng rồi, thử lại lần sau nhé!';
      fb.className = 'quiz-feedback no';
    }
    setTimeout(() => {
      quizIndex++;
      if (quizIndex < quizOrder.length) {
        renderQuiz();
      } else if (isMixedReview) {
        finishReviewSession();
      } else {
        showQuizRecap();
      }
    }, 1000);
  }

  // ---------- QUIZ RECAP (tổng kết đúng/sai + làm lại từ sai) ----------
  function showQuizRecap() {
    const wrongIndices = currentTopic.words.map((_, i) => i).filter(i => quizWordStatus[i] === false);
    renderQuizRecap(wrongIndices);
    showScreen('quizRecap');
  }

  function renderQuizRecap(wrongIndices) {
    const total = currentTopic.words.length;
    const correctCount = total - wrongIndices.length;
    document.getElementById('recapSummary').textContent =
      wrongIndices.length === 0
        ? 'Bé làm đúng hết ' + total + '/' + total + ' từ rồi, giỏi quá! 🎉'
        : 'Bé đã làm đúng ' + correctCount + '/' + total + ' từ. Cùng làm lại các từ sai nhé!';

    const list = document.getElementById('recapList');
    list.innerHTML = '';
    currentTopic.words.forEach((w, i) => {
      const ok = quizWordStatus[i] !== false;
      const row = document.createElement('div');
      row.className = 'recap-row' + (ok ? ' is-ok' : ' is-wrong');
      row.innerHTML =
        '<span class="recap-icon">' + (ok ? '✅' : '❌') + '</span>' +
        '<span class="recap-emoji">' + w.emoji + '</span>' +
        '<span class="recap-word">' + w.en + ' <span class="recap-vi">(' + w.vi + ')</span></span>';
      list.appendChild(row);
    });

    const retryBtn = document.getElementById('recapRetryBtn');
    const continueBtn = document.getElementById('recapContinueBtn');
    if (wrongIndices.length > 0) {
      retryBtn.hidden = false;
      retryBtn.textContent = '🔁 Làm lại ' + wrongIndices.length + ' từ sai';
      retryBtn.onclick = () => startQuizRetry(wrongIndices);
      continueBtn.textContent = 'Bỏ qua, học tiếp';
    } else {
      retryBtn.hidden = true;
      continueBtn.textContent = 'Tuyệt vời, học tiếp! 🎉';
    }
    continueBtn.onclick = () => { matchMode = 'learn'; startMatchGame(); };
  }

  document.getElementById('backFromQuizRecap').addEventListener('click', () => goHome());

  document.getElementById('backFromQuiz').addEventListener('click', () => showScreen(isMixedReview ? 'progress' : 'home'));

  // ---------- MATCHING GAME (nối cột: cột trái hình, cột phải chữ, hiện sẵn hết) ----------
  // matchMode: 'learn' (sau flashcard+quiz, được tính sao) hoặc 'practice' (chơi tự do từ tab Trò chơi, không tính sao)
  let matchMode = 'learn';
  let matchWords = [];
  let matchLeftCards = []; // [{ pairId, content: emoji, matched }], thứ tự đã xáo riêng
  let matchRightCards = []; // [{ pairId, content: en, matched }], thứ tự đã xáo riêng (khác cột trái)
  let matchSelectedLeft = null; // index trong matchLeftCards đang chọn, hoặc null
  let matchSelectedRight = null; // index trong matchRightCards đang chọn, hoặc null
  let matchWrong = false; // true trong lúc đang hiện đỏ cặp nối sai, trước khi tự bỏ chọn
  let matchFoundCount = 0;
  let matchLock = false;

  function startPracticeMatch(topicId) {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLockedForPractice(topic)) { showLockedPracticeTopicNotice(topic); return; }
    currentTopic = topic;
    matchMode = 'practice';
    startMatchGame();
  }

  function startMatchGame() {
    matchFoundCount = 0;
    matchSelectedLeft = null;
    matchSelectedRight = null;
    matchWrong = false;
    matchLock = false;
    document.getElementById('matchWrap').hidden = false;
    document.getElementById('matchDoneWrap').hidden = true;
    matchWords = shuffle(currentTopic.words); // lấy hết toàn bộ từ vựng của chủ đề, không bỏ từ nào
    // Xáo 2 cột độc lập với nhau, để hàng trái/phải không tình cờ thẳng hàng theo đúng cặp.
    matchLeftCards = shuffle(matchWords.map((w, i) => ({ pairId: i, content: w.emoji, matched: false })));
    matchRightCards = shuffle(matchWords.map((w, i) => ({ pairId: i, content: w.en, matched: false })));
    renderMatchGame();
    showScreen('match');
    // Lần vẽ đầu màn hình còn ẩn (bề rộng thẻ = 0) nên chưa tính được cỡ chữ — tính lại khi đã hiện.
    fitMatchWordCards(document.getElementById('matchGridRight'));
  }

  function renderMatchGame() {
    const pct = (matchFoundCount / matchWords.length) * 100;
    document.getElementById('matchProgressFill').style.width = pct + '%';

    const leftGrid = document.getElementById('matchGridLeft');
    const rightGrid = document.getElementById('matchGridRight');
    leftGrid.innerHTML = '';
    rightGrid.innerHTML = '';

    matchLeftCards.forEach((card, idx) => {
      const btn = document.createElement('button');
      btn.className = 'match-card match-card--emoji'
        + (card.matched ? ' is-matched' : '')
        + (idx === matchSelectedLeft ? (matchWrong ? ' is-wrong' : ' is-selected') : '');
      btn.textContent = card.content;
      btn.disabled = card.matched;
      btn.addEventListener('click', () => handleMatchClick('left', idx));
      leftGrid.appendChild(btn);
    });

    matchRightCards.forEach((card, idx) => {
      const btn = document.createElement('button');
      btn.className = 'match-card match-card--word'
        + (card.matched ? ' is-matched' : '')
        + (idx === matchSelectedRight ? (matchWrong ? ' is-wrong' : ' is-selected') : '');
      btn.textContent = card.content;
      btn.disabled = card.matched;
      btn.addEventListener('click', () => handleMatchClick('right', idx));
      rightGrid.appendChild(btn);
    });
    fitMatchWordCards(rightGrid);
  }

  // Thẻ chữ chỉ rộng ~1/4 màn hình nên cỡ chữ cố định sẽ tràn với từ dài (HELICOPTER, WATERMELON...).
  // Tính cỡ chữ cho từng thẻ theo bề rộng thẻ thật đang hiển thị và số chữ cái (≈0.66em/chữ in hoa),
  // chặn trong khoảng 10–20px: từ ngắn vẫn to rõ, từ dài tự thu nhỏ vừa 1 dòng.
  function fitMatchWordCards(grid) {
    const first = grid.firstElementChild;
    if (!first || !first.clientWidth) return;
    const usable = first.clientWidth - 14; // trừ viền 3px x2 + đệm 2px x2 + chút dư
    Array.from(grid.children).forEach(btn => {
      const len = Math.max(btn.textContent.length, 1);
      btn.style.fontSize = Math.max(10, Math.min(20, usable / (len * 0.66))) + 'px';
    });
  }

  function handleMatchClick(side, idx) {
    if (matchLock) return;
    if (side === 'left') {
      if (matchLeftCards[idx].matched) return;
      matchSelectedLeft = idx;
    } else {
      if (matchRightCards[idx].matched) return;
      matchSelectedRight = idx;
    }
    renderMatchGame();

    if (matchSelectedLeft === null || matchSelectedRight === null) return;

    const l = matchLeftCards[matchSelectedLeft];
    const r = matchRightCards[matchSelectedRight];
    if (l.pairId === r.pairId) {
      l.matched = true;
      r.matched = true;
      matchFoundCount++;
      matchSelectedLeft = null;
      matchSelectedRight = null;
      renderMatchGame();
      if (matchFoundCount === matchWords.length) {
        if (matchMode === 'practice') {
          setTimeout(() => {
            document.getElementById('matchWrap').hidden = true;
            document.getElementById('matchDoneWrap').hidden = false;
            document.getElementById('matchDoneText').textContent =
              'Bé đã ghép đúng hết cả ' + matchWords.length + ' cặp rồi đó!';
            bumpDailyMission('games');
            saveProgress(progress);
          }, 500);
        } else {
          setTimeout(finishTopic, 600);
        }
      }
    } else {
      matchLock = true;
      matchWrong = true;
      renderMatchGame();
      setTimeout(() => {
        matchSelectedLeft = null;
        matchSelectedRight = null;
        matchWrong = false;
        matchLock = false;
        renderMatchGame();
      }, 700);
    }
  }

  document.getElementById('backFromMatch').addEventListener('click', () => {
    showScreen(matchMode === 'practice' ? 'games' : 'home');
  });
  document.getElementById('matchReplayBtn').addEventListener('click', () => startMatchGame());
  document.getElementById('matchOtherTopicBtn').addEventListener('click', () => showScreen('games'));

  // ---------- TIẾN ĐỘ RIÊNG CỦA LỚP CHỒI ----------
  // Ngữ âm 2 tự lưu vào progress.doneTopics như mọi bài học có đáp án (xem finishPhonics). Xếp chữ và
  // Ghép câu của lớp Chồi là bài luyện tự do nên lưu riêng ở progress.choi:
  //   spellWords / sentencesBuilt: tổng số từ đã xếp đúng / câu đã ghép đúng (để mở huy hiệu);
  //   spellTopics / sentenceGroups: chủ đề / nhóm câu đã hoàn thành ít nhất 1 lượt (để hiện "✓ Đã chơi").
  // Hoàn thành 1 lượt là tính vào chuỗi ngày + nhiệm vụ "học 1 lượt" (như Ngữ âm), lần ĐẦU hoàn thành
  // mỗi chủ đề / nhóm câu được thưởng CHOI_FIRST_ROUND_STARS sao — chơi lại bao nhiêu lần cũng không
  // nhận thêm, nên bé không thể "cày" sao.
  function finishChoiRound(kind, groupId, msgEl, baseText) {
    const c = progress.choi;
    const seen = { spell: c.spellTopics, sentence: c.sentenceGroups, memory: c.memoryTopics, write: c.writeGroups, simon: c.simonPlayed, song: c.songsPlayed }[kind];
    const oldLifetimeStars = progress.lifetimeStars;
    const isFirst = !seen[groupId];
    if (isFirst) { seen[groupId] = true; addStars(CHOI_FIRST_ROUND_STARS); }
    if (kind === 'sentence') bumpDailyMission('sentences');
    updateStreakOnComplete();
    celebrate(false, oldLifetimeStars, null); // mở huy hiệu mới / lên cấp nếu có
    saveProgress(progress);
    renderChoiSpellGrid();
    renderChoiSentenceGrid();
    renderWriteSection();
    renderSongsSection();
    renderChoiSummary();
    renderPromoCards();
    if (msgEl) msgEl.textContent = baseText + (isFirst ? ' Nhận thêm ⭐ ' + CHOI_FIRST_ROUND_STARS + ' sao vì lần đầu hoàn thành nhóm này!' : '');
  }

  // ---------- TIẾN ĐỘ RIÊNG CỦA LỚP LÁ (Xếp chữ dài + Sắp xếp câu, cả 2 đều ở tab Trò chơi) ----------
  // Giống hệt finishChoiRound nhưng chỉ 2 kind (không có memory/write/simon/song vì Lá chưa có các
  // trò đó) và bumpDailyMission('games') thay vì ('sentences') cho kind 'sentence' — vì Sắp xếp câu
  // của Lá sống ở tab Trò chơi (Lá chưa có tab Câu), khác Ghép câu của Chồi sống ở tab Câu.
  function finishLaRound(kind, groupId, msgEl, baseText) {
    const c = progress.la;
    // spell/sentence sống ở tab Trò chơi (bumpDailyMission 'games'); qa/dialogue/write sống ở tab Câu
    // (bumpDailyMission 'sentences') — 2 tab khác nhau nên 2 nhiệm vụ hằng ngày khác nhau.
    const seen = { spell: c.spellTopics, sentence: c.sentenceGroups, qa: c.qaGroups, dialogue: c.dialogueGroups, write: c.writeSentGroups, paragraph: c.paragraphGroups, memory: c.memoryTopics, simon: c.simonPlayed, song: c.songsPlayed }[kind];
    const oldLifetimeStars = progress.lifetimeStars;
    const isFirst = !seen[groupId];
    if (isFirst) { seen[groupId] = true; addStars(CHOI_FIRST_ROUND_STARS); }
    if (kind === 'sentence') bumpDailyMission('games');
    else if (kind === 'qa' || kind === 'dialogue' || kind === 'write' || kind === 'paragraph') bumpDailyMission('sentences');
    updateStreakOnComplete();
    celebrate(false, oldLifetimeStars, null); // mở huy hiệu mới / lên cấp nếu có
    saveProgress(progress);
    renderLaGamesGrid();
    renderLaSentencesGrid();
    renderLaSummary();
    if (msgEl) msgEl.textContent = baseText + (isFirst ? ' Nhận thêm ⭐ ' + CHOI_FIRST_ROUND_STARS + ' sao vì lần đầu hoàn thành nhóm này!' : '');
  }

  function choiVocabDoneCount() {
    return CHOI_TOPICS.filter(t => progress.doneTopics[t.id]).length;
  }
  function choiSightDoneCount() { return SIGHT_TOPICS.filter(t => progress.doneTopics[t.id]).length; }
  function choiWriteDoneCount() { return WRITE_GROUPS.filter(g => progress.choi.writeGroups[g.id]).length; }
  function choiStoryDoneCount() { return STORY_TOPICS_CHOI.filter(t => progress.doneTopics[t.id]).length; }
  // Tổng số bài học (không tính trò chơi) của lớp Chồi bé đã hoàn thành / tổng số bài.
  function choiLessonsDone() { return choiVocabDoneCount() + choiPhonicsDoneCount() + choiSightDoneCount() + choiWriteDoneCount() + choiStoryDoneCount(); }
  function choiLessonsTotal() { return CHOI_TOPICS.length + PHONICS2_TOPICS.length + SIGHT_TOPICS.length + WRITE_GROUPS.length + STORY_TOPICS_CHOI.length; }
  function choiPhonicsDoneCount() {
    return PHONICS2_TOPICS.filter(t => progress.doneTopics[t.id]).length;
  }

  // Thẻ tóm tắt ở đầu phần Lớp Chồi trên trang Học: bé thấy ngay mình đã làm được bao nhiêu + huy hiệu kế tiếp.
  function renderChoiSummary() {
    const el = document.getElementById('choiSummary');
    if (!el) return;
    const c = progress.choi;
    const next = BADGES.find(b => b.group === 'choi' && !progress.badges[b.id]);
    el.innerHTML =
      '<div class="cs-chips">' +
        '<span class="cs-chip">📚 ' + choiVocabDoneCount() + '/' + CHOI_TOPICS.length + ' chủ đề</span>' +
        '<span class="cs-chip">🔊 ' + choiPhonicsDoneCount() + '/' + PHONICS2_TOPICS.length + ' nhóm âm</span>' +
        '<span class="cs-chip">👀 ' + choiSightDoneCount() + '/' + SIGHT_TOPICS.length + ' từ hay gặp</span>' +
        '<span class="cs-chip">✍️ ' + choiWriteDoneCount() + '/' + WRITE_GROUPS.length + ' nhóm chữ</span>' +
        '<span class="cs-chip">📗 ' + choiStoryDoneCount() + '/' + STORY_TOPICS_CHOI.length + ' truyện</span>' +
        '<span class="cs-chip">🔤 ' + c.spellWords + ' từ đã xếp</span>' +
        '<span class="cs-chip">🧩 ' + c.sentencesBuilt + ' câu đã ghép</span>' +
      '</div>' +
      (next ? '<div class="choi-next">🎯 Huy hiệu tiếp theo: <strong>' + next.icon + ' ' + next.label + '</strong> — ' + next.desc + '</div>'
            : '<div class="choi-next">🏅 Bé đã đạt hết huy hiệu của Lớp Chồi — giỏi quá!</div>');
  }

  // Số liệu thứ 2 trên bảng chứng nhận / ảnh chia sẻ: lớp Chồi/Lá tính theo tổng số bài đã học, lớp Mầm theo chủ đề từ vựng.
  function getClassStat() {
    const cls = getActiveClassId();
    if (cls === 'choi') return { icon: '📖', value: choiLessonsDone() + '/' + choiLessonsTotal(), label: 'Bài đã học' };
    if (cls === 'la') return { icon: '📖', value: laLessonsDone() + '/' + laLessonsTotal(), label: 'Bài đã học' };
    return { icon: '📚', value: TOPICS.filter(t => progress.doneTopics[t.id]).length + '/' + TOPICS.length, label: 'Chủ đề' };
  }

  function progressRowHtml(emoji, label, done, doneText, todoText) {
    return '<div class="progress-row' + (done ? ' is-done' : '') + '">' +
      '<span class="pr-emoji">' + emoji + '</span><span class="pr-label">' + label + '</span>' +
      '<span class="pr-status">' + (done ? doneText : todoText) + '</span></div>';
  }

  // ---------- BÀI HÁT (lớp Chồi, tab Học) ----------
  // 6 bài đồng dao tiếng Anh cổ điển (SONGS_CHOI, data/songs_choi.js), không có file nhạc thật —
  // nghe bằng giọng đọc máy (TTS), giống cách các dòng câu ở tab Câu dùng chung .sentence-card/.sentence-list.
  // Không phải bài học có đáp án nên bé bấm "Xong" để tự báo đã hát xong (không tự dò xem TTS đã đọc hết chưa,
  // vì onend của SpeechSynthesis không đáng tin cậy trên mọi trình duyệt/WebView).
  // classId 'choi' (mặc định): SONGS_CHOI, lưới #songsTopicGrid, progress.choi.songsPlayed.
  // classId 'la': SONGS_LA (6 bài khác hẳn, không trùng), lưới #songsLaTopicGrid, progress.la.songsPlayed.
  let songId = null;
  let songClassId = 'choi';
  function renderSongsSection(classId) {
    classId = classId || 'choi';
    const grid = document.getElementById(classId === 'la' ? 'songsLaTopicGrid' : 'songsTopicGrid');
    if (!grid) return;
    const songs = classId === 'la' ? SONGS_LA : SONGS_CHOI;
    const played = classId === 'la' ? progress.la.songsPlayed : progress.choi.songsPlayed;
    grid.innerHTML = '';
    songs.forEach(song => {
      const done = !!played[song.id];
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + song.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã hát</span>' : '') +
        '<span class="emoji">' + song.emoji + '</span>' +
        '<span><span class="label">' + song.titleVi + '</span><br>' +
        '<span class="count">' + song.lines.length + ' câu' + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
      btn.addEventListener('click', () => startSong(song.id, classId));
      grid.appendChild(btn);
    });
  }

  function startSong(id, classId) {
    classId = classId || 'choi';
    const song = (classId === 'la' ? SONGS_LA : SONGS_CHOI).find(s => s.id === id);
    if (!song) return;
    songId = id;
    songClassId = classId;
    document.getElementById('songTitle').textContent = song.title + ' 🎵 ' + song.titleVi;
    const list = document.getElementById('songLineList');
    list.innerHTML = '';
    song.lines.forEach((line, i) => {
      const card = document.createElement('div');
      card.className = 'sentence-card';
      card.dataset.songLine = i;
      card.innerHTML =
        '<span class="sentence-emoji">🎵</span>' +
        '<span class="sentence-text">' +
          '<span class="sentence-en"><span class="lang-flag">🇬🇧</span>' + line.en + '</span>' +
          '<span class="sentence-vi"><span class="lang-flag">🇻🇳</span>' + line.vi + '</span>' +
        '</span>' +
        '<button class="sentence-listen-btn" aria-label="Nghe câu">🔊</button>';
      card.querySelector('.sentence-listen-btn').addEventListener('click', () => speak(line.en));
      list.appendChild(card);
    });
    document.getElementById('songDoneMsg').textContent = '';
    showScreen('songPlay');
  }

  // Đọc lần lượt từng câu, tô sáng câu đang hát để bé dễ dõi theo lời — chờ cố định theo độ dài câu
  // (không dựa vào sự kiện 'end' của SpeechSynthesis vì không đáng tin cậy trên mọi thiết bị).
  let songPlayToken = 0;
  async function playSongAll() {
    const song = (songClassId === 'la' ? SONGS_LA : SONGS_CHOI).find(s => s.id === songId);
    if (!song) return;
    const myToken = ++songPlayToken;
    const cards = document.querySelectorAll('#songLineList .sentence-card');
    for (let i = 0; i < song.lines.length; i++) {
      if (myToken !== songPlayToken) return; // bé đã bấm phát lại hoặc rời màn giữa chừng
      cards.forEach(c => c.classList.remove('is-playing'));
      if (cards[i]) cards[i].classList.add('is-playing');
      if (cards[i]) cards[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
      speak(song.lines[i].en);
      const waitMs = Math.max(1400, song.lines[i].en.length * 65);
      await new Promise(r => setTimeout(r, waitMs));
    }
    if (myToken === songPlayToken) cards.forEach(c => c.classList.remove('is-playing'));
  }

  function finishSong() {
    const msgEl = document.getElementById('songDoneMsg');
    if (songClassId === 'la') finishLaRound('song', songId, msgEl, 'Bé đã hát xong bài này rồi!');
    else finishChoiRound('song', songId, msgEl, 'Bé đã hát xong bài này rồi!');
  }

  document.getElementById('backFromSong').addEventListener('click', () => { songPlayToken++; showScreen('home'); });
  document.getElementById('songPlayAllBtn').addEventListener('click', () => playSongAll());
  document.getElementById('songDoneBtn').addEventListener('click', () => finishSong());

  // ---------- TỪ HAY GẶP / CỤM TỪ THÔNG DỤNG (lớp Chồi + lớp Lá, tab Học) ----------
  // Từ hay gặp (Chồi, SIGHT_TOPICS): 9 nhóm × 8 từ đơn. Cụm từ thông dụng (Lá, PHRASES_LA_TOPICS):
  // 5 nhóm × 6 cụm/câu nguyên vẹn — CÙNG shape { en, vi, example, exampleVi } nên dùng lại NGUYÊN màn
  // học/đố (renderSightCard/startSightQuiz/renderSightQuestion/handleSightAnswer/finishSight bên dưới
  // đều thao tác trên "currentSight" một cách chung chung, không hardcode SIGHT_TOPICS ở đâu khác
  // ngoài startSight() — chỉ cần truyền mảng chủ đề khác là dùng lại được hết). Không có hình nên có
  // màn riêng: thẻ chữ (nghe + câu ví dụ + nghĩa) rồi đố "nghe, chọn đúng". Xong nhóm lần đầu: thưởng
  // sao = số câu đúng, đánh dấu progress.doneTopics[id] (giống Ngữ âm) — không đi qua finishTopic.
  let currentSight = null;
  let sightIndex = 0;
  let sightOrder = [];
  let sightQuizIndex = 0;
  let sightCorrect = 0;

  function renderSightGrid(topics, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    topics.forEach(topic => {
      const done = !!progress.doneTopics[topic.id];
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã học</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + topic.words.length + (topics === PHRASES_LA_TOPICS ? ' cụm' : ' từ') + '</span></span>';
      btn.addEventListener('click', () => startSight(topic.id, topics));
      grid.appendChild(btn);
    });
  }
  function renderSightSection() { renderSightGrid(SIGHT_TOPICS, 'sightTopicGrid'); }
  function renderPhraseSection() { renderSightGrid(PHRASES_LA_TOPICS, 'phraseTopicGrid'); }

  function startSight(topicId, topicsArr) {
    const topic = (topicsArr || SIGHT_TOPICS).find(t => t.id === topicId);
    if (!topic) return;
    currentSight = topic;
    sightIndex = 0;
    document.getElementById('sightLearn').hidden = false;
    document.getElementById('sightQuiz').hidden = true;
    renderSightCard();
    showScreen('sight');
  }

  function renderSightCard() {
    const w = currentSight.words[sightIndex];
    document.getElementById('sightWord').textContent = w.en;
    document.getElementById('sightVi').textContent = w.vi;
    document.getElementById('sightExample').textContent = w.example;
    document.getElementById('sightExampleVi').textContent = w.exampleVi;
    document.getElementById('sightProgressFill').style.width = (sightIndex / currentSight.words.length) * 100 + '%';
    document.getElementById('sightPrevBtn').disabled = sightIndex === 0;
    document.getElementById('sightNextBtn').textContent = sightIndex === currentSight.words.length - 1 ? 'Đố vui →' : 'Tiếp →';
    setTimeout(() => { if (currentSight && currentSight.words[sightIndex] === w) speak(w.en); }, 200);
  }

  document.getElementById('sightSpeakBtn').addEventListener('click', () => speak(currentSight.words[sightIndex].en));
  document.getElementById('sightSpeakSentBtn').addEventListener('click', () => speak(currentSight.words[sightIndex].example));
  document.getElementById('sightPrevBtn').addEventListener('click', () => { if (sightIndex > 0) { sightIndex--; renderSightCard(); } });
  document.getElementById('sightNextBtn').addEventListener('click', () => {
    if (sightIndex < currentSight.words.length - 1) { sightIndex++; renderSightCard(); }
    else startSightQuiz();
  });
  document.getElementById('backFromSight').addEventListener('click', () => goHome());

  function startSightQuiz() {
    sightOrder = shuffle(currentSight.words.map((_, i) => i));
    sightQuizIndex = 0;
    sightCorrect = 0;
    document.getElementById('sightLearn').hidden = true;
    document.getElementById('sightQuiz').hidden = false;
    renderSightQuestion();
  }

  function renderSightQuestion() {
    document.getElementById('sightFeedback').textContent = '';
    document.getElementById('sightFeedback').className = 'quiz-feedback';
    document.getElementById('sightProgressFill').style.width = (sightQuizIndex / sightOrder.length) * 100 + '%';
    const word = currentSight.words[sightOrder[sightQuizIndex]];
    // Từ hay gặp/Cụm từ chỉ có ở lớp Chồi/Lá (không phải Mầm) nên luôn đố khó hơn: 5 lựa chọn thay vì 4.
    const othersPool = currentSight.words.filter(w => w !== word);
    const others = shuffle(othersPool).slice(0, Math.min(4, othersPool.length));
    const wrap = document.getElementById('sightOptions');
    wrap.innerHTML = '';
    shuffle([word].concat(others)).forEach(opt => {
      const b = document.createElement('button');
      b.className = 'quiz-opt text-opt';
      b.textContent = opt.en;
      b.addEventListener('click', () => handleSightAnswer(b, opt === word));
      wrap.appendChild(b);
    });
    setTimeout(() => { if (currentSight && sightOrder[sightQuizIndex] !== undefined && currentSight.words[sightOrder[sightQuizIndex]] === word) speak(word.en); }, 250);
  }

  function handleSightAnswer(btn, isCorrect) {
    document.querySelectorAll('#sightOptions .quiz-opt').forEach(o => { o.disabled = true; });
    const fb = document.getElementById('sightFeedback');
    if (isCorrect) {
      btn.classList.add('correct');
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      sightCorrect++;
    } else {
      btn.classList.add('wrong');
      fb.textContent = 'Chưa đúng rồi, thử lại lần sau nhé!';
      fb.className = 'quiz-feedback no';
    }
    setTimeout(() => {
      sightQuizIndex++;
      if (sightQuizIndex < sightOrder.length) renderSightQuestion(); else finishSight();
    }, 1000);
  }
  document.getElementById('sightReplayBtn').addEventListener('click', () => speak(currentSight.words[sightOrder[sightQuizIndex]].en));

  function finishSight() {
    const total = currentSight.words.length;
    const isPerfect = sightCorrect === total;
    const oldLifetimeStars = progress.lifetimeStars;
    const isNew = !progress.doneTopics[currentSight.id];
    if (isNew) { addStars(sightCorrect); progress.doneTopics[currentSight.id] = true; }
    if (isPerfect) progress.perfectCount = (progress.perfectCount || 0) + 1;
    saveProgress(progress);
    updateStreakOnComplete();

    const isPhrase = PHRASES_LA_TOPICS.includes(currentSight);
    document.getElementById('doneTitle').textContent = isPerfect ? 'Xuất sắc! 🌟' : 'Giỏi quá!';
    document.getElementById('doneSubtitle').textContent = 'Bé nhận ra đúng ' + sightCorrect + '/' + total + (isPhrase ? ' cụm' : ' từ') + ' trong nhóm "' + currentSight.label + '".';
    document.getElementById('earnedStars').textContent = '⭐'.repeat(Math.max(1, sightCorrect));
    const tip = currentSight.words[Math.floor(Math.random() * total)];
    document.getElementById('parentTip').innerHTML = isPhrase
      ? '💬 Ba mẹ thử hỏi bé tình huống nào thì nói "<strong>' + tip.en + '</strong>" (' + tip.vi + ') nhé.'
      : '💬 Ba mẹ thử chỉ vào chữ "<strong>' + tip.en + '</strong>" rồi hỏi bé: "Chữ này đọc là gì?" (đáp án: <strong>' + tip.en + '</strong> — ' + tip.vi + ')';
    document.getElementById('printBtn').hidden = true;
    const replayBtn = document.getElementById('replayBtn');
    replayBtn.textContent = isPhrase ? 'Học lại nhóm cụm từ này' : 'Học lại nhóm từ này';
    replayBtn.onclick = () => startSight(currentSight.id, isPhrase ? PHRASES_LA_TOPICS : SIGHT_TOPICS);
    renderTotalStars();
    celebrate(isPerfect, oldLifetimeStars, null);
    resetChest();
    showScreen('done');
  }

  // ---------- LẬT THẺ TRÍ NHỚ (lớp Chồi + lớp Lá, tab Trò chơi) ----------
  // 12 thẻ úp, bé lật 2 thẻ mỗi lượt để tìm cặp đúng. classId 'choi' (mặc định): 6 hình + 6 chữ
  // tương ứng (getChoiSpellTopics), chỉ dùng từ có hình riêng (không trùng emoji) và không quá dài —
  // dễ hơn vì có hình gợi ý. classId 'la': "nâng cao" — bỏ hẳn hình, ghép CHỮ TIẾNG ANH với NGHĨA
  // TIẾNG VIỆT (getLaSpellTopics), khó hơn hẳn vì phải nhớ thuần chữ-nghĩa, không có hình để đoán.
  let memCards = [];
  let memFirst = null;
  let memLock = false;
  let memMoves = 0;
  let memFound = 0;
  let memTopicId = null;
  let memClassId = 'choi';

  function getMemoryPool(topic) {
    const seenEmoji = new Set();
    return topic.words.filter(w => {
      if (w.en.length > 9 || seenEmoji.has(w.emoji)) return false;
      seenEmoji.add(w.emoji);
      return true;
    });
  }
  // Lá không ghép theo hình nên không cần lọc trùng emoji — chỉ giới hạn độ dài chữ cho vừa thẻ
  // (nới hơn Chồi 1 chút vì từ vựng Lá dài hơn, xem SPELLING_RULES.la).
  function getLaMemoryPool(topic) {
    return topic.words.filter(w => w.en.length <= 12);
  }

  function startMemory(topicId, classId) {
    classId = classId || 'choi';
    memClassId = classId;
    const topic = (classId === 'la' ? getLaSpellTopics() : getChoiSpellTopics()).find(t => t.id === topicId);
    if (!topic) return;
    const pool = classId === 'la' ? getLaMemoryPool(topic) : getMemoryPool(topic);
    if (pool.length < MEMORY_PAIRS) return;
    memTopicId = topicId;
    const chosen = shuffle(pool).slice(0, MEMORY_PAIRS);
    const cards = [];
    chosen.forEach((w, i) => {
      if (classId === 'la') {
        cards.push({ pairId: i, kind: 'en', content: w.en, en: w.en });
        cards.push({ pairId: i, kind: 'vi', content: w.vi, en: w.en });
      } else {
        cards.push({ pairId: i, kind: 'emoji', content: w.emoji, en: w.en });
        cards.push({ pairId: i, kind: 'word', content: w.en, en: w.en });
      }
    });
    memCards = shuffle(cards).map(c => Object.assign(c, { flipped: false, matched: false }));
    memFirst = null; memLock = false; memMoves = 0; memFound = 0;
    document.getElementById('memWrap').hidden = false;
    document.getElementById('memDoneWrap').hidden = true;
    document.querySelector('#memDoneWrap p').textContent = '';
    renderMemory();
    showScreen('memory');
    fitMemoryWords();
  }

  function renderMemory() {
    document.getElementById('memProgressFill').style.width = (memFound / MEMORY_PAIRS) * 100 + '%';
    document.getElementById('memMoves').textContent = 'Số lượt lật: ' + memMoves + ' · Đã tìm: ' + memFound + '/' + MEMORY_PAIRS;
    const grid = document.getElementById('memGrid');
    grid.innerHTML = '';
    memCards.forEach((c, idx) => {
      const b = document.createElement('button');
      const faceUp = c.flipped || c.matched;
      b.className = 'mem-card' + (faceUp ? ' is-up' : '') + (c.matched ? ' is-matched' : '') + (faceUp && c.kind === 'emoji' ? ' mem-emoji' : '') + (faceUp && c.kind !== 'emoji' ? ' mem-word' : '');
      b.textContent = faceUp ? c.content : '❓';
      b.disabled = c.matched;
      b.addEventListener('click', () => handleMemoryClick(idx));
      grid.appendChild(b);
    });
    fitMemoryWords();
  }

  // Chữ trên thẻ chỉ rộng ~1/3 màn hình: tự thu nhỏ theo độ dài từ để không tràn (cùng cách với fitMatchWordCards).
  function fitMemoryWords() {
    const grid = document.getElementById('memGrid');
    const first = grid.firstElementChild;
    if (!first || !first.clientWidth) return;
    const usable = first.clientWidth - 14;
    grid.querySelectorAll('.mem-word').forEach(b => {
      b.style.fontSize = Math.max(11, Math.min(22, usable / (Math.max(b.textContent.length, 1) * 0.66))) + 'px';
    });
  }

  function handleMemoryClick(idx) {
    if (memLock) return;
    const c = memCards[idx];
    if (c.flipped || c.matched) return;
    c.flipped = true;
    if (c.kind === 'word' || c.kind === 'en') speak(c.en);
    if (memFirst === null) { memFirst = idx; renderMemory(); return; }
    memMoves++;
    const first = memCards[memFirst];
    if (first.pairId === c.pairId) {
      first.matched = true; c.matched = true; memFound++;
      memFirst = null;
      renderMemory();
      if (memFound === MEMORY_PAIRS) setTimeout(finishMemory, 700);
    } else {
      memLock = true;
      renderMemory();
      const a = memFirst;
      setTimeout(() => { // úp lại cả 2 thẻ sau khi bé kịp nhìn
        memCards[a].flipped = false; c.flipped = false;
        memFirst = null; memLock = false;
        renderMemory();
      }, 900);
    }
  }

  function finishMemory() {
    document.getElementById('memWrap').hidden = true;
    document.getElementById('memDoneWrap').hidden = false;
    bumpDailyMission('games'); // lật thẻ là 1 trò chơi của tab Trò chơi
    const msgEl = document.querySelector('#memDoneWrap p');
    const baseText = 'Bé tìm hết ' + MEMORY_PAIRS + ' cặp sau ' + memMoves + ' lượt lật!';
    if (memClassId === 'la') finishLaRound('memory', memTopicId, msgEl, baseText);
    else finishChoiRound('memory', memTopicId, msgEl, baseText);
  }

  document.getElementById('backFromMemory').addEventListener('click', () => showScreen('games'));
  document.getElementById('memReplayBtn').addEventListener('click', () => startMemory(memTopicId, memClassId));
  document.getElementById('memOtherBtn').addEventListener('click', () => showScreen('games'));

  // ---------- SIMON NÓI (lớp Chồi + lớp Lá, tab Trò chơi) ----------
  // Trò chơi vận động: Simon ra lệnh bằng tiếng Anh. Có "Simon says" ở đầu thì bé làm theo hành động
  // (bấm Làm theo), không có thì là lượt gài bẫy, bé phải đứng yên (bấm Đứng yên). Không cần chọn chủ đề.
  // classId 'choi' (mặc định): 8 từ hành động của choi_actions (data/vocab_choi.js) — vừa đủ
  // SIMON_ROUNDS mỗi ván. classId 'la': "nâng cao" — SIMON_LA_COMMANDS (data/simon_la.js), mỗi lệnh
  // có 2 hành động liền nhau trong 1 câu thay vì 1 từ đơn, khó nghe-hiểu hơn hẳn.
  let simonRounds = [];
  let simonIdx = 0;
  let simonCorrect = 0;
  let simonLocked = false;
  let simonClassId = 'choi';

  function getSimonPool(classId) {
    if (classId === 'la') return SIMON_LA_COMMANDS;
    const topic = CHOI_TOPICS.find(t => t.id === 'choi_actions');
    return topic ? topic.words : [];
  }

  // ~SIMON_SAYS_CHANCE tỉ lệ lượt có "Simon says", còn lại là bẫy — cố định số lượng rồi xáo vị trí
  // để mỗi ván đều có đủ cả 2 loại lượt (không may rủi toàn 1 loại).
  function buildSimonRounds(classId) {
    const pool = shuffle(getSimonPool(classId)).slice(0, SIMON_ROUNDS);
    const simonCount = Math.round(SIMON_ROUNDS * SIMON_SAYS_CHANCE);
    const flags = shuffle(pool.map((_, i) => i < simonCount));
    return pool.map((w, i) => ({ en: w.en, emoji: w.emoji, isSimon: flags[i] }));
  }

  function startSimon(classId) {
    classId = classId || 'choi';
    simonClassId = classId;
    if (getSimonPool(classId).length < SIMON_ROUNDS) return;
    simonRounds = buildSimonRounds(classId);
    simonIdx = 0; simonCorrect = 0; simonLocked = false;
    document.getElementById('simonWrap').hidden = false;
    document.getElementById('simonDoneWrap').hidden = true;
    document.querySelector('#simonDoneWrap p').textContent = '';
    showScreen('simon');
    renderSimonRound();
  }

  function renderSimonRound() {
    const r = simonRounds[simonIdx];
    document.getElementById('simonProgressFill').style.width = (simonIdx / SIMON_ROUNDS) * 100 + '%';
    document.getElementById('simonScore').textContent = 'Đúng: ' + simonCorrect + '/' + SIMON_ROUNDS;
    document.getElementById('simonBubble').textContent = (r.isSimon ? 'Simon nói: ' : '') + r.en + '!';
    document.getElementById('simonActionEmoji').textContent = r.emoji;
    const fb = document.getElementById('simonFeedback');
    fb.textContent = '';
    fb.className = 'quiz-feedback';
    document.getElementById('simonYesBtn').disabled = false;
    document.getElementById('simonNoBtn').disabled = false;
    simonLocked = false;
    speak((r.isSimon ? 'Simon says, ' : '') + r.en);
  }

  function handleSimonChoice(saysYes) {
    if (simonLocked) return;
    simonLocked = true;
    const r = simonRounds[simonIdx];
    const correct = saysYes === r.isSimon;
    if (correct) simonCorrect++;
    const fb = document.getElementById('simonFeedback');
    fb.textContent = correct ? '✅ Đúng rồi!' : (r.isSimon ? '❌ Simon CÓ nói mà, phải làm theo chứ!' : '❌ Simon không nói nhé, phải đứng yên chứ!');
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'no');
    document.getElementById('simonYesBtn').disabled = true;
    document.getElementById('simonNoBtn').disabled = true;
    setTimeout(() => {
      simonIdx++;
      if (simonIdx >= SIMON_ROUNDS) finishSimon();
      else renderSimonRound();
    }, 1100);
  }

  function finishSimon() {
    document.getElementById('simonProgressFill').style.width = '100%';
    document.getElementById('simonWrap').hidden = true;
    document.getElementById('simonDoneWrap').hidden = false;
    bumpDailyMission('games'); // Simon nói cũng là 1 trò chơi của tab Trò chơi
    const msgEl = document.querySelector('#simonDoneWrap p');
    const baseText = 'Bé trả lời đúng ' + simonCorrect + '/' + SIMON_ROUNDS + ' lượt của Simon!';
    if (simonClassId === 'la') finishLaRound('simon', 'simon', msgEl, baseText);
    else finishChoiRound('simon', 'simon', msgEl, baseText);
  }

  document.getElementById('backFromSimon').addEventListener('click', () => showScreen('games'));
  document.getElementById('simonYesBtn').addEventListener('click', () => handleSimonChoice(true));
  document.getElementById('simonNoBtn').addEventListener('click', () => handleSimonChoice(false));
  document.getElementById('simonReplayBtn').addEventListener('click', () => startSimon(simonClassId));
  document.getElementById('simonOtherBtn').addEventListener('click', () => showScreen('games'));
  document.getElementById('simonStartBtn').addEventListener('click', () => startSimon('choi'));
  document.getElementById('laSimonStartBtn').addEventListener('click', () => startSimon('la'));

  // Chồi > Trò chơi: chọn Xếp chữ hoặc Lật thẻ (cùng danh sách chủ đề).
  function setChoiGamesMode(mode) {
    choiGamesMode = mode;
    document.getElementById('choiGameSpellBtn').classList.toggle('active', mode === 'spell');
    document.getElementById('choiGameMemoryBtn').classList.toggle('active', mode === 'memory');
    document.getElementById('choiGameSimonBtn').classList.toggle('active', mode === 'simon');
    renderChoiSpellGrid();
    moveSegmentThumb(document.getElementById('choiGamesModeToggle'));
  }
  document.getElementById('choiGameSpellBtn').addEventListener('click', () => setChoiGamesMode('spell'));
  document.getElementById('choiGameMemoryBtn').addEventListener('click', () => setChoiGamesMode('memory'));
  document.getElementById('choiGameSimonBtn').addEventListener('click', () => setChoiGamesMode('simon'));

  function setLaGamesMode(mode) {
    laGamesMode = mode;
    document.getElementById('laGameSpellBtn').classList.toggle('active', mode === 'spell');
    document.getElementById('laGameSpeedBtn').classList.toggle('active', mode === 'speed');
    document.getElementById('laGameOrderBtn').classList.toggle('active', mode === 'order');
    document.getElementById('laGameMemoryBtn').classList.toggle('active', mode === 'memory');
    document.getElementById('laGameSimonBtn').classList.toggle('active', mode === 'simon');
    renderLaGamesGrid();
    moveSegmentThumb(document.getElementById('laGamesModeToggle'));
  }
  document.getElementById('laGameSpellBtn').addEventListener('click', () => setLaGamesMode('spell'));
  document.getElementById('laGameSpeedBtn').addEventListener('click', () => setLaGamesMode('speed'));
  document.getElementById('laGameOrderBtn').addEventListener('click', () => setLaGamesMode('order'));
  document.getElementById('laGameMemoryBtn').addEventListener('click', () => setLaGamesMode('memory'));
  document.getElementById('laGameSimonBtn').addEventListener('click', () => setLaGamesMode('simon'));

  // ---------- TẬP VIẾT CHỮ (lớp Chồi, tab Học) ----------
  // 26 chữ chia 6 nhóm; mỗi chữ tô 2 lần: chữ HOA rồi chữ thường. Bé tô bằng ngón tay lên nét chữ mờ; bấm "Xong"
  // thì app so ảnh nét bé vẽ với hình chữ: phủ đủ nét (coverage) và không tô lệch ra ngoài (precision) là đạt.
  const WRITE_GROUPS = [
    ['A', 'B', 'C', 'D'], ['E', 'F', 'G', 'H'], ['I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P'], ['Q', 'R', 'S', 'T'], ['U', 'V', 'W', 'X', 'Y', 'Z'],
  ].map((letters, i) => ({
    id: 'write_' + (i + 1), letters: letters, emoji: '✍️', cls: ['t-pink', 't-blue', 't-gold', 't-mint', 't-accent', 't-pink'][i],
    label: 'Chữ ' + letters[0] + '–' + letters[letters.length - 1],
  }));
  const WRITE_SIZE = 320;       // canvas vuông 320x320 (hiển thị co giãn theo màn hình)
  const WRITE_PEN = 30;         // nét bút to cho ngón tay bé
  const WRITE_MIN_COVERAGE = 0.45;  // phải tô phủ ít nhất 45% diện tích chữ
  const WRITE_MIN_PRECISION = 0.55; // và ít nhất 55% nét vẽ nằm trong vùng chữ (đã nới rộng)
  let wGroup = null, wSteps = [], wIndex = 0, wDrawing = false, wBusy = false;
  let wMaskData = null, wWideData = null;
  const wUser = document.createElement('canvas'); // nét bé vẽ (nền trong suốt), tách khỏi canvas hiển thị để chấm điểm
  wUser.width = WRITE_SIZE; wUser.height = WRITE_SIZE;

  function renderWriteSection() {
    const grid = document.getElementById('writeTopicGrid');
    grid.innerHTML = '';
    WRITE_GROUPS.forEach(g => {
      const done = !!progress.choi.writeGroups[g.id];
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + g.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã viết</span>' : '') +
        '<span class="emoji">' + g.emoji + '</span>' +
        '<span><span class="label">' + g.label + '</span><br>' +
        '<span class="count">' + g.letters.length + ' chữ · hoa & thường' + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
      btn.addEventListener('click', () => startWrite(g.id));
      grid.appendChild(btn);
    });
  }

  function writeGlyphY(ctx, text) { // canh chữ giữa canvas theo chiều cao thật của nét
    const m = ctx.measureText(text);
    if (m.actualBoundingBoxAscent === undefined) return WRITE_SIZE * 0.78;
    return WRITE_SIZE / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  }
  const WRITE_FONT = '800 250px "Baloo 2", "Arial Rounded MT Bold", Arial, sans-serif';

  function startWrite(groupId) {
    const g = WRITE_GROUPS.find(x => x.id === groupId);
    if (!g) return;
    wGroup = g;
    wSteps = [];
    g.letters.forEach(l => { wSteps.push({ text: l, kind: 'hoa' }); wSteps.push({ text: l.toLowerCase(), kind: 'thường' }); });
    wIndex = 0; wBusy = false;
    document.getElementById('writeWrap').hidden = false;
    document.getElementById('writeDoneWrap').hidden = true;
    showScreen('write');
    renderWriteStep();
  }

  function renderWriteStep() {
    const step = wSteps[wIndex];
    document.getElementById('writePrompt').textContent = 'Tô chữ ' + step.kind + ' "' + step.text + '"';
    document.getElementById('writeProgressFill').style.width = (wIndex / wSteps.length) * 100 + '%';
    document.getElementById('writeFeedback').textContent = '';
    document.getElementById('writeFeedback').className = 'quiz-feedback';
    wUser.getContext('2d').clearRect(0, 0, WRITE_SIZE, WRITE_SIZE);
    // mặt nạ để chấm điểm: hình chữ đặc + bản nới rộng (viền 20px mỗi phía) để cho phép tô lệch nhẹ
    const mk = () => { const c = document.createElement('canvas'); c.width = WRITE_SIZE; c.height = WRITE_SIZE; return c; };
    const mc = mk(), mx = mc.getContext('2d');
    mx.font = WRITE_FONT; mx.textAlign = 'center'; mx.textBaseline = 'alphabetic';
    const y = writeGlyphY(mx, step.text);
    mx.fillStyle = '#000'; mx.fillText(step.text, WRITE_SIZE / 2, y);
    wMaskData = mx.getImageData(0, 0, WRITE_SIZE, WRITE_SIZE).data;
    const wc = mk(), wx = wc.getContext('2d');
    wx.font = WRITE_FONT; wx.textAlign = 'center'; wx.textBaseline = 'alphabetic';
    wx.fillStyle = '#000'; wx.strokeStyle = '#000'; wx.lineWidth = 40; wx.lineJoin = 'round';
    wx.fillText(step.text, WRITE_SIZE / 2, y); wx.strokeText(step.text, WRITE_SIZE / 2, y);
    wWideData = wx.getImageData(0, 0, WRITE_SIZE, WRITE_SIZE).data;
    redrawWrite(y);
    wBusy = false;
    speak(step.text.toUpperCase());
  }

  function redrawWrite(yHint) {
    const canvas = document.getElementById('writeCanvas');
    const ctx = canvas.getContext('2d');
    const step = wSteps[wIndex];
    ctx.clearRect(0, 0, WRITE_SIZE, WRITE_SIZE);
    ctx.font = WRITE_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#E3DACB'; // nét chữ mờ để bé tô theo
    ctx.fillText(step.text, WRITE_SIZE / 2, yHint !== undefined ? yHint : writeGlyphY(ctx, step.text));
    ctx.drawImage(wUser, 0, 0);
  }

  function writePoint(e) {
    const canvas = document.getElementById('writeCanvas');
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (WRITE_SIZE / r.width), y: (e.clientY - r.top) * (WRITE_SIZE / r.height) };
  }
  function writeStroke(from, to) {
    const ctx = wUser.getContext('2d');
    ctx.strokeStyle = '#FF8A65'; ctx.fillStyle = '#FF8A65';
    ctx.lineWidth = WRITE_PEN; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (from) { ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); }
    else { ctx.arc(to.x, to.y, WRITE_PEN / 2, 0, Math.PI * 2); ctx.fill(); } // chạm 1 cái cũng vẽ 1 chấm
    redrawWrite();
  }
  (function bindWriteCanvas() {
    const canvas = document.getElementById('writeCanvas');
    let last = null;
    canvas.addEventListener('pointerdown', (e) => {
      if (wBusy) return;
      wDrawing = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      last = writePoint(e);
      writeStroke(null, last);
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!wDrawing) return;
      const p = writePoint(e);
      writeStroke(last, p);
      last = p;
      e.preventDefault();
    });
    const end = () => { wDrawing = false; last = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', end);
  })();

  document.getElementById('writeClearBtn').addEventListener('click', () => {
    if (wBusy) return;
    wUser.getContext('2d').clearRect(0, 0, WRITE_SIZE, WRITE_SIZE);
    redrawWrite();
    document.getElementById('writeFeedback').textContent = '';
  });

  // Chấm: coverage = phần chữ bé đã tô phủ; precision = phần nét vẽ nằm trong vùng chữ (đã nới rộng).
  function evaluateWrite() {
    const user = wUser.getContext('2d').getImageData(0, 0, WRITE_SIZE, WRITE_SIZE).data;
    let maskN = 0, covered = 0, strokeN = 0, inside = 0;
    for (let i = 3; i < user.length; i += 4) {
      const m = wMaskData[i] > 100, w = wWideData[i] > 100, u = user[i] > 100;
      if (m) { maskN++; if (u) covered++; }
      if (u) { strokeN++; if (w) inside++; }
    }
    return { coverage: maskN ? covered / maskN : 0, precision: strokeN ? inside / strokeN : 0 };
  }

  document.getElementById('writeDoneBtn').addEventListener('click', () => {
    if (wBusy) return;
    const r = evaluateWrite();
    const fb = document.getElementById('writeFeedback');
    if (r.coverage >= WRITE_MIN_COVERAGE && r.precision >= WRITE_MIN_PRECISION) {
      wBusy = true;
      fb.textContent = 'Đẹp lắm! 🎉';
      fb.className = 'quiz-feedback ok';
      progress.choi.lettersWritten++;
      setTimeout(() => {
        wIndex++;
        if (wIndex >= wSteps.length) {
          document.getElementById('writeProgressFill').style.width = '100%';
          document.getElementById('writeWrap').hidden = true;
          document.getElementById('writeDoneWrap').hidden = false;
          finishChoiRound('write', wGroup.id, document.querySelector('#writeDoneWrap p'), 'Bé đã tô đẹp hết các chữ rồi đó!');
        } else renderWriteStep();
      }, 900);
    } else {
      fb.className = 'quiz-feedback no';
      fb.textContent = r.precision < WRITE_MIN_PRECISION && r.coverage >= WRITE_MIN_COVERAGE
        ? 'Bé tô theo nét chữ mờ nhé — bấm "Xoá" để làm lại.'
        : 'Bé tô kín nét chữ hơn nhé!';
    }
  });
  document.getElementById('backFromWrite').addEventListener('click', () => goHome());
  document.getElementById('writeReplayBtn').addEventListener('click', () => startWrite(wGroup.id));
  document.getElementById('writeOtherBtn').addEventListener('click', () => goHome());

  // ---------- GHÉP CÂU / SẮP XẾP CÂU (lớp Chồi tab Câu, lớp Lá tab Trò chơi) ----------
  // Bé bấm các từ ở dưới theo đúng thứ tự để ghép thành câu. classId 'choi' (mặc định): câu 3–4 từ
  // (SENTENCE_BUILD_TOPICS, data/sentences_choi.js), sống ở tab Câu. classId 'la': câu 5–8 từ, mỗi
  // nhóm bám 1 cấu trúc Ngữ pháp cơ bản (SENTENCE_BUILD_LA_TOPICS, data/sentences_la.js), sống ở tab
  // Trò chơi (Lá chưa có tab Câu) — sbReturnScreen nhớ màn nào để "Quay lại"/"Chọn nhóm khác" về đúng
  // chỗ. Là bài luyện tự do như Điền từ của lớp Mầm: không tính sao mỗi câu, chơi lại thoải mái,
  // không ghi vào ôn tập từ vựng (nội dung riêng của mỗi lớp).
  let sbTopic = null;
  let sbClassId = 'choi';
  let sbReturnScreen = 'sentences';
  let sbSentences = [];  // [{ en, vi, emoji, tokens: ['I','see','a','cat'] }]
  let sbIndex = 0;
  let sbTiles = [];      // [{ word, id, used }]
  let sbSlots = [];      // [tileId | null], độ dài = số từ của câu
  let sbLocked = false;  // đang hiện kết quả đúng/sai → không nhận thêm bấm

  function renderChoiSentenceGrid() {
    const grid = document.getElementById('choiSentenceGrid');
    grid.innerHTML = '';
    SENTENCE_BUILD_TOPICS.forEach(topic => {
      const done = !!progress.choi.sentenceGroups[topic.id];
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + (done ? ' is-done' : '');
      btn.innerHTML =
        (done ? '<span class="done-badge">✓ Đã chơi</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">Ghép ' + Math.min(SENTENCE_BUILD_COUNT, topic.sentences.length) + ' câu' + (done ? '' : ' · +' + CHOI_FIRST_ROUND_STARS + '⭐') + '</span></span>';
      btn.addEventListener('click', () => startSentenceBuild(topic.id));
      grid.appendChild(btn);
    });
  }

  function startSentenceBuild(topicId, classId) {
    classId = classId || 'choi';
    const topic = (classId === 'la' ? SENTENCE_BUILD_LA_TOPICS : SENTENCE_BUILD_TOPICS).find(t => t.id === topicId);
    if (!topic) return;
    sbClassId = classId;
    sbReturnScreen = classId === 'la' ? 'games' : 'sentences';
    sbTopic = topic;
    sbSentences = shuffle(topic.sentences).slice(0, Math.min(SENTENCE_BUILD_COUNT, topic.sentences.length)).map(s => ({
      en: s.en, vi: s.vi, emoji: s.emoji,
      tokens: s.en.replace(/[.!?]$/, '').split(' '), // bỏ dấu chấm cuối, mỗi từ là 1 ô
    }));
    sbIndex = 0;
    document.getElementById('sbWrap').hidden = false;
    document.getElementById('sbDoneWrap').hidden = true;
    renderSentenceBuild();
    showScreen('sentenceBuild');
  }

  function renderSentenceBuild() {
    const pct = (sbIndex / sbSentences.length) * 100;
    document.getElementById('sbProgressFill').style.width = pct + '%';
    const s = sbSentences[sbIndex];
    document.getElementById('sbEmoji').textContent = s.emoji;
    document.getElementById('sbVi').textContent = s.vi;
    document.getElementById('sbFeedback').textContent = '';
    document.getElementById('sbFeedback').className = 'quiz-feedback';

    let order;
    do {
      order = shuffle(s.tokens);
    } while (s.tokens.length > 1 && order.join(' ') === s.tokens.join(' ')); // tránh xáo trùng đúng thứ tự
    sbTiles = order.map((word, i) => ({ word: word, id: i, used: false }));
    sbSlots = new Array(s.tokens.length).fill(null);
    sbLocked = false;

    speak(s.en);
    renderSentenceBuildUI();
  }

  function renderSentenceBuildUI() {
    const slotsWrap = document.getElementById('sbSlots');
    slotsWrap.innerHTML = '';
    sbSlots.forEach((tileId, i) => {
      const tile = tileId !== null ? sbTiles.find(t => t.id === tileId) : null;
      const slot = document.createElement('button');
      slot.className = 'sb-slot' + (tile ? ' is-filled' : '');
      slot.textContent = tile ? tile.word : '';
      slot.disabled = !tile;
      slot.addEventListener('click', () => handleSbSlotClick(i));
      slotsWrap.appendChild(slot);
    });

    const bank = document.getElementById('sbBank');
    bank.innerHTML = '';
    sbTiles.forEach(tile => {
      const btn = document.createElement('button');
      btn.className = 'sb-tile';
      btn.textContent = tile.word;
      btn.hidden = tile.used;
      btn.addEventListener('click', () => handleSbTileClick(tile.id));
      bank.appendChild(btn);
    });
  }

  function handleSbTileClick(tileId) {
    if (sbLocked) return;
    const tile = sbTiles.find(t => t.id === tileId);
    if (!tile || tile.used) return;
    const emptyIdx = sbSlots.indexOf(null);
    if (emptyIdx === -1) return;
    tile.used = true;
    sbSlots[emptyIdx] = tileId;
    renderSentenceBuildUI();
    if (sbSlots.every(s => s !== null)) checkSentenceBuild();
  }

  function handleSbSlotClick(slotIdx) {
    if (sbLocked) return;
    const tileId = sbSlots[slotIdx];
    if (tileId === null) return;
    sbTiles.find(t => t.id === tileId).used = false;
    sbSlots[slotIdx] = null;
    renderSentenceBuildUI();
  }

  function checkSentenceBuild() {
    const s = sbSentences[sbIndex];
    const assembled = sbSlots.map(id => sbTiles.find(t => t.id === id).word);
    const fb = document.getElementById('sbFeedback');
    const slotBtns = document.querySelectorAll('.sb-slot');
    sbLocked = true;
    if (assembled.join(' ') === s.tokens.join(' ')) {
      slotBtns.forEach(b => b.classList.add('is-correct'));
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      progress[sbClassId].sentencesBuilt++;
      speak(s.en);
      setTimeout(() => {
        sbIndex++;
        if (sbIndex >= sbSentences.length) {
          document.getElementById('sbProgressFill').style.width = '100%';
          document.getElementById('sbWrap').hidden = true;
          document.getElementById('sbDoneWrap').hidden = false;
          const doneMsgEl = document.querySelector('#sbDoneWrap p');
          if (sbClassId === 'la') finishLaRound('sentence', sbTopic.id, doneMsgEl, 'Bé đã sắp xếp đúng hết các câu rồi đó!');
          else finishChoiRound('sentence', sbTopic.id, doneMsgEl, 'Bé đã ghép đúng hết các câu rồi đó!');
        } else {
          renderSentenceBuild();
        }
      }, 1300);
    } else {
      slotBtns.forEach(b => b.classList.add('is-wrong'));
      fb.textContent = 'Chưa đúng, thử lại nhé!';
      fb.className = 'quiz-feedback no';
      setTimeout(() => { // xếp lại từ đầu, giữ nguyên câu này
        sbSlots = new Array(s.tokens.length).fill(null);
        sbTiles.forEach(t => { t.used = false; });
        sbLocked = false;
        renderSentenceBuildUI();
        fb.textContent = '';
        fb.className = 'quiz-feedback';
      }, 1000);
    }
  }

  document.getElementById('backFromSb').addEventListener('click', () => showScreen(sbReturnScreen));
  document.getElementById('sbListenBtn').addEventListener('click', () => speak(sbSentences[sbIndex].en));
  document.getElementById('sbReplayBtn').addEventListener('click', () => startSentenceBuild(sbTopic.id, sbClassId));
  document.getElementById('sbOtherTopicBtn').addEventListener('click', () => showScreen(sbReturnScreen));

  // ---------- HỎI-ĐÁP (nối câu hỏi–câu trả lời, lớp Lá, tab Câu) ----------
  // Cơ chế nối 2 cột giống Ghép tranh (startMatchGame) nhưng viết RIÊNG (không tái dùng
  // startMatchGame/handleMatchClick) vì bản gốc gắn chặt với currentTopic.words dạng {emoji, en} và
  // luôn quay về 'games'/'home' — ở đây là 2 câu văn dài (q/a) và luôn quay về tab Câu.
  let laQaTopic = null;
  let laQaPairs = [];       // [{ pairId, q, a }], tập con đã xáo của topic.pairs
  let laQaLeftCards = [];   // [{ pairId, content: q, matched }]
  let laQaRightCards = [];  // [{ pairId, content: a, matched }]
  let laQaSelectedLeft = null;
  let laQaSelectedRight = null;
  let laQaWrong = false;
  let laQaFoundCount = 0;
  let laQaLock = false;

  function startLaQa(topicId) {
    const topic = QA_LA_TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    laQaTopic = topic;
    laQaPairs = shuffle(topic.pairs).slice(0, Math.min(QA_ROUND_COUNT, topic.pairs.length)).map((p, i) => ({ pairId: i, q: p.q, a: p.a }));
    laQaFoundCount = 0;
    laQaSelectedLeft = null;
    laQaSelectedRight = null;
    laQaWrong = false;
    laQaLock = false;
    document.getElementById('laQaWrap').hidden = false;
    document.getElementById('laQaDoneWrap').hidden = true;
    laQaLeftCards = shuffle(laQaPairs.map(p => ({ pairId: p.pairId, content: p.q, matched: false })));
    laQaRightCards = shuffle(laQaPairs.map(p => ({ pairId: p.pairId, content: p.a, matched: false })));
    renderLaQa();
    showScreen('laQa');
    fitMatchWordCards(document.getElementById('laQaGridRight'));
    fitMatchWordCards(document.getElementById('laQaGridLeft'));
  }

  function renderLaQa() {
    document.getElementById('laQaProgressFill').style.width = (laQaFoundCount / laQaPairs.length) * 100 + '%';
    const leftGrid = document.getElementById('laQaGridLeft');
    const rightGrid = document.getElementById('laQaGridRight');
    leftGrid.innerHTML = '';
    rightGrid.innerHTML = '';
    laQaLeftCards.forEach((card, idx) => {
      const btn = document.createElement('button');
      btn.className = 'match-card match-card--word' + (card.matched ? ' is-matched' : '')
        + (idx === laQaSelectedLeft ? (laQaWrong ? ' is-wrong' : ' is-selected') : '');
      btn.textContent = card.content;
      btn.disabled = card.matched;
      btn.addEventListener('click', () => handleLaQaClick('left', idx));
      leftGrid.appendChild(btn);
    });
    laQaRightCards.forEach((card, idx) => {
      const btn = document.createElement('button');
      btn.className = 'match-card match-card--word' + (card.matched ? ' is-matched' : '')
        + (idx === laQaSelectedRight ? (laQaWrong ? ' is-wrong' : ' is-selected') : '');
      btn.textContent = card.content;
      btn.disabled = card.matched;
      btn.addEventListener('click', () => handleLaQaClick('right', idx));
      rightGrid.appendChild(btn);
    });
    fitMatchWordCards(leftGrid);
    fitMatchWordCards(rightGrid);
  }

  function handleLaQaClick(side, idx) {
    if (laQaLock) return;
    if (side === 'left') {
      if (laQaLeftCards[idx].matched) return;
      laQaSelectedLeft = idx;
    } else {
      if (laQaRightCards[idx].matched) return;
      laQaSelectedRight = idx;
    }
    renderLaQa();
    if (laQaSelectedLeft === null || laQaSelectedRight === null) return;

    const l = laQaLeftCards[laQaSelectedLeft];
    const r = laQaRightCards[laQaSelectedRight];
    if (l.pairId === r.pairId) {
      l.matched = true;
      r.matched = true;
      laQaFoundCount++;
      laQaSelectedLeft = null;
      laQaSelectedRight = null;
      renderLaQa();
      if (laQaFoundCount === laQaPairs.length) {
        setTimeout(() => {
          document.getElementById('laQaWrap').hidden = true;
          document.getElementById('laQaDoneWrap').hidden = false;
          finishLaRound('qa', laQaTopic.id, document.getElementById('laQaDoneText'), 'Bé đã nối đúng hết các câu rồi đó!');
        }, 500);
      }
    } else {
      laQaLock = true;
      laQaWrong = true;
      renderLaQa();
      setTimeout(() => {
        laQaSelectedLeft = null;
        laQaSelectedRight = null;
        laQaWrong = false;
        laQaLock = false;
        renderLaQa();
      }, 700);
    }
  }

  document.getElementById('backFromLaQa').addEventListener('click', () => showScreen('sentences'));
  document.getElementById('laQaReplayBtn').addEventListener('click', () => startLaQa(laQaTopic.id));
  document.getElementById('laQaOtherTopicBtn').addEventListener('click', () => showScreen('sentences'));

  // ---------- ĐỐI THOẠI NHẬP VAI (lớp Lá, tab Câu) ----------
  // Bé đóng vai nhân vật B: mỗi lượt thoại hiện câu A (đọc/nghe được) rồi bé CHỌN đúng câu trả lời
  // của B trong vài lựa chọn (giống 1 câu hỏi trắc nghiệm, không cần gõ) — trả lời xong luôn đi tiếp
  // (không bắt làm lại như Xếp chữ/Sắp xếp câu), giống hệt luồng renderGrammarQuizQuestion/handleGrammarAnswer.
  let laDlgTopic = null;
  let laDlgIndex = 0;
  let laDlgCorrectCount = 0;

  function startLaDialogue(topicId) {
    const topic = DIALOGUE_LA_TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    laDlgTopic = topic;
    laDlgIndex = 0;
    laDlgCorrectCount = 0;
    document.getElementById('laDlgWrap').hidden = false;
    document.getElementById('laDlgDoneWrap').hidden = true;
    renderLaDialogueTurn();
    showScreen('laDialogue');
  }

  function renderLaDialogueTurn() {
    document.getElementById('laDlgProgressFill').style.width = (laDlgIndex / laDlgTopic.turns.length) * 100 + '%';
    document.getElementById('laDlgFeedback').textContent = '';
    document.getElementById('laDlgFeedback').className = 'quiz-feedback';
    const turn = laDlgTopic.turns[laDlgIndex];
    document.getElementById('laDlgEmoji').textContent = laDlgTopic.emoji;
    document.getElementById('laDlgAEn').textContent = turn.a.en;
    document.getElementById('laDlgAVi').textContent = turn.a.vi;
    speak(turn.a.en);
    const options = shuffle([turn.b.en].concat(turn.distractors));
    const wrap = document.getElementById('laDlgOptions');
    wrap.innerHTML = '';
    options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'quiz-opt text-opt';
      b.textContent = opt;
      b.addEventListener('click', () => handleLaDialogueAnswer(b, opt === turn.b.en));
      wrap.appendChild(b);
    });
  }

  document.getElementById('laDlgListenBtn').addEventListener('click', () => speak(laDlgTopic.turns[laDlgIndex].a.en));

  function handleLaDialogueAnswer(btn, isCorrect) {
    document.querySelectorAll('#laDlgOptions .quiz-opt').forEach(o => o.disabled = true);
    const turn = laDlgTopic.turns[laDlgIndex];
    const fb = document.getElementById('laDlgFeedback');
    if (isCorrect) {
      btn.classList.add('correct');
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      laDlgCorrectCount++;
      speak(turn.b.en);
    } else {
      btn.classList.add('wrong');
      fb.textContent = 'Chưa đúng rồi, câu trả lời đúng là "' + turn.b.en + '"';
      fb.className = 'quiz-feedback no';
    }
    setTimeout(() => {
      laDlgIndex++;
      if (laDlgIndex < laDlgTopic.turns.length) renderLaDialogueTurn();
      else finishLaDialogue();
    }, 1500);
  }

  function finishLaDialogue() {
    document.getElementById('laDlgProgressFill').style.width = '100%';
    document.getElementById('laDlgWrap').hidden = true;
    document.getElementById('laDlgDoneWrap').hidden = false;
    finishLaRound('dialogue', laDlgTopic.id, document.getElementById('laDlgDoneText'),
      'Bé trả lời đúng ' + laDlgCorrectCount + '/' + laDlgTopic.turns.length + ' lượt thoại!');
  }

  document.getElementById('backFromLaDialogue').addEventListener('click', () => showScreen('sentences'));
  document.getElementById('laDlgReplayBtn').addEventListener('click', () => startLaDialogue(laDlgTopic.id));
  document.getElementById('laDlgOtherTopicBtn').addEventListener('click', () => showScreen('sentences'));

  // ---------- VIẾT CÂU NGẮN / VIẾT ĐOẠN VĂN (lớp Lá, tab Câu) ----------
  // Bé tự gõ cả câu tiếng Anh (không có sẵn từ để bấm như Sắp xếp câu) nhìn theo nghĩa tiếng Việt +
  // hình gợi ý. So khớp nới lỏng: bỏ khác biệt hoa/thường, khoảng trắng thừa và dấu câu cuối câu —
  // xem normalizeWrittenSentence. Trả lời xong (đúng hay sai) đều bấm "Câu tiếp theo" mới đi tiếp,
  // không tự động chuyển như đố trắc nghiệm, để bé có thời gian đọc câu đúng khi gõ sai.
  // Viết đoạn văn (PARAGRAPH_LA_TOPICS) dùng chung NGUYÊN màn/hàm này (topicsArr khác WRITE_LA_TOPICS)
  // — khác biệt duy nhất: mỗi chủ đề đúng 3 câu NỐI TIẾP nhau kể 1 chuyện, nên hiện thêm khung "đoạn
  // văn của bé" gom dần từng câu đã gõ đúng để bé thấy rõ đang ghép thành 1 đoạn văn hoàn chỉnh.
  let laWriteTopic = null;
  let laWriteTopicsArr = WRITE_LA_TOPICS;
  let laWriteIndex = 0;
  let laWriteCorrectCount = 0;
  let laWriteAnswered = false;

  function startLaWrite(topicId, topicsArr) {
    topicsArr = topicsArr || WRITE_LA_TOPICS;
    const topic = topicsArr.find(t => t.id === topicId);
    if (!topic) return;
    laWriteTopic = topic;
    laWriteTopicsArr = topicsArr;
    laWriteIndex = 0;
    laWriteCorrectCount = 0;
    document.getElementById('laWriteWrap').hidden = false;
    document.getElementById('laWriteDoneWrap').hidden = true;
    const isParagraph = topicsArr === PARAGRAPH_LA_TOPICS;
    document.getElementById('laWriteParagraphBox').hidden = !isParagraph;
    document.getElementById('laWriteParagraphText').textContent = '';
    renderLaWriteQuestion();
    showScreen('laWrite');
  }

  function renderLaWriteQuestion() {
    document.getElementById('laWriteProgressFill').style.width = (laWriteIndex / laWriteTopic.sentences.length) * 100 + '%';
    const s = laWriteTopic.sentences[laWriteIndex];
    document.getElementById('laWriteEmoji').textContent = s.emoji;
    document.getElementById('laWriteVi').textContent = s.vi;
    const input = document.getElementById('laWriteInput');
    input.value = '';
    input.classList.remove('is-correct', 'is-wrong');
    input.disabled = false;
    input.focus();
    document.getElementById('laWriteFeedback').textContent = '';
    document.getElementById('laWriteFeedback').className = 'quiz-feedback';
    document.getElementById('laWriteAnswer').hidden = true;
    document.getElementById('laWriteSubmitBtn').hidden = false;
    document.getElementById('laWriteNextBtn').hidden = true;
    laWriteAnswered = false;
  }

  // Bỏ khác biệt hoa/thường, dấu câu cuối câu (.!?) và khoảng trắng thừa — gõ đúng nội dung câu là
  // được, không bắt gõ nguyên văn dấu câu/viết hoa như sách giáo khoa.
  function normalizeWrittenSentence(s) {
    return s.trim().toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
  }

  function checkLaWriteAnswer() {
    if (laWriteAnswered) return;
    laWriteAnswered = true;
    const s = laWriteTopic.sentences[laWriteIndex];
    const input = document.getElementById('laWriteInput');
    const isCorrect = normalizeWrittenSentence(input.value) === normalizeWrittenSentence(s.en);
    const fb = document.getElementById('laWriteFeedback');
    input.disabled = true;
    if (isCorrect) {
      input.classList.add('is-correct');
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      laWriteCorrectCount++;
      speak(s.en);
      if (laWriteTopicsArr === PARAGRAPH_LA_TOPICS) {
        const box = document.getElementById('laWriteParagraphText');
        box.textContent = (box.textContent ? box.textContent + ' ' : '') + s.en;
      }
    } else {
      input.classList.add('is-wrong');
      fb.textContent = 'Chưa đúng rồi, xem câu đúng nhé:';
      fb.className = 'quiz-feedback no';
      const ansEl = document.getElementById('laWriteAnswer');
      ansEl.textContent = s.en;
      ansEl.hidden = false;
      speak(s.en);
    }
    document.getElementById('laWriteSubmitBtn').hidden = true;
    document.getElementById('laWriteNextBtn').hidden = false;
  }

  document.getElementById('laWriteSubmitBtn').addEventListener('click', checkLaWriteAnswer);
  document.getElementById('laWriteInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkLaWriteAnswer(); });
  document.getElementById('laWriteNextBtn').addEventListener('click', () => {
    laWriteIndex++;
    if (laWriteIndex < laWriteTopic.sentences.length) renderLaWriteQuestion();
    else finishLaWrite();
  });

  function finishLaWrite() {
    document.getElementById('laWriteProgressFill').style.width = '100%';
    document.getElementById('laWriteWrap').hidden = true;
    document.getElementById('laWriteDoneWrap').hidden = false;
    const isParagraph = laWriteTopicsArr === PARAGRAPH_LA_TOPICS;
    const kind = isParagraph ? 'paragraph' : 'write';
    const baseText = 'Bé viết đúng ' + laWriteCorrectCount + '/' + laWriteTopic.sentences.length + (isParagraph ? ' câu trong đoạn văn!' : ' câu!');
    finishLaRound(kind, laWriteTopic.id, document.getElementById('laWriteDoneText'), baseText);
  }

  document.getElementById('backFromLaWrite').addEventListener('click', () => showScreen('sentences'));
  document.getElementById('laWriteReplayBtn').addEventListener('click', () => startLaWrite(laWriteTopic.id, laWriteTopicsArr));
  document.getElementById('laWriteOtherTopicBtn').addEventListener('click', () => showScreen('sentences'));

  // ---------- SPELLING GAME (Xếp chữ) ----------
  // Trò chơi luyện tập tự do trong tab "Trò chơi" (không tính sao, chơi lại thoải mái),
  // cùng kiểu với Ghép tranh nhưng rèn kỹ năng đánh vần thay vì ghi nhớ hình-nghĩa.
  let spellingWords = [];
  let spellingIndex = 0;
  let spellingTiles = []; // [{ ch, id, used }]
  let spellingSlots = []; // [tileId | null], độ dài = số chữ cái của từ

  // classId 'mam' (mặc định): chủ đề từ vựng phải học xong ở tab Học mới mở khoá. 'choi': Xếp chữ
  // riêng của lớp Chồi — mọi chủ đề mở sẵn (bé lớp Chồi không phải học các chủ đề của lớp Mầm), có
  // thêm chủ đề "Họ vần & âm ghép" gồm từ của Ngữ âm 2, và kết quả không ghi vào ôn tập của lớp Mầm.
  let spellingClassId = 'mam';
  let spellingTopicId = null;
  function getChoiSpellTopics() {
    const vocab = TOPICS.map(t => ({ id: t.id, label: t.label, emoji: t.emoji, cls: t.cls, words: t.words }));
    const choiVocab = CHOI_TOPICS.map(t => ({ id: t.id, label: t.label, emoji: t.emoji, cls: t.cls, words: t.words }));
    const phonics = { id: 'phonics2_words', label: 'Họ vần & âm ghép', emoji: '🔊', cls: 't-accent',
      words: PHONICS2_TOPICS.reduce((all, t) => all.concat(t.words), []) };
    return vocab.concat(choiVocab, [phonics]);
  }
  // Xếp chữ dài của lớp Lá: gộp CẢ 3 lớp (bé lớp Lá đã học xong Mầm/Chồi trước đó) + cả 2 đời Ngữ âm
  // (2 và 3) — SPELLING_RULES.la (5-9 chữ cái) tự lọc ra đúng những từ đủ dài, không cần lọc tay ở đây.
  function getLaSpellTopics() {
    const vocab = TOPICS.map(t => ({ id: t.id, label: t.label, emoji: t.emoji, cls: t.cls, words: t.words }));
    const choiVocab = CHOI_TOPICS.map(t => ({ id: t.id, label: t.label, emoji: t.emoji, cls: t.cls, words: t.words }));
    const laVocab = LA_TOPICS.map(t => ({ id: t.id, label: t.label, emoji: t.emoji, cls: t.cls, words: t.words }));
    const phonics = { id: 'phonics23_words', label: 'Họ vần & âm ghép', emoji: '🔊', cls: 't-accent',
      words: PHONICS2_TOPICS.concat(PHONICS3_TOPICS).reduce((all, t) => all.concat(t.words), []) };
    return vocab.concat(choiVocab, laVocab, [phonics]);
  }

  function startSpelling(topicId, classId) {
    classId = classId || 'mam';
    let topic;
    if (classId === 'choi') {
      topic = getChoiSpellTopics().find(t => t.id === topicId);
      if (!topic) return;
    } else if (classId === 'la') {
      topic = getLaSpellTopics().find(t => t.id === topicId);
      if (!topic) return;
    } else {
      topic = TOPICS.find(t => t.id === topicId);
      if (!topic) return;
      if (isTopicLockedForPractice(topic)) { showLockedPracticeTopicNotice(topic); return; }
      currentTopic = topic;
    }
    const pool = getSpellingPool(topic, classId);
    if (pool.length === 0) return;
    spellingClassId = classId;
    spellingTopicId = topicId;
    document.querySelector('#spellingDoneWrap p').textContent = 'Bé đã xếp đúng hết các từ rồi đó!'; // bỏ dòng thưởng của lượt trước
    spellingWords = shuffle(pool).slice(0, Math.min(SPELLING_RULES[classId].count, pool.length));
    spellingIndex = 0;
    document.getElementById('spellingWrap').hidden = false;
    document.getElementById('spellingDoneWrap').hidden = true;
    renderSpellingWord();
    showScreen('spelling');
  }

  function renderSpellingWord() {
    const pct = (spellingIndex / spellingWords.length) * 100;
    document.getElementById('spellingProgressFill').style.width = pct + '%';

    const word = spellingWords[spellingIndex];
    document.getElementById('spellingEmoji').textContent = word.emoji;
    document.getElementById('spellingVi').textContent = word.vi;

    const letters = word.en.split('');
    let shuffled;
    do {
      shuffled = shuffle(letters);
    } while (letters.length > 1 && shuffled.join('') === word.en); // tránh xáo trùng đúng thứ tự, đỡ dễ đoán
    spellingTiles = shuffled.map((ch, i) => ({ ch: ch, id: i, used: false }));
    spellingSlots = new Array(letters.length).fill(null);

    speak(word.en);
    renderSpellingUI();
  }

  function renderSpellingUI() {
    const slotsWrap = document.getElementById('spellingSlots');
    slotsWrap.innerHTML = '';
    spellingSlots.forEach((tileId, i) => {
      const tile = tileId !== null ? spellingTiles.find(t => t.id === tileId) : null;
      const slot = document.createElement('button');
      slot.className = 'spelling-slot' + (tile ? ' is-filled' : '');
      slot.textContent = tile ? tile.ch : '';
      slot.disabled = !tile;
      slot.addEventListener('click', () => handleSpellingSlotClick(i));
      slotsWrap.appendChild(slot);
    });

    const bankWrap = document.getElementById('spellingBank');
    bankWrap.innerHTML = '';
    spellingTiles.forEach(tile => {
      const btn = document.createElement('button');
      btn.className = 'spelling-tile';
      btn.textContent = tile.ch;
      btn.hidden = tile.used;
      btn.addEventListener('click', () => handleSpellingTileClick(tile.id));
      bankWrap.appendChild(btn);
    });
  }

  function handleSpellingTileClick(tileId) {
    const tile = spellingTiles.find(t => t.id === tileId);
    if (!tile || tile.used) return;
    const emptyIdx = spellingSlots.indexOf(null);
    if (emptyIdx === -1) return;
    tile.used = true;
    spellingSlots[emptyIdx] = tileId;
    renderSpellingUI();
    if (spellingSlots.every(s => s !== null)) checkSpellingAnswer();
  }

  function handleSpellingSlotClick(slotIdx) {
    const tileId = spellingSlots[slotIdx];
    if (tileId === null) return;
    spellingTiles.find(t => t.id === tileId).used = false;
    spellingSlots[slotIdx] = null;
    renderSpellingUI();
  }

  function checkSpellingAnswer() {
    const word = spellingWords[spellingIndex];
    const assembled = spellingSlots.map(tileId => spellingTiles.find(t => t.id === tileId).ch).join('');
    const fb = document.getElementById('spellingFeedback');
    const slotBtns = document.querySelectorAll('.spelling-slot');
    if (assembled === word.en) {
      // Chỉ từ vựng ĐÚNG lớp đang xếp mới vào ôn tập của lớp đó (VD: xếp trúng 1 từ Mầm trong lượt
      // Xếp chữ dài của Lá thì không tính vào ôn tập — xem SPELLING_RULES/getLaSpellTopics).
      if (spellingClassId === 'mam') recordWordAnswer(word, true);
      else {
        progress[spellingClassId].spellWords++;
        if (wordClassId(word) === spellingClassId) recordWordAnswer(word, true);
      }
      slotBtns.forEach(b => b.classList.add('is-correct'));
      fb.textContent = 'Chính xác! 🎉';
      fb.className = 'quiz-feedback ok';
      speak(word.en);
      setTimeout(() => {
        spellingIndex++;
        if (spellingIndex >= spellingWords.length) {
          document.getElementById('spellingProgressFill').style.width = '100%';
          document.getElementById('spellingWrap').hidden = true;
          document.getElementById('spellingDoneWrap').hidden = false;
          bumpDailyMission('games');
          saveProgress(progress);
          const doneMsgEl = document.querySelector('#spellingDoneWrap p');
          if (spellingClassId === 'choi') finishChoiRound('spell', spellingTopicId, doneMsgEl, 'Bé đã xếp đúng hết các từ rồi đó!');
          else if (spellingClassId === 'la') finishLaRound('spell', spellingTopicId, doneMsgEl, 'Bé đã xếp đúng hết các từ rồi đó!');
        } else {
          renderSpellingWord();
        }
      }, 900);
    } else {
      if (spellingClassId === 'mam' || wordClassId(word) === spellingClassId) recordWordAnswer(word, false);
      slotBtns.forEach(b => b.classList.add('is-wrong'));
      fb.textContent = 'Chưa đúng, thử lại nhé!';
      fb.className = 'quiz-feedback no';
      setTimeout(() => {
        spellingSlots = new Array(word.en.length).fill(null);
        spellingTiles.forEach(t => { t.used = false; });
        renderSpellingUI();
        fb.textContent = '';
        fb.className = 'quiz-feedback';
      }, 900);
    }
  }

  document.getElementById('backFromSpelling').addEventListener('click', () => showScreen('games'));
  document.getElementById('spellingListenBtn').addEventListener('click', () => speak(spellingWords[spellingIndex].en));
  document.getElementById('spellingReplayBtn').addEventListener('click', () => startSpelling(spellingTopicId, spellingClassId));
  document.getElementById('spellingOtherTopicBtn').addEventListener('click', () => showScreen('games'));

  // ---------- SPEED QUIZ (Ai nhanh hơn) ----------
  // Trò chơi ôn tập có tính giờ trong tab "Trò chơi": trả lời càng nhanh & càng đúng thì càng
  // nhiều sao, tạo thêm lý do để bé chơi lại các chủ đề đã học thay vì chỉ học 1 lần.
  // Khác với Ghép tranh/Xếp chữ (chơi tự do, không tính sao), chế độ này CÓ thưởng sao thật.
  let speedWords = [];
  let speedIndex = 0;
  let speedCorrectCount = 0;
  let speedTimeLeft = SPEED_TIME_LIMIT;
  let speedTimerId = null;
  let speedActive = false;
  // classId 'mam' (mặc định): chủ đề phải học xong ở tab Học mới mở khoá, như mọi trò chơi khác của
  // Mầm. classId 'la': "Đố nhanh nâng cao" riêng của lớp Lá — mở sẵn (giống Xếp chữ/Sắp xếp câu của
  // Lá), và khó hơn vì có 5 lựa chọn thay vì 4 (xem renderSpeedQuestion).
  let speedClassId = 'mam';

  function startSpeedQuiz(topicId, classId) {
    classId = classId || 'mam';
    speedClassId = classId;
    let topic;
    if (classId === 'mam') {
      topic = TOPICS.find(t => t.id === topicId);
      if (!topic) return;
      if (isTopicLockedForPractice(topic)) { showLockedPracticeTopicNotice(topic); return; }
    } else {
      topic = vocabTopicsOf(classId).find(t => t.id === topicId);
      if (!topic) return;
    }
    currentTopic = topic;
    speedWords = shuffle(topic.words).slice(0, Math.min(SPEED_WORD_COUNT, topic.words.length));
    speedIndex = 0;
    speedCorrectCount = 0;
    speedTimeLeft = SPEED_TIME_LIMIT;
    speedActive = true;
    document.getElementById('speedWrap').hidden = false;
    document.getElementById('speedDoneWrap').hidden = true;
    renderSpeedStats();
    renderSpeedQuestion();
    showScreen('speed');

    clearInterval(speedTimerId);
    speedTimerId = setInterval(() => {
      speedTimeLeft--;
      renderSpeedStats();
      if (speedTimeLeft <= 0) {
        document.querySelectorAll('#speedOptions .quiz-opt').forEach(o => o.disabled = true);
        endSpeedQuiz(false);
      }
    }, 1000);
  }

  function renderSpeedStats() {
    const timerEl = document.getElementById('speedTimer');
    timerEl.textContent = '⏱️ ' + speedTimeLeft;
    timerEl.classList.toggle('is-urgent', speedTimeLeft <= 10);
    document.getElementById('speedScore').textContent = '✅ ' + speedCorrectCount;
    const fill = document.getElementById('speedTimeFill');
    fill.style.width = Math.max(0, (speedTimeLeft / SPEED_TIME_LIMIT) * 100) + '%';
    fill.classList.toggle('is-urgent', speedTimeLeft <= 10);
  }

  function renderSpeedQuestion() {
    const word = speedWords[speedIndex];
    document.getElementById('speedWord').textContent = word.en;
    speak(word.en);

    const distractors = shuffle(currentTopic.words.filter(w => w !== word)).slice(0, speedClassId === 'mam' ? 3 : 4);
    const options = shuffle([word, ...distractors]);

    const wrap = document.getElementById('speedOptions');
    wrap.innerHTML = '';
    options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = opt.emoji;
      b.addEventListener('click', () => handleSpeedAnswer(b, opt.en === word.en));
      wrap.appendChild(b);
    });
  }

  function handleSpeedAnswer(btn, isCorrect) {
    if (!speedActive) return;
    speedActive = false;
    document.querySelectorAll('#speedOptions .quiz-opt').forEach(o => o.disabled = true);
    btn.classList.add(isCorrect ? 'correct' : 'wrong');
    recordWordAnswer(speedWords[speedIndex], isCorrect);
    if (isCorrect) speedCorrectCount++;
    renderSpeedStats();
    setTimeout(() => {
      if (!speedTimerId) return; // hết giờ trong lúc chờ hiệu ứng, endSpeedQuiz đã tự lo xong
      speedIndex++;
      if (speedIndex >= speedWords.length) {
        endSpeedQuiz(true);
      } else {
        speedActive = true;
        renderSpeedQuestion();
      }
    }, 500);
  }

  function endSpeedQuiz(finishedAll) {
    clearInterval(speedTimerId);
    speedTimerId = null;
    speedActive = false;

    // Thưởng: 1 sao/từ đúng, cộng thêm sao thưởng tốc độ nếu bé trả lời hết trước khi hết giờ
    // (còn dư càng nhiều giây thì thưởng càng nhiều, tối đa +3 sao).
    const bonus = finishedAll ? Math.min(3, Math.ceil(speedTimeLeft / 10)) : 0;
    const starsEarned = speedCorrectCount + bonus;
    const oldLifetimeStars = progress.lifetimeStars;
    addStars(starsEarned);
    bumpDailyMission('games');
    saveProgress(progress);
    updateStreakOnComplete();

    document.getElementById('speedDoneEmoji').textContent = finishedAll ? '🎉' : '⏱️';
    document.getElementById('speedDoneTitle').textContent = finishedAll ? 'Xong hết rồi!' : 'Hết giờ!';
    document.getElementById('speedDoneSubtitle').textContent =
      'Bé trả lời đúng ' + speedCorrectCount + '/' + speedWords.length + ' từ' +
      (bonus > 0 ? ', được thêm ' + bonus + ' sao thưởng tốc độ' : '') +
      ' — tổng cộng +' + starsEarned + ' sao!';

    document.getElementById('speedWrap').hidden = true;
    document.getElementById('speedDoneWrap').hidden = false;

    celebrate(finishedAll && speedCorrectCount === speedWords.length, oldLifetimeStars, null);
  }

  document.getElementById('backFromSpeed').addEventListener('click', () => {
    clearInterval(speedTimerId);
    speedTimerId = null;
    showScreen('games');
  });
  document.getElementById('speedReplayBtn').addEventListener('click', () => startSpeedQuiz(currentTopic.id, speedClassId));
  document.getElementById('speedOtherTopicBtn').addEventListener('click', () => showScreen('games'));

  // ---------- BÉ ĐỐ BA MẸ (chế độ đảo ngược: bé đã học rồi tự đố lại ba mẹ) ----------
  // Hiệu ứng "dạy lại để nhớ lâu hơn" (protégé effect): bé cầm máy đưa hình cho ba mẹ xem rồi đố
  // ba mẹ đoán từ tiếng Anh, tự bấm chấm ba mẹ đúng/sai — ôn từ vựng chủ động và vui hơn hẳn so
  // với tự làm quiz 1 mình. Không có khái niệm "bé sai" ở đây nên luôn thưởng 1 khoản sao cố định
  // cho công sức ôn bài, không phụ thuộc vào việc ba mẹ đoán đúng bao nhiêu.
  let quizParentWords = [];
  let quizParentIndex = 0;
  let quizParentScore = 0;

  // "Thách đấu": ba mẹ có 1 khoảng thời gian giới hạn để đoán trước khi bị tính hết giờ (coi như
  // đoán sai) — biến "Đố ba mẹ" từ chỗ chỉ có bé chấm đúng/sai thành có chút áp lực thời gian,
  // vui hơn cho cả nhà thay vì đoán từ từ không giới hạn như trước.
  const QUIZPARENT_TIME_LIMIT = 10;
  let quizParentTimerId = null;
  let quizParentTimeLeft = 0;

  function stopQuizParentTimer() {
    if (quizParentTimerId) { clearInterval(quizParentTimerId); quizParentTimerId = null; }
  }
  function startQuizParentTimer() {
    stopQuizParentTimer();
    quizParentTimeLeft = QUIZPARENT_TIME_LIMIT;
    const timerEl = document.getElementById('quizParentTimer');
    timerEl.hidden = false;
    timerEl.classList.remove('is-urgent');
    timerEl.textContent = '⏱️ ' + quizParentTimeLeft;
    quizParentTimerId = setInterval(() => {
      quizParentTimeLeft--;
      timerEl.textContent = '⏱️ ' + quizParentTimeLeft;
      timerEl.classList.toggle('is-urgent', quizParentTimeLeft <= 3);
      if (quizParentTimeLeft <= 0) {
        stopQuizParentTimer();
        handleQuizParentTimeout();
      }
    }, 1000);
  }
  // Hết giờ trước khi ba mẹ bấm "Xem đáp án" — tự lộ đáp án + tính là 1 câu chưa đoán được,
  // nhưng vẫn khựng lại 1 chút cho ba mẹ kịp đọc đáp án trước khi sang câu tiếp theo.
  function handleQuizParentTimeout() {
    document.getElementById('quizParentTimer').hidden = true;
    document.getElementById('quizParentAnswer').hidden = false;
    document.getElementById('quizParentRevealBtn').hidden = true;
    document.getElementById('quizParentJudge').hidden = true;
    showToast('⏰ Hết giờ rồi! Đáp án là "' + quizParentWords[quizParentIndex].en + '".', '⏰');
    setTimeout(() => judgeQuizParent(false), 1400);
  }

  function startQuizParent(topicId) {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLockedForPractice(topic)) { showLockedPracticeTopicNotice(topic); return; }
    currentTopic = topic;
    quizParentWords = shuffle(topic.words).slice(0, Math.min(QUIZPARENT_WORD_COUNT, topic.words.length));
    quizParentIndex = 0;
    quizParentScore = 0;
    document.getElementById('quizParentWrap').hidden = false;
    document.getElementById('quizParentDoneWrap').hidden = true;
    renderQuizParentQuestion();
    showScreen('quizparent');
  }

  function renderQuizParentQuestion() {
    const word = quizParentWords[quizParentIndex];
    document.getElementById('quizParentFill').style.width = (quizParentIndex / quizParentWords.length * 100) + '%';
    document.getElementById('quizParentEmoji').textContent = word.emoji;
    document.getElementById('quizParentEn').textContent = word.en;
    document.getElementById('quizParentVi').textContent = word.vi;
    document.getElementById('quizParentAnswer').hidden = true;
    document.getElementById('quizParentRevealBtn').hidden = false;
    document.getElementById('quizParentJudge').hidden = true;
    startQuizParentTimer();
  }

  document.getElementById('quizParentRevealBtn').addEventListener('click', () => {
    stopQuizParentTimer();
    document.getElementById('quizParentTimer').hidden = true;
    document.getElementById('quizParentAnswer').hidden = false;
    document.getElementById('quizParentRevealBtn').hidden = true;
    document.getElementById('quizParentJudge').hidden = false;
  });

  function judgeQuizParent(parentCorrect) {
    if (parentCorrect) quizParentScore++;
    quizParentIndex++;
    if (quizParentIndex >= quizParentWords.length) endQuizParent();
    else renderQuizParentQuestion();
  }
  document.getElementById('quizParentYesBtn').addEventListener('click', () => judgeQuizParent(true));
  document.getElementById('quizParentNoBtn').addEventListener('click', () => judgeQuizParent(false));

  function endQuizParent() {
    stopQuizParentTimer();
    const bonus = 2;
    const oldLifetimeStars = progress.lifetimeStars;
    addStars(bonus);
    bumpDailyMission('games');
    saveProgress(progress);
    updateStreakOnComplete();

    document.getElementById('quizParentFill').style.width = '100%';
    document.getElementById('quizParentDoneSubtitle').textContent =
      'Ba mẹ đoán đúng ' + quizParentScore + '/' + quizParentWords.length + ' từ — bé được thêm ' + bonus + ' sao vì đã ôn bài thật giỏi!';
    document.getElementById('quizParentWrap').hidden = true;
    document.getElementById('quizParentDoneWrap').hidden = false;

    celebrate(quizParentScore === quizParentWords.length, oldLifetimeStars);
  }

  document.getElementById('backFromQuizParent').addEventListener('click', () => { stopQuizParentTimer(); showScreen('games'); });
  document.getElementById('quizParentReplayBtn').addEventListener('click', () => startQuizParent(currentTopic.id));
  document.getElementById('quizParentOtherTopicBtn').addEventListener('click', () => showScreen('games'));

  // ---------- RƯƠNG MAY MẮN (thưởng ngẫu nhiên sau mỗi lượt học/ôn tập) ----------
  // Phần thưởng "không đoán trước được" luôn hấp dẫn hơn phần thưởng cố định (hiệu ứng tâm lý
  // dùng nhiều trong app cho trẻ em) — cộng thêm 1 khoản sao nhỏ, có xác suất trúng lớn hiếm gặp
  // để tạo bất ngờ, nhưng trung bình không lớn để không phá vỡ nhịp mở khoá chủ đề theo sao.
  const CHEST_REWARD_TABLE = [
    { chance: 0.40, stars: 1 },
    { chance: 0.30, stars: 2 },
    { chance: 0.15, stars: 3 },
    { chance: 0.10, stars: 5 },
    { chance: 0.05, stars: 10 },
  ];
  function rollChestReward() {
    let r = Math.random();
    for (const tier of CHEST_REWARD_TABLE) {
      if (r < tier.chance) return tier.stars;
      r -= tier.chance;
    }
    return 1;
  }
  function resetChest() {
    document.getElementById('chestBtn').hidden = false;
    document.getElementById('chestBtn').disabled = false;
    document.getElementById('chestReward').hidden = true;
  }
  document.getElementById('chestBtn').addEventListener('click', () => {
    const btn = document.getElementById('chestBtn');
    const rewardEl = document.getElementById('chestReward');
    btn.disabled = true;
    const bonus = rollChestReward();
    addStars(bonus);
    saveProgress(progress);
    renderTotalStars();
    btn.hidden = true;
    rewardEl.hidden = false;
    rewardEl.textContent = bonus >= 10 ? '🎉 Trúng lớn! +' + bonus + ' sao!' : '✨ +' + bonus + ' sao may mắn!';
    if (bonus >= 5) launchConfetti();
  });

  // ---------- DONE ----------
  // Ngưỡng "đạt" để mở khoá chủ đề tiếp theo — xem isTopicLocked. Dùng số câu đúng tối thiểu
  // (làm tròn lên) thay vì so sánh tỉ lệ thập phân trực tiếp, để tránh sai số dấu phẩy động và để
  // hiện được đúng số "X/Y" cần đạt trên màn hình cho từng chủ đề (không phải chủ đề nào cũng có
  // 10 từ — VD 4 chủ đề chào hỏi/số đếm/thời tiết/đồ ăn chỉ có 4 từ mỗi bài).
  const TOPIC_PASS_RATIO = 0.8;
  function finishTopic() {
    // Tính theo trạng thái mới nhất của từng từ (quizWordStatus) chứ không phải quizCorrectCount/quizOrder,
    // vì bé có thể đã làm lại nhiều vòng ở màn tổng kết (chỉ vòng cuối cùng mới phản ánh đúng số từ còn sai).
    const totalWords = currentTopic.words.length;
    const correctCount = currentTopic.words.filter((_, i) => quizWordStatus[i] !== false).length;
    const isPerfect = correctCount === totalWords;
    const requiredCorrect = Math.ceil(totalWords * TOPIC_PASS_RATIO);
    const passed = correctCount >= requiredCorrect;
    const starsEarned = correctCount;
    const oldLifetimeStars = progress.lifetimeStars;
    const isNewTopic = !progress.doneTopics[currentTopic.id];
    // Bảng chữ cái (ABC_TOPICS) không nằm trong TOPICS nên không có khoá tuần tự lẫn Trò chơi/Câu
    // riêng — subtitle/nút bấm cần đổi nội dung cho khớp, không nhắc "mở khoá chủ đề tiếp theo".
    const isAbcTopic = ABC_TOPICS.includes(currentTopic);
    const isChoiTopic = CHOI_TOPICS.includes(currentTopic);
    const isLaTopic = LA_TOPICS.includes(currentTopic);
    if (isNewTopic) {
      addStars(starsEarned);
      progress.doneTopics[currentTopic.id] = true;
    }
    if (isPerfect) progress.perfectCount = (progress.perfectCount || 0) + 1;
    if (passed) progress.topicPassed[currentTopic.id] = true;
    saveProgress(progress);
    updateStreakOnComplete();

    document.getElementById('doneTitle').textContent = isPerfect ? 'Xuất sắc! 🌟' : passed ? 'Giỏi quá!' : 'Cố lên nào!';
    document.getElementById('doneSubtitle').textContent = isAbcTopic
      ? 'Bé trả lời đúng ' + correctCount + '/' + totalWords + ' câu trong nhóm "' + currentTopic.label + '". ' +
        (passed ? '🌟 Bé nhớ chữ tốt lắm, học tiếp nhóm chữ khác nhé!' : '📌 Bé ôn lại nhóm chữ này thêm 1 lần nữa cho nhớ nhé!')
      : (isChoiTopic || isLaTopic)
      ? 'Bé trả lời đúng ' + correctCount + '/' + totalWords + ' câu trong chủ đề "' + currentTopic.label + '". ' +
        (passed ? '🌟 Bé nhớ từ tốt lắm, học tiếp chủ đề khác nhé!' : '📌 Bé ôn lại chủ đề này thêm 1 lần nữa cho nhớ nhé!')
      : 'Bé trả lời đúng ' + correctCount + '/' + totalWords + ' câu trong chủ đề "' + currentTopic.label + '". ' +
        (passed
          ? '🔓 Bé đã đạt yêu cầu, chủ đề tiếp theo mở khoá rồi!'
          : '📌 Bé cần đạt ít nhất ' + requiredCorrect + '/' + totalWords + ' câu đúng mới mở khoá được chủ đề tiếp theo — bấm "Học lại chủ đề này" để thử lại nhé!') +
        (isNewTopic ? ' 🎮 Trò chơi và Câu của chủ đề này cũng vừa mở khoá!' : '');
    document.getElementById('earnedStars').textContent = '⭐'.repeat(Math.max(1, correctCount));

    const tipWord = currentTopic.words[Math.floor(Math.random() * currentTopic.words.length)];
    document.getElementById('parentTip').innerHTML =
      '💬 Ba mẹ thử hỏi bé: "<strong>' + tipWord.vi + '</strong> tiếng Anh là gì nhỉ?" (đáp án: <strong>' + tipWord.en + '</strong>)';

    document.getElementById('printBtn').hidden = false;
    document.getElementById('printBtn').onclick = () => printTopicFlashcards(currentTopic);
    const replayBtn = document.getElementById('replayBtn');
    replayBtn.textContent = isAbcTopic ? 'Học lại nhóm chữ này' : 'Học lại chủ đề này';
    replayBtn.onclick = () => startTopic(currentTopic.id);

    renderTotalStars();
    celebrate(isPerfect, oldLifetimeStars, isNewTopic && PUZZLE_TOPICS.includes(currentTopic) ? currentTopic : null);
    resetChest();
    showScreen('done');
  }

  // Ôn tập tổng hợp xong: tính sao, kiểm tra huy hiệu, nhưng không gắn với 1 chủ đề cụ thể
  // (không có chủ đề để "học lại"/in flashcard riêng, chỉ có thể ôn tập lại 1 bộ từ ngẫu nhiên khác).
  // Dùng chung cho cả 3 kiểu ôn tập không gắn với 1 chủ đề cụ thể: tổng hợp / thông minh / từ khó
  // (không có chủ đề để "học lại"/in flashcard riêng, chỉ tính sao + cập nhật chuỗi ngày/huy hiệu).
  function finishReviewSession() {
    const isPerfect = quizCorrectCount === quizOrder.length;
    const oldLifetimeStars = progress.lifetimeStars;
    addStars(quizCorrectCount);
    if (isPerfect) progress.perfectCount = (progress.perfectCount || 0) + 1;
    saveProgress(progress);
    updateStreakOnComplete();

    const titleByKind = {
      mixed: 'Ôn tập xong rồi!',
      smart: 'Ôn tập thông minh xong rồi!',
      difficult: 'Luyện từ khó xong rồi!',
    };
    const tipByKind = {
      mixed: '💬 Ba mẹ có thể cho bé ôn tập tổng hợp bất cứ lúc nào ở tab Tiến độ nhé!',
      smart: '💬 App sẽ tự nhắc đúng lúc bé sắp quên — cứ ôn đều mỗi khi có từ đến hạn nhé!',
      difficult: '💬 Những từ bé trả lời đúng liên tục sẽ tự rời khỏi danh sách "từ khó" này.',
    };
    const replayByKind = { mixed: startMixedReview, smart: startSmartReview, difficult: startDifficultReview };

    document.getElementById('doneTitle').textContent = isPerfect ? 'Xuất sắc! 🌟' : titleByKind[reviewKind];
    document.getElementById('doneSubtitle').textContent = 'Bé ôn tập đúng ' + quizCorrectCount + '/' + quizOrder.length + ' câu.';
    document.getElementById('earnedStars').textContent = '⭐'.repeat(Math.max(1, quizCorrectCount));
    document.getElementById('parentTip').innerHTML = tipByKind[reviewKind];

    document.getElementById('printBtn').hidden = true;
    const replayBtn = document.getElementById('replayBtn');
    replayBtn.textContent = 'Ôn tập lại';
    replayBtn.onclick = replayByKind[reviewKind];

    renderTotalStars();
    celebrate(isPerfect, oldLifetimeStars);
    resetChest();
    isMixedReview = false;
    showScreen('done');
  }

  document.getElementById('backHomeBtn').addEventListener('click', () => goHome());

  // ---------- PRINT FLASHCARDS ----------
  function printTopicFlashcards(topic) {
    const area = document.getElementById('printArea');
    area.innerHTML =
      '<h1>' + topic.label + '</h1>' +
      topic.words.map(w =>
        '<div class="print-card">' +
          '<div class="print-emoji">' + w.emoji + '</div>' +
          '<div class="print-en">' + w.en + '</div>' +
          '<div class="print-vi">' + w.vi + '</div>' +
        '</div>'
      ).join('');
    window.print();
  }

  // ---------- SHARE PROGRESS CARD ----------
  // Vẽ 1 ảnh tổng kết tiến độ bằng Canvas (không dùng ảnh ngoài để tránh lỗi bảo mật
  // "tainted canvas" khi lưu/chia sẻ ảnh) để phụ huynh lưu lại hoặc chia sẻ lên Facebook.
  function drawShareCard() {
    const canvas = document.getElementById('shareCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#FFF1DA');
    grad.addColorStop(1, '#FFF8EC');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    ctx.font = '80px sans-serif';
    ctx.fillText('🦊', W / 2, 130);

    ctx.fillStyle = '#4A3F35';
    ctx.font = '700 32px "Baloo 2", sans-serif';
    ctx.fillText('Bảng thành tích học tiếng Anh', W / 2, 195);
    const shareLv = PLACEMENT_LEVELS[getActiveClassId()];
    ctx.fillStyle = '#8A7B68';
    ctx.font = '700 20px Quicksand, sans-serif';
    ctx.fillText(shareLv.emoji + ' ' + shareLv.label, W / 2, 232);
    ctx.fillStyle = '#4A3F35';

    const level = getLevel(progress.lifetimeStars);
    const doneCount = TOPICS.filter(t => progress.doneTopics[t.id]).length;

    ctx.font = '58px sans-serif';
    ctx.fillText(level.emoji, W / 2, 290);
    ctx.font = '700 26px "Baloo 2", sans-serif';
    ctx.fillStyle = '#A6431E';
    ctx.fillText(level.label, W / 2, 328);

    const stats = [
      { icon: '⭐', value: progress.stars, label: 'Sao' },
      getClassStat(),
      { icon: '🔥', value: progress.streak.count, label: 'Ngày liên tiếp' },
    ];
    const colW = W / stats.length;
    stats.forEach((s, i) => {
      const cx = colW * i + colW / 2;
      ctx.font = '42px sans-serif';
      ctx.fillStyle = '#4A3F35';
      ctx.fillText(s.icon, cx, 420);
      ctx.font = '700 28px "Baloo 2", sans-serif';
      ctx.fillText(String(s.value), cx, 460);
      ctx.font = '700 18px Quicksand, sans-serif';
      ctx.fillStyle = '#8A7B68';
      ctx.fillText(s.label, cx, 488);
    });

    ctx.font = '700 20px Quicksand, sans-serif';
    ctx.fillStyle = '#8A7B68';
    ctx.fillText('Huy hiệu đã đạt được', W / 2, 548);

    const earnedBadges = BADGES.filter(b => progress.badges[b.id]);
    if (earnedBadges.length) {
      const bw = Math.min(70, (W - 60) / earnedBadges.length);
      const totalW = bw * earnedBadges.length;
      const startX = (W - totalW) / 2 + bw / 2;
      earnedBadges.forEach((b, i) => {
        ctx.font = Math.min(44, Math.floor(bw * 0.9)) + 'px sans-serif'; // nhiều huy hiệu thì thu nhỏ để không chồng lên nhau
        ctx.fillText(b.icon, startX + i * bw, 598);
      });
    } else {
      ctx.font = '700 19px Quicksand, sans-serif';
      ctx.fillText('Chưa có huy hiệu nào — cố lên nhé!', W / 2, 596);
    }

    ctx.font = '700 18px "Baloo 2", sans-serif';
    ctx.fillStyle = '#8A7B68';
    ctx.fillText('5 Phút Tiếng Anh Mỗi Ngày', W / 2, H - 42);
    ctx.font = '700 15px Quicksand, sans-serif';
    ctx.fillText('Bản dùng thử miễn phí từ Fanpage', W / 2, H - 18);
  }

  // "Chia sẻ" là 1 nút hành động trong thanh tab (mở overlay), không phải màn hình riêng —
  // không đưa vào TOP_LEVEL_SCREENS/setActiveTab nên tab đang chọn trước đó vẫn giữ nguyên trạng thái active.
  document.getElementById('tabShare').addEventListener('click', () => {
    document.getElementById('shareOverlay').hidden = false;
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(drawShareCard).catch(drawShareCard);
  });
  document.getElementById('shareCloseBtn').addEventListener('click', () => {
    document.getElementById('shareOverlay').hidden = true;
  });
  document.getElementById('shareDownloadBtn').addEventListener('click', () => {
    const canvas = document.getElementById('shareCanvas');
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tien-do-hoc-tieng-anh.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  });
  if (navigator.share && navigator.canShare) {
    const shareNativeBtn = document.getElementById('shareNativeBtn');
    shareNativeBtn.hidden = false;
    shareNativeBtn.addEventListener('click', () => {
      const canvas = document.getElementById('shareCanvas');
      canvas.toBlob(async blob => {
        const file = new File([blob], 'tien-do-hoc-tieng-anh.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: '5 Phút Tiếng Anh Mỗi Ngày' }); } catch (e) {}
        }
      }, 'image/png');
    });
  }

  // ---------- CHỨNG NHẬN THÀNH TÍCH ----------
  // Vẽ 1 tờ "chứng nhận" bằng Canvas (cùng kỹ thuật với drawShareCard ở trên) để ba mẹ lưu về
  // hoặc in ra làm kỷ niệm cho bé — ghi tên bé (lấy từ hồ sơ nếu có), cấp độ và số sao hiện tại.
  function drawCertificate() {
    const canvas = document.getElementById('certificateCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#FFF8EC');
    grad.addColorStop(1, '#FFF1DA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#D9A441';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, W - 36, H - 36);
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    ctx.textAlign = 'center';
    ctx.font = '54px sans-serif';
    ctx.fillText('🏆', W / 2, 108);

    ctx.fillStyle = '#A6431E';
    ctx.font = '700 30px "Baloo 2", sans-serif';
    ctx.fillText('CHỨNG NHẬN THÀNH TÍCH', W / 2, 152);

    ctx.fillStyle = '#8A7B68';
    ctx.font = '700 16px Quicksand, sans-serif';
    ctx.fillText('Trao tặng bé', W / 2, 195);

    const childName = (profile && profile.name) ? profile.name : 'yêu quý';
    ctx.fillStyle = '#4A3F35';
    ctx.font = '700 40px "Baloo 2", sans-serif';
    ctx.fillText(childName, W / 2, 246);
    const certLv = PLACEMENT_LEVELS[getActiveClassId()];
    ctx.fillStyle = '#8A7B68';
    ctx.font = '700 17px Quicksand, sans-serif';
    ctx.fillText(certLv.emoji + ' ' + certLv.label, W / 2, 272);

    const level = getLevel(progress.lifetimeStars);
    const doneCount = TOPICS.filter(t => progress.doneTopics[t.id]).length;
    ctx.fillStyle = '#4A3F35';
    ctx.font = '700 20px Quicksand, sans-serif';
    ctx.fillText('Đã đạt cấp độ', W / 2, 296);
    ctx.font = '44px sans-serif';
    ctx.fillText(level.emoji, W / 2, 350);
    ctx.font = '700 24px "Baloo 2", sans-serif';
    ctx.fillStyle = '#A6431E';
    ctx.fillText(level.label, W / 2, 382);

    const stats = [
      { icon: '⭐', value: progress.stars, label: 'Sao' },
      getClassStat(),
      { icon: '🔥', value: progress.streak.best || 0, label: 'Kỷ lục chuỗi ngày' },
    ];
    const colW = W / stats.length;
    stats.forEach((s, i) => {
      const cx = colW * i + colW / 2;
      ctx.font = '30px sans-serif';
      ctx.fillStyle = '#4A3F35';
      ctx.fillText(s.icon, cx, 424);
      ctx.font = '700 22px "Baloo 2", sans-serif';
      ctx.fillText(String(s.value), cx, 452);
      ctx.font = '700 14px Quicksand, sans-serif';
      ctx.fillStyle = '#8A7B68';
      ctx.fillText(s.label, cx, 472);
    });

    const dateStr = new Date().toLocaleDateString('vi-VN');
    ctx.font = '700 15px Quicksand, sans-serif';
    ctx.fillStyle = '#8A7B68';
    ctx.fillText('Ngày ' + dateStr, W / 2, H - 68);
    ctx.font = '700 17px "Baloo 2", sans-serif';
    ctx.fillText('5 Phút Tiếng Anh Mỗi Ngày', W / 2, H - 46);
  }

  document.getElementById('certificateBtn').addEventListener('click', () => {
    document.getElementById('certificateOverlay').hidden = false;
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(drawCertificate).catch(drawCertificate);
  });
  document.getElementById('certificateCloseBtn').addEventListener('click', () => {
    document.getElementById('certificateOverlay').hidden = true;
  });
  document.getElementById('certificateDownloadBtn').addEventListener('click', () => {
    const canvas = document.getElementById('certificateCanvas');
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chung-nhan-thanh-tich.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  });

  // ---------- WEEKLY REVIEW DEEP LINK ----------
  // Chia sẻ link dạng ...?week=2 (tuần 1 = TOPICS[0], tuần 2 = TOPICS[1], v.v. — lặp vòng theo
  // đúng số chủ đề hiện có trong TOPICS, kể cả các chủ đề đang khoá — nên khi đặt link tuần
  // trên Fanpage, ưu tiên trỏ vào các chủ đề miễn phí để phụ huynh không gặp màn khoá bất ngờ).
  // hoặc dùng ...?topic=animals để trỏ thẳng vào 1 chủ đề cụ thể.
  function getWeeklyTopic() {
    const params = new URLSearchParams(window.location.search);
    const topicParam = params.get('topic');
    if (topicParam) {
      const found = TOPICS.find(t => t.id === topicParam);
      if (found) return found;
    }
    const weekParam = parseInt(params.get('week'), 10);
    if (!isNaN(weekParam) && weekParam > 0) {
      return TOPICS[(weekParam - 1) % TOPICS.length];
    }
    return null;
  }

  function openWeeklyIntro(topic, weekLabel) {
    document.getElementById('weeklyBadge').textContent = weekLabel;
    document.getElementById('weeklyEmoji').textContent = topic.emoji;
    document.getElementById('weeklyTitle').textContent = topic.label;
    document.getElementById('weeklyDesc').textContent =
      'Ba mẹ bấm bắt đầu để cùng bé ôn lại ' + topic.words.length + ' từ vựng tuần này qua flashcard và mini game nhé!';
    document.getElementById('weeklyStartBtn').onclick = () => startTopic(topic.id);
    showScreen('weekly');
  }

  document.getElementById('backFromWeekly').addEventListener('click', () => goHome());

  function goHome() {
    renderHome();
    showScreen('home');
    moveSegmentThumb(document.getElementById('homeModeToggle'));
    moveSegmentThumb(document.getElementById('choiHomeModeToggle'));
  }

  // Chạy 1 lần duy nhất mỗi phiên, đúng lúc gate (xác thực + hồ sơ) vừa được thoả lần đầu —
  // dù người dùng thoả gate ngay lúc mở app hay sau khi vừa tạo hồ sơ xong.
  let gateBootDone = false;
  function bootAfterGate() {
    goHome();
    if (gateBootDone) return;
    gateBootDone = true;

    const params = new URLSearchParams(window.location.search);
    const weeklyTopic = getWeeklyTopic();
    if (weeklyTopic) {
      const weekParam = params.get('week');
      const weekLabel = weekParam ? ('Bài ôn tập tuần ' + weekParam) : 'Bài ôn tập tuần này';
      // Banner trên trang chủ để phụ huynh thấy ngay cả khi không bấm link riêng
      const banner = document.getElementById('weekBanner');
      banner.hidden = false;
      document.getElementById('weekBannerEmoji').textContent = weeklyTopic.emoji;
      document.getElementById('weekBannerTitle').textContent = weeklyTopic.label;
      banner.onclick = () => openWeeklyIntro(weeklyTopic, weekLabel);
      // Mở thẳng màn hình ôn tập tuần vì phụ huynh bấm link từ Facebook vào đây với mục đích này
      openWeeklyIntro(weeklyTopic, weekLabel);
    }

    let onboardingSeen = false;
    try { onboardingSeen = localStorage.getItem(ONBOARDING_KEY) === '1'; } catch (e) {}
    if (!onboardingSeen) showOnboarding();
  }

  // Xác thực email + hồ sơ bé là bắt buộc trước khi vào học (xem enforceGate ở trên). Nếu email
  // đã xác thực từ trước nhưng máy NÀY chưa có hồ sơ lưu local (thiết bị mới, hoặc vừa mất cache) —
  // phải hỏi cloud trước khi kết luận "chưa có hồ sơ", nếu không sẽ bắt tạo hồ sơ mới dù hồ sơ đã
  // có sẵn trên Google Sheet (enforceGate() một mình chỉ nhìn state local, không tự động hỏi cloud).
  if (verifiedEmail && !profile && backendConfigured()) {
    showLoading('Đang khôi phục hồ sơ...');
    fetchCloudDataAndProceed();
    checkDeviceSession();
  } else if (enforceGate()) {
    bootAfterGate();
    checkDeviceSession();
  }

  // ---------- OFFLINE SUPPORT ----------
  // Đăng ký service worker để app + audio + icon dùng lại được kể cả khi mất mạng
  // sau lần mở đầu tiên (xem sw.js).
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
