import { useState, useContext, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Shield,
  Coffee,
  DoorOpen,
  Plus,
  ChevronDown,
  X,
  BarChart2,
  User,
  CheckCircle,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

/* ─────────────────────────────────────────────
   Mock data
───────────────────────────────────────────── */
const mockTeachers = [
  { id: 'T01', name: 'Nguyễn Minh Triết' },
  { id: 'T02', name: 'Trần Thị Hồng Vân' },
  { id: 'T03', name: 'Phạm Đức Duy' },
  { id: 'T04', name: 'Lê Thu Hà' },
];

const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const SHIFTS = ['Sáng', 'Chiều'];
const DUTY_TYPES = ['Trực cổng', 'Trực trường', 'Trực căng tin'];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const DUTY_META = {
  'Trực cổng':    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: DoorOpen },
  'Trực trường':  { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: Shield   },
  'Trực căng tin':{ color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Coffee   },
};

const TEACHER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

function genId() {
  return 'D' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function DutyBadge({ duty, isOwn, onRemove, isAdmin }) {
  const meta = DUTY_META[duty.type] || {};
  const Icon = meta.icon || Shield;
  return (
    <div
      className="duty-badge"
      style={{
        background: isOwn ? meta.bg : 'var(--bg-card, rgba(255,255,255,0.06))',
        border: `1.5px solid ${isOwn ? meta.color : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 8,
        padding: '5px 8px',
        marginBottom: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        position: 'relative',
      }}
    >
      <Icon size={12} color={meta.color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: meta.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {duty.type}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {duty.teacherName}
        </div>
      </div>
      {isAdmin && (
        <button
          onClick={() => onRemove(duty.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#ef4444', flexShrink: 0 }}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

function StatsCard({ teacher, count, index }) {
  const color = TEACHER_COLORS[index % TEACHER_COLORS.length];
  const pct = Math.min((count / 10) * 100, 100);
  return (
    <div
      className="glass-panel"
      style={{
        padding: '18px 20px',
        borderRadius: 14,
        border: `1.5px solid ${color}30`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, left: 0,
          width: `${pct}%`, height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          borderRadius: '3px 3px 0 0',
          transition: 'width 0.6s ease',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <User size={16} color={color} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{teacher.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mã: {teacher.id}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color }}>{count}</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ca trực tháng này</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Modal: Add Duty
───────────────────────────────────────────── */
function AddDutyModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    day: DAYS[0],
    shift: SHIFTS[0],
    type: DUTY_TYPES[0],
    teacherId: mockTeachers[0].id,
  });

  function handleSubmit(e) {
    e.preventDefault();
    const teacher = mockTeachers.find(t => t.id === form.teacherId);
    onAdd({
      id: genId(),
      ...form,
      teacherName: teacher?.name ?? '',
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="var(--accent-primary)" />
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Thêm Ca Trực</h2>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ngày</label>
            <select className="form-control" value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
              {DAYS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Ca</label>
            <select className="form-control" value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}>
              {SHIFTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Loại trực</label>
            <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {DUTY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Giáo viên</label>
            <select className="form-control" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
              {mockTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle size={14} /> Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function DutySchedule() {
  const { currentRole, currentUser, dutySchedule, setDutySchedule } = useContext(AppContext);
  const isAdmin = currentRole === 'admin' || currentRole === 'teacher-admin';

  const duties = dutySchedule;
  const setDuties = setDutySchedule;
  const [showModal, setShowModal] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('all');

  /* Derive current teacher id from context (fallback for demo) */
  const myTeacherId = currentUser?.teacherId ?? 'T01';

  const addDuty = useCallback((duty) => {
    setDuties(prev => [...prev, duty]);
  }, [setDuties]);

  const removeDuty = useCallback((id) => {
    setDuties(prev => prev.filter(d => d.id !== id));
  }, [setDuties]);

  /* Stats */
  const statsData = mockTeachers.map(t => ({
    teacher: t,
    count: duties.filter(d => d.teacherId === t.id).length,
  }));

  /* Filtered duties for display */
  const visibleDuties = duties.filter(d => {
    if (!isAdmin) return true; // teacher sees all (own highlighted)
    if (filterTeacher === 'all') return true;
    return d.teacherId === filterTeacher;
  });

  return (
    <div className="glass-panel animate-fade" style={{ padding: 28, borderRadius: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            }}
          >
            <Calendar size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
              Lịch Trực Giáo Viên
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              Tuần này · {duties.length} ca trực đã phân công
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Filter */}
          {isAdmin && (
            <div style={{ position: 'relative' }}>
              <select
                className="form-control"
                value={filterTeacher}
                onChange={e => setFilterTeacher(e.target.value)}
                style={{ paddingRight: 32, minWidth: 160, fontSize: 13 }}
              >
                <option value="all">Tất cả giáo viên</option>
                {mockTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
            </div>
          )}

          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Thêm ca trực
            </button>
          )}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(DUTY_META).map(([type, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
              <Icon size={12} color={meta.color} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{type}</span>
            </div>
          );
        })}
        {!isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ca trực của bạn</span>
          </div>
        )}
      </div>

      {/* ── Schedule Table ── */}
      <div style={{ overflowX: 'auto', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.08)' }}>
        <table className="premium-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 100, padding: '14px 16px', textAlign: 'left', background: 'rgba(99,102,241,0.08)', borderRadius: '14px 0 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} color="var(--accent-primary)" />
                  Ngày
                </div>
              </th>
              {SHIFTS.map((shift, si) => (
                <th key={shift} style={{
                  padding: '14px 16px', textAlign: 'left',
                  background: 'rgba(99,102,241,0.08)',
                  borderRadius: si === SHIFTS.length - 1 ? '0 14px 0 0' : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color="var(--accent-primary)" />
                    Ca {shift}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) => (
              <tr key={day} style={{ background: di % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {day}
                </td>
                {SHIFTS.map(shift => {
                  const cellDuties = visibleDuties.filter(d => d.day === day && d.shift === shift);
                  return (
                    <td key={shift} style={{ padding: '10px 12px', verticalAlign: 'top', borderTop: '1px solid rgba(255,255,255,0.06)', minWidth: 200 }}>
                      {cellDuties.length === 0 ? (
                        <div style={{
                          border: '1.5px dashed rgba(255,255,255,0.12)',
                          borderRadius: 8, padding: '8px 12px',
                          fontSize: 12, color: 'var(--text-secondary)',
                          textAlign: 'center',
                        }}>
                          Chưa phân công
                        </div>
                      ) : (
                        cellDuties.map(duty => (
                          <DutyBadge
                            key={duty.id}
                            duty={duty}
                            isOwn={!isAdmin && duty.teacherId === myTeacherId}
                            isAdmin={isAdmin}
                            onRemove={removeDuty}
                          />
                        ))
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Statistics Section ── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <BarChart2 size={18} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Thống Kê Tháng Này</h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 14,
          }}
        >
          {statsData.map(({ teacher, count }, idx) => (
            <StatsCard key={teacher.id} teacher={teacher} count={count} index={idx} />
          ))}
        </div>
      </div>

      {/* ── Duty Type Summary ── */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.entries(DUTY_META).map(([type, meta]) => {
          const Icon = meta.icon;
          const cnt = duties.filter(d => d.type === type).length;
          return (
            <div
              key={type}
              style={{
                flex: '1 1 140px',
                background: meta.bg,
                border: `1.5px solid ${meta.color}30`,
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={meta.color} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: meta.color }}>{cnt}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{type}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <AddDutyModal onClose={() => setShowModal(false)} onAdd={addDuty} />
      )}
    </div>
  );
}
