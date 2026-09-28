// Bài kiểm tra trình độ nhỏ: phân bé vào lớp Mầm / Chồi / Lá.
// File này chỉ chứa dữ liệu + hàm sinh câu hỏi (không đụng DOM) để kiểm thử độc lập được.
// Câu hỏi được sinh ngẫu nhiên từ TOPICS mỗi lần làm, nên bé làm lại sẽ không gặp đúng đề cũ.
//
// Cách xếp lớp (2 "cửa", mỗi cửa 5 câu, qua cửa khi đúng >= PLACEMENT_PASS câu):
//   Phần 1 (nhận biết chữ cái + đọc từ đơn giản): chưa qua → lớp Mầm.
//   Phần 2 (đánh vần, đọc từ dài, ngữ pháp + hiểu câu ngắn): chưa qua → lớp Chồi, qua → lớp Lá.
// Bé không qua phần 1 thì dừng luôn, không phải làm phần 2 (bé nhỏ khỏi bị hỏi câu quá khó).

const PLACEMENT_LEVELS = {
  mam: {
    id: 'mam', emoji: '🌱', label: 'Lớp Mầm', ageText: '3–4 tuổi',
    message: 'Bé bắt đầu với chữ cái và từ vựng quen thuộc — chậm mà chắc, học mỗi ngày một chút là tiến bộ ngay!',
  },
  choi: {
    id: 'choi', emoji: '🌿', label: 'Lớp Chồi', ageText: '5–6 tuổi',
    message: 'Bé đã nhận biết được chữ cái và đọc được nhiều từ đơn giản — sẵn sàng học đánh vần và đọc từ dài hơn!',
  },
  la: {
    id: 'la', emoji: '🍃', label: 'Lớp Lá', ageText: '7–8 tuổi',
    message: 'Bé đã đọc và hiểu được câu ngắn rồi — sẵn sàng với câu, hội thoại và truyện dài hơn!',
  },
};
const PLACEMENT_LEVEL_ORDER = ['mam', 'choi', 'la'];
const PLACEMENT_TIER_COUNT = 2;         // số phần (cửa)
const PLACEMENT_QUESTIONS_PER_TIER = 5; // số câu mỗi phần
const PLACEMENT_PASS = 4;               // đúng từ ngần này câu trở lên mới qua phần

// Chủ đề có hình emoji cụ thể, dễ nhận ra (bỏ chủ đề trừu tượng: gia đình, màu, số, chào hỏi...).
const PLACEMENT_CONCRETE_TOPICS = ['animals', 'objects', 'food', 'fruits', 'transport', 'toys', 'body', 'weather'];

// Chữ dễ nhầm mặt chữ với nhau — không đưa 2 chữ cùng nhóm vào 1 câu hỏi để bé không bị "bẫy" oan.
const PLACEMENT_LOOKALIKES = ['BDPQ', 'MNWVU', 'ILJT', 'OQCG', 'EFH', 'AR', 'KX', 'SZ'];

// Điền từ (ngữ pháp cơ bản, đúng tầm bé lớp 2-3). Sai 1 lựa chọn nhiễu nào cũng phải "sai thật".
const PLACEMENT_GRAMMAR = [
  { sentence: 'I ____ a boy.',            answer: 'am',   others: ['is', 'are', 'have'] },
  { sentence: 'She ____ my mom.',         answer: 'is',   others: ['am', 'are', 'have'] },
  { sentence: 'We ____ good friends.',    answer: 'are',  others: ['is', 'am', 'has'] },
  { sentence: 'I ____ a red ball.',       answer: 'have', others: ['has', 'is', 'are'] },
  { sentence: 'He ____ a big dog.',       answer: 'has',  others: ['have', 'am', 'are'] },
  { sentence: 'The cat ____ on the bed.', answer: 'is',   others: ['am', 'are', 'have'] },
];

function _plShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function _plSample(arr, n) { return _plShuffle(arr).slice(0, n); }
function _plLookalikeGroup(ch) { return PLACEMENT_LOOKALIKES.find(g => g.indexOf(ch) !== -1) || ch; }

// n chữ cái khác nhau, không cùng nhóm "dễ nhầm" với nhau hay với chữ đích `target`.
function _plDistinctLetters(target, n) {
  const chosen = [];
  const usedGroups = [_plLookalikeGroup(target)];
  _plShuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).forEach(ch => {
    if (chosen.length >= n) return;
    const g = _plLookalikeGroup(ch);
    if (usedGroups.indexOf(g) !== -1) return;
    usedGroups.push(g);
    chosen.push(ch);
  });
  return chosen;
}

// Các cách xáo chữ khác nhau của từ (không tính đúng nguyên từ).
function _plScrambles(word) {
  const seen = new Set([word]);
  const out = [];
  const letters = word.split('');
  // 60 lần thử ngẫu nhiên là đủ cho từ 3-5 chữ; dừng sớm khi đủ.
  for (let i = 0; i < 60 && out.length < 8; i++) {
    const s = _plShuffle(letters).join('');
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}

function _plTitleCase(sentence, word) {
  // Câu ví dụ trong data viết HOA từ khoá ("The CAT is cute.") — hạ về chữ thường cho tự nhiên.
  let s = sentence.replace(word, word.toLowerCase());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Sinh đề cho 1 phần. tierIndex: 0 hoặc 1. topics: mảng TOPICS của app. Trả về mảng câu hỏi:
// { skill, prompt, visual: {kind: 'emoji'|'word'|'sentence'|'none', value}, speak, optionKind: 'emoji'|'text'|'long',
//   options: [{ label, correct }] }  (options đã xáo, đúng 1 đáp án correct)
function buildPlacementTier(tierIndex, topics, usedWords) {
  usedWords = usedWords || new Set();
  const allWords = [];
  topics.forEach(t => t.words.forEach(w => allWords.push({ w: w, topic: t.id })));
  const concrete = allWords.filter(x => PLACEMENT_CONCRETE_TOPICS.indexOf(x.topic) !== -1);

  // Lấy 1 từ đích thoả điều kiện, chưa dùng trong bài này.
  function pickTarget(filter) {
    const cands = concrete.filter(x => !usedWords.has(x.w.en) && filter(x.w));
    if (!cands.length) return null;
    const t = _plShuffle(cands)[0];
    usedWords.add(t.w.en);
    return t;
  }
  // n từ nhiễu khác chủ đề với đích, khác emoji, chưa dùng làm đích.
  function pickOthers(target, n, filter) {
    const cands = concrete.filter(x => x.topic !== target.topic && x.w.emoji !== target.w.emoji && (!filter || filter(x.w)));
    // tối đa 1 nhiễu mỗi chủ đề để 4 hình trông khác hẳn nhau
    const byTopic = {};
    _plShuffle(cands).forEach(x => { if (!byTopic[x.topic]) byTopic[x.topic] = x; });
    return _plShuffle(Object.values(byTopic)).slice(0, n);
  }
  const opts = (correctLabel, otherLabels) =>
    _plShuffle([{ label: correctLabel, correct: true }].concat(otherLabels.map(l => ({ label: l, correct: false }))));

  const qs = [];

  // --- Kiểu câu hỏi dùng chung ---
  function listenEmoji() {
    const t = pickTarget(() => true); if (!t) return;
    const others = pickOthers(t, 3);
    qs.push({ skill: 'listen', prompt: 'Bé nghe và chọn hình đúng nhé!', visual: { kind: 'none' }, speak: t.w.en,
      optionKind: 'emoji', options: opts(t.w.emoji, others.map(o => o.w.emoji)) });
  }
  function letterListen() {
    const letter = _plShuffle('ABCDEFGHIJKLMNOPRSTUVWXYZ'.split(''))[0];
    qs.push({ skill: 'letter', prompt: 'Bé nghe và chọn đúng chữ cái nhé!', visual: { kind: 'none' }, speak: letter,
      optionKind: 'text', options: opts(letter, _plDistinctLetters(letter, 3)) });
  }
  function emojiWord() { // hình → chọn từ (từ ngắn 3-4 chữ), không đọc to để kiểm tra khả năng đọc
    const t = pickTarget(w => w.en.length >= 3 && w.en.length <= 4); if (!t) return;
    const others = pickOthers(t, 3, w => w.en.length >= 3 && w.en.length <= 5);
    qs.push({ skill: 'readWord', prompt: 'Từ nào đúng với hình này?', visual: { kind: 'emoji', value: t.w.emoji }, speak: null,
      optionKind: 'text', options: opts(t.w.en, others.map(o => o.w.en)) });
  }
  function firstLetter() {
    const t = pickTarget(w => w.en.length >= 3 && w.en.length <= 6); if (!t) return;
    const first = t.w.en.charAt(0);
    qs.push({ skill: 'phonics', prompt: 'Từ này bắt đầu bằng chữ nào?', visual: { kind: 'emoji', value: t.w.emoji }, speak: t.w.en,
      optionKind: 'text', options: opts(first, _plDistinctLetters(first, 3)) });
  }
  function spellPick() {
    const t = pickTarget(w => w.en.length >= 3 && w.en.length <= 5 && _plScrambles(w.en).length >= 3); if (!t) return;
    qs.push({ skill: 'spelling', prompt: 'Chọn cách viết đúng của từ này', visual: { kind: 'emoji', value: t.w.emoji }, speak: t.w.en,
      optionKind: 'text', options: opts(t.w.en, _plScrambles(t.w.en).slice(0, 3)) });
  }
  function longWordEmoji() {
    const t = pickTarget(w => w.en.length >= 6); if (!t) return;
    const others = pickOthers(t, 3);
    qs.push({ skill: 'readLong', prompt: 'Từ này là hình nào?', visual: { kind: 'word', value: t.w.en }, speak: null,
      optionKind: 'emoji', options: opts(t.w.emoji, others.map(o => o.w.emoji)) });
  }
  function grammarFill() {
    const g = _plShuffle(PLACEMENT_GRAMMAR)[0];
    qs.push({ skill: 'grammar', prompt: 'Chọn từ điền vào chỗ trống', visual: { kind: 'sentence', value: g.sentence }, speak: null,
      optionKind: 'text', options: opts(g.answer, g.others) });
  }
  function sentenceMeaning() {
    const withEx = allWords.filter(x => x.w.example && x.w.exampleVi);
    const t = _plShuffle(withEx)[0];
    const seenVi = new Set([t.w.exampleVi]);
    const others = [];
    _plShuffle(withEx).forEach(x => {
      if (others.length >= 3 || x.topic === t.topic || seenVi.has(x.w.exampleVi)) return;
      seenVi.add(x.w.exampleVi); others.push(x.w.exampleVi);
    });
    qs.push({ skill: 'sentence', prompt: 'Câu này nghĩa là gì?', visual: { kind: 'sentence', value: _plTitleCase(t.w.example, t.w.en) }, speak: null,
      optionKind: 'long', options: opts(t.w.exampleVi, others) });
  }

  if (tierIndex === 0) {
    // Khởi động dễ để bé tự tin, rồi chữ cái + đọc từ ngắn.
    [listenEmoji, letterListen, emojiWord, letterListen, emojiWord].forEach(fn => fn());
  } else {
    [firstLetter, spellPick, longWordEmoji, grammarFill, sentenceMeaning].forEach(fn => fn());
  }
  return qs;
}

// scores: [đúng phần 1, đúng phần 2 hoặc null nếu chưa làm phần 2] → id lớp.
function placementLevelFromScores(scores) {
  if (scores[0] < PLACEMENT_PASS) return 'mam';
  if (scores[1] === null || scores[1] === undefined || scores[1] < PLACEMENT_PASS) return 'choi';
  return 'la';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLACEMENT_LEVELS, PLACEMENT_PASS, PLACEMENT_QUESTIONS_PER_TIER, buildPlacementTier, placementLevelFromScores };
}
