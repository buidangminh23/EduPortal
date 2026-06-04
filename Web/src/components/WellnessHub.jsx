import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Heart, Smile, Sparkles, Send, Calendar 
} from 'lucide-react';

const MOOD_EMOJIS = {
  happy: { emoji: '😊', label: 'Vui vẻ', color: '#10b981' },
  tired: { emoji: '😴', label: 'Mệt mỏi', color: '#f59e0b' },
  anxious: { emoji: '😰', label: 'Lo lắng', color: '#8b5cf6' },
  stressed: { emoji: '😫', label: 'Căng thẳng', color: '#ef4444' }
};

export default function WellnessHub() {
  const {
    currentRole,
    selectedStudentId,
    students,
    wellnessLogs,
    wellnessAppointments,
    logWellnessMood,
    requestCounseling
  } = useContext(AppContext);

  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];
  
  // Stress Log Form
  const [stressLevel, setStressLevel] = useState(5);
  const [mood, setMood] = useState('happy');
  const [notes, setNotes] = useState('');

  // Counseling Form
  const [counselingDate, setCounselingDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 - 09:45');
  const [appointmentReason, setAppointmentReason] = useState('');

  // AI Counselor Chat
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Xin chào bạn! Mình là AI Counselor học đường. Nếu bạn cảm thấy mệt mỏi, áp lực thi cử hoặc lo âu, cứ trò chuyện cùng mình nhé. Cuộc trò chuyện của chúng ta hoàn toàn bảo mật. 💜' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatBottomRef = useRef(null);

  const myLogs = (wellnessLogs || []).filter(l => l.studentId === student?.id);
  const myAppointments = (wellnessAppointments || []).filter(a => a.studentId === student?.id);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleMoodSubmit = (e) => {
    e.preventDefault();
    logWellnessMood(student?.id, stressLevel, mood, notes);
    setNotes('');
    alert('Đã ghi nhận chỉ số tâm trạng & stress hôm nay!');
  };

  const handleRequestCounseling = (e) => {
    e.preventDefault();
    if (!counselingDate) return;
    requestCounseling(student?.id, counselingDate, timeSlot, appointmentReason);
    setAppointmentReason('');
    alert('Đã gửi yêu cầu đặt lịch tham vấn tâm lý thành công!');
  };

  const handleChatSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setTyping(true);

    // Simulated comforting responses from counselor
    setTimeout(() => {
      let reply = 'Mình hiểu cảm giác này của bạn. Áp lực thi cử và chọn ngành học thực sự là một gánh nặng lớn. Bạn đã chia sẻ điều này với ai chưa?';
      if (userText.toLowerCase().includes('mệt') || userText.toLowerCase().includes('áp lực')) {
        reply = 'Bạn đang gánh vác rất nhiều kỳ vọng. Hãy nhớ nghỉ ngơi 5-10 phút giữa mỗi phiên tự học, và đừng quên uống đủ nước nhé. Bạn rất tuyệt vời vì đã nỗ lực nhiều đến thế.';
      } else if (userText.toLowerCase().includes('buồn') || userText.toLowerCase().includes('khóc')) {
        reply = 'Khóc không phải là yếu đuối, đó là cách cơ thể giải tỏa căng thẳng. Hãy nhắm mắt lại, hít một hơi thật sâu trong 4 giây, giữ 4 giây, thở ra 4 giây và lặp lại 3 lần nhé. Mình luôn ở đây.';
      } else if (userText.toLowerCase().includes('thi') || userText.toLowerCase().includes('đại học')) {
        reply = 'Kỳ thi đại học quan trọng, nhưng sức khỏe tâm lý của bạn mới là trên hết. Hãy thử lập kế hoạch Pomodoro 25 phút học, 5 phút nghỉ. Chia nhỏ mục tiêu ôn tập sẽ bớt ngợp hơn nhiều.';
      }
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      setTyping(false);
    }, 1200);
  };

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.3rem' }}>
          <Heart size={22} color="#ec4899" /> Cổng Tư Vấn Tâm Lý & AI Counselor
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Theo dõi tâm trạng, nhận chỉ dẫn giảm stress và đặt lịch tư vấn cùng thầy cô tâm lý học đường
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        
        {/* Left Column: Stress logger and appointments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Stress logger */}
          {currentRole === 'student' && (
            <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1rem', fontWeight: 700 }}>
                <Smile size={16} color="#8b5cf6" /> Ghi nhận tâm trạng hàng ngày
              </h3>

              <form onSubmit={handleMoodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Mood picker */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Tâm trạng hôm nay của bạn *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {Object.entries(MOOD_EMOJIS).map(([key, item]) => (
                      <button key={key} type="button" onClick={() => setMood(key)} style={{
                        flex: 1, padding: '10px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                        border: mood === key ? `2px solid ${item.color}` : '1px solid rgba(0,0,0,0.08)',
                        background: mood === key ? `${item.color}12` : 'white',
                      }}>
                        <div style={{ fontSize: '1.4rem' }}>{item.emoji}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: mood === key ? item.color : 'var(--text-secondary)' }}>{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stress slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mức độ căng thẳng / stress *</label>
                    <strong style={{ fontSize: '0.85rem', color: stressLevel >= 7 ? '#ef4444' : stressLevel >= 4 ? '#f59e0b' : '#10b981' }}>
                      {stressLevel}/10 ({stressLevel >= 7 ? 'Căng thẳng cao' : stressLevel >= 4 ? 'Trung bình' : 'Nhẹ nhàng'})
                    </strong>
                  </div>
                  <input type="range" min="1" max="10" value={stressLevel} onChange={e => setStressLevel(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#8b5cf6' }} />
                </div>

                {/* Short notes */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ghi chú nhanh (tùy chọn)</label>
                  <textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nhập lý do làm bạn stress hoặc điều gì làm bạn vui..." style={{ fontSize: '0.8rem', resize: 'none' }} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', fontSize: '0.82rem', padding: '8px 20px' }}>
                  Lưu tâm trạng
                </button>
              </form>
            </div>
          )}

          {/* Mood History list */}
          <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>Nhật ký tâm trạng</h3>
            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myLogs.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chưa có ghi nhận nhật ký nào.</p>
              ) : (
                myLogs.map(log => {
                  const moodItem = MOOD_EMOJIS[log.mood] || { emoji: '😐', label: 'Bình thường', color: '#6366f1' };
                  return (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '1.4rem' }}>{moodItem.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: moodItem.color }}>{moodItem.label} • Stress: {log.stressLevel}/10</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{log.date.split('-').reverse().join('/')}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.notes}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Consultation Request Form */}
          {currentRole === 'student' && (
            <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1rem', fontWeight: 700 }}>
                <Calendar size={16} color="#ec4899" /> Đăng ký tham vấn tâm lý học đường
              </h3>

              <form onSubmit={handleRequestCounseling} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Chọn ngày *</label>
                  <input type="date" className="form-control" value={counselingDate} min={new Date().toISOString().split('T')[0]} onChange={e => setCounselingDate(e.target.value)} required style={{ fontSize: '0.82rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Chọn ca trống *</label>
                  <select className="form-control" value={timeSlot} onChange={e => setTimeSlot(e.target.value)} style={{ fontSize: '0.82rem' }}>
                    <option value="09:00 - 09:45">Ca 1: 09:00 - 09:45 (Sáng)</option>
                    <option value="10:00 - 10:45">Ca 2: 10:00 - 10:45 (Sáng)</option>
                    <option value="14:00 - 14:45">Ca 3: 14:00 - 14:45 (Chiều)</option>
                    <option value="15:00 - 15:45">Ca 4: 15:00 - 15:45 (Chiều)</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nội dung cần tham vấn (Bảo mật) *</label>
                  <textarea className="form-control" rows={2} value={appointmentReason} onChange={e => setAppointmentReason(e.target.value)} placeholder="Tóm tắt áp lực của bạn (Áp lực học tập, Chọn khối thi học đại học, Quan hệ bạn bè...)" required style={{ fontSize: '0.8rem', resize: 'none' }} />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="submit" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '8px 20px' }}>
                    Đăng ký ca tham vấn
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Consultation Appointments list */}
          <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>Lịch tham vấn của bạn</h3>
            {myAppointments.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chưa đăng ký ca tham vấn nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myAppointments.map(app => (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.04)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.1rem' }}>👩‍⚕️</span>
                      <div>
                        <strong>Ca tư vấn ngày {app.date.split('-').reverse().join('/')}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Thời gian: {app.timeSlot} • Phòng tâm lý tầng 3</div>
                      </div>
                    </div>
                    <div>
                      {app.status === 'confirmed' ? (
                        <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>✓ Đã xác nhận</span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>⏳ Đợi duyệt</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Counselor Chat Bot */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border-card)', borderRadius: 24, overflow: 'hidden', height: 'calc(100vh - 160px)', minHeight: 480 }}>
          {/* Chat Header */}
          <div style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>AI Counselor Học Đường</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />Hỗ trợ 24/7 bảo mật</div>
            </div>
          </div>

          {/* Message List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => {
              const isAi = m.sender === 'ai';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isAi ? 'flex-start' : 'flex-end', gap: 8 }}>
                  {isAi && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', flexShrink: 0, alignSelf: 'flex-end' }}>
                      🤖
                    </div>
                  )}
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                    background: isAi ? '#f1f5f9' : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    color: isAi ? 'var(--text-primary)' : 'white',
                    fontSize: '0.82rem', lineHeight: 1.5
                  }}>
                    {m.text}
                  </div>
                </div>
              );
            })}
            
            {typing && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem' }}>
                  🤖
                </div>
                <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '16px', display: 'flex', gap: 4 }}>
                  <span className="typing-dot" style={{ width: 6, height: 6, background: '#a78bfa', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate' }} />
                  <span className="typing-dot" style={{ width: 6, height: 6, background: '#a78bfa', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate 0.2s' }} />
                  <span className="typing-dot" style={{ width: 6, height: 6, background: '#a78bfa', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate 0.4s' }} />
                </div>
                <style>{`
                  @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }
                `}</style>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSend} style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '12px 16px', display: 'flex', gap: 8 }}>
            <input className="form-control" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Hãy chia sẻ áp lực của bạn với AI Counselor..." style={{ flex: 1, borderRadius: 24, fontSize: '0.82rem', padding: '8px 14px' }} />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
