// Tạo sẵn file giọng đọc (Gemini TTS — Google AI Studio) cho mọi từ / câu tiếng Anh, hoặc tiếng Trung, trong data/.
// Xem hướng dẫn ở tools/tts/README.md. Chạy từ thư mục gốc của app:
//   node tools/tts/generate.mjs --check     → chỉ đếm, không gọi Gemini (không cần khoá)
//   node tools/tts/generate.mjs --sample    → đọc thử bằng vài giọng (tools/tts/samples/)
//   node tools/tts/generate.mjs             → tạo file còn thiếu (hết lượt miễn phí trong ngày thì tự dừng)
//   node tools/tts/generate.mjs --prune     → như trên + xoá file / thư mục giọng không còn dùng
//   thêm --lang zh vào các lệnh trên        → làm cho tiếng Trung (mặc định: tiếng Anh)
// Khoá API: biến môi trường GEMINI_API_KEY, hoặc file tools/tts/gemini-api-key.txt (đã .gitignore).
//
// File đặt tên theo mã băm của câu (sau khi chuẩn hoá) → chạy lại chỉ tạo câu MỚI hoặc câu ĐÃ SỬA.
// Đổi VOICE / STYLE_VERSION thì file mới nằm ở thư mục khác (assets/tts/en/gemini-<giọng>-<phiên bản>/),
// nên toàn bộ được tạo lại và máy của bé không phát nhầm bản cũ còn trong bộ nhớ đệm.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { Mp3Encoder } from '@breezystack/lamejs';

// ---------- CẤU HÌNH GIỌNG ----------
// Mô hình đọc của Gemini: https://ai.google.dev/gemini-api/docs/speech-generation (tên mô hình có thể
// đổi theo thời gian — sai tên thì công cụ tự liệt kê các mô hình TTS đang có để chọn).
// Hạn mức lượt / ngày tính RIÊNG cho từng mô hình → tiếng Trung dùng mô hình khác tiếng Anh để 2 phần chạy song song.
// Sửa lời dặn (STYLE) thì tăng STYLE_VERSION để tạo lại toàn bộ.
const LANG = (process.argv.includes('--lang') ? process.argv[process.argv.indexOf('--lang') + 1] : 'en') === 'zh' ? 'zh' : 'en';
const PROFILES = {
  en: {
    // v2: chuyển từ gemini-2.5-flash-preview-tts sang gemini-3.1-flash-tts-preview.
    // KHÔNG dùng gemini-3.8-flash-tts: mô hình này đọc to luôn cả lời dặn STYLE.
    MODEL: 'gemini-3.1-flash-tts-preview',
    VOICE: 'Kore', // giọng nữ rõ ràng (ba mẹ đã nghe thử và chọn); nghe thử các giọng khác bằng --sample
    STYLE: 'Read aloud slowly and very clearly, in a cheerful, warm and friendly American English voice for young children',
    STYLE_VERSION: 'v2',
    SAMPLE_TEXT: 'Hello! I love my MOM. The BABY is sleeping.',
  },
  zh: {
    MODEL: 'gemini-2.5-flash-preview-tts',
    VOICE: 'Kore',
    STYLE: 'Read aloud slowly and very clearly in standard Mandarin Chinese (Putonghua), like a patient teacher for adult beginners, with every tone pronounced accurately',
    STYLE_VERSION: 'v1',
    SAMPLE_TEXT: '你好！我叫小明，很高兴认识你。',
  },
};
const { MODEL, VOICE, STYLE, STYLE_VERSION, SAMPLE_TEXT } = PROFILES[LANG];
const LANG_NAME = LANG === 'zh' ? 'tiếng Trung' : 'tiếng Anh';
const CONCURRENCY = 3; // số câu gọi cùng lúc
const SAMPLE_VOICES = ['Leda', 'Kore', 'Aoede', 'Sulafat'];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = path.join(ROOT, 'data');
const DIR_NAME = 'gemini-' + VOICE.toLowerCase() + '-' + STYLE_VERSION;
const EN_DIR = path.join(ROOT, 'assets/tts', LANG); // thư mục của ngôn ngữ đang làm (tên giữ từ bản chỉ có tiếng Anh)
const OUT_DIR = path.join(EN_DIR, DIR_NAME);
const MANIFEST = path.join(DATA, 'tts-' + LANG + '.js');
const MANIFEST_VAR = 'TTS_' + LANG.toUpperCase();
const LIST_FILE = path.join(ROOT, 'tools/tts/clips-' + LANG + '.json');
const KEY_FILE = path.join(ROOT, 'tools/tts/gemini-api-key.txt');
const API = 'https://generativelanguage.googleapis.com/v1beta/';
// File dữ liệu KHÔNG phải nội dung tiếng Anh cần đọc.
const SKIP_DATA = /^(zh_|topics_zh|emoji-icons|sheets-config|audio-map|classes|tts-)/;
// Câu tiếng Anh nằm ở các trường này. Lọc bỏ chuỗi có dấu tiếng Việt (VD trường q của truyện là câu hỏi tiếng Việt).
const EN_KEYS = new Set(['en', 'example', 'q', 'a']);
const VI_CHARS = /[À-ỹđĐ]/;

// ---------- KHOÁ CÂU (phải GIỐNG HỆT ttsClipUrl trong app.js) ----------
function ttsKey(text) { return String(text).trim().replace(/\s+/g, ' ').toLowerCase(); }
function cyrb53(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// ---------- GOM CÂU TIẾNG ANH ----------
// Thứ tự file theo thứ tự <script> trong index.html (Mầm → Chồi → Lá) → khi bị giới hạn lượt mỗi ngày thì
// lớp nhỏ có giọng mới trước.
function collectTexts() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const order = [...html.matchAll(/<script src="data\/([^"]+\.js)"/g)].map(m => m[1]);
  const files = fs.readdirSync(DATA).filter(f => f.endsWith('.js') && !SKIP_DATA.test(f))
    .sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999));
  const ctx = vm.createContext({ window: {}, console });
  const vars = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(DATA, f), 'utf8');
    vm.runInContext(src, ctx, { filename: f });
    for (const m of src.matchAll(/^\s*(?:const|let|var) ([A-Z][A-Z0-9_]*)\s*=/gm)) vars.push([f, m[1]]);
  }
  const texts = new Map(); // khoá → { text, from }
  const add = (text, from) => {
    if (typeof text !== 'string' || !/[a-z]/i.test(text) || VI_CHARS.test(text) || text.includes('___')) return;
    const k = ttsKey(text);
    if (!texts.has(k)) texts.set(k, { text: text.trim(), from });
  };
  for (const [f, name] of vars) {
    let v;
    try { v = vm.runInContext(name, ctx); } catch (e) { continue; }
    if (name === 'PHONICS_UNIT_SAY') { Object.values(v).forEach(s => add(s, f)); continue; }
    if (name === 'SIMON_LA_COMMANDS') v.forEach(c => add('Simon says, ' + c.en, f)); // app.js: speak('Simon says, ' + en)
    const walk = o => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== 'object') return;
      for (const [k, x] of Object.entries(o)) {
        if (typeof x === 'string') { if (EN_KEYS.has(k)) add(x, f); } else walk(x);
      }
    };
    walk(v);
  }
  return texts;
}

// ---------- GOM CÂU TIẾNG TRUNG ----------
// Mọi chuỗi có chữ Hán trong dữ liệu khoá tiếng Trung, kèm pinyin nếu dữ liệu có (để dặn Gemini đọc đúng âm của
// chữ đa âm — VD 行 háng / xíng). Thứ tự file = thứ tự ưu tiên khi bị giới hạn lượt mỗi ngày: bảng pinyin + 4
// thanh điệu (zh_roadmap.js) trước, rồi lộ trình, từ vựng, nghe, đọc, đề thi thử.
const ZH_FILES = ['zh_roadmap.js', 'zh_course.js', 'topics_zh.js', 'zh_hsk1_new.js', 'zh_listening.js', 'zh_reading.js', 'zh_hsk1_exam.js'];
const HAN = /[\u3400-\u9fff]/;
const PY_MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/;
function collectZhTexts() {
  const ctx = vm.createContext({ window: {}, console });
  const texts = new Map();
  const add = (text, py, from) => {
    // Bỏ chuỗi lẫn tiếng Việt / pinyin / chữ số (là ghi chú giải thích, không phải câu app đọc to).
    if (typeof text !== 'string' || !HAN.test(text) || VI_CHARS.test(text) || PY_MARK.test(text) || /[0-9=+]/.test(text)) return;
    if (/[a-z]{2,}/i.test(text.replace(/[A-Z][a-z]+/g, ''))) return; // tên riêng viết hoa (Lan, Anna) thì giữ
    const k = ttsKey(text);
    if (!texts.has(k)) texts.set(k, { text: text.trim(), from, py: py || '' });
    else if (py && !texts.get(k).py) texts.get(k).py = py;
  };
  for (const f of ZH_FILES) {
    if (!fs.existsSync(path.join(DATA, f))) continue;
    const src = fs.readFileSync(path.join(DATA, f), 'utf8');
    vm.runInContext(src, ctx, { filename: f });
    for (const m of src.matchAll(/^\s*(?:const|let|var) ([A-Z][A-Z0-9_]*)\s*=/gm)) {
      let v;
      try { v = vm.runInContext(m[1], ctx); } catch (e) { continue; }
      const walk = o => {
        if (Array.isArray(o)) {
          // Dạng mảng [chữ Hán, pinyin, nghĩa…] (bảng thanh điệu, âm tiết, chữ ví dụ của bộ thủ…).
          if (typeof o[0] === 'string' && HAN.test(o[0]) && typeof o[1] === 'string' && PY_MARK.test(o[1])) add(o[0], o[1], f);
          return o.forEach(walk);
        }
        if (!o || typeof o !== 'object') return add(o, '', f);
        for (const [k, x] of Object.entries(o)) {
          if (typeof x === 'string') add(x, k === 'zh' || k === 'big' || k === 'say' ? o.py : k === 'ex' ? (o.exPy || '') : '', f);
          else walk(x);
        }
      };
      walk(v);
    }
  }
  return texts;
}

// Chữ IN HOA trong data là để nhấn mạnh từ cho bé (VD "I love my MOM.") — hạ về chữ thường để không bị
// đánh vần như chữ viết tắt. 1 chữ cái đứng riêng ("A") thì dặn đọc tên chữ cái.
// variant: cách dặn dự phòng khi mô hình không chịu trả âm thanh (thử lần lượt 0 → 2).
function toPrompt(text, py, variant) {
  // Tiếng Trung: từ ngắn có pinyin thì dặn đọc đúng âm đó (chữ đa âm, từ đơn lẻ dễ bị đọc sai thanh).
  // Chữ đơn lẻ đôi khi bị mô hình hiểu thành câu hỏi cần trả lời bằng chữ → dặn ngắn gọn hơn, cuối cùng chỉ gửi đúng câu.
  if (LANG === 'zh') {
    const hint = py && [...text].length <= 4;
    if (variant === 1) return hint ? 'Read aloud in Mandarin (' + py + '): ' + text : 'Read aloud in Mandarin: ' + text;
    if (variant >= 2) return text;
    return hint ? STYLE + '. Say only this word, pronounced exactly as "' + py + '": ' + text : STYLE + ': ' + text;
  }
  if (/^[a-z]$/i.test(text)) return STYLE + '. Say only the name of this English letter, nothing else: ' + text.toUpperCase();
  return STYLE + ': ' + text.replace(/\b[A-Z]{2,}\b/g, w => w.toLowerCase());
}

function readKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  try { return fs.readFileSync(KEY_FILE, 'utf8').trim(); } catch (e) { return ''; }
}

class StopError extends Error {}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function listTtsModels(key) {
  try {
    const res = await fetch(API + 'models?pageSize=200', { headers: { 'x-goog-api-key': key } });
    const j = await res.json();
    return (j.models || []).map(m => m.name.replace('models/', '')).filter(n => /tts/i.test(n));
  } catch (e) { return []; }
}

// Gọi Gemini → PCM 16-bit mono. Bị giới hạn lượt theo PHÚT thì chờ đúng thời gian Gemini báo rồi thử lại;
// hết lượt theo NGÀY thì dừng hẳn (StopError) — hôm sau chạy lại lệnh sẽ làm tiếp.
async function synthesize(key, text, voice, py) {
  let variant = 0;
  const makeBody = () => ({
    contents: [{ parts: [{ text: toPrompt(text, py, variant) }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });
  let body = makeBody();
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(API + 'models/' + MODEL + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body),
    });
    const raw = await res.text();
    let j = null;
    try { j = JSON.parse(raw); } catch (e) {}
    if (res.ok) {
      const part = (j.candidates?.[0]?.content?.parts || []).find(p => p.inlineData && p.inlineData.data);
      if (!part) {
        if (LANG === 'zh' && variant < 2) { variant++; body = makeBody(); continue; }
        if (attempt < 3) continue;
        throw new Error('Gemini không trả về âm thanh (' + (j.candidates?.[0]?.finishReason || 'không rõ') + ')');
      }
      let rate = Number((/rate=(\d+)/.exec(part.inlineData.mimeType || '') || [])[1]) || 24000;
      let buf = Buffer.from(part.inlineData.data, 'base64');
      // Có mô hình trả WAV (có phần đầu RIFF) thay vì PCM thô → lấy tần số mẫu và phần dữ liệu "data".
      if (buf.toString('ascii', 0, 4) === 'RIFF') {
        rate = buf.readUInt32LE(24);
        for (let off = 12; off + 8 <= buf.length; off += 8 + buf.readUInt32LE(off + 4)) {
          if (buf.toString('ascii', off, off + 4) === 'data') { buf = buf.subarray(off + 8, off + 8 + buf.readUInt32LE(off + 4)); break; }
        }
      }
      buf = Buffer.from(buf.subarray(0, buf.length & ~1)); // chép ra vùng nhớ mới, chẵn byte → Int16Array
      return { pcm: new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1), rate };
    }
    const details = (j && j.error && j.error.details) || [];
    if (res.status === 429) {
      const quotaIds = details.flatMap(d => (d.violations || []).map(v => v.quotaId || '')).join(' ');
      if (/PerDay/i.test(quotaIds)) throw new StopError('Đã hết lượt của hôm nay (' + quotaIds + ').');
      const delay = details.map(d => d.retryDelay).find(Boolean);
      const wait = delay ? Math.ceil(parseFloat(delay) * 1000) + 500 : Math.min(60000, 5000 * attempt);
      if (attempt <= 8) { console.log('  … chờ ' + Math.round(wait / 1000) + ' giây (giới hạn lượt mỗi phút)'); await sleep(wait); continue; }
      throw new StopError('Gemini liên tục báo hết lượt — thử lại sau.');
    }
    if (res.status >= 500 && attempt < 5) { await sleep(3000 * attempt); continue; }
    if (res.status === 404) {
      const models = await listTtsModels(key);
      throw new StopError('Không tìm thấy mô hình "' + MODEL + '". Các mô hình đọc (TTS) đang có: ' +
        (models.join(', ') || '(không lấy được danh sách)') + ' → sửa MODEL ở đầu generate.mjs.');
    }
    // Mô hình "định viết chữ" thay vì đọc (hay gặp với chữ đơn lẻ): đổi cách dặn rồi thử lại; vẫn không được thì
    // chỉ bỏ qua câu này (lỗi thường), không dừng cả lượt như khi khoá bị từ chối.
    if (res.status === 400 && /only be used for TTS|generate text/i.test((j && j.error && j.error.message) || raw)) {
      if (variant < 2) { variant++; body = makeBody(); continue; }
      throw new Error('Gemini không chịu đọc câu này (đã thử ' + (variant + 1) + ' cách dặn)');
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new StopError('Khoá API bị từ chối (' + res.status + '): ' + ((j && j.error && j.error.message) || raw.slice(0, 300)));
    }
    throw new Error('Gemini trả lỗi ' + res.status + ': ' + raw.slice(0, 300));
  }
}

// Cắt khoảng lặng thừa ở đầu / cuối (giữ lại ~80ms) rồi nén sang mp3 48kbps (~6KB / giây).
function toMp3({ pcm, rate }) {
  const thr = 400, pad = Math.round(rate * 0.08);
  let a = 0, b = pcm.length - 1;
  while (a < b && Math.abs(pcm[a]) < thr) a++;
  while (b > a && Math.abs(pcm[b]) < thr) b--;
  const s = pcm.subarray(Math.max(0, a - pad), Math.min(pcm.length, b + pad));
  const enc = new Mp3Encoder(1, rate, 48);
  const out = [];
  for (let i = 0; i < s.length; i += 1152) {
    const chunk = enc.encodeBuffer(s.subarray(i, i + 1152));
    if (chunk.length) out.push(Buffer.from(chunk));
  }
  out.push(Buffer.from(enc.flush()));
  return Buffer.concat(out);
}

function writeManifest(items, have) {
  const ready = items.filter(it => have.has(it.hash));
  const out = '// TỰ SINH bởi tools/tts/generate.mjs — KHÔNG sửa tay. Danh sách câu ' + LANG_NAME + ' đã có file giọng đọc\n' +
    '// (assets/tts/' + LANG + '/<dir>/<mã>.mp3); câu nào không có ở đây thì app dùng giọng đọc của máy.\n' +
    'const ' + MANIFEST_VAR + ' = { dir: ' + JSON.stringify(DIR_NAME) + ', voice: ' + JSON.stringify('Gemini ' + VOICE) + ',\n' +
    '  clips: ' + JSON.stringify(ready.map(it => it.hash).sort().join(' ')) + ' };\n';
  fs.writeFileSync(MANIFEST, out);
  fs.writeFileSync(LIST_FILE, JSON.stringify(Object.fromEntries(ready.map(it => [it.hash, it.text])), null, 1) + '\n');
  return ready.length;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const texts = LANG === 'zh' ? collectZhTexts() : collectTexts();
  const items = [...texts].map(([k, v]) => ({ hash: cyrb53(k), ...v }));
  const have = new Set(fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)) : []);
  const missing = items.filter(it => !have.has(it.hash));

  console.log('Mô hình: ' + MODEL + ' · giọng ' + VOICE + ' · thư mục assets/tts/' + LANG + '/' + DIR_NAME);
  console.log('Tổng số câu ' + LANG_NAME + ': ' + items.length + ' · đã có file: ' + (items.length - missing.length) + ' · còn thiếu: ' + missing.length);

  if (args.has('--check')) {
    const byFile = {};
    missing.forEach(it => { byFile[it.from] = (byFile[it.from] || 0) + 1; });
    Object.entries(byFile).forEach(([f, n]) => console.log('  ' + f + ': thiếu ' + n));
    return;
  }

  const key = readKey();
  if (!key) {
    console.error('\nChưa có khoá API. Lưu khoá vào tools/tts/gemini-api-key.txt (xem tools/tts/README.md).');
    process.exit(1);
  }

  if (args.has('--sample')) {
    const dir = path.join(ROOT, 'tools/tts/samples');
    fs.mkdirSync(dir, { recursive: true });
    const jobs = LANG === 'zh'
      ? SAMPLE_VOICES.map(v => [v, SAMPLE_TEXT, 'zh-' + v + '.mp3']).concat([[VOICE, '妈', 'zh-' + VOICE + '-ma1.mp3', 'mā'], [VOICE, '马', 'zh-' + VOICE + '-ma3.mp3', 'mǎ'], [VOICE, '银行', 'zh-' + VOICE + '-yinhang.mp3', 'yínháng']])
      : SAMPLE_VOICES.map(v => [v, SAMPLE_TEXT, v + '.mp3']).concat([[VOICE, 'MOM', VOICE + '-word-MOM.mp3'], [VOICE, 'A', VOICE + '-letter-A.mp3']]);
    try {
      for (const [v, text, file, py] of jobs) {
        fs.writeFileSync(path.join(dir, file), toMp3(await synthesize(key, text, v, py)));
        console.log('  ✓ tools/tts/samples/' + file);
      }
      console.log('Nghe thử rồi đổi VOICE ở đầu generate.mjs nếu muốn giọng khác.');
    } catch (e) { console.error('\n' + e.message); process.exit(1); }
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let done = 0, failed = 0, stop = null;
  const startedAt = Date.now();
  process.on('SIGINT', () => { writeManifest(items, have); console.log('\nĐã dừng, tiến độ đã lưu.'); process.exit(0); });
  // Gọi song song vài câu một lúc (gói trả phí cho nhiều lượt / phút); bị giới hạn thì synthesize tự chờ.
  const queue = missing.slice();
  const worker = async () => {
    while (queue.length && !stop) {
      const it = queue.shift();
      try {
        fs.writeFileSync(path.join(OUT_DIR, it.hash + '.mp3'), toMp3(await synthesize(key, it.text, VOICE, it.py)));
        have.add(it.hash);
        done++;
        if (done % 10 === 0) writeManifest(items, have);
        if (done % 25 === 0 || done === missing.length) {
          console.log('  … đã tạo ' + done + '/' + missing.length + ' (' + Math.round((Date.now() - startedAt) / 60000) + ' phút)');
        }
      } catch (e) {
        if (e instanceof StopError) { stop = stop || e; break; }
        failed++;
        console.warn('  ✗ "' + it.text + '": ' + e.message);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (args.has('--prune') && !stop) {
    let removed = 0;
    const used = new Set(items.map(it => it.hash));
    for (const h of [...have]) if (!used.has(h)) { fs.unlinkSync(path.join(OUT_DIR, h + '.mp3')); have.delete(h); removed++; }
    for (const d of fs.readdirSync(EN_DIR)) if (d !== DIR_NAME) { fs.rmSync(path.join(EN_DIR, d), { recursive: true }); removed++; }
    console.log('Đã xoá ' + removed + ' file / thư mục không còn dùng.');
  }

  const ready = writeManifest(items, have);
  console.log('\nLần này tạo mới ' + done + ' câu' + (failed ? ', lỗi ' + failed : '') + '. Đã có giọng đọc: ' + ready + '/' + items.length + ' câu (data/tts-' + LANG + '.js đã cập nhật).');
  if (stop) {
    console.log(stop.message);
    if (ready < items.length) console.log('→ Chạy lại lệnh này vào ngày mai (hoặc sau ít phút) để làm tiếp — câu đã có file sẽ được bỏ qua.');
    process.exit(stop.message.startsWith('Đã hết lượt') ? 2 : 1); // 2 = chưa xong, mai chạy tiếp (run-daily.cmd)
  }
  if (ready === items.length) console.log('TẤT CẢ ĐÃ XONG: mọi câu ' + LANG_NAME + ' đều có giọng đọc.');
  if (done) console.log('Nhớ tăng CACHE_VERSION trong sw.js rồi commit assets/tts/' + LANG + '/, data/tts-' + LANG + '.js và tools/tts/clips-' + LANG + '.json.');
}

main().catch(e => { console.error(e); process.exit(1); });
