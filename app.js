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
  const REVERSE_WORD_COUNT = 6; // Đoán nghĩa: lấy tối đa 6 từ/lượt
  const FILLBLANK_WORD_COUNT = 6; // Điền từ: lấy tối đa 6 câu/lượt

  // ---------- GHÉP HÌNH (mảnh ghép tranh — thay cho sổ sticker cũ) ----------
  // Chỉ dùng các chủ đề có thể mở khoá được ở bản hiện tại (bỏ 2 chủ đề khoá vĩnh viễn
  // unlocksAt: Infinity) để bức tranh luôn có thể ghép trọn vẹn, không có mảnh không bao giờ có được.
  const PUZZLE_TOPICS = TOPICS.filter(t => !t.unlocksAt || isFinite(t.unlocksAt));
  const PUZZLE_COLS = 4;
  const PUZZLE_ROWS = Math.ceil(PUZZLE_TOPICS.length / PUZZLE_COLS);
  const PUZZLE_BG_SIZE = (PUZZLE_COLS * 100) + '% ' + (PUZZLE_ROWS * 100) + '%';
  const PUZZLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">' +
    '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#BEE3F8"/><stop offset="1" stop-color="#FDF6EC"/>' +
    '</linearGradient></defs>' +
    '<rect x="0" y="0" width="400" height="200" fill="url(#sky)"/>' +
    '<circle cx="55" cy="48" r="26" fill="#FFC97A"/>' +
    '<g fill="#FFFFFF"><ellipse cx="185" cy="40" rx="26" ry="14"/><ellipse cx="205" cy="32" rx="20" ry="12"/>' +
    '<ellipse cx="330" cy="55" rx="24" ry="13"/><ellipse cx="350" cy="48" rx="18" ry="10"/></g>' +
    '<g fill="none" stroke-width="8" stroke-linecap="round">' +
    '<path d="M240,150 A90,90 0 0 1 420,150" stroke="#F5A6C6"/>' +
    '<path d="M252,150 A78,78 0 0 1 408,150" stroke="#FFC97A"/>' +
    '<path d="M264,150 A66,66 0 0 1 396,150" stroke="#7FD1B9"/>' +
    '<path d="M276,150 A54,54 0 0 1 384,150" stroke="#6FA8DC"/></g>' +
    '<path d="M0,140 Q100,110 200,140 T400,140 V200 H0 Z" fill="#9BE0BE"/>' +
    '<path d="M0,155 Q120,130 240,158 T400,150 V200 H0 Z" fill="#7FD1B9"/>' +
    '<rect x="55" y="115" width="10" height="35" fill="#B5651D"/>' +
    '<circle cx="60" cy="105" r="26" fill="#4FB0A5"/><circle cx="42" cy="118" r="18" fill="#4FB0A5"/>' +
    '<circle cx="78" cy="118" r="18" fill="#4FB0A5"/>' +
    '<rect x="290" y="130" width="70" height="55" fill="#FDF6EC"/>' +
    '<polygon points="280,130 370,130 325,95" fill="#FF8A65"/>' +
    '<rect x="315" y="150" width="18" height="35" fill="#B5651D"/>' +
    '<rect x="340" y="145" width="16" height="16" fill="#6FA8DC"/>' +
    '</svg>';
  const PUZZLE_BG_URL = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(PUZZLE_SVG) + '")';

  // Chuẩn hoá 1 object progress thô (từ localStorage HOẶC từ document Firestore của 1 bé)
  // về đúng shape mong đợi, điền mặc định cho field thiếu.
  function normalizeProgress(p) {
    p = p || {};
    return {
      stars: p.stars || 0,
      doneTopics: p.doneTopics || {},
      streak: { count: (p.streak && p.streak.count) || 0, lastDate: (p.streak && p.streak.lastDate) || null, best: (p.streak && p.streak.best) || 0 },
      perfectCount: p.perfectCount || 0,
      badges: p.badges || {},
      wordStats: p.wordStats || {},
      placedPieces: p.placedPieces || {},
    };
  }
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeProgress(raw ? JSON.parse(raw) : {});
    } catch (e) { return blankProgress(); }
  }
  function blankProgress() {
    return { stars: 0, doneTopics: {}, streak: { count: 0, lastDate: null, best: 0 }, perfectCount: 0, badges: {}, wordStats: {}, placedPieces: {} };
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
    account: document.getElementById('screen-account'),
    donate: document.getElementById('screen-donate'),
    profileCreate: document.getElementById('screen-profile-create'),
    cards: document.getElementById('screen-cards'),
    quiz: document.getElementById('screen-quiz'),
    quizRecap: document.getElementById('screen-quiz-recap'),
    match: document.getElementById('screen-match'),
    spelling: document.getElementById('screen-spelling'),
    speed: document.getElementById('screen-speed'),
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

  document.getElementById('tabHome').addEventListener('click', () => { renderHome(); showScreen('home'); });
  document.getElementById('brandHomeBtn').addEventListener('click', () => { if (enforceGate()) goHome(); });
  document.getElementById('tabGames').addEventListener('click', () => { showScreen('games'); });
  document.getElementById('tabSentences').addEventListener('click', () => { showScreen('sentences'); });
  document.getElementById('tabBadges').addEventListener('click', () => { renderBadgesScreen(); showScreen('badges'); });
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

  // Chủ đề khoá theo mốc sao (unlocksAt) thay vì cờ cố định — tự mở khi bé đủ sao,
  // dễ mở rộng khi thêm chủ đề mới sau này (chỉ cần thêm unlocksAt cho chủ đề mới).
  function isTopicLocked(topic) {
    return !!topic.unlocksAt && progress.stars < topic.unlocksAt;
  }
  function starsNeededText(topic) {
    if (!isFinite(topic.unlocksAt)) return 'Sắp mở khoá';
    return 'Cần thêm ' + Math.max(0, topic.unlocksAt - progress.stars) + ' sao';
  }

  function renderTotalStars() {
    document.getElementById('totalStars').textContent = progress.stars;
    document.getElementById('levelBadge').textContent = getLevel(progress.stars).emoji;
  }

  // ---------- BADGES (huy hiệu cột mốc) ----------
  const BADGES = [
    { id: 'first_topic', icon: '🌟', label: 'Bài học đầu tiên', desc: 'Hoàn thành 1 chủ đề từ vựng', check: p => Object.keys(p.doneTopics).length >= 1 },
    { id: 'streak_3', icon: '🔥', label: '3 ngày chăm chỉ', desc: 'Học liên tiếp 3 ngày (+5 sao)', bonus: 5, check: p => p.streak.count >= 3 },
    { id: 'streak_7', icon: '🔥', label: '1 tuần bền bỉ', desc: 'Học liên tiếp 7 ngày (+10 sao)', bonus: 10, check: p => p.streak.count >= 7 },
    { id: 'streak_14', icon: '🔥', label: '2 tuần kiên trì', desc: 'Học liên tiếp 14 ngày (+20 sao)', bonus: 20, check: p => p.streak.count >= 14 },
    { id: 'streak_30', icon: '🔥', label: 'Bền bỉ cả tháng', desc: 'Học liên tiếp 30 ngày (+40 sao)', bonus: 40, check: p => p.streak.count >= 30 },
    { id: 'perfect_5', icon: '🥇', label: 'Ngôi sao xuất sắc', desc: 'Đạt điểm tuyệt đối 5 lần', check: p => (p.perfectCount || 0) >= 5 },
    { id: 'all_topics', icon: '🏆', label: 'Bậc thầy tí hon', desc: 'Hoàn thành tất cả chủ đề', check: p => TOPICS.every(t => p.doneTopics[t.id]) },
  ];

  // Kiểm tra sau mỗi lần hoàn thành bài học xem có mở khoá huy hiệu mới không.
  // Trả về danh sách huy hiệu vừa mở khoá (để hiện hiệu ứng ăn mừng). Huy hiệu chuỗi ngày
  // (streak_*) còn kèm thưởng sao (bonus) để chuỗi ngày thực sự có phần thưởng, không chỉ để khoe.
  function checkNewBadges() {
    const newlyUnlocked = [];
    BADGES.forEach(b => {
      if (!progress.badges[b.id] && b.check(progress)) {
        progress.badges[b.id] = true;
        if (b.bonus) progress.stars += b.bonus;
        newlyUnlocked.push(b);
      }
    });
    if (newlyUnlocked.length) saveProgress(progress);
    return newlyUnlocked;
  }

  // So sánh cấp độ trước/sau khi cộng sao — trả về { level, unlockedTopics } nếu vừa lên cấp,
  // hoặc null nếu chưa đủ lên cấp.
  function checkLevelUp(oldStars) {
    if (typeof oldStars !== 'number') return null;
    const oldLevel = getLevel(oldStars);
    const newLevel = getLevel(progress.stars);
    if (newLevel === oldLevel) return null;
    const unlockedTopics = TOPICS.filter(t => t.unlocksAt && t.unlocksAt > oldStars && t.unlocksAt <= progress.stars);
    return { level: newLevel, unlockedTopics: unlockedTopics };
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
  // là 1 cột mốc thành tích. Nếu có chủ đề vừa được mở khoá thì hiện thêm dòng thứ 2.
  function showLevelUpToast(levelUp) {
    const toast = document.createElement('div');
    toast.className = 'badge-toast';
    const unlockLine = levelUp.unlockedTopics.length
      ? '<br><span class="badge-unlock">🔓 Mở khoá: ' + levelUp.unlockedTopics.map(t => t.label).join(', ') + '</span>'
      : '';
    toast.innerHTML =
      '<span class="badge-icon">' + levelUp.level.emoji + '</span>' +
      '<span><span class="badge-eyebrow">Lên cấp!</span><br><span class="badge-label">' + levelUp.level.label + '</span>' + unlockLine + '</span>';
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

  // Thông báo khi bấm vào 1 chủ đề đang khoá (chưa nâng cấp).
  function showLockedTopicNotice(topic) {
    if (!isFinite(topic.unlocksAt)) {
      showToast('🔒 Chủ đề "' + topic.label + '" sắp ra mắt!', '🔒');
      return;
    }
    showToast('🔒 ' + starsNeededText(topic) + ' để mở khoá "' + topic.label + '"!', '🔒');
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
  function celebrate(isPerfect, oldStars, newPieceTopic) {
    const newBadges = checkNewBadges();
    const levelUp = checkLevelUp(oldStars);
    if (isPerfect || newBadges.length || levelUp || newPieceTopic) launchConfetti();
    showBadgeToasts(newBadges);
    const afterBadges = newBadges.length * 2900;
    if (levelUp) setTimeout(() => showLevelUpToast(levelUp), afterBadges);
    const afterLevelUp = afterBadges + (levelUp ? 3200 : 0);
    if (newPieceTopic) setTimeout(() => showPuzzlePieceToast(newPieceTopic), afterLevelUp);
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

    if (progress.streak.lastDate === todayStr) {
      // hôm nay đã học rồi, không đổi chuỗi
    } else if (progress.streak.lastDate === yesterdayStr) {
      progress.streak.count += 1;
      progress.streak.lastDate = todayStr;
    } else {
      progress.streak.count = 1;
      progress.streak.lastDate = todayStr;
    }
    progress.streak.best = Math.max(progress.streak.best || 0, progress.streak.count);
    saveProgress(progress);
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

    const level = getLevel(progress.stars);
    document.getElementById('levelEmoji').textContent = level.emoji;
    document.getElementById('levelLabel').textContent = level.label;

    const list = document.getElementById('progressList');
    list.innerHTML = '';
    TOPICS.forEach(topic => {
      const done = !!progress.doneTopics[topic.id];
      const row = document.createElement('div');
      row.className = 'progress-row' + (done ? ' is-done' : '') + (isTopicLocked(topic) ? ' is-locked' : '');
      row.innerHTML =
        '<span class="pr-emoji">' + topic.emoji + '</span>' +
        '<span class="pr-label">' + topic.label + '</span>' +
        '<span class="pr-status">' + (isTopicLocked(topic) ? '🔒 ' + starsNeededText(topic) : (done ? '✓ Đã học' : 'Chưa học')) + '</span>';
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
  }

  function setCollectionMode(mode) {
    collectionMode = mode;
    document.getElementById('collectionBadgesBtn').classList.toggle('active', mode === 'badges');
    document.getElementById('collectionPuzzleBtn').classList.toggle('active', mode === 'puzzle');
    document.getElementById('badgeGrid').hidden = mode !== 'badges';
    document.getElementById('puzzleWrap').hidden = mode !== 'puzzle';
  }
  document.getElementById('collectionBadgesBtn').addEventListener('click', () => setCollectionMode('badges'));
  document.getElementById('collectionPuzzleBtn').addEventListener('click', () => setCollectionMode('puzzle'));

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

  document.getElementById('resetProgressBtn').addEventListener('click', () => {
    showConfirmDialog('Xoá toàn bộ số sao, chuỗi ngày học và các chủ đề đã học của bé? Không thể hoàn tác.', { danger: true, okLabel: 'Xoá hết' })
      .then(ok => {
        if (!ok) return;
        progress = blankProgress();
        saveProgress(progress);
        renderProgressScreen();
        renderTotalStars();
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

  function sendEmailCode(email) {
    showEmailEntryError('');
    if (!backendConfigured()) {
      showEmailEntryError('Tính năng đang được cấu hình, vui lòng quay lại sau.');
      return;
    }
    const url = SHEETS_CONFIG.webAppUrl + '?action=sendCode&email=' + encodeURIComponent(email);
    fetch(url).then(r => r.json()).then(data => {
      if (!data.ok) { showEmailEntryError(mapBackendError(data.error)); return; }
      pendingVerifyEmail = email;
      document.getElementById('emailEntryForm').hidden = true;
      document.getElementById('emailCodeForm').hidden = false;
      document.getElementById('emailCodeTarget').textContent = maskEmail(email);
      document.getElementById('codeInput').value = '';
      document.getElementById('codeInput').focus();
      startResendCooldown(60);
    }).catch(() => showEmailEntryError('Không gửi được mã, vui lòng kiểm tra mạng và thử lại.'));
  }

  function confirmEmailCode(code) {
    showEmailCodeError('');
    const url = SHEETS_CONFIG.webAppUrl + '?action=verifyCode&email=' + encodeURIComponent(pendingVerifyEmail) + '&code=' + encodeURIComponent(code);
    fetch(url).then(r => r.json()).then(data => {
      if (!data.ok) { showEmailCodeError(mapBackendError(data.error)); return; }
      verifiedEmail = pendingVerifyEmail;
      try { localStorage.setItem(VERIFIED_EMAIL_KEY, verifiedEmail); } catch (e) {}
      showToast('Xác thực email thành công!', '✅');
      fetchCloudDataAndProceed();
    }).catch(() => showEmailCodeError('Có lỗi xảy ra, vui lòng thử lại.'));
  }

  // Sau khi xác thực email trên 1 thiết bị (thiết bị mới, hoặc xác thực lại để giành quyền
  // hoạt động), hỏi Google Sheet xem email này đã có hồ sơ + tiến độ lưu sẵn chưa. Có thì tự
  // động khôi phục để dùng lại y như thiết bị cũ; đồng thời lệnh gọi này khiến thiết bị hiện tại
  // trở thành thiết bị "đang hoạt động" của email đó (xem handleGetUserData ở Apps Script).
  function fetchCloudDataAndProceed() {
    if (!backendConfigured()) { if (enforceGate()) bootAfterGate(); return; }
    const url = SHEETS_CONFIG.webAppUrl + '?action=getUserData&email=' + encodeURIComponent(verifiedEmail) + '&deviceId=' + encodeURIComponent(deviceId);
    fetch(url).then(r => r.json()).then(data => {
      if (data.ok && data.found) {
        if (data.profile) { profile = data.profile; saveProfileLocal(profile); }
        if (data.progress) { progress = normalizeProgress(data.progress); saveProgress(progress); renderTotalStars(); }
        showToast('Đã khôi phục hồ sơ & tiến độ học trước đó!', '☁️');
      }
      if (enforceGate()) bootAfterGate();
    }).catch(() => { if (enforceGate()) bootAfterGate(); });
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
    showConfirmDialog('Xác thực email khác? Bạn sẽ cần xác thực lại trước khi tiếp tục học.', { okLabel: 'Đồng ý' })
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
  let gamesMode = 'match'; // 'match' (ghép tranh), 'spell' (xếp chữ) hoặc 'speed' (đố vui tính giờ)
  function renderGamesScreen() {
    const grid = document.getElementById('gamesTopicGrid');
    grid.innerHTML = '';
    TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + (isTopicLocked(topic) ? ' is-locked' : '');
      const countText = isTopicLocked(topic) ? starsNeededText(topic) :
        gamesMode === 'match' ? 'Ghép ' + Math.min(MATCH_PAIR_COUNT, topic.words.length) + ' cặp' :
        gamesMode === 'spell' ? 'Xếp ' + Math.min(SPELLING_WORD_COUNT, topic.words.length) + ' từ' :
        'Đố ' + Math.min(SPEED_WORD_COUNT, topic.words.length) + ' từ / ' + SPEED_TIME_LIMIT + 's';
      btn.innerHTML =
        (isTopicLocked(topic) ? '<span class="lock-badge">🔒</span>' : '') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + countText + '</span></span>';
      btn.addEventListener('click', () => {
        if (gamesMode === 'match') startPracticeMatch(topic.id);
        else if (gamesMode === 'spell') startSpelling(topic.id);
        else startSpeedQuiz(topic.id);
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
    renderGamesScreen();
  }
  document.getElementById('gameModeMatchBtn').addEventListener('click', () => setGamesMode('match'));
  document.getElementById('gameModeSpellBtn').addEventListener('click', () => setGamesMode('spell'));
  document.getElementById('gameModeSpeedBtn').addEventListener('click', () => setGamesMode('speed'));

  // ---------- SENTENCES TAB ----------
  let sentencesMode = 'read'; // 'read' (đọc câu), 'reverse' (đoán nghĩa) hoặc 'fill' (điền từ)
  function renderSentencesScreen() {
    const grid = document.getElementById('sentencesTopicGrid');
    grid.innerHTML = '';
    TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + (isTopicLocked(topic) ? ' is-locked' : '');
      const countText = isTopicLocked(topic) ? starsNeededText(topic) :
        sentencesMode === 'read' ? topic.words.length + ' câu' :
        sentencesMode === 'reverse' ? 'Đoán ' + Math.min(REVERSE_WORD_COUNT, topic.words.length) + ' từ' :
        'Điền ' + Math.min(FILLBLANK_WORD_COUNT, topic.words.length) + ' câu';
      btn.innerHTML =
        (isTopicLocked(topic) ? '<span class="lock-badge">🔒</span>' : '') +
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
  }
  document.getElementById('sentenceModeReadBtn').addEventListener('click', () => setSentencesMode('read'));
  document.getElementById('sentenceModeReverseBtn').addEventListener('click', () => setSentencesMode('reverse'));
  document.getElementById('sentenceModeFillBtn').addEventListener('click', () => setSentencesMode('fill'));

  function startSentenceTopic(topicId) {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;
    if (isTopicLocked(topic)) { showLockedTopicNotice(topic); return; }
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
    if (isTopicLocked(topic)) { showLockedTopicNotice(topic); return; }
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
    if (isTopicLocked(topic)) { showLockedTopicNotice(topic); return; }
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
    document.getElementById('mixedReviewCount').textContent = doneCount === 0 ? 'Cần học xong 1 chủ đề' : 'Ôn lại từ đã học';

    const dueCount = getDueWords(999).length;
    const smartBtn = document.getElementById('smartReviewBtn');
    smartBtn.disabled = dueCount === 0;
    smartBtn.title = dueCount === 0 ? 'Chưa có từ nào đến hạn ôn lại, bé học tiếp đã nhé!' : '';
    document.getElementById('smartReviewCount').textContent = dueCount > 0 ? dueCount + ' từ đến hạn' : 'Chưa có từ đến hạn';

    const difficultCount = getDifficultWords(999).length;
    const difficultBtn = document.getElementById('difficultReviewBtn');
    difficultBtn.disabled = difficultCount === 0;
    difficultBtn.title = difficultCount === 0 ? 'Bé chưa có từ nào hay sai cả, giỏi quá!' : '';
    document.getElementById('difficultReviewCount').textContent = difficultCount > 0 ? difficultCount + ' từ hay sai' : 'Chưa có từ khó';
  }

  function renderHome() {
    const grid = document.getElementById('topicGrid');
    grid.innerHTML = '';
    TOPICS.forEach(topic => {
      const btn = document.createElement('button');
      btn.className = 'topic-card ' + topic.cls + (progress.doneTopics[topic.id] ? ' is-done' : '') + (isTopicLocked(topic) ? ' is-locked' : '');
      btn.innerHTML =
        (isTopicLocked(topic) ? '<span class="lock-badge">🔒</span>' : '<span class="done-badge">✓ Đã học</span>') +
        '<span class="emoji">' + topic.emoji + '</span>' +
        '<span><span class="label">' + topic.label + '</span><br>' +
        '<span class="count">' + (isTopicLocked(topic) ? starsNeededText(topic) : topic.words.length + ' từ vựng') + '</span></span>';
      btn.addEventListener('click', () => startTopic(topic.id));
      grid.appendChild(btn);
    });
    renderTotalStars();
    renderHomeBanners();
    renderReviewButtons();
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
  document.getElementById('backFromCards').addEventListener('click', () => showScreen('home'));

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
    if (isTopicLocked(topic)) { showLockedTopicNotice(topic); return; }
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
    if (isTopicLocked(topic)) { showLockedTopicNotice(topic); return; }
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
    if (isTopicLocked(topic)) { showLockedTopicNotice(topic); return; }
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
    progress.stars += starsEarned;
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

    celebrate(finishedAll && speedCorrectCount === speedWords.length, oldStars, null);
  }

  document.getElementById('backFromSpeed').addEventListener('click', () => {
    clearInterval(speedTimerId);
    speedTimerId = null;
    showScreen('games');
  });
  document.getElementById('speedReplayBtn').addEventListener('click', () => startSpeedQuiz(currentTopic.id));
  document.getElementById('speedOtherTopicBtn').addEventListener('click', () => showScreen('games'));

  // ---------- DONE ----------
  function finishTopic() {
    // Tính theo trạng thái mới nhất của từng từ (quizWordStatus) chứ không phải quizCorrectCount/quizOrder,
    // vì bé có thể đã làm lại nhiều vòng ở màn tổng kết (chỉ vòng cuối cùng mới phản ánh đúng số từ còn sai).
    const totalWords = currentTopic.words.length;
    const correctCount = currentTopic.words.filter((_, i) => quizWordStatus[i] !== false).length;
    const isPerfect = correctCount === totalWords;
    const starsEarned = correctCount;
    const oldStars = progress.stars;
    const isNewTopic = !progress.doneTopics[currentTopic.id];
    if (isNewTopic) {
      progress.stars += starsEarned;
      progress.doneTopics[currentTopic.id] = true;
    }
    if (isPerfect) progress.perfectCount = (progress.perfectCount || 0) + 1;
    saveProgress(progress);
    updateStreakOnComplete();

    document.getElementById('doneTitle').textContent = isPerfect ? 'Xuất sắc! 🌟' : 'Giỏi quá!';
    document.getElementById('doneSubtitle').textContent =
      'Bé trả lời đúng ' + correctCount + '/' + totalWords + ' câu trong chủ đề "' + currentTopic.label + '".';
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
    celebrate(isPerfect, oldStars, isNewTopic && PUZZLE_TOPICS.includes(currentTopic) ? currentTopic : null);
    showScreen('done');
  }

  // Ôn tập tổng hợp xong: tính sao, kiểm tra huy hiệu, nhưng không gắn với 1 chủ đề cụ thể
  // (không có chủ đề để "học lại"/in flashcard riêng, chỉ có thể ôn tập lại 1 bộ từ ngẫu nhiên khác).
  // Dùng chung cho cả 3 kiểu ôn tập không gắn với 1 chủ đề cụ thể: tổng hợp / thông minh / từ khó
  // (không có chủ đề để "học lại"/in flashcard riêng, chỉ tính sao + cập nhật chuỗi ngày/huy hiệu).
  function finishReviewSession() {
    const isPerfect = quizCorrectCount === quizOrder.length;
    const oldStars = progress.stars;
    progress.stars += quizCorrectCount;
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
    celebrate(isPerfect, oldStars);
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

    const level = getLevel(progress.stars);
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
      ctx.font = '600 15px Quicksand, sans-serif';
      ctx.fillStyle = '#8A7B68';
      ctx.fillText(s.label, cx, 484);
    });

    ctx.font = '600 16px Quicksand, sans-serif';
    ctx.fillStyle = '#8A7B68';
    ctx.fillText('Huy hiệu đã đạt được', W / 2, 545);

    const earnedBadges = BADGES.filter(b => progress.badges[b.id]);
    if (earnedBadges.length) {
      const bw = Math.min(70, (W - 60) / earnedBadges.length);
      const totalW = bw * earnedBadges.length;
      const startX = (W - totalW) / 2 + bw / 2;
      earnedBadges.forEach((b, i) => {
        ctx.font = '44px sans-serif';
        ctx.fillText(b.icon, startX + i * bw, 595);
      });
    } else {
      ctx.font = '15px Quicksand, sans-serif';
      ctx.fillText('Chưa có huy hiệu nào — cố lên nhé!', W / 2, 590);
    }

    ctx.font = '600 16px "Baloo 2", sans-serif';
    ctx.fillStyle = '#8A7B68';
    ctx.fillText('5 Phút Tiếng Anh Mỗi Ngày', W / 2, H - 40);
    ctx.font = '600 12px Quicksand, sans-serif';
    ctx.fillText('Bản dùng thử miễn phí từ Fanpage', W / 2, H - 20);
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
