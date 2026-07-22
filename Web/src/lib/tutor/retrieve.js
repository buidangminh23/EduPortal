import { tokenizeText } from './normalize';

export function matchEntryWithQuery(query, entry) {
  const queryTokens = tokenizeText(query);
  if (!queryTokens.rawTokens.length) return 0;

  let maxScore = 0;

  const triggers = entry.triggers || [];
  for (const trigger of triggers) {
    const triggerTokens = tokenizeText(trigger);
    if (!triggerTokens.rawTokens.length) continue;

    let score = 0;

    // 1. Bigram matching (Weight: 3)
    for (const bg of triggerTokens.bigrams) {
      if (queryTokens.bigrams.includes(bg)) {
        score += 3;
      }
    }

    // 2. Unigram matching (Weight: 1)
    for (const ug of triggerTokens.unigrams) {
      if (queryTokens.unigrams.includes(ug)) {
        score += 1;
      }
    }

    // Max theoretical score for this trigger
    const maxTriggerScore = (triggerTokens.bigrams.length * 3) + (triggerTokens.unigrams.length * 1);
    const normalizedScore = maxTriggerScore > 0 ? score / maxTriggerScore : 0;

    if (normalizedScore > maxScore) {
      maxScore = normalizedScore;
    }
  }

  return maxScore;
}

export function retrieveBestEntry(query, entries = [], threshold = 0.35) {
  let bestEntry = null;
  let highestScore = 0;

  for (const entry of entries) {
    const score = matchEntryWithQuery(query, entry);
    if (score > highestScore) {
      highestScore = score;
      bestEntry = entry;
    }
  }

  if (highestScore >= threshold && bestEntry) {
    return { entry: bestEntry, confidence: highestScore };
  }

  return { entry: null, confidence: highestScore };
}
