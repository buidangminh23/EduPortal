import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Send, Sparkles, MessageSquare } from 'lucide-react';

// ─── Lightweight LaTeX → HTML converter for common math notations ─────────────
function latexToHtml(latex) {
  let s = latex;
  s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '<span style="display:inline-block;text-align:center;vertical-align:middle"><span style="display:block;border-bottom:1px solid currentColor;padding:0 4px">$1</span><span style="display:block;padding:0 4px">$2</span></span>');
  s = s.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
  s = s.replace(/\\vec\{([^}]*)\}/g, '$1\u20D7');
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|lim|max|min|sup|inf)\b/g, '<span style="font-style:normal;font-weight:500">$1</span>');
  s = s.replace(/\\text\{([^}]*)\}/g, '<span style="font-style:normal">$1</span>');
  s = s.replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ').replace(/\\delta/g, 'δ');
  s = s.replace(/\\Delta/g, 'Δ').replace(/\\lambda/g, 'λ').replace(/\\omega/g, 'ω').replace(/\\pi/g, 'π');
  s = s.replace(/\\theta/g, 'θ').replace(/\\sigma/g, 'σ').replace(/\\mu/g, 'μ').replace(/\\phi/g, 'φ');
  s = s.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷');
  s = s.replace(/\\pm/g, '±').replace(/\\mp/g, '∓').replace(/\\neq/g, '≠');
  s = s.replace(/\\leq/g, '≤').replace(/\\geq/g, '≥').replace(/\\approx/g, '≈');
  s = s.replace(/\\Rightarrow/g, '⇒').replace(/\\rightarrow/g, '→').replace(/\\Leftarrow/g, '⇐');
  s = s.replace(/\\infty/g, '∞').replace(/\\quad/g, '  ').replace(/\\qquad/g, '    ');
  s = s.replace(/\\in/g, '∈').replace(/\\subset/g, '⊂').replace(/\\cup/g, '∪').replace(/\\cap/g, '∩');
  s = s.replace(/\\int/g, '∫').replace(/\\sum/g, '∑').replace(/\\prod/g, '∏');
  s = s.replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>');
  s = s.replace(/\^([0-9a-zA-Z])/g, '<sup>$1</sup>');
  s = s.replace(/_([0-9a-zA-Z])/g, '<sub>$1</sub>');
  s = s.replace(/\\mathbb\{R\}/g, 'ℝ').replace(/\\mathbb\{Z\}/g, 'ℤ').replace(/\\mathbb\{N\}/g, 'ℕ').replace(/\\mathbb\{Q\}/g, 'ℚ');
  s = s.replace(/log<sub>([^<]*)<\/sub>/g, 'log<sub>$1</sub>');
  s = s.replace(/\\,/g, ' ').replace(/\\;/g, ' ').replace(/\\ /g, ' ');
  return s;
}

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
    let formatted = msgText
      .replace(/### (.*?)\n/g, '<h4 style="color:var(--accent-primary); margin-top:8px; margin-bottom:6px; font-weight:700;">$1</h4>')
      .replace(/#### (.*?)\n/g, '<h5 style="color:var(--accent-primary); margin-top:6px; margin-bottom:4px; font-weight:600; font-size:0.95em;">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\$\$(.*?)\$\$/gs, (_, tex) => {
        return `<div style="background:rgba(99,102,241,0.08); padding:10px 14px; border-radius:8px; font-family:'Cambria Math','STIX Two Math',serif; margin:6px 0; font-size:1.05em; line-height:1.6; letter-spacing:0.3px">${latexToHtml(tex)}</div>`;
      })
      .replace(/\$([^$]+)\$/g, (_, tex) => {
        return `<code style="background:rgba(99,102,241,0.1); padding:2px 5px; border-radius:4px; font-family:'Cambria Math','STIX Two Math',serif; font-size:0.95em">${latexToHtml(tex)}</code>`;
      })
      .replace(/^-\s(.*?)(?:\n|$)/gm, '<li style="margin-left:14px; margin-bottom:4px;">$1</li>')
      .replace(/\n/g, '<br/>');
    
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
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
