import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Vote,
  Plus,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  ChevronRight,
  BarChart2,
  Calendar,
  Shield,
  Star,
} from 'lucide-react';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

function getInitials(name) {
  return name
    .split(' ')
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function VoteBar({ candidate, total, rank, animate }) {
  const pct = total > 0 ? Math.round((candidate.votes / total) * 100) : 0;
  const isWinner = rank === 0;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: getAvatarColor(rank),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {getInitials(candidate.name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {candidate.name}
              {isWinner && (
                <span style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                  🏆 Dẫn đầu
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{candidate.votes} phiếu</div>
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: isWinner ? '#f59e0b' : 'var(--text-primary)' }}>
          {pct}%
        </div>
      </div>
      <div
        style={{
          height: '10px',
          borderRadius: '6px',
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: animate ? `${pct}%` : '0%',
            borderRadius: '6px',
            background: isWinner
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(90deg, var(--accent-primary), #818cf8)',
            transition: 'width 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: isWinner ? '0 0 12px rgba(245,158,11,0.4)' : '0 0 8px rgba(79,70,229,0.3)',
          }}
        />
      </div>
    </div>
  );
}

export default function ClassVoting() {
  const { currentRole, students, selectedStudentId, classVotes, setClassVotes } = useContext(AppContext);
  const votes = classVotes;
  const setVotes = setClassVotes;
  const [selectedVote, setSelectedVote] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [animateBars, setAnimateBars] = useState({});
  const [notification, setNotification] = useState(null);
  const [filterClass, setFilterClass] = useState('Tất cả');

  const [newVote, setNewVote] = useState({
    title: '',
    position: '',
    class: '12A1',
    deadline: '',
    candidateNames: ['', ''],
  });

  const isAdminOrTeacher = currentRole === 'admin' || currentRole === 'teacher';
  const currentStudent = students?.find((s) => s.id === selectedStudentId);
  const studentClass = currentStudent?.class || '12A1';

  const allClasses = ['Tất cả', ...new Set(votes.map((v) => v.class))];

  const filteredVotes = votes.filter((v) => {
    if (isAdminOrTeacher) return filterClass === 'Tất cả' || v.class === filterClass;
    return v.class === studentClass;
  });

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenVote = (vote) => {
    setSelectedVote(vote);
    setTimeout(() => {
      setAnimateBars((prev) => ({ ...prev, [vote.id]: true }));
    }, 100);
  };

  const handleVote = (voteId, candidateId) => {
    if (!currentStudent) return;
    setVotes((prev) =>
      prev.map((v) => {
        if (v.id !== voteId) return v;
        if (v.votedStudentIds.includes(currentStudent.id)) return v;
        return {
          ...v,
          votedStudentIds: [...v.votedStudentIds, currentStudent.id],
          candidates: v.candidates.map((c) =>
            c.id === candidateId ? { ...c, votes: c.votes + 1 } : c
          ),
        };
      })
    );
    // Update selectedVote too
    setSelectedVote((prev) => {
      if (!prev || prev.id !== voteId) return prev;
      if (prev.votedStudentIds.includes(currentStudent.id)) return prev;
      return {
        ...prev,
        votedStudentIds: [...prev.votedStudentIds, currentStudent.id],
        candidates: prev.candidates.map((c) =>
          c.id === candidateId ? { ...c, votes: c.votes + 1 } : c
        ),
      };
    });
    showNotification('Bỏ phiếu thành công! Phiếu bầu của bạn đã được ghi nhận.', 'success');
  };

  const handleToggleStatus = (voteId) => {
    setVotes((prev) =>
      prev.map((v) =>
        v.id === voteId ? { ...v, status: v.status === 'open' ? 'closed' : 'open' } : v
      )
    );
    setSelectedVote((prev) =>
      prev && prev.id === voteId
        ? { ...prev, status: prev.status === 'open' ? 'closed' : 'open' }
        : prev
    );
    showNotification('Đã cập nhật trạng thái cuộc bầu cử.', 'info');
  };

  const handleCreateVote = (e) => {
    e.preventDefault();
    const validCandidates = newVote.candidateNames.filter((n) => n.trim());
    if (validCandidates.length < 2) {
      showNotification('Cần ít nhất 2 ứng viên!', 'error');
      return;
    }
    const created = {
      id: `V${Date.now()}`,
      title: newVote.title,
      class: newVote.class,
      position: newVote.position,
      status: 'open',
      deadline: newVote.deadline,
      candidates: validCandidates.map((name, i) => ({
        id: `CN${Date.now()}_${i}`,
        name,
        votes: 0,
      })),
      totalVoters: 35,
      votedStudentIds: [],
    };
    setVotes((prev) => [created, ...prev]);
    setShowCreateModal(false);
    setNewVote({ title: '', position: '', class: '12A1', deadline: '', candidateNames: ['', ''] });
    showNotification('Đã tạo cuộc bầu cử thành công!', 'success');
  };

  const addCandidateField = () => {
    if (newVote.candidateNames.length >= 8) return;
    setNewVote((prev) => ({ ...prev, candidateNames: [...prev.candidateNames, ''] }));
  };

  const updateCandidate = (idx, val) => {
    setNewVote((prev) => {
      const names = [...prev.candidateNames];
      names[idx] = val;
      return { ...prev, candidateNames: names };
    });
  };

  const totalVoted = (vote) => vote.candidates.reduce((a, c) => a + c.votes, 0);
  const sortedCandidates = (vote) =>
    [...vote.candidates].sort((a, b) => b.votes - a.votes);

  const hasVoted = (vote) => currentStudent && vote.votedStudentIds.includes(currentStudent.id);
  const canSeeResults = (vote) => isAdminOrTeacher || vote.status === 'closed' || hasVoted(vote);

  return (
    <div className="animate-fade">
      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background:
              notification.type === 'success'
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : notification.type === 'error'
                ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                : 'linear-gradient(135deg,#3b82f6,#2563eb)',
            color: '#fff',
            padding: '14px 22px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle size={18} />
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Vote size={22} color="#fff" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Bầu Ban Cán Sự Lớp</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isAdminOrTeacher ? 'Quản lý và theo dõi các cuộc bầu cử lớp' : `Bỏ phiếu dân chủ • Lớp ${studentClass}`}
          </p>
        </div>
        {isAdminOrTeacher && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ gap: '8px' }}>
            <Plus size={16} />
            Tạo cuộc bầu cử
          </button>
        )}
      </div>

      {/* Stats Row (admin/teacher) */}
      {isAdminOrTeacher && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Đang mở', value: votes.filter((v) => v.status === 'open').length, icon: <Unlock size={20} />, color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
            { label: 'Đã kết thúc', value: votes.filter((v) => v.status === 'closed').length, icon: <Lock size={20} />, color: '#6b7280', glow: 'rgba(107,114,128,0.1)' },
            { label: 'Tổng cuộc bầu', value: votes.length, icon: <BarChart2 size={20} />, color: '#667eea', glow: 'rgba(102,126,234,0.15)' },
            { label: 'Lớp tham gia', value: new Set(votes.map((v) => v.class)).size, icon: <Users size={20} />, color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: stat.glow, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Class filter (admin/teacher) */}
      {isAdminOrTeacher && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {allClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => setFilterClass(cls)}
              className={`btn ${filterClass === cls ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 16px', fontSize: '0.82rem', borderRadius: '20px' }}
            >
              {cls}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedVote ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Vote Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredVotes.length === 0 && (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Vote size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p>Chưa có cuộc bầu cử nào.</p>
            </div>
          )}
          {filteredVotes.map((vote) => {
            const voted = hasVoted(vote);
            const totalV = totalVoted(vote);
            const leader = sortedCandidates(vote)[0];
            const isSelected = selectedVote?.id === vote.id;
            return (
              <div
                key={vote.id}
                className="glass-panel"
                onClick={() => handleOpenVote(vote)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Status ribbon */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: vote.status === 'open' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6b7280,#4b5563)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '4px 14px',
                    borderBottomLeftRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {vote.status === 'open' ? <><Unlock size={10} /> Đang mở</> : <><Lock size={10} /> Đã kết thúc</>}
                </div>

                <div style={{ paddingRight: '100px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={18} color="#fff" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{vote.title}</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Vị trí: {vote.position} • Lớp {vote.class}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={13} /> {vote.candidates.length} ứng viên</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Vote size={13} /> {totalV}/{vote.totalVoters} phiếu</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} /> Hạn: {vote.deadline}</span>
                  </div>

                  {/* Mini progress bar */}
                  <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ height: '100%', width: `${(totalV / vote.totalVoters) * 100}%`, background: 'linear-gradient(90deg,var(--accent-primary),#818cf8)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.82rem' }}>
                      {leader && <span style={{ color: '#f59e0b', fontWeight: 600 }}>🏆 Dẫn đầu: {leader.name} ({leader.votes} phiếu)</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {voted && <span className="badge badge-success" style={{ fontSize: '0.72rem' }}><CheckCircle size={10} /> Đã bỏ phiếu</span>}
                      <ChevronRight size={16} style={{ color: 'var(--text-secondary)', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selectedVote && (
          <div className="glass-panel animate-fade" style={{ height: 'fit-content', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{selectedVote.title}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {totalVoted(selectedVote)}/{selectedVote.totalVoters} cử tri đã bỏ phiếu
                </p>
              </div>
              <button onClick={() => setSelectedVote(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <XCircle size={14} /> Đóng
              </button>
            </div>

            {/* Admin controls */}
            {isAdminOrTeacher && (
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${selectedVote.status === 'open' ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleToggleStatus(selectedVote.id)}
                  style={{ gap: '6px', fontSize: '0.82rem' }}
                >
                  {selectedVote.status === 'open' ? <><Lock size={13} /> Kết thúc bầu cử</> : <><Unlock size={13} /> Mở lại bầu cử</>}
                </button>
              </div>
            )}

            {/* Voting section for students */}
            {!isAdminOrTeacher && selectedVote.status === 'open' && !hasVoted(selectedVote) && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Vote size={15} /> Chọn ứng viên của bạn (ẩn danh)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedVote.candidates.map((candidate, idx) => (
                    <button
                      key={candidate.id}
                      onClick={() => handleVote(selectedVote.id, candidate.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        border: '2px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getAvatarColor(idx), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>
                        {getInitials(candidate.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{candidate.name}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Ứng viên #{idx + 1}</div>
                      </div>
                      <Star size={16} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isAdminOrTeacher && selectedVote.status === 'open' && hasVoted(selectedVote) && (
              <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#10b981' }}>
                <CheckCircle size={18} />
                <span>Bạn đã bỏ phiếu. Kết quả sẽ hiển thị sau khi bầu cử kết thúc.</span>
              </div>
            )}

            {/* Results / Bar Chart */}
            {canSeeResults(selectedVote) && (
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <BarChart2 size={15} />
                  Kết quả bầu cử
                  {selectedVote.status === 'open' && <span style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '2px 8px', borderRadius: '8px', marginLeft: '4px' }}>Theo dõi trực tiếp</span>}
                </div>
                {sortedCandidates(selectedVote).map((candidate, idx) => (
                  <VoteBar
                    key={candidate.id}
                    candidate={candidate}
                    total={totalVoted(selectedVote)}
                    rank={idx}
                    animate={animateBars[selectedVote.id]}
                  />
                ))}
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span><strong>Tổng phiếu:</strong> {totalVoted(selectedVote)}</span>
                  <span><strong>Tỷ lệ tham gia:</strong> {Math.round((totalVoted(selectedVote) / selectedVote.totalVoters) * 100)}%</span>
                  <span><strong>Hạn chót:</strong> {selectedVote.deadline}</span>
                </div>

                {selectedVote.status === 'closed' && (
                  <div style={{ marginTop: '16px', padding: '16px', background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(251,191,36,0.08))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', textAlign: 'center' }}>
                    <Trophy size={28} color="#f59e0b" style={{ marginBottom: '8px' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f59e0b' }}>
                      🎉 {sortedCandidates(selectedVote)[0]?.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Trúng cử vị trí {selectedVote.position} với {sortedCandidates(selectedVote)[0]?.votes} phiếu
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Student: closed vote, hasn't voted */}
            {!isAdminOrTeacher && selectedVote.status === 'closed' && !hasVoted(selectedVote) && !canSeeResults(selectedVote) && (
              <div style={{ padding: '14px 18px', background: 'rgba(107,114,128,0.1)', borderRadius: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <Lock size={20} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>Cuộc bầu cử đã kết thúc.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Vote Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Vote size={18} color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Tạo Cuộc Bầu Cử Mới</h2>
            </div>
            <form onSubmit={handleCreateVote}>
              <div className="form-group">
                <label className="form-label">Tiêu đề cuộc bầu cử *</label>
                <input type="text" className="form-control" placeholder="Ví dụ: Bầu Lớp Trưởng Lớp 12A1" value={newVote.title} onChange={(e) => setNewVote({ ...newVote, title: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Vị trí bầu *</label>
                  <input type="text" className="form-control" placeholder="Lớp Trưởng, Bí Thư..." value={newVote.position} onChange={(e) => setNewVote({ ...newVote, position: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Lớp mục tiêu</label>
                  <select className="form-control" value={newVote.class} onChange={(e) => setNewVote({ ...newVote, class: e.target.value })}>
                    {['12A1', '12A2', '11A1', '10A1'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hạn bầu cử</label>
                <input type="date" className="form-control" value={newVote.deadline} onChange={(e) => setNewVote({ ...newVote, deadline: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Danh sách ứng viên *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {newVote.candidateNames.map((name, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: getAvatarColor(idx), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <input type="text" className="form-control" placeholder={`Tên ứng viên ${idx + 1}`} value={name} onChange={(e) => updateCandidate(idx, e.target.value)} />
                    </div>
                  ))}
                </div>
                {newVote.candidateNames.length < 8 && (
                  <button type="button" onClick={addCandidateField} className="btn btn-secondary" style={{ marginTop: '8px', fontSize: '0.8rem', gap: '6px' }}>
                    <Plus size={13} /> Thêm ứng viên
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, gap: '6px' }}><Vote size={15} /> Tạo bầu cử</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
