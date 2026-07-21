const STOP_WORDS = new Set([
  'của', 'là', 'và', 'cho', 'một', 'các', 'em', 'thầy', 'cô', 'hỏi',
  'cách', 'giải', 'làm', 'được', 'không', 'gì', 'như', 'thế', 'nào',
  'với', 'trong', 'trên', 'khi', 'ra', 'vào', 'nhé', 'cho', 'tôi', 'mình'
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
    const bg = `${rawTokens[i]} ${rawTokens[i + 1]}`;
    // Exclude bigrams made entirely of stopwords
    if (!STOP_WORDS.has(rawTokens[i]) || !STOP_WORDS.has(rawTokens[i + 1])) {
      bigrams.push(bg);
    }
  }

  return { unigrams, bigrams, rawTokens };
}
