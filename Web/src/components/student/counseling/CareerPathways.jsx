import { useMemo } from 'react';
import { Target, ArrowRight, ListChecks, Info } from 'lucide-react';
import {
  subjectStrengths,
  recommendPathways,
  nextSteps,
  rankBlocks,
  MAX_BLOCK_SCORE
} from '../../../lib/counseling/careerPathways';
import { RIASEC_TRAITS } from '../../../lib/counseling/riasecContent';

const REACH_TONE = {
  safe: { bg: 'var(--lime-soft)', fg: '#166534' },
  close: { bg: 'var(--accent-soft)', fg: 'var(--accent-ink, var(--accent-primary))' },
  stretch: { bg: 'var(--amber-soft)', fg: '#92400e' },
  far: { bg: 'var(--coral-soft)', fg: '#991b1b' },
  unknown: { bg: 'var(--surface-soft)', fg: 'var(--text-secondary)' }
};

function ScoreBar({ estimate, cutoff }) {
  if (!estimate) return null;

  const ratio = (value) => `${Math.min(100, (value / MAX_BLOCK_SCORE) * 100)}%`;
  const reached = estimate.score >= cutoff;

  return (
    <div style={{ position: 'relative', height: '8px', background: 'var(--line)', borderRadius: '99px', margin: '8px 0 6px 0' }}>
      <div style={{
        width: ratio(estimate.score), height: '100%', borderRadius: '99px',
        background: reached ? 'var(--accent-success)' : 'var(--accent-warning)'
      }} />
      <div
        title={`Điểm chuẩn ${cutoff}`}
        style={{
          position: 'absolute', top: '-3px', left: ratio(cutoff),
          width: '2px', height: '14px', background: 'var(--text-primary)', borderRadius: '2px'
        }}
      />
    </div>
  );
}

export default function CareerPathways({ profile, student, mockExamHistory, onOpenMatchmaker }) {
  const strengths = useMemo(
    () => subjectStrengths({
      grades: student?.grades,
      mockExamHistory,
      studentId: student?.id
    }),
    [student?.grades, student?.id, mockExamHistory]
  );

  const pathways = useMemo(() => recommendPathways({ profile, strengths }), [profile, strengths]);
  const steps = useMemo(() => nextSteps({ profile, strengths, pathways }), [profile, strengths, pathways]);
  const bestBlock = useMemo(() => rankBlocks(strengths)[0] || null, [strengths]);

  if (!profile || pathways.length === 0) return null;

  const knownSubjects = Object.keys(strengths).length;

  return (
    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={16} color="var(--accent-primary)" />
          Hướng đi phù hợp với em
        </h4>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {knownSubjects > 0
            ? <>Ghép mã <strong>{profile.hollandCode}</strong> với điểm {knownSubjects} môn của em (học bạ &amp; thi thử){bestBlock ? <> — khối mạnh nhất đang là <strong>{bestBlock.blockKey} ({bestBlock.score}/{MAX_BLOCK_SCORE})</strong></> : null}.</>
            : <>Xếp theo mức hợp với mã <strong>{profile.hollandCode}</strong>. Chưa có điểm môn nào nên chưa ước lượng được khả năng trúng tuyển.</>}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pathways.map((item, index) => {
          const tone = REACH_TONE[item.reach.id] || REACH_TONE.unknown;

          return (
            <div
              key={item.id}
              style={{
                padding: '11px 13px', borderRadius: '12px',
                background: index === 0 ? 'var(--accent-soft)' : 'var(--surface-soft)',
                border: `1px solid ${index === 0 ? 'var(--accent-primary)' : 'var(--line)'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.major}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                    {item.school} · {item.city} · khối {item.blockKey}
                  </div>
                  {item.aspirational && (
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '3px' }}>
                      🎯 Mục tiêu vươn tới
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>
                    Hợp {item.fit}%
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700,
                    background: tone.bg, color: tone.fg, whiteSpace: 'nowrap'
                  }}>
                    {item.reach.label}
                  </span>
                </div>
              </div>

              <ScoreBar estimate={item.estimate} cutoff={item.cutoff} />

              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {item.estimate
                  ? <>Điểm dự kiến <strong style={{ color: 'var(--text-primary)' }}>{item.estimate.score}</strong> · chuẩn năm ngoái {item.cutoff}
                    {item.margin >= 0 ? ` (dư ${item.margin})` : ` (thiếu ${Math.abs(item.margin)})`}
                    {item.estimate.knownCount < item.estimate.totalCount
                      ? ` · ước lượng ${item.estimate.totalCount - item.estimate.knownCount}/${item.estimate.totalCount} môn`
                      : ''}
                  </>
                  : <>Chuẩn năm ngoái {item.cutoff} · chưa có điểm khối {item.blockKey} để so sánh</>}
                {' · '}
                {item.traits.map(trait => RIASEC_TRAITS[trait]?.name || trait).join(' + ')}
              </div>
            </div>
          );
        })}
      </div>

      {steps.length > 0 && (
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--surface-soft)', border: '1px solid var(--line)' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ListChecks size={15} color="var(--accent-primary)" />
            Việc nên làm tiếp
          </h5>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {steps.map(step => (
              <li key={step.id} style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {step.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p style={{
        display: 'flex', gap: '8px', margin: 0, padding: '9px 11px', borderRadius: '10px',
        background: 'var(--surface-soft)', border: '1px solid var(--line)',
        fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5
      }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          Điểm dự kiến là ước lượng từ điểm học bạ và bài thi thử gần nhất của em, không phải điểm thi thật.
          Điểm chuẩn là của năm ngoái và có thể đổi.
        </span>
      </p>

      {onOpenMatchmaker && (
        <button
          onClick={onOpenMatchmaker}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          Xem đầy đủ &amp; lọc theo học phí, thành phố <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
