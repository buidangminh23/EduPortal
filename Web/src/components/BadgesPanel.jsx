import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Trophy, Star, Medal, Award, Zap, Flame, BookOpen, Clock, Target, Heart } from 'lucide-react';

// Badge definitions
const BADGE_DEFS = [
  { id: 'top_gpa',       label: 'Học Bá',           icon: Trophy,   color: '#f59e0b', desc: 'ĐTB HK2 từ 9.0 trở lên',       check: (s) => { const v = Object.values(s.grades||{}); return v.length && v.reduce((a,b)=>a+b,0)/v.length >= 9.0; } },
  { id: 'improver',      label: 'Tiến Bộ Vượt Bậc', icon: Zap,      color: '#6366f1', desc: 'ĐTB tăng ít nhất 0.5 so với HK1', check: (s) => { const v1=Object.values(s.gradesSem1||{}), v2=Object.values(s.grades||{}); if(!v1.length||!v2.length) return false; return v2.reduce((a,b)=>a+b,0)/v2.length - v1.reduce((a,b)=>a+b,0)/v1.length >= 0.5; } },
  { id: 'all_paid',      label: 'Công Dân Gương Mẫu',icon: Medal,    color: '#10b981', desc: 'Đóng đủ tất cả học phí',         check: (s) => (s.feeStatus||[]).length > 0 && (s.feeStatus||[]).every(f => f.paid) },
  { id: 'full_attend',   label: 'Chuyên Cần',        icon: Flame,    color: '#ef4444', desc: 'Điểm danh đầy đủ (không vắng)',  check: (s, al) => { const logs = (al||[]).filter(l=>l.studentId===s.id); return logs.length >= 3 && logs.every(l=>l.status==='present'); } },
  { id: 'top_english',   label: 'Anh Ngữ Xuất Sắc', icon: Star,     color: '#0891b2', desc: 'Điểm Tiếng Anh HK2 từ 9.0',     check: (s) => (s.grades?.English||0) >= 9.0 },
  { id: 'top_math',      label: 'Vua Toán Học',      icon: Target,   color: '#8b5cf6', desc: 'Điểm Toán HK2 từ 9.0',          check: (s) => (s.grades?.Math||0) >= 9.0 },
  { id: 'bookworm',      label: 'Mọt Sách',          icon: BookOpen, color: '#f97316', desc: 'Điểm Ngữ Văn HK2 từ 8.5',       check: (s) => (s.grades?.Literature||0) >= 8.5 },
  { id: 'on_time',       label: 'Đúng Giờ Vàng',     icon: Clock,    color: '#10b981', desc: 'Không bị muộn trong tháng',      check: (s, al) => { const logs = (al||[]).filter(l=>l.studentId===s.id); return logs.length >= 2 && logs.every(l=>l.status!=='late'); } },
  { id: 'club_member',   label: 'Hoạt Động CLB',     icon: Heart,    color: '#ec4899', desc: 'Tham gia câu lạc bộ trường',     check: (s, al, ca) => (ca||[]).some(a=>a.studentId===s.id && a.status==='approved') },
  { id: 'top_science',   label: 'Nhà Khoa Học Trẻ',  icon: Award,    color: '#6366f1', desc: 'Điểm Vật lý HK2 từ 9.0',        check: (s) => (s.grades?.Physics||0) >= 9.0 },
];

export default function BadgesPanel({ studentId, compact = false }) {
  const { students, attendanceLogs, clubApplications, selectedStudentId } = useContext(AppContext);
  const sid = studentId || selectedStudentId || 'HS001';
  const student = students?.find(s => s.id === sid) || students?.[0];

  if (!student) return null;

  const earnedBadges = BADGE_DEFS.filter(b => {
    try { return b.check(student, attendanceLogs, clubApplications); }
    catch { return false; }
  });
  const lockedBadges = BADGE_DEFS.filter(b => !earnedBadges.find(e => e.id === b.id));

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {earnedBadges.slice(0, 6).map(b => {
          const Icon = b.icon;
          return (
            <div key={b.id} title={`${b.label}: ${b.desc}`} style={{ width: 32, height: 32, borderRadius: '50%', background: `${b.color}18`, border: `2px solid ${b.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Icon size={14} color={b.color} />
            </div>
          );
        })}
        {earnedBadges.length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Chưa có huy hiệu</span>}
        {earnedBadges.length > 6 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>+{earnedBadges.length - 6}</span>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trophy size={16} color="#f59e0b" /> Huy Hiệu Thành Tích
          <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', marginLeft: 4 }}>
            {earnedBadges.length}/{BADGE_DEFS.length}
          </span>
        </h4>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Huy hiệu được trao tự động dựa trên thành tích học tập</p>
      </div>

      {/* Earned */}
      {earnedBadges.length > 0 && (
        <>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>✅ Đã đạt được ({earnedBadges.length})</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            {earnedBadges.map(b => {
              const Icon = b.icon;
              return (
                <div key={b.id} style={{
                  border: `1.5px solid ${b.color}40`, borderRadius: 14, padding: '14px 12px',
                  background: `${b.color}08`, textAlign: 'center',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${b.color}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${b.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: `2px solid ${b.color}50` }}>
                    <Icon size={20} color={b.color} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: b.color, marginBottom: 4 }}>{b.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Locked */}
      {lockedBadges.length > 0 && (
        <>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>🔒 Chưa đạt ({lockedBadges.length})</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {lockedBadges.map(b => {
              const Icon = b.icon;
              return (
                <div key={b.id} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '14px 12px', background: 'rgba(0,0,0,0.02)', textAlign: 'center', opacity: 0.55 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Icon size={20} color="#94a3b8" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>{b.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
