import { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Trophy, Users, Calendar, Plus, Play, Sparkles, Medal, Award, CheckCircle } from 'lucide-react';

export default function MiniTournament() {
  const { currentRole, tournaments, setTournaments } = useContext(AppContext);
  const [activeTourneyId, setActiveTourneyId] = useState('T01');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newTourney, setNewTourney] = useState({
    title: '',
    subject: 'Toán học',
    startDate: '',
    endDate: ''
  });

  const activeTourney = useMemo(() => {
    return tournaments.find(t => t.id === activeTourneyId) || tournaments[0];
  }, [tournaments, activeTourneyId]);

  const handleJoin = (tourneyId) => {
    setTournaments(prev => prev.map(t => {
      if (t.id === tourneyId) {
        // Mock adding student to participants
        const userJoined = t.participants.some(p => p.id === 'HS001');
        if (userJoined) return t;

        const updatedParticipants = [
          ...t.participants,
          { id: 'HS001', name: 'Nguyễn Hoàng Nam', score: 0 }
        ];
        return {
          ...t,
          participants: updatedParticipants
        };
      }
      return t;
    }));
    alert('Đăng ký tham gia cuộc thi thành công!');
  };

  const handleCreateTournament = (e) => {
    e.preventDefault();
    if (!newTourney.title || !newTourney.startDate) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    const created = {
      id: `T0${tournaments.length + 1}`,
      title: newTourney.title,
      subject: newTourney.subject,
      status: 'upcoming',
      startDate: newTourney.startDate,
      endDate: newTourney.endDate || newTourney.startDate,
      participants: [],
      bracket: []
    };

    setTournaments(prev => [...prev, created]);
    setShowCreateModal(false);
    setNewTourney({ title: '', subject: 'Toán học', startDate: '', endDate: '' });
    alert('Tạo giải đấu/cuộc thi mới thành công!');
  };

  const isUserJoined = (tourney) => {
    return tourney.participants.some(p => p.id === 'HS001');
  };

  return (
    <div className="glass-panel animate-fade" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-ink)' }}>
            <Trophy size={24} />
            <span>Cuộc Thi Thách Đấu Học Tập Mini</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Tham gia các giải đấu trả lời nhanh, tích lũy điểm và giành cúp vô địch.
          </p>
        </div>

        {currentRole === 'teacher' && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Tạo cuộc thi mới</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        {/* Left pane: Tournament list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>Danh sách giải đấu</h3>
          {tournaments.map(t => (
            <div
              key={t.id}
              onClick={() => setActiveTourneyId(t.id)}
              className="glass-panel"
              style={{
                cursor: 'pointer',
                borderRadius: '12px',
                padding: '16px',
                border: activeTourneyId === t.id ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.06)',
                background: activeTourneyId === t.id ? 'var(--accent-soft)' : 'var(--surface)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className={`badge ${t.status === 'ongoing' ? 'badge-success' : 'badge-info'}`}>
                  {t.status === 'ongoing' ? 'Đang diễn ra' : t.status === 'completed' ? 'Kết thúc' : 'Sắp diễn ra'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-ink)' }}>{t.subject}</span>
              </div>
              
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.title}</h4>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <Calendar size={12} />
                <span>{t.startDate}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right pane: Bracket & Info */}
        <div className="glass-panel animate-fade" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0 }}>{activeTourney.title}</h3>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {activeTourney.participants.length} người tham gia</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Thời gian: {activeTourney.startDate} đến {activeTourney.endDate}</span>
              </div>
            </div>

            {activeTourney.status === 'upcoming' && (
              <button 
                onClick={() => handleJoin(activeTourney.id)}
                disabled={isUserJoined(activeTourney)}
                className={`btn ${isUserJoined(activeTourney) ? 'btn-secondary' : 'btn-primary'}`}
                style={{ gap: '6px' }}
              >
                {isUserJoined(activeTourney) ? (
                  <>
                    <CheckCircle size={16} />
                    <span>Đã tham gia</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Tham gia thi đấu</span>
                  </>
                )}
              </button>
            )}
          </div>

          {activeTourney.status === 'ongoing' && activeTourney.bracket.length > 0 ? (
            <div>
              <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                <Sparkles size={16} />
                <span>Sơ đồ nhánh đấu loại trực tiếp (Single Elimination)</span>
              </h4>

              {/* Tournament Bracket Tree layout using pure CSS Flexbox */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'stretch' }}>
                {activeTourney.bracket.map((round) => (
                  <div key={round.round} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '16px' }}>
                    <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-ink)', borderBottom: '2px solid var(--accent-soft)', paddingBottom: '8px', marginBottom: '8px' }}>
                      {round.name}
                    </div>

                    {round.matches.map((match) => (
                      <div 
                        key={match.id} 
                        style={{ 
                          background: 'var(--surface)', 
                          border: '1px solid rgba(0,0,0,0.08)', 
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: 'var(--sh-card)'
                        }}
                      >
                        {/* Player 1 slot */}
                        <div style={{ 
                          padding: '10px 12px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          background: match.winner === match.p1 ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          borderBottom: '1px solid rgba(0,0,0,0.05)',
                          alignItems: 'center'
                        }}>
                          <span style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: match.winner === match.p1 ? 700 : 500,
                            color: match.winner === match.p1 ? '#10b981' : 'var(--text-primary)'
                          }}>
                            {match.p1}
                          </span>
                          {match.winner === match.p1 && <Medal size={14} color="#10b981" />}
                        </div>

                        {/* Player 2 slot */}
                        <div style={{ 
                          padding: '10px 12px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          background: match.winner === match.p2 ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          alignItems: 'center'
                        }}>
                          <span style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: match.winner === match.p2 ? 700 : 500,
                            color: match.winner === match.p2 ? '#10b981' : 'var(--text-primary)'
                          }}>
                            {match.p2}
                          </span>
                          {match.winner === match.p2 && <Medal size={14} color="#10b981" />}
                        </div>
                        
                        {/* Score bar */}
                        {match.score && (
                          <div style={{ fontSize: '0.75rem', background: 'var(--bg-2)', textAlign: 'center', padding: '4px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Tỉ số: {match.score}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', height: '200px', textAlign: 'center' }}>
              <Award size={48} strokeWidth={1} style={{ marginBottom: '12px', color: 'var(--accent)' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Giải đấu sắp diễn ra. Sơ đồ nhánh đấu sẽ được tạo tự động khi giải bắt đầu.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div className="modal-content animate-fade" style={{ background: 'var(--surface)', padding: '24px', borderRadius: '20px', width: '90%', maxWidth: '450px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--accent-ink)' }}>Tạo Cuộc Thi Mới</h3>
            
            <form onSubmit={handleCreateTournament}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Tên cuộc thi</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={newTourney.title}
                  onChange={e => setNewTourney(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ví dụ: Đua Top Lý Thuyết Vật Lý 12"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Môn học</label>
                <select 
                  className="form-control"
                  value={newTourney.subject}
                  onChange={e => setNewTourney(prev => ({ ...prev, subject: e.target.value }))}
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Ngày bắt đầu</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={newTourney.startDate}
                  onChange={e => setNewTourney(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Ngày kết thúc</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={newTourney.endDate}
                  onChange={e => setNewTourney(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Tạo giải đấu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
