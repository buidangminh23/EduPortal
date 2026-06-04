// GradeTrendChart — reusable SVG line chart for grade trends
// Props: student (object with gradesSem1 and grades), compact (bool)
export default function GradeTrendChart({ student, compact = false }) {
  if (!student) return null;

  const SUBJECTS = [
    { key: 'Math',       label: 'Toán',    color: '#6366f1' },
    { key: 'Literature', label: 'Văn',     color: '#f59e0b' },
    { key: 'Physics',    label: 'Lý',      color: '#10b981' },
    { key: 'English',    label: 'Anh',     color: '#0891b2' },
  ];

  const sem1 = student.gradesSem1 || {};
  const sem2 = student.grades || {};

  // Calculate averages
  const avg = (obj) => {
    const vals = Object.values(obj).filter(v => typeof v === 'number');
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };
  const avg1 = avg(sem1).toFixed(1);
  const avg2 = avg(sem2).toFixed(1);
  const diff = (parseFloat(avg2) - parseFloat(avg1)).toFixed(1);

  // SVG dimensions
  const W = compact ? 360 : 520;
  const H = compact ? 140 : 200;
  const padL = 36, padR = 20, padT = 16, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // X positions: 2 points per subject (HK1, HK2)
  const allPoints = [];
  SUBJECTS.forEach((s, i) => {
    const v1 = sem1[s.key] || 0;
    const v2 = sem2[s.key] || 0;
    allPoints.push({ x: i * (chartW / (SUBJECTS.length - 1 || 1)), y: v1, subject: s.key, semester: 1, color: s.color });
    allPoints.push({ x: i * (chartW / (SUBJECTS.length - 1 || 1)), y: v2, subject: s.key, semester: 2, color: s.color });
  });

  const toSVGY = (val) => padT + chartH - ((val / 10) * chartH);
  const toSVGX = (i) => padL + i * (chartW / (SUBJECTS.length - 1 || 1));

  const polyline = (points, sem) => {
    const pts = SUBJECTS.map((s, i) => {
      const val = sem === 1 ? (sem1[s.key] || 0) : (sem2[s.key] || 0);
      return `${toSVGX(i)},${toSVGY(val)}`;
    }).join(' ');
    return pts;
  };

  // Y-axis labels
  const yLabels = [5, 6, 7, 8, 9, 10];

  return (
    <div style={{ background: 'rgba(99,102,241,0.03)', borderRadius: 16, padding: compact ? '14px' : '20px', border: '1px solid rgba(99,102,241,0.1)' }}>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>📈 Xu hướng điểm số</h4>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,2" /></svg>
              HK1 ({avg1})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#6366f1" strokeWidth="2" /></svg>
              HK2 ({avg2})
            </span>
            <span style={{ fontWeight: 700, color: parseFloat(diff) >= 0 ? '#10b981' : '#ef4444' }}>
              {parseFloat(diff) >= 0 ? '▲' : '▼'} {Math.abs(diff)}
            </span>
          </div>
        </div>
      )}

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        {/* Y-axis gridlines and labels */}
        {yLabels.map(v => (
          <g key={v}>
            <line x1={padL} y1={toSVGY(v)} x2={W - padR} y2={toSVGY(v)} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <text x={padL - 4} y={toSVGY(v) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text>
          </g>
        ))}

        {/* Subject X-axis labels */}
        {SUBJECTS.map((s, i) => (
          <text key={s.key} x={toSVGX(i)} y={H - 6} textAnchor="middle" fontSize={compact ? 9 : 11} fill={s.color} fontWeight="600">
            {s.label}
          </text>
        ))}

        {/* HK1 line (dashed, grey) */}
        <polyline points={polyline(allPoints, 1)} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,3" />

        {/* HK2 lines per subject (solid, colored) */}
        {SUBJECTS.map((s, i) => {
          if (i === 0) return null;
          const x1 = toSVGX(i - 1), y1 = toSVGY(sem2[SUBJECTS[i - 1].key] || 0);
          const x2 = toSVGX(i), y2 = toSVGY(sem2[s.key] || 0);
          return <line key={s.key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />;
        })}

        {/* HK2 dots */}
        {SUBJECTS.map((s, i) => {
          const val = sem2[s.key] || 0;
          return (
            <g key={s.key}>
              <circle cx={toSVGX(i)} cy={toSVGY(val)} r={4} fill={s.color} stroke="white" strokeWidth="2" />
              {!compact && (
                <text x={toSVGX(i)} y={toSVGY(val) - 8} textAnchor="middle" fontSize="10" fill={s.color} fontWeight="700">{val}</text>
              )}
            </g>
          );
        })}

        {/* HK1 dots */}
        {SUBJECTS.map((s, i) => {
          const val = sem1[s.key] || 0;
          return (
            <circle key={s.key + '_1'} cx={toSVGX(i)} cy={toSVGY(val)} r={3} fill="white" stroke="#94a3b8" strokeWidth="2" />
          );
        })}
      </svg>

      {/* Compact summary */}
      {compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>HK1: <strong>{avg1}</strong></span>
          <span style={{ color: parseFloat(diff) >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
            {parseFloat(diff) >= 0 ? '▲' : '▼'} {Math.abs(diff)}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>HK2: <strong style={{ color: '#6366f1' }}>{avg2}</strong></span>
        </div>
      )}
    </div>
  );
}
