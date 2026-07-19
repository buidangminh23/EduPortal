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
  Eraser,
  Sparkles,
  Radio,
  StopCircle,
  Download,
  BarChart3,
  Users
} from 'lucide-react';
import { createSignaling } from '../lib/edumeetSignaling';

function RemoteVideo({ stream }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

export default function EduMeet() {
  const { currentRole, selectedStudentId, students } = useContext(AppContext);
  const activeStudent = students ? (students.find(s => s.id === selectedStudentId) || students[0]) : null;

  const [inCall, setInCall] = useState(false);
  
  // Media controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [camFilter, setCamFilter] = useState('none');
  
  // Tabs & panels
  const [activePanel, setActivePanel] = useState('chat'); // chat, whiteboard, polls
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // WebRTC User Video stream
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const screenVideoRef = useRef(null);

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
  const reactionIdRef = useRef(0);

  // ── Ghi âm cuộc họp (MediaRecorder — chạy thật trên trình duyệt) ──
  const [recording, setRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [recordedSize, setRecordedSize] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  // ── AI tóm tắt (mô phỏng) + biểu đồ ──
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const chartRef = useRef(null);

  // ── Kết nối backend (AI + WebRTC signaling) ──
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';
  const WS_URL = SERVER_URL.replace(/^http/, 'ws');
  const streamRef = useRef(null);
  const recordedBlobRef = useRef(null);
  const signalRef = useRef(null);
  const [signalStatus, setSignalStatus] = useState('idle');
  const [signalPeers, setSignalPeers] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});

  // Web Audio API Sound Synthesizer for notifications
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'hand') {
        // Double notification ding
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'reaction') {
        // Pop sound
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (err) {
      console.warn("Web Audio API not allowed/supported:", err);
    }
  };

  const triggerReaction = (emoji) => {
    playSound('reaction');
    reactionIdRef.current += 1;
    const id = `reaction-${reactionIdRef.current}`;
    const style = {
      left: `${20 + ((reactionIdRef.current * 37) % 60)}%`,
    };
    setReactions(prev => [...prev, { id, emoji, style }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

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

  const startScreenShare = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(mediaStream);
      setScreenShare(true);
      
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare(mediaStream);
      };
      
      setTimeout(() => {
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.warn("Screen share cancelled or failed, falling back to mock:", err.message);
      setScreenShare(true);
    }
  };

  const stopScreenShare = (customStream = null) => {
    const activeStream = customStream || screenStream;
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
    }
    setScreenStream(null);
    setScreenShare(false);
  };

  const handleLeaveCall = () => {
    stopRecording();
    stopCamera();
    stopScreenShare();
    setInCall(false);
    setHandRaised(false);
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
      stopScreenShare();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Giữ streamRef luôn trỏ tới camera stream hiện tại (cho signaling addTrack)
  useEffect(() => { streamRef.current = stream; }, [stream]);

  // Kết nối WebRTC signaling khi vào phòng; ngắt khi rời
  useEffect(() => {
    if (!inCall) return;
    setSignalPeers([]);
    setRemoteStreams({});
    setSignalStatus('connecting');
    const sig = createSignaling({
      wsUrl: WS_URL,
      room: 'edumeet-lop12a1',
      getLocalStream: () => streamRef.current,
      handlers: {
        onStatus: (s) => setSignalStatus(s),
        onPeerPresence: (id, present) => setSignalPeers(prev => present ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter(p => p !== id)),
        onRemoteStream: (id, s) => {
          setRemoteStreams(prev => ({ ...prev, [id]: s }));
          setSignalPeers(prev => prev.includes(id) ? prev : [...prev, id]);
        },
        onPeerLeft: (id) => {
          setSignalPeers(prev => prev.filter(p => p !== id));
          setRemoteStreams(prev => { const n = { ...prev }; delete n[id]; return n; });
        }
      }
    });
    signalRef.current = sig;
    return () => { sig.close(); signalRef.current = null; setSignalStatus('idle'); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCall]);

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

  // ── Người tham gia (khung nhiều người; nối WebRTC signaling ở backend) ──
  const peerColors = ['#059669', '#d97706', '#2563eb', '#db2777', '#7c3aed', '#0891b2', '#ca8a04', '#dc2626'];
  const roster = (students && students.length) ? students : [
    { id: 'm1', name: 'Lê Mai Chi' }, { id: 'm2', name: 'Nguyễn Hoàng Nam' },
    { id: 'm3', name: 'Phan Minh Triết' }, { id: 'm4', name: 'Trần Thu Hà' }
  ];
  const peerParticipants = roster.slice(0, 8).map((s, i) => ({
    id: s.id || `p${i}`,
    name: s.name,
    micOn: i % 3 !== 0,
    handRaised: i === 2,
    color: peerColors[i % peerColors.length]
  }));

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const fmtSize = (b) => b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`;

  // Ghi âm — MediaRecorder chạy thật trên trình duyệt, file không gửi ra ngoài
  const startRecording = async () => {
    try {
      let recordStream = screenStream || stream;
      if (!recordStream) {
        recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      recordedChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '');
      const mr = new MediaRecorder(recordStream, mime ? { mimeType: mime } : undefined);
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recordedChunksRef.current[0]?.type || 'video/webm' });
        recordedBlobRef.current = blob;
        setRecordedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
        setRecordedSize(blob.size);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingSecs(0);
      recordTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch (err) {
      console.warn('Không ghi âm được:', err.message);
      alert('Không truy cập được micro/màn hình để ghi. Hãy cấp quyền rồi thử lại.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    setRecording(false);
  };

  const downloadRecording = (ext = 'webm') => {
    if (!recordedUrl) return;
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `cuoc-hop-edumeet-${recordingSecs}s.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  // AI tóm tắt — gọi backend /api/summarize (Whisper + Qwen nội bộ); lỗi/không có server thì fallback mô phỏng
  const generateSummary = async () => {
    setSummarizing(true);
    setSummary(null);
    const topPoll = polls[0];
    const total = topPoll ? topPoll.options.reduce((a, b) => a + b.votes, 0) : 0;
    const lead = (topPoll && total) ? [...topPoll.options].sort((a, b) => b.votes - a.votes)[0] : null;
    const mock = {
      topics: [
        'Ôn tập chuyên đề Tích phân và ứng dụng tính diện tích hình phẳng',
        'Chữa bài tập mẫu trên bảng viết trực tuyến',
        topPoll ? `Khảo sát mức độ hiểu bài: "${topPoll.question}"` : 'Thảo luận phương pháp giải'
      ],
      keyPoints: [
        lead ? `${Math.round((lead.votes / total) * 100)}% học sinh chọn "${lead.text}" ở khảo sát cuối giờ.` : 'Đa số học sinh nắm được ý chính của bài.',
        `${chatMessages.filter(c => !c.system).length} lượt trao đổi trong khung chat lớp.`,
        'Một số em cần hỗ trợ thêm phần đặt ẩn phụ khi tính tích phân.'
      ],
      actions: [
        'Giao 5 bài tập tự luyện ứng dụng tích phân cho buổi sau.',
        'Ghi chú các em cần phụ đạo để giáo viên bộ môn theo dõi.',
        'Chia sẻ bản ghi buổi học cho học sinh vắng mặt.'
      ]
    };
    try {
      let body;
      if (recordedBlobRef.current) {
        body = { audioBase64: await blobToBase64(recordedBlobRef.current) };
      } else {
        const transcript = [
          topPoll ? `Khảo sát: ${topPoll.question}` : '',
          ...chatMessages.filter(c => !c.system).map(c => `${c.sender}: ${c.text}`)
        ].filter(Boolean).join('\n');
        body = { transcript };
      }
      const res = await fetch(`${SERVER_URL}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('server');
      const data = await res.json();
      setSummary({
        duration: fmtTime(recordingSecs || 1800),
        source: data.simulated ? 'máy chủ (mô phỏng)' : `máy chủ · ${data.model || 'AI nội bộ'}`,
        topics: data.topics?.length ? data.topics : mock.topics,
        keyPoints: data.keyPoints?.length ? data.keyPoints : mock.keyPoints,
        actions: data.actions?.length ? data.actions : mock.actions
      });
    } catch {
      setSummary({ duration: fmtTime(recordingSecs || 1800), source: 'ngoại tuyến (mô phỏng)', ...mock });
    } finally {
      setSummarizing(false);
    }
  };

  // Biểu đồ số liệu cuộc họp (SVG thật, xuất được file)
  const meetingStats = () => {
    const chatCount = chatMessages.filter(c => !c.system).length;
    const pollVotes = polls.reduce((a, p) => a + p.options.reduce((x, o) => x + o.votes, 0), 0);
    return [
      { label: 'Tin nhắn', value: chatCount, color: '#6366f1' },
      { label: 'Vote', value: pollVotes, color: '#10b981' },
      { label: 'Người', value: peerParticipants.length + 1, color: '#f59e0b' },
      { label: 'Reaction', value: reactionIdRef.current, color: '#ec4899' },
      { label: 'Phút', value: Math.max(1, Math.round((recordingSecs || 1800) / 60)), color: '#0891b2' }
    ];
  };

  const exportChartSVG = () => {
    if (!chartRef.current) return;
    const src = new XMLSerializer().serializeToString(chartRef.current);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${src}`], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bieu-do-cuoc-hop.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade" style={{ height: 'calc(100vh - 120px)' }}>
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-40px) scale(1.2);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-360px) scale(0.9) rotate(15deg);
            opacity: 0;
          }
        }
        .reaction-menu {
          position: absolute;
          bottom: 56px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(30, 30, 36, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 6px 12px;
          display: flex;
          gap: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.35);
          z-index: 1000;
        }
        .reaction-emoji-btn {
          font-size: 1.35rem;
          background: none;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .reaction-emoji-btn:hover {
          transform: scale(1.35);
        }
        @keyframes recBlink { 50% { opacity: 0.3; } }
      `}</style>
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
          <div className="meet-stage" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Floating reactions overlay */}
            {reactions.map(r => (
              <span
                key={r.id}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  fontSize: '2.5rem',
                  zIndex: 100,
                  animation: 'floatUp 3s cubic-bezier(0.08, 0.82, 0.17, 1) forwards',
                  pointerEvents: 'none',
                  ...r.style
                }}
              >
                {r.emoji}
              </span>
            ))}

            {recording && (
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 120, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.92)', color: '#fff', padding: '5px 12px', borderRadius: 99, fontSize: '0.76rem', fontWeight: 700 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', animation: 'recBlink 1s infinite' }} /> REC {fmtTime(recordingSecs)}
              </div>
            )}
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 110, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(30,30,36,0.85)', color: '#fff', padding: '5px 11px', borderRadius: 99, fontSize: '0.74rem', fontWeight: 600 }}>
              <Users size={13} /> {peerParticipants.length + 1} người
            </div>
            <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 110, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(30,30,36,0.85)', color: signalStatus === 'connected' ? '#34d399' : '#fbbf24', padding: '4px 10px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 600 }}
              title="Trạng thái kết nối máy chủ signaling (video nhiều người thật)">
              ● Signaling: {signalStatus === 'connected' ? `${signalPeers.length} trực tuyến` : signalStatus === 'connecting' ? 'đang nối…' : signalStatus === 'error' || signalStatus === 'disconnected' ? 'chưa có server' : signalStatus}
            </div>

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
            ) : screenShare ? (
              /* Screen Share View */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#09090b', borderRadius: 12, overflow: 'hidden', border: '2.5px solid var(--accent-primary, #6366f1)', position: 'relative' }}>
                <div style={{ background: '#18181b', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Monitor size={14} /> Trình chiếu màn hình {screenStream ? 'thực tế' : 'giả lập'}
                  </span>
                  <button 
                    onClick={() => stopScreenShare()} 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.72rem', background: '#ef4444', color: 'white', border: 'none' }}
                  >
                    Dừng trình chiếu
                  </button>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20 }}>
                  {screenStream ? (
                    <video 
                      ref={screenVideoRef} 
                      autoPlay 
                      playsInline 
                      style={{ width: '100%', height: '100%', borderRadius: 8, background: '#000', objectFit: 'contain' }} 
                    />
                  ) : (
                    /* Slide Mockup */
                    <div style={{ background: '#1e1e24', width: '100%', height: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', color: '#f8fafc', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      <span style={{ fontSize: '1.25rem', color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Bài giảng Tích phân ôn tập HK2</span>
                      <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '14px 0', textAlign: 'center' }}>Chuyên đề III: Ứng dụng Tích phân tính diện tích</h1>
                      <p style={{ fontSize: '1rem', color: '#cbd5e1', maxWidth: '500px', textAlign: 'center', lineHeight: 1.5 }}>
                        Công thức tính diện tích hình phẳng giới hạn bởi đồ thị hàm số y = f(x), trục hoành và hai đường thẳng x=a, x=b:
                      </p>
                      <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '12px 24px', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: '20px 0' }}>
                        S = ∫ |f(x)| dx (từ a đến b)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Webcam Video Grid
              <div className="video-grid">
                {/* User Camera Card */}
                <div className={`video-card ${currentRole === 'teacher' ? 'active-speaker' : ''}`} style={{ position: 'relative' }}>
                  {/* Hand raise badge */}
                  {handRaised && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#10b981',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '99px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 0 12px rgba(16,185,129,0.5)',
                      zIndex: 10
                    }}>
                      <Hand size={12} fill="white" /> Đang phát biểu
                    </div>
                  )}

                  {/* Filter selector */}
                  <select
                    value={camFilter}
                    onChange={e => setCamFilter(e.target.value)}
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(30, 30, 36, 0.85)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      padding: '2px 4px',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                    title="Chọn bộ lọc camera"
                  >
                    <option value="none">Không bộ lọc</option>
                    <option value="grayscale">Trắng đen</option>
                    <option value="sepia">Hoài cổ</option>
                    <option value="dreamy">Mơ mộng</option>
                    <option value="warm">Ấm áp</option>
                  </select>

                  {camOn ? (
                    <video 
                      ref={localVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      style={{ 
                        width: '100%', height: '100%', objectFit: 'cover',
                        filter: camFilter === 'none' ? 'none' : camFilter === 'grayscale' ? 'grayscale(1)' : camFilter === 'sepia' ? 'sepia(0.8) hue-rotate(-10deg)' : camFilter === 'dreamy' ? 'brightness(1.1) saturate(1.2) contrast(0.9)' : 'sepia(0.2) saturate(1.4)' 
                      }} 
                    />
                  ) : (
                    <div className="video-placeholder" style={{
                      filter: camFilter === 'none' ? 'none' : camFilter === 'grayscale' ? 'grayscale(1)' : camFilter === 'sepia' ? 'sepia(0.8) hue-rotate(-10deg)' : camFilter === 'dreamy' ? 'brightness(1.1) saturate(1.2) contrast(0.9)' : 'sepia(0.2) saturate(1.4)'
                    }}>
                      <div className="avatar" style={{ width: '70px', height: '70px', fontSize: '1.8rem' }}>
                        {getUserNameLabel().charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Camera đang tắt</span>
                    </div>
                  )}
                  <span className="user-name-tag">BẠN ({getUserNameLabel().split(' ')[0]})</span>
                </div>

                {/* Peer TRỰC TIẾP qua WebRTC (khi backend signaling chạy + có người khác vào cùng phòng) */}
                {signalPeers.map(pid => (
                  <div key={pid} className="video-card active-speaker" style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, background: '#10b981', color: '#fff', padding: '2px 7px', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700 }}>● TRỰC TIẾP</div>
                    {remoteStreams[pid] ? (
                      <RemoteVideo stream={remoteStreams[pid]} />
                    ) : (
                      <div className="video-placeholder">
                        <div className="avatar" style={{ width: '70px', height: '70px', fontSize: '1.8rem', background: '#334155' }}>?</div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Đang kết nối…</span>
                      </div>
                    )}
                    <span className="user-name-tag">Người tham gia trực tiếp</span>
                  </div>
                ))}

                {/* Người tham gia — khung nhiều người demo từ danh sách lớp */}
                {peerParticipants.map(p => (
                  <div key={p.id} className={`video-card ${p.handRaised ? 'active-speaker' : ''}`} style={{ position: 'relative' }}>
                    {p.handRaised && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: '#10b981', color: '#fff', padding: '3px 7px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, zIndex: 10 }}>
                        <Hand size={11} fill="white" />
                      </div>
                    )}
                    <div className="video-placeholder">
                      <div className="avatar" style={{ width: '70px', height: '70px', fontSize: '1.8rem', background: p.color }}>{p.name.charAt(0)}</div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Camera đang tắt</span>
                    </div>
                    <span className="user-name-tag" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {p.micOn ? <Mic size={11} /> : <MicOff size={11} style={{ color: '#ef4444' }} />} {p.name}
                    </span>
                  </div>
                ))}
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
                onClick={() => {
                  if (screenShare) {
                    stopScreenShare();
                  } else {
                    startScreenShare();
                  }
                }} 
                className={`control-btn ${screenShare ? 'active' : ''}`}
                title="Trình chiếu màn hình"
              >
                <Monitor size={18} />
              </button>

              <button 
                onClick={() => {
                  playSound('hand');
                  setHandRaised(!handRaised);
                }} 
                className={`control-btn ${handRaised ? 'active' : ''}`}
                title="Giơ tay phát biểu"
              >
                <Hand size={18} />
              </button>

              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowReactionMenu(!showReactionMenu)} 
                  className={`control-btn ${showReactionMenu ? 'active' : ''}`}
                  title="Thả cảm xúc"
                >
                  <Sparkles size={18} />
                </button>
                {showReactionMenu && (
                  <div className="reaction-menu">
                    {['❤️', '👏', '🎉', '👍', '😮'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          triggerReaction(emoji);
                          setShowReactionMenu(false);
                        }}
                        className="reaction-emoji-btn"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => recording ? stopRecording() : startRecording()}
                className={`control-btn ${recording ? 'active' : ''}`}
                title={recording ? 'Dừng ghi' : 'Ghi âm cuộc họp'}
                style={recording ? { color: '#ef4444' } : undefined}
              >
                {recording ? <StopCircle size={18} /> : <Radio size={18} />}
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
            <div className="tabs-container" style={{ marginBottom: '16px', paddingBottom: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              <button onClick={() => setActivePanel('chat')} className={`tab-btn ${activePanel === 'chat' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Chat ({chatMessages.filter(c => !c.system).length})
              </button>
              <button onClick={() => setActivePanel('whiteboard')} className={`tab-btn ${activePanel === 'whiteboard' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Bảng viết
              </button>
              <button onClick={() => setActivePanel('polls')} className={`tab-btn ${activePanel === 'polls' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Khảo sát ({polls.length})
              </button>
              <button onClick={() => setActivePanel('record')} className={`tab-btn ${activePanel === 'record' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Ghi âm{recording ? ' ●' : ''}
              </button>
              <button onClick={() => setActivePanel('charts')} className={`tab-btn ${activePanel === 'charts' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Biểu đồ
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

            {/* Ghi âm + AI tóm tắt */}
            {activePanel === 'record' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="glass-panel" style={{ padding: 12, border: '1px solid var(--border-card)', background: 'rgba(255,255,255,0.02)' }}>
                  <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Radio size={14} /> Ghi âm cuộc họp</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => recording ? stopRecording() : startRecording()} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem', background: recording ? '#ef4444' : undefined, border: recording ? 'none' : undefined }}>
                      {recording ? '■ Dừng ghi' : '● Bắt đầu ghi'}
                    </button>
                    <span style={{ fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums', color: recording ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>{fmtTime(recordingSecs)}</span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>Không giới hạn thời gian, chạy ngay trên máy — file không gửi ra ngoài.</p>
                </div>

                {recordedUrl && (
                  <div className="glass-panel" style={{ padding: 12, border: '1px solid var(--border-card)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8 }}>Bản ghi ({fmtSize(recordedSize)})</div>
                    <video src={recordedUrl} controls style={{ width: '100%', borderRadius: 8, background: '#000', marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => downloadRecording('webm')} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.76rem' }}><Download size={12} /> Tải .webm</button>
                      <button onClick={() => downloadRecording('mp4')} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.76rem' }}><Download size={12} /> Tải .mp4</button>
                    </div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>Xuất mp3/mp4 chuẩn cần ffmpeg (trình duyệt hoặc server); hiện tải ở định dạng webm gốc.</p>
                  </div>
                )}

                <div className="glass-panel" style={{ padding: 12, border: '1px solid var(--border-card)', background: 'rgba(255,255,255,0.02)' }}>
                  <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Sparkles size={14} /> AI tóm tắt cuộc họp</h4>
                  <button onClick={generateSummary} disabled={summarizing} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    {summarizing ? 'Đang tóm tắt…' : 'Tạo bản tóm tắt'}
                  </button>
                  {summary && (
                    <div style={{ marginTop: 12, fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div><b style={{ color: 'var(--text-primary)' }}>Thời lượng:</b> {summary.duration}{summary.source ? ` · ${summary.source}` : ''}</div>
                      <div><b style={{ color: 'var(--text-primary)' }}>Nội dung chính:</b><ul style={{ paddingLeft: 16, marginTop: 4 }}>{summary.topics.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                      <div><b style={{ color: 'var(--text-primary)' }}>Điểm đáng chú ý:</b><ul style={{ paddingLeft: 16, marginTop: 4 }}>{summary.keyPoints.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                      <div><b style={{ color: 'var(--text-primary)' }}>Việc cần làm:</b><ul style={{ paddingLeft: 16, marginTop: 4 }}>{summary.actions.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                    </div>
                  )}
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 8 }}>Bản mô phỏng. AI thật: Whisper (phiên âm) + LLM (tóm tắt) chạy trên máy chủ nội bộ.</p>
                </div>
              </div>
            )}

            {/* Biểu đồ cuộc họp */}
            {activePanel === 'charts' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={14} /> Số liệu cuộc họp</h4>
                  <button onClick={exportChartSVG} className="btn btn-secondary" style={{ padding: '5px 9px', fontSize: '0.74rem' }}><Download size={12} /> Tải SVG</button>
                </div>
                {(() => {
                  const data = meetingStats();
                  const max = Math.max(...data.map(d => d.value), 1);
                  const W = 300, H = 190, pad = 34, gap = (W - pad) / data.length, bw = gap * 0.6;
                  return (
                    <svg ref={chartRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', borderRadius: 8 }} xmlns="http://www.w3.org/2000/svg">
                      <line x1={pad} y1={H - 24} x2={W - 4} y2={H - 24} stroke="rgba(148,163,184,0.35)" />
                      {data.map((d, i) => {
                        const bh = (d.value / max) * (H - 54);
                        const x = pad + i * gap + (gap - bw) / 2;
                        const y = H - 24 - bh;
                        return (
                          <g key={i}>
                            <rect x={x} y={y} width={bw} height={bh} rx={3} fill={d.color} />
                            <text x={x + bw / 2} y={y - 4} fontSize="9" fill="#94a3b8" textAnchor="middle">{d.value}</text>
                            <text x={x + bw / 2} y={H - 9} fontSize="8" fill="#94a3b8" textAnchor="middle">{d.label}</text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}

                {polls.map((poll, pi) => {
                  const total = poll.options.reduce((a, b) => a + b.votes, 0);
                  return (
                    <div key={pi} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>{poll.question}</div>
                      {poll.options.map((o, oi) => {
                        const pct = total ? Math.round(o.votes / total * 100) : 0;
                        return (
                          <div key={oi} style={{ marginBottom: 5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 2 }}><span>{o.text}</span><span>{pct}%</span></div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: 'var(--accent-primary, #6366f1)' }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Tải SVG để chèn báo cáo, hoặc dùng gói "Xuất sơ đồ / biểu đồ" cho các định dạng khác.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
