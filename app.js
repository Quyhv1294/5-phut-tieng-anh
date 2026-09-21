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
  const MATCH_PAIR_COUNT = 4; // Ghép tranh chỉ lấy ngẫu nhiên 4 cặp/lượt cho vừa sức bé, không cần hết cả chủ đề
  const SPELLING_WORD_COUNT = 4; // Xếp chữ cũng chỉ lấy ngẫu nhiên 4 từ/lượt, cùng độ khó với Ghép tranh
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
  const OUTFITS = [
    { id: 'scarf', emoji: '🧣', label: 'Khăn quàng', unlocksAt: 10 },
    { id: 'ribbon', emoji: '🎀', label: 'Nơ xinh', unlocksAt: 25 },
    { id: 'hat', emoji: '🎩', label: 'Mũ chóp', unlocksAt: 50 },
    { id: 'glasses', emoji: '🕶️', label: 'Kính râm', unlocksAt: 100 },
    { id: 'necktie', emoji: '👔', label: 'Cà vạt', unlocksAt: 150 },
    { id: 'crown', emoji: '👑', label: 'Vương miện', unlocksAt: 250 },
  ];

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
  // Di trú 1 lần cho purchasedTopics (Trò chơi/Câu dùng riêng cơ chế mua bằng sao — xem
  // isTopicLockedForPractice, khác với isTopicLocked tuần tự dùng cho Tap "Học"): nếu chưa từng
  // có purchasedTopics, coi mọi chủ đề bé ĐÃ đạt (topicPassed) hoặc đã học qua (doneTopics) tại
  // thời điểm này là "đã mua" luôn, để không đột nhiên khoá lại nội dung Trò chơi/Câu bé đang
  // chơi được (chỉ chủ đề bé CHƯA từng chạm tới mới thực sự cần mua từ đây trở đi).
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
    // Di trú 1 lần cho topicsSeen (chỉ dùng để tránh báo lại toast "đủ sao để mua chủ đề" nhiều
    // lần — xem checkNewPracticeTopicUnlocks): nếu chưa từng có, coi các chủ đề bé ĐÃ đủ sao (số
    // sao tiêu được, không phải tổng trọn đời) từ trước rồi là "đã thấy" luôn, để không dội 1 loạt
    // toast dồn dập cho những mốc bé đã vượt qua từ lâu trước khi tính năng này tồn tại.
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
      topicsSeen: topicsSeen,
      equippedOutfit: p.equippedOutfit || null,
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
      outfitsSeen: {}, topicsSeen: {}, equippedOutfit: null,
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
  TOPICS.forEach(topic => {
    topic.words.forEach(w => {
      WORD_TO_TOPIC.set(w, topic);
      WORD_BY_KEY.set(topic.id + ':' + w.en, w);
    });
  });

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
  function getDueWords(limit) {
    const todayStr = toDateStr(new Date());
    const due = [];
    Object.keys(progress.wordStats).forEach(key => {
      const stat = progress.wordStats[key];
      const word = WORD_BY_KEY.get(key);
      if (word && stat.nextDue && stat.nextDue <= todayStr) due.push({ word: word, nextDue: stat.nextDue });
    });
    due.sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1));
    return due.slice(0, limit || 12).map(d => d.word);
  }

  // Các từ bé hay trả lời sai (sai >= ngưỡng, chưa "gỡ" lại đủ bằng các lần đúng sau đó).
  function getDifficultWords(limit) {
    const list = [];
    Object.keys(progress.wordStats).forEach(key => {
      const stat = progress.wordStats[key];
      const word = WORD_BY_KEY.get(key);
      if (word && stat.wrongCount >= DIFFICULT_WRONG_THRESHOLD) list.push({ word: word, wrongCount: stat.wrongCount });
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
    badges: document.getElementById('screen-badges'),
    progress: document.getElementById('screen-progress'),
    settings: document.getElementById('screen-settings'),
    account: document.getElementById('screen-account'),
    donate: document.getElementById('screen-donate'),
    profileCreate: document.getElementById('screen-profile-create'),
    cards: document.getElementById('screen-cards'),
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
    thumb.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }
  window.addEventListener('resize', () => {
    ['gamesModeToggle', 'sentencesModeToggle', 'collectionModeToggle'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetParent !== null) moveSegmentThumb(el);
    });
  });

  document.getElementById('tabHome').addEventListener('click', () => { renderHome(); showScreen('home'); });
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

  // Chủ đề trong Tap "Trò chơi" và "Câu" KHÔNG dùng khoá tuần tự ở trên — 2 tab này giữ cơ chế
  // mua bằng sao cũ: đủ mốc sao (topic.unlocksAt) chỉ mở ra CƠ HỘI mua, bé phải tự bấm mua (trừ
  // thẳng vào progress.stars) mới thực sự chơi được, độc lập với việc chủ đề đó đã mở ở Tap "Học"
  // hay chưa. 4 chủ đề đầu (không có unlocksAt) luôn miễn phí ở mọi tab.
  function isTopicLockedForPractice(topic) {
    return !!topic.unlocksAt && !progress.purchasedTopics[topic.id];
  }
  function isTopicBuyable(topic) {
    return isTopicLockedForPractice(topic) && progress.stars >= topic.unlocksAt;
  }
  function practiceLockReasonText(topic) {
    if (progress.stars < topic.unlocksAt) return 'Cần thêm ' + Math.max(0, topic.unlocksAt - progress.stars) + ' sao';
    return 'Mua ngay · ' + topic.unlocksAt + '⭐ (đang có ' + progress.stars + ')';
  }
  function practiceLockClasses(topic) {
    if (!isTopicLockedForPractice(topic)) return '';
    return isTopicBuyable(topic) ? ' is-locked is-buyable' : ' is-locked';
  }
  function practiceLockBadgeHtml(topic) {
    if (!isTopicLockedForPractice(topic)) return '';
    return isTopicBuyable(topic) ? '<span class="buy-badge">🛒 Mua</span>' : '<span class="lock-badge">🔒</span>';
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
    // Huy hiệu này còn quyết định lúc nào rương kho báu trên trang chủ mở ra (xem renderHome) —
    // nên cần có phần thưởng thật sự tương xứng, không chỉ là 1 huy hiệu để khoe.
    { id: 'all_topics', icon: '🏆', label: 'Bậc thầy tí hon', desc: 'Hoàn thành tất cả chủ đề (+50 sao, mở kho báu bí mật!)', bonus: 50, check: p => TOPICS.every(t => p.doneTopics[t.id]) },
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
  // — cấp độ không được phép tụt theo, phải tính trên tổng sao TỪNG kiếm được. (Thông báo "đủ sao
  // để mua chủ đề Trò chơi/Câu" KHÔNG ăn theo lên cấp — xem checkNewPracticeTopicUnlocks bên dưới
  // — vì mốc sao mua chủ đề có thể vượt quá cấp cao nhất trong LEVELS, lúc đó checkLevelUp luôn
  // trả về null nên thông báo sẽ không bao giờ hiện.)
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

  // Hiện lần lượt từng thẻ thông báo huy hiệu mới mở khoá (nếu có nhiều huy hiệu 1 lúc).
  function showBadgeToasts(badges) {
    if (!badges.length) return;
    let i = 0;
    function next() {
      if (i >= badges.length) return;
      const b = badges[i++];
      const toast = document.createElement('div');
      toast.className = 'badge-toast';
      const bonusLine = b.bonus ? '<br><span class="badge-unlock">🎁 Thưởng +' + b.bonus + ' sao!</span>' : '';
      toast.innerHTML =
        '<span class="badge-icon">' + b.icon + '</span>' +
        '<span><span class="badge-eyebrow">Huy hiệu mới!</span><br><span class="badge-label">' + b.label + '</span>' + bonusLine + '</span>';
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('is-visible'));
      setTimeout(() => {
        toast.classList.remove('is-visible');
        setTimeout(() => { toast.remove(); next(); }, 300);
      }, 2600);
    }
    next();
  }

  // Thông báo lên cấp — dùng lại khung .badge-toast (viền vàng, giống huy hiệu) vì đây cũng
  // là 1 cột mốc thành tích.
  function showLevelUpToast(levelUp) {
    const toast = document.createElement('div');
    toast.className = 'badge-toast';
    toast.innerHTML =
      '<span class="badge-icon">' + levelUp.level.emoji + '</span>' +
      '<span><span class="badge-eyebrow">Lên cấp!</span><br><span class="badge-label">' + levelUp.level.label + '</span></span>';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
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

  // Bấm vào 1 chủ đề đang khoá trong Tap "Trò chơi"/"Câu": nếu chưa đủ sao thì chỉ báo còn thiếu
  // bao nhiêu; nếu đã đủ thì cho bé chọn có muốn MUA (trừ thẳng vào progress.stars) hay không —
  // không tự động mở khoá dù đã đủ sao (xem isTopicLockedForPractice).
  async function showLockedPracticeTopicNotice(topic) {
    const cost = topic.unlocksAt;
    if (progress.stars < cost) {
      showToast('🔒 ' + practiceLockReasonText(topic) + ' để mở khoá "' + topic.label + '"!', '🔒');
      return;
    }
    const ok = await showConfirmDialog(
      'Dùng ' + cost + ' sao để mua chủ đề "' + topic.label + '" cho Trò chơi & Câu? (còn lại ' + (progress.stars - cost) + ' sao sau khi mua)',
      { okLabel: 'Mua ngay' }
    );
    if (!ok) return;
    progress.stars -= cost;
    progress.purchasedTopics[topic.id] = true;
    saveProgress(progress);
    showToast('🎉 Đã mua chủ đề "' + topic.label + '"!', '🎉');
    launchConfetti();
    renderGamesScreen();
    renderSentencesScreen();
    renderTotalStars();
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
  // oldStars/oldLifetimeStars phải chụp lại TRƯỚC khi addStars() chạy ở nơi gọi — 2 số khác nhau
  // (stars có thể đã bị bé tiêu trước đó, lifetimeStars thì không) nên không thể suy ra số này từ
  // số kia, phải truyền cả 2 vào riêng.
  function celebrate(isPerfect, oldStars, oldLifetimeStars, newPieceTopic) {
    const newBadges = checkNewBadges();
    const levelUp = checkLevelUp(oldLifetimeStars);
    const newOutfits = checkNewOutfitUnlocks(oldStars);
    const newPracticeTopics = checkNewPracticeTopicUnlocks(oldStars);
    if (isPerfect || newBadges.length || levelUp || newPieceTopic || newOutfits.length || newPracticeTopics.length) launchConfetti();
    showBadgeToasts(newBadges);
    const afterBadges = newBadges.length * 2900;
    if (levelUp) setTimeout(() => showLevelUpToast(levelUp), afterBadges);
    const afterLevelUp = afterBadges + (levelUp ? 3200 : 0);
    if (newPieceTopic) setTimeout(() => showPuzzlePieceToast(newPieceTopic), afterLevelUp);
    const afterPiece = afterLevelUp + (newPieceTopic ? 2600 : 0);
    newOutfits.forEach((o, i) => setTimeout(() => showOutfitUnlockToast(o), afterPiece + i * 2600));
    const afterOutfits = afterPiece + newOutfits.length * 2600;
    newPracticeTopics.forEach((t, i) => setTimeout(() => showPracticeTopicUnlockToast(t), afterOutfits + i * 2600));
    renderTotalStars(); // huy hiệu chuỗi ngày có thể vừa cộng thêm sao thưởng, cập nhật lại topbar cho khớp
  }

  // Thông báo có mảnh ghép tranh mới (học xong 1 chủ đề lần đầu) — dùng lại khung .badge-toast,
  // xếp hàng sau huy hiệu/lên cấp (nếu có) để không đè lên nhau.
  function showPuzzlePieceToast(topic) {
    const toast = document.createElement('div');
    toast.className = 'badge-toast';
    toast.innerHTML =
      '<span class="badge-icon">🖼️</span>' +
      '<span><span class="badge-eyebrow">Có mảnh ghép mới!</span><br><span class="badge-label">' + topic.label +
      '</span><br><span class="badge-unlock">Vào mục Sưu tập để ghép vào bức tranh nhé!</span></span>';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2600);
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
  function blankDailyStats() { return { sessions: 0, games: 0, starsEarned: 0 }; }
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
    if (dm.claimed || !DAILY_MISSIONS.every(m => m.check(dm.stats))) return;
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
    DAILY_MISSIONS.forEach(m => {
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
    const doneTopicsList = TOPICS.filter(t => progress.doneTopics[t.id]);
    const doneCount = doneTopicsList.length;
    const doneWords = doneTopicsList.reduce((sum, t) => sum + t.words.length, 0);
    document.getElementById('progressStars').textContent = progress.stars;
    document.getElementById('progressTopicsDone').textContent = doneCount + '/' + TOPICS.length;
    document.getElementById('progressWords').textContent = doneWords;
    document.getElementById('progressStreakBest').textContent = progress.streak.best || 0;

    const level = getLevel(progress.lifetimeStars);
    document.getElementById('levelEmoji').textContent = level.emoji;
    document.getElementById('levelLabel').textContent = level.label;

    const list = document.getElementById('progressList');
    list.innerHTML = '';
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
    BADGES.forEach(b => {
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
  // Cập nhật icon phụ kiện đang "mặc" — hiện ở CẢ 2 nơi: badge nhỏ đè lên mascot góc trên, và badge
  // to hơn đè lên hình chú cáo toàn thân (assets/mascot-fox.png) ở đầu màn Trang phục. Gọi lại mỗi
  // khi equippedOutfit đổi hoặc lúc khởi động app.
  function renderMascotAccessory() {
    const outfit = OUTFITS.find(o => o.id === progress.equippedOutfit);
    ['mascotAccessory', 'shopMascotAccessory'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (outfit) { el.textContent = outfit.emoji; el.hidden = false; }
      else { el.hidden = true; }
    });
  }
  renderMascotAccessory();

  function renderOutfitShop() {
    const grid = document.getElementById('outfitGrid');
    grid.innerHTML = '';
    let ownedCount = 0;
    OUTFITS.forEach(outfit => {
      const owned = !!progress.purchasedOutfits[outfit.id];
      const buyable = !owned && progress.stars >= outfit.unlocksAt;
      const equipped = progress.equippedOutfit === outfit.id;
      if (owned) ownedCount++;
      const card = document.createElement('button');
      card.className = 'outfit-card' + (owned ? ' is-owned' : '') + (equipped ? ' is-equipped' : '') + (buyable ? ' is-buyable' : '');
      const countText = owned ? (equipped ? 'Bấm để cởi ra' : 'Bấm để mặc vào') :
        buyable ? 'Mua ngay · ' + outfit.unlocksAt + '⭐ (đang có ' + progress.stars + ')' :
        'Cần thêm ' + (outfit.unlocksAt - progress.stars) + ' sao';
      card.innerHTML =
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
    const owned = !!progress.purchasedOutfits[outfit.id];
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
    progress.equippedOutfit = progress.equippedOutfit === outfit.id ? null : outfit.id;
    saveProgress(progress);
    renderMascotAccessory();
    renderOutfitShop();
  }

  // Kiểm tra sau mỗi lần cộng sao xem có vừa đủ mốc MUA trang phục mới không (giống checkLevelUp)
  // — progress.outfitsSeen chỉ dùng để tránh báo lại 1 trang phục nhiều lần, KHÔNG tự cấp trang
  // phục (bé vẫn phải tự bấm mua trong tủ đồ).
  function checkNewOutfitUnlocks(oldStars) {
    if (typeof oldStars !== 'number') return [];
    const newly = [];
    OUTFITS.forEach(o => {
      if (!progress.outfitsSeen[o.id] && !progress.purchasedOutfits[o.id] && progress.stars >= o.unlocksAt) {
        progress.outfitsSeen[o.id] = true;
        newly.push(o);
      }
    });
    if (newly.length) saveProgress(progress);
    return newly;
  }
  function showOutfitUnlockToast(outfit) {
    const toast = document.createElement('div');
    toast.className = 'badge-toast';
    toast.innerHTML =
      '<span class="badge-icon">' + outfit.emoji + '</span>' +
      '<span><span class="badge-eyebrow">Đủ sao để mua trang phục!</span><br><span class="badge-label">' + outfit.label +
      '</span><br><span class="badge-unlock">Vào mục Sưu tập để mua cho chú cáo nhé!</span></span>';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2600);
  }

  // Kiểm tra sau mỗi lần cộng sao xem có vừa đủ mốc MUA chủ đề Trò chơi/Câu mới không — giống hệt
  // checkNewOutfitUnlocks, tách RIÊNG khỏi checkLevelUp/LEVELS (không dùng "vừa lên cấp" làm dấu
  // hiệu) vì mốc sao mua chủ đề (VD 350) có thể vượt quá cấp cao nhất trong LEVELS (hiện tại dừng
  // ở 200) — lúc đó checkLevelUp() sẽ mãi mãi trả về null nên nếu ăn theo lên cấp, thông báo sẽ
  // không bao giờ hiện dù bé đã đủ sao mua từ lâu. progress.topicsSeen chỉ để tránh báo lại nhiều
  // lần, KHÔNG tự cấp chủ đề (bé vẫn phải tự bấm mua ở tab Trò chơi/Câu).
  function checkNewPracticeTopicUnlocks(oldStars) {
    if (typeof oldStars !== 'number') return [];
    const newly = [];
    TOPICS.forEach(t => {
      if (t.unlocksAt && !progress.topicsSeen[t.id] && !progress.purchasedTopics[t.id] && progress.stars >= t.unlocksAt) {
        progress.topicsSeen[t.id] = true;
        newly.push(t);
      }
    });
    if (newly.length) saveProgress(progress);
    return newly;
  }
  function showPracticeTopicUnlockToast(topic) {
    const toast = document.createElement('div');
    toast.className = 'badge-toast';
    toast.innerHTML =
      '<span class="badge-icon">🛒</span>' +
      '<span><span class="badge-eyebrow">Đủ sao để mua chủ đề!</span><br><span class="badge-label">' + topic.label +
      '</span><br><span class="badge-unlock">Vào tab Trò chơi/Câu để mua nhé!</span></span>';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2600);
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
    if (enforceGate()) bootAfterGate();
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
  function renderGamesScreen() {
    const grid = document.getElementById('gamesTopicGrid');
    grid.innerHTML = '';
    TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + practiceLockClasses(topic);
      const countText = isTopicLockedForPractice(topic) ? practiceLockReasonText(topic) :
        gamesMode === 'match' ? 'Ghép ' + Math.min(MATCH_PAIR_COUNT, topic.words.length) + ' cặp' :
        gamesMode === 'spell' ? 'Xếp ' + Math.min(SPELLING_WORD_COUNT, topic.words.length) + ' từ' :
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
  function renderSentencesScreen() {
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
    const doneCount = TOPICS.filter(t => progress.doneTopics[t.id]).length;
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

  function renderHome() {
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
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLocked(topic)) { showLockedTopicNotice(topic); return; }
    currentTopic = topic;
    cardIndex = 0;
    isMixedReview = false;
    renderCard();
    showScreen('cards');
  }

  function renderCard() {
    const w = currentTopic.words[cardIndex];
    document.getElementById('cardEmoji').textContent = w.emoji;
    document.getElementById('cardWordEn').textContent = w.en;
    document.getElementById('cardWordVi').textContent = w.vi;
    const pct = ((cardIndex) / currentTopic.words.length) * 100;
    document.getElementById('cardProgressFill').style.width = pct + '%';
    document.getElementById('prevCardBtn').disabled = cardIndex === 0;
    document.getElementById('nextCardBtn').textContent = (cardIndex === currentTopic.words.length - 1) ? 'Ôn tập →' : 'Tiếp →';
    resetReadAloud();
  }

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
  document.getElementById('backFromCards').addEventListener('click', () => { resetReadAloud(); showScreen('home'); });

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
    TOPICS.forEach(t => { if (progress.doneTopics[t.id]) pool.push(...t.words); });
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

    const distractors = shuffle(currentTopic.words.filter((_, i) => i !== wIdx)).slice(0, 3);
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

  document.getElementById('backFromQuizRecap').addEventListener('click', () => showScreen('home'));

  document.getElementById('backFromQuiz').addEventListener('click', () => showScreen(isMixedReview ? 'progress' : 'home'));

  // ---------- MATCHING GAME ----------
  // matchMode: 'learn' (sau flashcard+quiz, được tính sao) hoặc 'practice' (chơi tự do từ tab Trò chơi, không tính sao)
  let matchMode = 'learn';
  let matchCards = [];
  let matchWords = [];
  let matchSelected = [];
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
    matchSelected = [];
    matchLock = false;
    document.getElementById('matchWrap').hidden = false;
    document.getElementById('matchDoneWrap').hidden = true;
    matchWords = shuffle(currentTopic.words).slice(0, Math.min(MATCH_PAIR_COUNT, currentTopic.words.length));
    const cards = [];
    matchWords.forEach((w, i) => {
      cards.push({ pairId: i, type: 'word', content: w.en });
      cards.push({ pairId: i, type: 'emoji', content: w.emoji });
    });
    matchCards = shuffle(cards);
    renderMatchGame();
    showScreen('match');
  }

  function renderMatchGame() {
    const pct = (matchFoundCount / matchWords.length) * 100;
    document.getElementById('matchProgressFill').style.width = pct + '%';

    const grid = document.getElementById('matchGrid');
    grid.innerHTML = '';
    matchCards.forEach((card, idx) => {
      const btn = document.createElement('button');
      const shown = card.flipped || card.matched;
      btn.className = 'match-card'
        + (shown && card.type === 'emoji' ? ' match-card--emoji' : '')
        + (card.flipped ? ' is-flipped' : '')
        + (card.matched ? ' is-matched' : '');
      btn.textContent = shown ? card.content : '?';
      btn.disabled = card.matched;
      btn.addEventListener('click', () => handleMatchClick(idx));
      grid.appendChild(btn);
    });
  }

  function handleMatchClick(idx) {
    if (matchLock) return;
    const card = matchCards[idx];
    if (card.flipped || card.matched) return;

    card.flipped = true;
    matchSelected.push(idx);
    renderMatchGame();

    if (matchSelected.length === 2) {
      const [i1, i2] = matchSelected;
      const c1 = matchCards[i1];
      const c2 = matchCards[i2];
      if (c1.pairId === c2.pairId) {
        c1.matched = true;
        c2.matched = true;
        matchFoundCount++;
        matchSelected = [];
        renderMatchGame();
        if (matchFoundCount === matchWords.length) {
          if (matchMode === 'practice') {
            setTimeout(() => {
              document.getElementById('matchWrap').hidden = true;
              document.getElementById('matchDoneWrap').hidden = false;
              bumpDailyMission('games');
              saveProgress(progress);
            }, 500);
          } else {
            setTimeout(finishTopic, 600);
          }
        }
      } else {
        matchLock = true;
        setTimeout(() => {
          c1.flipped = false;
          c2.flipped = false;
          matchSelected = [];
          matchLock = false;
          renderMatchGame();
        }, 800);
      }
    }
  }

  document.getElementById('backFromMatch').addEventListener('click', () => {
    showScreen(matchMode === 'practice' ? 'games' : 'home');
  });
  document.getElementById('matchReplayBtn').addEventListener('click', () => startMatchGame());
  document.getElementById('matchOtherTopicBtn').addEventListener('click', () => showScreen('games'));

  // ---------- SPELLING GAME (Xếp chữ) ----------
  // Trò chơi luyện tập tự do trong tab "Trò chơi" (không tính sao, chơi lại thoải mái),
  // cùng kiểu với Ghép tranh nhưng rèn kỹ năng đánh vần thay vì ghi nhớ hình-nghĩa.
  let spellingWords = [];
  let spellingIndex = 0;
  let spellingTiles = []; // [{ ch, id, used }]
  let spellingSlots = []; // [tileId | null], độ dài = số chữ cái của từ

  function startSpelling(topicId) {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLockedForPractice(topic)) { showLockedPracticeTopicNotice(topic); return; }
    currentTopic = topic;
    spellingWords = shuffle(topic.words).slice(0, Math.min(SPELLING_WORD_COUNT, topic.words.length));
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
      recordWordAnswer(word, true);
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
        } else {
          renderSpellingWord();
        }
      }, 900);
    } else {
      recordWordAnswer(word, false);
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
  document.getElementById('spellingReplayBtn').addEventListener('click', () => startSpelling(currentTopic.id));
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

  function startSpeedQuiz(topicId) {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLockedForPractice(topic)) { showLockedPracticeTopicNotice(topic); return; }
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

    const distractors = shuffle(currentTopic.words.filter(w => w !== word)).slice(0, 3);
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
    const oldStars = progress.stars;
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

    celebrate(finishedAll && speedCorrectCount === speedWords.length, oldStars, oldLifetimeStars, null);
  }

  document.getElementById('backFromSpeed').addEventListener('click', () => {
    clearInterval(speedTimerId);
    speedTimerId = null;
    showScreen('games');
  });
  document.getElementById('speedReplayBtn').addEventListener('click', () => startSpeedQuiz(currentTopic.id));
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
    const oldStars = progress.stars;
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

    celebrate(quizParentScore === quizParentWords.length, oldStars, oldLifetimeStars);
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
    const oldStars = progress.stars;
    const oldLifetimeStars = progress.lifetimeStars;
    const isNewTopic = !progress.doneTopics[currentTopic.id];
    if (isNewTopic) {
      addStars(starsEarned);
      progress.doneTopics[currentTopic.id] = true;
    }
    if (isPerfect) progress.perfectCount = (progress.perfectCount || 0) + 1;
    if (passed) progress.topicPassed[currentTopic.id] = true;
    saveProgress(progress);
    updateStreakOnComplete();

    document.getElementById('doneTitle').textContent = isPerfect ? 'Xuất sắc! 🌟' : passed ? 'Giỏi quá!' : 'Cố lên nào!';
    document.getElementById('doneSubtitle').textContent =
      'Bé trả lời đúng ' + correctCount + '/' + totalWords + ' câu trong chủ đề "' + currentTopic.label + '". ' +
      (passed
        ? '🔓 Bé đã đạt yêu cầu, chủ đề tiếp theo mở khoá rồi!'
        : '📌 Bé cần đạt ít nhất ' + requiredCorrect + '/' + totalWords + ' câu đúng mới mở khoá được chủ đề tiếp theo — bấm "Học lại chủ đề này" để thử lại nhé!');
    document.getElementById('earnedStars').textContent = '⭐'.repeat(Math.max(1, correctCount));

    const tipWord = currentTopic.words[Math.floor(Math.random() * currentTopic.words.length)];
    document.getElementById('parentTip').innerHTML =
      '💬 Ba mẹ thử hỏi bé: "<strong>' + tipWord.vi + '</strong> tiếng Anh là gì nhỉ?" (đáp án: <strong>' + tipWord.en + '</strong>)';

    document.getElementById('printBtn').hidden = false;
    document.getElementById('printBtn').onclick = () => printTopicFlashcards(currentTopic);
    const replayBtn = document.getElementById('replayBtn');
    replayBtn.textContent = 'Học lại chủ đề này';
    replayBtn.onclick = () => startTopic(currentTopic.id);

    renderTotalStars();
    celebrate(isPerfect, oldStars, oldLifetimeStars, isNewTopic && PUZZLE_TOPICS.includes(currentTopic) ? currentTopic : null);
    resetChest();
    showScreen('done');
  }

  // Ôn tập tổng hợp xong: tính sao, kiểm tra huy hiệu, nhưng không gắn với 1 chủ đề cụ thể
  // (không có chủ đề để "học lại"/in flashcard riêng, chỉ có thể ôn tập lại 1 bộ từ ngẫu nhiên khác).
  // Dùng chung cho cả 3 kiểu ôn tập không gắn với 1 chủ đề cụ thể: tổng hợp / thông minh / từ khó
  // (không có chủ đề để "học lại"/in flashcard riêng, chỉ tính sao + cập nhật chuỗi ngày/huy hiệu).
  function finishReviewSession() {
    const isPerfect = quizCorrectCount === quizOrder.length;
    const oldStars = progress.stars;
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
    celebrate(isPerfect, oldStars, oldLifetimeStars);
    resetChest();
    isMixedReview = false;
    showScreen('done');
  }

  document.getElementById('backHomeBtn').addEventListener('click', () => { renderHome(); showScreen('home'); });

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

    const level = getLevel(progress.lifetimeStars);
    const doneCount = TOPICS.filter(t => progress.doneTopics[t.id]).length;

    ctx.font = '58px sans-serif';
    ctx.fillText(level.emoji, W / 2, 290);
    ctx.font = '700 26px "Baloo 2", sans-serif';
    ctx.fillStyle = '#A6431E';
    ctx.fillText(level.label, W / 2, 328);

    const stats = [
      { icon: '⭐', value: progress.stars, label: 'Sao' },
      { icon: '📚', value: doneCount + '/' + TOPICS.length, label: 'Chủ đề' },
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
        ctx.font = '44px sans-serif';
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
      { icon: '📚', value: doneCount + '/' + TOPICS.length, label: 'Chủ đề' },
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
    ctx.fillText('Ngày ' + dateStr, W / 2, H - 46);
    ctx.font = '700 17px "Baloo 2", sans-serif';
    ctx.fillText('5 Phút Tiếng Anh Mỗi Ngày', W / 2, H - 22);
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

  document.getElementById('backFromWeekly').addEventListener('click', () => showScreen('home'));

  function goHome() {
    renderHome();
    showScreen('home');
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

  // Xác thực email + hồ sơ bé là bắt buộc trước khi vào học (xem enforceGate ở trên).
  if (enforceGate()) {
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
