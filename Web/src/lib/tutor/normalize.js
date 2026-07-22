const STOP_WORDS = new Set([
  'cua', 'la', 'va', 'cho', 'mot', 'cac', 'em', 'thay', 'co', 'hoi',
  'cach', 'giai', 'lam', 'duoc', 'khong', 'gi', 'nhu', 'the', 'nao',
  'voi', 'trong', 'tren', 'khi', 'ra', 'vao', 'nhe', 'toi', 'minh',
  'tac', 'pham', 'bai', 'tap', 'cau', 'biet', 'ai', 'de', 'thi', 'chuyen',
  'mang', 've', 'tim', 'hieu', 'viet', 'doan', 'phan', 'tich', 'la', 'cua',
  'oi', 'vay', 'nhe', 'nha', 'a', 'ha'
]);

export function expandAbbreviations(text) {
  if (!text) return '';
  let s = text.toLowerCase();

  // Expand common Vietnamese chat slang and abbreviations
  s = s
    .replace(/\b(ko|k|khg)\b/gi, 'không')
    .replace(/\b(dc|đc)\b/gi, 'được')
    .replace(/\bntn\b/gi, 'như thế nào')
    .replace(/\bnv\b/gi, 'nhân vật')
    .replace(/\btp\b/gi, 'tác phẩm')
    .replace(/\btg\b/gi, 'tác giả')
    .replace(/\bsgk\b/gi, 'sách giáo khoa')
    .replace(/\bvs\b/gi, 'với')
    .replace(/\bbn\b/gi, 'bao nhiêu')
    .replace(/\b(bt|btai)\b/gi, 'bài tập');

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
