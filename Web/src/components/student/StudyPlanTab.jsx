import { useState, useContext, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import {
  RefreshCw, BookOpen, Clock, CheckCircle2, Circle, Calendar,
  List, Sparkles, TrendingUp, Target, Zap, ChevronRight, ExternalLink, X
} from 'lucide-react';

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */
function generatePlan(competencies, studentId) {
  const myComps = competencies?.[studentId] || [];
  const weak   = myComps.filter(c => c.score < 50).sort((a, b) => a.score - b.score);
  const medium = myComps.filter(c => c.score >= 50 && c.score < 70);

  const tasks = [];
  let dayOffset = 1;

  weak.forEach(c => {
    tasks.push({
      id: `task-${dayOffset}`,
      week: 1,
      subject: c.subject,
      topic: c.topic,
      hours: 3,
      done: false,
      priority: 'high',
      score: c.score,
      resourceId: c.resourceId,
    });
    dayOffset++;
  });

  medium.forEach(c => {
    tasks.push({
      id: `task-${dayOffset}`,
      week: dayOffset <= 7 ? 2 : 3,
      subject: c.subject,
      topic: c.topic,
      hours: 2,
      done: false,
      priority: 'medium',
      score: c.score,
      resourceId: c.resourceId,
    });
    dayOffset++;
  });

  tasks.push({
    id: 'review',
    week: 4,
    subject: 'Tổng hợp',
    topic: 'Làm đề thi thử tổng hợp',
    hours: 4,
    done: false,
    priority: 'urgent',
  });

  return tasks;
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Khẩn cấp',     color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.2)' },
  high:   { label: 'Ưu tiên cao',  color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)' },
  medium: { label: 'Trung bình',   color: '#0891b2', bg: 'rgba(8,145,178,0.1)',   border: 'rgba(8,145,178,0.2)' },
  low:    { label: 'Bình thường',  color: '#059669', bg: 'rgba(5,150,105,0.1)',   border: 'rgba(5,150,105,0.2)' },
};

const WEEK_LABELS = {
  1: { title: 'Tuần 1', subtitle: 'Ôn tập chủ điểm yếu nhất', icon: '🔥', gradient: 'linear-gradient(135deg,#fee2e2,#fecaca)' },
  2: { title: 'Tuần 2', subtitle: 'Củng cố chủ đề trung bình', icon: '📚', gradient: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
  3: { title: 'Tuần 3', subtitle: 'Nâng cao & luyện đề',       icon: '⚡', gradient: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
  4: { title: 'Tuần 4', subtitle: 'Ôn tổng hợp & thi thử',    icon: '🎯', gradient: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' },
};

const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function StudyPlanTab() {
  const { studentCompetencies, selectedStudentId, students, learningResources } = useContext(AppContext);

  const studentId = selectedStudentId || 'HS001';

  const [tasks,    setTasks]    = useState(() => generatePlan(studentCompetencies, studentId));
  const [viewMode, setViewMode] = useState('list');   // 'list' | 'calendar'
  const [spinning, setSpinning] = useState(false);
  const [showTips, setShowTips] = useState(false);

  /* Recalculate stats */
  const totalHours     = tasks.reduce((s, t) => s + t.hours, 0);
  const completedHours = tasks.filter(t => t.done).reduce((s, t) => s + t.hours, 0);
  const completedCount = tasks.filter(t => t.done).length;
  const progressPct    = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  /* Toggle task done */
  const toggleDone = useCallback((id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }, []);

  /* Regenerate plan */
  const regenerate = () => {
    setSpinning(true);
    setTimeout(() => {
      const fresh = generatePlan(studentCompetencies, studentId);
      setTasks(fresh);
      setSpinning(false);
    }, 700);
  };

  /* Group tasks by week */
  const tasksByWeek = tasks.reduce((acc, t) => {
    if (!acc[t.week]) acc[t.week] = [];
    acc[t.week].push(t);
    return acc;
  }, {});

  const student = students?.find(s => s.id === studentId);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg,rgba(79,70,229,0.06),rgba(139,92,246,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={18} color="white" />
              </div>
              <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-primary)' }}>Kế Hoạch Ôn Thi Cá Nhân</h2>
              <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>4 tuần</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              AI tự động tạo kế hoạch dựa trên năng lực của <strong>{student?.name || 'bạn'}</strong> — tập trung vào điểm yếu trước
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.82rem', fontWeight: 600,
                  background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                <List size={14} />Danh sách
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  padding: '8px 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.82rem', fontWeight: 600,
                  background: viewMode === 'calendar' ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === 'calendar' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                <Calendar size={14} />Lịch tuần
              </button>
            </div>

            <button
              className="btn btn-primary"
              onClick={regenerate}
              style={{ gap: '7px', padding: '9px 18px' }}
            >
              <RefreshCw size={15} style={{ transform: spinning ? 'rotate(360deg)' : 'none', transition: 'transform 0.7s linear' }} />
              Tái tạo kế hoạch
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '14px', marginTop: '22px' }}>
          {[
            { icon: <Clock size={16} color="#4f46e5" />,       label: 'Giờ kế hoạch',  value: `${totalHours}h`,             bg: 'rgba(79,70,229,0.06)' },
            { icon: <CheckCircle2 size={16} color="#059669" />, label: 'Giờ hoàn thành', value: `${completedHours}h`,        bg: 'rgba(5,150,105,0.06)' },
            { icon: <BookOpen size={16} color="#0891b2" />,    label: 'Chủ đề đã xong', value: `${completedCount}/${tasks.length}`, bg: 'rgba(8,145,178,0.06)' },
            { icon: <TrendingUp size={16} color="#7c3aed" />,  label: 'Tiến độ',        value: `${progressPct}%`,            bg: 'rgba(124,58,237,0.06)' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                {s.icon}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div style={{ marginTop: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600 }}>Tiến độ tổng thể</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{progressPct}%</span>
          </div>
          <div style={{ height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
              borderRadius: '99px', transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(79,70,229,0.35)',
            }} />
          </div>
        </div>
      </div>

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[1, 2, 3, 4].map(week => {
            const weekTasks = tasksByWeek[week] || [];
            if (!weekTasks.length) return null;
            const wk = WEEK_LABELS[week];
            const weekDone = weekTasks.filter(t => t.done).length;
            return (
              <div key={week} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Week header */}
                <div style={{ background: wk.gradient, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.6rem' }}>{wk.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>{wk.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>{wk.subtitle}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>{weekDone}/{weekTasks.length} xong</span>
                    <div style={{ width: '80px', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${weekTasks.length ? (weekDone / weekTasks.length) * 100 : 0}%`, background: '#4f46e5', borderRadius: '99px', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div style={{ padding: '8px 0' }}>
                  {weekTasks.map((task, idx) => {
                    const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low;
                    const res = learningResources?.find(r => r.id === task.resourceId);
                    return (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '14px',
                          padding: '14px 22px',
                          borderBottom: idx < weekTasks.length - 1 ? '1px solid var(--border-card)' : 'none',
                          opacity: task.done ? 0.55 : 1, transition: 'opacity 0.2s',
                          background: task.done ? 'rgba(0,0,0,0.01)' : 'transparent',
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleDone(task.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', marginTop: '1px', flexShrink: 0 }}
                        >
                          {task.done
                            ? <CheckCircle2 size={22} color="#059669" fill="rgba(5,150,105,0.15)" />
                            : <Circle size={22} color="#cbd5e1" />}
                        </button>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{
                              textDecoration: task.done ? 'line-through' : 'none',
                              fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)',
                            }}>
                              {task.topic}
                            </span>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                              background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                            }}>
                              {pc.label}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <BookOpen size={12} /> {task.subject}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {task.hours} giờ
                            </span>
                            {task.score !== undefined && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Zap size={12} /> Điểm hiện tại: <strong style={{ color: task.score < 50 ? '#dc2626' : '#f97316' }}>{task.score}%</strong>
                              </span>
                            )}
                          </div>

                          {res && (
                            <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>
                              <ExternalLink size={11} />
                              Tài liệu: {res.title}
                            </div>
                          )}
                        </div>

                        {/* Hours badge */}
                        <div style={{
                          flexShrink: 0, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                          color: '#fff', borderRadius: '8px', padding: '4px 10px',
                          fontSize: '0.78rem', fontWeight: 800,
                        }}>
                          {task.hours}h
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Calendar View ── */}
      {viewMode === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[1, 2, 3, 4].map(week => {
            const weekTasks = tasksByWeek[week] || [];
            if (!weekTasks.length) return null;
            const wk = WEEK_LABELS[week];
            // distribute tasks across days
            const daySlots = DAYS_OF_WEEK.map((day, di) => ({
              day,
              tasks: weekTasks.filter((_, i) => i % DAYS_OF_WEEK.length === di),
            }));
            return (
              <div key={week} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ background: wk.gradient, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{wk.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1e293b' }}>{wk.title} — {wk.subtitle}</div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto', padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(110px,1fr))', gap: '8px', minWidth: '700px' }}>
                    {daySlots.map((slot, di) => (
                      <div key={di} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                        <div style={{ padding: '7px', background: 'rgba(79,70,229,0.06)', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5', borderBottom: '1px solid var(--border-card)' }}>
                          {slot.day}
                        </div>
                        <div style={{ padding: '8px', minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {slot.tasks.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'center', marginTop: '10px', opacity: 0.5 }}>—</div>
                          ) : slot.tasks.map(task => {
                            const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low;
                            return (
                              <div
                                key={task.id}
                                onClick={() => toggleDone(task.id)}
                                style={{
                                  padding: '5px 8px', borderRadius: '6px',
                                  background: task.done ? 'rgba(5,150,105,0.08)' : pc.bg,
                                  border: `1px solid ${task.done ? 'rgba(5,150,105,0.2)' : pc.border}`,
                                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                                  opacity: task.done ? 0.6 : 1, transition: 'opacity 0.2s',
                                  textDecoration: task.done ? 'line-through' : 'none',
                                  color: task.done ? '#059669' : pc.color,
                                  lineHeight: 1.35,
                                }}
                              >
                                {task.done ? '✓ ' : ''}{task.topic}
                                <div style={{ fontSize: '0.65rem', fontWeight: 400, marginTop: '2px', opacity: 0.75 }}>{task.hours}h • {task.subject}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── AI Tip Banner ── */}
      <div style={{
        padding: '16px 20px', borderRadius: '14px',
        background: 'linear-gradient(135deg,rgba(79,70,229,0.07),rgba(124,58,237,0.05))',
        border: '1px solid rgba(79,70,229,0.15)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{ width: '34px', height: '34px', flexShrink: 0, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={16} color="white" />
        </div>
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Lời khuyên AI:</strong>{' '}
          Kế hoạch được cá nhân hóa dựa trên điểm yếu của bạn. Hãy đánh dấu hoàn thành sau mỗi buổi học để theo dõi tiến độ chính xác. 
          Ôn tuần 1 kỹ nhất — đây là nền tảng quan trọng nhất!
          <button onClick={() => setShowTips(true)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', fontSize: '0.83rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            Xem thêm mẹo <ChevronRight size={13} />
          </button>
        </div>
      </div>
      {showTips && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: 'white', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Mẹo học theo kế hoạch AI</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Dựa trên tiến độ {progressPct}% và {completedHours}/{totalHours} giờ đã hoàn thành.</p>
              </div>
              <button className="icon-btn" onClick={() => setShowTips(false)} aria-label="Đóng"><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gap: 10, fontSize: '0.9rem', lineHeight: 1.5 }}>
              <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 10 }}>Ưu tiên hoàn thành các nhiệm vụ tuần 1 trước khi chuyển sang luyện đề.</div>
              <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 10 }}>Mỗi phiên học nên chia 45 phút tập trung và 10 phút nghỉ để giữ nhịp ôn thi ổn định.</div>
              <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 10 }}>Sau khi đánh dấu xong một chủ đề, làm lại ít nhất 5 câu trắc nghiệm cùng dạng để kiểm tra độ chắc.</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowTips(false)} style={{ width: '100%', marginTop: 16 }}>Đã hiểu</button>
          </div>
        </div>
      )}
    </div>
  );
}
