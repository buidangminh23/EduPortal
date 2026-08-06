import { tokenizeText } from './normalize';

/**
 * Which lesson a question is asking for.
 *
 * The measure used to be "how much of this trigger did the question cover",
 * and a partial cover was enough. `phuong trinh logarit` is three tokens, so a
 * pupil asking about phương trình bậc hai covered two of them — the scaffolding
 * `phương trình`, not the subject — and scored 0.556 against a 0.35 threshold.
 * They were handed a lesson on logarithms. Nothing in the base knowledge
 * teaches quadratics, so the honest answer was that this app does not know,
 * which it already knows how to say.
 *
 * Weighting by rarity does not rescue that: across the whole store `phuong
 * trinh` appears in exactly one trigger, so it looks distinctive to any corpus
 * statistic. The problem is not how common the words are. It is that a question
 * can carry every word of a trigger's *frame* and none of its *subject*.
 *
 * So a trigger now fires only when the question names everything the trigger
 * names. `logarit` fires for "điều kiện xác định logarit"; `phuong trinh
 * logarit` does not fire for "phương trình bậc hai", because the question never
 * says logarit. Coverage then ranks whatever survives the gate.
 */

/** Unigrams to test containment on, tolerating an all-stop-word phrase. */
function contentTokens(tokens) {
  return tokens.unigrams.length ? tokens.unigrams : tokens.rawTokens;
}

export function matchEntryWithQuery(query, entry) {
  const queryTokens = tokenizeText(query);
  if (!queryTokens.rawTokens.length) return 0;

  const queryUnigrams = new Set(contentTokens(queryTokens));
  const queryBigrams = new Set(queryTokens.bigrams);
  if (!queryUnigrams.size) return 0;

  let best = 0;

  for (const trigger of entry.triggers || []) {
    const triggerTokens = tokenizeText(trigger);
    const triggerUnigrams = contentTokens(triggerTokens);
    if (!triggerUnigrams.length) continue;

    // The gate. Everything this trigger is about has to be in the question.
    if (!triggerUnigrams.every(token => queryUnigrams.has(token))) continue;

    /**
     * How much of the question this trigger accounts for. A trigger naming
     * most of the question describes it better than a one-word trigger buried
     * inside it, so `dieu kien logarit` outranks a bare `logarit` for "điều
     * kiện xác định logarit".
     *
     * Adjacent pairs count too: two triggers can name the same words while
     * only one names them in the order the pupil wrote them.
     */
    const bigramHits = triggerTokens.bigrams.filter(bg => queryBigrams.has(bg)).length;
    const explained = triggerUnigrams.length + bigramHits;
    const askedFor = queryUnigrams.size + queryBigrams.size;
    const coverage = askedFor > 0 ? Math.min(1, explained / askedFor) : 0;

    if (coverage > best) best = coverage;
  }

  return best;
}

/**
 * `threshold` guards against a question so long that a real topical hit
 * accounts for very little of it. It is deliberately low: the containment gate
 * above, not this number, decides whether a lesson is on topic. It used to be
 * 0.35 and was carrying weight it could not bear.
 */
export function retrieveBestEntry(query, entries = [], threshold = 0.2) {
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
