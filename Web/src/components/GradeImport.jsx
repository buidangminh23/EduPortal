import { useContext, useMemo, useRef, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { SCORED_SUBJECTS, regularSlotsFor, subjectName } from '../config/curriculum';
import { toAssessmentRecord } from '../lib/domain/grading';
import { buildImportPlan, applyScoreToRecord, buildSampleCsv, SLOT } from '../lib/integrations/gradeImport';

/**
 * Nhận điểm từ tệp phần mềm khác xuất ra, thay cho việc gõ lại từng dòng.
 *
 * Màn hình đi theo ba bước cố định: chọn tệp → xem bản kê → xác nhận ghi.
 * Bước giữa không bỏ được. Điểm học bạ chiếm 50% xét công nhận tốt nghiệp,
 * nên một lần nhập sai không phải phiền toái hành chính mà là hồ sơ sai;
 * người bấm nút phải nhìn thấy sẽ ghi gì trước khi nó được ghi.
 *
 * Toàn bộ việc đối chiếu nằm ở lib/integrations/gradeImport.js và có test
 * riêng. Ở đây chỉ có màn hình.
 */

const SLOT_LABEL = {
  [SLOT.REGULAR]: 'Điểm thường xuyên (ĐĐGtx)',
  [SLOT.MIDTERM]: 'Điểm giữa kỳ (ĐĐGgk)',
  [SLOT.FINAL]: 'Điểm cuối kỳ (ĐĐGck)'
};

export default function GradeImport() {
  const { students, saveSubjectGrades } = useContext(AppContext);

  const [subject, setSubject] = useState(SCORED_SUBJECTS[0]?.key ?? 'Math');
  const [slot, setSlot] = useState(SLOT.REGULAR);
  const [fileName, setFileName] = useState('');
  const [fileText, setFileText] = useState('');
  const [plan, setPlan] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  // null nghĩa là đang dùng kết quả tự đoán. Khi giáo viên tự chọn cột thì mọi
  // lần dựng lại bản kê phải theo lựa chọn đó, kể cả khi máy vẫn đoán khác.
  const [mapping, setMapping] = useState(null);
  const fileInput = useRef(null);

  // Mã học sinh trong hệ thống chính là id (HS001…), nên tệp nào có cột mã đều
  // khớp được mà không cần khai báo thêm.
  const roster = useMemo(
    () => (students || []).map((s) => ({ id: s.id, fullName: s.name, code: s.id })),
    [students]
  );

  const readFile = (file) => {
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    setMapping(null);   // tệp mới thì đoán lại từ đầu

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setFileText(text);
      setPlan(buildImportPlan({ text, roster, subject, semester: 1, slot }));
    };
    reader.onerror = () => {
      setFileText('');
      setPlan({
        header: [], mapping: null, ready: [], failed: [], unmatched: [],
        summary: { total: 0, ready: 0, failed: 0, unmatched: 0 },
        error: 'Không đọc được tệp. Hãy lưu lại dưới dạng CSV rồi thử lại.'
      });
    };
    reader.readAsText(file, 'utf-8');
  };

  // Đổi môn, đổi ô điểm hay đổi cột thì dựng lại bản kê từ chính tệp đã đọc, để
  // con số trên màn hình luôn thuộc về lựa chọn đang hiển thị.
  const rebuild = (nextSubject, nextSlot, nextMapping = mapping) => {
    if (!fileText) return;
    setResult(null);
    setPlan(buildImportPlan({
      text: fileText, roster, subject: nextSubject, semester: 1, slot: nextSlot,
      mapping: nextMapping || undefined
    }));
  };

  /**
   * Đổi một cột do giáo viên chỉ định.
   *
   * Lấy mốc từ bản kê đang hiển thị chứ không từ `mapping`: lần đổi đầu tiên
   * `mapping` còn null, và bắt đầu từ số không sẽ xoá luôn hai cột máy đã đoán
   * đúng, buộc người dùng chọn lại cả ba.
   */
  const changeColumn = (field, rawValue) => {
    const value = rawValue === '' ? null : Number(rawValue);
    const current = mapping || {
      nameColumn: plan?.mapping?.nameColumn ?? null,
      codeColumn: plan?.mapping?.codeColumn ?? null,
      scoreColumns: plan?.mapping?.scoreColumn === null || plan?.mapping?.scoreColumn === undefined
        ? [] : [plan.mapping.scoreColumn]
    };

    const next = field === 'scoreColumn'
      ? { ...current, scoreColumns: value === null ? [] : [value] }
      : { ...current, [field]: value };

    setMapping(next);
    rebuild(subject, slot, next);
  };

  /**
   * Tải danh sách lớp ra tệp để thầy cô điền điểm rồi nạp lại.
   *
   * Mã học sinh nằm sẵn trong tệp nên lần nạp lại khớp theo mã, không phải theo
   * tên — tránh hẳn chuyện hai học sinh trùng tên.
   */
  const downloadSample = () => {
    const csv = buildSampleCsv(roster, `Điểm ${subjectName(subject)}`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mau-diem-${subject}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentRecordFor = (studentId) => {
    const student = (students || []).find((s) => s.id === studentId);
    const stored = student?.gradesDetailed?.[subject] ?? student?.grades?.[subject];
    return toAssessmentRecord(stored, regularSlotsFor(subject));
  };

  /**
   * Ghi từng dòng một và đếm riêng số ghi được.
   *
   * Sổ điểm có thể đang khoá, hoặc một học sinh đã đủ bốn cột thường xuyên —
   * những dòng đó bị từ chối trong khi các dòng khác vẫn ghi bình thường.
   * Báo "đã ghi 32 điểm" trong khi 3 dòng bị từ chối là báo cáo sai.
   */
  const confirmWrite = async () => {
    if (!plan?.ready?.length) return;
    setBusy(true);

    const written = [];
    const refused = [];

    for (const row of plan.ready) {
      const current = currentRecordFor(row.studentId);
      const { record, error } = applyScoreToRecord(current, row.score, slot);

      if (error) {
        refused.push({ ...row, problem: error });
        continue;
      }

      const outcome = saveSubjectGrades(row.studentId, subject, record);
      if (outcome?.ok) written.push(row);
      else refused.push({ ...row, problem: (outcome?.errors || ['Không ghi được điểm.']).join(' ') });
    }

    setResult({ written, refused });
    setPlan(null);
    setBusy(false);
  };

  const reset = () => {
    setPlan(null);
    setResult(null);
    setFileText('');
    setFileName('');
    setMapping(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="animate-fade">
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Nhận điểm từ tệp</h2>
        <p style={{ opacity: 0.85, marginBottom: '1.25rem' }}>
          Dùng cho tệp điểm xuất ra từ phần mềm chấm bài, Google Classroom hoặc bảng tính của thầy cô.
          Tệp cần có cột họ tên hoặc mã học sinh, và một cột điểm. Định dạng CSV.
        </p>

        <div className="ds-split" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: 200 }}>
            <label className="form-label" htmlFor="gi-subject">Môn học</label>
            <select
              id="gi-subject"
              className="form-control"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); rebuild(e.target.value, slot); }}
            >
              {SCORED_SUBJECTS.map((s) => (
                <option key={s.key} value={s.key}>{subjectName(s.key)}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ minWidth: 240 }}>
            <label className="form-label" htmlFor="gi-slot">Ghi vào cột</label>
            <select
              id="gi-slot"
              className="form-control"
              value={slot}
              onChange={(e) => { setSlot(e.target.value); rebuild(subject, e.target.value); }}
            >
              {Object.entries(SLOT_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ minWidth: 240 }}>
            <label className="form-label" htmlFor="gi-file">Tệp điểm</label>
            <input
              id="gi-file"
              ref={fileInput}
              className="form-control"
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              onChange={(e) => readFile(e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="ds-split" style={{ gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={downloadSample}>
            Tải tệp mẫu của lớp
          </button>
          <span style={{ opacity: 0.7, fontSize: '.9rem' }}>
            Tệp mẫu có sẵn mã và họ tên {roster.length} học sinh — thầy cô chỉ điền cột điểm rồi nạp lại.
            Điểm lẻ ghi bằng dấu phẩy, ví dụ 7,5.
          </span>
        </div>

        {fileName && (
          <p style={{ marginBottom: 0, marginTop: '.75rem', opacity: 0.75 }}>
            Đang xem: <strong>{fileName}</strong>
          </p>
        )}
      </div>

      {plan?.header?.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Cột trong tệp</h3>
          <p style={{ opacity: 0.8 }}>
            Hệ thống tự đoán theo tiêu đề. Nếu đoán sai, thầy cô chọn lại ở đây.
          </p>

          <div className="ds-split" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: 200 }}>
              <label className="form-label" htmlFor="gi-col-code">Cột mã học sinh</label>
              <select
                id="gi-col-code"
                className="form-control"
                value={plan.mapping?.codeColumn ?? ''}
                onChange={(e) => changeColumn('codeColumn', e.target.value)}
              >
                <option value="">— không có —</option>
                {plan.header.map((h, i) => (
                  <option key={`c-${i}`} value={i}>{h || `Cột ${i + 1}`}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: 200 }}>
              <label className="form-label" htmlFor="gi-col-name">Cột họ và tên</label>
              <select
                id="gi-col-name"
                className="form-control"
                value={plan.mapping?.nameColumn ?? ''}
                onChange={(e) => changeColumn('nameColumn', e.target.value)}
              >
                <option value="">— không có —</option>
                {plan.header.map((h, i) => (
                  <option key={`n-${i}`} value={i}>{h || `Cột ${i + 1}`}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: 200 }}>
              <label className="form-label" htmlFor="gi-col-score">Cột điểm</label>
              <select
                id="gi-col-score"
                className="form-control"
                value={plan.mapping?.scoreColumn ?? ''}
                onChange={(e) => changeColumn('scoreColumn', e.target.value)}
              >
                <option value="">— chưa chọn —</option>
                {plan.header.map((h, i) => (
                  <option key={`s-${i}`} value={i}>{h || `Cột ${i + 1}`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {plan?.error && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <strong>Chưa đọc được bảng điểm.</strong>
          <p style={{ marginBottom: 0 }}>{plan.error}</p>
        </div>
      )}

      {plan && !plan.error && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Bản kê trước khi ghi</h3>
          <p>
            Tệp có <strong>{plan.summary.total}</strong> dòng:{' '}
            <span className="badge badge-info">{plan.summary.ready} ghi được</span>{' '}
            {plan.summary.failed > 0 && <span className="badge">{plan.summary.failed} có lỗi</span>}{' '}
            {plan.summary.unmatched > 0 && <span className="badge">{plan.summary.unmatched} không khớp học sinh</span>}
          </p>

          {plan.ready.length > 0 && (
            <>
              <h4>Sẽ ghi vào {SLOT_LABEL[slot].toLowerCase()} môn {subjectName(subject)}</h4>
              <table className="form-control" style={{ width: '100%', padding: 0, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '.4rem' }}>Dòng</th>
                    <th style={{ textAlign: 'left', padding: '.4rem' }}>Học sinh</th>
                    <th style={{ textAlign: 'left', padding: '.4rem' }}>Khớp theo</th>
                    <th style={{ textAlign: 'right', padding: '.4rem' }}>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.ready.map((r) => (
                    <tr key={`${r.studentId}-${r.line}`}>
                      <td style={{ padding: '.4rem' }}>{r.line}</td>
                      <td style={{ padding: '.4rem' }}>{r.fullName}</td>
                      <td style={{ padding: '.4rem', opacity: 0.75 }}>
                        {r.matchedBy === 'code' ? 'mã học sinh' : 'họ tên'}
                      </td>
                      <td style={{ padding: '.4rem', textAlign: 'right' }}><strong>{r.score}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {(plan.failed.length > 0 || plan.unmatched.length > 0) && (
            <>
              <h4>Bỏ qua — cần thầy cô xem lại</h4>
              <ul>
                {plan.failed.map((f) => (
                  <li key={`f-${f.line}`}>
                    Dòng {f.line} — {f.fullName}: {f.problem}
                  </li>
                ))}
                {plan.unmatched.map((u) => (
                  <li key={`u-${u.line}`}>
                    Dòng {u.line} — {u.problem}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="ds-split" style={{ gap: '.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={confirmWrite}
              disabled={busy || plan.ready.length === 0}
            >
              {busy ? 'Đang ghi…' : `Ghi ${plan.ready.length} điểm vào sổ`}
            </button>
            <button type="button" className="btn btn-secondary" onClick={reset} disabled={busy}>
              Huỷ
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Kết quả</h3>
          <p>
            Đã ghi <strong>{result.written.length}</strong> điểm vào sổ môn {subjectName(subject)}.
            {result.refused.length > 0 && <> Bỏ qua <strong>{result.refused.length}</strong> dòng.</>}
          </p>
          {result.refused.length > 0 && (
            <ul>
              {result.refused.map((r) => (
                <li key={`r-${r.line}`}>Dòng {r.line} — {r.fullName}: {r.problem}</li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn-secondary" onClick={reset}>Nhận tệp khác</button>
        </div>
      )}
    </div>
  );
}
