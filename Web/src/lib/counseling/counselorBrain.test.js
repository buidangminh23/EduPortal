import { describe, it, expect } from 'vitest';
import { respond, createSession, buildGreeting, buildSessionSummary, shortName } from './counselorBrain';
import { classifyTopics, secondaryTopics, TOPICS } from './topicClassifier';
import { computeRiasecProfile } from './riasec';
import { RIASEC_QUESTIONS } from './riasecContent';
import { RISK_LEVELS, SUPPORT_CONTACTS } from './riskAssessment';

const STUDENT = {
  id: 'S001',
  name: 'Nguyễn Văn Minh',
  grades: { Math: 6.5, Literature: 8.4, Physics: 9.0, English: 7.2 }
};

const profileFor = (traits) => computeRiasecProfile(
  RIASEC_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: traits.includes(q.trait) ? 5 : 2 }), {})
);

/** Feed messages through the brain, threading the session like the UI does. */
function converse(messages, options = {}) {
  let session = createSession();
  const replies = [];

  for (const text of messages) {
    const result = respond({ text, session, ...options });
    replies.push(result.reply);
    session = result.session;
  }

  return { replies, session };
}

describe('classifyTopics', () => {
  it.each([
    ['em đang bị áp lực thi cử quá', TOPICS.EXAM_ANXIETY],
    ['em mệt mỏi kiệt sức lắm rồi', TOPICS.BURNOUT],
    ['giúp em chọn ngành với ạ', TOPICS.CAREER],
    ['em muốn có kế hoạch ôn thi hiệu quả', TOPICS.STUDY_PLAN],
    ['em với bạn thân giận nhau', TOPICS.RELATIONSHIP],
    ['bố mẹ em kỳ vọng quá nhiều', TOPICS.FAMILY],
    ['em mất tập trung, cứ lướt tiktok suốt', TOPICS.FOCUS],
    ['em thấy mình không bằng bạn bè', TOPICS.SELF_ESTEEM]
  ])('routes %j to %s', (text, expected) => {
    expect(classifyTopics(text).primary).toBe(expected);
  });

  // The failure that motivated the rewrite: unaccented typing fell through
  // every branch of the old includes()-based chain.
  it.each([
    ['em bi ap luc thi cu qua', TOPICS.EXAM_ANXIETY],
    ['em met moi kiet suc qua', TOPICS.BURNOUT],
    ['em mat dong luc hoc roi', TOPICS.MOTIVATION],
    ['giup em chon nganh', TOPICS.CAREER],
    ['ke hoach on thi the nao a', TOPICS.STUDY_PLAN]
  ])('routes unaccented %j to %s', (text, expected) => {
    expect(classifyTopics(text).primary).toBe(expected);
  });

  it('answers the question rather than the greeting attached to it', () => {
    expect(classifyTopics('chào thầy, em lo thi quá ạ').primary).toBe(TOPICS.EXAM_ANXIETY);
  });

  it('treats a bare hello as a greeting', () => {
    expect(classifyTopics('em chào thầy').primary).toBe(TOPICS.GREETING);
  });

  it('falls back to GENERAL when nothing matches', () => {
    expect(classifyTopics('hôm nay trời nhiều mây quá nhỉ').primary).toBe(TOPICS.GENERAL);
  });

  it('surfaces the other topics in a multi-topic message', () => {
    const classification = classifyTopics('em lo thi lắm mà bố mẹ còn kỳ vọng cao nữa');

    const topics = classification.ranked.map(item => item.topic);
    expect(topics).toContain(TOPICS.EXAM_ANXIETY);
    expect(topics).toContain(TOPICS.FAMILY);

    // Whichever scores higher leads; the other is still reported so the reply
    // can promise to come back to it.
    expect(secondaryTopics(classification).length).toBeGreaterThan(0);
    expect(secondaryTopics(classification)).not.toContain(classification.primary);
  });

  it('handles empty input', () => {
    expect(classifyTopics('').primary).toBe(TOPICS.GENERAL);
    expect(classifyTopics(null).primary).toBe(TOPICS.GENERAL);
  });
});

describe('respond – safety first', () => {
  it('answers a crisis message with the crisis protocol, not study tips', () => {
    const { reply } = respond({ text: 'em học không nổi nữa, em muốn chết', student: STUDENT });

    expect(reply.riskLevel).toBe(RISK_LEVELS.CRISIS);
    expect(reply.needsEscalation).toBe(true);
    expect(reply.text).toContain(SUPPORT_CONTACTS.schoolHotline);
    expect(reply.text).not.toContain('Spaced repetition');
  });

  it('escalates even when the crisis is buried under exam keywords', () => {
    const { reply } = respond({
      text: 'em ôn thi mãi mà điểm vẫn thấp, nhiều lúc em không muốn sống nữa',
      student: STUDENT
    });

    expect(reply.riskLevel).toBe(RISK_LEVELS.CRISIS);
  });

  it('offers an appointment for sustained distress', () => {
    const { reply } = respond({ text: 'em thấy mình vô dụng và bế tắc', student: STUDENT });

    expect(reply.riskLevel).toBe(RISK_LEVELS.ELEVATED);
    expect(reply.needsEscalation).toBe(true);
  });

  it('records escalations on the session for the summary', () => {
    const { session } = converse(['em muốn chết'], { student: STUDENT });
    expect(session.escalationCount).toBe(1);
  });
});

describe('respond – personalisation', () => {
  it('names the student', () => {
    const { reply } = respond({ text: 'em lo thi quá', student: STUDENT });
    expect(reply.text).toContain('Minh');
  });

  it('names the weakest subject in a study plan', () => {
    const { reply } = respond({ text: 'em muốn kế hoạch ôn thi', student: STUDENT });

    expect(reply.text).toContain('Toán'); // 6.5, the lowest grade
    expect(reply.text).toContain('Vật lí'); // 9.0, listed as a strength
  });

  it('uses the RIASEC profile for career questions', () => {
    const profile = profileFor(['I', 'A']);
    const { reply } = respond({ text: 'em nên chọn ngành nào', student: STUDENT, profile });

    expect(reply.text).toContain(profile.hollandCode);
    expect(reply.text).toMatch(/Khoa học Dữ liệu|Trí tuệ nhân tạo/);
  });

  it('asks the student to take the survey when there is no profile', () => {
    const { reply } = respond({ text: 'em nên chọn ngành nào', student: STUDENT });

    expect(reply.text).toContain('RIASEC');
    expect(reply.text).toMatch(/khảo sát/);
  });

  it('acknowledges the mood chip on the first turn only', () => {
    let session = createSession();
    const first = respond({ text: 'em lo thi quá', mood: 'stressed', student: STUDENT, session });
    expect(first.reply.text).toContain('hôm nay em đang căng');

    const second = respond({ text: 'em vẫn lo lắm', mood: 'stressed', student: STUDENT, session: first.session });
    expect(second.reply.text).not.toContain('hôm nay em đang căng');
  });

  it('works without a student record', () => {
    const { reply } = respond({ text: 'em lo thi quá' });
    expect(reply.text.length).toBeGreaterThan(0);
  });
});

describe('respond – conversation memory', () => {
  // Repeating the same paragraph is the clearest sign of a lookup table
  // pretending to be a counsellor.
  it('never repeats the same advice inside one session', () => {
    const { replies } = converse(
      ['em lo thi quá', 'em vẫn lo lắm ạ', 'em vẫn chưa đỡ hơn'],
      { student: STUDENT }
    );

    const texts = replies.map(r => r.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('keeps answering even after a topic runs out of variants', () => {
    const { replies } = converse(Array.from({ length: 6 }, () => 'em lo thi quá'), { student: STUDENT });

    replies.forEach(reply => expect(reply.text.length).toBeGreaterThan(20));
    expect(new Set(replies.map(r => r.text)).size).toBeGreaterThan(3);
  });

  it('tracks topics for the session summary', () => {
    const { session } = converse(
      ['em lo thi quá', 'em muốn chọn ngành', 'bố mẹ em kỳ vọng cao'],
      { student: STUDENT }
    );

    expect(session.topicHistory).toEqual([TOPICS.EXAM_ANXIETY, TOPICS.CAREER, TOPICS.FAMILY]);
    expect(session.turn).toBe(3);
  });

  it('does not mutate the session it was given', () => {
    const session = createSession();
    respond({ text: 'em lo thi quá', session, student: STUDENT });

    expect(session.turn).toBe(0);
    expect(session.usedResponseIds).toEqual([]);
  });

  it('always ends with something for the student to answer', () => {
    const { replies } = converse(
      ['em lo thi quá', 'em mệt mỏi', 'hôm nay trời đẹp nhỉ'],
      { student: STUDENT }
    );

    replies.forEach(reply => expect(reply.text).toContain('?'));
  });

  it('offers quick replies to keep the conversation moving', () => {
    const { replies } = converse(['em lo thi quá'], { student: STUDENT });
    expect(replies[0].quickReplies.length).toBeGreaterThan(0);
  });
});

describe('greeting and summary', () => {
  it('greets by name and mentions the missing survey', () => {
    const greeting = buildGreeting({ student: STUDENT, profile: null });

    expect(greeting).toContain('Minh');
    expect(greeting).toContain('RIASEC');
  });

  it('mentions the Holland code when a profile exists', () => {
    const profile = profileFor(['S', 'E']);
    expect(buildGreeting({ student: STUDENT, profile })).toContain(profile.hollandCode);
  });

  it('summarises the topics covered', () => {
    const { session } = converse(['em lo thi quá', 'em muốn chọn ngành'], { student: STUDENT });
    const summary = buildSessionSummary({ session, student: STUDENT, profile: null });

    expect(summary).toContain('áp lực thi cử');
    expect(summary).toContain('hướng nghiệp');
    expect(summary).toContain('Không có dấu hiệu cần can thiệp');
  });

  it('flags a session that contained an escalation', () => {
    const { session } = converse(['em muốn chết'], { student: STUDENT });
    const summary = buildSessionSummary({ session, student: STUDENT, profile: null });

    expect(summary).toContain('cần được người lớn quan tâm');
  });
});

describe('shortName', () => {
  it('uses the last part of a Vietnamese name', () => {
    expect(shortName('Nguyễn Văn Minh')).toBe('Minh');
    expect(shortName('Minh')).toBe('Minh');
  });

  it('falls back politely', () => {
    expect(shortName('')).toBe('em');
    expect(shortName(null)).toBe('em');
  });
});
