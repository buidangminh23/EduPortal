import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Send, Sparkles, MessageSquare, Paperclip, Image, Camera, X, FileText, CheckCircle2 } from 'lucide-react';

function latexToHtml(tex) {
  if (!tex) return '';
  return tex
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\int/g, '∫')
    .replace(/\\vec\{([^}]+)\}/g, 'vec($1)')
    .replace(/\\mathbf\{([^}]+)\}/g, '<b>$1</b>')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\omega/g, 'ω')
    .replace(/\\pi/g, 'π')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\uparrow/g, '↑')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\in/g, '∈')
    .replace(/\\mathbb\{Z\}/g, 'ℤ')
    .replace(/\\quad/g, '  ');
}

export default function AITutor() {
  const { tutorChat, sendTutorMessage } = useContext(AppContext);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null); // { name, type, dataUrl, isImage }
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tutorChat]);

  // Clean up camera stream on unmount or modal close
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type,
        dataUrl: reader.result,
        isImage: file.type.startsWith('image/')
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        setCameraStream(stream);
        setShowCameraModal(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } else {
        // Fallback for devices without webcam API support: trigger native camera capture input
        cameraInputRef.current?.click();
      }
    } catch (err) {
      console.warn('Camera access error, fallback to native file input:', err);
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setAttachment({
      name: `Photo_Homework_${Date.now().toString().slice(-4)}.jpg`,
      type: 'image/jpeg',
      dataUrl,
      isImage: true
    });
    stopCamera();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !attachment) return;

    sendTutorMessage(text, attachment);
    setText('');
    setAttachment(null);
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
    'Giúp mình giải bài toán hình không gian Oxyz',
    'Phân tích định lý Pitago và tam giác đồng dạng',
    'Giúp mình giải toán tích phân lớp 12',
    'Công thức tính tổng trở mạch RLC nối tiếp'
  ];

  return (
    <div className="animate-fade tutor-layout">
      {/* Hidden inputs for File and Mobile Camera */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*,.pdf,.doc,.docx,.txt" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        accept="image/*" 
        capture="environment" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />

      {/* Camera Live Capture Modal */}
      {showCameraModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '20px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.1rem' }}>
                <Camera size={20} color="var(--accent-primary)" />
                <span>Chụp ảnh đề bài / bài tập</span>
              </h3>
              <button onClick={stopCamera} className="btn btn-icon btn-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ width: '100%', height: '320px', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', border: '2px dashed rgba(255,255,255,0.6)', borderRadius: '8px', inset: '30px', pointerEvents: 'none' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={stopCamera} className="btn btn-secondary">
                Hủy
              </button>
              <button type="button" onClick={capturePhoto} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} />
                <span>Chụp ảnh này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Suggestions */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
          <Sparkles size={18} color="var(--accent-primary)" />
          <span>Gia sư Trí Tuệ Nhân Tạo</span>
        </h2>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Gia sư AI 24/7 có thể giải bài tập, quét nhận diện hình ảnh/file bài tập và kiểm tra kiến thức của bạn ngay lập tức.
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

              {/* Render Attached Image or File Badge in User Bubble */}
              {msg.attachment && (
                <div style={{ marginBottom: '10px' }}>
                  {msg.attachment.isImage ? (
                    <div style={{ borderRadius: '8px', overflow: 'hidden', maxWidth: '240px', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <img 
                        src={msg.attachment.dataUrl} 
                        alt="Hình ảnh bài tập" 
                        style={{ width: '100%', display: 'block', maxHeight: '200px', objectFit: 'cover' }} 
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <FileText size={16} />
                      <span style={{ fontWeight: 500 }}>{msg.attachment.name}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                {msg.sender === 'tutor' ? formatMessageText(msg.text) : (msg.text || (msg.attachment ? '*(Đã đính kèm tệp/hình ảnh)*' : ''))}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Attachment Preview Banner */}
        {attachment && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            marginBottom: '8px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px dashed var(--accent-primary)',
            borderRadius: '10px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              {attachment.isImage ? (
                <img src={attachment.dataUrl} alt="Preview" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
              ) : (
                <FileText size={22} color="var(--accent-primary)" />
              )}
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{attachment.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đã sẵn sàng tải lên và phân tích</div>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setAttachment(null)}
              className="btn btn-icon btn-secondary"
              style={{ padding: '4px', borderRadius: '50%', border: 'none', background: 'transparent' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              title="Chọn ảnh hoặc tệp từ máy (.jpg, .png, .pdf, .docx)"
              style={{ height: '44px', width: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Paperclip size={18} />
            </button>

            <button
              type="button"
              onClick={startCamera}
              className="btn btn-secondary"
              title="Chụp ảnh đề bài từ camera"
              style={{ height: '44px', width: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Camera size={18} />
            </button>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              style={{ paddingRight: '50px', height: '44px' }}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={attachment ? "Nhập thêm ghi chú/câu hỏi cho ảnh..." : "Nhập câu hỏi bài tập hoặc đính kèm ảnh chụp đề bài..."}
              required={!attachment}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ 
                position: 'absolute', 
                right: '4px', 
                top: '4px', 
                height: '36px', 
                width: '40px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

