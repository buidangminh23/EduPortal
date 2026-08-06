import { useContext, useMemo, useState } from 'react';
import { Users, GraduationCap, CheckCircle, BarChart3, Bell, Clock, Calendar, Wallet, LayoutGrid, Megaphone, ClipboardList, FileText, Lock, Unlock } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { SCHOOL } from '../../config/school';
import { Stat, SectionCard, Bar } from './DashUI';
import { isValidIsoDate, summariseDailyAttendance } from '../../lib/domain/attendance';
import { isValidSchoolYear } from '../../lib/domain/schoolYear';

/**
 * The semester every figure on this page belongs to, when the context has not
 * said which.
 *
 * The store keeps semester I in `gradesSem1` and writes everything new into
 * `grades`, with no term selector to change that, so semester II is the only
 * term this screen can be describing.
 *
 * The năm học beside it is no longer a literal: the store stamps every mark,
 * nhận xét and kết quả rèn luyện with one and the context hands it to this
 * screen, so it is printed when it arrives and left off when it does not.
 */
const CURRENT_SEMESTER_LABEL = 'Học kỳ II';

/**
 * What `AppContext` calls the read that fills the lock state, word for word.
 *
 * The same constant, and the same reasoning, as in `TeacherDashboard`:
 * `isGradebookLocked` reads false while that read is in flight and false again
 * when it failed, and neither is the school saying the sổ điểm is open. Kept in
 * both files rather than shared because the two screens need different
 * sentences out of it; when the context grows an honest status of its own, both
 * copies go.
 */
const LOCK_CHECK_LABEL = 'kiểm tra trạng thái khoá sổ điểm';

/** Học kỳ as a school writes it. A value that is not a term has no numeral. */
const SEMESTER_NUMERAL = { 1: 'I', 2: 'II' };

/**
 * Cycled over derived rows so bars can be told apart. Carries no meaning — the
 * khối and lớp a school runs are read off the roster, so neither how many there
 * are nor what order they come in is known when this file is written.
 */
const ROW_COLORS = ['blue', 'violet', 'mint', 'orange', 'pink', 'amber'];

/** Entries the activity panel shows at a glance; the full record is the nhật ký. */
const ACTIVITY_ROW_COUNT = 5;

/** Notices the sidebar shows; the rest live on the thông báo screen. */
const NEWS_ROW_COUNT = 4;

const formatDayMonth = (iso) => (isValidIsoDate(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');

const formatFullDate = (iso) => (isValidIsoDate(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');

/**
 * A timestamp as a school reads it, or null when the value is not one.
 *
 * Null rather than a dash, so the caller drops the clause instead of printing
 * "lúc —" beside an act it cannot date.
 */
function formatMoment(value) {
  if (typeof value !== 'string' || value === '') return null;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return null;

  const pad = (part) => String(part).padStart(2, '0');
  return `${pad(at.getHours())}:${pad(at.getMinutes())} ngày `
    + `${pad(at.getDate())}/${pad(at.getMonth() + 1)}/${at.getFullYear()}`;
}

/**
 * The sổ điểm being talked about, named so the answer belongs to one năm học.
 *
 * A lock is keyed by (năm học, học kỳ), and a học bạ follows a pupil for three
 * years — "đã khoá học kỳ II" without the year names one of three books.
 */
function describePeriod(schoolYear, semester) {
  const numeral = SEMESTER_NUMERAL[semester];
  if (numeral && isValidSchoolYear(schoolYear)) return `học kỳ ${numeral} năm học ${schoolYear}`;
  if (numeral) return `học kỳ ${numeral}`;
  return 'học kỳ này';
}

/**
 * What this screen actually knows about the lock, as opposed to what an absent
 * lock row looks like. `known: false` is neither mở nor khoá — it is the state
 * where nobody has answered, and it is shown as that.
 */
function readGradebookLock({ isGradebookLocked, gradebookLock, storeError }) {
  if (storeError?.what === LOCK_CHECK_LABEL) return { known: false, locked: false, row: null };
  if (typeof isGradebookLocked !== 'boolean') return { known: false, locked: false, row: null };
  return { known: true, locked: isGradebookLocked, row: gradebookLock ?? null };
}

/**
 * Who an account id belongs to when the staff list can say, and the id itself,
 * labelled as an id, when it cannot. `locked_by` is a profile UUID; printed
 * bare after "do" it would read as somebody's name.
 */
function describeActor(id, staff) {
  if (!id) return 'không rõ tài khoản';
  const match = (staff || []).find((person) => person.id === id);
  return match?.name || `tài khoản ${id}`;
}

/** What a card says when the school has recorded nothing of this kind yet. */
function EmptyNote({ children }) {
  return (
    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{children}</p>
  );
}

/**
 * Closing and re-opening the sổ điểm, which is Ban Giám Hiệu's alone.
 *
 * Closing stops every teacher in the school entering or correcting a mark for
 * that học kỳ, so it is not a toggle: the button opens a sentence that says
 * what happens and asks again. Re-opening is not the peer of closing and is not
 * drawn as one — it hands a chốt học kỳ back to the whole staff, and the school
 * almost never wants that, because Ban Giám Hiệu can correct a mark inside a
 * closed book and the correction goes into nhật ký sửa điểm on the way.
 *
 * The row-level policy on gradebook_locks is the control. This card is the part
 * a person reads before they use it.
 */
export function GradebookLockCard({ lock, schoolYear, semester, staff, onSetLocked }) {
  const [pending, setPending] = useState(null);
  const [errors, setErrors] = useState([]);

  const period = describePeriod(schoolYear, semester);

  const apply = (locked) => {
    const outcome = onSetLocked ? onSetLocked(locked) : { ok: false, errors: ['Màn hình chưa nối được với thao tác khoá sổ điểm.'] };
    setErrors(outcome?.ok ? [] : (outcome?.errors || ['Lỗi không rõ.']));
    if (outcome?.ok) setPending(null);
  };

  const confirmation = pending && (
    <div style={{ marginTop: 12, border: '1px solid var(--line-strong)', borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.55 }}>
        {pending === 'lock'
          ? `Khoá sổ điểm ${period} sẽ chặn mọi giáo viên trong trường nhập hoặc sửa điểm, `
            + 'nhận xét và kết quả rèn luyện của học kỳ này. Ban Giám Hiệu vẫn sửa được, và mỗi lần '
            + 'sửa được ghi vào nhật ký sửa điểm. Xác nhận khoá?'
          : `Mở lại sổ điểm ${period} trả quyền sửa điểm cho toàn bộ giáo viên trong một học kỳ nhà `
            + 'trường đã chốt. Nếu chỉ cần sửa vài điểm, Ban Giám Hiệu sửa trực tiếp được mà không phải '
            + 'mở sổ. Vẫn mở lại?'}
      </p>
      <div className="flex gap-12" style={{ marginTop: 12 }}>
        {pending === 'lock' ? (
          <>
            <button className="btn btn-primary btn-sm" onClick={() => apply(true)}>Xác nhận khoá sổ điểm</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPending(null); setErrors([]); }}>Huỷ</button>
          </>
        ) : (
          <>
            {/* Cancel is the emphasised button on this path on purpose. */}
            <button className="btn btn-primary btn-sm" onClick={() => { setPending(null); setErrors([]); }}>Giữ sổ đã khoá</button>
            <button className="btn btn-ghost btn-sm" onClick={() => apply(false)}>Vẫn mở lại sổ điểm</button>
          </>
        )}
      </div>
    </div>
  );

  const body = () => {
    if (!lock.known) {
      return (
        <EmptyNote>
          Chưa đọc được trạng thái khoá sổ điểm {period}. Màn hình không kết luận sổ đang mở —
          tải lại trang để hỏi lại nhà trường.
        </EmptyNote>
      );
    }

    if (!lock.locked) {
      return (
        <>
          <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.55 }}>
            Sổ điểm {period} <b>đang mở</b>. Giáo viên nhập và sửa được điểm của học kỳ này.
          </p>
          {!pending && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setPending('lock')}>
              <Lock size={15} />
              {SEMESTER_NUMERAL[semester]
                ? ` Khoá sổ điểm học kỳ ${SEMESTER_NUMERAL[semester]}`
                : ' Khoá sổ điểm'}
            </button>
          )}
        </>
      );
    }

    const at = formatMoment(lock.row?.locked_at);
    const by = lock.row?.locked_by ? describeActor(lock.row.locked_by, staff) : null;

    return (
      <>
        <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.55 }}>
          Sổ điểm {period} <b>đã khoá</b>{at ? ` lúc ${at}` : ''}{by ? `, do ${by}` : ''}.
          Giáo viên không sửa được nữa; Ban Giám Hiệu sửa được, và mỗi lần sửa được ghi vào nhật ký sửa điểm.
        </p>
        {!pending && (
          <button
            onClick={() => setPending('unlock')}
            style={{
              marginTop: 10,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Unlock size={13} /> Mở lại sổ điểm — trường hợp ngoại lệ
          </button>
        )}
      </>
    );
  };

  return (
    <SectionCard title="Khoá sổ điểm" icon={Lock} delay="d1">
      {body()}
      {confirmation}
      {errors.length > 0 && (
        <div role="alert" style={{ marginTop: 12 }}>
          {errors.map(error => (
            <div key={error} style={{ fontSize: '0.8rem', color: 'var(--danger, #b91c1c)' }}>{error}</div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default function AdminOverview({
  onOpenStudents,
  onOpenTeachers,
  onOpenTimetable,
  onOpenJournal,
  onOpenFinance,
  onOpenAnnouncements,
  onOpenMockExams,
}) {
  const {
    students,
    teachers,
    attendanceLogs,
    leaveRequests,
    announcements,
    bulletins,
    journalEntries,
    lessonPlans,
    schoolYear,
    semester,
    gradebookLock,
    isGradebookLocked,
    setGradebookLocked,
    storeError,
  } = useContext(AppContext) || {};

  /** Khoá, mở, or — the third state — not answered. See `readGradebookLock`. */
  const lockState = readGradebookLock({ isGradebookLocked, gradebookLock, storeError });

  const semesterLabel = SEMESTER_NUMERAL[semester]
    ? `Học kỳ ${SEMESTER_NUMERAL[semester]}`
    : CURRENT_SEMESTER_LABEL;

  /**
   * The school as its own roster describes it.
   *
   * Every headline below counts rows that exist. The tiles that used to sit
   * here — 1.842 học sinh (+64 năm nay), 128 giáo viên (12 tổ bộ môn) — were
   * literals: they did not move when a student was enrolled, and nothing in
   * the app compares one year's intake with the last, so the +64 and the trend
   * arrow beside it could not have come from anywhere.
   */
  const roster = useMemo(() => {
    const list = students || [];
    const classNames = [...new Set(list.map(student => student.class).filter(Boolean))].sort();
    const gradeNames = [...new Set(list.map(student => student.grade).filter(Boolean))].sort();

    return {
      total: list.length,
      classNames,
      grades: gradeNames.map(grade => ({
        grade,
        count: list.filter(student => student.grade === grade).length
      }))
    };
  }, [students]);

  /**
   * Distinct subjects the staff list covers.
   *
   * Not "tổ bộ môn": a tổ groups several subjects and the app holds no such
   * grouping, so counting subjects and calling them tổ would overstate what
   * the staff list knows.
   */
  const subjectCount = useMemo(
    () => new Set((teachers || []).map(teacher => teacher.subject).filter(Boolean)).size,
    [teachers]
  );

  /**
   * The register as of the last day it was opened.
   *
   * The day is read off the records rather than off the clock. A school-wide
   * figure pinned to today reads 0% every morning until the first GVCN ticks
   * anyone off, which states an absence the school never recorded.
   *
   * `rate` is null while nothing has been recorded, and `recorded` is carried
   * beside it everywhere the rate is shown, so a percentage over three ticked
   * students can never be read as covering the whole roster.
   */
  const register = useMemo(() => {
    const list = students || [];
    const leaves = leaveRequests || [];
    const dated = (attendanceLogs || []).filter(log => isValidIsoDate(log.date));
    const latestDate = dated.reduce((latest, log) => (log.date > latest ? log.date : latest), '');
    const onLatestDate = latestDate ? dated.filter(log => log.date === latestDate) : [];

    return {
      date: latestDate || null,
      school: summariseDailyAttendance(list.map(student => student.id), onLatestDate, leaves),
      classes: roster.classNames.map(name => ({
        name,
        summary: summariseDailyAttendance(
          list.filter(student => student.class === name).map(student => student.id),
          onLatestDate,
          leaves
        )
      }))
    };
  }, [students, attendanceLogs, leaveRequests, roster.classNames]);

  /**
   * Recent activity, built only from records that carry their own date.
   *
   * The old feed named four people who do not work here doing things that
   * never happened, one of them "Hệ thống · sao lưu dữ liệu định kỳ thành
   * công". Nothing in this application takes or verifies a backup, and a hiệu
   * trưởng who reads that line stops asking the one question a self-hosted
   * deployment lives or dies by.
   *
   * Every source below stamps the day the record was filed and nothing finer,
   * so each row is dated. "5 phút trước" is not derivable and is not shown.
   */
  const activity = useMemo(() => {
    const rows = [
      ...(bulletins || []).map(bulletin => ({
        id: `bulletin-${bulletin.id}`,
        date: bulletin.date,
        who: bulletin.authorName,
        action: `đã đăng bảng tin “${bulletin.title}”`,
        Icon: Megaphone,
        color: 'violet'
      })),
      ...(journalEntries || []).map(entry => ({
        id: `journal-${entry.id}`,
        date: entry.date,
        who: entry.teacher,
        action: `đã ghi sổ đầu bài môn ${entry.subject}${entry.class ? ` lớp ${entry.class}` : ''}`,
        Icon: ClipboardList,
        color: 'blue'
      })),
      ...(lessonPlans || []).map(plan => ({
        id: `plan-${plan.id}`,
        date: plan.date,
        who: plan.teacherName,
        action: `đã nộp giáo án “${plan.title}”`,
        Icon: FileText,
        color: 'mint'
      }))
    ];

    return rows
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, ACTIVITY_ROW_COUNT);
  }, [bulletins, journalEntries, lessonPlans]);

  // Sorted rather than filtered on date: a notice the school really issued must
  // appear even if its date is unreadable, and it is dated "—" when it is.
  const notices = useMemo(
    () => [...(announcements || [])]
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, NEWS_ROW_COUNT),
    [announcements]
  );

  const largestGrade = Math.max(...roster.grades.map(row => row.count), 1);

  const downloadCsv = (filename, rows) => {
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    const totalFees = (students || []).reduce((sum, student) => (
      sum + (student.feeStatus || []).reduce((feeSum, fee) => feeSum + (fee.paid ? fee.amount : 0), 0)
    ), 0);
    const rows = [
      ['Chi so', 'Gia tri'],
      ['Tong hoc sinh', students?.length || 0],
      ['Tong giao vien', teachers?.length || 0],
      ['Luot diem danh', attendanceLogs?.length || 0],
      ['Thong bao da phat hanh', bulletins?.length || 0],
      ['Tong hoc phi da thu', totalFees],
    ];
    downloadCsv(`bao-cao-eduportal-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleQuickAction = (action) => {
    if (action === 'students') onOpenStudents && onOpenStudents();
    if (action === 'teachers') onOpenTeachers && onOpenTeachers();
    if (action === 'timetable') onOpenTimetable && onOpenTimetable();
    if (action === 'finance') onOpenFinance && onOpenFinance();
  };

  const quickActions = [
    { label: 'Quản lý HS', icon: GraduationCap, color: 'blue', action: 'students' },
    { label: 'Quản lý GV', icon: Users, color: 'mint', action: 'teachers' },
    { label: 'Thời khóa biểu', icon: Calendar, color: 'violet', action: 'timetable' },
    { label: 'Thu học phí', icon: Wallet, color: 'orange', action: 'finance' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="page-title">Tổng quan nhà trường 🏫</h2>
          <p className="page-sub">
            {SCHOOL.name} · {semesterLabel}
            {isValidSchoolYear(schoolYear) ? ` · Năm học ${schoolYear}` : ''}
          </p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-ghost" onClick={handleExportReport}><BarChart3 size={17} /> Xuất báo cáo</button>
          <button className="btn btn-ghost" onClick={onOpenMockExams}><FileText size={17} /> Thống kê thi thử</button>
          <button className="btn btn-primary" onClick={onOpenAnnouncements}><Bell size={17} /> Gửi thông báo</button>
        </div>
      </div>

      <div className="ds-grid cols-3" style={{ marginBottom: 20 }}>
        <Stat
          icon={Users}
          color="blue"
          val={roster.total}
          label="Tổng học sinh"
          sub={roster.classNames.length > 0 ? `${roster.classNames.length} lớp` : 'Chưa xếp lớp'}
          delay="d1"
        />
        <Stat
          icon={GraduationCap}
          color="mint"
          val={(teachers || []).length}
          label="Giáo viên"
          sub={subjectCount > 0 ? `${subjectCount} môn giảng dạy` : 'Chưa phân công môn'}
          delay="d2"
        />
        <Stat
          icon={CheckCircle}
          color="violet"
          val={register.school.rate === null
            ? <span style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Chưa điểm danh</span>
            : `${register.school.rate}%`}
          label="Tỉ lệ chuyên cần"
          sub={register.date
            ? `Buổi ${formatDayMonth(register.date)} · đã điểm danh ${register.school.recorded}/${register.school.enrolled} HS`
            : 'Chưa có buổi điểm danh nào được ghi nhận'}
          delay="d3"
        />
      </div>

      <div className="ds-grid ds-split">
        <div className="col" style={{ gap: 20 }}>
          {/*
            Sĩ số only. The bars used to carry a per-khối GPA (7.8 / 8.1 / 8.4)
            beside a 7.9 "GPA toàn trường", and neither has a source: Thông tư
            22 defines no school-wide or khối-wide average, and the gradebook
            these would be averaged over holds four subjects where the same
            circular needs six before it will classify anyone at all. A decimal
            printed over a record the app itself refuses to xếp loại would look
            like a measurement and be a guess.
          */}
          <SectionCard
            title="Sĩ số theo khối"
            icon={BarChart3}
            delay="d2"
            action={<button className="btn btn-soft btn-sm" onClick={onOpenStudents}>Quản lý học sinh</button>}
          >
            {roster.grades.length === 0 ? (
              <EmptyNote>Chưa có học sinh nào trong danh sách của trường.</EmptyNote>
            ) : (
              <div className="flex" style={{ gap: 20, alignItems: 'flex-end', height: 210, padding: '10px 0' }}>
                {roster.grades.map((row, index) => {
                  const color = ROW_COLORS[index % ROW_COLORS.length];
                  return (
                    <div key={row.grade} className="col" style={{ flex: 1, alignItems: 'center', gap: 10, height: '100%', justifyContent: 'flex-end' }}>
                      <span className={`t-${color}`} style={{ fontWeight: 800 }}>{row.count}</span>
                      <div style={{ width: '60%', maxWidth: 70, height: `${(row.count / largestGrade) * 100}%`, borderRadius: '12px 12px 0 0', background: `var(--${color})` }} />
                      <div className="center" style={{ gap: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Khối {row.grade}</span>
                        <span className="muted" style={{ fontSize: '0.74rem' }}>{row.count} HS</span>
                      </div>
                    </div>
                  );
                })}
                <div className="col center" style={{ flex: 1, gap: 10, height: '100%', justifyContent: 'flex-end', borderLeft: '1px dashed var(--line-strong)' }}>
                  <span className="display t-violet" style={{ fontSize: '1.6rem' }}>{roster.total}</span>
                  <span className="muted" style={{ fontSize: '0.74rem', fontWeight: 700, textAlign: 'center' }}>Học sinh<br />toàn trường</span>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Hoạt động gần đây" icon={Clock} delay="d3" action={<button className="btn btn-soft btn-sm" onClick={onOpenJournal}>Nhật ký</button>}>
            {activity.length === 0 ? (
              <EmptyNote>Chưa có hoạt động nào được ghi nhận trên hệ thống.</EmptyNote>
            ) : (
              <div className="col" style={{ gap: 4 }}>
                {activity.map(row => (
                  <div className="row" key={row.id}>
                    <div className={`chip-ico bg-${row.color} t-${row.color}`} style={{ width: 40, height: 40 }}><row.Icon size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}><b>{row.who || 'Không rõ người thực hiện'}</b> {row.action}</div>
                      <div className="muted" style={{ fontSize: '0.76rem' }}>Ngày {formatFullDate(row.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="col" style={{ gap: 20 }}>
          <GradebookLockCard
            lock={lockState}
            schoolYear={schoolYear}
            semester={semester}
            staff={teachers}
            onSetLocked={setGradebookLocked}
          />

          <SectionCard title="Truy cập nhanh" icon={LayoutGrid} delay="d2">
            <div className="ds-grid cols-2" style={{ gap: 12 }}>
              {quickActions.map(quick => {
                const Icon = quick.icon;
                return (
                  <button key={quick.action} onClick={() => handleQuickAction(quick.action)} className={`badge-tile bg-${quick.color}`} style={{ cursor: 'pointer', border: 'none' }}>
                    <div className={`bt-ico t-${quick.color}`} style={{ background: '#fff' }}><Icon size={24} /></div>
                    <span className={`t-${quick.color}`} style={{ fontSize: '0.8rem', fontWeight: 700 }}>{quick.label}</span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/*
            Per lớp, not per khối: điểm danh is taken by a GVCN for one lớp, so
            that is the unit at which a hiệu trưởng can act on a gap. The list
            is the lớp the roster actually holds — the previous three rows
            (Khối 10 95.6%, Khối 11 96.9%, Khối 12 98.0%) were constants and
            named khối this school may not even run.
          */}
          <SectionCard title="Tỉ lệ chuyên cần theo lớp" icon={CheckCircle} delay="d3">
            {register.classes.length === 0 ? (
              <EmptyNote>Chưa có lớp nào trong danh sách của trường.</EmptyNote>
            ) : (
              <>
                <div className="col" style={{ gap: 16, paddingTop: 4 }}>
                  {register.classes.map((row, index) => {
                    const color = ROW_COLORS[index % ROW_COLORS.length];
                    return (
                      <div key={row.name}>
                        <div className="flex between" style={{ marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Lớp {row.name}</span>
                          {row.summary.rate === null ? (
                            <span className="muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Chưa điểm danh</span>
                          ) : (
                            <span className={`t-${color}`} style={{ fontWeight: 800 }}>{row.summary.rate}%</span>
                          )}
                        </div>
                        {row.summary.rate !== null && <Bar value={row.summary.rate} max={100} color={color} />}
                        <div className="muted" style={{ fontSize: '0.74rem', marginTop: 4 }}>
                          Đã điểm danh {row.summary.recorded}/{row.summary.enrolled} HS
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="muted" style={{ fontSize: '0.76rem', marginTop: 12, marginBottom: 0 }}>
                  {register.date
                    ? `Số liệu của buổi điểm danh gần nhất, ngày ${formatFullDate(register.date)}.`
                    : 'Chưa có buổi điểm danh nào được ghi nhận.'}
                </p>
              </>
            )}
          </SectionCard>

          <SectionCard
            title="Thông báo mới nhất"
            icon={Bell}
            delay="d4"
            action={<button className="btn btn-soft btn-sm" onClick={onOpenAnnouncements}>Xem tất cả</button>}
          >
            {notices.length === 0 ? (
              <EmptyNote>Nhà trường chưa phát hành thông báo nào.</EmptyNote>
            ) : (
              <div className="col" style={{ gap: 12 }}>
                {notices.map((notice, index) => {
                  const color = ROW_COLORS[index % ROW_COLORS.length];
                  return (
                    <div key={notice.id} className="flex gap-12">
                      <div className={`chip-ico bg-${color} t-${color}`} style={{ width: 36, height: 36 }}><Bell size={16} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.4 }}>{notice.title}</div>
                        <div className="muted" style={{ fontSize: '0.74rem', marginTop: 2 }}>
                          {[notice.sender, `Ngày ${formatFullDate(notice.date)}`].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
