import { useContext, useMemo, useRef, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  buildTimetablePlan, toTimetableSlots, buildTimetableSampleCsv
} from '../lib/integrations/timetableImport';

/**
 * Nạp thời khoá biểu từ tệp do phần mềm xếp lịch xuất ra.
 *
 * Cùng ba bước như màn hình nhận điểm — chọn tệp, xem bản kê, xác nhận — nhưng
 * ở đây bản kê có thêm phần trùng lịch. Đó mới là lý do đáng nạp qua hệ thống
 * thay vì dán ảnh lên bảng tin: tệp nhìn bằng mắt không cho thấy một thầy cô bị
 * xếp hai lớp cùng một tiết.
 */

const COLUMN_LABEL = {
  classTarget: 'Cột lớp',
  dayOfWeek: 'Cột thứ',
  period: 'Cột tiết',
  subject: 'Cột môn',
  teacherName: 'Cột giáo viên',
  room: 'Cột phòng'
};

const CONFLICT_LABEL = {
  class: 'Lớp trùng tiết',
  teacher: 'Giáo viên trùng giờ',
  room: 'Phòng bị đặt đôi'
};

export default function TimetableImport() {
  const { timetableSlots, importTimetableSlots, students } = useContext(AppContext);

  const [fileName, setFileName] = useState('');
  const [fileText, setFileText] = useState('');
  const [plan, setPlan] = useState(null);
  const [mapping, setMapping] = useState(null);
  const [result, setResult] = useState(null);
  const fileInput = useRef(null);

  // Lớp đang có, gộp từ danh sách học sinh và thời khoá biểu hiện hành. Dùng để
  // cảnh báo tên lớp lạ — thường là gõ sai chứ không phải lớp mới.
  const knownClasses = useMemo(() => {
    const fromStudents = (students || []).map((s) => s.class).filter(Boolean);
    const fromSlots = (timetableSlots || []).map((s) => s.classTarget).filter(Boolean);
    return [...new Set([...fromStudents, ...fromSlots])];
  }, [students, timetableSlots]);

  const readFile = (file) => {
    if (!file) return;
    setResult(null);
    setMapping(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setFileText(text);
      setPlan(buildTimetablePlan({ text, knownClasses }));
    };
    reader.onerror = () => {
      setFileText('');
      setPlan({
        header: [], mapping: null, ready: [], failed: [], conflicts: [],
        summary: { total: 0, ready: 0, failed: 0, conflicts: 0 },
        error: 'Không đọc được tệp. Hãy lưu lại dưới dạng CSV rồi thử lại.'
      });
    };
    reader.readAsText(file, 'utf-8');
  };

  const changeColumn = (field, rawValue) => {
    const value = rawValue === '' ? null : Number(rawValue);
    const next = { ...(mapping || plan?.mapping || {}), [field]: value };
    setMapping(next);
    setResult(null);
    if (fileText) setPlan(buildTimetablePlan({ text: fileText, mapping: next, knownClasses }));
  };

  const downloadSample = () => {
    const csv = buildTimetableSampleCsv(knownClasses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau-thoi-khoa-bieu.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const confirmWrite = () => {
    if (!plan?.ready?.length) return;
    const outcome = importTimetableSlots(toTimetableSlots(plan.ready));
    setResult(outcome);
    setPlan(null);
  };

  const reset = () => {
    setPlan(null);
    setResult(null);
    setMapping(null);
    setFileText('');
    setFileName('');
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="animate-fade">
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Nạp thời khoá biểu</h2>
        <p style={{ opacity: 0.85 }}>
          Dùng cho tệp xuất ra từ phần mềm xếp thời khoá biểu. Mỗi dòng là một tiết học, cần có
          lớp, thứ, tiết và môn. Cột giáo viên và phòng không bắt buộc, nhưng có thì hệ thống soát
          được trùng giờ và trùng phòng.
        </p>

        <div className="ds-split" style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ minWidth: 260 }}>
            <label className="form-label" htmlFor="tt-file">Tệp thời khoá biểu</label>
            <input
              id="tt-file"
              ref={fileInput}
              className="form-control"
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              onChange={(e) => readFile(e.target.files?.[0])}
            />
          </div>
          <button type="button" className="btn btn-secondary" onClick={downloadSample}>
            Tải tệp mẫu
          </button>
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
          <p style={{ opacity: 0.8 }}>Hệ thống tự đoán theo tiêu đề. Nếu đoán sai, chọn lại ở đây.</p>
          <div className="ds-split" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(COLUMN_LABEL).map(([field, label]) => (
              <div className="form-group" key={field} style={{ minWidth: 170 }}>
                <label className="form-label" htmlFor={`tt-col-${field}`}>{label}</label>
                <select
                  id={`tt-col-${field}`}
                  className="form-control"
                  value={plan.mapping?.[field] ?? ''}
                  onChange={(e) => changeColumn(field, e.target.value)}
                >
                  <option value="">— không có —</option>
                  {plan.header.map((h, i) => (
                    <option key={`${field}-${i}`} value={i}>{h || `Cột ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan?.error && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <strong>Chưa đọc được thời khoá biểu.</strong>
          <p style={{ marginBottom: 0 }}>{plan.error}</p>
        </div>
      )}

      {plan && !plan.error && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Bản kê trước khi nạp</h3>
          <p>
            Tệp có <strong>{plan.summary.total}</strong> dòng:{' '}
            <span className="badge badge-info">{plan.summary.ready} tiết đọc được</span>{' '}
            {plan.summary.failed > 0 && <span className="badge">{plan.summary.failed} dòng lỗi</span>}{' '}
            {plan.summary.conflicts > 0 && <span className="badge">{plan.summary.conflicts} chỗ trùng lịch</span>}
          </p>

          {plan.conflicts.length > 0 && (
            <div style={{ borderLeft: '4px solid #b00020', paddingLeft: '1rem', margin: '1rem 0' }}>
              <h4 style={{ marginTop: 0, color: '#b00020' }}>Trùng lịch — cần xử lý trước khi nạp</h4>
              <ul>
                {plan.conflicts.map((c, i) => (
                  <li key={`cf-${i}`}>
                    <strong>{CONFLICT_LABEL[c.kind]}:</strong> {c.detail}{' '}
                    <span style={{ opacity: 0.7 }}>(dòng {c.lines.join(' và ')})</span>
                  </li>
                ))}
              </ul>
              <p style={{ marginBottom: 0, opacity: 0.85 }}>
                Vẫn nạp được, nhưng lịch sẽ giữ nguyên chỗ trùng. Nên sửa trong phần mềm xếp lịch rồi
                xuất lại tệp.
              </p>
            </div>
          )}

          {plan.summary.unknownClasses > 0 && (
            <p>
              <strong>{plan.summary.unknownClasses}</strong> tiết thuộc lớp chưa có trong hệ thống —
              kiểm tra lại tên lớp trong tệp có gõ đúng không.
            </p>
          )}

          {plan.failed.length > 0 && (
            <>
              <h4>Dòng bỏ qua</h4>
              <ul>
                {plan.failed.slice(0, 15).map((f) => (
                  <li key={`f-${f.line}`}>Dòng {f.line}{f.classTarget ? ` — ${f.classTarget}` : ''}: {f.problem}</li>
                ))}
                {plan.failed.length > 15 && <li>… và {plan.failed.length - 15} dòng nữa.</li>}
              </ul>
            </>
          )}

          {plan.ready.length > 0 && (
            <p>
              Sẽ nạp <strong>{plan.ready.length}</strong> tiết cho các lớp:{' '}
              <strong>{[...new Set(plan.ready.map((s) => s.classTarget))].join(', ')}</strong>.
              Thời khoá biểu cũ của đúng những lớp này sẽ được thay; lớp khác giữ nguyên.
            </p>
          )}

          <div className="ds-split" style={{ gap: '.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-primary" onClick={confirmWrite} disabled={plan.ready.length === 0}>
              Nạp {plan.ready.length} tiết
            </button>
            <button type="button" className="btn btn-secondary" onClick={reset}>Huỷ</button>
          </div>
        </div>
      )}

      {result && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Kết quả</h3>
          <p>
            Đã nạp <strong>{result.added}</strong> tiết cho lớp{' '}
            <strong>{result.replacedClasses.join(', ')}</strong>.
          </p>
          <button type="button" className="btn btn-secondary" onClick={reset}>Nạp tệp khác</button>
        </div>
      )}
    </div>
  );
}
