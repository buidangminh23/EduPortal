import { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { SCHOOL } from '../config/school';
import { ASSESSMENT, SUBJECTS, TRACK, findSubject, subjectName } from '../config/curriculum';
import { COMMENT_RESULT, classifyTitle, summariseTranscript } from '../lib/domain/grading';
import { readConductBand, readConductYearBand } from '../lib/domain/conduct';
import { summariseAttendance } from '../lib/domain/attendance';
import { isValidIsoDate } from '../lib/domain/dates';
import { readPortfolioConfirmation } from '../lib/domain/portfolio';
import { isValidSchoolYear } from '../lib/domain/schoolYear';
import {
  Shield, Globe, Lock, CheckCircle, Plus, Trash, ShieldAlert
} from 'lucide-react';

/** Shown wherever the school has not recorded the fact yet. */
const NOT_ASSESSED = 'Chưa đánh giá';
const NOT_RECORDED = 'Chưa điểm danh';
const NOT_CLASSIFIED = 'Chưa xếp loại';

/** One dash in a cell: the school has recorded nothing there. */
const NO_RESULT = '—';

/**
 * The two học kỳ, spelled as the student record spells them.
 *
 * `student.grades` is học kỳ II and `student.gradesSem1` is học kỳ I — the store
 * writes every new mark into the first and keeps the second apart — so the kết
 * quả rèn luyện printed beside a column has to be read for that same học kỳ, or
 * the page would pair one term's marks with another term's rèn luyện.
 */
const SEMESTER_1 = 'semester1';
const SEMESTER_2 = 'semester2';

/** The only two outcomes a nhận xét subject carries — Thông tư 22 Điều 5 khoản 1. */
const COMMENT_VALUES = [COMMENT_RESULT.PASS, COMMENT_RESULT.FAIL];

const DOC_HEADING = {
  margin: 0,
  fontSize: '0.76rem',
  fontWeight: 800,
  color: '#1e293b',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const DOC_NOTE = {
  margin: '6px 0 0',
  fontSize: '0.66rem',
  color: 'var(--text-muted)',
  lineHeight: 1.5
};

const CELL = {
  border: '1px solid #94a3b8',
  padding: '4px 6px',
  fontSize: '0.72rem',
  textAlign: 'center',
  color: '#1e293b'
};

const HEAD_CELL = { ...CELL, fontWeight: 700, background: 'rgba(148,163,184,0.18)' };
const SUBJECT_CELL = { ...CELL, textAlign: 'left', fontWeight: 600 };
const SUBJECT_HEAD_CELL = { ...HEAD_CELL, textAlign: 'left' };

/**
 * The print rules.
 *
 * Everything outside the document is hidden, and the document is pulled to the
 * page origin so the app shell around it leaves no gap. `.no-print` removes the
 * editing controls from the flow entirely, so a long transcript does not trail
 * blank pages behind it.
 */
const PRINT_STYLES = `
  @media print {
    @page { margin: 14mm; }
    body * { visibility: hidden; }
    .no-print { display: none !important; }
    .print-area, .print-area * { visibility: visible; }
    .print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      background: white !important;
      border: none !important;
      box-shadow: none !important;
      color: black !important;
      padding: 0 !important;
      border-radius: 0 !important;
      overflow: visible !important;
    }
    .print-area th, .print-area td { border-color: #000 !important; }
    .print-area tr { break-inside: avoid; page-break-inside: avoid; }
    .print-area .doc-block { break-inside: avoid; page-break-inside: avoid; }
    .print-area .doc-banner { border-color: #000 !important; break-after: avoid; }
  }
`;

const formatMark = (value) => (Number.isFinite(value) ? value.toFixed(1) : NO_RESULT);

/**
 * A nhận xét result, or a dash.
 *
 * Membership is checked rather than the stored value printed: a number that
 * found its way into a comment-assessed subject would otherwise be printed as
 * that subject's mark, which is the one thing Điều 5 says it cannot have.
 */
const formatComment = (value) => (COMMENT_VALUES.includes(value) ? value : NO_RESULT);

const formatCell = (row, field) =>
  (row.kind === 'comment' ? formatComment(row[field]) : formatMark(row[field]));

/** A stored date as a Vietnamese reader writes one. */
const formatDate = (iso) =>
  (isValidIsoDate(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : 'không rõ');

/**
 * Which subjects the summary lists, and the marks behind them.
 *
 * A compulsory subject is on every timetable, so its row belongs on the page
 * even while it is empty — the blank is what tells a reader the result is still
 * outstanding. An elective is one of the four the student chose, and nothing in
 * this app records that choice, so an elective appears only once the school has
 * recorded a result for it: an empty Âm nhạc row would assert an enrolment
 * nobody entered.
 *
 * A subject key the curriculum table no longer lists is appended rather than
 * dropped. It is a mark on a pupil's record, and a summary that quietly omits
 * one is the failure this page exists to avoid.
 */
function transcriptInput(student) {
  const semester1 = student?.gradesSem1 || {};
  const semester2 = student?.grades || {};
  const stored = student?.commentResults || {};

  const marked = new Set([...Object.keys(semester1), ...Object.keys(semester2)]);
  const assessed = (key) =>
    COMMENT_VALUES.includes(stored[key]?.[SEMESTER_1]) || COMMENT_VALUES.includes(stored[key]?.[SEMESTER_2]);

  const listed = SUBJECTS.filter((subject) => (
    subject.track === TRACK.COMPULSORY
    || (subject.assessment === ASSESSMENT.SCORE ? marked.has(subject.key) : assessed(subject.key))
  ));

  const unlisted = [...marked].filter((key) => findSubject(key) === null);

  return {
    marks: {
      semester1,
      semester2,
      comments: Object.fromEntries(
        listed
          .filter((subject) => subject.assessment === ASSESSMENT.COMMENT)
          .map((subject) => [subject.key, stored[subject.key] || {}])
      )
    },
    subjectKeys: [...listed.map((subject) => subject.key), ...unlisted]
  };
}

/** One line of the summary: a result, or the sentence saying there is none. */
function ResultLine({ label, value, empty }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: '0.74rem', lineHeight: 1.6 }}>
      <span style={{ color: 'var(--text-secondary)', minWidth: 132 }}>{label}</span>
      {value ? (
        <strong style={{ color: '#1e293b' }}>{value}</strong>
      ) : (
        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{empty}</span>
      )}
    </div>
  );
}

/** A titled block of the document. */
function DocSection({ title, children }) {
  return (
    <section className="doc-block" style={{ marginTop: 16 }}>
      <h4 style={DOC_HEADING}>{title}</h4>
      <div style={{ marginTop: 8 }}>{children}</div>
    </section>
  );
}

/**
 * The page the print button produces.
 *
 * It reports what the school has actually recorded — kết quả học tập per subject
 * for both học kỳ and cả năm, kết quả rèn luyện, danh hiệu, chuyên cần, hoạt
 * động ngoại khóa — and says at the top what it is not.
 *
 * It deliberately does not follow, or approximate, the mẫu học bạ of the Bộ Giáo
 * dục và Đào tạo. This app does not have that form, and a page that resembled it
 * would sooner or later be handed in as one. For the same reason there is no
 * signature line, no seal, and no code of any kind: a printed page cannot
 * authenticate itself, and a graphic that suggests otherwise is worse than none.
 */
function TranscriptDocument({ student, portfolio, confirmation, schoolYear, attendance }) {
  const summary = useMemo(() => {
    if (!student) return null;

    const { marks, subjectKeys } = transcriptInput(student);
    const transcript = summariseTranscript(marks, subjectKeys);
    const conduct = {
      semester1: readConductBand(student, SEMESTER_1),
      semester2: readConductBand(student, SEMESTER_2),
      year: readConductYearBand(student)
    };

    return {
      transcript,
      conduct,
      // Điều 15 awards a danh hiệu on the year's two results together, so it is
      // asked for only once both exist; classifyTitle returns null otherwise,
      // and null there means "neither danh hiệu", not "not yet known".
      title: classifyTitle({
        learningBand: transcript.bands.year.band,
        conductBand: conduct.year,
        yearAverages: transcript.subjects.filter((row) => row.kind === 'score').map((row) => row.year)
      }),
      yearSettled: Boolean(transcript.bands.year.band) && Boolean(conduct.year)
    };
  }, [student]);

  if (!summary) {
    return (
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Chưa chọn học sinh nào để xem kết quả.
      </p>
    );
  }

  const { transcript, conduct, title, yearSettled } = summary;
  const achievements = portfolio.extracurricularAchievements;
  const bandEmpty = (result) => `${NOT_CLASSIFIED}${result.reason ? ` — ${result.reason}` : ''}`;

  return (
    <div>
      <div
        className="doc-banner"
        style={{ border: '3px solid #b45309', borderRadius: 10, padding: '10px 12px' }}
      >
        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Bản tóm tắt nội bộ — không phải học bạ
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '0.68rem', lineHeight: 1.55, color: '#1e293b' }}>
          Trang này do phần mềm quản lý của nhà trường in ra để tra cứu nội bộ. Đây <strong>không phải học bạ
          theo mẫu của Bộ Giáo dục và Đào tạo</strong>, <strong>không có chữ ký số</strong> và không thay thế
          được học bạ. Học bạ chính thức do nhà trường cấp, có chữ ký và con dấu theo quy định hiện hành.
        </p>
      </div>

      <div className="doc-block" style={{ marginTop: 16 }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{SCHOOL.name}</div>
        <h3 style={{ margin: '4px 0 0', fontSize: '1rem', color: '#1e293b' }}>
          Tổng hợp kết quả học tập và rèn luyện
        </h3>
        <div style={{ marginTop: 8, fontSize: '0.76rem', color: '#1e293b', lineHeight: 1.7 }}>
          <div>Họ và tên: <strong>{student.name}</strong></div>
          <div>
            Lớp: <strong>{student.class || NO_RESULT}</strong>
            {student.id ? <> · Mã học sinh: <strong>{student.id}</strong></> : null}
          </div>
          <div>
            Năm học:{' '}
            {isValidSchoolYear(schoolYear)
              ? <strong>{schoolYear}</strong>
              : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>chưa xác định</span>}
          </div>
        </div>
      </div>

      <DocSection title="Kết quả từng môn học">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th scope="col" style={SUBJECT_HEAD_CELL}>Môn học</th>
              <th scope="col" style={HEAD_CELL}>Học kỳ I</th>
              <th scope="col" style={HEAD_CELL}>Học kỳ II</th>
              <th scope="col" style={HEAD_CELL}>Cả năm</th>
            </tr>
          </thead>
          <tbody>
            {transcript.subjects.map((row) => (
              <tr key={row.key}>
                <th scope="row" style={SUBJECT_CELL}>{subjectName(row.key)}</th>
                <td style={CELL}>{formatCell(row, 'semester1')}</td>
                <td style={CELL}>{formatCell(row, 'semester2')}</td>
                <td style={{ ...CELL, fontWeight: 700 }}>{formatCell(row, 'year')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={DOC_NOTE}>
          Môn đánh giá bằng nhận xét ghi Đạt hoặc Chưa đạt, không có điểm số (Thông tư 22/2021/TT-BGDĐT,
          Điều 5). Dấu {NO_RESULT} nghĩa là nhà trường chưa nhập kết quả. Môn học lựa chọn chỉ xuất hiện khi
          đã có kết quả, vì phần mềm chưa lưu danh sách môn từng học sinh đăng ký.
        </p>
      </DocSection>

      <DocSection title="Xếp loại kết quả học tập">
        <ResultLine label="Học kỳ I" value={transcript.bands.semester1.band} empty={bandEmpty(transcript.bands.semester1)} />
        <ResultLine label="Học kỳ II" value={transcript.bands.semester2.band} empty={bandEmpty(transcript.bands.semester2)} />
        <ResultLine label="Cả năm" value={transcript.bands.year.band} empty={bandEmpty(transcript.bands.year)} />
        <p style={DOC_NOTE}>Xếp loại theo Thông tư 22/2021/TT-BGDĐT, Điều 9 khoản 2.</p>
      </DocSection>

      <DocSection title="Kết quả rèn luyện">
        <ResultLine label="Học kỳ I" value={conduct.semester1} empty={NOT_ASSESSED} />
        <ResultLine label="Học kỳ II" value={conduct.semester2} empty={NOT_ASSESSED} />
        <ResultLine label="Cả năm" value={conduct.year} empty={NOT_ASSESSED} />
        <p style={DOC_NOTE}>
          Kết quả rèn luyện do giáo viên chủ nhiệm đánh giá theo Thông tư 22/2021/TT-BGDĐT, Điều 8.
        </p>
      </DocSection>

      <DocSection title="Danh hiệu cuối năm học">
        <ResultLine
          label="Danh hiệu"
          value={title}
          empty={yearSettled
            ? 'Không đạt danh hiệu Học sinh Giỏi hoặc Học sinh Xuất sắc'
            : 'Chưa xét được — cần có cả kết quả học tập và kết quả rèn luyện cả năm'}
        />
        <p style={DOC_NOTE}>
          Danh hiệu theo Thông tư 22/2021/TT-BGDĐT, Điều 15. Các hình thức khen thưởng khác của nhà trường
          không được ghi ở đây.
        </p>
      </DocSection>

      <DocSection title="Chuyên cần">
        {attendance && attendance.total > 0 ? (
          <div style={{ fontSize: '0.74rem', color: '#1e293b', lineHeight: 1.6 }}>
            Có mặt <strong>{attendance.present + attendance.late}/{attendance.total}</strong> buổi đã điểm danh
            {attendance.excused > 0 ? <> · nghỉ có phép <strong>{attendance.excused}</strong> buổi</> : null}
            {attendance.unexcused > 0 ? <> · nghỉ không phép <strong>{attendance.unexcused}</strong> buổi</> : null}
          </div>
        ) : (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{NOT_RECORDED}</div>
        )}
        <p style={DOC_NOTE}>
          Tính trên những buổi nhà trường đã điểm danh trong năm học, không phải tổng số buổi học theo kế hoạch.
        </p>
      </DocSection>

      <DocSection title="Hoạt động ngoại khóa và giải thưởng">
        {achievements.length === 0 ? (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Chưa cập nhật thành tích nào trên hồ sơ này.
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.74rem', color: '#1e293b', lineHeight: 1.6 }}>
            {achievements.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        )}
      </DocSection>

      {/* What the school confirmed, stated as what it is. No hash and no
          circular red stamp: the hash authenticated nothing, and a graphic
          imitating a con dấu makes a printed copy look like a sealed học bạ to
          whoever is handed it. */}
      <DocSection title="Xác nhận nội bộ">
        {confirmation ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.74rem', color: '#1e293b', lineHeight: 1.6 }}>
              <div>Ban Giám hiệu đã xác nhận hồ sơ này.</div>
              <div>Người xác nhận: <strong>{confirmation.confirmedBy}</strong></div>
              <div>Ngày xác nhận: <strong>{formatDate(confirmation.confirmedAt)}</strong></div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.74rem', color: '#b45309' }}>
            <ShieldAlert size={15} style={{ flexShrink: 0 }} />
            Ban Giám hiệu chưa xác nhận hồ sơ này.
          </div>
        )}
        <p style={DOC_NOTE}>
          Xác nhận này là ghi nhận nội bộ trong phần mềm, không phải chữ ký số có giá trị pháp lý.
        </p>
      </DocSection>

      <p
        className="doc-block"
        style={{ marginTop: 18, paddingTop: 10, borderTop: '1px solid #94a3b8', fontSize: '0.68rem', color: '#1e293b', lineHeight: 1.5 }}
      >
        Bản tóm tắt nội bộ của {SCHOOL.name} — không phải học bạ chính thức, không có chữ ký số.
        Chỉ phản ánh những gì đã được nhập vào phần mềm.
      </p>
    </div>
  );
}

export default function PortfolioBuilder() {
  const {
    currentRole, selectedStudentId, setSelectedStudentId, students, studentPortfolios,
    updatePortfolioAchievements, confirmPortfolioByBgh, togglePortfolioPublic,
    attendanceLogs, leaveRequests, userSession, schoolYear
  } = useContext(AppContext);

  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];
  const isStudent = currentRole === 'student';
  const isAdmin = currentRole === 'admin';
  const isTeacher = currentRole === 'teacher';
  const canEdit = isAdmin || isTeacher;

  // Student editor achievements state
  const [newAchievement, setNewAchievement] = useState('');

  // Find portfolio
  const portfolio = studentPortfolios?.find(p => p.studentId === student?.id) || {
    studentId: student?.id,
    studentName: student?.name || 'Học sinh',
    extracurricularAchievements: [],
    bghConfirmation: null,
    isPublic: false
  };

  const confirmation = readPortfolioConfirmation(portfolio);

  /**
   * Chuyên cần as the register actually holds it.
   *
   * Counted over recorded sessions only, by the same domain rule the child's
   * attendance log and the parent's page use. The card used to print
   * "175/175 buổi" for every student in the school — a full year of perfect
   * attendance asserted from nothing.
   */
  const attendance = useMemo(() => {
    if (!student) return null;
    const records = (attendanceLogs || []).filter((log) => log.studentId === student.id);
    const leaves = (leaveRequests || []).filter((request) => request.studentId === student.id);
    return summariseAttendance(records, leaves);
  }, [attendanceLogs, leaveRequests, student]);

  const handleAddAchievement = () => {
    if (!newAchievement.trim()) return;
    const currentList = [...portfolio.extracurricularAchievements, newAchievement.trim()];
    updatePortfolioAchievements(student.id, currentList);
    setNewAchievement('');
  };

  const handleDeleteAchievement = (idx) => {
    const currentList = portfolio.extracurricularAchievements.filter((_, i) => i !== idx);
    updatePortfolioAchievements(student.id, currentList);
  };

  const handleTogglePublic = () => {
    togglePortfolioPublic(student.id);
  };

  /**
   * Names the confirmer from the signed-in session rather than from a literal.
   *
   * The previous version recorded every confirmation as "Hiệu trưởng BGH", so
   * the hồ sơ said a confirmation had happened without saying whose it was.
   */
  const handleBghConfirm = (studentId, studentNameToConfirm) => {
    const confirmedBy = userSession?.displayName?.trim();
    if (!confirmedBy) {
      alert('Chưa xác định được người xác nhận. Vui lòng đăng nhập lại rồi thử lại.');
      return;
    }

    const result = confirmPortfolioByBgh(studentId, confirmedBy);
    if (!result.ok) {
      alert(result.errors.join('\n'));
      return;
    }
    alert(`Đã ghi nhận xác nhận của Ban Giám hiệu cho hồ sơ của em ${studentNameToConfirm}.`);
  };

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div className="no-print" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.4rem', color: '#1e293b' }}>
            🎓 Hồ Sơ Thành Tích Học Sinh
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Hoạt động ngoại khóa và giải thưởng, kèm xác nhận nội bộ của Ban Giám hiệu.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}
        >
          {/* Names what comes out of the printer. The page on the right reports
              marks and kết quả rèn luyện as well as thành tích, so "hồ sơ thành
              tích" no longer described it — and neither label may suggest a học
              bạ, which follows a form of the Bộ Giáo dục và Đào tạo. */}
          <span>In bản tóm tắt nội bộ</span>
        </button>
      </div>

      {/* Student Selector for Teachers and Admin */}
      {(isTeacher || isAdmin) && (
        <div className="no-print" style={{
          background: 'rgba(79, 70, 229, 0.03)', 
          border: '1px solid rgba(79, 70, 229, 0.08)',
          borderRadius: '14px', 
          padding: '16px', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <label htmlFor="select-portfolio-student" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Chọn học sinh quản lý:</label>
          <select
            id="select-portfolio-student"
            aria-label="Chọn học sinh quản lý"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="form-control"
            style={{ padding: '6px 12px', width: 'auto', fontSize: '0.85rem', background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 24 }}>

        {/* LEFT PANEL: Student view OR Teacher/Admin portfolio editor */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* STUDENT CV VIEWER & VISIBILITY CONFIG */}
          {isStudent && (
            <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Cấu hình hiển thị hồ sơ
              </h3>

              {/* Toggle Public Switch */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: '#fff', 
                padding: '10px 14px', 
                borderRadius: 12, 
                border: '1px solid rgba(0,0,0,0.04)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {portfolio.isPublic ? <Globe size={18} color="#047857" /> : <Lock size={18} color="var(--text-muted)" />}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cấu hình công khai hồ sơ</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {portfolio.isPublic ? 'Hồ sơ đang ở chế độ xem công khai toàn trường.' : 'Chỉ có học sinh và Ban giám hiệu có quyền truy cập.'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleTogglePublic} 
                  aria-label={portfolio.isPublic ? 'Chuyển Riêng Tư' : 'Công Khai'}
                  className={`btn ${portfolio.isPublic ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {portfolio.isPublic ? 'Chuyển Riêng Tư' : 'Công Khai'}
                </button>
              </div>

              {/* Read-only notification box */}
              <div style={{ 
                background: 'rgba(79, 70, 229, 0.05)', 
                border: '1px solid rgba(79, 70, 229, 0.15)', 
                borderRadius: 12, 
                padding: 14, 
                marginBottom: 16,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start'
              }}>
                <ShieldAlert size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>Quyền cập nhật thành tích:</strong> Chỉ có Giáo viên và Ban Giám hiệu mới có thẩm quyền thêm/xóa hoạt động ngoại khóa hoặc giải thưởng trên hồ sơ của bạn. Vui lòng liên hệ Giáo viên chủ nhiệm để gửi yêu cầu cập nhật.
                </div>
              </div>

              {/* Achievements read-only list */}
              <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Hoạt động ngoại khóa đã ghi nhận:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {portfolio.extracurricularAchievements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Chưa ghi nhận thành tích nào.
                  </div>
                ) : (
                  portfolio.extracurricularAchievements.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '10px 14px', 
                        background: '#fff', 
                        border: '1px solid rgba(0,0,0,0.03)', 
                        borderRadius: 10 
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>🏆 {item}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TEACHER/ADMIN CV EDITOR FORM */}
          {canEdit && (
            <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={18} /> Cập nhật hoạt động & Thành tích ngoại khóa
              </h3>

              {/* Achievements add form */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <input 
                  type="text" 
                  aria-label="Nhập tên hoạt động ngoại khóa hoặc giải thưởng"
                  value={newAchievement}
                  onChange={e => setNewAchievement(e.target.value)}
                  placeholder="Ví dụ: Đạt giải Nhất cuộc thi Tin học trẻ 2026..."
                  className="form-control"
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                />
                <button 
                  onClick={handleAddAchievement} 
                  aria-label="Thêm thành tích"
                  className="btn btn-primary"
                  style={{ gap: 4, height: 42, padding: '0 16px', flexShrink: 0 }}
                >
                  <Plus size={16} /> Thêm
                </button>
              </div>

              {/* Achievements items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {portfolio.extracurricularAchievements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Chưa cập nhật thành tích nào cho em {student?.name}.
                  </div>
                ) : (
                  portfolio.extracurricularAchievements.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '10px 14px', 
                        background: '#fff', 
                        border: '1px solid rgba(0,0,0,0.03)', 
                        borderRadius: 10 
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>🏆 {item}</span>
                      <button 
                        onClick={() => handleDeleteAchievement(idx)} 
                        aria-label="Xóa thành tích này"
                        className="btn" 
                        style={{ padding: 4, color: '#ef4444', background: 'transparent' }}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ADMIN STUDENT PORTFOLIO VERIFICATION ROSTER */}
          {isAdmin && (
            <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={18} /> Xác nhận hồ sơ thành tích
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Xác nhận ở đây là ghi nhận nội bộ trong phần mềm: hệ thống lưu lại ai xác nhận, vào ngày nào,
                và khóa hồ sơ sau đó. Đây <strong>không phải chữ ký số có giá trị pháp lý</strong>. Học bạ chính thức
                vẫn cần chữ ký và con dấu của nhà trường theo quy định hiện hành.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {students.map(std => {
                  const stdPort = studentPortfolios?.find(p => p.studentId === std.id) || {
                    studentId: std.id,
                    studentName: std.name,
                    extracurricularAchievements: [],
                    bghConfirmation: null
                  };
                  const stdConfirmation = readPortfolioConfirmation(stdPort);

                  return (
                    <div 
                      key={std.id} 
                      style={{ 
                        padding: 16, 
                        borderRadius: 14, 
                        background: '#fff', 
                        border: '1px solid rgba(0,0,0,0.04)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{std.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          Mã số: <strong>{std.id}</strong> | Lớp: <strong>{std.class}</strong>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          Hoạt động ngoại khóa ({stdPort.extracurricularAchievements.length}): {stdPort.extracurricularAchievements.join('; ') || 'Chưa cập nhật'}
                        </div>
                        {stdConfirmation && (
                          <div style={{ fontSize: '0.72rem', color: '#047857', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontWeight: 700 }}>
                            <CheckCircle size={12} /> Đã xác nhận ngày {stdConfirmation.confirmedAt || 'không rõ'} — {stdConfirmation.confirmedBy}
                          </div>
                        )}
                      </div>

                      {/* Confirming is about the record, not the child's CV: a
                          student with no club to their name still has a hồ sơ,
                          and the empty list is itself what gets confirmed. */}
                      <button
                        onClick={() => handleBghConfirm(std.id, std.name)}
                        disabled={Boolean(stdConfirmation)}
                        aria-label={stdConfirmation ? 'Hồ sơ đã được xác nhận' : `Xác nhận hồ sơ của ${std.name}`}
                        className="btn btn-primary"
                        style={{
                          fontSize: '0.8rem',
                          padding: '8px 16px',
                          background: stdConfirmation ? 'rgba(4, 120, 87, 0.15)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: stdConfirmation ? '#047857' : 'white',
                          border: 'none',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {stdConfirmation ? 'Đã xác nhận' : 'Xác nhận hồ sơ'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: the page the print button produces. */}
        <div>
          <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
          <div
            className="glass-panel print-area"
            style={{
              padding: 20,
              background: '#ffffff',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
              borderRadius: 16
            }}
          >
            <TranscriptDocument
              student={student}
              portfolio={portfolio}
              confirmation={confirmation}
              schoolYear={schoolYear}
              attendance={attendance}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
