/**
 * Turns one student message into one counsellor reply.
 *
 * Everything here is a pure function of (message, student, RIASEC profile,
 * session) so the whole conversational behaviour can be unit tested without
 * rendering React or waiting on the fake typing delay.
 *
 * Order matters and is deliberate: safety triage first, then the student's own
 * data, then topic. A message that mentions self-harm never reaches the study
 * tips branch, however many keywords about exams it also contains.
 */

import { assessRisk, buildCrisisResponse, buildElevatedResponse, RISK_LEVELS } from './riskAssessment';
import { classifyTopics, secondaryTopics, TOPICS } from './topicClassifier';
import {
  TOPIC_RESPONSES,
  GENERAL_PROBES,
  MOOD_OPENERS,
  buildCareerBlock,
  buildCareerPrompt
} from './counselorReplies';
import { getCareerGuidance } from './riasec';

/** Grade keys in the dataset are English; students are not. */
const SUBJECT_LABELS = {
  Math: 'Toán',
  Literature: 'Ngữ văn',
  Physics: 'Vật lí',
  Chemistry: 'Hoá học',
  Biology: 'Sinh học',
  English: 'Tiếng Anh',
  History: 'Lịch sử',
  Geography: 'Địa lí',
  Informatics: 'Tin học',
  Civics: 'GDCD'
};

/** Grades at or above this are treated as a strength, below as a priority. */
const STRONG_GRADE = 8;

export function createSession() {
  return {
    turn: 0,
    usedResponseIds: [],
    topicHistory: [],
    lastRiskLevel: RISK_LEVELS.NONE,
    escalationCount: 0
  };
}

function subjectLabel(key) {
  return SUBJECT_LABELS[key] || key;
}

function averageGrade(grades) {
  const values = Object.values(grades || {}).filter(v => Number.isFinite(Number(v))).map(Number);
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function splitSubjects(grades) {
  const entries = Object.entries(grades || {}).filter(([, v]) => Number.isFinite(Number(v)));
  const weak = entries.filter(([, v]) => Number(v) < STRONG_GRADE).sort((a, b) => a[1] - b[1]);
  const strong = entries.filter(([, v]) => Number(v) >= STRONG_GRADE).sort((a, b) => b[1] - a[1]);

  return {
    weak: weak.map(([k]) => subjectLabel(k)),
    strong: strong.map(([k]) => subjectLabel(k))
  };
}

/** Short first name — how a teacher would actually address the student. */
export function shortName(fullName) {
  if (!fullName) return 'em';
  const parts = String(fullName).trim().split(/\s+/);
  return parts[parts.length - 1] || 'em';
}

function buildGpaLine(gpa) {
  if (gpa === null) return '';

  if (gpa >= 9) return `📈 GPA **${gpa}** của em đang ở nhóm dẫn đầu — cửa xét tuyển thẳng và các trường tốp đầu đều đang mở.`;
  if (gpa >= 8) return `📈 GPA **${gpa}** là vùng an toàn cho phần lớn trường tốp trên. Giữ nhịp này là đủ, không cần ép thêm.`;
  if (gpa >= 6.5) return `📈 GPA **${gpa}** đang ở mức khá. Kéo được 1–2 môn yếu nhất lên là cả bảng điểm đổi màu.`;
  return `📈 GPA **${gpa}** đang cần được chú ý — nhưng còn đủ thời gian, và cải thiện nhanh nhất luôn đến từ môn thấp nhất chứ không phải môn em thích nhất.`;
}

function buildRecapLine(topicHistory) {
  const labels = {
    [TOPICS.EXAM_ANXIETY]: 'áp lực thi cử',
    [TOPICS.BURNOUT]: 'mệt mỏi và giấc ngủ',
    [TOPICS.LOW_MOOD]: 'cảm xúc',
    [TOPICS.MOTIVATION]: 'động lực',
    [TOPICS.FOCUS]: 'tập trung',
    [TOPICS.CAREER]: 'hướng nghiệp',
    [TOPICS.STUDY_PLAN]: 'kế hoạch học',
    [TOPICS.TIME_MANAGEMENT]: 'quản lý thời gian',
    [TOPICS.RELATIONSHIP]: 'bạn bè',
    [TOPICS.FAMILY]: 'gia đình',
    [TOPICS.SELF_ESTEEM]: 'sự tự tin',
    [TOPICS.HEALTH]: 'sức khoẻ'
  };

  const named = [...new Set(topicHistory)].map(topic => labels[topic]).filter(Boolean);
  if (named.length === 0) return null;

  return `📋 Hôm nay mình đã nói về: **${named.join('**, **')}**.`;
}

/** Everything the reply templates are allowed to know about the student. */
export function buildContext({ student, profile, session }) {
  const grades = student?.grades || {};
  const gpa = averageGrade(grades);
  const { weak, strong } = splitSubjects(grades);
  const guidance = profile ? getCareerGuidance(profile) : null;
  const topTrait = profile ? profile.ranked[0] : null;

  const ctx = {
    name: shortName(student?.name),
    gpa,
    gpaLine: buildGpaLine(gpa),
    weakSubjects: weak,
    weakSubjectText: weak.length > 0 ? weak.join(', ') : 'không có môn nào dưới 8 — nền của em khá đều',
    firstWeakSubject: weak[0] || 'môn em thấy khó nhất',
    strongSubjectText: strong.length > 0 ? `, còn **${strong.slice(0, 2).join(', ')}** đang là điểm mạnh nên giữ` : '',
    hasProfile: Boolean(profile),
    profile,
    guidance,
    hollandCode: profile?.hollandCode || '',
    topTraitName: topTrait ? `${topTrait.name} (${topTrait.trait})` : '',
    sampleJobs: guidance?.jobs?.slice(0, 2).join(', ') || '',
    recapLine: buildRecapLine(session?.topicHistory || [])
  };

  ctx.careerBlock = profile ? buildCareerBlock(ctx) : '';
  ctx.careerPrompt = buildCareerPrompt(ctx);

  return ctx;
}

/**
 * Pick a variant the session has not shown yet.
 *
 * Repeating a canned paragraph is what makes a chatbot feel like a lookup
 * table, so once a topic runs out of fresh angles the reply falls through to an
 * open probe rather than saying the same thing twice.
 */
function pickVariant(candidates, usedIds) {
  const fresh = candidates.find(variant => !usedIds.includes(variant.id));
  return fresh || null;
}

function buildTopicReply({ topic, ctx, session }) {
  const variants = TOPIC_RESPONSES[topic] || [];
  const variant = pickVariant(variants, session.usedResponseIds);

  if (variant) {
    return {
      text: variant.build(ctx),
      quickReplies: variant.quickReplies || [],
      responseId: variant.id
    };
  }

  const probe = pickVariant(GENERAL_PROBES, session.usedResponseIds) || GENERAL_PROBES[session.turn % GENERAL_PROBES.length];
  return {
    text: probe.build(ctx),
    quickReplies: probe.quickReplies || [],
    responseId: probe.id
  };
}

/**
 * Produce the counsellor's answer to one message.
 *
 * @returns {{reply: object, session: object}} A new session object; the caller
 *   stores it and passes it back on the next turn.
 */
export function respond({ text, mood = null, student = null, profile = null, session = createSession() }) {
  const ctx = buildContext({ student, profile, session });
  const risk = assessRisk(text);
  const classification = classifyTopics(text);
  const turn = session.turn + 1;

  if (risk.level === RISK_LEVELS.CRISIS) {
    return {
      reply: {
        text: buildCrisisResponse(ctx.name),
        topic: 'CRISIS',
        riskLevel: risk.level,
        signals: risk.signals,
        needsEscalation: true,
        quickReplies: ['Em muốn đặt lịch gặp thầy cô', 'Em muốn kể tiếp cho thầy nghe', 'Em đang ở một mình']
      },
      session: {
        ...session,
        turn,
        lastRiskLevel: risk.level,
        escalationCount: session.escalationCount + 1,
        topicHistory: [...session.topicHistory, 'CRISIS']
      }
    };
  }

  if (risk.level === RISK_LEVELS.ELEVATED) {
    return {
      reply: {
        text: buildElevatedResponse(ctx.name, risk.signals),
        topic: 'ELEVATED',
        riskLevel: risk.level,
        signals: risk.signals,
        needsEscalation: true,
        quickReplies: ['Em muốn đặt lịch tham vấn', 'Chuyện kéo dài lâu rồi ạ', 'Em muốn nói tiếp với thầy']
      },
      session: {
        ...session,
        turn,
        lastRiskLevel: risk.level,
        escalationCount: session.escalationCount + 1,
        topicHistory: [...session.topicHistory, 'ELEVATED']
      }
    };
  }

  // GENERAL has no entry in TOPIC_RESPONSES, so it falls through to the open
  // probes by the same path a topic that has run out of variants takes.
  const topic = classification.primary;
  const built = buildTopicReply({ topic, ctx, session });

  // The mood chip is a real signal the student gave us; acknowledging it once,
  // on the first turn, is the difference between a form field and a listener.
  const moodOpener = turn === 1 && mood && MOOD_OPENERS[mood] ? `${MOOD_OPENERS[mood]}\n\n` : '';

  const alsoTopics = secondaryTopics(classification);
  const bridge = alsoTopics.length > 0 && topic !== TOPICS.GENERAL
    ? `\n\n🔁 Thầy thấy em còn nhắc tới chuyện khác nữa — mình quay lại nó ngay sau nhé.`
    : '';

  return {
    reply: {
      text: `${moodOpener}${built.text}${bridge}`,
      topic,
      riskLevel: RISK_LEVELS.NONE,
      signals: [],
      needsEscalation: false,
      quickReplies: built.quickReplies,
      confidence: classification.confidence
    },
    session: {
      ...session,
      turn,
      lastRiskLevel: RISK_LEVELS.NONE,
      usedResponseIds: [...session.usedResponseIds, built.responseId],
      topicHistory: [...session.topicHistory, topic]
    }
  };
}

/** Opening message, personalised with the student's name and survey state. */
export function buildGreeting({ student, profile }) {
  const name = shortName(student?.name);
  const profileLine = profile
    ? `📊 Thầy đã xem kết quả RIASEC của em (mã **${profile.hollandCode}**) nên mình có thể nói chuyện hướng nghiệp rất cụ thể.`
    : '📊 Em chưa làm bài khảo sát RIASEC bên trái — làm xong (khoảng 3 phút) thì phần tư vấn ngành nghề của thầy sẽ chính xác hơn nhiều.';

  return [
    `👋 Chào ${name}! Thầy là chuyên gia tham vấn tâm lý học đường của trường.`,
    'Giai đoạn ôn thi là lúc nhiều thứ dồn lại cùng lúc. Em kể được đến đâu thì thầy nghe đến đó, không có gì là quá nhỏ để nói.',
    '💬 Em có thể hỏi thầy về:\n• Căng thẳng, lo âu, mất ngủ\n• Chọn ngành, chọn trường, kết quả RIASEC\n• Cách học và kế hoạch ôn thi\n• Chuyện bạn bè, gia đình, và chính bản thân em',
    profileLine,
    'Hôm nay em thấy thế nào?'
  ].join('\n\n');
}

/** End-of-session summary the student can screenshot or show to a teacher. */
export function buildSessionSummary({ session, student, profile }) {
  const name = shortName(student?.name);
  const recap = buildRecapLine(session?.topicHistory || []);
  const hadEscalation = (session?.escalationCount || 0) > 0;

  return [
    `📋 **Tóm tắt buổi trò chuyện của ${name}**`,
    `Số lượt trao đổi: **${session?.turn || 0}**`,
    recap || 'Chưa có chủ đề nào được ghi nhận.',
    profile ? `Mã hướng nghiệp RIASEC: **${profile.hollandCode}** (độ tin cậy ${profile.confidence}%).` : 'Chưa hoàn thành khảo sát RIASEC.',
    hadEscalation
      ? '⚠️ Trong buổi này có nội dung cần được người lớn quan tâm. Thầy khuyến khích em đặt lịch gặp phòng tham vấn của trường.'
      : '✅ Không có dấu hiệu cần can thiệp khẩn cấp trong buổi này.'
  ].join('\n\n');
}

export { RISK_LEVELS, TOPICS };
