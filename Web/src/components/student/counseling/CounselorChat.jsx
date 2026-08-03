import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Send, Trash2, FileText, LifeBuoy, CalendarPlus, X } from 'lucide-react';
import { respond, createSession, buildGreeting, buildSessionSummary } from '../../../lib/counseling/counselorBrain';
import { RISK_LEVELS, SUPPORT_CONTACTS } from '../../../lib/counseling/riskAssessment';
import { safeStorage } from '../../../lib/safeStorage';
import { currentSchoolDay } from '../../../config/demoClock';

const STORAGE_PREFIX = 'counselingChat_';
/** Keep the transcript bounded so a long-running demo cannot fill up storage. */
const MAX_STORED_MESSAGES = 60;

const MOODS = [
  { id: 'great', emoji: '😄', label: 'Tuyệt vời', wellnessMood: 'happy', stress: 2 },
  { id: 'okay', emoji: '🙂', label: 'Bình thường', wellnessMood: 'happy', stress: 4 },
  { id: 'stressed', emoji: '😰', label: 'Căng thẳng', wellnessMood: 'stressed', stress: 8 },
  { id: 'sad', emoji: '😢', label: 'Buồn', wellnessMood: 'anxious', stress: 7 },
  { id: 'tired', emoji: '😴', label: 'Mệt mỏi', wellnessMood: 'tired', stress: 6 }
];

const TIME_SLOTS = ['09:00 - 09:45', '10:00 - 10:45', '14:00 - 14:45', '15:00 - 15:45'];

const DEFAULT_QUICK_REPLIES = [
  'Em đang bị áp lực thi cử 😰',
  'Giúp em chọn ngành phù hợp',
  'Em mệt mỏi và mất động lực',
  'Kế hoạch ôn thi hiệu quả'
];

/**
 * Render the small subset of Markdown the counsellor writes.
 *
 * Deliberately not `dangerouslySetInnerHTML`: the transcript mixes generated
 * copy with text the student typed, and nothing here needs raw HTML.
 */
function RichText({ text }) {
  const nodes = useMemo(() => {
    const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);

    return parts.filter(Boolean).map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }
      return <span key={idx}>{part}</span>;
    });
  }, [text]);

  return <span style={{ whiteSpace: 'pre-line' }}>{nodes}</span>;
}

/** Typing delay scaled to reply length — instant replies read as canned. */
const typingDelayFor = (text) => 700 + Math.min(String(text).length * 6, 1600);

/**
 * Restore this student's transcript, or open a fresh room.
 *
 * Runs as a lazy state initialiser rather than in an effect so the first paint
 * already shows the real conversation — reading storage in an effect would
 * render an empty room and then immediately replace it.
 */
function loadInitialState(storageKey, greetingText) {
  const fresh = {
    history: [{ sender: 'counselor', text: greetingText, timestamp: Date.now() }],
    session: createSession()
  };

  if (!storageKey) return fresh;

  const raw = safeStorage.getItem(storageKey);
  if (!raw) return fresh;

  try {
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved.history) || saved.history.length === 0) return fresh;

    // Restoring the session, not just the messages, is what stops the
    // counsellor from repeating advice it already gave before a refresh.
    return { history: saved.history, session: { ...createSession(), ...(saved.session || {}) } };
  } catch {
    return fresh;
  }
}

/**
 * The chat room for one student.
 *
 * Mount it with `key={student.id}`: switching student is a different
 * conversation, and remounting is what loads their own transcript.
 */
export default function CounselorChat({ student, profile, onLogMood, onRequestCounseling }) {
  const storageKey = student?.id ? `${STORAGE_PREFIX}${student.id}` : null;
  const greetingText = useMemo(() => buildGreeting({ student, profile }), [student, profile]);

  const [initial] = useState(() => loadInitialState(storageKey, greetingText));
  const [history, setHistory] = useState(initial.history);
  const [session, setSession] = useState(initial.session);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState(null);
  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES);
  const [showAppointment, setShowAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(currentSchoolDay());
  const [appointmentSlot, setAppointmentSlot] = useState(TIME_SLOTS[0]);
  const [appointmentSent, setAppointmentSent] = useState(false);

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!storageKey || history.length === 0) return;

    safeStorage.setItem(storageKey, JSON.stringify({
      history: history.slice(-MAX_STORED_MESSAGES),
      session
    }));
  }, [storageKey, history, session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [history, isTyping]);

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const lastRisk = history.filter(m => m.riskLevel && m.riskLevel !== RISK_LEVELS.NONE).slice(-1)[0];

  const send = useCallback((rawText) => {
    const text = rawText.trim();
    if (!text || isTyping) return;

    setHistory(prev => [...prev, { sender: 'user', text, timestamp: Date.now() }]);
    setInput('');
    setIsTyping(true);

    const { reply, session: nextSession } = respond({ text, mood, student, profile, session });

    typingTimer.current = setTimeout(() => {
      setHistory(prev => [...prev, {
        sender: 'counselor',
        text: reply.text,
        timestamp: Date.now(),
        riskLevel: reply.riskLevel,
        topic: reply.topic
      }]);
      setSession(nextSession);
      setQuickReplies(reply.quickReplies?.length > 0 ? reply.quickReplies : DEFAULT_QUICK_REPLIES);
      setIsTyping(false);

      if (reply.needsEscalation) setShowAppointment(true);
    }, typingDelayFor(reply.text));
  }, [isTyping, mood, student, profile, session]);

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const handleMood = (option) => {
    const isSame = mood === option.id;
    setMood(isSame ? null : option.id);

    // Sending the check-in to the wellness log is what turns this from a
    // decorative chip into data the homeroom teacher and parent screens read.
    if (!isSame && onLogMood) {
      onLogMood({ mood: option.wellnessMood, stressLevel: option.stress, label: option.label });
    }
    if (!isSame) {
      inputRef.current?.focus();
      setInput(`Hôm nay em thấy ${option.label.toLowerCase()}`);
    }
  };

  const handleSummary = () => {
    setHistory(prev => [...prev, {
      sender: 'counselor',
      text: buildSessionSummary({ session, student, profile }),
      timestamp: Date.now()
    }]);
  };

  const handleClear = () => {
    clearTimeout(typingTimer.current);
    setIsTyping(false);
    setHistory([{ sender: 'counselor', text: greetingText, timestamp: Date.now() }]);
    setSession(createSession());
    setQuickReplies(DEFAULT_QUICK_REPLIES);
    setShowAppointment(false);
    setAppointmentSent(false);
    if (storageKey) safeStorage.removeItem(storageKey);
  };

  const handleBookAppointment = () => {
    onRequestCounseling?.({
      date: appointmentDate,
      timeSlot: appointmentSlot,
      notes: 'Yêu cầu gửi từ AI Tư vấn tâm lý học đường — học sinh cần được hỗ trợ trực tiếp.'
    });
    setAppointmentSent(true);
    setHistory(prev => [...prev, {
      sender: 'counselor',
      text: `✅ Thầy đã chuyển yêu cầu đặt lịch của em tới phòng tham vấn (**${appointmentDate.split('-').reverse().join('/')}** · ${appointmentSlot}). Nhà trường sẽ liên hệ xác nhận với em sớm.\n\nTrong lúc chờ, em vẫn có thể nói chuyện với thầy ở đây.`,
      timestamp: Date.now()
    }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--violet) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--sh-md)', flexShrink: 0
        }}>
          <Heart size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>AI Tư Vấn Tâm Lý Học Đường</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-success)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.76rem', color: 'var(--accent-success)', fontWeight: 600 }}>
              Đang trực tuyến{profile ? ` • Đã đọc kết quả RIASEC ${profile.hollandCode}` : ''}
            </span>
          </div>
        </div>

        <button type="button" onClick={handleSummary} className="btn" title="Tóm tắt buổi trò chuyện" style={{ padding: '7px 10px' }}>
          <FileText size={15} />
        </button>
        <button type="button" onClick={handleClear} className="btn" title="Xoá lịch sử trò chuyện" style={{ padding: '7px 10px' }}>
          <Trash2 size={15} />
        </button>
      </div>

      {/* Mood check-in */}
      <div style={{ padding: '13px 14px', background: 'var(--accent-soft)', borderRadius: '14px', border: '1px solid var(--line)' }}>
        <p style={{ margin: '0 0 9px 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          🌡️ Hôm nay em đang cảm thấy thế nào? <span style={{ fontWeight: 400 }}>(ghi vào nhật ký sức khoẻ tinh thần của em)</span>
        </p>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {MOODS.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleMood(option)}
              aria-pressed={mood === option.id}
              style={{
                padding: '6px 12px', borderRadius: '99px', cursor: 'pointer',
                border: `1.5px solid ${mood === option.id ? 'var(--accent-primary)' : 'var(--line-strong)'}`,
                background: mood === option.id ? 'var(--accent-primary)' : 'var(--surface)',
                color: mood === option.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.77rem', fontWeight: mood === option.id ? 700 : 500,
                transition: 'all 0.18s ease', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Safety banner */}
      {lastRisk && (
        <div style={{
          display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '12px',
          background: lastRisk.riskLevel === RISK_LEVELS.CRISIS ? 'var(--coral-soft)' : 'var(--amber-soft)',
          border: `1px solid ${lastRisk.riskLevel === RISK_LEVELS.CRISIS ? 'var(--coral)' : 'var(--amber)'}`
        }}>
          <LifeBuoy size={18} color={lastRisk.riskLevel === RISK_LEVELS.CRISIS ? 'var(--coral)' : 'var(--amber)'} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
            <strong>Em không phải đối mặt một mình.</strong> Tham vấn học đường{' '}
            <strong>{SUPPORT_CONTACTS.schoolHotline}</strong> · Tổng đài Bảo vệ Trẻ em{' '}
            <strong>{SUPPORT_CONTACTS.childProtectionHotline}</strong> (miễn phí, 24/7).
          </div>
        </div>
      )}

      {/* Appointment request */}
      {showAppointment && (
        <div style={{ padding: '13px 14px', borderRadius: '12px', background: 'var(--surface-soft)', border: '1px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <CalendarPlus size={16} color="var(--accent-primary)" />
            <strong style={{ fontSize: '0.85rem', flex: 1 }}>Đặt lịch gặp chuyên viên tham vấn</strong>
            <button type="button" onClick={() => setShowAppointment(false)} className="btn" style={{ padding: '4px 6px' }} title="Đóng">
              <X size={14} />
            </button>
          </div>

          {appointmentSent ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-success)', fontWeight: 600 }}>
              ✅ Đã gửi yêu cầu tới phòng tham vấn của trường.
            </p>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="date"
                value={appointmentDate}
                min={currentSchoolDay()}
                onChange={e => setAppointmentDate(e.target.value)}
                className="form-control"
                style={{ flex: '1 1 140px', fontSize: '0.82rem' }}
              />
              <select
                value={appointmentSlot}
                onChange={e => setAppointmentSlot(e.target.value)}
                className="form-control"
                style={{ flex: '1 1 130px', fontSize: '0.82rem' }}
              >
                {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
              <button type="button" onClick={handleBookAppointment} className="btn btn-primary" style={{ flex: '1 1 120px' }}>
                Gửi yêu cầu
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chat window */}
      <div style={{
        height: '392px', border: '1px solid var(--border-card)', borderRadius: '16px',
        background: 'var(--surface-soft)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div className="custom-scroll" style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((message, idx) => {
            const isUser = message.sender === 'user';

            return (
              <div key={`${message.timestamp}-${idx}`} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '4px' }}>
                {!isUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--violet) 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Heart size={11} color="white" />
                    </span>
                    <span style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tư vấn AI</span>
                  </div>
                )}

                <div style={{
                  maxWidth: '84%', padding: '11px 15px',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  fontSize: '0.85rem', lineHeight: 1.62,
                  background: isUser ? 'var(--accent-primary)' : 'var(--surface)',
                  color: isUser ? '#fff' : 'var(--text-primary)',
                  border: isUser ? 'none' : '1px solid var(--line)',
                  boxShadow: 'var(--sh-sm)'
                }}>
                  <RichText text={message.text} />
                </div>

                {message.timestamp && (
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                    {new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--violet) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Heart size={11} color="white" />
              </span>
              <div style={{
                padding: '10px 15px', borderRadius: '4px 18px 18px 18px',
                background: 'var(--surface)', border: '1px solid var(--line)',
                display: 'flex', gap: '4px', alignItems: 'center'
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)',
                    animation: `typing-bounce 1s ease-in-out ${i * 0.18}s infinite`
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Contextual quick replies */}
        {!isTyping && quickReplies.length > 0 && (
          <div className="custom-scroll" style={{ padding: '9px 14px', borderTop: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', gap: '7px', overflowX: 'auto' }}>
            {quickReplies.map(text => (
              <button
                key={text}
                type="button"
                onClick={() => send(text)}
                style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: '99px', cursor: 'pointer',
                  border: '1.5px solid var(--accent-primary)', background: 'var(--accent-soft)',
                  color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap'
                }}
              >
                {text}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', borderTop: '1px solid var(--border-card)', background: 'var(--surface)', padding: '11px' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isTyping ? 'Thầy đang trả lời...' : 'Chia sẻ tâm sự với thầy...'}
            disabled={isTyping}
            aria-label="Nội dung tin nhắn"
            className="form-control"
            style={{ flex: 1, fontSize: '0.85rem', background: 'var(--bg-2)', border: 'none', borderRadius: '12px', padding: '10px 15px' }}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="btn btn-primary"
            aria-label="Gửi"
            style={{ padding: '10px 14px', minWidth: 0, borderRadius: '12px', marginLeft: '8px', opacity: (isTyping || !input.trim()) ? 0.5 : 1 }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <p style={{ margin: 0, fontSize: '0.71rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        🔒 Nội dung em chia sẻ được lưu riêng trên thiết bị của em. AI Tư vấn không thay thế chuyên gia tâm lý lâm sàng —
        trường hợp khẩn cấp hãy gọi <strong>{SUPPORT_CONTACTS.schoolHotline}</strong> hoặc <strong>{SUPPORT_CONTACTS.childProtectionHotline}</strong>.
      </p>
    </div>
  );
}
