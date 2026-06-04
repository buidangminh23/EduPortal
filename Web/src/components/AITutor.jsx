import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Send, Sparkles, MessageSquare } from 'lucide-react';

export default function AITutor() {
  const { tutorChat, sendTutorMessage } = useContext(AppContext);
  const [text, setText] = useState('');
  const chatEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tutorChat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendTutorMessage(text);
    setText('');
  };

  const handleSuggestionClick = (suggestion) => {
    sendTutorMessage(suggestion);
  };

  // Helper function to format bot response text with basic markdown conversions
  const formatMessageText = (msgText) => {
    // Replace titles e.g. ### Title
    let formatted = msgText.replace(/### (.*?)\n/g, '<h4 style="color:var(--accent-primary); margin-top:8px; margin-bottom:6px; font-weight:700;">$1</h4>');
    
    // Replace bold e.g. **bold text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace equations e.g. $$equation$$
    formatted = formatted.replace(/\$\$(.*?)\$\$/g, '<div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px; font-family:monospace; margin:8px 0; overflow-x:auto;">$1</div>');
    
    // Replace inline formula e.g. $formula$
    formatted = formatted.replace(/\$(.*?)\$/g, '<code style="background:rgba(0,0,0,0.2); padding:2px 6px; border-radius:4px; font-family:monospace;">$1</code>');
    
    // Replace list bullets e.g. - list item
    formatted = formatted.replace(/-\s(.*?)\n/g, '<li style="margin-left:14px; margin-bottom:4px;">$1</li>');
    
    // Split by newlines and wrap in paragraphs
    return <div dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, '<br/>') }} />;
  };

  const suggestions = [
    'Giúp mình giải toán tích phân lớp 12',
    'Lập dàn ý bài Vợ Chồng A Phủ',
    'Công thức tính tổng trở mạch RLC nối tiếp',
    'Phản ứng kim loại kiềm tác dụng với nước'
  ];

  return (
    <div className="animate-fade tutor-layout">
      {/* Sidebar Suggestions */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
          <Sparkles size={18} color="var(--accent-primary)" />
          <span>Gia sư Trí Tuệ Nhân Tạo</span>
        </h2>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Gia sư AI 24/7 có thể giải bài tập, tóm tắt lý thuyết và kiểm tra kiến thức của bạn ngay lập tức.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gợi ý hỏi bài nhanh:</span>
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(sug)}
              className="btn btn-secondary"
              style={{ padding: '10px', fontSize: '0.8rem', textAlign: 'left', display: 'block', whiteSpace: 'normal', lineClamp: 2, height: 'auto' }}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="glass-panel chat-container-panel">
        {/* Chat Feed */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tutorChat.map((msg, idx) => (
            <div 
              key={idx} 
              className={`tutor-bubble ${msg.sender === 'tutor' ? 'tutor' : 'user'}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {msg.sender === 'tutor' ? (
                  <>
                    <Sparkles size={12} color="var(--accent-primary)" />
                    <strong>GIA SƯ AI 24/7</strong>
                  </>
                ) : (
                  <>
                    <MessageSquare size={12} />
                    <strong>BẠN</strong>
                  </>
                )}
              </div>
              <div>
                {msg.sender === 'tutor' ? formatMessageText(msg.text) : msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingRight: '60px', height: '50px' }}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Nhập câu hỏi bài tập của bạn (VD: Toán tích phân, Lý xoay chiều...)..."
            required
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ 
              position: 'absolute', 
              right: '6px', 
              top: '6px', 
              height: '38px', 
              width: '42px',
              padding: 0
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
