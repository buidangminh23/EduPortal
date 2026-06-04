import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  Hand, 
  PhoneOff, 
  BookOpen, 
  Plus,
  Send,
  RotateCcw,
  Eraser
} from 'lucide-react';

export default function EduMeet() {
  const { currentRole, selectedStudentId, students } = useContext(AppContext);
  const activeStudent = students ? (students.find(s => s.id === selectedStudentId) || students[0]) : null;

  const [inCall, setInCall] = useState(false);
  
  // Media controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  
  // Tabs & panels
  const [activePanel, setActivePanel] = useState('chat'); // chat, whiteboard, polls
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // WebRTC User Video stream
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Whiteboard canvas refs
  const whiteboardCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  // Polls state
  const [polls, setPolls] = useState([
    { 
      question: 'Các em đã hiểu chuyên đề Tích phân này chưa?', 
      options: [
        { text: 'Đã hiểu rõ', votes: 2 },
        { text: 'Cần hướng dẫn lại', votes: 1 }
      ],
      active: true 
    }
  ]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOpt1, setNewPollOpt1] = useState('');
  const [newPollOpt2, setNewPollOpt2] = useState('');

  // Get name for meeting label
  const getUserNameLabel = () => {
    if (currentRole === 'teacher') return 'Thầy Nguyễn Minh Triết (Giáo viên)';
    return `${activeStudent ? activeStudent.name : 'Học sinh'} (Học sinh)`;
  };

  // Launch camera stream when call starts
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Không mở được camera thật, sử dụng webcam giả lập:", err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleJoinCall = () => {
    setInCall(true);
    setChatMessages([
      { id: '1', sender: 'Hệ thống', text: 'Chào mừng bạn đến với lớp học ảo EduMeet. Cuộc trò chuyện được bảo mật.', system: true },
      { id: '2', sender: 'Lê Mai Chi', text: 'Em chào thầy ạ!', system: false },
      { id: '3', sender: 'Nguyễn Hoàng Nam', text: 'Thầy ơi hôm nay mình luyện đề nào thế ạ?', system: false }
    ]);
    if (camOn) {
      startCamera();
    }
  };

  const handleLeaveCall = () => {
    stopCamera();
    setInCall(false);
    setHandRaised(false);
    setScreenShare(false);
  };

  // Sync camera track with camOn state toggle
  useEffect(() => {
    if (inCall && stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = camOn;
      });
    }
    if (inCall && camOn && !stream) {
      const timer = setTimeout(() => {
        startCamera();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [camOn, inCall, stream]);

  // Sync mic track
  useEffect(() => {
    if (inCall && stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = micOn;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micOn, inCall]);

  // Clean up tracks when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bot chat generator simulator
  useEffect(() => {
    if (!inCall) return;
    const interval = setInterval(() => {
      const messages = [
        { sender: 'Lê Mai Chi', text: 'Thầy giảng lại khúc đặt u đi ạ.' },
        { sender: 'Phan Minh Triết', text: 'Bài này em làm ra đáp án C đúng không thầy?' },
        { sender: 'Nguyễn Hoàng Nam', text: 'Em vừa vote phiếu khảo sát rồi nha thầy ơi.' },
        { sender: 'Lê Mai Chi', text: 'Bảng vẽ trực quan quá thầy ơi!' }
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setChatMessages(prev => [...prev, {
        id: String(prev.length + 1),
        sender: randomMsg.sender,
        text: randomMsg.text,
        system: false
      }]);
    }, 15000); // Send bot message every 15s

    return () => clearInterval(interval);
  }, [inCall]);

  // Chat message send
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: String(prev.length + 1),
      sender: getUserNameLabel().split(' ')[0], // First name
      text: chatInput,
      system: false,
      self: true
    }]);
    
    // Simulate auto answer for polls or checkings if user asked
    const msgText = chatInput.toLowerCase();
    setChatInput('');

    if (msgText.includes('bảng') || msgText.includes('vẽ')) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: String(prev.length + 1),
          sender: 'Hệ thống',
          text: 'Giáo viên đã mở bảng vẽ tương tác, chuyển sang tab Bảng Vẽ để xem.',
          system: true
        }]);
      }, 1000);
    }
  };

  // Whiteboard drawing functions
  const startWhiteboardDrawing = (e) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = isEraser ? '#ffffff' : drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const whiteboardDraw = (e) => {
    if (!isDrawing) return;
    const canvas = whiteboardCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopWhiteboardDrawing = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Initialize whiteboard background as white
  useEffect(() => {
    if (activePanel === 'whiteboard' && whiteboardCanvasRef.current) {
      const canvas = whiteboardCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [activePanel]);

  // Poll management
  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!newPollQuestion.trim() || !newPollOpt1.trim()) return;
    
    const poll = {
      question: newPollQuestion,
      options: [
        { text: newPollOpt1, votes: 0 },
        { text: newPollOpt2 || 'Không đồng ý', votes: 0 }
      ],
      active: true
    };
    
    setPolls([poll, ...polls]);
    setNewPollQuestion('');
    setNewPollOpt1('');
    setNewPollOpt2('');
    
    // Simulate student votes after 3s
    setTimeout(() => {
      setPolls(prev => prev.map((p, idx) => {
        if (idx === 0) {
          return {
            ...p,
            options: p.options.map((opt, oIdx) => ({
              ...opt,
              votes: oIdx === 0 ? 3 : 1
            }))
          };
        }
        return p;
      }));
    }, 3000);
  };

  const votePoll = (pollIdx, optIdx) => {
    setPolls(prev => prev.map((p, pIdx) => {
      if (pIdx === pollIdx) {
        return {
          ...p,
          options: p.options.map((opt, oIdx) => {
            if (oIdx === optIdx) {
              return { ...opt, votes: opt.votes + 1 };
            }
            return opt;
          })
        };
      }
      return p;
    }));
  };

  return (
    <div className="animate-fade" style={{ height: 'calc(100vh - 120px)' }}>
      {!inCall ? (
        // Lobby view
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <Video size={40} />
            </div>
            <h2>EduMeet - Phòng Học Trực Tuyến</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              Hệ thống phòng học ảo Google Meet clone thế hệ mới. Tích hợp bảng vẽ tương tác thời gian thực, bảng bình chọn khảo sát thông minh và chat lớp học.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-card)', width: '100%', maxWidth: '440px', justifyContent: 'center' }}>
            <button 
              onClick={() => setMicOn(!micOn)} 
              className={`control-btn ${micOn ? 'active' : ''}`}
            >
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            
            <button 
              onClick={() => setCamOn(!camOn)} 
              className={`control-btn ${camOn ? 'active' : ''}`}
            >
              {camOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
          </div>

          <button onClick={handleJoinCall} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1.05rem', fontWeight: 600 }}>
            Tham gia phòng học
          </button>
        </div>
      ) : (
        // Call screen view
        <div className="meet-layout">
          {/* Main Stage: Videos / Whiteboard */}
          <div className="meet-stage">
            {activePanel === 'whiteboard' ? (
              // Whiteboard Stage
              <div className="whiteboard-container">
                <div className="whiteboard-tools">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BookOpen size={16} /> Bảng viết trực tuyến
                  </span>
                  
                  <div style={{ height: '20px', width: '1px', background: '#cbd5e1' }} />
                  
                  {/* Colors */}
                  {['#000000', '#2563eb', '#dc2626', '#16a34a'].map(col => (
                    <button 
                      key={col}
                      onClick={() => { setDrawColor(col); setIsEraser(false); }}
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        background: col, 
                        border: drawColor === col && !isEraser ? '2px solid #000' : '1px solid #fff',
                        cursor: 'pointer' 
                      }}
                    />
                  ))}

                  <div style={{ height: '20px', width: '1px', background: '#cbd5e1' }} />

                  {/* Eraser */}
                  <button 
                    onClick={() => setIsEraser(true)}
                    className={`btn ${isEraser ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '4px 8px', fontSize: '0.75rem', background: isEraser ? '#2563eb' : '#fff', color: isEraser ? '#fff' : '#000' }}
                  >
                    <Eraser size={12} />
                  </button>

                  {/* Brush Size */}
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={brushSize}
                    onChange={e => setBrushSize(parseInt(e.target.value))}
                    style={{ width: '60px' }}
                  />

                  {/* Clear board */}
                  <button 
                    onClick={clearWhiteboard}
                    className="btn btn-secondary"
                    style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '0.75rem', color: '#000' }}
                  >
                    <RotateCcw size={12} /> Xóa bảng
                  </button>
                </div>

                <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
                  <canvas
                    ref={whiteboardCanvasRef}
                    width={700}
                    height={400}
                    onMouseDown={startWhiteboardDrawing}
                    onMouseMove={whiteboardDraw}
                    onMouseUp={stopWhiteboardDrawing}
                    onMouseLeave={stopWhiteboardDrawing}
                    style={{ width: '100%', height: '100%', display: 'block', background: '#fff', cursor: 'crosshair' }}
                  />
                </div>
              </div>
            ) : (
              // Webcam Video Grid
              <div className="video-grid">
                {/* User Camera Card */}
                <div className={`video-card ${currentRole === 'teacher' ? 'active-speaker' : ''}`}>
                  {camOn ? (
                    <video ref={localVideoRef} autoPlay playsInline muted />
                  ) : (
                    <div className="video-placeholder">
                      <div className="avatar" style={{ width: '70px', height: '70px', fontSize: '1.8rem' }}>
                        {getUserNameLabel().charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Camera đang tắt</span>
                    </div>
                  )}
                  <span className="user-name-tag">BẠN ({getUserNameLabel().split(' ')[0]})</span>
                </div>

                {/* Peer Student 1 */}
                <div className="video-card">
                  <div className="video-placeholder">
                    <div className="avatar" style={{ width: '70px', height: '70px', fontSize: '1.8rem', background: '#059669' }}>C</div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Camera đang tắt</span>
                  </div>
                  <span className="user-name-tag">Lê Mai Chi</span>
                </div>

                {/* Peer Student 2 */}
                <div className={`video-card ${currentRole !== 'teacher' ? 'active-speaker' : ''}`}>
                  <div className="video-placeholder">
                    <div className="avatar" style={{ width: '70px', height: '70px', fontSize: '1.8rem', background: '#d97706' }}>N</div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Camera đang tắt</span>
                  </div>
                  <span className="user-name-tag">Nguyễn Hoàng Nam</span>
                </div>
              </div>
            )}

            {/* Meet Controls Panel */}
            <div className="meet-controls">
              <button 
                onClick={() => setMicOn(!micOn)} 
                className={`control-btn ${micOn ? 'active' : ''}`}
                title="Bật/Tắt Mic"
              >
                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <button 
                onClick={() => setCamOn(!camOn)} 
                className={`control-btn ${camOn ? 'active' : ''}`}
                title="Bật/Tắt Camera"
              >
                {camOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              <button 
                onClick={() => setScreenShare(!screenShare)} 
                className={`control-btn ${screenShare ? 'active' : ''}`}
                title="Trình chiếu màn hình"
              >
                <Monitor size={18} />
              </button>

              <button 
                onClick={() => setHandRaised(!handRaised)} 
                className={`control-btn ${handRaised ? 'active' : ''}`}
                title="Giơ tay phát biểu"
              >
                <Hand size={18} />
              </button>

              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

              <button 
                onClick={handleLeaveCall} 
                className="control-btn danger"
                title="Rời cuộc gọi"
              >
                <PhoneOff size={18} />
              </button>
            </div>
          </div>

          {/* Right Panel: Chat / Whiteboard Toggle / Polls */}
          <div className="meet-sidebar glass-panel" style={{ height: '100%', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div className="tabs-container" style={{ marginBottom: '16px', paddingBottom: '4px' }}>
              <button onClick={() => setActivePanel('chat')} className={`tab-btn ${activePanel === 'chat' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Chat ({chatMessages.filter(c => !c.system).length})
              </button>
              <button onClick={() => setActivePanel('whiteboard')} className={`tab-btn ${activePanel === 'whiteboard' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Bảng viết
              </button>
              <button onClick={() => setActivePanel('polls')} className={`tab-btn ${activePanel === 'polls' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Khảo sát ({polls.length})
              </button>
            </div>

            {/* Chat Pane */}
            {activePanel === 'chat' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)' }}>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {chatMessages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      {msg.system ? (
                        <div style={{ alignSelf: 'center', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', margin: '4px 0' }}>
                          {msg.text}
                        </div>
                      ) : (
                        <div style={{ 
                          alignSelf: msg.self ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          background: msg.self ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          margin: '2px 0'
                        }}>
                          <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 600, marginBottom: '2px' }}>{msg.sender}</div>
                          <div style={{ fontSize: '0.85rem' }}>{msg.text}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập tin nhắn..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}><Send size={14} /></button>
                </form>
              </div>
            )}

            {/* Whiteboard Side Info */}
            {activePanel === 'whiteboard' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <h4 style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}>Bảng Trực Tuyến</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Bảng viết vẽ trực tiếp được kết nối đồng bộ. 
                  Giáo viên có thể viết công thức, vẽ đồ thị hoặc chữa bài tập. Học sinh có thể thảo luận và quan sát theo thời gian thực.
                </p>
                <div style={{ marginTop: '20px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mẹo sử dụng:</span>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '14px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>Chọn màu khác để phân biệt bài giải.</li>
                    <li>Sử dụng thanh kéo để chỉnh độ dày mỏng nét vẽ.</li>
                    <li>Có thể nhấn nút "Xóa bảng" để làm sạch.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Polls Pane */}
            {activePanel === 'polls' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)', overflowY: 'auto' }}>
                {/* Creator (Only for Teacher/Admin) */}
                {(currentRole === 'teacher' || currentRole === 'admin') && (
                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', border: '1px solid var(--border-card)', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={14} /> Tạo khảo sát mới
                    </h4>
                    <form onSubmit={handleCreatePoll}>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Câu hỏi khảo sát?"
                          value={newPollQuestion}
                          onChange={e => setNewPollQuestion(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Lựa chọn 1 (VD: Đã hiểu)"
                          value={newPollOpt1}
                          onChange={e => setNewPollOpt1(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Lựa chọn 2 (VD: Chưa hiểu)"
                          value={newPollOpt2}
                          onChange={e => setNewPollOpt2(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '6px 12px', fontSize: '0.8rem' }}>Phát động bình chọn</button>
                    </form>
                  </div>
                )}

                {/* Poll List */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {polls.map((poll, pollIdx) => {
                    const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
                    return (
                      <div key={pollIdx} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{poll.question}</div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {poll.options.map((opt, optIdx) => {
                            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                            return (
                              <div 
                                key={optIdx} 
                                onClick={() => votePoll(pollIdx, optIdx)}
                                style={{ 
                                  position: 'relative', 
                                  padding: '8px 12px', 
                                  borderRadius: '6px', 
                                  background: 'rgba(255,255,255,0.04)', 
                                  cursor: 'pointer', 
                                  overflow: 'hidden',
                                  border: '1px solid rgba(255,255,255,0.02)'
                                }}
                              >
                                {/* Fill bar */}
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--accent-primary-glow)', zIndex: 1, transition: 'width 0.5s ease' }}></div>
                                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500 }}>
                                  <span>{opt.text}</span>
                                  <span>{opt.votes} vote ({pct}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
