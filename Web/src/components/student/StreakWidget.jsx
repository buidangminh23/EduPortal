import { useState } from 'react';
import { Flame, CheckCircle2, Calendar } from 'lucide-react';

/* ─── MOCK DATA ───────────────────────────────────────────────────────────── */
function buildMockHeatmap() {
  // Last 28 days: mock pattern where the last 12 are studied
  const today = new Date();
  return Array.from({ length: 28 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (27 - i));
    // Studied in the last 12 days (streak = 12) plus some random days before
    const daysAgo = 27 - i;
    const studied = daysAgo < 12
      ? true           // current 12-day streak
      : daysAgo < 15
      ? false          // 3-day gap
      : daysAgo < 20
      ? Math.random() > 0.35 // sporadic
      : Math.random() > 0.6;
    return {
      date: date.toISOString().slice(0, 10),
      studied,
      label: `${date.getDate()}/${date.getMonth() + 1}`,
    };
  });
}

const INITIAL_STREAK  = 12;
const INITIAL_HEATMAP = buildMockHeatmap();

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */
function getMotivation(streak) {
  if (streak === 0)       return { text: 'Bắt đầu streak hôm nay! 🌱',              color: '#6b7280' };
  if (streak <= 3)        return { text: 'Khởi động tốt! Tiếp tục nhé! 💪',         color: '#059669' };
  if (streak <= 7)        return { text: 'Tuần học xuất sắc! 🌟',                   color: '#d97706' };
  if (streak <= 14)       return { text: 'Streak đỉnh cao! 🔥 Thành thần cũng!',    color: '#dc2626' };
  return                         { text: 'Huyền thoại! Không ai ngăn được bạn! 🏆', color: '#7c3aed' };
}

function getStreakBadge(streak) {
  if (streak === 0)  return null;
  if (streak <= 3)   return { label: 'Người mới', bg: '#dcfce7', color: '#166534' };
  if (streak <= 7)   return { label: 'Nhiệt huyết', bg: '#fef9c3', color: '#854d0e' };
  if (streak <= 14)  return { label: 'Lửa học tập 🔥', bg: '#fee2e2', color: '#991b1b' };
  return                    { label: 'HUYỀN THOẠI 🏆', bg: '#ede9fe', color: '#4c1d95' };
}

/* ─── COMPONENT ───────────────────────────────────────────────────────────── */
export default function StreakWidget() {
  const [streak,       setStreak]       = useState(INITIAL_STREAK);
  const [heatmap,      setHeatmap]      = useState(INITIAL_HEATMAP);
  const [checkedToday, setCheckedToday] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return Boolean(INITIAL_HEATMAP.find(d => d.date === today)?.studied);
  });
  const [fireAnim,     setFireAnim]     = useState(false);
  const [showToast,    setShowToast]    = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const handleCheckIn = () => {
    if (checkedToday) return;

    // Update heatmap
    setHeatmap(prev => prev.map(d =>
      d.date === today ? { ...d, studied: true } : d
    ));
    setStreak(s => s + 1);
    setCheckedToday(true);

    // Fire animation
    setFireAnim(true);
    setTimeout(() => setFireAnim(false), 1500);

    // Toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const motivation = getMotivation(streak);
  const badge      = getStreakBadge(streak);
  const isBig      = streak > 7;

  // Rows: 4 rows of 7 (last 28 days)
  const rows = [
    heatmap.slice(0, 7),
    heatmap.slice(7, 14),
    heatmap.slice(14, 21),
    heatmap.slice(21, 28),
  ];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '22px',
        position: 'relative',
        overflow: 'hidden',
        background: isBig
          ? 'linear-gradient(135deg,rgba(254,226,226,0.6),rgba(255,237,213,0.5))'
          : 'var(--glass-bg)',
      }}
    >
      {/* Success toast */}
      {showToast && (
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          background: 'linear-gradient(135deg,#059669,#10b981)',
          color: '#fff', borderRadius: '10px', padding: '10px 16px',
          fontSize: '0.82rem', fontWeight: 700, boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
          animation: 'fadeIn 0.3s ease',
          zIndex: 10,
        }}>
          ✅ Điểm danh thành công! Streak: {streak} ngày 🔥
        </div>
      )}

      {/* Decorative glows */}
      {isBig && (
        <>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'radial-gradient(circle,rgba(251,146,60,0.15),transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle,rgba(220,38,38,0.1),transparent 70%)', pointerEvents: 'none' }} />
        </>
      )}

      {/* ── Title row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Streak Học Tập
          </h3>
        </div>
        {badge && (
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px',
            borderRadius: '99px', background: badge.bg, color: badge.color,
          }}>
            {badge.label}
          </span>
        )}
      </div>

      {/* ── Streak number + fire ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            fontSize: '3.2rem', fontWeight: 900,
            background: streak > 7 ? 'linear-gradient(135deg,#dc2626,#f97316)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}>
            {streak}
          </span>
          {isBig && (
            <span style={{
              position: 'absolute', top: '-8px', right: '-18px',
              animation: fireAnim ? 'fireJump 0.4s ease alternate 3' : 'none',
              display: 'inline-block',
            }}>
              <Flame 
                size={22} 
                style={{ 
                  color: '#ef4444', 
                  fill: '#f97316',
                  filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.35))'
                }} 
              />
            </span>
          )}
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ngày liên tiếp</div>
          <div style={{ fontSize: '0.78rem', color: motivation.color, fontWeight: 700 }}>
            {motivation.text}
          </div>
        </div>
      </div>

      {/* ── 28-day heatmap ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <CheckCircle2 size={12} /> Lịch sử 28 ngày qua
        </div>

        {/* Day labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '4px' }}>
          {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{d}</div>
          ))}
        </div>

        {/* Heatmap squares */}
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '4px' }}>
            {row.map((day, di) => {
              const isToday = day.date === today;
              return (
                <div
                  key={di}
                  title={`${day.label} — ${day.studied ? 'Đã học ✓' : 'Chưa học'}`}
                  style={{
                    height: '22px', borderRadius: '4px',
                    background: day.studied
                      ? (isToday ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#10b981')
                      : 'rgba(0,0,0,0.07)',
                    border: isToday ? '2px solid #4f46e5' : '2px solid transparent',
                    cursor: 'default',
                    transition: 'transform 0.15s',
                    boxShadow: day.studied && isToday ? '0 0 6px rgba(79,70,229,0.35)' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.67rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px', display: 'inline-block' }} />Đã học
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', display: 'inline-block' }} />Nghỉ
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '2px', display: 'inline-block' }} />Hôm nay
          </span>
        </div>
      </div>

      {/* ── Check-in button ── */}
      <button
        onClick={handleCheckIn}
        disabled={checkedToday}
        className={checkedToday ? 'btn btn-secondary' : 'btn btn-primary'}
        style={{
          width: '100%',
          background: checkedToday ? undefined : 'linear-gradient(135deg,#f97316,#dc2626)',
          border: checkedToday ? undefined : 'none',
          boxShadow: checkedToday ? undefined : '0 4px 14px rgba(249,115,22,0.35)',
          fontSize: '0.88rem',
          padding: '11px',
        }}
      >
        {checkedToday ? (
          <>✅ Đã điểm danh hôm nay!</>
        ) : (
          <><Flame size={16} /> Điểm danh học hôm nay</>
        )}
      </button>

      {/* Fire jump keyframe */}
      <style>{`
        @keyframes fireJump {
          0%   { transform: translateY(0)   scale(1); }
          50%  { transform: translateY(-8px) scale(1.3); }
          100% { transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
