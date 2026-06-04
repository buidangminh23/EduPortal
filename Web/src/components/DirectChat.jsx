import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { MessageCircle, Send, Check, CheckCheck, Users, Search } from 'lucide-react';

export default function DirectChat() {
  const { directMessages, sendDirectMessage, markMessageRead, currentRole, userSession, students, teachers, selectedStudentId } = useContext(AppContext);
  const [selectedConv, setSelectedConv] = useState(null);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);

  // Build current user identity
  const getMe = () => {
    if (currentRole === 'teacher') {
      const t = teachers?.find(t => t.id === (userSession?.userId || 'T01')) || teachers?.[0];
      return { id: t?.id || 'T01', name: t?.name || 'Giáo viên', role: 'teacher' };
    }
    if (currentRole === 'parent') {
      const s = students?.find(s => s.id === selectedStudentId) || students?.[0];
      return { id: `parent_${s?.id}`, name: `${s?.parentName} (PH ${s?.name})`, role: 'parent' };
    }
    return { id: 'unknown', name: 'Người dùng', role: currentRole };
  };

  const me = getMe();

  // Build conversations list
  const buildConversations = () => {
    const msgs = directMessages || [];
    const convMap = {};
    msgs.forEach(m => {
      const isMe = m.fromId === me.id || m.toId === me.id;
      if (!isMe) return;
      const partnerId = m.fromId === me.id ? m.toId : m.fromId;
      const partnerName = m.fromId === me.id ? m.toName : m.fromName;
      if (!convMap[partnerId]) convMap[partnerId] = { partnerId, partnerName, messages: [], unread: 0 };
      convMap[partnerId].messages.push(m);
      if (!m.read && m.toId === me.id) convMap[partnerId].unread++;
    });
    return Object.values(convMap).sort((a, b) => {
      const la = a.messages[a.messages.length - 1];
      const lb = b.messages[b.messages.length - 1];
      return (lb?.date + lb?.time || '').localeCompare(la?.date + la?.time || '');
    });
  };

  // Build possible contacts (who you can message)
  const buildContacts = () => {
    if (currentRole === 'teacher') {
      // Can message parents of students in their class
      const myClass = teachers?.find(t => t.id === me.id)?.classJoined || '12A1';
      return (students || [])
        .filter(s => s.class === myClass)
        .map(s => ({ id: `parent_${s.id}`, name: `${s.parentName} (PH ${s.name})`, sub: `Phụ huynh - Lớp ${s.class}`, role: 'parent' }));
    }
    if (currentRole === 'parent') {
      // Can message all teachers
      return (teachers || []).map(t => ({ id: t.id, name: t.name, sub: t.subject, role: 'teacher' }));
    }
    return [];
  };

  const conversations = buildConversations();
  const contacts = buildContacts();

  // Get or start conversation
  const getConvMessages = (partnerId) => {
    return (directMessages || []).filter(m =>
      (m.fromId === me.id && m.toId === partnerId) ||
      (m.fromId === partnerId && m.toId === me.id)
    ).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  };

  const handleSelectConv = (partnerId, partnerName) => {
    setSelectedConv({ partnerId, partnerName });
    markMessageRead([partnerId]);
    setText('');
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedConv) return;
    sendDirectMessage(me.id, me.name, me.role, selectedConv.partnerId, selectedConv.partnerName,
      selectedConv.partnerRole || (currentRole === 'teacher' ? 'parent' : 'teacher'), text.trim());
    setText('');
  };

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv, directMessages]);

  const convMessages = selectedConv ? getConvMessages(selectedConv.partnerId) : [];

  // Filter contacts not yet in conversations
  const existingPartnerIds = conversations.map(c => c.partnerId);
  const newContacts = contacts.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return !existingPartnerIds.includes(c.id);
  });

  const filteredConvs = conversations.filter(c => !search || c.partnerName.toLowerCase().includes(search.toLowerCase()));

  const getInitials = (name) => name?.split(' ').pop()?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="glass-panel" style={{ padding: 0, height: 'calc(100vh - 140px)', display: 'flex', borderRadius: 20, overflow: 'hidden' }}>
      {/* Left: Conversations list */}
      <div style={{ width: 280, borderRight: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={18} color="#6366f1" /> Nhắn tin
          </h3>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              placeholder="Tìm cuộc trò chuyện..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, fontSize: '0.82rem' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Existing conversations */}
          {filteredConvs.map(conv => {
            const last = conv.messages[conv.messages.length - 1];
            const isSelected = selectedConv?.partnerId === conv.partnerId;
            return (
              <div
                key={conv.partnerId}
                onClick={() => handleSelectConv(conv.partnerId, conv.partnerName)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                  cursor: 'pointer', background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                  {getInitials(conv.partnerName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: conv.unread ? 700 : 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{conv.partnerName}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{last?.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                      {last?.fromId === me.id ? 'Bạn: ' : ''}{last?.text}
                    </p>
                    {conv.unread > 0 && (
                      <span style={{ background: '#6366f1', color: '#fff', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{conv.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* New contacts */}
          {newContacts.length > 0 && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Liên hệ mới
              </div>
              {newContacts.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectConv(c.id, c.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #34d399, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                    {getInitials(c.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.sub}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Right: Chat area */}
      {!selectedConv ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', gap: 12 }}>
          <Users size={48} style={{ opacity: 0.2 }} />
          <p style={{ fontSize: '0.9rem' }}>Chọn cuộc trò chuyện để bắt đầu</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chat header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
              {getInitials(selectedConv.partnerName)}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedConv.partnerName}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />Trực tuyến</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {convMessages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 40 }}>
                Bắt đầu cuộc trò chuyện với {selectedConv.partnerName}
              </div>
            )}
            {convMessages.map(msg => {
              const isMine = msg.fromId === me.id;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 8 }}>
                  {!isMine && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, alignSelf: 'flex-end' }}>
                      {getInitials(msg.fromName)}
                    </div>
                  )}
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMine ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(0,0,0,0.05)',
                      color: isMine ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.88rem', lineHeight: 1.5,
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: isMine ? 'flex-end' : 'flex-start', marginTop: 3 }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{msg.time}</span>
                      {isMine && (msg.read ? <CheckCheck size={11} color="#10b981" /> : <Check size={11} color="var(--text-muted)" />)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 10 }}>
            <input
              className="form-control"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Nhắn tin cho ${selectedConv.partnerName}...`}
              style={{ flex: 1, borderRadius: 30, padding: '10px 16px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: 42, height: 42, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
