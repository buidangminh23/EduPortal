const STOP_WORDS = new Set([
  'cua', 'la', 'va', 'cho', 'mot', 'cac', 'em', 'thay', 'co', 'hoi',
  'cach', 'giai', 'lam', 'duoc', 'khong', 'gi', 'nhu', 'the', 'nao',
  'voi', 'trong', 'tren', 'khi', 'ra', 'vao', 'nhe', 'toi', 'minh',
  'tac', 'pham', 'bai', 'tap', 'cau', 'biet', 'ai', 'de', 'thi', 'chuyen',
  'mang', 've', 'tim', 'hieu', 'viet', 'doan', 'phan', 'tich', 'la', 'cua',
  'oi', 'vay', 'nhe', 'nha', 'a', 'ha'
]);

/**
 * Abbreviations, keyed by the shorthand students actually type.
 *
 * Matching uses Unicode-aware boundaries rather than `\b`. JavaScript's `\b`
 * only knows about ASCII word characters, so an accented letter counts as a
 * boundary: `\bk\b` matched the "k" inside "kết" and rewrote it to "khôngết",
 * which then silently poisoned every keyword lookup built on this function.
 */
const ABBREVIATIONS = [
  [['ko', 'k', 'khg'], 'không'],
  [['dc', 'đc'], 'được'],
  [['ntn'], 'như thế nào'],
  [['nv'], 'nhân vật'],
  [['tp'], 'tác phẩm'],
  [['tg'], 'tác giả'],
  [['sgk'], 'sách giáo khoa'],
  [['vs'], 'với'],
  [['bn'], 'bao nhiêu'],
  [['bt', 'btai'], 'bài tập']
];

export function expandAbbreviations(text) {
  if (!text) return '';
  let s = text.toLowerCase();

  for (const [forms, expansion] of ABBREVIATIONS) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
    s = s.replace(pattern, expansion);
  }

  return s;
}

export function stripConversationalFillers(text) {
  if (!text) return '';
  let s = text;

  // Remove common spoken/typed introductions and polite endings
  const fillers = [
    /cho (em|mình|tớ|tôi) hỏi/gi,
    /thầy ơi|cô ơi|ad ơi|ai ơi/gi,
    /giúp (em|mình|tớ) (với|câu này|bài này)/gi,
    /cho (em|mình|tớ) (xin|biết)/gi,
    /đố (bạn|bạn biết|ai)/gi,
    /bạn có biết/gi,
    /trả lời (hộ|giúp) (em|mình)/gi,
    /thế ạ|vậy ạ|hả bạn|với ạ|nha bạn/gi
  ];

  for (const regex of fillers) {
    s = s.replace(regex, ' ');
  }

  return s.replace(/\s+/g, ' ').trim();
}

export function normalizeVietnameseText(text) {
  if (!text) return '';

  const expanded = expandAbbreviations(text);
  const cleaned = stripConversationalFillers(expanded);

  return cleaned
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    // "\u0111" is its own letter, not "d" plus a mark, so NFD leaves it untouched and
    // it survives the line above. Students typing without diacritics write "d",
    // so without this every keyword containing \u0111 ("\u0111\u1ecbnh", "\u0111au", "\u0111\u1ee7") misses.
    .replace(/\u0111/g, 'd')
    .replace(/[.?/!,:;()"'~`@#$%^&*+=[\]{}|\\<>-]/g, ' ') // punctuation to space
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeText(text) {
  const normalized = normalizeVietnameseText(text);
  if (!normalized) return { unigrams: [], bigrams: [], rawTokens: [] };

  const rawTokens = normalized.split(' ').filter(t => t.length > 0);
  const filteredTokens = rawTokens.filter(t => !STOP_WORDS.has(t));

  const unigrams = filteredTokens;
  const bigrams = [];

  for (let i = 0; i < rawTokens.length - 1; i++) {
    const t1 = rawTokens[i];
    const t2 = rawTokens[i + 1];
    if (!STOP_WORDS.has(t1) || !STOP_WORDS.has(t2)) {
      bigrams.push(`${t1} ${t2}`);
    }
  }

  return { unigrams, bigrams, rawTokens };
}
