import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { SCORED_SUBJECTS, regularSlotsFor, subjectName } from '../config/curriculum';
import { toAssessmentRecord } from '../lib/domain/grading';
import { applyScoreToRecord, SLOT } from '../lib/integrations/gradeImport';
import { beginSignIn, loadToken, clearToken, callbackUrl } from '../lib/google/oauthPkce';
import { listCourses, listCourseWork, listStudents, listSubmissions, buildClassroomPlan } from '../lib/google/classroom';

/**
 * Kéo điểm đã chấm trên Google Classroom về sổ điểm.
 *
 * Đi theo đúng ba bước của màn hình nhận điểm từ tệp — chọn nguồn, xem bản kê,
 * xác nhận ghi — vì lý do giống hệt: điểm là dữ liệu pháp lý, không ghi thẳng.
 * Khác một chỗ: nguồn ở đây là Classroom nên có thêm bước đăng nhập Google, và
 * điểm phải quy về thang 10 trước khi vào sổ.
 */

const SLOT_LABEL = {
  [SLOT.REGULAR]: 'Điểm thường xuyên (ĐĐGtx)',
  [SLOT.MIDTERM]: 'Điểm giữa kỳ (ĐĐGgk)',
  [SLOT.FINAL]: 'Điểm cuối kỳ (ĐĐGck)'
};

export default function ClassroomImport() {
  const { students, saveSubjectGrades } = useContext(AppContext);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const [token, setToken] = useState(() => loadToken());
  const [busy, setBusy] = useState('');
  const [error, setError] = useState(null);

  const [courses, setCourses] = useState([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [work, setWork] = useState([]);
  const [workId, setWorkId] = useState('');

  const [subject, setSubject] = useState(SCORED_SUBJECTS[0]?.key ?? 'Math');
  const [slot, setSlot] = useState(SLOT.REGULAR);
  const [allowNameMatch, setAllowNameMatch] = useState(false);

  const [plan, setPlan] = useState(null);
  const [result, setResult] = useState(null);

  const roster = useMemo(
    () => (students || []).map((s) => ({ id: s.id, fullName: s.name, email: s.email || '' })),
    [students]
  );

  // Danh sách học sinh của trường hiện chưa lưu email. Không có email thì ghép
  // theo email là bất khả, nên phải nói ra thay vì để người dùng bấm mãi mà bản
  // kê lúc nào cũng rỗng.
  const rosterHasEmail = roster.some((r) => r.email);

  const handleApi = useCallback((res) => {
    if (res.ok) return true;
    if (res.expired) {
      clearToken();
      setToken(null);
    }
    setError(res.error);
    return false;
  }, []);

  const connect = async () => {
    setError(null);
    try {
      const { url } = await beginSignIn({ clientId, redirectUri: callbackUrl() });
      window.location.assign(url);
    } catch (e) {
      setError(e.message);
    }
  };

  const disconnect = () => {
    clearToken();
    setToken(null);
    setCourses([]); setCoursesLoaded(false);
    setCourseId(''); setWork([]); setWorkId(''); setPlan(null); setResult(null);
  };

  // Trạng thái "đang tải lớp" được suy ra chứ không đặt trong effect: đặt thẳng
  // vào effect sẽ kéo theo một lượt vẽ thừa ngay khi màn hình vừa hiện.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    listCourses({ accessToken: token.accessToken }).then((res) => {
      if (cancelled) return;
      if (handleApi(res)) setCourses(res.data);
      setCoursesLoaded(true);
    });

    return () => { cancelled = true; };
  }, [token, handleApi]);

  const pickCourse = async (id) => {
    setCourseId(id); setWork([]); setWorkId(''); setPlan(null); setResult(null); setError(null);
    if (!id) return;

    setBusy('Đang tải danh sách bài tập…');
    const res = await listCourseWork({ courseId: id, accessToken: token.accessToken });
    setBusy('');
    if (handleApi(res)) setWork(res.data);
  };

  const pickWork = async (id) => {
    setWorkId(id); setPlan(null); setResult(null); setError(null);
    if (!id) return;
    await buildPlan(id, allowNameMatch);
  };

  const buildPlan = async (wId, byName) => {
    const chosen = work.find((w) => w.id === wId);
    if (!chosen) return;

    setBusy('Đang tải điểm từ Classroom…');
    const [subs, studentsRes] = await Promise.all([
      listSubmissions({ courseId, courseWorkId: wId, accessToken: token.accessToken }),
      listStudents({ courseId, accessToken: token.accessToken })
    ]);
    setBusy('');

    if (!handleApi(subs) || !handleApi(studentsRes)) return;

    setPlan(buildClassroomPlan({
      submissions: subs.data,
      students: studentsRes.data,
      roster,
      maxPoints: chosen.maxPoints,
      allowNameMatch: byName
    }));
  };

  const toggleNameMatch = async (checked) => {
    setAllowNameMatch(checked);
    if (workId) await buildPlan(workId, checked);
  };

  const currentRecordFor = (studentId) => {
    const student = (students || []).find((s) => s.id === studentId);
    const stored = student?.gradesDetailed?.[subject] ?? student?.grades?.[subject];
    return toAssessmentRecord(stored, regularSlotsFor(subject));
  };

  const confirmWrite = () => {
    if (!plan?.ready?.length) return;
    const written = [];
    const refused = [];

    plan.ready.forEach((row) => {
      const { record, error: slotError } = applyScoreToRecord(currentRecordFor(row.studentId), row.score, slot);
      if (slotError) { refused.push({ ...row, problem: slotError }); return; }

      const outcome = saveSubjectGrades(row.studentId, subject, record);
      if (outcome?.ok) written.push(row);
      else refused.push({ ...row, problem: (outcome?.errors || ['Không ghi được điểm.']).join(' ') });
    });

    setResult({ written, refused });
    setPlan(null);
  };

  if (!clientId) {
    return (
      <div className="animate-fade">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Kéo điểm từ Google Classroom</h2>
          <p>Chưa khai báo Client ID của Google nên chưa kết nối được.</p>
          <p style={{ marginBottom: 0 }}>
            Đặt <code>VITE_GOOGLE_CLIENT_ID</code> trong tệp <code>.env.local</code> rồi khởi động lại,
            nút kết nối sẽ hiện ra. Để trống thì màn hình này chỉ báo như đang thấy, không phải lỗi.
          </p>
        </div>
      </div>
    );
  }

  const selectedWork = work.find((w) => w.id === workId);

  return (
    <div className="animate-fade">
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Kéo điểm từ Google Classroom</h2>
        <p style={{ opacity: 0.85 }}>
          Lấy điểm thầy cô đã chấm trên Classroom về sổ điểm của trường, khỏi gõ lại.
          EduPortal chỉ đọc, không sửa gì trên Classroom.
        </p>

        {!token ? (
          <button type="button" className="btn btn-primary" onClick={connect}>
            Kết nối Google Classroom
          </button>
        ) : (
          <div className="ds-split" style={{ gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-info">Đã kết nối</span>
            <button type="button" className="btn btn-secondary" onClick={disconnect}>Ngắt kết nối</button>
          </div>
        )}

        {token && !coursesLoaded && (
          <p style={{ marginBottom: 0, opacity: 0.8 }}>Đang tải danh sách lớp trên Classroom…</p>
        )}
        {busy && <p style={{ marginBottom: 0, opacity: 0.8 }}>{busy}</p>}
        {error && (
          <p style={{ marginBottom: 0, color: '#b00020' }}><strong>Lỗi:</strong> {error}</p>
        )}
      </div>

      {token && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Chọn nguồn điểm</h3>
          <div className="ds-split" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: 220 }}>
              <label className="form-label" htmlFor="cr-course">Lớp trên Classroom</label>
              <select id="cr-course" className="form-control" value={courseId} onChange={(e) => pickCourse(e.target.value)}>
                <option value="">— chọn lớp —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: 240 }}>
              <label className="form-label" htmlFor="cr-work">Bài tập đã chấm</label>
              <select id="cr-work" className="form-control" value={workId} onChange={(e) => pickWork(e.target.value)} disabled={!courseId}>
                <option value="">— chọn bài —</option>
                {work.map((w) => (
                  <option key={w.id} value={w.id}>{w.title} (thang {w.maxPoints})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: 200 }}>
              <label className="form-label" htmlFor="cr-subject">Ghi vào môn</label>
              <select id="cr-subject" className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SCORED_SUBJECTS.map((s) => <option key={s.key} value={s.key}>{subjectName(s.key)}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: 230 }}>
              <label className="form-label" htmlFor="cr-slot">Ghi vào cột</label>
              <select id="cr-slot" className="form-control" value={slot} onChange={(e) => setSlot(e.target.value)}>
                {Object.entries(SLOT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {courseId && work.length === 0 && !busy && (
            <p style={{ marginBottom: 0 }}>Lớp này chưa có bài tập nào được chấm điểm.</p>
          )}

          {!rosterHasEmail && (
            <div style={{ borderLeft: '4px solid #8a6d00', paddingLeft: '1rem', marginTop: '1rem' }}>
              <p style={{ marginTop: 0 }}>
                <strong>Danh sách học sinh của trường chưa có email.</strong> EduPortal ghép học sinh
                Classroom với học sinh của trường bằng email, nên hiện chưa ghép được ai.
              </p>
              <label style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={allowNameMatch}
                  onChange={(e) => toggleNameMatch(e.target.checked)}
                />
                <span>
                  Tạm ghép theo họ tên. Chỉ ghép khi tên là duy nhất trong lớp; hai em trùng tên thì
                  vẫn bị bỏ qua. Cách lâu dài là bổ sung email cho học sinh.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {plan && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Bản kê trước khi ghi</h3>
          <p>
            {selectedWork && (
              <>Bài <strong>{selectedWork.title}</strong> chấm thang <strong>{selectedWork.maxPoints}</strong>,
              quy về thang 10. </>
            )}
            <span className="badge badge-info">{plan.summary.ready} ghi được</span>{' '}
            {plan.summary.failed > 0 && <span className="badge">{plan.summary.failed} bỏ qua</span>}{' '}
            {plan.summary.unmatched > 0 && <span className="badge">{plan.summary.unmatched} không khớp</span>}
          </p>

          {plan.ready.length > 0 && (
            <table className="form-control" style={{ width: '100%', padding: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '.4rem' }}>Học sinh</th>
                  <th style={{ textAlign: 'left', padding: '.4rem' }}>Khớp theo</th>
                  <th style={{ textAlign: 'right', padding: '.4rem' }}>Classroom</th>
                  <th style={{ textAlign: 'right', padding: '.4rem' }}>Vào sổ</th>
                </tr>
              </thead>
              <tbody>
                {plan.ready.map((r) => (
                  <tr key={r.studentId}>
                    <td style={{ padding: '.4rem' }}>{r.fullName}</td>
                    <td style={{ padding: '.4rem', opacity: .75 }}>{r.matchedBy === 'email' ? 'email' : 'họ tên'}</td>
                    <td style={{ padding: '.4rem', textAlign: 'right', opacity: .75 }}>{r.rawGrade}/{r.maxPoints}</td>
                    <td style={{ padding: '.4rem', textAlign: 'right' }}><strong>{r.score}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(plan.failed.length > 0 || plan.unmatched.length > 0) && (
            <>
              <h4>Bỏ qua</h4>
              <ul>
                {plan.failed.map((f, i) => <li key={`f${i}`}>{f.fullName}: {f.problem}</li>)}
                {plan.unmatched.map((u, i) => <li key={`u${i}`}>{u.problem}</li>)}
              </ul>
            </>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={confirmWrite}
            disabled={plan.ready.length === 0}
          >
            Ghi {plan.ready.length} điểm vào sổ {subjectName(subject)}
          </button>
        </div>
      )}

      {result && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Kết quả</h3>
          <p>
            Đã ghi <strong>{result.written.length}</strong> điểm vào sổ môn {subjectName(subject)}.
            {result.refused.length > 0 && <> Bỏ qua <strong>{result.refused.length}</strong>.</>}
          </p>
          {result.refused.length > 0 && (
            <ul>{result.refused.map((r, i) => <li key={`r${i}`}>{r.fullName}: {r.problem}</li>)}</ul>
          )}
        </div>
      )}
    </div>
  );
}
