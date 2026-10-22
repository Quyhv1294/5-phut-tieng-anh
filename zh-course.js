// KHOÁ HỌC TIẾNG TRUNG CHO NGƯỜI MỚI BẮT ĐẦU — chỉ chạy khi Cài đặt › Ngôn ngữ = Tiếng Trung.
// Nội dung: data/zh_course.js (Phần → Chặng → Bài) + kho dữ liệu data/zh_roadmap.js + data/topics_zh.js.
// Dùng chung hàm của app.js qua window.APP. Thay 4 tab: Học (hành trình) · Ôn tập (lặp lại ngắt quãng) ·
// Luyện tập · Thư viện; tab Thành tích giữ nguyên (nút Chia sẻ chuyển vào trong đó).
//
// Mỗi bài = 1 "phiên" gồm các bước: card (thẻ học), choice (chọn đáp án), match (nối cặp), order (sắp
// câu), write (tô chữ, Hanzi Writer), type (gõ pinyin chọn chữ). Tiến độ lưu ở progress.zh:
//   done{lessonKey}, best{lessonKey: %}, units{unitId}, skip{partId}, srs{chữ: {py,vi,box,due,wrong}},
//   goal (bài/ngày), today {date, n}
(function () {
  const A = window.APP;
  if (!A || !A.isZh || typeof ZH_COURSE === 'undefined' || typeof ZH_STEPS === 'undefined' || typeof TOPICS_ZH_WORDS === 'undefined') return;

  // Phông riêng cho giao diện người lớn: Be Vietnam Pro (chữ Việt / Latin) + LXGW WenKai Screen (chữ Hán kiểu
  // Khải thư — nét rõ, gần chữ viết tay, dễ nhận mặt chữ cho người mới học). Tải theo dải ký tự nên chỉ tải
  // phần chữ Hán thực sự xuất hiện. Xem style.css "GIAO DIỆN TIẾNG TRUNG".
  ['https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap',
    'https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.7.0/lxgwwenkaigbscreen.css'].forEach(href => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  });

  const HANZI_WRITER_SRC = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.3/dist/hanzi-writer.min.js';
  const PASS_RATIO = 0.6;
  const SKIP_TEST_PASS = 0.8;
  const SRS_DAYS = [1, 3, 7, 14, 30]; // khoảng ôn theo "hộp" của từ: đúng thì lên hộp, sai về hộp 0
  const HAS_HANZI = /[㐀-鿿]/;
  const KIND_ICON = { vocab: '🆕', learn: '📖', quiz: '❓', write: '✍️', order: '🧩', type: '⌨️', read: '📰', roleplay: '🎭', review: '🔁', test: '🏁' };
  const KIND_LABEL = { vocab: 'Từ mới', learn: 'Thẻ học', quiz: 'Đố', write: 'Tô chữ', order: 'Sắp xếp câu', type: 'Gõ chữ', read: 'Đọc hiểu', roleplay: 'Nhập vai', review: 'Ôn tập chặng', test: 'Kiểm tra' };

  const $ = id => document.getElementById(id);
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const todayStr = () => new Date().toISOString().slice(0, 10);
  function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

  // ---------- Tô màu thanh điệu ----------
  // Tách pinyin thành âm tiết, tô màu theo dấu thanh: 1 đỏ · 2 cam · 3 xanh lá · 4 xanh dương (thanh nhẹ giữ màu chữ).
  // Chỉ tô những "từ" ghép trọn vẹn từ âm tiết pinyin, nên chữ tiếng Việt lẫn trong chuỗi không bị tô nhầm.
  const V = 'aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ';
  const SYL = new RegExp('(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[' + V + ']+(ng(?![' + V + '])|n(?![' + V + '])|r(?![' + V + ']))?', 'gi');
  const TONE_OF = {};
  ['āēīōūǖ', 'áéíóúǘ', 'ǎěǐǒǔǚ', 'àèìòùǜ'].forEach((s, i) => [...s].forEach(c => { TONE_OF[c] = i + 1; TONE_OF[c.toUpperCase()] = i + 1; }));
  function toneOf(syl) { for (const c of syl) if (TONE_OF[c]) return TONE_OF[c]; return 5; }
  function colorPinyin(text) {
    return String(text || '').split(/(\s+)/).map(tok => {
      const core = tok.replace(/^[^A-Za-zÀ-ɏ]+|[^A-Za-zÀ-ɏ]+$/g, '');
      if (!core) return esc(tok);
      const parts = core.split(/[’']/);
      const sylls = [];
      for (const part of parts) {
        const m = part.match(SYL) || [];
        if (m.join('').toLowerCase() !== part.toLowerCase()) return esc(tok); // không phải pinyin → để nguyên
        sylls.push(m);
      }
      const colored = sylls.map(m => m.map(s => '<span class="tone-' + toneOf(s) + '">' + esc(s) + '</span>').join('')).join('’');
      const start = tok.indexOf(core);
      return esc(tok.slice(0, start)) + colored + esc(tok.slice(start + core.length));
    }).join('');
  }
  const pyHtml = py => colorPinyin(py);
  function pinyinKey(py) {
    return String(py).toLowerCase().replace(/[ǖǘǚǜü]/g, 'v').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  }

  // ---------- Dữ liệu ----------
  const STEP_LESSONS = {};
  ZH_STEPS.forEach(s => s.lessons.forEach(l => { STEP_LESSONS[l.id] = l; }));
  const ALL_UNITS = [];
  ZH_COURSE.forEach(part => part.units.forEach(u => { u.part = part; ALL_UNITS.push(u); }));

  // Chuẩn hoá 1 từ: { zh, py, vi, emoji?, ex?, exPy?, exVi? }
  // Nhóm từ HSK: danh sách HSK 1 cũ (data/zh_roadmap.js) + HSK 1 chuẩn mới (data/zh_hsk1_new.js, Phần 5).
  const HSK_GROUPS = ZH_HSK1.concat(typeof ZH_HSK1_NEW !== 'undefined' ? ZH_HSK1_NEW : []);
  function resolveWords(spec) {
    let list = [];
    if (spec.list) list = spec.list.map(w => ({ zh: w[0], py: w[1], vi: w[2], emoji: w[3] }));
    else if (spec.topic) list = (TOPICS_ZH_WORDS[spec.topic] || []).map(w => ({ zh: w.zh, py: w.py, vi: w.vi, emoji: w.emoji, ex: w.ex, exPy: w.exPy, exVi: w.exVi }));
    else if (spec.hsk) list = (HSK_GROUPS.find(g => g.id === spec.hsk) || { words: [] }).words.map(w => ({ zh: w[0], py: w[1], vi: w[2], emoji: w[3] }));
    if (spec.only) list = spec.only.map(z => list.find(w => w.zh === z)).filter(Boolean);
    if (spec.range) list = list.slice(spec.range[0], spec.range[1]);
    // Bổ sung hình + câu ví dụ từ bộ từ có hình nếu trùng chữ.
    return list.map(w => Object.assign({}, PICTURE_WORDS[w.zh] || {}, w, { emoji: w.emoji || (PICTURE_WORDS[w.zh] || {}).emoji }));
  }
  const PICTURE_WORDS = {};
  Object.keys(TOPICS_ZH_WORDS).forEach(t => TOPICS_ZH_WORDS[t].forEach(w => {
    PICTURE_WORDS[w.zh] = { zh: w.zh, py: w.py, vi: w.vi, emoji: w.emoji, ex: w.ex, exPy: w.exPy, exVi: w.exVi };
  }));

  // Danh sách bài của 1 chặng (đã thêm bài "Ôn tập chặng" ở cuối), mỗi bài có key duy nhất.
  function unitLessons(u) {
    if (u._lessons) return u._lessons;
    const out = u.lessons.map((l, i) => {
      const base = l.ref ? Object.assign({}, STEP_LESSONS[l.ref]) : Object.assign({}, l);
      if (!base.type) base.type = 'learn';
      return Object.assign(base, { key: u.id + ':' + i, unit: u });
    });
    out.push({ type: 'review', title: 'Ôn tập chặng', key: u.id + ':review', unit: u });
    u._lessons = out;
    return out;
  }
  function unitWords(u) {
    const seen = new Set(), out = [];
    unitLessons(u).forEach(l => { if (l.type === 'vocab') resolveWords(l.words).forEach(w => { if (!seen.has(w.zh)) { seen.add(w.zh); out.push(w); } }); });
    return out;
  }
  // Mọi từ trong khoá (cho Thư viện, gõ pinyin, đáp án nhiễu).
  const COURSE_WORDS = (() => {
    const seen = new Set(), out = [];
    ALL_UNITS.forEach(u => unitWords(u).forEach(w => { if (!seen.has(w.zh)) { seen.add(w.zh); out.push(w); } }));
    ZH_HSK1.forEach(g => g.words.forEach(w => { if (!seen.has(w[0])) { seen.add(w[0]); out.push({ zh: w[0], py: w[1], vi: w[2] }); } }));
    out.forEach(w => { w.key = pinyinKey(w.py); });
    return out;
  })();
  const CHAR_INFO = {};
  COURSE_WORDS.forEach(w => { if ([...w.zh].length === 1 && !CHAR_INFO[w.zh]) CHAR_INFO[w.zh] = { py: w.py, vi: w.vi }; });
  ZH_RADICALS.forEach(r => r.ex.forEach(e => { if (!CHAR_INFO[e[0]]) CHAR_INFO[e[0]] = { py: e[1], vi: e[2] }; }));
  Object.assign(CHAR_INFO, {
    山: { py: 'shān', vi: 'núi' }, 火: { py: 'huǒ', vi: 'lửa' }, 木: { py: 'mù', vi: 'cây, gỗ' }, 日: { py: 'rì', vi: 'mặt trời' },
    口: { py: 'kǒu', vi: 'miệng' }, 女: { py: 'nǚ', vi: 'nữ' }, 子: { py: 'zǐ', vi: 'con' }, 米: { py: 'mǐ', vi: 'gạo' },
    国: { py: 'guó', vi: 'nước' }, 生: { py: 'shēng', vi: 'sinh' }, 学: { py: 'xué', vi: 'học' }, 中: { py: 'zhōng', vi: 'giữa' },
    色: { py: 'sè', vi: 'màu' }, 红: { py: 'hóng', vi: 'đỏ' }, 白: { py: 'bái', vi: 'trắng' }, 耳: { py: 'ěr', vi: 'tai' },
    目: { py: 'mù', vi: 'mắt' }, 头: { py: 'tóu', vi: 'đầu' }, 车: { py: 'chē', vi: 'xe' }, 船: { py: 'chuán', vi: 'thuyền' },
    飞: { py: 'fēi', vi: 'bay' }, 机: { py: 'jī', vi: 'máy' }, 果: { py: 'guǒ', vi: 'quả' }, 瓜: { py: 'guā', vi: 'dưa' },
    西: { py: 'xī', vi: 'tây' }, 草: { py: 'cǎo', vi: 'cỏ' }, 球: { py: 'qiú', vi: 'bóng' }, 门: { py: 'mén', vi: 'cửa' },
    床: { py: 'chuáng', vi: 'giường' }, 云: { py: 'yún', vi: 'mây' }, 风: { py: 'fēng', vi: 'gió' }, 雪: { py: 'xuě', vi: 'tuyết' },
  });

  // ---------- Tiến độ ----------
  function Z() {
    const p = A.getProgress();
    p.zh = p.zh || {};
    ['done', 'best', 'units', 'skip', 'srs', 'log', 'chests', 'charLv'].forEach(k => { if (!p.zh[k]) p.zh[k] = {}; });
    if (!p.zh.goal) p.zh.goal = 1;
    if (!p.zh.today || p.zh.today.date !== todayStr()) p.zh.today = { date: todayStr(), n: 0 };
    return p.zh;
  }
  const lessonDone = l => !!Z().done[l.key];
  function unitDone(u) { return !!Z().units[u.id] || unitLessons(u).every(lessonDone); }
  function unitUnlocked(u) {
    const i = ALL_UNITS.indexOf(u);
    if (i === 0 || Z().skip[u.part.id]) return true;
    const prev = ALL_UNITS[i - 1];
    if (unitDone(prev)) return true;
    // Nhảy cóc qua cả phần trước → mở chặng đầu của phần này.
    return prev.part !== u.part && !!Z().skip[prev.part.id];
  }
  function nextLesson() {
    for (const u of ALL_UNITS) {
      if (!unitUnlocked(u)) break;
      if (Z().skip[u.part.id]) continue; // phần đã nhảy cóc: vẫn mở được bằng tay, nhưng "Tiếp tục học" đi tiếp
      const l = unitLessons(u).find(x => !lessonDone(x));
      if (l) return l;
    }
    return null;
  }

  // Lặp lại ngắt quãng
  function srsAdd(w) {
    const s = Z().srs;
    if (!s[w.zh]) s[w.zh] = { py: w.py, vi: w.vi, box: 0, due: addDays(1), wrong: 0 };
  }
  function srsRecord(w, ok) {
    const s = Z().srs;
    const e = s[w.zh] || (s[w.zh] = { py: w.py, vi: w.vi, box: 0, due: todayStr(), wrong: 0 });
    if (ok) { e.box = Math.min(e.box + 1, SRS_DAYS.length - 1); e.due = addDays(SRS_DAYS[e.box]); }
    else { e.box = 0; e.due = addDays(1); e.wrong = (e.wrong || 0) + 1; }
  }
  function srsWord(zh) {
    const e = Z().srs[zh];
    return Object.assign({ zh }, PICTURE_WORDS[zh] || {}, e ? { py: e.py, vi: e.vi } : {});
  }
  function dueWords() { const t = todayStr(); return Object.keys(Z().srs).filter(z => Z().srs[z].due <= t).map(srsWord); }
  function hardWords() { return Object.keys(Z().srs).filter(z => Z().srs[z].wrong > 0).sort((a, b) => Z().srs[b].wrong - Z().srs[a].wrong).slice(0, 15).map(srsWord); }
  function learnedWords() { return Object.keys(Z().srs).map(srsWord); }

  // ---------- Khung màn hình ----------
  const root = $('screen-home').parentNode;
  function makeScreen(name, html, tabId) {
    const s = el('section', 'screen zh-screen');
    s.id = 'screen-zh-' + name;
    s.innerHTML = html;
    root.appendChild(s);
    A.registerScreen('zh-' + name, s, tabId);
    return s;
  }
  const topbar = (backId, fillId) =>
    '<div class="card-topbar"><button class="icon-btn" id="' + backId + '" aria-label="Quay lại">←</button>'
    + (fillId ? '<div class="progress-track"><div class="progress-fill" id="' + fillId + '"></div></div><span class="zh-step-count"></span>' : '') + '</div>';
  // Dòng phím tắt — chỉ hiện trên máy có chuột + bàn phím (xem style.css .zh-kbd-hint).
  const kbdHint = t => '<p class="zh-kbd-hint">⌨️ ' + t + '</p>';
  // Thanh "Kiểm tra" ghim ở đáy màn hình: chọn đáp án trước, bấm Kiểm tra mới chấm (chọn nhầm còn đổi được).
  const checkBar = (barId, btnId) => '<div class="zh-check-bar" id="' + barId + '"><button class="nav-btn primary zh-check-btn" id="' + btnId + '" disabled>Kiểm tra</button></div>';
  function sizeClass(text) {
    const len = [...String(text || '')].length;
    return len <= 2 ? 'zh-big--xl' : len <= 4 ? 'zh-big--l' : len <= 8 ? 'zh-big--m' : 'zh-big--s';
  }
  function setBig(node, text) {
    node.className = 'zh-big ' + sizeClass(text);
    if (!HAS_HANZI.test(text) && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(text)) node.innerHTML = colorPinyin(text);
    else node.textContent = text || '';
  }

  // Trang chủ (tab Học) + 3 tab mới + màn chặng + các màn chạy bài.
  makeScreen('home', '<div id="zhHome"></div>', 'tabHome');
  makeScreen('review', '<div id="zhReview"></div>', 'tabGames');
  makeScreen('practice', '<div id="zhPractice"></div>', 'tabSentences');
  makeScreen('library', '<div id="zhLibrary"></div>', 'tabShare');
  makeScreen('unit', topbar('zhUnitBack') + '<div id="zhUnit"></div>');
  makeScreen('card',
    topbar('zhCardBack', 'zhCardFill') +
    '<div class="flash-wrap"><div class="flashcard zh-card">' +
      '<div class="zh-card-emoji" id="zhCardEmoji"></div><div class="zh-hw" id="zhCardHw" hidden></div>' +
      '<div class="zh-big" id="zhCardBig"></div><div class="zh-py" id="zhCardPy"></div>' +
      '<div class="zh-vi" id="zhCardVi"></div><div class="zh-note" id="zhCardNote"></div>' +
      '<div class="zh-example" id="zhCardEx" hidden></div>' +
    '</div>' +
    '<div class="zh-btn-row"><button class="speak-btn" id="zhCardSpeak">🔊 Nghe</button>' +
      '<button class="speak-btn zh-slow-btn" id="zhCardSlow" aria-label="Đọc chậm">🐢 Đọc chậm</button>' +
      '<button class="speak-btn" id="zhCardExSpeak" hidden>🔊 Nghe câu</button>' +
      '<button class="speak-btn zh-slow-btn" id="zhCardExSlow" hidden aria-label="Đọc chậm câu">🐢 Câu chậm</button>' +
      '<button class="speak-btn" id="zhCardReplayHw" hidden>✍️ Xem lại nét</button></div>' +
    '<div class="nav-row"><button class="nav-btn" id="zhCardPrev">← Trước</button><button class="nav-btn primary" id="zhCardNext">Tiếp →</button></div>' +
    kbdHint('Enter / → tiếp · ← quay lại · Space nghe') + '</div>');
  makeScreen('choice',
    topbar('zhChoiceBack', 'zhChoiceFill') +
    '<div class="quiz-wrap"><div class="quiz-prompt" id="zhChoicePrompt"></div>' +
    '<div class="zh-ctx" id="zhChoiceCtx" hidden></div>' +
    '<div class="zh-big" id="zhChoiceBig"></div><button class="zh-py zh-py-btn" id="zhChoicePy"></button>' +
    '<div class="zh-btn-row"><button class="speak-btn" id="zhChoiceSpeak" hidden>🔊 Nghe lại</button>' +
    '<button class="speak-btn zh-slow-btn" id="zhChoiceSlow" hidden aria-label="Nghe chậm">🐢 Nghe chậm</button></div>' +
    '<div class="quiz-options zh-quiz-options" id="zhChoiceOptions"></div>' +
    checkBar('zhChoiceCheckBar', 'zhChoiceCheck') +
    '<div class="zh-answer" id="zhChoiceAns" hidden><div class="quiz-feedback" id="zhChoiceFeedback"></div>' +
      '<div class="zh-answer-key" id="zhChoiceKey"></div><div class="zh-reveal" id="zhChoiceReveal"></div>' +
      '<button class="nav-btn primary zh-next-btn" id="zhChoiceNext">Tiếp tục</button></div>' +
    kbdHint('1–4 chọn đáp án · Enter kiểm tra / đi tiếp · Space nghe lại') + '</div>');
  makeScreen('match',
    topbar('zhMatchBack', 'zhMatchFill') +
    '<div class="quiz-wrap"><div class="quiz-prompt">Nối chữ với nghĩa đúng</div>' +
    '<div class="zh-match" id="zhMatchGrid"></div><div class="quiz-feedback" id="zhMatchFeedback"></div></div>');
  makeScreen('order',
    topbar('zhOrderBack', 'zhOrderFill') +
    '<div class="quiz-wrap"><div class="quiz-prompt" id="zhOrderPrompt">Sắp xếp thành câu đúng:</div>' +
    '<div class="zh-order-vi" id="zhOrderVi"></div>' +
    '<div class="zh-btn-row" id="zhOrderListen" hidden><button class="speak-btn" id="zhOrderSpeak">🔊 Nghe lại</button>' +
      '<button class="speak-btn zh-slow-btn" id="zhOrderSlow" aria-label="Nghe chậm">🐢 Nghe chậm</button></div>' +
    '<div class="zh-order-answer" id="zhOrderAnswer"></div>' +
    '<div class="zh-order-tiles" id="zhOrderTiles"></div>' +
    checkBar('zhOrderCheckBar', 'zhOrderCheck') +
    '<div class="zh-answer" id="zhOrderAns" hidden><div class="quiz-feedback" id="zhOrderFeedback"></div><div class="zh-reveal" id="zhOrderReveal"></div>' +
      '<button class="nav-btn primary zh-next-btn" id="zhOrderNext">Tiếp tục</button></div>' +
    kbdHint('Phím số chọn ô · Backspace bỏ ô cuối · Enter kiểm tra / đi tiếp') + '</div>');
  makeScreen('write',
    topbar('zhWriteBack', 'zhWriteFill') +
    '<div class="flash-wrap"><div class="zh-write-info" id="zhWriteInfo"></div>' +
    '<div class="zh-write-box" id="zhWriteBox"></div><p class="zh-write-hint" id="zhWriteHint"></p>' +
    '<div class="zh-btn-row"><button class="speak-btn" id="zhWriteDemo">👀 Xem mẫu</button><button class="speak-btn" id="zhWriteRetry">✍️ Viết lại</button></div>' +
    '<div class="nav-row"><button class="nav-btn primary" id="zhWriteNext" disabled>Tiếp →</button></div>' + kbdHint('Enter đi tiếp') + '</div>');
  makeScreen('type',
    topbar('zhTypeBack', 'zhTypeFill') +
    '<div class="quiz-wrap"><div class="quiz-prompt">Gõ pinyin (không dấu) rồi chọn đúng chữ:</div>' +
    '<div class="zh-big" id="zhTypeBig"></div><div class="zh-vi" id="zhTypeVi"></div>' +
    '<input class="zh-type-input" id="zhTypeInput" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="vd: nihao">' +
    '<div class="zh-candidates" id="zhTypeCands"></div><button class="ghost-btn zh-type-hint" id="zhTypeHint">💡 Gợi ý pinyin</button>' +
    '<div class="zh-answer" id="zhTypeAns" hidden><div class="quiz-feedback" id="zhTypeFeedback"></div><div class="zh-reveal" id="zhTypeReveal"></div>' +
      '<button class="nav-btn primary zh-next-btn" id="zhTypeNext" hidden>Tiếp tục</button></div>' +
    kbdHint('Gõ pinyin · phím số hoặc Enter chọn chữ') + '</div>');
  makeScreen('done',
    '<div class="done-wrap zh-done"><div class="big-star" id="zhDoneEmoji">🌟</div><h2 id="zhDoneTitle"></h2><p id="zhDoneText"></p>' +
    '<div class="done-stats" id="zhDoneStats" hidden></div>' +
    '<div class="zh-done-goal" id="zhDoneGoal"></div>' +
    '<button class="cta-btn" id="zhDoneNext">Bài tiếp theo →</button>' +
    '<button class="ghost-btn ghost-btn--solid" id="zhDoneRetry">🔁 Làm lại</button>' +
    '<button class="ghost-btn" id="zhDoneBack">Quay lại</button></div>');

  // ---------- Thanh tab ----------
  // Đổi nhãn + thứ tự: Học · Ôn tập · Luyện tập · Thư viện · Thành tích. Chặn sự kiện bấm tab ở pha
  // capture (trên thanh tab) để mở màn tiếng Trung thay cho màn tiếng Anh.
  const tabbar = $('tabbar');
  function relabel(id, icon, label) { const b = $(id); b.innerHTML = '<span class="tab-icon">' + icon + '</span><span>' + label + '</span>'; b.setAttribute('aria-label', label); }
  relabel('tabGames', '🔁', 'Ôn tập');
  relabel('tabSentences', '🎯', 'Luyện tập');
  relabel('tabShare', '📖', 'Thư viện');
  tabbar.insertBefore($('tabShare'), $('tabAchievements'));
  let allowShare = false;
  tabbar.addEventListener('click', e => {
    const b = e.target.closest('.tab-btn');
    if (!b) return;
    const route = { tabHome: goHome, tabGames: openReview, tabSentences: openPractice, tabShare: openLibrary }[b.id];
    if (!route || (b.id === 'tabShare' && allowShare)) return;
    e.stopPropagation();
    route();
  }, true);
  // Nút Chia sẻ tiến độ (vốn là 1 tab) chuyển vào màn Thành tích.
  const shareBtn = el('button', 'ghost-btn zh-share-btn', '📤 Chia sẻ tiến độ');
  shareBtn.addEventListener('click', () => { allowShare = true; $('tabShare').click(); allowShare = false; });
  const ach = $('screen-achievements');
  if (ach) ach.appendChild(shareBtn);

  // Số từ đến hạn ôn hiện thành huy hiệu đỏ trên tab "Ôn tập" (lý do chính để quay lại mỗi ngày).
  function updateReviewBadge() {
    const b = $('tabGames');
    if (!b) return;
    let badge = b.querySelector('.tab-badge');
    const n = dueWords().length;
    if (!n) { if (badge) badge.remove(); return; }
    if (!badge) { badge = el('span', 'tab-badge'); b.appendChild(badge); }
    badge.textContent = n > 99 ? '99+' : String(n);
    b.setAttribute('aria-label', 'Ôn tập — ' + n + ' từ cần ôn');
  }

  // ---------- Tab HỌC: hành trình ----------
  // Chế độ hiện pinyin (Z().pyMode): auto = như thiết kế khoá học (hiện ở phần đầu, chạm để xem từ Phần 3) ·
  // show = luôn hiện · tap = che lại, chạm để xem · hide = giấu hẳn lúc làm câu hỏi (hiện sau khi trả lời).
  // Chỉ áp cho nội dung chữ Hán — bài pinyin (Phần 1) vốn là học pinyin nên không bị che.
  const PY_MODES = [['auto', 'Tự động'], ['show', 'Luôn hiện'], ['tap', 'Chạm để xem'], ['hide', 'Ẩn']];
  const pyMode = () => Z().pyMode || 'auto';
  function applyPyMode() {
    const cl = document.documentElement.classList;
    PY_MODES.forEach(m => cl.toggle('zh-py-' + m[0], pyMode() === m[0]));
  }
  let pyEditing = false;
  function goHome() { renderHome(); A.showScreen('zh-home'); }
  const GOAL_LABEL = { 1: '5 phút', 2: '10 phút', 3: '15 phút' };
  let goalEditing = false;
  function renderHome() {
    const z = Z();
    applyPyMode();
    const box = $('zhHome');
    box.innerHTML = '';
    // Tiến độ tính cả phần đã kiểm tra vượt (nhảy cóc): trước đây phần vượt không được tính nên đang ở
    // Chặng 7 vẫn ghi "0% khoá học".
    const unitCounted = u => !!z.skip[u.part.id] || unitDone(u);
    const total = ALL_UNITS.reduce((n, u) => n + unitLessons(u).length, 0);
    const done = ALL_UNITS.reduce((n, u) => n + (unitCounted(u) ? unitLessons(u).length : unitLessons(u).filter(lessonDone).length), 0);
    const pct = Math.round(done / total * 100);
    const next = nextLesson();
    updateReviewBadge();

    // Khối "HÔM NAY": đang ở đâu trong lộ trình + vòng mục tiêu ngày + nút học tiếp + từ cần ôn — gộp 3 thẻ
    // rời trước đây (tiêu đề khoá học, nút học, mục tiêu ngày) thành 1.
    const panel = el('div', 'zh-today-panel');
    const top = el('div', 'zh-tp-top');
    const where = el('div', 'zh-tp-where');
    if (next) {
      where.appendChild(el('small', null, next.unit.part.title));
      where.appendChild(el('strong', null, 'Chặng ' + (ALL_UNITS.indexOf(next.unit) + 1) + '/' + ALL_UNITS.length + ' · ' + next.unit.title));
    } else {
      where.appendChild(el('small', null, 'Tiếng Trung cho người mới bắt đầu'));
      where.appendChild(el('strong', null, 'Bạn đã học xong toàn bộ khoá học! 🎉'));
    }
    top.appendChild(where);
    const nToday = Math.min(z.today.n, z.goal), goalOk = z.today.n >= z.goal;
    const ring = el('div', 'zh-ring' + (goalOk ? ' is-done' : ''));
    ring.style.setProperty('--p', nToday / z.goal);
    ring.setAttribute('role', 'img');
    ring.setAttribute('aria-label', 'Hôm nay ' + nToday + '/' + z.goal + ' bài');
    ring.appendChild(el('strong', null, goalOk ? '✓' : nToday + '/' + z.goal));
    ring.appendChild(el('small', null, 'hôm nay'));
    top.appendChild(ring);
    panel.appendChild(top);

    if (next) {
      const cta = el('button', 'zh-continue');
      cta.appendChild(el('span', 'zh-continue-icon', '▶'));
      const t = el('span', 'zh-continue-text');
      t.appendChild(el('strong', null, done ? 'Tiếp tục học' : 'Bắt đầu học'));
      t.appendChild(el('small', null, KIND_ICON[next.type] + ' ' + next.title));
      cta.appendChild(t);
      cta.addEventListener('click', () => startLesson(next, goHome));
      panel.appendChild(cta);
    }

    const streak = A.getProgress().streak || {};
    const stats = el('div', 'zh-tp-stats');
    const bar = el('div', 'zh-step-bar'); const fill = el('span', 'zh-step-bar-fill'); fill.style.width = pct + '%'; bar.appendChild(fill);
    stats.appendChild(bar);
    stats.appendChild(el('small', null, pct + '% khoá học · ' + learnedWords().length + ' từ đã học' + (streak.count ? ' · 🔥 ' + streak.count + ' ngày liên tiếp' : '')));
    panel.appendChild(stats);

    // Hôm qua có học mà hôm nay chưa → nhắc giữ chuỗi ngày liên tiếp.
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    if (streak.count >= 1 && streak.lastDate === yd.toISOString().slice(0, 10)) {
      panel.appendChild(el('div', 'zh-streak-warn', '🔥 Học 1 bài hôm nay để giữ chuỗi ' + streak.count + ' ngày.'));
    }
    const due = dueWords().length;
    if (due) {
      const rv = el('button', 'zh-today-review', '🔁 Ôn ' + due + ' từ đến hạn hôm nay →');
      rv.addEventListener('click', openReview);
      panel.appendChild(rv);
    } else {
      panel.appendChild(el('div', 'zh-tp-note', '✅ Không có từ nào cần ôn hôm nay'));
    }

    // Mục tiêu ngày là cài đặt (chọn 1 lần) → thu vào 1 dòng nhỏ, bấm "Đổi" mới hiện 3 lựa chọn.
    const goalRow = el('div', 'zh-goal-row');
    const goalBtn = el('button', 'zh-goal-toggle', '🎯 Mục tiêu: ' + z.goal + ' bài/ngày (' + GOAL_LABEL[z.goal] + ') · ' + (goalEditing ? 'Xong' : 'Đổi'));
    goalBtn.setAttribute('aria-expanded', goalEditing);
    goalBtn.addEventListener('click', () => { goalEditing = !goalEditing; renderHome(); });
    goalRow.appendChild(goalBtn);
    if (goalEditing) {
      const chips = el('span', 'zh-goal-chips');
      [1, 2, 3].forEach(g => {
        const c = el('button', 'zh-chip' + (z.goal === g ? ' is-active' : ''), g + ' bài · ' + GOAL_LABEL[g]);
        c.addEventListener('click', () => { z.goal = g; goalEditing = false; A.saveProgress(); renderHome(); });
        chips.appendChild(c);
      });
      goalRow.appendChild(chips);
    }
    panel.appendChild(goalRow);
    const pyRow = el('div', 'zh-goal-row');
    const pyName = PY_MODES.find(m => m[0] === pyMode())[1];
    const pyBtn = el('button', 'zh-goal-toggle', '🔤 Pinyin: ' + pyName + ' · ' + (pyEditing ? 'Xong' : 'Đổi'));
    pyBtn.setAttribute('aria-expanded', pyEditing);
    pyBtn.addEventListener('click', () => { pyEditing = !pyEditing; renderHome(); });
    pyRow.appendChild(pyBtn);
    if (pyEditing) {
      const chips = el('span', 'zh-goal-chips zh-py-chips');
      PY_MODES.forEach(m => {
        const c = el('button', 'zh-chip' + (pyMode() === m[0] ? ' is-active' : ''), m[1]);
        c.addEventListener('click', () => { z.pyMode = m[0]; pyEditing = false; A.saveProgress(); applyPyMode(); renderHome(); });
        chips.appendChild(c);
      });
      pyRow.appendChild(chips);
      pyRow.appendChild(el('span', 'zh-py-help', 'Tự động: hiện pinyin ở phần đầu, từ Phần 3 chạm để xem. Ẩn: giấu pinyin khi làm câu hỏi để tự kiểm tra.'));
    }
    panel.appendChild(pyRow);
    box.appendChild(panel);
    // Học xong (hoặc nhảy cóc qua) Phần 2 · HSK 1 → mời thi thử ngay trên trang Học.
    const hskPart = ZH_COURSE.find(p => p.id === 'p2');
    if (HAS_EXAM && hskPart && (z.skip[hskPart.id] || hskPart.units.every(unitDone))) box.appendChild(examCard());

    // Bản đồ: mỗi phần là 1 thẻ thu gọn được (mặc định chỉ mở phần đang học), chặng xếp lưới ô nhỏ
    // để không phải cuộn dài.
    const curPart = next ? next.unit.part : ZH_COURSE[ZH_COURSE.length - 1];
    if (!openParts) openParts = new Set();
    if (curPart.id !== lastCurPart) { openParts.add(curPart.id); lastCurPart = curPart.id; } // sang phần mới thì tự mở
    box.appendChild(el('div', 'section-label zh-map-label', '🗺️ Lộ trình khoá học'));
    ZH_COURSE.forEach((part, pi) => {
      const isOpen = openParts.has(part.id);
      const doneN = part.units.filter(unitDone).length;
      const partDone = doneN === part.units.length;
      const partLocked = !unitUnlocked(part.units[0]);
      // Phần đã qua bài kiểm tra nhảy cóc: ghi rõ "Đã vượt" thay cho "0/6 chặng" (trước dễ tưởng là chưa học,
      // và khó hiểu vì sao phần sau lại mở trong khi phần giữa còn khoá).
      const partSkipped = !!z.skip[part.id] && !partDone;
      const card = el('div', 'zh-part' + (isOpen ? ' is-open' : '') + (part === curPart && next ? ' is-current' : '') + (partDone ? ' is-done' : '') + (partSkipped ? ' is-skipped' : '') + (partLocked ? ' is-locked' : ''));
      card.style.setProperty('--pc', PART_COLORS[pi % PART_COLORS.length]);
      const head = el('button', 'zh-part-head');
      head.setAttribute('aria-expanded', isOpen);
      head.appendChild(el('span', 'zh-part-num', partDone ? '✓' : partSkipped ? '»' : partLocked ? '🔒' : String(pi + 1)));
      const ht = el('span', 'zh-part-title');
      ht.appendChild(el('strong', null, part.title));
      ht.appendChild(el('small', null, part.desc));
      if (partLocked && pi > 0) ht.appendChild(el('small', 'zh-lock-why', 'Mở khi học xong ' + ZH_COURSE[pi - 1].title.split(' · ')[0] + ', hoặc làm bài kiểm tra nhảy cóc'));
      const pb = el('span', 'zh-step-bar'); const pf = el('span', 'zh-step-bar-fill'); pf.style.width = (partSkipped ? 100 : doneN / part.units.length * 100) + '%'; pb.appendChild(pf);
      ht.appendChild(pb);
      head.appendChild(ht);
      const meta = el('span', 'zh-part-meta');
      meta.appendChild(el('strong', null, partSkipped ? 'Đã vượt' : doneN + '/' + part.units.length));
      meta.appendChild(el('small', null, partSkipped ? '' : 'chặng'));
      head.appendChild(meta);
      head.appendChild(el('span', 'zh-part-chev', '›'));
      head.addEventListener('click', () => {
        if (openParts.has(part.id)) openParts.delete(part.id); else openParts.add(part.id);
        renderHome();
      });
      card.appendChild(head);

      if (isOpen) {
        const body = el('div', 'zh-part-body');
        const skipBtn = () => {
          const sk = el('button', 'zh-skip-btn', partLocked ? '🏁 Đã biết phần này? Làm bài kiểm tra để mở luôn' : '🏁 Đã biết phần này? Kiểm tra nhảy cóc');
          sk.addEventListener('click', () => startSkipTest(part));
          return sk;
        };
        const canSkip = !partDone && !z.skip[part.id];
        if (canSkip && partLocked) body.appendChild(skipBtn()); // phần còn khoá: lối mở nằm ngay trên đầu
        body.appendChild(unitPath(part, next));
        if (canSkip && !partLocked) body.appendChild(skipBtn());
        card.appendChild(body);
      }
      box.appendChild(card);
    });
  }
  // Con đường các chặng của 1 phần (kiểu Duolingo): nút tròn theo màu của phần đi zíc zắc, chặng đang học to
  // hơn + nhãn "Bắt đầu" / "Học tiếp", chặng xong có dấu ✓, sau mỗi 3 chặng có 1 rương quà (+5 sao).
  // Dùng chung kiểu .path-row / .path-node / .path-chest với con đường của phần tiếng Anh (style.css).
  const PART_COLORS = ['#D9453B', '#E08A1E', '#2E9C8F', '#3B82C4', '#8A5CC7'];
  const PATH_X = [0, 1, 2, 1, 0, -1, -2, -1];
  const CHEST_EVERY = 3, CHEST_STARS = 5;
  function unitPath(part, next) {
    const z = Z();
    const path = el('div', 'topic-path zh-path');
    let k = 0;
    const row = (node, label, cls) => {
      const r = el('div', 'path-row' + (cls ? ' ' + cls : ''));
      r.style.setProperty('--x', PATH_X[k++ % PATH_X.length]);
      r.appendChild(node);
      if (label) r.appendChild(label);
      path.appendChild(r);
      return r;
    };
    part.units.forEach((u, ui) => {
      const n = ALL_UNITS.indexOf(u) + 1;
      const ls = unitLessons(u), dn = ls.filter(lessonDone).length;
      const unlocked = unitUnlocked(u), isDone = unitDone(u), isCur = !!next && next.unit === u;
      const b = el('button', 'path-node zh-node' + (isDone ? ' is-done' : '') + (isCur ? ' is-current' : '') + (!unlocked ? ' is-locked' : ''));
      b.setAttribute('aria-label', 'Chặng ' + n + ': ' + u.title + (isDone ? ' — đã xong' : !unlocked ? ' — chưa mở' : isCur ? ' — đang học ' + dn + '/' + ls.length + ' bài' : ''));
      b.appendChild(el('span', 'path-emoji', unlocked ? u.emoji : '🔒'));
      if (isDone) b.appendChild(el('span', 'path-check', '✓'));
      b.addEventListener('click', () => {
        if (!unlocked) { A.showToast('Học xong Chặng ' + (n - 1) + ' (hoặc làm Kiểm tra nhảy cóc) để mở chặng này nhé!', '🔒'); return; }
        openUnit(u);
      });
      const label = el('span', 'path-label zh-node-label');
      label.appendChild(el('small', null, 'Chặng ' + n + (isCur && dn ? ' · ' + dn + '/' + ls.length + ' bài' : '')));
      label.appendChild(el('span', null, u.title));
      const r = row(b, label, isCur ? 'is-current-row' : '');
      if (isCur) r.insertBefore(el('span', 'path-start', dn ? 'Học tiếp' : 'Bắt đầu'), b);
      if ((ui + 1) % CHEST_EVERY === 0) {
        const group = part.units.slice(ui + 1 - CHEST_EVERY, ui + 1);
        const id = part.id + '-' + (ui + 1) / CHEST_EVERY;
        const opened = !!z.chests[id], ready = !opened && group.every(unitDone);
        const chest = el('button', 'path-chest' + (opened ? ' is-open' : ready ? ' is-ready' : ''), opened ? '✨' : '🎁');
        chest.setAttribute('aria-label', opened ? 'Rương đã mở' : ready ? 'Mở rương quà' : 'Rương quà — học xong ' + CHEST_EVERY + ' chặng phía trên để mở');
        chest.addEventListener('click', () => {
          if (opened) { A.showToast('Bạn đã mở rương này rồi.', '✨'); return; }
          if (!ready) { A.showToast('Học xong ' + CHEST_EVERY + ' chặng phía trên để mở rương nhé!', '🎁'); return; }
          z.chests[id] = true;
          const old = A.getProgress().lifetimeStars;
          A.addStars(CHEST_STARS);
          A.saveProgress();
          A.celebrate(true, old);
          A.showToast('Mở rương: +' + CHEST_STARS + ' sao!', '🎁');
          renderHome();
        });
        row(chest, opened || ready ? el('span', 'path-label', opened ? 'Đã mở' : 'Mở rương!') : null);
      }
    });
    return path;
  }
  let openParts = null; // các phần đang mở trên bản đồ (giữ nguyên khi quay lại trang Học trong phiên)
  let lastCurPart = null;

  // ---------- Màn CHẶNG ----------
  let curUnit = null;
  function openUnit(u) {
    curUnit = u;
    const box = $('zhUnit');
    box.innerHTML = '';
    const head = el('div', 'zh-step-head');
    head.appendChild(el('div', 'zh-step-icon', u.emoji));
    head.appendChild(el('h2', null, 'Chặng ' + (ALL_UNITS.indexOf(u) + 1) + ': ' + u.title));
    head.appendChild(el('p', null, u.part.title));
    box.appendChild(head);
    if (unitDone(u)) {
      const rv = unitLessons(u).find(l => l.type === 'review');
      const again = el('button', 'cta-btn zh-wide-btn zh-unit-again', '🔁 Ôn lại chặng này');
      again.addEventListener('click', () => startLesson(rv, () => openUnit(u)));
      box.appendChild(again);
    }
    const list = el('div', 'zh-lesson-list');
    const next = unitLessons(u).find(l => !lessonDone(l));
    unitLessons(u).forEach((l, i) => {
      const d = lessonDone(l);
      const b = el('button', 'zh-lesson-row' + (d ? ' is-done' : '') + (l === next ? ' is-next' : ''));
      b.appendChild(el('span', 'zh-lesson-icon', d ? '✅' : KIND_ICON[l.type]));
      const t = el('span', 'zh-lesson-text');
      t.appendChild(el('strong', null, (i + 1) + '. ' + l.title));
      const best = Z().best[l.key];
      t.appendChild(el('small', null, KIND_LABEL[l.type] + (best !== undefined ? ' · cao nhất ' + best + '%' : '')));
      b.append(t, el('span', 'settings-chevron', '›'));
      b.addEventListener('click', () => startLesson(l, () => openUnit(u)));
      list.appendChild(b);
    });
    box.appendChild(list);
    A.showScreen('zh-unit');
  }
  $('zhUnitBack').addEventListener('click', goHome);

  // ---------- PHIÊN HỌC ----------
  let S = null; // { lesson, steps, i, correct, total, back, onFinish, words }
  function startLesson(lesson, back) {
    const steps = buildSteps(lesson);
    if (!steps.length) { A.showToast('Bài này chưa có nội dung.', 'ℹ️'); return; }
    runSession({ lesson, steps, back });
  }
  function runSession(opts) {
    S = Object.assign({ i: 0, correct: 0, start: Date.now(), total: opts.steps.filter(s => s.kind !== 'card').length }, opts);
    // Tải trước giọng đọc thu sẵn của cả bài (nghe ngay khi bấm, và lưu lại để học được lúc mất mạng).
    if (A.ttsPrefetch) A.ttsPrefetch([...new Set(S.steps.flatMap(st => [st.say, st.sayAfter, st.char, st.word && st.word.zh,
      st.item && (st.item.say || st.item.big), st.item && st.item.ex].concat((st.pairs || []).map(w => w.zh))).filter(Boolean))]);
    nextStep();
  }
  function exitSession() { const back = S && S.back; S = null; (back || goHome)(); }
  // Đã làm được ít nhất 1 bước thì hỏi lại trước khi thoát — bấm nhầm nút ← không mất cả bài.
  function confirmExit() {
    if (!S || S.i === 0) return Promise.resolve(true);
    return A.confirm('Thoát bài này? Kết quả đang làm dở sẽ không được lưu.', { okLabel: 'Thoát', cancelLabel: 'Học tiếp', danger: true });
  }
  ['zhCardBack', 'zhChoiceBack', 'zhMatchBack', 'zhOrderBack', 'zhWriteBack', 'zhTypeBack'].forEach(id => $(id).addEventListener('click', () => {
    confirmExit().then(ok => {
      if (!ok) return;
      if (wr.writer) wr.writer.cancelQuiz();
      exitSession();
    });
  }));
  function fillFor(id) {
    const f = $(id);
    f.style.width = (S ? S.i / S.steps.length * 100 : 0) + '%';
    const c = f.closest('.card-topbar').querySelector('.zh-step-count');
    const st = S && S.steps[S.i];
    if (c) { c.textContent = !S ? '' : st && st.retry ? 'Làm lại' : (S.i + 1) + '/' + S.steps.length; c.classList.toggle('is-retry', !!(st && st.retry)); }
  }
  function nextStep() {
    if (!S) return;
    if (S.i >= S.steps.length) return finishSession();
    const st = S.steps[S.i];
    RENDER[st.kind](st);
  }
  // ok: true/false = tính điểm; null = không tính (vd. không tải được nét chữ).
  // Câu sai (chọn đáp án, sắp xếp câu, gõ chữ) được hỏi lại 1 lần ở cuối bài; lần làm lại không tính điểm.
  // Bài kiểm tra nhảy cóc thì không hỏi lại.
  const RETRY_KINDS = { choice: 1, order: 1, type: 1 };
  function stepDone(ok) {
    const st = S.steps[S.i];
    if (st.kind !== 'card' && !st.retry) {
      if (ok === null) S.total--;
      else if (ok) S.correct++;
      if (st.word && ok !== null) srsRecord(st.word, !!ok);
      const ch = st.ch || (st.kind === 'write' ? st.char : null);
      if (ch && ok !== null) charRecord(ch, !!ok);
    }
    if (ok === false && !st.retry && RETRY_KINDS[st.kind] && S.lesson.type !== 'test') S.steps.push(Object.assign({}, st, { retry: true }));
    S.i++;
    nextStep();
  }

  function finishSession() {
    const s = S;
    const z = Z();
    const l = s.lesson;
    const total = Math.max(s.total, 0);
    const pct = total ? Math.round(s.correct / total * 100) : 100;
    const passNeed = l.type === 'test' ? SKIP_TEST_PASS : PASS_RATIO;
    const pass = !total || s.correct / total >= passNeed;
    const isCourse = !!l.key;
    const first = pass && isCourse && !z.done[l.key];
    const stars = !pass ? 0 : first ? (total ? 3 : 2) : 1;
    const oldLifetime = A.getProgress().lifetimeStars;
    if (isCourse && pass) z.done[l.key] = true;
    if (isCourse && total) z.best[l.key] = Math.max(z.best[l.key] || 0, pct);
    if (pass && l.type === 'test' && l.part) z.skip[l.part.id] = true;
    if (pass) z.today.n += 1;
    // Nhật ký theo ngày: số bài xong, số câu, số câu đúng (giữ 60 ngày gần nhất).
    const lg = z.log[todayStr()] || (z.log[todayStr()] = { n: 0, q: 0, c: 0 });
    if (pass) lg.n++;
    lg.q += total; lg.c += s.correct;
    Object.keys(z.log).forEach(d => { if (d < addDays(-60)) delete z.log[d]; });
    if (total && pct === 100) { const p = A.getProgress(); p.perfectCount = (p.perfectCount || 0) + 1; } // huy hiệu "Ngôi sao xuất sắc"
    // Học xong cả chặng: ghi nhận + đánh dấu chủ đề hình ảnh tương ứng (mở mảnh ghép tranh, huy hiệu).
    let unitJustDone = null;
    if (isCourse && l.unit && !z.units[l.unit.id] && unitLessons(l.unit).every(lessonDone)) {
      z.units[l.unit.id] = true;
      unitJustDone = l.unit;
      const p = A.getProgress();
      if (l.unit.topic) { p.doneTopics[l.unit.topic] = true; p.topicPassed[l.unit.topic] = true; }
    }
    if (stars) A.addStars(stars + (unitJustDone ? 5 : 0));
    if (pass && (l.practice || total)) A.bumpDailyMission('games');
    const streak0 = A.getProgress().streak.count;
    if (pass) A.updateStreakOnComplete(); // tự lưu tiến độ
    else A.saveProgress();
    const streakNow = A.getProgress().streak.count;
    A.renderTotalStars();
    if (pass) A.celebrate(pct === 100 || !!unitJustDone, oldLifetime);

    $('zhDoneEmoji').textContent = !pass ? '💪' : unitJustDone ? '🏆' : pct === 100 ? '🌟' : '👍';
    $('zhDoneTitle').textContent = !pass ? 'Gần được rồi, thử lại nhé!' : unitJustDone ? 'Hoàn thành chặng "' + unitJustDone.title + '"!' : l.type === 'test' ? 'Đã mở khoá cả phần!' : 'Hoàn thành bài!';
    $('zhDoneText').textContent = (total ? 'Đúng ' + s.correct + '/' + total + ' câu. ' : '')
      + (pass ? '' : 'Cần đúng từ ' + Math.round(passNeed * 100) + '% để qua bài.');
    // Thẻ số liệu: sao nhận được · độ chính xác · thời gian · chuỗi ngày (nảy lên khi vừa +1).
    const secs = Math.round((Date.now() - s.start) / 1000), bumped = streakNow > streak0;
    const stat = [];
    if (stars) stat.push(['⭐', '+' + (stars + (unitJustDone ? 5 : 0)), 'sao', 'gold']);
    if (total) stat.push(['🎯', pct + '%', 'chính xác', pass ? 'teal' : 'accent']);
    if (secs >= 5) stat.push(['⏱️', secs < 60 ? secs + ' giây' : Math.round(secs / 60) + ' phút', 'thời gian', 'blue']);
    if (pass && streakNow) stat.push(['🔥', streakNow + ' ngày', bumped ? 'chuỗi +1!' : 'liên tiếp', 'accent' + (bumped ? ' is-bumped' : '')]);
    $('zhDoneStats').innerHTML = stat.map(x => '<div class="done-stat done-stat--' + x[3] + '"><span class="done-stat-icon">' + x[0] + '</span>'
      + '<strong>' + x[1] + '</strong><small>' + x[2] + '</small></div>').join('');
    $('zhDoneStats').hidden = !stat.length;
    $('zhDoneGoal').textContent = z.today.n >= z.goal ? '🎯 Đã đạt mục tiêu hôm nay · đã học ' + z.today.n + ' bài' : '🎯 Hôm nay: ' + z.today.n + '/' + z.goal + ' bài';
    const nxt = isCourse ? nextLesson() : null;
    const nb = $('zhDoneNext');
    nb.hidden = !nxt || !pass;
    nb.onclick = () => nxt && startLesson(nxt, () => openUnit(nxt.unit));
    $('zhDoneRetry').onclick = () => (s.rebuild ? s.rebuild() : startLesson(l, s.back));
    $('zhDoneBack').onclick = () => (s.back || goHome)();
    S = null;
    A.showScreen('zh-done');
  }

  // ---------- Dựng các bước của 1 bài ----------
  const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const DIGIT_PY = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];
  function numZh(n) {
    if (n < 10) return { zh: DIGITS[n], py: DIGIT_PY[n] };
    if (n < 100) {
      const t = Math.floor(n / 10), o = n % 10;
      return { zh: (t > 1 ? DIGITS[t] : '') + '十' + (o ? DIGITS[o] : ''), py: (t > 1 ? DIGIT_PY[t] : '') + 'shí' + (o ? DIGIT_PY[o] : '') };
    }
    const h = Math.floor(n / 100), rest = n % 100;
    let zh = (h === 2 ? '两' : DIGITS[h]) + '百', py = (h === 1 ? 'yì' : h === 2 ? 'liǎng' : DIGIT_PY[h]) + 'bǎi';
    if (rest) {
      if (rest < 10) { zh += '零' + DIGITS[rest]; py += 'líng' + DIGIT_PY[rest]; }
      else { const t = Math.floor(rest / 10), o = rest % 10; zh += DIGITS[t] + '十' + (o ? DIGITS[o] : ''); py += DIGIT_PY[t] + 'shí' + (o ? DIGIT_PY[o] : ''); }
    }
    return { zh, py };
  }
  const optText = o => (Array.isArray(o) ? o[0] : o);
  function uniqueOptions(correct, makeWrong, n) {
    const out = [correct];
    let guard = 0;
    while (out.length < n && guard++ < 80) {
      const w = makeWrong();
      if (w !== undefined && !out.some(o => optText(o) === optText(w))) out.push(w);
    }
    return out;
  }
  const choice = (prompt, extra, options) => Object.assign({ kind: 'choice', prompt, options, answer: 0 }, extra);

  // ----- Pinyin (Phần 1): vận mẫu, ghép âm, đổi thanh -----
  const ALL_FINALS = ZH_FINALS_1.concat(ZH_FINALS_2);
  // Vần dễ nhầm với nhau (làm đáp án nhiễu): mũi trước/sau, có/không có i- u- ü-.
  const FINAL_CONF = {
    a: ['o', 'e', 'ai'], o: ['u', 'e', 'ou'], e: ['o', 'a', 'ei'], i: ['ü', 'u', 'ei'], u: ['ü', 'o', 'ou'], 'ü': ['i', 'u', 'ui'],
    ai: ['ei', 'an', 'ao'], ei: ['ai', 'en', 'ui'], ao: ['ou', 'ai', 'iao'], ou: ['ao', 'uo', 'iu'], er: ['e', 'a', 'ei'],
    an: ['ang', 'en', 'ian'], en: ['eng', 'an', 'in'], ang: ['an', 'eng', 'iang'], eng: ['en', 'ang', 'ong'], ong: ['eng', 'ang', 'iong'],
    ia: ['ie', 'ua', 'iao'], ie: ['üe', 'ia', 'ei'], iao: ['iu', 'ao', 'ia'], iu: ['iao', 'ou', 'ui'], ian: ['iang', 'an', 'in'],
    in: ['ing', 'en', 'ian'], iang: ['ian', 'ang', 'ing'], ing: ['in', 'eng', 'iang'], iong: ['ong', 'ing', 'üan'],
    ua: ['uo', 'ia', 'uai'], uo: ['ou', 'ua', 'o'], uai: ['ai', 'ua', 'ui'], ui: ['ei', 'iu', 'uai'], uan: ['uang', 'an', 'üan'],
    un: ['ün', 'en', 'uan'], uang: ['uan', 'ang', 'ong'], 'üe': ['ie', 'ue', 'üan'], 'üan': ['uan', 'ian', 'ün'], 'ün': ['un', 'in', 'üan'],
  };
  // Thanh mẫu dễ nhầm (đáp án nhiễu khi đố ghép âm).
  const INITIAL_CONF = {
    b: ['p', 'm', 'd'], p: ['b', 'f', 't'], m: ['n', 'b', 'f'], f: ['h', 'p', 'm'], d: ['t', 'b', 'n'], t: ['d', 'k', 'p'],
    n: ['l', 'm', 'd'], l: ['n', 'r', 'd'], g: ['k', 'h', 'd'], k: ['g', 'h', 't'], h: ['f', 'k', 'g'],
    j: ['q', 'x', 'zh'], q: ['j', 'x', 'ch'], x: ['j', 'q', 'sh'], zh: ['z', 'j', 'ch'], ch: ['c', 'q', 'zh'], sh: ['s', 'x', 'r'],
    r: ['l', 'sh', 'y'], z: ['zh', 'c', 'j'], c: ['ch', 'z', 'q'], s: ['sh', 'x', 'c'], y: ['w', 'j', 'l'], w: ['y', 'h', 'f'],
  };
  const TONE_SETS = ['āáǎà', 'ēéěè', 'īíǐì', 'ōóǒò', 'ūúǔù', 'ǖǘǚǜ'];
  // Đổi thanh điệu của 1 âm tiết ngẫu nhiên trong chuỗi pinyin (làm đáp án nhiễu cho bài nghe thanh).
  function retone(py) {
    const arr = [...py];
    const idx = arr.map((c, i) => (TONE_SETS.some(t => t.includes(c)) ? i : -1)).filter(i => i >= 0);
    if (!idx.length) return null;
    const i = pick(idx), set = TONE_SETS.find(t => t.includes(arr[i])), cur = set.indexOf(arr[i]);
    let k = cur;
    while (k === cur) k = rnd(0, 3);
    arr[i] = set[k];
    return arr.join('');
  }
  const syllablePool = l => (l && l.initials ? ZH_SYLLABLES.filter(x => l.initials.includes(x[2])) : ZH_SYLLABLES);
  // Từ dùng cho bài "nghe chọn đúng dấu": bỏ từ có BIẾN ĐIỆU (2 thanh 3 liền nhau, hoặc có 不 / 一) — máy đọc
  // theo biến điệu (你好 → ní hǎo) nên đáp án "đổi thanh" có thể trùng đúng âm nghe được.
  const hasSandhi = w => /[不一]/.test(w.zh) || (w.py.match(SYL) || []).map(toneOf).some((t, i, a) => t === 3 && a[i + 1] === 3);
  const PINYIN_WORDS = () => COURSE_WORDS.filter(w => w.py && [...w.zh].length >= 2 && [...w.zh].length <= 3 && !hasSandhi(w)
    && TONE_SETS.some(t => [...w.py].some(c => t.includes(c))));

  // Đề tự sinh (dùng cho bài quiz có gen, và tab Luyện tập).
  const GEN = {
    finals(l) {
      const pool = l && l.only ? ALL_FINALS.filter(f => l.only.includes(f[0])) : ALL_FINALS;
      const f = pick(pool);
      const base = pool.length >= 4 ? pool : ALL_FINALS; // đáp án nhiễu chỉ lấy trong nhóm vần của bài (đã học)
      const near = (FINAL_CONF[f[0]] || []).filter(x => base.some(g => g[0] === x));
      return choice('Nghe và chọn đúng vận mẫu (vần)', { big: '🔊', say: f[1], reveal: f[1] + ' · ' + f[2], revealVi: 'vần ' + f[0] },
        uniqueOptions(f[0], () => (near.length && Math.random() < 0.75 ? pick(near) : pick(base)[0]), 4));
    },
    syllables(l) {
      // Đáp án nhiễu chỉ lấy ÂM TIẾT CÓ THẬT trong ngân hàng (không ghép bừa ra "buō"), ưu tiên trong bài:
      // cùng vần khác âm đầu → âm đầu dễ nhầm → vần dễ nhầm → bất kỳ.
      const pool = syllablePool(l), x = pick(pool);
      const conf = INITIAL_CONF[x[2]] || [], nearF = FINAL_CONF[x[3]] || [];
      const tiers = [pool, ZH_SYLLABLES].reduce((out, src) => out.concat(
        shuffleArr(src.filter(y => y[3] === x[3] && y[2] !== x[2])),
        shuffleArr(src.filter(y => conf.includes(y[2]))),
        shuffleArr(src.filter(y => y[2] === x[2] && nearF.includes(y[3]))),
      ), []).concat(shuffleArr(pool), shuffleArr(ZH_SYLLABLES));
      const options = [x[1]];
      tiers.forEach(y => { if (options.length < 4 && options.indexOf(y[1]) === -1) options.push(y[1]); });
      return choice('Nghe và chọn đúng pinyin', { big: '🔊', say: x[0], reveal: x[0] + ' · ' + x[1], revealVi: x[4] }, options);
    },
    pinyinWord() {
      const w = pick(PINYIN_WORDS());
      return choice('Nghe và chọn pinyin đúng (chú ý thanh điệu)', { big: '🔊', say: w.zh, reveal: w.zh + ' · ' + w.py, revealVi: w.vi },
        uniqueOptions(w.py, () => retone(Math.random() < 0.5 ? w.py : retone(w.py) || w.py) || undefined, 4));
    },
    tones() {
      const fam = pick(ZH_TONE_FAMILIES), t = pick(fam);
      return choice('Nghe và chọn đúng thanh điệu', { big: '🔊', say: t[0], reveal: t[0] + ' · ' + t[1] }, [t[1]].concat(fam.filter(x => x !== t).map(x => x[1])));
    },
    initials(l) {
      const pool = l && l.only ? ZH_INITIALS.filter(x => l.only.includes(x.i)) : ZH_INITIALS;
      const it = pick(pool);
      const same = ZH_INITIALS.filter(x => x.group === it.group && x !== it).map(x => x.i);
      return choice('Nghe và chọn âm đầu', { big: '🔊', say: it.ex, reveal: it.ex + ' · ' + it.py, revealVi: it.vi },
        uniqueOptions(it.i, () => (same.length && Math.random() < 0.7 ? pick(same) : pick(pool.length >= 4 ? pool : ZH_INITIALS).i), 4));
    },
    radicals() {
      const r = pick(ZH_RADICALS), e = pick(r.ex);
      const label = x => [x.r, 'Bộ ' + x.name];
      return choice('Chữ này có bộ thủ gì?', { big: e[0], py: e[1], sub: e[2], say: e[0] }, uniqueOptions(label(r), () => label(pick(ZH_RADICALS)), 4));
    },
    numbers() {
      const n = rnd(11, 99), z = numZh(n);
      return choice('Nghe và chọn đúng số', { big: '🔊', say: z.zh, reveal: z.zh + ' · ' + z.py },
        uniqueOptions(String(n), () => String(pick([n + 10, n - 10, n + 1, n - 1, (n % 10) * 10 + Math.floor(n / 10), rnd(11, 99)].filter(x => x >= 11 && x <= 99))), 4));
    },
    weekdays() {
      const days = [['星期一', 'xīngqī yī', 'Thứ Hai'], ['星期二', 'xīngqī èr', 'Thứ Ba'], ['星期三', 'xīngqī sān', 'Thứ Tư'], ['星期四', 'xīngqī sì', 'Thứ Năm'],
        ['星期五', 'xīngqī wǔ', 'Thứ Sáu'], ['星期六', 'xīngqī liù', 'Thứ Bảy'], ['星期天', 'xīngqī tiān', 'Chủ nhật']];
      const d = pick(days);
      return choice('Đây là thứ mấy?', { big: d[0], py: d[1], say: d[0] }, uniqueOptions(d[2], () => pick(days)[2], 4));
    },
    time() {
      const h = rnd(1, 12), m = pick([0, 0, 10, 15, 20, 30, 30, 40, 45, 50]);
      const hz = h === 2 ? { zh: '两', py: 'liǎng' } : numZh(h);
      const mz = m === 30 ? { zh: '半', py: ' bàn' } : m ? { zh: numZh(m).zh + '分', py: ' ' + numZh(m).py + ' fēn' } : { zh: '', py: '' };
      const zh = hz.zh + '点' + mz.zh, py = hz.py + ' diǎn' + mz.py;
      const fmt = (hh, mm) => hh + ':' + String(mm).padStart(2, '0');
      return choice('Nghe và chọn đúng giờ', { big: '🔊', say: '现在' + zh, reveal: zh + ' · ' + py },
        uniqueOptions(fmt(h, m), () => fmt(pick([h, h % 12 + 1, (h + 10) % 12 + 1]), pick([0, 10, 15, 20, 30, 40, 45, 50])), 4));
    },
    money() {
      const n = Math.random() < 0.7 ? rnd(2, 99) : rnd(100, 999), z = numZh(n);
      return choice('Nghe giá tiền và chọn đúng', { big: '🔊', say: z.zh + '块', reveal: z.zh + '块 · ' + z.py + ' kuài' },
        uniqueOptions(n + ' tệ', () => pick([n + 1, n + 10, n * 10, Math.max(2, n - 10), rnd(2, 999)]) + ' tệ', 4));
    },
  };

  // Câu hỏi về 1 từ, xoay vòng nhiều dạng. pool = các từ dùng làm đáp án nhiễu. hidePy: ẩn pinyin (chạm để xem).
  function wordQuestion(w, pool, k, hidePy) {
    const others = pool.filter(x => x.zh !== w.zh);
    const from = others.length >= 3 ? others : COURSE_WORDS.filter(x => x.zh !== w.zh);
    const kinds = w.emoji ? ['meaning', 'listenHanzi', 'listenPicture'] : ['meaning', 'listenHanzi'];
    const kind = kinds[k % kinds.length];
    if (kind === 'meaning') {
      return choice('Từ này nghĩa là gì?', { big: w.zh, py: w.py, hidePy, say: w.zh, word: w }, uniqueOptions(w.vi, () => pick(from).vi, 4));
    }
    if (kind === 'listenPicture') {
      const withPic = from.filter(x => x.emoji);
      if (withPic.length >= 3) {
        return choice('Nghe và chọn đúng hình', { big: '🔊', say: w.zh, reveal: w.zh + ' · ' + w.py, revealVi: w.vi, word: w, emojiOpts: true },
          uniqueOptions(w.emoji, () => pick(withPic).emoji, 4));
      }
    }
    return choice('Nghe và chọn đúng chữ', { big: '🔊', say: w.zh, reveal: w.zh + ' · ' + w.py, revealVi: w.vi, word: w },
      uniqueOptions([w.zh, hidePy ? '' : w.py], () => { const o = pick(from); return [o.zh, hidePy ? '' : o.py]; }, 4));
  }
  const partIndex = l => (l && l.unit ? ZH_COURSE.indexOf(l.unit.part) : 0);

  function buildSteps(l) {
    const hidePy = partIndex(l) >= 2; // từ Phần 3 (HSK 1): pinyin trong câu hỏi ẩn đi, chạm để xem
    if (l.type === 'vocab') {
      const words = resolveWords(l.words);
      const steps = [];
      // Khởi động: 2 từ cũ sắp quên
      shuffleArr(dueWords().filter(d => !words.some(w => w.zh === d.zh))).slice(0, 2)
        .forEach((d, k) => steps.push(Object.assign(wordQuestion(d, COURSE_WORDS, k, hidePy), { warmup: true })));
      words.forEach(w => steps.push({ kind: 'card', item: { big: w.zh, py: w.py, vi: w.vi, emoji: w.emoji, say: w.zh, ex: w.ex, exPy: w.exPy, exVi: w.exVi }, learnWord: w }));
      const qs = shuffleArr(words).map((w, k) => wordQuestion(w, words, k, hidePy));
      if (words.length >= 4) qs.splice(Math.floor(qs.length / 2), 0, { kind: 'match', pairs: shuffleArr(words).slice(0, 4) });
      return steps.concat(qs);
    }
    if (l.type === 'learn') {
      let items = l.items;
      if (l.from === 'initials') items = ZH_INITIALS.filter(x => !l.only || l.only.includes(x.i)).map(x => ({ big: x.i, py: x.ex + ' · ' + x.py, say: x.ex, vi: 'Ví dụ: ' + x.ex + ' (' + x.vi + ')', note: ZH_INITIAL_NOTES[x.i] }));
      if (l.from === 'finals1' || l.from === 'finals2' || l.from === 'finals') {
        const src = l.from === 'finals1' ? ZH_FINALS_1 : l.from === 'finals2' ? ZH_FINALS_2 : ALL_FINALS;
        items = src.filter(f => !l.only || l.only.includes(f[0]))
          .map(f => ({ big: f[0], py: f[1] + ' · ' + f[2], say: f[1], vi: 'Ví dụ: ' + f[1] + ' ' + f[2] + ' (' + f[3] + ')', note: ZH_FINAL_NOTES[f[0]] }));
      }
      if (l.from === 'syllables') items = syllablePool(l).map(x => ({
        big: x[2] + ' + ' + x[3] + ' = ' + x[1], py: x[0] + ' · ' + x[1], say: x[0], vi: x[4],
        note: x[3] === 'ü' && 'jqxy'.includes(x[2]) ? 'Sau ' + x[2] + ', ü viết thành u (' + x[1] + ') nhưng vẫn đọc ü — tròn môi.' : (ZH_INITIAL_NOTES[x[2]] || ''),
      }));
      if (l.from === 'radicals') items = ZH_RADICALS.slice(l.range[0], l.range[1]).map(r => ({
        big: r.r, py: (r.alt ? r.alt + ' · ' : '') + r.py, say: r.alt || r.r, vi: 'Bộ ' + r.name + ' — ' + r.vi,
        note: 'Ví dụ: ' + r.ex.map(e => e[0] + ' ' + e[1] + ' (' + e[2] + ')').join(' · '),
      }));
      return (items || []).map(it => ({ kind: 'card', item: it }));
    }
    if (l.type === 'quiz') {
      if (l.questions) {
        return shuffleArr(l.questions).map(x => choice(x.q, { big: x.big, py: x.py, say: 'say' in x ? x.say : x.big }, x.options));
      }
      if (l.listen) return listenSteps([l.listen]);
      const out = [], seen = new Set();
      let guard = 0;
      while (out.length < (l.count || 10) && guard++ < 200) {
        const one = GEN[l.gen](l);
        const key = one.say + '|' + one.big + '|' + optText(one.options[0]);
        if (seen.has(key) && guard < 150) continue;
        seen.add(key);
        out.push(one);
      }
      return out;
    }
    if (l.type === 'read') return readSteps([l.read]);
    if (l.type === 'roleplay') return roleSteps([l.role]);
    if (l.type === 'write') return l.chars.map(c => ({ kind: 'write', char: c }));
    if (l.type === 'order') return shuffleArr(l.sentences).map(s => ({ kind: 'order', s }));
    if (l.type === 'type') {
      const pool = l.groups ? COURSE_WORDS.filter(w => ZH_HSK1.some(g => l.groups.includes(g.id) && g.words.some(x => x[0] === w.zh))) : COURSE_WORDS;
      return shuffleArr(pool).slice(0, l.count || 10).map(w => ({ kind: 'type', word: w }));
    }
    if (l.type === 'review' && l.unit.pinyin) return pinyinMix(unitLessons(l.unit).filter(x => x.type === 'quiz' && x.gen), 10);
    if (l.type === 'test' && l.part.units.every(u => u.pinyin)) {
      return pinyinMix([{ gen: 'finals' }, { gen: 'syllables' }, { gen: 'syllables' }, { gen: 'tones' }, { gen: 'pinyinWord' }], 15);
    }
    if (l.type === 'review') {
      const words = unitWords(l.unit);
      const pool = words.length >= 4 ? words : COURSE_WORDS;
      const qs = shuffleArr(words.length ? words : COURSE_WORDS.slice(0, 10)).slice(0, 10).map((w, k) => wordQuestion(w, pool, k + 1, hidePy));
      if (words.length >= 4) qs.splice(5, 0, { kind: 'match', pairs: shuffleArr(words).slice(0, 4) });
      return qs;
    }
    if (l.type === 'test') {
      const words = l.part.units.reduce((a, u) => a.concat(unitWords(u)), []);
      return shuffleArr(words).slice(0, 15).map((w, k) => wordQuestion(w, words, k, false));
    }
    return [];
  }
  // Trộn n câu đố tự sinh từ các bài quiz (gen + tham số only/initials) — ôn tập / kiểm tra phần pinyin.
  function pinyinMix(srcs, n) {
    if (!srcs.length) srcs = [{ gen: 'syllables' }];
    const out = [], seen = new Set();
    for (let k = 0, guard = 0; out.length < n && guard < 200; guard++) {
      const src = srcs[k % srcs.length];
      const q = GEN[src.gen](src);
      const key = q.say + '|' + optText(q.options[0]);
      if (seen.has(key) && guard < 150) continue;
      seen.add(key); out.push(q); k++;
    }
    return shuffleArr(out);
  }
  // Luyện nghe câu & hội thoại (data/zh_listening.js): nghe câu → chọn nghĩa; nghe hội thoại → trả lời câu hỏi.
  const HAS_LISTEN = typeof ZH_LISTEN !== 'undefined';
  function listenSteps(units, n) {
    if (!HAS_LISTEN) return [];
    const sens = [], dias = [];
    units.forEach(u => { const b = ZH_LISTEN[u]; if (b) { sens.push(...b.sentences); dias.push(...b.dialogues); } });
    const allSens = Object.keys(ZH_LISTEN).reduce((a, u) => a.concat(ZH_LISTEN[u].sentences), []);
    const sq = shuffleArr(sens).map(x => {
      const others = (sens.length >= 4 ? sens : allSens).filter(y => y !== x);
      return choice('Nghe câu và chọn nghĩa đúng', { big: '🔊', say: x.s, reveal: x.s + ' · ' + x.py, revealVi: x.vi }, uniqueOptions(x.vi, () => pick(others).vi, 4));
    });
    const dq = shuffleArr(dias).map(d => choice('Nghe hội thoại rồi trả lời câu hỏi', {
      big: d.q, py: d.qpy, hidePy: true, say: d.lines.map(l => l[0]).join('') + d.q,
      reveal: d.lines.map(l => l[0] + ' ' + l[1]).join(' — '), revealVi: d.vi,
    }, [d.opts[d.a]].concat(d.opts.filter((o, k) => k !== d.a))));
    const out = sq.concat(dq);
    return n ? shuffleArr(out).slice(0, n) : out;
  }
  // Đọc hiểu & hội thoại nhập vai (data/zh_reading.js) — chạy trên màn câu đố, đoạn văn / khung chat hiện ở
  // khối #zhChoiceCtx phía trên câu hỏi.
  const HAS_READ = typeof ZH_READ !== 'undefined';
  // Từ điển tách đoạn văn thành từ (chạm vào từ → nghe + xem nghĩa): chữ đơn, từ trong khoá, từ ngoài HSK 1.
  const READ_DICT = (() => {
    const d = {};
    Object.keys(CHAR_INFO).forEach(c => { d[c] = [CHAR_INFO[c].py, CHAR_INFO[c].vi]; });
    COURSE_WORDS.forEach(w => { d[w.zh] = [w.py, w.vi]; });
    if (typeof ZH_READ_GLOSS !== 'undefined') Object.assign(d, ZH_READ_GLOSS);
    return d;
  })();
  const READ_MAX = Math.max(...Object.keys(READ_DICT).map(k => [...k].length));
  // Tách câu thành từ, ưu tiên từ dài nhất có trong từ điển.
  function segment(text) {
    const cs = [...text], out = [];
    for (let i = 0; i < cs.length;) {
      let n = Math.min(READ_MAX, cs.length - i);
      while (n > 1 && !READ_DICT[cs.slice(i, i + n).join('')]) n--;
      out.push(cs.slice(i, i + n).join(''));
      i += n;
    }
    return out;
  }
  function tapText(text) {
    const span = el('span', 'zh-tap-text');
    segment(text).forEach(w => {
      const g = READ_DICT[w];
      if (!g || !HAS_HANZI.test(w)) {
        // Dấu câu dính vào từ đứng trước (không bị rớt xuống dòng riêng).
        const prev = span.lastChild;
        if (prev && prev.nodeType === 1 && prev.tagName === 'BUTTON' && !/[A-Za-z0-9]/.test(w) && w.length <= 3) {
          const glue = el('span', 'zh-tap-glue');
          span.replaceChild(glue, prev);
          glue.append(prev, document.createTextNode(w));
        } else span.appendChild(document.createTextNode(w));
        return;
      }
      const b = el('button', 'zh-tap-word', w);
      b.type = 'button';
      b.addEventListener('click', () => { A.speak(w); A.showToast(w + ' · ' + g[0] + ' — ' + g[1], '📖'); });
      span.appendChild(b);
    });
    return span;
  }
  function readSteps(units, n) {
    if (!HAS_READ) return [];
    let ps = [];
    units.forEach(u => { if (ZH_READ[u]) ps.push(...ZH_READ[u]); });
    if (n) ps = shuffleArr(ps).slice(0, n);
    const out = [];
    ps.forEach(p => p.qs.forEach(x => out.push(choice('Đọc đoạn văn rồi trả lời câu hỏi', {
      big: x.q, py: x.qpy, hidePy: true, say: null, ctx: { kind: 'read', p },
      reveal: x.q + ' ' + x.qpy + ' → ' + x.opts[0][0] + ' ' + x.opts[0][1],
    }, x.opts))));
    return out;
  }
  // Mỗi lượt của vai B là 1 câu đố; giữ đúng thứ tự trong hội thoại (không trộn).
  function roleSteps(units, n) {
    if (!HAS_READ) return [];
    let ds = [];
    units.forEach(u => { if (ZH_ROLE[u]) ds.push(...ZH_ROLE[u]); });
    if (n) ds = shuffleArr(ds).slice(0, n);
    return roleStepsFor(ds);
  }
  function roleStepsFor(ds) {
    const out = [];
    ds.forEach(d => d.lines.forEach((ln, i) => {
      if (ln[0] !== 'B') return;
      const prev = d.lines[i - 1];
      out.push(choice('Nhập vai: chọn câu đáp của bạn', {
        say: prev && prev[0] === 'A' ? prev[1] : null, ctx: { kind: 'chat', d, upto: i },
        reveal: ln[1] + ' ' + ln[2], revealVi: ln[3], sayAfter: ln[1],
      }, [[ln[1], ln[2]]].concat(ln[4])));
    }));
    return out;
  }
  function ctxBtn(label, aria, fn) {
    const b = el('button', 'zh-ctx-btn', label);
    b.type = 'button';
    b.setAttribute('aria-label', aria);
    b.addEventListener('click', fn);
    return b;
  }
  // 1 dòng hội thoại: ảnh nhân vật + bong bóng (chữ Hán chạm được từng từ, pinyin, nghĩa). Người A là bạn đối thoại
  // (Mei 👩), người B là bé / người học (ảnh đại diện của hồ sơ). name: hiện tên phía trên bong bóng.
  const PARTNER = { emoji: '👩', name: 'Mei' };
  function me() {
    try { const p = JSON.parse(localStorage.getItem('5phut_profile_v1')) || {}; return { emoji: p.avatar || '🙂', name: p.name || 'Bạn' }; }
    catch (e) { return { emoji: '🙂', name: 'Bạn' }; }
  }
  function bubbleRow(ln, current, name) {
    const isA = ln[0] === 'A', who = isA ? PARTNER : me();
    const row = el('div', 'zh-bubble-row ' + (isA ? 'is-a' : 'is-b'));
    row.appendChild(el('span', 'zh-avatar ' + (isA ? 'is-a' : 'is-b'), who.emoji));
    const b = el('div', 'zh-bubble ' + (isA ? 'is-a' : 'is-b') + (current ? ' is-current' : ''));
    if (name) b.appendChild(el('div', 'zh-bubble-name', who.name));
    const zh = el('div', 'zh-bubble-zh');
    zh.append(tapText(ln[1]), ctxBtn('🔊', 'Nghe câu này', () => A.speak(ln[1])));
    const py = el('div', 'zh-bubble-py');
    py.innerHTML = colorPinyin(ln[2]);
    b.append(zh, py, el('div', 'zh-bubble-vi', ln[3]));
    // Chế độ pinyin "Chạm để xem" / "Ẩn": chạm vào bong bóng để hiện pinyin câu đó.
    b.addEventListener('click', e => { if (!e.target.closest('button')) b.classList.toggle('show-py'); });
    row.appendChild(b);
    return row;
  }
  function renderCtx(st) {
    const box = $('zhChoiceCtx');
    box.innerHTML = '';
    box.className = 'zh-ctx';
    box.hidden = !st.ctx;
    if (!st.ctx) return;
    const head = el('div', 'zh-ctx-head');
    box.appendChild(head);
    if (st.ctx.kind === 'read') {
      const p = st.ctx.p, full = p.text.map(t => t[0]).join('');
      box.classList.add('is-read');
      if (pyMode() === 'show') box.classList.add('show-py');
      head.append(el('strong', null, '📰 ' + p.title), ctxBtn('🔊', 'Nghe cả đoạn', () => A.speak(full)),
        ctxBtn('🐢', 'Nghe chậm cả đoạn', () => A.speak(full, { slow: true })),
        ctxBtn('Pinyin', 'Hiện / ẩn pinyin', () => box.classList.toggle('show-py')));
      const body = el('div', 'zh-passage');
      p.text.forEach(t => {
        const line = el('div', 'zh-passage-line');
        const py = el('div', 'zh-passage-py');
        py.innerHTML = colorPinyin(t[1]);
        line.append(tapText(t[0]), py);
        body.appendChild(line);
      });
      box.append(body, el('div', 'zh-ctx-vi', '🇻🇳 ' + p.vi));
      return;
    }
    const d = st.ctx.d;
    box.classList.add('is-chat');
    head.appendChild(el('strong', null, '🎭 ' + d.title));
    const list = el('div', 'zh-chat-list');
    box.appendChild(list);
    d.lines.slice(0, st.ctx.upto).forEach((ln, i) => list.appendChild(bubbleRow(ln, i === st.ctx.upto - 1)));
    list.scrollTop = list.scrollHeight; // khung chat có giới hạn chiều cao → cuộn tới câu vừa nghe
  }
  function shuffleArr(a) { return A.shuffle(a); }
  function startSkipTest(part) {
    startLesson({ type: 'test', title: 'Kiểm tra nhảy cóc', part }, goHome);
  }

  // ---------- RENDER từng dạng bước ----------
  const RENDER = {};
  function showAnswer(id, ok) {
    const c = $(id);
    c.hidden = false;
    c.className = 'zh-answer ' + (ok === null ? '' : ok ? 'is-ok' : 'is-no');
    requestAnimationFrame(() => c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }

  // card
  let cardWriter = null;
  RENDER.card = st => {
    const it = st.item;
    A.showScreen('zh-card');
    fillFor('zhCardFill');
    if (st.learnWord) srsAdd(st.learnWord);
    $('zhCardEmoji').textContent = it.emoji || '';
    $('zhCardEmoji').hidden = !it.emoji;
    setBig($('zhCardBig'), it.big);
    const cpy = $('zhCardPy');
    cpy.className = 'zh-py';
    cpy.innerHTML = it.py ? colorPinyin(it.py) : '';
    if (it.py && HAS_HANZI.test(it.big) && (pyMode() === 'tap' || pyMode() === 'hide')) {
      cpy.classList.add('is-covered');
      cpy.onclick = () => cpy.classList.remove('is-covered');
    } else cpy.onclick = null;
    $('zhCardVi').textContent = it.vi || '';
    $('zhCardNote').textContent = it.note || '';
    $('zhCardNote').hidden = !it.note;
    const ex = $('zhCardEx');
    ex.hidden = !it.ex;
    if (it.ex) ex.innerHTML = '<div class="zh-ex-zh">' + esc(it.ex) + '</div><div class="zh-ex-py">' + colorPinyin(it.exPy || '') + '</div><div class="zh-ex-vi">' + esc(it.exVi || '') + '</div>';
    $('zhCardExSpeak').hidden = !it.ex;
    $('zhCardExSlow').hidden = !it.ex;
    const say = it.say || (HAS_HANZI.test(it.big) ? it.big : null);
    $('zhCardSpeak').hidden = !say;
    $('zhCardSlow').hidden = !say;
    const prevIsCard = S.i > 0 && S.steps[S.i - 1].kind === 'card' && !S.steps[S.i - 1].warmup;
    $('zhCardPrev').disabled = !prevIsCard;
    $('zhCardNext').textContent = S.steps[S.i + 1] ? 'Tiếp →' : 'Xong ✓';
    const hw = $('zhCardHw');
    hw.innerHTML = ''; hw.hidden = !it.hw; $('zhCardReplayHw').hidden = !it.hw; cardWriter = null;
    if (it.hw) {
      loadHanziWriter().then(() => {
        if (!S || S.steps[S.i] !== st) return;
        hw.innerHTML = '';
        cardWriter = HanziWriter.create(hw, it.hw.char, Object.assign(writerColors(), { width: 160, height: 160, padding: 8, showCharacter: false, showOutline: true, strokeAnimationSpeed: 1, delayBetweenStrokes: 250 }));
        playCardHw(it);
      }).catch(() => { hw.innerHTML = '<p class="zh-offline">Cần mạng để tải nét chữ lần đầu.</p>'; });
    }
    if (say) A.speak(say);
  };
  function playCardHw(it) { if (!cardWriter) return; cardWriter.hideCharacter(); if (it.hw.stroke !== undefined) cardWriter.animateStroke(it.hw.stroke); else cardWriter.animateCharacter(); }
  $('zhCardSpeak').addEventListener('click', () => { const it = S && S.steps[S.i].item; if (it) A.speak(it.say || it.big); });
  $('zhCardExSpeak').addEventListener('click', () => { const it = S && S.steps[S.i].item; if (it && it.ex) A.speak(it.ex); });
  // 🐢 Đọc chậm: cùng nội dung, tốc độ khoảng một nửa — nghe rõ từng âm, từng thanh điệu.
  $('zhCardSlow').addEventListener('click', () => { const it = S && S.steps[S.i].item; if (it) A.speak(it.say || it.big, { slow: true }); });
  $('zhCardExSlow').addEventListener('click', () => { const it = S && S.steps[S.i].item; if (it && it.ex) A.speak(it.ex, { slow: true }); });
  $('zhCardReplayHw').addEventListener('click', () => { const it = S && S.steps[S.i].item; if (it && it.hw) playCardHw(it); });
  $('zhCardPrev').addEventListener('click', () => { if (S && S.i > 0) { S.i--; nextStep(); } });
  $('zhCardNext').addEventListener('click', () => { if (S) stepDone(true); });

  // choice
  let chLocked = false;
  RENDER.choice = st => {
    A.showScreen('zh-choice');
    fillFor('zhChoiceFill');
    chLocked = false; chSel = null;
    $('zhChoiceCheck').disabled = true;
    $('zhChoiceCheckBar').hidden = false;
    $('zhChoicePrompt').textContent = (st.retry ? '🔁 Làm lại câu sai · ' : st.warmup ? '🔁 Ôn nhanh · ' : '') + st.prompt;
    renderCtx(st);
    setBig($('zhChoiceBig'), st.big || '');
    $('zhChoiceBig').hidden = !st.big;
    const py = $('zhChoicePy');
    py.hidden = !st.py && !st.sub;
    const mode = pyMode(), hz = HAS_HANZI.test(st.big || '');
    const hidePy = !(st.py && hz) ? !!st.hidePy : mode === 'show' ? false : mode === 'tap' || mode === 'hide' ? true : !!st.hidePy;
    py.classList.toggle('is-hidden', hidePy);
    py.classList.toggle('is-gone', hidePy && mode === 'hide' && !!st.py && hz);
    py.innerHTML = (st.py ? colorPinyin(st.py) : '') + (st.sub ? ' <span class="zh-sub">· ' + esc(st.sub) + '</span>' : '');
    py.onclick = () => { if (!py.classList.contains('is-gone')) py.classList.remove('is-hidden'); };
    $('zhChoiceSpeak').hidden = !st.say;
    $('zhChoiceSlow').hidden = !st.say;
    $('zhChoiceReveal').innerHTML = '';
    const fb = $('zhChoiceFeedback'); fb.textContent = ''; fb.className = 'quiz-feedback';
    $('zhChoiceAns').hidden = true;
    $('zhChoiceKey').textContent = '';
    const wrap = $('zhChoiceOptions');
    wrap.innerHTML = '';
    wrap.classList.toggle('is-emoji', !!st.emojiOpts);
    // Đáp án dài (câu, cụm từ) xếp 1 cột cho dễ đọc, không bị bẻ dòng vụn trong ô nhỏ.
    wrap.classList.toggle('is-long', !st.emojiOpts && st.options.some(o => [...String(optText(o))].length > 12));
    A.shuffle(st.options.map((o, i) => i)).forEach(i => {
      const o = st.options[i];
      const b = el('button', 'quiz-opt' + (st.emojiOpts ? '' : ' text-opt'));
      b.textContent = optText(o);
      if (Array.isArray(o) && o[1]) { const s = el('span', 'word-py'); s.innerHTML = colorPinyin(o[1]); b.appendChild(s); }
      b.dataset.correct = i === st.answer ? '1' : '';
      b.addEventListener('click', () => selectChoice(b, i === st.answer));
      wrap.appendChild(b);
    });
    if (st.say) A.speak(st.say);
  };
  $('zhChoiceSpeak').addEventListener('click', () => { const st = S && S.steps[S.i]; if (st && st.say) A.speak(st.say); });
  $('zhChoiceSlow').addEventListener('click', () => { const st = S && S.steps[S.i]; if (st && st.say) A.speak(st.say, { slow: true }); });
  let chSel = null;
  function selectChoice(btn, ok) {
    if (chLocked) return;
    document.querySelectorAll('#zhChoiceOptions .quiz-opt.is-selected').forEach(b => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    chSel = { btn, ok };
    $('zhChoiceCheck').disabled = false;
  }
  $('zhChoiceCheck').addEventListener('click', () => { if (chSel) answerChoice(chSel.btn, chSel.ok); });
  function answerChoice(btn, ok) {
    if (chLocked) return;
    chLocked = true;
    $('zhChoiceCheckBar').hidden = true;
    btn.classList.remove('is-selected');
    const st = S.steps[S.i];
    document.querySelectorAll('#zhChoiceOptions .quiz-opt').forEach(b => { b.disabled = true; if (b.dataset.correct) b.classList.add('correct'); });
    $('zhChoicePy').classList.remove('is-hidden', 'is-gone');
    const fb = $('zhChoiceFeedback');
    if (ok) { fb.textContent = pick(['✓ Chính xác!', '✓ Đúng rồi!', '✓ Tốt lắm!']); fb.className = 'quiz-feedback ok'; A.sfx('correct'); }
    else {
      btn.classList.add('wrong'); fb.textContent = '✗ Chưa đúng'; fb.className = 'quiz-feedback no'; A.sfx('wrong');
      if (!st.reveal) $('zhChoiceKey').innerHTML = 'Đáp án đúng: <b>' + esc(optText(st.options[st.answer])) + '</b>'; // có phần giải thích thì đã nêu đáp án
    }
    // Chỉ tô màu thanh điệu phần chữ Hán + pinyin; nghĩa tiếng Việt để dòng riêng (tránh tô nhầm "có", "là"…).
    if (st.reveal) $('zhChoiceReveal').innerHTML = colorPinyin(st.reveal) + (st.revealVi ? '<div class="zh-reveal-vi">' + esc(st.revealVi) + '</div>' : '');
    $('zhChoiceCtx').classList.add('is-answered'); // hiện bản dịch đoạn văn / câu vừa nghe
    if (st.sayAfter) A.speak(st.sayAfter); // nhập vai: đọc câu đáp đúng của vai mình
    showAnswer('zhChoiceAns', ok);
    // Đúng hay sai đều chờ bấm "Tiếp tục" — đủ thời gian đọc đáp án, pinyin và phần giải thích.
    $('zhChoiceNext').onclick = () => { if (S && S.steps[S.i] === st) stepDone(ok); };
  }

  // match: 4 cặp chữ ↔ nghĩa
  RENDER.match = st => {
    A.showScreen('zh-match');
    fillFor('zhMatchFill');
    const fb = $('zhMatchFeedback'); fb.textContent = ''; fb.className = 'quiz-feedback';
    const left = A.shuffle(st.pairs), right = A.shuffle(st.pairs);
    const grid = $('zhMatchGrid');
    grid.innerHTML = '';
    let sel = null, mistakes = 0, found = 0;
    const colL = el('div', 'zh-match-col'), colR = el('div', 'zh-match-col');
    left.forEach(w => {
      const b = el('button', 'zh-match-card');
      b.textContent = w.zh;
      const p = el('span', 'word-py'); p.innerHTML = colorPinyin(w.py); b.appendChild(p);
      b.addEventListener('click', () => { if (b.disabled) return; colL.querySelectorAll('.is-selected').forEach(x => x.classList.remove('is-selected')); b.classList.add('is-selected'); sel = { w, b }; A.speak(w.zh); });
      colL.appendChild(b);
    });
    right.forEach(w => {
      const b = el('button', 'zh-match-card zh-match-card--vi', w.vi);
      b.addEventListener('click', () => {
        if (!sel || b.disabled) return;
        if (sel.w.zh === w.zh) {
          sel.b.disabled = b.disabled = true;
          A.sfx('pair'); sel.b.classList.remove('is-selected'); sel.b.classList.add('is-matched'); b.classList.add('is-matched');
          srsRecord(w, true);
          sel = null; found++;
          if (found === st.pairs.length) {
            fb.textContent = mistakes <= 1 ? 'Nối đúng hết! 🎉' : 'Xong rồi!'; fb.className = 'quiz-feedback ok';
            setTimeout(() => { if (S && S.steps[S.i] === st) stepDone(mistakes <= 1); }, 900);
          }
        } else {
          mistakes++;
          b.classList.add('is-wrong'); setTimeout(() => b.classList.remove('is-wrong'), 500); A.sfx('wrong');
        }
      });
      colR.appendChild(b);
    });
    grid.append(colL, colR);
  };

  // order
  let ord = null;
  RENDER.order = st => {
    A.showScreen('zh-order');
    fillFor('zhOrderFill');
    const s = st.s, lis = !!st.listen;
    // Nghe và xếp câu: không cho xem nghĩa tiếng Việt trước, chỉ nghe; có thêm 2 ô chữ thừa để phải nghe kỹ.
    $('zhOrderPrompt').textContent = lis ? '🎧 Nghe rồi xếp lại thành câu:' : 'Sắp xếp thành câu đúng:';
    $('zhOrderVi').textContent = s.vi;
    $('zhOrderVi').hidden = lis;
    $('zhOrderListen').hidden = !lis;
    $('zhOrderReveal').innerHTML = '';
    const fb = $('zhOrderFeedback'); fb.textContent = ''; fb.className = 'quiz-feedback';
    $('zhOrderAns').hidden = true;
    $('zhOrderAnswer').classList.remove('is-correct', 'is-wrong');
    let tiles, guard = 0;
    const base = s.tokens.map((t, k) => ({ t, k }));
    if (lis) shuffleArr(ORDER_TOKENS.filter(t => !s.tokens.includes(t))).slice(0, 2).forEach(t => base.push({ t, k: -1 }));
    do { tiles = A.shuffle(base.slice()); } while (s.tokens.length > 1 && tiles.every((x, k) => x.k === k) && guard++ < 20);
    ord = { st, tiles, picked: [], done: false };
    if (lis) A.speak(s.tokens.join('') + (s.end || '。'));
    $('zhOrderCheckBar').hidden = false;
    drawOrder();
  };
  const orderFull = () => ord && ord.st.s.tokens.join('') + (ord.st.s.end || '。');
  $('zhOrderSpeak').addEventListener('click', () => { if (ord) A.speak(orderFull()); });
  $('zhOrderSlow').addEventListener('click', () => { if (ord) A.speak(orderFull(), { slow: true }); });
  function drawOrder() {
    const ans = $('zhOrderAnswer'), pool = $('zhOrderTiles');
    ans.innerHTML = ''; pool.innerHTML = '';
    ord.picked.forEach((tile, pi) => {
      const b = el('button', 'zh-tile is-picked', tile.t);
      b.addEventListener('click', () => { if (ord.done) return; ord.picked.splice(pi, 1); drawOrder(); });
      ans.appendChild(b);
    });
    if (!ord.picked.length) ans.appendChild(el('span', 'zh-order-placeholder', 'Chạm vào các ô bên dưới theo đúng thứ tự'));
    ord.tiles.forEach(tile => {
      if (ord.picked.includes(tile)) return;
      const b = el('button', 'zh-tile', tile.t);
      b.addEventListener('click', () => { if (ord.done) return; ord.picked.push(tile); drawOrder(); });
      pool.appendChild(b);
    });
    $('zhOrderCheck').disabled = ord.done || !ord.picked.length;
  }
  $('zhOrderCheck').addEventListener('click', () => { if (ord && !ord.done && ord.picked.length) checkOrder(); });
  function checkOrder() {
    const s = ord.st.s;
    ord.done = true;
    $('zhOrderCheckBar').hidden = true;
    const ok = ord.picked.map(x => x.t).join('') === s.tokens.join('');
    const full = s.tokens.join('') + (s.end || '。');
    const fb = $('zhOrderFeedback');
    fb.textContent = ok ? '✓ Chính xác!' : '✗ Chưa đúng — câu đúng là:'; fb.className = 'quiz-feedback ' + (ok ? 'ok' : 'no');
    A.sfx(ok ? 'correct' : 'wrong');
    $('zhOrderAnswer').classList.add(ok ? 'is-correct' : 'is-wrong');
    $('zhOrderReveal').innerHTML = esc(full) + '<br>' + colorPinyin(s.py) + (ord.st.listen ? '<div class="zh-reveal-vi">' + esc(s.vi) + '</div>' : '');
    A.speak(full);
    showAnswer('zhOrderAns', ok);
    const st = ord.st;
    $('zhOrderNext').onclick = () => { if (S && S.steps[S.i] === st) stepDone(ok); };
  }

  // write (Hanzi Writer)
  let hwPromise = null;
  function loadHanziWriter() {
    if (window.HanziWriter) return Promise.resolve();
    if (!hwPromise) {
      hwPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = HANZI_WRITER_SRC; s.onload = resolve; s.onerror = () => { hwPromise = null; reject(); };
        document.head.appendChild(s);
      });
    }
    return hwPromise;
  }
  function writerColors() {
    const css = getComputedStyle(document.documentElement);
    const v = n => css.getPropertyValue(n).trim();
    return { strokeColor: v('--ink') || '#4A3F35', outlineColor: v('--line') || '#F0E3CC', highlightColor: v('--teal') || '#4FB0A5', drawingColor: v('--accent') || '#FF8A65', radicalColor: null };
  }
  const wr = { writer: null, st: null };
  RENDER.write = st => {
    A.showScreen('zh-write');
    fillFor('zhWriteFill');
    wr.st = st; wr.writer = null;
    const ch = st.char, info = CHAR_INFO[ch] || {};
    $('zhWriteInfo').innerHTML = '<span class="zh-write-char">' + esc(ch) + '</span> ' + (info.py ? colorPinyin(info.py) : '') + (info.vi ? ' <span class="zh-sub">(' + esc(info.vi) + ')</span>' : '');
    $('zhWriteHint').textContent = 'Xem mẫu rồi tô theo từng nét vào khung.';
    const nb = $('zhWriteNext');
    nb.disabled = true;
    nb.textContent = S.steps[S.i + 1] ? 'Tiếp →' : 'Xong ✓';
    nb.onclick = null;
    const box = $('zhWriteBox');
    box.innerHTML = '<p class="zh-offline">Đang tải nét chữ…</p>';
    A.speak(ch);
    const offline = () => {
      box.innerHTML = '<p class="zh-offline">Không tải được nét chữ (cần mạng lần đầu).</p>';
      nb.disabled = false; nb.onclick = () => stepDone(null);
    };
    loadHanziWriter().then(() => {
      if (wr.st !== st) return;
      box.innerHTML = '';
      const size = Math.min(280, box.clientWidth || 280);
      wr.writer = HanziWriter.create(box, ch, Object.assign(writerColors(), {
        width: size, height: size, padding: 10, showCharacter: false, showOutline: true,
        strokeAnimationSpeed: 1.2, delayBetweenStrokes: 200, showHintAfterMisses: 2, highlightOnComplete: true,
        onLoadCharDataError: offline,
      }));
      wr.writer.animateCharacter({ onComplete: startWriteQuiz });
    }).catch(offline);
  };
  function startWriteQuiz() {
    if (!wr.writer) return;
    const st = wr.st;
    $('zhWriteHint').textContent = '✍️ Đến lượt bạn: tô theo đúng thứ tự nét.';
    wr.writer.hideCharacter();
    wr.writer.quiz({
      onComplete: sum => {
        if (wr.st !== st) return;
        const ok = sum.totalMistakes <= 3;
        if (ok) A.sfx('correct');
        $('zhWriteHint').textContent = ok ? '🎉 Viết đúng rồi! (' + sum.totalMistakes + ' lỗi)' : '👍 Xong (' + sum.totalMistakes + ' lỗi) — bấm "Viết lại" để luyện thêm.';
        const nb = $('zhWriteNext');
        nb.disabled = false;
        nb.onclick = () => { wr.st = null; stepDone(ok); };
        A.speak(st.char);
      },
    });
  }
  $('zhWriteDemo').addEventListener('click', () => { if (!wr.writer) return; wr.writer.cancelQuiz(); wr.writer.hideCharacter(); wr.writer.animateCharacter({ onComplete: startWriteQuiz }); });
  $('zhWriteRetry').addEventListener('click', () => { if (wr.writer) { wr.writer.cancelQuiz(); startWriteQuiz(); } });

  // type: gõ pinyin, chọn chữ trong danh sách gợi ý (mô phỏng bộ gõ)
  let ty = null;
  RENDER.type = st => {
    A.showScreen('zh-type');
    fillFor('zhTypeFill');
    ty = { st, tries: 0, locked: false };
    setBig($('zhTypeBig'), st.word.zh);
    $('zhTypeVi').textContent = st.word.vi;
    $('zhTypeReveal').innerHTML = '';
    $('zhTypeAns').hidden = true;
    $('zhTypeNext').hidden = true;
    const fb = $('zhTypeFeedback'); fb.textContent = ''; fb.className = 'quiz-feedback';
    const input = $('zhTypeInput');
    input.value = ''; input.disabled = false;
    renderCands();
    setTimeout(() => input.focus(), 50);
  };
  function renderCands() {
    const key = pinyinKey($('zhTypeInput').value);
    const box = $('zhTypeCands');
    box.innerHTML = '';
    if (!key) { box.appendChild(el('span', 'zh-cand-empty', 'Chữ gợi ý sẽ hiện ở đây')); return; }
    const matches = COURSE_WORDS.filter(w => w.key.startsWith(key)).sort((a, b) => (b.key === key) - (a.key === key) || a.key.length - b.key.length).slice(0, 7);
    if (!matches.length) { box.appendChild(el('span', 'zh-cand-empty', 'Không có chữ nào — kiểm tra lại pinyin nhé')); return; }
    matches.forEach((m, k) => {
      const b = el('button', 'zh-cand');
      b.appendChild(el('small', null, String(k + 1)));
      b.appendChild(document.createTextNode(m.zh));
      b.addEventListener('click', () => chooseCand(m, b));
      box.appendChild(b);
    });
  }
  $('zhTypeInput').addEventListener('input', renderCands);
  $('zhTypeInput').addEventListener('keydown', e => {
    const n = e.key === 'Enter' ? 1 : Number(e.key);
    if (n >= 1 && n <= 7) { const b = $('zhTypeCands').querySelectorAll('.zh-cand')[n - 1]; if (b) { e.preventDefault(); b.click(); } }
  });
  function chooseCand(m, btn) {
    if (!ty || ty.locked) return;
    const w = ty.st.word, fb = $('zhTypeFeedback');
    if (m.zh === w.zh) {
      ty.locked = true;
      btn.classList.add('correct');
      fb.textContent = ty.tries === 0 ? '✓ Chính xác!' : '✓ Đúng rồi!'; fb.className = 'quiz-feedback ok'; A.sfx('correct');
      showAnswer('zhTypeAns', true);
      $('zhTypeReveal').innerHTML = esc(w.zh) + ' · ' + colorPinyin(w.py);
      $('zhTypeInput').disabled = true;
      A.speak(w.zh);
      const st = ty.st, ok = ty.tries === 0;
      const nb = $('zhTypeNext');
      nb.hidden = false;
      nb.onclick = () => { if (S && S.steps[S.i] === st) stepDone(ok); };
    } else {
      ty.tries++;
      btn.classList.add('wrong');
      fb.textContent = '✗ Chưa đúng chữ — thử chữ khác hoặc xem gợi ý.'; fb.className = 'quiz-feedback no'; A.sfx('wrong');
      showAnswer('zhTypeAns', false);
    }
  }
  $('zhTypeHint').addEventListener('click', () => { if (!ty) return; ty.tries++; $('zhTypeReveal').innerHTML = 'Gợi ý: ' + colorPinyin(ty.st.word.py) + ' → gõ "' + ty.st.word.key + '"'; if ($('zhTypeAns').hidden) showAnswer('zhTypeAns', null); });

  // ---------- Phím tắt (học trên máy tính) ----------
  // Số 1–9 chọn đáp án / ô chữ, Enter đi tiếp, Space nghe lại, ← → lật thẻ, Backspace bỏ ô vừa xếp.
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const scr = document.querySelector('.screen.active');
    const id = scr && scr.id.indexOf('screen-zh-') === 0 ? scr.id.slice(10) : '';
    if (!id) return;
    const click = b => { if (b && !b.disabled && !b.hidden && b.offsetParent !== null) { e.preventDefault(); b.click(); } };
    const num = /^[1-9]$/.test(e.key) ? Number(e.key) : 0;
    if (id === 'done') { if (e.key === 'Enter') click($('zhDoneNext').hidden ? $('zhDoneBack') : $('zhDoneNext')); return; }
    if (!S) return;
    if (id === 'card') {
      if (e.key === 'Enter' || e.key === 'ArrowRight') click($('zhCardNext'));
      else if (e.key === 'ArrowLeft') click($('zhCardPrev'));
      else if (e.key === ' ') click($('zhCardSpeak'));
    } else if (id === 'choice') {
      if (num) click($('zhChoiceOptions').querySelectorAll('.quiz-opt')[num - 1]);
      else if (e.key === 'Enter') click($('zhChoiceCheckBar').hidden ? $('zhChoiceNext') : $('zhChoiceCheck'));
      else if (e.key === ' ') click($('zhChoiceSpeak'));
    } else if (id === 'order') {
      if (num) click($('zhOrderTiles').querySelectorAll('.zh-tile')[num - 1]);
      else if (e.key === 'Backspace') click([...$('zhOrderAnswer').querySelectorAll('.zh-tile')].pop());
      else if (e.key === 'Enter') click($('zhOrderCheckBar').hidden ? $('zhOrderNext') : $('zhOrderCheck'));
    } else if (id === 'write') {
      if (e.key === 'Enter') click($('zhWriteNext'));
    } else if (id === 'type') {
      if (e.key === 'Enter') click($('zhTypeNext'));
    }
  });

  // ---------- CHỮ HÁN (đợt Z4) ----------
  // Mọi chữ Hán trong khoá, xếp theo phần (chữ thuộc phần đầu tiên nó xuất hiện). Độ thuộc 1 chữ (0–4) = mức cao
  // nhất của: lần luyện riêng chữ đó (Z().charLv) và hộp ôn tập của các từ có chữ đó (Z().srs). Chữ "đã gặp" =
  // có từ chứa nó đã học, hoặc đã luyện riêng.
  const CHAR_WORDS = {}; // chữ → các từ trong khoá có chữ đó
  COURSE_WORDS.forEach(w => [...w.zh].forEach(c => { if (HAS_HANZI.test(c)) (CHAR_WORDS[c] = CHAR_WORDS[c] || []).push(w); }));
  const PART_CHARS = (() => {
    const seen = new Set();
    return ZH_COURSE.map(part => {
      const out = [];
      const add = c => { if (HAS_HANZI.test(c) && !seen.has(c)) { seen.add(c); out.push(c); } };
      part.units.forEach(u => {
        unitLessons(u).forEach(l => { if (l.type === 'write' && l.chars) l.chars.forEach(add); });
        unitWords(u).forEach(w => [...w.zh].forEach(add));
      });
      return out;
    });
  })();
  const ALL_CHARS = PART_CHARS.flat();
  // Pinyin của 1 chữ: lấy từ CHAR_INFO, không có thì tách từ pinyin của từ chứa nó (số âm tiết = số chữ).
  function charPy(c) {
    if (CHAR_INFO[c]) return CHAR_INFO[c].py;
    let plain = '';
    for (const w of CHAR_WORDS[c] || []) {
      const chars = [...w.zh], syl = (w.py.toLowerCase().match(SYL) || []);
      if (syl.length !== chars.length) continue;
      const s = syl[chars.indexOf(c)];
      if (toneOf(s) !== 5) return s; // ưu tiên âm có dấu thanh (từ có thanh nhẹ như 客气 kèqi làm mất dấu của 气)
      plain = plain || s;
    }
    return plain;
  }
  const charVi = c => (CHAR_INFO[c] ? CHAR_INFO[c].vi : '');
  const charSeen = c => Z().charLv[c] !== undefined || (CHAR_WORDS[c] || []).some(w => Z().srs[w.zh]);
  function charLevel(c) {
    const z = Z();
    let lv = z.charLv[c] || 0;
    (CHAR_WORDS[c] || []).forEach(w => { if (z.srs[w.zh]) lv = Math.max(lv, z.srs[w.zh].box); });
    return Math.min(lv, 4);
  }
  function charRecord(c, ok) {
    const m = Z().charLv;
    m[c] = ok ? Math.min((m[c] || 0) + 1, 4) : Math.max((m[c] || 0) - 1, 0);
  }
  const CHAR_LV = lv => (lv >= 4 ? 2 : lv >= 2 ? 1 : 0); // → nhóm màu: Mới học / Đang nhớ / Nhớ lâu (LEVEL_NAMES)
  function charRadical(c) {
    return ZH_RADICALS.find(r => r.r === c || r.alt === c || r.ex.some(e => e[0] === c)) || null;
  }
  // Chọn 5 chữ để luyện: chữ đã gặp mà nhớ kém nhất trước, thiếu thì thêm chữ chưa gặp theo thứ tự khoá.
  function pickChars(pool, n) {
    const seen = shuffleArr(pool.filter(charSeen)).sort((a, b) => charLevel(a) - charLevel(b));
    return seen.concat(pool.filter(c => !charSeen(c))).slice(0, n);
  }
  // 1 lượt luyện: nhìn chữ chọn pinyin + nghe/nhìn pinyin chọn chữ (trộn lẫn), cuối lượt tô 2 chữ nhớ kém nhất.
  function charSteps(chars) {
    const withPy = ALL_CHARS.filter(charPy);
    const qs = [];
    chars.forEach(c => {
      const py = charPy(c), vi = charVi(c);
      if (py) {
        qs.push(choice('Chữ này đọc là gì?', { big: c, ch: c, sayAfter: c, reveal: c + ' · ' + py, revealVi: vi },
          uniqueOptions(py, () => charPy(pick(withPy)), 4)));
      }
      qs.push(choice('Nghe và chọn đúng chữ', { big: '🔊', say: c, py, ch: c, reveal: c + ' · ' + py, revealVi: vi },
        uniqueOptions(c, () => pick(ALL_CHARS), 4)));
    });
    return shuffleArr(qs).concat(chars.slice(0, 2).map(c => ({ kind: 'write', char: c })));
  }
  function practiceChars(chars, back) {
    if (!chars.length) return;
    const run = () => runSession({ lesson: { type: 'quiz', title: 'Luyện chữ Hán', practice: true }, steps: charSteps(chars), back, rebuild: run });
    run();
  }

  makeScreen('chars', '<div id="zhChars"></div>', 'tabSentences');
  makeScreen('char', topbar('zhCharBack') + '<div id="zhChar"></div>');
  function charsCard() {
    const n = ALL_CHARS.filter(charSeen).length;
    const b = el('button', 'zh-exam-card zh-chars-card');
    b.appendChild(el('span', 'zh-exam-card-icon zh-chars-card-icon', '字'));
    const t = el('span', 'zh-exam-card-text');
    t.appendChild(el('strong', null, 'Chữ Hán'));
    t.appendChild(el('small', null, 'Đã gặp ' + n + '/' + ALL_CHARS.length + ' chữ · xem nét viết, luyện theo nhóm 5 chữ'));
    b.append(t, el('span', 'settings-chevron', '›'));
    b.addEventListener('click', openChars);
    return b;
  }
  function openChars() { renderChars(); A.showScreen('zh-chars'); }
  function charTile(c) {
    const seen = charSeen(c), lv = charLevel(c);
    const b = el('button', 'zh-char-tile' + (seen ? '' : ' is-new'));
    b.setAttribute('aria-label', c + ' ' + charPy(c) + (seen ? ' — ' + LEVEL_NAMES[CHAR_LV(lv)] : ' — chưa gặp'));
    b.appendChild(el('span', 'zh-char-zh', c));
    const py = el('small', 'zh-char-py');
    py.innerHTML = colorPinyin(charPy(c));
    b.appendChild(py);
    const bar = el('span', 'zh-char-bar');
    if (seen) { const f = el('i', 'lv' + CHAR_LV(lv)); f.style.width = ((lv + 1) / 5 * 100) + '%'; bar.appendChild(f); }
    b.appendChild(bar);
    b.addEventListener('click', () => openChar(c));
    return b;
  }
  function renderChars() {
    const box = $('zhChars');
    box.innerHTML = '';
    const seenAll = ALL_CHARS.filter(charSeen);
    const hero = el('div', 'zh-hero');
    hero.appendChild(el('h1', null, 'Chữ Hán'));
    hero.appendChild(el('p', null, 'Mọi chữ trong khoá học, xếp theo phần. Chạm vào 1 chữ để xem nét viết, cách đọc và các từ có chữ đó.'));
    box.appendChild(hero);
    // Tổng quan: số chữ theo 3 mức nhớ + nút luyện 5 chữ cần ôn nhất.
    const panel = el('div', 'zh-panel');
    const counts = [0, 0, 0];
    seenAll.forEach(c => counts[CHAR_LV(charLevel(c))]++);
    panel.appendChild(el('div', 'zh-panel-title', 'Đã gặp ' + seenAll.length + '/' + ALL_CHARS.length + ' chữ'));
    const stack = el('div', 'zh-stack-bar');
    counts.forEach((n, i) => { if (n) { const s = el('span', 'zh-stack lv' + i); s.style.flexGrow = n; stack.appendChild(s); } });
    if (!seenAll.length) stack.appendChild(el('span', 'zh-stack'));
    panel.appendChild(stack);
    const legend = el('div', 'zh-legend');
    LEVEL_NAMES.forEach((name, i) => { const s = el('span'); s.innerHTML = '<i class="lv' + i + '"></i>' + esc(name) + ' <b>' + counts[i] + '</b>'; legend.appendChild(s); });
    panel.appendChild(legend);
    const go = el('button', 'cta-btn zh-wide-btn', seenAll.length ? '✍️ Luyện 5 chữ cần ôn nhất' : '✍️ Luyện 5 chữ đầu tiên');
    go.addEventListener('click', () => practiceChars(pickChars(seenAll.length ? ALL_CHARS : PART_CHARS.find(p => p.length) || [], 5), openChars));
    panel.appendChild(go);
    box.appendChild(panel);
    PART_CHARS.forEach((chars, pi) => {
      if (!chars.length) return;
      const part = ZH_COURSE[pi];
      const head = el('div', 'zh-char-part-head');
      head.style.setProperty('--pc', PART_COLORS[pi % PART_COLORS.length]);
      const t = el('span', 'zh-char-part-title');
      t.appendChild(el('strong', null, part.title));
      t.appendChild(el('small', null, chars.filter(charSeen).length + '/' + chars.length + ' chữ đã gặp'));
      const pr = el('button', 'ghost-btn zh-mini-btn', 'Luyện 5 chữ');
      pr.addEventListener('click', () => practiceChars(pickChars(chars, 5), openChars));
      head.append(t, pr);
      box.appendChild(head);
      const grid = el('div', 'zh-char-grid');
      chars.forEach(c => grid.appendChild(charTile(c)));
      box.appendChild(grid);
    });
  }

  // Chi tiết 1 chữ: nét viết (Hanzi Writer), cách đọc, nghĩa, bộ thủ, các từ có chữ đó.
  let charWriter = null;
  function openChar(c) {
    const box = $('zhChar');
    box.innerHTML = '';
    const head = el('div', 'zh-char-head');
    const hw = el('div', 'zh-char-hw');
    hw.appendChild(el('span', 'zh-char-fallback', c));
    head.appendChild(hw);
    const py = el('div', 'zh-py');
    py.innerHTML = colorPinyin(charPy(c));
    head.appendChild(py);
    if (charVi(c)) head.appendChild(el('div', 'zh-vi', charVi(c)));
    const seen = charSeen(c);
    head.appendChild(el('div', 'zh-char-lv', seen ? 'Mức nhớ: ' + LEVEL_NAMES[CHAR_LV(charLevel(c))] : 'Chưa gặp trong bài học'));
    const btns = el('div', 'zh-btn-row');
    const bSay = el('button', 'speak-btn', '🔊 Nghe'); bSay.addEventListener('click', () => A.speak(c));
    const bSlow = el('button', 'speak-btn zh-slow-btn', '🐢 Đọc chậm'); bSlow.addEventListener('click', () => A.speak(c, { slow: true }));
    const bStroke = el('button', 'speak-btn', '▶ Xem nét'); bStroke.addEventListener('click', () => { if (charWriter) { charWriter.hideCharacter(); charWriter.animateCharacter(); } });
    btns.append(bSay, bSlow, bStroke);
    head.appendChild(btns);
    const write = el('button', 'cta-btn zh-wide-btn', '✍️ Tập viết chữ này');
    write.addEventListener('click', () => runSession({ lesson: { type: 'quiz', title: 'Tập viết ' + c, practice: true }, steps: [{ kind: 'write', char: c }], back: () => openChar(c) }));
    head.appendChild(write);
    box.appendChild(head);
    const rad = charRadical(c);
    if (rad) {
      const p = el('div', 'zh-panel zh-char-rad');
      p.appendChild(el('div', 'zh-panel-title', 'Bộ thủ'));
      p.appendChild(el('div', null, rad.r + (rad.alt && rad.alt !== c ? ' (' + rad.alt + ')' : '') + ' · ' + rad.name + ' — ' + rad.vi));
      box.appendChild(p);
    }
    const words = (CHAR_WORDS[c] || []).slice(0, 12);
    if (words.length) {
      box.appendChild(el('div', 'section-label', 'Từ có chữ này'));
      const list = el('div', 'zh-panel zh-list');
      words.forEach(w => {
        const r = el('button', 'zh-list-row zh-char-word');
        r.appendChild(el('span', 'zh-char-word-zh', w.zh));
        const t = el('span', 'zh-list-text');
        const wp = el('strong'); wp.innerHTML = colorPinyin(w.py); t.appendChild(wp);
        t.appendChild(el('small', null, w.vi));
        r.append(t, el('span', 'zh-char-word-say', '🔊'));
        r.addEventListener('click', () => A.speak(w.zh));
        list.appendChild(r);
      });
      box.appendChild(list);
    }
    A.showScreen('zh-char');
    window.scrollTo(0, 0);
    A.speak(c);
    charWriter = null;
    loadHanziWriter().then(() => {
      if (!hw.isConnected) return;
      hw.innerHTML = '';
      charWriter = HanziWriter.create(hw, c, Object.assign(writerColors(), { width: 180, height: 180, padding: 12, showOutline: true, strokeAnimationSpeed: 1, delayBetweenStrokes: 220 }));
      charWriter.hideCharacter();
      charWriter.animateCharacter();
    }).catch(() => {}); // không có mạng: giữ chữ tĩnh
  }
  $('zhCharBack').addEventListener('click', openChars);

  // ---------- HỘI THOẠI CÓ NHÂN VẬT (đợt Z5) ----------
  // Xem từng câu hội thoại hiện dần (có giọng đọc), chạm từ để tra nghĩa; xong thì nhập vai chính đoạn đó.
  makeScreen('dlg', '<div id="zhDlg"></div>', 'tabSentences');
  function allDialogues() {
    if (!HAS_READ) return [];
    return Object.keys(ZH_ROLE).flatMap(k => ZH_ROLE[k].map(d => ({ d, unit: ALL_UNITS.find(u => u.id === k) })));
  }
  function dlgCard() {
    const b = el('button', 'zh-exam-card zh-dlg-card');
    b.appendChild(el('span', 'zh-exam-card-icon', '💬'));
    const t = el('span', 'zh-exam-card-text');
    t.appendChild(el('strong', null, 'Hội thoại có nhân vật'));
    t.appendChild(el('small', null, allDialogues().length + ' đoạn · nghe từng câu, chạm từ để tra, rồi nhập vai'));
    b.append(t, el('span', 'settings-chevron', '›'));
    b.addEventListener('click', openDialogues);
    return b;
  }
  function openDialogues() { renderDlgList(); A.showScreen('zh-dlg'); window.scrollTo(0, 0); }
  function renderDlgList() {
    const box = $('zhDlg');
    box.innerHTML = '';
    const hero = el('div', 'zh-hero');
    hero.appendChild(el('h1', null, 'Hội thoại'));
    hero.appendChild(el('p', null, 'Nghe và đọc từng câu hội thoại trong đời sống. Chọn 1 đoạn để bắt đầu.'));
    box.appendChild(hero);
    const list = el('div', 'zh-panel zh-list');
    allDialogues().forEach(x => list.appendChild(listRow('💬', x.d.title, x.unit ? 'Chặng ' + (ALL_UNITS.indexOf(x.unit) + 1) + ' · ' + x.unit.title : '', () => playDialogue(x.d))));
    box.appendChild(list);
  }
  function playDialogue(d) {
    const box = $('zhDlg');
    box.innerHTML = '';
    const back = el('button', 'ghost-btn zh-mini-btn zh-dlg-back', '← Danh sách');
    back.addEventListener('click', openDialogues);
    box.appendChild(back);
    const hero = el('div', 'zh-hero');
    hero.appendChild(el('h1', null, d.title));
    hero.appendChild(el('p', null, 'Chạm vào chữ Hán để tra nghĩa. Bấm Tiếp để nghe câu kế tiếp.'));
    box.appendChild(hero);
    const chat = el('div', 'zh-dlg-chat');
    const foot = el('div', 'zh-dlg-foot');
    box.append(chat, foot);
    let n = 0;
    const showNext = () => {
      const ln = d.lines[n++];
      const row = bubbleRow(ln, true, true);
      chat.querySelectorAll('.is-current').forEach(x => x.classList.remove('is-current'));
      row.querySelector('.zh-bubble').classList.add('is-current');
      chat.appendChild(row);
      A.speak(ln[1]);
      foot.innerHTML = '';
      if (n < d.lines.length) {
        const nx = el('button', 'cta-btn zh-wide-btn', 'Tiếp ▶');
        nx.addEventListener('click', showNext);
        foot.appendChild(nx);
      } else {
        foot.appendChild(el('div', 'zh-dlg-end', '🎉 Hết đoạn hội thoại'));
        const rp = el('button', 'cta-btn zh-wide-btn', '🎭 Nhập vai đoạn này');
        rp.addEventListener('click', () => runSession({ lesson: { type: 'quiz', title: d.title, practice: true }, steps: roleStepsFor([d]), back: () => playDialogue(d), rebuild: () => runSession({ lesson: { type: 'quiz', title: d.title, practice: true }, steps: roleStepsFor([d]), back: () => playDialogue(d) }) }));
        const again = el('button', 'ghost-btn zh-wide-btn', '🔁 Nghe lại từ đầu');
        again.addEventListener('click', () => playDialogue(d));
        foot.append(rp, again);
      }
      requestAnimationFrame(() => row.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    };
    box.hidden = false;
    A.showScreen('zh-dlg');
    window.scrollTo(0, 0);
    showNext();
  }

  // ---------- Dùng chung cho các tab ----------
  // 1 dòng trong danh sách hành động: biểu tượng · tiêu đề + mô tả · ›. Không có hàm bấm → dòng mờ.
  function listRow(icon, title, sub, onClick) {
    const r = el('button', 'zh-list-row');
    r.append(el('span', 'zh-list-icon', icon));
    const t = el('span', 'zh-list-text');
    t.append(el('strong', null, title), el('small', null, sub));
    r.append(t, el('span', 'zh-part-chev', '›'));
    if (onClick) r.addEventListener('click', onClick); else r.disabled = true;
    return r;
  }
  const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  function dayLabel(i) { const d = new Date(); d.setDate(d.getDate() + i); return i === 0 ? 'Nay' : WEEKDAY[d.getDay()]; }
  // Mức nhớ theo "hộp" lặp lại ngắt quãng: 0 = mới / vừa sai, 1–2 = đang nhớ, từ 3 (hẹn ôn ≥ 14 ngày) = nhớ lâu.
  function srsLevels() {
    const out = [0, 0, 0];
    Object.values(Z().srs).forEach(e => { out[e.box >= 3 ? 2 : e.box >= 1 ? 1 : 0]++; });
    return out;
  }
  const LEVEL_NAMES = ['Mới học', 'Đang nhớ', 'Nhớ lâu'];
  function levelPanel() {
    const lv = srsLevels(), tot = lv[0] + lv[1] + lv[2];
    const p = el('div', 'zh-panel');
    p.appendChild(el('div', 'zh-panel-title', 'Mức nhớ · ' + tot + ' từ đã học'));
    const bar = el('div', 'zh-stack-bar');
    lv.forEach((n, i) => { if (n) { const s = el('span', 'zh-stack lv' + i); s.style.flexGrow = n; bar.appendChild(s); } });
    const legend = el('div', 'zh-legend');
    lv.forEach((n, i) => { const x = el('span'); x.innerHTML = '<i class="lv' + i + '"></i>' + LEVEL_NAMES[i] + ' <b>' + n + '</b>'; legend.appendChild(x); });
    p.append(bar, legend);
    return p;
  }
  // Số từ đến hạn mỗi ngày trong n ngày tới (từ quá hạn tính vào hôm nay).
  function dueForecast(n) {
    const out = Array(n).fill(0), days = out.map((x, i) => addDays(i));
    days[0] = todayStr();
    Object.values(Z().srs).forEach(e => { const i = days.findIndex(d => e.due <= d); if (i >= 0) out[i]++; });
    return out;
  }
  // Biểu đồ cột nhỏ: values[i] ứng với nhãn labels[i].
  function barChart(values, labels, unit) {
    const max = Math.max(1, ...values);
    const g = el('div', 'zh-bars');
    values.forEach((v, i) => {
      const c = el('div', 'zh-bar-col' + (i === values.length - 1 && unit === 'past' || i === 0 && unit === 'next' ? ' is-today' : ''));
      const b = el('span', 'zh-bar');
      b.style.height = Math.max(v ? 8 : 2, v / max * 100) + '%';
      c.append(el('small', 'zh-bar-n', v ? String(v) : ''), el('span', 'zh-bar-track'), el('small', 'zh-bar-label', labels[i]));
      c.querySelector('.zh-bar-track').appendChild(b);
      g.appendChild(c);
    });
    return g;
  }
  // Bỏ dấu tiếng Việt để tìm "chao" ra "chào".
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

  // ---------- Tab ÔN TẬP ----------
  function openReview() { renderReview(); A.showScreen('zh-review'); }
  function practiceSession(title, makeSteps, back) {
    const steps = makeSteps();
    if (!steps.length) { A.showToast('Chưa có từ nào để ôn — học vài bài ở tab Học trước nhé!', '📚'); return; }
    runSession({ lesson: { type: 'quiz', title, practice: true }, steps, back, rebuild: () => practiceSession(title, makeSteps, back) });
  }
  function reviewSteps(words) {
    const pool = learnedWords().length >= 4 ? learnedWords() : COURSE_WORDS;
    const qs = shuffleArr(words).slice(0, 15).map((w, k) => wordQuestion(w, pool, k, false));
    if (words.length >= 4) qs.splice(Math.min(5, qs.length), 0, { kind: 'match', pairs: shuffleArr(words).slice(0, 4) });
    return qs;
  }
  function renderReview() {
    const box = $('zhReview');
    box.innerHTML = '';
    const due = dueWords(), hard = hardWords(), learned = learnedWords();
    const hero = el('div', 'zh-hero');
    hero.appendChild(el('h1', null, 'Ôn tập'));
    hero.appendChild(el('p', null, 'Từ trả lời đúng được hẹn ôn lại sau 1 → 3 → 7 → 14 → 30 ngày — đúng lúc bạn sắp quên.'));
    box.appendChild(hero);
    const main = el('div', 'zh-panel zh-review-main');
    box.appendChild(main);
    // Chưa học từ nào: hướng sang tab Học thay vì hiện các nút bị khoá.
    if (!learned.length) {
      main.classList.add('is-empty');
      main.append(el('div', 'zh-empty-icon', '📭'), el('strong', 'zh-review-big', 'Chưa có từ nào để ôn'),
        el('p', 'zh-panel-note', 'Mỗi từ bạn học ở tab Học sẽ tự vào đây và được nhắc ôn đúng lúc.'));
      const go = el('button', 'cta-btn zh-wide-btn', 'Học bài đầu tiên →');
      go.addEventListener('click', goHome);
      main.appendChild(go);
      return;
    }
    if (due.length) {
      const n = Math.min(due.length, 15);
      main.append(el('small', 'zh-panel-kicker', 'Hôm nay'), el('strong', 'zh-review-big', due.length + ' từ đến hạn ôn'));
      const chips = el('div', 'zh-due-chips');
      due.slice(0, 8).forEach(w => chips.appendChild(el('span', 'zh-due-chip', w.zh)));
      if (due.length > 8) chips.appendChild(el('span', 'zh-due-chip is-more', '+' + (due.length - 8)));
      main.appendChild(chips);
      const b1 = el('button', 'cta-btn zh-wide-btn', 'Bắt đầu ôn ' + n + ' từ · ~' + Math.max(2, Math.round(n / 3)) + ' phút');
      b1.addEventListener('click', () => practiceSession('Ôn tập hôm nay', () => reviewSteps(dueWords()), openReview));
      main.appendChild(b1);
      if (due.length > 15) main.appendChild(el('p', 'zh-panel-note', 'Mỗi lượt ôn 15 từ, phần còn lại ôn ở lượt sau.'));
    } else {
      const f = dueForecast(31), next = f.findIndex(x => x > 0);
      main.classList.add('is-empty');
      main.append(el('div', 'zh-empty-icon', '✅'), el('strong', 'zh-review-big', 'Đã ôn hết từ hôm nay'),
        el('p', 'zh-panel-note', next > 0 ? 'Lượt ôn tiếp theo: ' + f[next] + ' từ ' + (next === 1 ? 'vào ngày mai' : 'sau ' + next + ' ngày') + '. Muốn luyện thêm thì chọn bên dưới.' : 'Muốn luyện thêm thì chọn bên dưới.'));
    }
    const acts = el('div', 'zh-panel zh-list');
    acts.append(
      listRow('📌', 'Luyện từ hay sai', hard.length ? hard.length + ' từ bạn từng trả lời sai' : 'Chưa có từ nào sai — tốt lắm!',
        hard.length ? () => practiceSession('Luyện từ hay sai', () => reviewSteps(hardWords()), openReview) : null),
      listRow('🎲', 'Ôn ngẫu nhiên', learned.length >= 4 ? '10 từ bất kỳ trong ' + learned.length + ' từ đã học' : 'Cần học ít nhất 4 từ',
        learned.length >= 4 ? () => practiceSession('Ôn ngẫu nhiên', () => reviewSteps(shuffleArr(learnedWords()).slice(0, 10)), openReview) : null));
    box.appendChild(acts);
    box.appendChild(levelPanel());
    const fc = el('div', 'zh-panel');
    fc.appendChild(el('div', 'zh-panel-title', 'Lịch ôn 7 ngày tới'));
    fc.appendChild(barChart(dueForecast(7), [0, 1, 2, 3, 4, 5, 6].map(dayLabel), 'next'));
    box.appendChild(fc);
    if (hard.length) {
      box.appendChild(el('div', 'section-label', '📌 Từ hay sai'));
      box.appendChild(wordList(hard, w => w.vi + ' · sai ' + Z().srs[w.zh].wrong + ' lần'));
    }
  }
  function wordList(words, marks) {
    const list = el('div', 'zh-word-list');
    words.forEach(w => {
      const r = el('button', 'zh-word-row');
      r.appendChild(el('span', 'zh-word-zh', w.zh));
      const py = el('span', 'zh-word-py'); py.innerHTML = colorPinyin(w.py || ''); r.appendChild(py);
      r.appendChild(el('span', 'zh-word-vi', (marks && marks(w)) || w.vi || ''));
      r.addEventListener('click', () => A.speak(w.zh));
      list.appendChild(r);
    });
    return list;
  }

  // ---------- Tab LUYỆN TẬP ----------
  function openPractice() { renderPractice(); A.showScreen('zh-practice'); }
  function genSteps(gen, n) { return Array.from({ length: n }, () => GEN[gen]()); }
  function renderPractice() {
    const box = $('zhPractice');
    box.innerHTML = '';
    const hero = el('div', 'zh-hero');
    hero.appendChild(el('h1', null, 'Luyện tập'));
    hero.appendChild(el('p', null, 'Luyện riêng từng kỹ năng, làm lại bao nhiêu lần cũng được — không ảnh hưởng tiến độ khoá học.'));
    box.appendChild(hero);
    box.appendChild(charsCard());
    if (HAS_READ) box.appendChild(dlgCard());
    if (HAS_EXAM) box.appendChild(examCard());
    const learned = learnedWords();
    const pool = learned.length >= 4 ? learned : COURSE_WORDS.slice(0, 30);
    const chars = [...new Set(pool.map(w => [...w.zh]).flat())].filter(c => HAS_HANZI.test(c));
    const groups = [
      ['Phát âm & thanh điệu', [
        ['🎵', 'Luyện thanh điệu', 'Nghe và chọn đúng thanh', () => genSteps('tones', 10)],
        ['🔤', 'Ghép âm pinyin', 'Nghe và chọn đúng pinyin', () => genSteps('syllables', 10)],
        ['🎶', 'Nghe chọn vần', 'an hay ang? in hay ing?', () => genSteps('finals', 10)],
        ['🎚️', 'Thanh điệu trong từ', 'Nghe từ, chọn đúng dấu', () => genSteps('pinyinWord', 10)],
        ['👂', 'Âm đầu dễ nhầm', 'b/p, zh/z, j/q/x…', () => genSteps('initials', 10)],
      ]],
      ['Từ vựng & chữ Hán', [
        ['👀', 'Nhận mặt chữ', 'Nhìn chữ, chọn nghĩa', () => shuffleArr(pool).slice(0, 10).map(w => wordQuestion(w, pool, 0, true))],
        ['🎧', 'Nghe chọn chữ', 'Nghe từ, chọn đúng chữ', () => shuffleArr(pool).slice(0, 10).map(w => wordQuestion(w, pool, 1, false))],
        ['🧩', 'Nối từ', 'Nối chữ với nghĩa', () => [0, 1, 2].map(() => ({ kind: 'match', pairs: shuffleArr(pool).slice(0, 4) }))],
        ['✍️', 'Tô chữ', 'Viết đúng thứ tự nét', () => shuffleArr(chars).slice(0, 6).map(c => ({ kind: 'write', char: c }))],
        ['⌨️', 'Gõ pinyin', 'Gõ rồi chọn đúng chữ', () => shuffleArr(pool).slice(0, 8).map(w => ({ kind: 'type', word: Object.assign({ key: pinyinKey(w.py) }, w) }))],
        ['🧱', 'Bộ thủ', 'Chữ này có bộ gì?', () => genSteps('radicals', 10)],
      ]],
      ['Nghe & đọc hiểu', [
        ['🎧', 'Luyện nghe câu', 'Câu & hội thoại HSK 1', () => listenSteps(HAS_LISTEN ? Object.keys(ZH_LISTEN) : [], 10)],
        ['📰', 'Đọc hiểu', 'Đọc đoạn văn, trả lời câu hỏi', () => readSteps(HAS_READ ? Object.keys(ZH_READ) : [], 2)],
        ['🎭', 'Nhập vai', 'Chọn câu đáp trong hội thoại', () => roleSteps(HAS_READ ? Object.keys(ZH_ROLE) : [], 2)],
        ['🗣️', 'Sắp xếp câu', 'Các câu trong khoá học', () => shuffleArr(allSentences()).slice(0, 6).map(s => ({ kind: 'order', s }))],
        ['✍️', 'Nghe và xếp câu', 'Nghe câu, tự xếp lại từng chữ', () => shuffleArr(allSentences()).slice(0, 6).map(s => ({ kind: 'order', s, listen: true }))],
      ]],
      ['Số, giờ & tiền', [
        ['🔢', 'Nghe số', 'Số từ 11 đến 99', () => genSteps('numbers', 10)],
        ['🕒', 'Nghe giờ', 'Mấy giờ rồi?', () => genSteps('time', 8)],
        ['💰', 'Nghe giá tiền', 'Bao nhiêu tiền?', () => genSteps('money', 8)],
      ]],
    ];
    groups.forEach(([label, tiles]) => {
      box.appendChild(el('div', 'section-label', label));
      if (label === 'Từ vựng & chữ Hán' && learned.length < 4) box.appendChild(el('p', 'zh-panel-note zh-practice-note', 'Đang dùng 30 từ đầu khoá. Học thêm vài bài để luyện đúng những từ của bạn.'));
      const list = el('div', 'zh-panel zh-list');
      tiles.forEach(t => {
        const run = () => runSession({ lesson: { type: 'quiz', title: t[1], practice: true }, steps: t[3](), back: openPractice, rebuild: run });
        list.appendChild(listRow(t[0], t[1], t[2], run));
      });
      box.appendChild(list);
    });
  }
  const ORDER_TOKENS = (() => {
    const seen = new Set();
    ALL_UNITS.forEach(u => unitLessons(u).forEach(l => { if (l.type === 'order') l.sentences.forEach(s => s.tokens.forEach(t => { if (HAS_HANZI.test(t)) seen.add(t); })); }));
    return [...seen];
  })();
  function allSentences() {
    const out = [];
    ALL_UNITS.forEach(u => unitLessons(u).forEach(l => { if (l.type === 'order') out.push(...l.sentences); }));
    return out;
  }

  // ---------- Tab THƯ VIỆN ----------
  let libMode = 'pinyin';
  function openLibrary() { renderLibrary(); A.showScreen('zh-library'); }
  function renderLibrary() {
    const box = $('zhLibrary');
    box.innerHTML = '';
    const hero = el('div', 'zh-hero');
    hero.appendChild(el('h1', null, 'Thư viện'));
    hero.appendChild(el('p', null, 'Tra cứu pinyin, bộ thủ, ngữ pháp và toàn bộ từ vựng. Chạm vào mục bất kỳ để nghe.'));
    box.appendChild(hero);
    // Ô tìm kiếm chung: tìm cùng lúc trong từ vựng, bộ thủ và mẫu ngữ pháp (chữ Hán, pinyin không dấu, nghĩa).
    const search = el('input', 'zh-type-input zh-lib-search');
    search.type = 'search';
    search.placeholder = '🔍 Tìm chữ Hán, pinyin hoặc nghĩa…';
    search.value = libQuery;
    const results = el('div', 'zh-lib-results');
    box.append(search, results);
    const seg = el('div', 'zh-lib-tabs zh-lib-seg');
    [['pinyin', 'Pinyin'], ['radicals', 'Bộ thủ'], ['grammar', 'Ngữ pháp'], ['words', 'Từ vựng']].forEach(m => {
      const b = el('button', 'zh-chip' + (libMode === m[0] ? ' is-active' : ''), m[1]);
      b.addEventListener('click', () => { libMode = m[0]; renderLibrary(); });
      seg.appendChild(b);
    });
    box.appendChild(seg);
    const body = el('div', 'zh-lib-body');
    box.appendChild(body);
    const drawSearch = () => {
      libQuery = search.value;
      const q = search.value.trim();
      seg.hidden = body.hidden = !!q;
      results.innerHTML = '';
      if (q) libSearch(q, results);
    };
    search.addEventListener('input', drawSearch);
    drawSearch();
    if (libMode === 'pinyin') {
      body.appendChild(el('div', 'section-label', '4 thanh điệu (màu dùng trong toàn app)'));
      const tones = el('div', 'zh-tone-legend');
      [['mā', '妈', 'Thanh 1', 'cao, đều', '55'], ['má', '麻', 'Thanh 2', 'đi lên', '35'], ['mǎ', '马', 'Thanh 3', 'xuống rồi lên', '214'], ['mà', '骂', 'Thanh 4', 'rơi mạnh', '51'], ['ma', '吗', 'Thanh nhẹ', 'ngắn, nhẹ', '']].forEach((t, i) => {
        const b = el('button', 'zh-tone-row');
        const big = el('span', 'zh-tone-py'); big.innerHTML = colorPinyin(t[0]);
        const cv = el('span', 'zh-tone-contour'); cv.innerHTML = toneSvg(t[4], i + 1);
        const txt = el('span', 'zh-tone-text'); txt.append(el('strong', null, t[2]), el('small', null, t[3]));
        b.append(big, cv, txt);
        b.addEventListener('click', () => A.speak(t[1]));
        tones.appendChild(b);
      });
      body.appendChild(tones);
      body.appendChild(el('div', 'section-label', 'Thanh mẫu (âm đầu) — chạm để nghe chữ ví dụ'));
      const g1 = el('div', 'zh-pinyin-grid');
      ZH_INITIALS.forEach(x => {
        const b = el('button', 'zh-pinyin-cell');
        b.appendChild(el('strong', null, x.i));
        const s = el('small'); s.innerHTML = esc(x.ex) + ' ' + colorPinyin(x.py); b.appendChild(s);
        b.addEventListener('click', () => { A.speak(x.ex); A.showToast(x.i + ': ' + ZH_INITIAL_NOTES[x.i], '🔤'); });
        g1.appendChild(b);
      });
      body.appendChild(g1);
      body.appendChild(el('div', 'section-label', 'Vận mẫu (âm vần)'));
      const g2 = el('div', 'zh-pinyin-grid');
      ZH_FINALS_1.concat(ZH_FINALS_2).forEach(f => {
        const b = el('button', 'zh-pinyin-cell');
        b.appendChild(el('strong', null, f[0]));
        const s = el('small'); s.innerHTML = esc(f[1]) + ' ' + colorPinyin(f[2]); b.appendChild(s);
        b.addEventListener('click', () => { A.speak(f[1]); if (ZH_FINAL_NOTES[f[0]]) A.showToast(f[0] + ': ' + ZH_FINAL_NOTES[f[0]], '🎶'); });
        g2.appendChild(b);
      });
      body.appendChild(g2);
    } else if (libMode === 'radicals') {
      // Lưới ô nhỏ; chạm 1 ô → thẻ chi tiết phía trên (pinyin, nghĩa, chữ ví dụ) và đọc to.
      const detail = el('div', 'zh-rad-detail');
      const grid = el('div', 'zh-rad-grid');
      const show = (r, cell, speak) => {
        grid.querySelectorAll('.is-active').forEach(c => c.classList.remove('is-active'));
        cell.classList.add('is-active');
        libRadical = r.r;
        detail.innerHTML = '';
        const head = el('div', 'zh-rad-head');
        head.appendChild(el('span', 'zh-rad-big', r.r + (r.alt ? ' ' + r.alt : '')));
        const t = el('span', 'zh-rad-head-text');
        const py = el('span', 'zh-word-py'); py.innerHTML = 'Bộ ' + esc(r.name) + ' · ' + colorPinyin(r.py);
        t.append(py, el('span', 'zh-word-vi', r.vi));
        head.appendChild(t);
        detail.appendChild(head);
        const ex = el('div', 'zh-rad-ex');
        r.ex.forEach(e => {
          const b = el('button', 'zh-rad-ex-item');
          b.appendChild(el('strong', null, e[0]));
          const p = el('small'); p.innerHTML = colorPinyin(e[1]); b.appendChild(p);
          b.appendChild(el('small', null, e[2]));
          b.addEventListener('click', () => A.speak(e[0]));
          ex.appendChild(b);
        });
        detail.appendChild(ex);
        if (speak) A.speak(r.ex.map(e => e[0]).join('，'));
      };
      let first = null;
      ZH_RADICALS.forEach(r => {
        const c = el('button', 'zh-rad-cell');
        c.appendChild(el('strong', null, r.r));
        c.appendChild(el('small', null, r.name));
        c.addEventListener('click', () => show(r, c, true));
        grid.appendChild(c);
        if (!first || r.r === libRadical) first = [r, c];
      });
      body.append(detail, el('small', 'zh-lib-count', ZH_RADICALS.length + ' bộ thủ thường gặp · chạm để xem chữ ví dụ'), grid);
      show(first[0], first[1], false);
    } else if (libMode === 'grammar') {
      // Dạng thu gọn: mỗi lần mở 1 chủ điểm.
      LIB_GRAMMAR.forEach((id, i) => {
        const l = STEP_LESSONS[id];
        if (libGrammar === null && i === 0) libGrammar = id;
        const open = libGrammar === id;
        const card = el('div', 'zh-gram-card' + (open ? ' is-open' : ''));
        const head = el('button', 'zh-acc-head');
        head.append(el('strong', null, l.title), el('small', null, l.items.length + ' mẫu'), el('span', 'zh-part-chev', '›'));
        head.addEventListener('click', () => { libGrammar = open ? '' : id; renderLibrary(); });
        card.appendChild(head);
        if (open) l.items.forEach(it => {
          const row = el('button', 'zh-gram-row');
          row.appendChild(el('span', 'zh-gram-zh', it.big));
          if (it.py) { const p = el('span', 'zh-gram-py'); p.innerHTML = colorPinyin(it.py); row.appendChild(p); }
          row.appendChild(el('span', 'zh-gram-vi', it.vi + (it.note ? ' — ' + it.note : '')));
          if (HAS_HANZI.test(it.big)) row.addEventListener('click', () => A.speak(it.big));
          card.appendChild(row);
        });
        body.appendChild(card);
      });
    } else {
      // Từ vựng: gom theo phần của khoá (thu gọn được), từ xếp lưới ô.
      const srs = Z().srs;
      const listBox = el('div');
      const tiles = wordTiles;
      // Mỗi chặng 1 nhóm (vài chục từ là cùng), có nhãn phần ngăn cách; từ trùng chỉ tính ở chặng gặp đầu tiên.
      const seen = new Set();
      const groups = [];
      ZH_COURSE.forEach(part => part.units.forEach(u => {
        const ws = unitWords(u).filter(w => !seen.has(w.zh));
        ws.forEach(w => seen.add(w.zh));
        groups.push({ id: u.id, part: part.id, title: 'Chặng ' + (ALL_UNITS.indexOf(u) + 1) + ' · ' + u.title, words: ws });
      }));
      groups.push({ id: 'more', part: 'more', title: 'Từ HSK 1 ngoài lộ trình', words: COURSE_WORDS.filter(w => !seen.has(w.zh)) });
      const partChips = ZH_COURSE.map((p, i) => [p.id, 'Phần ' + (i + 1)]).filter(c => groups.some(g => g.part === c[0] && g.words.length)).concat(groups[groups.length - 1].words.length ? [['more', 'Khác']] : []);
      const draw = () => {
        listBox.innerHTML = '';
        listBox.appendChild(el('small', 'zh-lib-count', COURSE_WORDS.length + ' từ · ' + COURSE_WORDS.filter(w => srs[w.zh]).length + ' đã học (✓) · chạm để nghe'));
        // Chọn phần → chỉ hiện các chặng của phần đó (thu gọn được).
        if (!libWordPart || !partChips.some(c => c[0] === libWordPart)) libWordPart = partChips[0][0];
        const chips = el('div', 'zh-lib-tabs zh-lib-parts');
        partChips.forEach(c => {
          const b = el('button', 'zh-chip' + (libWordPart === c[0] ? ' is-active' : ''), c[1]);
          b.addEventListener('click', () => { libWordPart = c[0]; libWordGroup = ''; draw(); });
          chips.appendChild(b);
        });
        listBox.appendChild(chips);
        const part = ZH_COURSE.find(p => p.id === libWordPart);
        if (part) listBox.appendChild(el('small', 'zh-lib-count', part.title + ' — ' + part.desc));
        groups.filter(g => g.part === libWordPart && g.words.length).forEach(g => {
          const open = libWordGroup === g.id || g.part === 'more';
          const card = el('div', 'zh-gram-card' + (open ? ' is-open' : ''));
          const head = el('button', 'zh-acc-head');
          head.append(el('strong', null, g.title), el('small', null, g.words.filter(w => srs[w.zh]).length + '/' + g.words.length + ' từ'), el('span', 'zh-part-chev', '›'));
          head.addEventListener('click', () => { libWordGroup = open ? '' : g.id; draw(); });
          card.appendChild(head);
          if (open) card.appendChild(tiles(g.words));
          listBox.appendChild(card);
        });
      };
      body.appendChild(listBox);
      draw();
    }
  }
  function wordTiles(words) {
    const srs = Z().srs;
    const g = el('div', 'zh-wtile-grid');
    words.forEach(w => {
      const b = el('button', 'zh-wtile' + (srs[w.zh] ? ' is-learned' : ''));
      b.appendChild(el('strong', null, w.zh));
      const p = el('small', 'zh-wtile-py'); p.innerHTML = colorPinyin(w.py || ''); b.appendChild(p);
      b.appendChild(el('small', 'zh-wtile-vi', w.vi));
      b.addEventListener('click', () => A.speak(w.zh));
      g.appendChild(b);
    });
    return g;
  }
  // Đường cong thanh điệu (thang 5 bậc của Triệu Nguyên Nhậm: 55, 35, 214, 51); thanh nhẹ = 1 chấm ngắn.
  function toneSvg(levels, tone) {
    const W = 56, H = 34, pad = 4, y = l => pad + (5 - l) / 4 * (H - 2 * pad);
    const c = 'var(--tone' + Math.min(tone, 4) + ')';
    if (!levels) return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><circle cx="' + W / 2 + '" cy="' + y(2) + '" r="4" fill="var(--ink-soft)"/></svg>';
    const pts = [...levels].map((l, i, a) => (pad + i / (a.length - 1) * (W - 2 * pad)).toFixed(1) + ',' + y(+l).toFixed(1));
    const grid = [1, 2, 3, 4, 5].map(l => '<line x1="0" x2="' + W + '" y1="' + y(l) + '" y2="' + y(l) + '" stroke="var(--line)" stroke-width="1"/>').join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">' + grid +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  const LIB_GRAMMAR = ['g_svo', 'g_shi_you', 'g_neg', 'g_questions', 'g_de_measure'];
  // Kết quả tìm kiếm chung của Thư viện, chia 3 nhóm.
  function libSearch(q, out) {
    const fq = fold(q), qk = pinyinKey(q);
    const has = s => fold(s).includes(fq);
    const words = COURSE_WORDS.filter(w => w.zh.includes(q) || has(w.vi) || (qk && w.key.startsWith(qk)));
    const rads = ZH_RADICALS.filter(r => r.r === q || r.alt === q || has(r.name) || has(r.vi) || (qk && pinyinKey(r.py) === qk));
    const gram = [];
    LIB_GRAMMAR.forEach(id => STEP_LESSONS[id].items.forEach(it => {
      if (it.big.includes(q) || has(it.vi) || (qk.length > 2 && pinyinKey(it.py || '').includes(qk))) gram.push(it);
    }));
    const total = words.length + rads.length + gram.length;
    out.appendChild(el('small', 'zh-lib-count', total ? total + ' kết quả cho “' + q + '” · chạm để nghe' : 'Không tìm thấy “' + q + '”. Thử gõ pinyin không dấu (vd: xiexie) hoặc nghĩa tiếng Việt.'));
    if (words.length) {
      out.appendChild(el('div', 'section-label', 'Từ vựng · ' + words.length));
      out.appendChild(wordTiles(words.slice(0, 120)));
    }
    if (rads.length) {
      out.appendChild(el('div', 'section-label', 'Bộ thủ · ' + rads.length));
      const g = el('div', 'zh-rad-grid');
      rads.forEach(r => {
        const c = el('button', 'zh-rad-cell');
        c.append(el('strong', null, r.r), el('small', null, r.name));
        c.addEventListener('click', () => { libMode = 'radicals'; libRadical = r.r; libQuery = ''; renderLibrary(); });
        g.appendChild(c);
      });
      out.appendChild(g);
    }
    if (gram.length) {
      out.appendChild(el('div', 'section-label', 'Mẫu ngữ pháp · ' + gram.length));
      const card = el('div', 'zh-gram-card is-open');
      gram.slice(0, 30).forEach(it => {
        const row = el('button', 'zh-gram-row');
        row.appendChild(el('span', 'zh-gram-zh', it.big));
        if (it.py) { const p = el('span', 'zh-gram-py'); p.innerHTML = colorPinyin(it.py); row.appendChild(p); }
        row.appendChild(el('span', 'zh-gram-vi', it.vi + (it.note ? ' — ' + it.note : '')));
        if (HAS_HANZI.test(it.big)) row.addEventListener('click', () => A.speak(it.big));
        card.appendChild(row);
      });
      out.appendChild(card);
    }
  }
  let libRadical = null, libGrammar = null, libWordGroup = '', libWordPart = null, libQuery = ''; // libGrammar null = mở chủ điểm đầu

  // ---------- THI THỬ HSK 1 (data/zh_hsk1_exam.js) ----------
  // Bố cục như đề thật: Nghe 4 phần + Đọc 4 phần, mỗi phần 5 câu, mỗi câu 5 điểm (200 điểm, đạt từ 120).
  // Làm như thi thật: chọn xong mới sang câu, không báo đúng/sai giữa chừng; mỗi đoạn nghe phát tối đa
  // 2 lần; hết giờ thì tự nộp bài. Rời màn thi giữa chừng (bấm tab khác) thì huỷ bài.
  const HAS_EXAM = typeof ZH_HSK1_EXAM !== 'undefined';
  const EXAM_MINUTES = 40, EXAM_PASS = 120, EXAM_PLAYS = 2;
  const EXAM_PARTS = {
    L1: 'Nghe 1 từ — tranh có đúng với từ vừa nghe không?',
    L2: 'Nghe 1 câu — chọn tranh phù hợp.',
    L3: 'Nghe hội thoại — chọn tranh phù hợp (A–F).',
    L4: 'Nghe câu nói và câu hỏi — chọn câu trả lời đúng.',
    R1: 'Nhìn tranh và từ — tranh có đúng với từ không?',
    R2: 'Đọc câu — chọn tranh phù hợp (A–F).',
    R3: 'Chọn câu trả lời phù hợp với câu hỏi (A–F).',
    R4: 'Chọn từ phù hợp để điền vào chỗ trống (A–F).',
  };
  const LETTERS = 'ABCDEF';
  let EX = null;
  if (HAS_EXAM) {
    makeScreen('exam', topbar('zhExamBack', 'zhExamFill') + '<div class="zh-exam" id="zhExam"></div>');
    $('zhExamBack').addEventListener('click', () => {
      if (!EX || EX.done) { openPractice(); return; }
      A.confirm('Thoát bài thi? Bài đang làm sẽ không được chấm.', { okLabel: 'Thoát', danger: true })
        .then(ok => { if (ok) { stopExam(); openPractice(); } });
    });
  }

  function buildExam() {
    const E = ZH_HSK1_EXAM, sh = a => shuffleArr(a.slice());
    const qs = [];
    const allPics = [...new Set(E.pictures.map(p => p[3]).concat(E.sentences.map(s => s.pic)))];
    const otherPics = (except, n) => sh(allPics.filter(p => except.indexOf(p) === -1)).slice(0, n);
    // Phần 1 (Nghe + Đọc): từ ↔ tranh, đúng/sai — khoảng 1 nửa là tranh đúng.
    const pics = sh(E.pictures);
    pics.slice(0, 10).forEach((w, i) => {
      const right = Math.random() < 0.5;
      qs.push({ sec: i < 5 ? 'L' : 'R', part: 1, kind: 'judge', say: i < 5 ? w[0] : null, text: i < 5 ? null : w[0], textPy: i < 5 ? null : w[1],
        pic: right ? w[3] : otherPics([w[3]], 1)[0], options: ['✓', '✗'], answer: right ? 0 : 1, rev: { zh: w[0], py: w[1], vi: w[2] } });
    });
    // Nghe phần 2: nghe câu → chọn 1 trong 3 tranh. Đọc phần 2: 5 câu ↔ 6 tranh chung.
    const sens = sh(E.sentences);
    sens.slice(0, 5).forEach(s => {
      const options = sh([s.pic].concat(otherPics([s.pic], 2)));
      qs.push({ sec: 'L', part: 2, kind: 'pics', say: s.s, options, answer: options.indexOf(s.pic), rev: { zh: s.s, py: s.py, vi: s.vi } });
    });
    // Nghe phần 3: 5 hội thoại ↔ 6 tranh chung.
    const dia = sh(E.dialogues).slice(0, 6);
    const diaPics = sh(dia.map(d => d.pic));
    dia.slice(0, 5).forEach(d => qs.push({ sec: 'L', part: 3, kind: 'pics', say: d.lines.map(l => l[0]).join(' … '), options: diaPics, answer: diaPics.indexOf(d.pic),
      rev: { zh: d.lines.map(l => l[0]).join(' '), py: d.lines.map(l => l[1]).join(' '), vi: d.vi } }));
    // Nghe phần 4: câu + câu hỏi → 3 đáp án chữ.
    sh(E.listenQA).slice(0, 5).forEach(x => {
      const order = sh([0, 1, 2]);
      qs.push({ sec: 'L', part: 4, kind: 'texts', say: x.s + ' 问：' + x.q, options: order.map(k => x.opts[k]), answer: order.indexOf(x.a),
        rev: { zh: x.s + ' — ' + x.q, py: x.py + ' — ' + x.qpy, vi: x.vi } });
    });
    // Đọc phần 2: 5 câu ↔ 6 tranh (tranh thứ 6 lấy từ 1 câu không hỏi).
    const rs = sens.slice(5, 11);
    const rsPics = sh(rs.map(s => s.pic));
    rs.slice(0, 5).forEach(s => qs.push({ sec: 'R', part: 2, kind: 'pics', text: s.s, textPy: s.py, options: rsPics, answer: rsPics.indexOf(s.pic), rev: { zh: s.s, py: s.py, vi: s.vi } }));
    // Đọc phần 3: 5 câu hỏi ↔ 6 câu trả lời.
    const qa = sh(E.qa).slice(0, 6);
    const qaOpts = sh(qa.map(x => [x.a, x.apy]));
    qa.slice(0, 5).forEach(x => qs.push({ sec: 'R', part: 3, kind: 'texts', text: x.q, textPy: x.qpy, options: qaOpts, answer: qaOpts.findIndex(o => o[0] === x.a),
      rev: { zh: x.q + ' — ' + x.a, py: x.qpy + ' — ' + x.apy, vi: x.vi } }));
    // Đọc phần 4: 5 câu khuyết ↔ 6 từ (đáp án khác nhau, không có từ nào điền được vào câu khác — "avoid").
    let fill = null;
    for (let tries = 0; tries < 200 && !fill; tries++) {
      const pickSet = [], seen = new Set();
      sh(E.fill).forEach(x => { if (pickSet.length < 6 && !seen.has(x.a)) { seen.add(x.a); pickSet.push(x); } });
      const words = pickSet.map(x => x.a);
      if (pickSet.slice(0, 5).every(x => !(x.avoid || []).some(w => words.indexOf(w) !== -1))) fill = pickSet;
    }
    const fillOpts = sh(fill.map(x => [x.a, x.apy]));
    fill.slice(0, 5).forEach(x => qs.push({ sec: 'R', part: 4, kind: 'texts', text: x.s, textPy: x.py, blank: true, options: fillOpts, answer: fillOpts.findIndex(o => o[0] === x.a),
      rev: { zh: x.s.replace('___', '（' + x.a + '）'), py: x.py.replace('___', x.apy), vi: x.vi } }));
    // Đúng thứ tự đề thật: hết 4 phần Nghe rồi mới tới 4 phần Đọc (sort ổn định, giữ thứ tự trong phần).
    return qs.sort((a, b) => (a.sec === b.sec ? 0 : a.sec === 'L' ? -1 : 1) || a.part - b.part);
  }

  function openExam() {
    if (!HAS_EXAM) return;
    stopExam();
    renderExamIntro();
    A.showScreen('zh-exam');
  }
  // Thẻ mời thi thử (tab Luyện tập + trang Học sau khi xong HSK 1).
  function examCard() {
    const z = Z();
    const b = el('button', 'zh-exam-card');
    b.appendChild(el('span', 'zh-exam-card-icon', '📝'));
    const t = el('span', 'zh-exam-card-text');
    t.appendChild(el('strong', null, 'Thi thử HSK 1'));
    t.appendChild(el('small', null, z.examBest ? 'Điểm cao nhất ' + z.examBest + '/200' + (z.examBest >= EXAM_PASS ? ' · Đã đạt ✅' : ' · Đạt từ ' + EXAM_PASS) : '40 câu · ' + EXAM_MINUTES + ' phút · 200 điểm như đề thật'));
    b.append(t, el('span', 'settings-chevron', '›'));
    b.addEventListener('click', openExam);
    return b;
  }
  function stopExam() { if (EX && EX.timer) clearInterval(EX.timer); EX = null; }
  const fmtTime = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

  function renderExamIntro() {
    $('zhExamFill').style.width = '0%';
    const z = Z(), box = $('zhExam');
    box.innerHTML = '';
    const hero = el('div', 'zh-hero');
    hero.appendChild(el('h1', null, '📝 Thi thử HSK 1'));
    hero.appendChild(el('p', null, 'Mô phỏng đề HSK 1 thật: 40 câu · ' + EXAM_MINUTES + ' phút · 200 điểm, đạt từ ' + EXAM_PASS + ' điểm. Mỗi lần thi là 1 đề được trộn mới.'));
    box.appendChild(hero);
    const hist = z.exams || [];
    if (hist.length) {
      const stats = el('div', 'zh-stats');
      const last = hist[hist.length - 1];
      [['🏆', (z.examBest || 0) + '/200', 'điểm cao nhất'], ['🕘', last.t + '/200', 'lần gần nhất'], ['📝', hist.length, 'lần đã thi']].forEach(x => {
        const c = el('div', 'zh-stat'); c.append(el('strong', null, x[0] + ' ' + x[1]), el('small', null, x[2])); stats.appendChild(c);
      });
      box.appendChild(stats);
    }
    const st = el('div', 'zh-gram-card is-open zh-exam-structure');
    st.appendChild(el('div', 'zh-exam-structure-title', 'Cấu trúc đề'));
    [['🎧 Nghe — 20 câu (100 điểm)', ['L1', 'L2', 'L3', 'L4']], ['📖 Đọc — 20 câu (100 điểm)', ['R1', 'R2', 'R3', 'R4']]].forEach(g => {
      st.appendChild(el('strong', 'zh-exam-sec', g[0]));
      const ol = el('ol');
      g[1].forEach(k => ol.appendChild(el('li', null, EXAM_PARTS[k] + ' (5 câu)')));
      st.appendChild(ol);
    });
    st.appendChild(el('p', 'zh-exam-note', '🔊 Bật âm thanh trước khi làm. Mỗi đoạn nghe phát tự động và được nghe tối đa ' + EXAM_PLAYS + ' lần như đề thật. Phần Đọc có kèm pinyin như đề HSK 1. Chọn đáp án rồi bấm "Câu tiếp" — không quay lại câu trước được.'));
    box.appendChild(st);
    const go = el('button', 'cta-btn zh-wide-btn', '▶ Bắt đầu làm bài');
    go.addEventListener('click', startExam);
    box.appendChild(go);
  }

  function startExam() {
    stopExam();
    EX = { qs: buildExam(), i: 0, answers: [], sel: null, plays: 0, start: Date.now(), deadline: Date.now() + EXAM_MINUTES * 60000, done: false };
    EX.timer = setInterval(tickExam, 1000);
    renderExamQ();
  }
  function tickExam() {
    if (!EX || EX.done) return;
    // Người học bấm sang tab khác giữa chừng → huỷ bài (không để đồng hồ chạy ngầm rồi tự nhảy màn).
    if (!$('screen-zh-exam').classList.contains('active')) { stopExam(); return; }
    const left = Math.max(0, Math.round((EX.deadline - Date.now()) / 1000));
    const t = $('zhExamTimer');
    if (t) { t.textContent = '⏱ ' + fmtTime(left); t.classList.toggle('is-low', left <= 300); }
    if (left <= 0) { A.showToast('Hết giờ — bài thi được nộp tự động.', '⏰'); finishExam(); }
  }
  function playExam(q, btn) {
    if (EX.plays >= EXAM_PLAYS) return;
    EX.plays++;
    A.speak(q.say);
    const left = EXAM_PLAYS - EX.plays;
    if (btn) { btn.textContent = left ? '🔊 Nghe lại (còn ' + left + ' lần)' : '🔇 Đã hết lượt nghe'; btn.disabled = !left; }
  }

  function renderExamQ() {
    const q = EX.qs[EX.i], box = $('zhExam');
    EX.sel = null; EX.plays = 0;
    $('zhExamFill').style.width = (EX.i / EX.qs.length * 100) + '%';
    box.innerHTML = '';
    const head = el('div', 'zh-exam-head');
    head.appendChild(el('span', 'zh-exam-where', (q.sec === 'L' ? '🎧 Nghe' : '📖 Đọc') + ' · Phần ' + q.part + ' · Câu ' + (EX.i + 1) + '/' + EX.qs.length));
    const timer = el('span', 'zh-exam-timer', '⏱ ' + fmtTime(Math.max(0, Math.round((EX.deadline - Date.now()) / 1000))));
    timer.id = 'zhExamTimer';
    head.appendChild(timer);
    box.appendChild(head);
    box.appendChild(el('p', 'zh-exam-task', EXAM_PARTS[q.sec + q.part]));

    if (q.say) {
      const sb = el('button', 'speak-btn zh-exam-play', '🔊 Nghe');
      sb.addEventListener('click', () => playExam(q, sb));
      box.appendChild(sb);
      setTimeout(() => { if (EX && EX.qs[EX.i] === q) playExam(q, sb); }, 350);
    }
    if (q.kind === 'judge') box.appendChild(el('div', 'zh-exam-bigpic', q.pic));
    if (q.text) {
      const t = el('div', 'zh-exam-text' + (q.kind === 'judge' ? ' zh-exam-text--word' : ''));
      t.appendChild(el('div', 'zh-exam-zh', q.text.replace('___', '（　　）')));
      const p = el('div', 'zh-exam-py'); p.innerHTML = colorPinyin(q.textPy.replace('___', '(　　)')); t.appendChild(p);
      box.appendChild(t);
    }

    const opts = el('div', 'zh-exam-opts zh-exam-opts--' + q.kind + (q.options.length > 3 ? ' is-six' : ''));
    q.options.forEach((o, k) => {
      const b = el('button', 'zh-exam-opt');
      if (q.kind === 'judge') { b.classList.add(k ? 'is-no' : 'is-yes'); b.textContent = k ? '✗ Sai' : '✓ Đúng'; }
      else {
        b.appendChild(el('span', 'zh-exam-letter', LETTERS[k]));
        if (q.kind === 'pics') b.appendChild(el('span', 'zh-exam-optpic', o));
        else {
          const tx = el('span', 'zh-exam-opttext');
          tx.appendChild(el('strong', null, o[0]));
          const p = el('small'); p.innerHTML = colorPinyin(o[1]); tx.appendChild(p);
          b.appendChild(tx);
        }
      }
      b.addEventListener('click', () => {
        EX.sel = k;
        opts.querySelectorAll('.is-selected').forEach(x => x.classList.remove('is-selected'));
        b.classList.add('is-selected');
        next.disabled = false;
      });
      opts.appendChild(b);
    });
    box.appendChild(opts);

    const last = EX.i === EX.qs.length - 1;
    const next = el('button', 'cta-btn zh-wide-btn zh-exam-next', last ? '✅ Nộp bài' : 'Câu tiếp →');
    next.disabled = true;
    next.addEventListener('click', () => {
      if (EX.sel === null) return;
      EX.answers[EX.i] = EX.sel;
      if (last) finishExam(); else { EX.i++; renderExamQ(); }
    });
    box.appendChild(next);
  }

  function examOptLabel(q, k) {
    if (k === undefined || k === null) return '(bỏ trống)';
    if (q.kind === 'judge') return k ? '✗ Sai' : '✓ Đúng';
    const o = q.options[k];
    return LETTERS[k] + '. ' + (q.kind === 'pics' ? o : o[0]);
  }

  function finishExam() {
    if (!EX || EX.done) return;
    EX.done = true;
    clearInterval(EX.timer);
    const qs = EX.qs;
    const ok = qs.map((q, k) => EX.answers[k] === q.answer);
    const pts = sec => qs.reduce((n, q, k) => n + (q.sec === sec && ok[k] ? 5 : 0), 0);
    const l = pts('L'), r = pts('R'), t = l + r;
    const used = Math.min(EXAM_MINUTES * 60, Math.round((Date.now() - EX.start) / 1000));
    // Lưu kết quả (đồng bộ cùng tiến độ tiếng Trung) + sao động viên: 1 sao / 40 điểm.
    const z = Z();
    const firstPass = t >= EXAM_PASS && !(z.examBest >= EXAM_PASS);
    z.exams = (z.exams || []).concat([{ d: todayStr(), t, l, r, s: used }]).slice(-20);
    z.examBest = Math.max(z.examBest || 0, t);
    z.today.n += 1;
    const oldLifetime = A.getProgress().lifetimeStars;
    const stars = Math.floor(t / 40);
    if (stars) A.addStars(stars);
    A.updateStreakOnComplete(); // tự lưu tiến độ
    A.renderTotalStars();
    A.celebrate(t === 200 || firstPass, oldLifetime, null, t < EXAM_PASS);
    renderExamResult({ l, r, t, used, ok, stars });
  }

  function renderExamResult(res) {
    $('zhExamFill').style.width = '100%';
    const box = $('zhExam'), pass = res.t >= EXAM_PASS;
    box.innerHTML = '';
    const card = el('div', 'zh-exam-score' + (pass ? ' is-pass' : ''));
    card.appendChild(el('div', 'zh-exam-score-emoji', pass ? '🎉' : '💪'));
    card.appendChild(el('div', 'zh-exam-score-num', res.t + '/200'));
    card.appendChild(el('div', 'zh-exam-score-verdict', pass ? 'ĐẠT — chúc mừng bạn!' : 'Chưa đạt — cần thêm ' + (EXAM_PASS - res.t) + ' điểm'));
    card.appendChild(el('small', null, 'Thời gian làm bài ' + fmtTime(res.used) + (res.stars ? ' · +' + res.stars + ' ⭐' : '')));
    box.appendChild(card);

    const stats = el('div', 'zh-stats');
    [['🎧', res.l + '/100', 'Nghe'], ['📖', res.r + '/100', 'Đọc']].forEach(x => {
      const c = el('div', 'zh-stat'); c.append(el('strong', null, x[0] + ' ' + x[1]), el('small', null, x[2])); stats.appendChild(c);
    });
    box.appendChild(stats);

    // Điểm từng phần + gợi ý phần cần luyện.
    const parts = el('div', 'zh-gram-card is-open zh-exam-parts');
    let weakest = null;
    ['L', 'R'].forEach(sec => [1, 2, 3, 4].forEach(p => {
      const idx = EX.qs.map((q, k) => k).filter(k => EX.qs[k].sec === sec && EX.qs[k].part === p);
      const c = idx.filter(k => res.ok[k]).length;
      if (!weakest || c < weakest.c) weakest = { c, key: sec + p, sec, p };
      const row = el('div', 'zh-exam-part-row');
      row.append(el('span', null, (sec === 'L' ? '🎧 Nghe' : '📖 Đọc') + ' phần ' + p), el('span', 'zh-exam-dots', '●'.repeat(c) + '○'.repeat(idx.length - c)), el('strong', null, c + '/' + idx.length));
      parts.appendChild(row);
    }));
    box.appendChild(parts);
    if (weakest && weakest.c < 5) {
      const tip = { L1: 'luyện "Nghe chọn chữ" và "Luyện thanh điệu"', L2: 'nghe lại câu ví dụ trong Thẻ học', L3: 'luyện nghe hội thoại (đọc to các câu hỏi – đáp)', L4: 'luyện "Nghe số", "Nghe giờ", "Nghe giá tiền"',
        R1: 'luyện "Nhận mặt chữ"', R2: 'đọc lại câu ví dụ ở Thư viện › Từ vựng', R3: 'ôn bài "Câu hỏi 吗 và từ để hỏi" ở Thư viện › Ngữ pháp', R4: 'luyện "Sắp xếp câu" và ôn ngữ pháp' }[weakest.key];
      box.appendChild(el('p', 'zh-exam-note', '💡 Phần cần luyện thêm: ' + (weakest.sec === 'L' ? 'Nghe' : 'Đọc') + ' phần ' + weakest.p + ' — gợi ý: ' + tip + ' ở tab Luyện tập.'));
    }

    const wrong = EX.qs.map((q, k) => k).filter(k => !res.ok[k]);
    const again = el('button', 'cta-btn zh-wide-btn', '🔁 Làm đề khác');
    again.addEventListener('click', startExam);
    const back = el('button', 'ghost-btn ghost-btn--solid zh-wide-btn', '← Về Luyện tập');
    back.addEventListener('click', () => { stopExam(); openPractice(); });
    box.append(again, back);
    if (wrong.length) {
      box.appendChild(el('div', 'section-label', '📋 Xem lại ' + wrong.length + ' câu sai'));
      const list = el('div', 'zh-exam-review');
      wrong.forEach(k => {
        const q = EX.qs[k];
        const it = el('button', 'zh-exam-rev');
        it.appendChild(el('small', 'zh-exam-rev-where', 'Câu ' + (k + 1) + ' · ' + (q.sec === 'L' ? 'Nghe' : 'Đọc') + ' phần ' + q.part + (q.kind === 'judge' || q.kind === 'pics' ? ' · ' + (q.kind === 'judge' ? q.pic : q.options[q.answer]) : '')));
        it.appendChild(el('strong', 'zh-exam-rev-zh', q.rev.zh));
        const p = el('span', 'zh-exam-py'); p.innerHTML = colorPinyin(q.rev.py); it.appendChild(p);
        it.appendChild(el('span', 'zh-word-vi', q.rev.vi));
        it.appendChild(el('span', 'zh-exam-rev-ans', 'Bạn chọn: ' + examOptLabel(q, EX.answers[k]) + ' · Đáp án: ' + examOptLabel(q, q.answer)));
        it.addEventListener('click', () => A.speak(q.say || q.text.replace('___', q.kind === 'texts' && q.blank ? q.options[q.answer][0] : '')));
        list.appendChild(it);
      });
      box.appendChild(list);
    }
  }

  // ---------- Tab THÀNH TÍCH › Tiến độ (app.js gọi renderProgress thay cho 12 chủ đề của bé) ----------
  const unitsDone = () => ALL_UNITS.filter(unitDone).length;
  function stat() { return { icon: '🗺️', value: unitsDone() + '/' + ALL_UNITS.length, label: 'Chặng đã xong' }; }
  function renderProgress(d) {
    d.tile2.textContent = unitsDone() + '/' + ALL_UNITS.length;
    d.tile2Label.textContent = '🗺️ Chặng đã xong';
    d.tile3.textContent = learnedWords().length;
    d.tile3Label.textContent = '🔤 Từ đã học';
    d.listLabel.textContent = 'Chi tiết khoá học';
    // Khối thống kê: 7 ngày qua (bài / độ chính xác) + mức nhớ từ vựng. Dựng lại mỗi lần mở.
    let st = document.getElementById('zhAdultStats');
    if (!st) { st = el('div', 'zh-adult-stats'); st.id = 'zhAdultStats'; d.listLabel.parentNode.insertBefore(st, d.listLabel); }
    st.innerHTML = '';
    const log = Z().log, days = [-6, -5, -4, -3, -2, -1, 0].map(i => addDays(i));
    days[6] = todayStr();
    const rows = days.map(k => log[k] || { n: 0, q: 0, c: 0 });
    const sum = rows.reduce((a, r) => ({ n: a.n + r.n, q: a.q + r.q, c: a.c + r.c }), { n: 0, q: 0, c: 0 });
    const week = el('div', 'zh-panel');
    week.appendChild(el('div', 'zh-panel-title', '7 ngày qua'));
    const kpis = el('div', 'zh-kpis');
    [[sum.n, 'bài đã học'], [rows.filter(r => r.q || r.n).length + '/7', 'ngày có học'], [sum.q ? Math.round(sum.c / sum.q * 100) + '%' : '—', 'trả lời đúng']].forEach(k => {
      const c = el('div', 'zh-kpi'); c.append(el('strong', null, String(k[0])), el('small', null, k[1])); kpis.appendChild(c);
    });
    week.append(kpis, sum.n || sum.q ? barChart(rows.map(r => r.n), [-6, -5, -4, -3, -2, -1, 0].map(dayLabel), 'past')
      : el('p', 'zh-panel-note', 'Chưa có số liệu tuần này — biểu đồ số bài mỗi ngày sẽ hiện từ bài học tiếp theo.'));
    st.append(week, levelPanel());
    d.list.innerHTML = ZH_COURSE.map(part => {
      const skipped = !!Z().skip[part.id];
      return '<div class="progress-subhead">' + esc(part.title) + (skipped ? ' — đã kiểm tra nhảy cóc ✅' : '') + '</div>' +
        part.units.map(u => {
          const ls = unitLessons(u), dn = ls.filter(lessonDone).length;
          return d.rowHtml(u.emoji, 'Chặng ' + (ALL_UNITS.indexOf(u) + 1) + ': ' + esc(u.title), unitDone(u), '✓ Xong', dn ? dn + '/' + ls.length + ' bài' : 'Chưa học');
        }).join('');
    }).join('');
  }

  window.ZH_COURSE_UI = { goHome, renderProgress, stat };
  // app.js có thể đã dựng trang chủ tiếng Anh trước khi file này nạp xong → chuyển sang hành trình ngay.
  if ($('screen-home').classList.contains('active')) goHome();
})();
