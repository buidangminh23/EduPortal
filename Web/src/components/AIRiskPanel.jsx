import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { AlertTriangle, ShieldCheck, Shield, TrendingDown, TrendingUp } from 'lucide-react';

// Risk level calculation based on student data
function calcRisk(student, attendanceLogs, submissions, assignments) {
  let riskScore = 0;
  const reasons = [];

  // 1. Attendance rate
  const myLogs = (attendanceLogs || []).filter(l => l.studentId === student.id);
  const totalDays = myLogs.length || 1;
  const presentDays = myLogs.filter(l => l.status === 'present').length;
  const attRate = presentDays / totalDays;
  if (attRate < 0.8 && myLogs.length > 0) {
    riskScore += 30;
    reasons.push(`Tỉ lệ điểm danh thấp: ${(attRate * 100).toFixed(0)}%`);
  }

  // 2. GPA
  const grades = student.grades ? Object.values(student.grades).filter(v => typeof v === 'number') : [];
  const gpa = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
  if (gpa < 5.0) { riskScore += 40; reasons.push(`Điểm trung bình thấp: ${gpa.toFixed(1)}`); }
  else if (gpa < 6.5) { riskScore += 15; reasons.push(`Điểm trung bình trung bình: ${gpa.toFixed(1)}`); }

  // 3. Grade trend (declining)
  const sem1 = student.gradesSem1 ? Object.values(student.gradesSem1).filter(v => typeof v === 'number') : [];
  const sem2 = student.grades ? Object.values(student.grades).filter(v => typeof v === 'number') : [];
  if (sem1.length && sem2.length) {
    const avg1 = sem1.reduce((a, b) => a + b, 0) / sem1.length;
    const avg2 = sem2.reduce((a, b) => a + b, 0) / sem2.length;
    if (avg2 < avg1 - 0.5) { riskScore += 20; reasons.push(`Điểm giảm so với HK1: -${(avg1 - avg2).toFixed(1)}`); }
  }

  // 4. Unpaid fees
  const unpaid = (student.feeStatus || []).filter(f => !f.paid).length;
  if (unpaid > 0) { riskScore += 10; reasons.push(`${unpaid} khoản học phí chưa đóng`); }

  // 5. Missing assignments
  const myClass = student.class;
  const classAssignments = (assignments || []).filter(a => a.classTarget === myClass);
  const mySubmissions = (submissions || []).filter(s => s.studentId === student.id);
  const missing = classAssignments.filter(a => !mySubmissions.find(s => s.assignmentId === a.id)).length;
  if (missing > 0) { riskScore += 10; reasons.push(`${missing} bài tập chưa nộp`); }

  // Risk level
  let level, color, textColor, bg, label;
  if (riskScore >= 50) { level = 'high'; color = '#ef4444'; textColor = '#b91c1c'; bg = 'rgba(239,68,68,0.08)'; label = 'Nguy cơ cao'; }
  else if (riskScore >= 25) { level = 'medium'; color = '#f59e0b'; textColor = '#92400e'; bg = 'rgba(245,158,11,0.08)'; label = 'Cần theo dõi'; }
  else { level = 'low'; color = '#047857'; textColor = '#047857'; bg = 'rgba(4,120,87,0.08)'; label = 'Ổn định'; }

  return { level, color, textColor, bg, label, riskScore, reasons, gpa: gpa.toFixed(1) };
}

export default function AIRiskPanel({ students: propStudents, compact = false, maxShow = 10 }) {
  const { students: ctxStudents, attendanceLogs, submissions, assignments } = useContext(AppContext);
  const allStudents = propStudents || ctxStudents || [];

  const withRisk = allStudents
    .map(s => ({ ...s, risk: calcRisk(s, attendanceLogs, submissions, assignments) }))
    .sort((a, b) => b.risk.riskScore - a.risk.riskScore)
    .slice(0, maxShow);

  const highRisk = withRisk.filter(s => s.risk.level === 'high').length;
  const medRisk = withRisk.filter(s => s.risk.level === 'medium').length;

  if (compact) {
    // Compact widget view for dashboard overview
    return (
      <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Shield size={16} color="#6366f1" />
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>AI Cảnh báo học lực</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c' }}>{highRisk}</div>
            <div style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 600 }}>Nguy cơ cao</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400e' }}>{medRisk}</div>
            <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 600 }}>Cần theo dõi</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(4,120,87,0.08)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>{withRisk.length - highRisk - medRisk}</div>
            <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>Ổn định</div>
          </div>
        </div>
        {withRisk.filter(s => s.risk.level !== 'low').slice(0, 3).map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.risk.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', flex: 1 }}>{s.name}</span>
            <span style={{ fontSize: '0.72rem', color: s.risk.textColor, fontWeight: 600 }}>{s.risk.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Nguy cơ cao', count: highRisk, color: '#ef4444', textColor: '#b91c1c', bg: 'rgba(239,68,68,0.08)', Icon: AlertTriangle },
          { label: 'Cần theo dõi', count: medRisk, color: '#f59e0b', textColor: '#92400e', bg: 'rgba(245,158,11,0.08)', Icon: Shield },
          { label: 'Ổn định', count: withRisk.length - highRisk - medRisk, color: '#047857', textColor: '#047857', bg: 'rgba(4,120,87,0.08)', Icon: ShieldCheck },
        ].map(item => (
          <div key={item.label} style={{ background: item.bg, borderRadius: 14, padding: '14px 18px', border: `1px solid ${item.color || item.textColor}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <item.Icon size={16} color={item.color || item.textColor} />
              <span style={{ fontSize: '0.78rem', color: item.textColor, fontWeight: 600 }}>{item.label}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: item.textColor }}>{item.count}</div>
          </div>
        ))}
      </div>

      {/* Student list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {withRisk.map(s => (
          <div key={s.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', background: 'rgba(255,255,255,0.6)', borderRadius: 14, border: `1px solid ${s.risk.color}25` }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.risk.color, flexShrink: 0, marginTop: 4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.name}</span>
                  <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.class} • ĐTB: {s.risk.gpa}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: s.risk.bg, color: s.risk.textColor }}>
                  {s.risk.label}
                </span>
              </div>
              {s.risk.reasons.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {s.risk.reasons.map((r, i) => (
                    <span key={i} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 99, background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}>
                      {s.risk.level === 'high' ? '⚠️' : s.risk.level === 'medium' ? '📌' : '✅'} {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {s.risk.level !== 'low'
                ? <TrendingDown size={18} color={s.risk.color} />
                : <TrendingUp size={18} color="#10b981" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
