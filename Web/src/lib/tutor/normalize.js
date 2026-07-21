const STOP_WORDS = new Set([
  'cua', 'la', 'va', 'cho', 'mot', 'cac', 'em', 'thay', 'co', 'hoi',
  'cach', 'giai', 'lam', 'duoc', 'khong', 'gi', 'nhu', 'the', 'nao',
  'voi', 'trong', 'tren', 'khi', 'ra', 'vao', 'nhe', 'toi', 'minh',
  'tac', 'pham', 'bai', 'tap', 'cau', 'biet', 'ai', 'de', 'thi', 'chuyen',
  'mang', 've', 'tim', 'hieu', 'viet', 'doan', 'phan', 'tich', 'la', 'cua'
]);

export function normalizeVietnameseText(text) {
  if (!text) return '';
  return text
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
    // Include bigram only if at least one token is non-stopword
    if (!STOP_WORDS.has(t1) || !STOP_WORDS.has(t2)) {
      bigrams.push(`${t1} ${t2}`);
    }
  }

  return { unigrams, bigrams, rawTokens };
}
