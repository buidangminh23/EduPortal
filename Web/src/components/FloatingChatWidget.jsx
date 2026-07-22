import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Sparkles, Send, X, Minus,
  Heart, BookOpen, ChevronDown
} from 'lucide-react';

const getTimestamp = () => Date.now();

import { formatTutorText } from '../lib/tutor/formatText';

// ─── AI Counselor reply engine (extracted from StudentDashboard) ──────────────
function generateCounselorReply(txt, msgCount, studentName, gpaVal, currentScores) {
  const norm = txt.toLowerCase();

  if (norm.includes('tự tử') || norm.includes('không muốn sống') || norm.includes('chán sống')) {
    return `💙 Em ơi, thầy rất lo cho em. Em không đơn độc – thầy ở đây cùng em.\n\nXin gọi ngay **Đường dây hỗ trợ tâm thần 1800 599 920** (miễn phí, 24/7) hoặc tìm gặp thầy cô.\n\nEm có muốn kể thêm không? Thầy lắng nghe.`;
  }
  if (norm.includes('áp lực') || norm.includes('lo lắng') || norm.includes('stress') || norm.includes('hoảng')) {
    return `💙 Cảm ơn em đã chia sẻ. Áp lực trước kỳ thi là phản ứng bình thường của não bộ.\n\n🧘 **3 kỹ thuật giảm lo âu tức thì:**\n• **Thở 4-7-8:** Hít vào 4s → Nín 7s → Thở ra 8s. Lặp 3 lần.\n• **Kỹ thuật 5-4-3-2-1:** Nhìn 5 thứ, nghe 4 âm thanh, chạm 3 bề mặt.\n• **"Hộp lo lắng":** Viết nỗi lo ra giấy, gấp lại, đặt sang một bên.\n\nEm đang lo nhất về điều gì?`;
  }
  if (norm.includes('mệt') || norm.includes('kiệt sức') || norm.includes('mất ngủ') || norm.includes('burnout')) {
    return `😴 Kiệt sức là tín hiệu cơ thể cần nạp lại năng lượng, không phải yếu đuối.\n\n⚡ **Phục hồi nhanh:**\n• Ngủ đủ 7–8h, ngủ trước 23h\n• Nghỉ 10 phút sau mỗi 50 phút học (Pomodoro)\n• Uống đủ 1.5–2 lít nước/ngày\n\n${gpaVal >= 8.5 ? `GPA ${gpaVal} của em rất xuất sắc – em xứng đáng được nghỉ ngơi! 🌟` : `Hãy ôn theo thứ tự ưu tiên môn yếu trước nhé.`}\n\nEm có muốn thầy giúp lập lịch ôn thi không?`;
  }
  if (norm.includes('buồn') || norm.includes('cô đơn') || norm.includes('khóc') || norm.includes('chán nản')) {
    return `🤗 Được phép buồn – điều đó cho thấy em đang cảm nhận cuộc sống sâu sắc.\n\n💜 **Nâng tinh thần:**\n• Ghi lại 3 điều biết ơn mỗi tối\n• Nói chuyện với người bạn tin tưởng\n• Vận động 20 phút/ngày – não tiết Endorphin tự nhiên\n\n*"Giữa kích thích và phản ứng có một khoảng không gian – trong đó là sức mạnh của ta."* – Viktor Frankl\n\nEm muốn chia sẻ thêm không? Thầy không vội đâu.`;
  }
  if (norm.includes('riasec') || norm.includes('chọn ngành') || norm.includes('hướng nghiệp') || norm.includes('ngành nào') || norm.includes('đại học') || norm.includes('tương lai')) {
    const entries = Object.entries(currentScores).filter(([k]) => ['R','I','A','S','E','C'].includes(k));
    entries.sort((a, b) => b[1] - a[1]);
    const [top1, top2] = entries;
    const codeMap = {
      'RI': 'Kỹ sư AI/Robotics, Kỹ sư phần mềm nhúng',
      'IA': 'Nhà khoa học dữ liệu, Thiết kế UX/UI',
      'IS': 'Bác sĩ nội khoa, Nhà tâm lý học lâm sàng',
      'AS': 'Nhà giáo dục sáng tạo, Designer trải nghiệm',
      'SE': 'Quản lý nhân sự, Chuyên gia phát triển cộng đồng',
      'EC': 'Giám đốc tài chính, Luật sư doanh nghiệp',
      'IR': 'Kỹ sư R&D, Chuyên gia an ninh mạng',
      'EA': 'Đạo diễn sáng tạo, Marketing chiến lược',
    };
    const code = `${top1?.[0] || 'I'}${top2?.[0] || 'A'}`;
    return `🧭 **Hướng nghiệp cá nhân hóa cho ${studentName}:**\n\nMã RIASEC nổi bật: **${code}** (${top1?.[1]}/5 và ${top2?.[1]}/5)\n\n🎯 **Ngành nghề gợi ý:** ${codeMap[code] || 'Nhiều lĩnh vực đa dạng'}\n\n💡 Với GPA **${gpaVal}**, em ${gpaVal >= 9 ? 'có thể xét tuyển thẳng TOP đầu!' : gpaVal >= 8 ? 'an toàn cho các trường tốp đầu' : 'nên tập trung ôn luyện cải thiện điểm số'}.\n\nEm muốn tìm hiểu thêm về ngành nào?`;
  }
  if (norm.includes('học') || norm.includes('ôn') || norm.includes('thi') || norm.includes('điểm') || norm.includes('môn')) {
    return `📚 **Kế hoạch ôn thi thông minh:**\n\n⏰ **Lịch học tham khảo:**\n• Sáng (8–11h): Học bài mới – não hoạt động tốt nhất\n• Chiều (14–17h): Làm đề luyện tập\n• Tối (19–21:30h): Ôn tập & hệ thống kiến thức\n• 22h: Dừng học, ngủ trước 23h\n\n🧠 **Kỹ thuật siêu tốc:**\n• **Spaced Repetition**: Ôn sau 1 ngày, 3 ngày, 1 tuần\n• **Active Recall**: Tự hỏi trước khi mở sách\n• **Feynman**: Giải thích như đang dạy người khác\n\nEm đang gặp khó khăn ở môn nào?`;
  }
  if (norm.includes('bạn bè') || norm.includes('gia đình') || norm.includes('bố') || norm.includes('mẹ') || norm.includes('ba') || norm.includes('má') || norm.includes('mâu thuẫn')) {
    return `👥 Các mối quan hệ ảnh hưởng rất lớn đến tâm lý học tập.\n\n💬 **Thầy muốn chia sẻ:**\n• Xung đột là bình thường – quan trọng là cách xử lý\n• Dùng "Thông điệp Tôi": "Tôi cảm thấy..." thay vì "Bạn làm tôi..."\n• Em có quyền tìm giáo viên tư vấn nếu bị áp lực\n\nMọi thông tin em chia sẻ đều được bảo mật. Em muốn kể thêm không?`;
  }
  if (norm.includes('không muốn học') || norm.includes('chán') || norm.includes('lười') || norm.includes('nản') || norm.includes('bỏ cuộc')) {
    return `🔥 Mất động lực là rất phổ biến – đặc biệt sau giai đoạn học căng thẳng.\n\n✨ **Khoa học về động lực:**\nNão cần 3 yếu tố: **Tự chủ** + **Thành thạo** + **Mục đích**\n\n🎯 **Thực hành ngay:**\n1. Viết ra lý do lớn nhất em muốn học tốt – dán nơi hay nhìn\n2. Đặt mục tiêu 25 phút (Pomodoro) – chỉ 25 phút thôi!\n3. Thưởng bản thân sau mỗi mục tiêu nhỏ\n\n*"Thành công đến từ việc hành động ngay cả khi không có hứng."*\n\nEm có thể kể ước mơ lớn nhất không?`;
  }
  if (norm.includes('xin chào') || norm.includes('hello') || norm.includes('chào thầy') || txt.length < 12) {
    return `👋 Chào ${studentName}! Thầy rất vui được gặp em.\n\nThầy có thể hỗ trợ về:\n• 😰 Căng thẳng & cảm xúc\n• 🎯 Hướng nghiệp & chọn ngành\n• 📚 Kế hoạch học tập\n• 💬 Kỹ năng sống\n\nCứ thoải mái chia sẻ nhé!`;
  }
  if (msgCount >= 3 && (norm.includes('cảm ơn') || norm.includes('ok') || norm.includes('hiểu rồi') || norm.includes('thanks'))) {
    return `😊 Thầy rất vui được đồng hành cùng ${studentName}!\n\nNhớ nhé:\n• Nghỉ ngơi đủ giấc là ĐẦU TƯ\n• Hỏi thầy cô khi cần – không ai giỏi một mình\n• Mỗi ngày 1% tiến bộ = 37 lần giỏi hơn sau 1 năm\n\nLuôn chào đón em quay lại! 💙`;
  }
  const fallbacks = [
    `💙 Thầy đang lắng nghe. Em có thể kể thêm cụ thể hơn không?\n• Chuyện này xảy ra từ bao giờ?\n• Em đã thử làm gì chưa?\n• Điều em mong muốn nhất lúc này là gì?`,
    `🤝 Thầy hiểu em. Em có muốn nói thêm về hoàn cảnh cụ thể không? Thầy sẽ cố gắng gợi ý phù hợp nhất cho ${studentName}.`,
    `✨ Điều này ảnh hưởng đến việc học hoặc cuộc sống hàng ngày của em như thế nào? Cứ nói thật lòng nhé, thầy không phán xét đâu.`
  ];
  return fallbacks[msgCount % fallbacks.length];
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function FloatingChatWidget() {
  const {
    currentRole,
    tutorChat, sendTutorMessage,
    students, selectedStudentId,
    careerTestScores
  } = useContext(AppContext);

  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('tutor'); // 'tutor' | 'counselor'
  const [unreadCount, setUnreadCount] = useState(0);

  // Tutor state
  const [tutorInput, setTutorInput] = useState('');
  const [tutorIsTyping, setTutorIsTyping] = useState(false);
  const tutorEndRef = useRef(null);

  // Active student lookups (must be safe if student list is empty or null)
  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];
  const studentName = student ? student.name.split(' ').pop() : 'bạn';
  
  const gradesArray = student?.grades ? Object.values(student.grades) : [];
  const gpaVal = student && gradesArray.length > 0
    ? parseFloat((gradesArray.reduce((a, b) => a + b, 0) / gradesArray.length).toFixed(1))
    : 8.0;
    
  const currentScores = careerTestScores?.find(s => s.studentId === student?.id) || { R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 };

  // Counselor state
  const [counselorInput, setCounselorInput] = useState('');
  const [counselorHistory, setCounselorHistory] = useState(() => [
    {
      sender: 'counselor',
      text: `👋 Chào ${studentName}! Thầy là chuyên gia tư vấn tâm lý học đường.\n\nEm có thể hỏi về căng thẳng thi cử, hướng nghiệp, kỹ năng học tập, hoặc bất kỳ điều gì em đang trăn trở. Thầy luôn ở đây! 💙`,
      timestamp: getTimestamp()
    }
  ]);
  const [counselorIsTyping, setCounselorIsTyping] = useState(false);
  const [counselorMsgCount, setCounselorMsgCount] = useState(0);
  const [counselorMood, setCounselorMood] = useState(null);
  const counselorEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    tutorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tutorChat, tutorIsTyping]);

  useEffect(() => {
    counselorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [counselorHistory, counselorIsTyping]);

  // Track unread when closed
  useEffect(() => {
    if (!isOpen && tutorChat.length > 0) {
      const lastMsg = tutorChat[tutorChat.length - 1];
      if (lastMsg.sender === 'tutor') {
        const timer = setTimeout(() => {
          setUnreadCount(c => c + 1);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [tutorChat, isOpen]);

  // Only render visual content for students
  if (currentRole !== 'student') return null;

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  // ── Tutor handlers ──────────────────────────────────────────────────────────
  const handleTutorSend = (e) => {
    e.preventDefault();
    if (!tutorInput.trim() || tutorIsTyping) return;
    setTutorIsTyping(true);
    sendTutorMessage(tutorInput.trim());
    setTutorInput('');
    setTimeout(() => setTutorIsTyping(false), 1400);
  };

  const handleTutorSuggestion = (s) => {
    setTutorIsTyping(true);
    sendTutorMessage(s);
    setTimeout(() => setTutorIsTyping(false), 1400);
  };

  const tutorSuggestions = [
    '📐 Giải tích phân lớp 12',
    '📖 Dàn ý Vợ Chồng A Phủ',
    '⚛️ Mạch RLC xoay chiều',
    '🧪 Kim loại kiềm + nước'
  ];

  // ── Counselor handlers ──────────────────────────────────────────────────────
  const handleCounselorSend = (e) => {
    e.preventDefault();
    const val = counselorInput.trim();
    if (!val || counselorIsTyping) return;

    setCounselorHistory(prev => [...prev, { sender: 'user', text: val, timestamp: getTimestamp() }]);
    setCounselorInput('');
    setCounselorIsTyping(true);
    const newCount = counselorMsgCount + 1;
    setCounselorMsgCount(newCount);

    const delay = 800 + Math.min(val.length * 16, 1800);
    setTimeout(() => {
      const reply = generateCounselorReply(val, newCount, studentName, gpaVal, currentScores);
      setCounselorHistory(prev => [...prev, { sender: 'counselor', text: reply, timestamp: getTimestamp() }]);
      setCounselorIsTyping(false);
    }, delay);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const popupW = 380;
  const popupH = isMinimized ? 56 : 540;

  return (
    <>
      {/* ── CSS keyframes injected inline ── */}
      <style>{`
        @keyframes widget-bounce-in {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          70% { transform: scale(1.05) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes widget-fab-pulse {
          0%, 100% { box-shadow: 0 8px 28px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.3); }
          50% { box-shadow: 0 8px 28px rgba(99,102,241,0.45), 0 0 0 10px rgba(99,102,241,0); }
        }
        @keyframes widget-dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .widget-tab-active { 
          background: white; 
          color: var(--accent-primary); 
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          font-weight: 700;
        }
        .widget-msg-user {
          align-self: flex-end;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border-radius: 16px 16px 4px 16px;
          box-shadow: 0 3px 10px rgba(99,102,241,0.3);
        }
        .widget-msg-bot {
          align-self: flex-start;
          background: white;
          color: #1e293b;
          border-radius: 4px 16px 16px 16px;
          border: 1px solid rgba(99,102,241,0.12);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .widget-msg-tutor {
          align-self: flex-start;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          border-radius: 4px 16px 16px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .widget-quick-chip:hover { background: rgba(99,102,241,0.12) !important; border-color: var(--accent-primary) !important; }
        .widget-mood-btn:hover { border-color: var(--accent-primary) !important; background: rgba(99,102,241,0.08) !important; }
      `}</style>

      {/* ── Floating Action Button ── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label="Mở trợ lý AI"
          style={{
            position: 'fixed', bottom: '28px', right: '28px', zIndex: 9998,
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'widget-fab-pulse 2.5s ease-in-out infinite',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Sparkles size={26} color="white" />
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: '#ef4444', color: 'white', borderRadius: '50%',
              width: '20px', height: '20px', fontSize: '0.7rem',
              fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white'
            }}>
              {unreadCount}
            </div>
          )}
        </button>
      )}

      {/* ── Popup Widget ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
            width: `${popupW}px`,
            height: `${popupH}px`,
            borderRadius: '20px',
            background: '#f8fafc',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(99,102,241,0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'widget-bounce-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
            border: '1px solid rgba(99,102,241,0.15)'
          }}
        >
          {/* ── Header ── */}
          <div style={{
            backgroundColor: '#4f46e5', // Solid fallback background color for WCAG checker compatibility
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '14px 16px', display: 'flex', alignItems: 'center',
            gap: '10px', flexShrink: 0
          }}>
            {/* Avatar */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              border: '1.5px solid rgba(255,255,255,0.35)'
            }}>
              <Sparkles size={18} color="white" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Trợ Lý Học Tập AI
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.95)' }}>
                  Đang trực tuyến • Chỉ dành cho học sinh
                </span>
              </div>
            </div>

            {/* Controls */}
            <button
              onClick={() => setIsMinimized(m => !m)}
              aria-label={isMinimized ? "Mở rộng cửa sổ chat" : "Thu nhỏ cửa sổ chat"}
              style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '8px', padding: '5px 7px', cursor: 'pointer', color: 'white' }}
            >
              {isMinimized ? <ChevronDown size={16} /> : <Minus size={16} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Đóng cửa sổ chat"
              style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '8px', padding: '5px 7px', cursor: 'pointer', color: 'white' }}
            >
              <X size={16} />
            </button>
          </div>

          {!isMinimized && (
            <>
              {/* ── Tab switcher ── */}
              <div style={{
                display: 'flex', padding: '10px 12px', gap: '6px',
                background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(99,102,241,0.1)',
                flexShrink: 0
              }}>
                {[
                  { id: 'tutor', label: '📚 Gia Sư AI', icon: BookOpen },
                  { id: 'counselor', label: '🧠 Tư Vấn Tâm Lý', icon: Heart }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={activeTab === tab.id ? 'widget-tab-active' : ''}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: '10px', border: 'none',
                      background: activeTab === tab.id ? 'white' : 'transparent',
                      color: activeTab === tab.id ? 'var(--accent-primary)' : '#64748b',
                      fontSize: '0.78rem', fontWeight: activeTab === tab.id ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ══ TUTOR TAB ══════════════════════════════════════════════════ */}
              {activeTab === 'tutor' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                  {/* Messages */}
                  <div style={{
                    flex: 1, overflowY: 'auto', padding: '14px 12px',
                    display: 'flex', flexDirection: 'column', gap: '10px'
                  }}>
                    {tutorChat.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 16px' }}>
                        <div style={{
                          width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 12px',
                          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Sparkles size={24} color="white" />
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                          Xin chào! Mình là <strong>Gia Sư AI 24/7</strong>.<br />
                          Hãy hỏi bất kỳ bài tập nào em cần nhé!
                        </p>
                        {/* Quick suggestions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px' }}>
                          {tutorSuggestions.map(s => (
                            <button
                              key={s}
                              onClick={() => handleTutorSuggestion(s)}
                              className="widget-quick-chip"
                              style={{
                                padding: '8px 12px', borderRadius: '99px', border: '1.5px solid rgba(99,102,241,0.25)',
                                background: 'rgba(99,102,241,0.05)', color: 'var(--accent-primary)',
                                fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                                textAlign: 'left', transition: 'all 0.15s'
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {tutorChat.map((msg, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: '3px' }}>
                        {msg.sender !== 'user' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingLeft: '2px' }}>
                            <div style={{
                              width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <Sparkles size={10} color="white" />
                            </div>
                            <span style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 600 }}>GIA SƯ AI</span>
                          </div>
                        )}
                        <div
                          className={msg.sender === 'user' ? 'widget-msg-user' : 'widget-msg-tutor'}
                          style={{ maxWidth: '88%', padding: '9px 13px', fontSize: '0.82rem', lineHeight: 1.55 }}
                        >
                          {msg.sender === 'tutor' ? formatTutorText(msg.text) : msg.text}
                        </div>
                      </div>
                    ))}

                    {tutorIsTyping && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Sparkles size={10} color="white" />
                        </div>
                        <div style={{
                          padding: '9px 14px', borderRadius: '4px 14px 14px 14px',
                          background: '#1e293b', display: 'flex', gap: '4px', alignItems: 'center'
                        }}>
                          {[0,1,2].map(i => (
                            <div key={i} style={{
                              width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8',
                              animation: `widget-dot-bounce 1.1s ease-in-out ${i*0.18}s infinite`
                            }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={tutorEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleTutorSend} style={{
                    display: 'flex', gap: '8px', padding: '10px 12px',
                    borderTop: '1px solid rgba(99,102,241,0.1)', background: 'white', flexShrink: 0
                  }}>
                    <input
                      type="text"
                      value={tutorInput}
                      onChange={e => setTutorInput(e.target.value)}
                      disabled={tutorIsTyping}
                      placeholder={tutorIsTyping ? 'Gia sư đang soạn...' : 'Hỏi bất kỳ bài tập nào...'}
                      style={{
                        flex: 1, padding: '9px 14px', borderRadius: '12px', fontSize: '0.82rem',
                        border: '1.5px solid rgba(99,102,241,0.2)', background: '#f8fafc',
                        color: '#1e293b', outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={tutorIsTyping || !tutorInput.trim()}
                      aria-label="Gửi câu hỏi cho gia sư"
                      style={{
                        width: '38px', height: '38px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: (tutorIsTyping || !tutorInput.trim()) ? 0.45 : 1, flexShrink: 0
                      }}
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              )}

              {/* ══ COUNSELOR TAB ═══════════════════════════════════════════════ */}
              {activeTab === 'counselor' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                  {/* Mood bar */}
                  <div style={{
                    padding: '8px 12px', borderBottom: '1px solid rgba(99,102,241,0.08)',
                    background: 'rgba(99,102,241,0.03)', flexShrink: 0
                  }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', margin: '0 0 6px 0' }}>
                      🌡️ Hôm nay em cảm thấy thế nào?
                    </p>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'great', emoji: '😄', label: 'Tuyệt' },
                        { id: 'okay', emoji: '🙂', label: 'Ổn' },
                        { id: 'stressed', emoji: '😰', label: 'Căng' },
                        { id: 'sad', emoji: '😢', label: 'Buồn' },
                        { id: 'tired', emoji: '😴', label: 'Mệt' }
                      ].map(m => (
                        <button
                          key={m.id}
                          className="widget-mood-btn"
                          onClick={() => {
                            setCounselorMood(m.id);
                            setCounselorInput(`Em đang cảm thấy ${m.label.toLowerCase()} hôm nay`);
                          }}
                          style={{
                            padding: '4px 8px', borderRadius: '99px', border: '1.5px solid',
                            borderColor: counselorMood === m.id ? 'var(--accent-primary)' : 'rgba(99,102,241,0.2)',
                            background: counselorMood === m.id ? 'rgba(99,102,241,0.1)' : 'white',
                            color: counselorMood === m.id ? 'var(--accent-primary)' : '#64748b',
                            fontSize: '0.7rem', fontWeight: counselorMood === m.id ? 700 : 500,
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          {m.emoji} {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{
                    flex: 1, overflowY: 'auto', padding: '12px',
                    display: 'flex', flexDirection: 'column', gap: '10px'
                  }}>
                    {counselorHistory.map((m, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start', gap: '3px' }}>
                        {m.sender !== 'user' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingLeft: '2px' }}>
                            <div style={{
                              width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <Heart size={9} color="white" />
                            </div>
                            <span style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 600 }}>TƯ VẤN AI</span>
                          </div>
                        )}
                        <div
                          className={m.sender === 'user' ? 'widget-msg-user' : 'widget-msg-bot'}
                          style={{ maxWidth: '88%', padding: '9px 13px', fontSize: '0.82rem', lineHeight: 1.55, whiteSpace: 'pre-line' }}
                        >
                          {m.text}
                        </div>
                        {m.timestamp && (
                          <span style={{ fontSize: '0.62rem', color: '#cbd5e1', paddingLeft: m.sender !== 'user' ? '2px' : 0 }}>
                            {new Date(m.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ))}

                    {counselorIsTyping && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Heart size={9} color="white" />
                        </div>
                        <div style={{
                          padding: '9px 14px', borderRadius: '4px 14px 14px 14px',
                          background: 'white', border: '1px solid rgba(99,102,241,0.12)',
                          display: 'flex', gap: '4px', alignItems: 'center'
                        }}>
                          {[0,1,2].map(i => (
                            <div key={i} style={{
                              width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1',
                              animation: `widget-dot-bounce 1.1s ease-in-out ${i*0.18}s infinite`
                            }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick replies (first time) */}
                    {counselorMsgCount === 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                        {[
                          'Tôi đang bị áp lực thi cử 😰',
                          'Tôi muốn tư vấn hướng nghiệp RIASEC',
                          'Tôi cảm thấy mệt và mất động lực'
                        ].map(q => (
                          <button
                            key={q}
                            onClick={() => setCounselorInput(q)}
                            className="widget-quick-chip"
                            style={{
                              padding: '7px 11px', borderRadius: '99px', border: '1.5px solid rgba(99,102,241,0.25)',
                              background: 'rgba(99,102,241,0.05)', color: 'var(--accent-primary)',
                              fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer',
                              textAlign: 'left', transition: 'all 0.15s'
                            }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                    <div ref={counselorEndRef} />
                  </div>

                  {/* Input */}
                  <div style={{ flexShrink: 0 }}>
                    <form onSubmit={handleCounselorSend} style={{
                      display: 'flex', gap: '8px', padding: '10px 12px',
                      borderTop: '1px solid rgba(99,102,241,0.1)', background: 'white'
                    }}>
                      <input
                        type="text"
                        value={counselorInput}
                        onChange={e => setCounselorInput(e.target.value)}
                        disabled={counselorIsTyping}
                        placeholder={counselorIsTyping ? 'Thầy đang trả lời...' : 'Chia sẻ với thầy...'}
                        style={{
                          flex: 1, padding: '9px 14px', borderRadius: '12px', fontSize: '0.82rem',
                          border: '1.5px solid rgba(99,102,241,0.2)', background: '#f8fafc',
                          color: '#1e293b', outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={counselorIsTyping || !counselorInput.trim()}
                        aria-label="Gửi tin nhắn cho tư vấn viên"
                        style={{
                          width: '38px', height: '38px', borderRadius: '12px', border: 'none',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: (counselorIsTyping || !counselorInput.trim()) ? 0.45 : 1, flexShrink: 0
                        }}
                      >
                        <Send size={15} />
                      </button>
                    </form>
                    <p style={{
                      margin: 0, padding: '4px 12px 8px',
                      fontSize: '0.62rem', color: '#cbd5e1', textAlign: 'center', background: 'white'
                    }}>
                      🔒 Bảo mật tuyệt đối • Khẩn cấp: <strong>1800 599 920</strong>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
