/**
 * Safety triage for anything a student types into the counselling chat.
 *
 * This runs before topic classification and before any canned advice, because
 * the cost of the two failure modes is not symmetric: a false alarm shows a
 * hotline to someone who did not need it, while a miss leaves a student in
 * crisis reading study tips. Everything here is therefore biased towards
 * escalating, and negation only ever suppresses an alert when it is explicit
 * and adjacent to the phrase it negates.
 */

import { normalizeVietnameseText } from '../tutor/normalize';

/** Shown in every escalation. Change here and the whole feature follows. */
export const SUPPORT_CONTACTS = {
  schoolHotline: '1800 599 920',
  childProtectionHotline: '111'
};

export const RISK_LEVELS = {
  CRISIS: 'crisis',
  ELEVATED: 'elevated',
  NONE: 'none'
};

/**
 * Explicit intent to end one's life or to self-harm.
 *
 * Patterns are matched against diacritics-stripped text, so "tự tử", "tu tu"
 * and "TỰ TỬ" all land on the same rule — the previous implementation only
 * matched fully accented input and missed the way students actually type.
 */
const CRISIS_PATTERNS = [
  { id: 'suicide', pattern: /\btu tu\b|\btu sat\b|\bket lieu\b/, label: 'nhắc tới tự tử' },
  { id: 'wish-death', pattern: /muon chet|uoc gi chet|thich chet|chet quach|chet cho xong|chet di cho/, label: 'mong muốn được chết' },
  { id: 'not-live', pattern: /khong muon song|khong con muon song|khong thiet song|chan song|khong muon ton tai/, label: 'không còn muốn sống' },
  { id: 'self-harm', pattern: /tu hai|tu lam dau|cat tay|rach tay|lam dau ban than|danh vao ban than/, label: 'tự làm đau bản thân' },
  { id: 'vanish', pattern: /bien mat khoi the gioi|bien mat mai mai|khong ai can toi nua|ket thuc tat ca|cham dut tat ca/, label: 'muốn biến mất' },
  { id: 'plan', pattern: /viet thu tuyet menh|thu tuyet menh|tam biet moi nguoi mai mai|loi tam biet cuoi cung/, label: 'có dấu hiệu chuẩn bị' }
];

/**
 * Distress that warrants a warm response and an offer of a real appointment,
 * but not a hotline takeover of the conversation.
 */
const ELEVATED_PATTERNS = [
  { id: 'depression', pattern: /tram cam|roi loan lo au|khung hoang tam ly/, label: 'nhắc tới trầm cảm/lo âu' },
  { id: 'hopeless', pattern: /khong con hy vong|be tac|vo vong|tuyet vong|khong loi thoat|khong con y nghia|song vo nghia/, label: 'cảm giác bế tắc' },
  { id: 'worthless', pattern: /vo dung|vo tich su|that bai toan tap|khong lam duoc gi|ke thua|to nhat/, label: 'tự đánh giá thấp bản thân' },
  { id: 'burden', pattern: /ganh nang cho|lam kho moi nguoi|khong co toi thi tot hon|thua thai/, label: 'cảm thấy mình là gánh nặng' },
  { id: 'isolated', pattern: /khong ai hieu|khong ai quan tam|co doc|mot minh mai|khong co ai de noi/, label: 'cảm giác cô độc' },
  { id: 'give-up', pattern: /muon bo hoc|bo cuoc|khong muon di hoc nua|nghi hoc luon/, label: 'muốn bỏ cuộc' },
  { id: 'insomnia', pattern: /mat ngu (nhieu|may|suot|ca)|khong ngu duoc (may|nhieu|suot)|thuc trang dem/, label: 'mất ngủ kéo dài' },
  { id: 'bullying', pattern: /bat nat|bao luc hoc duong|bi danh|bi tay chay|bi che gieu|bi doa/, label: 'bị bắt nạt' },
  { id: 'abuse', pattern: /bi danh o nha|bo me danh|bi bao hanh|bi xam hai/, label: 'dấu hiệu bị bạo hành' }
];

/**
 * Phrases that flip a match into a non-alert.
 *
 * Deliberately narrow. Each one is a full phrase that reverses the meaning on
 * its own — a bare "không" anywhere in the sentence is not enough, since
 * "không ai hiểu nên tôi muốn chết" would be silenced by it.
 */
const NEGATIONS = [
  /khong muon chet/,
  /khong co y dinh tu tu/,
  /khong nghi den (chuyen )?tu tu/,
  /chua bao gio nghi den (chuyen )?tu tu/,
  /khong phai la muon chet/,
  /khong tu hai/,
  /da het (y dinh|suy nghi) (tu tu|muon chet)/,
  /khong con muon chet nua/
];

/** True when the text explicitly cancels a crisis reading. */
function hasExplicitNegation(normalized) {
  return NEGATIONS.some(pattern => pattern.test(normalized));
}

function collectMatches(normalized, patterns) {
  return patterns
    .filter(entry => entry.pattern.test(normalized))
    .map(entry => ({ id: entry.id, label: entry.label }));
}

/**
 * Classify one message.
 *
 * @param {string} text Raw student input.
 * @returns {{level: string, signals: Array<{id: string, label: string}>,
 *   isCrisis: boolean, isElevated: boolean, negated: boolean}}
 */
export function assessRisk(text) {
  const normalized = normalizeVietnameseText(text || '');

  if (!normalized) {
    return { level: RISK_LEVELS.NONE, signals: [], isCrisis: false, isElevated: false, negated: false };
  }

  const crisisSignals = collectMatches(normalized, CRISIS_PATTERNS);
  const elevatedSignals = collectMatches(normalized, ELEVATED_PATTERNS);
  const negated = hasExplicitNegation(normalized);

  if (crisisSignals.length > 0 && !negated) {
    return {
      level: RISK_LEVELS.CRISIS,
      signals: crisisSignals,
      isCrisis: true,
      isElevated: false,
      negated: false
    };
  }

  // A negated crisis phrase still means the student is talking about the topic,
  // so it drops to "elevated" rather than disappearing entirely.
  const shouldEscalateNegated = crisisSignals.length > 0 && negated;

  if (elevatedSignals.length > 0 || shouldEscalateNegated) {
    return {
      level: RISK_LEVELS.ELEVATED,
      signals: elevatedSignals.length > 0 ? elevatedSignals : crisisSignals,
      isCrisis: false,
      isElevated: true,
      negated
    };
  }

  return { level: RISK_LEVELS.NONE, signals: [], isCrisis: false, isElevated: false, negated };
}

/**
 * Look at the last few messages, not just the newest one.
 *
 * Distress is often spread across short lines ("em mệt lắm" / "chả để làm gì
 * nữa"), none of which trips a rule on its own.
 */
export function assessConversationRisk(messages = [], lookback = 6) {
  const recent = messages.slice(-lookback).filter(m => m.sender === 'user');
  const assessments = recent.map(m => assessRisk(m.text));

  if (assessments.some(a => a.isCrisis)) {
    return {
      level: RISK_LEVELS.CRISIS,
      signals: assessments.flatMap(a => a.signals)
    };
  }

  const elevated = assessments.filter(a => a.isElevated);
  if (elevated.length > 0) {
    return { level: RISK_LEVELS.ELEVATED, signals: elevated.flatMap(a => a.signals) };
  }

  return { level: RISK_LEVELS.NONE, signals: [] };
}

/** Full crisis reply: validate, give the hotline, keep the conversation open. */
export function buildCrisisResponse(studentName = 'em') {
  return [
    `💙 ${studentName} ơi, thầy đọc những gì em vừa viết và thầy thật sự lo cho em. Cảm ơn em vì đã nói ra — nói ra được điều này là một việc rất khó và rất dũng cảm.`,
    'Điều thầy muốn em biết ngay lúc này: **em không phải chịu đựng một mình**, và cảm giác hiện tại — dù nặng đến đâu — là một trạng thái sẽ thay đổi được khi có người đồng hành.',
    `☎️ **Hãy liên hệ ngay, miễn phí và bảo mật:**\n• Tham vấn tâm lý học đường: **${SUPPORT_CONTACTS.schoolHotline}**\n• Tổng đài Quốc gia Bảo vệ Trẻ em: **${SUPPORT_CONTACTS.childProtectionHotline}** (24/7)`,
    '🤝 **Và ngay hôm nay**, hãy tìm một người lớn em tin tưởng — thầy cô chủ nhiệm, phòng tham vấn của trường, hoặc người thân — để nói chuyện trực tiếp. Em có thể bấm nút đặt lịch tham vấn ở ngay dưới đây, thầy sẽ chuyển yêu cầu tới phòng tham vấn của trường.',
    'Nếu em thấy mình có thể làm đau bản thân trong lúc này, hãy đến chỗ có người khác và gọi ngay một trong hai số trên.',
    'Thầy vẫn ở đây. Em có muốn kể cho thầy nghe điều gì đang khiến em nặng lòng nhất không?'
  ].join('\n\n');
}

/** Softer escalation for sustained distress that is not an emergency. */
export function buildElevatedResponse(studentName = 'em', signals = []) {
  const signalText = signals.length > 0
    ? `Thầy nghe thấy trong lời em có ${signals.slice(0, 2).map(s => s.label).join(' và ')}.`
    : 'Thầy nghe thấy em đang mang khá nhiều thứ nặng nề.';

  return [
    `💙 ${signalText} Thầy không xem nhẹ điều đó chút nào, ${studentName} ạ.`,
    'Những cảm giác kiểu này thường không tự tan đi bằng cách cố gắng chịu đựng thêm — chúng nhẹ đi khi được nói ra với đúng người.',
    `📞 Bất cứ lúc nào em thấy quá sức, đường dây tham vấn **${SUPPORT_CONTACTS.schoolHotline}** luôn có người trực. Em cũng có thể đặt lịch gặp trực tiếp phòng tham vấn của trường bằng nút ngay dưới khung chat này.`,
    'Còn bây giờ, em kể thêm cho thầy nghe được không: chuyện này bắt đầu từ khi nào, và lúc nào trong ngày em thấy nặng nhất?'
  ].join('\n\n');
}
