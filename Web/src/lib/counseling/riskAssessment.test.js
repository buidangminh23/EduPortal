import { describe, it, expect } from 'vitest';
import {
  assessRisk,
  assessConversationRisk,
  buildCrisisResponse,
  buildElevatedResponse,
  RISK_LEVELS,
  SUPPORT_CONTACTS
} from './riskAssessment';

describe('assessRisk – crisis', () => {
  it.each([
    'em muốn chết',
    'em không muốn sống nữa',
    'chắc em tự tử quá',
    'em hay tự hại mình',
    'em muốn biến mất khỏi thế giới này',
    'em muốn kết thúc tất cả'
  ])('flags %j as a crisis', (text) => {
    expect(assessRisk(text).level).toBe(RISK_LEVELS.CRISIS);
  });

  // The old detector only matched fully accented text, which is not how a
  // student types on a phone at 1am. This is the regression that matters most.
  it.each([
    'em muon chet qua',
    'khong muon song nua',
    'em dinh tu tu',
    'em hay tu hai ban than'
  ])('flags unaccented input %j', (text) => {
    expect(assessRisk(text).level).toBe(RISK_LEVELS.CRISIS);
  });

  it('is case-insensitive', () => {
    expect(assessRisk('EM MUỐN CHẾT').level).toBe(RISK_LEVELS.CRISIS);
  });

  it('finds the phrase inside a longer message', () => {
    const risk = assessRisk('dạo này học hành áp lực quá, nhiều lúc em chỉ muốn chết cho xong thầy ạ');
    expect(risk.isCrisis).toBe(true);
    expect(risk.signals.length).toBeGreaterThan(0);
  });

  it('reports which signal fired', () => {
    expect(assessRisk('em muốn tự hại').signals[0].label).toContain('tự làm đau');
  });
});

describe('assessRisk – negation', () => {
  it('steps down an explicitly negated crisis phrase', () => {
    const risk = assessRisk('em buồn nhưng em không muốn chết đâu thầy');
    expect(risk.level).toBe(RISK_LEVELS.ELEVATED);
    expect(risk.negated).toBe(true);
  });

  it('does not let a negation elsewhere in the sentence silence a real signal', () => {
    // "không ai hiểu" is a negation but it does not cancel "muốn chết".
    expect(assessRisk('không ai hiểu em, em muốn chết').level).toBe(RISK_LEVELS.CRISIS);
  });

  it('still escalates when the student reports someone else at risk', () => {
    expect(assessRisk('bạn thân của em nói bạn ấy muốn chết').level).toBe(RISK_LEVELS.CRISIS);
  });
});

describe('assessRisk – elevated', () => {
  it.each([
    'em thấy mình vô dụng',
    'em thấy bế tắc quá',
    'em bị bắt nạt ở lớp',
    'em mất ngủ suốt mấy hôm nay',
    'em thấy mình là gánh nặng cho bố mẹ',
    'em muốn bỏ học'
  ])('flags %j as elevated', (text) => {
    expect(assessRisk(text).level).toBe(RISK_LEVELS.ELEVATED);
  });

  it('does not escalate ordinary study talk', () => {
    expect(assessRisk('em muốn ôn thi môn Toán hiệu quả hơn').level).toBe(RISK_LEVELS.NONE);
    expect(assessRisk('thầy ơi bài này khó quá').level).toBe(RISK_LEVELS.NONE);
    expect(assessRisk('em muốn biết nên chọn ngành nào').level).toBe(RISK_LEVELS.NONE);
  });

  it('does not treat exam nerves as a mental-health emergency', () => {
    expect(assessRisk('em hồi hộp quá sắp thi rồi').level).toBe(RISK_LEVELS.NONE);
  });

  it('handles empty and nullish input', () => {
    expect(assessRisk('').level).toBe(RISK_LEVELS.NONE);
    expect(assessRisk(null).level).toBe(RISK_LEVELS.NONE);
    expect(assessRisk(undefined).level).toBe(RISK_LEVELS.NONE);
  });
});

describe('assessConversationRisk', () => {
  const userMsg = (text) => ({ sender: 'user', text });

  it('catches a crisis raised a few messages back', () => {
    const history = [
      userMsg('em chào thầy'),
      userMsg('nhiều lúc em không muốn sống nữa'),
      userMsg('mà thôi kệ đi ạ')
    ];

    expect(assessConversationRisk(history).level).toBe(RISK_LEVELS.CRISIS);
  });

  it('ignores what the counsellor itself said', () => {
    const history = [
      { sender: 'counselor', text: 'nếu em từng nghĩ tới chuyện tự tử, hãy gọi ngay' },
      userMsg('vâng em hiểu ạ')
    ];

    expect(assessConversationRisk(history).level).toBe(RISK_LEVELS.NONE);
  });

  it('only looks at the recent window', () => {
    const history = [
      userMsg('em muốn chết'),
      ...Array.from({ length: 8 }, () => userMsg('em ổn rồi ạ'))
    ];

    expect(assessConversationRisk(history, 4).level).toBe(RISK_LEVELS.NONE);
  });

  it('returns none for an empty conversation', () => {
    expect(assessConversationRisk([]).level).toBe(RISK_LEVELS.NONE);
  });
});

describe('escalation copy', () => {
  // If a hotline is ever dropped in an edit, this fails instead of shipping a
  // crisis message with no way to get help.
  it('always carries both hotlines', () => {
    const message = buildCrisisResponse('Minh');
    expect(message).toContain(SUPPORT_CONTACTS.schoolHotline);
    expect(message).toContain(SUPPORT_CONTACTS.childProtectionHotline);
  });

  it('addresses the student by name', () => {
    expect(buildCrisisResponse('Minh')).toContain('Minh');
  });

  it('points at a real human, not only at the chatbot', () => {
    expect(buildCrisisResponse()).toMatch(/thầy cô|phòng tham vấn|người thân/);
  });

  it('offers the appointment route in the softer escalation', () => {
    const message = buildElevatedResponse('Minh', [{ id: 'hopeless', label: 'cảm giác bế tắc' }]);
    expect(message).toContain('cảm giác bế tắc');
    expect(message).toContain('đặt lịch');
  });

  it('still reads sensibly with no signals to name', () => {
    expect(buildElevatedResponse('Minh', [])).toContain('Minh');
  });
});
