import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard({ classFilter, compact = false }) {
  const { students, mockExamHistory, selectedStudentId } = useContext(AppContext);
  const [period, setPeriod] = useState('all');
  const [anonymous, setAnonymous] = useState(false);

  // Calculate each student's best score from mock exam history
  const calcBestScore = (studentId) => {
    const history = (mockExamHistory || []).filter(r => r.studentId === studentId);
    if (!history.length) return null;

    let filtered = history;
    if (period === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = history.filter(r => r.date && new Date(r.date) >= weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = history.filter(r => r.date && new Date(r.date) >= monthAgo);
    }
    if (!filtered.length) filtered = history;

    const scores = filtered.map(r => r.totalScore || r.score || 0);
    return Math.max(...scores);
  };

  const calcAvgScore = (studentId) => {
    const history = (mockExamHistory || []).filter(r => r.studentId === studentId);
    if (!history.length) return 0;
    const scores = history.map(r => r.totalScore || r.score || 0);
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  const ranked = (students || [])
    .filter(s => !classFilter || s.class === classFilter)
    .map(s => ({
      ...s,
      bestScore: calcBestScore(s.id),
      avgScore: calcAvgScore(s.id),
      attempts: (mockExamHistory || []).filter(r => r.studentId === s.id).length,
    }))
    .filter(s => s.bestScore !== null && s.bestScore > 0)
    .sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));

  const myRank = ranked.findIndex(s => s.id === selectedStudentId) + 1;

  const RankIcon = ({ rank }) => {
    if (rank === 1) return <Trophy size={16} color="#f59e0b" />;
    if (rank === 2) return <Medal size={16} color="#94a3b8" />;
    if (rank === 3) return <Award size={16} color="#b45309" />;
    return <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: 16, textAlign: 'center' }}>#{rank}</span>;
  };

  const displayName = (s, rank) => {
    if (anonymous && s.id !== selectedStudentId) {
      return `Thí sinh #${rank}`;
    }
    return s.name;
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Trophy size={15} color="#f59e0b" />
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Top Thi Thử</span>
          {myRank > 0 && <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 600 }}>Bạn: #{myRank}</span>}
        </div>
        {ranked.slice(0, 5).map((s, i) => {
          const isMe = s.id === selectedStudentId;
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: isMe ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
              <RankIcon rank={i + 1} />
              <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: isMe ? 700 : 500, color: isMe ? '#6366f1' : 'var(--text-primary)' }}>
                {displayName(s, i + 1)}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? '#f59e0b' : 'var(--text-secondary)' }}>{s.bestScore}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={20} color="#f59e0b" /> Bảng Xếp Hạng Thi Thử
          {myRank > 0 && (
            <span style={{ fontSize: '0.78rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>
              Vị trí của bạn: #{myRank}
            </span>
          )}
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all', 'Tất cả'], ['month', 'Tháng'], ['week', 'Tuần']].map(([val, label]) => (
              <button key={val} onClick={() => setPeriod(val)} className={`btn ${period === val ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: 20 }}>{label}</button>
            ))}
          </div>
          <button
            onClick={() => setAnonymous(!anonymous)}
            className={`btn ${anonymous ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '0.78rem' }}
          >
            {anonymous ? '👤 Ẩn danh' : '👁 Hiển thị tên'}
          </button>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Trophy size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
          <p>Chưa có dữ liệu thi thử. Hãy làm bài thi thử để xuất hiện trên bảng xếp hạng!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Top 3 podium */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
            {[ranked[1], ranked[0], ranked[2]].filter(Boolean).map((s, idx) => {
              const realRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
              const height = realRank === 1 ? 90 : realRank === 2 ? 70 : 55;
              const podiumColor = realRank === 1 ? '#f59e0b' : realRank === 2 ? '#94a3b8' : '#b45309';
              const isMe = s?.id === selectedStudentId;
              return (
                <div key={s?.id} style={{ textAlign: 'center', width: 100 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s ? displayName(s, realRank) : '—'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s?.bestScore || '—'} đ</div>
                  <div style={{ height, background: `${podiumColor}${realRank === 1 ? '' : '99'}`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, border: isMe ? `2px solid #6366f1` : 'none' }}>
                    <span style={{ fontSize: realRank === 1 ? '1.5rem' : '1.1rem' }}>
                      {realRank === 1 ? '🏆' : realRank === 2 ? '🥈' : '🥉'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full list */}
          {ranked.map((s, i) => {
            const isMe = s.id === selectedStudentId;
            const rank = i + 1;
            return (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                borderRadius: 12, border: isMe ? '2px solid rgba(99,102,241,0.3)' : '1px solid rgba(0,0,0,0.06)',
                background: isMe ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.5)',
              }}>
                <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                  <RankIcon rank={rank} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: isMe ? 700 : 500, fontSize: '0.88rem', color: isMe ? '#6366f1' : 'var(--text-primary)' }}>
                    {displayName(s, rank)} {isMe && '(Bạn)'}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    Lớp {s.class} • {s.attempts} lần thi • TB: {s.avgScore}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: rank === 1 ? '#f59e0b' : rank <= 3 ? '#6366f1' : 'var(--text-primary)' }}>
                    {s.bestScore}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>điểm cao nhất</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
