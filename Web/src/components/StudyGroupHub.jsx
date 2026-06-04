import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Users, Play, Pause, RotateCcw, Plus, CheckCircle, Clock, 
  Volume2, VolumeX, LogOut, Send, Award, Star 
} from 'lucide-react';

export default function StudyGroupHub() {
  const {
    currentRole,
    selectedStudentId,
    students,
    studyRooms,
    peerTutors,
    tutorRequests,
    createStudyRoom,
    registerAsTutor,
    requestTutorHelp,
    acceptTutorRequest,
    completeTutorRequest
  } = useContext(AppContext);

  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];

  // Tab state: 'rooms' or 'tutors'
  const [activeTab, setActiveTab] = useState('rooms');

  // Study Rooms State
  const [activeRoom, setActiveRoom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState('Toán học');
  const [newRoomTime, setNewRoomTime] = useState(25);
  const [newRoomMusic, setNewRoomMusic] = useState('lofi');

  // Pomodoro Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Music state in active room
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicType, setMusicType] = useState('lofi');

  // Tutor Request form state
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [requestNotes, setRequestNotes] = useState('');

  // Register as tutor state
  const [registerSubject, setRegisterSubject] = useState('Toán học');

  const handleJoinRoom = (room) => {
    setActiveRoom(room);
    setTimeLeft(room.pomodoroTime * 60);
    setTimerRunning(false);
    setMusicType(room.bgMusic || 'none');
    setMusicPlaying(room.bgMusic !== 'none');
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Timer countdown hook
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            clearInterval(timerRef.current);
            alert('Phiên học Pomodoro kết thúc! Hãy nghỉ ngơi một chút nhé.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;
    createStudyRoom(
      newRoomTitle,
      newRoomSubject,
      student?.name || 'Học sinh',
      parseInt(newRoomTime),
      newRoomMusic
    );
    setNewRoomTitle('');
    setShowCreateModal(false);
    alert('Tạo phòng tự học thành công!');
  };

  const handleRegisterTutor = (e) => {
    e.preventDefault();
    registerAsTutor(student?.id, student?.name, registerSubject);
    alert(`Đăng ký gia sư đồng đẳng môn ${registerSubject} thành công!`);
  };

  const handleSendRequest = (e) => {
    e.preventDefault();
    if (!selectedTutor || !requestNotes.trim()) return;
    requestTutorHelp(
      student?.id,
      student?.name,
      selectedTutor.studentId,
      selectedTutor.subjectExpertise,
      requestNotes
    );
    setRequestNotes('');
    setSelectedTutor(null);
    alert(`Đã gửi yêu cầu hỗ trợ học tập môn ${selectedTutor.subjectExpertise} đến bạn ${selectedTutor.name}!`);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const myTutorRequests = (tutorRequests || []).filter(r => r.studentId === student?.id);
  const requestsToMe = (tutorRequests || []).filter(r => r.tutorId === student?.id);

  // Check if current user is registered as a tutor
  const isRegisteredAsTutor = (peerTutors || []).some(t => t.studentId === student?.id);

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1050, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.3rem' }}>
            <Users size={22} color="#8b5cf6" /> Nhóm Học Tập & Gia Sư Đồng Đẳng
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Tham gia phòng tự học Pomodoro nghe nhạc Lo-fi hoặc kết nối gia sư hỗ trợ học tập xuất sắc
          </p>
        </div>
        
        {/* Active room indicator */}
        {activeRoom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.1)', padding: '6px 14px', borderRadius: 14, border: '1px solid rgba(139,92,246,0.2)' }}>
            <Clock size={14} color="#8b5cf6" className="animate-spin" style={{ animationDuration: '4s' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#7c3aed' }}>
              Đang học: {activeRoom.title} ({formatTime(timeLeft)})
            </span>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 20, paddingBottom: 8 }}>
        <button 
          onClick={() => { if (!activeRoom) setActiveTab('rooms'); }} 
          disabled={!!activeRoom}
          style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: activeRoom ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: activeTab === 'rooms' ? 700 : 500,
            color: activeTab === 'rooms' ? '#8b5cf6' : 'var(--text-secondary)',
            borderBottom: activeTab === 'rooms' ? '2.5px solid #8b5cf6' : 'none',
            opacity: activeRoom ? 0.6 : 1
          }}>
          🏫 Phòng Tự Học Pomodoro
        </button>
        <button 
          onClick={() => { if (!activeRoom) setActiveTab('tutors'); }}
          disabled={!!activeRoom}
          style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: activeRoom ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: activeTab === 'tutors' ? 700 : 500,
            color: activeTab === 'tutors' ? '#8b5cf6' : 'var(--text-secondary)',
            borderBottom: activeTab === 'tutors' ? '2.5px solid #8b5cf6' : 'none',
            opacity: activeRoom ? 0.6 : 1
          }}>
          🤝 Gia Sư Đồng Đẳng
        </button>
      </div>

      {/* active tab contents */}
      {activeTab === 'rooms' ? (
        activeRoom ? (
          /* ACTIVE ROOM SCREEN */
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, background: 'rgba(255,255,255,0.4)', padding: 24, borderRadius: 24, border: '1px solid var(--border-card)' }}>
            {/* Timer Center */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 20, padding: 30, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8 }}>
                {activeRoom.subject} • Cùng học với {activeRoom.creatorName}
              </span>
              <h3 style={{ margin: '0 0 20px', fontSize: '1.15rem', color: '#1e293b', fontWeight: 800 }}>{activeRoom.title}</h3>
              
              {/* Pomodoro Clock Face */}
              <div style={{
                width: 220, height: 220, borderRadius: '50%', border: '6px solid rgba(139,92,246,0.08)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', background: 'linear-gradient(135deg, rgba(139,92,246,0.02), rgba(139,92,246,0.08))',
                boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.02)', marginBottom: 24
              }}>
                {/* Simulated ticking progress circle */}
                <div style={{
                  position: 'absolute', inset: -6, borderRadius: '50%',
                  border: '6px solid transparent', borderTopColor: '#8b5cf6',
                  transform: `rotate(${(timeLeft / (activeRoom.pomodoroTime * 60)) * 360}deg)`,
                  transition: 'transform 0.5s linear'
                }} />
                
                <span style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'monospace', color: '#1e293b' }}>
                  {formatTime(timeLeft)}
                </span>
                <span style={{ fontSize: '0.72rem', color: timerRunning ? '#10b981' : '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: timerRunning ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
                  {timerRunning ? 'PHÊN HỌC ĐANG CHẠY' : 'ĐANG TẠM DỪNG'}
                </span>
              </div>

              {/* Timer Controls */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <button 
                  onClick={() => setTimerRunning(!timerRunning)} 
                  className="btn btn-primary" 
                  style={{ borderRadius: 14, padding: '10px 24px', fontSize: '0.85rem' }}>
                  {timerRunning ? <Pause size={16} /> : <Play size={16} />}
                  {timerRunning ? 'Tạm dừng' : 'Bắt đầu học'}
                </button>
                <button 
                  onClick={() => { setTimerRunning(false); setTimeLeft(activeRoom.pomodoroTime * 60); }} 
                  className="btn btn-secondary" 
                  style={{ borderRadius: 14, padding: '10px 18px', fontSize: '0.85rem' }}>
                  <RotateCcw size={16} /> Đặt lại
                </button>
              </div>

              <button 
                onClick={handleLeaveRoom} 
                className="btn btn-danger" 
                style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.78rem', padding: '6px 16px', borderRadius: 12, marginTop: 12 }}>
                <LogOut size={13} /> Rời phòng tự học
              </button>
            </div>

            {/* Music & Ambience Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid rgba(0,0,0,0.04)', flex: 1 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {musicPlaying ? <Volume2 size={16} color="#8b5cf6" /> : <VolumeX size={16} color="var(--text-muted)" />}
                  Nhạc nền Lo-fi tập trung
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => { setMusicType('lofi'); setMusicPlaying(true); }}
                      style={{
                        flex: 1, padding: '12px 10px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.78rem', fontWeight: 600,
                        border: musicPlaying && musicType === 'lofi' ? '2px solid #8b5cf6' : '1px solid rgba(0,0,0,0.08)',
                        background: musicPlaying && musicType === 'lofi' ? 'rgba(139,92,246,0.06)' : 'transparent',
                        color: musicPlaying && musicType === 'lofi' ? '#7c3aed' : 'var(--text-secondary)'
                      }}>
                      ☕ Lo-Fi Study beats
                    </button>
                    <button 
                      onClick={() => { setMusicType('ambient'); setMusicPlaying(true); }}
                      style={{
                        flex: 1, padding: '12px 10px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.78rem', fontWeight: 600,
                        border: musicPlaying && musicType === 'ambient' ? '2px solid #8b5cf6' : '1px solid rgba(0,0,0,0.08)',
                        background: musicPlaying && musicType === 'ambient' ? 'rgba(139,92,246,0.06)' : 'transparent',
                        color: musicPlaying && musicType === 'ambient' ? '#7c3aed' : 'var(--text-secondary)'
                      }}>
                      🌧️ Âm thanh Tiếng mưa
                    </button>
                  </div>

                  <button 
                    onClick={() => setMusicPlaying(!musicPlaying)}
                    className="btn btn-secondary" 
                    style={{ width: '100%', fontSize: '0.8rem', padding: '8px', borderRadius: 12 }}>
                    {musicPlaying ? 'Tắt âm thanh nền' : 'Bật âm thanh nền'}
                  </button>

                  {/* Simulated Equalizer Animations */}
                  {musicPlaying && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 40, gap: 4, marginTop: 10, padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 10 }}>
                      <span className="eq-bar" style={{ width: 4, background: '#8b5cf6', borderRadius: 2, height: 10, animation: 'eq-pulse 0.8s infinite alternate' }} />
                      <span className="eq-bar" style={{ width: 4, background: '#8b5cf6', borderRadius: 2, height: 25, animation: 'eq-pulse 0.8s infinite alternate 0.2s' }} />
                      <span className="eq-bar" style={{ width: 4, background: '#8b5cf6', borderRadius: 2, height: 18, animation: 'eq-pulse 0.8s infinite alternate 0.4s' }} />
                      <span className="eq-bar" style={{ width: 4, background: '#8b5cf6', borderRadius: 2, height: 32, animation: 'eq-pulse 0.8s infinite alternate 0.1s' }} />
                      <span className="eq-bar" style={{ width: 4, background: '#8b5cf6', borderRadius: 2, height: 12, animation: 'eq-pulse 0.8s infinite alternate 0.3s' }} />
                      <style>{`
                        @keyframes eq-pulse { from { height: 6px; } to { height: 34px; } }
                      `}</style>
                    </div>
                  )}
                </div>
              </div>

              {/* Tips Section */}
              <div style={{ background: 'rgba(139,92,246,0.04)', border: '1px dashed rgba(139,92,246,0.2)', padding: 16, borderRadius: 16, fontSize: '0.78rem', color: '#5b21b6', lineHeight: 1.4 }}>
                <strong>💡 Mẹo tự học tập trung:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li>Tắt thông báo điện thoại di động trước khi bắt đầu.</li>
                  <li>Hết 25 phút, hãy đứng dậy đi lại và uống nước trong 5 phút.</li>
                  <li>Cố gắng không chuyển tab trình duyệt trong phiên học Pomodoro.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* ROOM LIST GRID SCREEN */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Phòng tự học đang mở ({studyRooms?.length || 0})</h3>
              {currentRole === 'student' && (
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: 12 }}>
                  <Plus size={14} /> Mở phòng học mới
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {studyRooms && studyRooms.map(room => (
                <div key={room.id} style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 180, boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.7rem', color: '#8b5cf6', background: 'rgba(139,92,246,0.08)', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
                        {room.subject}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        👥 {room.participantsCount} đang học
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.88rem', color: '#1e293b', display: 'block', marginBottom: 6 }}>{room.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tạo bởi: {room.creatorName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 10, marginTop: 10 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {room.pomodoroTime} phút • {room.bgMusic === 'lofi' ? '🎵 Lo-fi' : room.bgMusic === 'ambient' ? '🌧️ Rain' : '🔇 Yên lặng'}
                    </span>
                    {currentRole === 'student' && (
                      <button onClick={() => handleJoinRoom(room)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 8 }}>
                        Tham gia
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* PEER TUTORING SCREEN */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          {/* Left Column: Tutors and request panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Tutors directory */}
            <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={16} color="#f59e0b" /> Đội ngũ Gia sư đồng đẳng
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {peerTutors && peerTutors.map(tutor => (
                  <div key={`${tutor.studentId}-${tutor.subjectExpertise}`} style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                        {tutor.name.split(' ').pop().charAt(0)}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.8rem', display: 'block' }}>{tutor.name}</strong>
                        <span style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600 }}>Chuyên: {tutor.subjectExpertise}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '6px 10px', borderRadius: 8, fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Đã hỗ trợ:</span>
                      <strong style={{ color: '#10b981' }}>{tutor.assistedCount} buổi</strong>
                    </div>

                    {currentRole === 'student' && tutor.studentId !== student?.id && (
                      <button onClick={() => setSelectedTutor(tutor)} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.72rem', padding: '5px', borderRadius: 8, gap: 4 }}>
                        <Send size={12} /> Yêu cầu kèm học
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Request List panel */}
            <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>Yêu cầu kèm cặp của tôi</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {myTutorRequests.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bạn chưa gửi yêu cầu gia sư nào.</p>
                ) : (
                  myTutorRequests.map(req => {
                    const tutorName = peerTutors.find(t => t.studentId === req.tutorId)?.name || 'Gia sư';
                    return (
                      <div key={req.id} style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.04)', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong>Kèm môn {req.subject}</strong>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Gia sư: {tutorName}</span>
                        </div>
                        <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>{req.notes}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                          <span className={`badge ${req.status === 'completed' ? 'badge-success' : req.status === 'accepted' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.66rem' }}>
                            {req.status === 'completed' ? 'Đã hoàn thành' : req.status === 'accepted' ? 'Đang kèm học' : 'Đang đợi duyệt'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Register and incoming requests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Register section */}
            {currentRole === 'student' && (
              <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={16} color="#8b5cf6" /> Đăng ký làm Gia sư lớp học
                </h3>
                
                {isRegisteredAsTutor ? (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: 12, borderRadius: 12, color: '#065f46', fontSize: '0.78rem', display: 'flex', gap: 6 }}>
                    <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Bạn đã đăng ký làm gia sư trong hệ thống. Hãy xem các yêu cầu kèm học gửi đến bạn bên dưới!</span>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterTutor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Môn học thế mạnh của bạn</label>
                      <select className="form-control" value={registerSubject} onChange={e => setRegisterSubject(e.target.value)} style={{ fontSize: '0.8rem', padding: '6px' }}>
                        <option value="Toán học">Toán học (Giải tích & Đại số)</option>
                        <option value="Vật lý">Vật lý (Điện xoay chiều, Dao động)</option>
                        <option value="Hóa học">Hóa học (Hữu cơ & Vô cơ)</option>
                        <option value="Tiếng Anh">Tiếng Anh (Ngữ pháp & Từ vựng)</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}>Đăng ký tham gia ngay</button>
                  </form>
                )}
              </div>
            )}

            {/* Requests for me dashboard */}
            {currentRole === 'student' && isRegisteredAsTutor && (
              <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>Yêu cầu kèm cặp gửi đến bạn</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {requestsToMe.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Chưa nhận được yêu cầu giúp đỡ nào.</p>
                  ) : (
                    requestsToMe.map(req => (
                      <div key={req.id} style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)', fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span>Học sinh: {req.studentName}</span>
                          <span style={{ color: '#8b5cf6' }}>Môn: {req.subject}</span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.3 }}>"{req.notes}"</p>
                        
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                          {req.status === 'pending' && (
                            <button onClick={() => acceptTutorRequest(req.id)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: 6 }}>
                              Chấp nhận
                            </button>
                          )}
                          {req.status === 'accepted' && (
                            <button onClick={() => completeTutorRequest(req.id)} className="btn btn-secondary" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '4px 10px', fontSize: '0.7rem', borderRadius: 6 }}>
                              Hoàn thành buổi học
                            </button>
                          )}
                          {req.status === 'completed' && (
                            <span className="badge badge-success" style={{ fontSize: '0.66rem' }}>✓ Đã kèm xong (+5 đrl)</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* General Monitoring for Teacher / BGH roles */}
            {(currentRole === 'teacher' || currentRole === 'admin') && (
              <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>Giám sát nhóm gia sư đồng đẳng</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 350, overflowY: 'auto' }}>
                  {(tutorRequests || []).map(req => {
                    const tName = peerTutors.find(t => t.studentId === req.tutorId)?.name || 'Gia sư';
                    return (
                      <div key={req.id} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.04)', padding: 10, borderRadius: 10, fontSize: '0.75rem' }}>
                        <div><strong>Môn {req.subject}</strong>: {req.studentName} ➔ {tName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: 2 }}>Trạng thái: 
                          <span style={{ fontWeight: 600, color: req.status === 'completed' ? '#10b981' : req.status === 'accepted' ? '#0ea5e9' : '#f59e0b', marginLeft: 4 }}>
                            {req.status === 'completed' ? 'Hoàn thành' : req.status === 'accepted' ? 'Đang hỗ trợ' : 'Chờ chấp nhận'}
                          </span>
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

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Mở phòng tự học Pomodoro mới</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>X</button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Tiêu đề phòng học *</label>
                <input className="form-control" value={newRoomTitle} onChange={e => setNewRoomTitle(e.target.value)} placeholder="Ví dụ: Ôn tập Đại số giải tích cuối kỳ II..." required style={{ fontSize: '0.82rem' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Môn học *</label>
                  <select className="form-control" value={newRoomSubject} onChange={e => setNewRoomSubject(e.target.value)} style={{ fontSize: '0.82rem' }}>
                    <option value="Toán học">Toán học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Thời gian đếm ngược *</label>
                  <select className="form-control" value={newRoomTime} onChange={e => setNewRoomTime(parseInt(e.target.value))} style={{ fontSize: '0.82rem' }}>
                    <option value="25">25 Phút (Chuẩn)</option>
                    <option value="45">45 Phút (Nâng cao)</option>
                    <option value="60">60 Phút (Tập trung sâu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nhạc nền mặc định</label>
                <select className="form-control" value={newRoomMusic} onChange={e => setNewRoomMusic(e.target.value)} style={{ fontSize: '0.82rem' }}>
                  <option value="lofi">☕ Nhạc Lo-fi ấm áp</option>
                  <option value="ambient">🌧️ Tiếng mưa rơi</option>
                  <option value="none">🔇 Yên tĩnh tuyệt đối</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo phòng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutor Help Dialog Request Form */}
      {selectedTutor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Yêu cầu kèm cặp môn {selectedTutor.subjectExpertise}</h3>
              <button onClick={() => setSelectedTutor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>X</button>
            </div>

            <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Bạn đang gửi yêu cầu học nhóm đến gia sư <strong>{selectedTutor.name}</strong>.
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nội dung chi tiết cần kèm học *</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  value={requestNotes} 
                  onChange={e => setRequestNotes(e.target.value)} 
                  placeholder="Ghi rõ nội dung bạn bị mất gốc hoặc cần giải đáp (ví dụ: cần học lại cách tính tích phân từng phần bài tập khó)..." 
                  required 
                  style={{ fontSize: '0.82rem', resize: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedTutor(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Send size={13} /> Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
