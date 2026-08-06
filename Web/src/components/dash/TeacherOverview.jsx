import { useContext, useState } from 'react';
import { Users, ClipboardList, BarChart3, CheckCircle, ChevronRight, Calendar, Edit3, Plus, X, Phone } from 'lucide-react';
import { Stat, SectionCard, Pill, Bar, Avatar } from './DashUI';
import { AppContext } from '../../context/AppContext';
import { summariseAttendance } from '../../lib/domain/attendance';
import { roundGrade } from '../../lib/domain/grading';
import { subjectName } from '../../config/curriculum';

/**
 * Everything on this screen is scoped by the signed-in teacher's full name.
 *
 * That is the key the timetable, the assignment list and the teachers table all
 * store, so it is the only join available. A name the school does not hold
 * yields an empty screen rather than the whole school's work presented as this
 * teacher's — the failure mode is "chưa có dữ liệu", never someone else's class.
 */
const HONORIFIC = /^(Thầy|Cô)\s+/i;

/** Cycled over the class cards so they can be told apart. Carries no meaning. */
const CLASS_COLORS = ['blue', 'violet', 'mint', 'orange', 'pink', 'amber'];

/**
 * The exact day strings the timetable stores, indexed by `Date#getDay()`.
 *
 * `generateSmartTimetable` writes 'Thứ 2'…'Thứ 6', so a lesson is matched to
 * today by comparing these labels. Any other spelling silently matches nothing
 * and would empty a teacher's day.
 */
const TIMETABLE_DAY_LABEL = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/** The status `gradeSubmission` stamps; anything else is still waiting. */
const GRADED_STATUS = 'graded';

/**
 * Marks read off `student.grades` belong to semester II.
 *
 * The store keeps semester I in `gradesSem1` and writes every new mark into
 * `grades`, and there is no term selector to change that, so an unlabelled
 * average would read as cả năm to a teacher checking their class.
 */
const CURRENT_SEMESTER_LABEL = 'HK II';

/** What a card says when the school has recorded nothing for it yet. */
function EmptyNote({ children }) {
  return (
    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{children}</p>
  );
}

/**
 * `rate` is null until the register has been opened at least once, and that is
 * printed as the sentence saying so. Neither 0% nor the old literal 97% is true
 * of a class nobody has ticked off yet, and a teacher acts on both.
 */
const formatRate = (rate) => (rate === null ? 'Chưa điểm danh' : `${rate}%`);

/** A mark is written with one decimal place, the way a gradebook prints it. */
const formatMark = (value) => (Number.isFinite(value) ? value.toFixed(1) : '—');

/**
 * Mean of the ĐTBmhk already recorded for each subject, over the students who
 * hold one.
 *
 * Reported per subject and never rolled up into one number per class: Thông tư
 * 22 defines an average per subject and a band across at least six of them, and
 * nothing in between. The tile that used to read "GPA 8.1" was neither, and the
 * count is carried alongside so a mean over three students cannot pass for a
 * mean over forty.
 */
function summariseClassMarks(roster) {
  const totals = new Map();

  roster.forEach((student) => {
    Object.entries(student.grades || {}).forEach(([key, mark]) => {
      if (!Number.isFinite(mark)) return;
      const running = totals.get(key) || { sum: 0, count: 0 };
      totals.set(key, { sum: running.sum + mark, count: running.count + 1 });
    });
  });

  return [...totals.entries()]
    .map(([key, { sum, count }]) => ({ key, average: roundGrade(sum / count), count }))
    .sort((a, b) => subjectName(a.key).localeCompare(subjectName(b.key), 'vi'));
}

export default function TeacherOverview({ teacherName, onEnterGradesClick, onAssignHomeworkClick, onViewAssignmentsClick }) {
  const {
    students,
    teachers,
    timetableSlots,
    assignments,
    submissions,
    attendanceLogs,
    leaveRequests
  } = useContext(AppContext) || {};
  const [openClassName, setOpenClassName] = useState(null);

  const fullName = (teacherName || '').replace(HONORIFIC, '').trim();
  const teacher = fullName ? (teachers || []).find(item => item.name === fullName) || null : null;

  // The session carries a name, not a title. Addressing a teacher as Thầy or Cô
  // when nothing on file says which is a guess about a real person — the screen
  // used to make it twice over, defaulting to "Cô Hoa" for a signed-in teacher
  // it could not name at all.
  const honorific = ((teacherName || '').match(HONORIFIC)?.[1] || '').toLowerCase();
  const shortName = fullName ? fullName.split(' ').pop() : '';
  const greeting = !fullName
    ? 'Chào thầy cô'
    : honorific
      ? `Chào ${honorific} ${shortName}`
      : `Chào thầy cô ${fullName}`;

  /**
   * The classes this teacher is responsible for.
   *
   * Two records answer that and both are the school's own: the timetable says
   * which classes they teach, and the teachers table says which class they are
   * chủ nhiệm of. Nothing is inferred beyond those two.
   */
  const myClassNames = [...new Set([
    ...(timetableSlots || [])
      .filter(slot => fullName && slot.teacherName === fullName && slot.classTarget)
      .map(slot => slot.classTarget),
    ...(teacher?.classJoined ? [teacher.classJoined] : [])
  ])].sort();

  // A submission is this teacher's to mark only when it answers an assignment
  // this teacher set. Counting every unmarked paper in the school would send
  // them to a queue that is not theirs.
  const myAssignments = (assignments || []).filter(item => fullName && item.teacherName === fullName);
  const assignmentById = new Map(myAssignments.map(item => [item.id, item]));
  const gradingQueue = (submissions || [])
    .filter(item => assignmentById.has(item.assignmentId) && item.status !== GRADED_STATUS)
    .map(item => ({ submission: item, assignment: assignmentById.get(item.assignmentId) }));

  const classRows = myClassNames.map((name, index) => {
    const roster = (students || []).filter(student => student.class === name);
    const rosterIds = new Set(roster.map(student => student.id));
    return {
      name,
      color: CLASS_COLORS[index % CLASS_COLORS.length],
      roster,
      rosterIds,
      attendance: summariseAttendance(
        (attendanceLogs || []).filter(log => rosterIds.has(log.studentId)),
        leaveRequests || []
      ),
      marks: summariseClassMarks(roster),
      pending: gradingQueue.filter(entry => entry.assignment.classTarget === name).length
    };
  });

  const rosterIdsAcrossClasses = new Set(classRows.flatMap(row => [...row.rosterIds]));
  const overallAttendance = summariseAttendance(
    (attendanceLogs || []).filter(log => rosterIdsAcrossClasses.has(log.studentId)),
    leaveRequests || []
  );
  const totalStudents = rosterIdsAcrossClasses.size;

  const todayLabel = TIMETABLE_DAY_LABEL[new Date().getDay()];
  const todayLessons = (timetableSlots || [])
    .filter(slot => fullName && slot.teacherName === fullName && slot.dayOfWeek === todayLabel)
    .sort((a, b) => (a.period || 0) - (b.period || 0));

  const openRow = classRows.find(row => row.name === openClassName) || null;

  const studentById = new Map((students || []).map(student => [student.id, student]));
  const attendanceFor = (studentId) => summariseAttendance(
    (attendanceLogs || []).filter(log => log.studentId === studentId),
    leaveRequests || []
  );

  return (
    <>
      <div>
        <div className="page-head">
          <div>
            <h2 className="page-title">{greeting}</h2>
            <p className="page-sub">
              {myClassNames.length === 0
                ? 'Chưa có lớp nào được phân công cho thầy cô trong thời khoá biểu.'
                : <>Đang phụ trách <b style={{ color: 'var(--accent-ink)' }}>{myClassNames.length} lớp</b> · <b style={{ color: 'var(--accent-ink)' }}>{gradingQueue.length} bài</b> chờ chấm.</>}
            </p>
          </div>
          <div className="flex gap-12">
            <button className="btn btn-ghost" onClick={onEnterGradesClick}><Edit3 size={17} /> Nhập điểm</button>
            <button className="btn btn-primary" onClick={onAssignHomeworkClick}><Plus size={18} /> Giao bài tập</button>
          </div>
        </div>

        <div className="ds-grid cols-3" style={{ marginBottom: 20 }}>
          <Stat
            icon={Users}
            color="mint"
            val={String(totalStudents)}
            label="Tổng học sinh"
            sub={`${myClassNames.length} lớp phụ trách`}
            delay="d1"
          />
          <Stat
            icon={ClipboardList}
            color="orange"
            val={String(gradingQueue.length)}
            label="Bài chờ chấm"
            sub={`Trên ${myAssignments.length} bài tập đã giao`}
            delay="d2"
          />
          <Stat
            icon={CheckCircle}
            color="violet"
            val={overallAttendance.rate === null ? '—' : `${overallAttendance.rate}%`}
            label="Chuyên cần"
            sub={overallAttendance.total === 0
              ? 'Chưa có buổi điểm danh nào'
              : `Trên ${overallAttendance.total} buổi đã ghi nhận`}
            delay="d3"
          />
        </div>

        <div className="ds-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <div className="col" style={{ gap: 20 }}>
            <SectionCard
              title="Lớp của tôi"
              icon={Users}
              delay="d2"
              action={classRows.length > 0 && (
                <button onClick={() => setOpenClassName(classRows[0].name)} className="btn btn-soft btn-sm">Quản lý lớp</button>
              )}
            >
              {classRows.length === 0 ? (
                <EmptyNote>Chưa có lớp nào được phân công cho thầy cô trong thời khoá biểu.</EmptyNote>
              ) : (
                <div className="col" style={{ gap: 12 }}>
                  {classRows.map((row) => (
                    <div key={row.name} className="flex items-center gap-16" style={{ padding: 14, border: '1px solid var(--line)', borderRadius: 'var(--r-md)', cursor: 'pointer' }} onClick={() => setOpenClassName(row.name)}>
                      <div className={`chip-ico bg-${row.color} t-${row.color}`} style={{ width: 52, height: 52, fontFamily: 'Fredoka', fontWeight: 600, fontSize: '1.05rem' }}>{row.name}</div>
                      <div style={{ flex: 1 }}>
                        <div className="flex between items-center">
                          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Lớp {row.name}</span>
                          {row.pending > 0 && <Pill color="orange">{row.pending} bài chờ chấm</Pill>}
                        </div>
                        <div className="flex gap-16 muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 8 }}>
                          <span className="flex items-center gap-6"><Users size={14} /> {row.roster.length} HS</span>
                          <span className="flex items-center gap-6"><CheckCircle size={14} /> {formatRate(row.attendance.rate)}</span>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setOpenClassName(row.name); }} className="icon-btn" aria-label={`Chi tiết lớp ${row.name}`}><ChevronRight size={18} /></button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title={`Điểm trung bình môn đã nhập (${CURRENT_SEMESTER_LABEL})`} icon={BarChart3} delay="d3">
              {classRows.every(row => row.marks.length === 0) ? (
                <EmptyNote>Chưa có môn nào được nhập điểm cho các lớp của thầy cô.</EmptyNote>
              ) : (
                <div className="col" style={{ gap: 18, paddingTop: 4 }}>
                  {classRows.filter(row => row.marks.length > 0).map((row) => (
                    <div key={row.name} className="col" style={{ gap: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Lớp {row.name}</span>
                      {row.marks.map((mark) => (
                        <div key={mark.key}>
                          <div className="flex between" style={{ marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{subjectName(mark.key)}</span>
                            <span className={`t-${row.color}`} style={{ fontWeight: 800 }}>{formatMark(mark.average)}</span>
                          </div>
                          <Bar value={mark.average} color={row.color} />
                          <div className="muted" style={{ fontSize: '0.74rem', marginTop: 4 }}>Trung bình của {mark.count}/{row.roster.length} học sinh đã có điểm</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="col" style={{ gap: 20 }}>
            <SectionCard
              title="Hàng đợi chấm bài"
              icon={ClipboardList}
              delay="d3"
              action={gradingQueue.length > 0 && <Pill color="orange">{gradingQueue.length}</Pill>}
            >
              {gradingQueue.length === 0 ? (
                <EmptyNote>
                  {myAssignments.length === 0
                    ? 'Thầy cô chưa giao bài tập nào trên hệ thống.'
                    : 'Không còn bài nào chờ chấm.'}
                </EmptyNote>
              ) : (
                <>
                  <div className="col" style={{ gap: 6 }}>
                    {gradingQueue.map(({ submission, assignment }) => (
                      <div className="row" key={submission.id}>
                        <Avatar src={studentById.get(submission.studentId)?.avatarUrl} name={submission.studentName || ''} size={42} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{submission.studentName}</div>
                          <div className="muted" style={{ fontSize: '0.78rem' }}>
                            {assignment.title}{submission.class ? ` · Lớp ${submission.class}` : ''}
                          </div>
                        </div>
                        <button onClick={onViewAssignmentsClick} className="btn btn-soft btn-sm">Chấm</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={onViewAssignmentsClick} className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 10 }}>
                    Mở trang bài tập
                  </button>
                </>
              )}
            </SectionCard>

            <SectionCard title="Lịch dạy hôm nay" icon={Calendar} delay="d4">
              {todayLessons.length === 0 ? (
                <EmptyNote>Hôm nay thời khoá biểu không xếp tiết nào cho thầy cô.</EmptyNote>
              ) : (
                <div className="col" style={{ gap: 8 }}>
                  {/* The timetable stores a lesson number, and the school's bell
                      schedule is not in the app, so a tiết is shown as a tiết.
                      The clock times printed here before — 07:50, 09:45 — were
                      invented, and a teacher reads them as where to be when. */}
                  {todayLessons.map((slot) => (
                    <div className="tt-period" key={slot.id}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', minWidth: 56 }}>Tiết {slot.period}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Lớp {slot.classTarget}</div>
                        <div className="muted" style={{ fontSize: '0.78rem' }}>
                          {[slot.subject, slot.room].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {openRow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-panel animate-fade" style={{ background: '#fff', borderRadius: 24, padding: 24, maxWidth: 650, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                  Quản lý chi tiết: Lớp {openRow.name}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Danh sách học sinh, chuyên cần đã ghi nhận và liên lạc phụ huynh</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  value={openRow.name}
                  onChange={(e) => setOpenClassName(e.target.value)}
                  aria-label="Chọn lớp"
                  style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.15)', background: '#fff', fontWeight: 600, color: '#4f46e5' }}
                >
                  {classRows.map(row => (
                    <option key={row.name} value={row.name}>Lớp {row.name}</option>
                  ))}
                </select>
                <button onClick={() => setOpenClassName(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} aria-label="Đóng"><X size={18} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' }}>{openRow.roster.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sĩ số học sinh</div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: openRow.attendance.rate === null ? '0.9rem' : '1.4rem', fontWeight: 800, color: '#10b981' }}>{formatRate(openRow.attendance.rate)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Chuyên cần đã ghi nhận</div>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{openRow.pending}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Bài chờ chấm</div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '8px 0 10px', fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                Danh sách học sinh ({openRow.roster.length})
              </h4>
              {openRow.roster.length === 0 ? (
                <EmptyNote>Chưa có học sinh nào được xếp vào lớp này.</EmptyNote>
              ) : (
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <th scope="col" style={{ padding: '8px 12px', fontWeight: 600 }}>Mã HS</th>
                        <th scope="col" style={{ padding: '8px 12px', fontWeight: 600 }}>Học sinh</th>
                        <th scope="col" style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }}>Chuyên cần</th>
                        <th scope="col" style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }}>Liên lạc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openRow.roster.map((student, index) => (
                        <tr key={student.id} style={{ borderBottom: index < openRow.roster.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: '#4f46e5' }}>{student.id}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                              <Avatar src={student.avatarUrl} name={student.name} size={24} />
                              <span>{student.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{formatRate(attendanceFor(student.id).rate)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            {/* Only a number the school actually holds is dialled.
                                The placeholder that stood here rang 0900000000. */}
                            {student.parentPhone ? (
                              <a href={`tel:${student.parentPhone}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(79,70,229,0.08)', color: '#4f46e5', border: 'none', cursor: 'pointer' }} title={`Gọi phụ huynh${student.parentName ? ` ${student.parentName}` : ''}`}>
                                <Phone size={11} />
                              </a>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14, marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    onAssignHomeworkClick();
                    setOpenClassName(null);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.78rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Plus size={14} /> Giao bài tập
                </button>
                <button
                  onClick={() => {
                    onEnterGradesClick();
                    setOpenClassName(null);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.78rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Edit3 size={14} /> Nhập điểm nhanh
                </button>
              </div>
              <button onClick={() => setOpenClassName(null)} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.78rem', borderRadius: 8 }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
