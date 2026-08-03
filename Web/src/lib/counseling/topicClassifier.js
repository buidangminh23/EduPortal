/**
 * Works out what a student is actually asking about.
 *
 * The previous version was a chain of `text.includes('áp lực')` checks against
 * raw input, which meant "ap luc qua" — how a phone keyboard in a hurry
 * actually produces it — fell through every branch into a generic reply. Here
 * the text is normalised (diacritics stripped, chat slang expanded) first, and
 * topics are *scored* rather than matched in a fixed order, so a message that
 * mentions two things gets ranked instead of arbitrarily hitting whichever
 * `if` came first.
 */

import { normalizeVietnameseText } from '../tutor/normalize';

export const TOPICS = {
  EXAM_ANXIETY: 'EXAM_ANXIETY',
  BURNOUT: 'BURNOUT',
  LOW_MOOD: 'LOW_MOOD',
  MOTIVATION: 'MOTIVATION',
  FOCUS: 'FOCUS',
  CAREER: 'CAREER',
  STUDY_PLAN: 'STUDY_PLAN',
  TIME_MANAGEMENT: 'TIME_MANAGEMENT',
  RELATIONSHIP: 'RELATIONSHIP',
  FAMILY: 'FAMILY',
  SELF_ESTEEM: 'SELF_ESTEEM',
  HEALTH: 'HEALTH',
  GREETING: 'GREETING',
  THANKS: 'THANKS',
  GENERAL: 'GENERAL'
};

/**
 * Weighted cues per topic.
 *
 * Weight 3 = the phrase alone identifies the topic; 2 = strong; 1 = supporting
 * evidence that only decides things when several land together.
 */
const TOPIC_CUES = {
  [TOPICS.EXAM_ANXIETY]: [
    ['ap luc thi', 3], ['ap luc hoc', 3], ['ap luc', 2], ['lo lang', 2], ['lo au', 2],
    ['lo thi', 3], ['lo cho ky thi', 3], ['lo qua', 2], ['lo lam', 2], ['hoi hop', 2],
    ['so thi', 3], ['so truot', 3], ['so kiem tra', 3], ['cang thang', 2], ['panic', 3],
    ['hoang loan', 3], ['tim dap nhanh', 2], ['so diem thap', 2], ['so lam bai khong tot', 2],
    ['sap thi', 1], ['thi thu', 1], ['ky thi', 1], ['am anh', 2]
  ],
  [TOPICS.BURNOUT]: [
    ['kiet suc', 3], ['burnout', 3], ['met moi', 2], ['met qua', 2], ['qua tai', 3],
    ['khong con suc', 3], ['duoi suc', 2], ['hoc mai khong vao', 2], ['dau dau', 1],
    ['mat ngu', 2], ['thieu ngu', 2], ['thuc khuya', 2], ['cay dem', 2]
  ],
  [TOPICS.LOW_MOOD]: [
    ['buon', 2], ['khoc', 2], ['tui than', 3], ['chan nan', 2], ['hut hang', 2],
    ['trong rong', 3], ['nang long', 2], ['tam trang te', 2], ['khong vui', 2]
  ],
  [TOPICS.MOTIVATION]: [
    ['mat dong luc', 3], ['khong co dong luc', 3], ['khong muon hoc', 3], ['luoi', 2],
    ['chan hoc', 3], ['hoc de lam gi', 3], ['vo nghia', 2], ['bo cuoc', 2],
    ['khong biet co gang de lam gi', 3], ['nan', 2]
  ],
  [TOPICS.FOCUS]: [
    ['mat tap trung', 3], ['khong tap trung', 3], ['tri hoan', 3], ['deadline don', 2],
    ['nghien dien thoai', 3], ['luot tiktok', 2], ['xao nhang', 3], ['hoc khong vao dau', 2],
    ['ngoi vao ban la buon ngu', 2], ['dang tri', 2], ['hay quen', 2]
  ],
  [TOPICS.CAREER]: [
    ['huong nghiep', 3], ['chon nganh', 3], ['nganh nao', 3], ['riasec', 3],
    ['nghe nghiep', 3], ['dai hoc nao', 3], ['truong nao', 2], ['khoi thi', 2],
    ['nguyen vong', 2], ['tuong lai', 1], ['dam me', 2], ['hop voi em', 2],
    ['xet tuyen', 2], ['to hop', 1], ['nen thi khoi', 3]
  ],
  [TOPICS.STUDY_PLAN]: [
    ['on thi', 3], ['ke hoach hoc', 3], ['lich hoc', 2], ['hoc the nao', 3],
    ['phuong phap hoc', 3], ['cai thien diem', 3], ['diem thap', 2], ['mon yeu', 3],
    ['hoc kem', 2], ['lam de', 2], ['ghi nho', 2], ['thuoc bai', 2], ['hoc hieu qua', 3]
  ],
  [TOPICS.TIME_MANAGEMENT]: [
    ['khong du thoi gian', 3], ['quan ly thoi gian', 3], ['thoi gian bieu', 3],
    ['khong kip', 2], ['qua nhieu viec', 2], ['can bang', 2], ['sap xep thoi gian', 3]
  ],
  [TOPICS.RELATIONSHIP]: [
    ['ban be', 3], ['ban than', 2], ['gian nhau', 3], ['mau thuan', 2], ['cai nhau', 2],
    ['bi tay chay', 3], ['bat nat', 3], ['co lap', 2], ['thich mot ban', 2],
    ['tinh cam', 2], ['chia tay', 3], ['khong hoa nhap', 3]
  ],
  [TOPICS.FAMILY]: [
    ['bo me', 3], ['gia dinh', 3], ['ba me', 3], ['phu huynh', 3], ['ky vong', 2],
    ['so sanh voi con nha nguoi ta', 3], ['bat ep', 3], ['khong hieu em', 2],
    ['me muon em', 3], ['bo muon em', 3]
  ],
  [TOPICS.SELF_ESTEEM]: [
    ['tu ti', 3], ['kem coi', 3], ['khong bang ban', 3], ['so sanh voi ban', 3],
    ['ai cung gioi hon', 3], ['minh do', 2], ['khong xung dang', 3],
    ['ghen ti', 2], ['xau ho', 2], ['mat tu tin', 3]
  ],
  [TOPICS.HEALTH]: [
    ['an uong', 2], ['dinh duong', 3], ['the duc', 3], ['tap the thao', 3],
    ['suc khoe', 2], ['ngu bao nhieu', 3], ['giac ngu', 2], ['uong nuoc', 2],
    ['ca phe', 2], ['nuoc tang luc', 3]
  ],
  [TOPICS.GREETING]: [
    ['xin chao', 3], ['chao thay', 3], ['hello', 3], ['alo', 2], ['em chao', 3]
  ],
  [TOPICS.THANKS]: [
    ['cam on', 3], ['hieu roi', 2], ['em bit roi', 2], ['tuyet qua', 2],
    ['thanks', 3], ['oke thay', 2], ['da hieu', 2]
  ]
};

/** Minimum score before a topic is trusted over the generic fallback. */
const MIN_TOPIC_SCORE = 2;

export function classifyTopics(text) {
  const normalized = normalizeVietnameseText(text || '');

  if (!normalized) {
    return { primary: TOPICS.GENERAL, ranked: [], confidence: 0, normalized: '', matched: [] };
  }

  const ranked = [];
  const matched = [];

  for (const [topic, cues] of Object.entries(TOPIC_CUES)) {
    let score = 0;
    let longestCue = 0;

    for (const [cue, weight] of cues) {
      if (normalized.includes(cue)) {
        score += weight;
        longestCue = Math.max(longestCue, cue.length);
        matched.push({ topic, cue, weight });
      }
    }

    if (score > 0) ranked.push({ topic, score, longestCue });
  }

  // On a tie the more specific phrase wins: "không bằng bạn" (self-esteem) says
  // more about the student than the "bạn bè" inside it (friendships).
  ranked.sort((a, b) => (b.score - a.score) || (b.longestCue - a.longestCue));

  const best = ranked[0];
  if (!best || best.score < MIN_TOPIC_SCORE) {
    // Short, contentless openers are a greeting; anything else the classifier
    // cannot place stays GENERAL so the reply asks a question instead of
    // guessing.
    const isShortOpener = normalized.split(' ').length <= 3;
    return {
      primary: isShortOpener && best?.topic === TOPICS.GREETING ? TOPICS.GREETING : TOPICS.GENERAL,
      ranked,
      confidence: best ? Math.min(best.score / 6, 0.4) : 0,
      normalized,
      matched
    };
  }

  // A greeting bundled with a real question ("chào thầy, em lo thi quá") should
  // answer the question, not say hello back.
  const substantive = ranked.find(item => item.topic !== TOPICS.GREETING && item.score >= MIN_TOPIC_SCORE);
  const primary = best.topic === TOPICS.GREETING && substantive ? substantive.topic : best.topic;

  return {
    primary,
    ranked,
    confidence: Math.min(best.score / 6, 1),
    normalized,
    matched
  };
}

/** Topics beyond the primary that also cleared the threshold. */
export function secondaryTopics(classification, limit = 2) {
  return classification.ranked
    .filter(item => item.topic !== classification.primary && item.score >= MIN_TOPIC_SCORE)
    .slice(0, limit)
    .map(item => item.topic);
}
