import { useState, useRef, useEffect } from 'react';
import { Send, Bot, RefreshCw } from 'lucide-react';
import { resolveTutorResponse } from '../../../lib/tutor/resolve';
import { GDPT2018_BASE_KNOWLEDGE } from '../../../data/gdpt2018BaseKnowledge';
import { formatTutorText } from '../../../lib/tutor/formatText';
import { formatFocusedResponse } from '../../../lib/tutor/intentFocalizer';

export default function TestPanel({ 
  entries = [], 
  presets = [], 
  selectedPresetId, 
  tone 
}) {
  const [messages, setMessages] = useState([
    { sender: 'tutor', text: 'Chào thầy/cô! Em là Gia sư AI thử nghiệm. Hãy thử nhập câu hỏi liên quan đến kiến thức đã soạn để kiểm tra cách em phản hồi.' }
  ]);
  const [input, setInput] = useState('');
  
  // Track active Socratic step-by-step guidance sandbox state
  const [activeExercise, setActiveExercise] = useState(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activePreset = presets.find(p => p.id === selectedPresetId) || { name: 'Gợi mở từng bước' };

  const handleReset = () => {
    setMessages([
      { sender: 'tutor', text: 'Đã thiết lập lại cuộc trò chuyện thử nghiệm. Hãy gửi câu hỏi mới để bắt đầu.' }
    ]);
    setActiveExercise(null);
    setCurrentStepIdx(0);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');

    setTimeout(() => {
      let replyText = '';

      // If we are currently in a Socratic dialogue, check student response
      if (activePreset.name === 'Gợi mở từng bước' && activeExercise) {
        const nextStepIdx = currentStepIdx + 1;
        if (nextStepIdx < activeExercise.steps.length) {
          const nextStep = activeExercise.steps[nextStepIdx];
          replyText = `### 🌟 Phản hồi đúng bước trước!\n\n**Gợi mở bước tiếp theo (${nextStep.n}/${activeExercise.steps.length}):**\n\n${nextStep.content}\n\n*Gợi ý:* ${nextStep.hint || 'Bạn hãy thử suy nghĩ xem.'}`;
          setCurrentStepIdx(nextStepIdx);
        } else {
          replyText = `### 🎉 Tuyệt vời!\n\nBạn đã hoàn thành tất cả các bước của bài toán.\n\n**Đáp án cuối cùng:** $${activeExercise.answer}$$\n\nChúc mừng bạn!`;
          setActiveExercise(null);
          setCurrentStepIdx(0);
        }
        setMessages(prev => [...prev, { sender: 'tutor', text: replyText }]);
        return;
      }

      // Check for trigger matches across 3 layers (Teacher -> Group -> GDPT 2018 Base)
      const resolution = resolveTutorResponse(userText, {
        teacherEntries: entries,
        groupEntries: [],
        baseEntries: GDPT2018_BASE_KNOWLEDGE
      });
      const matchedEntry = resolution.entry;

      if (matchedEntry) {
        replyText = formatFocusedResponse(userText, matchedEntry, activePreset.name, tone);
      } else {
        // Guardrail: Do not fabricate answers
        replyText = `### ⚠️ Thông báo từ Gia sư AI:\n\nEm chưa được huấn luyện về từ khóa **"${userText}"** trong chuyên đề môn học này.\n\n*Giáo viên sẽ nhận được thông tin câu hỏi này để cập nhật thêm vào kho kiến thức.*`;
      }

      setMessages(prev => [...prev, { sender: 'tutor', text: replyText }]);
    }, 1000);
  };

  return (
    <div 
      className="card" 
      style={{ 
        height: 520, 
        padding: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        background: '#fff', 
        border: '1px solid rgba(148,163,184,0.18)', 
        overflow: 'hidden' 
      }}
    >
      {/* Sandbox Header */}
      <div 
        style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid rgba(148,163,184,0.15)', 
          background: 'rgba(0,0,0,0.01)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>Sandbox Thử Nghiệm Gia Sư</span>
        </div>
        <button
          onClick={handleReset}
          className="btn"
          style={{ padding: '4px 10px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, height: 'auto', background: 'transparent' }}
          title="Làm mới cuộc hội thoại"
        >
          <RefreshCw size={12} /> Reset Chat
        </button>
      </div>

      {/* Preset indicator */}
      <div style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.04)', borderBottom: '1px dashed rgba(148,163,184,0.1)', fontSize: 11, color: 'var(--text-secondary)' }}>
        Đang giả lập phương pháp: <strong>{activePreset.name}</strong> · Giọng điệu: <strong>{tone === 'than_mat' ? 'Thân mật' : tone === 'nghiem_tuc' ? 'Nghiêm túc' : 'Trung tính'}</strong>
      </div>

      {/* Messages Window */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            style={{ 
              display: 'flex', 
              gap: 8, 
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%' 
            }}
          >
            {m.sender === 'tutor' && (
              <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Bot size={15} />
              </div>
            )}
            <div 
              style={{ 
                padding: '10px 14px', 
                borderRadius: 12, 
                fontSize: 13, 
                lineHeight: 1.5,
                background: m.sender === 'user' ? 'var(--accent, #3b82f6)' : 'rgba(0,0,0,0.03)',
                color: m.sender === 'user' ? '#fff' : 'var(--text-primary)',
                border: m.sender === 'tutor' ? '1px solid rgba(148,163,184,0.1)' : 'none'
              }}
            >
              {m.sender === 'tutor' ? formatTutorText(m.text) : m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid rgba(148,163,184,0.15)', padding: 10, background: '#fff' }}>
        <input
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Nhập câu hỏi test thử (ví dụ: 'tich phan')..."
          style={{ flex: 1, height: 38, fontSize: 13, marginRight: 8 }}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ width: 38, height: 38, padding: 0, display: 'grid', placeItems: 'center', borderRadius: 8 }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
