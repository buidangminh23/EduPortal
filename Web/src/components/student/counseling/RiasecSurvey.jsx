import { useMemo, useState } from 'react';
import { Compass, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { RIASEC_QUESTIONS, MAX_ANSWER } from '../../../lib/counseling/riasec';
import { ANSWER_LABELS } from '../../../lib/counseling/riasecContent';

/** Six per page keeps the panel the same height as the chat beside it. */
const PAGE_SIZE = 6;
const TOTAL_PAGES = Math.ceil(RIASEC_QUESTIONS.length / PAGE_SIZE);

const SCALE = Array.from({ length: MAX_ANSWER }, (_, i) => i + 1);

export default function RiasecSurvey({ answers, onAnswer, onSubmit, hasPreviousResult }) {
  const [page, setPage] = useState(0);
  const [showGaps, setShowGaps] = useState(false);

  const answeredCount = useMemo(
    () => RIASEC_QUESTIONS.filter(q => answers[q.id]).length,
    [answers]
  );

  const progress = Math.round((answeredCount / RIASEC_QUESTIONS.length) * 100);
  const remaining = RIASEC_QUESTIONS.length - answeredCount;
  const pageQuestions = RIASEC_QUESTIONS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const isLastPage = page === TOTAL_PAGES - 1;

  const handleAnswer = (questionId, value) => {
    onAnswer(questionId, value);

    // Auto-advance once the page is complete: the student should not have to
    // hunt for the "next" button when the only thing left to do is move on.
    const nextAnswers = { ...answers, [questionId]: value };
    const pageDone = pageQuestions.every(q => nextAnswers[q.id]);
    if (pageDone && !isLastPage) {
      setTimeout(() => setPage(p => Math.min(p + 1, TOTAL_PAGES - 1)), 260);
    }
  };

  const handleSubmit = () => {
    if (remaining > 0) {
      setShowGaps(true);
      const firstGap = RIASEC_QUESTIONS.findIndex(q => !answers[q.id]);
      if (firstGap >= 0) setPage(Math.floor(firstGap / PAGE_SIZE));
      return;
    }

    setShowGaps(false);
    onSubmit();
  };

  return (
    <div>
      <h2 style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
        <Compass size={18} color="var(--accent-primary)" />
        <span>Khảo sát Hướng nghiệp RIASEC</span>
      </h2>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
        {RIASEC_QUESTIONS.length} câu, khoảng 3 phút. Chấm từ <strong>1 (không thích)</strong> đến <strong>5 (rất thích)</strong> —
        chọn theo cảm giác thật của em, không có đáp án đúng sai.
      </p>

      {/* Progress */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          <span>Phần {page + 1}/{TOTAL_PAGES}</span>
          <span style={{ fontWeight: 700, color: progress === 100 ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
            {answeredCount}/{RIASEC_QUESTIONS.length} câu
          </span>
        </div>
        <div style={{ height: '6px', background: 'var(--line)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: progress === 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
            borderRadius: '99px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {showGaps && remaining > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', marginBottom: '12px',
          background: 'var(--amber-soft)', border: '1px solid var(--amber)', borderRadius: '10px',
          fontSize: '0.8rem', color: '#92400e'
        }}>
          <AlertCircle size={16} />
          <span>Còn <strong>{remaining} câu</strong> chưa trả lời. Thầy đã đưa em tới câu đầu tiên còn trống.</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {pageQuestions.map((q, idx) => {
          const value = answers[q.id];
          const isMissing = showGaps && !value;

          return (
            <div
              key={q.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                padding: '11px 12px',
                background: value ? 'var(--accent-soft)' : 'var(--surface-soft)',
                border: `1px solid ${isMissing ? 'var(--accent-warning)' : value ? 'transparent' : 'var(--line)'}`,
                borderRadius: '12px',
                transition: 'background 0.2s ease'
              }}
            >
              <span style={{ fontSize: '0.84rem', fontWeight: 500, flex: 1, lineHeight: 1.45 }}>
                <span style={{ color: 'var(--text-muted)', marginRight: '6px', fontVariantNumeric: 'tabular-nums' }}>
                  {page * PAGE_SIZE + idx + 1}.
                </span>
                {q.text}
              </span>

              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }} role="group" aria-label={q.text}>
                {SCALE.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleAnswer(q.id, v)}
                    title={ANSWER_LABELS[v]}
                    aria-label={`${ANSWER_LABELS[v]} (${v})`}
                    aria-pressed={value === v}
                    style={{
                      width: '30px', height: '30px', padding: 0,
                      fontSize: '0.8rem', fontWeight: value === v ? 700 : 500,
                      borderRadius: '50%', cursor: 'pointer',
                      border: value === v ? '2px solid var(--accent-primary)' : '1px solid var(--line-strong)',
                      background: value === v ? 'var(--accent-primary)' : 'var(--surface)',
                      color: value === v ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button
          type="button"
          className="btn"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          style={{ opacity: page === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ChevronLeft size={15} /> Trước
        </button>

        <div style={{ display: 'flex', gap: '5px', flex: 1, justifyContent: 'center' }}>
          {Array.from({ length: TOTAL_PAGES }, (_, i) => {
            const pageDone = RIASEC_QUESTIONS.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE).every(q => answers[q.id]);
            return (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-label={`Phần ${i + 1}`}
                style={{
                  width: '22px', height: '8px', padding: 0, borderRadius: '99px', cursor: 'pointer',
                  border: 'none',
                  background: i === page ? 'var(--accent-primary)' : pageDone ? 'var(--accent-success)' : 'var(--line-strong)',
                  transition: 'background 0.2s ease'
                }}
              />
            );
          })}
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => setPage(p => Math.min(TOTAL_PAGES - 1, p + 1))}
          disabled={isLastPage}
          style={{ opacity: isLastPage ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          Sau <ChevronRight size={15} />
        </button>
      </div>

      <button
        onClick={handleSubmit}
        className="btn btn-primary"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <Check size={16} />
        {remaining > 0 ? `Lưu kết quả (còn ${remaining} câu)` : hasPreviousResult ? 'Cập nhật kết quả RIASEC' : 'Xem kết quả hướng nghiệp'}
      </button>
    </div>
  );
}
