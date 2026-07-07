import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Hash, Send, Trash2, Users, GraduationCap } from 'lucide-react';

/* ─── Mock Data ─────────────────────────────────────────────────────────── */
const QUICK_EMOJIS = ['😊', '👍', '🙏', '🔥', '📚', '✅'];

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const getInitial = (name) => name?.split(' ').pop()?.charAt(0)?.toUpperCase() || '?';

const avatarColors = [
  'linear-gradient(135deg,#6c5ce7,#a29bfe)',
  'linear-gradient(135deg,#00b894,#55efc4)',
  'linear-gradient(135deg,#e17055,#fab1a0)',
  'linear-gradient(135deg,#0984e3,#74b9ff)',
  'linear-gradient(135deg,#fd79a8,#e84393)',
  'linear-gradient(135deg,#fdcb6e,#e17055)',
];
const avatarGradient = (id) => avatarColors[Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % avatarColors.length];

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function ClassChatRoom() {
  const { currentRole, userSession, students, classChats, setClassChats } = useContext(AppContext);

  // Determine current user
  const meId   = currentRole === 'teacher' ? (userSession?.userId || 'T01') : (students?.[0]?.id || 'HS001');
  const meName = currentRole === 'teacher' ? 'Nguyễn Minh Triết' : (students?.find(s => s.id === meId)?.name || 'Học sinh');
  const meRole = currentRole === 'teacher' ? 'teacher' : 'student';

  const rooms = classChats.rooms;
  const setRooms = (newRooms) => {
    setClassChats(prev => ({
      ...prev,
      rooms: typeof newRooms === 'function' ? newRooms(prev.rooms) : newRooms
    }));
  };

  const messages = classChats.messages;
  const setMessages = (newMessages) => {
    setClassChats(prev => ({
      ...prev,
      messages: typeof newMessages === 'function' ? newMessages(prev.messages) : newMessages
    }));
  };
  const [activeRoom, setActiveRoom] = useState('R-12A1');
  const [text, setText]         = useState('');
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const bottomRef = useRef(null);

  const roomMsgs = messages[activeRoom] || [];
  const activeRoomInfo = rooms.find(r => r.id === activeRoom);

  // Scroll to bottom when room or messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom, messages]);

  // Select room → clear unread
  const handleSelectRoom = (roomId) => {
    setActiveRoom(roomId);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unread: 0 } : r));
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const now = new Date();
    const newMsg = {
      id: `MSG-${now.getTime()}`,
      senderId: meId,
      senderName: meName,
      role: meRole,
      text: text.trim(),
      time: now.toTimeString().slice(0, 5),
      date: now.toISOString().slice(0, 10),
    };
    setMessages(prev => ({ ...prev, [activeRoom]: [...(prev[activeRoom] || []), newMsg] }));
    setText('');
  };

  const handleDelete = (msgId) => {
    setMessages(prev => ({
      ...prev,
      [activeRoom]: prev[activeRoom].filter(m => m.id !== msgId),
    }));
  };

  const canDelete = (msg) => {
    if (msg.role === 'system') return false;
    if (meRole === 'teacher') return true;
    return msg.senderId === meId;
  };

  const appendEmoji = (emoji) => setText(prev => prev + emoji);

  // Group messages by date
  const groupedMsgs = roomMsgs.reduce((acc, msg) => {
    const key = msg.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div
      className="glass-panel animate-fade"
      style={{ padding: 0, height: 'calc(100vh - 130px)', display: 'flex', borderRadius: 20, overflow: 'hidden', minHeight: 500 }}
    >
      {/* ── LEFT: Room List ─────────────────────────────────────────── */}
      <div style={{
        width: 260,
        flexShrink: 0,
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-soft)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--violet), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={16} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Chat Nhóm Lớp</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{rooms.length} phòng</p>
            </div>
          </div>
        </div>

        {/* Room groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {['12A1', '12A2'].map(cls => (
            <div key={cls}>
              <div style={{ padding: '8px 16px 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Lớp {cls}
              </div>
              {rooms.filter(r => r.class === cls).map(room => {
                const isActive = room.id === activeRoom;
                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room.id)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 16px',
                      border: 'none',
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Hash size={14} color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.83rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent-ink)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.name}
                    </span>
                    {room.unread > 0 && (
                      <span style={{
                        background: 'var(--coral)', color: '#fff',
                        fontSize: '0.62rem', fontWeight: 700,
                        minWidth: 18, height: 18,
                        borderRadius: 99,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 5px', flexShrink: 0,
                      }}>{room.unread}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Online indicator */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
          Đang trực tuyến với tư cách {meRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}
        </div>
      </div>

      {/* ── RIGHT: Chat Area ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Chat header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: activeRoomInfo?.subject
              ? 'linear-gradient(135deg,#6c5ce7,#a29bfe)'
              : 'linear-gradient(135deg,#0984e3,#74b9ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Hash size={16} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {activeRoomInfo?.name}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {activeRoomInfo?.subject ? `Môn: ${activeRoomInfo.subject}` : 'Phòng chung toàn lớp'} • {roomMsgs.length} tin nhắn
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <Users size={13} />
            <span>Lớp {activeRoomInfo?.class}</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 2,
          background: 'var(--bg)',
        }}>
          {Object.entries(groupedMsgs).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 10px' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                <span style={{
                  fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)',
                  background: 'var(--surface)', padding: '3px 10px', borderRadius: 99,
                  border: '1px solid var(--line)', whiteSpace: 'nowrap',
                }}>{formatDate(date)}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>

              {msgs.map(msg => {
                if (msg.role === 'system') {
                  return (
                    <div key={msg.id} style={{ textAlign: 'center', margin: '6px 0' }}>
                      <span style={{
                        fontSize: '0.72rem', color: 'var(--text-secondary)',
                        background: 'var(--surface)', padding: '4px 14px', borderRadius: 99,
                        border: '1px solid var(--line)', display: 'inline-block',
                      }}>🔔 {msg.text}</span>
                    </div>
                  );
                }

                const isMe = msg.senderId === meId;
                const isTeacher = msg.role === 'teacher';

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      gap: 8,
                      alignItems: 'flex-end',
                      marginBottom: 6,
                      position: 'relative',
                    }}
                    onMouseEnter={() => setHoveredMsg(msg.id)}
                    onMouseLeave={() => setHoveredMsg(null)}
                  >
                    {/* Avatar (for others) */}
                    {!isMe && (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: avatarGradient(msg.senderId),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        border: isTeacher ? '2px solid #10b981' : 'none',
                      }}>
                        {getInitial(msg.senderName)}
                      </div>
                    )}

                    <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {/* Sender name + teacher badge */}
                      {!isMe && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isTeacher ? '#047857' : 'var(--text-secondary)' }}>
                            {msg.senderName}
                          </span>
                          {isTeacher && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              background: 'rgba(16,185,129,0.12)', color: '#047857',
                              fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px',
                              borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)',
                            }}>
                              <GraduationCap size={9} /> Giáo viên
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bubble */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMe
                          ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-ink))'
                          : isTeacher
                            ? 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))'
                            : 'var(--surface)',
                        color: isMe ? '#fff' : 'var(--text-primary)',
                        fontSize: '0.88rem',
                        lineHeight: 1.55,
                        boxShadow: isMe ? 'var(--sh-pop)' : 'var(--sh-sm)',
                        border: isTeacher && !isMe ? '1px solid rgba(16,185,129,0.25)' : isMe ? 'none' : '1px solid var(--line)',
                        wordBreak: 'break-word',
                        position: 'relative',
                      }}>
                        {msg.text}

                        {/* Delete button on hover */}
                        {hoveredMsg === msg.id && canDelete(msg) && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            style={{
                              position: 'absolute',
                              top: -10, right: isMe ? 0 : 'auto', left: isMe ? 'auto' : 0,
                              width: 24, height: 24, borderRadius: '50%',
                              background: '#ef4444', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                              transition: 'transform 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            title="Xóa tin nhắn"
                          >
                            <Trash2 size={11} color="#fff" />
                          </button>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                        {msg.time}
                      </span>
                    </div>

                    {/* My avatar */}
                    {isMe && (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: avatarGradient(meId),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        border: meRole === 'teacher' ? '2px solid #10b981' : 'none',
                      }}>
                        {getInitial(meName)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {roomMsgs.filter(m => m.role !== 'system').length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: 10, paddingTop: 60 }}>
              <Hash size={40} style={{ opacity: 0.2 }} />
              <p style={{ fontSize: '0.88rem' }}>Chưa có tin nhắn nào trong phòng này</p>
              <p style={{ fontSize: '0.78rem', opacity: 0.6 }}>Hãy là người đầu tiên gửi tin!</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ─────────────────────────────────────────────── */}
        <div style={{
          padding: '10px 16px 12px',
          borderTop: '1px solid var(--line)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          {/* Quick emojis */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {QUICK_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => appendEmoji(e)}
                style={{
                  padding: '3px 8px', fontSize: '1rem', background: 'var(--bg)',
                  border: '1px solid var(--line)', borderRadius: 8,
                  cursor: 'pointer', transition: 'transform 0.1s',
                  lineHeight: 1.5,
                }}
                onMouseEnter={ev => ev.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={ev => ev.currentTarget.style.transform = 'scale(1)'}
                title={e}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Text input + send */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="form-control"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Nhắn tin vào #${activeRoomInfo?.name || ''}...`}
              style={{ flex: 1, borderRadius: 30, padding: '10px 18px', fontSize: '0.9rem' }}
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="btn btn-primary"
              style={{
                borderRadius: '50%', width: 44, height: 44, padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                opacity: text.trim() ? 1 : 0.5,
                transition: 'opacity 0.15s',
              }}
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
